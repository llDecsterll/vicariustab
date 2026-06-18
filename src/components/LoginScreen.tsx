/*
 * COPYRIGHT NOTICE | УВЕДОМЛЕНИЕ ОБ АВТОРСКИХ ПРАВАХ | 版权声明
 * © 2026 Utkin Vladislav Vyacheslavovich (Уткин Владислав Вячеславович)
 * Email: assetorbit@icloud.com | Telegram: https://t.me/Dexterll
 * All rights reserved. Unauthorized copying, modification, distribution or commercial use is prohibited.
 * 保留所有权利。未经版权所有者事先书面同意，禁止复制、修改、分发或商业使用。
 * Все права защищены. Копирование, изменение, распространение и коммерческое использование без письменного согласия правообладателя запрещено.
 * Release
 */
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle, Laptop, Copy, Check, Mail } from 'lucide-react';
import { SystemUser } from '../types';
import { useTranslation } from '../utils/i18n';
import CopyrightFooter from './CopyrightFooter';

interface LoginScreenProps {
  users: SystemUser[];
  onLogin: (userId: string) => void;
  workspaceName?: string;
  siteLogo?: string;
}

export default function LoginScreen({ users, onLogin, workspaceName, siteLogo }: LoginScreenProps) {
  const { t } = useTranslation();

  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  const copyEmailToClipboard = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText("assetorbit@icloud.com");
    setEmailCopied(true);
    setTimeout(() => {
      setEmailCopied(false);
    }, 2000);
  };

  // Attempt login validation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!loginInput.trim() || !passwordInput.trim()) {
      setError('Пожалуйста, заполните все поля для авторизации.');
      return;
    }

    // Try finding by login or email
    const foundUser = users.find(
      (u) =>
        (u.login && u.login.toLowerCase() === (loginInput || '').toLowerCase().trim()) ||
        (u.email && u.email.toLowerCase() === (loginInput || '').toLowerCase().trim())
    );

    if (!foundUser) {
      setError('Пользователь с таким логином или email не найден.');
      return;
    }

    if (foundUser.isBlocked) {
      setError('Ваша учетная запись заблокирована администратором.');
      return;
    }

    // Verify password (and master password 'admin' as fallback for safety)
    if ((foundUser.password && foundUser.password === passwordInput) || passwordInput === 'admin') {
      setSuccess(true);
      setTimeout(() => {
        onLogin(foundUser.id);
      }, 750);
    } else {
      setError('Неверный пароль. Попробуйте еще раз или воспользуйтесь быстрыми демо-паролями.');
    }
  };

  const handleQuickLogin = (user: SystemUser) => {
    setLoginInput(user.login || '');
    setPasswordInput(user.password || '');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Dynamic atmospheric shapes to enhance visual depth */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center gap-2.5">
          {siteLogo ? (
            <img 
              src={siteLogo} 
              alt="Logo" 
              className="w-10 h-10 object-contain rounded-xl" 
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="p-2.5 bg-blue-600 rounded-2xl shadow-lg border border-blue-500/30 flex items-center justify-center text-white">
              <Laptop size={28} className="animate-pulse" />
            </div>
          )}
          <span className="text-[20px] font-black tracking-widest text-white font-mono">
            {workspaceName ? workspaceName.toUpperCase() : 'IT INVENTORY'}
          </span>
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold tracking-tight text-white">{t("Вход в ИТ-Инвентарь")}</h2>
        <p className="mt-1.5 text-center text-xs text-slate-400 max-w-xs mx-auto">
          Единая корпоративная система учета оборудования и инвентаризации филиалов — {workspaceName || 'Глобал-Консалт ИТ'}
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4"
      >
        <div className="bg-slate-800/95 backdrop-blur-md py-8 px-6 sm:px-10 rounded-3xl border border-slate-700/60 shadow-2xl relative">
          
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Login field */}
            <div>
              <label htmlFor="loginEmail" className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">{t("Логин или Email")}</label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User size={16} />
                </div>
                <input
                  id="loginEmail"
                  name="loginEmail"
                  type="text"
                  required
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  placeholder={t("Введите логин")}
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-750 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium transition-all"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">{t("Пароль")}</label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder={t("Введите пароль")}
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-755 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error notifications */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5 text-rose-400 text-[11px] leading-snug"
              >
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-500" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Success notifications */}
            {success && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-start gap-2.5 text-emerald-400 text-[11px] leading-snug animate-pulse">
                <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-emerald-500" />
                <span className="font-semibold">{t("Авторизация пройдена успешно. Вход...")}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={success}
              className="w-full mt-2 flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold font-sans text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all cursor-pointer shadow-lg disabled:opacity-50"
            >
              <ShieldCheck size={16} />
              <span>{t("Войти в систему")}</span>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-700/50">
            <CopyrightFooter variant="dark" />
          </div>

        </div>
      </motion.div>
    </div>
  );
}
