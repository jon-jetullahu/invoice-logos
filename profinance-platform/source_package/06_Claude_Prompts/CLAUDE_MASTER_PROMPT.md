# MASTER PROMPT FOR CLAUDE — Pro Finance Banking Transformation Simulator

You are my principal banking quantitative modeller, regulatory research lead, full-stack SaaS architect, data engineer and QA lead.

## Mission
Build a production-quality, auditable, scenario-driven SaaS to simulate Pro Finance Home's transition from an existing Kosovo financial institution to a bank. The system must determine **economic feasibility, funding sufficiency, regulatory-data completeness and scenario sensitivities**, with a month-by-month ten-year planning horizon. It is not merely a spreadsheet UI: it must have a deterministic calculation engine, transparent assumptions, provenance, accounting controls and repeatable tests.

## Files and source priority
Inspect ALL supplied files first. Read `00_START_HERE/README.md`, management CSV, Facilization original PDF and cost CSV, Visa CSV, source registry, model specification and QA. Produce a short file inventory before coding.

**Non-negotiable source distinctions:**
- Management data is forward-looking, not audited.
- CBS offer is a nonbinding budgetary quotation dated 23 Oct 2026, EUR 450–520k implementation + EUR 1.0–1.1m annual, quoted five-year EUR 5.4–6.1m; do not add vendor five-year total to annual components. The offer has a minor rounded-range arithmetic discrepancy; flag it, don't silently 'fix' vendor wording.
- Visa fee estimates are from an informal private message, in USD, not a formal Visa quote.
- Public source registry lists URLs only; it does NOT contain extracted audited reports. Do not pretend otherwise.
- Starting EUR 11.4m is nominal ordinary capital, not verified available cash, total equity or regulatory eligible capital.
- No current balance sheet, salary file, loan tape or regulatory eligibility calculation has been supplied. The user explicitly said no more internal Pro Finance data is available now. **Do not block the entire project asking for it**: make missing assumptions explicit and let the user simulate. However, never mark regulatory compliance as passed when essential inputs are missing.

## Seed data
Year 1/2/3 (assumed successive post-go-live years, year-end):
- Active accounts: 5,000 / 10,000 / 15,000
- CBS internal user seats: 30 / 40 / 50; these are not automatically employee headcount.
- Gross financing portfolio: EUR 20m / 40m / 60m
- Mix: 20% leasing / 80% goods financing
- Deposits: EUR 8m / 28m / 48m
- Nominal ordinary capital: EUR 11.4m, as-of now.
- Proposed future equity investment of EUR 10m should be a DISABLED optional scenario, not part of base case; terms/eligibility are unconfirmed.
- Do not invent calendar go-live date.

## First delivery
1. Inventory the data and identify verified facts vs assumptions.
2. Propose the domain model and PostgreSQL schema with source provenance.
3. Build a deterministic, pure-function monthly financial engine and tests BEFORE dashboards.
4. Import all management/vendor CSVs and build versioned, editable scenario inputs.
5. Implement three sample scenarios:
   - Issuing Affiliate, no acquiring.
   - Issuing Principal, no acquiring.
   - Issuing + Acquiring Principal, with missing acquiring costs clearly flagged.
6. Support CBS vendor offer as a scenario, with editable subscription, implementation and billing dates.
7. Render a board-grade UI: assumptions spreadsheet, ten-year monthly/annual statements, capital & liquidity warnings, cost waterfall, scenario compare, stress tests and source traceability.
8. Add an integrated historical bank research workspace, prioritizing PriBank 2022–2025, followed by all Kosovo licensed banks and CBK time series.
9. Provide CSV imports and PDF/Excel exports; Excel export must have source metadata and be clearly labelled illustrative if assumptions remain.
10. Keep detailed implementation notes and a changelog.

## Mandatory financial logic
- Treat year-end portfolio/deposit targets as STOCKS. Derive flows only through documented growth and amortization/runoff assumptions.
- Produce a balanced ledger; do not use arbitrary plugs to conceal missing funding.
- Keep cash, earnings, loan balances, deposits, equity, debt, taxes, fixed assets and liabilities coherent.
- Separate income statement profit from cash flow and liquidity.
- Model products separately: leasing and goods financing may have distinct contractual and IFRS recognition.
- Maintain implementation CAPEX and accounting treatment separately from cash payments; do not automatically capitalize all CBS costs.
- Fees: distinguish one-off, monthly, quarterly, annual, per-card and per-transaction; model overlapping vendor offerings and exclude duplicated charges.
- Preserve original EUR and USD, convert only using explicit user-supplied/scenario FX rates.
- Use decimal-safe monetary arithmetic and document rounding.
- Model headcount separately from software user seats.
- Regulatory rules must be effective-dated and sourced from official CBK law/regulation. If the necessary rule or bank inputs are missing, show 'UNDETERMINED', not 'PASS'.
- Always show the exact assumptions behind 'profitable', 'funded' and 'regulatorily feasible' separately.
- Never claim that PriBank/other bank historical audited data has been downloaded or extracted unless it is actually present and validated.

## Research agent requirements
- The attached `04_Public_Research/source_registry.csv` is a discovery list. Where web access exists, fetch reports from original bank/CBK sites, respecting permissions and rate limits. Build checksum manifest.
- Prioritize PriBank: first licence years, 2022–2025 audited annual reports and 2026 quarterly indicators.
- Verify the CBK official roster and legal status of every institution; resolve whether Türkiye İş Bankası is a separate licensed bank, branch or other entity.
- For each bank/year: extract audit opinion, assets, deposits, loans, equity, NII, fees, impairments, personnel, IT/software, capex, depreciation, branches, employees and regulatory ratios, with page references and units.
- Add report coverage dashboard and extraction confidence. Do not fill missing figures by guessing.

## Product requirements
- Secure multi-user app with roles: Admin, Finance, Risk/Compliance, Management Viewer.
- Immutable source facts; versioned scenario assumptions; audit trail of edits.
- Scenario cloning and side-by-side comparisons.
- User-friendly input cells, sliders, date selectors and monthly/annual charts.
- Explainable financial line items with 'show formula and source'.
- Validation errors on impossible assumptions; optional warnings on aggressive growth.
- Regulatory readiness checklist independent of financial ratio model.
- Automated tests and CI.

## Delivery process
Start immediately. Don't wait for unavailable internal company data. If a real number is unknown, leave it NULL and present an editable placeholder with an explicit missing-data badge. You may add a clearly separate **demonstration-only** assumptions preset, never as a default asserted fact.

For each milestone, show: files created, commands to run, passing tests, remaining blockers and what can be used now.

**Begin with milestone 1:** audit the attached package, propose the normalized schema, and implement the first validated monthly model plus tests. Then proceed iteratively to the UI.
