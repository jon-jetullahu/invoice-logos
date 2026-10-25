import { useState } from 'react';
import { ASSUMPTIONS, getPath, reconcileFiveYearQuote, type ModelInputs, type ModelResult } from '../../engine';
import { Card, DataTable, Markdown, PathField, SourceBadge, VerdictChip } from '../components';
import { DATA, type ModProps } from '../data';
import { eurM, num, pct } from '../format';

export function Sources() {
  const [memo, setMemo] = useState(DATA.memos[0]?.file ?? '');
  const [tab, setTab] = useState<'docs' | 'legal' | 'coverage' | 'retrieval' | 'datasets' | 'quality'>('docs');
  const m = DATA.memos.find((x) => x.file === memo);
  const tabs = { docs: 'Document registry', legal: 'Legal sources', coverage: 'Coverage matrix', retrieval: 'Retrieval log', datasets: 'Datasets & checksums', quality: 'Quality checks' } as const;
  return (
    <>
      <div className="banner">Sources are kept separate from estimates. <b>No primary Kosovo PDF could be downloaded from the research environment</b>, because the egress policy blocked bqk-kos.org, the bank websites and web.archive.org. Each attempt is in the retrieval log. Run <code>collection/collector.py --wayback --discover</code> on a machine with open internet to acquire them.</div>
      <Card title="Research library" right={<select value={tab} onChange={(e) => setTab(e.target.value as typeof tab)}>{Object.entries(tabs).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>}>
        {tab === 'docs' && <DataTable rows={DATA.documents} cols={[{ key: 'document_id', label: 'ID' }, { key: 'publisher', label: 'Publisher' }, { key: 'title', label: 'Title' }, { key: 'fiscal_year', label: 'FY' },
          { key: 'document_type', label: 'Type' }, { key: 'retrieval_status', label: 'Retrieval' }, { key: 'url', label: 'URL', render: (r) => <a href={r.url} target="_blank" rel="noreferrer">open</a> }, { key: 'notes', label: 'Notes' }]} />}
        {tab === 'legal' && <DataTable rows={DATA.legal} cols={[{ key: 'source_id', label: 'ID' }, { key: 'title', label: 'Title' }, { key: 'effective_date', label: 'Effective' }, { key: 'status_as_of_2026_10_25', label: 'Status' },
          { key: 'retrieval_status', label: 'Retrieval' }, { key: 'url', label: 'URL', render: (r) => <a href={r.url} target="_blank" rel="noreferrer">open</a> }, { key: 'verification_notes', label: 'Notes' }]} />}
        {tab === 'coverage' && <DataTable rows={DATA.coverage} cols={[{ key: 'institution', label: 'Institution' }, { key: 'fiscal_year', label: 'FY' }, { key: 'status', label: 'Status' }, { key: 'documents', label: 'Docs' }, { key: 'gap_note', label: 'Gap' }]} />}
        {tab === 'retrieval' && <DataTable rows={DATA.retrieval} cols={[{ key: 'timestamp_utc', label: 'UTC' }, { key: 'document_id', label: 'Doc' }, { key: 'method', label: 'Method' }, { key: 'outcome', label: 'Outcome' }, { key: 'error_class', label: 'Error' }, { key: 'url', label: 'URL' }]} />}
        {tab === 'datasets' && <DataTable rows={DATA.datasetIndex as unknown as Record<string, unknown>[]} cols={[{ key: 'dataset', label: 'Dataset' }, { key: 'path', label: 'Path' }, { key: 'rows', label: 'Rows', num: true }, { key: 'sha256', label: 'SHA-256', render: (r) => <code className="small">{String(r.sha256).slice(0, 16)}…</code> }]} />}
        {tab === 'quality' && <DataTable rows={DATA.quality} cols={[{ key: 'check', label: 'Check' }, { key: 'subject', label: 'Subject' }, { key: 'result', label: 'Result' }, { key: 'detail', label: 'Detail' }]} />}
      </Card>
      <Card title="Research memos" right={<select value={memo} onChange={(e) => setMemo(e.target.value)}>{DATA.memos.map((x) => <option key={x.file} value={x.file}>{x.title}</option>)}</select>}>
        {m && <Markdown text={m.markdown} />}
      </Card>
      <Card title="Package assumption register (original)" sub="From 05_Model_Specification/assumption_register.csv. Every item is mapped to an editable input in Assumptions.">
        <DataTable rows={DATA.assumptionRegister} cols={[{ key: 'metric_id', label: 'Metric' }, { key: 'description', label: 'Description' }, { key: 'source_type', label: 'Source type' }, { key: 'blocking_if_missing', label: 'Blocking' }]} />
      </Card>
    </>
  );
}

export function Assumptions({ inputs, set }: ModProps) {
  const groups = [...new Set(ASSUMPTIONS.map((a) => a.group))];
  return (
    <>
      <div className="banner">Every major assumption can be edited here or in its own module. Badges show the evidence class. <b>Management</b> = Pro Finance projections. <b>Vendor</b> = non-binding quotes. <b>CBK reported</b> = search-derived and needs verification. <b>Unsourced</b> = modelling assumption. <b>Demo preset</b> = illustration only.</div>
      <div className="grid-2">
        {groups.map((g) => (
          <Card key={g} title={g}>
            {ASSUMPTIONS.filter((a) => a.group === g).map((a) => (
              <PathField key={a.path} obj={inputs} path={a.path} set={set} label={a.label} unit={a.unit}
                meta={<span><SourceBadge s={a.source} /> {a.note}</span>} />
            ))}
          </Card>
        ))}
      </div>
    </>
  );
}

function boardRows(r: ModelResult) {
  return r.years.map((y) => [y.label, y.grossLoans, y.deposits, y.cashTotal, y.equity, y.nii, y.feeIncome, y.opex, y.provisionExpense, y.netIncome, y.car, y.fte]);
}

async function exportExcel(inputs: ModelInputs, r: ModelResult) {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Pro Finance Banking Transformation Platform';
  const readme = wb.addWorksheet('README');
  readme.addRows([
    ['Pro Finance Home – Banking Transformation Model'], ['Scenario', inputs.name], ['Exported', new Date().toISOString()],
    ['STATUS', 'ILLUSTRATIVE – based on editable assumptions; no audited opening balance sheet; regulatory thresholds unverified.'],
    ['Profitability', r.statuses.profitability.status, r.statuses.profitability.detail], ['Funding', r.statuses.funding.status, r.statuses.funding.detail],
    ['Liquidity', r.statuses.liquidity.status, r.statuses.liquidity.detail], ['Regulatory', r.statuses.regulatory.status, r.statuses.regulatory.detail], [],
    ['Blockers'], ...r.blockers.map((b) => [b.severity, b.code, b.message]), [], ['Integrity checks'], ...r.checks.map((c) => [c.passed ? 'PASS' : 'FAIL', c.id, c.detail]),
  ]);
  readme.getColumn(1).width = 22; readme.getColumn(2).width = 40; readme.getColumn(3).width = 100;
  const as = wb.addWorksheet('Assumptions');
  as.addRow(['Group', 'Assumption', 'Path', 'Value', 'Unit', 'Source type', 'Note']);
  for (const a of ASSUMPTIONS) as.addRow([a.group, a.label, a.path, JSON.stringify(getPath(inputs, a.path)), a.unit, a.source, a.note]);
  as.addRow([]); as.addRow(['Full input JSON', JSON.stringify(inputs)]);
  const yearKeys = Object.keys(r.years[0]).filter((k) => typeof (r.years[0] as unknown as Record<string, unknown>)[k] === 'number');
  const ys = wb.addWorksheet('Annual');
  ys.addRow(['Line item', ...r.years.map((y) => y.label)]);
  for (const k of yearKeys) ys.addRow([k, ...r.years.map((y) => (y as unknown as Record<string, number>)[k])]);
  const ms = wb.addWorksheet('Monthly');
  const mKeys = Object.keys(r.months[0]).filter((k) => typeof (r.months[0] as unknown as Record<string, unknown>)[k] === 'number');
  ms.addRow(mKeys);
  for (const m of r.months) ms.addRow(mKeys.map((k) => (m as unknown as Record<string, number>)[k]));
  const rg = wb.addWorksheet('Regulatory');
  rg.addRow(['Rule', 'Test', 'Verdict', 'Indicative', 'Worst value', 'Threshold', 'Rule status', 'Reason']);
  for (const t of r.regulatory) rg.addRow([t.ruleId, t.label, t.verdict, t.indicative, t.worstValue, t.threshold, t.ruleStatus, t.reason]);
  const src = wb.addWorksheet('Sources');
  src.addRow(['Document', 'Publisher', 'Title', 'FY', 'URL', 'Retrieval status', 'Notes']);
  for (const d of DATA.documents) src.addRow([d.document_id, d.publisher, d.title, d.fiscal_year, d.url, d.retrieval_status, d.notes]);
  src.addRow([]);
  for (const d of DATA.legal) src.addRow([d.source_id, 'legal', d.title, d.effective_date, d.url, d.retrieval_status, d.verification_notes]);
  const cbs = reconcileFiveYearQuote();
  src.addRow([]); src.addRow(['CBS quote reconciliation', ...cbs.flags]);
  const buf = await wb.xlsx.writeBuffer();
  download(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `ProFinance_${inputs.name.replace(/\W+/g, '_')}_ILLUSTRATIVE.xlsx`);
}

function download(blob: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function exportCsv(inputs: ModelInputs, r: ModelResult) {
  const keys = Object.keys(r.months[0]).filter((k) => typeof (r.months[0] as unknown as Record<string, unknown>)[k] === 'number');
  const lines = [`# ILLUSTRATIVE – ${inputs.name} – ${new Date().toISOString()}`, keys.join(','), ...r.months.map((m) => keys.map((k) => (m as unknown as Record<string, number>)[k]).join(','))];
  download(new Blob([lines.join('\n')], { type: 'text/csv' }), `ProFinance_monthly_${inputs.name.replace(/\W+/g, '_')}.csv`);
}

export function Exports({ inputs, result: r, setInputs, readOnly }: ModProps) {
  const [busy, setBusy] = useState(false);
  const importJson = (f: File) => f.text().then((t) => setInputs(JSON.parse(t) as ModelInputs));
  return (
    <>
      <Card title="Exports" sub="Every export carries the ILLUSTRATIVE label, the scenario inputs and the source metadata.">
        <div className="row no-print">
          <button className="btn primary" disabled={busy} onClick={() => { setBusy(true); exportExcel(inputs, r).finally(() => setBusy(false)); }}>Excel workbook (.xlsx)</button>
          <button className="btn" onClick={() => exportCsv(inputs, r)}>Monthly CSV</button>
          <button className="btn" onClick={() => download(new Blob([JSON.stringify(inputs, null, 2)], { type: 'application/json' }), `scenario_${inputs.name.replace(/\W+/g, '_')}.json`)}>Scenario JSON</button>
          {!readOnly && <label className="btn">Import scenario JSON<input type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} /></label>}
          <button className="btn" onClick={() => window.print()}>Print / save board report as PDF</button>
        </div>
      </Card>
      <Card title="Board summary report" sub={`${inputs.name} · generated ${new Date().toLocaleDateString('en-GB')} · ILLUSTRATIVE, NOT A REGULATORY FILING`}>
        <h2>1. Conclusions under current assumptions</h2>
        <table><tbody>
          <tr><td>Profitability</td><td><VerdictChip v={r.statuses.profitability.status} /></td><td>{r.statuses.profitability.detail}</td></tr>
          <tr><td>Funding</td><td><VerdictChip v={r.statuses.funding.status} /></td><td>{r.statuses.funding.detail}</td></tr>
          <tr><td>Liquidity</td><td><VerdictChip v={r.statuses.liquidity.status} /></td><td>{r.statuses.liquidity.detail}</td></tr>
          <tr><td>Regulatory</td><td><VerdictChip v={r.statuses.regulatory.status} /></td><td>{r.statuses.regulatory.detail}</td></tr>
          <tr><td>Additional equity indicated</td><td colSpan={2}>{eurM(r.capitalAnalysis.additionalEquityIndicated)}: the larger of the peak cash gap ({eurM(r.capitalAnalysis.cashShortfall)}) and the gap to the {pct(inputs.capital.targetCar, 0)} CAR target ({eurM(r.capitalAnalysis.capitalShortfallToTarget)})</td></tr>
          <tr><td>Break-even</td><td colSpan={2}>Monthly: {r.capitalAnalysis.breakEvenMonthlyRel === null ? 'not reached' : `month ${r.capitalAnalysis.breakEvenMonthlyRel + 1}`}. Cumulative: {r.capitalAnalysis.breakEvenCumulativeRel === null ? 'not reached' : `month ${r.capitalAnalysis.breakEvenCumulativeRel + 1}`}</td></tr>
        </tbody></table>
        <h2 style={{ marginTop: 16 }}>2. Ten-year summary (EUR m)</h2>
        <table>
          <thead><tr>{['Year', 'Loans', 'Deposits', 'Cash', 'Equity', 'NII', 'Fees', 'Opex', 'ECL', 'Net income', 'CAR', 'FTE'].map((h) => <th key={h} className="num">{h}</th>)}</tr></thead>
          <tbody>{boardRows(r).map((row) => (
            <tr key={String(row[0])}>{row.map((v, i) => <td key={i} className="num">{i === 0 ? v : i === 10 ? pct(v as number | null) : i === 11 ? num(v as number) : ((v as number) / 1e6).toFixed(2)}</td>)}</tr>
          ))}</tbody>
        </table>
        <h2 style={{ marginTop: 16 }}>3. Matters requiring professional confirmation</h2>
        <ul>{r.blockers.filter((b) => b.severity !== 'INFO').map((b) => <li key={b.code}><b>{b.code}</b>: {b.message}</li>)}</ul>
        <p className="small muted">Source distinctions: management projections (Y1 to Y3 targets); vendor estimates (Facilization, non-binding); private preliminary estimates (Visa, USD); CBK rules (search-derived, unverified); model assumptions (editable). See the Source library for documents, URLs and retrieval status.</p>
      </Card>
    </>
  );
}
