/*
 * Session API client (all roles — server-verified credentials)
 */
import {
  authHeaders,
  clearSessionCredentials,
  collectDeviceClientInfo,
  sessionFetch,
  storeSessionCredentials,
} from './deviceFingerprint';
import { apiFetch } from './apiClient';
import type { SystemUser, UserSession } from '../types';

export interface SessionLoginResult {
  sessionId: string;
  userId: string;
  userName: string;
  userRole: SystemUser['role'];
  isNewDevice: boolean;
  session: UserSession;
  notification?: {
    id: string;
    title: string;
    body: string;
    meta: Record<string, unknown>;
  };
  dispatch?: {
    email?: { attempted: boolean; sent: boolean };
    telegram?: { attempted: boolean; sent: boolean };
  };
}

export interface TotpRequiredResult {
  kind: 'totp_required';
  challengeId: string;
  expiresIn: number;
}

export type AuthenticateResult =
  | ({ kind: 'session' } & SessionLoginResult)
  | TotpRequiredResult;

export interface TotpSetupBeginResult {
  secret: string;
  otpauthUrl: string;
  qrDataUrl?: string;
  revision?: number;
}

export type TotpSetupBeginResponse =
  | { ok: true; data: TotpSetupBeginResult }
  | { ok: false; error?: string; status: number };

export interface TotpStatusResult {
  enabled: boolean;
  pendingSetup: boolean;
  enabledAt: string | null;
}

function buildAuthBody(
  login: string,
  password: string,
  user?: SystemUser
): Record<string, unknown> {
  const device = collectDeviceClientInfo();
  return {
    login,
    password,
    deviceFingerprint: device.fingerprint,
    browser: device.browser,
    os: device.os,
    device: device.device,
    userAgent: device.userAgent,
    email: user?.email,
    emailVerified: user?.emailVerified ?? Boolean(user?.email?.includes('@')),
    emailNotificationsEnabled: user?.emailNotificationsEnabled ?? true,
    telegramChatId: user?.telegramChatId,
    telegramNotificationsEnabled: user?.telegramNotificationsEnabled,
  };
}

export async function authenticateCredentials(
  login: string,
  password: string,
  user?: SystemUser
): Promise<AuthenticateResult | null> {
  try {
    const res = await sessionFetch('/api/auth/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildAuthBody(login, password, user)),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    if (data.requiresTwoFactor) {
      return {
        kind: 'totp_required',
        challengeId: String(data.challengeId || ''),
        expiresIn: Number(data.expiresIn) || 300000,
      };
    }
    const session = data as unknown as SessionLoginResult;
    storeSessionCredentials('', session.sessionId);
    return { kind: 'session', ...session };
  } catch {
    return null;
  }
}

export async function verifyTotpLogin(
  challengeId: string,
  code: string
): Promise<SessionLoginResult | null> {
  try {
    const res = await sessionFetch('/api/auth/authenticate/totp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId, code }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as SessionLoginResult;
    storeSessionCredentials('', data.sessionId);
    return data;
  } catch {
    return null;
  }
}

export type TotpStatusResponse =
  | { ok: true; data: TotpStatusResult }
  | { ok: false; error: string; status: number };

export async function fetchTotpStatus(): Promise<TotpStatusResponse> {
  const result = await apiFetch<TotpStatusResult>('/api/auth/totp/status');
  if (result.ok === false) {
    return { ok: false, error: result.error, status: result.status };
  }
  return { ok: true, data: result.data };
}

export async function beginTotpSetup(): Promise<TotpSetupBeginResponse> {
  const result = await apiFetch<TotpSetupBeginResult>('/api/auth/totp/setup-begin', {
    method: 'POST',
  });
  if (result.ok === false) {
    return { ok: false, error: result.error, status: result.status };
  }
  return { ok: true, data: result.data };
}

export async function confirmTotpSetup(code: string): Promise<{ ok: boolean; error?: string; revision?: number }> {
  const result = await apiFetch<{ revision?: number }>('/api/auth/totp/setup-confirm', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
  if (result.ok === false) return { ok: false, error: result.error };
  return { ok: true, revision: result.data.revision };
}

export async function disableTotp(code: string): Promise<{ ok: boolean; error?: string; revision?: number }> {
  const result = await apiFetch<{ revision?: number }>('/api/auth/totp/disable', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
  if (result.ok === false) return { ok: false, error: result.error };
  return { ok: true, revision: result.data.revision };
}

export async function fetchCurrentSession(): Promise<SessionLoginResult | null> {
  try {
    const res = await sessionFetch('/api/auth/session');
    if (!res.ok) return null;
    const data = (await res.json()) as SessionLoginResult;
    if (data.sessionId) storeSessionCredentials('', data.sessionId);
    return data;
  } catch {
    return null;
  }
}

export async function sessionHeartbeat(): Promise<{
  ok: boolean;
  revoked?: boolean;
  notifications?: Array<{ id: string; title: string; body: string; meta: Record<string, unknown> }>;
}> {
  try {
    const res = await sessionFetch('/api/auth/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
    });
    if (res.status === 401) return { ok: false, revoked: true };
    if (!res.ok) return { ok: false };
    return (await res.json()) as { ok: boolean; notifications?: Array<{ id: string; title: string; body: string; meta: Record<string, unknown> }> };
  } catch {
    return { ok: false };
  }
}

export async function logoutUserSession(userName: string): Promise<void> {
  try {
    await sessionFetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ userName }),
    });
  } catch {
    /* ignore */
  }
  clearSessionCredentials();
}

export async function fetchActiveSessions(): Promise<UserSession[]> {
  try {
    const res = await sessionFetch('/api/auth/sessions', { headers: authHeaders() });
    if (!res.ok) return [];
    const data = (await res.json()) as { sessions: UserSession[] };
    return data.sessions || [];
  } catch {
    return [];
  }
}

export async function revokeSessionById(sessionId: string): Promise<boolean> {
  try {
    const res = await sessionFetch(`/api/auth/sessions/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function revokeAllOtherSessions(): Promise<number> {
  try {
    const res = await sessionFetch('/api/auth/sessions/revoke-others', {
      method: 'POST',
      headers: authHeaders(),
    });
    if (!res.ok) return 0;
    const data = (await res.json()) as { revokedCount?: number };
    return data.revokedCount || 0;
  } catch {
    return 0;
  }
}

export async function markSessionNotificationsRead(ids?: string[]): Promise<void> {
  try {
    await sessionFetch('/api/auth/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ ids }),
    });
  } catch {
    /* ignore */
  }
}
