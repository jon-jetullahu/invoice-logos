# CLAUDE CODE MASTER INSTRUCTION — COMPLETE PUBLIC KOSOVO BANKING DATA FIRST

You are acting as an institutional banking data research team, data engineer, IFRS financial analyst, Kosovo regulatory specialist, QA reviewer and senior SaaS developer.

## Mandatory priority order
**Do not start building the Pro Finance SaaS UI yet.** Your first deliverable is a defensible and maximally complete **public historical Kosovo banking dataset** with the underlying source files. Only after the collection and verification gate should you implement the calculation engine using `06_Claude_Prompts/CLAUDE_MASTER_PROMPT.md`.

### Inputs
Inspect the entire package, especially `00_START_HERE/README.md`, `02_Management_Data`, `03_Vendor_Costs`, `04_Public_Research`, `05_Model_Specification`, `08_Automated_Collection` and this file. Original Facilization offer PDF is attached. User says NO further internal Pro Finance data can be obtained. Do not ask for internal financials as a blocker.

### Stage A — Exhaustive institutional roster
Find CBK's official licensed-banks lists across years. Include all current and historical banks, foreign-bank branches, institutions that closed, merged, rebranded or surrendered licences. Specifically investigate **PriBank, Türkiye İş Bankası Kosovo and Komercijalna Banka** in addition to the original ten-bank list. Record legal entity, names/aliases, branch vs subsidiary, licensing/closure dates, official websites, source URL and evidence. Never equate 'bank brand' with distinct reporting entity without verification.

### Stage B — Exhaustive report discovery and acquisition
For every institution and every year it was operating, find audited annual financial statements and annual reports from the earliest publicly accessible year to the latest completed financial year (2025 as of Oct 2026). Also collect 2026 quarterly/half-year reports, prior-year comparative statements and standalone auditor opinions. Search in Albanian, English, Serbian and where appropriate Turkish. Use original bank sites, CBK archives, parent-group reports, Kosovo Banking Association, university archives and legally accessible web archives. Use site-specific collectors and a real browser where necessary. The included Python collector is **a starter implementation, not an exhaustive solution**; fix it and expand it. Download original PDF/XLS/XLSX files and hash them. Respect site terms, robots and rate limits; never bypass access controls. Maintain every URL, date, checksum, filename, HTTP status and retrieval method. Detect duplicate reports, amended versions and overlapping comparative years. Do not claim unavailable reports were retrieved.

### Stage C — Regulatory and CBK data
Download all relevant CBK legal instruments and amendments effective for the planned bank transition: bank licensing, minimum capital, own funds, capital adequacy, credit risk/RWA, liquidity, reserve requirements, concentration, governance, operational risk, AML, consumer protection, reporting, deposit insurance, payment services and relevant Islamic finance rules. Verify effective dates and the new banking law's transitional provisions. Download CBK monthly statistical bulletins, financial stability reports, annual reports and available historical time-series data. Include exact document title, effective date, repeal/amendment relationship, source and page/section. Never invent a compliance threshold.

### Stage D — Data extraction
Extract each annual report's full statement of financial position, profit or loss, comprehensive income, changes in equity, cash flow and every note that informs banking operations. Target, when disclosed: loan book gross/net, deposits by type, cash, securities, RWA, capital, CET1/total capital ratios, NPL, ECL stages, interest/financing yields, funding costs, fees, headcount, personnel expenses, administrative costs, software/licences, IT spend, depreciation/amortization, branches, ATM/POS/cards, capital investments and audit opinion. Store every numeric fact with institution ID, year, reporting date, original label, normalized metric, value, currency, units (EUR/€000/€m), source PDF, page, audit status, comparative year, restatement version and extraction confidence. Extract page-level text and tables first; apply OCR only to pages where necessary. Distinguish consolidated vs standalone and branch vs subsidiary.

### Stage E — Validation
Cross-foot financial statements, verify assets = liabilities + equity, reconcile beginning/ending equity and cash, inspect unit conversions and signs, avoid double counting and comparative-year duplicates. Produce `coverage_matrix.csv` with EVERY institution-year and status: VERIFIED_EXTRACTED, DOWNLOADED_UNVERIFIED, FOUND_LINK_ONLY, BLOCKED, NOT_PUBLIC, NOT_APPLICABLE, NEEDS_MANUAL_REVIEW. No false 100% claim. Create a coverage report by bank, year, source type and verified numeric fields. Keep missing years in the matrix. Independently review PriBank 2022–2025 first.

### Stage F — Delivery package
Create `ProFinance_Complete_Public_Banking_Data.zip` containing `original_documents/`, `raw_extracted/`, `normalized_financials.csv` and parquet if available, `regulatory_rules.csv`, `sources.csv`, `document_manifest.csv`, `coverage_matrix.csv`, `data_dictionary.md`, `quality_checks.csv`, `unresolved_gaps.md`, Pro Finance management data, CBS and Visa costs and SaaS implementation prompt. If archive exceeds practical upload limits, create deterministic multipart archives plus a master index and SHA-256 hashes.

### Stage G — SaaS implementation
Only after Stage F's data gate, follow `06_Claude_Prompts/CLAUDE_MASTER_PROMPT.md`. Build monthly 10-year three-statement simulator, separate capital/liquidity tests, scenarios, funding, lending, deposits, staffing, CAPEX/OPEX and investor dilution. Unknown opening balance sheet means regulatory status UNDETERMINED. Do not substitute bank peers' numbers as Pro Finance facts. All assumptions editable and traceable.

## Working style
Work autonomously using internet access and your local terminal. Do not stop after collecting ten URLs or writing a crawler. Run the collector, inspect failures, expand discovery, rerun and deliver actual PDFs plus validated data. Report progress quantitatively (institutions found, institution-years expected, reports downloaded, reports audited, reports extracted, coverage %) and explicitly label remaining gaps. Never claim exhaustive public coverage unless all discovered public files have been acquired and verified and outstanding years are accounted for. Do not ask me for Pro Finance's unavailable internal financials. Begin NOW with Stage A and PriBank's 2022–2025 original reports.


# MANDATORY EXTENSION — CBK LICENSING & BANK STAFFING
Before bank simulator development, execute **all** instructions in `10_CBK_Licensing_and_HR/CLAUDE_CBK_LICENSING_DEEP_RESEARCH_PROMPT.md` alongside historical bank research. This includes all current CBK licensing law and regulations, HR requirements, sourced Kosovo salary research, full transformation costs and licensing readiness evidence. Do not substitute outdated capital thresholds for current requirements.
