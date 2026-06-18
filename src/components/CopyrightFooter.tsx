/*
 * COPYRIGHT NOTICE | УВЕДОМЛЕНИЕ ОБ АВТОРСКИХ ПРАВАХ | 版权声明
 * © 2026 Utkin Vladislav Vyacheslavovich (Уткин Владислав Вячеславович)
 * Email: assetorbit@icloud.com | Telegram: https://t.me/Dexterll
 * Release
 */
import React from 'react';
import { Mail, Send } from 'lucide-react';
import { useTranslation } from '../utils/i18n';
import { COPYRIGHT_EMAIL, COPYRIGHT_TELEGRAM_URL, COPYRIGHT_TELEGRAM_HANDLE } from '../legal/copyright';

interface CopyrightFooterProps {
  variant?: 'dark' | 'sidebar';
  className?: string;
}

export default function CopyrightFooter({ variant = 'dark', className = '' }: CopyrightFooterProps) {
  const { t } = useTranslation();
  const isSidebar = variant === 'sidebar';

  return (
    <div
      className={`select-none space-y-1.5 ${isSidebar ? 'font-sans text-[11px] text-slate-500' : 'text-center'} ${className}`}
    >
      <p className={isSidebar ? 'font-medium text-slate-400 text-[11px]' : 'text-xs font-bold text-slate-200'}>
        {t('© 2026 Utkin Vladislav Vyacheslavovich. All rights reserved.')}
      </p>
      <p className={`text-[10px] leading-relaxed ${isSidebar ? 'text-slate-500' : 'text-slate-400'}`}>
        {t('Программный код Uvwstack защищён авторским правом. Запрещено копирование и модификация без согласия автора.')}
      </p>
      <div className={`flex flex-col gap-1.5 ${isSidebar ? 'pt-0.5' : 'items-center pt-1'}`}>
        <a
          href={`mailto:${COPYRIGHT_EMAIL}`}
          className={`text-blue-400 hover:text-blue-300 transition-colors font-bold font-mono hover:underline flex items-center gap-1.5 ${
            isSidebar ? 'text-xs' : 'text-sm'
          }`}
          title={t('Отправить письмо (assetorbit@icloud.com)')}
        >
          <Mail size={isSidebar ? 11 : 13} className="shrink-0" />
          <span className={isSidebar ? 'truncate min-w-0' : ''}>{COPYRIGHT_EMAIL}</span>
        </a>
        <a
          href={COPYRIGHT_TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-sky-400 hover:text-sky-300 transition-colors font-bold font-mono hover:underline flex items-center gap-1.5 ${
            isSidebar ? 'text-xs' : 'text-sm'
          }`}
          title={t('Открыть Telegram (@Dexterll)')}
        >
          <Send size={isSidebar ? 11 : 13} className="shrink-0" />
          <span>{COPYRIGHT_TELEGRAM_HANDLE}</span>
        </a>
      </div>
    </div>
  );
}
