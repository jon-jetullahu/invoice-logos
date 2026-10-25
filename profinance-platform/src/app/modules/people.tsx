import { useMemo, useState } from 'react';
import { DEFAULT_DATA, employerCost, headcountTable, kosovoNetMonthly, type Case, type StaffingScenario } from '../../engine';
import { Card, ChartCard, DataTable, Kpi, Markdown, NumberField, Seg, SourceBadge } from '../components';
import { DATA, type ModProps } from '../data';
import { eur, eurM, num } from '../format';
import { field, Rich, useI18n, yearLabel } from '../i18n';

export function Staffing({ inputs, result, set }: ModProps) {
  const { t, tc, lang } = useI18n();
  const table = useMemo(() => headcountTable(inputs, DEFAULT_DATA.roles), [inputs]);
  const byDept = table.reduce<Record<string, number[]>>((a, r) => {
    a[r.department] = (a[r.department] ?? [0, 0, 0]).map((v, i) => v + r.fte[i]);
    return a;
  }, {});
  const yrs = result.years.filter((y) => y.year > 0);
  const chart = yrs.map((y) => ({ year: yearLabel(lang, y.label), fte: y.fte, seats: y.cbsSeats }));
  const total = [0, 1, 2].map((i) => table.filter((r) => r.function_class !== 'board').reduce((a, r) => a + r.fte[i], 0));
  const memo = DATA.memos.find((m) => m.file.includes('org_chart') && m.lang === lang) ?? DATA.memos.find((m) => m.file.includes('org_chart'));
  const br = inputs.staffing.branches[inputs.staffing.scenario];
  return (
    <>
      <div className="row">
        <span>{t('Staffing scenario')}</span>
        <Seg<StaffingScenario> value={inputs.staffing.scenario} onChange={(v) => set('staffing.scenario', v)} options={[{ v: 'lean', label: t('Lean') }, { v: 'base', label: t('Base') }, { v: 'expanded', label: t('Expanded') }]} />
        <span>{t('Salary case')}</span>
        <Seg<Case> value={inputs.staffing.salaryCase} onChange={(v) => set('staffing.salaryCase', v)} options={[{ v: 'low', label: t('Low') }, { v: 'base', label: t('Base') }, { v: 'high', label: t('High') }]} />
      </div>
      {inputs.staffing.scenario === 'lean' && <div className="banner"><Rich text={t('The lean scenario combines several roles (for example, the DPO within Compliance). **Its compliance with CBK rules is not confirmed** and needs legal review.')} /></div>}
      <div className="kpis">
        <Kpi label={t('Employees Y1 / Y2 / Y3 (excl. board)')} value={total.map((v) => num(v)).join(' / ')} />
        <Kpi label={t('CBS user seats Y1 / Y2 / Y3')} value="30 / 40 / 50" note={t('Management-provided licence seats, which are not headcount')} />
        <Kpi label={t('People cost Y1 / Y3')} value={`${eurM(yrs[0]?.opexByCategory['People'])} / ${eurM(yrs[2]?.opexByCategory['People'])}`} note={t('incl. pension 5%, bonus, board, recruitment')} />
        <Kpi label={t('Branches Y1 / Y2 / Y3')} value={br.join(' / ')} />
        <Kpi label={t('PriBank benchmark')} value={t('{n} FTE', { n: 176 })} note={t('Year 4, 2025; secondary source, unverified')} />
      </div>
      <ChartCard title={t('Headcount vs CBS seats')} data={chart} xKey="year" format={(v) => num(v)} series={[{ key: 'fte', label: t('Employees (FTE)'), kind: 'bar' }, { key: 'seats', label: t('CBS seats (mgmt)') }]} />
      <div className="grid-2">
        <Card title={t('FTE by department (year end)')}>
          <table><thead><tr><th>{t('Department')}</th>{[1, 2, 3].map((y) => <th key={y} className="num">{yearLabel(lang, `Y${y}`)}</th>)}</tr></thead>
            <tbody>{Object.entries(byDept).map(([d, v]) => <tr key={d}><td>{t(d)}</td>{v.map((x, i) => <td key={i} className="num">{num(x, 1)}</td>)}</tr>)}</tbody></table>
        </Card>
        <Card title={t('Scenario drivers')}>
          {(['lean', 'base', 'expanded'] as const).map((s) => (
            <div key={s} className="field"><label>{t('Branches {s} (Y1,Y2,Y3)', { s: t(s === 'lean' ? 'Lean' : s === 'base' ? 'Base' : 'Expanded') })}</label>
              <input value={inputs.staffing.branches[s].join(',')} onChange={(e) => set(`staffing.branches.${s}`, e.target.value.split(',').map(Number).filter((x) => !Number.isNaN(x)))} /></div>
          ))}
          <NumberField label={t('Annual wage inflation')} unit="pct" value={inputs.staffing.wageInflation} onChange={(v) => set('staffing.wageInflation', v ?? 0)} />
          <NumberField label={t('Employer pension')} unit="pct" value={inputs.staffing.employerPensionRate} onChange={(v) => set('staffing.employerPensionRate', v ?? 0)} meta={t('5% mandatory (PwC tax summaries)')} />
          <NumberField label={t('FTE growth after Y3')} unit="pct" value={inputs.staffing.fteGrowthAfterY3} onChange={(v) => set('staffing.fteGrowthAfterY3', v ?? 0)} />
        </Card>
      </div>
      <Card title={t('Role catalogue: requirement status, independence, FTE and cost')} sub={t("Salaries are ESTIMATE_NOT_MARKET_VERIFIED. They are anchored to the Kosovo statistics agency's (KAS) average wage of €713 gross in 2025 and should be calibrated against bank financial-statement personnel costs and job adverts.")}>
        <DataTable rows={table.map((x) => ({ ...x, ...DEFAULT_DATA.roles.find((r) => r.role_id === x.role_id)! })) as unknown as Record<string, unknown>[]} cols={[
          { key: 'role', label: t('Role'), render: (r) => field(lang, r as Record<string, string>, 'role') }, { key: 'department', label: t('Dept'), render: (r) => t(String(r.department)) },
          { key: 'requirement_status', label: t('Requirement'), render: (r) => <span className="small">{tc(String(r.requirement_status))}</span> },
          { key: 'cbk_prior_approval_expected', label: t('CBK approval'), render: (r) => t(String(r.cbk_prior_approval_expected)) },
          { key: 'independence', label: t('Independence'), render: (r) => t(String(r.independence)) },
          { key: 'outsourceable', label: t('Outsourceable'), render: (r) => t(String(r.outsourceable)) },
          { key: 'fte', label: t('FTE Y1/Y2/Y3'), num: true, render: (r) => (r.fte as number[]).map((x) => num(x, 1)).join(' / ') },
          { key: 'grossMonthly', label: t('Gross / month'), num: true, render: (r) => eur(r.grossMonthly as number) },
          { key: 'annualEmployerCostY1', label: t('Employer cost Y1'), num: true, render: (r) => eur(r.annualEmployerCostY1 as number) },
        ]} />
      </Card>
      {memo && <Card title={t('Organisation design notes')}><Markdown text={memo.markdown} /></Card>}
    </>
  );
}

export function Salary({ inputs }: ModProps) {
  const { t, lang } = useI18n();
  const [gross, setGross] = useState(1500);
  const [pension, setPension] = useState(inputs.staffing.employerPensionRate);
  const net = kosovoNetMonthly(gross);
  const emp = employerCost(gross, pension);
  return (
    <>
      <div className="grid-2">
        <Card title={t('Kosovo payroll calculator')} sub={t('Personal income tax uses annual brackets: 0% up to €3,000, 8% up to €5,400, 10% above (Law 08/L-142, per PwC). Pension is 5% employee and 5% employer.')}>
          <NumberField label={t('Gross monthly salary')} unit="EUR" value={gross} onChange={(v) => setGross(v ?? 0)} />
          <NumberField label={t('Employer pension rate')} unit="pct" value={pension} onChange={(v) => setPension(v ?? 0)} />
          <table style={{ marginTop: 10 }}><tbody>
            <tr><td>{t('Employee pension (5%)')}</td><td className="num">{eur(net.employeePension, 2)}</td></tr>
            <tr><td>{t('Personal income tax')}</td><td className="num">{eur(net.incomeTax, 2)}</td></tr>
            <tr className="total"><td>{t('Net monthly pay')}</td><td className="num">{eur(net.net, 2)}</td></tr>
            <tr><td>{t('Employer pension')}</td><td className="num">{eur(emp - gross, 2)}</td></tr>
            <tr className="total"><td>{t('Employer cost / month')}</td><td className="num">{eur(emp, 2)}</td></tr>
            <tr className="total"><td>{t('Employer cost / year (excl. bonus & benefits)')}</td><td className="num">{eur(emp * 12)}</td></tr>
          </tbody></table>
        </Card>
        <Card title={t('Market anchors (observed)')} sub={t('No role-specific Kosovo bank salary was verified. The figures below are official or secondary aggregates.')}>
          <DataTable rows={DATA.salaryEvidence} cols={[{ key: 'role_or_scope', label: t('Scope'), render: (r) => field(lang, r, 'role_or_scope') }, { key: 'year', label: t('Year') },
            { key: 'gross_or_net', label: t('Basis'), render: (r) => t(r.gross_or_net) },
            { key: 'amount_eur', label: 'EUR', num: true, render: (r) => (r.amount_eur ? num(Number(r.amount_eur)) : '–') },
            { key: 'observed_or_estimated', label: t('Status'), render: (r) => <SourceBadge s={r.observed_or_estimated} /> }, { key: 'notes', label: t('Notes (source language)') }]} />
        </Card>
      </div>
      <Card title={t('Salary bands by role (low / base / high gross monthly, EUR)')}>
        <DataTable rows={DATA.roles} cols={[{ key: 'role', label: t('Role'), render: (r) => field(lang, r, 'role') }, { key: 'department', label: t('Department'), render: (r) => t(r.department) },
          { key: 'gross_monthly_low_eur', label: t('Low'), num: true, render: (r) => num(Number(r.gross_monthly_low_eur)) },
          { key: 'gross_monthly_base_eur', label: t('Base'), num: true, render: (r) => num(Number(r.gross_monthly_base_eur)) },
          { key: 'gross_monthly_high_eur', label: t('High'), num: true, render: (r) => num(Number(r.gross_monthly_high_eur)) },
          { key: 'bonus_pct_base', label: t('Bonus %'), num: true, render: (r) => `${num(Number(r.bonus_pct_base) * 100)}%` },
          { key: 'net', label: t('Net (base)'), num: true, render: (r) => eur(kosovoNetMonthly(Number(r.gross_monthly_base_eur)).net) },
          { key: 'salary_source_status', label: t('Evidence'), render: (r) => <SourceBadge s={r.salary_source_status} /> }, { key: 'salary_rationale', label: t('Rationale (source language)') }]} />
      </Card>
    </>
  );
}
