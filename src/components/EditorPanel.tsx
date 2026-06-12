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
      <div className="flex items-center px-6 h-11 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>📄 {activeFile?.name || 'untitled.lua'}</span>
      </div>
      <div className="flex-1 flex overflow-hidden" style={{ minHeight: 0 }}>
        <div className="select-none text-right py-5 px-4 leading-[22px] border-r overflow-hidden font-mono flex-shrink-0" style={{ color: 'var(--line-numbers)', borderColor: 'var(--border-color)', background: 'var(--bg-surface)', fontSize: 13, width: '52px' }}>
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <div className="flex-1 flex" style={{ background: 'var(--bg-code)' }}>
          <textarea
            ref={textareaRef}
            value={code}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            className="flex-1 outline-none resize-none border-none"
            style={{ color: 'var(--text-primary)', background: 'transparent', tabSize: 2, fontSize: 13, lineHeight: '22px', padding: '20px 24px' }}
          />
        </div>
      </div>
    </div>
  );
}
