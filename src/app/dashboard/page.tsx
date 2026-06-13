'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ErrorBoundary from '@/components/ErrorBoundary';
import EditorPanel from '@/components/EditorPanel';
import Sidebar from '@/components/Sidebar';
import WaveBackground from '@/components/WaveBackground';
import SettingsPanel from '@/components/SettingsPanel';
import { generateId } from '@/lib/id-utils';
import type { AIModel, AIResponse, WorkspaceSession, ScriptFile } from '@/types';
import { PanelSkeleton, CardSkeleton } from '@/components/LoadingSkeleton';

const STORAGE_KEY_PLUGIN_CODE = 'coconut-plugin-code';
const STORAGE_KEY_THEME = 'coconut-theme';

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
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 text-sm font-medium shadow-xl animate-float-up" style={{ background: type === 'error' ? 'var(--danger)' : 'var(--warning)', color: '#fff', borderRadius: '4px', boxShadow: type === 'error' ? '0 0 16px var(--danger-glow)' : '0 0 16px var(--warning-glow)' }}>
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [files, setFiles] = useState<ScriptFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [openFileIds, setOpenFileIds] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | ''>('');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filesRef = useRef(files);
  const [activeTab, setActiveTab] = useState<TabId>('explorer');
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'error' | 'success'>('error');
  const [explorerTree, setExplorerTree] = useState<any[] | null>(null);
  const [explorerLoading, setExplorerLoading] = useState(false);
  const [pluginCode, setPluginCode] = useState('');
  const [pluginConnected, setPluginConnected] = useState(false);
  const [pluginStatus, setPluginStatus] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [showNewFile, setShowNewFile] = useState(false);
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [fileFilter, setFileFilter] = useState('');
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
    setOpenFileIds([pid]);
    Promise.all([fetchCurrentUser(), fetchModels(), fetchWorkspaceList(pid)])
      .finally(() => setInitialLoading(false));
    const saved = localStorage.getItem(STORAGE_KEY_PLUGIN_CODE);
    if (saved) setPluginCodeAndPersist(saved);
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);
  useEffect(() => { pluginCodeRef.current = pluginCode; }, [pluginCode]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === 's') {
        e.preventDefault();
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        setSaveStatus('saving');
        fetch('/api/workspace/session', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspace_name: workspaceName, metadata: { files: filesRef.current } }),
        })
          .then(() => setSaveStatus('saved'))
          .catch(() => setSaveStatus(''));
      }
      if (ctrl && e.key === 'n') {
        e.preventDefault();
        setShowNewFile(true);
        setNewFileName('');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [workspaceName]);

  function toast(msg: string, type: 'error' | 'success') {
    setToastMsg(msg); setToastType(type);
  }

  async function setPluginCodeAndPersist(code: string) {
    const upper = code.toUpperCase();
    setPluginCode(upper);
    setPluginConnected(false);
    if (upper.length === 6) {
      localStorage.setItem(STORAGE_KEY_PLUGIN_CODE, upper);
      try {
        const res = await fetch(`/api/plugin/verify?code=${upper}`);
        const data = await res.json();
        setPluginConnected(data?.connected === true);
        fetchExplorerTree();
      } catch { setPluginConnected(false); toast('Failed to verify plugin code', 'error'); }
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
    } catch { toast('Failed to load user data', 'error'); }
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
    } catch { toast('Failed to load AI models', 'error'); }
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
    } catch { toast('Failed to load workspace list', 'error'); }
  }

  async function fetchWorkspaceSession(name: string, projectId: string) {
    try {
      const res = await fetch(`/api/workspace/session?workspace_name=${encodeURIComponent(name)}`);
      const payload = await res.json();
      if (payload?.success && payload.data) {
        setWorkspaceName(name);
        const savedFiles: ScriptFile[] = payload.data.metadata?.files || [];
        if (savedFiles.length > 0) {
          setFiles(savedFiles);
        }
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
    } catch { toast('Failed to load workspace session', 'error'); }
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
    } catch { toast('Failed to fetch explorer tree', 'error'); }
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
    } catch { toast('Failed to refresh explorer', 'error'); }
    setTimeout(fetchExplorerTree, 3000);
  }

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);
    if (tab === 'explorer' && pluginCodeRef.current.length === 6) {
      fetchExplorerTree();
    }
  }, []);

  useEffect(() => { filesRef.current = files; }, [files]);

  useEffect(() => {
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, []);

  function scheduleSave() {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus('saving');
    saveTimerRef.current = setTimeout(() => {
      const current = filesRef.current;
      fetch('/api/workspace/session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_name: workspaceName, metadata: { files: current } }),
      })
        .then(() => setSaveStatus('saved'))
        .catch(() => setSaveStatus(''));
    }, 800);
  }

  function handleCodeChange(value: string) {
    setFiles((prev) => prev.map((f) => f.id === activeFileId ? { ...f, content: value, updatedAt: new Date().toISOString() } : f));
    scheduleSave();
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
          const pushName = prompt.slice(0, 60).replace(/\n/g, ' ') || 'AI Generated';
          const pushRes = await fetch('/api/plugin/push', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: activeCode, type: 'script', name: pushName, script: aiResponse.output }),
          });
          const pushData = await pushRes.json();
          setPluginStatus(pushData.success ? 'Pushed to Studio' : 'Push failed');
        } catch { setPluginStatus('Push error'); }
        setTimeout(() => setPluginStatus(''), 4000);
      }
    } catch { setError('Unable to reach AI service.'); } finally { setIsGenerating(false); }
  }

  function createFile() {
    const name = newFileName.trim();
    if (!name) return;
    const newFile: ScriptFile = {
      id: generateId(),
      name: name.endsWith('.lua') ? name : name + '.lua',
      content: '-- ' + name + '\n\n',
      language: 'luau',
      projectId: activeProjectId || '',
      updatedAt: new Date().toISOString(),
    };
    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setNewFileName('');
    setShowNewFile(false);
    scheduleSave();
  }

  function deleteFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (activeFileId === id) {
      const remaining = openFileIds.filter((fid) => fid !== id);
      setActiveFileId(remaining.length > 0 ? remaining[remaining.length - 1] : null);
    }
    setOpenFileIds((prev) => prev.filter((fid) => fid !== id));
    scheduleSave();
  }

  function renameFile(id: string, newName: string) {
    const trimmed = newName.trim();
    if (!trimmed) { setRenamingFileId(null); return; }
    setFiles((prev) => prev.map((f) => f.id === id ? { ...f, name: trimmed.endsWith('.lua') ? trimmed : trimmed + '.lua' } : f));
    setRenamingFileId(null);
    scheduleSave();
  }

  function applyCodeFromChat(codeSnippet: string) {
    setPendingCode(codeSnippet);
  }

  function confirmApplyCode() {
    if (!pendingCode || !activeFileId) { setPendingCode(null); return; }
    setFiles((prev) => prev.map((f) => f.id === activeFileId ? { ...f, content: pendingCode, updatedAt: new Date().toISOString() } : f));
    setFileContent(pendingCode);
    setPendingCode(null);
    scheduleSave();
  }

  async function pushToStudio() {
    if (!pluginCode || pluginCode.trim().length !== 6 || !activeFile) return;
    try {
      setPluginStatus('Pushing...');
      const res = await fetch('/api/plugin/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: pluginCode, script: code, type: 'script', name: activeFile.name }),
      });
      const data = await res.json();
      if (data.success) {
        setPluginStatus('Pushed!');
        toast('Code pushed to Studio', 'success');
      } else {
        setPluginStatus('Failed');
        toast(data.error || 'Push failed', 'error');
      }
    } catch {
      setPluginStatus('Failed');
      toast('Push to Studio failed', 'error');
    }
    setTimeout(() => setPluginStatus(''), 3000);
  }

  const toastClose = useCallback(() => setToastMsg(''), []);

  function renderChatMessage(text: string) {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      const codeMatch = part.match(/^```(\w*)\n?([\s\S]*?)```$/);
      if (codeMatch) {
        const lang = codeMatch[1] || 'luau';
        const code = codeMatch[2];
        return (
          <pre key={i} className="font-mono text-[10px] whitespace-pre-wrap overflow-x-auto my-1.5 p-2" style={{ background: 'var(--bg-code)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-primary)', lineHeight: 1.45 }}>
            {code}
          </pre>
        );
      }
      return <p key={i} className="text-[11px]" style={{ lineHeight: 1.5, color: 'var(--text-primary)' }}>{part}</p>;
    });
  }

  // ── Panel content generators ──────────────────────────

  function renderExplorerPanel() {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-2.5 h-7 flex-shrink-0 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>Explorer</span>
          <button onClick={() => router.push('/projects')} className="text-[9px] border-0 cursor-pointer" style={{ color: 'var(--text-muted)' }} aria-label="Back to projects">Projects</button>
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

        <div className="flex items-center justify-between px-3 py-1.5 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>SCRIPTS</span>
          <div className="flex items-center gap-1">
            {files.length > 0 && <button onClick={() => setFileFilter(fileFilter ? '' : 'search')} className="text-[9px] border-0 cursor-pointer" style={{ color: 'var(--text-muted)' }} aria-label="Search files">?</button>}
            <button onClick={() => { setShowNewFile(!showNewFile); setNewFileName(''); }} className="text-[9px] border-0 cursor-pointer" style={{ color: 'var(--text-muted)' }} aria-label="New file">+</button>
          </div>
        </div>
        {fileFilter && (
          <div className="px-2 py-1 flex gap-1 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <input
              value={fileFilter === 'search' ? '' : fileFilter}
              onChange={(e) => setFileFilter(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') setFileFilter(''); }}
              placeholder="Filter files..."
              className="flex-1 text-[10px] outline-none px-1.5 py-0.5"
              style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
              autoFocus
              aria-label="Filter files"
            />
            <button onClick={() => setFileFilter('')} className="text-[9px] border-0 cursor-pointer" style={{ color: 'var(--text-muted)' }}>x</button>
          </div>
        )}
        {showNewFile && (
          <div className="px-2 py-1 border-b flex gap-1" style={{ borderColor: 'var(--border-color)' }}>
            <input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') createFile(); if (e.key === 'Escape') { setShowNewFile(false); setNewFileName(''); } }}
              placeholder="name.lua"
              className="flex-1 text-[10px] outline-none px-1.5 py-0.5"
              style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
              autoFocus
              aria-label="New file name"
            />
            <button onClick={createFile} className="btn-neon text-[9px] px-1.5 py-0.5" aria-label="Create file">+</button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto py-0.5">
          {(() => {
            const filtered = fileFilter && fileFilter !== 'search' ? files.filter((f) => f.name.toLowerCase().includes(fileFilter.toLowerCase())) : files;
            return filtered.length === 0 ? (
            <p className="text-[10px] text-center mt-6" style={{ color: 'var(--text-muted)' }}>No files</p>
          ) : (
            files.map((file) => (
              <div key={file.id} className="group flex items-center px-3 py-1 text-[11px] transition-all cursor-pointer" style={{
                background: activeFileId === file.id ? 'var(--accent-soft)' : 'transparent',
                color: activeFileId === file.id ? 'var(--accent)' : 'var(--text-secondary)',
              }} onClick={() => { if (renamingFileId !== file.id) { setOpenFileIds((prev) => prev.includes(file.id) ? prev : [...prev, file.id]); setActiveFileId(file.id); } }}>
                <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>L</span>
                {renamingFileId === file.id ? (
                  <input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') renameFile(file.id, renameValue); if (e.key === 'Escape') setRenamingFileId(null); }}
                    onBlur={() => renameFile(file.id, renameValue)}
                    className="flex-1 text-[10px] outline-none px-1 py-0 ml-1.5"
                    style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '2px' }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Rename file"
                  />
                ) : (
                  <span className="truncate ml-1.5 flex-1" onDoubleClick={() => { setRenamingFileId(file.id); setRenameValue(file.name.replace(/\.lua$/, '')); }}>{file.name}</span>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); deleteFile(file.id); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] border-0 cursor-pointer ml-1 px-1 flex-shrink-0"
                  style={{ color: 'var(--text-muted)' }}
                  aria-label="Delete file"
                >x</button>
              </div>
            ))
          )})()}
        </div>
      </div>
    );
  }

  function renderChatPanel() {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-2.5 h-7 flex-shrink-0 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>AI Chat</span>
          <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="text-[9px] outline-none border px-1 py-0.5 rounded" style={{ background: 'transparent', color: 'var(--accent)', borderColor: 'var(--border-color)' }} aria-label="AI model">
            {models.map((m) => <option key={m.id} value={m.id} title={m.description}>{m.name}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto" style={{ padding: '8px 10px' }}>
          {chatHistory.length === 0 ? (
            <div className="flex flex-col" style={{ padding: '16px 0' }}>
              <p className="text-[11px] font-medium mb-3 text-center" style={{ color: 'var(--text-secondary)' }}>Ask AI to generate code</p>
              <div className="flex flex-col gap-1.5 px-2">
                {['Sword attack animation with raycast hit detection', 'Inventory system with hotbar UI', 'Part sliding physics system', 'Leaderboard GUI with animated scores', 'NPC patrol path with waypoints'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => { setPrompt(suggestion); }}
                    className="w-full text-left text-[10px] px-2.5 py-1.5 transition-all border-0 cursor-pointer"
                    style={{ background: 'var(--accent-soft)', color: 'var(--text-secondary)', borderRadius: '4px' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent-soft)'}
                  >{suggestion}</button>
                ))}
              </div>
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
                      {renderChatMessage(msg.text)}
                      {(msg.text.includes('function') || msg.text.includes('local ')) && (
                        <button onClick={() => applyCodeFromChat(msg.text)} className="btn-neon mt-2 text-[10px] px-2.5 py-1">
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
          {error && <p className="text-[10px] mb-1" style={{ color: 'var(--danger)' }}>{error}</p>}
          <textarea
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => (e.key === 'Enter' && (e.ctrlKey || e.metaKey || !e.shiftKey)) && (e.preventDefault(), handleGenerate())}
            placeholder="Describe what to build..."
            className="w-full resize-none text-[11px] px-2.5 py-1.5"
            style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', lineHeight: 1.35, outline: 'none' }}
          />
          <button onClick={handleGenerate} disabled={isGenerating} className="btn-neon w-full text-[11px] mt-1.5 px-3 py-1.5">
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────
  if (initialLoading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        <div className="text-center">
          <div className="animate-shimmer mx-auto mb-6 w-16 h-4" style={{ background: 'var(--border-color)', borderRadius: '4px' }} />
          <div className="animate-shimmer mx-auto mb-3 w-48 h-3" style={{ background: 'var(--border-color)', borderRadius: '4px' }} />
          <div className="animate-shimmer mx-auto w-32 h-3" style={{ background: 'var(--border-color)', borderRadius: '4px' }} />
        </div>
      </div>
    );
  }

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
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>/</span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{activeFile?.name || 'untitled'}</span>
              {pendingCode && <span className="text-[9px] px-1 py-0.5 rounded" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>Preview</span>}
              <div className="flex-1" />
              <select value={workspaceName} onChange={(e) => {
                setWorkspaceName(e.target.value);
                const pid = new URLSearchParams(window.location.search).get('projectId');
                if (pid) fetchWorkspaceSession(e.target.value, pid);
              }} className="text-[9px] outline-none border px-1 py-0.5 rounded" style={{ background: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--border-color)', maxWidth: '120px' }}>
                {workspaces.map((w) => <option key={w.id} value={w.workspace_name}>{w.workspace_name}</option>)}
              </select>
              {pluginCode.trim().length === 6 && (
                <span className="flex items-center gap-1 text-[10px]" style={{ color: pluginConnected ? 'var(--accent)' : 'var(--warning)' }}>
                  <span className={`w-1.5 h-1.5 rounded-full ${pluginConnected ? 'animate-breathe' : ''}`} style={{ background: pluginConnected ? 'var(--accent)' : 'var(--warning)' }} />
                  Studio
                </span>
              )}
              {pluginCode.trim().length === 6 && pluginConnected && activeFile && (
                <button onClick={pushToStudio} disabled={pluginStatus === 'Pushing...'} className="btn-neon text-[9px] px-1.5 py-0.5 ml-1" aria-label="Push to Studio">Push</button>
              )}
            </div>

            {/* File Tabs */}
            <div className="flex items-stretch h-7 flex-shrink-0 overflow-x-auto border-b hide-scrollbar" style={{ background: 'var(--bg-surface-solid)', borderColor: 'var(--border-color)' }}>
              {openFileIds.length === 0 && <div className="flex items-center px-3 text-[10px]" style={{ color: 'var(--text-muted)' }}>No open files</div>}
              {openFileIds.map((fid) => {
                const f = files.find((f) => f.id === fid);
                const isActive = activeFileId === fid;
                return (
                  <div key={fid} className="flex items-center gap-1.5 px-2.5 text-[10px] flex-shrink-0 cursor-pointer border-r" style={{ background: isActive ? 'var(--bg-editor)' : 'transparent', color: isActive ? 'var(--accent)' : 'var(--text-muted)', borderColor: 'var(--border-color)', borderTop: isActive ? '2px solid var(--accent)' : '2px solid transparent', minWidth: 0 }}
                    onClick={() => setActiveFileId(fid)}
                  >
                    <span className="truncate max-w-[80px]">{f?.name || 'untitled'}</span>
                    <button onClick={(e) => { e.stopPropagation(); setOpenFileIds((prev) => { const idx = prev.indexOf(fid); const next = prev.filter((id) => id !== fid); if (isActive && next.length > 0) setActiveFileId(next[Math.min(idx, next.length - 1)]); if (isActive && next.length === 0) setActiveFileId(null); return next; }); }}
                      className="text-[9px] border-0 cursor-pointer opacity-50 hover:opacity-100 flex-shrink-0" style={{ color: 'inherit', background: 'none' }} aria-label="Close tab">x</button>
                  </div>
                );
              })}
            </div>

            {/* Code Editor */}
            <div className="flex-1 flex flex-col overflow-hidden" style={{ padding: '6px' }}>
              {pendingCode && (
                <div className="flex items-center gap-2 px-2.5 py-1 mb-1 text-[10px]" style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--accent)' }}>Code generated</span>
                  <span className="flex-1" />
                  <button onClick={confirmApplyCode} className="btn-neon text-[9px] px-2 py-0.5">Apply</button>
                  <button onClick={() => setPendingCode(null)} style={{ color: 'var(--text-muted)', background: 'none', border: '1px solid var(--border-color)', borderRadius: '2px', cursor: 'pointer', padding: '1px 6px' }}>x</button>
                </div>
              )}
              <div className="flex-1 flex flex-col overflow-hidden border" style={{ background: 'var(--bg-editor)', borderColor: 'var(--border-color)', borderRadius: '4px' }}>
                <EditorPanel code={pendingCode || code} onChange={handleCodeChange} activeFile={activeFile} />
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
          <div className="flex items-center gap-1">
            <button className="border-0 cursor-pointer text-[11px]" style={{ color: activeTab === 'explorer' ? 'var(--accent)' : 'inherit', background: 'none' }} onClick={() => handleTabChange('explorer')} aria-label="Show explorer panel">[.] Explorer</button>
            <button className="border-0 cursor-pointer text-[11px]" style={{ color: activeTab === 'chat' ? 'var(--accent)' : 'inherit', background: 'none' }} onClick={() => handleTabChange('chat')} aria-label="Show AI chat panel">{'<AI>'} AI Chat</button>
            <button className="border-0 cursor-pointer text-[11px]" style={{ color: activeTab === 'settings' ? 'var(--accent)' : 'inherit', background: 'none' }} onClick={() => handleTabChange('settings')} aria-label="Show settings panel">[=] Settings</button>
          </div>
          <div className="flex items-center gap-3">
            {saveStatus && <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{saveStatus === 'saved' ? 'Saved' : 'Saving...'}</span>}
            {pluginCode && (
              <span style={{ color: pluginConnected ? 'var(--accent)' : 'var(--text-muted)' }}>
                Studio {pluginConnected ? 'Connected' : pluginCode.trim().length === 6 ? 'Invalid' : ''}
              </span>
            )}
            {userRole === 'premium' && <span style={{ color: 'var(--warning)' }}>Premium</span>}
            {userRole === 'admin' && <span style={{ color: 'var(--danger)' }}>Admin</span>}
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
