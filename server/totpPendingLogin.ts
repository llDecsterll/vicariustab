/*
 * Short-lived pending logins awaiting TOTP verification
 */
import crypto from "crypto";
import type { StoredUser } from "./dataStore.ts";

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

export interface PendingTotpLogin {
  userId: string;
  login: string;
  deviceFingerprint: string;
  browser: string;
  os: string;
  device: string;
  userAgent: string;
  email?: string;
  emailVerified?: boolean;
  emailNotificationsEnabled?: boolean;
  telegramChatId?: string;
  telegramNotificationsEnabled?: boolean;
  expiresAt: number;
}

const pending = new Map<string, PendingTotpLogin>();

function pruneExpired() {
  const now = Date.now();
  for (const [id, row] of pending) {
    if (row.expiresAt <= now) pending.delete(id);
  }
}

export function createTotpLoginChallenge(
  user: StoredUser,
  meta: Omit<PendingTotpLogin, "userId" | "login" | "expiresAt">
): { challengeId: string; expiresIn: number } {
  pruneExpired();
  const challengeId = crypto.randomBytes(24).toString("hex");
  pending.set(challengeId, {
    userId: user.id,
    login: user.login || user.email || user.name,
    expiresAt: Date.now() + CHALLENGE_TTL_MS,
    ...meta,
  });
  return { challengeId, expiresIn: CHALLENGE_TTL_MS };
}

export function consumeTotpLoginChallenge(challengeId: string): PendingTotpLogin | null {
  pruneExpired();
  const row = pending.get(challengeId);
  if (!row) return null;
  if (row.expiresAt <= Date.now()) {
    pending.delete(challengeId);
    return null;
  }
  pending.delete(challengeId);
  return row;
}

export function peekTotpLoginChallenge(challengeId: string): PendingTotpLogin | null {
  pruneExpired();
  const row = pending.get(challengeId);
  if (!row || row.expiresAt <= Date.now()) return null;
  return row;
}
