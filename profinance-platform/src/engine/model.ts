// Integrated monthly bank model: portfolio cohorts → deposits → liquidity → P&L → balance sheet → capital.
// Pure and deterministic. All monetary ledgers are EUR; USD card costs are converted only with an explicit FX rate.
import rolesJson from '../data/generated/hr_roles.json';
import costJson from '../data/generated/cost_database.json';
import { cbsSchedule } from './cbs';
import { costEvents, type CostRow, type Drivers } from './costs';
import { monthlyTargets, yearEndPath } from './management';
import { branchesForYear, staffMonth, type RoleDef } from './staffing';
import type { Blocker, CapTableRow, ModelInputs, ModelResult, MonthRow, ProductInputs, RegulatoryRule, RegulatoryTest, Verdict, YearRow } from './types';
import { visaScheduleUsd } from './visa';

export interface ModelData { roles: RoleDef[]; costs: CostRow[] }
export const DEFAULT_DATA: ModelData = { roles: rolesJson as RoleDef[], costs: costJson as CostRow[] };

const HQ_OPEN_REL = -9;
const BRANCH_OPEN_REL = -2;

function annuity(principal: number, monthlyRate: number, n: number): number {
  if (n <= 0) return principal;
  if (monthlyRate === 0) return principal / n;
  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n));
}

interface ProductSim {
  gross: number[]; interest: number[]; repay: number[]; orig: number[]; writeOff: number[];
  allowance: number[]; npl: number[]; provision: number[]; feeCash: number[]; feeRecognised: number[];
}

/** Cohort simulation of one financing product over operating months. Targets are year-end-interpolated STOCKS. */
export function simulateProduct(p: ProductInputs, targets: number[], opening: number, nplMultiplier: number, yieldShift: number): ProductSim {
  const H = targets.length;
  const r = Math.max(0, p.yield + yieldShift) / 12;
  const s: ProductSim = {
    gross: [], interest: [], repay: [], orig: [], writeOff: [], allowance: [], npl: [], provision: [],
    feeCash: [], feeRecognised: Array(H + p.tenorMonths + 1).fill(0),
  };
  const cohorts: { bal: number; pay: number }[] = [];
  const steady = Math.min(1, p.stage3ShareSteady * nplMultiplier);
  const blended = (s3: number, s2: number) => (1 - s2 - s3) * p.coverageStage1 + s2 * p.coverageStage2 + s3 * p.coverageStage3;
  const shares = (rel: number, seasoned: boolean) => {
    const ramp = seasoned ? 1 : Math.min(1, (rel + 1) / Math.max(1, p.seasoningMonths));
    const s3 = steady * ramp;
    const s2 = Math.min(1 - s3, p.stage2Share * nplMultiplier * ramp);
    return { s3, s2 };
  };
  let prevAllow = 0;
  let prevNplShare = 0;
  if (opening > 0) {
    cohorts.push({ bal: opening, pay: annuity(opening, r, p.tenorMonths) });
    const sh = shares(0, true);
    prevAllow = opening * blended(sh.s3, sh.s2);
    prevNplShare = sh.s3;
  }
  for (let rel = 0; rel < H; rel++) {
    const open = cohorts.reduce((a, c) => a + c.bal, 0);
    const nplOpen = open * prevNplShare;
    // IFRS 9: stage-3 interest is recognised on the net carrying amount
    const interest = open * r - nplOpen * r * p.coverageStage3;
    let repay = 0;
    for (const c of cohorts) {
      if (c.bal <= 0) continue;
      const prin = Math.min(c.bal, c.pay - c.bal * r);
      c.bal -= prin;
      repay += prin;
    }
    const afterRepay = cohorts.reduce((a, c) => a + c.bal, 0);
    const wo = Math.min(afterRepay, (nplOpen * p.writeOffRateAnnual) / 12);
    if (afterRepay > 0 && wo > 0) {
      const f = 1 - wo / afterRepay;
      for (const c of cohorts) { c.bal *= f; c.pay *= f; }
    }
    const after = afterRepay - wo;
    const orig = Math.max(0, targets[rel] - after);
    if (orig > 0) cohorts.push({ bal: orig, pay: annuity(orig, r, p.tenorMonths) });
    const gross = after + orig;
    const sh = shares(rel, opening > 0);
    const allowance = gross * blended(sh.s3, sh.s2);
    const feeCash = orig * p.originationFeePct;
    for (let k = 1; k <= p.tenorMonths; k++) s.feeRecognised[rel + k] += feeCash / p.tenorMonths;
    s.gross.push(gross); s.interest.push(interest); s.repay.push(repay); s.orig.push(orig); s.writeOff.push(wo);
    s.allowance.push(allowance); s.npl.push(gross * sh.s3); s.provision.push(allowance - prevAllow + wo); s.feeCash.push(feeCash);
    prevAllow = allowance;
    prevNplShare = sh.s3;
  }
  s.feeRecognised = s.feeRecognised.slice(0, H);
  return s;
}

function rule(inputs: ModelInputs, id: string): RegulatoryRule | undefined {
  return inputs.regulatory.rules.find((r) => r.id === id);
}

export function runModel(inputs: ModelInputs, data: ModelData = DEFAULT_DATA): ModelResult {
  const preOp = inputs.preOpMonths;
  const H = inputs.horizonMonths;
  const n = preOp + H;
  const relOf = (i: number) => i - preOp;
  const nYears = Math.ceil(H / 12);
  const st = inputs.stress;
  const m = inputs.management;
  const g = inputs.growth;
  const vol = g.volumeScale * (1 - st.growthHaircutPct);

  // ---- targets (stocks) -----------------------------------------------------------------------
  const portYE = yearEndPath(m.portfolio, g.portfolioGrowthAfterY3, nYears, vol);
  const leaseShare = (y: number) => m.leasingShare[Math.min(y, 2)];
  const goodsYE = portYE.map((v, y) => v * (1 - leaseShare(y)));
  const leaseYE = portYE.map((v, y) => v * leaseShare(y));
  const tr = inputs.openingTransfer;
  const openPort = tr.enabled ? tr.portfolio : 0;
  const goodsT = monthlyTargets(goodsYE, H, openPort * (1 - leaseShare(0)));
  const leaseT = monthlyTargets(leaseYE, H, openPort * leaseShare(0));
  const depYE = yearEndPath(m.deposits, g.depositGrowthAfterY3, nYears, g.depositScale * (1 - st.growthHaircutPct));
  const depT = monthlyTargets(depYE, H, 0).map((v, rel) => (st.depositShockPct > 0 && rel >= st.depositShockRelMonth ? v * (1 - st.depositShockPct) : v));
  const accYE = yearEndPath(m.accounts, g.accountGrowthAfterY3, nYears, vol);
  const accT = monthlyTargets(accYE, H, 0);
  const seatsAt = (rel: number) => (rel < 0 ? 0 : m.cbsSeats[Math.min(2, Math.floor(rel / 12))]);

  // ---- products ---------------------------------------------------------------------------------
  const goods = simulateProduct(inputs.products.goods, goodsT, openPort * (1 - leaseShare(0)), st.nplMultiplier, st.yieldShiftPp);
  const lease = simulateProduct(inputs.products.leasing, leaseT, openPort * leaseShare(0), st.nplMultiplier, st.yieldShiftPp);

  // ---- vendor schedules -------------------------------------------------------------------------
  const vatGross = 1 + inputs.costs.irrecoverableVatRate;
  const cbs = cbsSchedule(inputs.cbs, n, relOf, vatGross);
  const cardsAt = (i: number) => { const rel = relOf(i); return rel < 0 ? 0 : accT[rel] * inputs.fees.cardsPerAccount; };
  const visaUsd = visaScheduleUsd(inputs.visa, n, relOf, cardsAt);
  const fx = inputs.fx.eurPerUsd;

  // ---- state ---------------------------------------------------------------------------------------
  const months: MonthRow[] = [];
  const assets: { cost: number; life: number; start: number }[] = [];
  const intangibles: { cost: number; life: number; start: number }[] = [];
  let cash = 0, borrow = 0, subDebt = 0, shareCapital = 0, retained = 0;
  let prevTbills = 0, prevReserve = 0, prevDeposits = 0;
  let cumSubCash = 0, cumSubExp = 0, taxPayable = 0, deferredFees = 0, legacy = 0;
  const taxDue: { i: number; amount: number }[] = [];
  const lossPool: { year: number; amount: number }[] = [];
  let yearPbt = 0;
  const giHistory: number[] = [];
  const contingencyRow = data.costs.find((c) => c.cost_id === 'COST-OTH-CONT');
  const recruitRow = data.costs.find((c) => c.cost_id === 'COST-HR-RECR');
  const pick = (row: CostRow | undefined) =>
    !row || inputs.costs.disabled.includes(row.cost_id) ? 0 : inputs.costs.overrides[row.cost_id] ?? Number(row[inputs.costs.case] || 0);
  const contingencyPct = pick(contingencyRow);
  const recruitPct = pick(recruitRow);
  let prevSites = 0, prevBranches = 0, prevAtms = 0, prevFte = 0;
  const injections = inputs.capital.injections.filter((x) => x.enabled);

  for (let i = 0; i < n; i++) {
    const rel = relOf(i);
    const op = rel >= 0;
    const opYear = op ? Math.floor(rel / 12) + 1 : 0;

    // capital
    let injected = 0, subInjected = 0;
    for (const inj of injections) {
      if (Math.max(inj.relMonth, -preOp) !== rel) continue;
      if (inj.instrument === 'ordinary_equity') { shareCapital += inj.amount; injected += inj.amount; }
      else { subDebt += inj.amount; subInjected += inj.amount; }
    }
    // opening portfolio transfer (non-cash): net assets in, legacy liabilities in, difference = in-kind equity
    if (rel === 0 && tr.enabled && openPort > 0) {
      const openAllow = (goods.allowance[0] - goods.provision[0] + goods.writeOff[0]) + (lease.allowance[0] - lease.provision[0] + lease.writeOff[0]);
      legacy = tr.legacyBorrowings;
      shareCapital += openPort - openAllow - legacy;
    }

    // portfolio
    const gG = op ? goods.gross[rel] : 0, gL = op ? lease.gross[rel] : 0;
    const allowance = op ? goods.allowance[rel] + lease.allowance[rel] : 0;
    const origG = op ? goods.orig[rel] : 0, origL = op ? lease.orig[rel] : 0;
    const repay = op ? goods.repay[rel] + lease.repay[rel] : 0;
    const wo = op ? goods.writeOff[rel] + lease.writeOff[rel] : 0;
    const iiLoans = op ? goods.interest[rel] + lease.interest[rel] : 0;
    const provision = op ? goods.provision[rel] + lease.provision[rel] : 0;
    const feeCashOrig = op ? goods.feeCash[rel] + lease.feeCash[rel] : 0;
    const feeRecOrig = op ? goods.feeRecognised[rel] + lease.feeRecognised[rel] : 0;

    // deposits & cost of funds
    const deposits = op ? depT[rel] : 0;
    const avgDep = (prevDeposits + deposits) / 2;
    const d = inputs.deposits;
    const shock = st.rateShockBp / 10_000;
    let depCost: number;
    if (inputs.islamic.enabled) {
      const avgGross = ((months[i - 1]?.grossLoans ?? 0) + gG + gL) / 2;
      const netYield = avgGross > 0 ? Math.max(0, ((iiLoans - provision) * 12) / avgGross) : 0;
      const invRate = inputs.islamic.profitSharingRatio * netYield + shock;
      depCost = (avgDep * (d.mix.current * d.rates.current + (d.mix.savings + d.mix.term) * invRate)) / 12;
    } else {
      depCost = (avgDep * (d.mix.current * d.rates.current + d.mix.savings * (d.rates.savings + shock) + d.mix.term * (d.rates.term + shock))) / 12;
    }
    const otherIntExp = (borrow * (inputs.wholesale.rate + shock)) / 12 +
      injections.filter((x) => x.instrument === 'subordinated_loan' && x.relMonth < rel).reduce((a, x) => a + (x.amount * x.subordinatedRate) / 12, 0) +
      (legacy * tr.legacyBorrowingRate) / 12;
    const iiLiquidity = (prevTbills * inputs.liquidity.tbillYield + prevReserve * inputs.liquidity.reserveRemuneration) / 12;

    // operations drivers
    const accounts = op ? accT[rel] : 0;
    const staff = staffMonth(inputs, data.roles, rel);
    const branches = rel >= BRANCH_OPEN_REL ? branchesForYear(inputs, Math.max(1, opYear)) : 0;
    const sites = (rel >= HQ_OPEN_REL ? 1 : 0) + branches;
    const atms = op ? inputs.costs.atms[Math.min(opYear, inputs.costs.atms.length) - 1] ?? 0 : 0;
    const drivers: Drivers = {
      sites, branches, newSites: Math.max(0, sites - prevSites), newBranches: Math.max(0, branches - prevBranches),
      fte: staff.fte, newFte: Math.max(0, staff.fte - prevFte), atms, newAtms: Math.max(0, atms - prevAtms),
      insuredDeposits: deposits * d.insuredShare,
    };
    prevSites = sites; prevBranches = branches; prevAtms = atms; prevFte = staff.fte;

    // operating costs
    const overrun = 1 + st.opexOverrunPct;
    const cat: Record<string, number> = {};
    const add = (k: string, v: number) => { if (v) cat[k] = (cat[k] ?? 0) + v * overrun; };
    add('People', staff.salaryCost + staff.bonus + staff.boardFees + staff.newHireAnnualGross * recruitPct);
    let capexCash = 0, oneOffBase = 0;
    for (const e of costEvents(data.costs, inputs, rel, drivers)) {
      if (e.kind === 'capex') {
        const amt = e.amount * overrun;
        capexCash += amt;
        assets.push({ cost: amt, life: Math.max(1, e.lifeMonths), start: Math.max(i + 1, preOp) });
        if (e.oneOff) oneOffBase += e.amount;
      } else {
        add(e.category, e.amount);
        if (e.oneOff) oneOffBase += e.amount;
      }
    }
    add('Contingency', oneOffBase * contingencyPct);
    add('Technology', cbs.implExpense[i] + cbs.subscriptionExpense[i]);
    const vUsd = visaUsd[i];
    const vEur = fx === null ? 0 : vUsd * fx;
    add('Payments & cards', vEur);
    if (cbs.implCapitalised[i] > 0) intangibles.push({ cost: cbs.implCapitalised[i] * overrun, life: inputs.cbs.amortisationMonths, start: Math.max(i + 1, preOp) });
    const opex = Object.values(cat).reduce((a, v) => a + v, 0);
    // subscription: expense straight-line, cash per billing frequency (difference sits in prepaid/accrued)
    const opexCash = opex - (cbs.subscriptionExpense[i] - cbs.subscriptionCash[i]) * overrun;
    const implCash = cbs.implCapitalised[i] * overrun; // capitalised part paid in cash
    cumSubCash += cbs.subscriptionCash[i] * overrun;
    cumSubExp += cbs.subscriptionExpense[i] * overrun;

    // depreciation & amortisation
    let dep = 0;
    for (const a of [...assets, ...intangibles]) if (i >= a.start && i < a.start + a.life) dep += a.cost / a.life;

    // fees
    const feeIncome = op
      ? accounts * (inputs.fees.accountFeeMonthly + inputs.fees.otherFeePerAccountMonthly) + (accounts * inputs.fees.cardsPerAccount * inputs.fees.cardFeeAnnual) / 12 + feeRecOrig
      : 0;
    const feeCash = feeIncome - feeRecOrig + feeCashOrig;
    deferredFees += feeCashOrig - feeRecOrig;

    const ii = iiLoans + iiLiquidity;
    const ie = depCost + otherIntExp;
    const nii = ii - ie;
    const pbt = nii + feeIncome - opex - dep - provision;
    if (op) giHistory.push(nii + feeIncome);

    // corporate income tax: assessed at each model-year end with loss carry-forward (FIFO, expiry)
    yearPbt += pbt;
    let taxExpense = 0;
    const yearEnd = op ? rel % 12 === 11 : rel === -1;
    if (yearEnd || i === n - 1) {
      const yr = op ? opYear : 0;
      for (let k = lossPool.length - 1; k >= 0; k--) if (yr - lossPool[k].year > inputs.tax.lossCarryForwardYears) lossPool.splice(k, 1);
      if (yearPbt < 0) lossPool.push({ year: yr, amount: -yearPbt });
      else {
        let taxable = yearPbt;
        for (const l of lossPool) { const use = Math.min(l.amount, taxable); l.amount -= use; taxable -= use; }
        taxExpense = taxable * inputs.tax.citRate;
        if (taxExpense > 0) { taxPayable += taxExpense; taxDue.push({ i: i + inputs.tax.paymentLagMonths, amount: taxExpense }); }
      }
      yearPbt = 0;
    }
    let taxPaid = 0;
    for (const t of taxDue) if (t.i === i) taxPaid += t.amount;
    taxPayable -= taxPaid;
    const ni = pbt - taxExpense;
    retained += ni;

    // cash
    const cashPre = cash + injected + subInjected + iiLoans + iiLiquidity + feeCash - ie - opexCash - implCash - capexCash
      - (origG + origL) + repay + (deposits - prevDeposits) - taxPaid;
    let newBorrow = 0;
    const liq = inputs.liquidity;
    const rr = deposits * liq.reserveRequirement;
    if (inputs.wholesale.enabled) {
      const minLiq = rule(inputs, 'R-LIQ')?.value ?? 0;
      const required = deposits * (minLiq + inputs.wholesale.targetLiquidRatioBuffer) + (liq.reserveCountsAsLiquid ? 0 : rr) + liq.minOperatingCash;
      const noBorrow = cashPre - borrow;
      newBorrow = Math.min(inputs.wholesale.maxAmount, Math.max(0, required - noBorrow));
    }
    const prevCash = cash;
    cash = cashPre - borrow + newBorrow;
    const dBorrow = newBorrow - borrow;
    borrow = newBorrow;
    const tbills = liq.tbillShareOfExcess * Math.max(0, cash - rr - liq.minOperatingCash);
    prevTbills = tbills; prevReserve = Math.min(rr, Math.max(0, cash)); prevDeposits = deposits;

    // balance sheet
    const fixedNet = assets.reduce((a, x) => a + x.cost * Math.max(0, 1 - Math.max(0, i - x.start + 1) / x.life), 0);
    const intangNet = intangibles.reduce((a, x) => a + x.cost * Math.max(0, 1 - Math.max(0, i - x.start + 1) / x.life), 0);
    const prepaidNet = cumSubCash - cumSubExp;
    const prepaid = Math.max(0, prepaidNet);
    const accrued = Math.max(0, -prepaidNet);
    const grossLoans = gG + gL;
    const netLoans = grossLoans - allowance;
    const totalAssets = cash + netLoans + fixedNet + intangNet + prepaid;
    const totalLiabilities = deposits + borrow + subDebt + legacy + deferredFees + taxPayable + accrued;
    const equity = shareCapital + retained;

    // regulatory capital
    const cet1 = equity - (inputs.regulatory.deductIntangibles ? intangNet : 0);
    const tier2 = Math.min(subDebt, Math.max(0, cet1) * inputs.capital.tier2CapPctOfTier1);
    const totalCapital = cet1 + tier2;
    const gNet = gG - (op ? goods.allowance[rel] : 0), lNet = gL - (op ? lease.allowance[rel] : 0);
    const rwaCredit = gNet * inputs.products.goods.riskWeight + lNet * inputs.products.leasing.riskWeight +
      (fixedNet + prepaid) * inputs.regulatory.fixedAssetRiskWeight + tbills * inputs.regulatory.tbillRiskWeight;
    const window = giHistory.slice(-36);
    const annualGi = window.length ? (window.reduce((a, v) => a + v, 0) / window.length) * 12 : 0;
    const rwaOp = Math.max(0, annualGi) * inputs.regulatory.operationalRiskAlpha * 12.5;
    const rwa = rwaCredit + rwaOp;
    const liquidAssets = Math.max(0, cash - (liq.reserveCountsAsLiquid ? 0 : rr));

    const cfFinancing = injected + subInjected + dBorrow;
    const cfInvesting = -(capexCash + implCash);
    const cfOperating = cash - prevCash - cfFinancing - cfInvesting;

    months.push({
      i, rel, opYear,
      goodsGross: gG, leasingGross: gL, grossLoans, allowance, netLoans, nplStock: op ? goods.npl[rel] + lease.npl[rel] : 0,
      originationsGoods: origG, originationsLeasing: origL, repayments: repay, writeOffs: wo,
      deposits, borrowings: borrow, legacyBorrowings: legacy, subordinatedDebt: subDebt,
      interestIncomeLoans: iiLoans, interestIncomeLiquidity: iiLiquidity, interestIncome: ii,
      interestExpenseDeposits: depCost, interestExpenseOther: otherIntExp, interestExpense: ie, nii, feeIncome,
      operatingIncome: nii + feeIncome, opex, opexByCategory: cat, depreciation: dep, provisionExpense: provision,
      pbt, taxExpense, netIncome: ni,
      cashTotal: cash, requiredReserve: rr, tbills, fixedAssetsNet: fixedNet, intangiblesNet: intangNet, prepaid, totalAssets,
      deferredFees, taxPayable, totalLiabilities, shareCapital, retainedEarnings: retained, equity,
      balanceDifference: totalAssets - totalLiabilities - equity,
      cet1, tier2, totalCapital, rwaCredit, rwaOperational: rwaOp, rwa,
      car: rwa > 0 ? totalCapital / rwa : null, tier1Ratio: rwa > 0 ? cet1 / rwa : null,
      leverageRatio: totalAssets > 0 ? cet1 / totalAssets : null,
      liquidAssets, liquidityRatio: deposits > 0 ? liquidAssets / deposits : null,
      cfOperating, cfInvesting, cfFinancing, capitalInjected: injected + subInjected,
      accounts, cbsSeats: seatsAt(rel), fte: staff.fte, branches,
      visaUsd: vUsd, visaEur: vEur,
    });
  }

  const years = aggregateYears(months);
  const regulatory = regulatoryTests(inputs, months);
  return {
    inputsName: inputs.name,
    months,
    years,
    regulatory,
    statuses: statuses(inputs, months, years, regulatory),
    capitalAnalysis: capitalAnalysis(inputs, months, years),
    investor: investorView(inputs, months),
    checks: integrityChecks(months, goodsT, leaseT),
    blockers: blockers(inputs, months),
  };
}

// ---------------------------------------------------------------------------------------------------
const FLOW_KEYS = ['originationsGoods', 'originationsLeasing', 'repayments', 'writeOffs', 'interestIncomeLoans', 'interestIncomeLiquidity', 'interestIncome',
  'interestExpenseDeposits', 'interestExpenseOther', 'interestExpense', 'nii', 'feeIncome', 'operatingIncome', 'opex', 'depreciation', 'provisionExpense',
  'pbt', 'taxExpense', 'netIncome', 'cfOperating', 'cfInvesting', 'cfFinancing', 'capitalInjected', 'visaUsd', 'visaEur'] as const;

export function aggregateYears(months: MonthRow[]): YearRow[] {
  const groups = new Map<number, MonthRow[]>();
  for (const mo of months) groups.set(mo.opYear, [...(groups.get(mo.opYear) ?? []), mo]);
  const out: YearRow[] = [];
  let prevEnd: MonthRow | undefined;
  for (const [year, ms] of [...groups.entries()].sort((a, b) => a[0] - b[0])) {
    const end = ms[ms.length - 1];
    const row = { ...end } as unknown as YearRow;
    delete (row as Partial<MonthRow>).i; delete (row as Partial<MonthRow>).rel; delete (row as Partial<MonthRow>).opYear;
    for (const k of FLOW_KEYS) (row as unknown as Record<string, number>)[k] = ms.reduce((a, x) => a + x[k], 0);
    const cat: Record<string, number> = {};
    for (const x of ms) for (const [k, v] of Object.entries(x.opexByCategory)) cat[k] = (cat[k] ?? 0) + v;
    row.opexByCategory = cat;
    row.year = year;
    row.label = year === 0 ? 'Pre-op' : `Y${year}`;
    row.months = ms.length;
    const avg = (a: number, b: number) => (a + b) / 2;
    const startAssets = prevEnd?.totalAssets ?? 0, startEq = prevEnd?.equity ?? 0;
    const avgAssets = avg(startAssets, end.totalAssets);
    const avgEq = avg(startEq, end.equity);
    const avgEarning = avg((prevEnd?.grossLoans ?? 0) + (prevEnd?.tbills ?? 0), end.grossLoans + end.tbills);
    const costs = row.opex + row.depreciation;
    row.roa = year > 0 && avgAssets > 0 ? row.netIncome / avgAssets : null;
    // ROE only when the denominator is reliable: positive equity at both ends and ≥ 4% of average assets
    row.roe = year > 0 && startEq > 0 && end.equity > 0 && avgEq >= 0.04 * avgAssets ? row.netIncome / avgEq : null;
    row.nim = year > 0 && avgEarning > 0 ? row.nii / avgEarning : null;
    row.costToIncome = row.operatingIncome > 0 ? costs / row.operatingIncome : null;
    row.loanToDeposit = end.deposits > 0 ? end.grossLoans / end.deposits : null;
    row.costPerAccount = end.accounts > 0 ? costs / end.accounts : null;
    row.techSpendPerAccount = end.accounts > 0 ? (cat['Technology'] ?? 0) / end.accounts : null;
    out.push(row);
    prevEnd = end;
  }
  return out;
}

function verdictFor(inputs: ModelInputs, r: RegulatoryRule | undefined, worst: number | null, higherIsBetter: boolean, capitalSensitive: boolean): Pick<RegulatoryTest, 'verdict' | 'indicative' | 'reason'> {
  if (!r || r.value === null) return { verdict: 'UNDETERMINED', indicative: 'N/A', reason: 'Threshold not obtained from a verified official source.' };
  if (worst === null) return { verdict: 'UNDETERMINED', indicative: 'N/A', reason: 'Ratio not computable (denominator zero or missing inputs).' };
  const ok = higherIsBetter ? worst >= r.value : worst <= r.value;
  const indicative = ok ? 'ABOVE' : 'BELOW';
  if (r.status !== 'VERIFIED') return { verdict: 'UNDETERMINED', indicative, reason: `Rule status ${r.status}: verify against the official text before any PASS/FAIL.` };
  if (capitalSensitive && !inputs.capital.capitalInputsVerified)
    return { verdict: 'UNDETERMINED', indicative, reason: 'Capital inputs (cash capital, deductions, eligibility) not verified.' };
  return { verdict: ok ? 'PASS' : 'FAIL', indicative, reason: ok ? 'Meets verified threshold in every month.' : 'Breaches verified threshold.' };
}

export function regulatoryTests(inputs: ModelInputs, months: MonthRow[]): RegulatoryTest[] {
  const opm = months.filter((x) => x.rel >= 0);
  const worst = (f: (x: MonthRow) => number | null, higher = true) => {
    let best: { v: number; rel: number } | null = null;
    for (const x of opm) {
      const v = f(x);
      if (v === null) continue;
      if (!best || (higher ? v < best.v : v > best.v)) best = { v, rel: x.rel };
    }
    return best;
  };
  const tests: RegulatoryTest[] = [];
  const push = (ruleId: string, label: string, w: { v: number; rel: number } | null, higher: boolean, capital: boolean) => {
    const r = rule(inputs, ruleId);
    tests.push({ ruleId, label, worstValue: w?.v ?? null, worstRelMonth: w?.rel ?? null, threshold: r?.value ?? null,
      ruleStatus: r?.status ?? 'NOT_OBTAINED', ...verdictFor(inputs, r, w?.v ?? null, higher, capital) });
  };
  const atLicence = months.find((x) => x.rel === -1) ?? months[0];
  push('R-MIN-CAP', 'Paid-in capital before final licence', { v: atLicence.shareCapital, rel: atLicence.rel }, true, true);
  push('R-CAR', 'Total capital adequacy ratio (min over horizon)', worst((x) => x.car), true, true);
  push('R-T1', 'Tier 1 / CET1 ratio (min over horizon)', worst((x) => x.tier1Ratio), true, true);
  push('R-LEV', 'Leverage ratio (min over horizon)', worst((x) => x.leverageRatio), true, true);
  push('R-LIQ', 'Liquid assets / short-term liabilities (min)', worst((x) => x.liquidityRatio), true, false);
  push('R-RES', 'Cash covers minimum reserve (min cash ÷ deposits)', worst((x) => (x.deposits > 0 ? x.cashTotal / x.deposits : null)), true, false);
  push('R-LE', 'Largest single exposure ÷ Tier 1 (max)', worst((x) => (x.cet1 > 0 ? inputs.regulatory.largestSingleExposure / x.cet1 : null), false), false, true);
  return tests;
}

function statuses(inputs: ModelInputs, months: MonthRow[], years: YearRow[], reg: RegulatoryTest[]): ModelResult['statuses'] {
  const op = years.filter((y) => y.year > 0);
  const last = op[op.length - 1];
  const cum = op.reduce((a, y) => a + y.netIncome, 0) + (years.find((y) => y.year === 0)?.netIncome ?? 0);
  const profitability = last.netIncome > 0 && cum > 0
    ? { status: 'PROFITABLE' as const, detail: `Final-year net income €${fmt(last.netIncome)}; cumulative incl. pre-op €${fmt(cum)}.` }
    : last.netIncome <= 0
      ? { status: 'LOSS_MAKING' as const, detail: `Final-year net income €${fmt(last.netIncome)}.` }
      : { status: 'MIXED' as const, detail: `Final year profitable but cumulative result €${fmt(cum)}.` };
  const minCash = months.reduce((a, x) => (x.cashTotal < a.cashTotal ? x : a), months[0]);
  const maxBorrow = Math.max(...months.map((x) => x.borrowings));
  const funding = minCash.cashTotal < -0.5
    ? { status: 'UNFUNDED' as const, detail: `Cash falls to €${fmt(minCash.cashTotal)} in month ${minCash.rel} (relative to go-live). Additional funding required.` }
    : maxBorrow > 0
      ? { status: 'FUNDED_WITH_WHOLESALE' as const, detail: `Requires up to €${fmt(maxBorrow)} of assumed wholesale funding.` }
      : { status: 'FUNDED' as const, detail: 'Cash never negative under these assumptions.' };
  const liqTest = reg.find((t) => t.ruleId === 'R-LIQ')!;
  const resTest = reg.find((t) => t.ruleId === 'R-RES')!;
  const liquidity: { status: Verdict; detail: string } = minCash.cashTotal < 0
    ? { status: 'FAIL', detail: 'Negative cash balance – liquidity impossible regardless of rule thresholds.' }
    : { status: liqTest.verdict === 'PASS' && resTest.verdict === 'PASS' ? 'PASS' : liqTest.verdict === 'FAIL' || resTest.verdict === 'FAIL' ? 'FAIL' : 'UNDETERMINED',
        detail: `Min liquidity ratio ${pct(liqTest.worstValue)} (indicative ${liqTest.indicative}); ${liqTest.reason}` };
  const anyFail = reg.some((t) => t.verdict === 'FAIL');
  const allPass = reg.every((t) => t.verdict === 'PASS');
  const negEquity = months.some((x) => x.rel >= 0 && x.equity < 0);
  const regulatory: { status: Verdict; detail: string } = negEquity
    ? { status: 'FAIL', detail: 'Equity becomes negative.' }
    : anyFail ? { status: 'FAIL', detail: 'At least one verified rule is breached.' }
      : allPass ? { status: 'PASS', detail: 'All rules verified and met.' }
        : { status: 'UNDETERMINED', detail: `${reg.filter((t) => t.verdict === 'UNDETERMINED').length} of ${reg.length} tests undetermined (unverified rules or inputs). Indicative shortfalls: ${reg.filter((t) => t.indicative === 'BELOW').map((t) => t.ruleId).join(', ') || 'none'}.` };
  void inputs;
  return { profitability, funding, liquidity, regulatory };
}

function capitalAnalysis(inputs: ModelInputs, months: MonthRow[], years: YearRow[]): ModelResult['capitalAnalysis'] {
  const minCash = months.reduce((a, x) => (x.cashTotal < a.cashTotal ? x : a), months[0]);
  const op = months.filter((x) => x.rel >= 0);
  const shortfall = (target: number) => Math.max(0, ...op.map((x) => target * x.rwa - x.totalCapital));
  const minCar = rule(inputs, 'R-CAR')?.value ?? null;
  const toTarget = shortfall(inputs.capital.targetCar);
  const be = op.find((x) => x.netIncome > 0);
  let cum = 0, wasNeg = false, cumBe: number | null = null;
  for (const x of months) {
    cum += x.netIncome;
    if (cum < 0) wasNeg = true;
    if (wasNeg && cum >= 0 && cumBe === null && x.rel >= 0) cumBe = x.rel;
  }
  return {
    minCashRelMonth: minCash.rel,
    minCash: minCash.cashTotal,
    cashShortfall: Math.max(0, -minCash.cashTotal),
    capitalShortfallToTarget: toTarget,
    capitalShortfallToMinimum: minCar === null ? null : shortfall(minCar),
    additionalEquityIndicated: Math.max(Math.max(0, -minCash.cashTotal), toTarget),
    breakEvenMonthlyRel: be?.rel ?? null,
    breakEvenCumulativeRel: cumBe,
    firstProfitableYear: years.find((y) => y.year > 0 && y.netIncome > 0)?.year ?? null,
  };
}

export function irr(flows: number[]): number | null {
  if (!flows.some((f) => f < 0) || !flows.some((f) => f > 0)) return null;
  const npv = (r: number) => flows.reduce((a, f, t) => a + f / Math.pow(1 + r, t), 0);
  let lo = -0.99, hi = 1;
  if (npv(lo) * npv(hi) > 0) return null;
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    if (npv(lo) * npv(mid) <= 0) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}

function investorView(inputs: ModelInputs, months: MonthRow[]): ModelResult['investor'] {
  const end = months[months.length - 1];
  const flows = months.map((x) => -x.capitalInjected);
  const exitEquityValue = Math.max(0, end.equity) * inputs.valuation.exitPriceToBook + end.subordinatedDebt;
  flows[flows.length - 1] += exitEquityValue;
  const mIrr = irr(flows);
  const mCoe = Math.pow(1 + inputs.valuation.costOfEquity, 1 / 12) - 1;
  const npv = flows.reduce((a, f, t) => a + f / Math.pow(1 + mCoe, t), 0);
  // cap table
  const holders = new Map<string, number>([[inputs.capital.existingShareholderLabel, 1]]);
  const capTable: CapTableRow[] = [];
  let equityRaised = 0;
  for (const inj of [...inputs.capital.injections].filter((x) => x.enabled && x.instrument === 'ordinary_equity').sort((a, b) => a.relMonth - b.relMonth)) {
    if (inj.investor === 'new_investor') {
      const pre = inj.preMoneyValuation ?? equityRaised;
      const share = pre + inj.amount > 0 ? inj.amount / (pre + inj.amount) : 0;
      for (const [k, v] of holders) holders.set(k, v * (1 - share));
      holders.set(inj.label, (holders.get(inj.label) ?? 0) + share);
    }
    equityRaised += inj.amount;
    capTable.push({ afterInjectionId: inj.id, relMonth: inj.relMonth, holders: [...holders.entries()].map(([holder, ownership]) => ({ holder, ownership })) });
  }
  return { irr: mIrr === null ? null : Math.pow(1 + mIrr, 12) - 1, npv, exitEquityValue, capTable };
}

function integrityChecks(months: MonthRow[], goodsT: number[], leaseT: number[]): ModelResult['checks'] {
  const maxDiff = Math.max(...months.map((x) => Math.abs(x.balanceDifference)));
  const finite = months.every((x) => Object.values(x).every((v) => typeof v !== 'number' || Number.isFinite(v)));
  const cfSum = months.reduce((a, x) => a + x.cfOperating + x.cfInvesting + x.cfFinancing, 0);
  const op = months.filter((x) => x.rel >= 0);
  let targetMiss = 0;
  for (const x of op) {
    if (x.rel % 12 !== 11) continue;
    targetMiss = Math.max(targetMiss, Math.max(0, goodsT[x.rel] - x.goodsGross), Math.max(0, leaseT[x.rel] - x.leasingGross));
  }
  const totOrig = op.reduce((a, x) => a + x.originationsGoods + x.originationsLeasing, 0);
  const stockChange = (op[op.length - 1]?.grossLoans ?? 0) - 0;
  return [
    { id: 'balance_sheet_identity', passed: maxDiff < 0.01, detail: `max |assets − liabilities − equity| = ${maxDiff.toExponential(2)} EUR` },
    { id: 'all_values_finite', passed: finite, detail: finite ? 'no NaN/∞' : 'non-finite value detected' },
    { id: 'cash_flow_reconciles', passed: Math.abs(cfSum - months[months.length - 1].cashTotal) < 0.01, detail: `Σ cash flows = ${fmt(cfSum)}; closing cash = ${fmt(months[months.length - 1].cashTotal)}` },
    { id: 'year_end_targets_met', passed: targetMiss < 1, detail: `max year-end shortfall vs management stock targets: €${fmt(targetMiss)}` },
    { id: 'originations_exceed_stock_change', passed: totOrig >= stockChange - 0.01, detail: `Σ originations €${fmt(totOrig)} vs stock change €${fmt(stockChange)} (repayments make them differ)` },
  ];
}

function blockers(inputs: ModelInputs, months: MonthRow[]): Blocker[] {
  const b: Blocker[] = [
    { code: 'OPENING_BALANCE_SHEET_UNAVAILABLE', severity: 'BLOCKING', message: 'No audited opening balance sheet of Pro Finance Home. The model starts the bank from zero plus explicit capital/transfer assumptions; results are illustrative.' },
    { code: 'LEGAL_ROUTE_UNRESOLVED', severity: 'BLOCKING', message: 'NBFI-to-bank conversion route (same entity vs new bank) not confirmed by CBK/legal counsel.' },
  ];
  if (!inputs.capital.injections.some((x) => x.enabled)) b.push({ code: 'NO_CAPITAL_INJECTION', severity: 'BLOCKING', message: 'No capital injection enabled. Nominal share capital (€11.4m) is NOT treated as cash.' });
  if (!inputs.capital.capitalInputsVerified) b.push({ code: 'CAPITAL_INPUTS_UNVERIFIED', severity: 'BLOCKING', message: 'Cash capital, eligibility and deductions are assumptions, not verified figures.' });
  const unverified = inputs.regulatory.rules.filter((r) => r.status !== 'VERIFIED');
  if (unverified.length) b.push({ code: 'RULES_UNVERIFIED', severity: 'BLOCKING', message: `${unverified.length} regulatory thresholds not verified against current official texts: ${unverified.map((r) => r.id).join(', ')}.` });
  if (inputs.visa.enabled && inputs.fx.eurPerUsd === null) b.push({ code: 'FX_MISSING', severity: 'WARNING', message: 'Visa costs are in USD and no EUR/USD rate was entered: card costs are EXCLUDED from EUR statements.' });
  if (inputs.visa.enabled && inputs.visa.variableFeePerCardMonthlyUsd === null) b.push({ code: 'VISA_VARIABLE_FEES_UNPRICED', severity: 'WARNING', message: 'Scheme/processing variable fees, acquiring platform and fraud tooling are unpriced.' });
  if (inputs.cbs.billingTrigger === 'go_live') b.push({ code: 'CBS_BILLING_START_ASSUMED', severity: 'INFO', message: 'Subscription billing assumed to start at go-live; contract terms unknown.' });
  if (!inputs.goLiveDate) b.push({ code: 'GO_LIVE_DATE_NOT_SET', severity: 'INFO', message: 'No calendar go-live date: periods are relative (Pre-op, Y1…Y10).' });
  if (inputs.islamic.enabled) b.push({ code: 'ISLAMIC_FRAMEWORK_UNCONFIRMED', severity: 'WARNING', message: 'Islamic window/products not confirmed as permissible under the current law; tax neutrality not established.' });
  if (inputs.openingTransfer.enabled) b.push({ code: 'TRANSFER_PORTFOLIO_UNVERIFIED', severity: 'WARNING', message: 'Transferred NBFI portfolio and legacy liabilities are unverified assumptions.' });
  if (months.some((x) => x.cashTotal < -0.5)) b.push({ code: 'NEGATIVE_CASH', severity: 'BLOCKING', message: 'Cash becomes negative: the plan is not funded under these assumptions.' });
  return b;
}

export function fmt(v: number): string {
  return Math.round(v).toLocaleString('en-US');
}
function pct(v: number | null): string {
  return v === null ? 'n/a' : `${(v * 100).toFixed(1)}%`;
}
