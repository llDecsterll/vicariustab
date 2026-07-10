import type { UserDashboardLayoutPreference, UserPreferences } from '../types';
import { apiFetch, setDataRevisionHeader } from './apiClient';

export type PatchUserPreferencesResult =
  | { ok: true; preferences: UserPreferences; revision: number }
  | { ok: false; error: string; status: number; code?: string };

export async function patchUserPreferences(
  patch: Partial<UserPreferences>,
  revision: number | null,
  maxRetries = 1
): Promise<PatchUserPreferencesResult> {
  let attemptRevision = revision;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await apiFetch<{
      success?: boolean;
      revision?: number;
      preferences?: UserPreferences;
    }>('/api/user/preferences', {
      method: 'PATCH',
      headers: setDataRevisionHeader(attemptRevision),
      body: JSON.stringify(patch),
    });

    if (result.ok) {
      const rev = result.data?.revision;
      const preferences = result.data?.preferences;
      if (typeof rev === 'number' && preferences && typeof preferences === 'object') {
        return { ok: true, preferences, revision: rev };
      }
      return { ok: false, error: 'Invalid server response', status: result.status };
    }

    const failed = result as Extract<typeof result, { ok: false }>;
    if (failed.conflict && attempt < maxRetries) {
      const conflict = (
        failed.payload && typeof failed.payload === 'object' ? failed.payload : {}
      ) as { revision?: number };
      if (typeof conflict.revision === 'number') {
        attemptRevision = conflict.revision;
        continue;
      }
    }

    return {
      ok: false,
      error: failed.error || 'Save failed',
      status: failed.status,
      code: failed.code,
    };
  }

  return { ok: false, error: 'Save failed', status: 0 };
}

export function collectLocalPreferencesMigration(userId: string): Partial<UserPreferences> {
  const out: Partial<UserPreferences> = {};

  try {
    const lang = localStorage.getItem('orbit_lang');
    if (lang === 'ru' || lang === 'en' || lang === 'zh') {
      out.language = lang;
    }
  } catch {
    /* ignore */
  }

  try {
    const keyed = localStorage.getItem(`vicariustab_dashboard_layout_v11:${userId}`);
    const legacy = localStorage.getItem('vicariustab_dashboard_layout_v11');
    const raw = keyed || legacy;
    if (raw) {
      const parsed = JSON.parse(raw) as { version?: number; items?: unknown[] };
      if (parsed.version === 11 && Array.isArray(parsed.items) && parsed.items.length > 0) {
        out.dashboardLayout = { version: 11, items: parsed.items } as UserDashboardLayoutPreference;
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const auditId = localStorage.getItem('dashboard_selected_audit_id');
    if (auditId && auditId.length <= 128) {
      out.dashboardSelectedAuditId = auditId;
    }
  } catch {
    /* ignore */
  }

  return out;
}

export function hasAnyUserPreferences(prefs: UserPreferences | undefined): boolean {
  if (!prefs) return false;
  return Boolean(prefs.language || prefs.dashboardLayout || prefs.dashboardSelectedAuditId);
}
