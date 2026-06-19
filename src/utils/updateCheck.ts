/* Release */
import { APP_VERSION } from '../config/appConfig';

export interface UpdateCheckResult {
  updateAvailable: boolean;
  currentVersion: string;
  remoteVersion: string;
  latestTag?: string;
  latestCommitSha?: string;
  releaseUrl?: string;
  repository?: string;
}

const INSTALLED_COMMIT_KEY = 'it_installed_commit';

export function getInstalledCommit(): string {
  return localStorage.getItem(INSTALLED_COMMIT_KEY) || '';
}

export function markInstalledCommit(sha: string): void {
  if (sha) localStorage.setItem(INSTALLED_COMMIT_KEY, sha);
}

export async function checkForPlatformUpdate(): Promise<UpdateCheckResult | null> {
  try {
    const params = new URLSearchParams({
      installedCommit: getInstalledCommit(),
      currentVersion: APP_VERSION,
    });
    const res = await fetch(`/api/update/check?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) return null;
    return data as UpdateCheckResult;
  } catch {
    return null;
  }
}

export function buildUpdateNotificationText(result: UpdateCheckResult): string {
  const remote = result.remoteVersion || result.latestTag || result.latestCommitSha || '?';
  return `Доступно обновление Vicariustab: v${remote} (установлена v${result.currentVersion || APP_VERSION}). Откройте Настройки → Центр обновлений.`;
}
