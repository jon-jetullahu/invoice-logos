import { useEffect, useMemo, useState } from 'react';
import { managementBase, runModel, setPath, type ModelInputs } from '../engine';
import type { ModProps } from './data';
import { CapitalModule, Licensing, Readiness } from './modules/regulatory';
import { Dashboard, Historical, Industry } from './modules/overview';
import { Projections, Statements, Liquidity, TechCosts } from './modules/finance';
import { Salary, Staffing } from './modules/people';
import { ScenarioStress, Shareholders } from './modules/scenarios';
import { Assumptions, Exports, Sources } from './modules/library';
import { canEdit, Store, type SavedScenario, type Session } from './store';
import { LANGS, Rich, useI18n, type Lang } from './i18n';
import { MODULES, PRESETS } from './nav';

function readHash() {
  const h = location.hash.replace('#', '');
  return MODULES.some((m) => m.id === h) ? h : 'dashboard';
}

export default function App() {
  const { t, tc, lang, setLang } = useI18n();
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
    const name = asNew ? prompt(t('Scenario name'), inputs.name) : inputs.name;
    if (!name) return;
    try {
      const rec = await store.save(name, { ...inputs, name }, asNew ? undefined : savedId, 'saved from UI');
      setSavedId(rec.id); setInputs(rec.inputs); setSaved(await store.list());
      setMsg(t('Saved "{name}" v{v} ({where})', { name: rec.name, v: rec.version, where: online ? t('server') : t('browser storage') }));
    } catch (e) { setMsg(t('Save failed: {e}', { e: (e as Error).message })); }
  };

  const groups = [...new Set(MODULES.map((m) => m.group))];
  const current = MODULES.find((m) => m.id === mod)!;
  return (
    <div className="shell">
      <nav className="nav" aria-label="Modules">
        <div className="brand"><b>{t('Pro Finance · Bank Transformation')}</b><span>{t('Intelligence platform · confidential')}</span></div>
        {groups.map((g) => (
          <div key={g}>
            <h6>{t(g)}</h6>
            {MODULES.filter((m) => m.group === g).map((m) => {
              const n = MODULES.indexOf(m) + 1;
              return <button key={m.id} className={m.id === mod ? 'active' : ''} onClick={() => { location.hash = m.id; }}><span className="num">{n <= 16 ? n : '★'}</span>{t(m.label)}</button>;
            })}
          </div>
        ))}
      </nav>
      <main className="main">
        <div className="topbar">
          <span className="title">{t(current.label)}</span>
          <select aria-label={t('Language')} value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
            {LANGS.map((l) => <option key={l.v} value={l.v}>{l.label}</option>)}
          </select>
          <select aria-label={t('Preset')} value="" onChange={(e) => { if (e.target.value) { setInputs(PRESETS[e.target.value]()); setSavedId(undefined); } }}>
            <option value="">{t('Load preset…')}</option>{Object.keys(PRESETS).map((k) => <option key={k} value={k}>{t(k)}</option>)}
          </select>
          <select aria-label={t('Saved scenarios')} value={savedId ?? ''} onChange={(e) => { const s = saved.find((x) => x.id === e.target.value); if (s) { setInputs(s.inputs); setSavedId(s.id); } }}>
            <option value="">{t('Saved scenarios ({n})', { n: saved.length })}</option>{saved.map((s) => <option key={s.id} value={s.id}>{s.name} · v{s.version}</option>)}
          </select>
          {!readOnly && <button className="btn small" onClick={() => save(!savedId)}>{savedId ? t('Save version') : t('Save')}</button>}
          {!readOnly && <button className="btn small" onClick={() => save(true)}>{t('Save as / clone')}</button>}
          <select aria-label={t('Role')} value={session.role} onChange={(e) => setSession({ ...session, role: e.target.value as Session['role'] })}>
            {['Admin', 'Finance', 'Risk/Compliance', 'Management Viewer'].map((r) => <option key={r} value={r}>{t(r)}</option>)}
          </select>
          <select aria-label={t('Theme')} value={theme} onChange={(e) => setTheme(e.target.value as typeof theme)}><option value="auto">{t('Auto theme')}</option><option value="light">{t('Light')}</option><option value="dark">{t('Dark')}</option></select>
          <span className={`chip ${online ? 'good' : 'neutral'}`}>{online ? t('server') : t('local')}</span>
        </div>
        <div className="banner">
          <b>{t(inputs.name)}</b> · <Rich text={t('Results are **illustrative**. They are built on editable assumptions with no audited opening balance sheet, and the CBK thresholds are unverified. Regulatory status: **{status}**.', { status: tc(result.statuses.regulatory.status) })} />
          {msg && <span className="muted"> · {msg}</span>}
          {readOnly && <span> · {t('read-only role')}</span>}
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
