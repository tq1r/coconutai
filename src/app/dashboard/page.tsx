'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import EditorPanel from '@/components/EditorPanel';
import type { AIModel, AIResponse, WorkspaceProject, WorkspaceSession, ScriptFile } from '@/types';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

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
    fetchCurrentUser();
    fetchModels();
    fetchWorkspaceList();

    const params = new URLSearchParams(window.location.search);
    const rbx = params.get('roblox');
    if (rbx === 'linked') { setRobloxStatus('✅ Roblox account linked!'); fetchCurrentUser(); }
    else if (rbx === 'error') setRobloxStatus('❌ Failed to link Roblox.');
    else if (rbx === 'token_error') setRobloxStatus('❌ Roblox token exchange failed.');
    else if (rbx === 'userinfo_error') setRobloxStatus('❌ Could not fetch Roblox profile.');
    if (rbx) setTimeout(() => setRobloxStatus(''), 5000);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  async function fetchCurrentUser() {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data?.success && data.user) {
        setUserName(data.user.display_name ?? data.user.email ?? 'Creator');
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
        if (!data.models.find((m: AIModel) => m.id === selectedModel)) {
          setSelectedModel(data.models[0]?.id ?? 'gpt-4o');
        }
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
        setSession(payload.data);
        await fetchProjects(name, payload.data?.metadata?.active_project_id);
        setSyncStatus('Connected');
        return;
      }
      const createRes = await fetch('/api/workspace/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_name: name, metadata: { initialized: true } }),
      });
      const createPayload = await createRes.json();
      if (createPayload?.success) {
        setWorkspaceName(name);
        setSession(createPayload.data);
        await fetchProjects(name);
        setSyncStatus('Connected');
      }
    } catch {
      setSyncStatus('Disconnected');
    }
  }

  async function fetchProjects(name: string, preferredProjectId?: string | null) {
    try {
      const res = await fetch(`/api/workspace/projects?workspace_name=${encodeURIComponent(name)}`);
      const payload = await res.json();
      if (!payload?.success) return;
      setProjects(payload.data || []);
      const prefs = preferredProjectId ?? session?.metadata?.active_project_id;
      if (prefs && payload.data.some((p: WorkspaceProject) => p.id === prefs)) {
        setActiveProjectId(prefs);
      } else if (payload.data?.length) {
        setActiveProjectId(payload.data[0].id);
        setActiveFileId(payload.data[0].id);
      }
    } catch { /* ignore */ }
  }

  async function createProject(name: string) {
    if (!name.trim()) return;
    try {
      const res = await fetch('/api/workspace/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_name: workspaceName, name: name.trim(), description: 'Script project' }),
      });
      const payload = await res.json();
      if (payload?.success) {
        const newFile: ScriptFile = {
          id: payload.data.id,
          name: name.trim() + '.lua',
          content: `-- ${name.trim()}\n-- Generated by Coconut AI\n\n`,
          language: 'lua',
          projectId: payload.data.id,
          updatedAt: new Date().toISOString(),
        };
        setFiles((prev) => [...prev, newFile]);
        setActiveFileId(newFile.id);
        setActiveProjectId(payload.data.id);
        setShowNewFileInput(false);
        setNewFileName('');
        await fetchProjects(workspaceName);
      }
    } catch { /* ignore */ }
  }

  function handleCodeChange(value: string) {
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFileId ? { ...f, content: value, updatedAt: new Date().toISOString() } : f))
    );
  }

  async function handleGenerate() {
    if (!prompt.trim()) { setError('Enter a prompt'); return; }
    setError('');
    setIsGenerating(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          modelId: selectedModel,
          workspaceName,
          projectId: activeProjectId,
          projectName: projects.find((p) => p.id === activeProjectId)?.name,
        }),
      });
      const data = await res.json();
      if (!data?.success) { setError(data?.error || 'Generation failed'); return; }

      const aiResponse: AIResponse = data.data;
      setChatHistory((prev) => [
        ...prev,
        { role: 'user', text: prompt },
        { role: 'assistant', text: aiResponse.output },
      ]);
      setPrompt('');
      setSyncStatus('Saved');
    } catch {
      setError('Unable to reach AI service.');
    } finally {
      setIsGenerating(false);
    }
  }

  function applyCodeFromChat(codeSnippet: string) {
    if (activeFileId) {
      setFiles((prev) =>
        prev.map((f) => (f.id === activeFileId ? { ...f, content: codeSnippet, updatedAt: new Date().toISOString() } : f))
      );
    }
  }

  return (
    <ErrorBoundary>
      {/* Top Navbar */}
      <header className="flex items-center justify-between px-4 h-11 bg-[#0d0b0a] border-b border-[#2a2620] flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-lg">🥥</span>
          <span className="font-semibold text-sm text-cyan-400">Coconut AI</span>
          <span className="text-[#3a3428]">|</span>
          <select
            value={workspaceName}
            onChange={(e) => fetchWorkspaceSession(e.target.value)}
            className="bg-transparent text-xs text-sand-400 border border-[#2a2620] rounded px-2 py-1 outline-none"
          >
            {workspaces.length ? workspaces.map((w) => (
              <option key={w.id} value={w.workspace_name}>{w.workspace_name}</option>
            )) : <option value={DEFAULT_WORKSPACE}>{DEFAULT_WORKSPACE}</option>}
          </select>
        </div>
        <div className="flex items-center gap-3 text-xs text-sand-500">
          {robloxStatus && <span className="text-emerald-400">{robloxStatus}</span>}
          <a
            href="/api/auth/roblox"
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
              robloxLinked ? 'bg-emerald-600/20 text-emerald-400' : 'bg-orange-600/20 text-orange-400 hover:bg-orange-600/30'
            }`}
          >
            {robloxLinked ? `Roblox: ${robloxUsername}` : 'Link Roblox'}
          </a>
          <span className={`w-2 h-2 rounded-full ${syncStatus === 'Connected' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
          <span>{syncStatus}</span>
          <span className="text-[#3a3428]">|</span>
          <span className="text-sand-300">{userName}</span>
        </div>
      </header>

      {/* Main IDE Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* File Explorer Sidebar */}
        {showExplorer && (
          <aside className="w-56 bg-[#0d0b0a] border-r border-[#2a2620] flex flex-col flex-shrink-0">
            <div className="flex items-center justify-between px-3 h-9 text-xs text-sand-500 border-b border-[#2a2620]">
              <span>EXPLORER</span>
              <button onClick={() => setShowNewFileInput(!showNewFileInput)} className="text-cyan-400 hover:text-cyan-300">+</button>
            </div>
            {showNewFileInput && (
              <div className="p-2 border-b border-[#2a2620]">
                <input
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createProject(newFileName)}
                  placeholder="script.lua"
                  className="w-full bg-[#1a1815] text-xs text-white border border-[#2a2620] rounded px-2 py-1 outline-none"
                  autoFocus
                />
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => {
                    setActiveProjectId(project.id);
                    const existing = files.find((f) => f.projectId === project.id);
                    if (existing) { setActiveFileId(existing.id); }
                    else {
                      const newFile: ScriptFile = {
                        id: project.id,
                        name: project.name + '.lua',
                        content: `-- ${project.name}\n-- ${project.description || 'Roblox script'}\n\n`,
                        language: 'lua',
                        projectId: project.id,
                        updatedAt: new Date().toISOString(),
                      };
                      setFiles((prev) => [...prev, newFile]);
                      setActiveFileId(newFile.id);
                    }
                  }}
                  className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                    activeProjectId === project.id ? 'bg-cyan-900/30 text-cyan-300' : 'text-sand-400 hover:bg-[#1a1815]'
                  }`}
                >
                  <span className="mr-2">{project.name.endsWith('.lua') ? '📄' : '📁'}</span>
                  {project.name.endsWith('.lua') ? project.name : project.name + '.lua'}
                </button>
              ))}
              {projects.length === 0 && (
                <p className="text-xs text-sand-500 text-center mt-4">No files yet</p>
              )}
            </div>
          </aside>
        )}

        {/* Code Editor */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <EditorPanel
            code={code}
            onChange={handleCodeChange}
            activeFile={activeFile}
          />
        </main>

        {/* AI Chat Panel */}
        {showChat && (
          <aside className="w-80 bg-[#0d0b0a] border-l border-[#2a2620] flex flex-col flex-shrink-0">
            <div className="flex items-center justify-between px-3 h-9 text-xs text-sand-500 border-b border-[#2a2620]">
              <span>AI ASSISTANT</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-transparent text-cyan-400 border border-[#2a2620] rounded px-1.5 py-0.5 text-[10px] outline-none"
              >
                {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {chatHistory.length === 0 && (
                <div className="text-xs text-sand-500 text-center mt-8">
                  <p className="text-cyan-400 text-base mb-2">🏝️</p>
                  <p>Ask AI to generate Roblox scripts, UI, or game systems.</p>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`text-xs leading-relaxed ${msg.role === 'assistant' ? 'text-sand-200' : 'text-sand-400'}`}>
                  <div className="font-semibold mb-1 text-[10px] uppercase tracking-wider">
                    {msg.role === 'assistant' ? 'Coconut AI' : 'You'}
                  </div>
                  <pre className="whitespace-pre-wrap font-sans">{msg.text}</pre>
                  {msg.role === 'assistant' && msg.text.includes('function') && (
                    <button
                      onClick={() => applyCodeFromChat(msg.text)}
                      className="mt-1 text-[10px] text-cyan-400 hover:text-cyan-300"
                    >
                      Apply to editor
                    </button>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t border-[#2a2620]">
              {error && <p className="text-[10px] text-rose-400 mb-2">{error}</p>}
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleGenerate())}
                placeholder="Describe the script or system you want..."
                className="w-full resize-none bg-[#1a1815] text-xs text-white border border-[#2a2620] rounded-lg px-3 py-2 outline-none placeholder-sand-500"
              />
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="mt-2 w-full py-1.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 disabled:opacity-50 text-xs font-medium rounded-lg transition-all"
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* Status Bar */}
      <footer className="flex items-center justify-between px-4 h-6 bg-[#0d0b0a] border-t border-[#2a2620] flex-shrink-0">
        <div className="flex items-center gap-4 text-[10px] text-sand-500">
          <button onClick={() => setShowExplorer(!showExplorer)} className="hover:text-sand-200 transition-colors">
            {showExplorer ? 'Hide Explorer' : 'Show Explorer'}
          </button>
          <span>Ln 1, Col 1</span>
          <span>Lua</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-sand-500">
          <span>Model: {models.find((m) => m.id === selectedModel)?.name || 'GPT-4o'}</span>
          <button onClick={() => setShowChat(!showChat)} className="hover:text-sand-200 transition-colors">
            {showChat ? 'Hide Chat' : 'Show Chat'}
          </button>
        </div>
      </footer>
    </ErrorBoundary>
  );
}
