/*
 * Device fingerprint + UA parsing for session security
 */
import { getHardwareFingerprint } from './license';

export interface DeviceClientInfo {
  fingerprint: string;
  browser: string;
  os: string;
  device: string;
  userAgent: string;
}

export function parseUserAgent(ua: string): { browser: string; os: string; device: string } {
  const agent = ua || navigator.userAgent || 'Unknown';

  let browser = 'Unknown Browser';
  if (/Edg\//i.test(agent)) browser = `Edge ${extractVersion(agent, /Edg\/([\d.]+)/)}`;
  else if (/Chrome\//i.test(agent) && !/Chromium/i.test(agent)) browser = `Chrome ${extractVersion(agent, /Chrome\/([\d.]+)/)}`;
  else if (/Firefox\//i.test(agent)) browser = `Firefox ${extractVersion(agent, /Firefox\/([\d.]+)/)}`;
  else if (/Safari\//i.test(agent) && /Version\//i.test(agent)) browser = `Safari ${extractVersion(agent, /Version\/([\d.]+)/)}`;

  let os = 'Unknown OS';
  const macMatch = agent.match(/Mac OS X ([\d_]+)/i);
  const androidMatch = agent.match(/Android ([\d.]+)/i);
  const iosMatch = agent.match(/iPhone OS ([\d_]+)/i);
  if (/Windows NT 10/i.test(agent)) os = 'Windows 10/11';
  else if (/Windows NT 6.3/i.test(agent)) os = 'Windows 8.1';
  else if (/Windows NT 6.1/i.test(agent)) os = 'Windows 7';
  else if (macMatch) os = `macOS ${macMatch[1].replace(/_/g, '.')}`;
  else if (androidMatch) os = `Android ${androidMatch[1]}`;
  else if (iosMatch) os = `iOS ${iosMatch[1].replace(/_/g, '.')}`;
  else if (/Linux/i.test(agent)) os = 'Linux';

  let device = 'Desktop';
  if (/Mobile|Android|iPhone|iPod/i.test(agent)) device = 'Mobile';
  else if (/iPad|Tablet/i.test(agent)) device = 'Tablet';

  return { browser, os, device };
}

function extractVersion(ua: string, re: RegExp): string {
  const m = ua.match(re);
  return m?.[1]?.split('.')[0] || '';
}

export function collectDeviceClientInfo(): DeviceClientInfo {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
  const parsed = parseUserAgent(userAgent);
  return {
    fingerprint: getHardwareFingerprint(),
    userAgent,
    ...parsed,
  };
}

export const SESSION_TOKEN_KEY = 'vt_session_token';
export const SESSION_ID_KEY = 'vt_session_id';

export function getStoredSessionToken(): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  return sessionStorage.getItem(SESSION_TOKEN_KEY);
}

export function storeSessionCredentials(token: string, sessionId: string) {
  sessionStorage.setItem(SESSION_TOKEN_KEY, token);
  sessionStorage.setItem(SESSION_ID_KEY, sessionId);
}

export function clearSessionCredentials() {
  sessionStorage.removeItem(SESSION_TOKEN_KEY);
  sessionStorage.removeItem(SESSION_ID_KEY);
}

export function authHeaders(): Record<string, string> {
  const token = getStoredSessionToken();
  if (!token) return {};
  return { 'X-Session-Token': token };
}
