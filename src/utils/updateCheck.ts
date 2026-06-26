/* Release */
import { APP_VERSION, VICARIUSTAB_UPDATE_REPO } from '../config/appConfig';
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
  updateSource?: string;
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

function compareSemver(a: string, b: string): number {
  const pa = a.replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function parseGithubRepo(repoUrl: string): { owner: string; repo: string } | null {
  const match = repoUrl.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/i);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

/** Browser fallback when legacy server has no /api/update/check or GitHub is blocked server-side. */
async function checkForPlatformUpdateViaRawGithub(): Promise<UpdateCheckResult | null> {
  const parsed = parseGithubRepo(VICARIUSTAB_UPDATE_REPO);
  if (!parsed) return null;
  const branch = 'main';
  try {
    const res = await fetch(
      `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${branch}/package.json`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    const pkg = (await res.json()) as { version?: string };
    const remoteVersion = String(pkg.version || '').trim();
    if (!remoteVersion) return null;
    const currentVersion = APP_VERSION;
    return {
      updateAvailable: compareSemver(remoteVersion, currentVersion) > 0,
      currentVersion,
      remoteVersion,
      repository: `${parsed.owner}/${parsed.repo}`,
      releaseUrl: `https://github.com/${parsed.owner}/${parsed.repo}`,
      checkedAt: new Date().toISOString(),
      updateSource: 'client-fallback',
    };
  } catch {
    return null;
  }
}

async function tryClientFallback(): Promise<UpdateCheckResult | null> {
  const fallback = await checkForPlatformUpdateViaRawGithub();
  if (!fallback) return null;
  markUpdateCheckTime();
  return fallback;
}

export async function checkForPlatformUpdate(): Promise<UpdateCheckResult | null> {
  const params = new URLSearchParams({
    installedCommit: getInstalledCommit(),
    currentVersion: APP_VERSION,
  });

  try {
    const res = await fetch(`/api/update/check?${params.toString()}`, { headers: authHeaders() });
    if (res.ok) {
      markUpdateCheckTime();
      return (await res.json()) as UpdateCheckResult;
    }
    // Legacy server without update API, or server cannot reach GitHub
    if (res.status === 404 || res.status === 500 || res.status === 502) {
      return tryClientFallback();
    }
    return null;
  } catch {
    return tryClientFallback();
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
