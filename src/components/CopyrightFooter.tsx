/*
 * COPYRIGHT NOTICE | УВЕДОМЛЕНИЕ ОБ АВТОРСКИХ ПРАВАХ | 版权声明
 * © 2026 Utkin Vladislav Vyacheslavovich (Уткин Владислав Вячеславович)
 * Email: vicariustab@icloud.com | Telegram: https://t.me/Dexterll
 * Release
 */
import React from 'react';
import { Mail, Send } from 'lucide-react';
import { useTranslation } from '../utils/i18n';
import { COPYRIGHT_EMAIL, COPYRIGHT_TELEGRAM_URL, COPYRIGHT_TELEGRAM_HANDLE } from '../legal/copyright';

interface CopyrightFooterProps {
  variant?: 'dark' | 'sidebar' | 'settings';
  className?: string;
}

export default function CopyrightFooter({ variant = 'dark', className = '' }: CopyrightFooterProps) {
  const { t } = useTranslation();
  const isSidebar = variant === 'sidebar';
  const isSettings = variant === 'settings';

  return (
    <div
      className={`select-none space-y-1.5 ${
        isSettings
          ? 'font-sans text-sm text-slate-600'
          : isSidebar
            ? 'font-sans text-[11px] text-slate-500'
            : 'text-center'
      } ${className}`}
    >
      <p
        className={
          isSettings
            ? 'font-semibold text-slate-800 text-sm'
            : isSidebar
              ? 'font-medium text-slate-400 text-[11px]'
              : 'text-xs font-bold text-slate-200'
        }
      >
        {t('© 2026 Уткин Владислав Вячеславович. Все права защищены.')}
      </p>
      <p
        className={`leading-relaxed ${
          isSettings ? 'text-slate-500 text-xs' : isSidebar ? 'text-[10px] text-slate-500' : 'text-[10px] text-slate-400'
        }`}
      >
        {t('Программный код Vicariustab защищён авторским правом. Запрещено копирование и модификация без согласия автора.')}
      </p>
      {isSettings && (
        <p className="text-xs text-slate-600 leading-relaxed pt-1 border-t border-slate-100">
          {t('Для приобретения коммерческой лицензии Vicariustab отправьте запрос правообладателю по электронной почте или в Telegram. Укажите код запроса лицензии и данные организации.')}
        </p>
      )}
      <div
        className={`flex flex-col gap-1.5 ${
          isSettings ? 'pt-2 sm:flex-row sm:flex-wrap sm:gap-4' : isSidebar ? 'pt-0.5' : 'items-center pt-1'
        }`}
      >
        <a
          href={`mailto:${COPYRIGHT_EMAIL}`}
          className={`text-blue-600 hover:text-blue-500 transition-colors font-bold font-mono hover:underline flex items-center gap-1.5 ${
            isSidebar ? 'text-xs text-blue-400 hover:text-blue-300' : isSettings ? 'text-sm' : 'text-sm text-blue-400 hover:text-blue-300'
          }`}
          title={t('Отправить письмо (vicariustab@icloud.com)')}
        >
          <Mail size={isSidebar ? 11 : 13} className="shrink-0" />
          <span className={isSidebar ? 'truncate min-w-0' : ''}>{COPYRIGHT_EMAIL}</span>
        </a>
        <a
          href={COPYRIGHT_TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-sky-600 hover:text-sky-500 transition-colors font-bold font-mono hover:underline flex items-center gap-1.5 ${
            isSidebar ? 'text-xs text-sky-400 hover:text-sky-300' : isSettings ? 'text-sm' : 'text-sm text-sky-400 hover:text-sky-300'
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
