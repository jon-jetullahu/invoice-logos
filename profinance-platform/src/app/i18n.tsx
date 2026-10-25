// Bilingual support (English / Albanian). Keys are the English source strings; Albanian lives in ./sq.ts.
// Codes (UPPER_SNAKE) such as NOT_STARTED or UNDETERMINED are translated through the same dictionary.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setNumberLocale } from './format';
import { SQ } from './sq';

export type Lang = 'en' | 'sq';
export type Params = Record<string, string | number | null | undefined>;

export const LANGS: { v: Lang; label: string }[] = [{ v: 'en', label: 'English' }, { v: 'sq', label: 'Shqip' }];

export function translate(lang: Lang, key: string, params?: Params): string {
  let s = lang === 'sq' ? SQ[key] ?? key : key;
  if (params) s = s.replace(/\{(\w+)\}/g, (_, k: string) => (params[k] === null || params[k] === undefined ? '–' : String(params[k])));
  return s;
}

/** Translate an enum/status code; English falls back to a readable form of the code. */
export function translateCode(lang: Lang, code: string): string {
  if (lang === 'sq' && SQ[code]) return SQ[code];
  return code.replace(/_/g, ' ');
}

function initialLang(): Lang {
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'sq' || q === 'en') return q;
    const s = localStorage.getItem('pf-lang');
    if (s === 'sq' || s === 'en') return s;
  } catch { /* storage unavailable */ }
  return typeof navigator !== 'undefined' && navigator.language?.startsWith('sq') ? 'sq' : 'en';
}

interface Ctx { lang: Lang; setLang: (l: Lang) => void; t: (key: string, params?: Params) => string; tc: (code: string) => string }
const I18n = createContext<Ctx>({ lang: 'en', setLang: () => {}, t: (k) => k, tc: (c) => c });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  setNumberLocale(lang); // before children render
  useEffect(() => {
    document.documentElement.lang = lang;
    try { localStorage.setItem('pf-lang', lang); } catch { /* ignore */ }
  }, [lang]);
  const value = useMemo<Ctx>(() => ({
    lang, setLang: setLangState,
    t: (key, params) => translate(lang, key, params),
    tc: (code) => translateCode(lang, code),
  }), [lang]);
  return <I18n.Provider value={value}>{children}</I18n.Provider>;
}

export const useI18n = () => useContext(I18n);

/** Renders **bold** and `code` inside translated sentences. */
export function Rich({ text }: { text: string }) {
  return <>{text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p, i) =>
    p.startsWith('**') ? <b key={i}>{p.slice(2, -2)}</b> : p.startsWith('`') ? <code key={i}>{p.slice(1, -1)}</code> : p)}</>;
}

/** Year labels from the engine ("Pre-op", "Y1"…) in the active language. */
export function yearLabel(lang: Lang, label: string): string {
  if (lang !== 'sq') return label;
  if (label === 'Pre-op') return 'Para nisjes';
  return label.replace(/^Y(\d+)/, 'V$1');
}

/** Pick the Albanian column of a research row when present (e.g. role → role_sq). */
export function field(lang: Lang, row: Record<string, string>, key: string): string {
  return (lang === 'sq' && row[`${key}_sq`]) || row[key];
}
