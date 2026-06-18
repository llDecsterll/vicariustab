/* Release */
const fs = require('fs');

function fixImportAndDef(file) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Add import if missing
  if (!content.includes("import { useTranslation } from")) {
    content = "import { useTranslation } from '../utils/i18n';\n" + content;
  }
  
  // Fix multiple t declarations
  let lines = content.split('\n');
  let newLines = [];
  let tDeclared = false;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    if (line.includes("const { t } = useTranslation();") || line.includes("const { language, setLanguage, t } = useTranslation();")) {
      if (tDeclared) {
        // Skip re-declaration
        continue;
      } else {
        tDeclared = true;
      }
    }
    newLines.push(line);
  }
  
  fs.writeFileSync(file, newLines.join('\n'), 'utf8');
}

['ActivityLogView.tsx', 'AuditsView.tsx', 'LoginScreen.tsx', 'ReportsView.tsx', 'SecurityView.tsx', 'SettingsView.tsx'].forEach(f => {
  fixImportAndDef('src/components/' + f);
});
console.log("Fixed files!");
