/* Release */
const fs = require('fs');
const path = require('path');

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

let allLines = [];

files.forEach(f => {
  const content = fs.readFileSync(path.join(dir, f), 'utf-8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (/[А-Яа-я]/.test(line) && !line.includes('t(')) {
       allLines.push(`${f}:${idx+1}: ${line.trim()}`);
    }
  });
});

console.log(allLines.join('\n'));
