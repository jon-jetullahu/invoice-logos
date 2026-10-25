import { useEffect, useMemo, useState } from 'react';
import { blankInputs, managementBase, runModel, setPath, type ModelInputs } from '../engine';
import type { ModProps } from './data';
import { CapitalModule, Licensing, Readiness } from './modules/regulatory';
import { Dashboard, Historical, Industry } from './modules/overview';
import { Projections, Statements, Liquidity, TechCosts } from './modules/finance';
import { Salary, Staffing } from './modules/people';
import { ScenarioStress, Shareholders } from './modules/scenarios';
import { Assumptions, Exports, Sources } from './modules/library';
import { canEdit, Store, type SavedScenario, type Session } from './store';

const PRESETS: Record<string, () => ModelInputs> = {
  'Management base (illustrative)': managementBase,
  'Management + €10m strategic raise': () => {
    const x = managementBase();
    x.name = 'Management + €10m strategic raise';
    x.capital.injections[1].enabled = true;
    return x;
  },
  'Management + wholesale funding line': () => {
    const x = managementBase();
    x.name = 'Management + wholesale funding line';
    x.wholesale.enabled = true;
    return x;
  },
  'Islamic window variant': () => {
    const x = managementBase();
    x.name = 'Islamic window variant';
    x.islamic.enabled = true;
    return x;
  },
  'Blank (seeds only, no capital)': blankInputs,
};

const MODULES: { id: string; label: string; group: string }[] = [
  { id: 'dashboard', label: 'Executive dashboard', group: 'Overview' },
  { id: 'industry', label: 'Kosovo banking intelligence', group: 'Overview' },
  { id: 'historical', label: 'Historical bank comparisons', group: 'Overview' },
  { id: 'licensing', label: 'CBK licensing checklist', group: 'Regulatory' },
  { id: 'capital', label: 'Capital adequacy & regulation', group: 'Regulatory' },
  { id: 'staffing', label: 'Organisation & staffing', group: 'People' },
  { id: 'salary', label: 'Salary & payroll calculator', group: 'People' },
  { id: 'tech', label: 'Technology & vendor costs', group: 'Economics' },
  { id: 'projections', label: 'Financing & deposits', group: 'Economics' },
  { id: 'statements', label: 'Ten-year statements', group: 'Economics' },
  { id: 'liquidity', label: 'Liquidity & funding', group: 'Economics' },
  { id: 'scenarios', label: 'Scenarios & stress tests', group: 'Decision' },
  { id: 'shareholders', label: 'Shareholders & capital raising', group: 'Decision' },
  { id: 'readiness', label: 'Readiness & roadmap', group: 'Decision' },
  { id: 'sources', label: 'Source library & traceability', group: 'Evidence' },
  { id: 'exports', label: 'Reports & exports', group: 'Evidence' },
  { id: 'assumptions', label: 'All assumptions', group: 'Evidence' },
];

function readHash() {
  const h = location.hash.replace('#', '');
  return MODULES.some((m) => m.id === h) ? h : 'dashboard';
}

export default function App() {
  const [session, setSession] = useState<Session>({ user: 'analyst', role: 'Finance' });
  const store = useMemo(() => new Store(session), [session]);
  const [online, setOnline] = useState(false);
  const [mod, setMod] = useState(readHash);
  const [inputs, setInputs] = useState<ModelInputs>(managementBase);
  const [saved, setSaved] = useState<SavedScenario[]>([]);
  const [savedId, setSavedId] = useState<string | undefined>();
  const [msg, setMsg] = useState('');
  const [theme, setTheme] = useState<'auto' | 'light' | 'dark'>('auto');

  useEffect(() => { store.probe().then((ok) => { setOnline(ok); return store.list(); }).then(setSaved).catch(() => setSaved([])); }, [store]);
  useEffect(() => { const f = () => setMod(readHash()); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  useEffect(() => { if (theme === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = theme; }, [theme]);

  const result = useMemo(() => runModel(inputs), [inputs]);
  const readOnly = !canEdit(session);
  const set = (path: string, v: unknown) => { if (!readOnly) setInputs((x) => setPath(x, path, v)); };
  const props: ModProps = { inputs, result, set, setInputs: (x) => !readOnly && setInputs(x), readOnly };

  const save = async (asNew: boolean) => {
    const name = asNew ? prompt('Scenario name', inputs.name) : inputs.name;
    if (!name) return;
    try {
      const rec = await store.save(name, { ...inputs, name }, asNew ? undefined : savedId, 'saved from UI');
      setSavedId(rec.id); setInputs(rec.inputs); setSaved(await store.list());
      setMsg(`Saved "${rec.name}" v${rec.version} ${online ? '(server)' : '(browser storage)'}`);
    } catch (e) { setMsg(`Save failed: ${(e as Error).message}`); }
  };

  const groups = [...new Set(MODULES.map((m) => m.group))];
  const current = MODULES.find((m) => m.id === mod)!;
  return (
    <div className="shell">
      <nav className="nav" aria-label="Modules">
        <div className="brand"><b>Pro Finance · Bank Transformation</b><span>Intelligence platform · confidential</span></div>
        {groups.map((g) => (
          <div key={g}>
            <h6>{g}</h6>
            {MODULES.filter((m) => m.group === g).map((m) => {
              const n = MODULES.indexOf(m) + 1;
              return <button key={m.id} className={m.id === mod ? 'active' : ''} onClick={() => { location.hash = m.id; }}><span className="num">{n <= 16 ? n : '★'}</span>{m.label}</button>;
            })}
          </div>
        ))}
      </nav>
      <main className="main">
        <div className="topbar">
          <span className="title">{current.label}</span>
          <select aria-label="Preset" value="" onChange={(e) => { if (e.target.value) { setInputs(PRESETS[e.target.value]()); setSavedId(undefined); } }}>
            <option value="">Load preset…</option>{Object.keys(PRESETS).map((k) => <option key={k}>{k}</option>)}
          </select>
          <select aria-label="Saved scenarios" value={savedId ?? ''} onChange={(e) => { const s = saved.find((x) => x.id === e.target.value); if (s) { setInputs(s.inputs); setSavedId(s.id); } }}>
            <option value="">Saved scenarios ({saved.length})</option>{saved.map((s) => <option key={s.id} value={s.id}>{s.name} · v{s.version}</option>)}
          </select>
          {!readOnly && <button className="btn small" onClick={() => save(!savedId)}>{savedId ? 'Save version' : 'Save'}</button>}
          {!readOnly && <button className="btn small" onClick={() => save(true)}>Save as / clone</button>}
          <select aria-label="Role" value={session.role} onChange={(e) => setSession({ ...session, role: e.target.value as Session['role'] })}>
            {['Admin', 'Finance', 'Risk/Compliance', 'Management Viewer'].map((r) => <option key={r}>{r}</option>)}
          </select>
          <select aria-label="Theme" value={theme} onChange={(e) => setTheme(e.target.value as typeof theme)}><option value="auto">Auto theme</option><option value="light">Light</option><option value="dark">Dark</option></select>
          <span className={`chip ${online ? 'good' : 'neutral'}`}>{online ? 'server' : 'local'}</span>
        </div>
        <div className="banner">
          <b>{inputs.name}</b> · Results are <b>illustrative</b>. They are built on editable assumptions with no audited opening balance sheet, and the CBK thresholds are unverified. Regulatory status: <b>{result.statuses.regulatory.status}</b>.
          {msg && <span className="muted"> · {msg}</span>}
          {readOnly && <span> · read-only role</span>}
        </div>
        <div className="content">
          {mod === 'dashboard' && <Dashboard {...props} />}
          {mod === 'industry' && <Industry />}
          {mod === 'historical' && <Historical {...props} />}
          {mod === 'licensing' && <Licensing store={store} readOnly={readOnly} />}
          {mod === 'capital' && <CapitalModule {...props} />}
          {mod === 'staffing' && <Staffing {...props} />}
          {mod === 'salary' && <Salary {...props} />}
          {mod === 'tech' && <TechCosts {...props} />}
          {mod === 'projections' && <Projections {...props} />}
          {mod === 'statements' && <Statements {...props} />}
          {mod === 'liquidity' && <Liquidity {...props} />}
          {mod === 'scenarios' && <ScenarioStress {...props} />}
          {mod === 'shareholders' && <Shareholders {...props} />}
          {mod === 'readiness' && <Readiness {...props} />}
          {mod === 'sources' && <Sources />}
          {mod === 'exports' && <Exports {...props} />}
          {mod === 'assumptions' && <Assumptions {...props} />}
        </div>
      </main>
    </div>
  );
}
