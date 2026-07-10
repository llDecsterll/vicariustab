/*
 * Two-factor authentication (TOTP) settings for current user
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Shield, Smartphone, Copy, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from '../utils/i18n';
import {
  beginTotpSetup,
  confirmTotpSetup,
  disableTotp,
  fetchTotpStatus,
} from '../utils/sessionAuth';

interface TwoFactorSettingsProps {
  twoFactorEnabled?: boolean;
  onStatusChange: (enabled: boolean) => void;
  onRevisionSync?: (revision: number) => void;
}

export default function TwoFactorSettings({
  twoFactorEnabled,
  onStatusChange,
  onRevisionSync,
}: TwoFactorSettingsProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(Boolean(twoFactorEnabled));
  const [pendingSetup, setPendingSetup] = useState(false);
  const [setupSecret, setSetupSecret] = useState('');
  const [setupUrl, setSetupUrl] = useState('');
  const [setupQrUrl, setSetupQrUrl] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState<'secret' | 'url' | null>(null);

  const onStatusChangeRef = useRef(onStatusChange);
  const onRevisionSyncRef = useRef(onRevisionSync);
  const lastSyncedEnabledRef = useRef<boolean | null>(null);
  const resumeAttemptedRef = useRef(false);
  const initialLoadDoneRef = useRef(false);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
    onRevisionSyncRef.current = onRevisionSync;
  }, [onStatusChange, onRevisionSync]);

  const syncRevision = (revision?: number) => {
    if (typeof revision === 'number' && onRevisionSyncRef.current) {
      onRevisionSyncRef.current(revision);
    }
  };

  const notifyEnabledChange = (nextEnabled: boolean) => {
    if (lastSyncedEnabledRef.current === nextEnabled) return;
    lastSyncedEnabledRef.current = nextEnabled;
    onStatusChangeRef.current(nextEnabled);
  };

  const [statusError, setStatusError] = useState('');

  const applySetupBegin = (data: { secret: string; otpauthUrl: string; qrDataUrl?: string; revision?: number }) => {
    setSetupSecret(data.secret);
    setSetupUrl(data.otpauthUrl);
    setSetupQrUrl(data.qrDataUrl || '');
    setPendingSetup(true);
    setConfirmCode('');
    syncRevision(data.revision);
  };

  const refreshStatus = useCallback(async (options?: { showLoading?: boolean }) => {
    const showLoading = options?.showLoading ?? !initialLoadDoneRef.current;
    if (showLoading) setLoading(true);
    setStatusError('');
    const status = await fetchTotpStatus();
    if (status.ok) {
      setEnabled(status.data.enabled);
      setPendingSetup(status.data.pendingSetup);
      notifyEnabledChange(status.data.enabled);
      if (status.data.pendingSetup && !status.data.enabled && !resumeAttemptedRef.current) {
        resumeAttemptedRef.current = true;
        const resume = await beginTotpSetup();
        if (resume.ok) {
          applySetupBegin(resume.data);
        } else if (resume.ok === false && resume.status !== 401) {
          setStatusError(
            resume.error ||
              (resume.status ? `HTTP ${resume.status}` : t('Не удалось возобновить настройку 2FA.'))
          );
        }
      }
    } else if (status.ok === false) {
      if (status.status === 401) {
        setStatusError(t('Сессия истекла. Выйдите и войдите снова, затем повторите настройку 2FA.'));
      } else {
        setStatusError(status.error || t('Не удалось загрузить статус 2FA.'));
      }
    }
    initialLoadDoneRef.current = true;
    setLoading(false);
  }, [t]);

  useEffect(() => {
    lastSyncedEnabledRef.current =
      typeof twoFactorEnabled === 'boolean' ? twoFactorEnabled : null;
    void refreshStatus();
    // Load server status once on mount; avoid loops from parent callback identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof twoFactorEnabled !== 'boolean') return;
    setEnabled(twoFactorEnabled);
    lastSyncedEnabledRef.current = twoFactorEnabled;
  }, [twoFactorEnabled]);

  const copyText = async (text: string, kind: 'secret' | 'url') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleBeginSetup = async () => {
    setError('');
    setSuccess('');
    setBusy(true);
    const result = await beginTotpSetup();
    setBusy(false);
    if (result.ok === false) {
      if (result.status === 401) {
        setError(t('Сессия истекла. Выйдите и войдите снова, затем повторите настройку 2FA.'));
      } else if (result.status === 404) {
        setError(
          result.error ||
            t('Учётная запись не найдена. Выйдите из системы и войдите снова.')
        );
      } else {
        const detail = result.error || (result.status ? `HTTP ${result.status}` : '');
        setError(detail || t('Не удалось начать настройку двухэтапной аутентификации.'));
      }
      return;
    }
    applySetupBegin(result.data);
  };

  const handleConfirmSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (confirmCode.length !== 6) {
      setError(t('Введите 6-значный код из приложения аутентификатора.'));
      return;
    }
    setBusy(true);
    const result = await confirmTotpSetup(confirmCode);
    setBusy(false);
    if (!result.ok) {
      setError(result.error || t('Неверный код. Убедитесь, что время на телефоне синхронизировано.'));
      return;
    }
    setEnabled(true);
    setPendingSetup(false);
    setSetupSecret('');
    setSetupUrl('');
    setSetupQrUrl('');
    setConfirmCode('');
    setSuccess(t('Двухэтапная аутентификация успешно включена.'));
    notifyEnabledChange(true);
    syncRevision(result.revision);
    void refreshStatus({ showLoading: false });
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (disableCode.length !== 6) {
      setError(t('Введите 6-значный код из приложения аутентификатора.'));
      return;
    }
    setBusy(true);
    const result = await disableTotp(disableCode);
    setBusy(false);
    if (!result.ok) {
      setError(result.error || t('Неверный код двухэтапной аутентификации.'));
      return;
    }
    setEnabled(false);
    setDisableCode('');
    setSuccess(t('Двухэтапная аутентификация отключена.'));
    notifyEnabledChange(false);
    syncRevision(result.revision);
    void refreshStatus({ showLoading: false });
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
        <Smartphone className="text-blue-500" size={16} />
        <div>
          <h3 className="font-bold text-slate-805 text-sm tracking-tight">{t('Двухэтапная аутентификация (2FA)')}</h3>
          <p className="text-[10px] text-slate-400">
            {t('Защитите учётную запись кодом из Google Authenticator, Microsoft Authenticator или аналога.')}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
          <Loader2 size={14} className="animate-spin" />
          {t('Загрузка данных…')}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 text-xs">
            <Shield size={14} className={enabled ? 'text-emerald-600' : 'text-slate-400'} />
            <span className="font-semibold text-slate-700">
              {enabled ? t('2FA включена') : t('2FA не включена')}
            </span>
          </div>

          {statusError && (
            <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-100 flex items-start gap-2">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{statusError}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-100 flex items-start gap-2">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-100 flex items-start gap-2">
              <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {!enabled && !pendingSetup && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleBeginSetup()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              {busy ? t('Подготовка…') : t('Включить 2FA')}
            </button>
          )}

          {!enabled && pendingSetup && setupSecret && (
            <form onSubmit={(e) => void handleConfirmSetup(e)} className="space-y-3 text-xs">
              <p className="text-slate-600 leading-relaxed">
                {t('1. Установите приложение аутентификатора на телефон. 2. Отсканируйте QR-код или добавьте учётную запись по секрету. 3. Введите 6-значный код для подтверждения.')}
              </p>
              {setupQrUrl && (
                <div className="flex justify-center p-3 bg-white rounded-xl border border-slate-100">
                  <img
                    src={setupQrUrl}
                    alt={t('QR-код для настройки 2FA')}
                    className="w-44 h-44"
                  />
                </div>
              )}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{t('Секретный ключ')}</span>
                  <button
                    type="button"
                    onClick={() => void copyText(setupSecret, 'secret')}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-[10px] font-bold"
                  >
                    {copied === 'secret' ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                    {copied === 'secret' ? t('Скопировано') : t('Копировать')}
                  </button>
                </div>
                <code className="block font-mono text-[11px] break-all text-slate-800">{setupSecret}</code>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">otpauth://</span>
                  <button
                    type="button"
                    onClick={() => void copyText(setupUrl, 'url')}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-[10px] font-bold"
                  >
                    {copied === 'url' ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                    {copied === 'url' ? t('Скопировано') : t('Копировать')}
                  </button>
                </div>
                <code className="block font-mono text-[10px] break-all text-slate-600">{setupUrl}</code>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">
                  {t('Код подтверждения')}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-center font-mono tracking-widest text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={busy || confirmCode.length !== 6}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg disabled:opacity-50"
              >
                {busy ? t('Проверка…') : t('Подтвердить и включить')}
              </button>
            </form>
          )}

          {enabled && (
            <form onSubmit={(e) => void handleDisable(e)} className="space-y-3 text-xs max-w-sm">
              <p className="text-slate-500">{t('Для отключения 2FA введите текущий код из приложения аутентификатора.')}</p>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-center font-mono tracking-widest text-sm"
              />
              <button
                type="submit"
                disabled={busy || disableCode.length !== 6}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg disabled:opacity-50"
              >
                {busy ? t('Отключение…') : t('Отключить 2FA')}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
