import csv
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
RESEARCH = HERE.parent.parent / "research"

import build_coverage as bc  # noqa: E402
import collector as col  # noqa: E402
import extract_pdf as ex  # noqa: E402


def read(name):
    with (RESEARCH / name).open(encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def test_year_guess_is_last_year_and_flags_unknown():
    assert col.guess_year("https://x/2025/05/Annual-Report-2024.pdf") == "2024"
    assert col.guess_year("no-year-here.pdf") == "YEAR_UNDETERMINED"


def test_proxy_refusal_classified_as_environment_block():
    assert col.classify_error(Exception("ProxyError('Tunnel connection failed: 403 Forbidden')")) == "BLOCKED_BY_ENVIRONMENT"
    assert col.classify_error(Exception("getaddrinfo ENOTFOUND bqk-kos.org")) == "DNS_FAILURE"


def test_number_parsing_handles_thousands_and_negatives():
    assert ex.parse_number("1,234,567") == 1234567
    assert ex.parse_number("(12.345)") == -12345
    assert ex.parse_number("-3.5") == -3.5


def test_candidate_facts_carry_page_and_unit_and_need_review():
    text = "Statement of financial position\nIn thousands of EUR\nTotal assets 155,605 120,100\nTotal equity 20,000 19,000"
    facts = ex.candidate_facts(text, 7, "pribank/2024/x.pdf")
    assets = [f for f in facts if f["metric_id"] == "total_assets"][0]
    assert assets["page"] == 7 and assets["unit"] == "EUR_thousand"
    assert assets["value_current"] == 155605 and assets["value_comparative"] == 120100
    assert all(f["review_status"] == "NEEDS_MANUAL_REVIEW" for f in facts)


def test_pribank_reports_not_marked_downloaded():  # acceptance test 24
    docs = [d for d in read("document_registry.csv") if d["institution_id"] == "pribank"]
    assert docs, "PriBank sources must be registered"
    assert all(not d["retrieval_status"].startswith("DOWNLOADED") for d in docs if not d["local_path"])


def test_coverage_matrix_keeps_missing_years():
    matrix = bc.build_matrix(read("institutions.csv"), read("document_registry.csv"))
    pri = [r for r in matrix if r["institution_id"] == "pribank"]
    assert [r["fiscal_year"] for r in pri] == [2022, 2023, 2024, 2025]
    assert {r["status"] for r in pri} <= {"BLOCKED", "NOT_YET_LOCATED", "FOUND_LINK_ONLY"}
    assert bc.summarize(matrix)["verified_pct"] == 0.0  # honest: nothing verified yet


def test_validation_never_fills_and_checks_identity_and_restatements():  # acceptance tests 25-26
    obs = [
        {"observation_id": "a", "institution_id": "x", "metric_id": "total_assets", "period_end": "2024-12-31", "stock_or_flow": "STOCK_END_OF_PERIOD", "value": "100", "unit": "EUR_thousand", "source_type": "AUDITED", "confidence": "HIGH", "restatement_version": "1"},
        {"observation_id": "b", "institution_id": "x", "metric_id": "total_liabilities", "period_end": "2024-12-31", "stock_or_flow": "STOCK_END_OF_PERIOD", "value": "80", "unit": "EUR_thousand", "source_type": "AUDITED", "confidence": "HIGH", "restatement_version": "1"},
        {"observation_id": "c", "institution_id": "x", "metric_id": "total_equity", "period_end": "2024-12-31", "stock_or_flow": "STOCK_END_OF_PERIOD", "value": "20", "unit": "EUR_thousand", "source_type": "AUDITED", "confidence": "HIGH", "restatement_version": "1"},
        {"observation_id": "d", "institution_id": "x", "metric_id": "total_assets", "period_end": "2024-12-31", "stock_or_flow": "STOCK_END_OF_PERIOD", "value": "101", "unit": "EUR_thousand", "source_type": "AUDITED", "confidence": "HIGH", "restatement_version": "2"},
    ]
    checks = bc.validate_financials(obs)
    ident = [c for c in checks if c["check"] == "assets_eq_liabilities_plus_equity"]
    assert any(c["result"] == "PASS" for c in ident)
    assert any(c["result"] == "NOT_TESTABLE" for c in ident)  # version 2 incomplete -> not filled
    assert any(c["check"] == "restatement_lineage_preserved" for c in checks)


def test_research_observations_have_provenance():
    checks = bc.validate_financials(read("historical_financials.csv"))
    assert not [c for c in checks if c["result"] == "FAIL"]
