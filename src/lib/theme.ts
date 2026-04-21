import { useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';

export const THEME_STORAGE_KEY = 'theme';

export const THEME_INIT_SCRIPT = `(function(){try{var s=window.localStorage.getItem('${THEME_STORAGE_KEY}');var m=(s==='light'||s==='dark'||s==='auto')?s:'auto';var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var r=m==='auto'?(d?'dark':'light'):m;var e=document.documentElement;e.classList.remove('light','dark');e.classList.add(r);if(m==='auto'){e.removeAttribute('data-theme')}else{e.setAttribute('data-theme',m)}e.style.colorScheme=r;}catch(_){}})();`;

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'auto';
}

export function getStoredThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'auto';
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemeMode(stored) ? stored : 'auto';
}

export function resolveThemeMode(mode: ThemeMode): 'light' | 'dark' {
  if (mode !== 'auto') return mode;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyThemeMode(mode: ThemeMode) {
  if (typeof document === 'undefined') return;
  const resolved = resolveThemeMode(mode);
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
  if (mode === 'auto') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', mode);
  }
  root.style.colorScheme = resolved;
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>('auto');
  const [resolved, setResolved] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const initial = getStoredThemeMode();
    setMode(initial);
    setResolved(resolveThemeMode(initial));
    applyThemeMode(initial);
  }, []);

  useEffect(() => {
    if (mode !== 'auto') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      applyThemeMode('auto');
      setResolved(resolveThemeMode('auto'));
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [mode]);

  function setThemeMode(next: ThemeMode) {
    setMode(next);
    setResolved(resolveThemeMode(next));
    applyThemeMode(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // ignore storage errors (private mode, etc.)
    }
  }

  function cycleThemeMode() {
    const next: ThemeMode = mode === 'light' ? 'dark' : mode === 'dark' ? 'auto' : 'light';
    setThemeMode(next);
  }

  return { mode, resolved, setThemeMode, cycleThemeMode };
}
