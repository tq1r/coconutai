'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from './ThemeProvider';

const themes = [
  { id: 'beach', label: 'Beach', icon: '🏖️' },
  { id: 'dark', label: 'Dark', icon: '🌙' },
  { id: 'ocean', label: 'Ocean', icon: '🌊' },
  { id: 'sunset', label: 'Sunset', icon: '🌅' },
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

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium bg-white/40 border border-sand-100 shadow-sm hover:bg-white/60 transition-all whitespace-nowrap cursor-pointer">
        {themes.find(t => t.id === theme)?.icon} {themes.find(t => t.id === theme)?.label}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-sand-100 rounded-xl shadow-lg p-1 min-w-[130px] z-50">
          {themes.map((t) => (
            <button key={t.id} onClick={() => { setTheme(t.id as any); setOpen(false); }} className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-2 ${theme === t.id ? 'bg-ocean-50 text-ocean-600 font-medium' : 'text-stone-600 hover:bg-stone-50'}`}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
