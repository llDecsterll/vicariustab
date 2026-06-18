/* Release */
const fs = require('fs');
const path = require('path');

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

let terms = new Set();

files.forEach(f => {
  let content = fs.readFileSync(path.join(dir, f), 'utf-8');
  let originalContent = content;
  
  // Need to ensure useTranslation is imported if we add t()!
  if (!content.includes('useTranslation')) {
      // Don't auto add import yet, just check if we do replacements.
  }

  // replace title="АБВ" 
  content = content.replace(/title="([А-Яа-яЁё][^"]*)"/g, (m, p1) => {
    terms.add(p1.trim());
    return `title={t("${p1.replace(/"/g, '\\"').trim()}")}`;
  });

  // replace placeholder="АБВ"
  content = content.replace(/placeholder="([А-Яа-яЁё][^"]*)"/g, (m, p1) => {
    terms.add(p1.trim());
    return `placeholder={t("${p1.replace(/"/g, '\\"').trim()}")}`;
  });

  // replace >АБВ<
  content = content.replace(/>([^<]*[А-Яа-яЁё][^<]*)</g, (m, p1) => {
    if (p1.includes('{') || p1.includes('}')) return m;
    let trimmed = p1.trim();
    if (trimmed.length > 0 && /[А-Яа-яЁё]/.test(trimmed)) {
      terms.add(trimmed);
      // to handle things like >  Текст  < safely:
      // using replace will only replace the first occurrence of trimmed, which is correct
      let replaced = p1.replace(trimmed, `{t("${trimmed.replace(/"/g, '\\"')}")}`);
      return `>${replaced}<`;
    }
    return m;
  });

  if (content !== originalContent) {
    // If we replaced things, ensure `t` is available.
    if (!content.includes('const { t } = useTranslation()')) {
        // Find existing component definition (e.g. export default function Name() { OR export function Name({ ... }) {
        content = content.replace(/(export (?:default )?function \w+\([^)]*\)\s*\{)/, "$1\n  const { t } = useTranslation();\n");
    }
    if (!content.includes('useTranslation')) {
        content = `import { useTranslation } from '../utils/i18n';\n` + content;
    }
    fs.writeFileSync(path.join(dir, f), content, 'utf-8');
    console.log("Updated " + f);
  }
});

const termsArray = Array.from(terms);
console.log("Found " + termsArray.length + " terms to translate.");
fs.writeFileSync('new_terms.json', JSON.stringify(termsArray, null, 2));

