'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ScriptFile } from '@/types';

interface EditorPanelProps {
  code: string;
  onChange: (value: string) => void;
  activeFile: ScriptFile | undefined;
}

export default function EditorPanel({ code, onChange, activeFile }: EditorPanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [lineCount, setLineCount] = useState(1);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
      setLineCount((e.target.value.match(/\n/g) || []).length + 1);
    },
    [onChange]
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const val = ta.value;
      ta.value = val.substring(0, start) + '  ' + val.substring(end);
      ta.selectionStart = ta.selectionEnd = start + 2;
      onChange(ta.value);
    }
  }, [onChange]);

  useEffect(() => {
    setLineCount((code.match(/\n/g) || []).length + 1);
  }, [code]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center px-4 h-9 bg-[#0d0b0a] border-b border-[#2a2620] text-xs text-sand-400">
        <span className="text-cyan-400">{activeFile?.name || 'untitled.lua'}</span>
      </div>
      <div className="flex-1 flex overflow-hidden bg-[#1a1815]">
        <div className="select-none text-right px-3 py-3 text-xs leading-6 text-sand-500 bg-[#0d0b0a] border-r border-[#2a2620] overflow-hidden" style={{ minWidth: 48 }}>
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={code}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="flex-1 bg-transparent text-white text-xs leading-6 p-3 outline-none resize-none border-none font-mono"
          style={{ tabSize: 2 }}
        />
      </div>
    </div>
  );
}
