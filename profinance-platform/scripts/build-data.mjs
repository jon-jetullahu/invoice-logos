// Converts the canonical research CSVs into JSON modules consumed by the engine and UI.
// research/*.csv is the single source of truth; src/data/generated is derived and reproducible.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'src/data/generated');
mkdirSync(outDir, { recursive: true });

export function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  text = text.replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((v) => v !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); if (row.some((v) => v !== '')) rows.push(row); }
  const [header, ...body] = rows;
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

const sources = [
  ['research', readdirSync(join(root, 'research')).filter((f) => f.endsWith('.csv'))],
  ['source_package/02_Management_Data', ['profinance_baseline.csv']],
  ['source_package/03_Vendor_Costs', ['facilization_cbs_offer.csv', 'visa_card_estimates.csv']],
  ['source_package/05_Model_Specification', ['assumption_register.csv']],
];
const index = [];
for (const [dir, files] of sources) {
  for (const f of files) {
    const path = join(root, dir, f);
    const text = readFileSync(path, 'utf8');
    const rows = parseCsv(text);
    const name = f.replace(/\.csv$/, '');
    writeFileSync(join(outDir, `${name}.json`), JSON.stringify(rows, null, 1));
    index.push({ dataset: name, path: `${dir}/${f}`, rows: rows.length, bytes: statSync(path).size,
      sha256: createHash('sha256').update(text).digest('hex') });
  }
}
// Research memos for the document library
const memos = readdirSync(join(root, 'research')).filter((f) => f.endsWith('.md'))
  .map((f) => ({ file: `research/${f}`, title: readFileSync(join(root, 'research', f), 'utf8').split('\n')[0].replace(/^#\s*/, ''),
    markdown: readFileSync(join(root, 'research', f), 'utf8'), lang: f.endsWith('.sq.md') ? 'sq' : 'en' }));
writeFileSync(join(outDir, 'memos.json'), JSON.stringify(memos));
writeFileSync(join(outDir, 'index.json'), JSON.stringify(index, null, 1));
console.log(`build-data: ${index.length} datasets, ${memos.length} memos -> src/data/generated`);
