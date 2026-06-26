/*
 * Full-screen inventory item verification checklist
 */
import React, { useMemo, useState } from 'react';
import { X, Search } from 'lucide-react';
import { useTranslation } from '../utils/i18n';
import type { InventoryAudit } from '../types';
import {
  computeAuditProgressFromRows,
  type AuditChecklistRow,
  type AuditItemCheckStatus,
} from '../utils/auditInventory';

interface AuditChecklistFullscreenProps {
  audit: InventoryAudit;
  rows: AuditChecklistRow[];
  onUpdateItemCheck: (auditId: string, itemKey: string, status: AuditItemCheckStatus | null) => void;
  onClose: () => void;
}

export default function AuditChecklistFullscreen({
  audit,
  rows,
  onUpdateItemCheck,
  onClose,
}: AuditChecklistFullscreenProps) {
  const { t } = useTranslation();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const categories = useMemo(() => {
    const set = new Set(rows.map((r) => r.category));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (categoryFilter !== 'all' && row.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        row.label.toLowerCase().includes(q) ||
        row.inventoryNumber.toLowerCase().includes(q) ||
        row.category.toLowerCase().includes(q)
      );
    });
  }, [rows, categoryFilter, search]);

  const progress = computeAuditProgressFromRows(rows);

  return (
    <div className="fixed inset-0 z-[60] bg-slate-100 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 shrink-0">
        <div className="flex items-start justify-between gap-4 max-w-6xl mx-auto w-full">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-1">
              {t('Проверка позиций')}
            </p>
            <h2 className="text-lg font-bold text-slate-900 truncate">{audit.title}</h2>
            <p className="text-xs text-slate-500 mt-1">
              {t('Объект проведения:')} {audit.objectName || t('Все объекты')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shrink-0"
            aria-label={t('Закрыть')}
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-w-6xl mx-auto w-full mt-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-700">{t('Ход инвентаризации')}</span>
            <span className="font-bold text-blue-600 tabular-nums">{progress.percent}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 tabular-nums">
            {t('Проверено')}: {progress.checked}/{progress.total}
            {progress.remaining > 0 && (
              <span className="ml-2">
                · {t('Осталось')}: {progress.remaining}
              </span>
            )}
            {progress.missing > 0 && (
              <span className="ml-2 text-rose-600">
                · {t('Расхождения')}: {progress.missing}
              </span>
            )}
          </p>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 shrink-0">
        <div className="max-w-6xl mx-auto w-full flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('Поиск по наименованию или инв. номеру')}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                categoryFilter === 'all'
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
              }`}
            >
              {t('Все категории')}
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  categoryFilter === cat
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                }`}
              >
                {t(cat)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto w-full">
          {filteredRows.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-16">{t('Нет позиций по выбранному фильтру')}</p>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="text-left px-4 py-3 font-bold w-10">№</th>
                    <th className="text-left px-4 py-3 font-bold w-[14%]">{t('Категория')}</th>
                    <th className="text-left px-4 py-3 font-bold">{t('Наименование')}</th>
                    <th className="text-left px-4 py-3 font-bold w-[14%]">{t('Инв. номер')}</th>
                    <th className="text-center px-4 py-3 font-bold w-28">{t('Есть')}</th>
                    <th className="text-center px-4 py-3 font-bold w-28">{t('Нет')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRows.map((row, idx) => (
                    <tr
                      key={row.key}
                      className={
                        row.status === 'missing'
                          ? 'bg-rose-50/50'
                          : row.status === 'present'
                            ? 'bg-emerald-50/40'
                            : 'bg-white'
                      }
                    >
                      <td className="px-4 py-3 text-slate-400 tabular-nums">{idx + 1}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs font-medium">{t(row.category)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{row.label}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{row.inventoryNumber}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateItemCheck(audit.id, row.key, row.status === 'present' ? null : 'present')
                          }
                          className={`min-w-[72px] px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                            row.status === 'present'
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
                          }`}
                        >
                          {t('Есть')}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateItemCheck(audit.id, row.key, row.status === 'missing' ? null : 'missing')
                          }
                          className={`min-w-[72px] px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                            row.status === 'missing'
                              ? 'bg-rose-600 border-rose-600 text-white'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-rose-300 hover:text-rose-700'
                          }`}
                        >
                          {t('Нет')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
