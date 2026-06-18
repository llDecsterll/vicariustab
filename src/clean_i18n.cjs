/* Release */
const fs = require('fs');
let lines = fs.readFileSync('src/utils/i18n.tsx', 'utf8').split('\n');

// 1. Remove the line 3000 (0-indexed 2999) if it contains "};"
if (lines[2999] && lines[2999].includes("};")) {
  lines.splice(2999, 1);
}

// 2. Add "};" at the end.
if (!lines[lines.length - 1].includes("};")) {
  lines.push("};");
}

fs.writeFileSync('src/utils/i18n.tsx', lines.join('\n'), 'utf8');
