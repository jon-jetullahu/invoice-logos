import { describe, expect, it } from 'vitest';
import {
  applyCase, blankInputs, cbsSchedule, deriveManagement, illustrativeTotal, irr, kosovoNetMonthly, managementBase, monthlyTargets,
  projectFees, reconcileFiveYearQuote, reconcilePackageTotals, runModel, simulateProduct, STRESS_LIBRARY, visaLines, withStress,
  type ModelInputs, type VisaInputs,
} from '../src/engine';

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const visaBase: VisaInputs = { enabled: true, issuing: true, acquiring: false, membership: 'affiliate', rangePoint: 'low', startRelMonth: 0,
  projectMonths: 12, includeConfiguration: true, bins: 1, cardManagementIncludedElsewhere: false, variableFeePerCardMonthlyUsd: null };

describe('Seed data (acceptance 1–5)', () => {
  const m = blankInputs().management;
  const d = deriveManagement(m);
  it('1. portfolio, deposits and accounts are the management figures', () => {
    expect(m.portfolio).toEqual([20e6, 40e6, 60e6]);
    expect(m.deposits).toEqual([8e6, 28e6, 48e6]);
    expect(m.accounts).toEqual([5000, 10000, 15000]);
  });
  it('2. leasing and goods-finance balances', () => {
    expect(d.leasing).toEqual([4e6, 8e6, 12e6]);
    expect(d.goods).toEqual([16e6, 32e6, 48e6]);
  });
  it('3. deposit/portfolio ratios', () => {
    expect(d.depositToPortfolio.map((x) => +x.toFixed(10))).toEqual([0.4, 0.7, 0.8]);
  });
  it('4. portfolio minus deposits is €12m and NOT labelled a cash shortfall', () => {
    expect(d.portfolioMinusDeposits).toEqual([12e6, 12e6, 12e6]);
    expect(d.portfolioMinusDepositsLabel).toBe('STRUCTURAL_GAP_NOT_A_CASH_SHORTFALL');
  });
  it('5. CBS seats 30/40/50; payroll headcount unknown (not derived from seats)', () => {
    expect(m.cbsSeats).toEqual([30, 40, 50]);
    expect(d.payrollHeadcount).toBeNull();
    const r = runModel(managementBase());
    const y1 = r.years.find((y) => y.year === 1)!;
    expect(y1.cbsSeats).toBe(30);
    expect(y1.fte).not.toBe(30); // FTE comes from the staffing model, not from seats
  });
});

describe('Core banking offer (acceptance 6–9)', () => {
  const relOf = (i: number) => i - 15;
  it('6. implementation and subscription ranges; 5-year total never added', () => {
    const r = reconcileFiveYearQuote();
    expect([r.quotedLow, r.quotedHigh]).toEqual([5.4e6, 6.1e6]);
    const x = blankInputs();
    x.cbs.case = 'high';
    const s = cbsSchedule(x.cbs, 135, relOf, 1);
    expect(sum(s.implCash)).toBeCloseTo(520_000, 6);
    const first5yExpense = sum(s.subscriptionExpense.slice(15, 75));
    expect(first5yExpense).toBeCloseTo(5 * 1_100_000, 4);
    expect(sum(s.implCash) + first5yExpense).toBeCloseTo(6_020_000, 4); // not 6.1m and not 6.1m + components
  });
  it('7. flags the rounded-range discrepancies without altering the quote', () => {
    const r = reconcileFiveYearQuote();
    expect(r.computedLow).toBe(5_450_000);
    expect(r.computedHigh).toBe(6_020_000);
    expect(r.flags).toHaveLength(2);
  });
  it('8. subscription starts only at the selected billing trigger', () => {
    const x = blankInputs().cbs;
    const goLive = cbsSchedule({ ...x, billingTrigger: 'go_live' }, 135, relOf, 1);
    expect(sum(goLive.subscriptionExpense.slice(0, 15))).toBe(0);
    expect(goLive.subscriptionExpense[15]).toBeGreaterThan(0);
    const signing = cbsSchedule({ ...x, billingTrigger: 'contract_signing', contractSigningRelMonth: -12 }, 135, relOf, 1);
    expect(signing.subscriptionExpense[2]).toBe(0);
    expect(signing.subscriptionExpense[3]).toBeGreaterThan(0);
  });
  it('9. moving the billing start shifts expense and cash', () => {
    const a = managementBase();
    const b = structuredClone(a);
    b.cbs.billingTrigger = 'custom';
    b.cbs.customBillingStartRelMonth = 6;
    const ra = runModel(a), rb = runModel(b);
    const techY1 = (r: ReturnType<typeof runModel>) => r.years.find((y) => y.year === 1)!.opexByCategory['Technology'];
    expect(techY1(ra) - techY1(rb)).toBeCloseTo((6 / 12) * 1_050_000 * 1.18, 0);
    expect(rb.years[1].cashTotal).toBeGreaterThan(ra.years[1].cashTotal - 1); // cash later or equal
    expect(rb.months.find((m) => m.rel === 0)!.cashTotal).toBeGreaterThan(ra.months.find((m) => m.rel === 0)!.cashTotal);
  });
});

describe('Visa (acceptance 10–16)', () => {
  it('10. 12-month project = USD 47,500', () => expect(projectFees(12)).toBe(47_500));
  it('11. first-year fixed fee = USD 20,000', () => {
    expect(visaLines(visaBase).find((l) => l.id === 'quarterly_fixed')!.usd).toBe(20_000);
  });
  it('12. Issuing Affiliate 234k–575.5k; Principal 264k–605.5k', () => {
    expect(illustrativeTotal({ ...visaBase, rangePoint: 'low' })).toBe(234_000);
    expect(illustrativeTotal({ ...visaBase, rangePoint: 'high' })).toBe(575_500);
    expect(illustrativeTotal({ ...visaBase, membership: 'principal', rangePoint: 'low' })).toBe(264_000);
    expect(illustrativeTotal({ ...visaBase, membership: 'principal', rangePoint: 'high' })).toBe(605_500);
  });
  it('13. Issuing+Acquiring Principal low = 409k; package high (829.5k) is flagged as an arithmetic discrepancy', () => {
    const v = { ...visaBase, membership: 'principal' as const, acquiring: true };
    expect(illustrativeTotal({ ...v, rangePoint: 'low' })).toBe(409_000);
    expect(illustrativeTotal({ ...v, rangePoint: 'high' })).toBe(830_500);
    const rec = reconcilePackageTotals().find((r) => r.scenario.startsWith('Issuing + Acquiring'))!;
    expect(rec.matches).toBe(false);
    expect(rec.note).toMatch(/829,500/);
  });
  it('14. switching acquiring off removes acquiring licence and gateway, keeps issuing', () => {
    const on = visaLines({ ...visaBase, acquiring: true }).map((l) => l.id);
    const off = visaLines({ ...visaBase, acquiring: false }).map((l) => l.id);
    expect(on).toContain('acquiring_licence');
    expect(on).toContain('gateway');
    expect(off).not.toContain('acquiring_licence');
    expect(off).not.toContain('gateway');
    expect(off).toContain('issuing_licence');
  });
  it('15. principal/affiliate switch never double-counts the issuing licence', () => {
    for (const membership of ['principal', 'affiliate'] as const)
      expect(visaLines({ ...visaBase, membership }).filter((l) => l.id === 'issuing_licence')).toHaveLength(1);
  });
  it('16. no EUR conversion without an explicit FX rate', () => {
    const x = managementBase();
    x.fx.eurPerUsd = null;
    const r = runModel(x);
    expect(sum(r.months.map((m) => m.visaUsd))).toBeGreaterThan(0);
    expect(sum(r.months.map((m) => m.visaEur))).toBe(0);
    expect(r.blockers.map((b) => b.code)).toContain('FX_MISSING');
  });
});

describe('Accounting / regulatory (acceptance 17–23)', () => {
  it('17. €11.4m nominal capital does not populate opening cash', () => {
    const r = runModel(blankInputs());
    expect(r.months[0].cashTotal).toBeLessThanOrEqual(0);
    expect(r.months[0].shareCapital).toBe(0);
    expect(r.blockers.map((b) => b.code)).toContain('NO_CAPITAL_INJECTION');
  });
  it('18. missing opening balance sheet is an explicit blocker', () => {
    expect(runModel(managementBase()).blockers.map((b) => b.code)).toContain('OPENING_BALANCE_SHEET_UNAVAILABLE');
  });
  it('19. no PASS while rules or capital inputs are unverified', () => {
    const x = managementBase();
    x.capital.injections[0].amount = 200e6; // even with overwhelming capital
    const r = runModel(x);
    expect(r.regulatory.every((t) => t.verdict !== 'PASS')).toBe(true);
    expect(r.statuses.regulatory.status).not.toBe('PASS');
    // only after the user verifies rules AND capital inputs can PASS appear
    x.capital.capitalInputsVerified = true;
    x.regulatory.rules = x.regulatory.rules.map((rule) => (rule.id === 'R-CAR' ? { ...rule, status: 'VERIFIED' } : rule));
    expect(runModel(x).regulatory.find((t) => t.ruleId === 'R-CAR')!.verdict).toBe('PASS');
  });
  it('20. originations differ from year-end stock changes because of repayments', () => {
    const r = runModel(managementBase());
    const y2 = r.years.find((y) => y.year === 2)!;
    const orig = y2.originationsGoods + y2.originationsLeasing;
    expect(orig).toBeGreaterThan(20e6 + 1e6);
    expect(y2.grossLoans).toBeCloseTo(40e6, 0);
  });
  it('21. leasing and goods assumptions propagate separately', () => {
    const a = managementBase();
    const b = structuredClone(a);
    b.products.leasing.yield = 0.2;
    const ra = runModel(a), rb = runModel(b);
    expect(rb.years[2].nii).toBeGreaterThan(ra.years[2].nii);
    expect(rb.years[2].goodsGross).toBeCloseTo(ra.years[2].goodsGross, 6);
    const g = simulateProduct(a.products.goods, monthlyTargets([16e6], 12, 0), 0, 1, 0);
    const l = simulateProduct(a.products.leasing, monthlyTargets([4e6], 12, 0), 0, 1, 0);
    expect(g.gross[11]).toBeCloseTo(16e6, 4);
    expect(l.gross[11]).toBeCloseTo(4e6, 4);
  });
  it('22. positive net income with negative cash yields separate statuses', () => {
    const r = runModel(managementBase());
    expect(r.statuses.profitability.status).toBe('PROFITABLE');
    expect(r.statuses.funding.status).toBe('UNFUNDED');
    expect(r.statuses.liquidity.status).toBe('FAIL');
  });
  it('23. every month balances; cash flows reconcile; outputs finite', () => {
    for (const c of ['low', 'base', 'high'] as const) {
      const r = runModel(applyCase(managementBase(), c));
      for (const chk of r.checks.filter((x) => x.id !== 'year_end_targets_met')) expect(chk.passed, `${c}:${chk.id} ${chk.detail}`).toBe(true);
    }
  });
});

describe('Engine behaviour', () => {
  it('is deterministic', () => {
    expect(JSON.stringify(runModel(managementBase()).years)).toBe(JSON.stringify(runModel(managementBase()).years));
  });
  it('balances under every stress test and with all options switched on', () => {
    const x: ModelInputs = managementBase();
    x.islamic.enabled = true;
    x.wholesale.enabled = true;
    x.openingTransfer = { enabled: true, portfolio: 9e6, legacyBorrowings: 5e6, legacyBorrowingRate: 0.06 };
    x.capital.injections[1].enabled = true;
    x.capital.injections.push({ id: 'SUB', label: 'Shareholder sub-loan', relMonth: 12, amount: 3e6, instrument: 'subordinated_loan', investor: 'existing_shareholders',
      preMoneyValuation: null, subordinatedRate: 0.07, enabled: true, source: 'UNSOURCED_ASSUMPTION', note: '' });
    x.cbs.capitalisedImplementationPct = 0.5;
    x.visa.acquiring = true;
    x.visa.variableFeePerCardMonthlyUsd = 0.4;
    for (const s of STRESS_LIBRARY) {
      const r = runModel(withStress(x, s.shock));
      for (const chk of r.checks.filter((c) => c.id !== 'year_end_targets_met')) expect(chk.passed, `${s.id}:${chk.id} ${chk.detail}`).toBe(true);
    }
  });
  it('wholesale funding removes negative cash and is reported as such', () => {
    const x = managementBase();
    x.wholesale.enabled = true;
    const r = runModel(x);
    expect(Math.min(...r.months.map((m) => m.cashTotal))).toBeGreaterThanOrEqual(-0.5);
    expect(r.statuses.funding.status).toBe('FUNDED_WITH_WHOLESALE');
  });
  it('capital injection from a new investor dilutes existing shareholders', () => {
    const x = managementBase();
    x.capital.injections[1].enabled = true; // €10m at €12m pre-money
    const ct = runModel(x).investor.capTable;
    const last = ct[ct.length - 1].holders;
    expect(last.find((h) => h.holder.startsWith('Existing'))!.ownership).toBeCloseTo(12 / 22, 6);
  });
  it('a stress makes results worse than base', () => {
    const base = runModel(managementBase());
    const npl = runModel(withStress(managementBase(), { nplMultiplier: 2.5 }));
    expect(npl.years[5].netIncome).toBeLessThan(base.years[5].netIncome);
  });
  it('tax is only charged after carried-forward losses are used', () => {
    const r = runModel(applyCase(managementBase(), 'high'));
    const firstProfit = r.years.find((y) => y.year > 0 && y.pbt > 0)!;
    expect(firstProfit.taxExpense).toBe(0);
  });
  it('IRR helper', () => {
    expect(irr([-100, 110])).toBeCloseTo(0.1, 6);
    expect(irr([100, 100])).toBeNull();
  });
  it('Kosovo payroll: net pay from gross using 0/8/10% brackets and 5% pension', () => {
    const r = kosovoNetMonthly(1000);
    // taxable 950×12 = 11,400: 8%×2,400 + 10%×6,000 = 792/yr = 66/month
    expect(r.incomeTax).toBeCloseTo(66, 6);
    expect(r.net).toBeCloseTo(1000 - 50 - 66, 6);
  });
});
