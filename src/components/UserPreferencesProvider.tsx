import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import type { UserPreferences } from '../types';
import { useTranslation, LanguagePersistProvider } from '../utils/i18n';
import {
  collectLocalPreferencesMigration,
  hasAnyUserPreferences,
  patchUserPreferences,
} from '../utils/userPreferences';

interface UserPreferencesContextValue {
  userId: string;
  preferences: UserPreferences | undefined;
  persistPreferences: (patch: Partial<UserPreferences>) => void;
}

const UserPreferencesContext = createContext<UserPreferencesContextValue | null>(null);

export function useUserPreferences(): UserPreferencesContextValue {
  const ctx = useContext(UserPreferencesContext);
  if (!ctx) {
    throw new Error('useUserPreferences must be used within UserPreferencesProvider');
  }
  return ctx;
}

export function useUserPreferencesOptional(): UserPreferencesContextValue | null {
  return useContext(UserPreferencesContext);
}

function UserPreferencesLanguageSync() {
  const { preferences, userId } = useUserPreferences();
  const { language, applyLanguage } = useTranslation();
  const userIdRef = useRef(userId);

  useEffect(() => {
    if (userIdRef.current !== userId) {
      userIdRef.current = userId;
    }
    const target = preferences?.language;
    if (target && target !== language) {
      applyLanguage(target);
    }
  }, [userId, preferences?.language, language, applyLanguage]);

  return null;
}

interface UserPreferencesProviderProps {
  userId: string;
  preferences: UserPreferences | undefined;
  dataRevision: number | null;
  onSaved: (prefs: UserPreferences, revision: number) => void;
  children: React.ReactNode;
}

export function UserPreferencesProvider({
  userId,
  preferences,
  dataRevision,
  onSaved,
  children,
}: UserPreferencesProviderProps) {
  const revisionRef = useRef(dataRevision);
  revisionRef.current = dataRevision;

  const prefsRef = useRef(preferences);
  prefsRef.current = preferences;

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<Partial<UserPreferences>>({});
  const flushInFlightRef = useRef(false);

  const flush = useCallback(async () => {
    if (flushInFlightRef.current) return;
    const patch = { ...pendingRef.current };
    pendingRef.current = {};
    if (Object.keys(patch).length === 0) return;

    flushInFlightRef.current = true;
    try {
      const result = await patchUserPreferences(patch, revisionRef.current);
      if (result.ok) {
        revisionRef.current = result.revision;
        prefsRef.current = result.preferences;
        onSaved(result.preferences, result.revision);
      }
    } finally {
      flushInFlightRef.current = false;
      if (Object.keys(pendingRef.current).length > 0) {
        void flush();
      }
    }
  }, [onSaved]);

  const persistPreferences = useCallback(
    (patch: Partial<UserPreferences>) => {
      pendingRef.current = { ...pendingRef.current, ...patch };
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void flush();
      }, 450);
    },
    [flush]
  );

  useEffect(() => {
    if (hasAnyUserPreferences(preferences)) return;
    const migrationKey = `vicariustab_prefs_migrated:${userId}`;
    try {
      if (sessionStorage.getItem(migrationKey)) return;
    } catch {
      /* ignore */
    }

    const local = collectLocalPreferencesMigration(userId);
    if (Object.keys(local).length === 0) return;

    void (async () => {
      const result = await patchUserPreferences(local, revisionRef.current);
      if (result.ok) {
        revisionRef.current = result.revision;
        prefsRef.current = result.preferences;
        onSaved(result.preferences, result.revision);
        try {
          sessionStorage.setItem(migrationKey, '1');
        } catch {
          /* ignore */
        }
      }
    })();
  }, [userId, preferences, onSaved]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      const patch = { ...pendingRef.current };
      pendingRef.current = {};
      if (Object.keys(patch).length > 0) {
        void patchUserPreferences(patch, revisionRef.current);
      }
    };
  }, [userId]);

  const value = useMemo(
    () => ({
      userId,
      preferences,
      persistPreferences,
    }),
    [userId, preferences, persistPreferences]
  );

  return (
    <UserPreferencesContext.Provider value={value}>
      <UserPreferencesLanguageSync />
      <LanguagePersistProvider
        onPersist={(lang) => persistPreferences({ language: lang })}
      >
        {children}
      </LanguagePersistProvider>
    </UserPreferencesContext.Provider>
  );
}
