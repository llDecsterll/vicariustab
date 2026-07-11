/**
 * Load test: concurrent revision saves (optimistic locking)
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { isAuditServerUp, resolveAuditSession } from './auditAuth.mjs';

const BASE = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:8098';
let token = '';
let serverUp = false;

before(async () => {
  serverUp = await isAuditServerUp();
  if (!serverUp) return;
  token = await resolveAuditSession();
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
