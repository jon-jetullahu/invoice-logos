#!/usr/bin/env python3
"""Public-source Kosovo bank report collector (v2).

Improvements over the package's phase-one scaffold (08_Automated_Collection/collector.py):
  * seeds from research/document_registry.csv (direct documents + archive pages), not only the old registry
  * robots.txt is honoured; polite rate limiting; bounded retries with exponential backoff
  * every attempt is appended to research/retrieval_log.csv (timestamp, method, HTTP status, error class)
  * egress/proxy refusals are classified separately (BLOCKED_BY_ENVIRONMENT) from site errors (HTTP_4xx/5xx)
  * Internet Archive (Wayback CDX) fallback for dead or blocked originals, recorded as retrieval_method=wayback
  * PDF magic check, SHA-256, size cap, de-duplication by hash; year is only a *guess* until verified
  * updates document_registry.csv in place (retrieval_status, local_path, sha256) – nothing is marked verified

It never bypasses authentication, CAPTCHAs or access controls.
Usage:
  python collector.py --research ../research --out ../data/original_documents [--institution pribank] [--discover] [--wayback]
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import hashlib
import re
import time
import urllib.robotparser
from pathlib import Path
from urllib.parse import urldefrag, urljoin, urlparse

UA = "ProFinance-PublicBankReportsResearch/2.0 (non-commercial research; polite crawler)"
PDF_RE = re.compile(r"\.pdf(?:$|[?#])", re.I)
REPORT_RE = re.compile(
    r"annual|audited|audit|raport|financial|financiar|bilanc|pasqyr|statement|vjetor|godišnji|izveštaj|faaliyet|finansal",
    re.I,
)
YEAR_RE = re.compile(r"(?<!\d)(199\d|20[0-3]\d)(?!\d)")
MAX_BYTES = 120_000_000
PROXY_REFUSAL_HINTS = ("ProxyError", "Tunnel connection failed", "403 Forbidden", "connect_rejected", "Cannot connect to proxy")

LOG_FIELDS = ["timestamp_utc", "document_id", "institution_id", "url", "method", "http_status", "outcome", "error_class", "detail"]


def now() -> str:
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def safe_name(s: str) -> str:
    return re.sub(r"[^a-zA-Z0-9._-]+", "_", s).strip("_")[:120]


def guess_year(*texts: str) -> str:
    """Return the last 4-digit year found. A GUESS: a URL containing 2025 may publish FY2024."""
    years = YEAR_RE.findall(" ".join(t or "" for t in texts))
    return years[-1] if years else "YEAR_UNDETERMINED"


def classify_error(exc: Exception) -> str:
    text = f"{type(exc).__name__}: {exc}"
    if any(h in text for h in PROXY_REFUSAL_HINTS):
        return "BLOCKED_BY_ENVIRONMENT"
    if "NameResolution" in text or "getaddrinfo" in text:
        return "DNS_FAILURE"
    if "Timeout" in text:
        return "TIMEOUT"
    if "SSL" in text:
        return "TLS_ERROR"
    return "NETWORK_ERROR"


def read_csv(path: Path) -> list[dict]:
    with path.open(encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def write_csv(path: Path, rows: list[dict], fields: list[str]) -> None:
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)


class Logger:
    def __init__(self, path: Path):
        self.path = path
        new = not path.exists()
        self.f = path.open("a", encoding="utf-8", newline="")
        self.w = csv.DictWriter(self.f, fieldnames=LOG_FIELDS)
        if new:
            self.w.writeheader()

    def log(self, **kw) -> None:
        self.w.writerow({"timestamp_utc": now(), **{k: kw.get(k, "") for k in LOG_FIELDS if k != "timestamp_utc"}})
        self.f.flush()


class Fetcher:
    def __init__(self, delay: float, retries: int, logger: Logger):
        import requests  # imported lazily so pure helpers stay testable without network deps

        self.requests = requests
        self.s = requests.Session()
        self.s.headers.update({"User-Agent": UA, "Accept": "text/html,application/pdf,*/*"})
        self.delay, self.retries, self.logger = delay, retries, logger
        self.robots: dict[str, urllib.robotparser.RobotFileParser | None] = {}

    def allowed(self, url: str) -> bool:
        host = urlparse(url).scheme + "://" + urlparse(url).netloc
        if host not in self.robots:
            rp = urllib.robotparser.RobotFileParser()
            try:
                r = self.s.get(host + "/robots.txt", timeout=20)
                rp.parse(r.text.splitlines() if r.status_code < 400 else [])
                self.robots[host] = rp
            except Exception:
                self.robots[host] = None  # unreachable robots → decide at fetch time
        rp = self.robots[host]
        return True if rp is None else rp.can_fetch(UA, url)

    def get(self, url: str, ctx: dict, method: str = "direct", stream: bool = False):
        if method == "direct" and not self.allowed(url):
            self.logger.log(url=url, method=method, outcome="SKIPPED", error_class="ROBOTS_DISALLOWED", **ctx)
            return None
        last = None
        for attempt in range(self.retries + 1):
            try:
                r = self.s.get(url, timeout=60, stream=stream, allow_redirects=True)
                self.logger.log(url=url, method=method, http_status=r.status_code,
                                outcome="OK" if r.status_code < 400 else "HTTP_ERROR", **ctx)
                time.sleep(self.delay)
                if r.status_code in (429, 500, 502, 503, 504) and attempt < self.retries:
                    time.sleep(2 ** (attempt + 1))
                    continue
                return r
            except Exception as exc:  # network layer
                last = exc
                cls = classify_error(exc)
                self.logger.log(url=url, method=method, outcome="FAILED", error_class=cls, detail=str(exc)[:240], **ctx)
                if cls in ("BLOCKED_BY_ENVIRONMENT", "DNS_FAILURE"):
                    break  # policy/DNS failures are not transient: do not hammer
                time.sleep(2 ** (attempt + 1))
        return last

    def wayback_candidates(self, url: str, ctx: dict) -> list[str]:
        cdx = "https://web.archive.org/cdx/search/cdx?output=json&filter=statuscode:200&fl=timestamp,original&limit=-5&url=" + url
        r = self.get(cdx, ctx, method="wayback_cdx")
        if r is None or isinstance(r, Exception) or r.status_code >= 400:
            return []
        try:
            rows = r.json()[1:]
        except ValueError:
            return []
        return [f"https://web.archive.org/web/{ts}id_/{orig}" for ts, orig in reversed(rows)]


def discover(fetcher: Fetcher, seed: str, ctx: dict, depth: int, limit: int) -> list[dict]:
    from bs4 import BeautifulSoup

    host = urlparse(seed).netloc.lower()
    queue, seen, found = [(seed, 0)], set(), []
    while queue and len(seen) < limit:
        url, d = queue.pop(0)
        url = urldefrag(url)[0]
        if url in seen or urlparse(url).netloc.lower() != host:
            continue
        seen.add(url)
        r = fetcher.get(url, ctx)
        if r is None or isinstance(r, Exception) or r.status_code >= 400:
            continue
        if "pdf" in r.headers.get("Content-Type", "").lower():
            found.append({"url": r.url, "anchor": "direct", "source_page": url})
            continue
        soup = BeautifulSoup(r.text, "html.parser")
        for a in soup.select("a[href]"):
            target = urljoin(r.url, a.get("href", "").strip())
            label = " ".join(a.stripped_strings)[:200]
            if not target.startswith(("http://", "https://")):
                continue
            if PDF_RE.search(target) or ("download" in target.lower() and REPORT_RE.search(label + " " + target)):
                found.append({"url": target, "anchor": label, "source_page": url})
            elif d < depth and urlparse(target).netloc.lower() == host and REPORT_RE.search(label + " " + target):
                queue.append((target, d + 1))
    return found


def download(fetcher: Fetcher, url: str, dest_dir: Path, ctx: dict, method: str) -> dict:
    r = fetcher.get(url, ctx, method=method, stream=True)
    if r is None:
        return {"status": "SKIPPED_ROBOTS"}
    if isinstance(r, Exception):
        return {"status": classify_error(r)}
    if r.status_code >= 400:
        return {"status": f"HTTP_{r.status_code}"}
    dest_dir.mkdir(parents=True, exist_ok=True)
    name = safe_name(Path(urlparse(url).path).name or "document.pdf")
    if not name.lower().endswith(".pdf"):
        name += ".pdf"
    tmp = dest_dir / (".part_" + name)
    h, size = hashlib.sha256(), 0
    with tmp.open("wb") as f:
        for chunk in r.iter_content(65536):
            size += len(chunk)
            if size > MAX_BYTES:
                tmp.unlink(missing_ok=True)
                return {"status": "TOO_LARGE"}
            h.update(chunk)
            f.write(chunk)
    with tmp.open("rb") as f:
        if f.read(5) != b"%PDF-":
            tmp.unlink(missing_ok=True)
            return {"status": "NOT_A_PDF"}
    digest = h.hexdigest()
    final = dest_dir / f"{digest[:10]}_{name}"
    tmp.replace(final)
    return {"status": "DOWNLOADED_UNVERIFIED", "path": str(final), "sha256": digest, "bytes": size, "method": method}


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--research", default="../research")
    p.add_argument("--out", default="../data/original_documents")
    p.add_argument("--institution", default="", help="institution_id filter, e.g. pribank")
    p.add_argument("--discover", action="store_true", help="crawl archive_index pages for further PDFs")
    p.add_argument("--wayback", action="store_true", help="try Internet Archive when the original fails")
    p.add_argument("--delay", type=float, default=1.5)
    p.add_argument("--retries", type=int, default=2)
    p.add_argument("--depth", type=int, default=2)
    p.add_argument("--max-pages", type=int, default=40)
    a = p.parse_args()

    research, out = Path(a.research), Path(a.out)
    registry_path = research / "document_registry.csv"
    registry = read_csv(registry_path)
    fields = list(registry[0].keys())
    logger = Logger(research / "retrieval_log.csv")
    fetcher = Fetcher(a.delay, a.retries, logger)
    known_hashes = {r["sha256"] for r in registry if r.get("sha256")}

    targets = [r for r in registry if not a.institution or r["institution_id"] == a.institution]
    if a.discover:
        for row in [r for r in targets if r["document_type"] == "archive_index"]:
            ctx = {"document_id": row["document_id"], "institution_id": row["institution_id"]}
            for item in discover(fetcher, row["url"], ctx, a.depth, a.max_pages):
                if any(x["url"] == item["url"] for x in registry):
                    continue
                year = guess_year(item["url"], item["anchor"])
                new = {k: "" for k in fields}
                new.update(document_id=f"DOC-{row['institution_id'].upper()}-{year}-{hashlib.sha1(item['url'].encode()).hexdigest()[:6]}",
                           institution_id=row["institution_id"], publisher=row["publisher"], title=item["anchor"] or "discovered PDF",
                           fiscal_year=year, document_type="candidate_report", url=item["url"], discovered_via=f"crawl:{item['source_page']}",
                           discovered_on=now()[:10], retrieval_status="FOUND_LINK_ONLY", audit_status="UNKNOWN", extraction_status="NOT_EXTRACTED",
                           notes="Year is a guess from URL/anchor text – verify on title page.")
                registry.append(new)
                targets.append(new)

    for row in targets:
        if row["document_type"] == "archive_index" or row["retrieval_status"].startswith("DOWNLOADED") or row["retrieval_status"] == "SEARCH_SNIPPET_ONLY":
            continue
        ctx = {"document_id": row["document_id"], "institution_id": row["institution_id"]}
        dest = out / (row["institution_id"] or "cbk") / (row["fiscal_year"] or "YEAR_UNDETERMINED")
        result = download(fetcher, row["url"], dest, ctx, "direct")
        if not result["status"].startswith("DOWNLOADED") and a.wayback:
            for snap in fetcher.wayback_candidates(row["url"], ctx):
                result = download(fetcher, snap, dest, ctx, "wayback")
                if result["status"].startswith("DOWNLOADED"):
                    break
        if result["status"].startswith("DOWNLOADED"):
            if result["sha256"] in known_hashes:
                Path(result["path"]).unlink(missing_ok=True)
                row["retrieval_status"] = "DUPLICATE_OF_EXISTING"
            else:
                known_hashes.add(result["sha256"])
                row.update(retrieval_status=result["status"], local_path=result["path"], sha256=result["sha256"])
                if result.get("method") == "wayback":
                    row["notes"] = (row.get("notes", "") + " Retrieved via Internet Archive snapshot.").strip()
        else:
            row["retrieval_status"] = result["status"]
        print(f"{row['document_id']}: {row['retrieval_status']}", flush=True)

    write_csv(registry_path, registry, fields)
    print("Done. Coverage is NOT exhaustive until each institution-year is reconciled in coverage_matrix.csv.")


if __name__ == "__main__":
    main()
