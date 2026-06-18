/* Release */
/**
 * Capture Stack UI screenshots for README documentation.
 * Run: npm run build && npm run screenshots
 */
import { spawn } from "child_process";
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const PORT = Number(process.env.SCREENSHOT_PORT) || 8765;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT_DIR = path.join(process.cwd(), "docs", "screenshots");

const SHOTS = [
  { file: "01-login.png", action: null },
  { file: "02-dashboard.png", nav: ["Дашборд"] },
  { file: "03-computers.png", nav: ["Оборудование", "Компьютеры"] },
  { file: "04-network.png", nav: ["Оборудование", "Сетевое оборуд."] },
  { file: "05-warehouse.png", nav: ["Склад ИТ"] },
  { file: "06-employees.png", nav: ["Сотрудники"] },
  { file: "07-reports.png", nav: ["Отчеты"] },
  { file: "08-settings.png", nav: ["Настройки"] },
];

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
  const useDev = process.env.SCREENSHOT_DEV !== "0";
  if (useDev) {
    return spawn("npx", ["tsx", "server.ts"], {
      cwd: process.cwd(),
      env: { ...process.env, PORT: String(PORT), NODE_ENV: "development" },
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
    });
  }
  return spawn("node", ["dist/server.cjs"], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(PORT), NODE_ENV: "production" },
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
    console.warn(`  [warn] sidebar button not found: ${label}`);
  }
  await wait(1100);
}

async function captureScreenshots() {
  if (!fs.existsSync(path.join(process.cwd(), "dist", "server.cjs"))) {
    throw new Error("Run npm run build first");
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

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

    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    page.on("pageerror", (err) => console.error("  [page]", err.message));
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

    await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForFunction(
      () => document.querySelector("#loginEmail") || document.querySelector("aside button"),
      { timeout: 30000 }
    );
    await wait(2000);

    const onLogin = await page.$("#loginEmail");
    if (onLogin) {
      await page.screenshot({ path: path.join(OUT_DIR, "01-login.png"), fullPage: false });
      console.log("  ✓ 01-login.png");

      await page.click("#loginEmail", { clickCount: 3 });
      await page.type("#loginEmail", "Admin", { delay: 20 });
      await page.click("#password", { clickCount: 3 });
      await page.type("#password", "admin", { delay: 20 });
      await page.click('form button[type="submit"]');
      await page.waitForSelector("aside button", { timeout: 15000 });
      await wait(2500);
    } else {
      console.log("  ✓ already logged in / skipping login shot");
    }

    for (const shot of SHOTS.slice(1)) {
      if (shot.nav) {
        for (const label of shot.nav) {
          await clickSidebar(page, label);
        }
      }
      await wait(500);
      await page.screenshot({ path: path.join(OUT_DIR, shot.file), fullPage: false });
      console.log(`  ✓ ${shot.file}`);
    }

    await browser.close();
    console.log(`[screenshots] Saved to ${OUT_DIR}`);
  } finally {
    server.kill("SIGTERM");
    await wait(500);
  }
}

captureScreenshots().catch((err) => {
  console.error("[screenshots] Failed:", err.message);
  process.exit(1);
});
