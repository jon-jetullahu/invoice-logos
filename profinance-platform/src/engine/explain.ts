// Traceability: formula and input lineage for every reported line item ("show formula and source").
export interface Trace { formula: string; inputs: string[]; sources: string[] }

export const TRACE: Record<string, Trace> = {
  grossLoans: { formula: 'Σ products Σ cohorts balance; cohorts amortise as annuities at (yield/12) over tenor; originations = max(0, target stock − (opening − repayments − write-offs))',
    inputs: ['management.portfolio', 'management.leasingShare', 'growth.portfolioGrowthAfterY3', 'products.*.yield', 'products.*.tenorMonths'], sources: ['MANAGEMENT_PROVIDED', 'UNSOURCED_ASSUMPTION'] },
  originationsGoods: { formula: 'max(0, monthly target stock − balance after scheduled repayments and write-offs)', inputs: ['management.portfolio', 'products.goods.tenorMonths'], sources: ['DERIVED'] },
  allowance: { formula: 'gross × [(1−s2−s3)·c1 + s2·c2 + s3·c3]; s3 ramps to steady NPL share over seasoning months × stress multiplier',
    inputs: ['products.*.stage2Share', 'products.*.stage3ShareSteady', 'products.*.coverageStage*', 'stress.nplMultiplier'], sources: ['UNSOURCED_ASSUMPTION'] },
  provisionExpense: { formula: 'Δ allowance + write-offs', inputs: ['allowance', 'products.*.writeOffRateAnnual'], sources: ['DERIVED'] },
  interestIncomeLoans: { formula: 'opening balance × yield/12 − stage-3 balance × yield/12 × stage-3 coverage (IFRS 9 net-basis interest)', inputs: ['products.*.yield'], sources: ['UNSOURCED_ASSUMPTION'] },
  interestIncomeLiquidity: { formula: 'prior-month T-bills × T-bill yield/12 + reserve balance × reserve remuneration/12', inputs: ['liquidity.tbillYield', 'liquidity.reserveRemuneration'], sources: ['UNSOURCED_ASSUMPTION'] },
  interestExpenseDeposits: { formula: 'average deposits × Σ(mix × rate)/12; Islamic mode: investment accounts at PSR × (financing yield − loss rate)',
    inputs: ['management.deposits', 'deposits.mix', 'deposits.rates', 'islamic.profitSharingRatio', 'stress.rateShockBp'], sources: ['MANAGEMENT_PROVIDED', 'MARKET_BENCHMARK_SEARCH'] },
  feeIncome: { formula: 'accounts × (account fee + other fee) + accounts × cards/account × card fee/12 + origination fees recognised straight-line over tenor',
    inputs: ['management.accounts', 'fees.*', 'products.*.originationFeePct'], sources: ['MANAGEMENT_PROVIDED', 'UNSOURCED_ASSUMPTION'] },
  opex: { formula: 'People (FTE × gross × (1+pension) + bonus + board fees + recruitment) + cost database lines × drivers × inflation × (1+VAT if irrecoverable) + CBS (impl. expensed share + subscription straight-line) + Visa USD × FX + contingency on one-offs; × (1 + opex stress)',
    inputs: ['research/hr_roles.csv', 'research/cost_database.csv', 'cbs.*', 'visa.*', 'fx.eurPerUsd'], sources: ['ESTIMATE_NOT_MARKET_VERIFIED', 'VENDOR_ESTIMATE', 'PRIVATE_PRELIMINARY_ESTIMATE'] },
  depreciation: { formula: 'straight-line over useful life from go-live (pre-op capex) or the month after purchase; capitalised CBS amortised over amortisationMonths', inputs: ['cost_database.useful_life_months', 'cbs.capitalisedImplementationPct'], sources: ['UNSOURCED_ASSUMPTION'] },
  taxExpense: { formula: 'at each model-year end: CIT rate × max(0, year PBT − available losses ≤ carry-forward years); paid after lag', inputs: ['tax.*'], sources: ['SECONDARY_SOURCE', 'UNSOURCED_ASSUMPTION'] },
  cashTotal: { formula: 'prior cash + capital + interest/fees received − interest/opex/capex paid − originations + repayments + Δdeposits ± wholesale − tax paid', inputs: ['all flows'], sources: ['DERIVED'] },
  equity: { formula: 'share capital (cash injections + in-kind transfer) + retained earnings', inputs: ['capital.injections', 'openingTransfer'], sources: ['DEMO_PRESET', 'UNSOURCED_ASSUMPTION'] },
  cet1: { formula: 'equity − capitalised intangibles (if deduction enabled)', inputs: ['regulatory.deductIntangibles'], sources: ['UNSOURCED_ASSUMPTION'] },
  rwa: { formula: 'net goods × RW + net leasing × RW + (fixed assets + prepaid) × RW + T-bills × RW + operational risk (BIA: α × avg annual gross income × 12.5)',
    inputs: ['products.*.riskWeight', 'regulatory.*'], sources: ['UNSOURCED_ASSUMPTION'] },
  car: { formula: '(CET1 + min(sub-debt, cap × CET1)) ÷ RWA', inputs: ['cet1', 'rwa', 'capital.tier2CapPctOfTier1'], sources: ['DERIVED'] },
  liquidityRatio: { formula: '(cash incl. T-bills − required reserve unless counted) ÷ deposits', inputs: ['liquidity.*'], sources: ['DERIVED'] },
};
