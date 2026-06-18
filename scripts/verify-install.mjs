/* Release — smoke tests for all install variants (API / DB / runtime) */
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

  const data = await getJson('/api/data');
  if (!data.ok && data.status !== 200) {
    throw new Error(`/api/data failed: ${data.status}`);
  }
  results.push(['api-data', { status: data.status }]);

  const defaults = await getJson('/api/db-config/defaults');
  if (!defaults.ok) throw new Error('/api/db-config/defaults failed');
  if (!defaults.body.suggestedHost) throw new Error('missing suggestedHost');
  results.push(['db-defaults', { inDocker: defaults.body.inDocker, suggestedHost: defaults.body.suggestedHost }]);

  const dbCfg = await getJson('/api/db-config');
  if (!dbCfg.ok) throw new Error('/api/db-config failed');
  results.push(['db-config', { type: dbCfg.body.type || 'json' }]);

  const dbStatus = await getJson('/api/db-status');
  if (!dbStatus.ok) throw new Error('/api/db-status failed');
  results.push(['db-status', { status: dbStatus.body.status }]);

  const runtime = await getJson('/api/system/runtime');
  if (!runtime.ok) throw new Error('/api/system/runtime failed');
  if (!runtime.body.version) throw new Error('missing version in runtime');
  results.push(['runtime', { version: runtime.body.version }]);

  const jsonTest = await postJson('/api/db-config/test', { type: 'json' });
  if (!jsonTest.ok || !jsonTest.body.success) throw new Error('json db test failed');
  results.push(['db-test-json', { success: true }]);

  console.log('INSTALL CHECKS PASSED');
  for (const [name, detail] of results) {
    console.log(`  ✓ ${name}:`, JSON.stringify(detail));
  }
}

main().catch((err) => {
  console.error('INSTALL CHECK FAILED:', err.message);
  process.exit(1);
});
