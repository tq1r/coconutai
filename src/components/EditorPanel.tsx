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
      <div className="flex items-center px-4 h-9 bg-white border-b border-sand-100 text-sm text-stone-400">
        <span className="text-ocean-500 font-medium">{activeFile?.name || 'untitled.lua'}</span>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="select-none text-right px-3 py-3 text-xs leading-6 text-stone-300 bg-stone-50 border-r border-sand-100 overflow-hidden font-mono" style={{ minWidth: 44 }}>
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
          className="flex-1 bg-white text-stone-800 text-sm leading-6 p-3 outline-none resize-none border-none font-mono"
          style={{ tabSize: 2 }}
        />
      </div>
    </div>
  );
}
