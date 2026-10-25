// Domain types for the Pro Finance bank transformation engine.
// The engine is a pure function of ModelInputs: no I/O, no clocks, no randomness.

export type Case = 'low' | 'base' | 'high';
export type StaffingScenario = 'lean' | 'base' | 'expanded';

export type SourceType =
  | 'MANAGEMENT_PROVIDED'
  | 'VENDOR_ESTIMATE'
  | 'PRIVATE_PRELIMINARY_ESTIMATE'
  | 'CBK_REPORTED_UNVERIFIED'
  | 'SECONDARY_SOURCE'
  | 'MARKET_BENCHMARK_SEARCH'
  | 'ESTIMATE_NOT_MARKET_VERIFIED'
  | 'UNSOURCED_ASSUMPTION'
  | 'DEMO_PRESET'
  | 'DERIVED';

export type RuleStatus = 'VERIFIED' | 'REPORTED_UNVERIFIED' | 'HISTORICAL_UNVERIFIED' | 'NOT_OBTAINED';

export interface RegulatoryRule {
  id: string;
  label: string;
  /** null when the threshold is unknown – verdicts then stay UNDETERMINED */
  value: number | null;
  status: RuleStatus;
  requirementId: string;
  source: string;
}

export interface ProductInputs {
  /** annual contractual rate (interest or Murabaha/Ijarah profit rate) */
  yield: number;
  tenorMonths: number;
  originationFeePct: number;
  stage2Share: number;
  stage3ShareSteady: number;
  seasoningMonths: number;
  coverageStage1: number;
  coverageStage2: number;
  coverageStage3: number;
  writeOffRateAnnual: number;
  riskWeight: number;
}

export interface CapitalInjection {
  id: string;
  label: string;
  relMonth: number;
  amount: number;
  instrument: 'ordinary_equity' | 'subordinated_loan';
  investor: 'existing_shareholders' | 'new_investor';
  /** pre-money equity valuation used for dilution (new investors only) */
  preMoneyValuation: number | null;
  subordinatedRate: number;
  enabled: boolean;
  source: SourceType;
  note: string;
}

export interface CbsInputs {
  case: Case;
  implementationOverride: number | null;
  annualSubscriptionOverride: number | null;
  milestones: { relMonth: number; pct: number }[];
  billingTrigger: 'go_live' | 'contract_signing' | 'custom';
  contractSigningRelMonth: number;
  customBillingStartRelMonth: number;
  billingFrequency: 'monthly' | 'quarterly' | 'annual_advance';
  annualEscalation: number;
  termMonths: number;
  renewAfterTerm: boolean;
  capitalisedImplementationPct: number;
  amortisationMonths: number;
}

export interface VisaInputs {
  enabled: boolean;
  issuing: boolean;
  acquiring: boolean;
  membership: 'principal' | 'affiliate';
  rangePoint: 'low' | 'mid' | 'high';
  startRelMonth: number;
  projectMonths: number;
  includeConfiguration: boolean;
  bins: number;
  /** if the CBS vendor's offer is later confirmed to include card management, avoid double counting */
  cardManagementIncludedElsewhere: boolean;
  /** USD per active card per month for processing/scheme variable fees; null = UNPRICED */
  variableFeePerCardMonthlyUsd: number | null;
}

export interface StressInputs {
  nplMultiplier: number;
  depositShockPct: number;
  depositShockRelMonth: number;
  rateShockBp: number;
  opexOverrunPct: number;
  growthHaircutPct: number;
  yieldShiftPp: number;
}

export interface ModelInputs {
  name: string;
  preOpMonths: number;
  horizonMonths: number;
  /** calendar go-live is NOT specified by management; kept null unless the user sets it */
  goLiveDate: string | null;
  management: {
    nominalShareCapital: number;
    accounts: [number, number, number];
    cbsSeats: [number, number, number];
    portfolio: [number, number, number];
    leasingShare: [number, number, number];
    deposits: [number, number, number];
  };
  growth: {
    portfolioGrowthAfterY3: number[];
    depositGrowthAfterY3: number[];
    accountGrowthAfterY3: number[];
    volumeScale: number;
    depositScale: number;
  };
  products: { goods: ProductInputs; leasing: ProductInputs };
  openingTransfer: { portfolio: number; legacyBorrowings: number; legacyBorrowingRate: number; enabled: boolean };
  deposits: {
    mix: { current: number; savings: number; term: number };
    rates: { current: number; savings: number; term: number };
    insuredShare: number;
  };
  islamic: { enabled: boolean; profitSharingRatio: number };
  liquidity: {
    reserveRequirement: number;
    reserveRemuneration: number;
    reserveCountsAsLiquid: boolean;
    tbillShareOfExcess: number;
    tbillYield: number;
    minOperatingCash: number;
  };
  wholesale: { enabled: boolean; rate: number; maxAmount: number; targetLiquidRatioBuffer: number };
  capital: {
    injections: CapitalInjection[];
    targetCar: number;
    tier2CapPctOfTier1: number;
    /** user confirms cash capital, deductions and eligibility have been verified */
    capitalInputsVerified: boolean;
    existingShareholderLabel: string;
  };
  fees: { accountFeeMonthly: number; cardsPerAccount: number; cardFeeAnnual: number; otherFeePerAccountMonthly: number };
  staffing: {
    scenario: StaffingScenario;
    salaryCase: Case;
    branches: { lean: number[]; base: number[]; expanded: number[] };
    wageInflation: number;
    employerPensionRate: number;
    fteGrowthAfterY3: number;
    includeBonus: boolean;
  };
  costs: {
    case: Case;
    overrides: Record<string, number>;
    disabled: string[];
    hqM2: number;
    atms: number[];
    costInflation: number;
    irrecoverableVatRate: number;
  };
  cbs: CbsInputs;
  visa: VisaInputs;
  fx: { eurPerUsd: number | null; note: string };
  tax: { citRate: number; lossCarryForwardYears: number; paymentLagMonths: number };
  valuation: { exitPriceToBook: number; costOfEquity: number };
  regulatory: {
    rules: RegulatoryRule[];
    operationalRiskAlpha: number;
    fixedAssetRiskWeight: number;
    tbillRiskWeight: number;
    deductIntangibles: boolean;
    /** largest single borrower / connected-group exposure (EUR) for the large-exposure test */
    largestSingleExposure: number;
  };
  stress: StressInputs;
}

export interface MonthRow {
  i: number;
  rel: number;
  opYear: number;
  // portfolio
  goodsGross: number;
  leasingGross: number;
  grossLoans: number;
  allowance: number;
  netLoans: number;
  nplStock: number;
  originationsGoods: number;
  originationsLeasing: number;
  repayments: number;
  writeOffs: number;
  // funding
  deposits: number;
  borrowings: number;
  legacyBorrowings: number;
  subordinatedDebt: number;
  // income statement
  interestIncomeLoans: number;
  interestIncomeLiquidity: number;
  interestIncome: number;
  interestExpenseDeposits: number;
  interestExpenseOther: number;
  interestExpense: number;
  nii: number;
  feeIncome: number;
  operatingIncome: number;
  opex: number;
  opexByCategory: Record<string, number>;
  depreciation: number;
  provisionExpense: number;
  pbt: number;
  taxExpense: number;
  netIncome: number;
  // balance sheet
  cashTotal: number;
  requiredReserve: number;
  tbills: number;
  fixedAssetsNet: number;
  intangiblesNet: number;
  prepaid: number;
  totalAssets: number;
  deferredFees: number;
  taxPayable: number;
  totalLiabilities: number;
  shareCapital: number;
  retainedEarnings: number;
  equity: number;
  balanceDifference: number;
  // regulatory
  cet1: number;
  tier2: number;
  totalCapital: number;
  rwaCredit: number;
  rwaOperational: number;
  rwa: number;
  car: number | null;
  tier1Ratio: number | null;
  leverageRatio: number | null;
  liquidAssets: number;
  liquidityRatio: number | null;
  // cash flow
  cfOperating: number;
  cfInvesting: number;
  cfFinancing: number;
  capitalInjected: number;
  // operations
  accounts: number;
  cbsSeats: number;
  fte: number;
  branches: number;
  // currency-preserving card costs
  visaUsd: number;
  visaEur: number;
}

export type YearRow = Omit<MonthRow, 'i' | 'rel' | 'opYear'> & {
  year: number;
  label: string;
  months: number;
  roa: number | null;
  roe: number | null;
  nim: number | null;
  costToIncome: number | null;
  loanToDeposit: number | null;
  costPerAccount: number | null;
  techSpendPerAccount: number | null;
};

export type Verdict = 'PASS' | 'FAIL' | 'UNDETERMINED';

export interface RegulatoryTest {
  ruleId: string;
  label: string;
  verdict: Verdict;
  indicative: 'ABOVE' | 'BELOW' | 'N/A';
  worstValue: number | null;
  worstRelMonth: number | null;
  threshold: number | null;
  ruleStatus: RuleStatus;
  reason: string;
  /** language-neutral code for UI translation */
  reasonCode: 'NO_THRESHOLD' | 'NOT_COMPUTABLE' | 'RULE_UNVERIFIED' | 'CAPITAL_UNVERIFIED' | 'MEETS' | 'BREACHES';
}

export interface Blocker {
  code: string;
  severity: 'BLOCKING' | 'WARNING' | 'INFO';
  message: string;
  params?: MessageParams;
}

export interface ModelResult {
  inputsName: string;
  months: MonthRow[];
  years: YearRow[];
  regulatory: RegulatoryTest[];
  statuses: {
    profitability: { status: 'PROFITABLE' | 'LOSS_MAKING' | 'MIXED'; detail: string; code: string; params: MessageParams };
    funding: { status: 'FUNDED' | 'UNFUNDED' | 'FUNDED_WITH_WHOLESALE'; detail: string; code: string; params: MessageParams };
    liquidity: { status: Verdict; detail: string; code: string; params: MessageParams };
    regulatory: { status: Verdict; detail: string; code: string; params: MessageParams };
  };
  capitalAnalysis: {
    minCashRelMonth: number;
    minCash: number;
    cashShortfall: number;
    capitalShortfallToTarget: number;
    capitalShortfallToMinimum: number | null;
    additionalEquityIndicated: number;
    breakEvenMonthlyRel: number | null;
    breakEvenCumulativeRel: number | null;
    firstProfitableYear: number | null;
  };
  investor: { irr: number | null; npv: number | null; exitEquityValue: number; capTable: CapTableRow[] };
  checks: { id: string; passed: boolean; detail: string; params: MessageParams }[];
  blockers: Blocker[];
}

export interface CapTableRow {
  afterInjectionId: string;
  relMonth: number;
  holders: { holder: string; ownership: number }[];
}

/** Numeric/string parameters of an engine message, so the UI can render it in any language. */
export type MessageParams = Record<string, number | string | null>;
