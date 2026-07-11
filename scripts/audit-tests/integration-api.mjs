/**
 * Integration tests: API auth, data save, backup validation
 * Requires running server: npm run dev (default http://127.0.0.1:8098)
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { isAuditServerUp, resolveAuditSession, extractSessionTokenFromResponse } from './auditAuth.mjs';

const BASE = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:8098';
let token = '';
let serverUp = false;

async function tryFetch(path, opts = {}) {
  try {
    return await fetch(`${BASE}${path}`, opts);
  } catch {
    return null;
  }
}

before(async () => {
  serverUp = await isAuditServerUp();
  if (!serverUp) return;
  token = await resolveAuditSession();
});

describe('integration API', () => {
  it('health endpoint reachable when server is up', async (t) => {
    if (!serverUp) {
      t.skip('Server not running — start with npm run dev');
      return;
    }
    const res = await fetch(`${BASE}/api/health`);
    assert.ok(res.ok);
  });

  it('unauthenticated /api/data returns 401', async (t) => {
    if (!serverUp) {
      t.skip('Server not running');
      return;
    }
    const res = await fetch(`${BASE}/api/data`);
    assert.equal(res.status, 401);
  });

  it('authenticated session receives data revision', async (t) => {
    if (!serverUp || !token) {
      t.skip('No session');
      return;
    }
    const res = await fetch(`${BASE}/api/data`, {
      headers: { 'X-Session-Token': token },
    });
    assert.ok(res.ok);
    const data = await res.json();
    assert.ok(typeof data._revision === 'number');
  });

  it('POST /api/data rejects duplicate inventory numbers', async (t) => {
    if (!serverUp || !token) {
      t.skip('No session');
      return;
    }
    const getRes = await fetch(`${BASE}/api/data`, {
      headers: { 'X-Session-Token': token },
    });
    const current = await getRes.json();
    const revision = current._revision;
    const payload = {
      ...current,
      computers: [
        ...(Array.isArray(current.computers) ? current.computers : []),
        { id: 'dup-test-1', inventoryNumber: 'AUDIT-DUP-001', category: 'ПК', status: 'На складе' },
        { id: 'dup-test-2', inventoryNumber: 'AUDIT-DUP-001', category: 'ПК', status: 'На складе' },
      ],
    };
    delete payload._revision;

    const saveRes = await fetch(`${BASE}/api/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': token,
        'X-Data-Revision': String(revision),
      },
      body: JSON.stringify(payload),
    });
    assert.equal(saveRes.status, 400);
    const body = await saveRes.json();
    assert.ok(String(body.error || '').includes('Дублирующ') || String(body.error || '').includes('инвентар'));
  });

  it('Viewer role cannot write (403)', async (t) => {
    if (!serverUp || !token) {
      t.skip('No session');
      return;
    }

    const getRes = await fetch(`${BASE}/api/data`, {
      headers: { 'X-Session-Token': token },
    });
    const current = await getRes.json();
    const revision = current._revision;
    const viewerLogin = 'audit_viewer';
    const viewerPassword = 'audit_viewer_8';
    const users = Array.isArray(current.users) ? [...current.users] : [];
    const viewerIdx = users.findIndex((u) => u.login === viewerLogin);
    const viewerUser = {
      id: viewerIdx >= 0 ? users[viewerIdx].id : 'audit-viewer-user',
      name: 'Audit Viewer',
      email: 'viewer@audit.local',
      role: 'Viewer',
      login: viewerLogin,
      password: viewerPassword,
      passwordSet: true,
      isCustom: true,
    };
    if (viewerIdx >= 0) {
      users[viewerIdx] = { ...users[viewerIdx], ...viewerUser };
    } else {
      users.push(viewerUser);
    }

    const seedPayload = { ...current, users };
    delete seedPayload._revision;
    const seedRes = await fetch(`${BASE}/api/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': token,
        'X-Data-Revision': String(revision),
      },
      body: JSON.stringify(seedPayload),
    });
    if (!seedRes.ok) {
      t.skip(`Could not seed viewer user (${seedRes.status})`);
      return;
    }

    const viewerAuth = await fetch(`${BASE}/api/auth/authenticate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        login: viewerLogin,
        password: viewerPassword,
        deviceFingerprint: 'audit-viewer',
      }),
    });
    if (!viewerAuth.ok) {
      t.skip('Viewer login failed after seed');
      return;
    }
    const viewerBody = await viewerAuth.json();
    const viewerToken = extractSessionTokenFromResponse(viewerAuth, viewerBody);
    if (!viewerToken) {
      t.skip('Viewer login failed after seed');
      return;
    }

    const viewerGet = await fetch(`${BASE}/api/data`, {
      headers: { 'X-Session-Token': viewerToken },
    });
    assert.ok(viewerGet.ok);
    const viewerData = await viewerGet.json();

    const writePayload = {
      ...viewerData,
      workspaceName: `ViewerWriteBlocked-${Date.now()}`,
    };
    delete writePayload._revision;

    const writeRes = await fetch(`${BASE}/api/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': viewerToken,
        'X-Data-Revision': String(viewerData._revision),
      },
      body: JSON.stringify(writePayload),
    });
    assert.equal(writeRes.status, 403);
    const body = await writeRes.json();
    assert.equal(body.code, 'READ_ONLY');
  });
});
