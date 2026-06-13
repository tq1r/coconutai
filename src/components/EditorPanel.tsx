'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { ScriptFile } from '@/types';

const LUAU_KEYWORDS = new Set([
  'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function',
  'goto', 'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 'return',
  'then', 'true', 'until', 'while',
]);

const LUAU_BUILTINS = new Set([
  'print', 'warn', 'error', 'typeof', 'type', 'tostring', 'tonumber',
  'ipairs', 'pairs', 'next', 'select', 'unpack', 'pcall', 'xpcall',
  'setmetatable', 'getmetatable', 'rawset', 'rawget', 'rawequal',
  'math', 'string', 'table', 'os', 'coroutine', 'debug', 'utf8',
  'Vector3', 'Vector2', 'CFrame', 'UDim', 'UDim2', 'Color3', 'ColorSequence',
  'NumberRange', 'NumberSequence', 'BrickColor', 'Ray', 'Region3',
  'Enum', 'Instance', 'task', 'delay', 'spawn',
  'game', 'workspace', 'script', 'shared', 'require',
  'LoadLibrary', 'settings', 'UserSettings',
]);

interface Token { text: string; type: 'keyword' | 'string' | 'comment' | 'number' | 'builtin' | 'normal' | 'operator' }

function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < code.length) {
    if (code[i] === '-' && code[i + 1] === '-') {
      let end = code.indexOf('\n', i);
      if (end === -1) end = code.length;
      tokens.push({ text: code.slice(i, end), type: 'comment' });
      i = end;
    } else if (code[i] === '"' || code[i] === "'") {
      const quote = code[i];
      let j = i + 1;
      while (j < code.length) {
        if (code[j] === '\\') j += 2;
        else if (code[j] === quote) { j++; break; }
        else j++;
      }
      tokens.push({ text: code.slice(i, j), type: 'string' });
      i = j;
    } else if ((code[i] >= '0' && code[i] <= '9') || (code[i] === '.' && i + 1 < code.length && code[i + 1] >= '0' && code[i + 1] <= '9')) {
      let j = i;
      while (j < code.length && /[0-9.eExXa-fA-F_]/.test(code[j])) j++;
      tokens.push({ text: code.slice(i, j), type: 'number' });
      i = j;
    } else if ((code[i] >= 'a' && code[i] <= 'z') || (code[i] >= 'A' && code[i] <= 'Z') || code[i] === '_') {
      let j = i;
      while (j < code.length && /[a-zA-Z0-9_]/.test(code[j])) j++;
      const word = code.slice(i, j);
      if (LUAU_KEYWORDS.has(word)) tokens.push({ text: word, type: 'keyword' });
      else if (LUAU_BUILTINS.has(word)) tokens.push({ text: word, type: 'builtin' });
      else tokens.push({ text: word, type: 'normal' });
      i = j;
    } else if (/[+\-*/%=<>!~&|^#@,;:.?]/.test(code[i])) {
      let j = i + 1;
      if (j < code.length && /[=]/.test(code[j])) j++;
      tokens.push({ text: code.slice(i, j), type: 'operator' });
      i = j;
    } else {
      tokens.push({ text: code[i], type: 'normal' });
      i++;
    }
  }
  return tokens;
}

function highlightHtml(code: string): string {
  const tokens = tokenize(code);
  return tokens.map(t => {
    switch (t.type) {
      case 'keyword': return `<span style="color:#ff79c6">${escapeHtml(t.text)}</span>`;
      case 'string': return `<span style="color:#f1fa8c">${escapeHtml(t.text)}</span>`;
      case 'comment': return `<span style="color:#6272a4">${escapeHtml(t.text)}</span>`;
      case 'number': return `<span style="color:#bd93f9">${escapeHtml(t.text)}</span>`;
      case 'builtin': return `<span style="color:#50fa7b">${escapeHtml(t.text)}</span>`;
      case 'operator': return `<span style="color:#ff79c6">${escapeHtml(t.text)}</span>`;
      default: return escapeHtml(t.text);
    }
  }).join('');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

interface EditorPanelProps {
  code: string;
  onChange: (value: string) => void;
  activeFile: ScriptFile | undefined;
  onCursorChange?: (line: number, col: number) => void;
}

export default function EditorPanel({ code, onChange, activeFile, onCursorChange }: EditorPanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [lineCount, setLineCount] = useState(1);

  const highlighted = useMemo(() => highlightHtml(code), [code]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
      setLineCount((e.target.value.match(/\n/g) || []).length + 1);
    },
    [onChange]
  );

  const reportCursor = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta || !onCursorChange) return;
    const val = ta.value;
    const pos = ta.selectionStart;
    const before = val.substring(0, pos);
    const line = (before.match(/\n/g) || []).length + 1;
    const col = pos - before.lastIndexOf('\n');
    onCursorChange(line, col);
  }, [onCursorChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const val = ta.value;
    if (e.key === 'Tab') {
      e.preventDefault();
      ta.value = val.substring(0, start) + '  ' + val.substring(end);
      ta.selectionStart = ta.selectionEnd = start + 2;
      onChange(ta.value);
    } else if ((e.key === '(' || e.key === '[' || e.key === '{') && start === end) {
      e.preventDefault();
      const pairs: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
      ta.value = val.substring(0, start) + e.key + pairs[e.key] + val.substring(end);
      ta.selectionStart = ta.selectionEnd = start + 1;
      onChange(ta.value);
    } else if ((e.key === '\'' || e.key === '"') && start === end) {
      e.preventDefault();
      ta.value = val.substring(0, start) + e.key + e.key + val.substring(end);
      ta.selectionStart = ta.selectionEnd = start + 1;
      onChange(ta.value);
    } else if (e.key === 'Enter' && start === end) {
      const lineStart = val.lastIndexOf('\n', start - 1) + 1;
      const lineBefore = val.substring(lineStart, start);
      const indent = lineBefore.match(/^\s*/)?.[0] || '';
      if (/[{(\[]\s*$/.test(lineBefore)) {
        e.preventDefault();
        const extra = '  ';
        ta.value = val.substring(0, start) + '\n' + indent + extra + '\n' + indent + val.substring(end);
        ta.selectionStart = ta.selectionEnd = start + indent.length + extra.length + 1;
        onChange(ta.value);
      }
    }
  }, [onChange]);

  function syncScroll() {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }

  useEffect(() => {
    setLineCount((code.match(/\n/g) || []).length + 1);
  }, [code]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-fade-in">
      <div className="flex items-center px-4 h-8 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <span className="text-[11px] font-medium" style={{ color: 'var(--accent)' }}>{activeFile?.name || 'untitled.lua'}</span>
      </div>
      <div className="flex-1 flex overflow-hidden" style={{ minHeight: 0 }}>
        <div className="select-none text-right py-4 px-3 leading-[20px] border-r overflow-hidden font-mono flex-shrink-0" style={{ color: 'var(--line-numbers)', borderColor: 'var(--border-color)', background: 'var(--bg-surface)', fontSize: 12, width: '44px' }}>
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} style={{ fontSize: 11 }}>{i + 1}</div>
          ))}
        </div>
        <div className="flex-1 relative" style={{ background: 'var(--bg-code)' }}>
          <div
            ref={highlightRef}
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ padding: '16px 20px', fontSize: 12.5, lineHeight: '20px', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
            dangerouslySetInnerHTML={{ __html: highlighted + '\n' }}
          />
          <textarea
            ref={textareaRef}
            value={code}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onScroll={syncScroll}
            onSelect={reportCursor}
            onClick={reportCursor}
            spellCheck={false}
            className="absolute inset-0 outline-none resize-none border-none"
            style={{
              color: 'transparent', background: 'transparent',
              caretColor: 'var(--accent)',
              tabSize: 2, fontSize: 12.5, lineHeight: '20px',
              padding: '16px 20px',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              overflow: 'auto',
            }}
            aria-label="Code editor"
          />
        </div>
      </div>
    </div>
  );
}
