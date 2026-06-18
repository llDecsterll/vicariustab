const fs = require('fs');
let content = fs.readFileSync('src/utils/i18n.tsx', 'utf8');

// Fix missing commas before string keys in the dictionary object
content = content.replace(/\}\n\s+"([^"]+)":\s*\{/g, '},\n  "$1": {');

fs.writeFileSync('src/utils/i18n.tsx', content, 'utf8');
console.log("Fixed missing commas!");
