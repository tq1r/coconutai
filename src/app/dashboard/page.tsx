'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ErrorBoundary from '@/components/ErrorBoundary';
import EditorPanel from '@/components/EditorPanel';
import Sidebar from '@/components/Sidebar';
import WaveBackground from '@/components/WaveBackground';
import SettingsPanel from '@/components/SettingsPanel';
import type { AIModel, AIResponse, WorkspaceSession, ScriptFile } from '@/types';

interface ChatMessage { role: 'user' | 'assistant'; text: string }

const DEFAULT_WORKSPACE = 'Coconut AI Workspace';
const DEFAULT_CODE = `-- Coconut AI - Roblox Studio IDE

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
            <div className="flex items-center gap-1 py-0.5 cursor-pointer hover:opacity-80" style={{ paddingLeft: `${depth * 12 + 4}px` }} onClick={() => hasChildren && toggle(i)}>
              <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)', width: 10, textAlign: 'center' }}>
                {hasChildren ? (isExpanded ? '--' : '+') : ' '}
              </span>
              <span className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
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

function Toast({ message, type, onClose }: { message: string; type: 'error' | 'success'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 text-sm font-medium shadow-xl animate-float-up" style={{ background: type === 'error' ? '#ef4444' : '#d97706', color: '#fff', borderRadius: '4px' }}>
      {message}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('Creator');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [prompt, setPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceSession[]>([]);
  const [workspaceName, setWorkspaceName] = useState(DEFAULT_WORKSPACE);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [files, setFiles] = useState<ScriptFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('explorer');
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'error' | 'success'>('error');
  const [explorerTree, setExplorerTree] = useState<any[] | null>(null);
  const [explorerLoading, setExplorerLoading] = useState(false);
  const [pluginCode, setPluginCode] = useState('');
  const [pluginConnected, setPluginConnected] = useState(false);
  const [pluginStatus, setPluginStatus] = useState('');
  const pluginCodeRef = useRef(pluginCode);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeFile = files.find((f) => f.id === activeFileId);
  const code = activeFile?.content ?? DEFAULT_CODE;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get('projectId');
    if (!pid) { router.replace('/projects'); return; }
    setActiveProjectId(pid);
    setActiveFileId(pid);
    fetchCurrentUser(); fetchModels(); fetchWorkspaceList(pid);
    const saved = localStorage.getItem('coconut-plugin-code');
    if (saved) setPluginCodeAndPersist(saved);
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
      }
    } catch {}
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
    } catch {}
  }

  async function fetchWorkspaceList(projectId: string) {
    try {
      const res = await fetch('/api/workspace/list');
      const payload = await res.json();
      if (!payload?.success) return;
      setWorkspaces(payload.data || []);
      const first = payload.data?.[0]?.workspace_name ?? DEFAULT_WORKSPACE;
      setWorkspaceName(first);
      await fetchWorkspaceSession(first, projectId);
    } catch {}
  }

  async function fetchWorkspaceSession(name: string, projectId: string) {
    try {
      const res = await fetch(`/api/workspace/session?workspace_name=${encodeURIComponent(name)}`);
      const payload = await res.json();
      if (payload?.success && payload.data) {
        setWorkspaceName(name);
        await loadProject(name, projectId);
        return;
      }
      const createRes = await fetch('/api/workspace/session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_name: name, metadata: { initialized: true } }),
      });
      const createPayload = await createRes.json();
      if (createPayload?.success) {
        setWorkspaceName(name);
        await loadProject(name, projectId);
      }
    } catch {}
  }

  async function loadProject(name: string, projectId: string) {
    const existing = files.find((f) => f.projectId === projectId);
    if (!existing) {
      const newFile: ScriptFile = { id: projectId, name: 'script.lua', content: `-- ${projectId.slice(0, 8)}\n\n`, language: 'lua', projectId, updatedAt: new Date().toISOString() };
      setFiles((prev) => [...prev, newFile]);
    }
    setActiveFileId(projectId);
  }

  async function fetchExplorerTree() {
    const code = pluginCodeRef.current;
    if (code.length !== 6) return;
    setExplorerLoading(true);
    try {
      const res = await fetch(`/api/plugin/explorer?code=${code}`);
      const data = await res.json();
      if (data?.success && data?.tree) setExplorerTree(data.tree);
    } catch {}
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
    } catch {}
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
        body: JSON.stringify({ prompt, modelId: selectedModel, workspaceName, projectId: activeProjectId, projectName: activeFile?.name, sessionCode: pluginCode }),
      });
      const data = await res.json();
      if (!data?.success) { setError(data?.error || 'Generation failed'); return; }
      const aiResponse: AIResponse = data.data;
      setChatHistory((prev) => [...prev, { role: 'user', text: prompt }, { role: 'assistant', text: aiResponse.output }]);
      setPrompt('');
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

  // ── Panel content generators ──────────────────────────

  function renderExplorerPanel() {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-2.5 h-7 flex-shrink-0 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>Explorer</span>
          <button onClick={() => router.push('/projects')} className="text-[9px] border-0 cursor-pointer" style={{ color: 'var(--text-muted)' }}>Projects</button>
        </div>

        {pluginCode.trim().length === 6 && (
          <div className="border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between px-2.5 py-1">
              <span className="text-[9px] font-semibold" style={{ color: 'var(--text-muted)' }}>STUDIO</span>
              <button onClick={() => refreshExplorerTree()} className="text-[9px] border-0 cursor-pointer" style={{ color: 'var(--text-muted)' }}>+</button>
            </div>
            <div className="px-1 pb-1.5 max-h-[200px] overflow-y-auto">
              {explorerTree ? (
                <TreeView items={explorerTree} depth={0} />
              ) : (
                <div className="flex items-center justify-center py-3">
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{explorerLoading ? 'Loading...' : 'Connect plugin'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="px-3 py-1.5 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>SCRIPTS</span>
        </div>
        <div className="flex-1 overflow-y-auto py-0.5">
          {files.length === 0 ? (
            <p className="text-[10px] text-center mt-6" style={{ color: 'var(--text-muted)' }}>No files</p>
          ) : (
            files.map((file) => (
              <button
                key={file.id}
                onClick={() => setActiveFileId(file.id)}
                className="w-full text-left px-3 py-1 text-[11px] transition-all border-0 cursor-pointer flex items-center gap-2"
                style={{
                  background: activeFileId === file.id ? 'var(--accent-soft)' : 'transparent',
                  color: activeFileId === file.id ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>L</span>
                <span className="truncate">{file.name}</span>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  function renderChatPanel() {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-2.5 h-7 flex-shrink-0 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>AI Chat</span>
          <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="text-[9px] outline-none border px-1 py-0.5 rounded" style={{ background: 'transparent', color: 'var(--accent)', borderColor: 'var(--border-color)' }}>
            {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto" style={{ padding: '8px 10px' }}>
          {chatHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center" style={{ height: '100%', minHeight: '160px' }}>
              <p className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>Ask AI to generate code</p>
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Combat, UI, movement, and more</p>
            </div>
              ) : chatHistory.map((msg, i) => (
            <div key={i} className="animate-slide-up" style={{ animationDelay: '0ms' }}>
              {msg.role === 'user' && (
                <div className="flex items-start gap-2" style={{ marginBottom: '12px' }}>
                  <div className="w-5 h-5 rounded flex items-center justify-center text-[8px] font-bold flex-shrink-0" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>U</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-medium mb-0.5" style={{ color: 'var(--text-muted)' }}>You</p>
                    <div className="px-2.5 py-1.5 inline-block" style={{ background: 'var(--accent-soft)', borderRadius: '4px', maxWidth: '88%' }}>
                      <p className="text-[11px]" style={{ lineHeight: 1.35 }}>{msg.text}</p>
                    </div>
                  </div>
                </div>
              )}
              {msg.role === 'assistant' && (
                <div className="flex items-start gap-2" style={{ marginBottom: '12px' }}>
                  <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-[8px] font-bold" style={{ border: '1px solid var(--border-color)', color: 'var(--accent)' }}>AI</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-medium mb-0.5" style={{ color: 'var(--text-muted)' }}>Coconut AI</p>
                    <div className="px-2.5 py-1.5" style={{ border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                      <pre className="whitespace-pre-wrap font-sans text-[11px]" style={{ color: 'var(--text-primary)', lineHeight: 1.45 }}>{msg.text}</pre>
                      {(msg.text.includes('function') || msg.text.includes('local ')) && (
                        <button onClick={() => applyCodeFromChat(msg.text)} className="mt-2 text-[10px] text-white font-medium px-2.5 py-1 rounded border-0 cursor-pointer" style={{ background: 'var(--accent)' }}>
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

        <div className="px-3 py-1.5 border-t flex-shrink-0" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-surface-solid)' }}>
          {error && <p className="text-[10px] mb-1" style={{ color: '#ef4444' }}>{error}</p>}
          <textarea
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleGenerate())}
            placeholder="Describe what to build..."
            className="w-full resize-none text-[11px] px-2.5 py-1.5"
            style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', lineHeight: 1.35, outline: 'none' }}
          />
          <button onClick={handleGenerate} disabled={isGenerating} className="w-full text-[11px] font-medium text-white mt-1.5 px-3 py-1.5 border-0 cursor-pointer" style={{ background: 'var(--accent)', borderRadius: '4px', opacity: isGenerating ? 0.6 : 1 }}>
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────
  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col" style={{ background: 'var(--bg-page)' }}>
        <div className="flex flex-1 overflow-hidden">
          {/* Activity Bar */}
          <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />

          {/* Left Panel — Explorer or Settings */}
          <div className="flex flex-col flex-shrink-0 overflow-hidden border-r animate-fade-in" style={{ width: '280px', borderColor: 'var(--border-color)' }}>
            {activeTab === 'settings' ? (
              <SettingsPanel
                userName={userName}
                userEmail={userEmail}
                userRole={userRole || 'user'}
                pluginCode={pluginCode}
                onPluginCodeChange={setPluginCodeAndPersist}
              />
            ) : (
              renderExplorerPanel()
            )}
          </div>

          {/* Main Area */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Thin context bar */}
            <div className="flex items-center gap-2 px-2.5 h-7 flex-shrink-0 border-b animate-fade-in" style={{ background: 'var(--bg-surface-solid)', borderColor: 'var(--border-color)' }}>
              <button onClick={() => router.push('/projects')} className="border-0 cursor-pointer font-medium px-1.5 py-0.5 rounded text-[10px]" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>Projects</button>
              <span className="text-[10px]" style={{ color: 'var(--border-strong)' }}>/</span>
              <span className="font-medium truncate text-[11px]" style={{ color: 'var(--text-secondary)' }}>{activeFile?.name || 'untitled.lua'}</span>
              <div className="flex-1" />
              <select value={workspaceName} onChange={(e) => {
                setWorkspaceName(e.target.value);
                const pid = new URLSearchParams(window.location.search).get('projectId');
                if (pid) fetchWorkspaceSession(e.target.value, pid);
              }} className="text-[9px] outline-none border px-1 py-0.5 rounded" style={{ background: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--border-color)', maxWidth: '120px' }}>
                {workspaces.map((w) => <option key={w.id} value={w.workspace_name}>{w.workspace_name}</option>)}
              </select>
              {pluginCode.trim().length === 6 && (
                <span className="flex items-center gap-1 text-[10px]" style={{ color: pluginConnected ? 'var(--accent)' : '#fbbf24' }}>
                  <span className={`w-1.5 h-1.5 rounded-full ${pluginConnected ? 'animate-breathe' : ''}`} style={{ background: pluginConnected ? 'var(--accent)' : '#fbbf24' }} />
                  Studio
                </span>
              )}
            </div>

            {/* Code Editor */}
            <div className="flex-1 flex flex-col overflow-hidden" style={{ padding: '6px' }}>
              <div className="flex-1 flex flex-col overflow-hidden border" style={{ background: 'var(--bg-editor)', borderColor: 'var(--border-color)', borderRadius: '4px' }}>
                <EditorPanel code={code} onChange={handleCodeChange} activeFile={activeFile} />
              </div>
            </div>
          </main>

          {/* Right Panel — Chat */}
          <div className="flex flex-col flex-shrink-0 overflow-hidden border-l animate-slide-in-left" style={{ width: '280px', borderColor: 'var(--border-color)' }}>
            {renderChatPanel()}
          </div>
        </div>

        <WaveBackground />

        {/* Status Bar */}
        <footer className="flex items-center justify-between px-3 h-6 border-t text-[11px] flex-shrink-0 relative z-10 animate-fade-in" style={{ background: 'var(--bg-surface-solid)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-3">
            <span className="cursor-pointer" style={{ color: activeTab === 'explorer' ? 'var(--accent)' : 'inherit' }} onClick={() => handleTabChange('explorer')}>[.] Explorer</span>
            <span className="cursor-pointer" style={{ color: activeTab === 'chat' ? 'var(--accent)' : 'inherit' }} onClick={() => handleTabChange('chat')}>&lt;AI&gt; AI Chat</span>
            <span className="cursor-pointer" style={{ color: activeTab === 'settings' ? 'var(--accent)' : 'inherit' }} onClick={() => handleTabChange('settings')}>[=] Settings</span>
          </div>
          <div className="flex items-center gap-3">
            {pluginCode && (
              <span style={{ color: pluginConnected ? 'var(--accent)' : 'var(--text-muted)' }}>
                Studio {pluginConnected ? 'Connected' : pluginCode.trim().length === 6 ? 'Invalid' : ''}
              </span>
            )}
            {userRole === 'premium' && <span style={{ color: '#fbbf24' }}>Premium</span>}
            {userRole === 'admin' && <span style={{ color: '#ef4444' }}>Admin</span>}
            <span style={{ color: 'var(--text-secondary)' }}>{userName}</span>
            {pluginStatus && <span>{pluginStatus}</span>}
            {activeProjectId && <><span style={{ color: 'var(--border-strong)' }}>|</span><span>Ln 1</span><span>Luau</span></>}
          </div>
        </footer>
      </div>
      {toastMsg && <Toast message={toastMsg} type={toastType} onClose={toastClose} />}
    </ErrorBoundary>
  );
}
