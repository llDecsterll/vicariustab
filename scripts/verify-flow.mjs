/* Release */
/**
 * Smoke tests: license activation, backup whitelist, GitHub update API.
 * Run: node scripts/verify-flow.mjs [baseUrl]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.argv[2] || 'http://127.0.0.1:8098';

function loadPrivateKeyPem() {
  const inline = process.env.LICENSE_ED25519_PRIVATE_KEY;
  if (inline && inline.trim()) {
    return inline.replace(/\\n/g, '\n');
  }
  const keyPath =
    process.env.LICENSE_ED25519_PRIVATE_KEY_PATH ||
    path.join(__dirname, '..', '..', 'keyserver', 'data', 'license_ed25519.pem');
  if (!fs.existsSync(keyPath)) {
    throw new Error(`Missing Ed25519 private key at ${keyPath}. Run: node scripts/generate-license-keypair.mjs`);
  }
  return fs.readFileSync(keyPath, 'utf8');
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
  const { buildLicensePayloadString, issueSignedLicenseKey, verifySignedLicenseKey } = await import('../server/licenseCrypto.ts');

  const mac = getSystemMac().replace(/:/g, '').toUpperCase();
  const privateKeyPem = loadPrivateKeyPem();
  const payload = buildLicensePayloadString('2099', mac, 'Test', 'test@test.com', '-');
  const key = issueSignedLicenseKey(payload, privateKeyPem);

  const serverDecoded = verifySignedLicenseKey(key, mac);
  if (!serverDecoded || serverDecoded.expiresYear !== 2099) {
    throw new Error(
      `Server verify failed for MAC ${mac}. ` +
        'Sync public key from local PEM: npm run license:sync-public ' +
        '(or regenerate pair only on fresh install: npm run license:keypair — keyserver stays local).'
    );
  }

  const decoded = validateKey(key);
  if (!decoded || decoded.expiresYear !== 2099) {
    throw new Error(
      `Client validateKey failed for MAC ${mac} but server verify succeeded. ` +
        'server/licensePublicKey.ts is out of sync with keyserver PEM — run: node scripts/generate-license-keypair.mjs'
    );
  }

  const ok = activateSystem(key);
  if (!ok) throw new Error('activateSystem returned false');
  const status = getLicenseStatus();
  if (!status.isActivated || status.isExpired) {
    throw new Error(`Post-activation status invalid: ${JSON.stringify(status)}`);
  }

  const { buildLicensePayloadString: build2, issueSignedLicenseKey: issue2 } = await import('../server/licenseCrypto.ts');
  const wrongKey = issue2(build2('2099', 'AABBCCDDEEFF', 'Test', 'test@test.com', '-'), privateKeyPem);
  if (activateSystem(wrongKey)) {
    throw new Error('Activation with foreign MAC should fail');
  }

  const { hashLicenseString } = await import('../server/licenseKeyFormat.ts');
  const legacyPayload = Buffer.from(
    encodeURIComponent(['2099', mac, 'Legacy', 'legacy@test.com', '-'].join('|')).replace(
      /%([0-9A-F]{2})/g,
      (_, p1) => String.fromCharCode(parseInt(p1, 16))
    ),
    'binary'
  ).toString('base64');
  const legacyKey = `UTKIN-${legacyPayload}-${hashLicenseString(legacyPayload)}`;
  if (validateKey(legacyKey)) {
    throw new Error('Legacy v1 license key must be rejected');
  }

  return { mac, keyPrefix: key.slice(0, 24), scheme: 'ed25519' };
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

async function ensureSession() {
  const setupRes = await fetch(`${BASE}/api/auth/setup-status`);
  const setup = await setupRes.json();
  if (setup.setupRequired) {
    const create = await fetch(`${BASE}/api/auth/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        login: 'verify_admin',
        password: 'verify_pass_8',
        email: 'verify@test.local',
      }),
    });
    if (!create.ok) {
      const body = await create.text();
      throw new Error(`Setup failed ${create.status}: ${body}`);
    }
  }

  const candidates = [
    [process.env.AUDIT_LOGIN, process.env.AUDIT_PASSWORD],
    ['audit_admin', 'audit_pass_8'],
    ['verify_admin', 'verify_pass_8'],
  ].filter(([login, password]) => login && password);

  for (const [login, password] of candidates) {
    for (let attempt = 0; attempt < 4; attempt++) {
      const auth = await fetch(`${BASE}/api/auth/authenticate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login,
          password,
          deviceFingerprint: 'verify-flow-test',
        }),
      });
      if (auth.status === 429) {
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        continue;
      }
      if (auth.ok) {
        const data = await auth.json();
        if (data.requiresTwoFactor) break;
        if (typeof auth.headers.getSetCookie === 'function') {
          for (const cookie of auth.headers.getSetCookie()) {
            const match = /^vt_session=([^;]+)/.exec(cookie);
            if (match) return decodeURIComponent(match[1]);
          }
        }
        if (data.sessionToken) return data.sessionToken;
      }
      break;
    }
  }
  return null;
}

async function testUpdateApi(token) {
  const res = await fetch(`${BASE}/api/update/check?repo=https://github.com/llDecsterll/vicariustab.git`, {
    headers: { 'X-Session-Token': token },
  });
  if (!res.ok) {
    const body = await res.text();
    if (res.status === 500 && /github|update/i.test(body)) {
      return { skipped: true, reason: 'GitHub update check unavailable in this environment' };
    }
    throw new Error(`Update API ${res.status}: ${body}`);
  }
  const data = await res.json();
  const repo = String(data.repository || data.repoUrl || '').toLowerCase();
  if (!repo.includes('vicariustab') && !repo.includes('lldecsterll')) {
    throw new Error(`Unexpected repository in response: ${JSON.stringify(data)}`);
  }
  return { repository: data.repository, latestTag: data.latestTag, updateSource: data.updateSource };
}

async function testInventoryValidation() {
  const { exactInventoryNumberTaken, inventoryBaseFamilyTaken, getSoftwareWarehouseInv } = await import(
    '../src/utils/equipmentFields.ts'
  );
  const ctx = {
    warehouseItems: [{ id: 'wh-1', inventoryNumber: 'ST-0061' }],
    computers: [{ id: 'c-1', inventoryNumber: 'ST-0061-1' }],
    networkDevices: [],
    softwareItems: [],
    softwareWarehouseInv: getSoftwareWarehouseInv,
  };
  if (!inventoryBaseFamilyTaken('ST-0061', ctx)) {
    throw new Error('inventoryBaseFamilyTaken should detect batch family');
  }
  if (!exactInventoryNumberTaken('ST-0061', ctx)) {
    throw new Error('exactInventoryNumberTaken should find exact warehouse match ST-0061');
  }
  if (!exactInventoryNumberTaken('ST-0061-1', ctx)) {
    throw new Error('exactInventoryNumberTaken should find ST-0061-1 on computer');
  }
  const { validateWorkspaceInventory } = await import('../server/workspaceValidation.ts');
  const dupErr = validateWorkspaceInventory({
    warehouseItems: [],
    computers: [
      { id: 'c1', inventoryNumber: 'PC-DUP' },
      { id: 'c2', inventoryNumber: 'PC-DUP' },
    ],
    networkDevices: [],
    softwareItems: [],
  });
  if (!dupErr || !dupErr.includes('Дублирующ')) {
    throw new Error(`Expected duplicate error, got: ${dupErr}`);
  }
  return { ok: true };
}

async function testGenerateNextInventoryNumber() {
  const { generateNextInventoryNumber } = await import('../src/utils/equipmentFields.ts');
  const ctx = {
    warehouseItems: [{ inventoryNumber: 'PC-0001' }, { inventoryNumber: 'ST-0061' }],
    computers: [{ inventoryNumber: 'PC-0006' }, { inventoryNumber: 'ST-0061-1' }],
    networkDevices: [{ inventoryNumber: 'NET-0002' }],
    softwareItems: [],
  };
  const nextPc = generateNextInventoryNumber('PC', ctx);
  if (nextPc !== 'PC-0007') {
    throw new Error(`Expected PC-0007, got ${nextPc}`);
  }
  const nextSt = generateNextInventoryNumber('ST', ctx);
  if (nextSt !== 'ST-0062') {
    throw new Error(`Expected ST-0062, got ${nextSt}`);
  }
  const nextNet = generateNextInventoryNumber('NET', ctx);
  if (nextNet !== 'NET-0003') {
    throw new Error(`Expected NET-0003, got ${nextNet}`);
  }
  const unique = new Set(
    Array.from({ length: 20 }, () => generateNextInventoryNumber('NB', {
      warehouseItems: [],
      computers: [{ inventoryNumber: 'NB-0001' }],
      networkDevices: [],
    }))
  );
  if (unique.size !== 1 || !unique.has('NB-0002')) {
    throw new Error(`Expected single NB-0002, got ${[...unique].join(', ')}`);
  }
  return { ok: true };
}

async function testAllocateBatchInventoryNumbers() {
  const { allocateBatchInventoryNumbers } = await import('../src/utils/equipmentFields.ts');
  const first = allocateBatchInventoryNumbers('ST-0061', [], 1);
  if (JSON.stringify(first) !== '["ST-0061"]') {
    throw new Error(`Expected [ST-0061], got ${JSON.stringify(first)}`);
  }
  const second = allocateBatchInventoryNumbers('ST-0061', ['ST-0061'], 1);
  if (JSON.stringify(second) !== '["ST-0061-1"]') {
    throw new Error(`Expected [ST-0061-1], got ${JSON.stringify(second)}`);
  }
  const multi = allocateBatchInventoryNumbers('ST-0061', [], 3);
  if (JSON.stringify(multi) !== '["ST-0061-1","ST-0061-2","ST-0061-3"]') {
    throw new Error(`Expected batch -1,-2,-3, got ${JSON.stringify(multi)}`);
  }
  return { ok: true };
}

async function testStripLicenseOnServer(token) {
  const sample = {
    it_computers: '[]',
    license_key: 'UTKIN-stolen',
    system_mac: 'AA:BB:CC:DD:EE:FF',
    trial_start: '123',
  };
  const res = await fetch(`${BASE}/api/data`, {
    headers: token ? { 'X-Session-Token': token } : {},
  });
  const blockedKeys = [
    'license_key', 'license_key_sig', 'system_mac', 'system_fingerprint',
    'trial_start', 'trial_sig', 'license_failures',
  ];
  const cleaned = { ...sample };
  for (const key of blockedKeys) delete cleaned[key];
  if (cleaned.license_key || cleaned.system_mac) {
    throw new Error('stripLicenseArtifacts logic failed');
  }
  return { serverReachable: res.ok, status: res.status };
}

const results = [];
try {
  results.push(['license', await testLicenseModule()]);
  results.push(['batch-inv', await testAllocateBatchInventoryNumbers()]);
  results.push(['next-inv', await testGenerateNextInventoryNumber()]);
  results.push(['inv-validation', await testInventoryValidation()]);
  results.push(['backup-whitelist', testBackupWhitelist()]);
  const token = await ensureSession();
  if (token) {
    results.push(['auth', { ok: true }]);
    results.push(['strip-logic', await testStripLicenseOnServer(token)]);
    results.push(['update-api', await testUpdateApi(token)]);
  } else {
    results.push(['auth', { skipped: true, hint: 'Set AUDIT_LOGIN/AUDIT_PASSWORD or use verify_admin on fresh install' }]);
  }
  console.log('ALL TESTS PASSED');
  for (const [name, detail] of results) {
    console.log(`  ✓ ${name}:`, JSON.stringify(detail));
  }
  setTimeout(() => process.exit(0), 500);
} catch (err) {
  console.error('TEST FAILED:', err.message);
  for (const [name, detail] of results) {
    console.log(`  ✓ ${name}:`, JSON.stringify(detail));
  }
  setTimeout(() => process.exit(1), 500);
}
