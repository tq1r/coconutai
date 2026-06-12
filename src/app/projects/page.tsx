'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import WaveBackground from '@/components/WaveBackground';
import type { WorkspaceProject, WorkspaceSession } from '@/types';

const DEFAULT_WORKSPACE = 'Coconut AI Workspace';

export default function ProjectsPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('Creator');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [projects, setProjects] = useState<WorkspaceProject[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceSession[]>([]);
  const [workspaceName, setWorkspaceName] = useState(DEFAULT_WORKSPACE);
  const [showNewInput, setShowNewInput] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'error' | 'success'>('error');

  function toast(msg: string, type: 'error' | 'success') {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 3500);
  }

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data.user) {
          setUserName(data.user.display_name ?? data.user.email ?? 'Creator');
          setUserEmail(data.user.email || '');
          setUserRole(data.user.role || null);
        }
      })
      .catch(() => {});
    fetchWorkspaces();
  }, []);

  async function fetchWorkspaces() {
    try {
      const res = await fetch('/api/workspace/list');
      const payload = await res.json();
      if (!payload?.success) return;
      setWorkspaces(payload.data || []);
      const first = payload.data?.[0]?.workspace_name ?? DEFAULT_WORKSPACE;
      setWorkspaceName(first);
      await fetchProjects(first);
    } catch {}
  }

  async function fetchProjects(name: string) {
    try {
      const res = await fetch(`/api/workspace/projects?workspace_name=${encodeURIComponent(name)}`);
      const payload = await res.json();
      if (payload?.success) setProjects(payload.data || []);
    } catch {}
  }

  async function createProject() {
    if (!newName.trim()) { toast('Enter a project name', 'error'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/workspace/projects', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_name: workspaceName, name: newName.trim(), description: '' }),
      });
      const payload = await res.json();
      if (!payload?.success) {
        toast(payload?.error || 'Failed to create project', 'error');
        return;
      }
      setShowNewInput(false);
      setNewName('');
      setProjects((prev) => [...prev, payload.data]);
      toast('Project created', 'success');
    } catch {
      toast('Unable to create project', 'error');
    } finally { setCreating(false); }
  }

  async function deleteProject(projectId: string) {
    try {
      const res = await fetch(`/api/workspace/projects?project_id=${projectId}`, { method: 'DELETE' });
      const payload = await res.json();
      if (payload?.success) {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
        toast('Project deleted', 'success');
      } else toast(payload?.error || 'Delete failed', 'error');
    } catch { toast('Unable to delete project', 'error'); }
  }

  function openProject(projectId: string) {
    router.push(`/dashboard?projectId=${projectId}`);
  }

  function Toast() {
    if (!toastMsg) return null;
    return (
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 text-sm font-medium shadow-xl animate-float-up" style={{ background: toastType === 'error' ? '#ef4444' : '#d97706', color: '#fff', borderRadius: '4px' }}>
        {toastMsg}
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--bg-page)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 h-11 flex-shrink-0 border-b" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-surface-solid)' }}>
        <Link href="/" className="flex items-center gap-2 no-underline">
          <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>Coconut AI</span>
        </Link>
        <div className="flex items-center gap-3">
          <select
            value={workspaceName}
            onChange={(e) => { setWorkspaceName(e.target.value); fetchProjects(e.target.value); }}
            className="text-[11px] outline-none border px-2 py-1 rounded"
            style={{ background: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}
          >
            {workspaces.map((w) => <option key={w.id} value={w.workspace_name}>{w.workspace_name}</option>)}
          </select>
          <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {userRole === 'premium' && <span style={{ color: '#fbbf24' }}>Premium</span>}
            {userRole === 'admin' && <span style={{ color: '#ef4444' }}>Admin</span>}
            <span style={{ color: 'var(--text-secondary)' }}>{userName}</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-start justify-center overflow-y-auto" style={{ padding: '48px 32px' }}>
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-between mb-7">
            <div>
              <h1 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Projects</h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Select a project to open the workspace</p>
            </div>
            <button
              onClick={() => setShowNewInput(!showNewInput)}
              className="text-[11px] font-medium px-3 py-1.5 border-0 cursor-pointer"
              style={{ background: 'var(--accent)', color: '#fff', borderRadius: '4px' }}
            >+ New</button>
          </div>

          {showNewInput && (
            <div className="mb-5 p-3 border animate-slide-up" style={{ background: 'var(--bg-surface-solid)', borderColor: 'var(--border-color)', borderRadius: '4px' }}>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !creating && createProject()}
                placeholder="Project name..."
                className="w-full outline-none px-3 py-1.5 text-xs"
                style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button onClick={createProject} disabled={creating} className="px-3 py-1.5 text-[11px] font-medium border-0 cursor-pointer" style={{ background: 'var(--accent)', color: '#fff', borderRadius: '4px', opacity: creating ? 0.6 : 1 }}>
                  {creating ? 'Creating...' : 'Create'}
                </button>
                <button onClick={() => { setShowNewInput(false); setNewName(''); }} className="px-3 py-1.5 text-[11px] font-medium border cursor-pointer" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', borderRadius: '4px', background: 'transparent' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center" style={{ paddingTop: '80px' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No projects yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 stagger-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="group border cursor-pointer animate-slide-up"
                  style={{ background: 'var(--bg-surface-solid)', borderColor: 'var(--border-color)', borderRadius: '4px', padding: '16px 18px', transition: 'all 0.15s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-soft)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-surface-solid)'; }}
                  onClick={() => openProject(project.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>L</span>
                      <span className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{project.name}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] border-0 cursor-pointer px-1.5 py-0.5"
                      style={{ color: 'var(--text-muted)' }}
                      title="Delete"
                    >x</button>
                  </div>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Updated {new Date(project.updated_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <WaveBackground />
      <footer className="flex items-center justify-between px-4 h-6 border-t text-[10px] flex-shrink-0 relative z-10" style={{ background: 'var(--bg-surface-solid)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
        <span>{projects.length} {projects.length === 1 ? 'project' : 'projects'}</span>
        <span style={{ color: 'var(--text-secondary)' }}>{userName}</span>
      </footer>
      <Toast />
    </div>
  );
}
