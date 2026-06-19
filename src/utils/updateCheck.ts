/* Release */
import { APP_VERSION } from '../config/appConfig';
import { authHeaders } from './deviceFingerprint';

export interface UpdateCheckResult {
  updateAvailable: boolean;
  currentVersion: string;
  remoteVersion: string;
  latestTag?: string;
  latestCommitSha?: string;
  releaseUrl?: string;
  repository?: string;
  checkedAt?: string;
}

export interface UpdateJobStatus {
  status: 'idle' | 'running' | 'completed' | 'failed';
  progress: number;
  step: string;
  logs: string[];
  error?: string;
  backupDir?: string;
  remoteVersion?: string;
  latestCommitSha?: string;
}

const INSTALLED_COMMIT_KEY = 'it_installed_commit';
const NOTIFIED_VERSION_KEY = 'it_update_notified_version';
const LAST_CHECK_KEY = 'it_update_last_check_at';

export function getInstalledCommit(): string {
  return localStorage.getItem(INSTALLED_COMMIT_KEY) || '';
}

export function markInstalledCommit(sha: string): void {
  if (sha) localStorage.setItem(INSTALLED_COMMIT_KEY, sha);
}

export function shouldNotifyForUpdate(remoteVersion: string): boolean {
  return localStorage.getItem(NOTIFIED_VERSION_KEY) !== remoteVersion;
}

export function markUpdateNotified(remoteVersion: string): void {
  localStorage.setItem(NOTIFIED_VERSION_KEY, remoteVersion);
}

export function markUpdateCheckTime(): void {
  localStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());
}

export async function checkForPlatformUpdate(): Promise<UpdateCheckResult | null> {
  try {
    const params = new URLSearchParams({
      installedCommit: getInstalledCommit(),
      currentVersion: APP_VERSION,
    });
    const res = await fetch(`/api/update/check?${params.toString()}`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) return null;
    markUpdateCheckTime();
    return data as UpdateCheckResult;
  } catch {
    return null;
  }
}

export async function applyPlatformUpdate(): Promise<{ started: boolean; error?: string }> {
  try {
    const res = await fetch('/api/update/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ installedCommit: getInstalledCommit() }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { started: false, error: data?.error || 'Failed to start update' };
    }
    return { started: true };
  } catch (err: any) {
    return { started: false, error: err?.message || 'Network error' };
  }
}

export async function fetchUpdateJobStatus(): Promise<UpdateJobStatus | null> {
  try {
    const res = await fetch('/api/update/status', { headers: authHeaders() });
    if (!res.ok) return null;
    return (await res.json()) as UpdateJobStatus;
  } catch {
    return null;
  }
}

export function buildUpdateNotificationText(result: UpdateCheckResult): string {
  const remote = result.remoteVersion || result.latestTag || result.latestCommitSha || '?';
  return `Доступно обновление Vicariustab: v${remote} (установлена v${result.currentVersion || APP_VERSION}). Откройте Настройки → Центр обновлений.`;
}

export function buildUpdateCompletedText(remoteVersion?: string): string {
  return `Обновление Vicariustab v${remoteVersion || 'новая версия'} установлено. Платформа перезапускается — данные сохранены.`;
}
