/*
 * First-run administrator account creation
 */
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  User,
  Lock,
  Mail,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  ChevronDown,
} from 'lucide-react';
import { useTranslation, type Language } from '../utils/i18n';
import BrandLogo from './BrandLogo';
import CountryFlag, { languageToFlagCode } from './CountryFlag';
import { APP_NAME } from '../config/appConfig';
import { COPYRIGHT_YEAR } from '../legal/copyright';
import { completeInitialSetup } from '../utils/setupAuth';
import { translateAuthError } from '../utils/authErrors';

interface FirstRunSetupProps {
  workspaceName?: string;
  siteLogo?: string;
  onComplete: () => void;
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

const fieldClass =
  'block w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all';

export default function FirstRunSetup({ workspaceName, siteLogo, onComplete }: FirstRunSetupProps) {
  const { t, language, setLanguage } = useTranslation();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const activeLang = LANGUAGE_OPTIONS.find((l) => l.id === language) ?? LANGUAGE_OPTIONS[0];
  const displayWorkspace = workspaceName ? t(workspaceName) : t('Инвентаризация оборудования');
  const requiredMark = language === 'ru' ? null : <span className="text-rose-500"> *</span>;

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!login.trim() || !password || !email.trim()) {
      setError(t('Заполните все обязательные поля.'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('Пароли не совпадают.'));
      return;
    }

    setLoading(true);
    const result = await completeInitialSetup({ login: login.trim(), password, email: email.trim() });
    setLoading(false);

    if (!result.ok) {
      setError(translateAuthError(result.error || t('Не удалось создать учётную запись администратора.'), t));
      return;
    }

    setSuccess(true);
    setTimeout(() => onComplete(), 1200);
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden font-sans">
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-20 w-[420px] h-[420px] bg-blue-300/20 rounded-full blur-3xl pointer-events-none" />
      <DotPattern className="absolute top-10 right-16" />
      <DotPattern className="absolute bottom-16 left-12" />

      <div className="relative z-10 w-full max-w-[440px]">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex items-center gap-3 mb-4">
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
            <span className="text-sm font-black tracking-[0.12em] text-blue-900 uppercase">
              {displayWorkspace}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('Первый запуск')}</h1>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-md">
            {t(
              'Создайте учетную запись администратора для начала работы с системой. Платформа будет заблокирована до завершения этого шага.'
            )}
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

          <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
            <div>
              <label htmlFor="setup-login" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                {t('Логин (Username)')}
                {requiredMark}
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="setup-login"
                  type="text"
                  required
                  minLength={3}
                  maxLength={64}
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder={t('ваш логин')}
                  className={fieldClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="setup-email" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                {t('Имейл')}
                {requiredMark}
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="setup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('ваша почта')}
                  className={fieldClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="setup-password" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                {t('Пароль (Security Password)')}
                {requiredMark}
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="setup-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('Не менее 8 символов')}
                  className={`${fieldClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? t('Скрыть пароль') : t('Показать пароль')}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="setup-confirm" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                {t('Подтвердите пароль (Confirm Password)')}
                {requiredMark}
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="setup-confirm"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('Не менее 8 символов')}
                  className={`${fieldClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showConfirmPassword ? t('Скрыть пароль') : t('Показать пароль')}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

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
                <span className="font-semibold">{t('Администратор создан. Переход к входу...')}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || success}
              className="w-full mt-1 flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              <ShieldCheck size={18} />
              <span>{loading ? t('Создание...') : t('Создать администратора')}</span>
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
