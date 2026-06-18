/* Release */
const fs = require('fs');
const path = require('path');

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));
let terms = new Set();

files.forEach(f => {
  let content = fs.readFileSync(path.join(dir, f), 'utf-8');

  // Fix up the duplicated import/const from previous runs
  content = content.replace(/const \{ t \} = useTranslation\(\);\n\s+const \{ language, setLanguage, t(:? [^=]+)? \} = useTranslation\(\);/g, 'const { language, setLanguage, t } = useTranslation();');
  content = content.replace(/const \{ t \} = useTranslation\(\);\n\s+const \{ t(:? [^=]+)? \} = useTranslation\(\);/g, 'const { t } = useTranslation();');
  
  if (content.includes("const { t } = useTranslation();\n\n  const { language, setLanguage, t")) {
      content = content.replace("const { t } = useTranslation();\n\n  const { language, setLanguage, t", "const { language, setLanguage, t");
  }

  // Safe inner text replacement:
  // Must match `>`, followed by optional spaces, then text with Cyrillic but NO brackets `< > { } " '`, then `<`.
  content = content.replace(/>\s*([^<>{}"'\n]*[А-Яа-яЁё][^<>{}"'\n]*)\s*</g, (m, p1) => {
    let trimmed = p1.trim();
    if (trimmed.length > 0) {
      terms.add(trimmed);
      return `>{t("${trimmed}")}<`;
    }
    return m;
  });

  // title="Cyrillic"
  content = content.replace(/title="([^"{}\n]*[А-Яа-яЁё][^"{}\n]*)"/g, (m, p1) => {
    terms.add(p1);
    return `title={t("${p1}")}`;
  });

  // placeholder="Cyrillic"
  content = content.replace(/placeholder="([^"{}\n]*[А-Яа-яЁё][^"{}\n]*)"/g, (m, p1) => {
    terms.add(p1);
    return `placeholder={t("${p1}")}`;
  });

  fs.writeFileSync(path.join(dir, f), content, 'utf-8');
});

console.log(Array.from(terms));
fs.writeFileSync('super_safe_terms.json', JSON.stringify(Array.from(terms), null, 2));

