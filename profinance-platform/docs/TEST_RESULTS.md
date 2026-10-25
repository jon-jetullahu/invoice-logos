# Test results

Run on 2026-10-25T17:09Z (Node v22.22.0, Python 3.13.17).

## Engine and i18n tests (`npm test`)

```
 ✓ tests/engine.test.ts > Seed data (acceptance 1–5) > 1. portfolio, deposits and accounts are the management figures
 ✓ tests/engine.test.ts > Seed data (acceptance 1–5) > 2. leasing and goods-finance balances
 ✓ tests/engine.test.ts > Seed data (acceptance 1–5) > 3. deposit/portfolio ratios
 ✓ tests/engine.test.ts > Seed data (acceptance 1–5) > 4. portfolio minus deposits is €12m and NOT labelled a cash shortfall
 ✓ tests/engine.test.ts > Seed data (acceptance 1–5) > 5. CBS seats 30/40/50; payroll headcount unknown (not derived from seats)
 ✓ tests/engine.test.ts > Core banking offer (acceptance 6–9) > 6. implementation and subscription ranges; 5-year total never added
 ✓ tests/engine.test.ts > Core banking offer (acceptance 6–9) > 7. flags the rounded-range discrepancies without altering the quote
 ✓ tests/engine.test.ts > Core banking offer (acceptance 6–9) > 8. subscription starts only at the selected billing trigger
 ✓ tests/engine.test.ts > Core banking offer (acceptance 6–9) > 9. moving the billing start shifts expense and cash
 ✓ tests/engine.test.ts > Visa (acceptance 10–16) > 10. 12-month project = USD 47,500
 ✓ tests/engine.test.ts > Visa (acceptance 10–16) > 11. first-year fixed fee = USD 20,000
 ✓ tests/engine.test.ts > Visa (acceptance 10–16) > 12. Issuing Affiliate 234k–575.5k; Principal 264k–605.5k
 ✓ tests/engine.test.ts > Visa (acceptance 10–16) > 13. Issuing+Acquiring Principal low = 409k; package high (829.5k) is flagged as an arithmetic discrepancy
 ✓ tests/engine.test.ts > Visa (acceptance 10–16) > 14. switching acquiring off removes acquiring licence and gateway, keeps issuing
 ✓ tests/engine.test.ts > Visa (acceptance 10–16) > 15. principal/affiliate switch never double-counts the issuing licence
 ✓ tests/engine.test.ts > Visa (acceptance 10–16) > 16. no EUR conversion without an explicit FX rate
 ✓ tests/engine.test.ts > Accounting / regulatory (acceptance 17–23) > 17. €11.4m nominal capital does not populate opening cash
 ✓ tests/engine.test.ts > Accounting / regulatory (acceptance 17–23) > 18. missing opening balance sheet is an explicit blocker
 ✓ tests/engine.test.ts > Accounting / regulatory (acceptance 17–23) > 19. no PASS while rules or capital inputs are unverified
 ✓ tests/engine.test.ts > Accounting / regulatory (acceptance 17–23) > 20. originations differ from year-end stock changes because of repayments
 ✓ tests/engine.test.ts > Accounting / regulatory (acceptance 17–23) > 21. leasing and goods assumptions propagate separately
 ✓ tests/engine.test.ts > Accounting / regulatory (acceptance 17–23) > 22. positive net income with negative cash yields separate statuses
 ✓ tests/engine.test.ts > Accounting / regulatory (acceptance 17–23) > 23. every month balances; cash flows reconcile; outputs finite
 ✓ tests/engine.test.ts > Engine behaviour > is deterministic
 ✓ tests/engine.test.ts > Engine behaviour > balances under every stress test and with all options switched on
 ✓ tests/engine.test.ts > Engine behaviour > wholesale funding removes negative cash and is reported as such
 ✓ tests/engine.test.ts > Engine behaviour > capital injection from a new investor dilutes existing shareholders
 ✓ tests/engine.test.ts > Engine behaviour > a stress makes results worse than base
 ✓ tests/engine.test.ts > Engine behaviour > tax is only charged after carried-forward losses are used
 ✓ tests/engine.test.ts > Engine behaviour > IRR helper
 ✓ tests/engine.test.ts > Engine behaviour > Kosovo payroll: net pay from gross using 0/8/10% brackets and 5% pension
 ✓ tests/i18n.test.ts > Albanian translation coverage > every UI string, engine label and status code has an Albanian translation
 ✓ tests/i18n.test.ts > Albanian translation coverage > translations keep the same {placeholders} and **bold** / `code` markup
 ✓ tests/i18n.test.ts > Albanian translation coverage > covers a substantial vocabulary
 ✓ tests/i18n.test.ts > i18n behaviour > interpolates parameters and falls back to English
 ✓ tests/i18n.test.ts > i18n behaviour > translates codes and year labels
 ✓ tests/i18n.test.ts > i18n behaviour > uses Albanian research columns when available
 ✓ tests/i18n.test.ts > i18n behaviour > formats numbers per locale
 Test Files  2 passed (2)
      Tests  38 passed (38)
```

## Collection pipeline and research data (`npm run test:py`)

```
tests/test_collection.py::test_year_guess_is_last_year_and_flags_unknown PASSED [ 10%]
tests/test_collection.py::test_proxy_refusal_classified_as_environment_block PASSED [ 20%]
tests/test_collection.py::test_number_parsing_handles_thousands_and_negatives PASSED [ 30%]
tests/test_collection.py::test_candidate_facts_carry_page_and_unit_and_need_review PASSED [ 40%]
tests/test_collection.py::test_pribank_reports_not_marked_downloaded PASSED [ 50%]
tests/test_collection.py::test_coverage_matrix_keeps_missing_years PASSED [ 60%]
tests/test_collection.py::test_validation_never_fills_and_checks_identity_and_restatements PASSED [ 70%]
tests/test_collection.py::test_research_observations_have_provenance PASSED [ 80%]
tests/test_collection.py::test_every_research_csv_is_well_formed PASSED  [ 90%]
tests/test_collection.py::test_albanian_columns_complete PASSED          [100%]
============================== 10 passed in 0.04s ==============================
```

## Model integrity (`npm run report`)

```
=== Management base (illustrative) – Low case ===
Statuses: profitability=LOSS_MAKING | funding=UNFUNDED | liquidity=FAIL | regulatory=FAIL
Checks: balance_sheet_identity:ok all_values_finite:ok cash_flow_reconciles:ok year_end_targets_met:ok originations_exceed_stock_change:ok
=== Management base (illustrative) – Base case ===
Statuses: profitability=PROFITABLE | funding=UNFUNDED | liquidity=FAIL | regulatory=UNDETERMINED
Checks: balance_sheet_identity:ok all_values_finite:ok cash_flow_reconciles:ok year_end_targets_met:ok originations_exceed_stock_change:ok
=== Management base (illustrative) – High case ===
Statuses: profitability=PROFITABLE | funding=UNFUNDED | liquidity=FAIL | regulatory=UNDETERMINED
Checks: balance_sheet_identity:ok all_values_finite:ok cash_flow_reconciles:ok year_end_targets_met:ok originations_exceed_stock_change:ok
=== Stress tests on base ===
```

## UI end-to-end (Playwright, Chromium)

### English

* All 17 views rendered with no page or console errors.
* Wholesale toggle changes the funding status.
* Saving creates a server version and an audit row.
* The Excel export works.
* Dark mode renders correctly.
* At 390 px width there is no horizontal scroll.

### Albanian (`?lang=sq`)

* All 17 views rendered with no errors, and `<html lang="sq">` is set.
* The automated scan for leftover English UI strings found only source-language content: legal document titles and research notes in columns labelled as such.
* Albanian number format is verified.
* The Excel export is in Albanian (sheets LEXOMË, Supozimet, Vjetore, Mujore, Rregullative, Burimet).
* Switching the language back and forth works.

## API

* Write as `Management Viewer` returns 403.
* An invalid deposit mix returns 422.
* Health check returns 200.
