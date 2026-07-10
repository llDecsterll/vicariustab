/**
 * Browser QA — smoke + tab navigation for all Vicariustab modules.
 * Run: npm run build && npm run browser:qa
 * Or against running server: QA_BASE_URL=http://127.0.0.1:8098 npm run browser:qa
 */
import { spawn } from 'child_process';
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import os from 'os';

const PORT = Number(process.env.QA_PORT) || 8770;
const BASE = process.env.QA_BASE_URL || `http://127.0.0.1:${PORT}`;
const USE_EXTERNAL = Boolean(process.env.QA_BASE_URL);
const DATA_ROOT = path.join(process.cwd(), '.browser-qa-data');

const SETUP = {
  login: 'qa_admin',
  email: 'qa@audit.local',
  password: 'qa_pass_8min',
};

const SIDEBAR_TABS = [
  { id: 'dashboard', label: 'Дашборд' },
  { id: 'computers', label: 'Компьютеры' },
  { id: 'network', label: 'Сетевое оборудование' },
  { id: 'peripherals', label: 'Периферия' },
  { id: 'orgtech', label: 'Принтеры' },
  { id: 'surveillance', label: 'Камеры СКУД' },
  { id: 'consumables', label: 'Расходники' },
  { id: 'other_equip', label: 'Другое оборудование' },
  { id: 'employees', label: 'Сотрудники' },
  { id: 'objects', label: 'Объекты' },
  { id: 'warehouse', label: 'Склад IT' },
  { id: 'software', label: 'ПО и лицензии' },
  { id: 'inventory', label: 'Инвентаризация' },
  { id: 'warranties', label: 'Гарантия и обслуживание' },
  { id: 'reports', label: 'Отчеты' },
  { id: 'activity_log', label: 'Журнал действий' },
  { id: 'security', label: 'Кибербезопасность' },
];

const CHROME_PATHS = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
].filter(Boolean);

function resolveBrowserPath() {
  for (const p of CHROME_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Chrome/Edge not found. Set CHROME_PATH env variable.');
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
    await wait(500);
  }
  throw new Error(`Server did not start on ${BASE}`);
}

function startServer(dataDir) {
  const env = {
    ...process.env,
    PORT: String(PORT),
    STACK_DATA_DIR: dataDir,
    DB_ENCRYPTION_KEY: process.env.DB_ENCRYPTION_KEY || 'browser-qa-encryption-key-32chars',
    NODE_ENV: 'production',
  };
  return spawn('node', ['dist/server.cjs'], {
    cwd: process.cwd(),
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

async function isOnSetup(page) {
  return page.evaluate(() => !document.querySelector('#loginEmail'));
}

async function fillSetupForm(page) {
  await page.waitForSelector('form input[type="text"]', { timeout: 30000 });
  const login = await page.$('form input[type="text"]');
  const email = await page.$('form input[type="email"]');
  const passwords = await page.$$('form input[type="password"]');
  if (!login || !email || passwords.length < 2) {
    throw new Error('Setup form inputs not found');
  }
  await login.click({ clickCount: 3 });
  await login.type(SETUP.login, { delay: 10 });
  await email.click({ clickCount: 3 });
  await email.type(SETUP.email, { delay: 10 });
  await passwords[0].click({ clickCount: 3 });
  await passwords[0].type(SETUP.password, { delay: 10 });
  await passwords[1].click({ clickCount: 3 });
  await passwords[1].type(SETUP.password, { delay: 10 });
  await wait(300);
}

async function submitSetup(page) {
  await page.click('form button[type="submit"]');
  await page.waitForSelector('#loginEmail', { timeout: 30000 });
  await wait(1500);
}

async function login(page) {
  await page.click('#loginEmail', { clickCount: 3 });
  await page.type('#loginEmail', SETUP.login, { delay: 10 });
  await page.click('#password', { clickCount: 3 });
  await page.type('#password', SETUP.password, { delay: 10 });
  await page.click('form button[type="submit"]');
  await page.waitForSelector('aside button', { timeout: 30000 });
  await wait(2000);
}

async function clickSidebar(page, label) {
  const clicked = await page.evaluate((text) => {
    const buttons = [...document.querySelectorAll('aside button')];
    const btn = buttons.find(
      (b) => (b.textContent || '').trim().includes(text) || b.getAttribute('title') === text
    );
    if (btn) {
      btn.scrollIntoView({ block: 'center' });
      btn.click();
      return true;
    }
    return false;
  }, label);
  return clicked;
}

async function openHeaderMenu(page) {
  const buttons = await page.$$('header button');
  for (const btn of buttons) {
    const text = await page.evaluate((el) => el.textContent || '', btn);
    if (/администратор|admin|管理员|редактирование|просмотр/i.test(text)) {
      await btn.click();
      await wait(400);
      return true;
    }
  }
  if (buttons.length > 0) {
    await buttons[buttons.length - 1].click();
    await wait(400);
    return true;
  }
  return false;
}

async function openSettings(page) {
  await openHeaderMenu(page);
  const clicked = await page.evaluate(() => {
    const items = [...document.querySelectorAll('header button')];
    const btn = items.find((b) => (b.textContent || '').includes('Настройки') || (b.textContent || '').includes('Settings'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  await wait(1500);
  return clicked;
}

async function checkTabContent(page, tabId) {
  return page.evaluate((id) => {
    const header = document.querySelector('header h1');
    const main = document.querySelector('main');
    const hasMain = Boolean(main && main.innerText.trim().length > 20);
    const hasHeader = Boolean(header && header.innerText.trim().length > 0);
    const hasErrorBoundary = Boolean(document.querySelector('[data-error], .text-red-600.font-bold'));
    return { tabId: id, hasMain, hasHeader, hasErrorBoundary };
  }, tabId);
}

function isNoiseConsole(msg) {
  return /favicon|devtools|extension|third-party|analytics/i.test(msg);
}

async function main() {
  let server = null;
  let dataDir = null;

  if (!USE_EXTERNAL) {
    dataDir = path.join(DATA_ROOT, `run-${Date.now()}`);
    resetDataDir(dataDir);
    server = startServer(dataDir);
    server.stdout?.on('data', () => {});
    server.stderr?.on('data', (d) => process.stderr.write(d));
    await waitForServer();
    console.log(`[browser-qa] Server started on ${BASE}`);
  } else {
    await waitForServer();
    console.log(`[browser-qa] Using external server ${BASE}`);
  }

  const browser = await puppeteer.launch({
    executablePath: resolveBrowserPath(),
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const consoleErrors = [];
  const networkFailures = [];
  const tabResults = [];

  try {
    const page = await browser.newPage();
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !isNoiseConsole(msg.text())) {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => consoleErrors.push(`[page] ${err.message}`));
    page.on('response', (res) => {
      const url = res.url();
      const status = res.status();
      if (status >= 400 && url.includes('/api/') && !url.includes('/api/update/')) {
        networkFailures.push(`${status} ${url}`);
      }
    });

    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 90000 });
    await wait(1500);

    if (await isOnSetup(page)) {
      await fillSetupForm(page);
      await submitSetup(page);
      await login(page);
    } else if (await page.$('#loginEmail')) {
      console.warn('[browser-qa] Existing install — skipping login (read-only smoke)');
    } else {
      console.log('[browser-qa] Already authenticated');
    }

    if (await page.$('aside button')) {
      for (const tab of SIDEBAR_TABS) {
        const clicked = await clickSidebar(page, tab.label);
        await wait(1200);
        const content = await checkTabContent(page, tab.id);
        tabResults.push({
          id: tab.id,
          label: tab.label,
          navigated: clicked,
          ...content,
        });
        const status = clicked && content.hasMain && !content.hasErrorBoundary ? '✓' : '✗';
        console.log(`  ${status} ${tab.label} (${tab.id})`);
      }

      const settingsOk = await openSettings(page);
      const settingsContent = await checkTabContent(page, 'settings');
      tabResults.push({
        id: 'settings',
        label: 'Настройки',
        navigated: settingsOk,
        ...settingsContent,
      });
      console.log(`  ${settingsOk && settingsContent.hasMain ? '✓' : '✗'} Настройки (settings)`);
    }

    const criticalConsole = [...new Set(consoleErrors)].filter((e) => !isNoiseConsole(e));
    const criticalNetwork = [...new Set(networkFailures)];

    const failedTabs = tabResults.filter(
      (t) => !t.navigated || !t.hasMain || t.hasErrorBoundary
    );

    console.log('\n## QA Report —', BASE);
    console.log('### Smoke');
    console.log(`- Console errors: ${criticalConsole.length}`);
    if (criticalConsole.length) criticalConsole.slice(0, 5).forEach((e) => console.log(`  · ${e}`));
    console.log(`- API failures: ${criticalNetwork.length}`);
    if (criticalNetwork.length) criticalNetwork.slice(0, 5).forEach((e) => console.log(`  · ${e}`));

    console.log('### Tabs');
    const okCount = tabResults.filter((t) => t.navigated && t.hasMain && !t.hasErrorBoundary).length;
    console.log(`- Navigated: ${okCount}/${tabResults.length}`);

    if (failedTabs.length) {
      console.log('### Failed tabs');
      failedTabs.forEach((t) => console.log(`- ${t.label}: navigated=${t.navigated}, hasMain=${t.hasMain}`));
    }

    const verdict =
      failedTabs.length === 0 && criticalConsole.length === 0 && criticalNetwork.length === 0
        ? 'SHIP'
        : failedTabs.length === 0
          ? 'SHIP WITH FIXES'
          : 'DO NOT SHIP';
    console.log(`\n### Verdict: ${verdict}`);

    if (verdict === 'DO NOT SHIP') process.exit(1);
  } finally {
    await browser.close();
    if (server) {
      server.kill('SIGTERM');
      await wait(500);
    }
    if (dataDir && !process.env.QA_KEEP_DATA) {
      fs.rmSync(dataDir, { recursive: true, force: true });
    }
  }
}

main().catch((err) => {
  console.error('[browser-qa] FAILED:', err.message);
  process.exit(1);
});
