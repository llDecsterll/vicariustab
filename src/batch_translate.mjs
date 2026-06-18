/* Release */
import { translate } from '@vitalets/google-translate-api';
import fs from 'fs';

async function run() {
  const terms = JSON.parse(fs.readFileSync('super_safe_terms.json', 'utf8'));
  console.log(`Translating ${terms.length} terms...`);
  
  let i18n = fs.readFileSync('src/utils/i18n.tsx', 'utf8');

  // get existing keys
  let existingKeys = new Set();
  const matchKeys = i18n.matchAll(/"([^"]+)":\s*\{/g);
  for (const match of matchKeys) {
      existingKeys.add(match[1]);
  }

  let newEntries = {};
  
  for (let i = 0; i < terms.length; i++) {
    const term = terms[i];
    if (existingKeys.has(term)) continue;
    
    try {
      let enText = `<EN> ${term}`;
      let zhText = `<ZH> ${term}`;
      try {
        const enRes = await translate(term, { to: 'en' });
        const zhRes = await translate(term, { to: 'zh-CN' });
        enText = enRes.text;
        zhText = zhRes.text;
      } catch (err) {
        // Fallback or retry?
        try {
           await new Promise(r => setTimeout(r, 1000));
           const enRes2 = await translate(term, { to: 'en' });
           const zhRes2 = await translate(term, { to: 'zh-CN' });
           enText = enRes2.text;
           zhText = zhRes2.text;
        } catch(err2) {
           console.log("Completely failed translation for: " + term);
        }
      }
      
      let newEntryStr = `  "${term.replace(/"/g, '\\"')}": {\n    ru: "${term.replace(/"/g, '\\"')}",\n    en: "${enText.replace(/"/g, '\\"')}",\n    zh: "${zhText.replace(/"/g, '\\"')}"\n  },\n`;
      
      let currentI18n = fs.readFileSync('src/utils/i18n.tsx', 'utf8');
      
      // Fix missing comma just to be safe
      currentI18n = currentI18n.replace(/\}\n\s+"([^"]+)":\s*\{/g, '},\n  "$1": {');
      
      let insertIndex = currentI18n.lastIndexOf('};\n', currentI18n.indexOf('export const useTranslation'));
      if (insertIndex !== -1) {
         // Also add comma right before new entry if it was missing 
         let beforeInsert = currentI18n.slice(0, insertIndex);
         if (!beforeInsert.trim().endsWith(',')) {
             beforeInsert = beforeInsert.trimEnd() + ',\n';
         }
         let updated = beforeInsert + newEntryStr + currentI18n.slice(insertIndex);
         fs.writeFileSync('src/utils/i18n.tsx', updated, 'utf8');
      }
      
      console.log(`[${i+1}/${terms.length}] ${term} -> ${enText}`);
    } catch (e) {
      console.error(`Failed complete block ${term}:`, e.message);
    }
    
    // Add small delay to avoid rate limit
    await new Promise(r => setTimeout(r, 50));
  }
  console.log("Done translating!");
}

run();
