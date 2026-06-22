/* Audit i18n for untranslated keys with Russian text in EN/ZH */
const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'src/utils/i18n.tsx');
const src = fs.readFileSync(file, 'utf8');
const dictStart = src.indexOf('const dictionary');
const dictBody = src.slice(dictStart);
const keyMatches = [...dictBody.matchAll(/^\s*"((?:\\.|[^"\\])*)"\s*:\s*\{/gm)];
const langs = ['ru', 'en', 'zh'];
const untranslated = [];
const ruInEN = [];
const ruInZH = [];

const hasCyrillic = (s) => /[а-яА-ЯёЁ]/.test(s);

for (const [, key] of keyMatches) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/"/g, '\\"');
  const blockRe = new RegExp('"' + escaped + '"\\s*:\\s*\\{([\\s\\S]*?)\\n\\s*\\},', 'm');
  const block = dictBody.match(blockRe)?.[1] ?? '';
  
  for (const lang of langs) {
    const m = block.match(new RegExp(lang + ':\\s*"((?:\\\\.|[^"\\\\])*)"'));
    if (!m) {
      untranslated.push({ key: key.slice(0, 80), lang, reason: 'missing' });
    } else if (lang !== 'ru' && hasCyrillic(m[1])) {
      untranslated.push({ key: key.slice(0, 80), lang, value: m[1].slice(0, 80), reason: 'cyrillic_value' });
      if (lang === 'en') ruInEN.push({ key, value: m[1] });
      if (lang === 'zh') ruInZH.push({ key, value: m[1] });
    }
  }
}

console.log('Total keys:', keyMatches.length);
console.log('EN with Cyrillic value:', ruInEN.length);
console.log('ZH with Cyrillic value:', ruInZH.length);
console.log('\nEN Cyrillic issues (first 30):');
ruInEN.slice(0, 30).forEach(x => console.log(`  key="${x.key.slice(0,60)}" val="${x.value.slice(0,60)}"`));
console.log('\nZH Cyrillic issues (first 30):');
ruInZH.slice(0, 30).forEach(x => console.log(`  key="${x.key.slice(0,60)}" val="${x.value.slice(0,60)}"`));
