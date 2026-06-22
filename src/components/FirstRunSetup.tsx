/*
 * First-run administrator account creation
 */
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Lock, Mail, ShieldCheck, AlertCircle, CheckCircle2, Eye, EyeOff, Languages } from 'lucide-react';
import { useTranslation } from '../utils/i18n';
import BrandLogo from './BrandLogo';
import { APP_NAME } from '../config/appConfig';
import { completeInitialSetup } from '../utils/setupAuth';

interface FirstRunSetupProps {
  workspaceName?: string;
  siteLogo?: string;
  onComplete: () => void;
}

export default function FirstRunSetup({ workspaceName, siteLogo, onComplete }: FirstRunSetupProps) {
  const { t, language, setLanguage } = useTranslation();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!login.trim() || !password || !email.trim()) {
      setError('Заполните все обязательные поля.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Пароли не совпадают.');
      return;
    }

    setLoading(true);
    const result = await completeInitialSetup({ login: login.trim(), password, email: email.trim() });
    setLoading(false);

    if (!result.ok) {
      setError(result.error || 'Не удалось создать учётную запись администратора.');
      return;
    }

    setSuccess(true);
    setTimeout(() => onComplete(), 1200);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center gap-2.5">
          {siteLogo ? (
            <img src={siteLogo} alt="Logo" className="w-10 h-10 object-contain rounded-xl" referrerPolicy="no-referrer" />
          ) : (
            <BrandLogo size={48} variant="full" className="shadow-lg border-blue-500/30" />
          )}
          <span className="text-[20px] font-black tracking-widest text-white font-mono">
            {workspaceName ? workspaceName.toUpperCase() : APP_NAME.toUpperCase()}
          </span>
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold tracking-tight text-white">
          {t('Первоначальная настройка')}
        </h2>
        <p className="mt-1.5 text-center text-xs text-slate-400 max-w-sm mx-auto">
          {t('Создайте учётную запись администратора для начала работы с системой. До этого шага доступ к платформе закрыт.')}
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4"
      >
        <div className="bg-slate-800/95 backdrop-blur-md py-8 px-6 sm:px-10 rounded-3xl border border-slate-700/60 shadow-2xl space-y-5">
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-700/60 space-y-2.5">
            <div className="flex items-center gap-2 text-slate-300">
              <Languages size={15} className="text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-wider">{t('Язык платформы (Language)')}</span>
            </div>
            <p className="text-[10px] text-slate-400">{t('Выберите основной язык интерфейса')}</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setLanguage('ru')}
                className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                  language === 'ru'
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-750'
                }`}
              >
                {t('Русский (RU)')}
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                  language === 'en'
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-750'
                }`}
              >
                English (EN)
              </button>
              <button
                type="button"
                onClick={() => setLanguage('zh')}
                className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                  language === 'zh'
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-750'
                }`}
              >
                中文 (ZH)
              </button>
            </div>
          </div>

          <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">{t('Логин')} *</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={64}
                  pattern="[a-zA-Z0-9._-]+"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder={t('Логин администратора')}
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-750 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">{t('Email')} *</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.ru"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-750 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">{t('Пароль')} *</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('Не менее 8 символов')}
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-755 rounded-xl text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">{t('Подтверждение пароля')} *</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-755 rounded-xl text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex gap-2 text-rose-400 text-[11px]">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex gap-2 text-emerald-400 text-[11px]">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>{t('Администратор создан. Переход к входу...')}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || success}
              className="w-full flex justify-center items-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
            >
              <ShieldCheck size={16} />
              {loading ? t('Создание...') : t('Создать администратора')}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
