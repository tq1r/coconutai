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
    } catch { setError('Unable to reach AI service.'); } finally { setIsGenerating(false); }
  }

  function applyCodeFromChat(codeSnippet: string) {
    if (activeFileId) setFiles((prev) => prev.map((f) => f.id === activeFileId ? { ...f, content: codeSnippet, updatedAt: new Date().toISOString() } : f));
  }

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col bg-white">
        {/* Navbar */}
        <header className="flex items-center justify-between px-4 h-11 bg-white border-b border-sand-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-lg">🥥</span>
            <span className="font-semibold text-sm text-ocean-500">Coconut AI</span>
            <span className="text-sand-200 text-xs">|</span>
            <select value={workspaceName} onChange={(e) => fetchWorkspaceSession(e.target.value)} className="bg-stone-50 text-sm text-stone-500 border border-sand-100 rounded-lg px-2 py-1 outline-none">
              {workspaces.length ? workspaces.map((w) => <option key={w.id} value={w.workspace_name}>{w.workspace_name}</option>) : <option>{DEFAULT_WORKSPACE}</option>}
            </select>
          </div>
          <div className="flex items-center gap-3 text-xs text-stone-400">
            {robloxStatus && <span className="text-ocean-500">{robloxStatus}</span>}
            <a href="/api/auth/roblox" className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${robloxLinked ? 'bg-ocean-50 text-ocean-600' : 'bg-sand-50 text-sand-500 hover:bg-sand-100'}`}>
              {robloxLinked ? `Roblox: ${robloxUsername}` : 'Link Roblox'}
            </a>
            <span className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'Connected' ? 'bg-ocean-400' : 'bg-coral-400'}`} />
            <span>{syncStatus}</span>
            <span className="text-sand-200">|</span>
            {userRole === 'premium' && <span className="text-xs text-amber-500 font-semibold">✦ PREMIUM</span>}
            {userRole === 'admin' && <span className="text-xs text-coral-500 font-semibold">✦ ADMIN</span>}
            <span className="text-stone-600 font-medium">{userName}</span>
          </div>
        </header>

        {/* IDE Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Explorer */}
          {showExplorer && (
            <aside className="w-48 bg-white border-r border-sand-100 flex flex-col flex-shrink-0">
              <div className="flex items-center justify-between px-3 h-8 text-xs text-stone-400 border-b border-sand-100">
                <span className="font-medium text-stone-500">EXPLORER</span>
                <button onClick={() => setShowNewFileInput(!showNewFileInput)} className="text-ocean-400 hover:text-ocean-500 text-sm">+</button>
              </div>
              {showNewFileInput && (
                <div className="p-2 border-b border-sand-100">
                  <input value={newFileName} onChange={(e) => setNewFileName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createProject(newFileName)} placeholder="script.lua" className="w-full bg-stone-50 text-sm text-stone-700 border border-sand-200 rounded-lg px-2 py-1.5 outline-none" autoFocus />
                </div>
              )}
              <div className="flex-1 overflow-y-auto py-1">
                {projects.map((project) => (
                  <button key={project.id} onClick={() => {
                    setActiveProjectId(project.id);
                    const existing = files.find((f) => f.projectId === project.id);
                    if (existing) setActiveFileId(existing.id);
                    else {
                      const newFile: ScriptFile = { id: project.id, name: project.name + '.lua', content: `-- ${project.name}\n-- ${project.description || 'Roblox script'}\n\n`, language: 'lua', projectId: project.id, updatedAt: new Date().toISOString() };
                      setFiles((prev) => [...prev, newFile]); setActiveFileId(newFile.id);
                    }
                  }} className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${activeProjectId === project.id ? 'bg-ocean-50 text-ocean-600 border-l-2 border-ocean-400 font-medium' : 'text-stone-500 hover:bg-stone-50 border-l-2 border-transparent'}`}>
                    📄 {project.name}.lua
                  </button>
                ))}
                {projects.length === 0 && <p className="text-xs text-stone-300 text-center mt-6">No files</p>}
              </div>
            </aside>
          )}

          {/* Editor */}
          <main className="flex-1 flex flex-col overflow-hidden bg-stone-50">
            <EditorPanel code={code} onChange={handleCodeChange} activeFile={activeFile} />
          </main>

          {/* Chat */}
          {showChat && (
            <aside className="w-72 bg-white border-l border-sand-100 flex flex-col flex-shrink-0">
              <div className="flex items-center justify-between px-3 h-8 text-xs text-stone-400 border-b border-sand-100">
                <span className="font-medium text-stone-500">AI ASSISTANT</span>
                <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="bg-stone-50 text-ocean-500 border border-sand-100 rounded-lg px-1.5 py-1 text-xs outline-none">
                  {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {chatHistory.length === 0 ? (
                  <div className="text-sm text-stone-400 text-center mt-8">
                    <p className="text-3xl mb-2">🏝️</p>
                    <p>Ask AI to generate Roblox scripts, UI, or game systems.</p>
                  </div>
                ) : chatHistory.map((msg, i) => (
                  <div key={i} className={`text-sm leading-relaxed ${msg.role === 'assistant' ? 'text-stone-700' : 'text-stone-400'}`}>
                    <div className="font-semibold mb-1 text-xs uppercase tracking-wider">{msg.role === 'assistant' ? 'Coconut AI' : 'You'}</div>
                    <pre className="whitespace-pre-wrap font-sans">{msg.text}</pre>
                    {msg.role === 'assistant' && msg.text.includes('function') && (
                      <button onClick={() => applyCodeFromChat(msg.text)} className="mt-1 text-xs text-ocean-500 hover:text-ocean-600 font-medium">Apply to editor</button>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="p-3 border-t border-sand-100">
                {error && <p className="text-xs text-coral-500 mb-2">{error}</p>}
                <textarea rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleGenerate())} placeholder="Describe the script or system you want..." className="w-full resize-none bg-stone-50 text-sm text-stone-700 border border-sand-200 rounded-lg px-3 py-2 outline-none placeholder-stone-300" />
                <button onClick={handleGenerate} disabled={isGenerating} className="mt-2 w-full py-2 bg-ocean-500 hover:bg-ocean-600 disabled:opacity-50 text-sm font-medium rounded-lg text-white transition-colors shadow-sm">
                  {isGenerating ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </aside>
          )}
        </div>

        {/* Status Bar */}
        <footer className="flex items-center justify-between px-4 h-6 bg-white border-t border-sand-100 flex-shrink-0">
          <div className="flex items-center gap-4 text-xs text-stone-400">
            <button onClick={() => setShowExplorer(!showExplorer)} className="hover:text-ocean-500 transition-colors">{showExplorer ? 'Hide Explorer' : 'Show Explorer'}</button>
            <span>Ln 1, Col 1</span>
            <span>Lua</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-stone-400">
            <span>Model: {models.find((m) => m.id === selectedModel)?.name || 'GPT-4o'}</span>
            <button onClick={() => setShowChat(!showChat)} className="hover:text-ocean-500 transition-colors">{showChat ? 'Hide Chat' : 'Show Chat'}</button>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
