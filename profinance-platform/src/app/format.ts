export const eur = (v: number | null | undefined, digits = 0) =>
  v === null || v === undefined || !Number.isFinite(v) ? '–' : `€${v.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits })}`;
export const eurM = (v: number | null | undefined, digits = 2) =>
  v === null || v === undefined || !Number.isFinite(v) ? '–' : `€${(v / 1e6).toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits })}m`;
export const usd = (v: number | null | undefined) =>
  v === null || v === undefined || !Number.isFinite(v) ? '–' : `USD ${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
export const pct = (v: number | null | undefined, digits = 1) =>
  v === null || v === undefined || !Number.isFinite(v) ? '–' : `${(v * 100).toFixed(digits)}%`;
export const num = (v: number | null | undefined, digits = 0) =>
  v === null || v === undefined || !Number.isFinite(v) ? '–' : v.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits });
export const relLabel = (rel: number) => (rel < 0 ? `Pre-op M${rel}` : `Y${Math.floor(rel / 12) + 1} M${(rel % 12) + 1}`);
