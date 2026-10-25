# Implementation guide

## Architecture

```
research/*.csv ──(scripts/build-data.mjs)──► src/data/generated/*.json ──► engine + UI
                                                    │
src/engine (pure TS) ── runModel(inputs) ──► ModelResult (months, years, tests, statuses, traces)
                                                    │
src/app (React + Recharts) ◄── REST ──► server/index.mjs (node:sqlite: scenario, scenario_version, audit, checklist)
collection/*.py ── collector → data/original_documents → extract_pdf → data/raw_extracted → build_coverage → research/coverage_matrix.csv
```

* **The engine is independent of the UI.** `runModel` is a pure function of `ModelInputs` and the research tables, which can be injected through `ModelData` for tests. It uses monthly steps over a configurable pre-operating period plus a 120-month horizon.
* **Monthly sequence:** capital injections → product cohorts (annuity amortisation, IFRS 9-style staged ECL, write-offs, deferred origination fees) → deposits and cost of funds (conventional rates, or Islamic profit-sharing) → staffing (role catalogue × scenario × branches, with pension, bonus and recruitment) → cost database events (per site, branch, FTE, ATM or insured-deposit base, with inflation and irrecoverable VAT) → CBS schedule (milestones; subscription expense straight-line, cash by billing frequency, prepaid or accrued) → Visa (USD, converted only with an explicit FX rate) → depreciation → CIT (annual, loss carry-forward FIFO, payment lag) → cash (optional wholesale line) → balance sheet → CET1/T2, credit and operational RWA, liquidity.
* **Controls run on every model run:** the balance-sheet identity holds every month to within €0.01; cash flows reconcile to closing cash; all values are finite; year-end stock targets are met; originations are at least the change in stock.
* **Number handling:** IEEE-754 doubles, with reporting rounded at display time. The identity tolerance is €0.01. A decimal library was not used, to keep the 135-month cohort simulation fast. This is documented as a deliberate deviation from the package's data contract.
* **Verdict policy:** a regulatory test can be PASS or FAIL only when (a) its rule is marked VERIFIED, and (b) for capital tests, `capitalInputsVerified` is true. Otherwise it is UNDETERMINED with an indicative direction. Negative equity or cash is always a FAIL.

## Persistence and roles

* Scenarios are versioned (`scenario_version`). Delete is soft. Every write creates an `audit` row.
* Licensing checklist status and owner are persisted per requirement.
* Roles: Admin, Finance and Risk/Compliance can write; Management Viewer is read-only. **This is demo RBAC** based on an `x-role` header. For production:
  * put the server behind SSO (OIDC) with MFA;
  * derive the role from token claims;
  * enable TLS;
  * isolate tenants (one database per tenant, or a tenant_id column with row-level security);
  * encrypt backups;
  * add rate limiting.
* Offline: when the API is unreachable the UI falls back to browser storage. The top bar shows "local" in that case.

## Exports

* Excel: README (status, blockers, checks), assumptions with source types, full input JSON, annual and monthly ledgers, regulatory tests, sources.
* CSV: monthly ledger.
* JSON: scenario import and export.
* Print-ready board report: save it as PDF from the browser.
* Every export is labelled ILLUSTRATIVE.

## Extending the research data

1. Run the collector on a machine with internet access (see the README). Downloaded files are recorded in `research/document_registry.csv` with SHA-256 checksums. Every attempt is recorded in `research/retrieval_log.csv`.
2. Run `extract_pdf.py`. Review `data/raw_extracted/candidate_facts.csv` page by page. Promote confirmed figures to `research/historical_financials.csv` with `source_page`, `unit`, `audit_status` and `restatement_version`.
3. Run `build_coverage.py`, then `npm run data`. The UI and engine pick up the changes.
4. When a CBK rule is verified, update `research/cbk_requirements.csv` and set the rule's status to VERIFIED in the Capital module. You can also change `DEFAULT_RULES` in `src/engine/defaults.ts` and record the citation.

## Known limitations

* Stage-3 loans still amortise on schedule; delinquency is captured through provisions and write-offs, not through payment holidays.
* IFRS 16 leases are modelled as straight-line opex rather than right-of-use assets.
* Deferred tax assets are not recognised, which is conservative.
* Operational RWA uses the basic-indicator approach on annualised gross income. CBK's method is unverified.
* Calendar dates are relative (Pre-op, Y1…Y10) until a go-live date is set.
* The bundle is about 0.9 MB, and ExcelJS loads lazily on export.
