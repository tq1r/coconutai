import { findWorkspaceSession, findProjectsByWorkspace, findProjectById, insertProject, updateProject, deleteProject as delProject, generateId, now } from './db';
import { createOrUpdateWorkspaceSession } from './workspace';
import type { WorkspaceProject } from '@/types';

function toProject(row: any): WorkspaceProject {
  return {
    id: row.id, user_id: row.user_id, workspace_id: row.workspace_id,
    name: row.name, description: row.description || null, status: row.status,
    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : (row.metadata || null),
    created_at: row.created_at, updated_at: row.updated_at,
  };
}

export async function listWorkspaceProjects(userId: string, workspaceName: string): Promise<WorkspaceProject[]> {
  const workspace = findWorkspaceSession(userId, workspaceName);
  if (!workspace) return [];
  return findProjectsByWorkspace(userId, workspace.id).map(toProject);
}

export async function createWorkspaceProject(
  userId: string, workspaceName: string, payload: { name: string; description?: string; metadata?: Record<string, any> }
): Promise<WorkspaceProject | null> {
  let workspace = findWorkspaceSession(userId, workspaceName);
  if (!workspace) {
    workspace = await createOrUpdateWorkspaceSession(userId, workspaceName, { status: 'active', last_synced_at: now(), metadata: {} });
  }
  if (!workspace) return null;

  const t = now();
  const id = generateId();
  insertProject({
    id, user_id: userId, workspace_id: workspace.id, name: payload.name,
    description: payload.description ?? null, status: 'active',
    metadata: payload.metadata ?? null, created_at: t, updated_at: t,
  });

  await createOrUpdateWorkspaceSession(userId, workspaceName, {
    metadata: { active_project_id: id, active_project_name: payload.name },
  });

  return toProject(findProjectById(userId, id)!);
}

export async function getWorkspaceProject(userId: string, projectId: string): Promise<WorkspaceProject | null> {
  const row = findProjectById(userId, projectId);
  return row ? toProject(row) : null;
}

export async function updateWorkspaceProject(
  userId: string, projectId: string, payload: { name?: string; description?: string | null; metadata?: Record<string, any> | null }
): Promise<WorkspaceProject | null> {
  updateProject(projectId, {
    ...(payload.name !== undefined && { name: payload.name }),
    ...(payload.description !== undefined && { description: payload.description }),
    ...(payload.metadata !== undefined && { metadata: payload.metadata }),
  });
  const row = findProjectById(userId, projectId);
  return row ? toProject(row) : null;
}

export async function deleteWorkspaceProject(userId: string, projectId: string): Promise<boolean> {
  const row = findProjectById(userId, projectId);
  if (!row) return false;
  delProject(projectId);
  return true;
}
