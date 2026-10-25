#!/usr/bin/env python3
"""Build research/coverage_matrix.csv (every institution-year) and validate historical_financials.csv.

Statuses (research protocol, Stage E): VERIFIED_EXTRACTED, DOWNLOADED_UNVERIFIED, FOUND_LINK_ONLY, BLOCKED,
NOT_PUBLIC, NOT_APPLICABLE, NEEDS_MANUAL_REVIEW, plus NOT_YET_LOCATED for years with no discovered source.
Missing years stay in the matrix – no false 100% claim.
"""
from __future__ import annotations

import argparse
import csv
from collections import defaultdict
from pathlib import Path

LAST_COMPLETED_FY = 2025
STATUS_RANK = ["VERIFIED_EXTRACTED", "DOWNLOADED_UNVERIFIED", "NEEDS_MANUAL_REVIEW", "FOUND_LINK_ONLY", "BLOCKED", "NOT_PUBLIC", "NOT_YET_LOCATED"]
UNIT_SCALE = {"EUR": 1, "units_as_published": 1, "EUR_thousand": 1e3, "EUR_million": 1e6, "EUR_billion": 1e9}
REQUIRED_PROVENANCE = ["institution_id", "metric_id", "period_end", "stock_or_flow", "unit", "source_type", "confidence"]


def read(path: Path) -> list[dict]:
    with path.open(encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def doc_status(doc: dict) -> str:
    rs, es = doc.get("retrieval_status", ""), doc.get("extraction_status", "")
    if rs.startswith("DOWNLOADED"):
        return "VERIFIED_EXTRACTED" if es == "VERIFIED" else ("NEEDS_MANUAL_REVIEW" if es == "EXTRACTED" else "DOWNLOADED_UNVERIFIED")
    if rs in ("BLOCKED_BY_ENVIRONMENT", "ROBOTS_DISALLOWED", "SKIPPED_ROBOTS") or rs.startswith("HTTP_4"):
        return "BLOCKED"
    if rs in ("FOUND_LINK_ONLY",):
        return "FOUND_LINK_ONLY"
    return "NOT_YET_LOCATED"


def build_matrix(institutions: list[dict], documents: list[dict]) -> list[dict]:
    by_inst_year: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for d in documents:
        if d.get("document_type") in ("annual_report", "audited_financial_statements", "candidate_report"):
            by_inst_year[(d["institution_id"], d.get("fiscal_year", ""))].append(d)
    rows = []
    for inst in institutions:
        first = inst.get("first_operating_year") or ""
        if not first.isdigit():
            rows.append({"institution_id": inst["institution_id"], "institution": inst["legal_name_current_or_last"], "fiscal_year": "UNKNOWN",
                         "status": "NEEDS_MANUAL_REVIEW", "documents": "", "source_urls": "", "gap_note": "Operating period not established"})
            continue
        last = int(inst["last_operating_year"]) if (inst.get("last_operating_year") or "").isdigit() else LAST_COMPLETED_FY
        for year in range(int(first), last + 1):
            docs = by_inst_year.get((inst["institution_id"], str(year)), [])
            statuses = [doc_status(d) for d in docs] or ["NOT_YET_LOCATED"]
            best = min(statuses, key=STATUS_RANK.index)
            note = ""
            if inst.get("entity_type") == "branch_of_foreign_bank":
                note = "Branch: separate public FS may not exist (consider parent report)."
            if best == "NOT_YET_LOCATED":
                note = (note + " No source discovered yet.").strip()
            rows.append({"institution_id": inst["institution_id"], "institution": inst["legal_name_current_or_last"], "fiscal_year": year,
                         "status": best, "documents": ";".join(d["document_id"] for d in docs),
                         "source_urls": ";".join(d["url"] for d in docs), "gap_note": note})
    return rows


def validate_financials(obs: list[dict]) -> list[dict]:
    """Return quality-check rows. Never fills gaps; only reports."""
    checks = []
    for o in obs:
        missing = [f for f in REQUIRED_PROVENANCE if not o.get(f)]
        if missing:
            checks.append({"check": "provenance_complete", "subject": o.get("observation_id"), "result": "FAIL", "detail": f"missing {missing}"})
        if o.get("unit") not in UNIT_SCALE and o.get("unit") not in ("count", "fraction", "annual_rate"):
            checks.append({"check": "unit_known", "subject": o.get("observation_id"), "result": "FAIL", "detail": o.get("unit")})
        if o.get("stock_or_flow") not in ("STOCK_END_OF_PERIOD", "FLOW_DURING_PERIOD", "AVERAGE_PERIOD", "RATIO"):
            checks.append({"check": "stock_flow_declared", "subject": o.get("observation_id"), "result": "FAIL", "detail": o.get("stock_or_flow")})
    # accounting identity per institution-period-version (in EUR after scaling)
    grouped: dict[tuple, dict] = defaultdict(dict)
    for o in obs:
        if o.get("unit") in UNIT_SCALE and o.get("value"):
            grouped[(o["institution_id"], o["period_end"], o.get("restatement_version", "1"))][o["metric_id"]] = float(o["value"]) * UNIT_SCALE[o["unit"]]
    for key, m in grouped.items():
        if {"total_assets", "total_liabilities", "total_equity"} <= m.keys():
            diff = m["total_assets"] - m["total_liabilities"] - m["total_equity"]
            tol = max(1.0, abs(m["total_assets"]) * 1e-6)
            checks.append({"check": "assets_eq_liabilities_plus_equity", "subject": "|".join(map(str, key)),
                           "result": "PASS" if abs(diff) <= tol else "FAIL", "detail": f"diff={diff:.2f}"})
        else:
            checks.append({"check": "assets_eq_liabilities_plus_equity", "subject": "|".join(map(str, key)),
                           "result": "NOT_TESTABLE", "detail": "A/L/E not all extracted"})
    # restatements: same institution/metric/period with >1 version must all be preserved
    versions = defaultdict(set)
    for o in obs:
        versions[(o["institution_id"], o["metric_id"], o["period_end"])].add(o.get("restatement_version", "1"))
    for key, v in versions.items():
        if len(v) > 1:
            checks.append({"check": "restatement_lineage_preserved", "subject": "|".join(key), "result": "PASS", "detail": f"versions={sorted(v)}"})
    return checks


def summarize(matrix: list[dict]) -> dict:
    total = len(matrix)
    by = defaultdict(int)
    for r in matrix:
        by[r["status"]] += 1
    return {"institution_years": total, **dict(by),
            "verified_pct": round(100 * by.get("VERIFIED_EXTRACTED", 0) / total, 1) if total else 0.0}


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--research", default="../research")
    a = p.parse_args()
    r = Path(a.research)
    matrix = build_matrix(read(r / "institutions.csv"), read(r / "document_registry.csv"))
    with (r / "coverage_matrix.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["institution_id", "institution", "fiscal_year", "status", "documents", "source_urls", "gap_note"])
        w.writeheader()
        w.writerows(matrix)
    checks = validate_financials(read(r / "historical_financials.csv"))
    with (r / "quality_checks.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["check", "subject", "result", "detail"])
        w.writeheader()
        w.writerows(checks)
    print(summarize(matrix))


if __name__ == "__main__":
    main()
