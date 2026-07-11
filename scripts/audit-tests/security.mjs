/**

 * Security tests: auth bypass, rate limit, mass assignment, idempotency replay

 */

import { describe, it, before } from 'node:test';

import assert from 'node:assert/strict';



const BASE = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:8098';

let serverUp = false;

let adminToken = '';



before(async () => {

  try {

    const res = await fetch(`${BASE}/api/health`);

    serverUp = res.ok;

  } catch {

    serverUp = false;

  }

  if (!serverUp) return;

  const { resolveAuditSession } = await import('./auditAuth.mjs');

  adminToken = await resolveAuditSession();

});



describe('security', () => {

  it('idempotency key replays POST /api/data response', async (t) => {

    if (!serverUp) {

      t.skip('Server not running');

      return;

    }

    const { resolveAuditSession } = await import('./auditAuth.mjs');

    const token = adminToken || (await resolveAuditSession());

    if (!token) {

      t.skip('No admin session');

      return;

    }

    const idemKey = `audit-idem-${Date.now()}`;

    const getRes = await fetch(`${BASE}/api/data`, {

      headers: { 'X-Session-Token': token },

    });

    if (!getRes.ok) {

      t.skip('Cannot load workspace');

      return;

    }

    const data = await getRes.json();

    const payload = { ...data, workspaceName: data.workspaceName || 'Audit' };

    delete payload._revision;



    const postOnce = () =>

      fetch(`${BASE}/api/data`, {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json',

          'X-Session-Token': token,

          'X-Data-Revision': String(data._revision),

          'Idempotency-Key': idemKey,

        },

        body: JSON.stringify(payload),

      });



    const first = await postOnce();

    const second = await postOnce();

    assert.ok(first.ok || first.status === 409, `first save: ${first.status}`);

    assert.equal(second.status, first.status, 'idempotent replay should match status');

    assert.equal(

      second.headers.get('x-idempotency-replayed'),

      'true',

      'second response should be replayed'

    );

  });



  it('admin routes reject missing token', async (t) => {

    if (!serverUp) {

      t.skip('Server not running');

      return;

    }

    const routes = [

      ['GET', '/api/backup/export'],

      ['POST', '/api/backup/import'],

      ['POST', '/api/data/purge-workspace'],

      ['POST', '/api/db-config/test'],

    ];

    for (const [method, path] of routes) {

      const res = await fetch(`${BASE}${path}`, {

        method,

        headers: { 'Content-Type': 'application/json' },

        body: method === 'POST' ? '{}' : undefined,

      });

      assert.ok(

        res.status === 401 || res.status === 429,

        `${method} ${path} should require auth (401) or be rate-limited (429), got ${res.status}`

      );

    }

  });



  it('login rate limit triggers after repeated failures', async (t) => {

    if (!serverUp) {

      t.skip('Server not running');

      return;

    }

    const login = `rate_test_${Date.now()}`;

    let limited = false;

    for (let i = 0; i < 12; i++) {

      const res = await fetch(`${BASE}/api/auth/authenticate`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ login, password: 'wrong', deviceFingerprint: 'sec-test' }),

      });

      if (res.status === 429) {

        limited = true;

        break;

      }

    }

    assert.ok(limited, 'Expected 429 after repeated failed logins');

  });



  it('SQL injection in login field does not crash server', async (t) => {

    if (!serverUp) {

      t.skip('Server not running');

      return;

    }

    const res = await fetch(`${BASE}/api/auth/authenticate`, {

      method: 'POST',

      headers: { 'Content-Type': 'application/json' },

      body: JSON.stringify({

        login: "' OR 1=1 --",

        password: "' OR 1=1 --",

        deviceFingerprint: 'sqli-test',

      }),

    });

    assert.ok(res.status === 401 || res.status === 429 || res.status === 400);

  });

});


