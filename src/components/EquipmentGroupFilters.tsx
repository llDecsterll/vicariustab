/*
 * Unified filter bar for equipment group views: Category, Status, Object.
 */
import React from 'react';
import { useTranslation } from '../utils/i18n';

export interface FilterSelectOption {
  value: string;
  label: string;
}

interface EquipmentGroupFiltersProps {
  categoryValue: string;
  onCategoryChange: (value: string) => void;
  categoryOptions: FilterSelectOption[];
  statusValue: string;
  onStatusChange: (value: string) => void;
  statusOptions: FilterSelectOption[];
  objectValue: string;
  onObjectChange: (value: string) => void;
  objectOptions: FilterSelectOption[];
}

export const HARDWARE_STATUS_FILTER_OPTIONS: FilterSelectOption[] = [
  { value: 'Все', label: 'Все статусы' },
  { value: 'В работе', label: 'В работе' },
  { value: 'На ремонте', label: 'На ремонте' },
  { value: 'На складе', label: 'На складе' },
  { value: 'Списано', label: 'Списано' },
];

export const SOFTWARE_STATUS_FILTER_OPTIONS: FilterSelectOption[] = [
  { value: 'Все', label: 'Все статусы' },
  { value: 'Активна', label: 'Активна' },
  { value: 'Истекла', label: 'Истекла' },
  { value: 'Не активирована', label: 'Не активирована' },
];

export default function EquipmentGroupFilters({
  categoryValue,
  onCategoryChange,
  categoryOptions,
  statusValue,
  onStatusChange,
  statusOptions,
  objectValue,
  onObjectChange,
  objectOptions,
}: EquipmentGroupFiltersProps) {
  const { t } = useTranslation();
  const selectClass =
    'w-full sm:w-auto px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/10 focus:outline-none text-slate-650 sm:min-w-[140px]';

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 pt-2 border-t border-slate-50">
      <div className="w-full sm:w-auto sm:flex-1 sm:flex-none">
        <label className="text-[10px] text-slate-400 font-bold block mb-1">{t('Категория')}</label>
        <select value={categoryValue} onChange={(e) => onCategoryChange(e.target.value)} className={selectClass}>
          {categoryOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.label)}
            </option>
          ))}
        </select>
      </div>

      <div className="w-full sm:w-auto sm:flex-1 sm:flex-none">
        <label className="text-[10px] text-slate-400 font-bold block mb-1">{t('Статус')}</label>
        <select value={statusValue} onChange={(e) => onStatusChange(e.target.value)} className={selectClass}>
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.label)}
            </option>
          ))}
        </select>
      </div>

      <div className="w-full sm:w-auto sm:flex-1 sm:flex-none">
        <label className="text-[10px] text-slate-400 font-bold block mb-1">{t('Объект')}</label>
        <select value={objectValue} onChange={(e) => onObjectChange(e.target.value)} className={selectClass}>
          {objectOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.label)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
