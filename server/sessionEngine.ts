/*
 * Vicariustab — server-side session registry (fingerprint + token hash)
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface UserSessionRecord {
  id: string;
  userId: string;
  userName: string;
  userRole: "Admin" | "Editor" | "Viewer";
  tokenHash: string;
  deviceFingerprint: string;
  ipAddress: string;
  country?: string;
  city?: string;
  browser: string;
  os: string;
  device: string;
  userAgent: string;
  createdAt: string;
  lastActivityAt: string;
  status: "active" | "revoked" | "expired";
}

export interface SessionNotificationRecord {
  id: string;
  userId: string;
  createdAt: string;
  read: boolean;
  title: string;
  body: string;
  meta: {
    sessionId: string;
    ipAddress: string;
    country?: string;
    city?: string;
    browser: string;
    os: string;
    device: string;
    loginAt: string;
  };
}

export interface SessionStoreData {
  sessions: Record<string, UserSessionRecord>;
  userIndex: Record<string, string[]>;
  notifications: SessionNotificationRecord[];
  auditEvents: SessionAuditEvent[];
}

export interface SessionAuditEvent {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  detail: string;
  ipAddress?: string;
}

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_NOTIFICATIONS_PER_USER = 100;
const MAX_AUDIT_EVENTS = 500;

let store: SessionStoreData = {
  sessions: {},
  userIndex: {},
  notifications: [],
  auditEvents: [],
};

let storePath = "";
let encryptFn: (text: string) => string = (t) => t;
let decryptFn: (text: string) => string = (t) => t;

export function initSessionEngine(
  dataDir: string,
  encrypt: (text: string) => string,
  decrypt: (text: string) => string
) {
  storePath = path.join(dataDir, "sessions_store.enc");
  encryptFn = encrypt;
  decryptFn = decrypt;
  loadStore();
}

function loadStore() {
  try {
    if (!fs.existsSync(storePath)) return;
    const raw = fs.readFileSync(storePath, "utf-8").trim();
    if (!raw) return;
    const decrypted = raw.startsWith("{") ? raw : decryptFn(raw);
    const parsed = JSON.parse(decrypted) as SessionStoreData;
    if (parsed && typeof parsed === "object") {
      store = {
        sessions: parsed.sessions || {},
        userIndex: parsed.userIndex || {},
        notifications: parsed.notifications || [],
        auditEvents: parsed.auditEvents || [],
      };
    }
  } catch (err) {
    console.error("[Sessions] Failed to load store:", err);
  }
}

function persistStore() {
  try {
    const payload = JSON.stringify(store, null, 2);
    fs.writeFileSync(storePath, encryptFn(payload), "utf-8");
  } catch (err) {
    console.error("[Sessions] Failed to persist store:", err);
  }
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function pruneExpiredSessions() {
  const now = Date.now();
  let changed = false;
  for (const session of Object.values(store.sessions)) {
    if (session.status !== "active") continue;
    const last = new Date(session.lastActivityAt).getTime();
    if (now - last > SESSION_TTL_MS) {
      session.status = "expired";
      changed = true;
    }
  }
  if (changed) persistStore();
}

function addAudit(userId: string, userName: string, action: string, detail: string, ipAddress?: string) {
  store.auditEvents.unshift({
    id: `sess-audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    userId,
    userName,
    action,
    detail,
    ipAddress,
  });
  if (store.auditEvents.length > MAX_AUDIT_EVENTS) {
    store.auditEvents = store.auditEvents.slice(0, MAX_AUDIT_EVENTS);
  }
}

export function getSessionAuditEvents(limit = 200): SessionAuditEvent[] {
  return store.auditEvents.slice(0, limit);
}

export interface LoginSessionInput {
  userId: string;
  userName: string;
  userRole: "Admin" | "Editor" | "Viewer";
  deviceFingerprint: string;
  ipAddress: string;
  country?: string;
  city?: string;
  browser: string;
  os: string;
  device: string;
  userAgent: string;
}

export interface LoginSessionResult {
  sessionToken: string;
  sessionId: string;
  isNewDevice: boolean;
  session: Omit<UserSessionRecord, "tokenHash">;
  notification?: SessionNotificationRecord;
}

export function registerLogin(input: LoginSessionInput): LoginSessionResult {
  pruneExpiredSessions();

  const userSessions = (store.userIndex[input.userId] || [])
    .map((id) => store.sessions[id])
    .filter(Boolean) as UserSessionRecord[];

  const knownActive = userSessions.find(
    (s) =>
      s.status === "active" &&
      s.deviceFingerprint === input.deviceFingerprint
  );

  if (knownActive) {
    knownActive.lastActivityAt = new Date().toISOString();
    knownActive.ipAddress = input.ipAddress;
    if (input.country) knownActive.country = input.country;
    if (input.city) knownActive.city = input.city;
    persistStore();

    const token = generateSessionToken();
    knownActive.tokenHash = hashToken(token);

    addAudit(
      input.userId,
      input.userName,
      "Вход в систему",
      `Повторный вход с известного устройства (${input.browser}, ${input.os}). IP: ${input.ipAddress}`,
      input.ipAddress
    );

    const { tokenHash: _th, ...publicSession } = knownActive;
    return {
      sessionToken: token,
      sessionId: knownActive.id,
      isNewDevice: false,
      session: publicSession,
    };
  }

  const sessionToken = generateSessionToken();
  const sessionId = `sess-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  const now = new Date().toISOString();

  const record: UserSessionRecord = {
    id: sessionId,
    userId: input.userId,
    userName: input.userName,
    userRole: input.userRole,
    tokenHash: hashToken(sessionToken),
    deviceFingerprint: input.deviceFingerprint,
    ipAddress: input.ipAddress,
    country: input.country,
    city: input.city,
    browser: input.browser,
    os: input.os,
    device: input.device,
    userAgent: input.userAgent,
    createdAt: now,
    lastActivityAt: now,
    status: "active",
  };

  store.sessions[sessionId] = record;
  if (!store.userIndex[input.userId]) store.userIndex[input.userId] = [];
  store.userIndex[input.userId].push(sessionId);

  const location =
    input.city && input.country
      ? `${input.city}, ${input.country}`
      : input.country || "Не определено";

  const shouldNotify = input.userRole === "Admin" || input.userRole === "Editor";

  const notification: SessionNotificationRecord | undefined = shouldNotify
    ? {
        id: `sess-notif-${Date.now()}`,
        userId: input.userId,
        createdAt: now,
        read: false,
        title: "Обнаружен новый вход в учётную запись",
        body: [
          "В вашу учётную запись был выполнен вход с нового устройства.",
          "",
          `Время: ${formatUtc(now)}`,
          `IP-адрес: ${input.ipAddress}`,
          `Местоположение: ${location}`,
          `Браузер: ${input.browser}`,
          `ОС: ${input.os}`,
          "",
          "Если это были не вы, немедленно завершите активные сессии и смените пароль.",
        ].join("\n"),
        meta: {
          sessionId,
          ipAddress: input.ipAddress,
          country: input.country,
          city: input.city,
          browser: input.browser,
          os: input.os,
          device: input.device,
          loginAt: now,
        },
      }
    : undefined;

  if (notification) {
    store.notifications.unshift(notification);
    store.notifications = store.notifications.filter((n, idx, arr) => {
      const userCount = arr.filter((x) => x.userId === n.userId).length;
      if (userCount > MAX_NOTIFICATIONS_PER_USER) {
        const userNotifs = arr.filter((x) => x.userId === n.userId);
        const oldest = userNotifs[userNotifs.length - 1];
        return n.id !== oldest.id || userCount <= MAX_NOTIFICATIONS_PER_USER;
      }
      return true;
    });
  }

  if (shouldNotify) {
    addAudit(
      input.userId,
      input.userName,
      "Новый вход с устройства",
      `Обнаружен вход с нового устройства: ${input.device}, ${input.browser}, ${input.os}. IP: ${input.ipAddress} (${location})`,
      input.ipAddress
    );
  }

  persistStore();

  const { tokenHash: _th, ...publicSession } = record;
  return {
    sessionToken,
    sessionId,
    isNewDevice: true,
    session: publicSession,
    notification,
  };
}

function formatUtc(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

export function resolveSessionFromToken(token: string): UserSessionRecord | null {
  if (!token) return null;
  pruneExpiredSessions();
  const hash = hashToken(token);
  const session = Object.values(store.sessions).find(
    (s) => s.status === "active" && s.tokenHash === hash
  );
  return session || null;
}

export function touchSession(sessionId: string): boolean {
  const session = store.sessions[sessionId];
  if (!session || session.status !== "active") return false;
  session.lastActivityAt = new Date().toISOString();
  persistStore();
  return true;
}

export function logoutSession(sessionId: string, userName: string, ipAddress?: string): boolean {
  const session = store.sessions[sessionId];
  if (!session) return false;
  session.status = "revoked";
  addAudit(
    session.userId,
    userName,
    "Выход из системы",
    `Сессия завершена (${session.browser}, ${session.os})`,
    ipAddress
  );
  persistStore();
  return true;
}

export function listUserSessions(userId: string): Omit<UserSessionRecord, "tokenHash">[] {
  pruneExpiredSessions();
  return (store.userIndex[userId] || [])
    .map((id) => store.sessions[id])
    .filter((s) => s && s.status === "active")
    .map(({ tokenHash: _th, ...rest }) => rest);
}

export function revokeSession(
  requesterSessionId: string,
  targetSessionId: string
): { ok: boolean; error?: string } {
  const requester = store.sessions[requesterSessionId];
  const target = store.sessions[targetSessionId];
  if (!requester || requester.status !== "active") {
    return { ok: false, error: "Unauthorized session" };
  }
  if (!target || target.userId !== requester.userId) {
    return { ok: false, error: "Session not found" };
  }
  target.status = "revoked";
  addAudit(
    requester.userId,
    requester.userName,
    "Завершение сессии",
    `Принудительно завершена сессия ${target.browser} / ${target.os} (IP: ${target.ipAddress})`,
    requester.ipAddress
  );
  persistStore();
  return { ok: true };
}

export function revokeOtherSessions(
  requesterSessionId: string
): { ok: boolean; revokedCount: number; error?: string } {
  const requester = store.sessions[requesterSessionId];
  if (!requester || requester.status !== "active") {
    return { ok: false, revokedCount: 0, error: "Unauthorized session" };
  }
  let revokedCount = 0;
  for (const id of store.userIndex[requester.userId] || []) {
    const s = store.sessions[id];
    if (s && s.status === "active" && s.id !== requesterSessionId) {
      s.status = "revoked";
      revokedCount++;
    }
  }
  if (revokedCount > 0) {
    addAudit(
      requester.userId,
      requester.userName,
      "Завершение всех других сессий",
      `Завершено сессий: ${revokedCount}`,
      requester.ipAddress
    );
    persistStore();
  }
  return { ok: true, revokedCount };
}

export function getUnreadNotifications(userId: string): SessionNotificationRecord[] {
  return store.notifications.filter((n) => n.userId === userId && !n.read);
}

export function markNotificationsRead(userId: string, ids?: string[]) {
  for (const n of store.notifications) {
    if (n.userId !== userId) continue;
    if (!ids || ids.includes(n.id)) n.read = true;
  }
  persistStore();
}

export async function lookupGeo(ip: string): Promise<{ country?: string; city?: string }> {
  if (!ip || ip === "::1" || ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    return { country: "Локальная сеть", city: "Private" };
  }
  const cleanIp = ip.replace(/^::ffff:/, "");
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(cleanIp)}?fields=status,country,city`,
      { signal: controller.signal }
    );
    clearTimeout(timer);
    if (!res.ok) return {};
    const data = (await res.json()) as { status?: string; country?: string; city?: string };
    if (data.status !== "success") return {};
    return { country: data.country, city: data.city };
  } catch {
    return {};
  }
}

export function getClientIp(req: {
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}): string {
  const forwarded = String(req.headers["x-forwarded-for"] || "")
    .split(",")[0]
    .trim();
  if (forwarded) return forwarded;
  const raw = req.socket?.remoteAddress || "";
  return raw.replace(/^::ffff:/, "") || "unknown";
}
