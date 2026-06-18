/*
 * COPYRIGHT NOTICE | УВЕДОМЛЕНИЕ ОБ АВТОРСКИХ ПРАВАХ | 版权声明
 * © 2026 Utkin Vladislav Vyacheslavovich (Уткин Владислав Вячеславович)
 * Email: assetorbit@icloud.com | Telegram: https://t.me/Dexterll
 * All rights reserved. Unauthorized copying, modification, distribution or commercial use is prohibited.
 * 保留所有权利。未经版权所有者事先书面同意，禁止复制、修改、分发或商业使用。
 * Все права защищены. Копирование, изменение, распространение и коммерческое использование без письменного согласия правообладателя запрещено.
 */

import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const ENCRYPTION_SECRET = process.env.DB_ENCRYPTION_KEY || "it-orbit-system-fallback-secret-2026-secure-v1";
const ORBIT_UPDATE_REPO =
  process.env.GITHUB_UPDATE_REPO || "https://github.com/llDecsterll/uvwstack.git";
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

const DB_PATH = path.join(process.cwd(), "db.json");
const CONFIG_PATH = path.join(process.cwd(), "db_config.json");

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

// SQL connectivity helpers
async function testSqlConn(config: any): Promise<void> {
  if (config.type === "mysql") {
    const mysql = await import("mysql2/promise");
    const connection = await mysql.createConnection({
      host: config.host || "localhost",
      port: Number(config.port) || 3306,
      database: config.database || "orbit_db",
      user: config.user || "root",
      password: config.password || "",
      connectTimeout: 5000
    });
    await connection.ping();
    await connection.end();
  } else if (config.type === "postgres") {
    const pg = await import("pg");
    const client = new pg.Pool({
      host: config.host || "localhost",
      port: Number(config.port) || 5432,
      database: config.database || "orbit_db",
      user: config.user || "postgres",
      password: config.password || "",
      connectionTimeoutMillis: 5000
    });
    await client.query("SELECT 1");
    await client.end();
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
    const connection = await mysql.createConnection({
      host: config.host || "localhost",
      port: Number(config.port) || 3306,
      database: config.database || "orbit_db",
      user: config.user || "root",
      password: config.password || "",
    });
    
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
    const client = new pg.Pool({
      host: config.host || "localhost",
      port: Number(config.port) || 5432,
      database: config.database || "orbit_db",
      user: config.user || "postgres",
      password: config.password || "",
    });
    
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
    const connection = await mysql.createConnection({
      host: config.host || "localhost",
      port: Number(config.port) || 3306,
      database: config.database || "orbit_db",
      user: config.user || "root",
      password: config.password || "",
    });

    await connection.query(`
      CREATE TABLE IF NOT EXISTS orbit_secure_store (
        store_key VARCHAR(128) PRIMARY KEY,
        store_value LONGTEXT NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    for (const key of Object.keys(payload)) {
      const val = payload[key];
      const encryptedValue = encrypt(JSON.stringify(val));
      await connection.query(`
        INSERT INTO orbit_secure_store (store_key, store_value) 
        VALUES (?, ?) 
        ON DUPLICATE KEY UPDATE store_value = VALUES(store_value)
      `, [key, encryptedValue]);
    }
    await connection.end();
  } else if (config.type === "postgres") {
    const pg = await import("pg");
    const client = new pg.Pool({
      host: config.host || "localhost",
      port: Number(config.port) || 5432,
      database: config.database || "orbit_db",
      user: config.user || "postgres",
      password: config.password || "",
    });

    await client.query(`
      CREATE TABLE IF NOT EXISTS orbit_secure_store (
        store_key VARCHAR(128) PRIMARY KEY,
        store_value TEXT NOT NULL
      );
    `);

    for (const key of Object.keys(payload)) {
      const val = payload[key];
      const encryptedValue = encrypt(JSON.stringify(val));
      await client.query(`
        INSERT INTO orbit_secure_store (store_key, store_value) 
        VALUES ($1, $2) 
        ON CONFLICT (store_key) 
        DO UPDATE SET store_value = EXCLUDED.store_value
      `, [key, encryptedValue]);
    }
    await client.end();
  }
}

function stripLicenseArtifacts(data: any): any {
  if (!data || typeof data !== "object") return data;
  const cleaned = { ...data };
  const blockedKeys = [
    "license_key",
    "license_key_sig",
    "system_mac",
    "system_fingerprint",
    "trial_start",
    "trial_sig",
    "_ao_telemetry_pt",
    "_ao_telemetry_sig",
    "_ao_telemetry_mt",
    "_ao_telemetry_tf",
    "max_time",
    "tamper_flag",
    "license_failures",
    "license_failures_sig",
    "license_lockout_until",
    "license_lockout_sig",
    "license_last_attempt",
  ];
  for (const key of blockedKeys) {
    delete cleaned[key];
  }
  return cleaned;
}

async function startServer() {
  // Body parser limit increased to handle large state arrays, uploaded base64 data, logos etc.
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Main data API with fallback
  app.get("/api/data", async (req, res) => {
    try {
      const config = readDbConfig();
      if (config.type === "mysql" || config.type === "postgres") {
        try {
          const sqlData = await loadFromSql(config);
          if (sqlData) {
            return res.json(sqlData);
          }
        } catch (sqlErr) {
          console.error("SQL load error, falling back to local file", sqlErr);
        }
      }

      // Default JSON encryption fallback
      if (fs.existsSync(DB_PATH)) {
        const fileContent = fs.readFileSync(DB_PATH, "utf-8").trim();
        if (!fileContent) {
          return res.json(null);
        }
        
        if (fileContent.startsWith("{")) {
          const raw = JSON.parse(fileContent);
          const encryptedRaw = encrypt(fileContent);
          fs.writeFileSync(DB_PATH, encryptedRaw, "utf-8");
          return res.json(raw);
        }
        
        const decrypted = decrypt(fileContent);
        return res.json(JSON.parse(decrypted));
      }
      return res.json(null);
    } catch (error) {
      console.error("Error reading database:", error);
      return res.status(500).json({ error: "Failed to read server database" });
    }
  });

  app.post("/api/data", async (req, res) => {
    try {
      const data = req.body;
      const config = readDbConfig();

      if (config.type === "mysql" || config.type === "postgres") {
        try {
          await saveToSql(config, data);
          return res.json({ success: true });
        } catch (sqlErr) {
          console.error("SQL save error, writing fallback to local file also", sqlErr);
        }
      }

      // Also write locally as failover backup
      const rawString = JSON.stringify(data, null, 2);
      const encryptedData = encrypt(rawString);
      fs.writeFileSync(DB_PATH, encryptedData, "utf-8");
      return res.json({ success: true });
    } catch (error) {
      console.error("Error writing database:", error);
      return res.status(500).json({ error: "Failed to save data" });
    }
  });

  // Export encrypted backup (supports transferring db easily)
  app.get("/api/backup/export", async (req, res) => {
    try {
      const config = readDbConfig();
      let rawString = "";

      if (config.type === "mysql" || config.type === "postgres") {
        try {
          const sqlData = await loadFromSql(config);
          if (sqlData) {
            rawString = JSON.stringify(stripLicenseArtifacts(sqlData), null, 2);
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
  app.post("/api/backup/import", async (req, res) => {
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
      const config = readDbConfig();
      if (config.type === "mysql" || config.type === "postgres") {
        await saveToSql(config, sanitized);
      }

      fs.writeFileSync(DB_PATH, encrypt(JSON.stringify(sanitized, null, 2)), "utf-8");
      return res.json({ success: true });
    } catch (error) {
      console.error("Error importing backup:", error);
      return res.status(500).json({ error: "Failed to import backup" });
    }
  });

  // GET current DB config settings (removes sensitive credentials)
  app.get("/api/db-config", (req, res) => {
    const config = readDbConfig();
    const cleanConfig = { ...config };
    if (cleanConfig.password) {
      cleanConfig.password = "●●●●●●●●"; // Mask password
    }
    return res.json(cleanConfig);
  });

  // GET active monitored database connection status
  app.get("/api/db-status", async (req, res) => {
    if (lastDbStatus.status === "unchecked") {
      await checkDatabaseConnection();
    }
    return res.json(lastDbStatus);
  });

  // TEST database connection with given params
  app.post("/api/db-config/test", async (req, res) => {
    try {
      const config = req.body;
      if (config.type === "json") {
        return res.json({ success: true, message: "Local JSON storage does not require connection testing" });
      }
      await testSqlConn(config);
      return res.json({ success: true, message: "Connection established successfully!" });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || "Database connection test failed" });
    }
  });

  // SAVE database configuration and migrate data
  app.post("/api/db-config", async (req, res) => {
    try {
      const newConfig = req.body;
      const oldConfig = readDbConfig();

      if (newConfig.type !== "json") {
        if (newConfig.password === "●●●●●●●●") {
          newConfig.password = oldConfig.password || "";
        }
        await testSqlConn(newConfig);
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

  function parseGithubRepo(repoUrl: string): { owner: string; repo: string } | null {
    const match = repoUrl.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/i);
    if (!match) return null;
    return { owner: match[1], repo: match[2] };
  }

  app.get("/api/update/check", async (req, res) => {
    try {
      const repoUrl = String(req.query.repo || ORBIT_UPDATE_REPO);
      const parsed = parseGithubRepo(repoUrl);
      if (!parsed) {
        return res.status(400).json({ error: "Invalid GitHub repository URL" });
      }

      const headers = {
        Accept: "application/vnd.github+json",
        "User-Agent": "Orbit-Update-Checker/1.0",
      };

      let latestTag = "";
      let releaseUrl = "";
      let releaseNotes = "";
      let publishedAt = "";
      let latestCommitSha = "";
      let latestCommitDate = "";
      let defaultBranch = "main";
      let updateSource: "release" | "tag" | "commit" = "commit";

      const releaseRes = await fetch(
        `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/releases/latest`,
        { headers }
      );

      if (releaseRes.ok) {
        const release = (await releaseRes.json()) as {
          tag_name?: string;
          html_url?: string;
          body?: string;
          published_at?: string;
        };
        latestTag = release.tag_name || "";
        releaseUrl = release.html_url || "";
        releaseNotes = release.body || "";
        publishedAt = release.published_at || "";
        updateSource = "release";
      } else {
        const tagRes = await fetch(
          `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/tags?per_page=1`,
          { headers }
        );
        if (tagRes.ok) {
          const tags = (await tagRes.json()) as Array<{ name?: string }>;
          latestTag = tags[0]?.name || "";
          if (latestTag) {
            releaseUrl = `https://github.com/${parsed.owner}/${parsed.repo}/releases/tag/${latestTag}`;
            updateSource = "tag";
          }
        }

        if (!latestTag) {
          const repoMetaRes = await fetch(
            `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
            { headers }
          );
          if (repoMetaRes.ok) {
            const meta = (await repoMetaRes.json()) as { default_branch?: string; html_url?: string };
            defaultBranch = meta.default_branch || "main";
            releaseUrl = meta.html_url || `https://github.com/${parsed.owner}/${parsed.repo}`;
          }

          const commitRes = await fetch(
            `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/commits/${defaultBranch}`,
            { headers }
          );
          if (!commitRes.ok) {
            return res.status(502).json({ error: "Unable to reach GitHub API for this repository" });
          }
          const head = (await commitRes.json()) as {
            sha?: string;
            commit?: { message?: string; author?: { date?: string } };
            html_url?: string;
          };
          latestCommitSha = head?.sha?.slice(0, 7) || "";
          latestCommitDate = head?.commit?.author?.date || "";
          latestTag = latestCommitSha ? `${defaultBranch}@${latestCommitSha}` : defaultBranch;
          releaseNotes = head?.commit?.message || "";
          publishedAt = latestCommitDate;
          releaseUrl = head?.html_url || releaseUrl;
          updateSource = "commit";
        }
      }

      return res.json({
        repository: `${parsed.owner}/${parsed.repo}`,
        repoUrl: ORBIT_UPDATE_REPO,
        latestTag,
        releaseUrl,
        releaseNotes,
        publishedAt,
        latestCommitSha,
        defaultBranch,
        updateSource,
        checkedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Update check failed:", error);
      return res.status(500).json({ error: "Failed to check GitHub updates" });
    }
  });

  app.get("/api/update/repo", (_req, res) => {
    return res.json({ repoUrl: ORBIT_UPDATE_REPO });
  });

  // Block access to source maps and TypeScript sources in production
  if (process.env.NODE_ENV === "production") {
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
  if (process.env.NODE_ENV !== "production") {
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
  checkDatabaseConnection().catch((err) => console.error("Initial startup database link failure:", err));
  setInterval(() => {
    checkDatabaseConnection().catch((err) => console.error("Periodic database link failure:", err));
  }, 12000);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Orbit Server] Active Multi-DBMS secured container server running on port ${PORT}`);
  });
}

startServer();
