/*
 * Application data load/save with revision (optimistic locking)
 */
import fs from "fs";
import path from "path";

export interface DataStoreDeps {
  encrypt: (text: string) => string;
  decrypt: (text: string) => string;
  dbPath: string;
  metaPath: string;
  readDbConfig: () => Record<string, unknown>;
  loadFromSql: (config: Record<string, unknown>) => Promise<Record<string, unknown> | null>;
  saveToSql: (config: Record<string, unknown>, payload: Record<string, unknown>) => Promise<void>;
}

let deps: DataStoreDeps | null = null;

export function initDataStore(storeDeps: DataStoreDeps): void {
  deps = storeDeps;
}

function requireDeps(): DataStoreDeps {
  if (!deps) throw new Error("dataStore not initialized");
  return deps;
}

interface StoreMeta {
  revision: number;
  updatedAt: string;
}

function readMeta(): StoreMeta {
  const { metaPath } = requireDeps();
  try {
    if (fs.existsSync(metaPath)) {
      const parsed = JSON.parse(fs.readFileSync(metaPath, "utf-8")) as StoreMeta;
      if (typeof parsed.revision === "number") return parsed;
    }
  } catch {
    /* reset */
  }
  return { revision: 0, updatedAt: new Date(0).toISOString() };
}

function writeMeta(meta: StoreMeta): void {
  const { metaPath } = requireDeps();
  const dir = path.dirname(metaPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmp = `${metaPath}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(meta), "utf-8");
  fs.renameSync(tmp, metaPath);
}

export function getDataRevision(): number {
  return readMeta().revision;
}

export async function loadApplicationData(): Promise<{
  data: Record<string, unknown> | null;
  revision: number;
}> {
  const d = requireDeps();
  const revision = readMeta().revision;
  const config = d.readDbConfig();

  if (config.type === "mysql" || config.type === "postgres") {
    try {
      const sqlData = await d.loadFromSql(config);
      if (sqlData) return { data: sqlData, revision };
    } catch (err) {
      console.error("SQL load error, falling back to local file", err);
    }
  }

  if (fs.existsSync(d.dbPath)) {
    const fileContent = fs.readFileSync(d.dbPath, "utf-8").trim();
    if (!fileContent) return { data: null, revision };

    if (fileContent.startsWith("{")) {
      const raw = JSON.parse(fileContent) as Record<string, unknown>;
      const encryptedRaw = d.encrypt(fileContent);
      fs.writeFileSync(d.dbPath, encryptedRaw, "utf-8");
      return { data: raw, revision };
    }

    const decrypted = d.decrypt(fileContent);
    return { data: JSON.parse(decrypted) as Record<string, unknown>, revision };
  }

  return { data: null, revision };
}

export type SaveResult =
  | { ok: true; revision: number }
  | { ok: false; conflict: true; revision: number; data: Record<string, unknown> | null };

export async function saveApplicationData(
  payload: Record<string, unknown>,
  expectedRevision: number | null
): Promise<SaveResult> {
  const d = requireDeps();
  const meta = readMeta();

  if (expectedRevision !== null && expectedRevision !== meta.revision) {
    const current = await loadApplicationData();
    return {
      ok: false,
      conflict: true,
      revision: meta.revision,
      data: current.data,
    };
  }

  const config = d.readDbConfig();
  if (config.type === "mysql" || config.type === "postgres") {
    await d.saveToSql(config, payload);
  }

  const rawString = JSON.stringify(payload, null, 2);
  const encryptedData = d.encrypt(rawString);
  fs.writeFileSync(d.dbPath, encryptedData, "utf-8");

  const nextMeta: StoreMeta = {
    revision: meta.revision + 1,
    updatedAt: new Date().toISOString(),
  };
  writeMeta(nextMeta);
  return { ok: true, revision: nextMeta.revision };
}

export interface StoredUser {
  id: string;
  name: string;
  email?: string;
  login?: string;
  password?: string;
  passwordHash?: string;
  role: "Admin" | "Editor" | "Viewer";
  isBlocked?: boolean;
  avatarUrl?: string;
  emailVerified?: boolean;
  emailNotificationsEnabled?: boolean;
  telegramChatId?: string;
  telegramNotificationsEnabled?: boolean;
  preferences?: import("../src/types.ts").UserPreferences;
  /** TOTP 2FA — server-only fields */
  twoFactorEnabled?: boolean;
  totpSecretEnc?: string;
  totpPendingSecretEnc?: string;
  totpEnabledAt?: string;
}

function matchesLogin(user: StoredUser, normalized: string): boolean {
  if (user.login && user.login.toLowerCase() === normalized) return true;
  if (user.email && user.email.toLowerCase() === normalized) return true;
  return false;
}

export async function findUserByLogin(login: string): Promise<StoredUser | null> {
  const { data } = await loadApplicationData();
  const users = Array.isArray(data?.users) ? (data!.users as StoredUser[]) : [];
  if (users.length === 0) return null;
  const normalized = login.trim().toLowerCase();
  return users.find((u) => matchesLogin(u, normalized)) || null;
}
