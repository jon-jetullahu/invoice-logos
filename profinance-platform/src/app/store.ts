// Scenario persistence: REST API (server/index.mjs, SQLite, versioned with audit trail) with localStorage fallback.
import type { ModelInputs } from '../engine';

export interface SavedScenario { id: string; name: string; version: number; updatedAt: string; updatedBy: string; inputs: ModelInputs }
export interface AuditEntry { at: string; user: string; role: string; action: string; scenarioId: string; version: number; note: string }

const LS_KEY = 'pf-scenarios-v1';
const LS_CHECK = 'pf-checklist-v1';

function lsRead<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}
function lsWrite(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage unavailable */ }
}

export interface Session { user: string; role: 'Admin' | 'Finance' | 'Risk/Compliance' | 'Management Viewer' }

async function api<T>(path: string, session: Session, init?: RequestInit): Promise<T> {
  const r = await fetch(`/api${path}`, { ...init, headers: { 'content-type': 'application/json', 'x-user': session.user, 'x-role': session.role, ...(init?.headers ?? {}) } });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json() as Promise<T>;
}

export class Store {
  online = false;
  constructor(public session: Session) {}

  async probe() {
    try { await api('/health', this.session); this.online = true; } catch { this.online = false; }
    return this.online;
  }

  async list(): Promise<SavedScenario[]> {
    if (this.online) return api('/scenarios', this.session);
    return lsRead<SavedScenario[]>(LS_KEY, []);
  }

  async save(name: string, inputs: ModelInputs, id?: string, note = ''): Promise<SavedScenario> {
    if (this.online) return api(id ? `/scenarios/${id}` : '/scenarios', this.session, { method: id ? 'PUT' : 'POST', body: JSON.stringify({ name, inputs, note }) });
    const all = lsRead<SavedScenario[]>(LS_KEY, []);
    const existing = id ? all.find((s) => s.id === id) : undefined;
    const rec: SavedScenario = { id: existing?.id ?? crypto.randomUUID(), name, version: (existing?.version ?? 0) + 1, updatedAt: new Date().toISOString(), updatedBy: this.session.user, inputs };
    lsWrite(LS_KEY, [...all.filter((s) => s.id !== rec.id), rec]);
    return rec;
  }

  async remove(id: string) {
    if (this.online) return api(`/scenarios/${id}`, this.session, { method: 'DELETE' });
    lsWrite(LS_KEY, lsRead<SavedScenario[]>(LS_KEY, []).filter((s) => s.id !== id));
  }

  async audit(): Promise<AuditEntry[]> {
    return this.online ? api('/audit', this.session) : [];
  }

  async checklist(): Promise<Record<string, { status: string; owner: string; note: string }>> {
    if (this.online) return api('/checklist', this.session);
    return lsRead(LS_CHECK, {});
  }

  async setChecklist(id: string, v: { status: string; owner: string; note: string }) {
    if (this.online) return api(`/checklist/${id}`, this.session, { method: 'PUT', body: JSON.stringify(v) });
    lsWrite(LS_CHECK, { ...lsRead(LS_CHECK, {}), [id]: v });
  }
}

export const canEdit = (s: Session) => s.role !== 'Management Viewer';
