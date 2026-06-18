const fs = require('fs');
const path = require('path');

const NEW_HEADER = `/*
 * COPYRIGHT NOTICE | УВЕДОМЛЕНИЕ ОБ АВТОРСКИХ ПРАВАХ | 版权声明
 * © 2026 Utkin Vladislav Vyacheslavovich (Уткин Владислав Вячеславович)
 * Email: assetorbit@icloud.com | Telegram: https://t.me/Dexterll
 * All rights reserved. Unauthorized copying, modification, distribution or commercial use is prohibited.
 * 保留所有权利。未经版权所有者事先书面同意，禁止复制、修改、分发或商业使用。
 * Все права защищены. Копирование, изменение, распространение и коммерческое использование без письменного согласия правообладателя запрещено.
 */`;

const OLD_START = '© 2026 Уткин В.В.';

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes(OLD_START) && !content.includes('COPYRIGHT NOTICE')) {
    return false;
  }
  if (content.includes('COPYRIGHT NOTICE | УВЕДОМЛЕНИЕ')) {
    return false;
  }
  const blockStart = content.indexOf('/*');
  const blockEnd = content.indexOf('*/', blockStart);
  if (blockStart === -1 || blockEnd === -1) {
    return false;
  }
  content = NEW_HEADER + content.slice(blockEnd + 2).replace(/^\s*/, '\n');
  fs.writeFileSync(filePath, content);
  return true;
}

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(name) && patchFile(full)) console.log('updated', full);
  }
}

walk(path.join(__dirname, '../src'));
const serverPath = path.join(__dirname, '../server.ts');
if (!fs.readFileSync(serverPath, 'utf8').includes('COPYRIGHT NOTICE')) {
  fs.writeFileSync(serverPath, NEW_HEADER + '\n\n' + fs.readFileSync(serverPath, 'utf8'));
  console.log('updated', serverPath);
}
