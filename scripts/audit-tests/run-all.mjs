/**
 * Full audit test runner
 * Usage: node scripts/audit-tests/run-all.mjs
 * With server: AUDIT_BASE_URL=http://127.0.0.1:8098 node scripts/audit-tests/run-all.mjs
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:8098';
const testEnv = { ...process.env, AUDIT_BASE_URL: BASE };
const tests = [
  'unit-equipment.mjs',
  'unit-validation.mjs',
  'integration-api.mjs',
  'load-concurrent.mjs',
  'security.mjs',
];

let failed = 0;

for (const file of tests) {
  const filePath = path.join(__dirname, file);
  console.log(`\n=== ${file} ===`);
  const code = await new Promise((resolve) => {
    const child = spawn(process.execPath, ['--test', filePath], {
      stdio: 'inherit',
      env: testEnv,
    });
    child.on('close', resolve);
  });
  if (code !== 0) failed += 1;
}

if (failed > 0) {
  console.error(`\nAUDIT SUITE FAILED (${failed} runner(s))`);
  process.exit(1);
}
console.log('\nALL AUDIT TESTS PASSED');
process.exit(0);
