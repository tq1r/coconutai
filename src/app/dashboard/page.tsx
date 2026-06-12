'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import EditorPanel from '@/components/EditorPanel';
import Sidebar from '@/components/Sidebar';
import SettingsPanel from '@/components/SettingsPanel';
import type { AIModel, AIResponse, WorkspaceProject, WorkspaceSession, ScriptFile } from '@/types';

interface ChatMessage { role: 'user' | 'assistant'; text: string }

const DEFAULT_WORKSPACE = 'Coconut AI Workspace';
const DEFAULT_CODE = `-- Coconut AI - Roblox Studio IDE
-- Start coding your Roblox experience below

local module = {}

function module.init()
  print("Coconut AI loaded successfully")
  return true
end

return module
`;

type TabId = 'explorer' | 'chat' | 'settings';

interface TreeNode { name: string; className: string; children?: TreeNode[] }

function TreeView({ items, depth = 0 }: { items: TreeNode[]; depth?: number }) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set(items.length < 20 ? items.map((_, i) => i) : []));
  const toggle = (i: number) => setExpanded((prev) => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
  return (
    <div className="select-none">
      {items.map((item, i) => {
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expanded.has(i);
        return (
          <div key={`${item.name}-${i}`}>
            <div className="flex items-center gap-1 py-0.5 cursor-pointer rounded hover:opacity-80" style={{ paddingLeft: `${depth * 14 + 6}px` }} onClick={() => hasChildren && toggle(i)}>
              <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)', width: 12, textAlign: 'center' }}>
                {hasChildren ? (isExpanded ? '--' : '+') : ' '}
              </span>
              <span className="text-[11px] truncate" style={{ color: 'var(--text-secondary)', fontWeight: item.className === 'Workspace' || item.className === 'Players' ? 600 : 400 }}>{item.name}</span>
              <span className="text-[9px] ml-1" style={{ color: 'var(--text-muted)' }}>{item.className}</span>
            </div>
            {hasChildren && isExpanded && item.children && (
              <TreeView items={item.children} depth={depth + 1} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProjectCard({ project, onOpen, onDelete }: { project: WorkspaceProject; onOpen: () => void; onDelete: () => void }) {
  return (
    <div
      onClick={onOpen}
      className="rounded-lg border cursor-pointer transition-all hover:opacity-90 flex flex-col"
      style={{ background: 'var(--bg-surface-solid)', borderColor: 'var(--border-color)' }}
    >
      <div className="p-5 flex-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>L</div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{project.name}</h3>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{new Date(project.updated_at).toLocaleDateString()}</p>
          </div>
        </div>
        {project.description && (
          <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{project.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 px-5 pb-4 pt-0">
        <button
          onClick={(e) => { e.stopPropagation(); onOpen(); }}
          className="flex-1 px-3 py-2 text-xs font-medium rounded-lg border-0 cursor-pointer transition-all"
          style={{ background: 'var(--accent)', color: 'white' }}
        >Open</button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="w-9 h-9 rounded-lg flex items-center justify-center border cursor-pointer text-xs transition-all"
          style={{ background: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}
          title="Delete"
        >x</button>
      </div>
    </div>
  );
}

function Toast({ message, type, onClose }: { message: string; type: 'error' | 'success'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const bg = type === 'error' ? '#ef4444' : 'var(--accent)';
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-lg text-sm font-medium shadow-2xl text-white animate-float-up" style={{ background: bg }}>
      {message}
    </div>
  );
}

export default function DashboardPage() {
  const [userName, setUserName] = useState('Creator');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [prompt, setPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceSession[]>([]);
  const [workspaceName, setWorkspaceName] = useState(DEFAULT_WORKSPACE);
  const [projects, setProjects] = useState<WorkspaceProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState('Disconnected');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [files, setFiles] = useState<ScriptFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('chat');
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [creating, setCreating] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'error' | 'success'>('error');
  const [robloxLinked, setRobloxLinked] = useState(false);
  const [robloxUsername, setRobloxUsername] = useState('');
  const [explorerTree, setExplorerTree] = useState<any[] | null>(null);
  const [explorerLoading, setExplorerLoading] = useState(false);
  const [pluginCode, setPluginCode] = useState('');
  const [pluginConnected, setPluginConnected] = useState(false);
  const [pluginStatus, setPluginStatus] = useState('');
  const pluginCodeRef = useRef(pluginCode);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeFile = files.find((f) => f.id === activeFileId);
  const code = activeFile?.content ?? DEFAULT_CODE;
  const showIde = activeProjectId !== null;

  useEffect(() => {
    fetchCurrentUser(); fetchModels(); fetchWorkspaceList();
    const saved = localStorage.getItem('coconut-plugin-code');
    if (saved) setPluginCodeAndPersist(saved);
    const params = new URLSearchParams(window.location.search);
    const rbx = params.get('roblox');
    if (rbx === 'linked') fetchCurrentUser();
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);
  useEffect(() => { pluginCodeRef.current = pluginCode; }, [pluginCode]);

  function toast(msg: string, type: 'error' | 'success') {
    setToastMsg(msg); setToastType(type);
  }

  async function setPluginCodeAndPersist(code: string) {
    const upper = code.toUpperCase();
    setPluginCode(upper);
    setPluginConnected(false);
    if (upper.length === 6) {
      localStorage.setItem('coconut-plugin-code', upper);
      try {
        const res = await fetch(`/api/plugin/verify?code=${upper}`);
        const data = await res.json();
        setPluginConnected(data?.connected === true);
        fetchExplorerTree();
      } catch { setPluginConnected(false); }
    }
  }

  async function fetchCurrentUser() {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data?.success && data.user) {
        setUserName(data.user.display_name ?? data.user.email ?? 'Creator');
        setUserEmail(data.user.email || '');
        setUserRole(data.user.role || null);
        setRobloxLinked(!!data.user.roblox_id);
        setRobloxUsername(data.user.roblox_username || '');
      }
    } catch { /* ignore */ }
  }

  async function fetchModels() {
    try {
      const res = await fetch('/api/ai/models');
      const data = await res.json();
      if (data?.success) {
        setModels(data.models || []);
        if (!data.models.find((m: AIModel) => m.id === selectedModel))
          setSelectedModel(data.models[0]?.id ?? 'gpt-4o');
      }
    } catch { /* ignore */ }
  }

  async function fetchWorkspaceList() {
    try {
      const res = await fetch('/api/workspace/list');
      const payload = await res.json();
      if (!payload?.success) return;
      setWorkspaces(payload.data || []);
      const first = payload.data?.[0]?.workspace_name ?? DEFAULT_WORKSPACE;
      setWorkspaceName(first);
      await fetchWorkspaceSession(first);
    } catch { /* ignore */ }
  }

  async function fetchWorkspaceSession(name: string) {
    try {
      const res = await fetch(`/api/workspace/session?workspace_name=${encodeURIComponent(name)}`);
      const payload = await res.json();
      if (payload?.success && payload.data) {
        setWorkspaceName(name);
        await fetchProjects(name, payload.data?.metadata?.active_project_id);
        setSyncStatus('Connected'); return;
      }
      const createRes = await fetch('/api/workspace/session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_name: name, metadata: { initialized: true } }),
      });
      const createPayload = await createRes.json();
      if (createPayload?.success) {
        setWorkspaceName(name);
        await fetchProjects(name); setSyncStatus('Connected');
      }
    } catch { setSyncStatus('Disconnected'); }
  }

  async function fetchProjects(name: string, preferredProjectId?: string | null) {
    try {
      const res = await fetch(`/api/workspace/projects?workspace_name=${encodeURIComponent(name)}`);
      const payload = await res.json();
      if (!payload?.success) return;
      setProjects(payload.data || []);
      if (preferredProjectId && payload.data.some((p: WorkspaceProject) => p.id === preferredProjectId))
        setActiveProjectId(preferredProjectId);
      else if (payload.data?.length) {
        setActiveProjectId(payload.data[0].id);
        setActiveFileId(payload.data[0].id);
      }
    } catch { /* ignore */ }
  }

  async function deleteProject(projectId: string) {
    if (!confirm('Delete this project?')) return;
    try {
      const res = await fetch(`/api/workspace/projects?project_id=${projectId}`, { method: 'DELETE' });
      const payload = await res.json();
      if (payload?.success) {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
        if (activeProjectId === projectId) { setActiveProjectId(null); setActiveFileId(null); }
        toast('Project deleted', 'success');
      } else toast(payload?.error || 'Delete failed', 'error');
    } catch { toast('Unable to delete project', 'error'); }
  }

  function openProject(projectId: string) {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    setActiveProjectId(projectId);
    const existing = files.find((f) => f.projectId === projectId);
    if (existing) setActiveFileId(existing.id);
    else {
      const newFile: ScriptFile = { id: projectId, name: project.name + '.lua', content: `-- ${project.name}\n-- ${project.description || 'Roblox script'}\n\n`, language: 'lua', projectId, updatedAt: new Date().toISOString() };
      setFiles((prev) => [...prev, newFile]); setActiveFileId(newFile.id);
    }
    setActiveTab('explorer');
  }

  function goToProjects() {
    setActiveProjectId(null);
    setActiveFileId(null);
    setActiveTab('chat');
  }

  async function createProject(name: string) {
    if (!name.trim()) { toast('Enter a project name', 'error'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/workspace/projects', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_name: workspaceName, name: name.trim(), description: 'Script project' }),
      });
      const payload = await res.json();
      if (!payload?.success) {
        toast(payload?.error || 'Failed to create project', 'error');
        return;
      }
      const newFile: ScriptFile = {
        id: payload.data.id, name: name.trim() + '.lua',
        content: `-- ${name.trim()}\n-- Generated by Coconut AI\n\n`,
        language: 'lua', projectId: payload.data.id, updatedAt: new Date().toISOString(),
      };
      setFiles((prev) => [...prev, newFile]);
      setShowNewFileInput(false); setNewFileName('');
      await fetchProjects(workspaceName, payload.data.id);
      setActiveProjectId(payload.data.id);
      setActiveFileId(payload.data.id);
      setActiveTab('explorer');
      toast('Project created', 'success');
    } catch (e) {
      console.error('Create failed', e);
      toast('Unable to create project. Check console.', 'error');
    } finally { setCreating(false); }
  }

  async function fetchExplorerTree() {
    const code = pluginCodeRef.current;
    if (code.length !== 6) return;
    setExplorerLoading(true);
    try {
      const res = await fetch(`/api/plugin/explorer?code=${code}`);
      const data = await res.json();
      if (data?.success && data?.tree) setExplorerTree(data.tree);
    } catch { /* ignore */ }
    setExplorerLoading(false);
  }

  async function refreshExplorerTree() {
    const code = pluginCodeRef.current;
    if (code.length !== 6) return;
    setExplorerTree(null);
    try {
      await fetch('/api/plugin/push', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, type: 'report_explorer', script: '' }),
      });
    } catch { /* ignore */ }
    setTimeout(fetchExplorerTree, 3000);
  }

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);
    if (tab === 'explorer' && pluginCodeRef.current.length === 6) {
      fetchExplorerTree();
    }
  }, []);

  function handleCodeChange(value: string) {
    setFiles((prev) => prev.map((f) => f.id === activeFileId ? { ...f, content: value, updatedAt: new Date().toISOString() } : f));
  }

  async function handleGenerate() {
    if (!prompt.trim()) { setError('Enter a prompt'); return; }
    setError(''); setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, modelId: selectedModel, workspaceName, projectId: activeProjectId, projectName: projects.find((p) => p.id === activeProjectId)?.name, sessionCode: pluginCode }),
      });
      const data = await res.json();
      if (!data?.success) { setError(data?.error || 'Generation failed'); return; }
      const aiResponse: AIResponse = data.data;
      setChatHistory((prev) => [...prev, { role: 'user', text: prompt }, { role: 'assistant', text: aiResponse.output }]);
      setPrompt(''); setSyncStatus('Saved');
      const activeCode = pluginCodeRef.current;
      if (activeCode.length === 6) {
        try {
          const pushRes = await fetch('/api/plugin/push', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: activeCode, type: 'script', script: aiResponse.output }),
          });
          const pushData = await pushRes.json();
          setPluginStatus(pushData.success ? 'Pushed to Studio' : 'Push failed');
        } catch { setPluginStatus('Push error'); }
        setTimeout(() => setPluginStatus(''), 4000);
      }
    } catch { setError('Unable to reach AI service.'); } finally { setIsGenerating(false); }
  }

  function applyCodeFromChat(codeSnippet: string) {
    if (activeFileId) setFiles((prev) => prev.map((f) => f.id === activeFileId ? { ...f, content: codeSnippet, updatedAt: new Date().toISOString() } : f));
  }

  const toastClose = useCallback(() => setToastMsg(''), []);

  // ── Project Dashboard View ─────────────────────────────
  if (!showIde) {
    return (
      <ErrorBoundary>
        <div className="h-screen flex flex-col" style={{ background: 'var(--bg-page)' }}>
          <header className="flex items-center gap-4 px-6 h-12 flex-shrink-0 border-b" style={{ background: 'var(--bg-surface-solid)', borderColor: 'var(--border-color)' }}>
            <span className="font-bold text-sm" style={{ color: 'var(--accent)' }}>Coconut AI</span>
            <div className="flex-1" />
            {userRole === 'premium' && <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: '#fbbf24', color: '#000' }}>PREMIUM</span>}
            {userRole === 'admin' && <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: '#ef4444', color: '#fff' }}>ADMIN</span>}
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{userName}</span>
          </header>

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-5xl mx-auto" style={{ padding: '48px 32px' }}>
              <div className="flex items-end justify-between mb-10">
                <div>
                  <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Welcome back{userName !== 'Creator' ? `, ${userName}` : ''}</h1>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Select a project to open the workspace</p>
                </div>
                <button
                  onClick={() => setShowNewFileInput(!showNewFileInput)}
                  className="px-4 py-2 text-xs font-medium rounded-lg border-0 cursor-pointer transition-all"
                  style={{ background: 'var(--accent)', color: 'white' }}
                >+ New</button>
              </div>

              {showNewFileInput && (
                <div className="mb-8 p-4 rounded-lg border" style={{ background: 'var(--bg-surface-solid)', borderColor: 'var(--border-color)' }}>
                  <input
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !creating && createProject(newFileName)}
                    placeholder="Project name..."
                    className="w-full outline-none rounded-lg px-4 py-2.5 text-sm"
                    style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                    autoFocus
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => createProject(newFileName)}
                      disabled={creating}
                      className="px-4 py-2 text-xs font-medium rounded-lg border-0 cursor-pointer transition-all"
                      style={{ background: 'var(--accent)', color: 'white', opacity: creating ? 0.6 : 1 }}
                    >{creating ? 'Creating...' : 'Create'}</button>
                    <button
                      onClick={() => { setShowNewFileInput(false); setNewFileName(''); }}
                      className="px-4 py-2 text-xs font-medium rounded-lg border cursor-pointer transition-all"
                      style={{ background: 'transparent', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}
                    >Cancel</button>
                  </div>
                </div>
              )}

              {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No projects yet</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Click + New to create your first project</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onOpen={() => openProject(project.id)}
                      onDelete={() => deleteProject(project.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          {toastMsg && <Toast message={toastMsg} type={toastType} onClose={toastClose} />}
        </div>
      </ErrorBoundary>
    );
  }

  // ── IDE View ───────────────────────────────────────────
  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col" style={{ background: 'var(--bg-page)' }}>
        <header className="flex items-center gap-3 px-4 h-10 flex-shrink-0 border-b" style={{ background: 'var(--bg-surface-solid)', borderColor: 'var(--border-color)' }}>
          <span className="font-bold text-xs" style={{ color: 'var(--accent)' }}>Coconut AI</span>
          <span style={{ color: 'var(--border-strong)', fontSize: 12 }}>|</span>
          <button
            onClick={goToProjects}
            className="text-[11px] font-medium px-2 py-1 rounded border-0 cursor-pointer"
            style={{ color: 'var(--text-secondary)' }}
          >Projects</button>
          <select
            value={workspaceName}
            onChange={(e) => fetchWorkspaceSession(e.target.value)}
            className="text-[11px] rounded px-2 py-1 outline-none max-w-[160px] truncate"
            style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
          >
            {workspaces.length ? workspaces.map((w) => <option key={w.id} value={w.workspace_name} className="truncate">{w.workspace_name}</option>) : <option className="truncate">{DEFAULT_WORKSPACE}</option>}
          </select>

          <div className="flex-1" />

          <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
            <div className="flex items-center gap-1.5 rounded px-2 py-1 border" style={{ borderColor: 'var(--border-color)' }}>
              <input
                value={pluginCode}
                onChange={(e) => setPluginCodeAndPersist(e.target.value)}
                placeholder="XXXXXX"
                className="w-14 bg-transparent text-[11px] outline-none uppercase tracking-widest font-mono"
                maxLength={6}
                style={{ color: 'var(--text-primary)' }}
              />
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: pluginConnected ? 'var(--accent)' : pluginCode.trim().length === 6 ? '#fbbf24' : 'var(--border-strong)' }} />
            </div>

            <a href="/api/auth/roblox" className="px-2 py-1 rounded font-medium border no-underline" style={{ background: robloxLinked ? 'var(--accent-soft)' : 'transparent', color: robloxLinked ? 'var(--accent)' : 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>
              {robloxLinked ? `RBX ${robloxUsername}` : 'Link Roblox'}
            </a>

            {userRole === 'premium' && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: '#fbbf24', color: '#000' }}>P</span>}
            {userRole === 'admin' && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: '#ef4444', color: '#fff' }}>A</span>}

            <span className="max-w-[100px] truncate text-xs" style={{ color: 'var(--text-primary)' }}>{userName}</span>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-shrink-0" style={{ borderRight: '1px solid var(--border-color)' }}>
            <Sidebar activeTab={activeTab} onTabChange={handleTabChange}>
              {/* Explorer Panel */}
              {activeTab === 'explorer' && (
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between px-3 h-9 flex-shrink-0 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>Explorer</span>
                    <div className="flex items-center gap-1">
                      {pluginCode.trim().length === 6 && (
                        <button onClick={() => { refreshExplorerTree(); fetchExplorerTree(); }} className="w-6 h-6 rounded flex items-center justify-center border-0 cursor-pointer text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          {explorerLoading ? '~' : '+'}
                        </button>
                      )}
                      <button onClick={() => { goToProjects(); setTimeout(() => setShowNewFileInput(true), 50); }} className="w-6 h-6 rounded flex items-center justify-center border-0 cursor-pointer text-[11px]" style={{ color: 'var(--text-muted)' }}>+</button>
                    </div>
                  </div>

                  {pluginCode.trim().length === 6 && (
                    <div className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                      <div className="flex items-center justify-between px-3 py-1.5">
                        <span className="text-[10px] font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>STUDIO</span>
                      </div>
                      <div className="px-1 pb-1.5 max-h-[240px] overflow-y-auto">
                        {explorerTree ? (
                          <TreeView items={explorerTree} depth={0} />
                        ) : (
                          <div className="flex items-center justify-center py-4">
                            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{explorerLoading ? 'Loading...' : 'Connect plugin to see Studio'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between px-3 py-1.5 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <span className="text-[10px] font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>SCRIPTS</span>
                  </div>
                  <div className="flex-1 overflow-y-auto py-1">
                    {projects.map((project) => (
                      <button key={project.id} onClick={() => openProject(project.id)} className="w-full text-left px-3 py-1.5 text-xs rounded transition-all truncate border-0 cursor-pointer" style={activeProjectId === project.id ? { background: 'var(--accent-soft)', color: 'var(--accent)' } : { background: 'transparent', color: 'var(--text-secondary)' }}>
                        L {project.name}.lua
                      </button>
                    ))}
                    {projects.length === 0 && <p className="text-[10px] text-center mt-5 px-2" style={{ color: 'var(--text-muted)' }}>No scripts</p>}
                  </div>
                </div>
              )}

              {/* Chat Panel */}
              {activeTab === 'chat' && (
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between px-3 h-9 flex-shrink-0 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>AI Chat</span>
                    <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="text-[10px] rounded px-2 py-1 outline-none max-w-[120px] truncate" style={{ background: 'transparent', color: 'var(--accent)', border: '1px solid var(--border-color)' }}>
                      {models.map((m) => <option key={m.id} value={m.id}>{m.name} {m.premium ? '*' : ''}</option>)}
                    </select>
                  </div>

                  <div className="flex-1 overflow-y-auto" style={{ padding: '10px 12px' }}>
                    {chatHistory.length === 0 ? (
                      <div className="flex flex-col items-center justify-center" style={{ height: '100%', minHeight: '280px' }}>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Ask AI to generate code</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Combat, UI, movement, and more</p>
                      </div>
                    ) : chatHistory.map((msg, i) => (
                      <div key={i}>
                        {msg.role === 'user' && (
                          <div className="flex items-start gap-2" style={{ marginBottom: '14px' }}>
                            <div className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold flex-shrink-0" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>U</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-medium mb-0.5" style={{ color: 'var(--text-muted)' }}>You</p>
                              <div className="rounded-lg px-3 py-2 inline-block" style={{ background: 'var(--accent-soft)', color: 'var(--text-primary)', maxWidth: '88%' }}>
                                <p className="text-xs" style={{ lineHeight: 1.5 }}>{msg.text}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {msg.role === 'assistant' && (
                          <div className="flex items-start gap-2" style={{ marginBottom: '14px' }}>
                            <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 text-[9px] font-bold" style={{ background: 'var(--bg-surface-solid)', border: '1px solid var(--border-color)', color: 'var(--accent)' }}>AI</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-medium mb-0.5" style={{ color: 'var(--text-muted)' }}>Coconut AI</p>
                              <div className="rounded-lg px-3 py-2" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>
                                <pre className="whitespace-pre-wrap font-sans text-xs" style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}>{msg.text}</pre>
                                {(msg.text.includes('function') || msg.text.includes('local ')) && (
                                  <button onClick={() => applyCodeFromChat(msg.text)} className="mt-2 text-[11px] text-white font-medium px-3 py-1.5 rounded border-0 cursor-pointer" style={{ background: 'var(--accent)' }}>
                                    Apply
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  <div className="px-3 py-2.5 border-t flex-shrink-0" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-surface-solid)' }}>
                    {error && <p className="text-xs mb-1.5 font-medium" style={{ color: '#ef4444' }}>{error}</p>}
                    <textarea
                      rows={2}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleGenerate())}
                      placeholder="Describe what to build..."
                      className="w-full resize-none text-xs rounded-lg px-3 py-2"
                      style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', lineHeight: 1.5, outline: 'none' }}
                    />
                    <button onClick={handleGenerate} disabled={isGenerating} className="w-full text-xs font-medium text-white mt-2 rounded-lg px-4 py-2.5 border-0 cursor-pointer transition-all" style={{ background: 'var(--accent)', opacity: isGenerating ? 0.6 : 1 }}>
                      {isGenerating ? 'Generating...' : 'Generate'}
                    </button>
                  </div>
                </div>
              )}

              {/* Settings Panel */}
              {activeTab === 'settings' && (
                <SettingsPanel
                  userName={userName}
                  userEmail={userEmail}
                  userRole={userRole || 'user'}
                  robloxUsername={robloxUsername}
                  pluginCode={pluginCode}
                  onPluginCodeChange={setPluginCodeAndPersist}
                />
              )}
            </Sidebar>
          </div>

          {/* Editor */}
          <main className="flex-1 flex flex-col overflow-hidden" style={{ padding: '10px 14px 10px 10px' }}>
            <div className="flex-1 flex flex-col overflow-hidden rounded-lg border" style={{ background: 'var(--bg-editor)', borderColor: 'var(--border-color)' }}>
              <EditorPanel code={code} onChange={handleCodeChange} activeFile={activeFile} />
            </div>
          </main>
        </div>

        {/* Status Bar */}
        <footer className="flex items-center justify-between px-4 h-7 border-t text-[11px] flex-shrink-0" style={{ background: 'var(--bg-surface-solid)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-4">
            <span className="cursor-pointer" style={{ color: activeTab === 'explorer' ? 'var(--accent)' : 'inherit' }} onClick={() => handleTabChange('explorer')}>[.] Explorer</span>
            <span className="cursor-pointer" style={{ color: activeTab === 'chat' ? 'var(--accent)' : 'inherit' }} onClick={() => handleTabChange('chat')}>&lt;AI&gt; AI Chat</span>
            <span className="cursor-pointer" style={{ color: activeTab === 'settings' ? 'var(--accent)' : 'inherit' }} onClick={() => handleTabChange('settings')}>[=] Settings</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Ln 1</span>
            <span style={{ color: 'var(--border-strong)' }}>|</span>
            <span>Luau</span>
          </div>
        </footer>
      </div>
      {toastMsg && <Toast message={toastMsg} type={toastType} onClose={toastClose} />}
    </ErrorBoundary>
  );
}
