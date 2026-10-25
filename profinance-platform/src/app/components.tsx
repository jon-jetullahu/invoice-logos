import { useState, type ReactNode } from 'react';
import {
  Area, Bar, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { getPath, TRACE, type SourceType, type Verdict } from '../engine';
import { eurM, pct } from './format';

export const SERIES = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)'];

export function Card({ title, sub, children, right }: { title?: string; sub?: ReactNode; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="card">
      {(title || right) && (
        <div className="card-head">
          <div>
            {title && <h3>{title}</h3>}
            {sub && <div className="sub">{sub}</div>}
          </div>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({ label, value, note, tone }: { label: string; value: ReactNode; note?: ReactNode; tone?: 'neg' }) {
  return (
    <div className="kpi">
      <div className="label">{label}</div>
      <div className={`value ${tone === 'neg' ? 'neg' : ''}`}>{value}</div>
      {note && <div className="note">{note}</div>}
    </div>
  );
}

const VERDICT_ICON: Record<string, string> = { PASS: '✔', FAIL: '✖', UNDETERMINED: '?' };
export function VerdictChip({ v, label }: { v: Verdict | string; label?: string }) {
  const tone = v === 'PASS' || v === 'PROFITABLE' || v === 'FUNDED' ? 'good'
    : v === 'FAIL' || v === 'UNFUNDED' || v === 'LOSS_MAKING' ? 'bad'
      : v === 'FUNDED_WITH_WHOLESALE' || v === 'MIXED' || v === 'UNDETERMINED' ? 'warn' : 'neutral';
  const icon = VERDICT_ICON[v] ?? (tone === 'good' ? '✔' : tone === 'bad' ? '✖' : '•');
  return <span className={`chip ${tone}`}><span aria-hidden>{icon}</span>{label ?? v.replace(/_/g, ' ')}</span>;
}

const SOURCE_TONE: Record<string, string> = {
  MANAGEMENT_PROVIDED: 'info', VENDOR_ESTIMATE: 'info', PRIVATE_PRELIMINARY_ESTIMATE: 'warn', CBK_REPORTED_UNVERIFIED: 'warn',
  SECONDARY_SOURCE: 'warn', MARKET_BENCHMARK_SEARCH: 'warn', ESTIMATE_NOT_MARKET_VERIFIED: 'neutral', UNSOURCED_ASSUMPTION: 'neutral',
  DEMO_PRESET: 'bad', DERIVED: 'good', VERIFIED: 'good', REPORTED_UNVERIFIED: 'warn', HISTORICAL_UNVERIFIED: 'warn', NOT_OBTAINED: 'bad',
};
export function SourceBadge({ s }: { s: SourceType | string }) {
  return <span className={`chip ${SOURCE_TONE[s] ?? 'neutral'}`} title={s}>{s.replace(/_/g, ' ').toLowerCase()}</span>;
}

export function Explain({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const t = TRACE[id];
  if (!t) return null;
  return (
    <span className="no-print">
      <button className="btn small" onClick={() => setOpen(!open)} title="Show formula and source" aria-expanded={open}>ƒ</button>
      {open && (
        <div className="tooltip-box" style={{ marginTop: 6, maxWidth: 520 }}>
          <div><b>Formula:</b> {t.formula}</div>
          <div><b>Inputs:</b> {t.inputs.join(', ')}</div>
          <div><b>Source types:</b> {t.sources.join(', ')}</div>
        </div>
      )}
    </span>
  );
}

export function NumberField({ label, value, onChange, unit, meta, step }: {
  label: string; value: number | null; onChange: (v: number | null) => void; unit?: string; meta?: ReactNode; step?: number;
}) {
  const isPct = unit === 'pct';
  const shown = value === null ? '' : isPct ? +(value * 100).toFixed(6) : value;
  return (
    <div className="field">
      <label>{label}{unit && !isPct && unit !== 'ratio' && unit !== 'count' && <span className="muted"> ({unit})</span>}{isPct && <span className="muted"> (%)</span>}</label>
      <input type="number" step={step ?? (isPct ? 0.1 : 'any')} value={shown}
        onChange={(e) => onChange(e.target.value === '' ? null : isPct ? Number(e.target.value) / 100 : Number(e.target.value))} />
      {meta && <div className="meta">{meta}</div>}
    </div>
  );
}

export function Toggle({ label, checked, onChange, meta }: { label: string; checked: boolean; onChange: (v: boolean) => void; meta?: ReactNode }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {meta && <div className="meta">{meta}</div>}
    </div>
  );
}

export function Seg<T extends string>({ value, options, onChange }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <span className="seg" role="group">
      {options.map((o) => <button key={o.v} className={o.v === value ? 'on' : ''} onClick={() => onChange(o.v)}>{o.label}</button>)}
    </span>
  );
}

export function PathField({ obj, path, set, label, unit, meta }: {
  obj: object; path: string; set: (path: string, v: unknown) => void; label: string; unit?: string; meta?: ReactNode;
}) {
  const v = getPath(obj, path);
  if (typeof v === 'boolean') return <Toggle label={label} checked={v} onChange={(x) => set(path, x)} meta={meta} />;
  if (typeof v === 'string') return (
    <div className="field"><label>{label}</label><input value={v} onChange={(e) => set(path, e.target.value)} />{meta && <div className="meta">{meta}</div>}</div>
  );
  return <NumberField label={label} value={(v as number | null) ?? null} unit={unit} meta={meta} onChange={(x) => set(path, x)} />;
}

export interface SeriesDef { key: string; label: string; kind?: 'line' | 'bar' | 'area'; stack?: string }

/** Chart with legend, hover tooltip and a data-table toggle (relief for low-contrast series). One y-axis only. */
export function ChartCard({ title, sub, data, xKey, series, format = eurM, height = 280, refLines = [] }: {
  title: string; sub?: ReactNode; data: Record<string, unknown>[]; xKey: string; series: SeriesDef[];
  format?: (v: number) => string; height?: number; refLines?: { y: number; label: string }[];
}) {
  const [table, setTable] = useState(false);
  return (
    <Card title={title} sub={sub} right={<button className="btn small no-print" onClick={() => setTable(!table)}>{table ? 'Chart' : 'Table'}</button>}>
      {table ? (
        <div className="table-wrap">
          <table>
            <thead><tr><th>{xKey}</th>{series.map((s) => <th key={s.key} className="num">{s.label}</th>)}</tr></thead>
            <tbody>{data.map((d, i) => (
              <tr key={i}><td>{String(d[xKey])}</td>{series.map((s) => <td key={s.key} className="num">{format(d[s.key] as number)}</td>)}</tr>
            ))}</tbody>
          </table>
        </div>
      ) : (
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer>
            <ComposedChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }} barGap={2}>
              <CartesianGrid stroke="var(--grid)" vertical={false} />
              <XAxis dataKey={xKey} tick={{ fill: 'var(--muted)', fontSize: 11 }} stroke="var(--axis)" minTickGap={16} />
              <YAxis tickFormatter={(v) => format(v)} tick={{ fill: 'var(--muted)', fontSize: 11 }} stroke="var(--axis)" width={78} />
              <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                <div className="tooltip-box">
                  <b>{label}</b>
                  {payload.map((p) => (
                    <div key={String(p.dataKey)}><span className="legend-swatch" style={{ background: p.color }} />{p.name}: {format(p.value as number)}</div>
                  ))}
                </div>
              ) : null} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--ink-2)' }} />
              <ReferenceLine y={0} stroke="var(--axis)" />
              {refLines.map((r) => <ReferenceLine key={r.label} y={r.y} stroke="var(--critical)" strokeDasharray="4 3" label={{ value: r.label, fill: 'var(--ink-2)', fontSize: 11, position: 'insideTopRight' }} />)}
              {series.map((s, i) => {
                const c = SERIES[i % SERIES.length];
                if (s.kind === 'bar') return <Bar isAnimationActive={false} key={s.key} dataKey={s.key} name={s.label} fill={c} stackId={s.stack} radius={s.stack ? 0 : [4, 4, 0, 0]} maxBarSize={28} />;
                if (s.kind === 'area') return <Area isAnimationActive={false} key={s.key} dataKey={s.key} name={s.label} stroke={c} fill={c} fillOpacity={0.15} strokeWidth={2} type="monotone" dot={false} />;
                return <Line isAnimationActive={false} key={s.key} dataKey={s.key} name={s.label} stroke={c} strokeWidth={2} dot={false} type="monotone" connectNulls />;
              })}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

export function pctFmt(v: number) { return pct(v); }

export function DataTable<T extends Record<string, unknown>>({ rows, cols, max = 560 }: {
  rows: T[]; cols: { key: string; label: string; num?: boolean; render?: (r: T) => ReactNode }[]; max?: number;
}) {
  return (
    <div className="table-wrap" style={{ maxHeight: max }}>
      <table>
        <thead><tr>{cols.map((c) => <th key={c.key} className={c.num ? 'num' : ''}>{c.label}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={i}>{cols.map((c) => <td key={c.key} className={c.num ? 'num' : ''}>{c.render ? c.render(r) : String(r[c.key] ?? '')}</td>)}</tr>
        ))}</tbody>
      </table>
    </div>
  );
}

/** Minimal Markdown renderer for research memos (headings, lists, tables, code, bold). */
export function Markdown({ text }: { text: string }) {
  const lines = text.split('\n');
  const out: ReactNode[] = [];
  const inline = (s: string) => s.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p, i) =>
    p.startsWith('**') ? <b key={i}>{p.slice(2, -2)}</b> : p.startsWith('`') ? <code key={i}>{p.slice(1, -1)}</code> : p);
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.startsWith('```')) {
      const buf: string[] = [];
      for (i++; i < lines.length && !lines[i].startsWith('```'); i++) buf.push(lines[i]);
      out.push(<pre key={i}>{buf.join('\n')}</pre>);
    } else if (l.startsWith('|')) {
      const rows: string[][] = [];
      for (; i < lines.length && lines[i].startsWith('|'); i++) if (!/^\|[-\s|]+\|$/.test(lines[i])) rows.push(lines[i].split('|').slice(1, -1).map((c) => c.trim()));
      i--;
      out.push(<table key={i}><thead><tr>{rows[0].map((c, k) => <th key={k}>{inline(c)}</th>)}</tr></thead><tbody>{rows.slice(1).map((r, k) => <tr key={k}>{r.map((c, j) => <td key={j}>{inline(c)}</td>)}</tr>)}</tbody></table>);
    } else if (/^#{1,4} /.test(l)) {
      const level = l.match(/^#+/)![0].length;
      const H = (`h${Math.min(level, 3)}`) as 'h1' | 'h2' | 'h3';
      out.push(<H key={i}>{inline(l.replace(/^#+ /, ''))}</H>);
    } else if (/^\s*([*-]|\d+\.) /.test(l)) {
      const items: string[] = [];
      for (; i < lines.length && /^\s*([*-]|\d+\.) /.test(lines[i]); i++) items.push(lines[i].replace(/^\s*([*-]|\d+\.) /, ''));
      i--;
      out.push(<ul key={i}>{items.map((t, k) => <li key={k}>{inline(t)}</li>)}</ul>);
    } else if (l.trim()) out.push(<p key={i}>{inline(l)}</p>);
  }
  return <div className="md">{out}</div>;
}
