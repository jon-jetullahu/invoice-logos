# Proposed organisation: Pro Finance Bank, years 1 to 3

The structure follows reported Kosovo requirements: a board with audit and risk committees, independent control functions, fit-and-proper approval of senior management, and an AML officer. Where a rule could not be verified, ordinary good practice for a de-novo bank fills the gap. Role-level detail, FTE counts by scenario and salary bands are in `hr_roles.csv`, and the platform's Staffing module computes headcount and cost live.

```
                         General Meeting of Shareholders
                                      │
                    Board of Directors (Chair + INEDs + shareholder NED)
          ┌───────────────┬───────────┴───────────┬────────────────────┐
   Audit Committee   Risk Committee   (Remuneration/Nomination – recommended)   (Sharia Supervisory Board – if Islamic window)
          │               │
   Head of Internal   Chief Risk Officer ──── Risk analysts · Fraud · CISO (dotted line) ─ Security analyst
   Audit ─ auditors       │
                          │                 Chief Compliance Officer ─ Compliance officers · DPO
                          │                 MLRO / AML Officer ─ AML analysts
                                      │
                           Chief Executive Officer
     ┌───────────┬──────────────┬─────┴───────┬──────────────┬───────────────┐
  Deputy CEO/COO   CFO           CIO/CTO      Head of Credit   Head of Treasury   Business (Retail, Leasing, Goods financing, Cards & Digital, Product, Marketing)
     │            │               │             │                 │
 Operations     Financial ctrl  IT support    Underwriters      ALM analyst
 (back office,  Accounting      Integration   Credit admin
 payments,      Reg. reporting  developers    Collections
 KYC, contact   Legal · HR ·
 centre,        Procurement
 branches)
```

## Independence and segregation of duties

* **Internal Audit** reports functionally to the Audit Committee and administratively to the CEO.
* **The CRO, CCO and MLRO** have direct access to the Risk Committee and the Board. Their remuneration is not tied to business targets; the model gives control roles a lower bonus percentage.
* **Credit underwriting** (Head of Credit) is separate from **sales** (relationship officers and dealer channel). Credit administration and disbursement are separate from approval.
* **Treasury front office** is separate from **back-office settlement** (Operations) and from **risk measurement** (CRO).
* **The CISO** is independent of the CIO; this is recommended, and a dotted reporting line to the CRO is shown.
* **Tellers:** at least two per branch, for dual control of cash and the vault.

## Scenario summary (FTE at year end, using the default branch counts)

| Scenario | Y1 | Y2 | Y3 | Comment |
|---|---|---|---|---|
| Lean | see app | | | Several roles combined (DPO in Compliance, Treasury analyst covered by its head). Its **compliance with CBK rules is not confirmed.** |
| Base | see app | | | Recommended planning case. |
| Expanded | see app | | | Higher service levels; in-house security operations; more branches. |

*(The app computes exact counts, because branch-driven roles depend on the branch count chosen in each scenario.)*

**Benchmark:** a secondary source reports PriBank with **176 employees** in 2025, its fourth year, at about EUR 156m of total assets. This is not verified. The base-case headcount should be reconciled against PriBank's audited headcount once its reports are downloaded.

**The 30, 40 and 50 internal CBS user seats are licence seats, not employees.** The model keeps them as a separate metric and compares them with FTE as a check.
