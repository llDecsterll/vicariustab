/* Release */
/**
 * Capture Stack UI screenshots for README (ru / en / zh).
 * Run: npm run build && npm run screenshots
 */
import { spawn } from "child_process";
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const PORT = Number(process.env.SCREENSHOT_PORT) || 8768;
const BASE = `http://127.0.0.1:${PORT}`;
const ROOT_OUT = path.join(process.cwd(), "docs", "screenshots");
const SCREENSHOT_DATA_DIR = path.join(process.cwd(), ".screenshot-data");

/** Sidebar labels per UI language (from src/utils/i18n.tsx) */
const LOCALES = {
  ru: {
    workspace: "Инвентаризация оборудования",
    nav: {
      dashboard: "Дашборд",
      equipment: "Оборудование",
      computers: "Компьютеры",
      network: "Сетевое оборуд.",
      warehouse: "Склад ИТ",
      employees: "Сотрудники",
      reports: "Отчеты",
      settings: "Настройки",
    },
  },
  en: {
    workspace: "Equipment Inventory",
    nav: {
      dashboard: "Dashboard",
      equipment: "Equipment",
      computers: "Computer",
      network: "Hardware",
      warehouse: "IT Warehouse",
      employees: "Employees",
      reports: "Reports",
      settings: "Settings",
    },
  },
  zh: {
    workspace: "设备盘点管理",
    nav: {
      dashboard: "仪表盘",
      equipment: "设备",
      computers: "电脑",
      network: "网络设备",
      warehouse: "IT 仓库",
      employees: "员工",
      reports: "报告",
      settings: "设置",
    },
  },
};

const CHROME_PATHS = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
].filter(Boolean);

function resolveBrowserPath() {
  for (const p of CHROME_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error("Chrome/Edge not found. Set CHROME_PATH env variable.");
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForServer(maxMs = 45000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const res = await fetch(`${BASE}/api/update/repo`);
      if (res.ok) return;
    } catch {
      // retry
    }
    await wait(600);
  }
  throw new Error(`Server did not start on ${BASE}`);
}

function startServer() {
  fs.mkdirSync(SCREENSHOT_DATA_DIR, { recursive: true });
  const env = {
    ...process.env,
    PORT: String(PORT),
    STACK_DATA_DIR: SCREENSHOT_DATA_DIR,
  };
  const useDev = process.env.SCREENSHOT_DEV !== "0";
  if (useDev) {
    return spawn("npx", ["tsx", "server.ts"], {
      cwd: process.cwd(),
      env: { ...env, NODE_ENV: "development" },
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
    });
  }
  return spawn("node", ["dist/server.cjs"], {
    cwd: process.cwd(),
    env: { ...env, NODE_ENV: "production" },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

async function clickSidebar(page, label) {
  const clicked = await page.evaluate((text) => {
    const buttons = [...document.querySelectorAll("aside button")];
    const btn = buttons.find(
      (b) =>
        (b.textContent || "").trim().includes(text) ||
        b.getAttribute("title") === text
    );
    if (btn) {
      btn.scrollIntoView({ block: "center" });
      btn.click();
      return true;
    }
    return false;
  }, label);
  if (!clicked) {
    console.warn(`    [warn] sidebar not found: ${label}`);
  }
  await wait(1100);
}

async function prepareLocalePage(page, lang, workspace) {
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.evaluate((locale, ws) => {
    localStorage.clear();
    localStorage.setItem("orbit_lang", locale);
    localStorage.setItem("it_workspace_name", ws);
  }, lang, workspace);
  await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 });
  await wait(1500);
}

async function loginIfNeeded(page, outDir, lang, workspace) {
  await prepareLocalePage(page, lang, workspace);
  await page.waitForFunction(
    () => document.querySelector("#loginEmail") || document.querySelector("aside button"),
    { timeout: 30000 }
  );
  await wait(2000);

  const onLogin = await page.$("#loginEmail");
  if (onLogin) {
    await page.screenshot({ path: path.join(outDir, "01-login.png"), fullPage: false });
    console.log("    ✓ 01-login.png");

    await page.click("#loginEmail", { clickCount: 3 });
    await page.type("#loginEmail", "Admin", { delay: 20 });
    await page.click("#password", { clickCount: 3 });
    await page.type("#password", "admin", { delay: 20 });
    await page.click('form button[type="submit"]');
    await page.waitForSelector("aside button", { timeout: 15000 });
    await wait(2500);
  } else {
    await page.screenshot({ path: path.join(outDir, "01-login.png"), fullPage: false });
    console.log("    ✓ 01-login.png (session)");
  }
}

async function captureLocale(browser, lang, cfg) {
  const outDir = path.join(ROOT_OUT, lang);
  const labels = cfg.nav;
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`[screenshots] Locale: ${lang}`);
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  page.on("pageerror", (err) => console.error(`    [page] ${err.message}`));

  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await loginIfNeeded(page, outDir, lang, cfg.workspace);

  const shots = [
    { file: "02-dashboard.png", nav: [labels.dashboard] },
    { file: "03-computers.png", nav: [labels.equipment, labels.computers] },
    { file: "04-network.png", nav: [labels.equipment, labels.network] },
    { file: "05-warehouse.png", nav: [labels.warehouse] },
    { file: "06-employees.png", nav: [labels.employees] },
    { file: "07-reports.png", nav: [labels.reports] },
    { file: "08-settings.png", nav: [labels.settings] },
  ];

  for (const shot of shots) {
    for (const label of shot.nav) {
      await clickSidebar(page, label);
    }
    await wait(500);
    await page.screenshot({ path: path.join(outDir, shot.file), fullPage: false });
    console.log(`    ✓ ${shot.file}`);
  }

  await context.close();
}

async function captureAll() {
  if (!fs.existsSync(path.join(process.cwd(), "dist", "server.cjs"))) {
    throw new Error("Run npm run build first");
  }

  fs.mkdirSync(ROOT_OUT, { recursive: true });

  const server = startServer();
  server.stderr?.on("data", (d) => process.stderr.write(d));

  try {
    await waitForServer();
    console.log("[screenshots] Server ready");

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: resolveBrowserPath(),
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--window-size=1440,900",
      ],
    });

    for (const [lang, cfg] of Object.entries(LOCALES)) {
      await captureLocale(browser, lang, cfg);
    }

    await browser.close();
    console.log(`[screenshots] Done → docs/screenshots/{ru,en,zh}/`);
  } finally {
    server.kill("SIGTERM");
    await wait(500);
  }
}

captureAll().catch((err) => {
  console.error("[screenshots] Failed:", err.message);
  process.exit(1);
});
