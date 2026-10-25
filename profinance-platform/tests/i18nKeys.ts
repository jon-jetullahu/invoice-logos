// Collects every string the UI passes through t()/tc(), so tests can prove the Albanian dictionary is complete.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ASSUMPTIONS, DEFAULT_RULES, managementBase, runModel, STRESS_LIBRARY, TRACE, VISA_ESTIMATES_USD, reconcilePackageTotals } from '../src/engine';
import { BLOCKER_TEMPLATES, CHECK_LABELS, REASON_TEMPLATES, STATUS_TEMPLATES } from '../src/app/messages';
import { MODULES, PRESETS } from '../src/app/nav';
import { PHASES } from '../src/app/modules/regulatory';
import { STATEMENT_LINES, VISA_LINE_LABELS } from '../src/app/modules/finance';
import { DATA } from '../src/app/data';

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
}

/** Literal first arguments of t('…') calls in the UI source. */
export function literalKeys(): string[] {
  const keys = new Set<string>();
  for (const f of walk(join(__dirname, '../src/app')).filter((x) => x.endsWith('.tsx') || x.endsWith('.ts'))) {
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(/\bt\(\s*(['"])((?:\\.|(?!\1).)*)\1\s*[,)]/g)) keys.add(m[2].replace(/\\(['"])/g, '$1'));
  }
  return [...keys];
}

/** Strings translated dynamically (labels from engine/research tables). */
export function dynamicKeys(): string[] {
  const r = runModel(managementBase());
  const col = (rows: Record<string, string>[], k: string) => rows.map((x) => x[k]).filter(Boolean);
  return [
    ...MODULES.flatMap((m) => [m.label, m.group]), ...Object.keys(PRESETS),
    ...ASSUMPTIONS.flatMap((a) => [a.group, a.label, a.note].filter(Boolean)),
    ...STRESS_LIBRARY.map((s) => s.label), ...DEFAULT_RULES.flatMap((x) => [x.label, x.source]),
    ...r.regulatory.map((x) => x.label), ...Object.values(TRACE).map((x) => x.formula),
    ...PHASES.map((p) => p.label), ...STATEMENT_LINES, ...Object.values(VISA_LINE_LABELS), ...VISA_ESTIMATES_USD.unpriced,
    ...reconcilePackageTotals().map((x) => x.scenario),
    ...Object.values(STATUS_TEMPLATES), ...Object.values(REASON_TEMPLATES), ...Object.values(BLOCKER_TEMPLATES), ...Object.values(CHECK_LABELS).flat(),
    ...Object.keys(r.years[1].opexByCategory), ...col(DATA.roles, 'department'),
    ...col(DATA.roles, 'cbk_prior_approval_expected'), ...col(DATA.roles, 'independence'), ...col(DATA.roles, 'outsourceable'),
    ...col(DATA.costs, 'category'), ...col(DATA.costs, 'basis'), ...col(DATA.costs, 'accounting'), ...col(DATA.costs, 'engine_module'),
    ...col(DATA.requirements, 'category'), ...col(DATA.requirements, 'stage'), ...col(DATA.coverage, 'gap_note'),
    ...col(DATA.historical, 'metric_id'), ...col(DATA.salaryEvidence, 'gross_or_net'), ...col(DATA.assumptionRegister, 'blocking_if_missing'),
    ...managementBase().capital.injections.flatMap((x) => [x.label, x.note]), managementBase().capital.existingShareholderLabel,
    'Admin', 'Finance', 'Risk/Compliance', 'Management Viewer',
  ];
}

/** Codes rendered through tc(). */
export function codeKeys(): string[] {
  const col = (rows: Record<string, string>[], k: string) => rows.map((x) => x[k]).filter(Boolean);
  return [
    'PASS', 'FAIL', 'UNDETERMINED', 'INFO', 'ABOVE', 'BELOW', 'N/A', 'BLOCKING', 'WARNING', 'PROFITABLE', 'LOSS_MAKING', 'MIXED', 'FUNDED', 'UNFUNDED', 'FUNDED_WITH_WHOLESALE',
    'VERIFIED', 'REPORTED_UNVERIFIED', 'HISTORICAL_UNVERIFIED', 'NOT_OBTAINED', 'LOW', 'MEDIUM', 'HIGH',
    'NOT_STARTED', 'IN_PROGRESS', 'EVIDENCE_READY', 'SUBMITTED', 'CONFIRMED_BY_CBK', 'NOT_APPLICABLE', 'PARTIAL_EXISTING_NBFI',
    'MANAGEMENT_PROVIDED', 'VENDOR_ESTIMATE', 'PRIVATE_PRELIMINARY_ESTIMATE', 'CBK_REPORTED_UNVERIFIED', 'SECONDARY_SOURCE', 'MARKET_BENCHMARK_SEARCH',
    'ESTIMATE_NOT_MARKET_VERIFIED', 'UNSOURCED_ASSUMPTION', 'DEMO_PRESET', 'DERIVED',
    ...col(DATA.requirements, 'binding_status'), ...col(DATA.requirements, 'compliance_status'), ...col(DATA.institutions, 'verification_status'),
    ...col(DATA.institutions, 'entity_type'), ...col(DATA.institutions, 'status_2026'), ...col(DATA.legal, 'instrument_type'), ...col(DATA.legal, 'retrieval_status'),
    ...col(DATA.documents, 'document_type'), ...col(DATA.documents, 'retrieval_status'), ...col(DATA.coverage, 'status'), ...col(DATA.retrieval, 'outcome'),
    ...col(DATA.retrieval, 'error_class'), ...col(DATA.historical, 'stock_or_flow'), ...col(DATA.historical, 'source_type'), ...col(DATA.historical, 'confidence'),
    ...col(DATA.sector, 'source_type'), ...col(DATA.quality, 'result'), ...col(DATA.roles, 'requirement_status'), ...col(DATA.roles, 'salary_source_status'),
    ...col(DATA.salaryEvidence, 'observed_or_estimated'), ...col(DATA.costs, 'source_type'), ...col(DATA.assumptionRegister, 'source_type'),
  ];
}

export function allKeys(): string[] {
  return [...new Set([...literalKeys(), ...dynamicKeys(), ...codeKeys()])].sort();
}
