/* Release — smoke tests for install variants (public API) */
const BASE = process.argv[2] || 'http://127.0.0.1:8080';

async function getJson(path) {
  const res = await fetch(`${BASE}${path}`);
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

async function postJson(path, payload) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

async function main() {
  const results = [];

  const health = await getJson('/api/health');
  if (!health.ok || !health.body.ok) throw new Error('/api/health failed');
  results.push(['health', { version: health.body.version }]);

  const setup = await getJson('/api/auth/setup-status');
  if (!setup.ok || typeof setup.body.setupRequired !== 'boolean') {
    throw new Error(`/api/auth/setup-status failed: ${setup.status}`);
  }
  results.push(['setup-status', { setupRequired: setup.body.setupRequired }]);

  const data = await getJson('/api/data');
  if (data.status !== 401) {
    throw new Error(`/api/data should require auth (expected 401, got ${data.status})`);
  }
  results.push(['api-data-auth', { status: data.status }]);

  const jsonTest = await postJson('/api/db-config/test', { type: 'json' });
  if (jsonTest.status !== 401 && jsonTest.status !== 429) {
    throw new Error(`/api/db-config/test should require admin auth (expected 401 or 429, got ${jsonTest.status})`);
  }
  results.push(['db-test-auth', { status: jsonTest.status, note: jsonTest.status === 429 ? 'rate-limited (post-audit OK)' : 'unauthorized' }]);

  console.log('INSTALL CHECKS PASSED');
  for (const [name, detail] of results) {
    console.log(`  ✓ ${name}:`, JSON.stringify(detail));
  }
}

main().catch((err) => {
  console.error('INSTALL CHECK FAILED:', err.message);
  process.exit(1);
});
