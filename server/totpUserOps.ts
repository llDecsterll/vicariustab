/*
 * Per-user TOTP secret storage in workspace (encrypted at rest)
 */
import {
  loadApplicationData,
  saveApplicationData,
  type StoredUser,
} from "./dataStore.ts";
import {
  generateTotpSecret,
  buildOtpAuthUri,
  verifyTotpCode,
} from "./totpEngine.ts";
import {
  clearPendingSetupSecret,
  getPendingSetupSecret,
  hasPendingSetup,
  setPendingSetupSecret,
} from "./totpPendingSetup.ts";
import { findUserByLogin } from "./dataStore.ts";

type EncryptFn = (text: string) => string;
type DecryptFn = (text: string) => string;

let encryptFn: EncryptFn = (t) => t;
let decryptFn: DecryptFn = (t) => t;

export function initTotpUserOps(encrypt: EncryptFn, decrypt: DecryptFn) {
  encryptFn = encrypt;
  decryptFn = decrypt;
}

export interface SessionUserRef {
  userId: string;
  userName: string;
}

export function isTwoFactorEnabled(user: StoredUser): boolean {
  return Boolean(user.twoFactorEnabled && user.totpSecretEnc);
}

function encryptSecret(secret: string): string {
  return encryptFn(secret);
}

function decryptSecret(enc: string): string {
  try {
    return decryptFn(enc);
  } catch {
    return "";
  }
}

async function updateUserById(
  userId: string,
  updater: (user: StoredUser) => StoredUser
): Promise<StoredUser | null> {
  const maxAttempts = 5;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data, revision } = await loadApplicationData();
    if (!data || !Array.isArray(data.users)) return null;
    const users = data.users as StoredUser[];
    const idx = users.findIndex((u) => u.id === userId);
    if (idx < 0) return null;
    const next = [...users];
    next[idx] = updater({ ...next[idx] });
    const expectedRevision = attempt < maxAttempts - 1 ? revision : null;
    const saved = await saveApplicationData({ ...data, users: next }, expectedRevision);
    if (saved.ok) return next[idx];
    if (!("conflict" in saved) || !saved.conflict) {
      throw new Error("Не удалось сохранить настройки 2FA");
    }
  }
  throw new Error("Не удалось сохранить настройки 2FA — повторите попытку");
}

export async function getUserById(userId: string): Promise<StoredUser | null> {
  const { data } = await loadApplicationData();
  if (!data || !Array.isArray(data.users)) return null;
  return (data.users as StoredUser[]).find((u) => u.id === userId) || null;
}

/** Match session to workspace user (handles stale userId after restore/import). */
export async function resolveUserForSession(ref: SessionUserRef): Promise<StoredUser | null> {
  const byId = await getUserById(ref.userId);
  if (byId) return byId;

  const { data } = await loadApplicationData();
  if (!data || !Array.isArray(data.users)) return null;
  const users = data.users as StoredUser[];
  const normalized = ref.userName.trim().toLowerCase();
  if (!normalized) return null;

  const byLogin = await findUserByLogin(ref.userName);
  if (byLogin) return byLogin;

  return (
    users.find((u) => u.login?.toLowerCase() === normalized) ||
    users.find((u) => u.email?.toLowerCase() === normalized) ||
    users.find((u) => u.name.trim().toLowerCase() === normalized) ||
    null
  );
}

export function hasTotpPendingSetup(user: StoredUser): boolean {
  return hasPendingSetup(user.id) || Boolean(user.totpPendingSecretEnc);
}

export interface TotpSetupBeginResult {
  secret: string;
  otpauthUrl: string;
}

function buildSetupResult(user: StoredUser, secret: string): TotpSetupBeginResult {
  const account = user.login || user.email || user.name;
  return { secret, otpauthUrl: buildOtpAuthUri(secret, account) };
}

export async function beginTotpSetup(ref: SessionUserRef): Promise<TotpSetupBeginResult | null> {
  const user = await resolveUserForSession(ref);
  if (!user) return null;
  if (isTwoFactorEnabled(user)) {
    throw new Error("Двухэтапная аутентификация уже включена");
  }

  let secret = getPendingSetupSecret(user.id);
  if (!secret && user.totpPendingSecretEnc) {
    secret = decryptSecret(user.totpPendingSecretEnc);
  }
  if (!secret) {
    secret = generateTotpSecret();
  }

  setPendingSetupSecret(user.id, secret);

  // Best-effort DB persist for resume after server restart (must not block setup UI).
  try {
    await updateUserById(user.id, (u) => ({
      ...u,
      totpPendingSecretEnc: encryptSecret(secret),
      twoFactorEnabled: false,
      totpSecretEnc: undefined,
    }));
  } catch (err) {
    console.warn("TOTP pending DB persist skipped:", err);
  }

  return buildSetupResult(user, secret);
}

export async function confirmTotpSetup(ref: SessionUserRef, code: string): Promise<boolean> {
  const user = await resolveUserForSession(ref);
  if (!user) {
    throw new Error("Учётная запись не найдена");
  }

  let secret = getPendingSetupSecret(user.id);
  let pendingEnc = user.totpPendingSecretEnc;
  if (!secret && pendingEnc) {
    secret = decryptSecret(pendingEnc);
  }
  if (!secret) {
    throw new Error("Сначала начните настройку двухэтапной аутентификации");
  }
  if (!verifyTotpCode(secret, code)) {
    return false;
  }

  const secretEnc = pendingEnc || encryptSecret(secret);
  await updateUserById(user.id, (u) => ({
    ...u,
    twoFactorEnabled: true,
    totpSecretEnc: secretEnc,
    totpPendingSecretEnc: undefined,
    totpEnabledAt: new Date().toISOString(),
  }));
  clearPendingSetupSecret(user.id);
  return true;
}

export async function disableTotp(ref: SessionUserRef, code: string): Promise<boolean> {
  const user = await resolveUserForSession(ref);
  if (!user?.totpSecretEnc) {
    throw new Error("Двухэтапная аутентификация не включена");
  }
  const secret = decryptSecret(user.totpSecretEnc);
  if (!secret || !verifyTotpCode(secret, code)) {
    return false;
  }

  await updateUserById(user.id, (u) => ({
    ...u,
    twoFactorEnabled: false,
    totpSecretEnc: undefined,
    totpPendingSecretEnc: undefined,
    totpEnabledAt: undefined,
  }));
  clearPendingSetupSecret(user.id);
  return true;
}

export async function verifyUserTotpCode(user: StoredUser, code: string): Promise<boolean> {
  if (!user.totpSecretEnc) return false;
  const secret = decryptSecret(user.totpSecretEnc);
  if (!secret) return false;
  return verifyTotpCode(secret, code);
}

export function preserveTotpFields(next: StoredUser, prev?: StoredUser): StoredUser {
  if (!prev) {
    delete next.totpSecretEnc;
    delete next.totpPendingSecretEnc;
    delete next.twoFactorEnabled;
    delete next.totpEnabledAt;
    return next;
  }
  next.totpSecretEnc = prev.totpSecretEnc;
  next.totpPendingSecretEnc = prev.totpPendingSecretEnc;
  next.twoFactorEnabled = prev.twoFactorEnabled;
  next.totpEnabledAt = prev.totpEnabledAt;
  return next;
}
