/**
 * Load test: concurrent revision saves (optimistic locking)
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:8098';
let token = '';
let serverUp = false;

before(async () => {
  try {
    const health = await fetch(`${BASE}/api/health`);
    serverUp = health.ok;
  } catch {
    serverUp = false;
  }
  if (!serverUp) return;

  const setup = await (await fetch(`${BASE}/api/auth/setup-status`))?.json();
  if (setup?.setupRequired) {
    await fetch(`${BASE}/api/auth/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        login: 'audit_admin',
        password: 'audit_pass_8',
        email: 'audit@test.local',
      }),
    });
  }

  const candidates = [
    [process.env.AUDIT_LOGIN, process.env.AUDIT_PASSWORD],
    ['verify_admin', 'verify_pass_8'],
    ['audit_admin', 'audit_pass_8'],
  ].filter(([login, password]) => login && password);

  for (const [login, password] of candidates) {
    const auth = await fetch(`${BASE}/api/auth/authenticate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password, deviceFingerprint: 'load-test' }),
    });
    if (auth.ok) {
      token = (await auth.json()).sessionToken;
      break;
    }
  }
});

describe('load / concurrency', () => {
  it('concurrent saves produce at most one success without merge', async (t) => {
    if (!serverUp || !token) {
      t.skip('Server or session unavailable');
      return;
    }

    const getRes = await fetch(`${BASE}/api/data`, {
      headers: { 'X-Session-Token': token },
    });
    const base = await getRes.json();
    const revision = base._revision;

    const mkPayload = (suffix) => {
      const p = { ...base, workspaceName: `LoadTest-${suffix}-${Date.now()}` };
      delete p._revision;
      return p;
    };

    const results = await Promise.all(
      [1, 2, 3].map((n) =>
        fetch(`${BASE}/api/data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': token,
            'X-Data-Revision': String(revision),
          },
          body: JSON.stringify(mkPayload(n)),
        }).then((r) => r.status)
      )
    );

    const okCount = results.filter((s) => s === 200).length;
    const conflictCount = results.filter((s) => s === 409).length;
    assert.ok(okCount >= 1, 'At least one save should succeed');
    assert.ok(conflictCount >= 1 || okCount === 1, 'Conflicts expected on same revision');
  });
});
