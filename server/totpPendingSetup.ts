/*
 * In-memory pending TOTP setup secrets (avoids workspace revision conflicts during setup-begin)
 */
const SETUP_TTL_MS = 30 * 60 * 1000;

interface PendingSetupRow {
  secret: string;
  expiresAt: number;
}

const pendingByUserId = new Map<string, PendingSetupRow>();

function pruneExpired() {
  const now = Date.now();
  for (const [userId, row] of pendingByUserId) {
    if (row.expiresAt <= now) pendingByUserId.delete(userId);
  }
}

export function setPendingSetupSecret(userId: string, secret: string): void {
  pruneExpired();
  pendingByUserId.set(userId, {
    secret,
    expiresAt: Date.now() + SETUP_TTL_MS,
  });
}

export function getPendingSetupSecret(userId: string): string | null {
  pruneExpired();
  const row = pendingByUserId.get(userId);
  if (!row || row.expiresAt <= Date.now()) {
    pendingByUserId.delete(userId);
    return null;
  }
  return row.secret;
}

export function hasPendingSetup(userId: string): boolean {
  return getPendingSetupSecret(userId) !== null;
}

export function clearPendingSetupSecret(userId: string): void {
  pendingByUserId.delete(userId);
}
