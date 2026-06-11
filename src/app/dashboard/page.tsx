'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import EditorPanel from '@/components/EditorPanel';
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
  const [session, setSession] = useState<WorkspaceSession | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceSession[]>([]);
  const [projects, setProjects] = useState<WorkspaceProject[]>([]);
  const [workspaceName, setWorkspaceName] = useState(DEFAULT_WORKSPACE);
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
        setWorkspaceName(name); setSession(payload.data);
        await fetchProjects(name, payload.data?.metadata?.active_project_id);
        setSyncStatus('Connected'); return;
      }
      const createRes = await fetch('/api/workspace/session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_name: name, metadata: { initialized: true } }),
      });
      const createPayload = await createRes.json();
      if (createPayload?.success) {
        setWorkspaceName(name); setSession(createPayload.data);
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
      const prefs = preferredProjectId ?? session?.metadata?.active_project_id;
      if (prefs && payload.data.some((p: WorkspaceProject) => p.id === prefs))
        setActiveProjectId(prefs);
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
        const newFile: ScriptFile = {
          id: payload.data.id, name: name.trim() + '.lua',
          content: `-- ${name.trim()}\n-- Generated by Coconut AI\n\n`,
          language: 'lua', projectId: payload.data.id,
          updatedAt: new Date().toISOString(),
        };
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
          setPluginStatus(pushData.success ? '✨ Pushed to Studio' : '⚠️ Push failed');
        } catch { setPluginStatus('⚠️ Push error'); }
        setTimeout(() => setPluginStatus(''), 4000);
      }
    } catch { setError('Unable to reach AI service.'); } finally { setIsGenerating(false); }
  }

  function applyCodeFromChat(codeSnippet: string) {
    if (activeFileId) setFiles((prev) => prev.map((f) => f.id === activeFileId ? { ...f, content: codeSnippet, updatedAt: new Date().toISOString() } : f));
  }

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col bg-gradient-to-br from-sky-50 via-white to-sand-50">
        {/* Navbar */}
        <header className="flex items-center justify-between px-5 h-12 bg-white/70 backdrop-blur-md border-b border-sand-100/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xl drop-shadow-sm">🥥</span>
            <span className="font-bold text-base bg-gradient-to-r from-ocean-500 to-teal-400 bg-clip-text text-transparent">Coconut AI</span>
            <span className="text-sand-200/50 text-sm">|</span>
            <select value={workspaceName} onChange={(e) => fetchWorkspaceSession(e.target.value)} className="bg-white/60 text-sm text-stone-500 border border-sand-100 rounded-xl px-3 py-1.5 outline-none shadow-sm backdrop-blur-sm">
              {workspaces.length ? workspaces.map((w) => <option key={w.id} value={w.workspace_name}>{w.workspace_name}</option>) : <option>{DEFAULT_WORKSPACE}</option>}
            </select>
          </div>
          <div className="flex items-center gap-3 text-xs text-stone-400">
            {robloxStatus && <span className="text-ocean-500 bg-ocean-50 px-2 py-0.5 rounded-lg">{robloxStatus}</span>}
            <a href="/api/auth/roblox" className={`px-3 py-1 rounded-xl text-xs font-medium transition-all shadow-sm ${robloxLinked ? 'bg-ocean-50 text-ocean-600 border border-ocean-100' : 'bg-white/60 text-sand-500 border border-sand-200 hover:bg-sand-50'}`}>
              {robloxLinked ? `🔗 ${robloxUsername}` : 'Link Roblox'}
            </a>
            <span className={`w-2 h-2 rounded-full shadow-sm ${syncStatus === 'Connected' ? 'bg-ocean-400' : 'bg-coral-400'}`} />
            <span>{syncStatus}</span>
            <span className="text-sand-200/50 text-sm">|</span>
            {userRole === 'premium' && <span className="text-xs bg-gradient-to-r from-amber-200 to-amber-400 text-amber-800 px-2 py-0.5 rounded-lg font-semibold shadow-sm">✦ PREMIUM</span>}
            {userRole === 'admin' && <span className="text-xs bg-gradient-to-r from-coral-200 to-coral-400 text-coral-800 px-2 py-0.5 rounded-lg font-semibold shadow-sm">✦ ADMIN</span>}
            <span className="text-stone-600 font-medium bg-white/40 px-3 py-1 rounded-xl border border-sand-100 shadow-sm">{userName}</span>
          </div>
        </header>

        {/* IDE Body */}
        <div className="flex flex-1 overflow-hidden gap-0.5 p-0.5">
          {/* Explorer */}
          {showExplorer && (
            <aside className="w-52 bg-white/60 backdrop-blur-sm border border-sand-100/80 rounded-2xl m-1 flex flex-col flex-shrink-0 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 h-9 text-xs text-stone-400 border-b border-sand-100/50 bg-white/40">
                <span className="font-semibold text-stone-500 tracking-wide">📁 EXPLORER</span>
                <button onClick={() => setShowNewFileInput(!showNewFileInput)} className="text-ocean-400 hover:text-ocean-500 text-sm bg-white/60 w-5 h-5 rounded-full flex items-center justify-center shadow-sm transition-all hover:shadow-md">+</button>
              </div>
              {showNewFileInput && (
                <div className="p-2 border-b border-sand-100/50">
                  <input value={newFileName} onChange={(e) => setNewFileName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createProject(newFileName)} placeholder="script.lua" className="w-full bg-white/80 text-sm text-stone-700 border border-sand-200 rounded-xl px-3 py-1.5 outline-none placeholder-stone-300 shadow-sm" autoFocus />
                </div>
              )}
              <div className="flex-1 overflow-y-auto py-1.5 px-1.5 space-y-0.5">
                {projects.map((project) => (
                  <button key={project.id} onClick={() => {
                    setActiveProjectId(project.id);
                    const existing = files.find((f) => f.projectId === project.id);
                    if (existing) setActiveFileId(existing.id);
                    else {
                      const newFile: ScriptFile = { id: project.id, name: project.name + '.lua', content: `-- ${project.name}\n-- ${project.description || 'Roblox script'}\n\n`, language: 'lua', projectId: project.id, updatedAt: new Date().toISOString() };
                      setFiles((prev) => [...prev, newFile]); setActiveFileId(newFile.id);
                    }
                  }} className={`w-full text-left px-3 py-2 text-sm rounded-xl transition-all ${activeProjectId === project.id ? 'bg-gradient-to-r from-ocean-50 to-teal-50 text-ocean-600 font-medium shadow-sm border border-ocean-100' : 'text-stone-500 hover:bg-white/60 hover:shadow-sm border border-transparent'}`}>
                    <span className="mr-1.5">📄</span> {project.name}.lua
                  </button>
                ))}
                {projects.length === 0 && <p className="text-xs text-stone-300 text-center mt-8">No files yet<br /><span className="text-stone-200">Click + to create one</span></p>}
              </div>
            </aside>
          )}

          {/* Editor */}
          <main className="flex-1 flex flex-col overflow-hidden m-1">
            <div className="flex-1 bg-white/80 backdrop-blur-sm border border-sand-100/80 rounded-2xl overflow-hidden shadow-sm">
              <EditorPanel code={code} onChange={handleCodeChange} activeFile={activeFile} />
            </div>
          </main>

          {/* Chat */}
          {showChat && (
            <aside className="w-80 bg-white/60 backdrop-blur-sm border border-sand-100/80 rounded-2xl m-1 flex flex-col flex-shrink-0 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 h-9 text-xs text-stone-400 border-b border-sand-100/50 bg-white/40">
                <span className="font-semibold text-stone-500 tracking-wide">🤖 AI ASSISTANT</span>
                <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="bg-white/80 text-ocean-500 border border-sand-100 rounded-xl px-2 py-1 text-xs outline-none shadow-sm">
                  {models.map((m) => <option key={m.id} value={m.id}>{m.name} {m.premium ? '✦' : '⊙'}</option>)}
                </select>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatHistory.length === 0 ? (
                  <div className="text-sm text-stone-400 text-center mt-10">
                    <p className="text-4xl mb-3 drop-shadow-sm">🏝️</p>
                    <p className="text-stone-400 font-medium">Ask AI to generate Roblox</p>
                    <p className="text-stone-300">scripts, UI, or game systems</p>
                  </div>
                ) : chatHistory.map((msg, i) => (
                  <div key={i} className={`text-sm leading-relaxed ${msg.role === 'assistant' ? 'text-stone-700 bg-white/60 rounded-xl p-3 border border-sand-100/50 shadow-sm' : 'text-stone-400'}`}>
                    <div className="font-semibold mb-1 text-xs uppercase tracking-wider">{msg.role === 'assistant' ? '🤖 Coconut AI' : 'You'}</div>
                    <pre className="whitespace-pre-wrap font-sans text-sm">{msg.text}</pre>
                    {msg.role === 'assistant' && msg.text.includes('function') && (
                      <button onClick={() => applyCodeFromChat(msg.text)} className="mt-1.5 text-xs bg-gradient-to-r from-ocean-400 to-teal-400 text-white px-3 py-1 rounded-lg font-medium shadow-sm hover:shadow-md transition-all">Apply to editor</button>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="p-4 border-t border-sand-100/50 bg-white/40">
                {error && <p className="text-xs text-coral-500 mb-2 font-medium">{error}</p>}
                <textarea rows={2} value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleGenerate())} placeholder="Describe the script or system you want..." className="w-full resize-none bg-white/90 text-sm text-stone-700 border border-sand-200 rounded-xl px-4 py-2.5 outline-none placeholder-stone-300 shadow-sm" />
                <button onClick={handleGenerate} disabled={isGenerating} className="mt-2 w-full py-2.5 bg-gradient-to-r from-ocean-400 to-teal-400 hover:from-ocean-500 hover:to-teal-500 disabled:opacity-50 text-sm font-semibold rounded-xl text-white transition-all shadow-md hover:shadow-lg">
                  {isGenerating ? '🌊 Generating...' : '🌴 Generate'}
                </button>
                <div className="mt-3 pt-3 border-t border-sand-100/50">
                  <label className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">🔗 Studio Sync</label>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <input value={pluginCode} onChange={(e) => setPluginCode(e.target.value)} placeholder="Session code" className="flex-1 bg-white/90 text-xs text-stone-700 border border-sand-200 rounded-xl px-3 py-1.5 outline-none placeholder-stone-300 uppercase shadow-sm" maxLength={6} />
                    {pluginStatus && <span className="text-[10px] text-ocean-500 whitespace-nowrap bg-ocean-50 px-2 py-0.5 rounded-lg font-medium">{pluginStatus}</span>}
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>

        {/* Status Bar */}
        <footer className="flex items-center justify-between px-5 h-7 bg-white/40 backdrop-blur-sm border-t border-sand-100/50 flex-shrink-0">
          <div className="flex items-center gap-4 text-[10px] text-stone-400">
            <button onClick={() => setShowExplorer(!showExplorer)} className="hover:text-ocean-500 transition-colors px-2 py-0.5 rounded-lg hover:bg-white/40">{showExplorer ? '📁 Hide' : '📁 Show'}</button>
            <span>Ln 1</span>
            <span className="text-sand-200">|</span>
            <span>Lua</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-stone-400">
            <span className="text-stone-300">✦ Premium &nbsp;⊙ Free</span>
            <button onClick={() => setShowChat(!showChat)} className="hover:text-ocean-500 transition-colors px-2 py-0.5 rounded-lg hover:bg-white/40">{showChat ? '🤖 Hide' : '🤖 Show'}</button>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
