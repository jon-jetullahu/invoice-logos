import { writeFileSync } from 'node:fs';
import { allKeys } from '../tests/i18nKeys';
import { SQ } from '../src/app/sq';
const missing = allKeys().filter((k) => !(k in SQ));
writeFileSync(process.argv[2] ?? 'missing.json', JSON.stringify(missing, null, 1));
console.log(`keys: ${allKeys().length}, missing: ${missing.length}`);
