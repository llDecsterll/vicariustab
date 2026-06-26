/* Release */
/**
 * Capture Vicariustab UI screenshots for README (ru / en / zh).
 * Run: npm run build && npm run screenshots
 */
import { spawn } from "child_process";
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const PORT = Number(process.env.SCREENSHOT_PORT) || 8768;
const BASE = `http://127.0.0.1:${PORT}`;
const ROOT_OUT = path.join(process.cwd(), "docs", "screenshots");
const SCREENSHOT_DATA_ROOT = path.join(process.cwd(), ".screenshot-data");

/** Sidebar labels per UI language (from src/utils/i18n.tsx) */
const LOCALES = {
  ru: {
    workspace: "Инвентаризация оборудования",
    setup: {
      login: "admin",
      email: "admin@company.ru",
      password: "admin12345",
    },
    nav: {
      dashboard: "Дашборд",
      computers: "Компьютеры",
      network: "Сетевое оборудование",
      warehouse: "Склад IT",
      employees: "Сотрудники",
      reports: "Отчеты",
      settings: "Настройки",
    },
  },
  en: {
    workspace: "Equipment Inventory",
    setup: {
      login: "admin",
      email: "admin@company.ru",
      password: "admin12345",
    },
    nav: {
      dashboard: "Dashboard",
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
    setup: {
      login: "admin",
      email: "admin@company.ru",
      password: "admin12345",
    },
    nav: {
      dashboard: "仪表盘",
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
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
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

function resetDataDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

async function waitForServer(maxMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.ok) return;
    } catch {
      // retry
    }
    await wait(600);
  }
  throw new Error(`Server did not start on ${BASE}`);
}

function startServer(dataDir) {
  const env = {
    ...process.env,
    PORT: String(PORT),
    STACK_DATA_DIR: dataDir,
    DB_ENCRYPTION_KEY:
      process.env.DB_ENCRYPTION_KEY || "screenshot-dev-encryption-key-32chars",
    NODE_ENV: "production",
  };
  return spawn("node", ["dist/server.cjs"], {
    cwd: process.cwd(),
    env,
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
  await wait(1200);
}

async function clickHeaderSettings(page, settingsLabel) {
  const menuButtons = await page.$$("header button");
  let opened = false;
  for (const btn of menuButtons) {
    const text = await page.evaluate((el) => el.textContent || "", btn);
    if (/admin|администратор|管理员/i.test(text)) {
      await btn.click();
      opened = true;
      break;
    }
  }
  if (!opened && menuButtons.length > 0) {
    await menuButtons[menuButtons.length - 1].click();
  }
  await wait(600);

  const clicked = await page.evaluate((text) => {
    const items = [...document.querySelectorAll("header button, header a")];
    const btn = items.find((b) => (b.textContent || "").trim().includes(text));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  }, settingsLabel);
  if (!clicked) {
    console.warn(`    [warn] header settings not found: ${settingsLabel}`);
  }
  await wait(1800);
}

async function prepareLocalePage(page, lang, workspace) {
  await page.goto(BASE, { waitUntil: "networkidle2", timeout: 90000 });
  await page.evaluate(
    (locale, ws) => {
      localStorage.clear();
      localStorage.setItem("orbit_lang", locale);
      localStorage.setItem("it_workspace_name", ws);
    },
    lang,
    workspace
  );
  await page.reload({ waitUntil: "networkidle2", timeout: 90000 });
  await wait(1800);
}

async function isOnSetup(page) {
  return page.evaluate(() => !document.querySelector("#loginEmail"));
}

async function fillSetupForm(page, setup) {
  await page.waitForSelector('form input[type="text"]', { timeout: 30000 });
  const login = await page.$('form input[type="text"]');
  const email = await page.$('form input[type="email"]');
  const passwords = await page.$$('form input[type="password"]');
  if (!login || !email || passwords.length < 2) {
    throw new Error("Setup form inputs not found");
  }

  await login.click({ clickCount: 3 });
  await login.type(setup.login, { delay: 12 });
  await email.click({ clickCount: 3 });
  await email.type(setup.email, { delay: 12 });
  await passwords[0].click({ clickCount: 3 });
  await passwords[0].type(setup.password, { delay: 12 });
  await passwords[1].click({ clickCount: 3 });
  await passwords[1].type(setup.password, { delay: 12 });
  await wait(400);
}

async function submitSetup(page) {
  await page.click('form button[type="submit"]');
  await page.waitForSelector("#loginEmail", { timeout: 30000 });
  await wait(2000);
}

async function captureSetup(page, outDir, setup) {
  if (!(await isOnSetup(page))) {
    throw new Error("Expected first-run setup screen");
  }
  await fillSetupForm(page, setup);
  await page.screenshot({
    path: path.join(outDir, "00-admin-setup.png"),
    fullPage: false,
  });
  console.log("    ✓ 00-admin-setup.png");
  await submitSetup(page);
}

async function captureLogin(page, outDir) {
  await page.screenshot({
    path: path.join(outDir, "01-login.png"),
    fullPage: false,
  });
  console.log("    ✓ 01-login.png");
}

async function login(page, setup) {
  await page.click("#loginEmail", { clickCount: 3 });
  await page.type("#loginEmail", setup.login, { delay: 15 });
  await page.click("#password", { clickCount: 3 });
  await page.type("#password", setup.password, { delay: 15 });
  await page.click('form button[type="submit"]');
  await page.waitForSelector("aside button", { timeout: 30000 });
  await wait(2800);
}

async function captureLocale(browser, lang, cfg, dataDir) {
  const outDir = path.join(ROOT_OUT, lang);
  const labels = cfg.nav;
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`[screenshots] Locale: ${lang}`);
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  page.on("pageerror", (err) => console.error(`    [page] ${err.message}`));

  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  await prepareLocalePage(page, lang, cfg.workspace);
  await page.waitForFunction(
    () =>
      document.querySelector("#loginEmail") ||
      document.querySelector('form input[type="email"]'),
    { timeout: 45000 }
  );

  await captureSetup(page, outDir, cfg.setup);
  await captureLogin(page, outDir);
  await login(page, cfg.setup);

  const shots = [
    { file: "02-dashboard.png", label: labels.dashboard },
    { file: "03-computers.png", label: labels.computers },
    { file: "04-network.png", label: labels.network },
    { file: "05-warehouse.png", label: labels.warehouse },
    { file: "06-employees.png", label: labels.employees },
    { file: "07-reports.png", label: labels.reports },
    { file: "08-settings.png", headerSettings: labels.settings },
  ];

  for (const shot of shots) {
    if (shot.headerSettings) {
      await clickHeaderSettings(page, shot.headerSettings);
    } else {
      await clickSidebar(page, shot.label);
    }
    await wait(700);
    await page.screenshot({
      path: path.join(outDir, shot.file),
      fullPage: false,
    });
    console.log(`    ✓ ${shot.file}`);
  }

  await context.close();
}

async function captureAll() {
  if (!fs.existsSync(path.join(process.cwd(), "dist", "server.cjs"))) {
    throw new Error("Run npm run build first");
  }

  fs.mkdirSync(ROOT_OUT, { recursive: true });

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

  try {
    for (const [lang, cfg] of Object.entries(LOCALES)) {
      const dataDir = path.join(SCREENSHOT_DATA_ROOT, lang);
      resetDataDir(dataDir);

      const server = startServer(dataDir);
      server.stderr?.on("data", (d) => process.stderr.write(d));

      try {
        await waitForServer();
        console.log(`[screenshots] Server ready (${lang})`);
        await captureLocale(browser, lang, cfg, dataDir);
      } finally {
        server.kill("SIGTERM");
        await wait(800);
      }
    }

    console.log(`[screenshots] Done → docs/screenshots/{ru,en,zh}/`);
  } finally {
    await browser.close();
  }
}

captureAll().catch((err) => {
  console.error("[screenshots] Failed:", err.message);
  process.exit(1);
});
