import { useState } from 'react';
import { ASSUMPTIONS, getPath, type ModelInputs, type ModelResult } from '../../engine';
import { Card, DataTable, Markdown, PathField, SourceBadge, VerdictChip } from '../components';
import { DATA, type ModProps } from '../data';
import { eurM, num, pct } from '../format';
import { Rich, translate, translateCode, useI18n, yearLabel, type Lang } from '../i18n';
import { makeMessages, useMessages } from '../messages';

/** Memos grouped by base name, preferring the active language (file.sq.md) and flagging English-only ones. */
function memosFor(lang: Lang) {
  const base = (f: string) => f.replace(/\.sq\.md$|\.md$/, '');
  const groups = new Map<string, typeof DATA.memos>();
  for (const m of DATA.memos) groups.set(base(m.file), [...(groups.get(base(m.file)) ?? []), m]);
  return [...groups.values()].map((g) => {
    const hit = g.find((m) => m.lang === lang);
    return { memo: hit ?? g.find((m) => m.lang === 'en')!, fallback: !hit };
  });
}

export function Sources() {
  const { t, tc, lang } = useI18n();
  const memos = memosFor(lang);
  const [memo, setMemo] = useState(0);
  const [tab, setTab] = useState<'docs' | 'legal' | 'coverage' | 'retrieval' | 'datasets' | 'quality'>('docs');
  const m = memos[Math.min(memo, memos.length - 1)];
  const tabs = { docs: t('Document registry'), legal: t('Legal sources'), coverage: t('Coverage matrix'), retrieval: t('Retrieval log'), datasets: t('Datasets & checksums'), quality: t('Quality checks') } as const;
  const open = (url: string) => <a href={url} target="_blank" rel="noreferrer">{t('open')}</a>;
  return (
    <>
      <div className="banner"><Rich text={t('Sources are kept separate from estimates. **No primary Kosovo PDF could be downloaded from the research environment**, because the egress policy blocked bqk-kos.org, the bank websites and web.archive.org. Each attempt is in the retrieval log. Run `collection/collector.py --wayback --discover` on a machine with open internet to acquire them.')} /></div>
      <Card title={t('Research library')} right={<select value={tab} onChange={(e) => setTab(e.target.value as typeof tab)}>{Object.entries(tabs).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>}>
        {tab === 'docs' && <DataTable rows={DATA.documents} cols={[{ key: 'document_id', label: t('ID') }, { key: 'publisher', label: t('Publisher') }, { key: 'title', label: t('Title') }, { key: 'fiscal_year', label: t('FY') },
          { key: 'document_type', label: t('Type'), render: (r) => tc(r.document_type) }, { key: 'retrieval_status', label: t('Retrieval'), render: (r) => tc(r.retrieval_status) }, { key: 'url', label: 'URL', render: (r) => open(r.url) }, { key: 'notes', label: t('Notes (source language)') }]} />}
        {tab === 'legal' && <DataTable rows={DATA.legal} cols={[{ key: 'source_id', label: t('ID') }, { key: 'title', label: t('Title') }, { key: 'effective_date', label: t('Effective') }, { key: 'status_as_of_2026_10_25', label: t('Status') },
          { key: 'retrieval_status', label: t('Retrieval'), render: (r) => tc(r.retrieval_status) }, { key: 'url', label: 'URL', render: (r) => open(r.url) }, { key: 'verification_notes', label: t('Notes (source language)') }]} />}
        {tab === 'coverage' && <DataTable rows={DATA.coverage} cols={[{ key: 'institution', label: t('Institution') }, { key: 'fiscal_year', label: t('FY') }, { key: 'status', label: t('Status'), render: (r) => tc(r.status) }, { key: 'documents', label: t('Documents') }, { key: 'gap_note', label: t('Gap'), render: (r) => t(r.gap_note) }]} />}
        {tab === 'retrieval' && <DataTable rows={DATA.retrieval} cols={[{ key: 'timestamp_utc', label: 'UTC' }, { key: 'document_id', label: t('Document') }, { key: 'method', label: t('Method') }, { key: 'outcome', label: t('Outcome'), render: (r) => tc(r.outcome) }, { key: 'error_class', label: t('Error'), render: (r) => tc(r.error_class) }, { key: 'url', label: 'URL' }]} />}
        {tab === 'datasets' && <DataTable rows={DATA.datasetIndex as unknown as Record<string, unknown>[]} cols={[{ key: 'dataset', label: t('Dataset') }, { key: 'path', label: t('Path') }, { key: 'rows', label: t('Rows'), num: true }, { key: 'sha256', label: 'SHA-256', render: (r) => <code className="small">{String(r.sha256).slice(0, 16)}…</code> }]} />}
        {tab === 'quality' && <DataTable rows={DATA.quality} cols={[{ key: 'check', label: t('Check') }, { key: 'subject', label: t('Subject') }, { key: 'result', label: t('Result'), render: (r) => tc(r.result) }, { key: 'detail', label: t('Detail') }]} />}
      </Card>
      <Card title={t('Research memos')} right={<select value={memo} onChange={(e) => setMemo(Number(e.target.value))}>{memos.map((x, i) => <option key={x.memo.file} value={i}>{x.memo.title}{x.fallback ? ` (${t('English only')})` : ''}</option>)}</select>}>
        {m.fallback && lang === 'sq' && <p className="small muted">{t('This memo is available in English only. Legal and regulatory memos should be translated by a qualified translator before external use.')}</p>}
        <Markdown text={m.memo.markdown} />
      </Card>
      <Card title={t('Package assumption register (original)')} sub={t('From 05_Model_Specification/assumption_register.csv. Every item is mapped to an editable input in Assumptions.')}>
        <DataTable rows={DATA.assumptionRegister} cols={[{ key: 'metric_id', label: t('Metric') }, { key: 'description', label: t('Description (source language)') }, { key: 'source_type', label: t('Source type'), render: (r) => tc(r.source_type) }, { key: 'blocking_if_missing', label: t('Blocking'), render: (r) => t(r.blocking_if_missing) }]} />
      </Card>
    </>
  );
}

export function Assumptions({ inputs, set }: ModProps) {
  const { t } = useI18n();
  const groups = [...new Set(ASSUMPTIONS.map((a) => a.group))];
  return (
    <>
      <div className="banner"><Rich text={t('Every major assumption can be edited here or in its own module. Badges show the evidence class. **Management** = Pro Finance projections. **Vendor** = non-binding quotes. **CBK reported** = search-derived and needs verification. **Unsourced** = modelling assumption. **Demo preset** = illustration only.')} /></div>
      <div className="grid-2">
        {groups.map((g) => (
          <Card key={g} title={t(g)}>
            {ASSUMPTIONS.filter((a) => a.group === g).map((a) => (
              <PathField key={a.path} obj={inputs} path={a.path} set={set} label={t(a.label)} unit={a.unit}
                meta={<span><SourceBadge s={a.source} /> {a.note ? t(a.note) : ''}</span>} />
            ))}
          </Card>
        ))}
      </div>
    </>
  );
}

async function exportExcel(inputs: ModelInputs, r: ModelResult, lang: Lang) {
  const t = (k: string, p?: Record<string, string | number | null>) => translate(lang, k, p);
  const tc = (c: string) => translateCode(lang, c);
  const msg = makeMessages(lang);
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Pro Finance Banking Transformation Platform';
  const readme = wb.addWorksheet(t('README'));
  const status = (k: keyof ModelResult['statuses']) => [t(k === 'profitability' ? 'Profitability' : k === 'funding' ? 'Funding' : k === 'liquidity' ? 'Liquidity' : 'Regulatory'), tc(r.statuses[k].status), msg.status(r.statuses[k])];
  readme.addRows([
    [t('Pro Finance Home – Banking Transformation Model')], [t('Scenario'), t(inputs.name)], [t('Exported'), new Date().toISOString()], [t('Language'), lang === 'sq' ? 'Shqip' : 'English'],
    [t('STATUS'), t('ILLUSTRATIVE – based on editable assumptions; no audited opening balance sheet; regulatory thresholds unverified.')],
    status('profitability'), status('funding'), status('liquidity'), status('regulatory'), [],
    [t('Blockers')], ...r.blockers.map((b) => [tc(b.severity), b.code, msg.blocker(b)]),
    [], [t('Integrity checks')], ...r.checks.map((c) => [c.passed ? tc('PASS') : tc('FAIL'), msg.check(c).label, msg.check(c).detail]),
  ]);
  readme.getColumn(1).width = 24; readme.getColumn(2).width = 40; readme.getColumn(3).width = 100;
  const as = wb.addWorksheet(t('Assumptions'));
  as.addRow([t('Group'), t('Assumption'), t('Path'), t('Value'), t('Unit'), t('Source type'), t('Note')]);
  for (const a of ASSUMPTIONS) as.addRow([t(a.group), t(a.label), a.path, JSON.stringify(getPath(inputs, a.path)), a.unit, tc(a.source), a.note ? t(a.note) : '']);
  as.addRow([]); as.addRow([t('Full input JSON'), JSON.stringify(inputs)]);
  const yearKeys = Object.keys(r.years[0]).filter((k) => typeof (r.years[0] as unknown as Record<string, unknown>)[k] === 'number');
  const ys = wb.addWorksheet(t('Annual'));
  ys.addRow([t('Line item'), ...r.years.map((y) => yearLabel(lang, y.label))]);
  for (const k of yearKeys) ys.addRow([k, ...r.years.map((y) => (y as unknown as Record<string, number>)[k])]);
  const ms = wb.addWorksheet(t('Monthly'));
  const mKeys = Object.keys(r.months[0]).filter((k) => typeof (r.months[0] as unknown as Record<string, unknown>)[k] === 'number');
  ms.addRow(mKeys);
  for (const m of r.months) ms.addRow(mKeys.map((k) => (m as unknown as Record<string, number>)[k]));
  const rg = wb.addWorksheet(t('Regulatory'));
  rg.addRow([t('Rule'), t('Test'), t('Verdict'), t('Indicative'), t('Worst value'), t('Threshold'), t('Rule status'), t('Reason')]);
  for (const x of r.regulatory) rg.addRow([x.ruleId, t(x.label), tc(x.verdict), tc(x.indicative), x.worstValue, x.threshold, tc(x.ruleStatus), msg.reason(x)]);
  const src = wb.addWorksheet(t('Sources'));
  src.addRow([t('Document'), t('Publisher'), t('Title'), t('FY'), 'URL', t('Retrieval'), t('Notes (source language)')]);
  for (const d of DATA.documents) src.addRow([d.document_id, d.publisher, d.title, d.fiscal_year, d.url, tc(d.retrieval_status), d.notes]);
  src.addRow([]);
  for (const d of DATA.legal) src.addRow([d.source_id, t('legal'), d.title, d.effective_date, d.url, tc(d.retrieval_status), d.verification_notes]);
  if (lang === 'sq') { src.addRow([]); src.addRow(['Shënim: kodet e linjave në fletët vjetore/mujore janë emra teknikë të motorit të modelit (anglisht).']); }
  const buf = await wb.xlsx.writeBuffer();
  download(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `ProFinance_${inputs.name.replace(/\W+/g, '_')}_${lang === 'sq' ? 'ILUSTRATIV' : 'ILLUSTRATIVE'}.xlsx`);
}

function download(blob: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function exportCsv(inputs: ModelInputs, r: ModelResult, lang: Lang) {
  const keys = Object.keys(r.months[0]).filter((k) => typeof (r.months[0] as unknown as Record<string, unknown>)[k] === 'number');
  const lines = [`# ${translate(lang, 'ILLUSTRATIVE')} – ${inputs.name} – ${new Date().toISOString()}`, keys.join(','), ...r.months.map((m) => keys.map((k) => (m as unknown as Record<string, number>)[k]).join(','))];
  download(new Blob([lines.join('\n')], { type: 'text/csv' }), `ProFinance_monthly_${inputs.name.replace(/\W+/g, '_')}.csv`);
}

export function Exports({ inputs, result: r, setInputs, readOnly }: ModProps) {
  const { t, lang } = useI18n();
  const msg = useMessages();
  const [busy, setBusy] = useState(false);
  const importJson = (f: File) => f.text().then((x) => setInputs(JSON.parse(x) as ModelInputs));
  const ca = r.capitalAnalysis;
  return (
    <>
      <Card title={t('Exports')} sub={t('Every export carries the ILLUSTRATIVE label, the scenario inputs and the source metadata. Exports use the selected language.')}>
        <div className="row no-print">
          <button className="btn primary" disabled={busy} onClick={() => { setBusy(true); exportExcel(inputs, r, lang).finally(() => setBusy(false)); }}>{t('Excel workbook (.xlsx)')}</button>
          <button className="btn" onClick={() => exportCsv(inputs, r, lang)}>{t('Monthly CSV')}</button>
          <button className="btn" onClick={() => download(new Blob([JSON.stringify(inputs, null, 2)], { type: 'application/json' }), `scenario_${inputs.name.replace(/\W+/g, '_')}.json`)}>{t('Scenario JSON')}</button>
          {!readOnly && <label className="btn">{t('Import scenario JSON')}<input type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} /></label>}
          <button className="btn" onClick={() => window.print()}>{t('Print / save board report as PDF')}</button>
        </div>
      </Card>
      <Card title={t('Board summary report')} sub={t('{name} · generated {date} · ILLUSTRATIVE, NOT A REGULATORY FILING', { name: t(inputs.name), date: new Date().toLocaleDateString(lang === 'sq' ? 'sq-AL' : 'en-GB') })}>
        <h2>{t('1. Conclusions under current assumptions')}</h2>
        <table><tbody>
          <tr><td>{t('Profitability')}</td><td><VerdictChip v={r.statuses.profitability.status} /></td><td>{msg.status(r.statuses.profitability)}</td></tr>
          <tr><td>{t('Funding')}</td><td><VerdictChip v={r.statuses.funding.status} /></td><td>{msg.status(r.statuses.funding)}</td></tr>
          <tr><td>{t('Liquidity')}</td><td><VerdictChip v={r.statuses.liquidity.status} /></td><td>{msg.status(r.statuses.liquidity)}</td></tr>
          <tr><td>{t('Regulatory')}</td><td><VerdictChip v={r.statuses.regulatory.status} /></td><td>{msg.status(r.statuses.regulatory)}</td></tr>
          <tr><td>{t('Additional equity indicated')}</td><td colSpan={2}>{t('{total}: the larger of the peak cash gap ({cash}) and the gap to the {target} CAR target ({gap})', { total: eurM(ca.additionalEquityIndicated), cash: eurM(ca.cashShortfall), target: pct(inputs.capital.targetCar, 0), gap: eurM(ca.capitalShortfallToTarget) })}</td></tr>
          <tr><td>{t('Break-even')}</td><td colSpan={2}>{t('Monthly: {m}. Cumulative: {c}', {
            m: ca.breakEvenMonthlyRel === null ? t('not reached') : t('month {m}', { m: ca.breakEvenMonthlyRel + 1 }),
            c: ca.breakEvenCumulativeRel === null ? t('not reached') : t('month {m}', { m: ca.breakEvenCumulativeRel + 1 }) })}</td></tr>
        </tbody></table>
        <h2 style={{ marginTop: 16 }}>{t('2. Ten-year summary (EUR m)')}</h2>
        <table>
          <thead><tr>{['Year', 'Loans', 'Deposits', 'Cash', 'Equity', 'NII', 'Fees', 'Opex', 'ECL', 'Net income', 'CAR', 'FTE'].map((h) => <th key={h} className="num">{t(h)}</th>)}</tr></thead>
          <tbody>{r.years.map((y) => (
            <tr key={y.year}>
              <td className="num">{yearLabel(lang, y.label)}</td>
              {[y.grossLoans, y.deposits, y.cashTotal, y.equity, y.nii, y.feeIncome, y.opex, y.provisionExpense, y.netIncome].map((v, i) => <td key={i} className="num">{num(v / 1e6, 2)}</td>)}
              <td className="num">{pct(y.car)}</td><td className="num">{num(y.fte)}</td>
            </tr>
          ))}</tbody>
        </table>
        <h2 style={{ marginTop: 16 }}>{t('3. Matters requiring professional confirmation')}</h2>
        <ul>{r.blockers.filter((b) => b.severity !== 'INFO').map((b) => <li key={b.code}><b>{b.code}</b>: {msg.blocker(b)}</li>)}</ul>
        <p className="small muted">{t('Source distinctions: management projections (Y1 to Y3 targets); vendor estimates (Facilization, non-binding); private preliminary estimates (Visa, USD); CBK rules (search-derived, unverified); model assumptions (editable). See the Source library for documents, URLs and retrieval status.')}</p>
      </Card>
    </>
  );
}
