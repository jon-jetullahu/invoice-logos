import { useMemo, useState } from 'react';
import { DEFAULT_DATA, employerCost, headcountTable, kosovoNetMonthly, type Case, type StaffingScenario } from '../../engine';
import { Card, ChartCard, DataTable, Kpi, Markdown, NumberField, Seg, SourceBadge } from '../components';
import { DATA, type ModProps } from '../data';
import { eur, eurM, num } from '../format';

export function Staffing({ inputs, result, set }: ModProps) {
  const table = useMemo(() => headcountTable(inputs, DEFAULT_DATA.roles), [inputs]);
  const byDept = table.reduce<Record<string, number[]>>((a, r) => {
    a[r.department] = (a[r.department] ?? [0, 0, 0]).map((v, i) => v + r.fte[i]);
    return a;
  }, {});
  const yrs = result.years.filter((y) => y.year > 0);
  const chart = yrs.map((y) => ({ year: y.label, fte: y.fte, seats: y.cbsSeats, people: y.opexByCategory['People'] ?? 0 }));
  const total = [0, 1, 2].map((i) => table.filter((r) => r.function_class !== 'board').reduce((a, r) => a + r.fte[i], 0));
  const memo = DATA.memos.find((m) => m.file.includes('org_chart'));
  const br = inputs.staffing.branches[inputs.staffing.scenario];
  return (
    <>
      <div className="row">
        <span>Staffing scenario</span>
        <Seg<StaffingScenario> value={inputs.staffing.scenario} onChange={(v) => set('staffing.scenario', v)} options={[{ v: 'lean', label: 'Lean' }, { v: 'base', label: 'Base' }, { v: 'expanded', label: 'Expanded' }]} />
        <span>Salary case</span>
        <Seg<Case> value={inputs.staffing.salaryCase} onChange={(v) => set('staffing.salaryCase', v)} options={[{ v: 'low', label: 'Low' }, { v: 'base', label: 'Base' }, { v: 'high', label: 'High' }]} />
      </div>
      {inputs.staffing.scenario === 'lean' && <div className="banner">The lean scenario combines several roles (for example, the DPO within Compliance). <b>Its compliance with CBK rules is not confirmed</b> and needs legal review.</div>}
      <div className="kpis">
        <Kpi label="Employees Y1 / Y2 / Y3 (excl. board)" value={total.map((v) => num(v)).join(' / ')} />
        <Kpi label="CBS user seats Y1 / Y2 / Y3" value="30 / 40 / 50" note="Management-provided licence seats, which are not headcount" />
        <Kpi label="People cost Y1 / Y3" value={`${eurM(yrs[0]?.opexByCategory['People'])} / ${eurM(yrs[2]?.opexByCategory['People'])}`} note="incl. pension 5%, bonus, board, recruitment" />
        <Kpi label="Branches Y1 / Y2 / Y3" value={br.join(' / ')} />
        <Kpi label="PriBank benchmark" value="176 FTE" note="Year 4, 2025; secondary source, unverified" />
      </div>
      <ChartCard title="Headcount vs CBS seats" data={chart} xKey="year" format={(v) => num(v)} series={[{ key: 'fte', label: 'Employees (FTE)', kind: 'bar' }, { key: 'seats', label: 'CBS seats (mgmt)' }]} />
      <div className="grid-2">
        <Card title="FTE by department (year end)">
          <table><thead><tr><th>Department</th><th className="num">Y1</th><th className="num">Y2</th><th className="num">Y3</th></tr></thead>
            <tbody>{Object.entries(byDept).map(([d, v]) => <tr key={d}><td>{d}</td>{v.map((x, i) => <td key={i} className="num">{num(x, 1)}</td>)}</tr>)}</tbody></table>
        </Card>
        <Card title="Scenario drivers">
          {(['lean', 'base', 'expanded'] as const).map((s) => (
            <div key={s} className="field"><label>Branches {s} (Y1,Y2,Y3)</label>
              <input value={inputs.staffing.branches[s].join(',')} onChange={(e) => set(`staffing.branches.${s}`, e.target.value.split(',').map(Number).filter((x) => !Number.isNaN(x)))} /></div>
          ))}
          <NumberField label="Annual wage inflation" unit="pct" value={inputs.staffing.wageInflation} onChange={(v) => set('staffing.wageInflation', v ?? 0)} />
          <NumberField label="Employer pension" unit="pct" value={inputs.staffing.employerPensionRate} onChange={(v) => set('staffing.employerPensionRate', v ?? 0)} meta="5% mandatory (PwC tax summaries)" />
          <NumberField label="FTE growth after Y3" unit="pct" value={inputs.staffing.fteGrowthAfterY3} onChange={(v) => set('staffing.fteGrowthAfterY3', v ?? 0)} />
        </Card>
      </div>
      <Card title="Role catalogue: requirement status, independence, FTE and cost" sub="Salaries are ESTIMATE_NOT_MARKET_VERIFIED. They are anchored to the Kosovo statistics agency's (KAS) average wage of €713 gross in 2025 and should be calibrated against bank financial-statement personnel costs and job adverts.">
        <DataTable rows={table.map((t) => ({ ...t, ...DEFAULT_DATA.roles.find((r) => r.role_id === t.role_id)! })) as unknown as Record<string, unknown>[]} cols={[
          { key: 'role', label: 'Role' }, { key: 'department', label: 'Dept' },
          { key: 'requirement_status', label: 'Requirement', render: (r) => <span className="small">{String(r.requirement_status).replace(/_/g, ' ')}</span> },
          { key: 'cbk_prior_approval_expected', label: 'CBK approval' }, { key: 'independence', label: 'Independence' }, { key: 'outsourceable', label: 'Outsourceable' },
          { key: 'fte', label: 'FTE Y1/Y2/Y3', num: true, render: (r) => (r.fte as number[]).map((x) => num(x, 1)).join(' / ') },
          { key: 'grossMonthly', label: 'Gross / month', num: true, render: (r) => eur(r.grossMonthly as number) },
          { key: 'annualEmployerCostY1', label: 'Employer cost Y1', num: true, render: (r) => eur(r.annualEmployerCostY1 as number) },
        ]} />
      </Card>
      {memo && <Card title="Organisation design notes"><Markdown text={memo.markdown} /></Card>}
    </>
  );
}

export function Salary({ inputs }: ModProps) {
  const [gross, setGross] = useState(1500);
  const [pension, setPension] = useState(inputs.staffing.employerPensionRate);
  const net = kosovoNetMonthly(gross);
  const emp = employerCost(gross, pension);
  return (
    <>
      <div className="grid-2">
        <Card title="Kosovo payroll calculator" sub="Personal income tax uses annual brackets: 0% up to €3,000, 8% up to €5,400, 10% above (Law 08/L-142, per PwC). Pension is 5% employee and 5% employer.">
          <NumberField label="Gross monthly salary" unit="EUR" value={gross} onChange={(v) => setGross(v ?? 0)} />
          <NumberField label="Employer pension rate" unit="pct" value={pension} onChange={(v) => setPension(v ?? 0)} />
          <table style={{ marginTop: 10 }}><tbody>
            <tr><td>Employee pension (5%)</td><td className="num">{eur(net.employeePension, 2)}</td></tr>
            <tr><td>Personal income tax</td><td className="num">{eur(net.incomeTax, 2)}</td></tr>
            <tr className="total"><td>Net monthly pay</td><td className="num">{eur(net.net, 2)}</td></tr>
            <tr><td>Employer pension</td><td className="num">{eur(emp - gross, 2)}</td></tr>
            <tr className="total"><td>Employer cost / month</td><td className="num">{eur(emp, 2)}</td></tr>
            <tr className="total"><td>Employer cost / year (excl. bonus & benefits)</td><td className="num">{eur(emp * 12)}</td></tr>
          </tbody></table>
        </Card>
        <Card title="Market anchors (observed)" sub="No role-specific Kosovo bank salary was verified. The figures below are official or secondary aggregates.">
          <DataTable rows={DATA.salaryEvidence} cols={[{ key: 'role_or_scope', label: 'Scope' }, { key: 'year', label: 'Year' }, { key: 'gross_or_net', label: 'Basis' },
            { key: 'amount_eur', label: 'EUR', num: true }, { key: 'observed_or_estimated', label: 'Status', render: (r) => <SourceBadge s={r.observed_or_estimated} /> }, { key: 'notes', label: 'Notes' }]} />
        </Card>
      </div>
      <Card title="Salary bands by role (low / base / high gross monthly, EUR)">
        <DataTable rows={DATA.roles} cols={[{ key: 'role', label: 'Role' }, { key: 'department', label: 'Department' },
          { key: 'gross_monthly_low_eur', label: 'Low', num: true }, { key: 'gross_monthly_base_eur', label: 'Base', num: true }, { key: 'gross_monthly_high_eur', label: 'High', num: true },
          { key: 'bonus_pct_base', label: 'Bonus %', num: true, render: (r) => `${Number(r.bonus_pct_base) * 100}%` },
          { key: 'net', label: 'Net (base)', num: true, render: (r) => eur(kosovoNetMonthly(Number(r.gross_monthly_base_eur)).net) },
          { key: 'salary_source_status', label: 'Evidence', render: (r) => <SourceBadge s={r.salary_source_status} /> }, { key: 'salary_rationale', label: 'Rationale' }]} />
      </Card>
    </>
  );
}
