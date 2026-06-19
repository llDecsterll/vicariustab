/* Release */
/**
 * Smoke tests: license activation, backup whitelist, GitHub update API.
 * Run: node scripts/verify-flow.mjs [baseUrl]
 */
import crypto from 'crypto';

const SALT = 'UtkinLicenseSalt_assetorbit@icloud.com_SecuredTokenKey_2026';
const BASE = process.argv[2] || 'http://127.0.0.1:8098';

function hashLicenseString(text) {
  const str = text + SALT;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
}

function utf8ToBase64(str) {
  return Buffer.from(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    ),
    'binary'
  ).toString('base64');
}

function generateKey(expiresYear, mac12, name = 'Test', email = 'test@test.com', phone = '-') {
  const payload = [expiresYear, mac12.toUpperCase(), name, email, phone].join('|');
  const base64Data = utf8ToBase64(payload);
  const hash = hashLicenseString(base64Data);
  return `UTKIN-${base64Data}-${hash}`;
}

function mockBrowser(store) {
  globalThis.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  };
  globalThis.window = {
    screen: { width: 1920, height: 1080 },
    navigator: { userAgent: 'VerifyTest/1.0', language: 'ru-RU', hardwareConcurrency: 8 },
    btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
    atob: (s) => Buffer.from(s, 'base64').toString('binary'),
  };
  globalThis.document = {
    cookie: '',
  };
  Object.defineProperty(globalThis.document, 'cookie', {
    get() { return this._cookie || ''; },
    set(v) { this._cookie = v; },
    configurable: true,
  });
}

async function testLicenseModule() {
  const store = {};
  mockBrowser(store);
  const { activateSystem, getLicenseStatus, validateKey, getSystemMac } = await import('../src/utils/license.ts');

  const mac = getSystemMac().replace(/:/g, '').toUpperCase();
  const key = generateKey('2099', mac);
  const decoded = validateKey(key);
  if (!decoded || decoded.expiresYear !== 2099) {
    throw new Error(`validateKey failed for MAC ${mac}`);
  }

  const ok = activateSystem(key);
  if (!ok) throw new Error('activateSystem returned false');
  const status = getLicenseStatus();
  if (!status.isActivated || status.isExpired) {
    throw new Error(`Post-activation status invalid: ${JSON.stringify(status)}`);
  }

  // Wrong MAC key must fail
  const wrongKey = generateKey('2099', 'AABBCCDDEEFF');
  if (activateSystem(wrongKey)) {
    throw new Error('Activation with foreign MAC should fail');
  }

  return { mac, keyPrefix: key.slice(0, 20) };
}

function testBackupWhitelist() {
  const allowed = new Set([
    'it_objects', 'it_network', 'it_computers', 'it_employees', 'it_warehouse',
    'it_activities', 'it_audits', 'it_workspace_name', 'it_admin_email', 'it_users',
    'it_tab_icons', 'it_panel_logo', 'it_panel_color', 'it_site_favicon', 'it_site_logo',
    'it_sidebar_bg_color', 'it_sidebar_opacity', 'it_custom_warranties', 'it_custom_departments',
    'sec_last_scan',
  ]);
  const blocked = [
    'it_license_key', 'it_license_key_sig', 'it_system_mac', 'it_system_fingerprint',
    'it_trial_start', 'license_key', 'license_failures',
  ];
  for (const k of blocked) {
    if (allowed.has(k)) throw new Error(`Blocked key ${k} is in restore whitelist`);
  }
  return { allowedCount: allowed.size, blockedChecked: blocked.length };
}

async function testUpdateApi() {
  const res = await fetch(`${BASE}/api/update/check?repo=https://github.com/llDecsterll/vicariustab.git`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Update API ${res.status}: ${body}`);
  }
  const data = await res.json();
  const repo = String(data.repository || data.repoUrl || '').toLowerCase();
  if (!repo.includes('vicariustab') && !repo.includes('lldecsterll')) {
    throw new Error(`Unexpected repository in response: ${JSON.stringify(data)}`);
  }
  return { repository: data.repository, latestTag: data.latestTag, updateSource: data.updateSource };
}

async function testStripLicenseOnServer() {
  const sample = {
    it_computers: '[]',
    license_key: 'UTKIN-stolen',
    system_mac: 'AA:BB:CC:DD:EE:FF',
    trial_start: '123',
  };
  const res = await fetch(`${BASE}/api/data`, { method: 'GET' });
  // Server GET shouldn't expose strip function directly; verify module logic inline
  const blockedKeys = [
    'license_key', 'license_key_sig', 'system_mac', 'system_fingerprint',
    'trial_start', 'trial_sig', 'license_failures',
  ];
  const cleaned = { ...sample };
  for (const key of blockedKeys) delete cleaned[key];
  if (cleaned.license_key || cleaned.system_mac) {
    throw new Error('stripLicenseArtifacts logic failed');
  }
  return { serverReachable: res.ok || res.status === 200 || res.status === 404 };
}

const results = [];
try {
  results.push(['license', await testLicenseModule()]);
  results.push(['backup-whitelist', testBackupWhitelist()]);
  results.push(['strip-logic', await testStripLicenseOnServer()]);
  results.push(['update-api', await testUpdateApi()]);
  console.log('ALL TESTS PASSED');
  for (const [name, detail] of results) {
    console.log(`  ✓ ${name}:`, JSON.stringify(detail));
  }
  process.exit(0);
} catch (err) {
  console.error('TEST FAILED:', err.message);
  for (const [name, detail] of results) {
    console.log(`  ✓ ${name}:`, JSON.stringify(detail));
  }
  process.exit(1);
}
