export type ThemeMode = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'it_theme_mode';

export function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

/** Fixed light theme for the application UI. */
export function getStoredThemeMode(): ThemeMode {
  return 'light';
}

export function resolveTheme(_mode: ThemeMode): 'light' {
  return 'light';
}

export function applyTheme(mode: ThemeMode): 'light' {
  if (typeof document === 'undefined') return 'light';

  const root = document.documentElement;
  root.classList.remove('dark');
  root.dataset.themeMode = mode;
  root.dataset.themeResolved = 'light';
  return 'light';
}

export function initTheme(): () => void {
  applyTheme('light');
  return () => undefined;
}

export function setThemeMode(_mode: ThemeMode): 'light' {
  return applyTheme('light');
}
