// Facilization core-banking offer (23-Oct-2026): implementation milestones, subscription billing and accounting.
import type { CbsInputs } from './types';

export const FACILIZATION_OFFER = {
  date: '2026-10-23',
  validUntil: '2026-11-30',
  currency: 'EUR',
  vat: 'excluded',
  implementation: { low: 450_000, high: 520_000 },
  annualSubscription: { low: 1_000_000, high: 1_100_000 },
  quotedFiveYearTotal: { low: 5_400_000, high: 6_100_000 },
  termYears: 5,
} as const;

export function cbsAmounts(c: CbsInputs) {
  const pick = (r: { low: number; high: number }) =>
    c.case === 'low' ? r.low : c.case === 'high' ? r.high : (r.low + r.high) / 2;
  return {
    implementation: c.implementationOverride ?? pick(FACILIZATION_OFFER.implementation),
    annualSubscription: c.annualSubscriptionOverride ?? pick(FACILIZATION_OFFER.annualSubscription),
  };
}

/** Arithmetic reconciliation of the vendor's quoted 5-year total. Flags, never "fixes", the quote. */
export function reconcileFiveYearQuote() {
  const o = FACILIZATION_OFFER;
  const low = o.implementation.low + o.termYears * o.annualSubscription.low;
  const high = o.implementation.high + o.termYears * o.annualSubscription.high;
  return {
    computedLow: low,
    computedHigh: high,
    quotedLow: o.quotedFiveYearTotal.low,
    quotedHigh: o.quotedFiveYearTotal.high,
    differenceLow: o.quotedFiveYearTotal.low - low,
    differenceHigh: o.quotedFiveYearTotal.high - high,
    flags: [
      low !== o.quotedFiveYearTotal.low && `Low end: 450k + 5×1.0m = €${(low / 1e6).toFixed(2)}m vs quoted €5.4m (rounded)`,
      high !== o.quotedFiveYearTotal.high && `High end: 520k + 5×1.1m = €${(high / 1e6).toFixed(2)}m vs quoted €6.1m`,
    ].filter(Boolean) as string[],
    note: 'The quoted 5-year total is a reference only and is never added to implementation or subscription costs.',
  };
}

export function billingStartRel(c: CbsInputs): number {
  if (c.billingTrigger === 'go_live') return 0;
  if (c.billingTrigger === 'contract_signing') return c.contractSigningRelMonth;
  return c.customBillingStartRelMonth;
}

export interface CbsSchedule {
  implCash: number[];
  implExpense: number[];
  implCapitalised: number[];
  subscriptionCash: number[];
  subscriptionExpense: number[];
}

/**
 * Builds month-indexed (timeline index) schedules. `relOf(i)` maps index → month relative to go-live.
 * Subscription service is recognised straight-line from the billing start; cash follows the billing frequency.
 */
export function cbsSchedule(c: CbsInputs, n: number, relOf: (i: number) => number, vatGross: number): CbsSchedule {
  const { implementation, annualSubscription } = cbsAmounts(c);
  const s: CbsSchedule = {
    implCash: Array(n).fill(0), implExpense: Array(n).fill(0), implCapitalised: Array(n).fill(0),
    subscriptionCash: Array(n).fill(0), subscriptionExpense: Array(n).fill(0),
  };
  const idxOf = (rel: number) => Math.min(n - 1, Math.max(0, rel - relOf(0)));
  const pctTotal = c.milestones.reduce((a, m) => a + m.pct, 0) || 1;
  for (const m of c.milestones) {
    const amt = (implementation * m.pct) / pctTotal * vatGross;
    const i = idxOf(m.relMonth);
    s.implCash[i] += amt;
    s.implCapitalised[i] += amt * c.capitalisedImplementationPct;
    s.implExpense[i] += amt * (1 - c.capitalisedImplementationPct);
  }
  const start = billingStartRel(c);
  const period = c.billingFrequency === 'monthly' ? 1 : c.billingFrequency === 'quarterly' ? 3 : 12;
  for (let i = 0; i < n; i++) {
    const rel = relOf(i);
    const k = rel - start;
    if (k < 0) continue;
    if (!c.renewAfterTerm && k >= c.termMonths) continue;
    const contractYear = Math.floor(k / 12);
    const monthly = (annualSubscription * Math.pow(1 + c.annualEscalation, contractYear) / 12) * vatGross;
    s.subscriptionExpense[i] = monthly;
    if (k % period === 0) {
      // invoice covers the next `period` months at the rate applicable to each covered month
      let billed = 0;
      for (let j = 0; j < period; j++) {
        const kk = k + j;
        if (!c.renewAfterTerm && kk >= c.termMonths) break;
        billed += (annualSubscription * Math.pow(1 + c.annualEscalation, Math.floor(kk / 12)) / 12) * vatGross;
      }
      s.subscriptionCash[i] = billed;
    }
  }
  return s;
}
