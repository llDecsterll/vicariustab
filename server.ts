/*
 * COPYRIGHT NOTICE | УВЕДОМЛЕНИЕ ОБ АВТОРСКИХ ПРАВАХ | 版权声明
 * © 2026 Utkin Vladislav Vyacheslavovich (Уткин Владислав Вячеславович)
 * Email: vicariustab@icloud.com | Telegram: https://t.me/Dexterll
 * All rights reserved. Unauthorized copying, modification, distribution or commercial use is prohibited.
 * 保留所有权利。未经版权所有者事先书面同意，禁止复制、修改、分发或商业使用。
 * Все права защищены. Копирование, изменение, распространение и коммерческое использование без письменного согласия правообладателя запрещено.
 * Release
 */

import dotenv from "dotenv";
import express from "express";

dotenv.config();
import path from "path";
import fs from "fs";
import crypto from "crypto";
import {
  getUpdateJob,
  resetUpdateJobIfStale,
  startPlatformUpdate,
} from "./server/updateEngine.ts";
import {
  initSessionEngine,
  registerLogin,
  resolveSessionFromToken,
  touchSession,
  logoutSession,
  listUserSessions,
  revokeSession,
  revokeOtherSessions,
  getUnreadNotifications,
  markNotificationsRead,
  lookupGeo,
  getClientIp,
  getSessionAuditEvents,
} from "./server/sessionEngine.ts";
import { dispatchNewLoginAlert } from "./server/notificationDispatch.ts";
import {
  initDataStore,
  loadApplicationData,
  saveApplicationData,
  getDataRevision,
  type StoredUser,
} from "./server/dataStore.ts";
import {
  requireApiAuth,
  requireWriteRole,
  requireAdminRole,
  requireValidLicenseForWrite,
  requireActivatedLicense,
  parseExpectedRevision,
  verifyCredentials,
  readSessionToken,
  resolveAuthedSession,
  type AuthedRequest,
} from "./server/apiAuth.ts";
import {
  isSetupRequired,
  createInitialAdmin,
  sanitizePayloadForClient,
  sanitizePayloadForClientWithRole,
  preparePayloadForSave,
} from "./server/userCredentials.ts";
import {
  mergeUserPreferences,
  sanitizeUserPreferencesPatch,
} from "./server/userPreferences.ts";
import { buildPurgedWorkspacePayload } from "./server/purgeWorkspace.ts";
import {
  ensureWorkspaceWarehouses,
  workspaceWarehousesChanged,
} from "./server/workspaceWarehouses.ts";
import {
  assertBackupHasNoLicenseFields,
  stripLicenseFromServerData,
} from "./server/backupLicensePolicy.ts";
import {
  isLoginRateLimited,
  recordLoginFailure,
  clearLoginFailures,
  loginRateLimitMessage,
} from "./server/loginRateLimit.ts";
import { performGithubUpdateCheck } from "./server/githubUpdateCheck.ts";
import { preserveServerInstallLicenseFields } from "./server/licenseInstallFields.ts";
import {
  initTotpUserOps,
  isTwoFactorEnabled,
  beginTotpSetup,
  confirmTotpSetup,
  disableTotp,
  verifyUserTotpCode,
  getUserById,
  resolveUserForSession,
  hasTotpPendingSetup,
} from "./server/totpUserOps.ts";
import { createTotpLoginChallenge, consumeTotpLoginChallenge } from "./server/totpPendingLogin.ts";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

/** npm run dev must use Vite even if NODE_ENV=production is set in the OS environment */
function isDevelopmentMode(): boolean {
  if (process.env.STACK_DEV === "true") return true;
  if (process.env.npm_lifecycle_event === "dev") return true;
  const entry = (process.argv[1] || "").replace(/\\/g, "/");
  if (entry.endsWith("server.ts") || entry.endsWith("dev-server.mjs")) return true;
  return process.env.NODE_ENV !== "production";
}

const PKG = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf-8")) as { version?: string; name?: string };
const APP_VERSION = String(PKG.version || "2.6.4");

const ENCRYPTION_SECRET = process.env.DB_ENCRYPTION_KEY || "it-orbit-system-fallback-secret-2026-secure-v1";
const VICARIUSTAB_UPDATE_REPO =
  process.env.GITHUB_UPDATE_REPO || "https://github.com/llDecsterll/vicariustab.git";
const ALGORITHM = "aes-256-cbc";

// Derive a 32-byte key using SHA-256
const KEY = crypto.createHash("sha256").update(ENCRYPTION_SECRET).digest();

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

export function decrypt(text: string): string {
  const parts = text.split(":");
  if (parts.length !== 2) {
    throw new Error("Invalid encrypted format");
  }
  const iv = Buffer.from(parts[0], "hex");
  const encryptedText = Buffer.from(parts[1], "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString("utf8");
}

const DATA_DIR = process.env.STACK_DATA_DIR || process.cwd();
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "db.json");
const CONFIG_PATH = path.join(DATA_DIR, "db_config.json");
const META_PATH = path.join(DATA_DIR, "store_meta.json");

initSessionEngine(DATA_DIR, encrypt, decrypt);
initTotpUserOps(encrypt, decrypt);

function isRunningInDocker(): boolean {
  return Boolean(process.env.STACK_DATA_DIR) || fs.existsSync("/.dockerenv");
}

const MASKED_PASSWORD = "●●●●●●●●";

/** Read Docker bridge gateway IP (usually 172.17.0.1 on Linux) */
function getDockerGatewayIp(): string | null {
  try {
    const lines = fs.readFileSync("/proc/net/route", "utf8").split("\n");
    for (const line of lines.slice(1)) {
      const cols = line.trim().split(/\s+/);
      if (cols[1] === "00000000" && cols[2]?.length === 8) {
        const hex = cols[2];
        const a = parseInt(hex.slice(6, 8), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        const c = parseInt(hex.slice(2, 4), 16);
        const d = parseInt(hex.slice(0, 2), 16);
        return `${a}.${b}.${c}.${d}`;
      }
    }
  } catch {
    // not Linux / not in container
  }
  return null;
}

/** localhost inside a container is NOT the Ubuntu host — remap for native MySQL/PostgreSQL */
function resolveDbHost(host?: string): string {
  const raw = (host || "localhost").trim();
  const lower = raw.toLowerCase();
  if (!isRunningInDocker()) return raw || "localhost";
  // Docker Compose service names (mysql, postgres) — keep as-is
  if (lower !== "localhost" && lower !== "127.0.0.1" && !/^\d{1,3}(\.\d{1,3}){3}$/.test(lower)) {
    return raw;
  }
  if (lower === "localhost" || lower === "127.0.0.1") {
    return (
      process.env.DB_HOST_GATEWAY ||
      getDockerGatewayIp() ||
      "host.docker.internal"
    );
  }
  return raw;
}

function getConnectionHostCandidates(host?: string): string[] {
  const raw = (host || "localhost").trim();
  const lower = raw.toLowerCase();
  const candidates: string[] = [];
  const add = (h: string) => {
    if (h && !candidates.includes(h)) candidates.push(h);
  };

  add(resolveDbHost(raw));

  if (isRunningInDocker()) {
    if (lower !== "localhost" && lower !== "127.0.0.1" && !/^\d{1,3}(\.\d{1,3}){3}$/.test(lower)) {
      add(raw);
    }
    const gw = getDockerGatewayIp();
    if (gw) add(gw);
    add(process.env.DB_HOST_GATEWAY || "host.docker.internal");
    add("172.17.0.1");
  } else {
    add(raw || "localhost");
  }

  return candidates;
}

function mergeDbCredentials(incoming: any, stored: any = readDbConfig()): any {
  const merged = { ...stored, ...incoming };
  const pwd = incoming?.password;
  if (!pwd || pwd === MASKED_PASSWORD) {
    merged.password = stored?.password || "";
  }
  return merged;
}

function mysqlConnOptions(config: any, explicitHost?: string) {
  return {
    host: explicitHost ?? resolveDbHost(config.host),
    port: Number(config.port) || 3306,
    database: config.database || "stack_db",
    user: config.user || "root",
    password: config.password || "",
    connectTimeout: 15000,
  };
}

function pgConnOptions(config: any, explicitHost?: string) {
  return {
    host: explicitHost ?? resolveDbHost(config.host),
    port: Number(config.port) || 5432,
    database: config.database || "stack_db",
    user: config.user || "postgres",
    password: config.password || "",
    connectionTimeoutMillis: 15000,
    ssl: false,
  };
}

function enrichDbError(err: any, config: any, triedHosts: string[]): Error {
  const msg = err?.message || String(err);
  const code = err?.code || "";
  if (isRunningInDocker() && (code === "ECONNREFUSED" || code === "ETIMEDOUT" || msg.includes("ECONNREFUSED"))) {
    const gw = getDockerGatewayIp() || "172.17.0.1";
    return new Error(
      `Не удалось подключиться (${triedHosts.join(" → ")}). ` +
        `Docker на Ubuntu: укажите хост ${gw} или host.docker.internal; ` +
        `в MySQL/PostgreSQL на сервере включите bind-address=0.0.0.0 и пользователя с доступом '%'. ` +
        `Либо запустите: docker compose -f docker-compose.yml -f docker-compose.mysql.yml up -d`
    );
  }
  return new Error(msg);
}

async function testSqlConnOnce(config: any, host: string): Promise<void> {
  if (config.type === "mysql") {
    const mysql = await import("mysql2/promise");
    const connection = await mysql.createConnection(mysqlConnOptions(config, host));
    await connection.ping();
    await connection.end();
  } else if (config.type === "postgres") {
    const pg = await import("pg");
    const client = new pg.Client(pgConnOptions(config, host));
    await client.connect();
    await client.query("SELECT 1");
    await client.end();
  }
}

async function testSqlConnWithFallback(config: any): Promise<string> {
  const merged = mergeDbCredentials(config);
  const candidates = getConnectionHostCandidates(merged.host);
  let lastErr: any = null;
  for (const host of candidates) {
    try {
      await testSqlConnOnce(merged, host);
      return host;
    } catch (err) {
      lastErr = err;
      console.warn(`[DB] Connection attempt failed for host ${host}:`, (err as Error).message);
    }
  }
  throw enrichDbError(lastErr, merged, candidates);
}

async function testSqlConn(config: any): Promise<void> {
  await testSqlConnWithFallback(config);
}

function ensureDbFile(): void {
  if (!fs.existsSync(DB_PATH)) return;
  try {
    const content = fs.readFileSync(DB_PATH, "utf-8").trim();
    if (!content) {
      fs.unlinkSync(DB_PATH);
    } else {
      JSON.parse(content.startsWith("{") ? content : decrypt(content));
    }
  } catch {
    try {
      fs.unlinkSync(DB_PATH);
    } catch {
      // ignore
    }
  }
}

ensureDbFile();

// Load db configurations
function readDbConfig(): any {
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
    } catch {
      // Ignored, default to json
    }
  }
  return { type: "json" };
}

// Write db configuration
function writeDbConfig(config: any) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

function getEnvDbConfig(): any | null {
  const host = process.env.STACK_DEFAULT_DB_HOST?.trim();
  if (!host) return null;
  const type = process.env.STACK_DEFAULT_DB_TYPE || "mysql";
  return {
    type,
    host,
    port: Number(process.env.STACK_DEFAULT_DB_PORT) || (type === "postgres" ? 5432 : 3306),
    database: process.env.STACK_DEFAULT_DB_NAME || "stack_db",
    user: process.env.STACK_DEFAULT_DB_USER || (type === "postgres" ? "postgres" : "root"),
    password: process.env.STACK_DEFAULT_DB_PASSWORD || "",
  };
}

async function bootstrapDbConfigFromEnv() {
  if (fs.existsSync(CONFIG_PATH)) return;
  const envCfg = getEnvDbConfig();
  if (!envCfg?.password) return;
  try {
    const resolvedHost = await testSqlConnWithFallback(envCfg);
    envCfg.host = resolvedHost;
    writeDbConfig(envCfg);
    console.log(`[DB] Auto-configured from STACK_DEFAULT_DB_* (host: ${resolvedHost}, type: ${envCfg.type})`);
  } catch (err) {
    console.warn("[DB] STACK_DEFAULT_DB_* set but connection failed:", (err as Error).message);
  }
}

// Global cached database status tracker for automated checking
let lastDbStatus = {
  status: "unchecked",
  error: "",
  lastChecked: ""
};

async function checkDatabaseConnection() {
  const config = readDbConfig();
  if (!config || config.type === "json") {
    lastDbStatus = {
      status: "connected",
      error: "",
      lastChecked: new Date().toISOString()
    };
    return;
  }
  
  try {
    await testSqlConn(config);
    lastDbStatus = {
      status: "connected",
      error: "",
      lastChecked: new Date().toISOString()
    };
  } catch (err: any) {
    console.error(`[DBMS Status Polling Check] Database connection lost/failed to ${config.type.toUpperCase()}:`, err.message || err);
    lastDbStatus = {
      status: "error",
      error: err.message || String(err) || "Database connection check failed",
      lastChecked: new Date().toISOString()
    };
  }
}

async function loadFromSql(config: any): Promise<any> {
  if (config.type === "mysql") {
    const mysql = await import("mysql2/promise");
    const connection = await mysql.createConnection(mysqlConnOptions(config));
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orbit_secure_store (
        store_key VARCHAR(128) PRIMARY KEY,
        store_value LONGTEXT NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const [rows]: [any[], any] = await connection.query(`SELECT store_key, store_value FROM orbit_secure_store`);
    await connection.end();

    if (!rows || rows.length === 0) return null;
    const result: any = {};
    for (const row of rows) {
      try {
        const decrypted = decrypt(row.store_value);
        result[row.store_key] = JSON.parse(decrypted);
      } catch (err) {
        console.error(`Error decrypting SQL key ${row.store_key}:`, err);
      }
    }
    return result;
  } else if (config.type === "postgres") {
    const pg = await import("pg");
    const client = new pg.Pool(pgConnOptions(config));
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS orbit_secure_store (
        store_key VARCHAR(128) PRIMARY KEY,
        store_value TEXT NOT NULL
      );
    `);

    const { rows } = await client.query(`SELECT store_key, store_value FROM orbit_secure_store`);
    await client.end();

    if (!rows || rows.length === 0) return null;
    const result: any = {};
    for (const row of rows) {
      try {
        const decrypted = decrypt(row.store_value);
        result[row.store_key] = JSON.parse(decrypted);
      } catch (err) {
        console.error(`Error decrypting Postgres key ${row.store_key}:`, err);
      }
    }
    return result;
  }
  return null;
}

async function saveToSql(config: any, payload: any): Promise<void> {
  if (config.type === "mysql") {
    const mysql = await import("mysql2/promise");
    const connection = await mysql.createConnection(mysqlConnOptions(config));

    await connection.query(`
      CREATE TABLE IF NOT EXISTS orbit_secure_store (
        store_key VARCHAR(128) PRIMARY KEY,
        store_value LONGTEXT NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.beginTransaction();
    try {
      const keys = Object.keys(payload);
      if (keys.length > 0) {
        await connection.query(
          `DELETE FROM orbit_secure_store WHERE store_key NOT IN (${keys.map(() => "?").join(", ")})`,
          keys
        );
      } else {
        await connection.query(`DELETE FROM orbit_secure_store`);
      }
      for (const key of keys) {
        const val = payload[key];
        const encryptedValue = encrypt(JSON.stringify(val));
        await connection.query(
          `
        INSERT INTO orbit_secure_store (store_key, store_value) 
        VALUES (?, ?) 
        ON DUPLICATE KEY UPDATE store_value = VALUES(store_value)
      `,
          [key, encryptedValue]
        );
      }
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      await connection.end();
    }
  } else if (config.type === "postgres") {
    const pg = await import("pg");
    const client = new pg.Pool(pgConnOptions(config));

    await client.query(`
      CREATE TABLE IF NOT EXISTS orbit_secure_store (
        store_key VARCHAR(128) PRIMARY KEY,
        store_value TEXT NOT NULL
      );
    `);

    await client.query("BEGIN");
    try {
      const keys = Object.keys(payload);
      if (keys.length > 0) {
        await client.query(
          `DELETE FROM orbit_secure_store WHERE store_key NOT IN (${keys.map((_, i) => `$${i + 1}`).join(", ")})`,
          keys
        );
      } else {
        await client.query(`DELETE FROM orbit_secure_store`);
      }
      for (const key of keys) {
        const val = payload[key];
        const encryptedValue = encrypt(JSON.stringify(val));
        await client.query(
          `
        INSERT INTO orbit_secure_store (store_key, store_value) 
        VALUES ($1, $2) 
        ON CONFLICT (store_key) 
        DO UPDATE SET store_value = EXCLUDED.store_value
      `,
          [key, encryptedValue]
        );
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      await client.end();
    }
  }
}

function stripLicenseArtifacts(data: any): any {
  if (!data || typeof data !== "object") return data;
  return stripLicenseFromServerData(data);
}

async function startServer() {
  initDataStore({
    encrypt,
    decrypt,
    dbPath: DB_PATH,
    metaPath: META_PATH,
    readDbConfig,
    loadFromSql,
    saveToSql,
  });

  if (process.env.TRUST_PROXY === "true" || process.env.TRUST_PROXY === "1") {
    app.set("trust proxy", 1);
  }

  if (process.env.STACK_FORCE_HTTPS === "true") {
    app.use((req, res, next) => {
      if (req.method !== "GET" && req.method !== "HEAD") return next();
      const proto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
      if (proto && proto !== "https") {
        const host = req.headers.host || process.env.STACK_DOMAIN || "localhost";
        return res.redirect(301, `https://${host}${req.originalUrl || req.url}`);
      }
      return next();
    });
  }

  // Body parser limit increased to handle large state arrays, uploaded base64 data, logos etc.
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Public routes (no session token)
  app.get("/api/health", (_req, res) => {
    return res.json({ ok: true, version: APP_VERSION });
  });

  // Public update metadata (legacy servers / clients without session during check)
  app.get("/api/update/check", async (req, res) => {
    try {
      const installedCommit = String(req.query.installedCommit || "").trim().toLowerCase();
      const clientVersion = String(req.query.currentVersion || APP_VERSION).trim();
      const payload = await performGithubUpdateCheck(
        installedCommit,
        clientVersion,
        VICARIUSTAB_UPDATE_REPO
      );
      return res.json(payload);
    } catch (error) {
      console.error("Update check failed:", error);
      return res.status(500).json({ error: "Failed to check GitHub updates" });
    }
  });

  app.get("/api/update/repo", (_req, res) => {
    return res.json({ repoUrl: VICARIUSTAB_UPDATE_REPO, currentVersion: APP_VERSION });
  });

  app.get("/api/auth/setup-status", async (_req, res) => {
    try {
      const setupRequired = await isSetupRequired();
      return res.json({ setupRequired });
    } catch (err) {
      console.error("Setup status error:", err);
      return res.status(500).json({ error: "Failed to read setup status" });
    }
  });

  app.post("/api/auth/setup", async (req, res) => {
    try {
      if (!(await isSetupRequired())) {
        return res.status(409).json({ error: "Initial setup already completed", code: "SETUP_DONE" });
      }
      const body = req.body || {};
      await createInitialAdmin({
        login: String(body.login || ""),
        password: String(body.password || ""),
        email: String(body.email || ""),
      });
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || "Setup failed" });
    }
  });

  app.post("/api/auth/authenticate", async (req, res) => {
    try {
      const body = req.body || {};
      const login = String(body.login || "").trim();
      const password = String(body.password || "");
      if (!login || !password) {
        return res.status(400).json({ error: "Login and password required" });
      }

      if (isLoginRateLimited(req, login)) {
        return res.status(429).json({ error: loginRateLimitMessage(), code: "RATE_LIMITED" });
      }

      const user = await verifyCredentials(login, password);
      if (!user) {
        recordLoginFailure(req, login);
        return res.status(401).json({ error: "Invalid credentials", code: "AUTH_FAILED" });
      }

      clearLoginFailures(req, login);

      if (await isSetupRequired()) {
        return res.status(403).json({ error: "Complete initial setup first", code: "SETUP_REQUIRED" });
      }

      if (isTwoFactorEnabled(user)) {
        const challenge = createTotpLoginChallenge(user, {
          deviceFingerprint: String(body.deviceFingerprint || "unknown"),
          browser: String(body.browser || "Unknown"),
          os: String(body.os || "Unknown"),
          device: String(body.device || "Desktop"),
          userAgent: String(body.userAgent || ""),
          email: user.email,
          emailVerified: Boolean(body.emailVerified ?? user.email?.includes("@")),
          emailNotificationsEnabled: body.emailNotificationsEnabled !== false,
          telegramChatId: body.telegramChatId,
          telegramNotificationsEnabled: Boolean(body.telegramChatId && body.telegramNotificationsEnabled),
        });
        return res.json({
          requiresTwoFactor: true,
          challengeId: challenge.challengeId,
          expiresIn: challenge.expiresIn,
        });
      }

      const ip = getClientIp(req);
      const geo = await lookupGeo(ip);
      const result = registerLogin({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        deviceFingerprint: String(body.deviceFingerprint || "unknown"),
        ipAddress: ip,
        country: geo.country,
        city: geo.city,
        browser: String(body.browser || "Unknown"),
        os: String(body.os || "Unknown"),
        device: String(body.device || "Desktop"),
        userAgent: String(body.userAgent || ""),
      });

      let dispatch;
      if (result.isNewDevice && result.notification) {
        const proto = String(req.headers["x-forwarded-proto"] || "http").split(",")[0].trim();
        const host = String(req.headers["x-forwarded-host"] || req.headers.host || "localhost");
        const sessionsUrl = `${proto}://${host}/?tab=settings&section=sessions`;
        dispatch = await dispatchNewLoginAlert(result.notification, {
          email: user.email,
          emailVerified: Boolean(body.emailVerified ?? user.email?.includes("@")),
          emailNotificationsEnabled: body.emailNotificationsEnabled !== false,
          telegramChatId: body.telegramChatId,
          telegramNotificationsEnabled: Boolean(body.telegramChatId && body.telegramNotificationsEnabled),
        }, sessionsUrl);
      }

      return res.json({
        sessionToken: result.sessionToken,
        sessionId: result.sessionId,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        isNewDevice: result.isNewDevice,
        session: result.session,
        notification: result.isNewDevice ? result.notification : undefined,
        dispatch,
      });
    } catch (err: any) {
      console.error("Auth authenticate error:", err);
      return res.status(500).json({ error: "Authentication failed" });
    }
  });

  app.post("/api/auth/authenticate/totp", async (req, res) => {
    try {
      const body = req.body || {};
      const challengeId = String(body.challengeId || "").trim();
      const code = String(body.code || "").trim();
      if (!challengeId || !code) {
        return res.status(400).json({ error: "Challenge ID and TOTP code required" });
      }

      const pending = consumeTotpLoginChallenge(challengeId);
      if (!pending) {
        return res.status(401).json({ error: "Invalid or expired challenge", code: "TOTP_CHALLENGE_EXPIRED" });
      }

      if (isLoginRateLimited(req, `totp:${pending.login}`)) {
        return res.status(429).json({ error: loginRateLimitMessage(), code: "RATE_LIMITED" });
      }

      const user = await resolveUserForSession({
        userId: pending.userId,
        userName: pending.login,
      });
      if (!user || !isTwoFactorEnabled(user)) {
        return res.status(401).json({ error: "Invalid credentials", code: "AUTH_FAILED" });
      }

      if (!(await verifyUserTotpCode(user, code))) {
        recordLoginFailure(req, `totp:${pending.login}`);
        return res.status(401).json({ error: "Invalid TOTP code", code: "TOTP_INVALID" });
      }

      clearLoginFailures(req, `totp:${pending.login}`);
      clearLoginFailures(req, pending.login);

      const ip = getClientIp(req);
      const geo = await lookupGeo(ip);
      const result = registerLogin({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        deviceFingerprint: pending.deviceFingerprint,
        ipAddress: ip,
        country: geo.country,
        city: geo.city,
        browser: pending.browser,
        os: pending.os,
        device: pending.device,
        userAgent: pending.userAgent,
      });

      let dispatch;
      if (result.isNewDevice && result.notification) {
        const proto = String(req.headers["x-forwarded-proto"] || "http").split(",")[0].trim();
        const host = String(req.headers["x-forwarded-host"] || req.headers.host || "localhost");
        const sessionsUrl = `${proto}://${host}/?tab=settings&section=sessions`;
        dispatch = await dispatchNewLoginAlert(result.notification, {
          email: user.email,
          emailVerified: Boolean(pending.emailVerified ?? user.email?.includes("@")),
          emailNotificationsEnabled: pending.emailNotificationsEnabled !== false,
          telegramChatId: pending.telegramChatId,
          telegramNotificationsEnabled: Boolean(pending.telegramChatId && pending.telegramNotificationsEnabled),
        }, sessionsUrl);
      }

      return res.json({
        sessionToken: result.sessionToken,
        sessionId: result.sessionId,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        isNewDevice: result.isNewDevice,
        session: result.session,
        notification: result.isNewDevice ? result.notification : undefined,
        dispatch,
      });
    } catch (err: any) {
      console.error("Auth TOTP error:", err);
      return res.status(500).json({ error: "Authentication failed" });
    }
  });

  app.get("/api/auth/totp/status", async (req, res) => {
    const session = resolveAuthedSession(req, res);
    if (!session) return;
    try {
      const user = await resolveUserForSession({
        userId: session.userId,
        userName: session.userName,
      });
      if (!user) {
        return res.status(404).json({
          error: "Учётная запись не найдена. Выйдите из системы и войдите снова.",
        });
      }
      return res.json({
        enabled: isTwoFactorEnabled(user),
        pendingSetup: hasTotpPendingSetup(user),
        enabledAt: user.totpEnabledAt || null,
      });
    } catch (err) {
      console.error("TOTP status error:", err);
      return res.status(500).json({ error: "Failed to read TOTP status" });
    }
  });

  app.post("/api/auth/totp/setup-begin", async (req, res) => {
    const session = resolveAuthedSession(req, res);
    if (!session) return;
    try {
      const result = await beginTotpSetup({
        userId: session.userId,
        userName: session.userName,
      });
      if (!result) {
        return res.status(404).json({
          error: "Учётная запись не найдена. Выйдите из системы и войдите снова.",
        });
      }
      let qrDataUrl: string | undefined;
      try {
        const QRCode = await import("qrcode");
        qrDataUrl = await QRCode.toDataURL(result.otpauthUrl, { margin: 1, width: 220 });
      } catch {
        /* QR is optional */
      }
      return res.json({ ...result, qrDataUrl, revision: getDataRevision() });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || "Setup failed" });
    }
  });

  app.post("/api/auth/totp/setup-confirm", async (req, res) => {
    const session = resolveAuthedSession(req, res);
    if (!session) return;
    const code = String(req.body?.code || "").trim();
    if (!code) return res.status(400).json({ error: "TOTP code required" });
    try {
      const ok = await confirmTotpSetup(
        { userId: session.userId, userName: session.userName },
        code
      );
      if (!ok) return res.status(401).json({ error: "Invalid TOTP code", code: "TOTP_INVALID" });
      return res.json({ success: true, revision: getDataRevision() });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || "Setup failed" });
    }
  });

  app.post("/api/auth/totp/disable", async (req, res) => {
    const session = resolveAuthedSession(req, res);
    if (!session) return;
    const code = String(req.body?.code || "").trim();
    if (!code) return res.status(400).json({ error: "TOTP code required" });
    try {
      const ok = await disableTotp(
        { userId: session.userId, userName: session.userName },
        code
      );
      if (!ok) return res.status(401).json({ error: "Invalid TOTP code", code: "TOTP_INVALID" });
      return res.json({ success: true, revision: getDataRevision() });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || "Disable failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    const token = readSessionToken(req);
    const session = resolveSessionFromToken(token);
    if (!session) return res.json({ success: true });
    logoutSession(session.id, String(req.body?.userName || session.userName), getClientIp(req));
    return res.json({ success: true });
  });

  // All other /api routes require a valid session token
  app.use("/api", requireApiAuth);

  // Main data API with optimistic locking
  app.get("/api/data", async (req: AuthedRequest, res) => {
    try {
      const { data, revision } = await loadApplicationData();
      if (!data) return res.json({ _revision: revision });
      const raw = data as Record<string, unknown>;
      const normalized = ensureWorkspaceWarehouses(raw);
      let revisionOut = revision;
      if (workspaceWarehousesChanged(raw, normalized)) {
        const healed = await saveApplicationData(normalized, revision);
        if (healed.ok) {
          revisionOut = healed.revision;
        } else if ("revision" in healed) {
          revisionOut = healed.revision;
        }
      }
      const safe = sanitizePayloadForClientWithRole(
        normalized,
        req.authSession?.userRole,
        normalized
      );
      return res.json({ ...(safe || normalized), _revision: revisionOut });
    } catch (error) {
      console.error("Error reading database:", error);
      return res.status(500).json({ error: "Failed to read server database" });
    }
  });

  app.post(
    "/api/data",
    requireWriteRole,
    requireValidLicenseForWrite,
    async (req: AuthedRequest, res) => {
      try {
        const data = req.body as Record<string, unknown>;
        if (!data || typeof data !== "object") {
          return res.status(400).json({ error: "Invalid payload" });
        }

        let payload = { ...data };

        // Prevent Privilege Escalation / Mass Assignment
        if (req.authSession?.userRole !== "Admin") {
          delete payload.users;
          delete payload.license_key;
          delete payload.license_key_sig;
          const { data: existing } = await loadApplicationData();
          payload = preserveServerInstallLicenseFields(payload, existing);
        }

        const prepared = await preparePayloadForSave(payload);
        const expectedRevision = parseExpectedRevision(req);
        const result = await saveApplicationData(prepared, expectedRevision);
        if ("conflict" in result && result.conflict) {
          const conflictData = sanitizePayloadForClientWithRole(
            result.data,
            req.authSession?.userRole,
            result.data
          );
          return res.status(409).json({
            error: "Data conflict — another session saved changes first",
            code: "REVISION_CONFLICT",
            revision: result.revision,
            data: conflictData,
          });
        }
        return res.json({ success: true, revision: result.revision });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to save data";
        console.error("Error writing database:", error);
        const lowerMsg = message.toLowerCase();
        if (
          lowerMsg.includes("пароль") ||
          lowerMsg.includes("логин") ||
          lowerMsg.includes("email") ||
          lowerMsg.includes("инвентар") ||
          lowerMsg.includes("дублирующ") ||
          lowerMsg.includes("администратор")
        ) {
          return res.status(400).json({ error: message });
        }
          return res.status(500).json({ error: `Server Error: ${message}` });
      }
    }
  );

  app.patch("/api/user/preferences", async (req: AuthedRequest, res) => {
    try {
      const userId = req.authSession?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const patch = sanitizeUserPreferencesPatch(req.body);
      if (Object.keys(patch).length === 0) {
        return res.status(400).json({ error: "No valid preferences in request" });
      }

      const { data, revision } = await loadApplicationData();
      if (!data || !Array.isArray(data.users)) {
        return res.status(500).json({ error: "User database unavailable" });
      }

      const users = data.users as StoredUser[];
      const idx = users.findIndex((u) => u.id === userId);
      if (idx < 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const current = users[idx];
      const mergedPrefs = mergeUserPreferences(current.preferences, patch);
      const nextUsers = users.map((u, i) =>
        i === idx ? { ...u, preferences: mergedPrefs } : u
      );

      const expectedRevision = parseExpectedRevision(req);
      const result = await saveApplicationData({ ...data, users: nextUsers }, expectedRevision);
      if ("conflict" in result && result.conflict) {
        return res.status(409).json({
          error: "Data conflict — another session saved changes first",
          code: "REVISION_CONFLICT",
          revision: result.revision,
        });
      }

      return res.json({
        success: true,
        revision: result.revision,
        preferences: mergedPrefs,
      });
    } catch (error) {
      console.error("Error saving user preferences:", error);
      return res.status(500).json({ error: "Failed to save user preferences" });
    }
  });

  app.post(
    "/api/data/purge-workspace",
    requireAdminRole,
    requireValidLicenseForWrite,
    async (req: AuthedRequest, res) => {
      try {
        const { data } = await loadApplicationData();
        const current = data && typeof data === "object" ? data : {};
        const purged = buildPurgedWorkspacePayload(
          current as Record<string, unknown>,
          req.authSession?.userName
        );
        const prepared = await preparePayloadForSave(purged);
        const expectedRevision = parseExpectedRevision(req);
        const result = await saveApplicationData(prepared, expectedRevision);
        if ("conflict" in result && result.conflict) {
          return res.status(409).json({
            error: "Data conflict — another session saved changes first",
            code: "REVISION_CONFLICT",
            revision: result.revision,
            data: result.data,
          });
        }
        const safe = sanitizePayloadForClientWithRole(
          purged,
          req.authSession?.userRole,
          purged
        );
        return res.json({
          success: true,
          revision: result.revision,
          data: { ...(safe || purged), _revision: result.revision },
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to purge workspace";
        console.error("Error purging workspace:", error);
        return res.status(500).json({ error: message });
      }
    }
  );

  // Export encrypted backup (supports transferring db easily)
  app.get("/api/backup/export", requireAdminRole, requireActivatedLicense, async (_req, res) => {
    try {
      const config = readDbConfig();
      let rawString = "";

      if (config.type === "mysql" || config.type === "postgres") {
        try {
          const sqlData = await loadFromSql(config);
          if (sqlData) {
            rawString = JSON.stringify(
              stripLicenseArtifacts(ensureWorkspaceWarehouses(sqlData as Record<string, unknown>)),
              null,
              2
            );
          }
        } catch (err) {
          console.error("SQL export error, getting fallback", err);
        }
      }

      if (!rawString && fs.existsSync(DB_PATH)) {
        const fileContent = fs.readFileSync(DB_PATH, "utf-8").trim();
        if (!fileContent.startsWith("{")) {
          rawString = JSON.stringify(stripLicenseArtifacts(JSON.parse(decrypt(fileContent))), null, 2);
        } else {
          rawString = JSON.stringify(stripLicenseArtifacts(JSON.parse(fileContent)), null, 2);
        }
      }

      if (rawString) {
        const parsedExport = JSON.parse(rawString) as Record<string, unknown>;
        assertBackupHasNoLicenseFields(parsedExport);
        const encrypted = encrypt(rawString);
        return res.json({ backup: encrypted });
      }
      return res.status(404).json({ error: "No data to back up yet" });
    } catch (error) {
      console.error("Error exporting backup:", error);
      return res.status(500).json({ error: "Failed to export backup" });
    }
  });

  // Import encrypted backup
  app.post("/api/backup/import", requireAdminRole, requireActivatedLicense, async (req, res) => {
    try {
      const { backup } = req.body;
      if (!backup || typeof backup !== "string") {
        return res.status(400).json({ error: "Invalid backup format" });
      }

      let decrypted = "";
      try {
        decrypted = decrypt(backup);
        JSON.parse(decrypted);
      } catch (e) {
        return res.status(400).json({ error: "Failed to decrypt backup. Bad key or file is corrupted" });
      }

      const parsed = JSON.parse(decrypted);
      const sanitized = stripLicenseArtifacts(parsed);
      const prepared = await preparePayloadForSave(sanitized as Record<string, unknown>);
      const config = readDbConfig();
      if (config.type === "mysql" || config.type === "postgres") {
        await saveToSql(config, prepared);
      }
      await saveApplicationData(prepared, null);
      return res.json({ success: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to import backup";
      console.error("Error importing backup:", error);
      if (
        message.includes("инвентар") ||
        message.includes("Дублирующ") ||
        message.includes("администратор") ||
        message.includes("пароль")
      ) {
        return res.status(400).json({ error: message });
      }
      return res.status(500).json({ error: "Failed to import backup" });
    }
  });

  // GET Docker-aware DB connection hints (host gateway for MySQL/PostgreSQL on host machine)
  app.get("/api/db-config/defaults", (_req, res) => {
    const inDocker = isRunningInDocker();
    const gatewayIp = getDockerGatewayIp();
    const suggestedHost = inDocker
      ? gatewayIp || process.env.DB_HOST_GATEWAY || "host.docker.internal"
      : "localhost";
    const suggestedHosts = inDocker
      ? [gatewayIp, process.env.DB_HOST_GATEWAY || "host.docker.internal", "172.17.0.1"].filter(
          (h): h is string => Boolean(h)
        )
      : ["localhost"];
    return res.json({
      inDocker,
      suggestedHost,
      gatewayIp,
      suggestedHosts: [...new Set(suggestedHosts)],
      hint: inDocker
        ? "Docker на Ubuntu: для MySQL/PostgreSQL на сервере укажите IP шлюза (обычно 172.17.0.1) или host.docker.internal; в СУБД: bind-address=0.0.0.0 и user@'%'"
        : "",
    });
  });

  // GET current DB config settings (removes sensitive credentials)
  app.get("/api/db-config", requireAdminRole, (req, res) => {
    const config = readDbConfig();
    const cleanConfig = { ...config };
    const hasPassword = Boolean(cleanConfig.password);
    if (hasPassword) {
      cleanConfig.password = MASKED_PASSWORD;
    }
    return res.json({ ...cleanConfig, passwordSet: hasPassword });
  });

  // GET active monitored database connection status
  app.get("/api/db-status", async (req, res) => {
    if (lastDbStatus.status === "unchecked") {
      await checkDatabaseConnection();
    }
    return res.json(lastDbStatus);
  });

  // TEST database connection with given params
  app.post("/api/db-config/test", requireAdminRole, async (req, res) => {
    try {
      const config = req.body;
      if (config.type === "json") {
        return res.json({ success: true, message: "Local JSON storage does not require connection testing" });
      }
      const resolvedHost = await testSqlConnWithFallback(config);
      return res.json({
        success: true,
        message: "Connection established successfully!",
        resolvedHost,
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || "Database connection test failed" });
    }
  });

  // SAVE database configuration and migrate data
  app.post("/api/db-config", requireAdminRole, async (req, res) => {
    try {
      const newConfig = mergeDbCredentials(req.body);
      const oldConfig = readDbConfig();

      if (newConfig.type !== "json") {
        const resolvedHost = await testSqlConnWithFallback(newConfig);
        newConfig.host = resolvedHost;
      }

      // Save configuration immediately so server holds the correct state
      writeDbConfig(newConfig);

      // SILENT AUTO-MIGRATION:
      // If migrating from JSON to a relational database, automatically import any existing data
      if (newConfig.type !== "json" && oldConfig.type === "json") {
        try {
          if (fs.existsSync(DB_PATH)) {
            const raw = fs.readFileSync(DB_PATH, "utf-8").trim();
            if (raw) {
              const decryptedString = raw.startsWith("{") ? raw : decrypt(raw);
              const parsedData = JSON.parse(decryptedString);
              if (parsedData && typeof parsedData === "object") {
                await saveToSql(newConfig, parsedData);
                console.log("[Migration] Successfully migrated JSON file state to SQL Server Database");
              }
            }
          }
        } catch (migrationErr) {
          console.error("[Migration] Non-blocking warning: Failed to auto-migrate local data to SQL", migrationErr);
        }
      }

      // Synchronize health check status immediately
      await checkDatabaseConnection().catch(err => console.error("Immediate connection check failed:", err));

      return res.json({ success: true, message: "Database configuration stored and validated successfully" });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || "Failed to save database configuration" });
    }
  });

  app.get("/api/update/status", (_req, res) => {
    resetUpdateJobIfStale();
    return res.json(getUpdateJob());
  });

  app.post("/api/update/apply", requireAdminRole, requireActivatedLicense, async (req, res) => {
    if (isDevelopmentMode()) {
      return res.status(403).json({
        error: "Auto-update is disabled in development mode. Use production build (npm run build && npm start).",
      });
    }

    resetUpdateJobIfStale();
    const running = getUpdateJob();
    if (running.status === "running") {
      return res.status(409).json({ error: "Update already in progress", job: running });
    }

    const installedCommit = String(req.body?.installedCommit || "").trim().toLowerCase();

    let check;
    try {
      check = await performGithubUpdateCheck(installedCommit, APP_VERSION, VICARIUSTAB_UPDATE_REPO);
    } catch (err: any) {
      return res.status(502).json({ error: err?.message || "Failed to verify GitHub update" });
    }

    if (!check.updateAvailable) {
      return res.status(409).json({ error: "No update available on GitHub", check });
    }

    void startPlatformUpdate({
      repoUrl: VICARIUSTAB_UPDATE_REPO,
      appVersion: APP_VERSION,
      dataDir: DATA_DIR,
      appRoot: process.cwd(),
      encrypt,
      readDbConfig,
      fetchGithubCheck: () =>
        performGithubUpdateCheck(installedCommit, APP_VERSION, VICARIUSTAB_UPDATE_REPO),
    }).catch((err) => console.error("[Update] apply failed:", err));

    return res.json({ started: true, message: "Platform update started" });
  });

  app.post("/api/auth/heartbeat", (req, res) => {
    const token = readSessionToken(req);
    const session = resolveSessionFromToken(token);
    if (!session) return res.status(401).json({ error: "Session revoked or expired" });
    touchSession(session.id);
    const notifications = getUnreadNotifications(session.userId).map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      meta: n.meta,
    }));
    return res.json({ ok: true, notifications });
  });

  app.get("/api/auth/sessions", (req, res) => {
    const token = readSessionToken(req);
    const session = resolveSessionFromToken(token);
    if (!session) return res.status(401).json({ error: "Unauthorized" });
    const sessions = listUserSessions(session.userId).map((s) => ({
      ...s,
      isCurrent: s.id === session.id,
    }));
    return res.json({ sessions, currentSessionId: session.id });
  });

  app.delete("/api/auth/sessions/:sessionId", (req, res) => {
    const token = readSessionToken(req);
    const requester = resolveSessionFromToken(token);
    if (!requester) return res.status(401).json({ error: "Unauthorized" });
    const result = revokeSession(requester.id, String(req.params.sessionId || ""));
    if (!result.ok) return res.status(400).json({ error: result.error });
    return res.json({ success: true });
  });

  app.post("/api/auth/sessions/revoke-others", (req, res) => {
    const token = readSessionToken(req);
    const requester = resolveSessionFromToken(token);
    if (!requester) return res.status(401).json({ error: "Unauthorized" });
    const result = revokeOtherSessions(requester.id);
    if (!result.ok) return res.status(400).json({ error: result.error });
    return res.json({ success: true, revokedCount: result.revokedCount });
  });

  app.get("/api/auth/notifications", (req, res) => {
    const token = readSessionToken(req);
    const session = resolveSessionFromToken(token);
    if (!session) return res.status(401).json({ error: "Unauthorized" });
    return res.json({ notifications: getUnreadNotifications(session.userId) });
  });

  app.post("/api/auth/notifications/read", (req, res) => {
    const token = readSessionToken(req);
    const session = resolveSessionFromToken(token);
    if (!session) return res.status(401).json({ error: "Unauthorized" });
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : undefined;
    markNotificationsRead(session.userId, ids);
    return res.json({ success: true });
  });

  app.get("/api/auth/audit", (req, res) => {
    const token = readSessionToken(req);
    const session = resolveSessionFromToken(token);
    if (!session) return res.status(401).json({ error: "Unauthorized" });
    const events = getSessionAuditEvents(200).filter((e) => e.userId === session.userId);
    return res.json({ events });
  });

  app.get("/api/system/runtime", (req, res) => {
    const forwardedProto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
    const forwardedHost = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
    const envPublicUrl = (process.env.STACK_PUBLIC_URL || "").trim() || null;
    const envDomain = (process.env.STACK_DOMAIN || "").trim() || null;
    const detectedUrl =
      forwardedHost && forwardedProto
        ? `${forwardedProto}://${forwardedHost}`
        : forwardedHost
          ? `https://${forwardedHost}`
          : null;

    return res.json({
      version: APP_VERSION,
      domain: envDomain,
      publicUrl: envPublicUrl,
      detectedUrl,
      tls: forwardedProto === "https" || req.secure === true,
      behindProxy: Boolean(req.headers["x-forwarded-for"] || req.headers["x-forwarded-proto"]),
    });
  });

  // Block access to source maps and TypeScript sources in production
  if (!isDevelopmentMode()) {
    app.use((req, res, next) => {
      const p = req.path.toLowerCase();
      if (
        p.includes("/src/") ||
        p.endsWith(".ts") ||
        p.endsWith(".tsx") ||
        p.endsWith(".map") ||
        p.endsWith(".cjs.map")
      ) {
        return res.status(404).json({ error: "Not found" });
      }
      next();
    });
  }

  // Vite development middleware vs production static assets
  if (isDevelopmentMode()) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Active self-monitoring СУБД system checks: initial check and query every 12 seconds
  bootstrapDbConfigFromEnv()
    .then(() => checkDatabaseConnection())
    .catch((err) => console.error("Initial startup database link failure:", err));
  setInterval(() => {
    checkDatabaseConnection().catch((err) => console.error("Periodic database link failure:", err));
  }, 12000);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Vicariustab Server] Active Multi-DBMS secured container server running on port ${PORT}`);
  });
}

startServer();
