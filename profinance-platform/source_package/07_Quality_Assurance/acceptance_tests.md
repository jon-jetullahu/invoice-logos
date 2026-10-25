# Mandatory acceptance tests

## Seed data
1. Y1/Y2/Y3 portfolio = EUR 20m/40m/60m, deposits = EUR 8m/28m/48m, accounts 5k/10k/15k.
2. Leasing balances = EUR 4m/8m/12m and goods finance = EUR 16m/32m/48m.
3. Deposit/portfolio ratios = 0.4/0.7/0.8.
4. Portfolio minus deposits = EUR 12m each year; system must NOT label this automatically as cash shortfall.
5. Internal system user seats = 30/40/50; payroll headcount remains unknown.

## CBS
6. Implementation EUR 450k–520k, annual EUR 1.0m–1.1m, quoted 5y EUR 5.4m–6.1m; avoid double-counting.
7. Flag quote's low-end 450k+5×1m = EUR 5.45m vs vendor's rounded 5.4m and high-end 520k+5×1.1m = EUR 6.02m vs vendor's 6.1m.
8. Subscription starts only when selected contract billing trigger occurs, not arbitrarily at model month 1.
9. Change subscription start date and verify correct cash/expense shifts.

## Visa
10. 12-month Visa project charge = USD 47,500 (5×2,500 + 7×5,000), only when 12 months selected.
11. First-year fixed Visa fee = USD 20,000 assuming one $5k quarterly charge.
12. Issuing Affiliate illustrative range = USD 234k–575.5k; Principal = USD 264k–605.5k.
13. Issuing+Acquiring Principal illustrative range = USD 409k–829.5k **before** unpriced acquiring platform/POS/fees.
14. Switching acquiring off removes acquiring licence and gateway but retains issuing costs.
15. Switching Principal/Associate does not double count issuing licence.
16. No conversion or EUR+USD totals without explicit FX rate.

## Accounting / regulatory
17. EUR 11.4m nominal capital does not automatically populate opening cash.
18. Missing opening balance sheet -> explicit unreconciled/missing data state; no false verified balance sheet.
19. No compliance PASS if risk weights, eligible capital or rule effective dates are missing.
20. Portfolio year-end stock changes cannot be equated to gross originations without repayments.
21. Leasing vs goods financing assumptions propagate separately.
22. Positive net income with negative cash/liquidity must produce separate status indicators.
23. All derived values trace back to inputs, version and source.

## Data collection
24. PriBank official annual report URLs exist in source registry but report rows remain NOT DOWNLOADED.
25. Missing individual bank report data is not silently replaced with sector averages.
26. Historical restatements must preserve old and revised observations.
