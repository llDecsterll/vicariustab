/**
 * Normalize distribution metadata — adds uniform "Release" marker and refreshes file timestamps for git.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const RELEASE_LINE = ' * Release';
const RELEASE_COMMENT = '# Release\n';

function patchCopyrightTs(content) {
  if (!content.includes('COPYRIGHT NOTICE') || content.includes(RELEASE_LINE)) {
    return content;
  }
  return content.replace(
    /( \* Все права защищены[^\n]*\r?\n)( \*\/)/,
    `$1${RELEASE_LINE}\n$2`
  );
}

function patchFile(rel) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) return false;
  let content = fs.readFileSync(full, 'utf8');
  const orig = content;

  if (/\.(ts|tsx)$/.test(rel)) {
    content = patchCopyrightTs(content);
  } else if (/\.(cjs|mjs|sh|css)$/.test(rel)) {
    if (!content.includes('Release')) {
      content = `/* Release */\n${content}`;
    }
  } else if (/\.(conf|example)$/.test(rel) || rel === '.gitignore') {
    if (!content.startsWith('# Release')) {
      content = RELEASE_COMMENT + content.replace(/^# Release\n/, '');
    }
  } else if (/\.(json|txt)$/.test(rel) && rel !== 'package-lock.json') {
    if (!content.includes('"release":')) {
      try {
        const json = JSON.parse(content);
        json.release = 'Release';
        content = JSON.stringify(json, null, 2) + '\n';
      } catch {
        if (!content.trimEnd().endsWith('Release')) {
          content = content.trimEnd() + '\n# Release\n';
        }
      }
    }
  }

  if (content !== orig) {
    fs.writeFileSync(full, content);
    return true;
  }
  return false;
}

const files = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' })
  .trim()
  .split(/\r?\n/)
  .filter(Boolean);

let n = 0;
for (const f of files) {
  if (patchFile(f)) {
    console.log('patched', f);
    n++;
  }
}
console.log('done, patched', n, 'files');
