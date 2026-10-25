// Locale-aware number formatting. English: €1,234.5m · 12.3%. Albanian: 1 234,5 mln € · 12,3%.
let sq = false;

export function setNumberLocale(lang: 'en' | 'sq') {
  sq = lang === 'sq';
}

const bad = (v: number | null | undefined): v is null | undefined => v === null || v === undefined || !Number.isFinite(v);
// Albanian separators are applied explicitly (thousands: space, decimal: comma) rather than via Intl 'sq' data,
// which some browser builds lack and silently replace with English formatting.
const n = (v: number, digits: number) => {
  const s = v.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits });
  return sq ? s.replace(/,/g, '\u00a0').replace('.', ',') : s;
};

export const eur = (v: number | null | undefined, digits = 0) => (bad(v) ? '–' : sq ? `${n(v, digits)} €` : `€${n(v, digits)}`);
export const eurM = (v: number | null | undefined, digits = 2) => (bad(v) ? '–' : sq ? `${n(v / 1e6, digits)} mln €` : `€${n(v / 1e6, digits)}m`);
export const usd = (v: number | null | undefined) => (bad(v) ? '–' : `USD ${n(v, 0)}`);
export const pct = (v: number | null | undefined, digits = 1) => (bad(v) ? '–' : `${n(v * 100, digits)}%`);
export const num = (v: number | null | undefined, digits = 0) => (bad(v) ? '–' : n(v, digits));
