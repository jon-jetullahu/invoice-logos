import { Card, ChartCard, DataTable, Kpi, SourceBadge, VerdictChip } from '../components';
import { DATA, type ModProps } from '../data';
import { eurM, num, pct } from '../format';

export function Dashboard({ result: r, inputs }: ModProps) {
  const y = (n: number) => r.years.find((x) => x.year === n);
  const y3 = y(3), y5 = y(5), y10 = y(10);
  const ca = r.capitalAnalysis;
  const opMonths = r.months.filter((m) => m.rel >= 0);
  const minCar = Math.min(...opMonths.map((m) => m.car ?? Infinity));
  const yearly = r.years.map((x) => ({ year: x.label, loans: x.grossLoans, deposits: x.deposits, equity: x.equity, cash: x.cashTotal, ni: x.netIncome }));
  return (
    <>
      <div className="grid">
        <Card title="Profitability"><VerdictChip v={r.statuses.profitability.status} /><p className="small">{r.statuses.profitability.detail}</p></Card>
        <Card title="Funding"><VerdictChip v={r.statuses.funding.status} /><p className="small">{r.statuses.funding.detail}</p></Card>
        <Card title="Liquidity"><VerdictChip v={r.statuses.liquidity.status} /><p className="small">{r.statuses.liquidity.detail}</p></Card>
        <Card title="Regulatory feasibility"><VerdictChip v={r.statuses.regulatory.status} /><p className="small">{r.statuses.regulatory.detail}</p></Card>
      </div>
      <div className="kpis">
        <Kpi label="Capital paid into bank" value={eurM(r.months.find((m) => m.rel === -1)?.shareCapital ?? 0)} note={inputs.capital.injections.some((i) => i.enabled && i.source === 'DEMO_PRESET') ? 'Demo assumption – unverified' : 'Per capital plan'} />
        <Kpi label="Additional equity indicated" value={eurM(ca.additionalEquityIndicated)} tone={ca.additionalEquityIndicated > 0 ? 'neg' : undefined} note={`max(cash gap ${eurM(ca.cashShortfall)}, capital gap to ${pct(inputs.capital.targetCar, 0)} target ${eurM(ca.capitalShortfallToTarget)})`} />
        <Kpi label="Minimum cash" value={eurM(ca.minCash)} tone={ca.minCash < 0 ? 'neg' : undefined} note={`month ${ca.minCashRelMonth} after go-live`} />
        <Kpi label="Minimum CAR (operating)" value={Number.isFinite(minCar) ? pct(minCar) : '–'} tone={minCar < 0.12 ? 'neg' : undefined} note="vs 12% reported minimum (unverified)" />
        <Kpi label="Monthly break-even" value={ca.breakEvenMonthlyRel === null ? 'not reached' : `month ${ca.breakEvenMonthlyRel + 1}`} note={ca.breakEvenCumulativeRel === null ? 'cumulative: not reached' : `cumulative: month ${ca.breakEvenCumulativeRel + 1}`} />
        <Kpi label="Net income Y3 / Y5 / Y10" value={`${eurM(y3?.netIncome, 1)} / ${eurM(y5?.netIncome, 1)} / ${eurM(y10?.netIncome, 1)}`} />
        <Kpi label="ROE Y5 / Y10" value={`${pct(y5?.roe ?? null)} / ${pct(y10?.roe ?? null)}`} note="– = equity below 4% of assets (denominator unreliable)" />
        <Kpi label="Cost-to-income Y3 / Y10" value={`${pct(y3?.costToIncome ?? null, 0)} / ${pct(y10?.costToIncome ?? null, 0)}`} />
        <Kpi label="Employees Y3 vs CBS seats" value={`${num(y3?.fte)} FTE / ${num(y3?.cbsSeats)} seats`} note="Seats ≠ headcount" />
        <Kpi label="Investor IRR (10y, P/B exit)" value={pct(r.investor.irr)} note={`exit ×${inputs.valuation.exitPriceToBook} book – assumption`} />
      </div>
      <div className="grid-2">
        <ChartCard title="Balance sheet trajectory" sub="Year-end stocks, EUR" data={yearly} xKey="year"
          series={[{ key: 'loans', label: 'Gross financing' }, { key: 'deposits', label: 'Deposits' }, { key: 'equity', label: 'Equity' }, { key: 'cash', label: 'Cash & liquidity' }]} />
        <ChartCard title="Net income by year" sub="Pre-op = licensing & implementation period" data={yearly} xKey="year" series={[{ key: 'ni', label: 'Net income', kind: 'bar' }]} />
      </div>
      <Card title="Open blockers and data gaps" sub="Results stay illustrative until the blocking items are resolved.">
        <DataTable rows={r.blockers as unknown as Record<string, unknown>[]} cols={[
          { key: 'severity', label: 'Severity', render: (b) => <VerdictChip v={b.severity === 'BLOCKING' ? 'FAIL' : b.severity === 'WARNING' ? 'UNDETERMINED' : 'INFO'} label={String(b.severity)} /> },
          { key: 'code', label: 'Code' }, { key: 'message', label: 'Detail' }]} />
      </Card>
      <Card title="Model integrity checks">
        <DataTable rows={r.checks as unknown as Record<string, unknown>[]} cols={[
          { key: 'passed', label: 'Result', render: (c) => <VerdictChip v={c.passed ? 'PASS' : 'FAIL'} /> }, { key: 'id', label: 'Check' }, { key: 'detail', label: 'Detail' }]} />
      </Card>
    </>
  );
}

export function Industry() {
  const sector = DATA.sector;
  return (
    <>
      <div className="banner">Sector figures come from search-engine extracts of CBK, IMF and statistics-agency publications. The original PDFs could not be downloaded in the research environment, so every figure is marked with its source and confidence.</div>
      <div className="kpis">
        {['SEC-001', 'SEC-002', 'SEC-004', 'SEC-005', 'SEC-007', 'SEC-003', 'SEC-010', 'SEC-011'].map((id) => {
          const s = sector.find((x) => x.indicator_id === id)!;
          const v = Number(s.value);
          const shown = s.unit === 'fraction' ? pct(v) : s.unit === 'EUR_billion' ? `€${v}bn` : s.unit === 'EUR_million' ? `€${v}m` : num(v);
          return <div className="kpi" key={id}><div className="label">{s.label}</div><div className="value">{shown}</div><div className="note">{s.period_end} · {s.confidence} confidence</div></div>;
        })}
      </div>
      <Card title="Kosovo banking sector indicators">
        <DataTable rows={sector} cols={[{ key: 'label', label: 'Indicator' }, { key: 'period_end', label: 'Period' }, { key: 'value', label: 'Value', num: true },
          { key: 'unit', label: 'Unit' }, { key: 'source_type', label: 'Source', render: (r) => <SourceBadge s={r.source_type} /> }, { key: 'confidence', label: 'Conf.' }, { key: 'notes', label: 'Notes' }]} />
      </Card>
      <Card title="Institution roster: current and historical" sub="Reconcile against CBK licensed-institution lists (Oct-2025, Aug-2025, Feb-2024), once downloaded.">
        <DataTable rows={DATA.institutions} cols={[{ key: 'legal_name_current_or_last', label: 'Institution' }, { key: 'aliases_and_predecessors', label: 'Aliases / predecessors' },
          { key: 'entity_type', label: 'Type' }, { key: 'ownership_origin', label: 'Ownership' }, { key: 'status_2026', label: 'Status' },
          { key: 'first_operating_year', label: 'From', num: true }, { key: 'last_operating_year', label: 'To', num: true },
          { key: 'verification_status', label: 'Verification', render: (r) => <SourceBadge s={r.verification_status} /> }, { key: 'notes', label: 'Notes' }]} />
      </Card>
    </>
  );
}

export function Historical({ result }: ModProps) {
  const y4 = result.years.find((y) => y.year === 4);
  const pri = (m: string) => DATA.historical.find((h) => h.institution_id === 'pribank' && h.metric_id === m);
  const cov = DATA.coverage;
  const byStatus = cov.reduce<Record<string, number>>((a, r) => ({ ...a, [r.status]: (a[r.status] ?? 0) + 1 }), {});
  return (
    <>
      <div className="banner"><b>No audited bank report has been extracted yet.</b> Every comparator below is a secondary or search-derived figure. None of them is used as a Pro Finance fact or used to fill missing data.</div>
      <Card title="PriBank (de-novo 2022) vs Pro Finance plan in operating year 4" sub="PriBank 2025 is its 4th year. Figures are from the SeeNews profile, with currency and unit unconfirmed.">
        <table>
          <thead><tr><th>Metric</th><th className="num">PriBank 2025 (secondary)</th><th className="num">Pro Finance plan Y4 (model)</th></tr></thead>
          <tbody>
            <tr><td>Total assets</td><td className="num">{eurM(Number(pri('total_assets')?.value))}</td><td className="num">{eurM(y4?.totalAssets)}</td></tr>
            <tr><td>Net profit</td><td className="num">{eurM(Number(pri('net_profit')?.value), 2)}</td><td className="num">{eurM(y4?.netIncome)}</td></tr>
            <tr><td>Employees</td><td className="num">{num(Number(pri('employees')?.value))}</td><td className="num">{num(y4?.fte)}</td></tr>
            <tr><td>Assets per employee</td><td className="num">{eurM(Number(pri('total_assets')?.value) / Number(pri('employees')?.value))}</td><td className="num">{eurM((y4?.totalAssets ?? 0) / (y4?.fte || 1))}</td></tr>
          </tbody>
        </table>
      </Card>
      <Card title="Extracted observations (all provenance retained)">
        <DataTable rows={DATA.historical} cols={[{ key: 'institution_id', label: 'Bank' }, { key: 'metric_id', label: 'Metric' }, { key: 'period_end', label: 'Period' },
          { key: 'value', label: 'Value', num: true }, { key: 'unit', label: 'Unit' }, { key: 'stock_or_flow', label: 'Stock/flow' },
          { key: 'source_type', label: 'Source', render: (r) => <SourceBadge s={r.source_type} /> }, { key: 'confidence', label: 'Conf.' }, { key: 'notes', label: 'Notes' }]} />
      </Card>
      <Card title="Report coverage matrix" sub={`${cov.length} institution-years · ${Object.entries(byStatus).map(([k, v]) => `${k}: ${v}`).join(' · ')} · verified 0%`}>
        <DataTable rows={cov} cols={[{ key: 'institution', label: 'Institution' }, { key: 'fiscal_year', label: 'FY', num: true },
          { key: 'status', label: 'Status', render: (r) => <SourceBadge s={r.status === 'BLOCKED' ? 'NOT_OBTAINED' : r.status === 'NOT_YET_LOCATED' ? 'UNSOURCED_ASSUMPTION' : 'REPORTED_UNVERIFIED'} /> },
          { key: 'status', label: 'Raw status' }, { key: 'documents', label: 'Documents' }, { key: 'gap_note', label: 'Gap' }]} max={420} />
      </Card>
    </>
  );
}
