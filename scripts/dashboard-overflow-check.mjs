import puppeteer from 'puppeteer-core';
import { existsSync } from 'fs';

const browserPaths = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`,
  `${process.env.LOCALAPPDATA}/Chromium/Application/chrome.exe`,
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  `${process.env.LOCALAPPDATA}/Microsoft/Edge/Application/msedge.exe`,
];

const executablePath = browserPaths.find((p) => p && existsSync(p));
if (!executablePath) {
  console.log('Browser not found — skip visual check');
  process.exit(0);
}

const browser = await puppeteer.launch({ executablePath, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

try {
  await page.goto('http://127.0.0.1:8098', { waitUntil: 'networkidle0', timeout: 60000 });
} catch {
  console.log('Dev server not reachable on :8098');
  await browser.close();
  process.exit(1);
}

const passwordInput = await page.$('input[type="password"]');
if (passwordInput) {
  const loginInput = await page.$('input[type="text"]');
  if (loginInput) await loginInput.type('admin');
  await passwordInput.type('admin');
  const submit = await page.$('button[type="submit"]');
  if (submit) await submit.click();
  await new Promise((r) => setTimeout(r, 3000));
}

await page.screenshot({ path: 'dashboard-check.png', fullPage: true });

const result = await page.evaluate(() => {
  const issues = [];
  document.querySelectorAll('.dashboard-grid-item').forEach((item) => {
    const panel = item.querySelector('.dashboard-widget-scaler__body > *');
    if (!panel) return;
    const ir = item.getBoundingClientRect();
    const pr = panel.getBoundingClientRect();
    if (pr.bottom > ir.bottom + 3 || pr.right > ir.right + 3) {
      issues.push({
        type: 'bleed',
        bottom: Math.round(pr.bottom - ir.bottom),
        right: Math.round(pr.right - ir.right),
        cls: panel.className.split(' ').slice(0, 3).join(' '),
      });
    }
    const oy = getComputedStyle(panel).overflowY;
    if (
      panel.scrollHeight > panel.clientHeight + 3 &&
      oy !== 'auto' &&
      oy !== 'scroll'
    ) {
      issues.push({
        type: 'clip-y',
        delta: panel.scrollHeight - panel.clientHeight,
        cls: panel.className.split(' ').slice(0, 3).join(' '),
      });
    }
  });
  return {
    widgets: document.querySelectorAll('.dashboard-grid-item').length,
    issues,
  };
});

console.log(JSON.stringify(result, null, 2));
await browser.close();
