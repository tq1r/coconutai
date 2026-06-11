'use client';

import { useEffect, useState, useRef } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import EditorPanel from '@/components/EditorPanel';
import ThemePicker from '@/components/ThemePicker';
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

export default function DashboardPage() {
  const [userName, setUserName] = useState('Creator');
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
  const [showExplorer, setShowExplorer] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [robloxLinked, setRobloxLinked] = useState(false);
  const [robloxUsername, setRobloxUsername] = useState('');
  const [robloxStatus, setRobloxStatus] = useState('');
  const [pluginCode, setPluginCode] = useState('');
  const [pluginStatus, setPluginStatus] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeFile = files.find((f) => f.id === activeFileId);
  const code = activeFile?.content ?? DEFAULT_CODE;

  useEffect(() => {
    fetchCurrentUser(); fetchModels(); fetchWorkspaceList();
    const params = new URLSearchParams(window.location.search);
    const rbx = params.get('roblox');
    if (rbx === 'linked') { setRobloxStatus('✅ Roblox linked!'); fetchCurrentUser(); }
    else if (rbx === 'error') setRobloxStatus('❌ Link failed.');
    else if (rbx === 'token_error') setRobloxStatus('❌ Token exchange failed.');
    else if (rbx === 'userinfo_error') setRobloxStatus('❌ Could not fetch Roblox profile.');
    if (rbx) setTimeout(() => setRobloxStatus(''), 5000);
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);

  async function fetchCurrentUser() {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data?.success && data.user) {
        setUserName(data.user.display_name ?? data.user.email ?? 'Creator');
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

  async function createProject(name: string) {
    if (!name.trim()) return;
    try {
      const res = await fetch('/api/workspace/projects', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_name: workspaceName, name: name.trim(), description: 'Script project' }),
      });
      const payload = await res.json();
      if (payload?.success) {
        const newFile: ScriptFile = { id: payload.data.id, name: name.trim() + '.lua', content: `-- ${name.trim()}\n-- Generated by Coconut AI\n\n`, language: 'lua', projectId: payload.data.id, updatedAt: new Date().toISOString() };
        setFiles((prev) => [...prev, newFile]);
        setActiveFileId(newFile.id); setActiveProjectId(payload.data.id);
        setShowNewFileInput(false); setNewFileName('');
        await fetchProjects(workspaceName);
      }
    } catch { /* ignore */ }
  }

  function handleCodeChange(value: string) {
    setFiles((prev) => prev.map((f) => f.id === activeFileId ? { ...f, content: value, updatedAt: new Date().toISOString() } : f));
  }

  async function handleGenerate() {
    if (!prompt.trim()) { setError('Enter a prompt'); return; }
    setError(''); setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, modelId: selectedModel, workspaceName, projectId: activeProjectId, projectName: projects.find((p) => p.id === activeProjectId)?.name }),
      });
      const data = await res.json();
      if (!data?.success) { setError(data?.error || 'Generation failed'); return; }
      const aiResponse: AIResponse = data.data;
      setChatHistory((prev) => [...prev, { role: 'user', text: prompt }, { role: 'assistant', text: aiResponse.output }]);
      setPrompt(''); setSyncStatus('Saved');
      if (pluginCode.trim()) {
        try {
          const pushRes = await fetch('/api/plugin/push', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: pluginCode.trim().toUpperCase(), script: aiResponse.output }),
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

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col" style={{ background: 'var(--bg-gradient)' }}>
        {/* Navbar */}
        <header className="flex items-center gap-3 px-5 h-12" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)', backdropFilter: 'blur(8px)' }}>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xl drop-shadow-sm">🥥</span>
            <span className="font-bold text-base" style={{ background: 'linear-gradient(135deg, var(--accent), #2dd4bf)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Coconut AI</span>
            <span className="text-xs" style={{ color: 'var(--border-strong)' }}>|</span>
            <select value={workspaceName} onChange={(e) => fetchWorkspaceSession(e.target.value)} className="text-sm rounded-xl px-3 py-1.5 outline-none border max-w-[180px] truncate" style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>
              {workspaces.length ? workspaces.map((w) => <option key={w.id} value={w.workspace_name} className="truncate">{w.workspace_name}</option>) : <option className="truncate">{DEFAULT_WORKSPACE}</option>}
            </select>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            {/* Studio Sync */}
            <div className="flex items-center gap-1.5 rounded-xl px-3 py-1 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
              <span className="text-[10px] font-semibold uppercase tracking-wider">Studio</span>
              <input value={pluginCode} onChange={(e) => setPluginCode(e.target.value)} placeholder="Code" className="w-16 bg-transparent text-xs outline-none uppercase" maxLength={6} style={{ color: 'var(--text-primary)' }} />
              {pluginStatus ? (
                <span className="text-[10px] font-medium whitespace-nowrap" style={{ color: 'var(--accent)' }}>{pluginStatus}</span>
              ) : (
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${pluginCode.trim().length === 6 ? 'bg-ocean-400' : ''}`} style={{ background: pluginCode.trim().length === 6 ? 'var(--accent)' : 'var(--border-strong)' }} />
              )}
            </div>

            {/* Roblox link */}
            <a href="/api/auth/roblox" className="px-2 py-1 rounded-xl font-medium border whitespace-nowrap" style={{ background: robloxLinked ? 'var(--accent-light)' : 'var(--bg-surface)', color: robloxLinked ? 'var(--accent)' : 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>
              {robloxLinked ? `🔗 ${robloxUsername}` : 'Link Roblox'}
            </a>

            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: syncStatus === 'Connected' ? 'var(--accent)' : 'var(--text-muted)' }} />
            <span className="hidden sm:inline">{syncStatus}</span>
            <span className="text-xs hidden sm:inline" style={{ color: 'var(--border-strong)' }}>|</span>

            {/* Role badge */}
            {userRole === 'premium' && <span className="px-2 py-0.5 rounded-lg font-semibold whitespace-nowrap" style={{ background: 'linear-gradient(135deg, #fde68a, #f59e0b)', color: '#92400e' }}>✦ PREMIUM</span>}
            {userRole === 'admin' && <span className="px-2 py-0.5 rounded-lg font-semibold whitespace-nowrap" style={{ background: 'linear-gradient(135deg, #fca5a5, #ef4444)', color: '#7f1d1d' }}>✦ ADMIN</span>}

            {/* Theme picker */}
            <ThemePicker />

            {/* User name */}
            <span className="px-2 py-1 rounded-xl border font-medium truncate max-w-[100px]" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>{userName}</span>
          </div>
        </header>

        {/* IDE Body */}
        <div className="flex flex-1 overflow-hidden gap-2 p-2 min-h-0">
          {/* Explorer */}
          {showExplorer && (
            <aside className="w-56 flex flex-col flex-shrink-0 rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-center justify-between px-4 h-9 border-b text-xs" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                <span className="font-semibold tracking-wide" style={{ color: 'var(--text-secondary)' }}>📁 EXPLORER</span>
                <button onClick={() => setShowNewFileInput(!showNewFileInput)} className="w-5 h-5 rounded-full flex items-center justify-center transition-all hover:shadow-md flex-shrink-0 cursor-pointer border-0" style={{ background: 'var(--bg-elevated)', color: 'var(--accent)' }}>+</button>
              </div>
              {showNewFileInput && (
                <div className="p-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <input value={newFileName} onChange={(e) => setNewFileName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createProject(newFileName)} placeholder="script.lua" className="w-full text-sm rounded-xl px-3 py-1.5 outline-none placeholder-stone-300 border" style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }} autoFocus />
                </div>
              )}
              <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
                {projects.map((project) => (
                  <button key={project.id} onClick={() => {
                    setActiveProjectId(project.id);
                    const existing = files.find((f) => f.projectId === project.id);
                    if (existing) setActiveFileId(existing.id);
                    else {
                      const newFile: ScriptFile = { id: project.id, name: project.name + '.lua', content: `-- ${project.name}\n-- ${project.description || 'Roblox script'}\n\n`, language: 'lua', projectId: project.id, updatedAt: new Date().toISOString() };
                      setFiles((prev) => [...prev, newFile]); setActiveFileId(newFile.id);
                    }
                  }} className={`w-full text-left px-3 py-2 text-sm rounded-xl transition-all truncate border ${activeProjectId === project.id ? 'font-medium' : 'border-transparent hover:shadow-sm'}`} style={activeProjectId === project.id ? { background: 'var(--accent-light)', color: 'var(--accent)', borderColor: 'var(--border-color)' } : { color: 'var(--text-secondary)', background: 'transparent' }}>
                    📄 {project.name}.lua
                  </button>
                ))}
                {projects.length === 0 && <p className="text-xs text-center mt-8 px-2" style={{ color: 'var(--text-muted)' }}>No files<br />Click + to create</p>}
              </div>
            </aside>
          )}

          {/* Editor */}
          <main className="flex-1 flex flex-col overflow-hidden min-w-0 rounded-2xl border" style={{ background: 'var(--bg-editor)', borderColor: 'var(--border-color)' }}>
            <EditorPanel code={code} onChange={handleCodeChange} activeFile={activeFile} />
          </main>

          {/* Chat */}
          {showChat && (
            <aside className="w-80 flex flex-col flex-shrink-0 rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-center justify-between px-4 h-9 border-b text-xs" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                <span className="font-semibold tracking-wide" style={{ color: 'var(--text-secondary)' }}>🤖 AI ASSISTANT</span>
                <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="text-xs rounded-xl px-2 py-1 outline-none border max-w-[130px] truncate" style={{ background: 'var(--bg-surface)', color: 'var(--accent)', borderColor: 'var(--border-color)' }}>
                  {models.map((m) => <option key={m.id} value={m.id}>{m.name} {m.premium ? '✦' : '⊙'}</option>)}
                </select>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatHistory.length === 0 ? (
                  <div className="text-sm text-center mt-12" style={{ color: 'var(--text-muted)' }}>
                    <p className="text-4xl mb-4 drop-shadow-sm">🏝️</p>
                    <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>Ask AI to generate Roblox</p>
                    <p>scripts, UI, or game systems</p>
                  </div>
                ) : chatHistory.map((msg, i) => (
                  <div key={i} className={`text-sm leading-relaxed ${msg.role === 'assistant' ? 'rounded-xl p-3 border' : ''}`} style={msg.role === 'assistant' ? { background: 'var(--bg-elevated)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' } : { color: 'var(--text-secondary)' }}>
                    <div className="font-semibold mb-1 text-xs uppercase tracking-wider">{msg.role === 'assistant' ? '🤖 Coconut AI' : 'You'}</div>
                    <pre className="whitespace-pre-wrap font-sans text-sm">{msg.text}</pre>
                    {msg.role === 'assistant' && (msg.text.includes('function') || msg.text.includes('local ')) && (
                      <button onClick={() => applyCodeFromChat(msg.text)} className="mt-1.5 text-xs text-white px-3 py-1 rounded-lg font-medium shadow-sm hover:shadow-md transition-all border-0 cursor-pointer" style={{ background: 'linear-gradient(135deg, var(--accent), #2dd4bf)' }}>Apply to editor</button>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="p-4 border-t" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-elevated)' }}>
                {error && <p className="text-xs mb-2 font-medium" style={{ color: '#ef4444' }}>{error}</p>}
                <textarea rows={2} value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleGenerate())} placeholder="Describe the script or system you want..." className="w-full resize-none text-sm rounded-xl px-4 py-2.5 outline-none border" style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }} />
                <button onClick={handleGenerate} disabled={isGenerating} className="mt-2 w-full py-2.5 disabled:opacity-50 text-sm font-semibold rounded-xl text-white transition-all shadow-md hover:shadow-lg border-0 cursor-pointer" style={{ background: 'linear-gradient(135deg, var(--accent), #2dd4bf)' }}>
                  {isGenerating ? 'Generating...' : '🌴 Generate'}
                </button>
              </div>
            </aside>
          )}
        </div>

        {/* Status Bar */}
        <footer className="flex items-center justify-between px-5 h-7 border-t text-[10px]" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowExplorer(!showExplorer)} className="px-2 py-0.5 rounded-lg transition-all cursor-pointer border-0" style={{ color: 'var(--text-muted)', background: 'transparent' }}>{showExplorer ? '📁 Hide Explorer' : '📁 Show Explorer'}</button>
            <span>Ln 1</span>
            <span className="hidden sm:inline" style={{ color: 'var(--border-strong)' }}>|</span>
            <span className="hidden sm:inline">Lua</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline">✦ Premium ⊙ Free</span>
            <button onClick={() => setShowChat(!showChat)} className="px-2 py-0.5 rounded-lg transition-all cursor-pointer border-0" style={{ color: 'var(--text-muted)', background: 'transparent' }}>{showChat ? '🤖 Hide Chat' : '🤖 Show Chat'}</button>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
