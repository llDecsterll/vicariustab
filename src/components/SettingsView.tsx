/*
 * COPYRIGHT NOTICE | УВЕДОМЛЕНИЕ ОБ АВТОРСКИХ ПРАВАХ | 版权声明
 * © 2026 Utkin Vladislav Vyacheslavovich (Уткин Владислав Вячеславович)
 * Email: vicariustab@icloud.com | Telegram: https://t.me/Dexterll
 * All rights reserved. Unauthorized copying, modification, distribution or commercial use is prohibited.
 * 保留所有权利。未经版权所有者事先书面同意，禁止复制、修改、分发或商业使用。
 * Все права защищены. Копирование, изменение, распространение и коммерческое использование без письменного согласия правообладателя запрещено.
 * Release
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  RefreshCw, 
  Save, 
  ShieldCheck, 
  Mail, 
  Send,
  Database, 
  HelpCircle, 
  User, 
  UserPlus, 
  Trash2, 
  Shield, 
  Edit, 
  Eye, 
  EyeOff, 
  Lock,
  Unlock,
  Laptop,
  Network,
  Monitor,
  Server,
  Wifi,
  Cpu,
  Router,
  HardDrive,
  Smartphone,
  Keyboard,
  Image as ImageIcon,
  Key,
  Terminal,
  Copy,
  Check,
  Github,
  Download,
  Upload,
  FileJson,
  ExternalLink,
  FileText,
  AlertTriangle,
  Languages,
  Camera,
  Globe
} from 'lucide-react';
import { SystemUser, UserRole } from '../types';
import { getSystemRequestCode, getLicenseStatus, canUseBackup, canUseSystemUpdate } from '../utils/license';
import { copyTextToClipboard } from '../utils/clipboard';
import { useTranslation, Language } from '../utils/i18n';
import { VICARIUSTAB_UPDATE_REPO, VICARIUSTAB_UPDATE_REPO_DISPLAY, APP_VERSION } from '../config/appConfig';
import { buildUpdateNotificationText, buildUpdateCompletedText, checkForPlatformUpdate, applyPlatformUpdate, fetchUpdateJobStatus, markInstalledCommit, type UpdateCheckResult } from '../utils/updateCheck';
import CopyrightFooter from './CopyrightFooter';
import CountryFlag, { languageToFlagCode } from './CountryFlag';
import ActiveSessionsPanel from './ActiveSessionsPanel';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { authHeaders } from '../utils/deviceFingerprint';
import { isBlockedBackupKey, stripLicenseFromLocalBackupData } from '../utils/backupLicensePolicy';
import { validateEmailField, validateLoginField, validatePasswordField } from '../utils/credentialValidation';
import DocumentHeaderSettings from './DocumentHeaderSettings';

interface SettingsViewProps {
  onPurgeWorkspace: () => Promise<boolean>;
  workspaceName: string;
  setWorkspaceName: (name: string) => void;
  adminEmail: string;
  setAdminEmail: (email: string) => void;
  publicUrl: string;
  setPublicUrl: (url: string) => void;
  users: SystemUser[];
  currentUser: SystemUser;
  onAddUser: (user: Omit<SystemUser, 'id'>) => void;
  onDeleteUser: (id: string) => void;
  onUpdateUser?: (id: string, updatedFields: Partial<SystemUser>) => void;
  tabIcons: {
    computers: string;
    network: string;
    peripherals: string;
    other_equip: string;
  };
  setTabIcons: React.Dispatch<React.SetStateAction<{
    computers: string;
    network: string;
    peripherals: string;
    other_equip: string;
  }>>;
  panelLogo: string;
  setPanelLogo: (logo: string) => void;
  panelColor: string;
  setPanelColor: (color: string) => void;
  onUpdateCurrentUserAvatar: (userId: string, avatarUrl: string) => void;
  siteFavicon: string;
  setSiteFavicon: (url: string) => void;
  siteLogo: string;
  setSiteLogo: (url: string) => void;
  sidebarBgColor: string;
  setSidebarBgColor: (color: string) => void;
  sidebarOpacity: number;
  setSidebarOpacity: (opacity: number) => void;
  onDocumentHeaderPersist?: () => void;
  licenseStatus: {
    isActivated: boolean;
    licenseType: 'trial' | 'annual' | 'perpetual';
    trialDaysLeft: number;
    trialTimeLeftFormatted?: string;
    isExpired: boolean;
    licenseKey: string | null;
    expiresYear: number | null;
    macAddress: string;
    clientName?: string;
    clientEmail?: string;
    clientPhone?: string;
    isTampered: boolean;
    failedAttempts: number;
    lockoutTimeLeft: number;
  };
  onActivate: (key: string) => boolean;
  onDeactivate: () => void;
  onRefreshLicense?: () => void;
  onLogActivity?: (action: string, detail: string, type: 'create' | 'update' | 'delete' | 'system' | 'auth') => void;
}

export default function SettingsView({
  onPurgeWorkspace,
  workspaceName,
  setWorkspaceName,
  adminEmail,
  setAdminEmail,
  publicUrl,
  setPublicUrl,
  users,
  currentUser,
  onAddUser,
  onDeleteUser,
  onUpdateUser,
  tabIcons,
  setTabIcons,
  panelLogo,
  setPanelLogo,
  panelColor,
  setPanelColor,
  onUpdateCurrentUserAvatar,
  siteFavicon,
  setSiteFavicon,
  siteLogo,
  setSiteLogo,
  sidebarBgColor,
  setSidebarBgColor,
  sidebarOpacity,
  setSidebarOpacity,
  onDocumentHeaderPersist,
  licenseStatus,
  onActivate,
  onDeactivate,
  onRefreshLicense,
  onLogActivity,
}: SettingsViewProps) {
  const { language, setLanguage, t } = useTranslation();

  const [tempName, setTempName] = useState(workspaceName);
  const [tempEmail, setTempEmail] = useState(adminEmail);
  const [tempPublicUrl, setTempPublicUrl] = useState(publicUrl);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [runtimeInfo, setRuntimeInfo] = useState<{
    tls?: boolean;
    detectedUrl?: string | null;
    publicUrl?: string | null;
    domain?: string | null;
    behindProxy?: boolean;
  } | null>(null);

  useEffect(() => {
    setTempPublicUrl(publicUrl);
  }, [publicUrl]);

  useEffect(() => {
    fetch('/api/system/runtime', { headers: authHeaders() })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setRuntimeInfo(data))
      .catch(() => setRuntimeInfo(null));
  }, []);

  // Licensing specific states
  const [inputLicenseKey, setInputLicenseKey] = useState('');
  const [activationError, setActivationError] = useState('');
  const [activationSuccess, setActivationSuccess] = useState(false);
  const [requestCodeCopied, setRequestCodeCopied] = useState(false);
  const licenseRequestCode = getSystemRequestCode();

  const handleCopyRequestCode = async () => {
    const ok = await copyTextToClipboard(licenseRequestCode);
    if (!ok) return;
    setRequestCodeCopied(true);
    setTimeout(() => setRequestCodeCopied(false), 2000);
  };

  // New Custom User form states
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('Viewer');
  const [newUserLogin, setNewUserLogin] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserError, setNewUserError] = useState('');

  // Self-service password and login states
  const [selfLogin, setSelfLogin] = useState(currentUser.login || '');
  const [selfPassword, setSelfPassword] = useState('');
  const [showSelfPassword, setShowSelfPassword] = useState(false);
  const [selfSecuritySuccess, setSelfSecuritySuccess] = useState(false);

  React.useEffect(() => {
    setSelfLogin(currentUser.login || '');
    setSelfPassword('');
  }, [currentUser.id, currentUser.login]);

  const handleUpdateSelfCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selfLogin.trim()) return;
    if (!selfPassword.trim() && !currentUser.passwordSet) return;
    if (onUpdateUser) {
      const updates: Partial<SystemUser> = { login: selfLogin.trim() };
      if (selfPassword.trim()) updates.password = selfPassword;
      onUpdateUser(currentUser.id, updates);
      setSelfPassword('');
      setSelfSecuritySuccess(true);
      setTimeout(() => setSelfSecuritySuccess(false), 3000);
    }
  };

  // States of platform backup manager (SB compliant - license key excluded)
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreName, setRestoreName] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [restoreErrorMsg, setRestoreErrorMsg] = useState('');

  const allowBackup = canUseBackup(getLicenseStatus());
  const allowUpdate = canUseSystemUpdate(getLicenseStatus());

  const alertUpdateBlocked = () => {
    alert(
      t(
        'Установка обновлений доступна только после активации лицензии. Откройте Настройки и введите ключ.'
      )
    );
  };

  const alertBackupBlocked = () => {
    alert(
      t(
        'Резервное копирование доступно только после активации лицензии. Откройте Настройки и введите ключ.'
      )
    );
  };

  const handleCreateBackup = () => {
    if (!allowBackup) {
      alertBackupBlocked();
      return;
    }
    try {
      const keysToBackup = [
        'it_objects',
        'it_network',
        'it_computers',
        'it_employees',
        'it_warehouse',
        'it_software',
        'it_custom_warehouses',
        'it_warehouse_writeoffs',
        'it_activities',
        'it_audits',
        'it_workspace_name',
        'it_admin_email',
        'it_public_url',
        'it_users',
        'it_tab_icons',
        'it_panel_logo',
        'it_panel_color',
        'it_site_favicon',
        'it_site_logo',
        'it_sidebar_bg_color',
        'it_sidebar_opacity',
        'it_custom_warranties',
        'it_custom_departments',
        'it_removed_departments'
      ];
      
      const backupData: Record<string, string | null> = {};
      keysToBackup.forEach(key => {
        backupData[key] = localStorage.getItem(key);
      });
      const sanitizedBackupData = stripLicenseFromLocalBackupData(backupData);
      
      const payload = {
        app: 'Vicariustab',
        backupVersion: '2.0',
        createdAt: new Date().toISOString(),
        author: 'Utkin V.V. Compliance Engine',
        legalNote: 'Лицензионные ключи и MAC-адреса оборудования исключены из резервной копии данных платформы. После восстановления на новом компьютере потребуется повторная активация.',
        data: sanitizedBackupData
      };
      
      const jsonStr = JSON.stringify(payload, null, 2);
      const element = document.createElement("a");
      const file = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      element.href = URL.createObjectURL(file);
      const dateStr = new Date().toISOString().slice(0,10);
      element.download = `Vicariustab_platform_backup_no_license_${dateStr}.json`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (err: any) {
      console.error(err);
      setRestoreErrorMsg('Не удалось создать файл резервной копии.');
    }
  };

  const handleRestoreBackup = (file: File) => {
    if (!allowBackup) {
      alertBackupBlocked();
      return;
    }
    if (isRestoring) return;
    setIsRestoring(true);
    setRestoreSuccess(false);
    setRestoreErrorMsg('');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const payload = JSON.parse(text);
        
        if (!payload || typeof payload !== 'object' || !payload.data) {
          throw new Error('Некорректный формат файла резервной копии. Отсутствует секция "data".');
        }
        
        const data = payload.data;
        
        // Write only explicitly allowed tables/settings to localStorage.
        // This prevents importing activation artifacts from another installation.
        const allowedRestoreKeys = new Set([
          'it_objects',
          'it_network',
          'it_computers',
          'it_employees',
          'it_warehouse',
          'it_software',
          'it_custom_warehouses',
          'it_warehouse_writeoffs',
          'it_activities',
          'it_audits',
          'it_workspace_name',
          'it_admin_email',
          'it_public_url',
          'it_users',
          'it_tab_icons',
          'it_panel_logo',
          'it_panel_color',
          'it_site_favicon',
          'it_site_logo',
          'it_sidebar_bg_color',
          'it_sidebar_opacity',
          'it_custom_warranties',
          'it_custom_departments',
          'it_removed_departments',
          'sec_last_scan'
        ]);
        Object.keys(data).forEach(key => {
          if (isBlockedBackupKey(key)) return;
          if (allowedRestoreKeys.has(key)) {
            const val = data[key];
            if (val !== null && val !== undefined) {
              localStorage.setItem(key, val);
            }
          }
        });
        
        // Explicitly keep the existing license key and fingerprint untouched so that 
        // the target copy remains independent without overwriting/multiplying the activation key!
        
        setRestoreSuccess(true);
        setIsRestoring(false);
        
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err: any) {
        setIsRestoring(false);
        setRestoreErrorMsg(err.message || 'Ошибка разбора JSON или поврежденная структура резервной копии.');
      }
    };
    reader.onerror = () => {
      setIsRestoring(false);
      setRestoreErrorMsg('Не удалось прочитать загруженный файл.');
    };
    reader.readAsText(file);
  };

  // States of platform automated updater
  const [updateSourceType, setUpdateSourceType] = useState<'github' | 'github_archive'>('github');
  const githubRepoUrl = VICARIUSTAB_UPDATE_REPO;
  const [archiveFile, setArchiveFile] = useState<File | null>(null);
  const [archiveName, setArchiveName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateLogs, setUpdateLogs] = useState<string[]>([]);
  const [currentUpdateStep, setCurrentUpdateStep] = useState('');
  const [updateCompleted, setUpdateCompleted] = useState(false);
  const [updateErrorMsg, setUpdateErrorMsg] = useState('');
  const [pendingUpdate, setPendingUpdate] = useState<UpdateCheckResult | null>(null);
  const [systemVersion, setSystemVersion] = useState(() => localStorage.getItem('it_system_version') || `v${APP_VERSION}-stable`);
  const [isRebooting, setIsRebooting] = useState(false);
  const [rebootStep, setRebootStep] = useState('');
  const [rebootTimeLeft, setRebootTimeLeft] = useState(8);

  useEffect(() => {
    if (!isRebooting) return;
    setRebootStep(t('Применение обновления и перезапуск сервера...'));
    const timer = setInterval(() => {
      setRebootTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.reload();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRebooting, t]);

  const pollUpdateJob = () => {
    const interval = window.setInterval(async () => {
      const job = await fetchUpdateJobStatus();
      if (!job) return;
      setUpdateLogs(job.logs);
      setUpdateProgress(job.progress);
      setCurrentUpdateStep(job.step);

      if (job.status === 'completed') {
        window.clearInterval(interval);
        setUpdateCompleted(true);
        setIsUpdating(false);
        setCurrentUpdateStep('');
        if (job.latestCommitSha) {
          markInstalledCommit(job.latestCommitSha);
        }
        if (job.remoteVersion) {
          setSystemVersion(`v${job.remoteVersion}`);
          localStorage.setItem('it_system_version', `v${job.remoteVersion}`);
        }
        setPendingUpdate(null);
        window.dispatchEvent(
          new CustomEvent('Vicariustab-update-completed', {
            detail: { text: buildUpdateCompletedText(job.remoteVersion), remoteVersion: job.remoteVersion },
          })
        );
        if (onLogActivity) {
          onLogActivity(
            t('Обновление Vicariustab'),
            t('Платформа успешно обновлена до стабильной актуальной версии'),
            'system'
          );
        }
        setIsRebooting(true);
      }

      if (job.status === 'failed') {
        window.clearInterval(interval);
        setUpdateErrorMsg(job.error || t('Ошибка установки обновления'));
        setIsUpdating(false);
        setCurrentUpdateStep('');
      }
    }, 1500);
  };

  const checkForUpdates = async () => {
    if (!allowUpdate) {
      alertUpdateBlocked();
      return;
    }
    if (isUpdating) return;
    setIsUpdating(true);
    setUpdateProgress(0);
    setUpdateCompleted(false);
    setUpdateErrorMsg('');
    setUpdateLogs([]);
    setPendingUpdate(null);

    const logs: string[] = [];
    const addLog = (text: string) => {
      const time = new Date().toLocaleTimeString('ru-RU');
      logs.push(`[${time}] ${text}`);
      setUpdateLogs([...logs]);
    };

    addLog(t('Инициализация проверки обновлений Vicariustab...'));
    setCurrentUpdateStep(t('Проверка GitHub'));
    setUpdateProgress(20);

    try {
      const payload = await checkForPlatformUpdate();
      if (!payload) {
        throw new Error(t('Не удалось проверить обновления на GitHub'));
      }

      setUpdateProgress(60);
      addLog(`${t('Репозиторий:')} ${payload.repository || 'vicariustab'}`);
      addLog(`${t('Текущая версия:')} v${payload.currentVersion}`);
      addLog(`${t('Версия на GitHub:')} v${payload.remoteVersion}`);
      if (payload.updateSource === 'client-fallback') {
        addLog(
          t('Проверка через браузер (сервер устарел или недоступен GitHub API). Для автоустановки обновите сервер вручную.')
        );
      }

      if (payload.updateAvailable) {
        setPendingUpdate(payload);
        addLog(t('Доступна новая версия. Нажмите «Установить обновление» для автоматической установки.'));
        window.dispatchEvent(
          new CustomEvent('Vicariustab-update-available', {
            detail: {
              text: buildUpdateNotificationText(payload),
              remoteVersion: payload.remoteVersion,
              currentVersion: payload.currentVersion,
            },
          })
        );
      } else {
        addLog(t('Локальная версия соответствует актуальному состоянию репозитория на GitHub.'));
        if (payload.latestCommitSha) {
          markInstalledCommit(payload.latestCommitSha);
        }
      }

      setUpdateProgress(100);
      setUpdateCompleted(true);
      setCurrentUpdateStep('');
      setIsUpdating(false);

      if (onLogActivity) {
        onLogActivity(
          t('Проверка обновлений Vicariustab'),
          `${t('Проверка GitHub завершена. Релиз:')} ${payload.latestTag || payload.remoteVersion || 'n/a'}`,
          'system'
        );
      }
    } catch (err: any) {
      setUpdateErrorMsg(err?.message || t('Ошибка проверки обновлений'));
      addLog(`${t('Ошибка:')} ${err?.message || 'unknown'}`);
      setIsUpdating(false);
      setCurrentUpdateStep('');
    }
  };

  const installPlatformUpdate = async () => {
    if (!allowUpdate) {
      alertUpdateBlocked();
      return;
    }
    if (isUpdating || !pendingUpdate?.updateAvailable) return;
    setIsUpdating(true);
    setUpdateProgress(5);
    setUpdateCompleted(false);
    setUpdateErrorMsg('');
    setUpdateLogs([]);

    const logs: string[] = [];
    const addLog = (text: string) => {
      const time = new Date().toLocaleTimeString('ru-RU');
      logs.push(`[${time}] ${text}`);
      setUpdateLogs([...logs]);
    };

    addLog(t('Запуск автоматической установки обновления...'));
    setCurrentUpdateStep(t('Резервное копирование'));
    setUpdateProgress(10);

    const result = await applyPlatformUpdate();
    if (!result.started) {
      setUpdateErrorMsg(result.error || t('Не удалось запустить обновление'));
      addLog(`${t('Ошибка:')} ${result.error}`);
      setIsUpdating(false);
      return;
    }

    addLog(t('Обновление запущено на сервере. Скачивание, сборка и перезапуск выполняются автоматически.'));
    pollUpdateJob();
  };

  // Editing existing user states
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserLogin, setEditUserLogin] = useState('');
  const [editUserPassword, setEditUserPassword] = useState('');
  const [editUserRole, setEditUserRole] = useState<UserRole>('Viewer');

  // Interactive visibility of logins and passwords in user cards
  const [revealedUsers, setRevealedUsers] = useState<Record<string, boolean>>({});

  // Branding Customizer states
  const [tempLogo, setTempLogo] = useState(panelLogo);
  const [tempFavicon, setTempFavicon] = useState(siteFavicon);
  const [tempSiteLogo, setTempSiteLogo] = useState(siteLogo);
  const [tempSidebarBgColor, setTempSidebarBgColor] = useState(sidebarBgColor);
  const [tempSidebarOpacity, setTempSidebarOpacity] = useState(sidebarOpacity);

  // Reliable inline confirmation states to bypass sandboxed iFrame blocking
  const [deleteTarget, setDeleteTarget] = useState<SystemUser | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [purgeLoading, setPurgeLoading] = useState(false);

  // SQL / DBMS settings state
  const [dbType, setDbType] = useState<'json' | 'mysql' | 'postgres'>('json');
  const [dbHost, setDbHost] = useState('localhost');
  const [dbPort, setDbPort] = useState('3306');
  const [dbName, setDbName] = useState('stack_db');
  const [dbUser, setDbUser] = useState('root');
  const [dbPassword, setDbPassword] = useState('');
  const [dbPasswordSet, setDbPasswordSet] = useState(false);
  const [dbTestLoading, setDbTestLoading] = useState(false);
  const [dbTestMessage, setDbTestMessage] = useState('');
  const [dbTestError, setDbTestError] = useState('');
  const [dbSaveLoading, setDbSaveLoading] = useState(false);
  const [dbSaveMessage, setDbSaveMessage] = useState('');
  const [dbSaveError, setDbSaveError] = useState('');
  const [dbDockerHint, setDbDockerHint] = useState('');

  // Load backend database settings on mount
  React.useEffect(() => {
    Promise.all([
      fetch('/api/db-config', { headers: authHeaders() }).then((res) => res.json()),
      fetch('/api/db-config/defaults', { headers: authHeaders() }).then((res) => res.json()),
    ])
      .then(([config, defaults]) => {
        if (defaults?.hint) setDbDockerHint(defaults.hint);
        if (config) {
          setDbType(config.type || 'json');
          const host =
            config.host ||
            (defaults?.inDocker ? defaults.suggestedHost : 'localhost');
          setDbHost(host);
          setDbPort(config.port ? config.port.toString() : (config.type === 'postgres' ? '5432' : '3306'));
          setDbName(config.database || 'stack_db');
          setDbUser(config.user || (config.type === 'postgres' ? 'postgres' : 'root'));
          setDbPassword('');
          setDbPasswordSet(Boolean(config.passwordSet));
        } else if (defaults?.inDocker && defaults.suggestedHost) {
          setDbHost(defaults.suggestedHost);
        }
        if (defaults?.suggestedHosts?.length && defaults.inDocker && !config?.host) {
          setDbHost(defaults.suggestedHost || defaults.suggestedHosts[0]);
        }
      })
      .catch(err => console.error("Could not fetch DB config:", err));
  }, []);

  // Active continuous monitoring db status state
  const [dbLiveStatus, setDbLiveStatus] = useState<{
    status: 'connected' | 'error' | 'unchecked';
    error?: string;
    lastChecked?: string;
    type?: string;
  }>({ status: 'unchecked' });

  React.useEffect(() => {
    let active = true;
    const checkStatus = () => {
      fetch('/api/db-status', { headers: authHeaders() })
        .then(res => {
          if (!res.ok) {
            return { status: 'unchecked', error: 'Connection initializing' };
          }
          return res.json();
        })
        .then(data => {
          if (active && data) {
            setDbLiveStatus(data);
          }
        })
        .catch(err => {
          // Gracefully default to safe idle state on temporary network down/dev-server reload
          if (active) {
            setDbLiveStatus({ status: 'unchecked', error: 'Service temporarily unavailable' });
          }
        });
    };

    checkStatus();
    const statusInterval = setInterval(checkStatus, 7000); // 7 seconds interval to reduce load
    return () => {
      active = false;
      clearInterval(statusInterval);
    };
  }, []);

  const handleTestDbConnection = async () => {
    try {
      setDbTestLoading(true);
      setDbTestMessage('');
      setDbTestError('');
      
      const res = await fetch('/api/db-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          type: dbType,
          host: dbHost,
          port: parseInt(dbPort) || undefined,
          database: dbName,
          user: dbUser,
          password: dbPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка подключения к СУБД');
      }
      if (data.resolvedHost) {
        setDbHost(data.resolvedHost);
      }
      setDbTestMessage(
        data.resolvedHost
          ? `${t("Подключение успешно установлено!")} (${data.resolvedHost})`
          : t("Подключение успешно установлено!")
      );
    } catch (err: any) {
      setDbTestError(err.message || 'Ошибка подключения');
    } finally {
      setDbTestLoading(false);
    }
  };

  const handleSaveDbConfig = async () => {
    try {
      setDbSaveLoading(true);
      setDbSaveMessage('');
      setDbSaveError('');

      const payload = {
        type: dbType,
        host: dbHost,
        port: parseInt(dbPort) || undefined,
        database: dbName,
        user: dbUser,
        password: dbPassword
      };

      const res = await fetch('/api/db-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Не удалось сохранить настройки СУБД');
      }

      setDbSaveMessage(t("Настройки успешно сохранены! Перезагрузка системы..."));
      if (onLogActivity) {
        onLogActivity(
          t("Изменение СУБД"), 
          `${t("Смена типа базы данных на")} ${dbType.toUpperCase()}`, 
          "system"
        );
      }
      setTimeout(() => {
        window.location.reload();
      }, 1800);
    } catch (err: any) {
      setDbSaveError(err.message || 'Ошибка сохранения настроек');
    } finally {
      setDbSaveLoading(false);
    }
  };

  // Backup & Restore state variables
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupError, setBackupError] = useState('');
  const [backupSuccess, setBackupSuccess] = useState('');

  const handleExportBackup = async () => {
    if (!allowBackup) {
      alertBackupBlocked();
      return;
    }
    try {
      setBackupLoading(true);
      setBackupError('');
      const res = await fetch('/api/backup/export', { headers: authHeaders() });
      if (!res.ok) throw new Error(t("Не удалось получить файл бэкапа"));
      const data = await res.json();
      if (!data.backup) throw new Error(t("Файл бэкапа пуст"));

      // Trigger automatic save/download dialog with encrypted file payload
      const blob = new Blob([data.backup], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stack_secure_backup_${new Date().toISOString().slice(0, 10)}.enc`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupSuccess(t("Резервная копия успешно экспортирована!"));
      setTimeout(() => setBackupSuccess(''), 4000);
    } catch (err: any) {
      setBackupError(err.message || t("Ошибка при экспорте"));
    } finally {
      setBackupLoading(false);
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!allowBackup) {
      alertBackupBlocked();
      e.target.value = '';
      return;
    }

    try {
      setBackupLoading(true);
      setBackupError('');
      setBackupSuccess('');
      const text = await file.text();
      
      const res = await fetch('/api/backup/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({ backup: text }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || t("Неверный формат бэкапа или файл поврежден"));
      }

      setBackupSuccess(t("Данные успешно импортированы! Перезагрузка страницы..."));
      if (onLogActivity) {
        onLogActivity(t("Импорт бэкапа"), t("Системная база данных восстановлена из файла резервной копии"), "system");
      }
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setBackupError(err.message || t("Ошибка импорта"));
    } finally {
      setBackupLoading(false);
      e.target.value = '';
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setWorkspaceName(tempName);
    setAdminEmail(tempEmail);
    setPublicUrl(tempPublicUrl.trim());
    setPanelLogo(tempLogo);
    setSiteFavicon(tempFavicon);
    setSiteLogo(tempSiteLogo);
    setSidebarBgColor(tempSidebarBgColor);
    setSidebarOpacity(tempSidebarOpacity);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNewUserError('');
    if (!newUserName || !newUserEmail || !newUserLogin || !newUserPassword) {
      setNewUserError(t('Заполните все обязательные поля.'));
      return;
    }
    const loginErr = validateLoginField(newUserLogin);
    if (loginErr) {
      setNewUserError(t(loginErr));
      return;
    }
    const emailErr = validateEmailField(newUserEmail);
    if (emailErr) {
      setNewUserError(t(emailErr));
      return;
    }
    const passErr = validatePasswordField(newUserPassword);
    if (passErr) {
      setNewUserError(t(passErr));
      return;
    }
    const trimmedLogin = newUserLogin.trim();
    const duplicate = users.some(
      (u) =>
        u.login?.trim().toLowerCase() === trimmedLogin.toLowerCase() ||
        u.email.trim().toLowerCase() === newUserEmail.trim().toLowerCase()
    );
    if (duplicate) {
      setNewUserError(t('Пользователь с таким логином или email уже существует.'));
      return;
    }

    onAddUser({
      name: newUserName.trim(),
      email: newUserEmail.trim().toLowerCase(),
      role: newUserRole,
      login: trimmedLogin,
      password: newUserPassword,
    });

    setNewUserName('');
    setNewUserEmail('');
    setNewUserLogin('');
    setNewUserPassword('');
    setNewUserRole('Viewer');
  };

  const isAdmin = currentUser.role === 'Admin';
  const brandingCanEdit = isAdmin || currentUser.role === 'Editor';

  const handleBrandingFile = (
    file: File | undefined,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (!file) return;
    const isImage = file.type.startsWith('image/') || /\.ico$/i.test(file.name);
    if (!isImage) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') setter(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const renderBrandingUpload = (
    labelKey: string,
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
    previewClassName: string
  ) => (
    <div>
      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">{t(labelKey)}</label>
      <div className="flex items-center gap-2 flex-wrap">
        <div
          className={`${previewClassName} rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0`}
        >
          {value ? (
            <img src={value} alt="" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
          ) : (
            <ImageIcon size={16} className="text-slate-300" />
          )}
        </div>
        <label
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${
            brandingCanEdit
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 cursor-pointer'
              : 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Upload size={12} />
          {t('Загрузить с компьютера')}
          <input
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp,image/x-icon,.ico"
            disabled={!brandingCanEdit}
            className="hidden"
            onChange={(e) => {
              handleBrandingFile(e.target.files?.[0], setter);
              e.target.value = '';
            }}
          />
        </label>
        {value && brandingCanEdit && (
          <button
            type="button"
            onClick={() => setter('')}
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold text-rose-600 hover:bg-rose-50 border border-rose-100 transition-colors cursor-pointer"
          >
            <Trash2 size={12} />
            {t('Удалить')}
          </button>
        )}
      </div>
      <p className="text-[9px] text-slate-400 mt-1">{t('PNG, SVG, ICO, WEBP')}</p>
    </div>
  );

  const fontColorPresets = ['blue', 'emerald', 'purple', 'rose', 'amber', 'indigo', 'slate'];

  const availableIcons = [
    { name: 'Laptop', label: 'Ноутбук' },
    { name: 'Network', label: 'Сеть' },
    { name: 'Monitor', label: 'Монитор' },
    { name: 'Server', label: 'Сервер' },
    { name: 'Wifi', label: 'Wi-Fi' },
    { name: 'Cpu', label: 'Процессор' },
    { name: 'Router', label: 'Маршрутизатор' },
    { name: 'HardDrive', label: 'Диск' },
    { name: 'Smartphone', label: 'Телефон' },
    { name: 'Keyboard', label: 'Периферия' }
  ];

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-1">
        <h2 className="text-lg font-bold text-slate-850 flex items-center gap-2">
          <Settings className="text-blue-500" />{t("Параметры и конфигурация рабочей среды")}</h2>
        <p className="text-slate-400 text-xs">{t("Настройте учетные записи сотрудников, назначьте логины и пароли, измените оформление панели и кастомизируйте иконки.")}</p>
      </div>

      {/* Личный профиль */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="relative shrink-0">
          <label className="cursor-pointer group block">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    onUpdateCurrentUserAvatar(currentUser.id, reader.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            <div className="relative">
              {currentUser.avatarUrl ? (
                <img 
                  src={currentUser.avatarUrl} 
                  alt={currentUser.name} 
                  className="w-14 h-14 rounded-full object-cover border-2 border-blue-500 group-hover:opacity-75 transition-opacity"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-lg border-2 border-blue-600 group-hover:opacity-75 transition-opacity">
                  {currentUser.name[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black/40 text-white p-1 rounded-full">
                  <Camera size={14} />
                </div>
              </div>
            </div>
          </label>
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full pointer-events-none" />
        </div>
        <div className="text-xs min-w-0">
          <h4 className="font-bold text-slate-800 text-sm">{t("Ваш личный профиль")}</h4>
          <p className="text-slate-500 mt-0.5">{t("Вы вошли как:")}<strong>{currentUser.name}</strong> ({currentUser.email})</p>
          <p className="text-slate-400 text-[10px]">{t("Права доступа:")}<span className="font-semibold text-blue-600">{currentUser.role === 'Admin' ? t('Администратор') : currentUser.role === 'Editor' ? t('Редактирование') : t('Просмотр')}</span></p>
          <p className="text-slate-400 text-[10px] mt-1">{t("Нажмите на аватар, чтобы загрузить своё фото")}</p>
        </div>
      </div>

      {/* Самостоятельная смена логина и пароля */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 animate-fade-in">
        <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
          <Key className="text-blue-500" size={16} />
          <div>
            <h3 className="font-bold text-slate-805 text-sm tracking-tight">{t("Самостоятельное изменение логина и пароля")}</h3>
            <p className="text-[10px] text-slate-400">{t("Здесь Вы можете изменить свои параметры авторизации без обращения к администратору")}</p>
          </div>
        </div>

        {selfSecuritySuccess && (
          <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl font-semibold border border-emerald-150 flex items-center gap-2 animate-fade-in">
            <ShieldCheck size={16} />{t("Ваши учетные данные для авторизации успешно обновлены!")}</div>
        )}

        <form onSubmit={handleUpdateSelfCredentials} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-450 uppercase">{t("Логин для входа")}</label>
            <input
              type="text"
              required
              value={selfLogin}
              onChange={(e) => setSelfLogin(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-805"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-450 uppercase">{t("Новый пароль")}</label>
            <div className="relative">
              <input
                type={showSelfPassword ? "text" : "password"}
                required={!currentUser.passwordSet}
                value={selfPassword}
                onChange={(e) => setSelfPassword(e.target.value)}
                placeholder={currentUser.passwordSet ? t('Оставьте пустым, чтобы не менять') : t('Не менее 8 символов')}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-805 pr-8"
              />
              <button
                type="button"
                onClick={() => setShowSelfPassword(!showSelfPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showSelfPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer h-[30px]"
          >
            <Save size={13} />{t("Обновить доступы")}</button>
        </form>
      </div>

      {(currentUser.role === 'Admin' || currentUser.role === 'Editor') && (
        <>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
              <Shield className="text-blue-500" size={16} />
              <div>
                <h3 className="font-bold text-slate-805 text-sm tracking-tight">{t('Каналы уведомлений о входе')}</h3>
                <p className="text-[10px] text-slate-400">
                  {t('При входе с нового устройства уведомления отправляются в центр уведомлений, на email и в Telegram (если настроено).')}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentUser.emailVerified ?? Boolean(currentUser.email?.includes('@'))}
                  onChange={(e) => onUpdateUser?.(currentUser.id, { emailVerified: e.target.checked })}
                  className="rounded border-slate-300"
                />
                <span>{t('Email подтверждён')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentUser.emailNotificationsEnabled !== false}
                  onChange={(e) => onUpdateUser?.(currentUser.id, { emailNotificationsEnabled: e.target.checked })}
                  className="rounded border-slate-300"
                />
                <span>{t('Уведомления на email')}</span>
              </label>
              <div className="space-y-1 md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-450 uppercase">{t('Telegram Chat ID')}</label>
                <input
                  type="text"
                  placeholder={t('Например: 123456789')}
                  value={currentUser.telegramChatId || ''}
                  onChange={(e) => onUpdateUser?.(currentUser.id, { telegramChatId: e.target.value.trim() || undefined })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer md:col-span-2">
                <input
                  type="checkbox"
                  checked={Boolean(currentUser.telegramChatId && currentUser.telegramNotificationsEnabled)}
                  disabled={!currentUser.telegramChatId}
                  onChange={(e) => onUpdateUser?.(currentUser.id, { telegramNotificationsEnabled: e.target.checked })}
                  className="rounded border-slate-300 disabled:opacity-50"
                />
                <span>{t('Уведомления в Telegram')}</span>
              </label>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm animate-fade-in">
            <ActiveSessionsPanel
              onLogAuth={(action, detail) => onLogActivity?.(action, detail, 'auth')}
            />
          </div>
        </>
      )}

      {/* Резервное копирование и Восстановление данных платформы (СБ-Защищенный Режим) */}
      {isAdmin && (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-5 animate-fade-in font-sans">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Database className="text-blue-500" size={18} />
              <div>
                <h3 className="font-bold text-slate-805 text-sm tracking-tight">{t("Резервное копирование и перенос данных платформы")}</h3>
                <p className="text-[10px] text-slate-400">{t("Экспортируйте или импортируйте базу данных в один клик. По соображениям безопасности СБ, лицензионный ключ всегда исключается из резервной копии.")}</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 font-bold flex items-center gap-1">
              <ShieldCheck size={11} className="text-emerald-600" />{t("СБ-защищенный режим")}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {!allowBackup && (
              <div className="lg:col-span-2 p-2.5 text-[10.5px] bg-amber-50 text-amber-900 border border-amber-150 rounded-lg font-medium flex items-center gap-2">
                <Lock size={14} className="shrink-0 text-amber-600" />
                {t('Резервное копирование доступно только после активации лицензии. Откройте Настройки и введите ключ.')}
              </div>
            )}
            {/* Секция 1: Экспорт резервной копии */}
            <div className="space-y-3.5 lg:border-r lg:border-slate-105 lg:pr-5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                <h4 className="text-xs font-bold text-slate-705 uppercase tracking-wide">{t("Резервное копирование (Скачивание JSON)")}</h4>
              </div>
              
              <p className="text-[11px] text-slate-500 leading-relaxed">{t("Создайте полную резервную копию всех сущностей Вашей платформы Vicariustab (компьютеры, сотрудники, серверы, оргтехника, журналы изменений, аудит). При этом сам лицензионный ключ активации исключается из файла. Это позволяет переносить базу данных на любые другие независимые серверы Vicariustab без дублирования или компрометации Вашей лицензии.")}</p>

              <button
                type="button"
                onClick={handleCreateBackup}
                disabled={!allowBackup}
                title={!allowBackup ? t('Доступно после активации лицензии') : undefined}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-all shadow-2xs hover:shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={14} />{t("Экспортировать данные платформы (без ключа активации)")}</button>

              <div className="text-[9.5px] text-slate-400 italic">{t("* Резервная копия полностью автономна и сохраняется на Вашем устройстве в формате JSON.")}</div>
            </div>

            {/* Секция 2: Импорт / Восстановление данных */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                <h4 className="text-xs font-bold text-slate-705 uppercase tracking-wide">{t("Восстановление из резервной копии")}</h4>
              </div>

              <p className="text-[11px] text-slate-505 leading-relaxed">{t("Выберите ранее экспортированный файл резервной копии JSON на локальном диске для мгновенного восстановления структуры организации, сотрудников и оборудования. Внимание: Все текущие локальные записи будут перезаписаны. Ваш текущий ключ активации при этом останется неизменным.")}</p>

              <div className="space-y-2">
                <div className="flex items-center justify-center w-full">
                  <label className={`flex flex-col items-center justify-center w-full h-18 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/55 transition-colors ${allowBackup ? 'hover:border-slate-300 hover:bg-slate-50 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
                    <div className="flex flex-col items-center justify-center pt-2 pb-2 text-center px-4">
                      <FileJson className="text-slate-400 mb-1" size={16} />
                      <p className="text-[10px] text-slate-505 font-bold">
                        {restoreName ? `${t("Выбран:")} ${restoreName}` : t("Перетащите сюда или нажмите для выбора JSON файла")}
                      </p>
                      <p className="text-[9px] text-slate-450">{t("Поддерживаются файлы *.json")}</p>
                    </div>
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      disabled={!allowBackup}
                      onChange={(e) => {
                        if (!allowBackup) {
                          alertBackupBlocked();
                          return;
                        }
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          setRestoreFile(file);
                          setRestoreName(file.name);
                          handleRestoreBackup(file);
                        }
                      }}
                    />
                  </label>
                </div>

                {isRestoring && (
                  <div className="p-2 text-[10px] bg-slate-900 text-slate-100 rounded-lg font-mono flex items-center gap-2 animate-pulse">
                    <RefreshCw size={12} className="animate-spin text-blue-400" />{t("Пожалуйста, подождите... Выполняется разбор резервной копии и восстановление таблиц...")}</div>
                )}

                {restoreSuccess && (
                  <div className="p-2.5 text-[10.5px] bg-emerald-50 text-emerald-805 font-bold rounded-lg border border-emerald-100 flex items-center gap-1.5 animate-bounce">
                    <ShieldCheck size={14} className="shrink-0 text-emerald-600 animate-pulse" />{t("Восстановление успешно завершено! Перезапуск платформы для применения...")}</div>
                )}

                {restoreErrorMsg && (
                  <div className="p-2.5 text-[10px] bg-rose-50 text-rose-805 font-medium rounded-lg border border-rose-150 flex items-center gap-1.5 leading-relaxed">
                    <AlertTriangle size={14} className="shrink-0 text-rose-600" />
                    <span>{t("Ошибка импорта:")} {restoreErrorMsg}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Центр автоматического обновления Vicariustab через GitHub */}
      {isAdmin && (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-5 animate-fade-in font-sans">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="text-blue-500" size={18} />
              <div>
                <h3 className="font-bold text-slate-805 text-sm tracking-tight">{t("Центр управления обновлениями Vicariustab")}</h3>
                <p className="text-[10px] text-slate-400">{t("Обновите программное ядро платформы в один клик. Поддерживается прямая проверка и обновление из репозитория GitHub или ручная загрузка архива релиза.")}</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-505 bg-slate-50 px-2 py-1 rounded border border-slate-100 self-start md:self-auto shrink-0">{t("Версия ядра:")}<span className="font-bold text-blue-600">{systemVersion}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {!allowUpdate && (
              <div className="lg:col-span-2 p-2.5 text-[10.5px] bg-amber-50 text-amber-900 border border-amber-150 rounded-lg font-medium flex items-center gap-2">
                <Lock size={14} className="shrink-0 text-amber-600" />
                {t('Установка обновлений доступна только после активации лицензии. Откройте Настройки и введите ключ.')}
              </div>
            )}
            {/* Секция 1: Источник обновления */}
            <div className="space-y-4 lg:border-r lg:border-slate-100 lg:pr-5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                <h4 className="text-xs font-bold text-slate-705 uppercase tracking-wide">{t("Параметры и источник сборки")}</h4>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-3">
                <div className="flex gap-2 p-1 bg-slate-100 rounded-lg text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setUpdateSourceType('github')}
                    className={`flex-1 py-1.5 rounded-md font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      updateSourceType === 'github' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-705'
                    }`}
                  >
                    <Github size={13} />{t("Репозиторий GitHub")}</button>
                  <button
                    type="button"
                    onClick={() => setUpdateSourceType('github_archive')}
                    className={`flex-1 py-1.5 rounded-md font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      updateSourceType === 'github_archive' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-705'
                    }`}
                  >
                    <FileText size={13} />{t("Архив с GitHub (.zip)")}</button>
                </div>

                {updateSourceType === 'github' ? (
                  <div className="space-y-2">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">{t("Официальный репозиторий проекта")}</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-705 focus:outline-none cursor-default"
                        value={githubRepoUrl}
                        title={t("Официальный репозиторий обновлений Vicariustab")}
                      />
                      <a
                        href={VICARIUSTAB_UPDATE_REPO_DISPLAY}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 bg-slate-200 text-slate-600 hover:bg-slate-300 rounded-lg flex items-center justify-center transition-colors"
                        title={t("Открыть репозиторий")}
                      >
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="block text-[10px] font-bold text-slate-450 uppercase">{t("Выберите ZIP-архив релиза c GitHub")}</span>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-18 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer bg-white hover:bg-slate-50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-2 pb-2 text-center px-4 animate-fade-in">
                          <Upload className="text-slate-405 mb-1" size={16} />
                          <p className="text-[10px] text-slate-505 font-bold">
                            {archiveName ? `${t("Выбран:")} ${archiveName}` : t("Нажмите для выбора zip-архива релиза")}
                          </p>
                          <p className="text-[9px] text-slate-400">{t("Поддерживаются файлы *.zip")}</p>
                        </div>
                        <input
                          type="file"
                          accept=".zip"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setArchiveFile(e.target.files[0]);
                              setArchiveName(e.target.files[0].name);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* Лицензионное предупреждение */}
                <div className="flex items-start gap-1.5 text-[10px] text-amber-750 bg-amber-50/70 border border-amber-100 p-2.5 rounded-lg leading-relaxed">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-600" />
                  <span>{t("Внимание: Обновление ядра Vicariustab перезаписывает только программную часть приложения. Ваши локально сохраненные данные, сотрудники, схемы сети и журналы аудита останутся целыми и невредимыми!")}</span>
                </div>

                {/* Progress bar */}
                {isUpdating && (
                  <div className="space-y-2 p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[10px]">
                    <div className="flex justify-between items-center text-slate-300">
                      <span className="animate-pulse flex items-center gap-1.5">
                        <RefreshCw size={11} className="animate-spin text-blue-400" /> {currentUpdateStep}...
                      </span>
                      <span className="font-bold text-blue-400">{updateProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-350" style={{ width: `${updateProgress}%` }}></div>
                    </div>
                  </div>
                )}

                {updateCompleted && !pendingUpdate && (
                  <div className="p-2.5 text-[10.5px] bg-emerald-50 text-emerald-805 font-bold rounded-lg border border-emerald-100 flex items-center gap-1.5 leading-relaxed">
                    <ShieldCheck size={14} className="shrink-0 text-emerald-600 animate-pulse" />
                    {t("Платформа актуальна — обновление не требуется.")} ({systemVersion})
                  </div>
                )}

                {pendingUpdate?.updateAvailable && (
                  <div className="p-2.5 text-[10.5px] bg-blue-50 text-blue-900 font-bold rounded-lg border border-blue-100 flex items-center gap-1.5 leading-relaxed">
                    <Download size={14} className="shrink-0 text-blue-600" />
                    {t("Доступна версия")} v{pendingUpdate.remoteVersion} ({t("установлена")} v{pendingUpdate.currentVersion})
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    disabled={isUpdating || !allowUpdate}
                    title={!allowUpdate ? t('Доступно после активации лицензии') : undefined}
                    onClick={checkForUpdates}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-150 text-slate-700 disabled:text-slate-400 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isUpdating && !pendingUpdate ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />{t("Проверка обновлений на GitHub...")}</>
                    ) : (
                      <>
                        <RefreshCw size={14} />{t("Проверить обновления на GitHub")}</>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={isUpdating || !pendingUpdate?.updateAvailable || !allowUpdate}
                    title={!allowUpdate ? t('Доступно после активации лицензии') : undefined}
                    onClick={installPlatformUpdate}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-150 text-white disabled:text-slate-400 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs disabled:cursor-not-allowed"
                  >
                    {isUpdating && pendingUpdate ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />{t("Установка обновления...")}</>
                    ) : (
                      <>
                        <Download size={14} />{t("Установить обновление")}</>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Секция 2: Монитор консольных логов Docker сборки орбит */}
            <div className="space-y-4">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                <h4 className="text-xs font-bold text-slate-705 uppercase tracking-wide">{t("Терминал Docker сборщика (Stdout/Stderr)")}</h4>
              </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">{t("Платформа автоматически проверяет GitHub раз в сутки. Установка выполняется только по кнопке «Установить обновление»: резервная копия данных, загрузка, сборка и перезапуск без SSH.")}</p>

              <div className="space-y-1.5">
                <span className="block text-[10px] font-bold text-slate-405 uppercase flex items-center gap-1">
                  <Terminal size={12} />{t("Поток вывода транслятора")}</span>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 h-44 overflow-y-auto text-emerald-400 font-mono text-[9px] space-y-1 shadow-inner select-text">
                  {updateLogs.length > 0 ? (
                    updateLogs.map((log, i) => (
                      <div key={i} className="leading-relaxed border-b border-white/[0.02] last:border-0 pb-0.5 font-mono">{log}</div>
                    ))
                  ) : (
                    <div className="text-slate-500 italic flex items-center justify-center h-full">{t("Ожидание запуска сессии обновления...")}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start animate-fade-in">
        {/* Интерфейс и оформление */}
        <div className="xl:col-span-7 space-y-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2 shrink-0">
              <Languages size={16} className="text-blue-500" />{t("Общие системные параметры")}</h3>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setLanguage('ru')}
                className={`py-1.5 px-2.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  language === 'ru' 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CountryFlag code={languageToFlagCode('ru')} className="w-4 h-3 rounded-sm" />
                RU
              </button>

              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`py-1.5 px-2.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  language === 'en' 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CountryFlag code={languageToFlagCode('en')} className="w-4 h-3 rounded-sm" />
                EN
              </button>

              <button
                type="button"
                onClick={() => setLanguage('zh')}
                className={`py-1.5 px-2.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  language === 'zh' 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CountryFlag code={languageToFlagCode('zh')} className="w-4 h-3 rounded-sm" />
                ZH
              </button>
            </div>
          </div>

          {saveSuccess && (
            <div className="p-2 bg-emerald-50 text-emerald-700 text-xs rounded-lg font-medium border border-emerald-150 flex items-center gap-2">
              <ShieldCheck size={14} />{t("Настройки успешно сохранены в локальном диске!")}</div>
          )}

          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">{t("Название организации / рабочей зоны")}</label>
              <input
                type="text"
                required
                disabled={!isAdmin && currentUser.role !== 'Editor'}
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-705 disabled:bg-slate-50 disabled:text-slate-400 font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">{t("Email Администратора / Уведомления")}</label>
              <input
                type="email"
                required
                disabled={!isAdmin && currentUser.role !== 'Editor'}
                value={tempEmail}
                onChange={(e) => setTempEmail(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-705 disabled:bg-slate-50 disabled:text-slate-400 font-medium"
              />
            </div>
            </div>

            <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-100 space-y-2">
              <div className="flex items-center gap-2 text-slate-700">
                <Globe size={14} className="text-blue-500 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{t('Публичный URL и домен (HTTPS)')}</span>
              </div>
              <input
                type="url"
                disabled={!isAdmin && currentUser.role !== 'Editor'}
                placeholder="https://vicariustab.example.com"
                value={tempPublicUrl}
                onChange={(e) => setTempPublicUrl(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-705 disabled:bg-slate-50 disabled:text-slate-400 font-mono"
              />
              {(runtimeInfo?.tls || runtimeInfo?.detectedUrl) && (
                <div className="flex flex-wrap items-center gap-2 text-[10px]">
                  {runtimeInfo.tls && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                      <Lock size={10} /> HTTPS
                    </span>
                  )}
                  {runtimeInfo.detectedUrl && (
                    <span className="text-slate-500 font-mono truncate">
                      {t('Обнаружен доступ:')} {runtimeInfo.detectedUrl}
                    </span>
                  )}
                </div>
              )}
              <p className="text-[9px] text-slate-400 leading-snug border-t border-slate-200/80 pt-1.5">
                {t('Docker: STACK_DOMAIN в .env · docker compose -f docker-compose.yml -f docker-compose.caddy.yml up -d')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {renderBrandingUpload('Значок сайта / Favicon', tempFavicon, setTempFavicon, 'w-10 h-10')}
              {renderBrandingUpload('Логотип сайта в верхней панели', tempSiteLogo, setTempSiteLogo, 'w-16 h-10')}
              <div className="md:col-span-2">
                {renderBrandingUpload('Логотип навигационной панели', tempLogo, setTempLogo, 'w-16 h-10')}
              </div>
            </div>

            {/* Core Navigation Panel Customizer Area (Background & Opacity) */}
            <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-100 space-y-2">
              <h4 className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">{t("Кастомизация панели навигации")}</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Background color of sidebar */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold text-slate-500">{t("Цвет фона панели навигации")}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      disabled={!isAdmin && currentUser.role !== 'Editor'}
                      value={tempSidebarBgColor}
                      onChange={(e) => setTempSidebarBgColor(e.target.value)}
                      className="w-8 h-8 border border-slate-200 rounded-md cursor-pointer bg-transparent shrink-0"
                    />
                    <input
                      type="text"
                      disabled={!isAdmin && currentUser.role !== 'Editor'}
                      placeholder="#0f172a"
                      maxLength={7}
                      value={tempSidebarBgColor}
                      onChange={(e) => setTempSidebarBgColor(e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-750 font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {/* Opacity slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                    <span>{t("Прозрачность панели")}</span>
                    <span className="font-mono text-blue-600 font-bold">{Math.round(tempSidebarOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    disabled={!isAdmin && currentUser.role !== 'Editor'}
                    value={tempSidebarOpacity}
                    onChange={(e) => setTempSidebarOpacity(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>
            </div>

            {(!isAdmin && currentUser.role !== 'Editor') ? (
              <p className="text-[10px] text-amber-600 block bg-amber-50 p-2 rounded-lg">
                ⚠️ Ваши текущие права ("Просмотр") не позволяют изменять глобальные системные параметры.
              </p>
            ) : (
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save size={14} />{t("Сохранить системные изменения")}</button>
            )}
          </form>
        </div>

        {isAdmin && <DocumentHeaderSettings compact onSaved={onDocumentHeaderPersist} />}
        </div>

        {/* Обслуживание и СУБД — правая колонка */}
        <div className="xl:col-span-5 space-y-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-800 text-sm tracking-tight border-b border-slate-50 pb-2 flex items-center gap-1.5">
            <Database size={16} className="text-blue-500" />
            {t("Обслуживание Базы Данных")}
          </h3>

          <div className="space-y-3 text-xs text-slate-500">
            {/* Real encrypted backup portion — Admin only */}
            {isAdmin ? (
            <div className="space-y-2.5 p-2.5 bg-slate-50/80 rounded-lg border border-slate-100">
              <h4 className="font-bold text-slate-700 text-[11px] uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck size={13} className="text-emerald-500" />
                {t("Резервное копирование (AES-256-CBC)")}
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed text-justify">
                {t("База данных хранится на сервере в полностью заверенном зашифрованном виде. Вы можете скачать зашифрованную резервную копию здесь и восстановить ее на любом другом сервере.")}
              </p>

              {!allowBackup && (
                <div className="p-2 bg-amber-50 text-amber-900 border border-amber-150 rounded-lg text-[10px] font-medium flex items-center gap-1.5">
                  <Lock size={12} className="shrink-0 text-amber-600" />
                  {t('Резервное копирование доступно только после активации лицензии. Откройте Настройки и введите ключ.')}
                </div>
              )}

              {backupSuccess && (
                <div className="p-2 bg-emerald-50 text-emerald-800 border border-emerald-150 rounded-lg text-[10px] text-center font-bold">
                  {backupSuccess}
                </div>
              )}

              {backupError && (
                <div className="p-2 bg-rose-50 text-rose-800 border border-rose-150 rounded-lg text-[10px] text-center font-bold">
                  {backupError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  disabled={backupLoading || !allowBackup}
                  title={!allowBackup ? t('Доступно после активации лицензии') : t("Выгрузить в зашифрованном .enc")}
                  className="py-2 px-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[11px] transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={13} />
                  {t("Скачать копию")}
                </button>

                <label className={`py-2 px-2 bg-white text-slate-700 font-bold rounded-lg text-[11px] transition-all flex items-center justify-center gap-1 border border-slate-200 shadow-xs text-center ${allowBackup && !backupLoading ? 'hover:bg-slate-50 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
                  <Upload size={13} className="text-slate-500" />
                  {t("Восстановить")}
                  <input
                    type="file"
                    accept=".enc"
                    onChange={handleImportBackup}
                    disabled={backupLoading || !allowBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            ) : (
              <p className="text-[10px] text-slate-500 p-3 bg-slate-50 rounded-xl border border-slate-100">
                {t("Резервное копирование и восстановление доступны только администратору.")}
              </p>
            )}

            <p className="leading-relaxed pt-1">
              {t(
                'Полностью удалить все данные инвентаризации: объекты, сотрудников, оборудование, склад, ПО и аудиты. Учётные записи, лицензия и настройки интерфейса сохранятся.'
              )}
            </p>

            {resetSuccess && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-150 rounded-xl text-center font-bold">
                {t('База данных полностью очищена!')}
              </div>
            )}

            {!showResetConfirm ? (
              <button
                type="button"
                onClick={() => {
                  if (!isAdmin) return;
                  setShowResetConfirm(true);
                  setResetSuccess(false);
                }}
                disabled={!isAdmin}
                className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed text-rose-800"
              >
                <Trash2 size={14} />
                {t('Полностью очистить базу данных')} {!isAdmin && t('(Только Админ)')}
              </button>
            ) : (
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 space-y-2">
                <p className="font-bold text-rose-900 text-[11px] leading-tight">
                  {t(
                    'Вы уверены? Будут безвозвратно удалены все объекты, сотрудники, оборудование, склад, ПО и инвентаризации. Учётные записи, лицензия и настройки системы сохранятся.'
                  )}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={purgeLoading}
                    onClick={async () => {
                      setPurgeLoading(true);
                      const ok = await onPurgeWorkspace();
                      setPurgeLoading(false);
                      if (ok) {
                        setShowResetConfirm(false);
                        setResetSuccess(true);
                        setTimeout(() => setResetSuccess(false), 4000);
                      }
                    }}
                    className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[10px] cursor-pointer text-center disabled:opacity-50"
                  >
                    {purgeLoading ? t('Очистка…') : t('Да, очистить всё')}
                  </button>
                  <button
                    type="button"
                    disabled={purgeLoading}
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px] cursor-pointer text-center disabled:opacity-50"
                  >
                    {t('Отмена')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SQL Database connection configurations (MySQL & PostgreSQL) */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-800 text-sm tracking-tight border-b border-slate-50 pb-2 flex items-center gap-1.5">
            <Server size={16} className="text-blue-500" />
            {t("Параметры СУБД (MySQL / PostgreSQL)")}
          </h3>

          <div className="space-y-3 text-xs">
            <p className="text-slate-500 leading-relaxed text-justify">
              {t("Настройте подключение к СУБД для хранения данных на Linux-сервере. Все конфиденциальные записи ТМЦ хранятся в зашифрованном по стандарту AES-256-CBC виде на стороне СУБД.")}
            </p>

            {/* Live Connection Status Banner */}
            <div className="p-3 rounded-xl border flex flex-col gap-1.5 transition-all text-[11.5px] bg-slate-50/80 border-slate-150">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-slate-500 flex items-center gap-1">
                  <Database size={13} className="text-blue-500" />
                  {t("Индикатор связи:")}
                </span>
                {dbLiveStatus.status === 'connected' ? (
                  <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {dbType === 'json' ? t("Файл JSON") : dbType.toUpperCase()}
                  </span>
                ) : dbLiveStatus.status === 'error' ? (
                  <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 text-[9.5px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                    {t("JSON fallback")}
                  </span>
                ) : (
                  <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full font-bold animate-pulse text-[10px]">
                    {t("Проверка...")}
                  </span>
                )}
              </div>

              {dbLiveStatus.status === 'connected' && (
                <p className="text-[10px] text-slate-500 leading-snug">
                  {dbType === 'json' 
                    ? t("Система исправно сохраняет всю информацию локально в зашифрованном кэше.") 
                    : `${t("Соединение с внешней базой")} ${dbType.toUpperCase()} ${t("активно и стабильно.")}`}
                </p>
              )}

              {dbLiveStatus.status === 'error' && (
                <div className="space-y-1 animate-fade-in">
                  <p className="text-[10px] text-rose-600 font-bold leading-tight">
                    {t("Внимание! СУБД недоступна. Включен аварийный локальный буфер.")}
                  </p>
                  <p className="text-[9.5px] text-slate-450 font-mono bg-white p-1 rounded border border-rose-100 max-h-[36px] overflow-y-auto break-all scrollbar-thin">
                    {dbLiveStatus.error}
                  </p>
                </div>
              )}

              {dbLiveStatus.lastChecked && (
                <div className="text-[9px] text-slate-400 text-right font-mono mt-0.5">
                  {t("Контроль:")} {new Date(dbLiveStatus.lastChecked).toLocaleTimeString()}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-705 uppercase tracking-wider">{t("Тип Базы Данных")}</label>
              <select
                value={dbType}
                onChange={(e) => {
                  const val = e.target.value as 'json' | 'mysql' | 'postgres';
                  setDbType(val);
                  setDbPort(val === 'postgres' ? '5432' : val === 'mysql' ? '3306' : '');
                }}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-semibold text-slate-800 cursor-pointer"
              >
                <option value="json">{t("Локальный шифрованный файл (JSON)")}</option>
                <option value="mysql">MySQL / MariaDB Server</option>
                <option value="postgres">PostgreSQL Server</option>
              </select>
            </div>

            {dbType !== 'json' && (
              <div className="space-y-2.5 pt-1">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">{t("Хост / IP")}</label>
                    <input
                      type="text"
                      value={dbHost}
                      onChange={(e) => setDbHost(e.target.value)}
                      placeholder="host.docker.internal"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-slate-800 font-mono text-[11px] focus:outline-none"
                    />
                    {dbDockerHint ? (
                      <p className="text-[9px] text-amber-700 leading-snug">{dbDockerHint}</p>
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">{t("Порт")}</label>
                    <input
                      type="text"
                      value={dbPort}
                      onChange={(e) => setDbPort(e.target.value)}
                      placeholder={dbType === 'postgres' ? '5432' : '3306'}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-slate-800 font-mono text-[11px] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">{t("База Данных")}</label>
                    <input
                      type="text"
                      value={dbName}
                      onChange={(e) => setDbName(e.target.value)}
                      placeholder="stack_db"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-slate-800 font-mono text-[11px] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">{t("Пользователь")}</label>
                    <input
                      type="text"
                      value={dbUser}
                      onChange={(e) => setDbUser(e.target.value)}
                      placeholder={dbType === 'postgres' ? 'postgres' : 'root'}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-slate-800 font-mono text-[11px] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">{t("Пароль доступа")}</label>
                  <input
                    type="password"
                    value={dbPassword}
                    onChange={(e) => setDbPassword(e.target.value)}
                    placeholder={dbPasswordSet ? t("Пароль сохранён — оставьте пустым") : "••••••••"}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-slate-800 font-mono text-[11px] focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Test connection results */}
            {dbTestMessage && (
              <div className="p-2 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg text-[10px] text-center font-bold">
                {dbTestMessage}
              </div>
            )}
            {dbTestError && (
              <div className="p-2 bg-rose-50 text-rose-800 border border-rose-100 rounded-lg text-[10px] text-center font-bold">
                {dbTestError}
              </div>
            )}

            {/* Save config results */}
            {dbSaveMessage && (
              <div className="p-2 bg-blue-50 text-blue-850 border border-blue-150 rounded-lg text-[10px] text-center font-bold animate-pulse">
                {dbSaveMessage}
              </div>
            )}
            {dbSaveError && (
              <div className="p-2 bg-rose-50 text-rose-800 border border-rose-100 rounded-lg text-[10px] text-center font-bold">
                {dbSaveError}
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-2 pt-2">
              {dbType !== 'json' && (
                <button
                  type="button"
                  onClick={handleTestDbConnection}
                  disabled={dbTestLoading || dbSaveLoading || !isAdmin}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={13} className={dbTestLoading ? 'animate-spin' : ''} />
                  {dbTestLoading ? t("Проверка...") : t("Проверить соединение")}
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveDbConfig}
                disabled={dbSaveLoading || dbTestLoading || !isAdmin}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Save size={13} />
                {dbSaveLoading ? t("Сохранение...") : t("Применить СУБД и мигрировать")}
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>

              {/* Licensing Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2">
              <Key className="text-blue-500 animate-pulse" size={18} />
              {t('Лицензирование и активация продукта')}
            </h3>
            <p className="text-xs text-slate-500">
              {t('Управление лицензионным статусом локальной (on-premises) инсталляции Vicariustab.')}
            </p>
          </div>
        </div>

        <div className="max-w-2xl space-y-4">
          {/* Current License Status and Key Activation */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-705 text-xs uppercase tracking-wider">{t("Текущий Лицензионный Статус")}</h4>
            
            {/* Equipment hardware identification ID for licensing */}
            <div className="space-y-2">
              <div className="p-3 bg-blue-50/50 border border-blue-200/40 rounded-xl space-y-2 text-xs text-slate-700">
                <span className="font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  {t("Уникальный Код Запроса Лицензии:")}
                </span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    readOnly
                    value={licenseRequestCode}
                    onFocus={(e) => e.currentTarget.select()}
                    onClick={(e) => e.currentTarget.select()}
                    aria-label={t("Уникальный Код Запроса Лицензии")}
                    className="flex-1 min-w-0 bg-blue-100 text-blue-900 font-mono text-[10.5px] font-bold px-2.5 py-1.5 rounded uppercase tracking-wider select-all cursor-text border border-blue-200/60"
                  />
                  <button
                    type="button"
                    onClick={handleCopyRequestCode}
                    className="text-[10px] text-blue-700 font-bold hover:underline cursor-pointer bg-white border border-blue-200/60 px-2 py-1 rounded-lg shadow-sm flex items-center justify-center gap-1.5 shrink-0"
                  >
                    {requestCodeCopied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    {requestCodeCopied ? t("Скопировано") : t("Копировать")}
                  </button>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50/70 border border-slate-200/50 rounded-xl flex items-center justify-between text-[11px] text-slate-500">
                <span>{t("System MAC-адрес (для диагностики):")}</span>
                <code className="font-mono text-[10px] uppercase font-semibold text-slate-600">
                  {licenseStatus.macAddress || 'D4:BC:CD:00:11:22'}
                </code>
              </div>
            </div>
            
            {licenseStatus.isActivated ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl space-y-2 text-emerald-800">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <ShieldCheck className="text-emerald-500" size={18} />
                  <span>{t("Система успешно активирована!")}</span>
                </div>
                <div className="text-xs text-emerald-700/90 leading-relaxed font-sans space-y-1">
                  <div>{t("Тип лицензии:")}<strong className="font-bold capitalize">{licenseStatus.licenseType === 'perpetual' ? t("Вечная (Без ограничений)") : t("Годовая")}</strong></div>
                  {licenseStatus.licenseType !== 'perpetual' && <div>{t("Срок окончания действия:")}<strong className="font-bold">{licenseStatus.expiresYear} год</strong></div>}
                  
                  {/* Decoded registered client parameters shown cleanly */}
                  {licenseStatus.clientName && (
                    <div className="mt-2.5 border-t border-emerald-500/20 pt-2 space-y-1 text-[11.5px]">
                      <div>{t("Владелец лицензии:")}<strong className="font-bold text-slate-900">{licenseStatus.clientName}</strong></div>
                      {(licenseStatus.clientEmail || licenseStatus.clientPhone) && (
                        <div className="text-slate-650 font-medium">
                          {licenseStatus.clientEmail && <span>{t('Почта:')} {licenseStatus.clientEmail}</span>}
                          {licenseStatus.clientEmail && licenseStatus.clientPhone && <span className="mx-1.5 text-slate-400">|</span>}
                          {licenseStatus.clientPhone && <span>{t('Телефон:')} {licenseStatus.clientPhone}</span>}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-2">{t("Активный ключ:")}<code className="bg-emerald-500/15 font-mono px-1.5 py-0.5 rounded text-[10.5px] font-semibold break-all">{licenseStatus.licenseKey}</code>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onDeactivate();
                    setInputLicenseKey('');
                    setActivationSuccess(false);
                  }}
                  className="mt-2 text-[10px] uppercase font-bold text-rose-650 hover:text-rose-700 tracking-wider transition-colors cursor-pointer block"
                >{t("Сбросить / Деактивировать ключ")}</button>
              </div>
            ) : (
              <div className="p-5 bg-blue-600/10 border border-blue-500/25 rounded-2xl space-y-3.5 text-blue-900 shadow-sm">
                <div className="flex items-center gap-2 font-bold text-sm text-blue-700">
                  <ShieldCheck className="text-blue-500" size={18} />
                  <span>{t("Действует пробный ознакомительный период (30 дней)")}</span>
                </div>

                <div className="bg-white/80 border border-blue-200/50 rounded-xl p-3.5 space-y-2">
                  <div className="text-xs text-blue-800 font-bold block uppercase tracking-wider">{t("Обратный отсчет в реальном времени:")}</div>
                  <div className="font-mono text-blue-900 text-lg font-black tracking-wide leading-none py-1 selection:bg-blue-150">
                    ⏱️ {licenseStatus.trialTimeLeftFormatted || `${licenseStatus.trialDaysLeft} $дн. 00 $ч. 00 $мин. 00 $сек.`}
                  </div>
                  <div className="text-[11px] text-slate-500 flex justify-between items-center pt-1.5 border-t border-slate-100">
                    <span>{t("Текущий статус периода:")}</span>
                    <strong className="text-blue-700 font-bold">{licenseStatus.trialDaysLeft} из 30 дн. осталось</strong>
                  </div>
                </div>

                <div className="text-xs text-blue-700/90 leading-relaxed font-sans">{t("Счётчик времени запущен с момента первого запуска системы. После окончания ознакомительного периода доступ к системе будет автоматически заблокирован до момента активации.")}</div>
              </div>
            )}

            {/* Verification Form */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase">{t("ВВЕСТИ ЛИЦЕНЗИОННЫЙ КЛЮЧ АКТИВАЦИИ")}</label>
              
              {licenseStatus.lockoutTimeLeft > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs text-center space-y-1">
                  <p className="font-bold uppercase tracking-wider block text-center flex items-center justify-center gap-2 text-red-650">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>{t("БЛОКИРОВКА ВВОДА")}</p>
                  <p className="text-center font-semibold leading-relaxed">{t("Служба защиты временно заблокировала попытки ввода ключа из-за частых ошибок (перебор). Повторите попытку через:")}<strong className="font-mono text-sm font-black text-rose-650">{Math.ceil(licenseStatus.lockoutTimeLeft / 1000)}</strong>{t("сек.")}</p>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="UTKIN-XXXX-XXXX"
                  value={inputLicenseKey}
                  disabled={licenseStatus.lockoutTimeLeft > 0}
                  onChange={(e) => {
                    setInputLicenseKey(e.target.value);
                    setActivationError('');
                    setActivationSuccess(false);
                  }}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 disabled:bg-slate-100 disabled:opacity-60"
                />
                <button
                  type="button"
                  disabled={licenseStatus.lockoutTimeLeft > 0}
                  onClick={() => {
                    if (!inputLicenseKey.trim()) return;
                    const worked = onActivate(inputLicenseKey);
                    if (worked) {
                       setActivationSuccess(true);
                       setActivationError('');
                       onRefreshLicense?.();
                    } else {
                      onRefreshLicense?.();
                      const secondsLeft = Math.ceil(getLicenseStatus().lockoutTimeLeft / 1000);
                      if (secondsLeft > 0) {
                        setActivationError(`${t("Служба защиты временно заблокировала попытки ввода ключа из-за частых ошибок (перебор). Повторите попытку через:")} ${secondsLeft} ${t("сек.")}`);
                      } else {
                        setActivationError(t("Неверный ключ активации. Проверьте правильность ввода."));
                      }
                      setActivationSuccess(false);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white disabled:text-slate-500 text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer shrink-0 disabled:cursor-not-allowed"
                >{t("Активировать")}</button>
              </div>

              {activationSuccess && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">{t("✔ Успешная активация! Ключ принят. Система полностью разблокирована.")}</div>
              )}

              {activationError && (
                <div className="p-2.5 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs font-bold">
                  ❌ {activationError}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
          <ShieldCheck className="text-slate-500" size={18} />
          {t('Авторское право и правообладатель')}
        </h3>
        <CopyrightFooter variant="settings" />
      </div>

      {/* Role and User Management section */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* User Card List */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <div>
                <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
                  <User size={16} className="text-blue-500" />
                  {t('Сотрудники с доступом в панель')} ({users.length})
                </h3>
                <p className="text-[10px] text-slate-400">{t("Роли определяют доступ к редактированию и администрированию.")}</p>
              </div>
              <div className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold font-mono">{t("Ваша роль:")}<span className="text-blue-600 font-bold">{currentUser.role === 'Admin' ? t('Администратор') : currentUser.role === 'Editor' ? t('Редактирование') : t('Просмотр')}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {users.map(u => {
                const uIsAdmin = u.role === 'Admin';
                const uIsEditor = u.role === 'Editor';
                const uIsViewer = u.role === 'Viewer';
                const isEditing = editingUserId === u.id;
                
                return (
                  <div 
                    key={u.id}
                    className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-2 transition-all ${
                      u.id === currentUser.id 
                        ? 'bg-blue-50/40 border-blue-150 ring-2 ring-blue-500/5' 
                        : u.isBlocked
                        ? 'bg-rose-50/30 border-rose-200'
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 min-w-0">
                      <div className="flex items-center gap-3 min-w-0">
                        {u.avatarUrl ? (
                          <img 
                            src={u.avatarUrl} 
                            alt={u.name} 
                            className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-sm shrink-0 border border-blue-600">
                            {u.name[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div className="min-w-0 text-xs text-slate-800">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-700 truncate block">{u.name}</span>
                            {u.id === currentUser.id && (
                              <span className="text-[8px] font-bold bg-blue-100 text-blue-800 px-1 rounded shrink-0">{t("Вы")}</span>
                            )}
                            {u.isBlocked && (
                              <span className="text-[8px] font-bold bg-red-100 text-red-800 px-1.5 py-0.5 rounded shrink-0 uppercase tracking-wider">{t("Заблок.")}</span>
                            )}
                          </div>
                          <span className="text-slate-400 block truncate text-[10px]">{u.email}</span>
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1 shrink-0">
                          {u.id !== currentUser.id && !isEditing && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingUserId(u.id);
                                setEditUserName(u.name || '');
                                setEditUserEmail(u.email || '');
                                setEditUserLogin(u.login || '');
                                setEditUserPassword('');
                                setEditUserRole(u.role || 'Viewer');
                              }}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title={t("Редактировать сотрудника")}
                            >
                              <Edit size={13} />
                            </button>
                          )}
                          {u.id !== currentUser.id && (
                            <button
                              type="button"
                              onClick={() => {
                                if (onUpdateUser) {
                                  onUpdateUser(u.id, { isBlocked: !u.isBlocked });
                                }
                              }}
                              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                                u.isBlocked ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-600 hover:bg-amber-50'
                              }`}
                              title={u.isBlocked ? t("Разблокировать") : t("Заблокировать")}
                            >
                              {u.isBlocked ? <Unlock size={13} /> : <Lock size={13} />}
                            </button>
                          )}
                          {u.id !== currentUser.id && (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(u)}
                              className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title={t("Удалить право доступа")}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-2 mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-700 animate-fade-in">
                        <div>
                          <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">{t("ФИО сотрудника")}</label>
                          <input
                            type="text"
                            value={editUserName}
                            onChange={(e) => setEditUserName(e.target.value)}
                            className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500/20 text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">{t("Электронная почта")}</label>
                          <input
                            type="email"
                            value={editUserEmail}
                            onChange={(e) => setEditUserEmail(e.target.value)}
                            className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500/20 text-slate-800"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">{t("Логин")}</label>
                            <input
                              type="text"
                              value={editUserLogin}
                              onChange={(e) => setEditUserLogin(e.target.value)}
                              className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500/20 text-slate-800"
                              autoComplete="username"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">{t("Пароль")}</label>
                            <input
                              type="password"
                              value={editUserPassword}
                              onChange={(e) => setEditUserPassword(e.target.value)}
                              placeholder={u.passwordSet ? t('Пусто = не менять') : t('Новый пароль')}
                              className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500/20 text-slate-800"
                              autoComplete="new-password"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">{t("Роль доступа")}</label>
                          <select
                            value={editUserRole}
                            onChange={(e) => setEditUserRole(e.target.value as UserRole)}
                            className="w-full px-2 py-1 border border-slate-200 rounded-lg bg-white text-xs focus:outline-none text-slate-755"
                          >
                            <option value="Viewer">{t("Просмотр (Viewer)")}</option>
                            <option value="Editor">{t("Редактирование (Editor)")}</option>
                            <option value="Admin">{t("Администрирование (Admin)")}</option>
                          </select>
                        </div>
                        <div className="flex gap-1.5 pt-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              if (onUpdateUser && editUserName.trim() && editUserLogin.trim()) {
                                const updates: Partial<SystemUser> = {
                                  name: editUserName,
                                  email: editUserEmail,
                                  login: editUserLogin,
                                  role: editUserRole,
                                };
                                if (editUserPassword.trim()) updates.password = editUserPassword;
                                onUpdateUser(u.id, updates);
                              }
                              setEditingUserId(null);
                            }}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[9px] transition-all cursor-pointer"
                          >{t("Сохранить")}</button>
                          <button
                            type="button"
                            onClick={() => setEditingUserId(null)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold text-[9px] transition-all cursor-pointer"
                          >{t("Отмена")}</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-1 mt-1 shrink-0">
                          {uIsAdmin && (
                            <span className="inline-flex items-center gap-0.5 text-[8.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded-md">
                              <Shield size={8} />{t("Администратор")}</span>
                          )}
                          {uIsEditor && (
                            <span className="inline-flex items-center gap-0.5 text-[8.5px] font-bold bg-blue-50 text-blue-800 border border-blue-105 px-1.5 py-0.5 rounded-md">
                              <Edit size={8} />{t("Редактирование")}</span>
                          )}
                          {uIsViewer && (
                            <span className="inline-flex items-center gap-0.5 text-[8.5px] font-bold bg-slate-50 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded-md">
                              <Eye size={8} />{t("Просмотр/Аудит")}</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add User form - Administrator specific */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden lg:col-span-1">
            {!isAdmin && (
              <div className="absolute inset-0 bg-slate-550/5 backdrop-blur-[1px] flex flex-col items-center justify-center p-6 text-center z-10 select-none">
                <div className="w-10 h-10 bg-amber-50 text-amber-655 rounded-full flex items-center justify-center border border-amber-200 mb-2.5">
                  <Lock size={18} />
                </div>
                <h4 className="font-bold text-slate-850 text-xs">{t("Добавление закрыто")}</h4>
                <p className="text-[10px] text-slate-455 max-w-[200px] mt-1 leading-normal">{t("Создавать аккаунты сотрудников и настраивать роли имеет право только")}<strong className="text-slate-600">{t("Администратор")}</strong>.
                </p>
              </div>
            )}

            <h3 className="font-bold text-slate-800 text-sm tracking-tight border-b border-slate-50 pb-2 flex items-center gap-1.5">
              <UserPlus size={16} className="text-blue-500" />{t("Добавить сотрудника")}</h3>

            <form onSubmit={handleAddUserSubmit} className="space-y-3 pt-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">{t("ФИО сотрудника")}</label>
                <input
                  type="text"
                  required
                  disabled={!isAdmin}
                  placeholder={t("Анна Ковалева")}
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-705"
                />
              </div>

              <div>
                <label className="block text:[10px] font-bold text-slate-450 uppercase mb-1">{t("Электронная почта")}</label>
                <input
                  type="email"
                  required
                  disabled={!isAdmin}
                  placeholder="anna@it-dep.ru"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-705"
                />
              </div>

              {/* Direct Login and Password credentials */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">{t("Логин")}</label>
                  <input
                    type="text"
                    required
                    disabled={!isAdmin}
                    placeholder="anna"
                    value={newUserLogin}
                    onChange={(e) => setNewUserLogin(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-705 font-mono"
                    autoComplete="username"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">{t("Пароль")}</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    disabled={!isAdmin}
                    placeholder={t('Не менее 8 символов')}
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-705 font-mono"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {newUserError && (
                <p className="text-[10px] text-rose-600 font-semibold">{newUserError}</p>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">{t("Выбрать роль (Доступ)")}</label>
                <select
                  value={newUserRole}
                  disabled={!isAdmin}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-xs focus:outline-none text-slate-705"
                >
                  <option value="Viewer">{t("Просмотр (Запрещено вносить изменения)")}</option>
                  <option value="Editor">{t("Редактирование (Разрешено вносить изменения)")}</option>
                  <option value="Admin">{t("Администрирование (Полный доступ и управление правами)")}</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={!isAdmin}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus size={13} />{t("Создать учетную запись")}</button>
            </form>
          </div>
        </div>
      )}

      {/* Authentic Hot Reboot Fullscreen Overlay */}
      <AnimatePresence>
        {isRebooting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0f172a] backdrop-blur-md flex flex-col items-center justify-center p-6 z-[9999]"
          >
            <div className="max-w-md w-full text-center space-y-6">
              <div className="relative inline-flex items-center justify-center">
                {/* Spinning glow ring */}
                <div className="absolute inset-0 rounded-full border-4 border-dashed border-blue-500/20 animate-spin [animation-duration:15s]" />
                <div className="absolute inset-0 rounded-full border-4 border-double border-indigo-500/40 animate-spin [animation-duration:10s]" />
                
                {/* Central active spinning icon */}
                <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center relative">
                  <RefreshCw size={36} className="text-blue-500 animate-spin [animation-duration:3s]" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-100 tracking-tight flex items-center justify-center gap-2">
                  <span>{t("Перезапуск ядра Vicariustab")}</span>
                  <span className="text-blue-400 font-mono font-black">{rebootTimeLeft} сек...</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono tracking-wide h-6">
                  {rebootStep}
                </p>
              </div>

              {/* Console stream simulating boot checklist status */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 text-left font-mono text-[9.5px] text-emerald-400/95 space-y-1 h-36 overflow-y-auto select-none">
                <div>[SYSTEM] Initiating warm reboot command...</div>
                {rebootTimeLeft <= 4 && <div>[SERVICES] Sending SIGTERM to legacy middleware... OK</div>}
                {rebootTimeLeft <= 3 && <div>[KERNEL] Loading binary image v2.5.3-production (64-bit)...</div>}
                {rebootTimeLeft <= 3 && <div>[KERNEL] Injecting Vicariustab code updates & UI resources... OK</div>}
                {rebootTimeLeft <= 2 && <div>[DATABASE] Verifying schema integrity of localStorage... OK</div>}
                {rebootTimeLeft <= 2 && <div>[DATABASE] Applied 2 incremental schema migrations... OK</div>}
                {rebootTimeLeft <= 1 && <div>[NETWORK] Testing websocket gateway ingress... OK</div>}
                {rebootTimeLeft <= 1 && <div>[RUNTIME] Executing garbage collection & cache flush...</div>}
                {rebootTimeLeft === 0 && <div className="text-blue-400 font-bold">[REBOOT] Mounting fully compiled Vicariustab workspace now.</div>}
              </div>

              <div className="text-[10px] text-slate-500 font-sans leading-relaxed">{t("Пожалуйста, не закрывайте вкладку. Обновленные файлы, базы данных и параметры сессии применяются автоматически прямо сейчас.")}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDeleteModal
        preview={
          deleteTarget
            ? {
                title: 'Удаление пользователя',
                subtitle: 'Учётная запись будет удалена. Это действие необратимо.',
                itemName: deleteTarget.login,
                detailLabel: 'Роль',
                detailValue: deleteTarget.role,
                cascadeLines: [],
                confirmLabel: 'Удалить',
              }
            : null
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteUser(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}
