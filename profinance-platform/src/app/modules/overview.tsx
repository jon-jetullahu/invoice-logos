import { Card, ChartCard, DataTable, Kpi, SourceBadge, VerdictChip } from '../components';
import { DATA, type ModProps } from '../data';
import { eurM, num, pct } from '../format';
import { field, Rich, useI18n, yearLabel } from '../i18n';
import { useMessages } from '../messages';

export function Dashboard({ result: r, inputs }: ModProps) {
  const { t, tc, lang } = useI18n();
  const msg = useMessages();
  const y = (n: number) => r.years.find((x) => x.year === n);
  const y3 = y(3), y5 = y(5), y10 = y(10);
  const ca = r.capitalAnalysis;
  const opMonths = r.months.filter((m) => m.rel >= 0);
  const minCar = Math.min(...opMonths.map((m) => m.car ?? Infinity));
  const yearly = r.years.map((x) => ({ year: yearLabel(lang, x.label), loans: x.grossLoans, deposits: x.deposits, equity: x.equity, cash: x.cashTotal, ni: x.netIncome }));
  const S = r.statuses;
  return (
    <>
      <div className="grid">
        <Card title={t('Profitability')}><VerdictChip v={S.profitability.status} /><p className="small">{msg.status(S.profitability)}</p></Card>
        <Card title={t('Funding')}><VerdictChip v={S.funding.status} /><p className="small">{msg.status(S.funding)}</p></Card>
        <Card title={t('Liquidity')}><VerdictChip v={S.liquidity.status} /><p className="small">{msg.status(S.liquidity)}</p></Card>
        <Card title={t('Regulatory feasibility')}><VerdictChip v={S.regulatory.status} /><p className="small">{msg.status(S.regulatory)}</p></Card>
      </div>
      <div className="kpis">
        <Kpi label={t('Capital paid into bank')} value={eurM(r.months.find((m) => m.rel === -1)?.shareCapital ?? 0)} note={inputs.capital.injections.some((i) => i.enabled && i.source === 'DEMO_PRESET') ? t('Demo assumption – unverified') : t('Per capital plan')} />
        <Kpi label={t('Additional equity indicated')} value={eurM(ca.additionalEquityIndicated)} tone={ca.additionalEquityIndicated > 0 ? 'neg' : undefined}
          note={t('max(cash gap {cash}, capital gap to {target} target {gap})', { cash: eurM(ca.cashShortfall), target: pct(inputs.capital.targetCar, 0), gap: eurM(ca.capitalShortfallToTarget) })} />
        <Kpi label={t('Minimum cash')} value={eurM(ca.minCash)} tone={ca.minCash < 0 ? 'neg' : undefined} note={t('month {m} after go-live', { m: ca.minCashRelMonth })} />
        <Kpi label={t('Minimum CAR (operating)')} value={Number.isFinite(minCar) ? pct(minCar) : '–'} tone={minCar < 0.12 ? 'neg' : undefined} note={t('vs 12% reported minimum (unverified)')} />
        <Kpi label={t('Monthly break-even')} value={ca.breakEvenMonthlyRel === null ? t('not reached') : t('month {m}', { m: ca.breakEvenMonthlyRel + 1 })}
          note={ca.breakEvenCumulativeRel === null ? t('cumulative: not reached') : t('cumulative: month {m}', { m: ca.breakEvenCumulativeRel + 1 })} />
        <Kpi label={t('Net income Y3 / Y5 / Y10')} value={`${eurM(y3?.netIncome, 1)} / ${eurM(y5?.netIncome, 1)} / ${eurM(y10?.netIncome, 1)}`} />
        <Kpi label={t('ROE Y5 / Y10')} value={`${pct(y5?.roe ?? null)} / ${pct(y10?.roe ?? null)}`} note={t('– = equity below 4% of assets (denominator unreliable)')} />
        <Kpi label={t('Cost-to-income Y3 / Y10')} value={`${pct(y3?.costToIncome ?? null, 0)} / ${pct(y10?.costToIncome ?? null, 0)}`} />
        <Kpi label={t('Employees Y3 vs CBS seats')} value={t('{fte} FTE / {seats} seats', { fte: num(y3?.fte), seats: num(y3?.cbsSeats) })} note={t('Seats ≠ headcount')} />
        <Kpi label={t('Investor IRR (10y, P/B exit)')} value={pct(r.investor.irr)} note={t('exit ×{pb} book – assumption', { pb: inputs.valuation.exitPriceToBook })} />
      </div>
      <div className="grid-2">
        <ChartCard title={t('Balance sheet trajectory')} sub={t('Year-end stocks, EUR')} data={yearly} xKey="year"
          series={[{ key: 'loans', label: t('Gross financing') }, { key: 'deposits', label: t('Deposits') }, { key: 'equity', label: t('Equity') }, { key: 'cash', label: t('Cash & liquidity') }]} />
        <ChartCard title={t('Net income by year')} sub={t('Pre-op = licensing & implementation period')} data={yearly} xKey="year" series={[{ key: 'ni', label: t('Net income'), kind: 'bar' }]} />
      </div>
      <Card title={t('Open blockers and data gaps')} sub={t('Results stay illustrative until the blocking items are resolved.')}>
        <DataTable rows={r.blockers as unknown as Record<string, unknown>[]} cols={[
          { key: 'severity', label: t('Severity'), render: (b) => <VerdictChip v={b.severity === 'BLOCKING' ? 'FAIL' : b.severity === 'WARNING' ? 'UNDETERMINED' : 'INFO'} label={tc(String(b.severity))} /> },
          { key: 'code', label: t('Code') }, { key: 'message', label: t('Detail'), render: (b) => msg.blocker(b as never) }]} />
      </Card>
      <Card title={t('Model integrity checks')}>
        <DataTable rows={r.checks as unknown as Record<string, unknown>[]} cols={[
          { key: 'passed', label: t('Result'), render: (c) => <VerdictChip v={c.passed ? 'PASS' : 'FAIL'} /> },
          { key: 'id', label: t('Check'), render: (c) => msg.check(c as never).label },
          { key: 'detail', label: t('Detail'), render: (c) => msg.check(c as never).detail }]} />
      </Card>
    </>
  );
}

export function Industry() {
  const { t, lang } = useI18n();
  const sector = DATA.sector;
  const unitLabel = (u: string, v: number) => (u === 'fraction' ? pct(v) : u === 'EUR_billion' ? eurM(v * 1e9, 2) : u === 'EUR_million' ? eurM(v * 1e6, 1) : num(v));
  return (
    <>
      <div className="banner"><Rich text={t('Sector figures come from search-engine extracts of CBK, IMF and statistics-agency publications. The original PDFs could not be downloaded in the research environment, so every figure is marked with its source and confidence.')} /></div>
      <div className="kpis">
        {['SEC-001', 'SEC-002', 'SEC-004', 'SEC-005', 'SEC-007', 'SEC-003', 'SEC-010', 'SEC-011'].map((id) => {
          const s = sector.find((x) => x.indicator_id === id)!;
          return <div className="kpi" key={id}><div className="label">{field(lang, s, 'label')}</div><div className="value">{unitLabel(s.unit, Number(s.value))}</div>
            <div className="note">{t('{period} · {conf} confidence', { period: s.period_end, conf: t(s.confidence) })}</div></div>;
        })}
      </div>
      <Card title={t('Kosovo banking sector indicators')}>
        <DataTable rows={sector} cols={[{ key: 'label', label: t('Indicator'), render: (r) => field(lang, r, 'label') }, { key: 'period_end', label: t('Period') },
          { key: 'value', label: t('Value'), num: true, render: (r) => unitLabel(r.unit, Number(r.value)) },
          { key: 'source_type', label: t('Source'), render: (r) => <SourceBadge s={r.source_type} /> }, { key: 'confidence', label: t('Conf.'), render: (r) => t(r.confidence) }, { key: 'notes', label: t('Notes (source language)') }]} />
      </Card>
      <Card title={t('Institution roster: current and historical')} sub={t('Reconcile against CBK licensed-institution lists (Oct-2025, Aug-2025, Feb-2024), once downloaded.')}>
        <DataTable rows={DATA.institutions} cols={[{ key: 'legal_name_current_or_last', label: t('Institution') }, { key: 'aliases_and_predecessors', label: t('Aliases / predecessors') },
          { key: 'entity_type', label: t('Type'), render: (r) => tcOr(t, r.entity_type) }, { key: 'ownership_origin', label: t('Ownership') }, { key: 'status_2026', label: t('Status'), render: (r) => tcOr(t, r.status_2026) },
          { key: 'first_operating_year', label: t('From'), num: true }, { key: 'last_operating_year', label: t('To'), num: true },
          { key: 'verification_status', label: t('Verification'), render: (r) => <SourceBadge s={r.verification_status} /> }, { key: 'notes', label: t('Notes (source language)') }]} />
      </Card>
    </>
  );
}

const tcOr = (t: (k: string) => string, code: string) => t(code) === code ? code.replace(/_/g, ' ') : t(code);

export function Historical({ result }: ModProps) {
  const { t, tc } = useI18n();
  const y4 = result.years.find((y) => y.year === 4);
  const pri = (m: string) => DATA.historical.find((h) => h.institution_id === 'pribank' && h.metric_id === m);
  const cov = DATA.coverage;
  const byStatus = cov.reduce<Record<string, number>>((a, r) => ({ ...a, [r.status]: (a[r.status] ?? 0) + 1 }), {});
  return (
    <>
      <div className="banner"><Rich text={t('**No audited bank report has been extracted yet.** Every comparator below is a secondary or search-derived figure. None of them is used as a Pro Finance fact or used to fill missing data.')} /></div>
      <Card title={t('PriBank (de-novo 2022) vs Pro Finance plan in operating year 4')} sub={t('PriBank 2025 is its 4th year. Figures are from the SeeNews profile, with currency and unit unconfirmed.')}>
        <table>
          <thead><tr><th>{t('Metric')}</th><th className="num">{t('PriBank 2025 (secondary)')}</th><th className="num">{t('Pro Finance plan Y4 (model)')}</th></tr></thead>
          <tbody>
            <tr><td>{t('Total assets')}</td><td className="num">{eurM(Number(pri('total_assets')?.value))}</td><td className="num">{eurM(y4?.totalAssets)}</td></tr>
            <tr><td>{t('Net profit')}</td><td className="num">{eurM(Number(pri('net_profit')?.value), 2)}</td><td className="num">{eurM(y4?.netIncome)}</td></tr>
            <tr><td>{t('Employees')}</td><td className="num">{num(Number(pri('employees')?.value))}</td><td className="num">{num(y4?.fte)}</td></tr>
            <tr><td>{t('Assets per employee')}</td><td className="num">{eurM(Number(pri('total_assets')?.value) / Number(pri('employees')?.value))}</td><td className="num">{eurM((y4?.totalAssets ?? 0) / (y4?.fte || 1))}</td></tr>
          </tbody>
        </table>
      </Card>
      <Card title={t('Extracted observations (all provenance retained)')}>
        <DataTable rows={DATA.historical} cols={[{ key: 'institution_id', label: t('Bank') }, { key: 'metric_id', label: t('Metric'), render: (r) => t(r.metric_id) }, { key: 'period_end', label: t('Period') },
          { key: 'value', label: t('Value'), num: true, render: (r) => num(Number(r.value), 2) }, { key: 'unit', label: t('Unit') }, { key: 'stock_or_flow', label: t('Stock/flow'), render: (r) => tc(r.stock_or_flow) },
          { key: 'source_type', label: t('Source'), render: (r) => <SourceBadge s={r.source_type} /> }, { key: 'confidence', label: t('Conf.'), render: (r) => t(r.confidence) }, { key: 'notes', label: t('Notes (source language)') }]} />
      </Card>
      <Card title={t('Report coverage matrix')} sub={t('{n} institution-years · {breakdown} · verified 0%', { n: cov.length, breakdown: Object.entries(byStatus).map(([k, v]) => `${tc(k)}: ${v}`).join(' · ') })}>
        <DataTable rows={cov} cols={[{ key: 'institution', label: t('Institution') }, { key: 'fiscal_year', label: t('FY'), num: true },
          { key: 'status', label: t('Status'), render: (r) => <SourceBadge s={r.status === 'BLOCKED' ? 'NOT_OBTAINED' : r.status === 'NOT_YET_LOCATED' ? 'UNSOURCED_ASSUMPTION' : 'REPORTED_UNVERIFIED'} /> },
          { key: 'raw', label: t('Raw status'), render: (r) => tc(r.status) }, { key: 'documents', label: t('Documents') }, { key: 'gap_note', label: t('Gap'), render: (r) => t(r.gap_note) }]} max={420} />
      </Card>
    </>
  );
}
