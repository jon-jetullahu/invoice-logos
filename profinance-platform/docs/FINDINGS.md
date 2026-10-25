# Findings to date (illustrative)

All numbers come from `npm run report` and the scenario runs in this document. The inputs are the **Management base (illustrative)** preset:

* Management Y1–Y3 stocks are used as given.
* The full €11.4m is *assumed* to be paid into the bank as cash at the start of a 15-month pre-operating period.
* The FX rate is set at 0.86 EUR/USD.
* Every other input is an editable default.

None of these is a verified figure.

## 1. The management plan is profitable in the long run but not funded by €11.4m

| Metric (base case) | Value |
|---|---|
| Pre-operating cost (15 months, before revenue) | ≈ €3.1m |
| Net income Y1 / Y2 / Y3 | −€3.7m / −€2.5m / −€1.2m |
| First profitable year; monthly break-even | Y4; month 38 after go-live |
| Cumulative break-even (including pre-op losses) | ≈ month 100 |
| Net income Y5 / Y10 | €1.3m / €3.5m |
| **Lowest cash** | **−€9.9m in month 24** (plan UNFUNDED) |
| Lowest CAR | 1.8%, against a reported 12% minimum (indicative shortfall) |
| Additional equity indicated | ≈ €9.9m |

**Why the plan is short of cash:** financing exceeds deposits by €12m in every year (management data). On top of that, there are start-up losses of about €7m before break-even, fixed assets, and the 10% reserve requirement. The €11.4m cannot cover all of these. The model shows the gap as negative cash and **does not hide it with a funding plug**.

## 2. What closes the gap

| Variant | Lowest cash | Lowest CAR | Funding status | 10-year equity IRR at 1.2× book |
|---|---|---|---|---|
| Base (€11.4m) | −€9.9m | 1.8% | UNFUNDED | 5.5% (with negative cash, not meaningful) |
| + €10m strategic raise at month 6 | −€0.8m (month 5) | 16.3% | UNFUNDED, briefly | 4.3% |
| €21.4m paid in before go-live | +€0.3m | 16.5% | FUNDED | 4.0% |
| Base + 6.5% wholesale line | ≥ 0 | n/a | FUNDED_WITH_WHOLESALE, **but equity turns negative in Y3–Y8** | n/a |

**Conclusion:** the business plan needs roughly **€21m of cash equity**, about €10m more than the nominal capital, under the base assumptions. Debt funding of the structural gap destroys equity, because the liquidity buffer earns less than the cost of the debt. The resulting equity returns are modest: a 4–6% IRR over 10 years at a 1.2× price-to-book exit. The main levers are yield, cost base and volume (see 3).

## 3. Sensitivities

| Case / stress | Effect |
|---|---|
| High case (volumes ×1.2, yield +0.5pp, low costs) | Profitable from Y3; Y10 net income €7.6m; IRR ≈ 15% (still needs ≈ €8.7m more cash) |
| Low case (volumes ×0.7, yield −1pp, NPL ×1.5, high costs) | Never profitable within 10 years; needs ≈ €49m more equity |
| Lean staffing (72 FTE in Y3 vs 102) | Break-even in month 32; Y10 net income €4.7m. Compliance of the lean set-up is **not confirmed** |
| NPL × 2.5 / opex +25% / growth −40% / combined severe | Additional equity of €18m / €19m / €20m / €33m |

## 4. Cost structure (base, Y1)

* People costs are about €1.7m for 66 FTE (rising to 102 FTE in Y3), versus 30 CBS seats. **Seats are not headcount.**
* Technology costs are about €1.5m. The Facilization subscription of €1.05m a year is grossed up by the 18% VAT the bank cannot recover, and implementation is expensed under IFRIC guidance for SaaS arrangements. Core banking is the single largest non-staff cost and is fixed regardless of volume. At 5,000 accounts it costs about €250 per account per year.
* The Visa issuing-affiliate programme is about USD 0.4m in its first year (mid estimate) and excludes unpriced variable fees.

## 5. Vendor data issues found

1. **Facilization:** the quoted 5-year total does not equal its own components. Low: €5.45m computed vs €5.4m quoted. High: €6.02m computed vs €6.1m quoted. Flagged, not altered.
2. **Visa package:** the Issuing + Acquiring Principal high case adds up to **USD 830.5k**, but the package states USD 829.5k. Flagged, not altered. Acceptance test 13 asserts both values.
3. Several Facilization items need clarification before costs can be confirmed: DR, data migration, the card-management overlap, and the subscription billing start. The exclusions (SWIFT, CBK and registry fees, end-user IT) are costed separately.

## 6. Regulatory position

All 7 regulatory tests are **UNDETERMINED**. That is required, because no threshold has been verified against the current law. The indicative shortfalls in the base case are CAR, liquidity, reserve cover and large exposure, all caused by the funding gap. The decisive open items are:

* the new minimum capital under Law 08/L-304, which is reported to be higher than €7m;
* the NBFI conversion route;
* CBK add-ons for a de-novo bank;
* the treatment of Islamic deposit products.

See `research/cbk_readiness_report.md`.
