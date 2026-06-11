import { findWorkspaceSession, listWorkspaceSessions as listSessions, upsertWorkspaceSession, generateId, now } from './db';
import type { WorkspaceSession } from '@/types';

function toSession(row: any): WorkspaceSession {
  return {
    id: row.id, user_id: row.user_id, workspace_name: row.workspace_name,
    status: row.status, last_synced_at: row.last_synced_at || null,
    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : (row.metadata || null),
    created_at: row.created_at, updated_at: row.updated_at,
  };
}

export async function getWorkspaceSession(userId: string, workspaceName: string): Promise<WorkspaceSession | null> {
  const row = findWorkspaceSession(userId, workspaceName);
  return row ? toSession(row) : null;
}

export async function listWorkspaceSessions(userId: string): Promise<WorkspaceSession[]> {
  return listSessions(userId).map(toSession);
}

export async function createOrUpdateWorkspaceSession(
  userId: string, workspaceName: string, payload: Partial<WorkspaceSession>
): Promise<WorkspaceSession | null> {
  const key = `${userId}::${workspaceName}`;
  const existing = findWorkspaceSession(userId, workspaceName);
  const t = now();

  const mergedMetadata = mergeMetadata(
    existing?.metadata ? (typeof existing.metadata === 'string' ? JSON.parse(existing.metadata) : existing.metadata) : null,
    payload.metadata || null
  );

  if (existing) {
    upsertWorkspaceSession(key, {
      ...existing,
      status: payload.status ?? 'active',
      last_synced_at: payload.last_synced_at ?? t,
      metadata: mergedMetadata,
      updated_at: t,
    });
    const updated = findWorkspaceSession(userId, workspaceName);
    return updated ? toSession(updated) : null;
  }

  upsertWorkspaceSession(key, {
    id: generateId(), user_id: userId, workspace_name: workspaceName,
    status: payload.status ?? 'active', last_synced_at: payload.last_synced_at ?? t,
    metadata: mergedMetadata, created_at: t, updated_at: t,
  });
  const created = findWorkspaceSession(userId, workspaceName);
  return created ? toSession(created) : null;
}

function mergeMetadata(existing: Record<string, any> | null, incoming: Record<string, any> | null) {
  if (!existing) return incoming || {};
  if (!incoming) return existing;
  const merged = { ...existing, ...incoming };
  if (Array.isArray(existing.history) || Array.isArray(incoming.history)) {
    merged.history = [
      ...(Array.isArray(existing.history) ? existing.history : []),
      ...(Array.isArray(incoming.history) ? incoming.history : []),
    ].slice(-20);
  }
  return merged;
}
