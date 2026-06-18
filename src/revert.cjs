/* Release */
const { execSync } = require('child_process');
try {
  execSync('git restore src/components/*.tsx');
  console.log('Restored!');
} catch (e) {
  console.error(e.message);
}
