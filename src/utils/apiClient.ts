/*
 * Authenticated API client
 */
import { authHeaders, clearSessionCredentials } from './deviceFingerprint';

export type ApiFetchResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; status: number; error: string; code?: string; conflict?: boolean; payload?: unknown };

export async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<ApiFetchResult<T>> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
    ...authHeaders(),
  };
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(url, { ...options, headers });
    const text = await res.text();
    let parsed: unknown = null;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }

    if (res.status === 401) {
      clearSessionCredentials();
      window.dispatchEvent(new CustomEvent('Vicariustab-auth-expired'));
    }

    if (!res.ok) {
      const errObj = (parsed && typeof parsed === 'object' ? parsed : {}) as Record<string, unknown>;
      return {
        ok: false,
        status: res.status,
        error: String(errObj.error || res.statusText || 'Request failed'),
        code: typeof errObj.code === 'string' ? errObj.code : undefined,
        conflict: res.status === 409,
        payload: parsed,
      };
    }

    return { ok: true, data: parsed as T, status: res.status };
  } catch {
    return { ok: false, status: 0, error: 'Network error' };
  }
}

export function setDataRevisionHeader(revision: number | null): Record<string, string> {
  if (revision === null || revision === undefined) return {};
  return { 'X-Data-Revision': String(revision) };
}
