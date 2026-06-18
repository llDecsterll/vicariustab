/* Release */
const fs = require('fs');

let content = fs.readFileSync('src/utils/i18n.tsx', 'utf8');

const match = content.match(/(  "Устройство": \{[\s\S]+)$/);
if (match) {
  let badPart = match[1];
  
  // Clean up any trailing closing brace from the badPart if it exists.
  // Actually, wait, it might just be the string I inserted, which was `  "Key": { ... },\n`
  
  let newContent = content.slice(0, match.index);
  
  let dictEndIndex = newContent.indexOf('};\n\ninterface LanguageContextProps');
  if (dictEndIndex === -1) {
    dictEndIndex = newContent.lastIndexOf('};\n', newContent.indexOf('interface LanguageContextProps'));
  }
  
  if (dictEndIndex !== -1) {
    newContent = newContent.slice(0, dictEndIndex) + ',\n' + badPart + newContent.slice(dictEndIndex);
    fs.writeFileSync('src/utils/i18n.tsx', newContent, 'utf8');
    console.log("Fixed i18n!");
  } else {
    console.log("Could not find Dictionary end.");
  }
} else {
  console.log("Could not find the bad part");
}
