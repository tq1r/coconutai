import { Redis } from '@upstash/redis';
import { randomUUID } from 'crypto';

function createRedisClient(): Redis | null {
  const url = process.env.KV_REST_API_URL || process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.REDIS_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    return new Redis({ url, token });
  }
  return null;
}

const redis = createRedisClient();

export function isRedisAvailable(): boolean {
  return redis !== null;
}

export function generateId(): string {
  return randomUUID();
}

export function now(): string {
  return new Date().toISOString();
}

async function ensureRedis(): Promise<Redis> {
  if (!redis) throw new Error('Redis not configured. Set KV_REST_API_URL and KV_REST_API_TOKEN env vars.');
  return redis;
}

// Profile helpers
export async function findProfileByEmail(email: string) {
  const r = await ensureRedis();
  const id = await r.get(`email:${email.toLowerCase()}`);
  if (!id) return null;
  const raw = await r.get(`profile:${id}`);
  return raw ? JSON.parse(raw as string) : null;
}

export async function findProfileByUsername(username: string) {
  const r = await ensureRedis();
  const id = await r.get(`username:${username.toLowerCase()}`);
  if (!id) return null;
  const raw = await r.get(`profile:${id}`);
  return raw ? JSON.parse(raw as string) : null;
}

export async function findProfileById(id: string) {
  const r = await ensureRedis();
  const raw = await r.get(`profile:${id}`);
  return raw ? JSON.parse(raw as string) : null;
}

export async function insertProfile(profile: any) {
  const r = await ensureRedis();
  await Promise.all([
    r.set(`profile:${profile.id}`, JSON.stringify(profile)),
    r.set(`email:${profile.email.toLowerCase()}`, profile.id),
    r.set(`username:${profile.username.toLowerCase()}`, profile.id),
  ]);
}

export async function updateProfile(id: string, updates: Record<string, any>) {
  const r = await ensureRedis();
  const raw = await r.get(`profile:${id}`);
  if (!raw) return;
  const profile = JSON.parse(raw as string);
  const updated = { ...profile, ...updates, updated_at: now() };
  await r.set(`profile:${id}`, JSON.stringify(updated));
}

// Workspace helpers
export async function findWorkspaceSession(userId: string, workspaceName: string) {
  const r = await ensureRedis();
  const raw = await r.get(`session:${userId}:${workspaceName}`);
  return raw ? JSON.parse(raw as string) : null;
}

export async function listWorkspaceSessions(userId: string) {
  const r = await ensureRedis();
  const keys = await r.keys(`session:${userId}:*`);
  if (!keys.length) return [];
  const values = await r.mget(...keys);
  return (values as string[])
    .filter(Boolean)
    .map((v) => JSON.parse(v))
    .sort((a: any, b: any) => b.updated_at.localeCompare(a.updated_at));
}

export async function upsertWorkspaceSession(key: string, session: any) {
  const r = await ensureRedis();
  await r.set(`session:${key}`, JSON.stringify(session));
}

// Project helpers
export async function findProjectsByWorkspace(userId: string, workspaceId: string) {
  const r = await ensureRedis();
  const idsRaw = await r.get(`project_ids:${userId}:${workspaceId}`);
  const ids: string[] = idsRaw ? JSON.parse(idsRaw as string) : [];
  if (!ids.length) return [];
  const values = await r.mget(...ids.map((id) => `project:${id}`));
  return (values as string[])
    .filter(Boolean)
    .map((v) => JSON.parse(v))
    .sort((a: any, b: any) => b.updated_at.localeCompare(a.updated_at));
}

export async function findProjectById(userId: string, projectId: string) {
  const r = await ensureRedis();
  const raw = await r.get(`project:${projectId}`);
  if (!raw) return null;
  const p = JSON.parse(raw as string);
  return p && p.user_id === userId ? p : null;
}

export async function insertProject(project: any) {
  const r = await ensureRedis();
  await r.set(`project:${project.id}`, JSON.stringify(project));
  const idsKey = `project_ids:${project.user_id}:${project.workspace_id}`;
  const idsRaw = await r.get(idsKey);
  const ids: string[] = idsRaw ? JSON.parse(idsRaw as string) : [];
  ids.push(project.id);
  await r.set(idsKey, JSON.stringify(ids));
}

export async function updateProject(id: string, updates: Record<string, any>) {
  const r = await ensureRedis();
  const raw = await r.get(`project:${id}`);
  if (!raw) return;
  const project = JSON.parse(raw as string);
  const updated = { ...project, ...updates, updated_at: now() };
  await r.set(`project:${id}`, JSON.stringify(updated));
}

export async function deleteProject(id: string) {
  const r = await ensureRedis();
  const raw = await r.get(`project:${id}`);
  if (!raw) return;
  const project = JSON.parse(raw as string);
  await r.del(`project:${id}`);
  const idsKey = `project_ids:${project.user_id}:${project.workspace_id}`;
  const idsRaw = await r.get(idsKey);
  if (idsRaw) {
    const ids: string[] = JSON.parse(idsRaw as string);
    await r.set(idsKey, JSON.stringify(ids.filter((pid) => pid !== id)));
  }
}

// Usage helpers
export async function insertUsage(record: any) {
  const r = await ensureRedis();
  await r.set(`usage:${record.id || generateId()}`, JSON.stringify(record));
}

// Audit helpers
export async function insertAuditLog(log: any) {
  const r = await ensureRedis();
  await r.set(`audit:${log.id || generateId()}`, JSON.stringify(log));
}
