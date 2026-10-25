import { useEffect, useState } from 'react';
import type { RuleStatus } from '../../engine';
import { Card, ChartCard, DataTable, Explain, Kpi, NumberField, SourceBadge, Toggle, VerdictChip } from '../components';
import { DATA, type ModProps } from '../data';
import { eurM, pct } from '../format';
import type { Store } from '../store';

const STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'EVIDENCE_READY', 'SUBMITTED', 'CONFIRMED_BY_CBK', 'NOT_APPLICABLE', 'UNDETERMINED', 'PARTIAL_EXISTING_NBFI'];

export function Licensing({ store, readOnly }: { store: Store; readOnly: boolean }) {
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
      <div className="banner">Requirements are taken from search extracts of CBK and Official Gazette documents. The primary PDFs (Law 08/L-304, the 2020 licensing regulation as amended, the 2018 capital adequacy regulation) <b>must be read before any item is treated as confirmed.</b> Binding status and verification status are shown separately for each item.</div>
      <div className="kpis">{Object.entries(counts).map(([k, v]) => <Kpi key={k} label={k.replace(/_/g, ' ')} value={v} />)}</div>
      <Card title="CBK licensing requirements and compliance checklist" right={
        <select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="">All categories</option>{cats.map((c) => <option key={c}>{c}</option>)}</select>}>
        <DataTable rows={reqs} max={700} cols={[
          { key: 'requirement_id', label: 'ID' }, { key: 'category', label: 'Category' }, { key: 'requirement', label: 'Requirement' },
          { key: 'binding_status', label: 'Binding', render: (r) => <span className="small">{r.binding_status.replace(/_/g, ' ')}</span> },
          { key: 'verification_status', label: 'Verification', render: (r) => <SourceBadge s={r.verification_status === 'UNVERIFIED' || r.verification_status === 'NOT_OBTAINED' ? 'NOT_OBTAINED' : 'REPORTED_UNVERIFIED'} /> },
          { key: 'source_id', label: 'Source / article', render: (r) => <span className="small">{r.source_id}<br />{r.article_or_section}</span> },
          { key: 'threshold_value', label: 'Threshold' }, { key: 'stage', label: 'Stage' },
          { key: 'status', label: 'Status', render: (r) => (
            <select disabled={readOnly} value={statusOf(r)} onChange={(e) => update(r.requirement_id, { status: e.target.value })}>
              {[...new Set([...STATUSES, r.compliance_status])].map((s) => <option key={s}>{s}</option>)}
            </select>) },
          { key: 'owner', label: 'Owner', render: (r) => <input disabled={readOnly} style={{ width: 130 }} value={state[r.requirement_id]?.owner ?? r.owner} onChange={(e) => update(r.requirement_id, { owner: e.target.value })} /> },
          { key: 'notes', label: 'Notes' },
        ]} />
      </Card>
      <Card title="Legal sources (effective-dated)">
        <DataTable rows={DATA.legal} cols={[{ key: 'source_id', label: 'ID' }, { key: 'title', label: 'Title' }, { key: 'instrument_type', label: 'Type' },
          { key: 'publication_date', label: 'Published' }, { key: 'effective_date', label: 'Effective' }, { key: 'status_as_of_2026_10_25', label: 'Status (25-Oct-2026)' },
          { key: 'retrieval_status', label: 'Retrieval' }, { key: 'url', label: 'URL', render: (r) => <a href={r.url} target="_blank" rel="noreferrer">link</a> }, { key: 'verification_notes', label: 'Notes' }]} />
      </Card>
    </>
  );
}

export function CapitalModule({ inputs, result: r, set, readOnly }: ModProps) {
  const data = r.months.filter((m) => m.rel >= 0 && m.rel % 3 === 2).map((m) => ({
    month: `Y${m.opYear} M${(m.rel % 12) + 1}`, car: m.car, t1: m.tier1Ratio, liq: m.liquidityRatio, rwa: m.rwa, cap: m.totalCapital,
  }));
  const carRule = inputs.regulatory.rules.find((x) => x.id === 'R-CAR')?.value;
  const setRule = (id: string, patch: { value?: number | null; status?: RuleStatus }) =>
    set('regulatory.rules', inputs.regulatory.rules.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  return (
    <>
      <div className="kpis">
        <Kpi label="Capital shortfall to target CAR" value={eurM(r.capitalAnalysis.capitalShortfallToTarget)} tone={r.capitalAnalysis.capitalShortfallToTarget > 0 ? 'neg' : undefined} note={`target ${pct(inputs.capital.targetCar, 0)} (management buffer)`} />
        <Kpi label="Shortfall to reported minimum" value={eurM(r.capitalAnalysis.capitalShortfallToMinimum)} note={`min ${pct(carRule ?? null, 0)} – unverified`} />
        <Kpi label="RWA Y3 / Y10" value={`${eurM(r.years[3]?.rwa)} / ${eurM(r.years[10]?.rwa)}`} />
        <Kpi label="CET1 Y3 / Y10" value={`${eurM(r.years[3]?.cet1)} / ${eurM(r.years[10]?.cet1)}`} />
      </div>
      <ChartCard title="Capital adequacy ratio over time" sub={<>Quarter-ends. The dashed line is the reported 12% minimum, which is unverified. <Explain id="car" /></>} data={data} xKey="month" format={(v) => pct(v)}
        series={[{ key: 'car', label: 'Total CAR' }, { key: 't1', label: 'CET1 ratio' }]} refLines={carRule ? [{ y: carRule, label: `min ${pct(carRule, 0)}` }] : []} />
      <ChartCard title="Risk-weighted assets vs regulatory capital" data={data} xKey="month" series={[{ key: 'rwa', label: 'RWA' }, { key: 'cap', label: 'Total capital' }]} />
      <Card title="Regulatory tests" sub="A test can show PASS only when its rule is VERIFIED against the official text and the capital inputs are verified. Otherwise it is UNDETERMINED, with an indicative direction.">
        <DataTable rows={r.regulatory as unknown as Record<string, unknown>[]} cols={[
          { key: 'ruleId', label: 'Rule' }, { key: 'label', label: 'Test' },
          { key: 'verdict', label: 'Verdict', render: (t) => <VerdictChip v={String(t.verdict)} /> },
          { key: 'indicative', label: 'Indicative', render: (t) => <span className={t.indicative === 'BELOW' ? 'neg' : ''}>{String(t.indicative)}</span> },
          { key: 'worstValue', label: 'Worst value', num: true, render: (t) => (t.ruleId === 'R-MIN-CAP' ? eurM(t.worstValue as number) : pct(t.worstValue as number | null)) },
          { key: 'worstRelMonth', label: 'Month', num: true },
          { key: 'threshold', label: 'Threshold', num: true, render: (t) => (t.ruleId === 'R-MIN-CAP' ? eurM(t.threshold as number | null) : pct(t.threshold as number | null)) },
          { key: 'reason', label: 'Reason' }]} />
      </Card>
      <Card title="Regulatory rule set (editable, effective-dated in the sources)" sub="Set the status to VERIFIED only after reading the article in the official current text.">
        <DataTable rows={inputs.regulatory.rules as unknown as Record<string, unknown>[]} cols={[
          { key: 'id', label: 'ID' }, { key: 'label', label: 'Rule' },
          { key: 'value', label: 'Value', render: (x) => (
            <input type="number" disabled={readOnly} step="any" value={x.value === null ? '' : String(x.value)}
              onChange={(e) => setRule(String(x.id), { value: e.target.value === '' ? null : Number(e.target.value) })} />) },
          { key: 'status', label: 'Status', render: (x) => (
            <select disabled={readOnly} value={String(x.status)} onChange={(e) => setRule(String(x.id), { status: e.target.value as RuleStatus })}>
              {['VERIFIED', 'REPORTED_UNVERIFIED', 'HISTORICAL_UNVERIFIED', 'NOT_OBTAINED'].map((s) => <option key={s}>{s}</option>)}
            </select>) },
          { key: 'requirementId', label: 'Requirement' }, { key: 'source', label: 'Source' }]} />
      </Card>
      <div className="grid">
        <Card title="Capital and RWA parameters">
          <NumberField label="Management target CAR" unit="pct" value={inputs.capital.targetCar} onChange={(v) => set('capital.targetCar', v ?? 0)} />
          <NumberField label="Goods-financing risk weight" unit="pct" value={inputs.products.goods.riskWeight} onChange={(v) => set('products.goods.riskWeight', v ?? 0)} meta="Basel standardised retail 75%; CBK weights not verified" />
          <NumberField label="Leasing risk weight" unit="pct" value={inputs.products.leasing.riskWeight} onChange={(v) => set('products.leasing.riskWeight', v ?? 0)} />
          <NumberField label="T-bill risk weight" unit="pct" value={inputs.regulatory.tbillRiskWeight} onChange={(v) => set('regulatory.tbillRiskWeight', v ?? 0)} />
          <NumberField label="Operational risk α (BIA)" unit="pct" value={inputs.regulatory.operationalRiskAlpha} onChange={(v) => set('regulatory.operationalRiskAlpha', v ?? 0)} />
          <NumberField label="Largest single exposure" unit="EUR" value={inputs.regulatory.largestSingleExposure} onChange={(v) => set('regulatory.largestSingleExposure', v ?? 0)} />
          <Toggle label="Deduct intangibles from CET1" checked={inputs.regulatory.deductIntangibles} onChange={(v) => set('regulatory.deductIntangibles', v)} />
          <Toggle label="Capital inputs verified (auditor/CBK evidence)" checked={inputs.capital.capitalInputsVerified} onChange={(v) => set('capital.capitalInputsVerified', v)} meta="Leave unchecked until cash capital and deductions are evidenced." />
        </Card>
      </div>
    </>
  );
}

const PHASES = [
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
  const start = -inputs.preOpMonths, end = 12, span = end - start;
  const reqs = DATA.requirements;
  const byCat = reqs.reduce<Record<string, Record<string, number>>>((a, r) => {
    a[r.category] = a[r.category] ?? {};
    a[r.category][r.compliance_status] = (a[r.category][r.compliance_status] ?? 0) + 1;
    return a;
  }, {});
  return (
    <>
      <Card title="Implementation roadmap" sub={`Months relative to go-live. The pre-operating period is ${inputs.preOpMonths} months, an editable assumption. The schedule is illustrative and depends on CBK timelines.`}>
        <div className="gantt">
          {PHASES.map((p) => (
            <div className="bar-row" key={p.label}>
              <span>{p.label}</span>
              <div className="track" title={`M${p.from} → M${p.to}`}>
                <div className={`bar ${p.crit ? 'crit' : ''}`} style={{ left: `${((Math.max(p.from, start) - start) / span) * 100}%`, width: `${(Math.max(1, p.to - Math.max(p.from, start) + 1) / span) * 100}%` }} />
              </div>
            </div>
          ))}
          <div className="bar-row small muted"><span /><span>M{start} … go-live (M0) … M{end}. Orange = critical path</span></div>
        </div>
      </Card>
      <Card title="Licensing readiness summary">
        <table>
          <thead><tr><th>Dimension</th><th>Verdict</th><th>Basis</th></tr></thead>
          <tbody>
            <tr><td>Legal route (NBFI → bank)</td><td><VerdictChip v="UNDETERMINED" /></td><td>No CBK conversion procedure was found. A written CBK position and a legal opinion are required.</td></tr>
            <tr><td>Minimum initial capital</td><td><VerdictChip v={result.regulatory[0].verdict} /></td><td>{result.regulatory[0].reason}</td></tr>
            <tr><td>Capital adequacy through the plan</td><td><VerdictChip v={result.regulatory[1].verdict} /></td><td>Indicative {result.regulatory[1].indicative}; {result.regulatory[1].reason}</td></tr>
            <tr><td>Liquidity & funding</td><td><VerdictChip v={result.statuses.liquidity.status} /></td><td>{result.statuses.funding.detail}</td></tr>
            <tr><td>Governance & key function holders</td><td><VerdictChip v="UNDETERMINED" /></td><td>Board size and independence rules were not obtained. Roles are proposed in the Staffing module.</td></tr>
            <tr><td>Systems (CBS, AML, reporting)</td><td><VerdictChip v="UNDETERMINED" /></td><td>Vendor offer is non-binding; outsourcing approval and data location need confirmation.</td></tr>
            <tr><td>Islamic products</td><td><VerdictChip v="UNDETERMINED" /></td><td>Legal definition exists in 04/L-093; status under 08/L-304 and CBK permission unconfirmed.</td></tr>
          </tbody>
        </table>
      </Card>
      <Card title="Checklist status by category (baseline)">
        <table><thead><tr><th>Category</th><th>Status counts</th></tr></thead>
          <tbody>{Object.entries(byCat).map(([c, s]) => <tr key={c}><td>{c}</td><td>{Object.entries(s).map(([k, v]) => `${k}: ${v}`).join(' · ')}</td></tr>)}</tbody></table>
      </Card>
    </>
  );
}
