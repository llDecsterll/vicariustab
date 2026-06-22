/* Extract all untranslated (Cyrillic value in EN/ZH) keys from i18n.tsx */
const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'src/utils/i18n.tsx');
const src = fs.readFileSync(file, 'utf8');
const dictStart = src.indexOf('const dictionary');
const dictBody = src.slice(dictStart);
const keyMatches = [...dictBody.matchAll(/^\s*"((?:\\.|[^"\\])*)"\s*:\s*\{/gm)];

const hasCyrillic = (s) => /[а-яА-ЯёЁ]/.test(s);
const results = {};

for (const [, key] of keyMatches) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/"/g, '\\"');
  const blockRe = new RegExp('"' + escaped + '"\\s*:\\s*\\{([\\s\\S]*?)\\n\\s*\\},', 'm');
  const block = dictBody.match(blockRe)?.[1] ?? '';
  
  const ruM = block.match(/ru:\s*"((?:\\.|[^"\\])*)"/);
  const enM = block.match(/en:\s*"((?:\\.|[^"\\])*)"/);
  const zhM = block.match(/zh:\s*"((?:\\.|[^"\\])*)"/);
  
  const ru = ruM ? ruM[1] : null;
  const en = enM ? enM[1] : null;
  const zh = zhM ? zhM[1] : null;
  
  // Only collect entries where en or zh has Cyrillic (needs translation)
  if ((en && hasCyrillic(en)) || (zh && hasCyrillic(zh))) {
    results[key] = { ru, en, zh };
  }
}

fs.writeFileSync(
  path.join(process.cwd(), 'scripts', 'i18n-needs-translation.json'),
  JSON.stringify(results, null, 2),
  'utf8'
);
console.log('Keys needing translation:', Object.keys(results).length);
console.log('Written to scripts/i18n-needs-translation.json');
