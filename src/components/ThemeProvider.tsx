'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'coconut' | 'midnight' | 'obsidian';

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'coconut', setTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('coconut');

  useEffect(() => {
    const saved = localStorage.getItem('coconut-theme') as Theme | null;
    if (saved && ['coconut', 'midnight', 'obsidian'].includes(saved)) {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    }
  }, []);

  const applyTheme = (t: Theme) => {
    setTheme(t);
    localStorage.setItem('coconut-theme', t);
    document.documentElement.setAttribute('data-theme', t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
