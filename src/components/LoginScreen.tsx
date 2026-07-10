/*
 * COPYRIGHT NOTICE | УВЕДОМЛЕНИЕ ОБ АВТОРСКИХ ПРАВАХ | 版权声明
 * © 2026 Utkin Vladislav Vyacheslavovich (Уткин Владислав Вячеславович)
 */
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { User, Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle, Globe, ChevronDown } from 'lucide-react';
import { useTranslation, type Language } from '../utils/i18n';
import { authenticateCredentials, verifyTotpLogin } from '../utils/sessionAuth';
import BrandLogo from './BrandLogo';
import CountryFlag, { languageToFlagCode } from './CountryFlag';
import { APP_NAME } from '../config/appConfig';
import { COPYRIGHT_YEAR } from '../legal/copyright';

interface LoginScreenProps {
  onLogin: (userId: string) => void | Promise<void>;
  workspaceName?: string;
  siteLogo?: string;
  setupCompleteMessage?: string;
}

const LANGUAGE_OPTIONS: { id: Language; label: string }[] = [
  { id: 'ru', label: 'Русский' },
  { id: 'en', label: 'English' },
  { id: 'zh', label: '中文' },
];

function DotPattern({ className }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none grid grid-cols-4 gap-1.5 opacity-40 ${className ?? ''}`}
      aria-hidden
    >
      {Array.from({ length: 16 }).map((_, i) => (
        <span key={i} className="w-1 h-1 rounded-full bg-blue-300" />
      ))}
    </div>
  );
}

export default function LoginScreen({ onLogin, workspaceName, siteLogo, setupCompleteMessage }: LoginScreenProps) {
  const { t, language, setLanguage } = useTranslation();

  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [totpStep, setTotpStep] = useState(false);
  const [totpChallengeId, setTotpChallengeId] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const activeLang = LANGUAGE_OPTIONS.find((l) => l.id === language) ?? LANGUAGE_OPTIONS[0];
  const displayWorkspace = workspaceName ? t(workspaceName) : t('Инвентаризация оборудования');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('it_login_remember');
      if (saved) {
        setLoginInput(saved);
        setRememberMe(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const finishLogin = (userId: string) => {
    try {
      if (rememberMe) localStorage.setItem('it_login_remember', loginInput.trim());
      else localStorage.removeItem('it_login_remember');
    } catch {
      /* ignore */
    }
    setSuccess(true);
    setTimeout(() => {
      void onLogin(userId);
    }, 750);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!loginInput.trim() || !passwordInput.trim()) {
      setError(t('Пожалуйста, заполните все поля для авторизации.'));
      return;
    }

    const auth = await authenticateCredentials(loginInput.trim(), passwordInput);
    if (!auth) {
      setError(t('Неверный логин или пароль. Проверьте учётные данные.'));
      return;
    }

    if (auth.kind === 'totp_required') {
      setTotpChallengeId(auth.challengeId);
      setTotpStep(true);
      setTotpCode('');
      return;
    }

    finishLogin(auth.userId);
  };

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!totpCode.trim() || totpCode.trim().length !== 6) {
      setError(t('Введите 6-значный код из приложения аутентификатора.'));
      return;
    }
    const session = await verifyTotpLogin(totpChallengeId, totpCode.trim());
    if (!session) {
      setError(t('Неверный код двухэтапной аутентификации. Попробуйте снова.'));
      return;
    }
    finishLogin(session.userId);
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden font-sans">
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-20 w-[420px] h-[420px] bg-blue-300/20 rounded-full blur-3xl pointer-events-none" />
      <DotPattern className="absolute top-10 right-16" />
      <DotPattern className="absolute bottom-16 left-12" />

      <div className="relative z-10 w-full max-w-[440px]">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex items-center gap-3 mb-5">
            {siteLogo ? (
              <img
                src={siteLogo}
                alt="Logo"
                className="w-11 h-11 object-contain rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <BrandLogo size={44} variant="full" className="shadow-md border-0" />
            )}
            <span className="text-lg font-bold text-slate-900">{displayWorkspace}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('Вход в ИТ-Инвентарь')}</h1>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-md">
            {t('Единая корпоративная система учета оборудования и инвентаризации филиалов')} — {displayWorkspace}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_40px_rgba(15,23,42,0.08)] p-6 sm:p-7"
        >
          <div className="flex items-start justify-between gap-4 pb-5 mb-5 border-b border-slate-100">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-slate-800">
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Globe size={16} />
                </span>
                <span className="text-sm font-bold">{t('Язык платформы (Language)')}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5 pl-10">{t('Выберите основной язык интерфейса')}</p>
            </div>

            <div ref={langRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setLangOpen((open) => !open)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-sm text-slate-700 transition-colors"
              >
                <CountryFlag code={languageToFlagCode(activeLang.id)} className="w-5 h-3.5 rounded-sm shadow-sm" />
                <span className="font-medium">{activeLang.label}</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-[calc(100%+6px)] w-44 bg-white rounded-xl border border-slate-100 shadow-lg py-1 z-20">
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setLanguage(opt.id);
                        setLangOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left transition-colors ${
                        language === opt.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <CountryFlag code={languageToFlagCode(opt.id)} className="w-5 h-3.5 rounded-sm shadow-sm" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {setupCompleteMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-2.5 text-emerald-700 text-xs leading-snug">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
              <span>{t(setupCompleteMessage)}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={(e) => void (totpStep ? handleTotpSubmit(e) : handleSubmit(e))}>
            {!totpStep ? (
              <>
            <div>
              <label htmlFor="loginEmail" className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('Логин или email')}
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="loginEmail"
                  name="loginEmail"
                  type="text"
                  required
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  placeholder={t('Введите логин или email')}
                  className="block w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('Пароль')}
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder={t('Введите пароль')}
                  className="block w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? t('Скрыть пароль') : t('Показать пароль')}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-0.5">
              <label className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/30"
                />
                {t('Запомнить меня')}
              </label>
              <button type="button" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                {t('Забыли пароль?')}
              </button>
            </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 text-xs leading-snug">
                  {t('Введите 6-значный код из приложения Google Authenticator или аналога.')}
                </div>
                <div>
                  <label htmlFor="totpCode" className="block text-sm font-medium text-slate-700 mb-1.5">
                    {t('Код двухэтапной аутентификации')}
                  </label>
                  <input
                    id="totpCode"
                    name="totpCode"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    autoFocus
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="block w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-center font-mono tracking-[0.3em] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTotpStep(false);
                    setTotpChallengeId('');
                    setTotpCode('');
                    setError('');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  {t('Вернуться к вводу пароля')}
                </button>
              </div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs leading-snug"
              >
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
                <span>{error}</span>
              </motion.div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-2.5 text-emerald-700 text-xs leading-snug">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
                <span className="font-semibold">{t('Авторизация пройдена успешно. Вход...')}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={success}
              className="w-full mt-1 flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              <ShieldCheck size={18} />
              <span>{totpStep ? t('Подтвердить код') : t('Войти в систему')}</span>
            </button>
          </form>
        </motion.div>

        <footer className="mt-8 text-center text-xs text-slate-500 space-y-2">
          <p>
            © {COPYRIGHT_YEAR} {APP_NAME}. {t('Все права защищены')}.
          </p>
          <p className="flex items-center justify-center gap-2 flex-wrap">
            <button type="button" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
              {t('Политика конфиденциальности')}
            </button>
            <span>·</span>
            <button type="button" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
              {t('Поддержка')}
            </button>
          </p>
        </footer>
      </div>
    </div>
  );
}
