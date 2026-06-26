import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  ThemeMode,
  getStoredThemeMode,
  initTheme,
  resolveTheme,
  setThemeMode as persistThemeMode,
} from './theme';

interface ThemeContextValue {
  themeMode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => getStoredThemeMode());
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => resolveTheme(getStoredThemeMode()));

  useEffect(() => {
    const cleanup = initTheme();
    setResolvedTheme(resolveTheme(getStoredThemeMode()));
    return cleanup;
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    const resolved = persistThemeMode(mode);
    setResolvedTheme(resolved);
  }, []);

  const value = useMemo(
    () => ({ themeMode, resolvedTheme, setThemeMode }),
    [themeMode, resolvedTheme, setThemeMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
