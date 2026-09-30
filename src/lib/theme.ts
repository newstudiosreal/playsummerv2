import { useCallback, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';
const KEY = 'ps_theme';
const COLORS: Record<Theme, string> = { dark: '#0A1A2F', light: '#E4F6FA' };

const initial = (): Theme => {
  try { const s = localStorage.getItem(KEY); if (s === 'dark' || s === 'light') return s; } catch { /* storage non disponibile */ }
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initial);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLORS[theme]);
    try { localStorage.setItem(KEY, theme); } catch { /* ignora */ }
  }, [theme]);
  return { theme, toggle: useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []) };
}
