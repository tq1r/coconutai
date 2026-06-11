import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const DB_PATH = path.join(process.cwd(), 'data', 'coconut.json');

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

let cache: Database | null = null;

function ensureDir() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getDb(): Database {
  if (cache) return cache;

  ensureDir();

  if (fs.existsSync(DB_PATH)) {
    try {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      cache = JSON.parse(raw);
      return cache!;
    } catch {
      console.warn('DB file corrupted, resetting');
    }
  }

  cache = JSON.parse(JSON.stringify(DEFAULT_DB));
  persist();
  return cache!;
}

function persist() {
  ensureDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(cache, null, 2), 'utf-8');
}

export function generateId(): string {
  return randomUUID();
}

export function now(): string {
  return new Date().toISOString();
}

// Profile helpers
export function findProfileByEmail(email: string) {
  const db = getDb();
  return Object.values(db.profiles).find((p: any) => p.email === email) || null;
}

export function findProfileByUsername(username: string) {
  const db = getDb();
  return Object.values(db.profiles).find((p: any) => p.username === username) || null;
}

export function findProfileById(id: string) {
  const db = getDb();
  return db.profiles[id] || null;
}

export function insertProfile(profile: any) {
  const db = getDb();
  db.profiles[profile.id] = profile;
  persist();
}

export function updateProfile(id: string, updates: Record<string, any>) {
  const db = getDb();
  if (!db.profiles[id]) return;
  db.profiles[id] = { ...db.profiles[id], ...updates, updated_at: now() };
  persist();
}

// Workspace helpers
export function findWorkspaceSession(userId: string, workspaceName: string) {
  const db = getDb();
  const key = `${userId}::${workspaceName}`;
  return db.workspace_sessions[key] || null;
}

export function listWorkspaceSessions(userId: string) {
  const db = getDb();
  return Object.values(db.workspace_sessions)
    .filter((s: any) => s.user_id === userId)
    .sort((a: any, b: any) => b.updated_at.localeCompare(a.updated_at));
}

export function upsertWorkspaceSession(key: string, session: any) {
  const db = getDb();
  db.workspace_sessions[key] = session;
  persist();
}

// Project helpers
export function findProjectsByWorkspace(userId: string, workspaceId: string) {
  const db = getDb();
  return Object.values(db.workspace_projects)
    .filter((p: any) => p.user_id === userId && p.workspace_id === workspaceId)
    .sort((a: any, b: any) => b.updated_at.localeCompare(a.updated_at));
}

export function findProjectById(userId: string, projectId: string) {
  const db = getDb();
  const p = db.workspace_projects[projectId];
  return p && p.user_id === userId ? p : null;
}

export function insertProject(project: any) {
  const db = getDb();
  db.workspace_projects[project.id] = project;
  persist();
}

export function updateProject(id: string, updates: Record<string, any>) {
  const db = getDb();
  if (!db.workspace_projects[id]) return;
  db.workspace_projects[id] = { ...db.workspace_projects[id], ...updates, updated_at: now() };
  persist();
}

export function deleteProject(id: string) {
  const db = getDb();
  delete db.workspace_projects[id];
  persist();
}

// Usage helpers
export function insertUsage(record: any) {
  const db = getDb();
  db.user_usage.push(record);
  persist();
}

// Audit helpers
export function insertAuditLog(log: any) {
  const db = getDb();
  db.audit_logs.push(log);
  persist();
}
