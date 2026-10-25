// Renders language-neutral engine messages (codes + params) in the active language.
import type { Blocker, MessageParams, ModelResult, RegulatoryTest } from '../engine';
import { eur, eurM, pct } from './format';
import { translate, translateCode, useI18n, type Lang, type Params } from './i18n';

export const STATUS_TEMPLATES: Record<string, string> = {
  PROFITABLE: 'Final-year net income {finalNi}; cumulative incl. pre-op {cum}.',
  LOSS_MAKING: 'Final-year net income {finalNi}.',
  MIXED: 'Final year profitable but cumulative result {cum}.',
  UNFUNDED: 'Cash falls to {minCash} in month {month} (relative to go-live). Additional funding required.',
  FUNDED_WITH_WHOLESALE: 'Requires up to {maxBorrow} of assumed wholesale funding.',
  FUNDED: 'Cash never negative under these assumptions.',
  NEGATIVE_CASH: 'Negative cash balance – liquidity impossible regardless of rule thresholds.',
  RATIO: 'Min liquidity ratio {minRatio} (indicative {indicative}); {reason}',
  NEGATIVE_EQUITY: 'Equity becomes negative.',
  VERIFIED_BREACH: 'At least one verified rule is breached.',
  ALL_PASS: 'All rules verified and met.',
  UNDETERMINED: '{undetermined} of {total} tests undetermined (unverified rules or inputs). Indicative shortfalls: {shortfalls}.',
};

export const REASON_TEMPLATES: Record<RegulatoryTest['reasonCode'], string> = {
  NO_THRESHOLD: 'Threshold not obtained from a verified official source.',
  NOT_COMPUTABLE: 'Ratio not computable (denominator zero or missing inputs).',
  RULE_UNVERIFIED: 'Rule status {status}: verify against the official text before any PASS/FAIL.',
  CAPITAL_UNVERIFIED: 'Capital inputs (cash capital, deductions, eligibility) not verified.',
  MEETS: 'Meets verified threshold in every month.',
  BREACHES: 'Breaches verified threshold.',
};

export const BLOCKER_TEMPLATES: Record<string, string> = {
  OPENING_BALANCE_SHEET_UNAVAILABLE: 'No audited opening balance sheet of Pro Finance Home. The model starts the bank from zero plus explicit capital/transfer assumptions; results are illustrative.',
  LEGAL_ROUTE_UNRESOLVED: 'NBFI-to-bank conversion route (same entity vs new bank) not confirmed by CBK/legal counsel.',
  NO_CAPITAL_INJECTION: 'No capital injection enabled. Nominal share capital (€11.4m) is NOT treated as cash.',
  CAPITAL_INPUTS_UNVERIFIED: 'Cash capital, eligibility and deductions are assumptions, not verified figures.',
  RULES_UNVERIFIED: '{count} regulatory thresholds not verified against current official texts: {rules}.',
  FX_MISSING: 'Visa costs are in USD and no EUR/USD rate was entered: card costs are EXCLUDED from EUR statements.',
  VISA_VARIABLE_FEES_UNPRICED: 'Scheme/processing variable fees, acquiring platform and fraud tooling are unpriced.',
  CBS_BILLING_START_ASSUMED: 'Subscription billing assumed to start at go-live; contract terms unknown.',
  GO_LIVE_DATE_NOT_SET: 'No calendar go-live date: periods are relative (Pre-op, Y1…Y10).',
  ISLAMIC_FRAMEWORK_UNCONFIRMED: 'Islamic window/products not confirmed as permissible under the current law; tax neutrality not established.',
  TRANSFER_PORTFOLIO_UNVERIFIED: 'Transferred NBFI portfolio and legacy liabilities are unverified assumptions.',
  NEGATIVE_CASH: 'Cash becomes negative: the plan is not funded under these assumptions.',
};

export const CHECK_LABELS: Record<string, [string, string]> = {
  balance_sheet_identity: ['Balance sheet identity', 'max |assets − liabilities − equity| = {maxDiff} EUR'],
  all_values_finite: ['All values finite', 'no NaN/∞ values'],
  cash_flow_reconciles: ['Cash flow reconciles', 'Σ cash flows = {cfSum}; closing cash = {closing}'],
  year_end_targets_met: ['Year-end management targets met', 'max year-end shortfall vs management stock targets: {targetMiss}'],
  originations_exceed_stock_change: ['Originations exceed stock change', 'Σ originations {totOrig} vs stock change {stockChange} (repayments make them differ)'],
};

const MONEY = new Set(['finalNi', 'cum', 'minCash', 'maxBorrow', 'cfSum', 'closing', 'targetMiss', 'totOrig', 'stockChange']);

/** Pure message renderer for a language (usable outside React, e.g. in exports). */
export function makeMessages(lang: Lang) {
  const t = (k: string, p?: Params) => translate(lang, k, p);
  const tc = (c: string) => translateCode(lang, c);
  const fmtParams = (p: MessageParams) => Object.fromEntries(Object.entries(p).map(([k, v]) => [k,
    typeof v === 'number' ? (MONEY.has(k) ? eur(v) : k === 'minRatio' ? pct(v) : k === 'maxDiff' ? v.toExponential(2) : String(v))
      : k === 'indicative' && v ? tc(String(v)) : k === 'shortfalls' ? (v || t('none')) : v]));
  const reason = (r: Pick<RegulatoryTest, 'reasonCode' | 'ruleStatus'>) => t(REASON_TEMPLATES[r.reasonCode], { status: tc(r.ruleStatus) });
  const status = (s: ModelResult['statuses'][keyof ModelResult['statuses']]) => {
    const tpl = STATUS_TEMPLATES[s.code];
    if (!tpl) return s.detail;
    const p = fmtParams(s.params);
    if (s.code === 'RATIO') p.reason = reason({ reasonCode: s.params.reasonCode as RegulatoryTest['reasonCode'], ruleStatus: 'REPORTED_UNVERIFIED' });
    return t(tpl, p);
  };
  const blocker = (b: Blocker) => (BLOCKER_TEMPLATES[b.code] ? t(BLOCKER_TEMPLATES[b.code], b.params ?? {}) : b.message);
  const check = (c: ModelResult['checks'][number]) => {
    const [label, tpl] = CHECK_LABELS[c.id] ?? [c.id, c.detail];
    return { label: t(label), detail: t(tpl, fmtParams(c.params)) };
  };
  const testLabel = (label: string) => t(label);
  return { status, reason, blocker, check, testLabel, eurM };
}

export function useMessages() {
  return makeMessages(useI18n().lang);
}
