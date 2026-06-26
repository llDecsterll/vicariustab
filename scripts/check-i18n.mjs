/* Validate i18n dictionary completeness (ru / en / zh) */
import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/utils/i18n.tsx');
const src = fs.readFileSync(file, 'utf8');
const dictStart = src.indexOf('const dictionary');
const dictBody = src.slice(dictStart);
const keyMatches = [...dictBody.matchAll(/^\s*"((?:\\.|[^"\\])*)":\s*\{/gm)];
const langs = ['ru', 'en', 'zh'];
const missing = [];
const untranslated = [];

for (const [, key] of keyMatches) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const blockRe = new RegExp(`"${escaped.replace(/"/g, '\\"')}"\\s*:\\s*\\{([\\s\\S]*?)\\n\\s*\\},`, 'm');
  const block = dictBody.match(blockRe)?.[1] ?? '';
  for (const lang of langs) {
    const m = block.match(new RegExp(`${lang}:\\s*"((?:\\\\.|[^"\\\\])*)"`));
    if (!m) {
      missing.push({ key, lang });
    } else if (lang !== 'ru' && m[1] === key) {
      untranslated.push({ key, lang });
    }
  }
}

console.log(`i18n keys: ${keyMatches.length}`);
if (missing.length) {
  console.error('Missing translations:', missing.slice(0, 20));
  if (missing.length > 20) console.error(`... and ${missing.length - 20} more`);
  process.exit(1);
}
if (untranslated.length) {
  console.warn(`Untranslated (same as key): ${untranslated.length}`);
  for (const item of untranslated.slice(0, 15)) {
    console.warn(`  [${item.lang}] ${item.key.slice(0, 80)}`);
  }
}
console.log('i18n check: OK');
