'use client';

import { useEffect, useState, useRef } from 'react';
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
  const [robloxLinked, setRobloxLinked] = useState(false);
  const [robloxUsername, setRobloxUsername] = useState('');
  const [pluginCode, setPluginCode] = useState('');
  const [pluginConnected, setPluginConnected] = useState(false);
  const [pluginStatus, setPluginStatus] = useState('');
  const pluginCodeRef = useRef(pluginCode);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeFile = files.find((f) => f.id === activeFileId);
  const code = activeFile?.content ?? DEFAULT_CODE;

  useEffect(() => {
    fetchCurrentUser(); fetchModels(); fetchWorkspaceList();
    const saved = localStorage.getItem('coconut-plugin-code');
    if (saved) setPluginCodeAndPersist(saved);
    const params = new URLSearchParams(window.location.search);
    const rbx = params.get('roblox');
    if (rbx === 'linked') fetchCurrentUser();
  }, []);

  // Keep chat scrolled to bottom
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);
  useEffect(() => { pluginCodeRef.current = pluginCode; }, [pluginCode]);

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
            body: JSON.stringify({ code: activeCode, script: aiResponse.output }),
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
        {/* ── Navbar ─────────────────────────────────────── */}
        <header className="flex items-center gap-3 px-5 h-12 flex-shrink-0" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)', backdropFilter: 'blur(8px)' }}>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xl">🥥</span>
            <span className="font-bold text-sm" style={{ background: 'linear-gradient(135deg, var(--accent), #2dd4bf)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Coconut AI</span>
            <span className="text-xs" style={{ color: 'var(--border-strong)' }}>|</span>
            <select value={workspaceName} onChange={(e) => fetchWorkspaceSession(e.target.value)} className="text-xs rounded-lg px-2.5 py-1.5 outline-none max-w-[160px] truncate" style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
              {workspaces.length ? workspaces.map((w) => <option key={w.id} value={w.workspace_name} className="truncate">{w.workspace_name}</option>) : <option className="truncate">{DEFAULT_WORKSPACE}</option>}
            </select>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
            {/* Studio Sync */}
            <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
              <span className="label" style={{ fontSize: 10 }}>Studio</span>
              <input
                value={pluginCode}
                onChange={(e) => setPluginCodeAndPersist(e.target.value)}
                placeholder="XXX XXX"
                className="w-16 bg-transparent text-xs outline-none uppercase tracking-widest font-mono"
                maxLength={6}
                style={{ color: 'var(--text-primary)' }}
              />
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: pluginConnected ? 'var(--accent)' : pluginCode.trim().length === 6 ? 'var(--warning)' : 'var(--border-strong)' }} />
              {pluginConnected && <span className="text-[10px] font-medium" style={{ color: 'var(--accent)' }}>Connected</span>}
              {!pluginConnected && pluginCode.trim().length === 6 && <span className="text-[10px] font-medium" style={{ color: 'var(--warning)' }}>Invalid Code</span>}
              {pluginStatus && (
                <span className="text-[10px] font-medium whitespace-nowrap" style={{ color: pluginStatus.includes('error') || pluginStatus.includes('fail') ? 'var(--danger)' : 'var(--accent)' }}>{pluginStatus}</span>
              )}
            </div>

            {/* Roblox link */}
            <a href="/api/auth/roblox" className="px-2.5 py-1.5 rounded-lg font-medium border no-underline" style={{ background: robloxLinked ? 'var(--accent-soft)' : 'var(--bg-surface)', color: robloxLinked ? 'var(--accent)' : 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>
              {robloxLinked ? `🎮 ${robloxUsername}` : 'Link Roblox'}
            </a>

            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: syncStatus === 'Connected' ? 'var(--accent)' : 'var(--text-muted)' }} />
            <span className="hidden sm:inline">{syncStatus}</span>
            <span className="hidden sm:inline text-[10px]" style={{ color: 'var(--border-strong)' }}>|</span>

            {/* Role badge */}
            {userRole === 'premium' && <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: 'linear-gradient(135deg, #fde68a, #f59e0b)', color: '#92400e' }}>✦ PREMIUM</span>}
            {userRole === 'admin' && <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: 'linear-gradient(135deg, #fca5a5, #ef4444)', color: '#7f1d1d' }}>✦ ADMIN</span>}

            <span className="px-2.5 py-1.5 rounded-lg border font-medium truncate max-w-[100px] text-xs" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>{userName}</span>
          </div>
        </header>

        {/* ── Body ────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar with Activity Bar */}
          <div className="flex-shrink-0" style={{ borderRight: '1px solid var(--border-color)' }}>
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab}>
              {/* Explorer Panel */}
              {activeTab === 'explorer' && (
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between px-4 h-11 flex-shrink-0 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <span className="label" style={{ fontSize: 10 }}>Explorer</span>
                    <button onClick={() => setShowNewFileInput(!showNewFileInput)} className="w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer border-0 text-xs font-bold" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>+</button>
                  </div>
                  {showNewFileInput && (
                    <div className="px-3 py-2.5 border-b" style={{ borderColor: 'var(--border-color)' }}>
                      <input value={newFileName} onChange={(e) => setNewFileName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createProject(newFileName)} placeholder="script.lua" className="w-full text-xs outline-none" style={{ background: 'var(--bg-code)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px' }} autoFocus />
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
                      }} className="w-full text-left px-3 py-2 text-xs rounded-lg transition-all truncate border cursor-pointer" style={activeProjectId === project.id ? { background: 'var(--accent-soft)', color: 'var(--accent)', borderColor: 'var(--border-color)', fontWeight: 500 } : { background: 'transparent', color: 'var(--text-secondary)', borderColor: 'transparent' }}>
                        📄 {project.name}.lua
                      </button>
                    ))}
                    {projects.length === 0 && <p className="text-xs text-center mt-8 px-2" style={{ color: 'var(--text-muted)' }}>No files<br />Click + to create</p>}
                  </div>
                </div>
              )}

              {/* Chat Panel */}
              {activeTab === 'chat' && (
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between px-4 h-11 flex-shrink-0 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <span className="label" style={{ fontSize: 10 }}>AI Assistant</span>
                    <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="text-[11px] rounded-lg px-2 py-1 outline-none max-w-[130px] truncate font-medium" style={{ background: 'var(--bg-surface)', color: 'var(--accent)', border: '1px solid var(--border-color)' }}>
                      {models.map((m) => <option key={m.id} value={m.id}>{m.name} {m.premium ? '✦' : '⊙'}</option>)}
                    </select>
                  </div>

                  <div className="flex-1 overflow-y-auto" style={{ padding: '12px 14px' }}>
                    {chatHistory.length === 0 ? (
                      <div className="flex flex-col items-center justify-center" style={{ height: '100%', minHeight: '300px' }}>
                        <p className="text-3xl mb-4">🏝️</p>
                        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Ask AI to generate Roblox code</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Combat, UI, movement, economy, or anything</p>
                      </div>
                    ) : chatHistory.map((msg, i) => (
                      <div key={i}>
                        {msg.role === 'user' && (
                          <div className="flex items-start gap-2" style={{ marginBottom: '14px' }}>
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>U</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>You</p>
                              <div className="rounded-xl px-3.5 py-2.5 inline-block" style={{ background: 'var(--accent-soft)', color: 'var(--text-primary)', maxWidth: '90%' }}>
                                <p className="text-sm" style={{ lineHeight: 1.5 }}>{msg.text}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {msg.role === 'assistant' && (
                          <div className="flex items-start gap-2" style={{ marginBottom: '14px' }}>
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm" style={{ background: 'var(--bg-surface-solid)', border: '1px solid var(--border-color)' }}>🤖</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Coconut AI</p>
                              <div className="rounded-xl px-3.5 py-2.5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>
                                <pre className="whitespace-pre-wrap font-sans text-sm" style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}>{msg.text}</pre>
                                {(msg.text.includes('function') || msg.text.includes('local ')) && (
                                  <button onClick={() => applyCodeFromChat(msg.text)} className="mt-2.5 text-xs text-white font-medium px-3.5 py-1.5 rounded-lg border-0 cursor-pointer transition-all" style={{ background: 'linear-gradient(135deg, var(--accent), #2dd4bf)' }}>
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
                      className="w-full resize-none text-sm rounded-xl px-3.5 py-2.5"
                      style={{ background: 'var(--bg-code)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontSize: 13, lineHeight: 1.5, outline: 'none' }}
                    />
                    <button onClick={handleGenerate} disabled={isGenerating} className="w-full text-xs font-semibold text-white mt-2 rounded-lg px-4 py-2.5 border-0 cursor-pointer transition-all" style={{ background: 'linear-gradient(135deg, var(--accent), #2dd4bf)', opacity: isGenerating ? 0.6 : 1 }}>
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
          <main className="flex-1 flex flex-col overflow-hidden" style={{ padding: '12px 16px' }}>
            <div className="flex-1 flex flex-col overflow-hidden rounded-xl border" style={{ background: 'var(--bg-editor)', borderColor: 'var(--border-color)' }}>
              <EditorPanel code={code} onChange={handleCodeChange} activeFile={activeFile} />
            </div>
          </main>
        </div>

        {/* ── Status Bar ─────────────────────────────────── */}
        <footer className="flex items-center justify-between px-5 h-7 border-t text-[10px] flex-shrink-0" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-4">
            <span className="cursor-pointer font-medium" style={{ color: activeTab === 'explorer' ? 'var(--accent)' : 'inherit' }} onClick={() => setActiveTab('explorer')}>📁 Explorer</span>
            <span className="cursor-pointer font-medium" style={{ color: activeTab === 'chat' ? 'var(--accent)' : 'inherit' }} onClick={() => setActiveTab('chat')}>🤖 AI Chat</span>
            <span className="cursor-pointer font-medium" style={{ color: activeTab === 'settings' ? 'var(--accent)' : 'inherit' }} onClick={() => setActiveTab('settings')}>⚙️ Settings</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Ln 1</span>
            <span style={{ color: 'var(--border-strong)' }}>|</span>
            <span>Luau</span>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}


