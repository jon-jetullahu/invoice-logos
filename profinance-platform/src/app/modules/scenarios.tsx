import { useMemo } from 'react';
import { applyCase, runModel, STRESS_LIBRARY, withStress, type CapitalInjection, type ModelResult } from '../../engine';
import { Card, ChartCard, DataTable, Kpi, NumberField, VerdictChip } from '../components';
import type { ModProps } from '../data';
import { eurM, pct } from '../format';

function summary(r: ModelResult) {
  const op = r.months.filter((m) => m.rel >= 0);
  return {
    minCar: Math.min(...op.map((m) => m.car ?? Infinity)),
    minCash: r.capitalAnalysis.minCash,
    y3: r.years[3]?.netIncome ?? 0,
    y5: r.years[5]?.netIncome ?? 0,
    y10: r.years[10]?.netIncome ?? 0,
    extra: r.capitalAnalysis.additionalEquityIndicated,
    be: r.capitalAnalysis.breakEvenMonthlyRel,
    roe10: r.years[10]?.roe ?? null,
    funding: r.statuses.funding.status,
    reg: r.statuses.regulatory.status,
  };
}

export function ScenarioStress({ inputs, set }: ModProps) {
  const cases = useMemo(() => (['low', 'base', 'high'] as const).map((c) => {
    // applyCase keeps the current scenario's other stress settings; it sets its own NPL and yield shocks
    return { c, r: runModel(applyCase(inputs, c, inputs.staffing.scenario)) };
  }), [inputs]);
  const stresses = useMemo(() => [{ id: 'current', label: 'Current scenario (no extra shock)', r: runModel(inputs) },
    ...STRESS_LIBRARY.map((s) => ({ id: s.id, label: s.label, r: runModel(withStress(inputs, s.shock)) }))], [inputs]);
  const rows = stresses.map((s) => ({ label: s.label, ...summary(s.r) }));
  const cmp = cases.map(({ c, r }) => ({ label: c, ...summary(r) }));
  const chart = cases[0].r.years.map((y, i) => ({ year: y.label, low: y.netIncome, base: cases[1].r.years[i].netIncome, high: cases[2].r.years[i].netIncome }));
  const cols = [
    { key: 'label', label: 'Scenario' },
    { key: 'minCar', label: 'Min CAR', num: true, render: (r: Record<string, unknown>) => <span className={(r.minCar as number) < 0.12 ? 'neg' : ''}>{pct(r.minCar as number)}</span> },
    { key: 'minCash', label: 'Min cash', num: true, render: (r: Record<string, unknown>) => <span className={(r.minCash as number) < 0 ? 'neg' : ''}>{eurM(r.minCash as number)}</span> },
    { key: 'y3', label: 'NI Y3', num: true, render: (r: Record<string, unknown>) => eurM(r.y3 as number) },
    { key: 'y5', label: 'NI Y5', num: true, render: (r: Record<string, unknown>) => eurM(r.y5 as number) },
    { key: 'y10', label: 'NI Y10', num: true, render: (r: Record<string, unknown>) => eurM(r.y10 as number) },
    { key: 'roe10', label: 'ROE Y10', num: true, render: (r: Record<string, unknown>) => pct(r.roe10 as number | null) },
    { key: 'be', label: 'Break-even month', num: true, render: (r: Record<string, unknown>) => (r.be === null ? 'none' : String((r.be as number) + 1)) },
    { key: 'extra', label: 'Extra equity indicated', num: true, render: (r: Record<string, unknown>) => eurM(r.extra as number) },
    { key: 'funding', label: 'Funding', render: (r: Record<string, unknown>) => <VerdictChip v={String(r.funding)} /> },
    { key: 'reg', label: 'Regulatory', render: (r: Record<string, unknown>) => <VerdictChip v={String(r.reg)} /> },
  ];
  return (
    <>
      <Card title="Low / Base / High cases" sub="Low: volumes ×0.7, yield −1pp, NPL ×1.5, high costs and salaries. High: volumes ×1.2, yield +0.5pp, NPL ×0.8, low costs. All other inputs as in the current scenario.">
        <DataTable rows={cmp} cols={cols} />
      </Card>
      <ChartCard title="Net income by case" data={chart} xKey="year" series={[{ key: 'low', label: 'Low' }, { key: 'base', label: 'Base' }, { key: 'high', label: 'High' }]} />
      <Card title="Stress-test library (applied to the current scenario)"><DataTable rows={rows} cols={cols} /></Card>
      <Card title="Custom stress on the current scenario" sub="These shocks apply to every module.">
        <div className="grid">
          <div>
            <NumberField label="NPL multiplier" value={inputs.stress.nplMultiplier} onChange={(v) => set('stress.nplMultiplier', v ?? 1)} />
            <NumberField label="Deposit run-off" unit="pct" value={inputs.stress.depositShockPct} onChange={(v) => set('stress.depositShockPct', v ?? 0)} />
            <NumberField label="Run-off month (rel. go-live)" value={inputs.stress.depositShockRelMonth} onChange={(v) => set('stress.depositShockRelMonth', v ?? 0)} />
          </div>
          <div>
            <NumberField label="Funding-cost shock (bp)" value={inputs.stress.rateShockBp} onChange={(v) => set('stress.rateShockBp', v ?? 0)} />
            <NumberField label="Opex overrun" unit="pct" value={inputs.stress.opexOverrunPct} onChange={(v) => set('stress.opexOverrunPct', v ?? 0)} />
            <NumberField label="Growth haircut" unit="pct" value={inputs.stress.growthHaircutPct} onChange={(v) => set('stress.growthHaircutPct', v ?? 0)} />
            <NumberField label="Yield shift" unit="pct" value={inputs.stress.yieldShiftPp} onChange={(v) => set('stress.yieldShiftPp', v ?? 0)} />
          </div>
        </div>
      </Card>
    </>
  );
}

export function Shareholders({ inputs, result: r, set, readOnly }: ModProps) {
  const inj = inputs.capital.injections;
  const upd = (i: number, patch: Partial<CapitalInjection>) => set('capital.injections', inj.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const add = () => set('capital.injections', [...inj, { id: `INJ-${Date.now()}`, label: 'New investor', relMonth: 24, amount: 5_000_000, instrument: 'ordinary_equity',
    investor: 'new_investor', preMoneyValuation: 15_000_000, subordinatedRate: 0.07, enabled: true, source: 'UNSOURCED_ASSUMPTION', note: '' } satisfies CapitalInjection]);
  const last = r.investor.capTable[r.investor.capTable.length - 1];
  return (
    <>
      <div className="banner">Nominal ordinary share capital of <b>€11.4m is not cash and is not eligible regulatory capital</b> until verified. Capital only enters the model through the injections below. In the management preset the first injection is a labelled demo assumption.</div>
      <div className="kpis">
        <Kpi label="Additional equity indicated" value={eurM(r.capitalAnalysis.additionalEquityIndicated)} tone={r.capitalAnalysis.additionalEquityIndicated > 0 ? 'neg' : undefined} note="to avoid negative cash and meet the target CAR" />
        <Kpi label="Investor IRR (10y)" value={pct(r.investor.irr)} note={`exit at ${inputs.valuation.exitPriceToBook}× book`} />
        <Kpi label={`NPV @ ${pct(inputs.valuation.costOfEquity, 0)} CoE`} value={eurM(r.investor.npv)} />
        <Kpi label="Exit equity value (Y10)" value={eurM(r.investor.exitEquityValue)} />
      </div>
      <Card title="Capital injections" right={!readOnly && <button className="btn small" onClick={add}>+ Add</button>}>
        <div className="table-wrap"><table>
          <thead><tr><th>On</th><th>Label</th><th className="num">Month (rel. go-live)</th><th className="num">Amount €</th><th>Instrument</th><th>Investor</th><th className="num">Pre-money €</th><th className="num">Sub-debt rate</th><th>Source / note</th><th /></tr></thead>
          <tbody>{inj.map((x, i) => (
            <tr key={x.id}>
              <td><input type="checkbox" disabled={readOnly} checked={x.enabled} onChange={(e) => upd(i, { enabled: e.target.checked })} /></td>
              <td><input disabled={readOnly} value={x.label} onChange={(e) => upd(i, { label: e.target.value })} /></td>
              <td className="num"><input type="number" disabled={readOnly} style={{ width: 70 }} value={x.relMonth} onChange={(e) => upd(i, { relMonth: Number(e.target.value) })} /></td>
              <td className="num"><input type="number" disabled={readOnly} value={x.amount} onChange={(e) => upd(i, { amount: Number(e.target.value) })} /></td>
              <td><select disabled={readOnly} value={x.instrument} onChange={(e) => upd(i, { instrument: e.target.value as CapitalInjection['instrument'] })}><option value="ordinary_equity">Ordinary equity (CET1)</option><option value="subordinated_loan">Subordinated loan (T2)</option></select></td>
              <td><select disabled={readOnly} value={x.investor} onChange={(e) => upd(i, { investor: e.target.value as CapitalInjection['investor'] })}><option value="existing_shareholders">Existing shareholders</option><option value="new_investor">New investor</option></select></td>
              <td className="num"><input type="number" disabled={readOnly} value={x.preMoneyValuation ?? ''} onChange={(e) => upd(i, { preMoneyValuation: e.target.value === '' ? null : Number(e.target.value) })} /></td>
              <td className="num"><input type="number" disabled={readOnly} step="0.005" style={{ width: 70 }} value={x.subordinatedRate} onChange={(e) => upd(i, { subordinatedRate: Number(e.target.value) })} /></td>
              <td className="small">{x.source}<br />{x.note}</td>
              <td>{!readOnly && <button className="btn small" onClick={() => set('capital.injections', inj.filter((_, k) => k !== i))}>✕</button>}</td>
            </tr>))}
          </tbody></table></div>
      </Card>
      <div className="grid-2">
        <Card title="Ownership after each equity round">
          {r.investor.capTable.length === 0 ? <p className="muted">No equity injections enabled.</p> : (
            <table><thead><tr><th>After</th>{last.holders.map((h) => <th key={h.holder} className="num">{h.holder}</th>)}</tr></thead>
              <tbody>{r.investor.capTable.map((row) => (
                <tr key={row.afterInjectionId}><td>{inj.find((x) => x.id === row.afterInjectionId)?.label} (M{row.relMonth})</td>
                  {last.holders.map((h) => <td key={h.holder} className="num">{pct(row.holders.find((x) => x.holder === h.holder)?.ownership ?? 0)}</td>)}</tr>))}
              </tbody></table>)}
        </Card>
        <Card title="Valuation assumptions">
          <NumberField label="Exit price-to-book (Y10)" value={inputs.valuation.exitPriceToBook} onChange={(v) => set('valuation.exitPriceToBook', v ?? 0)} />
          <NumberField label="Cost of equity" unit="pct" value={inputs.valuation.costOfEquity} onChange={(v) => set('valuation.costOfEquity', v ?? 0)} />
          <NumberField label="Tier 2 cap (% of CET1)" unit="pct" value={inputs.capital.tier2CapPctOfTier1} onChange={(v) => set('capital.tier2CapPctOfTier1', v ?? 0)} meta="Eligibility rules not verified" />
        </Card>
      </div>
      <Card title="Opening portfolio transfer from the NBFI (optional)" sub="This is an alternative to a cash-only start. The transferred portfolio, about €9m per unverified management comments, enters as in-kind equity net of legacy borrowings.">
        <div className="grid">
          <div>
            <NumberField label="Transfer enabled (1 = yes)" value={inputs.openingTransfer.enabled ? 1 : 0} onChange={(v) => set('openingTransfer.enabled', v === 1)} />
            <NumberField label="Portfolio transferred" unit="EUR" value={inputs.openingTransfer.portfolio} onChange={(v) => set('openingTransfer.portfolio', v ?? 0)} />
          </div>
          <div>
            <NumberField label="Legacy borrowings transferred" unit="EUR" value={inputs.openingTransfer.legacyBorrowings} onChange={(v) => set('openingTransfer.legacyBorrowings', v ?? 0)} />
            <NumberField label="Legacy borrowing rate" unit="pct" value={inputs.openingTransfer.legacyBorrowingRate} onChange={(v) => set('openingTransfer.legacyBorrowingRate', v ?? 0)} />
          </div>
        </div>
      </Card>
    </>
  );
}
