/*
 * COPYRIGHT NOTICE | УВЕДОМЛЕНИЕ ОБ АВТОРСКИХ ПРАВАХ | 版权声明
 * © 2026 Utkin Vladislav Vyacheslavovich (Уткин Владислав Вячеславович)
 * Email: vicariustab@icloud.com | Telegram: https://t.me/Dexterll
 * All rights reserved. Unauthorized copying, modification, distribution or commercial use is prohibited.
 * 保留所有权利。未经版权所有者事先书面同意，禁止复制、修改、分发或商业使用。
 * Все права защищены. Копирование, изменение, распространение и коммерческое использование без письменного согласия правообладателя запрещено.
 * Release
 */
/** Legal identity and contact constants — Utkin Vladislav Vyacheslavovich / Vicariustab */

export const COPYRIGHT_OWNER_RU = 'Уткин Владислав Вячеславович';
export const COPYRIGHT_OWNER_EN = 'Utkin Vladislav Vyacheslavovich';
export const COPYRIGHT_OWNER_ZH = '乌金·弗拉迪斯拉夫·维亚切斯拉维奇';

export const COPYRIGHT_YEAR = '2026';

/** Public contact email (displayed to users/clients) */
export const COPYRIGHT_EMAIL = 'vicariustab@icloud.com';

/**
 * Private owner contact — obfuscated to prevent scraping.
 * Decode at runtime only when required for internal licensing operations.
 * Format: utkin_vladislav@icloud.com
 */
export const _OWNER_CONTACT_PRIVATE = [
  117,116,107,105,110,95,118,108,97,100,105,115,108,97,118,64,105,99,108,111,117,100,46,99,111,109
].map(c => String.fromCharCode(c)).join('');

export const COPYRIGHT_TELEGRAM_URL = 'https://t.me/Dexterll';
export const COPYRIGHT_TELEGRAM_HANDLE = '@Dexterll';

/** Standard source-file header (trilingual legal notice). */
export const SOURCE_FILE_COPYRIGHT_HEADER = `/*
 * COPYRIGHT NOTICE | УВЕДОМЛЕНИЕ ОБ АВТОРСКИХ ПРАВАХ | 版权声明
 * © ${COPYRIGHT_YEAR} ${COPYRIGHT_OWNER_EN} (${COPYRIGHT_OWNER_RU})
 * Email: ${COPYRIGHT_EMAIL} | Telegram: ${COPYRIGHT_TELEGRAM_URL}
 * All rights reserved. Unauthorized copying, modification, distribution or commercial use is prohibited.
 * 保留所有权利。未经版权所有者事先书面同意，禁止复制、修改、分发或商业使用。
 * Все права защищены. Копирование, изменение, распространение и коммерческое использование без письменного согласия правообладателя запрещено.
 * Release
 */`;

