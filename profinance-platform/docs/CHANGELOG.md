# Changelog

## 0.3.0 (2026-10-26)

Follow-up research and corrections:

* **Board composition** follows the CBK Corporate Governance Regulation as reported: an odd number of at least 5, independent majority, at least one Kosovo resident. The earlier 4-member boards were non-compliant.
* **Tax-loss carry-forward** corrected to 4 tax periods (Law 06/L-105).
* New requirements:
  * REQ-LIC-006: preliminary approval is revoked after 1 year if conditions are not met.
  * REQ-ACT-001: non-financial income is capped at 10% of net interest income (Law 08/L-304).
* Deposit-insurance premium band 0.3%–1.5% added (Law 03/L-216).
* New legal sources: the Albanian Gazette text of 08/L-304, the regulation on directors and senior managers, and Law 03/L-216.
* 2023 sector benchmarks added (FSR 20 and press reports of CBK data).
* Findings, readiness reports (EN/SQ), the unresolved-issues register and the CBK questions (new D18) updated.
* GitHub Actions CI runs typecheck, engine/i18n tests, Python tests and the production build.

## 0.2.0 (2026-10-25)

Bilingual platform (English / Shqip):

* i18n layer with a persisted language switcher and `?lang=` URL parameter.
* 988-entry Albanian dictionary, plus Albanian number and period formatting.
* The engine now emits message codes and parameters for statuses, blockers, verdict reasons and integrity checks, so they render in either language.
* Albanian columns in the role, cost, requirement, sector-indicator and salary-evidence tables.
* Albanian memos: CBK questions, readiness report, org chart.
* Excel, CSV and board report exports follow the selected language.
* Tests now fail on any untranslated string or on broken placeholders or markup. A CSV well-formedness test was also added.
* Fixed a malformed `sector_indicators.csv` row: an unquoted comma in its notes had dropped part of the row.

## 0.1.0 (2026-10-25)
* Preserved the original source package. The Facilization PDF SHA-256 matches the manifest.
* Research database: 18 institutions, 290 institution-years in the coverage matrix, 29 registered documents, 26 legal sources, 31 CBK requirements, 48 HR roles, 9 salary-evidence rows, 46 cost lines, sector indicators, memos (licensing, Islamic banking, org chart, CBK questions, readiness, unresolved issues, coverage report, data dictionary).
* Collector v2: robots.txt, retrieval log, Wayback fallback, SHA-256 checksums, environment-block classification. Extractor: page-cited candidate facts. Coverage and validation builder.
* Engine: monthly 10-year integrated model (cohorts, staged ECL, deposits and Islamic profit-sharing, liquidity, three statements, CIT with losses, CET1/T2/RWA, CBS and Visa schedules, staffing, cost database, scenarios, stress tests, dilution, IRR, traceability).
* UI: 16 modules plus an assumptions register; scenario versioning and audit; checklist persistence; Excel/CSV/JSON/print exports; light and dark themes.
* Flagged vendor arithmetic discrepancies: Facilization 5-year totals, and the Visa Issuing + Acquiring Principal high case (829.5k stated vs 830.5k computed).
