// Visa / card programme costs from the informal Visa country-contact message (USD, non-binding).
// Source currency is preserved; conversion to EUR happens only with an explicit FX input.
import type { VisaInputs } from './types';

type Range = [number, number];
export const VISA_ESTIMATES_USD = {
  issuingLicence: { principal: [80_000, 80_000] as Range, affiliate: [50_000, 50_000] as Range },
  acquiringLicence: { principal: [125_000, 125_000] as Range, affiliate: [50_000, 50_000] as Range },
  quarterlyFixed: 5_000,
  projectMonthlyFirst5: 2_500,
  projectMonthlyAfter5: 5_000,
  configuration: 5_000,
  binFee: [1_500, 3_000] as Range,
  issuerProcessor: [50_000, 200_000] as Range,
  cardManagement: [50_000, 200_000] as Range,
  gateway: [20_000, 100_000] as Range,
  cardProduction: [10_000, 50_000] as Range,
  unpriced: ['Acquiring platform (large-scale)', 'Fraud / risk tooling', 'Variable scheme & transaction fees', 'POS terminals', 'Sponsorship fees (affiliate)'],
} as const;

/** Package illustrative totals, kept verbatim for reconciliation (USD). */
export const PACKAGE_ILLUSTRATIVE_TOTALS = {
  issuingAffiliate: [234_000, 575_500],
  issuingPrincipal: [264_000, 605_500],
  issuingAcquiringPrincipal: [409_000, 829_500],
} as const;

const pick = (r: Range, p: VisaInputs['rangePoint']) => (p === 'low' ? r[0] : p === 'high' ? r[1] : (r[0] + r[1]) / 2);

export function projectFees(months: number): number {
  let total = 0;
  for (let m = 1; m <= months; m++) total += m <= 5 ? VISA_ESTIMATES_USD.projectMonthlyFirst5 : VISA_ESTIMATES_USD.projectMonthlyAfter5;
  return total;
}

export interface VisaLine { id: string; label: string; usd: number; timing: 'one_time' | 'monthly_project' | 'quarterly' }

/** First-year cost lines in USD for a configuration. */
export function visaLines(v: VisaInputs): VisaLine[] {
  if (!v.enabled || (!v.issuing && !v.acquiring)) return [];
  const p = v.rangePoint;
  const e = VISA_ESTIMATES_USD;
  const lines: VisaLine[] = [];
  if (v.issuing) {
    lines.push({ id: 'issuing_licence', label: `Visa issuing ${v.membership} licence`, usd: pick(e.issuingLicence[v.membership], p), timing: 'one_time' });
    lines.push({ id: 'issuer_processor', label: 'Issuer processor set-up & certification', usd: pick(e.issuerProcessor, p), timing: 'one_time' });
    if (!v.cardManagementIncludedElsewhere)
      lines.push({ id: 'card_management', label: 'Card management / issuing platform', usd: pick(e.cardManagement, p), timing: 'one_time' });
    lines.push({ id: 'card_production', label: 'Card production set-up & initial plastic', usd: pick(e.cardProduction, p), timing: 'one_time' });
  }
  if (v.acquiring) {
    lines.push({ id: 'acquiring_licence', label: `Visa acquiring ${v.membership} licence`, usd: pick(e.acquiringLicence[v.membership], p), timing: 'one_time' });
    lines.push({ id: 'gateway', label: 'E-commerce payment gateway', usd: pick(e.gateway, p), timing: 'one_time' });
  }
  if (v.includeConfiguration) lines.push({ id: 'configuration', label: 'Configuration fee (may not apply)', usd: e.configuration, timing: 'one_time' });
  lines.push({ id: 'bin', label: `BIN fee × ${v.bins}`, usd: pick(e.binFee, p) * v.bins, timing: 'one_time' });
  lines.push({ id: 'project', label: `Visa project fees (${v.projectMonths} months)`, usd: projectFees(v.projectMonths), timing: 'monthly_project' });
  // one quarterly fixed fee per institution (not per licence) – assumption flagged in the UI
  lines.push({ id: 'quarterly_fixed', label: 'Quarterly fixed fee (first 12 months)', usd: 4 * e.quarterlyFixed, timing: 'quarterly' });
  return lines;
}

export function illustrativeTotal(v: VisaInputs): number {
  return visaLines(v).reduce((a, l) => a + l.usd, 0);
}

export function reconcilePackageTotals() {
  const base: VisaInputs = { enabled: true, issuing: true, acquiring: false, membership: 'affiliate', rangePoint: 'low', startRelMonth: 0,
    projectMonths: 12, includeConfiguration: true, bins: 1, cardManagementIncludedElsewhere: false, variableFeePerCardMonthlyUsd: null };
  const calc = (o: Partial<VisaInputs>) => [illustrativeTotal({ ...base, ...o, rangePoint: 'low' }), illustrativeTotal({ ...base, ...o, rangePoint: 'high' })];
  const rows = [
    { scenario: 'Issuing Affiliate', computed: calc({}), packageFigure: PACKAGE_ILLUSTRATIVE_TOTALS.issuingAffiliate },
    { scenario: 'Issuing Principal', computed: calc({ membership: 'principal' }), packageFigure: PACKAGE_ILLUSTRATIVE_TOTALS.issuingPrincipal },
    { scenario: 'Issuing + Acquiring Principal', computed: calc({ membership: 'principal', acquiring: true }), packageFigure: PACKAGE_ILLUSTRATIVE_TOTALS.issuingAcquiringPrincipal },
  ];
  return rows.map((r) => ({
    ...r,
    matches: r.computed[0] === r.packageFigure[0] && r.computed[1] === r.packageFigure[1],
    note: r.computed[1] !== r.packageFigure[1]
      ? `Package states USD ${r.packageFigure[1].toLocaleString('en')} but its own components sum to USD ${r.computed[1].toLocaleString('en')} (difference ${(r.packageFigure[1] - r.computed[1]).toLocaleString('en')}). Flagged, not altered.`
      : 'Reconciles.',
  }));
}

/** Monthly USD schedule on the model timeline (index → USD). Recurring quarterly fee continues for the whole horizon. */
export function visaScheduleUsd(v: VisaInputs, n: number, relOf: (i: number) => number, activeCards: (i: number) => number): number[] {
  const out = Array(n).fill(0);
  if (!v.enabled || (!v.issuing && !v.acquiring)) return out;
  const lines = visaLines(v);
  for (let i = 0; i < n; i++) {
    const k = relOf(i) - v.startRelMonth;
    if (k < 0) continue;
    if (k === 0) out[i] += lines.filter((l) => l.timing === 'one_time').reduce((a, l) => a + l.usd, 0);
    if (k < v.projectMonths) out[i] += k < 5 ? VISA_ESTIMATES_USD.projectMonthlyFirst5 : VISA_ESTIMATES_USD.projectMonthlyAfter5;
    if (k % 3 === 0) out[i] += VISA_ESTIMATES_USD.quarterlyFixed;
    if (v.variableFeePerCardMonthlyUsd !== null) out[i] += v.variableFeePerCardMonthlyUsd * activeCards(i);
  }
  return out;
}
