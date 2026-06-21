/*
 * Vicariustab — GitHub auto-update engine (backup → download → build → restart)
 */
import fs from "fs";
import path from "path";
import { execFile, spawn } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export interface UpdateCheckPayload {
  repository: string;
  repoUrl: string;
  currentVersion: string;
  remoteVersion: string;
  updateAvailable: boolean;
  latestTag?: string;
  releaseUrl?: string;
  releaseNotes?: string;
  publishedAt?: string;
  latestCommitSha?: string;
  defaultBranch?: string;
  updateSource?: string;
  checkedAt?: string;
}

export interface UpdateJob {
  status: "idle" | "running" | "completed" | "failed";
  progress: number;
  step: string;
  logs: string[];
  error?: string;
  backupDir?: string;
  remoteVersion?: string;
  latestCommitSha?: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface UpdateEngineConfig {
  repoUrl: string;
  appVersion: string;
  dataDir: string;
  appRoot: string;
  encrypt: (text: string) => string;
  readDbConfig: () => any;
  fetchGithubCheck: () => Promise<UpdateCheckPayload>;
}

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "coverage", "data", "backups"]);
const SKIP_FILES = new Set(["db.json", "db_config.json", ".env"]);

let currentJob: UpdateJob = { status: "idle", progress: 0, step: "", logs: [] };

export function getUpdateJob(): UpdateJob {
  return { ...currentJob, logs: [...currentJob.logs] };
}

function pushLog(text: string) {
  const time = new Date().toLocaleTimeString("ru-RU");
  currentJob.logs.push(`[${time}] ${text}`);
  if (currentJob.logs.length > 200) currentJob.logs.shift();
}

function setStep(step: string, progress: number) {
  currentJob.step = step;
  currentJob.progress = Math.min(100, Math.max(0, progress));
}

function parseGithubRepo(repoUrl: string): { owner: string; repo: string } | null {
  const match = repoUrl.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/i);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

async function downloadFile(url: string, destPath: string): Promise<void> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Vicariustab-Update-Engine/1.0" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Download failed (${res.status}): ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.promises.writeFile(destPath, buf);
}

async function extractTarGz(archivePath: string, destDir: string): Promise<string> {
  await fs.promises.mkdir(destDir, { recursive: true });
  await execFileAsync("tar", ["-xzf", archivePath, "-C", destDir]);
  const entries = await fs.promises.readdir(destDir);
  const root = entries.find((e) => !e.startsWith("."));
  if (!root) throw new Error("Archive extraction produced empty directory");
  return path.join(destDir, root);
}

async function copyTree(src: string, dest: string, dataDir: string): Promise<void> {
  const stat = await fs.promises.stat(src);
  if (stat.isDirectory()) {
    const base = path.basename(src);
    if (SKIP_DIRS.has(base)) return;
    await fs.promises.mkdir(dest, { recursive: true });
    const children = await fs.promises.readdir(src);
    for (const child of children) {
      await copyTree(path.join(src, child), path.join(dest, child), dataDir);
    }
    return;
  }

  const fileName = path.basename(src);
  if (SKIP_FILES.has(fileName)) return;

  const destResolved = path.resolve(dest);
  const dataResolved = path.resolve(dataDir);
  if (destResolved.startsWith(dataResolved + path.sep) || destResolved === dataResolved) {
    return;
  }

  await fs.promises.mkdir(path.dirname(dest), { recursive: true });
  await fs.promises.copyFile(src, dest);
}

async function createPreUpdateBackup(cfg: UpdateEngineConfig): Promise<string> {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupRoot = path.join(cfg.dataDir, "backups", `pre-update-${stamp}`);
  await fs.promises.mkdir(backupRoot, { recursive: true });

  const files = ["db.json", "db_config.json"];
  for (const name of files) {
    const src = path.join(cfg.dataDir, name);
    if (fs.existsSync(src)) {
      await fs.promises.copyFile(src, path.join(backupRoot, name));
    }
  }

  const manifest = {
    createdAt: new Date().toISOString(),
    appVersion: cfg.appVersion,
    dataDir: cfg.dataDir,
    files: files.filter((f) => fs.existsSync(path.join(cfg.dataDir, f))),
  };
  await fs.promises.writeFile(
    path.join(backupRoot, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf-8"
  );

  return backupRoot;
}

async function runCommand(
  cwd: string,
  command: string,
  args: string[],
  phase: "install" | "build" = "build"
): Promise<void> {
  pushLog(`> ${command} ${args.join(" ")}`);
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    SKIP_OBFUSCATION: "true",
  };
  if (phase === "install") {
    // npm ci must install devDependencies (esbuild, typescript, tailwind, etc.)
    env.NPM_CONFIG_PRODUCTION = "false";
    delete env.NODE_ENV;
  } else {
    env.NODE_ENV = "production";
  }
  await execFileAsync(command, args, {
    cwd,
    env,
    maxBuffer: 20 * 1024 * 1024,
  });
}

function scheduleProcessRestart(appRoot: string) {
  const pm2Name = process.env.PM2_APP_NAME || "vicariustab-system";
  pushLog(`Scheduling restart (${pm2Name} or node dist/server.cjs)...`);

  setTimeout(() => {
    execFile("pm2", ["restart", pm2Name], (pm2Err) => {
      if (!pm2Err) {
        console.log(`[Update] PM2 restart ${pm2Name} triggered`);
        return;
      }
      const script = path.join(appRoot, "dist", "server.cjs");
      if (!fs.existsSync(script)) {
        console.error("[Update] Cannot restart: dist/server.cjs missing");
        process.exit(1);
        return;
      }
      const child = spawn(process.execPath, [script], {
        cwd: appRoot,
        detached: true,
        stdio: "ignore",
        env: process.env,
      });
      child.unref();
      process.exit(0);
    });
  }, 2500);
}

export async function startPlatformUpdate(cfg: UpdateEngineConfig): Promise<void> {
  if (currentJob.status === "running") {
    throw new Error("Update already in progress");
  }

  if (process.env.STACK_DISABLE_AUTO_UPDATE === "true") {
    throw new Error("Auto-update is disabled on this server (STACK_DISABLE_AUTO_UPDATE=true)");
  }

  try {
    await fs.promises.access(cfg.appRoot, fs.constants.W_OK);
  } catch {
    throw new Error(
      "Application directory is read-only. Auto-update works with PM2/native install or Docker with writable app volume."
    );
  }

  const check = await cfg.fetchGithubCheck();
  if (!check.updateAvailable) {
    throw new Error("No newer version on GitHub — update not required");
  }

  currentJob = {
    status: "running",
    progress: 0,
    step: "init",
    logs: [],
    remoteVersion: check.remoteVersion,
    latestCommitSha: check.latestCommitSha,
    startedAt: new Date().toISOString(),
  };

  const parsed = parseGithubRepo(cfg.repoUrl);
  if (!parsed) {
    currentJob.status = "failed";
    currentJob.error = "Invalid GitHub repository URL";
    return;
  }

  const branch = check.defaultBranch || "main";
  const tmpRoot = path.join(cfg.dataDir, "backups", `.update-tmp-${Date.now()}`);
  const archivePath = path.join(tmpRoot, "source.tar.gz");

  try {
    setStep("backup", 5);
    pushLog("Creating pre-update data backup...");
    const backupDir = await createPreUpdateBackup(cfg);
    currentJob.backupDir = backupDir;
    pushLog(`Backup saved: ${backupDir}`);

    setStep("download", 15);
    pushLog(`Downloading ${parsed.owner}/${parsed.repo}@${branch} from GitHub...`);
    await fs.promises.mkdir(tmpRoot, { recursive: true });
    const tarballUrl = `https://codeload.github.com/${parsed.owner}/${parsed.repo}/tar.gz/${branch}`;
    await downloadFile(tarballUrl, archivePath);

    setStep("extract", 30);
    pushLog("Extracting release archive...");
    const extractedRoot = await extractTarGz(archivePath, path.join(tmpRoot, "extract"));

    setStep("apply", 45);
    pushLog("Applying application files (data directory preserved)...");
    await copyTree(extractedRoot, cfg.appRoot, cfg.dataDir);

    setStep("install", 60);
    pushLog("Installing dependencies (npm ci --include=dev)...");
    await runCommand(cfg.appRoot, process.platform === "win32" ? "npm.cmd" : "npm", ["ci", "--include=dev"], "install");

    setStep("build", 80);
    pushLog("Building production bundle...");
    await runCommand(cfg.appRoot, process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"], "build");

    setStep("finalize", 95);
    pushLog(`Update applied: v${cfg.appVersion} → v${check.remoteVersion}`);
    if (check.latestCommitSha) {
      pushLog(`Commit: ${check.latestCommitSha}`);
    }

    currentJob.status = "completed";
    currentJob.progress = 100;
    currentJob.step = "completed";
    currentJob.finishedAt = new Date().toISOString();
    pushLog("Update completed. Restarting platform...");

    scheduleProcessRestart(cfg.appRoot);
  } catch (err: any) {
    currentJob.status = "failed";
    currentJob.error = err?.message || String(err);
    currentJob.finishedAt = new Date().toISOString();
    pushLog(`ERROR: ${currentJob.error}`);
    throw err;
  } finally {
    try {
      await fs.promises.rm(tmpRoot, { recursive: true, force: true });
    } catch {
      /* non-blocking */
    }
  }
}

export function resetUpdateJobIfStale(maxAgeMs = 30 * 60 * 1000) {
  if (currentJob.status !== "running") return;
  const started = currentJob.startedAt ? Date.parse(currentJob.startedAt) : 0;
  if (Date.now() - started > maxAgeMs) {
    currentJob = { status: "idle", progress: 0, step: "", logs: currentJob.logs };
  }
}
