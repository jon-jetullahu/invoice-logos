#!/usr/bin/env python3
"""Page-level text/table extraction and financial-statement candidate facts with page citations.

Outputs per PDF: <out>/<relative>.json (pages, text, tables) and appends candidate facts to
<out>/candidate_facts.csv. Candidate facts are NEVER promoted to historical_financials.csv automatically:
they carry review_status=NEEDS_MANUAL_REVIEW until an analyst confirms label, unit, period and sign.
"""
from __future__ import annotations

import argparse
import csv
import json
import re
from pathlib import Path

STATEMENT_PATTERNS = {
    "balance_sheet": re.compile(r"statement of financial position|balance sheet|pasqyra e pozicionit financiar|bilanci i gjendjes|bilans stanja", re.I),
    "income_statement": re.compile(r"statement of (profit or loss|comprehensive income)|income statement|pasqyra e fitimit|pasqyra e të ardhurave|bilans uspeha", re.I),
    "cash_flow": re.compile(r"statement of cash flows|pasqyra e rrjedhës së parasë|pasqyra e flukseve", re.I),
}
UNIT_PATTERNS = [
    (re.compile(r"in thousands of (eur|euro)|eur ?'?000|€ ?'?000|në mijë euro|(000 eur)", re.I), "EUR_thousand"),
    (re.compile(r"in millions of (eur|euro)|eur ?m(illion)?\b|në milionë euro", re.I), "EUR_million"),
    (re.compile(r"\bin (eur|euro)\b|expressed in euro|në euro\b", re.I), "EUR"),
]
LINE_ITEMS = {
    "total_assets": re.compile(r"^total assets|^totali i aseteve|^gjithsej asetet", re.I),
    "total_liabilities": re.compile(r"^total liabilities$|^totali i detyrimeve|^gjithsej detyrimet", re.I),
    "total_equity": re.compile(r"^total (shareholders'? )?equity|^totali i ekuitetit|^gjithsej ekuiteti", re.I),
    "customer_deposits": re.compile(r"^(due to|deposits from) customers|^depozitat e klientëve|^depozitat nga klientët", re.I),
    "loans_net": re.compile(r"^loans and advances to customers|^kreditë dhe paradhëniet për klientët", re.I),
    "net_interest_income": re.compile(r"^net interest income|^të hyrat neto nga interesi", re.I),
    "personnel_expenses": re.compile(r"^personnel expenses|^staff costs|^shpenzimet e personelit", re.I),
    "net_profit": re.compile(r"^(net )?profit for the (year|period)|^fitimi (neto )?i vitit|^(loss|profit)/\(loss\) for the year", re.I),
}
NUM_RE = re.compile(r"\(?-?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?\)?")  # space is a column separator, not a thousands separator


def parse_number(tok: str) -> float | None:
    neg = tok.startswith("(") and tok.endswith(")") or tok.startswith("-")
    digits = tok.strip("()-").replace(" ", "")
    if re.fullmatch(r"\d{1,3}([.,]\d{3})+", digits):  # thousands separators only
        digits = re.sub(r"[.,]", "", digits)
    else:
        digits = digits.replace(",", "")
    try:
        v = float(digits)
    except ValueError:
        return None
    return -v if neg else v


def detect_unit(text: str) -> str:
    for rx, unit in UNIT_PATTERNS:
        if rx.search(text):
            return unit
    return "UNIT_UNDETERMINED"


def candidate_facts(page_text: str, page_no: int, source: str) -> list[dict]:
    kinds = [k for k, rx in STATEMENT_PATTERNS.items() if rx.search(page_text)]
    if not kinds:
        return []
    unit = detect_unit(page_text)
    out = []
    for line in page_text.splitlines():
        label = re.sub(r"\s+", " ", line).strip()
        for metric, rx in LINE_ITEMS.items():
            m = rx.search(label)
            if not m:
                continue
            nums = [parse_number(t) for t in NUM_RE.findall(label[m.end():])]
            nums = [n for n in nums if n is not None and abs(n) >= 10]  # drop note references
            if nums:
                out.append({"source_file": source, "page": page_no, "statement": "|".join(kinds), "metric_id": metric,
                            "original_label": label[:160], "value_current": nums[0], "value_comparative": nums[1] if len(nums) > 1 else "",
                            "unit": unit, "review_status": "NEEDS_MANUAL_REVIEW"})
    return out


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--input", default="../data/original_documents")
    p.add_argument("--out", default="../data/raw_extracted")
    a = p.parse_args()
    import pymupdf

    root, out = Path(a.input), Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    manifest, facts = [], []
    for pdf in sorted(root.rglob("*.pdf")):
        rel = pdf.relative_to(root)
        try:
            doc = pymupdf.open(pdf)
            pages = []
            for i, page in enumerate(doc):
                text = page.get_text("text")
                try:
                    tables = [[list(map(str, r)) for r in t.extract()] for t in page.find_tables()]
                except Exception:
                    tables = []
                pages.append({"page": i + 1, "text_chars": len(text), "text": text, "tables": tables,
                              "needs_ocr": len(text.strip()) < 30})
                facts.extend(candidate_facts(text, i + 1, str(rel)))
            dest = out / rel.with_suffix(".json")
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(json.dumps({"source_file": str(rel), "page_count": len(pages), "pages": pages}, ensure_ascii=False), encoding="utf-8")
            manifest.append({"file": str(rel), "pages": len(pages), "ocr_pages": sum(p["needs_ocr"] for p in pages), "status": "EXTRACTED_TEXT"})
        except Exception as exc:
            manifest.append({"file": str(rel), "pages": "", "ocr_pages": "", "status": f"ERROR: {str(exc)[:160]}"})
    with (out / "extraction_manifest.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["file", "pages", "ocr_pages", "status"])
        w.writeheader()
        w.writerows(manifest)
    with (out / "candidate_facts.csv").open("w", newline="", encoding="utf-8") as f:
        fields = ["source_file", "page", "statement", "metric_id", "original_label", "value_current", "value_comparative", "unit", "review_status"]
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(facts)
    print(f"Processed {len(manifest)} PDFs; {len(facts)} candidate facts (all NEEDS_MANUAL_REVIEW).")


if __name__ == "__main__":
    main()
