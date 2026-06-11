'use client';

import { useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { StreamLanguage } from '@codemirror/language';
import { lua } from '@codemirror/legacy-modes/mode/lua';
import type { ScriptFile } from '@/types';

interface EditorPanelProps {
  code: string;
  onChange: (value: string) => void;
  activeFile: ScriptFile | undefined;
}

const darkTheme = {
  '&': { backgroundColor: '#0a0a0f', color: '#c0c0d0' },
  '.cm-gutters': { backgroundColor: '#0d0d14', color: '#3a3a4a', border: 'none' },
  '.cm-activeLineGutter': { backgroundColor: '#15152a' },
  '.cm-activeLine': { backgroundColor: '#15152a33' },
  '.cm-cursor': { borderLeftColor: '#22d3ee' },
  '.cm-selectionBackground': { backgroundColor: '#1a3a5a55' },
  '.cm-matchingBracket': { backgroundColor: '#2a4a3a55', outline: '1px solid #2a6a5a' },
  '.cm-linenumber': { color: '#3a3a4a' },
};

export default function EditorPanel({ code, onChange, activeFile }: EditorPanelProps) {
  const handleChange = useCallback(
    (val: string) => onChange(val),
    [onChange]
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center px-4 h-9 bg-[#0d0d14] border-b border-[#1e1e2a] text-xs text-[#6666a0]">
        <span className="text-cyan-300">{activeFile?.name || 'untitled.lua'}</span>
      </div>
      <div className="flex-1 overflow-auto">
        <CodeMirror
          value={code}
          onChange={handleChange}
          extensions={[StreamLanguage.define(lua)]}
          theme={darkTheme as any}
          height="100%"
          basicSetup={{
            foldGutter: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
          }}
        />
      </div>
    </div>
  );
}
