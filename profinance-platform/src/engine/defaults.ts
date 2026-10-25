// Default inputs, provenance registry, scenario presets and stress library.
// Defaults are EDITABLE ASSUMPTIONS. Every non-management value is labelled with its source type.
import type { Case, ModelInputs, RegulatoryRule, SourceType, StaffingScenario, StressInputs } from './types';

export const DEFAULT_RULES: RegulatoryRule[] = [
  { id: 'R-MIN-CAP', label: 'Minimum initial paid-in capital (EUR)', value: 7_000_000, status: 'HISTORICAL_UNVERIFIED', requirementId: 'REQ-CAP-001', source: 'Reg. on Licensing of Banks 2020 / Law 04/L-093 Art.15 (search extract). Law 08/L-304 reportedly increases it – amount not obtained.' },
  { id: 'R-CAR', label: 'Minimum total capital adequacy ratio', value: 0.12, status: 'REPORTED_UNVERIFIED', requirementId: 'REQ-CAP-003', source: 'CBK speech 2022 & Financial Stability Map 2025 (search extracts).' },
  { id: 'R-T1', label: 'Minimum Tier 1 / CET1 ratio', value: null, status: 'NOT_OBTAINED', requirementId: 'REQ-CAP-004', source: 'Not obtained.' },
  { id: 'R-LEV', label: 'Minimum leverage ratio', value: null, status: 'NOT_OBTAINED', requirementId: 'REQ-CAP-006', source: 'Not obtained.' },
  { id: 'R-LIQ', label: 'Minimum liquid assets / short-term liabilities', value: 0.25, status: 'REPORTED_UNVERIFIED', requirementId: 'REQ-LIQ-001', source: 'CBK speech 2022 (search extract).' },
  { id: 'R-RES', label: 'Minimum reserve ratio (cash ≥ reserve)', value: 0.1, status: 'HISTORICAL_UNVERIFIED', requirementId: 'REQ-LIQ-002', source: 'CBK minimum reserve regulation 2012 (summary).' },
  { id: 'R-LE', label: 'Max single/connected exposure ÷ Tier 1', value: 0.15, status: 'REPORTED_UNVERIFIED', requirementId: 'REQ-LE-001', source: 'CBK Regulation on Large Exposures (search extract).' },
];

/** Blank engine inputs: management seeds only, NO capital injection, NO FX. Used to prove nothing is silently filled. */
export function blankInputs(): ModelInputs {
  return {
    name: 'Blank (management seeds only)',
    preOpMonths: 15,
    horizonMonths: 120,
    goLiveDate: null,
    management: {
      nominalShareCapital: 11_400_000,
      accounts: [5000, 10000, 15000],
      cbsSeats: [30, 40, 50],
      portfolio: [20_000_000, 40_000_000, 60_000_000],
      leasingShare: [0.2, 0.2, 0.2],
      deposits: [8_000_000, 28_000_000, 48_000_000],
    },
    growth: {
      portfolioGrowthAfterY3: [0.2, 0.15, 0.12, 0.1, 0.08, 0.07, 0.06],
      depositGrowthAfterY3: [0.25, 0.18, 0.14, 0.12, 0.1, 0.08, 0.07],
      accountGrowthAfterY3: [0.15, 0.12, 0.1, 0.08, 0.07, 0.06, 0.05],
      volumeScale: 1,
      depositScale: 1,
    },
    products: {
      goods: { yield: 0.11, tenorMonths: 36, originationFeePct: 0.02, stage2Share: 0.06, stage3ShareSteady: 0.04, seasoningMonths: 24,
        coverageStage1: 0.01, coverageStage2: 0.08, coverageStage3: 0.55, writeOffRateAnnual: 0.25, riskWeight: 0.75 },
      leasing: { yield: 0.09, tenorMonths: 48, originationFeePct: 0.01, stage2Share: 0.05, stage3ShareSteady: 0.03, seasoningMonths: 24,
        coverageStage1: 0.008, coverageStage2: 0.06, coverageStage3: 0.4, writeOffRateAnnual: 0.2, riskWeight: 1 },
    },
    openingTransfer: { enabled: false, portfolio: 9_000_000, legacyBorrowings: 0, legacyBorrowingRate: 0.06 },
    deposits: { mix: { current: 0.3, savings: 0.2, term: 0.5 }, rates: { current: 0, savings: 0.01, term: 0.035 }, insuredShare: 0.5 },
    islamic: { enabled: false, profitSharingRatio: 0.4 },
    liquidity: { reserveRequirement: 0.1, reserveRemuneration: 0, reserveCountsAsLiquid: false, tbillShareOfExcess: 0.5, tbillYield: 0.025, minOperatingCash: 1_000_000 },
    wholesale: { enabled: false, rate: 0.065, maxAmount: 30_000_000, targetLiquidRatioBuffer: 0.05 },
    capital: { injections: [], targetCar: 0.16, tier2CapPctOfTier1: 1, capitalInputsVerified: false, existingShareholderLabel: 'Existing Pro Finance shareholders' },
    fees: { accountFeeMonthly: 2, cardsPerAccount: 0.6, cardFeeAnnual: 10, otherFeePerAccountMonthly: 0.5 },
    staffing: {
      scenario: 'base', salaryCase: 'base',
      branches: { lean: [1, 2, 2], base: [2, 3, 4], expanded: [3, 5, 6] },
      wageInflation: 0.05, employerPensionRate: 0.05, fteGrowthAfterY3: 0.03, includeBonus: true,
    },
    costs: { case: 'base', overrides: {}, disabled: [], hqM2: 700, atms: [1, 2, 3, 3, 4, 4, 5, 5, 6, 6], costInflation: 0.025, irrecoverableVatRate: 0.18 },
    cbs: {
      case: 'base', implementationOverride: null, annualSubscriptionOverride: null,
      milestones: [{ relMonth: -10, pct: 0.3 }, { relMonth: -5, pct: 0.4 }, { relMonth: 0, pct: 0.3 }],
      billingTrigger: 'go_live', contractSigningRelMonth: -12, customBillingStartRelMonth: 0,
      billingFrequency: 'annual_advance', annualEscalation: 0, termMonths: 60, renewAfterTerm: true,
      capitalisedImplementationPct: 0, amortisationMonths: 60,
    },
    visa: { enabled: true, issuing: true, acquiring: false, membership: 'affiliate', rangePoint: 'mid', startRelMonth: -6, projectMonths: 12,
      includeConfiguration: true, bins: 1, cardManagementIncludedElsewhere: false, variableFeePerCardMonthlyUsd: null },
    fx: { eurPerUsd: null, note: 'No FX rate entered – USD costs excluded from EUR totals.' },
    tax: { citRate: 0.1, lossCarryForwardYears: 6, paymentLagMonths: 4 },
    valuation: { exitPriceToBook: 1.2, costOfEquity: 0.15 },
    regulatory: { rules: structuredClone(DEFAULT_RULES), operationalRiskAlpha: 0.15, fixedAssetRiskWeight: 1, tbillRiskWeight: 0, deductIntangibles: true, largestSingleExposure: 250_000 },
    stress: { nplMultiplier: 1, depositShockPct: 0, depositShockRelMonth: 24, rateShockBp: 0, opexOverrunPct: 0, growthHaircutPct: 0, yieldShiftPp: 0 },
  };
}

/**
 * "Management base – illustrative": blank inputs plus clearly-labelled demonstration assumptions:
 * full €11.4m injected as cash at the start of the pre-operating period and an explicit FX rate.
 */
export function managementBase(): ModelInputs {
  const x = blankInputs();
  x.name = 'Management base (illustrative)';
  x.capital.injections = [
    { id: 'INJ-1', label: 'Existing shareholders – capital paid into the bank', relMonth: -15, amount: 11_400_000, instrument: 'ordinary_equity',
      investor: 'existing_shareholders', preMoneyValuation: null, subordinatedRate: 0, enabled: true, source: 'DEMO_PRESET',
      note: 'ASSUMPTION: equal to nominal share capital €11.4m and fully available as cash. NOT verified.' },
    { id: 'INJ-2', label: 'Strategic investor (discussed, not approved)', relMonth: 18, amount: 10_000_000, instrument: 'ordinary_equity',
      investor: 'new_investor', preMoneyValuation: 12_000_000, subordinatedRate: 0, enabled: false, source: 'MANAGEMENT_PROVIDED',
      note: 'EUR 10m raise discussed separately; disabled in base case. Valuation is a placeholder.' },
  ];
  x.fx = { eurPerUsd: 0.86, note: 'DEMO_PRESET: approximate 2025–26 market level; replace with dated ECB reference rate.' };
  return x;
}

export function applyCase(base: ModelInputs, c: Case, staffing?: StaffingScenario): ModelInputs {
  const x = structuredClone(base);
  x.costs.case = c === 'low' ? 'high' : c === 'high' ? 'low' : 'base'; // pessimistic volume ↔ high costs
  x.cbs.case = x.costs.case;
  x.staffing.salaryCase = c === 'low' ? 'high' : 'base';
  x.staffing.scenario = staffing ?? 'base';
  x.visa.rangePoint = c === 'low' ? 'high' : c === 'high' ? 'low' : 'mid';
  if (c === 'low') {
    x.name = `${base.name} – Low case`;
    x.growth.volumeScale = 0.7; x.growth.depositScale = 0.7; x.stress.yieldShiftPp = -0.01; x.stress.nplMultiplier = 1.5;
  } else if (c === 'high') {
    x.name = `${base.name} – High case`;
    x.growth.volumeScale = 1.2; x.growth.depositScale = 1.2; x.stress.yieldShiftPp = 0.005; x.stress.nplMultiplier = 0.8;
  } else x.name = `${base.name} – Base case`;
  return x;
}

export const STRESS_LIBRARY: { id: string; label: string; shock: Partial<StressInputs> }[] = [
  { id: 'npl', label: 'Credit shock: NPLs × 2.5', shock: { nplMultiplier: 2.5 } },
  { id: 'run', label: 'Deposit run: −25% from month 24', shock: { depositShockPct: 0.25, depositShockRelMonth: 24 } },
  { id: 'rates', label: 'Funding cost +200 bp', shock: { rateShockBp: 200 } },
  { id: 'opex', label: 'Operating cost overrun +25%', shock: { opexOverrunPct: 0.25 } },
  { id: 'growth', label: 'Growth shortfall −40%', shock: { growthHaircutPct: 0.4 } },
  { id: 'margin', label: 'Pricing pressure −2 pp yield', shock: { yieldShiftPp: -0.02 } },
  { id: 'severe', label: 'Combined severe', shock: { nplMultiplier: 2, depositShockPct: 0.15, rateShockBp: 150, opexOverrunPct: 0.15, growthHaircutPct: 0.25 } },
];

export function withStress(base: ModelInputs, shock: Partial<StressInputs>): ModelInputs {
  const x = structuredClone(base);
  x.stress = { ...x.stress, ...shock };
  return x;
}

export interface AssumptionMeta { path: string; label: string; unit: 'EUR' | 'USD' | 'pct' | 'count' | 'months' | 'ratio' | 'flag' | 'text'; source: SourceType; note: string; group: string }

/** Registry of editable assumptions shown in the Assumptions module (path into ModelInputs). */
export const ASSUMPTIONS: AssumptionMeta[] = [
  { group: 'Timeline', path: 'preOpMonths', label: 'Pre-operating period (months)', unit: 'months', source: 'UNSOURCED_ASSUMPTION', note: 'Licensing (≥3m preliminary review) + implementation; not a statutory figure.' },
  { group: 'Management projections', path: 'management.portfolio.0', label: 'Gross portfolio Y1 (year-end stock)', unit: 'EUR', source: 'MANAGEMENT_PROVIDED', note: 'Assumed year-end stock, not originations.' },
  { group: 'Management projections', path: 'management.portfolio.1', label: 'Gross portfolio Y2', unit: 'EUR', source: 'MANAGEMENT_PROVIDED', note: '' },
  { group: 'Management projections', path: 'management.portfolio.2', label: 'Gross portfolio Y3', unit: 'EUR', source: 'MANAGEMENT_PROVIDED', note: '' },
  { group: 'Management projections', path: 'management.deposits.0', label: 'Deposits Y1 (year-end stock)', unit: 'EUR', source: 'MANAGEMENT_PROVIDED', note: '' },
  { group: 'Management projections', path: 'management.deposits.1', label: 'Deposits Y2', unit: 'EUR', source: 'MANAGEMENT_PROVIDED', note: '' },
  { group: 'Management projections', path: 'management.deposits.2', label: 'Deposits Y3', unit: 'EUR', source: 'MANAGEMENT_PROVIDED', note: '' },
  { group: 'Management projections', path: 'management.accounts.0', label: 'Active accounts Y1', unit: 'count', source: 'MANAGEMENT_PROVIDED', note: '' },
  { group: 'Management projections', path: 'management.accounts.1', label: 'Active accounts Y2', unit: 'count', source: 'MANAGEMENT_PROVIDED', note: '' },
  { group: 'Management projections', path: 'management.accounts.2', label: 'Active accounts Y3', unit: 'count', source: 'MANAGEMENT_PROVIDED', note: '' },
  { group: 'Management projections', path: 'management.leasingShare.0', label: 'Leasing share of portfolio', unit: 'pct', source: 'MANAGEMENT_PROVIDED', note: 'Y1 (Y2/Y3 editable in JSON).' },
  { group: 'Growth Y4–Y10', path: 'growth.portfolioGrowthAfterY3.0', label: 'Portfolio growth Y4', unit: 'pct', source: 'UNSOURCED_ASSUMPTION', note: 'Sector loans grew 14.7% in 2025 (CBK AR 2025).' },
  { group: 'Growth Y4–Y10', path: 'growth.depositGrowthAfterY3.0', label: 'Deposit growth Y4', unit: 'pct', source: 'UNSOURCED_ASSUMPTION', note: '' },
  { group: 'Growth Y4–Y10', path: 'growth.volumeScale', label: 'Volume scale vs management targets', unit: 'ratio', source: 'UNSOURCED_ASSUMPTION', note: '1.0 = management plan.' },
  { group: 'Goods financing (Murabaha-type)', path: 'products.goods.yield', label: 'Contractual yield / profit rate', unit: 'pct', source: 'UNSOURCED_ASSUMPTION', note: 'Sector effective loan rate 6.9% (CBK Sep-2025); consumer goods finance priced higher.' },
  { group: 'Goods financing (Murabaha-type)', path: 'products.goods.tenorMonths', label: 'Average tenor', unit: 'months', source: 'UNSOURCED_ASSUMPTION', note: '' },
  { group: 'Goods financing (Murabaha-type)', path: 'products.goods.originationFeePct', label: 'Origination fee', unit: 'pct', source: 'UNSOURCED_ASSUMPTION', note: 'Deferred over tenor (IFRS 9 EIR approximation).' },
  { group: 'Goods financing (Murabaha-type)', path: 'products.goods.stage3ShareSteady', label: 'Steady-state NPL (stage 3) share', unit: 'pct', source: 'UNSOURCED_ASSUMPTION', note: 'Sector NPL ~2% (CBK 2025); de-novo consumer book assumed higher.' },
  { group: 'Goods financing (Murabaha-type)', path: 'products.goods.coverageStage3', label: 'Stage 3 coverage', unit: 'pct', source: 'UNSOURCED_ASSUMPTION', note: '' },
  { group: 'Goods financing (Murabaha-type)', path: 'products.goods.riskWeight', label: 'Risk weight', unit: 'pct', source: 'UNSOURCED_ASSUMPTION', note: 'Basel standardised retail 75% – CBK weights not verified.' },
  { group: 'Leasing (Ijarah-type)', path: 'products.leasing.yield', label: 'Contractual yield', unit: 'pct', source: 'UNSOURCED_ASSUMPTION', note: '' },
  { group: 'Leasing (Ijarah-type)', path: 'products.leasing.tenorMonths', label: 'Average tenor', unit: 'months', source: 'UNSOURCED_ASSUMPTION', note: '' },
  { group: 'Leasing (Ijarah-type)', path: 'products.leasing.stage3ShareSteady', label: 'Steady-state NPL share', unit: 'pct', source: 'UNSOURCED_ASSUMPTION', note: '' },
  { group: 'Leasing (Ijarah-type)', path: 'products.leasing.riskWeight', label: 'Risk weight', unit: 'pct', source: 'UNSOURCED_ASSUMPTION', note: '' },
  { group: 'Deposits', path: 'deposits.rates.term', label: 'Term deposit rate', unit: 'pct', source: 'MARKET_BENCHMARK_SEARCH', note: 'Sector time-deposit rate 3.1–3.3% (CBK Sep-2025); new-bank premium assumed.' },
  { group: 'Deposits', path: 'deposits.rates.savings', label: 'Savings rate', unit: 'pct', source: 'UNSOURCED_ASSUMPTION', note: '' },
  { group: 'Deposits', path: 'deposits.mix.term', label: 'Term deposits share', unit: 'pct', source: 'UNSOURCED_ASSUMPTION', note: 'Current/savings/term must sum to 100%.' },
  { group: 'Deposits', path: 'deposits.insuredShare', label: 'Insured share of deposits (DIFK base)', unit: 'pct', source: 'UNSOURCED_ASSUMPTION', note: 'Coverage €5,000 per depositor (IMF 2026).' },
  { group: 'Islamic', path: 'islamic.enabled', label: 'Islamic window mode', unit: 'flag', source: 'UNSOURCED_ASSUMPTION', note: 'Permissibility unconfirmed.' },
  { group: 'Islamic', path: 'islamic.profitSharingRatio', label: 'Investment-account profit-sharing ratio', unit: 'pct', source: 'UNSOURCED_ASSUMPTION', note: '' },
  { group: 'Liquidity', path: 'liquidity.reserveRequirement', label: 'Minimum reserve requirement', unit: 'pct', source: 'CBK_REPORTED_UNVERIFIED', note: '2012 regulation (10%).' },
  { group: 'Liquidity', path: 'liquidity.tbillYield', label: 'Liquidity portfolio yield', unit: 'pct', source: 'UNSOURCED_ASSUMPTION', note: '' },
  { group: 'Liquidity', path: 'liquidity.minOperatingCash', label: 'Minimum operating cash', unit: 'EUR', source: 'UNSOURCED_ASSUMPTION', note: '' },
  { group: 'Funding', path: 'wholesale.enabled', label: 'Allow wholesale/IFI funding line', unit: 'flag', source: 'UNSOURCED_ASSUMPTION', note: 'Off by default: no hidden funding plug.' },
  { group: 'Funding', path: 'wholesale.rate', label: 'Wholesale funding rate', unit: 'pct', source: 'UNSOURCED_ASSUMPTION', note: '' },
  { group: 'Capital', path: 'capital.targetCar', label: 'Management target CAR (incl. buffer)', unit: 'pct', source: 'UNSOURCED_ASSUMPTION', note: 'Legal minimum held separately in rules.' },
  { group: 'Capital', path: 'capital.capitalInputsVerified', label: 'Capital inputs verified by auditor/CBK', unit: 'flag', source: 'UNSOURCED_ASSUMPTION', note: 'Must stay off until evidence exists.' },
  { group: 'Fees', path: 'fees.accountFeeMonthly', label: 'Account maintenance fee per month', unit: 'EUR', source: 'UNSOURCED_ASSUMPTION', note: '' },
  { group: 'Fees', path: 'fees.cardsPerAccount', label: 'Cards per active account', unit: 'ratio', source: 'UNSOURCED_ASSUMPTION', note: '' },
  { group: 'People', path: 'staffing.wageInflation', label: 'Annual wage inflation', unit: 'pct', source: 'MARKET_BENCHMARK_SEARCH', note: 'Average gross wage +11.6% in 2025 (KAS); 5% assumed for banks.' },
  { group: 'People', path: 'staffing.employerPensionRate', label: 'Employer pension contribution', unit: 'pct', source: 'SECONDARY_SOURCE', note: '5% mandatory (PwC tax summaries).' },
  { group: 'Costs', path: 'costs.hqM2', label: 'HQ floor area (m²)', unit: 'count', source: 'UNSOURCED_ASSUMPTION', note: '' },
  { group: 'Costs', path: 'costs.costInflation', label: 'Non-wage cost inflation', unit: 'pct', source: 'UNSOURCED_ASSUMPTION', note: '' },
  { group: 'Costs', path: 'costs.irrecoverableVatRate', label: 'Irrecoverable VAT on vendor services', unit: 'pct', source: 'SECONDARY_SOURCE', note: 'Financial services VAT-exempt → input VAT not recoverable (verify reverse-charge on foreign vendors).' },
  { group: 'Core banking (Facilization)', path: 'cbs.billingTrigger', label: 'Subscription billing trigger', unit: 'text', source: 'VENDOR_ESTIMATE', note: 'go_live | contract_signing | custom' },
  { group: 'Core banking (Facilization)', path: 'cbs.customBillingStartRelMonth', label: 'Custom billing start (month rel. to go-live)', unit: 'months', source: 'UNSOURCED_ASSUMPTION', note: '' },
  { group: 'Core banking (Facilization)', path: 'cbs.annualEscalation', label: 'Subscription escalation p.a.', unit: 'pct', source: 'UNSOURCED_ASSUMPTION', note: 'Offer quotes a 5-year average.' },
  { group: 'Core banking (Facilization)', path: 'cbs.capitalisedImplementationPct', label: 'Share of implementation capitalised', unit: 'pct', source: 'UNSOURCED_ASSUMPTION', note: 'SaaS configuration usually expensed (IFRIC 2021).' },
  { group: 'Cards (Visa)', path: 'visa.enabled', label: 'Card programme enabled', unit: 'flag', source: 'PRIVATE_PRELIMINARY_ESTIMATE', note: '' },
  { group: 'Cards (Visa)', path: 'visa.acquiring', label: 'Acquiring enabled', unit: 'flag', source: 'PRIVATE_PRELIMINARY_ESTIMATE', note: 'Acquiring platform/POS unpriced.' },
  { group: 'Cards (Visa)', path: 'visa.projectMonths', label: 'Visa project duration', unit: 'months', source: 'PRIVATE_PRELIMINARY_ESTIMATE', note: '' },
  { group: 'Cards (Visa)', path: 'fx.eurPerUsd', label: 'EUR per USD', unit: 'ratio', source: 'UNSOURCED_ASSUMPTION', note: 'Null = USD costs excluded from EUR totals.' },
  { group: 'Tax', path: 'tax.citRate', label: 'Corporate income tax rate', unit: 'pct', source: 'SECONDARY_SOURCE', note: 'Law 06/L-105 (Chambers 2026).' },
  { group: 'Tax', path: 'tax.lossCarryForwardYears', label: 'Tax-loss carry-forward (years)', unit: 'count', source: 'UNSOURCED_ASSUMPTION', note: 'Verify in CIT law.' },
  { group: 'Regulatory', path: 'regulatory.largestSingleExposure', label: 'Largest single exposure', unit: 'EUR', source: 'UNSOURCED_ASSUMPTION', note: '' },
  { group: 'Valuation', path: 'valuation.exitPriceToBook', label: 'Exit price-to-book (Y10)', unit: 'ratio', source: 'UNSOURCED_ASSUMPTION', note: '' },
  { group: 'Valuation', path: 'valuation.costOfEquity', label: 'Cost of equity', unit: 'pct', source: 'UNSOURCED_ASSUMPTION', note: '' },
];

export function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o == null ? o : (o as Record<string, unknown>)[k]), obj);
}

export function setPath<T>(obj: T, path: string, value: unknown): T {
  const x = structuredClone(obj) as Record<string, unknown>;
  const keys = path.split('.');
  let o = x;
  for (const k of keys.slice(0, -1)) o = o[k] as Record<string, unknown>;
  o[keys[keys.length - 1]] = value;
  return x as T;
}
