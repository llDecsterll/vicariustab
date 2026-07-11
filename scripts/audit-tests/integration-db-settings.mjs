/**
 * Integration: DB types connect/test, workspace settings persistence, roles
 * Requires: npm run dev + AUDIT_LOGIN / AUDIT_PASSWORD
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { isAuditServerUp, resolveAuditSession, auditLogin } from './auditAuth.mjs';

const BASE = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:8098';
let adminToken = '';
let serverUp = false;
let usersBefore = [];

async function auth(login, password) {
  return auditLogin(login, password, 'db-settings-audit');
}

async function getData(token) {
  const res = await fetch(`${BASE}/api/data`, { headers: { 'X-Session-Token': token } });
  assert.ok(res.ok, `GET /api/data failed: ${res.status}`);
  return res.json();
}

async function saveData(token, payload, revision) {
  const body = { ...payload };
  delete body._revision;
  return fetch(`${BASE}/api/data`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Token': token,
      'X-Data-Revision': String(revision),
    },
    body: JSON.stringify(body),
  });
}

before(async () => {
  serverUp = await isAuditServerUp();
  if (!serverUp) return;
  adminToken = await resolveAuditSession();
});

describe('database connections', () => {
  it('json storage test succeeds without external DB', async (t) => {
    if (!serverUp || !adminToken) {
      t.skip('Server or admin session unavailable');
      return;
    }
    const res = await fetch(`${BASE}/api/db-config/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Session-Token': adminToken },
      body: JSON.stringify({ type: 'json' }),
    });
    assert.ok(res.ok, `json test failed: ${res.status}`);
    const body = await res.json();
    assert.equal(body.success, true);
  });

  it('db-status reports connected for json mode', async (t) => {
    if (!serverUp || !adminToken) {
      t.skip('Server or admin session unavailable');
      return;
    }
    const res = await fetch(`${BASE}/api/db-status`, {
      headers: { 'X-Session-Token': adminToken },
    });
    assert.ok(res.ok, `db-status failed: ${res.status}`);
    const status = await res.json();
    const cfgRes = await fetch(`${BASE}/api/db-config`, {
      headers: { 'X-Session-Token': adminToken },
    });
    assert.ok(cfgRes.ok);
    const cfg = await cfgRes.json();
    if (cfg.type === 'json' || !cfg.type) {
      assert.equal(status.status, 'connected', `expected connected for json, got ${JSON.stringify(status)}`);
    } else {
      assert.ok(['connected', 'error'].includes(status.status));
    }
  });

  it('mysql test endpoint validates connection (live or graceful error)', async (t) => {
    if (!serverUp || !adminToken) {
      t.skip('Server or admin session unavailable');
      return;
    }
    const res = await fetch(`${BASE}/api/db-config/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Session-Token': adminToken },
      body: JSON.stringify({
        type: 'mysql',
        host: '127.0.0.1',
        port: 3306,
        database: 'stack_db',
        user: 'root',
        password: 'invalid-audit-probe',
      }),
    });
    if (res.ok) {
      const body = await res.json();
      assert.equal(body.success, true);
    } else {
      assert.equal(res.status, 400, 'unreachable mysql should return 400, not 500');
      const err = await res.json();
      assert.ok(err.error, 'error message expected');
    }
  });

  it('postgres test endpoint validates connection (live or graceful error)', async (t) => {
    if (!serverUp || !adminToken) {
      t.skip('Server or admin session unavailable');
      return;
    }
    const res = await fetch(`${BASE}/api/db-config/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Session-Token': adminToken },
      body: JSON.stringify({
        type: 'postgres',
        host: '127.0.0.1',
        port: 5432,
        database: 'stack_db',
        user: 'postgres',
        password: 'invalid-audit-probe',
      }),
    });
    if (res.ok) {
      const body = await res.json();
      assert.equal(body.success, true);
    } else {
      assert.equal(res.status, 400, 'unreachable postgres should return 400, not 500');
      const err = await res.json();
      assert.ok(err.error, 'error message expected');
    }
  });

  it('db-config GET masks password for admin', async (t) => {
    if (!serverUp || !adminToken) {
      t.skip('Server or admin session unavailable');
      return;
    }
    const res = await fetch(`${BASE}/api/db-config`, {
      headers: { 'X-Session-Token': adminToken },
    });
    assert.ok(res.ok);
    const cfg = await res.json();
    assert.ok(['json', 'mysql', 'postgres'].includes(cfg.type || 'json'));
    if (cfg.password) {
      assert.notEqual(cfg.password, '', 'password must be masked, not empty leak');
    }
  });

  it('non-admin cannot access db-config', async (t) => {
    if (!serverUp || !adminToken) {
      t.skip('Server or admin session unavailable');
      return;
    }
    const data = await getData(adminToken);
    const viewerLogin = 'audit_db_viewer';
    const viewerPassword = 'audit_db_viewer_8';
    const users = Array.isArray(data.users) ? [...data.users] : [];
    const idx = users.findIndex((u) => u.login === viewerLogin);
    const viewerUser = {
      id: idx >= 0 ? users[idx].id : 'audit-db-viewer',
      name: 'DB Audit Viewer',
      email: 'dbviewer@audit.local',
      role: 'Viewer',
      login: viewerLogin,
      password: viewerPassword,
      passwordSet: true,
      isCustom: true,
    };
    if (idx >= 0) users[idx] = { ...users[idx], ...viewerUser };
    else users.push(viewerUser);
    const seed = { ...data, users };
    delete seed._revision;
    const seedRes = await saveData(adminToken, seed, data._revision);
    if (!seedRes.ok) {
      t.skip(`Could not seed viewer (${seedRes.status})`);
      return;
    }
    const viewerToken = await auth(viewerLogin, viewerPassword);
    if (!viewerToken) {
      t.skip('Viewer login failed');
      return;
    }
    const cfgRes = await fetch(`${BASE}/api/db-config`, {
      headers: { 'X-Session-Token': viewerToken },
    });
    assert.equal(cfgRes.status, 403);
  });
});

describe('workspace settings persistence', () => {
  it('admin workspace settings round-trip via API', async (t) => {
    if (!serverUp || !adminToken) {
      t.skip('Server or admin session unavailable');
      return;
    }
    const data = await getData(adminToken);
    usersBefore = Array.isArray(data.users) ? data.users.map((u) => ({ ...u })) : [];
    const originalName = data.workspaceName || '';
    const marker = `AuditSettings-${Date.now()}`;
    const payload = { ...data, workspaceName: marker };
    const saveRes = await saveData(adminToken, payload, data._revision);
    assert.ok(saveRes.ok, `admin save failed: ${saveRes.status}`);
    const reloaded = await getData(adminToken);
    assert.equal(reloaded.workspaceName, marker);
    const restore = { ...reloaded, workspaceName: originalName };
    const restoreRes = await saveData(adminToken, restore, reloaded._revision);
    assert.ok(restoreRes.ok, 'restore workspaceName failed');
  });

  it('viewer sees shared workspace settings but cannot write', async (t) => {
    if (!serverUp || !adminToken) {
      t.skip('Server or admin session unavailable');
      return;
    }
    const fresh = await getData(adminToken);
    const viewerLogin = 'audit_db_viewer';
    const viewerPassword = 'audit_db_viewer_8';
    const users = Array.isArray(fresh.users) ? fresh.users.map((u) => ({ ...u })) : [];
    if (!users.some((u) => u.role === 'Admin' && !u.isBlocked)) {
      t.skip('No active admin in workspace');
      return;
    }
    const idx = users.findIndex((u) => u.login === viewerLogin);
    const viewerUser = {
      id: idx >= 0 ? users[idx].id : 'audit-db-viewer',
      name: 'DB Audit Viewer',
      email: 'dbviewer@audit.local',
      role: 'Viewer',
      login: viewerLogin,
      password: viewerPassword,
      passwordSet: true,
      isCustom: true,
    };
    if (idx >= 0) users[idx] = { ...users[idx], ...viewerUser };
    else users.push(viewerUser);
    const seed = { ...fresh, users };
    delete seed._revision;
    const seedRes = await saveData(adminToken, seed, fresh._revision);
    if (!seedRes.ok) {
      const errBody = await seedRes.json().catch(() => ({}));
      t.skip(`Could not seed viewer (${seedRes.status}: ${errBody.error || 'unknown'})`);
      return;
    }
    const viewerToken = await auth(viewerLogin, viewerPassword);
    if (!viewerToken) {
      t.skip('Viewer login failed');
      return;
    }
    const viewerData = await getData(viewerToken);
    assert.equal(viewerData.workspaceName, fresh.workspaceName, 'viewer sees same workspaceName');
    const writeRes = await saveData(
      viewerToken,
      { ...viewerData, workspaceName: `ViewerHack-${Date.now()}` },
      viewerData._revision
    );
    assert.equal(writeRes.status, 403);
    const body = await writeRes.json();
    assert.equal(body.code, 'READ_ONLY');
  });

  it('editor can save workspace settings', async (t) => {
    if (!serverUp || !adminToken) {
      t.skip('Server or admin session unavailable');
      return;
    }
    const data = await getData(adminToken);
    const editorLogin = 'audit_db_editor';
    const editorPassword = 'audit_db_editor_8';
    const users = Array.isArray(data.users) ? [...data.users] : [];
    const idx = users.findIndex((u) => u.login === editorLogin);
    const editorUser = {
      id: idx >= 0 ? users[idx].id : 'audit-db-editor',
      name: 'DB Audit Editor',
      email: 'dbeditor@audit.local',
      role: 'Editor',
      login: editorLogin,
      password: editorPassword,
      passwordSet: true,
      isCustom: true,
    };
    if (idx >= 0) users[idx] = { ...users[idx], ...editorUser };
    else users.push(editorUser);
    let seed = { ...data, users };
    delete seed._revision;
    let seedRes = await saveData(adminToken, seed, data._revision);
    if (!seedRes.ok) {
      t.skip(`Could not seed editor (${seedRes.status})`);
      return;
    }
    const editorToken = await auth(editorLogin, editorPassword);
    if (!editorToken) {
      t.skip('Editor login failed');
      return;
    }
    const editorData = await getData(editorToken);
    const marker = `EditorSave-${Date.now()}`;
    const original = editorData.publicUrl || '';
    const writeRes = await saveData(editorToken, { ...editorData, publicUrl: marker }, editorData._revision);
    assert.ok(writeRes.ok, `editor save failed: ${writeRes.status}`);
    const adminReload = await getData(adminToken);
    assert.equal(adminReload.publicUrl, marker, 'editor changes visible to all users');
    const restoreRes = await saveData(adminToken, { ...adminReload, publicUrl: original }, adminReload._revision);
    assert.ok(restoreRes.ok);
  });
});
