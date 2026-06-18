const fs = require('fs');
const path = require('path');

function extractTExpressions(dir) {
  let terms = new Set();
  const regex = /t\(\s*[\"']([^\"']+)[\"']\s*\)/g;
  
  function walk(current) {
    const files = fs.readdirSync(current);
    for (let f of files) {
      if (f === 'i18n.tsx' || f.includes('node_modules')) continue;
      const fullPath = path.join(current, f);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
         walk(fullPath);
      } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
         const content = fs.readFileSync(fullPath, 'utf8');
         let match;
         while ((match = regex.exec(content)) !== null) {
            terms.add(match[1]);
         }
      }
    }
  }
  walk(dir);
  return Array.from(terms);
}

const terms = extractTExpressions('./src');

const i18nContent = fs.readFileSync('./src/utils/i18n.tsx', 'utf8');

const missing = terms.filter(t => !i18nContent.includes(`"${t}": {`));
console.log(JSON.stringify(missing, null, 2));
