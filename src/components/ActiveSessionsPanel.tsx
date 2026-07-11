/*
 * Active sessions management panel (Admin / Editor)
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Monitor, Smartphone, Tablet, Globe, Clock, Shield, LogOut, RefreshCw } from 'lucide-react';
import { useTranslation } from '../utils/i18n';
import type { UserSession } from '../types';
import {
  fetchActiveSessions,
  revokeAllOtherSessions,
  revokeSessionById,
} from '../utils/sessionAuth';
import { hasStoredSession, SESSION_ID_KEY } from '../utils/deviceFingerprint';

interface ActiveSessionsPanelProps {
  onLogAuth?: (action: string, detail: string) => void;
}

export default function ActiveSessionsPanel({ onLogAuth }: ActiveSessionsPanelProps) {
  const { t, language } = useTranslation();
  const dateLocale = language === 'en' ? 'en-US' : language === 'zh' ? 'zh-CN' : 'ru-RU';
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    const list = await fetchActiveSessions();
    setSessions(list);
    setCurrentSessionId(sessionStorage.getItem(SESSION_ID_KEY));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (hasStoredSession()) {
      void loadSessions();
    } else {
      setLoading(false);
    }
  }, [loadSessions]);

  const deviceIcon = (device: string) => {
    if (device === 'Mobile') return <Smartphone size={16} className="text-blue-500" />;
    if (device === 'Tablet') return <Tablet size={16} className="text-indigo-500" />;
    return <Monitor size={16} className="text-slate-500" />;
  };

  const handleRevoke = async (sessionId: string) => {
    if (!window.confirm(t('Завершить эту сессию?'))) return;
    const ok = await revokeSessionById(sessionId);
    if (ok) {
      onLogAuth?.('Завершение сессии', `Завершена сессия ${sessionId}`);
      await loadSessions();
    }
  };

  const handleRevokeOthers = async () => {
    if (!window.confirm(t('Завершить все остальные активные сессии?'))) return;
    const count = await revokeAllOtherSessions();
    onLogAuth?.('Завершение всех других сессий', `Завершено сессий: ${count}`);
    await loadSessions();
  };

  if (!hasStoredSession()) {
    return (
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-800">
        {t('Управление сессиями доступно для ролей Администратор и Редактор после входа с зарегистрированной сессией.')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Shield size={16} className="text-blue-500" />
            {t('Активные сессии')}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {t('Устройства и браузеры, с которых выполнен вход в вашу учётную запись.')}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void loadSessions()}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1"
          >
            <RefreshCw size={12} />
            {t('Обновить')}
          </button>
          {sessions.length > 1 && (
            <button
              type="button"
              onClick={() => void handleRevokeOthers()}
              className="px-3 py-1.5 text-xs bg-rose-50 text-rose-700 border border-rose-100 rounded-lg hover:bg-rose-100 flex items-center gap-1 font-semibold"
            >
              <LogOut size={12} />
              {t('Завершить все другие')}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-slate-400 italic">{t('Загрузка...')}</p>
      ) : sessions.length === 0 ? (
        <p className="text-xs text-slate-400 italic">{t('Нет активных сессий')}</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <div
              key={s.id}
              className={`border rounded-xl p-4 text-xs ${
                s.id === currentSessionId || s.isCurrent
                  ? 'border-blue-200 bg-blue-50/40'
                  : 'border-slate-100 bg-white'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    {deviceIcon(s.device)}
                    <span>{s.browser}</span>
                    <span className="text-slate-400">·</span>
                    <span>{s.os}</span>
                    {(s.id === currentSessionId || s.isCurrent) && (
                      <span className="text-[9px] uppercase bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                        {t('Текущая')}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500">
                    <span className="flex items-center gap-1">
                      <Globe size={11} />
                      {s.ipAddress}
                      {s.city || s.country ? ` · ${[s.city, s.country].filter(Boolean).join(', ')}` : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {t('Вход')}: {new Date(s.createdAt).toLocaleString(dateLocale)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {t('Активность')}: {new Date(s.lastActivityAt).toLocaleString(dateLocale)}
                    </span>
                  </div>
                </div>
                {s.id !== currentSessionId && !s.isCurrent && (
                  <button
                    type="button"
                    onClick={() => void handleRevoke(s.id)}
                    className="shrink-0 px-3 py-1.5 text-[11px] border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 font-semibold"
                  >
                    {t('Завершить')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
