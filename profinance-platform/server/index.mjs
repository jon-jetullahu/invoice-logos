// Minimal API + static server. Node 22+ (node:sqlite). Scenarios are versioned; every write is audited.
// Roles come from the x-role header: this is DEMONSTRATION RBAC without authentication.
// A production deployment must add SSO/MFA, TLS and tenant isolation (see docs/IMPLEMENTATION.md).
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const dbPath = process.env.PF_DB ?? join(root, 'data', 'scenarios.db');
await mkdir(dirname(dbPath), { recursive: true });
export const db = new DatabaseSync(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS scenario (id TEXT PRIMARY KEY, name TEXT NOT NULL, current_version INTEGER NOT NULL, deleted INTEGER NOT NULL DEFAULT 0);
  CREATE TABLE IF NOT EXISTS scenario_version (scenario_id TEXT NOT NULL, version INTEGER NOT NULL, inputs TEXT NOT NULL, created_at TEXT NOT NULL, created_by TEXT NOT NULL, note TEXT,
    PRIMARY KEY (scenario_id, version));
  CREATE TABLE IF NOT EXISTS audit (at TEXT NOT NULL, user TEXT NOT NULL, role TEXT NOT NULL, action TEXT NOT NULL, scenario_id TEXT, version INTEGER, note TEXT);
  CREATE TABLE IF NOT EXISTS checklist (requirement_id TEXT PRIMARY KEY, status TEXT, owner TEXT, note TEXT, updated_at TEXT, updated_by TEXT);
`);

const WRITE_ROLES = new Set(['Admin', 'Finance', 'Risk/Compliance']);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };

const send = (res, code, body) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };
const readBody = (req) => new Promise((ok, fail) => {
  let s = ''; req.on('data', (c) => { s += c; if (s.length > 5e6) fail(new Error('too large')); }); req.on('end', () => { try { ok(s ? JSON.parse(s) : {}); } catch (e) { fail(e); } });
});
const audit = (u, action, id, version, note = '') =>
  db.prepare('INSERT INTO audit VALUES (?,?,?,?,?,?,?)').run(new Date().toISOString(), u.user, u.role, action, id ?? null, version ?? null, note);

function getScenario(id) {
  const s = db.prepare('SELECT * FROM scenario WHERE id=? AND deleted=0').get(id);
  if (!s) return null;
  const v = db.prepare('SELECT * FROM scenario_version WHERE scenario_id=? AND version=?').get(id, s.current_version);
  return { id: s.id, name: s.name, version: s.current_version, updatedAt: v.created_at, updatedBy: v.created_by, inputs: JSON.parse(v.inputs) };
}

function validateInputs(x) {
  const errs = [];
  if (!x || typeof x !== 'object') return ['inputs missing'];
  if (!Array.isArray(x.management?.portfolio) || x.management.portfolio.length !== 3) errs.push('management.portfolio must have 3 values');
  if (!(x.horizonMonths > 0 && x.horizonMonths <= 240)) errs.push('horizonMonths must be 1..240');
  const mix = x.deposits?.mix;
  if (mix && Math.abs(mix.current + mix.savings + mix.term - 1) > 1e-6) errs.push('deposit mix must sum to 1');
  return errs;
}

export async function handle(req, res) {
  const url = new URL(req.url, 'http://x');
  const u = { user: String(req.headers['x-user'] ?? 'anonymous').slice(0, 64), role: String(req.headers['x-role'] ?? 'Management Viewer') };
  const p = url.pathname;
  try {
    if (p === '/api/health') return send(res, 200, { ok: true });
    const write = req.method !== 'GET';
    if (p.startsWith('/api/') && write && !WRITE_ROLES.has(u.role)) return send(res, 403, { error: `role ${u.role} is read-only` });
    if (p === '/api/scenarios' && req.method === 'GET') {
      const rows = db.prepare('SELECT id FROM scenario WHERE deleted=0 ORDER BY name').all();
      return send(res, 200, rows.map((r) => getScenario(r.id)));
    }
    if (p === '/api/scenarios' && req.method === 'POST') {
      const b = await readBody(req);
      const errs = validateInputs(b.inputs);
      if (errs.length) return send(res, 422, { errors: errs });
      const id = randomUUID();
      db.prepare('INSERT INTO scenario VALUES (?,?,1,0)').run(id, b.name);
      db.prepare('INSERT INTO scenario_version VALUES (?,?,?,?,?,?)').run(id, 1, JSON.stringify(b.inputs), new Date().toISOString(), u.user, b.note ?? '');
      audit(u, 'create', id, 1, b.note);
      return send(res, 201, getScenario(id));
    }
    const m = p.match(/^\/api\/scenarios\/([\w-]+)(\/versions)?$/);
    if (m) {
      const [, id, versions] = m;
      const s = db.prepare('SELECT * FROM scenario WHERE id=? AND deleted=0').get(id);
      if (!s) return send(res, 404, { error: 'not found' });
      if (versions) return send(res, 200, db.prepare('SELECT version, created_at, created_by, note FROM scenario_version WHERE scenario_id=? ORDER BY version').all(id));
      if (req.method === 'GET') return send(res, 200, getScenario(id));
      if (req.method === 'PUT') {
        const b = await readBody(req);
        const errs = validateInputs(b.inputs);
        if (errs.length) return send(res, 422, { errors: errs });
        const v = s.current_version + 1;
        db.prepare('INSERT INTO scenario_version VALUES (?,?,?,?,?,?)').run(id, v, JSON.stringify(b.inputs), new Date().toISOString(), u.user, b.note ?? '');
        db.prepare('UPDATE scenario SET current_version=?, name=? WHERE id=?').run(v, b.name ?? s.name, id);
        audit(u, 'update', id, v, b.note);
        return send(res, 200, getScenario(id));
      }
      if (req.method === 'DELETE') {
        db.prepare('UPDATE scenario SET deleted=1 WHERE id=?').run(id); // soft delete keeps history
        audit(u, 'delete', id, s.current_version);
        return send(res, 200, { ok: true });
      }
    }
    if (p === '/api/audit') return send(res, 200, db.prepare('SELECT * FROM audit ORDER BY at DESC LIMIT 500').all());
    if (p === '/api/checklist' && req.method === 'GET') {
      const rows = db.prepare('SELECT * FROM checklist').all();
      return send(res, 200, Object.fromEntries(rows.map((r) => [r.requirement_id, { status: r.status, owner: r.owner, note: r.note }])));
    }
    const c = p.match(/^\/api\/checklist\/([\w-]+)$/);
    if (c && req.method === 'PUT') {
      const b = await readBody(req);
      db.prepare('INSERT INTO checklist VALUES (?,?,?,?,?,?) ON CONFLICT(requirement_id) DO UPDATE SET status=excluded.status, owner=excluded.owner, note=excluded.note, updated_at=excluded.updated_at, updated_by=excluded.updated_by')
        .run(c[1], b.status ?? '', b.owner ?? '', b.note ?? '', new Date().toISOString(), u.user);
      audit(u, 'checklist', c[1], null, b.status);
      return send(res, 200, { ok: true });
    }
    if (p.startsWith('/api/')) return send(res, 404, { error: 'not found' });
    // static
    const file = normalize(join(dist, p === '/' ? 'index.html' : p));
    if (!file.startsWith(dist)) return send(res, 400, { error: 'bad path' });
    const target = existsSync(file) ? file : join(dist, 'index.html');
    if (!existsSync(target)) { res.writeHead(503); return res.end('Build the UI first: npm run build'); }
    res.writeHead(200, { 'content-type': MIME[extname(target)] ?? 'application/octet-stream' });
    res.end(await readFile(target));
  } catch (e) {
    send(res, 500, { error: String(e.message ?? e) });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 8787);
  createServer(handle).listen(port, () => console.log(`Pro Finance platform on http://localhost:${port}`));
}
