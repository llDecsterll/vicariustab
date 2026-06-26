import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTranslation } from '../utils/i18n';
import { useTheme } from '../utils/ThemeProvider';
import type { ThemeMode } from '../utils/theme';

interface ThemeModePickerProps {
  compact?: boolean;
  className?: string;
}

const MODES: ThemeMode[] = ['light', 'dark', 'system'];

export default function ThemeModePicker({ compact = false, className = '' }: ThemeModePickerProps) {
  const { t } = useTranslation();
  const { themeMode, setThemeMode } = useTheme();

  const labels: Record<ThemeMode, string> = {
    light: t('Светлая тема'),
    dark: t('Тёмная тема'),
    system: t('Как в системе'),
  };

  const icons: Record<ThemeMode, React.ReactNode> = {
    light: <Sun size={compact ? 14 : 15} />,
    dark: <Moon size={compact ? 14 : 15} />,
    system: <Monitor size={compact ? 14 : 15} />,
  };

  return (
    <div
      className={`inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 ${className}`}
      role="group"
      aria-label={t('Тема оформления')}
    >
      {MODES.map((mode) => {
        const active = themeMode === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => setThemeMode(mode)}
            title={labels[mode]}
            className={`flex items-center justify-center gap-1.5 rounded-md transition-all cursor-pointer ${
              compact ? 'px-2 py-1.5' : 'px-3 py-2 text-xs font-bold'
            } ${
              active
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-white'
            }`}
          >
            {icons[mode]}
            {!compact && <span>{labels[mode]}</span>}
          </button>
        );
      })}
    </div>
  );
}
