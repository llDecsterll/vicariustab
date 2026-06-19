/*
 * Session API client (all roles — server-verified credentials)
 */
import {
  authHeaders,
  clearSessionCredentials,
  collectDeviceClientInfo,
  storeSessionCredentials,
} from './deviceFingerprint';
import type { SystemUser, UserSession } from '../types';

export interface SessionLoginResult {
  sessionToken: string;
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

export async function authenticateCredentials(
  login: string,
  password: string,
  user?: SystemUser
): Promise<SessionLoginResult | null> {
  const device = collectDeviceClientInfo();
  try {
    const res = await fetch('/api/auth/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
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
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as SessionLoginResult;
    storeSessionCredentials(data.sessionToken, data.sessionId);
    return data;
  } catch {
    return null;
  }
}

/** @deprecated Use authenticateCredentials — kept for session refresh after reload */
export async function registerUserSession(
  user: SystemUser,
  prefs?: {
    emailVerified?: boolean;
    emailNotificationsEnabled?: boolean;
    telegramChatId?: string;
    telegramNotificationsEnabled?: boolean;
  }
): Promise<SessionLoginResult | null> {
  const login = user.login || user.email;
  const password = user.password;
  if (!login || !password) return null;
  return authenticateCredentials(login, password, {
    ...user,
    emailVerified: prefs?.emailVerified ?? user.emailVerified,
    emailNotificationsEnabled: prefs?.emailNotificationsEnabled ?? user.emailNotificationsEnabled,
    telegramChatId: prefs?.telegramChatId ?? user.telegramChatId,
    telegramNotificationsEnabled:
      prefs?.telegramNotificationsEnabled ?? user.telegramNotificationsEnabled,
  });
}

export async function sessionHeartbeat(): Promise<{
  ok: boolean;
  revoked?: boolean;
  notifications?: Array<{ id: string; title: string; body: string; meta: Record<string, unknown> }>;
}> {
  const token = authHeaders()['X-Session-Token'];
  if (!token) return { ok: false };
  try {
    const res = await fetch('/api/auth/heartbeat', {
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
    await fetch('/api/auth/logout', {
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
    const res = await fetch('/api/auth/sessions', { headers: authHeaders() });
    if (!res.ok) return [];
    const data = (await res.json()) as { sessions: UserSession[] };
    return data.sessions || [];
  } catch {
    return [];
  }
}

export async function revokeSessionById(sessionId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/auth/sessions/${encodeURIComponent(sessionId)}`, {
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
    const res = await fetch('/api/auth/sessions/revoke-others', {
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
    await fetch('/api/auth/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ ids }),
    });
  } catch {
    /* ignore */
  }
}
