'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from './ThemeProvider';

const themes = [
  { id: 'coconut', label: 'Coconut', desc: 'Warm amber dark' },
  { id: 'midnight', label: 'Midnight', desc: 'Cool blue dark' },
  { id: 'obsidian', label: 'Obsidian', desc: 'Deep purple dark' },
] as const;

export default function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = themes.find(t => t.id === theme);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all" style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
        <span className="w-2 h-2 rounded-full" style={{ background: theme === 'coconut' ? '#d97706' : theme === 'midnight' ? '#3b82f6' : '#a855f7' }} />
        {current?.label}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 rounded-xl shadow-lg p-1 min-w-[150px] z-50 border" style={{ background: 'var(--bg-surface-solid)', borderColor: 'var(--border-color)' }}>
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTheme(t.id as any); setOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-2.5"
              style={{
                background: theme === t.id ? 'var(--accent-soft)' : 'transparent',
                color: theme === t.id ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: t.id === 'coconut' ? '#d97706' : t.id === 'midnight' ? '#3b82f6' : '#a855f7' }} />
              <span className="font-medium">{t.label}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{t.desc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
