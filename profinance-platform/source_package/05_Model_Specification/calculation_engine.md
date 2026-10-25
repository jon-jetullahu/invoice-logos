# Required calculation engine

## Core
- Monthly time steps, configurable 120-month horizon; year-end management target reconciliation.
- Balance sheet, income statement, cash flow and regulatory capital/liquidity ledgers, with integrity checks.
- Separate projected **portfolio stock** from new disbursements and principal repayments.
- Loan cohorts/vintages, amortization, delinquency, ECL stages and provisions.
- Leasing and goods financing product-specific schedules; no blanket assumption that they use identical revenue recognition.
- Deposit cohorts: current/savings/term, rates, growth, maturity, runoff and concentration.
- Interest / financing revenue, funding cost, fees, expected losses, taxation and accruals.
- Capital injections, preferred vs ordinary instruments, ownership dilution, eligibility haircuts and timing.
- Staff seats vs actual employee headcount separate; departments, salary, payroll burden, hiring dates.
- Technology implementation payment milestones, capitalization assessment, depreciation/amortization, subscriptions and annual escalators.
- Visa issuer vs acquirer switches; Principal vs Affiliate; one-time, quarterly, monthly, per-card, per-transaction costs.
- USD->EUR explicit FX assumption; all monetary ledgers in EUR while preserving source currency.
- Multi-scenario base/upside/downside, shock stress tests, sensitivity grids, breakeven and runway.
- Explainability: every KPI drilldown shows source values, transformations and equations.

## Accounting
- Starting nominal capital EUR 11.4m is **not** a complete opening balance sheet.
- Model MUST expose `OPENING_BALANCE_SHEET_UNAVAILABLE` and refuse to present a reconciled balance sheet as verified.
- Build a **synthetic illustrative opening balance sheet** only if explicitly selected, labelled clearly and balanced.
- Capex is not always immediately expensed; determine treatment per IFRS and contract characteristics, not keyword.
- No double counting: CBS five-year vendor total is a reference, not an extra expense; prevent overlap with card platform bundles.
- Year-end target stocks do not determine monthly origination rates without repayment/maturity assumptions.
- Profitability does not imply liquidity or regulatory feasibility.

## Regulatory
- Use source-linked effective-dated rules from Kosovo law and CBK regulations.
- New 2026 banking law may supersede older legal texts; verify commencement and transitional periods.
- Regulatory minimums, risk weights, buffers, LCR/NSFR, concentration and reserve rules must NOT be invented.
- If requirements or opening RWA are missing, output `INSUFFICIENT_DATA_FOR_REGULATORY_DETERMINATION`.
- No automatic claims that Pro Finance is eligible or licence-ready.
- Show risk of shortfall, missing input blockers and remediation sensitivity.

## KPIs
- Capital needs, eligible capital/RWA (if supported), cash, liquidity ratios (if supported), loans/deposits, net interest margin, cost-to-income, cost per active account, technology spend/customer, branch economics, ROA/ROE (if denominator reliable), P&L, runway, break-even, IRR and valuation under explicit assumptions.

## Architecture suggestion
Next.js + TypeScript + PostgreSQL + Drizzle/Prisma, validated API schemas, separate deterministic calculation engine with unit tests, provenance graph, RBAC, CSV import/export and report generator. Do not hardcode stack if project environment requires otherwise.
