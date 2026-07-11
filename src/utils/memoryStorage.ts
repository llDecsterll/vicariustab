/*
 * In-memory storage — no browser persistence. Server DB is the source of truth.
 */

const store = new Map<string, string>();

export const memStorage = {
  getItem(key: string): string | null {
    return store.has(key) ? store.get(key)! : null;
  },
  setItem(key: string, value: string): void {
    store.set(key, String(value));
  },
  removeItem(key: string): void {
    store.delete(key);
  },
  key(index: number): string | null {
    const keys = [...store.keys()];
    return keys[index] ?? null;
  },
  get length(): number {
    return store.size;
  },
  clear(): void {
    store.clear();
  },
};

const LEGACY_PREFIXES = [
  'it_',
  'orbit_',
  'vicariustab_',
  '_ao_telemetry',
  'Vicariustab_',
  'sec_',
  'dashboard_',
];

/** Remove legacy Vicariustab keys from browser storage (one-time hygiene on load). */
export function purgeLegacyBrowserStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && LEGACY_PREFIXES.some((p) => k.startsWith(p) || k.includes(p))) {
        toRemove.push(k);
      }
    }
    for (const k of toRemove) localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
  try {
    const sessionKeys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (
        k &&
        k !== 'vt_session_id' &&
        LEGACY_PREFIXES.some((p) => k.startsWith(p) || k.includes(p))
      ) {
        sessionKeys.push(k);
      }
    }
    for (const k of sessionKeys) sessionStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}

export function parseMemJson<T>(key: string, fallback: T): T {
  try {
    const raw = memStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setMemJson(key: string, value: unknown): void {
  memStorage.setItem(key, JSON.stringify(value));
}

/** Workspace extension keys synced via /api/data payload. */
export const WORKSPACE_MEM_KEYS = {
  customWarranties: 'it_custom_warranties',
  deletedWarranties: 'it_deleted_warranties',
  manualWarranties: 'it_manual_warranties',
  customDepartments: 'it_custom_departments',
  removedDepartments: 'it_removed_departments',
} as const;

export function applyWorkspaceMemFieldsFromServer(data: Record<string, unknown>): void {
  const map: Record<string, string> = {
    customWarranties: WORKSPACE_MEM_KEYS.customWarranties,
    deletedWarranties: WORKSPACE_MEM_KEYS.deletedWarranties,
    manualWarranties: WORKSPACE_MEM_KEYS.manualWarranties,
    customDepartments: WORKSPACE_MEM_KEYS.customDepartments,
    removedDepartments: WORKSPACE_MEM_KEYS.removedDepartments,
  };
  for (const [field, memKey] of Object.entries(map)) {
    if (data[field] !== undefined) {
      setMemJson(memKey, data[field]);
    }
  }
}

export function getWorkspaceMemFieldsForPayload(): Record<string, unknown> {
  return {
    customWarranties: parseMemJson(WORKSPACE_MEM_KEYS.customWarranties, {}),
    deletedWarranties: parseMemJson(WORKSPACE_MEM_KEYS.deletedWarranties, []),
    manualWarranties: parseMemJson(WORKSPACE_MEM_KEYS.manualWarranties, []),
    customDepartments: parseMemJson(WORKSPACE_MEM_KEYS.customDepartments, []),
    removedDepartments: parseMemJson(WORKSPACE_MEM_KEYS.removedDepartments, []),
  };
}
