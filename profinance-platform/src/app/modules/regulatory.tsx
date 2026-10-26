import { useEffect, useState } from 'react';
import type { RuleStatus } from '../../engine';
import { Card, ChartCard, DataTable, Explain, Kpi, NumberField, SourceBadge, Toggle, VerdictChip } from '../components';
import { DATA, type ModProps } from '../data';
import { eurM, pct } from '../format';
import { field, Rich, useI18n } from '../i18n';
import { useMessages } from '../messages';
import type { Store } from '../store';

const STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'EVIDENCE_READY', 'SUBMITTED', 'CONFIRMED_BY_CBK', 'NOT_APPLICABLE', 'UNDETERMINED', 'PARTIAL_EXISTING_NBFI'];

export function Licensing({ store, readOnly }: { store: Store; readOnly: boolean }) {
  const { t, tc, lang } = useI18n();
  const [state, setState] = useState<Record<string, { status: string; owner: string; note: string }>>({});
  const [filter, setFilter] = useState('');
  useEffect(() => { store.checklist().then(setState).catch(() => setState({})); }, [store]);
  const reqs = DATA.requirements.filter((r) => !filter || r.category === filter);
  const cats = [...new Set(DATA.requirements.map((r) => r.category))];
  const update = (id: string, patch: Partial<{ status: string; owner: string; note: string }>) => {
    const base = DATA.requirements.find((r) => r.requirement_id === id)!;
    const v = { status: state[id]?.status ?? base.compliance_status, owner: state[id]?.owner ?? base.owner, note: state[id]?.note ?? '', ...patch };
    setState({ ...state, [id]: v });
    store.setChecklist(id, v);
  };
  const statusOf = (r: Record<string, string>) => state[r.requirement_id]?.status ?? r.compliance_status;
  const counts = DATA.requirements.reduce<Record<string, number>>((a, r) => ({ ...a, [statusOf(r)]: (a[statusOf(r)] ?? 0) + 1 }), {});
  return (
    <>
      <div className="banner"><Rich text={t('Requirements are taken from search extracts of CBK and Official Gazette documents. The primary PDFs (Law 08/L-304, the 2020 licensing regulation as amended, the 2018 capital adequacy regulation) **must be read before any item is treated as confirmed.** Binding status and verification status are shown separately for each item.')} /></div>
      <div className="kpis">{Object.entries(counts).map(([k, v]) => <Kpi key={k} label={tc(k)} value={v} />)}</div>
      <Card title={t('CBK licensing requirements and compliance checklist')} right={
        <select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="">{t('All categories')}</option>{cats.map((c) => <option key={c} value={c}>{t(c)}</option>)}</select>}>
        <DataTable rows={reqs} max={700} cols={[
          { key: 'requirement_id', label: t('ID') }, { key: 'category', label: t('Category'), render: (r) => t(r.category) },
          { key: 'requirement', label: t('Requirement'), render: (r) => field(lang, r, 'requirement') },
          { key: 'binding_status', label: t('Binding'), render: (r) => <span className="small">{tc(r.binding_status)}</span> },
          { key: 'verification_status', label: t('Verification'), render: (r) => <SourceBadge s={r.verification_status === 'UNVERIFIED' || r.verification_status === 'NOT_OBTAINED' ? 'NOT_OBTAINED' : 'REPORTED_UNVERIFIED'} /> },
          { key: 'source_id', label: t('Source / article'), render: (r) => <span className="small">{r.source_id}<br />{r.article_or_section}</span> },
          { key: 'threshold_value', label: t('Threshold') }, { key: 'stage', label: t('Stage'), render: (r) => t(r.stage) },
          { key: 'status', label: t('Status'), render: (r) => (
            <select disabled={readOnly} value={statusOf(r)} onChange={(e) => update(r.requirement_id, { status: e.target.value })}>
              {[...new Set([...STATUSES, r.compliance_status])].map((s) => <option key={s} value={s}>{tc(s)}</option>)}
            </select>) },
          { key: 'owner', label: t('Owner'), render: (r) => <input disabled={readOnly} style={{ width: 130 }} value={state[r.requirement_id]?.owner ?? r.owner} onChange={(e) => update(r.requirement_id, { owner: e.target.value })} /> },
          { key: 'notes', label: t('Notes (source language)') },
        ]} />
      </Card>
      <Card title={t('Legal sources (effective-dated)')}>
        <DataTable rows={DATA.legal} cols={[{ key: 'source_id', label: t('ID') }, { key: 'title', label: t('Title') }, { key: 'instrument_type', label: t('Type'), render: (r) => tc(r.instrument_type) },
          { key: 'publication_date', label: t('Published') }, { key: 'effective_date', label: t('Effective') }, { key: 'status_as_of_2026_10_25', label: t('Status (25-Oct-2026)') },
          { key: 'retrieval_status', label: t('Retrieval'), render: (r) => tc(r.retrieval_status) }, { key: 'url', label: 'URL', render: (r) => <a href={r.url} target="_blank" rel="noreferrer">{t('link')}</a> }, { key: 'verification_notes', label: t('Notes (source language)') }]} />
      </Card>
    </>
  );
}

export function CapitalModule({ inputs, result: r, set, readOnly }: ModProps) {
  const { t, tc } = useI18n();
  const msg = useMessages();
  const data = r.months.filter((m) => m.rel >= 0 && m.rel % 3 === 2).map((m) => ({
    month: t('Y{y} M{m}', { y: m.opYear, m: (m.rel % 12) + 1 }), car: m.car, t1: m.tier1Ratio, liq: m.liquidityRatio, rwa: m.rwa, cap: m.totalCapital,
  }));
  const carRule = inputs.regulatory.rules.find((x) => x.id === 'R-CAR')?.value;
  const setRule = (id: string, patch: { value?: number | null; status?: RuleStatus }) =>
    set('regulatory.rules', inputs.regulatory.rules.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  return (
    <>
      <div className="kpis">
        <Kpi label={t('Capital shortfall to target CAR')} value={eurM(r.capitalAnalysis.capitalShortfallToTarget)} tone={r.capitalAnalysis.capitalShortfallToTarget > 0 ? 'neg' : undefined} note={t('target {p} (management buffer)', { p: pct(inputs.capital.targetCar, 0) })} />
        <Kpi label={t('Shortfall to reported minimum')} value={eurM(r.capitalAnalysis.capitalShortfallToMinimum)} note={t('min {p} – unverified', { p: pct(carRule ?? null, 0) })} />
        <Kpi label={t('RWA Y3 / Y10')} value={`${eurM(r.years[3]?.rwa)} / ${eurM(r.years[10]?.rwa)}`} />
        <Kpi label={t('CET1 Y3 / Y10')} value={`${eurM(r.years[3]?.cet1)} / ${eurM(r.years[10]?.cet1)}`} />
      </div>
      <ChartCard title={t('Capital adequacy ratio over time')} sub={<>{t('Quarter-ends. The dashed line is the reported 12% minimum, which is unverified.')} <Explain id="car" /></>} data={data} xKey="month" format={(v) => pct(v)}
        series={[{ key: 'car', label: t('Total CAR') }, { key: 't1', label: t('CET1 ratio') }]} refLines={carRule ? [{ y: carRule, label: t('min {p}', { p: pct(carRule, 0) }) }] : []} />
      <ChartCard title={t('Risk-weighted assets vs regulatory capital')} data={data} xKey="month" series={[{ key: 'rwa', label: t('RWA') }, { key: 'cap', label: t('Total capital') }]} />
      <Card title={t('Regulatory tests')} sub={t('A test can show PASS only when its rule is VERIFIED against the official text and the capital inputs are verified. Otherwise it is UNDETERMINED, with an indicative direction.')}>
        <DataTable rows={r.regulatory as unknown as Record<string, unknown>[]} cols={[
          { key: 'ruleId', label: t('Rule') }, { key: 'label', label: t('Test'), render: (x) => t(String(x.label)) },
          { key: 'verdict', label: t('Verdict'), render: (x) => <VerdictChip v={String(x.verdict)} /> },
          { key: 'indicative', label: t('Indicative'), render: (x) => <span className={x.indicative === 'BELOW' ? 'neg' : ''}>{tc(String(x.indicative))}</span> },
          { key: 'worstValue', label: t('Worst value'), num: true, render: (x) => (x.ruleId === 'R-MIN-CAP' ? eurM(x.worstValue as number) : pct(x.worstValue as number | null)) },
          { key: 'worstRelMonth', label: t('Month'), num: true },
          { key: 'threshold', label: t('Threshold'), num: true, render: (x) => (x.ruleId === 'R-MIN-CAP' ? eurM(x.threshold as number | null) : pct(x.threshold as number | null)) },
          { key: 'reason', label: t('Reason'), render: (x) => msg.reason(x as never) }]} />
      </Card>
      <Card title={t('Regulatory rule set (editable, effective-dated in the sources)')} sub={t('Set the status to VERIFIED only after reading the article in the official current text.')}>
        <DataTable rows={inputs.regulatory.rules as unknown as Record<string, unknown>[]} cols={[
          { key: 'id', label: t('ID') }, { key: 'label', label: t('Rule'), render: (x) => t(String(x.label)) },
          { key: 'value', label: t('Value'), render: (x) => (
            <input type="number" disabled={readOnly} step="any" value={x.value === null ? '' : String(x.value)}
              onChange={(e) => setRule(String(x.id), { value: e.target.value === '' ? null : Number(e.target.value) })} />) },
          { key: 'status', label: t('Status'), render: (x) => (
            <select disabled={readOnly} value={String(x.status)} onChange={(e) => setRule(String(x.id), { status: e.target.value as RuleStatus })}>
              {['VERIFIED', 'REPORTED_UNVERIFIED', 'HISTORICAL_UNVERIFIED', 'NOT_OBTAINED'].map((s) => <option key={s} value={s}>{tc(s)}</option>)}
            </select>) },
          { key: 'requirementId', label: t('Requirement') }, { key: 'source', label: t('Source'), render: (x) => t(String(x.source)) }]} />
      </Card>
      <div className="grid">
        <Card title={t('Capital and RWA parameters')}>
          <NumberField label={t('Management target CAR')} unit="pct" value={inputs.capital.targetCar} onChange={(v) => set('capital.targetCar', v ?? 0)} />
          <NumberField label={t('Goods-financing risk weight')} unit="pct" value={inputs.products.goods.riskWeight} onChange={(v) => set('products.goods.riskWeight', v ?? 0)} meta={t('Basel standardised retail 75%; CBK weights not verified')} />
          <NumberField label={t('Leasing risk weight')} unit="pct" value={inputs.products.leasing.riskWeight} onChange={(v) => set('products.leasing.riskWeight', v ?? 0)} />
          <NumberField label={t('T-bill risk weight')} unit="pct" value={inputs.regulatory.tbillRiskWeight} onChange={(v) => set('regulatory.tbillRiskWeight', v ?? 0)} />
          <NumberField label={t('Operational risk α (BIA)')} unit="pct" value={inputs.regulatory.operationalRiskAlpha} onChange={(v) => set('regulatory.operationalRiskAlpha', v ?? 0)} />
          <NumberField label={t('Largest single exposure')} unit="EUR" value={inputs.regulatory.largestSingleExposure} onChange={(v) => set('regulatory.largestSingleExposure', v ?? 0)} />
          <Toggle label={t('Deduct intangibles from CET1')} checked={inputs.regulatory.deductIntangibles} onChange={(v) => set('regulatory.deductIntangibles', v)} />
          <Toggle label={t('Capital inputs verified (auditor/CBK evidence)')} checked={inputs.capital.capitalInputsVerified} onChange={(v) => set('capital.capitalInputsVerified', v)} meta={t('Leave unchecked until cash capital and deductions are evidenced.')} />
        </Card>
      </div>
    </>
  );
}

export const PHASES = [
  { label: 'CBK pre-application meetings & legal route opinion', from: -15, to: -13, crit: true },
  { label: 'Business plan, ICAAP/ILAAP, policy suite', from: -15, to: -11, crit: false },
  { label: 'Application filed (incl. fee)', from: -12, to: -12, crit: true },
  { label: 'CBK review → preliminary approval (≤3 months reported)', from: -12, to: -9, crit: true },
  { label: 'Core banking implementation (Facilization)', from: -10, to: 0, crit: true },
  { label: 'Recruit board & key function holders; fit & proper', from: -12, to: -6, crit: true },
  { label: 'Visa membership & card programme project', from: -6, to: 6, crit: false },
  { label: 'HQ / branches fit-out, vault, security', from: -9, to: -2, crit: false },
  { label: 'Deposit minimum capital at CBK', from: -4, to: -3, crit: true },
  { label: 'Final licence application & pre-opening on-site exam', from: -3, to: -1, crit: true },
  { label: 'DIFK membership, KIPS, credit registry', from: -3, to: -1, crit: false },
  { label: 'Go-live, deposit taking & financing', from: 0, to: 12, crit: false },
];

export function Readiness({ inputs, result }: ModProps) {
  const { t, tc } = useI18n();
  const msg = useMessages();
  const start = -inputs.preOpMonths, end = 12, span = end - start;
  const byCat = DATA.requirements.reduce<Record<string, Record<string, number>>>((a, r) => {
    a[r.category] = a[r.category] ?? {};
    a[r.category][r.compliance_status] = (a[r.category][r.compliance_status] ?? 0) + 1;
    return a;
  }, {});
  const reg = result.regulatory;
  return (
    <>
      <Card title={t('Implementation roadmap')} sub={t('Months relative to go-live. The pre-operating period is {n} months, an editable assumption. The schedule is illustrative and depends on CBK timelines.', { n: inputs.preOpMonths })}>
        <div className="gantt">
          {PHASES.map((p) => (
            <div className="bar-row" key={p.label}>
              <span>{t(p.label)}</span>
              <div className="track" title={`M${p.from} → M${p.to}`}>
                <div className={`bar ${p.crit ? 'crit' : ''}`} style={{ left: `${((Math.max(p.from, start) - start) / span) * 100}%`, width: `${(Math.max(1, p.to - Math.max(p.from, start) + 1) / span) * 100}%` }} />
              </div>
            </div>
          ))}
          <div className="bar-row small muted"><span /><span>{t('M{start} … go-live (M0) … M{end}. Orange = critical path', { start, end })}</span></div>
        </div>
      </Card>
      <Card title={t('Licensing readiness summary')}>
        <table>
          <thead><tr><th>{t('Dimension')}</th><th>{t('Verdict')}</th><th>{t('Basis')}</th></tr></thead>
          <tbody>
            <tr><td>{t('Legal route (NBFI → bank)')}</td><td><VerdictChip v="UNDETERMINED" /></td><td>{t('No CBK conversion procedure was found. A written CBK position and a legal opinion are required.')}</td></tr>
            <tr><td>{t('Minimum initial capital')}</td><td><VerdictChip v={reg[0].verdict} /></td><td>{msg.reason(reg[0])}</td></tr>
            <tr><td>{t('Capital adequacy through the plan')}</td><td><VerdictChip v={reg[1].verdict} /></td><td>{t('Indicative {dir}; {reason}', { dir: tc(reg[1].indicative), reason: msg.reason(reg[1]) })}</td></tr>
            <tr><td>{t('Liquidity & funding')}</td><td><VerdictChip v={result.statuses.liquidity.status} /></td><td>{msg.status(result.statuses.funding)}</td></tr>
            <tr><td>{t('Governance & key function holders')}</td><td><VerdictChip v="UNDETERMINED" /></td><td>{t('Board rule reported: odd number of at least 5 directors, independent majority, at least one Kosovo resident. The proposed boards follow it but the article is not yet verified.')}</td></tr>
            <tr><td>{t('Systems (CBS, AML, reporting)')}</td><td><VerdictChip v="UNDETERMINED" /></td><td>{t('Vendor offer is non-binding; outsourcing approval and data location need confirmation.')}</td></tr>
            <tr><td>{t('Islamic products')}</td><td><VerdictChip v="UNDETERMINED" /></td><td>{t('Legal definition exists in 04/L-093; status under 08/L-304 and CBK permission unconfirmed.')}</td></tr>
          </tbody>
        </table>
      </Card>
      <Card title={t('Checklist status by category (baseline)')}>
        <table><thead><tr><th>{t('Category')}</th><th>{t('Status counts')}</th></tr></thead>
          <tbody>{Object.entries(byCat).map(([c, s]) => <tr key={c}><td>{t(c)}</td><td>{Object.entries(s).map(([k, v]) => `${tc(k)}: ${v}`).join(' · ')}</td></tr>)}</tbody></table>
      </Card>
    </>
  );
}
