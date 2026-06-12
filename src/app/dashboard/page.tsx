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
      className="rounded-2xl border cursor-pointer transition-all hover:shadow-xl hover:-translate-y-0.5 flex flex-col"
      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}
    >
      <div className="p-6 flex-1">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>L</div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{project.name}</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Updated {new Date(project.updated_at).toLocaleDateString()}</p>
          </div>
        </div>
        {project.description && (
          <p className="text-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{project.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 px-6 pb-5 pt-0">
        <button
          onClick={(e) => { e.stopPropagation(); onOpen(); }}
          className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl border-0 cursor-pointer transition-all text-white"
          style={{ background: 'linear-gradient(135deg, var(--accent), #2dd4bf)' }}
        >Open</button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="w-10 h-10 rounded-xl flex items-center justify-center border cursor-pointer text-sm transition-all"
          style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}
          title="Delete"
        >x</button>
      </div>
    </div>
  );
}

function Toast({ message, type, onClose }: { message: string; type: 'error' | 'success'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const bg = type === 'error' ? 'var(--danger)' : 'var(--accent)';
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-2xl text-white animate-float-up" style={{ background: bg }}>
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
        <div className="h-screen flex flex-col" style={{ background: 'var(--bg-gradient)' }}>
          <header className="flex items-center gap-4 px-8 h-14 flex-shrink-0 border-b" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
            <span className="font-bold text-base tracking-tight" style={{ background: 'linear-gradient(135deg, var(--accent), #2dd4bf)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Coconut AI</span>
            <div className="flex-1" />
            {userRole === 'premium' && <span className="px-2.5 py-0.5 rounded text-[11px] font-bold" style={{ background: 'linear-gradient(135deg, #fde68a, #f59e0b)', color: '#92400e' }}>* PREMIUM</span>}
            {userRole === 'admin' && <span className="px-2.5 py-0.5 rounded text-[11px] font-bold" style={{ background: 'linear-gradient(135deg, #fca5a5, #ef4444)', color: '#7f1d1d' }}>* ADMIN</span>}
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{userName}</span>
          </header>

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto" style={{ padding: '64px 48px' }}>
              <div className="flex items-end justify-between mb-12">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Projects</h1>
                  <p className="text-base mt-2" style={{ color: 'var(--text-muted)' }}>Select a project to open the workspace</p>
                </div>
                <button
                  onClick={() => setShowNewFileInput(!showNewFileInput)}
                  className="px-6 py-3 text-sm font-semibold rounded-xl border-0 cursor-pointer transition-all text-white hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, var(--accent), #2dd4bf)' }}
                >+ New Project</button>
              </div>

              {showNewFileInput && (
                <div className="mb-10 p-6 rounded-2xl border" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}>
                  <input
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !creating && createProject(newFileName)}
                    placeholder="Project name..."
                    className="w-full outline-none rounded-xl px-5 py-3.5 text-base"
                    style={{ background: 'var(--bg-code)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                    autoFocus
                  />
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => createProject(newFileName)}
                      disabled={creating}
                      className="px-6 py-3 text-sm font-semibold rounded-xl border-0 cursor-pointer text-white transition-all"
                      style={{ background: 'linear-gradient(135deg, var(--accent), #2dd4bf)', opacity: creating ? 0.6 : 1 }}
                    >{creating ? 'Creating...' : 'Create Project'}</button>
                    <button
                      onClick={() => { setShowNewFileInput(false); setNewFileName(''); }}
                      className="px-6 py-3 text-sm font-semibold rounded-xl border cursor-pointer transition-all"
                      style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}
                    >Cancel</button>
                  </div>
                </div>
              )}

              {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold font-mono mb-6" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>{'{ }'}</div>
                  <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No projects yet</h2>
                  <p className="text-base mb-8" style={{ color: 'var(--text-muted)' }}>Create your first project to start building</p>
                  <button
                    onClick={() => setShowNewFileInput(true)}
                    className="px-8 py-3.5 text-base font-semibold rounded-xl border-0 cursor-pointer transition-all text-white hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, var(--accent), #2dd4bf)' }}
                  >+ New Project</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
      <div className="h-screen flex flex-col" style={{ background: 'var(--bg-gradient)' }}>
        <header className="flex items-center gap-4 px-6 h-14 flex-shrink-0 border-b" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
          <span className="font-bold text-sm tracking-tight flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--accent), #2dd4bf)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Coconut AI</span>
          <span className="text-xs" style={{ color: 'var(--border-strong)' }}>|</span>
          <button
            onClick={goToProjects}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border-0 cursor-pointer transition-all"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >{'< Projects'}</button>
          <select
            value={workspaceName}
            onChange={(e) => fetchWorkspaceSession(e.target.value)}
            className="text-xs rounded-lg px-3 py-1.5 outline-none max-w-[180px] truncate"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
          >
            {workspaces.length ? workspaces.map((w) => <option key={w.id} value={w.workspace_name} className="truncate">{w.workspace_name}</option>) : <option className="truncate">{DEFAULT_WORKSPACE}</option>}
          </select>

          <div className="flex-1" />

          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <div className="flex items-center gap-2 rounded-xl px-3 py-1.5 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
              <span style={{ fontSize: 10 }}>Studio</span>
              <input
                value={pluginCode}
                onChange={(e) => setPluginCodeAndPersist(e.target.value)}
                placeholder="XXX XXX"
                className="w-16 bg-transparent text-xs outline-none uppercase tracking-widest font-mono"
                maxLength={6}
                style={{ color: 'var(--text-primary)' }}
              />
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: pluginConnected ? 'var(--accent)' : pluginCode.trim().length === 6 ? 'var(--warning)' : 'var(--border-strong)' }} />
              {pluginConnected && <span className="text-[10px] font-medium" style={{ color: 'var(--accent)' }}>Connected</span>}
              {!pluginConnected && pluginCode.trim().length === 6 && <span className="text-[10px] font-medium" style={{ color: 'var(--warning)' }}>Invalid Code</span>}
              {pluginStatus && (
                <span className="text-[10px] font-medium whitespace-nowrap" style={{ color: pluginStatus.includes('error') || pluginStatus.includes('fail') ? 'var(--danger)' : 'var(--accent)' }}>{pluginStatus}</span>
              )}
            </div>

            <a href="/api/auth/roblox" className="px-3 py-1.5 rounded-lg font-medium border no-underline" style={{ background: robloxLinked ? 'var(--accent-soft)' : 'var(--bg-surface)', color: robloxLinked ? 'var(--accent)' : 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>
              {robloxLinked ? `RBX ${robloxUsername}` : 'Link Roblox'}
            </a>

            {userRole === 'premium' && <span className="px-2.5 py-0.5 rounded text-[10px] font-bold" style={{ background: 'linear-gradient(135deg, #fde68a, #f59e0b)', color: '#92400e' }}>* PREMIUM</span>}
            {userRole === 'admin' && <span className="px-2.5 py-0.5 rounded text-[10px] font-bold" style={{ background: 'linear-gradient(135deg, #fca5a5, #ef4444)', color: '#7f1d1d' }}>* ADMIN</span>}

            <span className="px-3 py-1.5 rounded-xl border font-medium truncate max-w-[120px] text-xs" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>{userName}</span>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-shrink-0" style={{ borderRight: '1px solid var(--border-color)' }}>
            <Sidebar activeTab={activeTab} onTabChange={handleTabChange}>
              {/* Explorer Panel */}
              {activeTab === 'explorer' && (
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between px-4 h-11 flex-shrink-0 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Explorer</span>
                    <div className="flex items-center gap-1.5">
                      {pluginCode.trim().length === 6 && (
                        <button onClick={() => { refreshExplorerTree(); fetchExplorerTree(); }} className="px-2 py-1 text-[10px] font-semibold rounded-lg border-0 cursor-pointer transition-all" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                          {explorerLoading ? '~' : '+'}
                        </button>
                      )}
                      <button onClick={() => setShowNewFileInput(!showNewFileInput)} className="w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer border-0 text-xs font-bold" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>+</button>
                    </div>
                  </div>

                  {pluginCode.trim().length === 6 && (
                    <div className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-[10px] font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>STUDIO</span>
                      </div>
                      <div className="px-1 pb-2 max-h-[260px] overflow-y-auto">
                        {explorerTree ? (
                          <TreeView items={explorerTree} depth={0} />
                        ) : (
                          <div className="flex items-center justify-center py-5">
                            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{explorerLoading ? 'Loading...' : 'Click + to fetch'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <span className="text-[10px] font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>SCRIPTS</span>
                    {showNewFileInput && (
                      <input value={newFileName} onChange={(e) => setNewFileName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !creating && createProject(newFileName)} placeholder="script.lua" className="w-24 text-[10px] outline-none" style={{ background: 'var(--bg-code)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px 8px' }} autoFocus />
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto py-1 px-1 space-y-0.5">
                    {projects.map((project) => (
                      <button key={project.id} onClick={() => openProject(project.id)} className="w-full text-left px-3 py-1.5 text-xs rounded-lg transition-all truncate border cursor-pointer" style={activeProjectId === project.id ? { background: 'var(--accent-soft)', color: 'var(--accent)', borderColor: 'var(--border-color)', fontWeight: 500 } : { background: 'transparent', color: 'var(--text-secondary)', borderColor: 'transparent' }}>
                        L {project.name}.lua
                      </button>
                    ))}
                    {projects.length === 0 && <p className="text-[10px] text-center mt-6 px-2" style={{ color: 'var(--text-muted)' }}>No scripts yet</p>}
                  </div>
                </div>
              )}

              {/* Chat Panel */}
              {activeTab === 'chat' && (
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between px-4 h-11 flex-shrink-0 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>AI Assistant</span>
                    <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="text-[11px] rounded-lg px-2 py-1 outline-none max-w-[130px] truncate font-medium" style={{ background: 'var(--bg-surface)', color: 'var(--accent)', border: '1px solid var(--border-color)' }}>
                      {models.map((m) => <option key={m.id} value={m.id}>{m.name} {m.premium ? '*' : 'o'}</option>)}
                    </select>
                  </div>

                  <div className="flex-1 overflow-y-auto" style={{ padding: '12px 14px' }}>
                    {chatHistory.length === 0 ? (
                      <div className="flex flex-col items-center justify-center" style={{ height: '100%', minHeight: '300px' }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold font-mono mb-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>{'<AI>'}</div>
                        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Ask AI to generate Roblox code</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Combat, UI, movement, economy, or anything</p>
                      </div>
                    ) : chatHistory.map((msg, i) => (
                      <div key={i}>
                        {msg.role === 'user' && (
                          <div className="flex items-start gap-2" style={{ marginBottom: '16px' }}>
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>U</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>You</p>
                              <div className="rounded-2xl px-4 py-3 inline-block" style={{ background: 'var(--accent-soft)', color: 'var(--text-primary)', maxWidth: '88%' }}>
                                <p className="text-sm" style={{ lineHeight: 1.5 }}>{msg.text}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {msg.role === 'assistant' && (
                          <div className="flex items-start gap-2" style={{ marginBottom: '16px' }}>
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: 'var(--bg-surface-solid)', border: '1px solid var(--border-color)', color: 'var(--accent)' }}>AI</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Coconut AI</p>
                              <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>
                                <pre className="whitespace-pre-wrap font-sans text-sm" style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}>{msg.text}</pre>
                                {(msg.text.includes('function') || msg.text.includes('local ')) && (
                                  <button onClick={() => applyCodeFromChat(msg.text)} className="mt-3 text-xs text-white font-medium px-4 py-2 rounded-xl border-0 cursor-pointer transition-all" style={{ background: 'linear-gradient(135deg, var(--accent), #2dd4bf)' }}>
                                    Apply to Editor
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

                  <div className="px-3 py-3 border-t flex-shrink-0" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-elevated)' }}>
                    {error && <p className="text-xs mb-2 font-medium" style={{ color: 'var(--danger)' }}>{error}</p>}
                    <textarea
                      rows={2}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleGenerate())}
                      placeholder="Describe what to build..."
                      className="w-full resize-none text-sm rounded-xl px-4 py-3"
                      style={{ background: 'var(--bg-code)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontSize: 13, lineHeight: 1.5, outline: 'none' }}
                    />
                    <button onClick={handleGenerate} disabled={isGenerating} className="w-full text-sm font-semibold text-white mt-2.5 rounded-xl px-4 py-3 border-0 cursor-pointer transition-all" style={{ background: 'linear-gradient(135deg, var(--accent), #2dd4bf)', opacity: isGenerating ? 0.6 : 1 }}>
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
          <main className="flex-1 flex flex-col overflow-hidden" style={{ padding: '14px 20px 14px 14px' }}>
            <div className="flex-1 flex flex-col overflow-hidden rounded-2xl border" style={{ background: 'var(--bg-editor)', borderColor: 'var(--border-color)' }}>
              <EditorPanel code={code} onChange={handleCodeChange} activeFile={activeFile} />
            </div>
          </main>
        </div>

        {/* Status Bar */}
        <footer className="flex items-center justify-between px-6 h-8 border-t text-[11px] flex-shrink-0" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-5">
            <span className="cursor-pointer font-medium transition-colors" style={{ color: activeTab === 'explorer' ? 'var(--accent)' : 'inherit' }} onClick={() => handleTabChange('explorer')}>[.] Explorer</span>
            <span className="cursor-pointer font-medium transition-colors" style={{ color: activeTab === 'chat' ? 'var(--accent)' : 'inherit' }} onClick={() => handleTabChange('chat')}>&lt;AI&gt; AI Chat</span>
            <span className="cursor-pointer font-medium transition-colors" style={{ color: activeTab === 'settings' ? 'var(--accent)' : 'inherit' }} onClick={() => handleTabChange('settings')}>[=] Settings</span>
          </div>
          <div className="flex items-center gap-4">
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
