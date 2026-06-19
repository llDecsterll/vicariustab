/*
 * COPYRIGHT NOTICE | УВЕДОМЛЕНИЕ ОБ АВТОРСКИХ ПРАВАХ | 版权声明
 * © 2026 Utkin Vladislav Vyacheslavovich (Уткин Владислав Вячеславович)
 * Email: vicariustab@icloud.com | Telegram: https://t.me/Dexterll
 * All rights reserved. Unauthorized copying, modification, distribution or commercial use is prohibited.
 * 保留所有权利。未经版权所有者事先书面同意，禁止复制、修改、分发或商业使用。
 * Все права защищены. Копирование, изменение, распространение и коммерческое использование без письменного согласия правообладателя запрещено.
 * Release
 */
import React, { useState } from 'react';
import { History, Search, Calendar, User, Info, FileSpreadsheet, Trash2 } from 'lucide-react';
import { Activity } from '../types';
import { useTranslation } from '../utils/i18n';

interface ActivityLogViewProps {
  activities: Activity[];
  onClear: () => void;
  currentUser?: { role: 'Viewer' | 'Editor' | 'Admin' };
}

export default function ActivityLogView({
  activities,
  onClear,
  currentUser,
}: ActivityLogViewProps) {
  const { t } = useTranslation();

  const [search, setSearch] = useState('');
  const isAdmin = currentUser?.role === 'Admin';

  const filtered = activities.filter(
    act => act.action.toLowerCase().includes(search.toLowerCase()) ||
           act.detail.toLowerCase().includes(search.toLowerCase()) ||
           act.user.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <History className="text-blue-500" />{t("Журнал системных действий")}</h2>
          <p className="text-slate-400 text-xs">{t("Автоматическое протоколирование всех операций с компьютерами, сотрудниками, складом и филиалами.")}</p>
        </div>
        {isAdmin && (
          <button
            onClick={onClear}
            className="px-4 py-2 border border-slate-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Trash2 size={14} />{t("Очистить логи")}</button>
        )}
      </div>

      {/* Search filter row */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs relative w-full max-w-sm">
        <input
          type="text"
          placeholder={t("Фильтр по журналу событий...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-705"
        />
        <Search size={16} className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400" />
      </div>

      {/* Audit Logs list */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="relative border-l-2 border-slate-100 pl-6 ml-4 space-y-6">
          {filtered.map((act) => {
            let markerColor = 'bg-blue-500';
            if (act.type === 'create') markerColor = 'bg-emerald-500';
            else if (act.type === 'delete') markerColor = 'bg-rose-500';
            else if (act.type === 'system') markerColor = 'bg-slate-400';
            else if (act.type === 'auth') markerColor = 'bg-amber-500';

            return (
              <div key={act.id} className="relative group">
                {/* Connecting Circle Marker */}
                <div className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white ring-4 ring-slate-50 ${markerColor}`} />

                <div className="space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-bold text-slate-800 text-sm leading-none flex items-center gap-2">
                      {act.action}
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold font-mono">
                        {act.type}
                      </span>
                    </span>
                    <span className="text-slate-400 text-xs font-mono">
                      {new Date(act.timestamp).toLocaleString('ru-RU')}
                    </span>
                  </div>

                  <p className="text-slate-600 text-sm leading-relaxed">{act.detail}</p>
                  
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <User size={12} />
                    <span>{t("Инициировал:")}</span>
                    <strong className="text-slate-500 font-medium">{act.user}</strong>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm italic pr-6">{t("Журнал логов пуст.")}</div>
          )}
        </div>
      </div>
    </div>
  );
}
