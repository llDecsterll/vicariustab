/**
 * Security tests: auth bypass, rate limit, mass assignment
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:8098';
let serverUp = false;

before(async () => {
  try {
    const res = await fetch(`${BASE}/api/health`);
    serverUp = res.ok;
  } catch {
    serverUp = false;
  }
});

describe('security', () => {
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
      assert.equal(res.status, 401, `${method} ${path} should require auth`);
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
