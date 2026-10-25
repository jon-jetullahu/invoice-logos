// Generic establishment and operating costs driven by research/cost_database.csv.
import type { Case, ModelInputs } from './types';

export interface CostRow {
  cost_id: string;
  category: string;
  item: string;
  currency: string;
  low: string;
  base: string;
  high: string;
  basis: string;
  start_month_rel_golive: string;
  end_month_rel_golive: string;
  accounting: string;
  useful_life_months: string;
  engine_module: string;
  vat_irrecoverable: string;
  islamic_only: string;
  enabled_default: string;
  source_type: string;
  confidence: string;
  notes: string;
}

export interface Drivers {
  sites: number;
  branches: number;
  newSites: number;
  newBranches: number;
  fte: number;
  newFte: number;
  atms: number;
  newAtms: number;
  insuredDeposits: number;
}

export interface CostEvent {
  costId: string;
  category: string;
  amount: number;
  kind: 'opex' | 'capex';
  lifeMonths: number;
  oneOff: boolean;
}

export function costValue(row: CostRow, c: Case, overrides: Record<string, number>): number {
  if (overrides[row.cost_id] !== undefined) return overrides[row.cost_id];
  const v = Number(row[c] || row.base || 0);
  return Number.isFinite(v) ? v : 0;
}

export function isActive(row: CostRow, inputs: ModelInputs): boolean {
  if (row.engine_module !== 'generic') return false;
  if (inputs.costs.disabled.includes(row.cost_id)) return false;
  if (row.islamic_only === 'Y') return inputs.islamic.enabled;
  return row.enabled_default === 'Y' || inputs.costs.overrides[row.cost_id] !== undefined;
}

/** Cost events for one month. `rel` is relative to go-live; inflation applies to recurring items from go-live. */
export function costEvents(rows: CostRow[], inputs: ModelInputs, rel: number, d: Drivers): CostEvent[] {
  const out: CostEvent[] = [];
  const yearIdx = rel < 0 ? 0 : Math.floor(rel / 12);
  const infl = Math.pow(1 + inputs.costs.costInflation, yearIdx);
  for (const row of rows) {
    if (!isActive(row, inputs) || row.basis === 'pct_one_off' || row.basis === 'pct_new_hire_annual_gross') continue;
    const start = row.start_month_rel_golive === '' ? null : Number(row.start_month_rel_golive);
    const end = row.end_month_rel_golive === '' ? null : Number(row.end_month_rel_golive);
    if (end !== null && rel > end) continue;
    const started = start === null || rel >= start;
    const v = costValue(row, inputs.costs.case, inputs.costs.overrides);
    const vat = row.vat_irrecoverable === 'Y' ? 1 + inputs.costs.irrecoverableVatRate : 1;
    const kind: 'opex' | 'capex' = row.accounting === 'capex' ? 'capex' : 'opex';
    const life = Number(row.useful_life_months || 0);
    let amt = 0;
    let oneOff = false;
    switch (row.basis) {
      case 'one_time':
        if (rel === (start ?? 0)) { amt = v; oneOff = true; }
        break;
      case 'annual':
        if (started) amt = (v / 12) * infl;
        break;
      case 'monthly':
        if (started) amt = v * infl;
        break;
      case 'per_site_monthly':
        if (started) amt = v * d.sites * infl;
        break;
      case 'per_site_one_time':
        amt = v * d.newSites; oneOff = rel < 0;
        break;
      case 'per_branch_monthly':
        if (started) amt = v * d.branches * infl;
        break;
      case 'per_branch_one_time':
        amt = v * d.newBranches; oneOff = rel < 0;
        break;
      case 'per_hq_m2_monthly':
        if (started) amt = v * inputs.costs.hqM2 * infl;
        break;
      case 'per_hq_m2_one_time':
        if (rel === (start ?? 0)) { amt = v * inputs.costs.hqM2; oneOff = true; }
        break;
      case 'per_fte_one_time':
        amt = v * d.newFte; oneOff = rel < 0;
        break;
      case 'per_fte_monthly':
        if (started) amt = v * d.fte * infl;
        break;
      case 'per_fte_annual':
        if (started) amt = (v / 12) * d.fte * infl;
        break;
      case 'per_atm_one_time':
        amt = v * d.newAtms;
        break;
      case 'per_atm_annual':
        if (started) amt = (v / 12) * d.atms * infl;
        break;
      case 'pct_insured_deposits_annual':
        if (started) amt = (v / 12) * d.insuredDeposits;
        break;
      default:
        break;
    }
    if (amt !== 0) out.push({ costId: row.cost_id, category: row.category, amount: amt * vat, kind, lifeMonths: life, oneOff });
  }
  return out;
}

export function rowById(rows: CostRow[], id: string): CostRow | undefined {
  return rows.find((r) => r.cost_id === id);
}
