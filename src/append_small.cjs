/* Release */
const fs = require('fs');

const translations = {
  "Наличие:": { en: "In stock:", zh: "库存：" },
  "ед.": { en: "units", zh: "单位" },
  "в": { en: "in", zh: "在" },
  "товарных категориях.": { en: "product categories.", zh: "产品类别中。" },
};

let content = fs.readFileSync('src/utils/i18n.tsx', 'utf8');

let newKeys = '';
for (const [key, trans] of Object.entries(translations)) {
  if (!content.includes(`"${key}": {`)) {
    if (trans.ru) {
      newKeys += `  "${key}": {\n    ru: "${trans.ru}",\n    en: "${trans.en}",\n    zh: "${trans.zh}"\n  },\n`;
    } else {
      newKeys += `  "${key}": {\n    ru: "${key}",\n    en: "${trans.en}",\n    zh: "${trans.zh}"\n  },\n`;
    }
  }
}

// Find the insertion point before the last closing brace
const insertPos = content.lastIndexOf('};\n');
if (insertPos !== -1) {
  content = content.slice(0, insertPos) + newKeys + content.slice(insertPos);
  fs.writeFileSync('src/utils/i18n.tsx', content, 'utf8');
  console.log("Added keys to i18n.tsx");
} else {
  console.error("Could not find insertion point");
}
