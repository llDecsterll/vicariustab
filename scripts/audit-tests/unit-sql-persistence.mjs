/**
 * SQL persistence round-trip (mock MySQL/Postgres key-value store via dataStore)
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  initDataStore,
  saveApplicationData,
  loadApplicationData,
} from '../../server/dataStore.ts';

const WORKSPACE_ENTITY_KEYS = [
  'objects',
  'networkDevices',
  'computers',
  'employees',
  'warehouseItems',
  'activities',
  'audits',
  'softwareItems',
  'warehouses',
  'warehouseWriteOffs',
  'users',
  'workspaceName',
  'adminEmail',
  'publicUrl',
  'tabIcons',
  'panelLogo',
  'panelColor',
  'siteFavicon',
  'siteLogo',
  'sidebarBgColor',
  'sidebarOpacity',
  'documentHeader',
  'documentHeaderPresets',
];

function mockCrypto() {
  const enc = (text) => Buffer.from(text, 'utf8').toString('base64');
  const dec = (text) => Buffer.from(text, 'base64').toString('utf8');
  return { enc, dec };
}

function createMockSqlStore() {
  const rows = new Map();
  const { enc, dec } = mockCrypto();

  const saveToSql = async (_config, payload) => {
    const keys = new Set(Object.keys(payload));
    for (const key of [...rows.keys()]) {
      if (!keys.has(key)) rows.delete(key);
    }
    for (const [key, val] of Object.entries(payload)) {
      rows.set(key, enc(JSON.stringify(val)));
    }
  };

  const loadFromSql = async () => {
    if (rows.size === 0) return null;
    const out = {};
    for (const [key, stored] of rows) {
      out[key] = JSON.parse(dec(stored));
    }
    return out;
  };

  return { rows, saveToSql, loadFromSql, enc, dec };
}

function buildSamplePayload() {
  const tinyPhoto = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  return {
    objects: [
      { id: 'obj-1', name: 'Office', address: 'Main', photoUrl: tinyPhoto },
    ],
    networkDevices: [
      {
        id: 'net-1',
        deviceName: 'Switch',
        type: 'Коммутатор',
        objectName: 'Office',
        ipAddress: '10.0.0.1',
        quantity: 2,
        cost: 25000,
        photoUrl: tinyPhoto,
      },
    ],
    computers: [
      {
        id: 'c-1',
        category: 'Ноутбук',
        model: 'ThinkPad',
        inventoryNumber: 'PC-100',
        employeeName: 'Иванов',
        status: 'В работе',
        objectName: 'Office',
        cost: 80000,
        serialNumber: 'SN-001',
        photoUrl: tinyPhoto,
        pdfFiles: [{ name: 'act.pdf', content: 'base64-pdf' }],
      },
    ],
    employees: [
      {
        id: 'e-1',
        name: 'Иванов И.И.',
        position: 'Admin',
        department: 'IT',
        photoUrl: tinyPhoto,
      },
    ],
    warehouseItems: [
      {
        id: 'wh-1',
        name: 'Ноутбук',
        type: 'Компьютеры',
        model: 'ThinkPad',
        inventoryNumber: 'ST-100',
        quantity: 3,
        unit: 'шт.',
        costPerUnit: 75000,
        status: 'В наличии',
        warehouseName: 'Основной склад ИТ',
        photoUrl: tinyPhoto,
      },
    ],
    warehouses: [
      {
        id: 'wh-main',
        name: 'Основной склад ИТ',
        objectName: 'Office',
        description: '',
      },
    ],
    warehouseWriteOffs: [
      {
        id: 'wo-1',
        name: 'Old PC',
        type: 'Компьютеры',
        model: 'X',
        inventoryNumber: 'PC-OLD',
        quantity: 1,
        unit: 'шт.',
        costPerUnit: 10000,
        reason: 'audit',
        date: '2026-06-01',
      },
    ],
    softwareItems: [
      {
        id: 'sw-1',
        name: 'Office',
        category: 'Иное ПО',
        licenseKey: 'LIC-1',
        quantity: 5,
        cost: 12000,
        status: 'Активна',
      },
    ],
    activities: [{ id: 'act-1', timestamp: '2026-06-01T00:00:00Z', user: 'admin', action: 'test', detail: 'x', type: 'update' }],
    audits: [],
    users: [
      {
        id: 'u-1',
        name: 'admin',
        login: 'admin',
        email: 'admin@test.local',
        role: 'Admin',
        passwordHash: 'hashed',
        avatarUrl: tinyPhoto,
      },
      {
        id: 'u-2',
        name: 'editor',
        login: 'editor',
        email: 'editor@test.local',
        role: 'Editor',
        passwordHash: 'hashed2',
      },
      {
        id: 'u-3',
        name: 'viewer',
        login: 'viewer',
        email: 'viewer@test.local',
        role: 'Viewer',
        passwordHash: 'hashed3',
      },
    ],
    workspaceName: 'Test Org',
    adminEmail: 'admin@test.local',
    publicUrl: 'https://example.com',
    tabIcons: { computers: 'laptop' },
    panelLogo: tinyPhoto,
    panelColor: '#0f172a',
    siteFavicon: tinyPhoto,
    siteLogo: tinyPhoto,
    sidebarBgColor: '#0f172a',
    sidebarOpacity: 0.95,
    documentHeader: { title: 'Акт' },
    documentHeaderPresets: [{ id: 'p1', name: 'Default' }],
  };
}

let tmpDir = '';
let dbPath = '';
let metaPath = '';
let sql;

before(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vt-sql-persist-'));
  dbPath = path.join(tmpDir, 'db.json.enc');
  metaPath = path.join(tmpDir, 'store_meta.json');
  sql = createMockSqlStore();
  initDataStore({
    encrypt: sql.enc,
    decrypt: sql.dec,
    dbPath,
    metaPath,
    readDbConfig: () => ({ type: 'mysql', host: 'mock' }),
    loadFromSql: sql.loadFromSql,
    saveToSql: sql.saveToSql,
  });
});

after(() => {
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
});

describe('SQL workspace persistence (mock store)', () => {
  it('persists all core entity keys to SQL store', async () => {
    const payload = buildSamplePayload();
    const saved = await saveApplicationData(payload, null);
    assert.equal(saved.ok, true);

    for (const key of WORKSPACE_ENTITY_KEYS) {
      assert.ok(sql.rows.has(key), `missing SQL key: ${key}`);
    }
  });

  it('round-trips users, roles, warehouses, costs and photos', async () => {
    const { data, revision } = await loadApplicationData();
    assert.ok(data);
    assert.equal(typeof revision, 'number');

    assert.equal(data.users.length, 3);
    assert.deepEqual(
      data.users.map((u) => u.role).sort(),
      ['Admin', 'Editor', 'Viewer']
    );
    assert.ok(data.users[0].avatarUrl?.startsWith('data:image'));
    assert.ok(data.users[0].passwordHash);

    assert.equal(data.warehouses[0].name, 'Основной склад ИТ');
    assert.equal(data.warehouseItems[0].costPerUnit, 75000);
    assert.equal(data.computers[0].cost, 80000);
    assert.equal(data.networkDevices[0].cost, 25000);
    assert.ok(data.computers[0].photoUrl?.startsWith('data:image'));
    assert.equal(data.computers[0].pdfFiles[0].name, 'act.pdf');
    assert.equal(data.employees[0].photoUrl?.length > 20, true);
    assert.equal(data.warehouseWriteOffs[0].inventoryNumber, 'PC-OLD');
  });

  it('removes stale SQL keys on next save', async () => {
    const payload = buildSamplePayload();
    delete payload.audits;
    const saved = await saveApplicationData(payload, 1);
    assert.equal(saved.ok, true);
    assert.ok(!sql.rows.has('audits'));
    const { data } = await loadApplicationData();
    assert.equal(data.audits, undefined);
  });

  it('fails save when SQL store throws (no silent divergence)', async () => {
    const failing = createMockSqlStore();
    initDataStore({
      encrypt: failing.enc,
      decrypt: failing.dec,
      dbPath,
      metaPath,
      readDbConfig: () => ({ type: 'postgres', host: 'mock' }),
      loadFromSql: failing.loadFromSql,
      saveToSql: async () => {
        throw new Error('SQL connection lost');
      },
    });

    await assert.rejects(
      () => saveApplicationData(buildSamplePayload(), 2),
      /SQL connection lost/
    );
  });
});
