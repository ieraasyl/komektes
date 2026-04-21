import { useSyncExternalStore } from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';
type ResolvedThemeMode = 'light' | 'dark';
type ThemeSnapshot = {
  mode: ThemeMode;
  resolved: ResolvedThemeMode;
};

export const THEME_STORAGE_KEY = 'theme';
const THEME_MEDIA_QUERY = '(prefers-color-scheme: dark)';
const DEFAULT_THEME_SNAPSHOT: ThemeSnapshot = { mode: 'auto', resolved: 'light' };
const themeListeners = new Set<() => void>();

let activeThemeStoreCleanup: (() => void) | null = null;
let currentThemeMode: ThemeMode | null = null;

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
  return window.matchMedia(THEME_MEDIA_QUERY).matches ? 'dark' : 'light';
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

function createThemeSnapshot(mode: ThemeMode): ThemeSnapshot {
  return { mode, resolved: resolveThemeMode(mode) };
}

function getCurrentThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'auto';
  if (currentThemeMode === null) {
    currentThemeMode = getStoredThemeMode();
  }
  return currentThemeMode;
}

function emitThemeChange() {
  themeListeners.forEach((listener) => listener());
}

function ensureThemeStore() {
  if (activeThemeStoreCleanup || typeof window === 'undefined') return;

  applyThemeMode(getCurrentThemeMode());

  const media = window.matchMedia(THEME_MEDIA_QUERY);
  const handleMediaChange = () => {
    if (getCurrentThemeMode() !== 'auto') return;
    applyThemeMode('auto');
    emitThemeChange();
  };
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key && event.key !== THEME_STORAGE_KEY) return;
    currentThemeMode = getStoredThemeMode();
    applyThemeMode(currentThemeMode);
    emitThemeChange();
  };

  media.addEventListener('change', handleMediaChange);
  window.addEventListener('storage', handleStorageChange);

  activeThemeStoreCleanup = () => {
    media.removeEventListener('change', handleMediaChange);
    window.removeEventListener('storage', handleStorageChange);
    activeThemeStoreCleanup = null;
  };
}

function subscribeToTheme(listener: () => void) {
  themeListeners.add(listener);
  ensureThemeStore();

  return () => {
    themeListeners.delete(listener);
    if (themeListeners.size === 0) {
      activeThemeStoreCleanup?.();
    }
  };
}

function getThemeSnapshot(): ThemeSnapshot {
  return createThemeSnapshot(getCurrentThemeMode());
}

export function useTheme() {
  const { mode, resolved } = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    () => DEFAULT_THEME_SNAPSHOT,
  );

  function setThemeMode(next: ThemeMode) {
    currentThemeMode = next;
    applyThemeMode(next);
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
      }
    } catch {
      // ignore storage errors (private mode, etc.)
    }
    emitThemeChange();
  }

  function cycleThemeMode() {
    const next: ThemeMode = mode === 'light' ? 'dark' : mode === 'dark' ? 'auto' : 'light';
    setThemeMode(next);
  }

  return { mode, resolved, setThemeMode, cycleThemeMode };
}
