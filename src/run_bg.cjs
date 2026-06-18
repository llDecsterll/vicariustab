/* Release */
const { spawn } = require('child_process');
const fs = require('fs');
const out = fs.openSync('./out.log', 'a');
const err = fs.openSync('./err.log', 'a');

const p = spawn('npx', ['node', 'src/batch_translate.mjs'], {
    detached: true,
    stdio: [ 'ignore', out, err ]
});

p.unref();
console.log("Spawned in background with PID:", p.pid);
