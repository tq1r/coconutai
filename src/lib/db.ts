import { put, get, del, list } from '@vercel/blob';
import { randomUUID } from 'crypto';

const DB_KEY = 'coconut-db.json';

interface Database {
  profiles: Record<string, any>;
  subscription_tiers: Record<string, any>;
  user_usage: any[];
  workspace_sessions: Record<string, any>;
  workspace_projects: Record<string, any>;
  audit_logs: any[];
}

const DEFAULT_DB: Database = {
  profiles: {},
  subscription_tiers: {
    free: { id: 'free', name: 'Free', price: 0, features: ['Basic AI models', '10 generations/month', 'Community support'], limits: { generations_per_month: 10, max_context_length: 4096 } },
    plus: { id: 'plus', name: 'Plus', price: 9, features: ['Premium models', '100 generations/month', 'Priority support', 'Real-time sync'], limits: { generations_per_month: 100, max_context_length: 8192 } },
    pro: { id: 'pro', name: 'Pro', price: 49, features: ['All models', 'Unlimited generations', 'Email support', 'Advanced tools'], limits: { generations_per_month: -1, max_context_length: 16000 } },
  },
  user_usage: [],
  workspace_sessions: {},
  workspace_projects: {},
  audit_logs: [],
};

async function getDb(): Promise<Database> {
  try {
    const result = await get(DB_KEY, { access: 'private' });
    if (result?.stream) {
      const text = await new Response(result.stream).text();
      return JSON.parse(text);
    }
  } catch (e) {
    console.error('Blob read error, using default DB:', e);
  }
  return JSON.parse(JSON.stringify(DEFAULT_DB));
}

async function persist(data: Database) {
  await put(DB_KEY, JSON.stringify(data), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' });
}

export function generateId(): string {
  return randomUUID();
}

export function now(): string {
  return new Date().toISOString();
}

// Profile helpers
export async function findProfileByEmail(email: string) {
  const db = await getDb();
  return Object.values(db.profiles).find((p: any) => p.email === email) || null;
}

export async function findProfileByUsername(username: string) {
  const db = await getDb();
  return Object.values(db.profiles).find((p: any) => p.username === username) || null;
}

export async function findProfileById(id: string) {
  const db = await getDb();
  return db.profiles[id] || null;
}

export async function insertProfile(profile: any) {
  const db = await getDb();
  db.profiles[profile.id] = profile;
  await persist(db);
}

export async function updateProfile(id: string, updates: Record<string, any>) {
  const db = await getDb();
  if (!db.profiles[id]) return;
  db.profiles[id] = { ...db.profiles[id], ...updates, updated_at: now() };
  await persist(db);
}

// Workspace helpers
export async function findWorkspaceSession(userId: string, workspaceName: string) {
  const db = await getDb();
  const key = `${userId}::${workspaceName}`;
  return db.workspace_sessions[key] || null;
}

export async function listWorkspaceSessions(userId: string) {
  const db = await getDb();
  return Object.values(db.workspace_sessions)
    .filter((s: any) => s.user_id === userId)
    .sort((a: any, b: any) => b.updated_at.localeCompare(a.updated_at));
}

export async function upsertWorkspaceSession(key: string, session: any) {
  const db = await getDb();
  db.workspace_sessions[key] = session;
  await persist(db);
}

// Project helpers
export async function findProjectsByWorkspace(userId: string, workspaceId: string) {
  const db = await getDb();
  return Object.values(db.workspace_projects)
    .filter((p: any) => p.user_id === userId && p.workspace_id === workspaceId)
    .sort((a: any, b: any) => b.updated_at.localeCompare(a.updated_at));
}

export async function findProjectById(userId: string, projectId: string) {
  const db = await getDb();
  const p = db.workspace_projects[projectId];
  return p && p.user_id === userId ? p : null;
}

export async function insertProject(project: any) {
  const db = await getDb();
  db.workspace_projects[project.id] = project;
  await persist(db);
}

export async function updateProject(id: string, updates: Record<string, any>) {
  const db = await getDb();
  if (!db.workspace_projects[id]) return;
  db.workspace_projects[id] = { ...db.workspace_projects[id], ...updates, updated_at: now() };
  await persist(db);
}

export async function deleteProject(id: string) {
  const db = await getDb();
  delete db.workspace_projects[id];
  await persist(db);
}

// Usage helpers
export async function insertUsage(record: any) {
  const db = await getDb();
  db.user_usage.push(record);
  await persist(db);
}

// Audit helpers
export async function insertAuditLog(log: any) {
  const db = await getDb();
  db.audit_logs.push(log);
  await persist(db);
}
