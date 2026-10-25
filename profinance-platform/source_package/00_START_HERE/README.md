# Pro Finance — Bank Transformation Simulator | Claude Development Starter

**Prepared:** 2026-10-25  
**Classification:** Confidential — internal planning; not a bank regulatory filing  
**Objective:** Build an advanced, auditable, monthly bank-transformation financial planning SaaS with Claude.

## Start here
1. Open `06_Claude_Prompts/CLAUDE_MASTER_PROMPT.md` in Claude, and upload this ZIP (or its extracted files).
2. Ask Claude to inspect every file and begin with the schema, calculation engine and test suite.
3. Treat `02_Management_Data/` as **management-provided forecasts**, not audited facts.
4. Treat `03_Vendor_Costs/` as **budgetary, nonbinding quotations**, with original currencies intact.
5. Treat `04_Public_Research/` as **a research source registry**, not a downloaded, validated historical bank dataset.
6. Do not infer Pro Finance's cash, eligible regulatory capital, profitability, risk weights or bank-licence eligibility from nominal share capital.
7. Missing assumptions should be explicitly labelled `UNSOURCED_ASSUMPTION`, remain editable and never be silently defaulted into a 'compliant' verdict.

## Included
- Original Facilization one-page CBS offer (PDF)
- Pro Finance 3-year management projections and capital baseline
- Visa fee and card technology estimates, with scope and uncertainties
- Financial benchmark source registry, including PriBank and CBK
- Bank data collection manifest, missing data tracker and schema specification
- Calculation, regulatory and scenario modelling requirements
- Claude build prompt, phased development plan and acceptance tests

## Not included / not claimed
- Complete audited financial reports of all Kosovo banks
- Downloaded PriBank annual reports or machine-validated bank financial series
- Pro Finance audited financials, payroll, loan tape or management accounts
- Signed Visa or CBS contracts, confirmed regulatory eligibility or official fee schedules
- Real bank-level cost figures beyond the source offer and management messages

## Source hierarchy
1. Attached original signed/dated source document
2. Pro Finance management-provided figures in this conversation
3. Official CBK regulations/statistical publications (must verify effective dates)
4. Official bank audited statements
5. Vendor budgetary estimates and private correspondence
6. Transparent scenario assumptions

## Currencies and time
- Pro Finance forecast and Facilization costs: EUR.
- Visa and card estimates: USD.
- Model exchange rate must be explicit and user-editable; never sum USD with EUR without conversion.
- Year 1, 2, 3 are assumed to be the first three operating years after bank go-live. Dates are NOT yet specified.
- Projections are assumed **year-end stock values** for loans, deposits, active accounts and users. This assumption must be visible and editable.

## Important accounting caution
The €11.4m input is stated ordinary nominal share capital, not verified cash available, net equity or eligible regulatory capital.
