/*
 * COPYRIGHT NOTICE | УВЕДОМЛЕНИЕ ОБ АВТОРСКИХ ПРАВАХ | 版权声明
 * © 2026 Utkin Vladislav Vyacheslavovich (Уткин Владислав Вячеславович)
 * Email: vicariustab@icloud.com | Telegram: https://t.me/Dexterll
 * All rights reserved. Unauthorized copying, modification, distribution or commercial use is prohibited.
 * 保留所有权利。未经版权所有者事先书面同意，禁止复制、修改、分发或商业使用。
 * Все права защищены. Копирование, изменение, распространение и коммерческое использование без письменного согласия правообладателя запрещено.
 * Release
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import ObjectsView from './components/ObjectsView';
import NetworkView from './components/NetworkView';
import ComputersView from './components/ComputersView';
import EmployeesView from './components/EmployeesView';
import WarehouseView from './components/WarehouseView';
import AuditsView from './components/AuditsView';
import WarrantiesView from './components/WarrantiesView';
import ReportsView from './components/ReportsView';
import ActivityLogView from './components/ActivityLogView';
import SettingsView from './components/SettingsView';
import SecurityView from './components/SecurityView';
import DetailModal from './components/DetailModal';
import LoginScreen from './components/LoginScreen';
import FirstRunSetup from './components/FirstRunSetup';
import SoftwareView from './components/SoftwareView';
import { useTranslation } from './utils/i18n';
import { COPYRIGHT_EMAIL, COPYRIGHT_TELEGRAM_URL } from './legal/copyright';

import { 
  initialObjects, 
  initialNetworkDevices, 
  initialComputers, 
  initialEmployees, 
  initialWarehouseItems, 
  initialActivities, 
  initialAudits,
  initialSoftwareItems
} from './initialData';

import { ObjectItem, NetworkDevice, ComputerItem, EmployeeItem, EmployeeStatus, WarehouseItem, WarehouseItemType, Activity, InventoryAudit, SystemUser, UserRole, SoftwareItem, ComputerCategory, CustomWarehouse, WarehouseWriteOff } from './types';
import { getLicenseStatus, activateSystem, deactivateSystem, getSystemRequestCode, applyLicenseStateFromServer, getLicenseSecuritySnapshot } from './utils/license';
import { checkForPlatformUpdate, markInstalledCommit, buildUpdateNotificationText, shouldNotifyForUpdate, markUpdateNotified } from './utils/updateCheck';
import { APP_VERSION } from './config/appConfig';
import {
  filterComputersByEquipmentTab,
  resolveWarehouseComputerRoute,
  resolveNetworkDeviceType,
  equipmentTabLabel,
} from './utils/warehouseRouting';
import {
  buildComputerSpecsFromReceipt,
  getWarehouseItemSpecs,
  limitEquipmentTitle,
  matchesBaseInventoryNumber,
  isNotLinkedToInventoryBase,
} from './utils/equipmentFields';
import { Copy, Check, Mail } from 'lucide-react';
import { copyTextToClipboard } from './utils/clipboard';
import {
  authenticateCredentials,
  sessionHeartbeat,
  logoutUserSession,
  markSessionNotificationsRead,
} from './utils/sessionAuth';
import { getStoredSessionToken, clearSessionCredentials, authHeaders } from './utils/deviceFingerprint';
import { apiFetch } from './utils/apiClient';
import { persistWorkspaceState } from './utils/workspaceSync';
import { fetchSetupStatus } from './utils/setupAuth';

export default function App() {
  const { t } = useTranslation();
  // Licensing and Activation State (Utkin V.V. All rights reserved)
  const [licenseStatus, setLicenseStatus] = useState(() => getLicenseStatus());
  const [licenseRevision, setLicenseRevision] = useState(0);
  const [emailCopiedLock, setEmailCopiedLock] = useState(false);
  const [requestCodeCopied, setRequestCodeCopied] = useState(false);

  const copyEmailToClipboardLock = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText("vicariustab@icloud.com");
    setEmailCopiedLock(true);
    setTimeout(() => {
      setEmailCopiedLock(false);
    }, 2000);
  };

  // License countdown: 1s during trial/lockout, 5s when fully activated
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const tick = () => {
      const status = getLicenseStatus();
      setLicenseStatus(status);
      const delay =
        status.lockoutTimeLeft > 0 || (!status.isActivated && !status.isExpired) ? 1000 : 5000;
      timeoutId = setTimeout(tick, delay);
    };
    tick();
    return () => clearTimeout(timeoutId);
  }, []);

  const [isLoadedFromServer, setIsLoadedFromServer] = useState<boolean>(false);
  const [dataRevision, setDataRevision] = useState<number | null>(null);
  const dataRevisionRef = useRef<number | null>(null);
  const [saveError, setSaveError] = useState('');
  const [setupChecking, setSetupChecking] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [setupCompleteMessage, setSetupCompleteMessage] = useState('');

  // Navigation & UI Layout states
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [equipmentOpen, setEquipmentOpen] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDetail, setSelectedDetail] = useState<{ type: 'computer' | 'network' | 'employee' | 'object' | 'warehouse'; id: string } | null>(null);

  // 1. Data States with LocalStorage Persistence
  const [objects, setObjects] = useState<ObjectItem[]>(() => {
    const saved = localStorage.getItem('it_objects');
    return saved ? JSON.parse(saved) : initialObjects;
  });

  const [networkDevices, setNetworkDevices] = useState<NetworkDevice[]>(() => {
    const saved = localStorage.getItem('it_network');
    return saved ? JSON.parse(saved) : initialNetworkDevices;
  });

  const [computers, setComputers] = useState<ComputerItem[]>(() => {
    const saved = localStorage.getItem('it_computers');
    return saved ? JSON.parse(saved) : initialComputers;
  });

  const [employees, setEmployees] = useState<EmployeeItem[]>(() => {
    const saved = localStorage.getItem('it_employees');
    return saved ? JSON.parse(saved) : initialEmployees;
  });

  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>(() => {
    const saved = localStorage.getItem('it_warehouse');
    return saved ? JSON.parse(saved) : initialWarehouseItems;
  });

  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem('it_activities');
    let loaded: Activity[] = saved ? JSON.parse(saved) : initialActivities;
    const seenIds = new Set<string>();
    loaded = loaded.map((act, index) => {
      if (!act.id || seenIds.has(act.id)) {
        const uniqueId = `act-${Date.now()}-${index}-${Math.floor(Math.random() * 1000000)}`;
        seenIds.add(uniqueId);
        return { ...act, id: uniqueId };
      }
      seenIds.add(act.id);
      return act;
    });
    return loaded;
  });

  const [audits, setAudits] = useState<InventoryAudit[]>(() => {
    const saved = localStorage.getItem('it_audits');
    return saved ? JSON.parse(saved) : initialAudits;
  });

  const [softwareItems, setSoftwareItems] = useState<SoftwareItem[]>(() => {
    const saved = localStorage.getItem('it_software');
    return saved ? JSON.parse(saved) : initialSoftwareItems;
  });

  const [warehouses, setWarehouses] = useState<CustomWarehouse[]>(() => {
    const saved = localStorage.getItem('it_custom_warehouses');
    return saved ? JSON.parse(saved) : [
      { id: 'wh-1', name: 'Основной склад ИТ', objectName: 'Главный офис', description: 'Основной склад для ИТ-оборудования компании' }
    ];
  });

  const [warehouseWriteOffs, setWarehouseWriteOffs] = useState<WarehouseWriteOff[]>(() => {
    const saved = localStorage.getItem('it_warehouse_writeoffs');
    return saved ? JSON.parse(saved) : [];
  });

  const [workspaceName, setWorkspaceName] = useState<string>(() => {
    return localStorage.getItem('it_workspace_name') || 'Инвентаризация оборудования';
  });

  const [adminEmail, setAdminEmail] = useState<string>(() => {
    return localStorage.getItem('it_admin_email') || 'vicariustab@icloud.com';
  });

  const [publicUrl, setPublicUrl] = useState<string>(() => {
    return localStorage.getItem('it_public_url') || '';
  });

  // --- USER ROLE MANAGEMENT STATES ---
  const [users, setUsers] = useState<SystemUser[]>(() => {
    const saved = localStorage.getItem('it_users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed as SystemUser[];
      } catch (e) {
        console.error('Failed to parse saved users', e);
      }
    }
    return [];
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return localStorage.getItem('it_current_user_id') || '';
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('it_is_logged_in') === 'true';
  });

  // Customization States (Icons, Logo, Color palette)
  const [tabIcons, setTabIcons] = useState(() => {
    const saved = localStorage.getItem('it_tab_icons');
    return saved ? JSON.parse(saved) : {
      computers: 'Laptop',
      network: 'Network',
      peripherals: 'Monitor',
      other_equip: 'Server',
    };
  });

  const [panelLogo, setPanelLogo] = useState<string>(() => {
    return localStorage.getItem('it_panel_logo') || '';
  });

  const [panelColor, setPanelColor] = useState<string>(() => {
    return localStorage.getItem('it_panel_color') || 'blue';
  });

  const [siteFavicon, setSiteFavicon] = useState<string>(() => {
    return localStorage.getItem('it_site_favicon') || '';
  });

  const [siteLogo, setSiteLogo] = useState<string>(() => {
    return localStorage.getItem('it_site_logo') || '';
  });

  const [sidebarBgColor, setSidebarBgColor] = useState<string>(() => {
    return localStorage.getItem('it_sidebar_bg_color') || '#0f172a';
  });

  const [sidebarOpacity, setSidebarOpacity] = useState<number>(() => {
    const val = localStorage.getItem('it_sidebar_opacity');
    return val ? parseFloat(val) : 1.0;
  });

  // Derived current user metadata
  const currentUser = users.find(u => u.id === currentUserId);

  useEffect(() => {
    void (async () => {
      const status = await fetchSetupStatus();
      if (status.setupRequired) {
        clearSessionCredentials();
        setIsLoggedIn(false);
        localStorage.setItem('it_is_logged_in', 'false');
      }
      setSetupRequired(status.setupRequired);
      setSetupChecking(false);
    })();
  }, []);

  const applyServerPayload = useCallback((data: Record<string, unknown>) => {
    if (typeof data._revision === 'number') {
      setDataRevision(data._revision);
      dataRevisionRef.current = data._revision;
    }
    applyLicenseStateFromServer(data);
    setLicenseStatus(getLicenseStatus());
    if (Array.isArray(data.objects)) setObjects(data.objects as ObjectItem[]);
    if (Array.isArray(data.networkDevices)) setNetworkDevices(data.networkDevices as NetworkDevice[]);
    if (Array.isArray(data.computers)) setComputers(data.computers as ComputerItem[]);
    if (Array.isArray(data.employees)) setEmployees(data.employees as EmployeeItem[]);
    if (Array.isArray(data.warehouseItems)) setWarehouseItems(data.warehouseItems as WarehouseItem[]);
    if (Array.isArray(data.activities)) setActivities(data.activities as Activity[]);
    if (Array.isArray(data.audits)) setAudits(data.audits as InventoryAudit[]);
    if (Array.isArray(data.softwareItems)) setSoftwareItems(data.softwareItems as SoftwareItem[]);
    if (Array.isArray(data.warehouses)) setWarehouses(data.warehouses as CustomWarehouse[]);
    if (Array.isArray(data.warehouseWriteOffs)) setWarehouseWriteOffs(data.warehouseWriteOffs as WarehouseWriteOff[]);
    if (typeof data.workspaceName === 'string') setWorkspaceName(data.workspaceName);
    if (typeof data.adminEmail === 'string') setAdminEmail(data.adminEmail);
    if (typeof data.publicUrl === 'string') setPublicUrl(data.publicUrl);
    if (Array.isArray(data.users)) setUsers(data.users as SystemUser[]);
    if (data.tabIcons) setTabIcons(data.tabIcons as typeof tabIcons);
    if (typeof data.panelLogo === 'string') setPanelLogo(data.panelLogo);
    if (typeof data.panelColor === 'string') setPanelColor(data.panelColor);
    if (typeof data.siteFavicon === 'string') setSiteFavicon(data.siteFavicon);
    if (typeof data.siteLogo === 'string') setSiteLogo(data.siteLogo);
    if (typeof data.sidebarBgColor === 'string') setSidebarBgColor(data.sidebarBgColor);
    if (typeof data.sidebarOpacity === 'number') setSidebarOpacity(data.sidebarOpacity);
  }, []);

  const loadDataFromServer = useCallback(async (): Promise<boolean> => {
    if (!getStoredSessionToken()) return false;
    const result = await apiFetch<Record<string, unknown>>('/api/data');
    if (!result.ok) {
      if (result.status === 401) {
        clearSessionCredentials();
        setIsLoggedIn(false);
      }
      return false;
    }
    if (result.data && typeof result.data === 'object') {
      applyServerPayload(result.data);
    }
    setIsLoadedFromServer(true);
    return true;
  }, [applyServerPayload]);

  useEffect(() => {
    if (isLoggedIn && !getStoredSessionToken()) {
      setIsLoggedIn(false);
      localStorage.setItem('it_is_logged_in', 'false');
      return;
    }
    if (isLoggedIn && getStoredSessionToken() && !isLoadedFromServer) {
      void loadDataFromServer();
    }
  }, [isLoggedIn, isLoadedFromServer, loadDataFromServer]);

  useEffect(() => {
    dataRevisionRef.current = dataRevision;
  }, [dataRevision]);

  useEffect(() => {
    const onAuthExpired = () => {
      clearSessionCredentials();
      setIsLoggedIn(false);
      setIsLoadedFromServer(false);
    };
    window.addEventListener('Vicariustab-auth-expired', onAuthExpired);
    return () => window.removeEventListener('Vicariustab-auth-expired', onAuthExpired);
  }, []);

  useEffect(() => {
    localStorage.setItem('it_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('it_current_user_id', currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem('it_is_logged_in', isLoggedIn ? 'true' : 'false');
  }, [isLoggedIn]);

  // Log out if currently logged in user is blocked
  useEffect(() => {
    if (isLoggedIn && currentUser && currentUser.isBlocked) {
      setIsLoggedIn(false);
      logActivity(
        'Сессия заблокирована',
        `Сотрудник "${currentUser.name}" принудительно разлогинен в связи с блокировкой доступа`,
        'system'
      );
    }
  }, [isLoggedIn, currentUser]);

  // Check GitHub for platform updates and notify via header bell
  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;

    const runUpdateCheck = () => {
      checkForPlatformUpdate().then((result) => {
        if (cancelled || !result) return;
        if (result.updateAvailable && shouldNotifyForUpdate(result.remoteVersion)) {
          markUpdateNotified(result.remoteVersion);
          window.dispatchEvent(
            new CustomEvent('Vicariustab-update-available', {
              detail: {
                text: buildUpdateNotificationText(result),
                remoteVersion: result.remoteVersion,
                currentVersion: result.currentVersion,
              },
            })
          );
        } else if (result.latestCommitSha) {
          markInstalledCommit(result.latestCommitSha);
        }
        localStorage.setItem('it_system_version', `v${APP_VERSION}`);
      });
    };

    runUpdateCheck();
    const interval = setInterval(runUpdateCheck, 24 * 60 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isLoggedIn]);

  useEffect(() => {
  }, [tabIcons]);

  useEffect(() => {
    localStorage.setItem('it_panel_logo', panelLogo);
  }, [panelLogo]);

  useEffect(() => {
    localStorage.setItem('it_panel_color', panelColor);
  }, [panelColor]);

  useEffect(() => {
    localStorage.setItem('it_site_favicon', siteFavicon);
    if (siteFavicon) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = siteFavicon;
    }
  }, [siteFavicon]);

  useEffect(() => {
    localStorage.setItem('it_site_logo', siteLogo);
  }, [siteLogo]);

  useEffect(() => {
    localStorage.setItem('it_sidebar_bg_color', sidebarBgColor);
  }, [sidebarBgColor]);

  useEffect(() => {
    localStorage.setItem('it_sidebar_opacity', sidebarOpacity.toString());
  }, [sidebarOpacity]);

  const handleActivateLicense = (key: string): boolean => {
    const success = activateSystem(key);
    setLicenseStatus(getLicenseStatus());
    setLicenseRevision((r) => r + 1);
    if (success) {
      logActivity('Активация лицензии', 'Успешно активирован новый лицензионный ключ продукта', 'system');
    }
    return success;
  };

  const handleDeactivateLicense = () => {
    deactivateSystem();
    setLicenseStatus(getLicenseStatus());
    logActivity('Деактивация лицензии', 'Сброшен активный лицензионный ключ системы', 'system');
  };

  const handleUpdateUserAvatar = (userId: string, avatarUrl: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, avatarUrl } : u));
    logActivity('Смена аватара', `Пользователь обновил личный аватар профиля`, 'system');
  };

  const handleAddUser = (u: Omit<SystemUser, 'id'>) => {
    if (checkLicenseBlocked()) return;
    const newUser: SystemUser = {
      ...u,
      id: `user-${Date.now()}`
    };
    setUsers(prev => [...prev, newUser]);
    logActivity('Добавлен пользователь', `Добавлен представитель "${u.name}" с правами "${u.role}"`, 'system');
  };

  const handleDeleteUser = (id: string) => {
    if (checkLicenseBlocked()) return;
    const target = users.find(u => u.id === id);
    if (!target) return;
    setUsers(prev => prev.filter(u => u.id !== id));
    logActivity('Отозван доступ', `Отозван доступ к панели у сотрудника "${target.name}"`, 'system');
  };

  const handleUpdateUser = (id: string, updatedFields: Partial<SystemUser>) => {
    if (checkLicenseBlocked()) return;
    const target = users.find(u => u.id === id);
    if (!target) return;
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updatedFields } : u));
    logActivity('Изменение параметров доступа', `Обновлены данные учетной записи "${target.name}"`, 'system');

    if (updatedFields.password && updatedFields.password !== target.password) {
      const event = new CustomEvent('Vicariustab-password-changed', {
        detail: { userName: target.name }
      });
      window.dispatchEvent(event);
      window.dispatchEvent(new CustomEvent('orbit-password-changed', { detail: event.detail }));
    }
  };

  useEffect(() => {
    if (!isLoadedFromServer || !isLoggedIn || !getStoredSessionToken()) return;

    const timeoutId = setTimeout(() => {
      // Prepare fully synchronizable server payload
      const stateToSave = {
        objects,
        networkDevices,
        computers,
        employees,
        warehouseItems,
        activities,
        audits,
        softwareItems,
        warehouses,
        warehouseWriteOffs,
        workspaceName,
        adminEmail,
        publicUrl,
        users,
        tabIcons,
        panelLogo,
        panelColor,
        siteFavicon,
        siteLogo,
        sidebarBgColor,
        sidebarOpacity,
        // Host licensing parameters
        license_key: localStorage.getItem('it_license_key') || '',
        system_mac: localStorage.getItem('it_system_mac') || '',
        system_fingerprint: localStorage.getItem('it_system_fingerprint') || '',
        trial_start: localStorage.getItem('it_trial_start') || '',
        trial_sig: localStorage.getItem('it_trial_sig') || '',
        _ao_telemetry_pt: localStorage.getItem('_ao_telemetry_pt') || '',
        _ao_telemetry_sig: localStorage.getItem('_ao_telemetry_sig') || '',
        _ao_telemetry_mt: localStorage.getItem('_ao_telemetry_mt') || '',
        max_time: localStorage.getItem('it_max_time') || '',
        tamper_flag: localStorage.getItem('it_tamper_flag') || '',
        ...getLicenseSecuritySnapshot(),
      };

      // 1. Update local storage backups
      localStorage.setItem('it_objects', JSON.stringify(objects));
      localStorage.setItem('it_network', JSON.stringify(networkDevices));
      localStorage.setItem('it_computers', JSON.stringify(computers));
      localStorage.setItem('it_employees', JSON.stringify(employees));
      localStorage.setItem('it_warehouse', JSON.stringify(warehouseItems));
      localStorage.setItem('it_activities', JSON.stringify(activities));
      localStorage.setItem('it_audits', JSON.stringify(audits));
      localStorage.setItem('it_software', JSON.stringify(softwareItems));
      localStorage.setItem('it_custom_warehouses', JSON.stringify(warehouses));
      localStorage.setItem('it_warehouse_writeoffs', JSON.stringify(warehouseWriteOffs));
      localStorage.setItem('it_workspace_name', workspaceName);
      localStorage.setItem('it_admin_email', adminEmail);
      localStorage.setItem('it_public_url', publicUrl);
      localStorage.setItem('it_users', JSON.stringify(users));
      localStorage.setItem('it_tab_icons', JSON.stringify(tabIcons));
      localStorage.setItem('it_panel_logo', panelLogo);
      localStorage.setItem('it_panel_color', panelColor);
      localStorage.setItem('it_site_favicon', siteFavicon);
      localStorage.setItem('it_site_logo', siteLogo);
      localStorage.setItem('it_sidebar_bg_color', sidebarBgColor);
      localStorage.setItem('it_sidebar_opacity', sidebarOpacity.toString());

      // 2. Transmit state to the backend (authenticated + revision check)
      void (async () => {
        const result = await persistWorkspaceState(stateToSave, dataRevisionRef.current);
        if (result.ok === true) {
          setDataRevision(result.revision);
          dataRevisionRef.current = result.revision;
          setSaveError('');
          return;
        }
        const msg =
          result.status === 403
            ? t('Сохранение отклонено: недостаточно прав (только просмотр).')
            : result.status === 402
              ? t('Сохранение отклонено: лицензия истекла или недействительна.')
              : `${t('Не удалось сохранить данные на сервере')}: ${result.error}`;
        console.warn('Workspace save failed:', result.status, result.error);
        setSaveError(msg);
      })();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [
    isLoadedFromServer,
    objects,
    networkDevices,
    computers,
    employees,
    warehouseItems,
    activities,
    audits,
    softwareItems,
    warehouses,
    warehouseWriteOffs,
    workspaceName,
    adminEmail,
    publicUrl,
    users,
    tabIcons,
    panelLogo,
    panelColor,
    siteFavicon,
    siteLogo,
    sidebarBgColor,
    sidebarOpacity,
    licenseRevision,
    isLoggedIn,
    applyServerPayload,
  ]);

  const logActivity = (action: string, detail: string, type: 'create' | 'update' | 'delete' | 'system' | 'auth') => {
    const roleRu = currentUser?.role === 'Admin' ? 'Админ' : currentUser?.role === 'Editor' ? 'Редактор' : 'Просмотр';
    const newLog: Activity = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      timestamp: new Date().toISOString(),
      user: `${currentUser?.name || 'Система'} (${roleRu})`,
      action,
      detail,
      type,
    };
    setActivities(prev => [newLog, ...prev]);
  };

  const pushSessionSecurityAlert = useCallback((title: string, body: string, serverNotifId?: string) => {
    window.dispatchEvent(
      new CustomEvent('Vicariustab-session-security-alert', {
        detail: { title, body, targetTab: 'settings', isSecurity: true, serverNotifId },
      })
    );
  }, []);

  const syncAuthAuditFromServer = useCallback(async () => {
    if (!getStoredSessionToken()) return;
    try {
      const res = await fetch('/api/auth/audit', { headers: authHeaders() });
      if (!res.ok) return;
      const data = (await res.json()) as {
        events: Array<{ id: string; timestamp: string; userName: string; action: string; detail: string }>;
      };
      const events = data.events || [];
      if (!events.length) return;
      setActivities((prev) => {
        const existingIds = new Set(prev.map((a) => a.id));
        const merged = events
          .filter((e) => !existingIds.has(`srv-${e.id}`))
          .map((e) => ({
            id: `srv-${e.id}`,
            timestamp: e.timestamp,
            user: e.userName,
            action: e.action,
            detail: e.detail,
            type: 'auth' as const,
          }));
        if (!merged.length) return prev;
        return [...merged, ...prev].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      });
    } catch {
      /* ignore */
    }
  }, []);

  const completeUserLogin = useCallback(async (userId: string, viaSwitch = false) => {
    setCurrentUserId(userId);
    setIsLoggedIn(true);
    setIsLoadedFromServer(false);
    await loadDataFromServer();
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    logActivity(
      viaSwitch ? 'Смена аккаунта' : 'Вход в систему',
      `Пользователь "${user.name}" (${user.role})`,
      'auth'
    );
    await syncAuthAuditFromServer();
  }, [users, syncAuthAuditFromServer, loadDataFromServer]);

  const handleLogout = useCallback(async () => {
    const user = users.find((u) => u.id === currentUserId);
    if (getStoredSessionToken()) {
      await logoutUserSession(user?.name || 'user');
      if (user) {
        logActivity('Выход из системы', `Завершена сессия пользователя "${user.name}"`, 'auth');
      }
      await syncAuthAuditFromServer();
    }
    clearSessionCredentials();
    setIsLoggedIn(false);
    setIsLoadedFromServer(false);
    setDataRevision(null);
    dataRevisionRef.current = null;
    setSaveError('');
  }, [users, currentUserId, syncAuthAuditFromServer]);

  const handleSwitchUser = useCallback(async (user: SystemUser, password: string): Promise<boolean> => {
    const prev = users.find((u) => u.id === currentUserId);
    if (prev && getStoredSessionToken()) {
      await logoutUserSession(prev.name);
    }
    clearSessionCredentials();
    const auth = await authenticateCredentials(user.login || user.email, password, user);
    if (!auth) return false;
    await completeUserLogin(user.id, true);
    return true;
  }, [users, currentUserId, completeUserLogin]);

  // Session heartbeat + remote security alerts (Admin / Editor)
  useEffect(() => {
    if (!isLoggedIn || !getStoredSessionToken()) return;
    const user = users.find((u) => u.id === currentUserId);
    if (!user || (user.role !== 'Admin' && user.role !== 'Editor')) return;
    let cancelled = false;
    const tick = async () => {
      const result = await sessionHeartbeat();
      if (cancelled) return;
      if (result.revoked) {
        clearSessionCredentials();
        setIsLoggedIn(false);
        return;
      }
      if (result.notifications?.length) {
        for (const n of result.notifications) {
          pushSessionSecurityAlert(n.title, n.body, n.id);
        }
        await markSessionNotificationsRead(result.notifications.map((n) => n.id));
      }
    };

    void tick();
    const interval = setInterval(tick, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isLoggedIn, currentUserId, users, pushSessionSecurityAlert]);

  // --- UNIFIED DEBOUNCED SERVER & LOCALSTORAGE STATE SYNCHRONIZATION ---

  const handleUpdateItem = (type: string, id: string, updatedFields: any) => {
    if (checkLicenseBlocked()) return;
    if (type === 'computer') {
      setComputers(prev => prev.map(c => c.id === id ? { ...c, ...updatedFields } : c));
    } else if (type === 'network') {
      setNetworkDevices(prev => prev.map(n => n.id === id ? { ...n, ...updatedFields } : n));
    } else if (type === 'employee') {
      setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updatedFields } : e));
    } else if (type === 'object') {
      setObjects(prev => prev.map(o => o.id === id ? { ...o, ...updatedFields } : o));
    } else if (type === 'warehouse') {
      setWarehouseItems(prev => prev.map(w => w.id === id ? { ...w, ...updatedFields } : w));
    }
    
    // Log updates
    let label = 'объект';
    if (type === 'computer') label = 'компьютер';
    else if (type === 'network') label = 'сетевое оборудование';
    else if (type === 'employee') label = 'сотрудник';
    else if (type === 'warehouse') label = 'актив на складе';

    logActivity('Изменен элемент', `Изменены параметры (${label}, ID: ${id})`, 'update');
  };

  const handleNavigateDetail = (type: 'computer' | 'network' | 'employee' | 'object' | 'warehouse', id: string) => {
    setSelectedDetail({ type, id });
  };

  const checkLicenseBlocked = (): boolean => {
    if (licenseStatus.isExpired) {
      alert("Доступ заблокирован: Период ознакомления или годовой лицензии завершен. Для разблокировки перейдите на страницу активации и введите ключ.");
      return true;
    }
    return false;
  };

  // 2. Data Action handlers (CRUD)
  
  // Objects CRUD
  const handleAddObject = (name: string, address: string, iconName?: string) => {
    if (checkLicenseBlocked()) return;
    const newObj: ObjectItem = {
      id: `obj-${Date.now()}`,
      name,
      address,
      iconName: iconName || 'Building2',
    };
    setObjects(prev => [...prev, newObj]);
    logActivity('Добавлен объект', `Добавлен объект "${name}" по адресу "${address}"`, 'create');
  };

  const handleEditObject = (id: string, name: string, address: string, iconName?: string) => {
    if (checkLicenseBlocked()) return;
    setObjects(prev => prev.map(obj => obj.id === id ? { ...obj, name, address, iconName: iconName || obj.iconName } : obj));
    logActivity('Изменен объект', `Параметры объекта "${name}" изменены`, 'update');
  };

  const handleDeleteObject = (id: string) => {
    if (checkLicenseBlocked()) return;
    const target = objects.find(o => o.id === id);
    if (!target) return;
    setObjects(prev => prev.filter(obj => obj.id !== id));
    logActivity('Удален объект', `Удален объект "${target.name}"`, 'delete');
  };

  const handleAddNetwork = (device: Omit<NetworkDevice, 'id'>) => {
    if (checkLicenseBlocked()) return;
    const newDevice: NetworkDevice = {
      ...device,
      id: `net-${Date.now()}`,
    };
    setNetworkDevices(prev => [...prev, newDevice]);
    logActivity('Добавлено сетевое оборудование', `Добавлено устройство "${device.deviceName}"`, 'create');
  };

  const handleEditNetwork = (id: string, device: Omit<NetworkDevice, 'id'>) => {
    if (checkLicenseBlocked()) return;
    setNetworkDevices(prev => prev.map(dev => dev.id === id ? { ...dev, ...device } : dev));
    logActivity('Изменено сетевое оборудование', `Параметры оборудования "${device.deviceName}" изменены`, 'update');
  };

  const handleDeleteNetwork = (id: string) => {
    if (checkLicenseBlocked()) return;
    let deletedName: string | null = null;
    setNetworkDevices((prev) => {
      const target = prev.find((n) => n.id === id);
      if (!target) return prev;
      deletedName = target.deviceName;
      return prev.filter((n) => n.id !== id);
    });
    if (deletedName) {
      logActivity('Удалено сетевое оборудование', `Удалено устройство "${deletedName}"`, 'delete');
    }
  };

  // Computers CRUD
  const returnAssetToWarehouse = (
    inventoryNumber: string,
    name: string,
    category: string,
    model: string,
    cost: number,
    targetWarehouseName: string
  ) => {
    // 1. Find if there is a warehouse item matching, stripping suffix only if needed
    setWarehouseItems(prev => {
      let baseInv = inventoryNumber;
      let existingWhIndex = prev.findIndex(w => 
        w.inventoryNumber === inventoryNumber && 
        (w.warehouseName || 'Основной склад ИТ') === targetWarehouseName
      );

      if (existingWhIndex === -1) {
        const match = inventoryNumber.match(/^(.*?)-\d+$/);
        if (match) {
          const strippedInv = match[1];
          const strippedIndex = prev.findIndex(w => 
            w.inventoryNumber === strippedInv && 
            (w.warehouseName || 'Основной склад ИТ') === targetWarehouseName
          );
          if (strippedIndex > -1) {
            existingWhIndex = strippedIndex;
            baseInv = strippedInv;
          }
        }
      }

      if (existingWhIndex > -1) {
        // Increment quantity
        return prev.map((item, idx) => 
          idx === existingWhIndex 
            ? { ...item, quantity: item.quantity + 1, status: 'В наличии' as const } 
            : item
        );
      } else {
        // Create new warehouse stock item
        let whType: WarehouseItemType = 'Другое';
        if (category === 'Ноутбук' || category === 'ПК') whType = 'Компьютеры';
        else if (category === 'Монитор' || category === 'Периферия') whType = 'Периферия';
        else if (category === 'Оргтехника') whType = 'Оргтехника';
        else if (category === 'Видеонаблюдение') whType = 'Видеонаблюдение';
        else if (category === 'Расходники') whType = 'Расходные материалы';

        const newWhItem: WarehouseItem = {
          id: `wh-item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: name,
          type: whType,
          model: model,
          inventoryNumber: baseInv,
          quantity: 1,
          unit: 'шт.',
          costPerUnit: cost || 0,
          status: 'В наличии',
          warehouseName: targetWarehouseName
        };
        return [...prev, newWhItem];
      }
    });
  };

  const handleReturnToWarehouse = (itemSource: 'computer' | 'network', itemId: string) => {
    const targetWhName = warehouses[0]?.name || 'Основной склад ИТ';
    handleReturnActiveAssetToWarehouse(itemSource, itemId, targetWhName);
  };

  const handleReturnActiveAssetToWarehouse = (
    itemSource: 'computer' | 'network',
    itemId: string,
    targetWarehouseName: string
  ) => {
    if (checkLicenseBlocked()) return;

    const targetWhName = targetWarehouseName || warehouses[0]?.name || 'Основной склад ИТ';
    const linkedWarehouse = warehouses.find(w => w.name === targetWhName);
    const defaultObjectName = linkedWarehouse?.objectName || objects[0]?.name || 'Главный офис';

    if (itemSource === 'computer') {
      const comp = computers.find(c => c.id === itemId);
      if (!comp) return;

      // 1. Put back as "На складе" (on stock) instead of removing
      setComputers(prev => prev.map(c => {
        if (c.id === itemId) {
          return {
            ...c,
            status: 'На складе',
            employeeName: 'Склад ИТ',
            objectName: defaultObjectName
          };
        }
        return c;
      }));

      // 2. Return to warehouse stock
      returnAssetToWarehouse(
        comp.inventoryNumber,
        comp.deviceType || comp.category,
        comp.category,
        comp.model,
        comp.cost || 0,
        targetWhName
      );

      logActivity(
        'Возврат на склад', 
        `Оборудование "${comp.category} ${comp.model}" (Инв. № ${comp.inventoryNumber}) возвращено на склад "${targetWhName}" (статус изменен на "На складе")`, 
        'update'
      );
    } else {
      // Network devices
      const dev = networkDevices.find(n => n.id === itemId);
      if (!dev) return;

      // 1. Decrement quantity or move to warehouse location
      if (dev.quantity > 1) {
        setNetworkDevices(prev => prev.map(n => n.id === itemId ? { ...n, quantity: n.quantity - 1 } : n));
        
        // Also ensure there is a network device at the warehouse representing the returned quantity
        setNetworkDevices(prev => {
          const whNet = prev.find(n => n.inventoryNumber === dev.inventoryNumber && n.objectName === defaultObjectName);
          if (whNet) {
            return prev.map(n => n.id === whNet.id ? { ...n, quantity: n.quantity + 1 } : n);
          } else {
            const returnedNet: NetworkDevice = {
              ...dev,
              id: `net-wh-ret-${Date.now()}`,
              quantity: 1,
              objectName: defaultObjectName
            };
            return [...prev, returnedNet];
          }
        });
      } else {
        // Change its location/object to the warehouse's object!
        setNetworkDevices(prev => prev.map(n => n.id === itemId ? {
          ...n,
          objectName: defaultObjectName
        } : n));
      }

      // 2. Return to warehouse stock
      returnAssetToWarehouse(
        dev.inventoryNumber || 'NET-EQ',
        dev.deviceName,
        'Сетевое оборудование',
        dev.deviceName,
        dev.cost || 0,
        targetWhName
      );

      logActivity(
        'Возврат на склад', 
        `Сетевой актив "${dev.deviceName}" (Инв. № ${dev.inventoryNumber || 'NET-EQ'}) возвращен на склад "${targetWhName}"`, 
        'update'
      );
    }
  };

  const handleTransferActiveAsset = (
    itemSource: 'computer' | 'network',
    itemId: string,
    targetObjectName: string,
    targetEmployeeName?: string
  ) => {
    if (checkLicenseBlocked()) return;

    if (itemSource === 'computer') {
      const comp = computers.find(c => c.id === itemId);
      if (!comp) return;

      setComputers(prev => prev.map(c => c.id === itemId ? {
        ...c,
        objectName: targetObjectName,
        employeeName: targetEmployeeName || c.employeeName
      } : c));

      logActivity(
        'Перемещение актива', 
        `Оборудование "${comp.category} ${comp.model}" (Инв. № ${comp.inventoryNumber}) перемещено в локацию "${targetObjectName}"${targetEmployeeName ? ` (Ответственный: ${targetEmployeeName})` : ''}`, 
        'update'
      );
    } else {
      const dev = networkDevices.find(n => n.id === itemId);
      if (!dev) return;

      setNetworkDevices(prev => prev.map(n => n.id === itemId ? {
        ...n,
        objectName: targetObjectName
      } : n));

      logActivity(
        'Перемещение актива', 
        `Сетевое устройство "${dev.deviceName}" (Инв. № ${dev.inventoryNumber}) перемещено в локацию "${targetObjectName}"`, 
        'update'
      );
    }
  };

  const handleTransferWarehouseStock = (
    itemId: string,
    sourceWarehouseName: string,
    targetWarehouseName: string,
    quantity: number
  ) => {
    if (checkLicenseBlocked()) return;
    
    const sourceItem = warehouseItems.find(w => w.id === itemId);
    if (!sourceItem || sourceItem.quantity < quantity) return;

    // 1. Decrement source ware-item
    setWarehouseItems(prev => {
      let nextList = prev.map(w => {
        if (w.id === itemId) {
          return { ...w, quantity: w.quantity - quantity };
        }
        return w;
      }).filter(w => w.quantity > 0);

      // 2. Increment or add to target ware-item
      const targetIndex = nextList.findIndex(w => 
        w.inventoryNumber === sourceItem.inventoryNumber && 
        (w.warehouseName || 'Основной склад ИТ') === targetWarehouseName
      );

      if (targetIndex > -1) {
        nextList = nextList.map((w, idx) => idx === targetIndex ? {
          ...w,
          quantity: w.quantity + quantity
        } : w);
      } else {
        const newStockItem: WarehouseItem = {
          ...sourceItem,
          id: `wh-item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          quantity: quantity,
          warehouseName: targetWarehouseName
        };
        nextList.push(newStockItem);
      }

      return nextList;
    });

    logActivity(
      'Перемещение ТМЦ', 
      `Товар "${sourceItem.name}" (${quantity} шт.) перемещен со склада "${sourceWarehouseName}" на склад "${targetWarehouseName}"`, 
      'update'
    );
  };

  const handleAddComputer = (comp: Omit<ComputerItem, 'id'>) => {
    if (checkLicenseBlocked()) return;
    const newComputer: ComputerItem = {
      ...comp,
      id: `comp-${Date.now()}`,
    };
    setComputers(prev => [...prev, newComputer]);
    logActivity(
      'Добавлен компьютер',
      `Добавлено устройство "${comp.category} ${comp.model}" (инв. № ${comp.inventoryNumber})`,
      'create'
    );
  };

  const handleEditComputer = (id: string, comp: Omit<ComputerItem, 'id'>) => {
    if (checkLicenseBlocked()) return;

    if (comp.status === 'На складе') {
      const targetWarehouse = warehouses.find(w => w.objectName === comp.objectName)?.name || 'Основной склад ИТ';
      returnAssetToWarehouse(
        comp.inventoryNumber,
        comp.deviceType || comp.category,
        comp.category,
        comp.model,
        comp.cost || 0,
        targetWarehouse
      );
      setComputers(prev => prev.filter(c => c.id !== id));
      logActivity(
        'Возврат на склад', 
        `Оборудование "${comp.category} ${comp.model}" (Инв. № ${comp.inventoryNumber}) возвращено на склад "${targetWarehouse}" через смену статуса`, 
        'update'
      );
    } else {
      setComputers(prev => prev.map(c => c.id === id ? { ...c, ...comp, model: limitEquipmentTitle(comp.model.trim()) } : c));
      logActivity('Изменен статус ПК', `Параметры "${comp.category} ${comp.model}" изменены (Статус: ${comp.status})`, 'update');
    }
  };

  const handleDeleteComputer = (id: string) => {
    if (checkLicenseBlocked()) return;
    const target = computers.find(c => c.id === id);
    if (!target) return;
    setComputers(prev => prev.filter(c => c.id !== id));
    logActivity('Удален компьютер', `Удалена карточка "${target.category} ${target.model}"`, 'delete');
  };

  // Software CRUD
  const handleAddSoftware = (soft: Omit<SoftwareItem, 'id'>) => {
    if (checkLicenseBlocked()) return;
    const newSoft: SoftwareItem = {
      ...soft,
      id: `soft-${Date.now()}`,
    };
    setSoftwareItems(prev => [...prev, newSoft]);
    logActivity('Добавлено ПО', `Добавлена программа "${soft.name} (v${soft.version})" [${soft.category}]`, 'create');
  };

  const handleEditSoftware = (id: string, soft: Omit<SoftwareItem, 'id'>) => {
    if (checkLicenseBlocked()) return;
    setSoftwareItems(prev => prev.map(s => s.id === id ? { ...s, ...soft } : s));
    logActivity('Изменено ПО', `Параметры ПО "${soft.name}" обновлены`, 'update');
  };

  const handleDeleteSoftware = (id: string) => {
    if (checkLicenseBlocked()) return;
    let deletedName: string | null = null;
    setSoftwareItems((prev) => {
      const target = prev.find((s) => s.id === id);
      if (!target) return prev;
      deletedName = target.name;
      return prev.filter((s) => s.id !== id);
    });
    if (deletedName) {
      logActivity('Удалено ПО', `Удалена карточка ПО "${deletedName}"`, 'delete');
    }
  };

  const handleReturnSoftwareToWarehouse = (id: string) => {
    if (checkLicenseBlocked()) return;
    const soft = softwareItems.find((s) => s.id === id);
    if (!soft) return;

    const targetWhName = warehouses[0]?.name || 'Основной склад ИТ';
    const defaultObjectName =
      warehouses.find((w) => w.name === targetWhName)?.objectName || objects[0]?.name || 'Главный офис';
    const inv = `SW-${soft.id.slice(-8).toUpperCase()}`;

    setSoftwareItems((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: 'Не активирована',
              assignedEmployeeName: 'Свободная лицензия',
              assignedDeviceId: undefined,
              objectName: defaultObjectName,
            }
          : s
      )
    );

    setWarehouseItems((prev) => {
      const existing = prev.find(
        (w) =>
          w.inventoryNumber === inv &&
          (w.warehouseName || 'Основной склад ИТ') === targetWhName
      );
      if (existing) {
        return prev.map((w) =>
          w.id === existing.id ? { ...w, quantity: w.quantity + 1, status: 'В наличии' as const } : w
        );
      }
      return [
        ...prev,
        {
          id: `wh-sw-${Date.now()}`,
          name: soft.name,
          type: 'Лицензии ПО' as const,
          model: soft.version || soft.name,
          inventoryNumber: inv,
          quantity: 1,
          unit: 'шт.',
          costPerUnit: 0,
          status: 'В наличии' as const,
          warehouseName: targetWhName,
        },
      ];
    });

    logActivity(
      'Возврат на склад',
      `ПО «${soft.name}» возвращено на склад «${targetWhName}»`,
      'update'
    );
  };

  // Employees CRUD
  const handleAddEmployee = (name: string, position: string, department: string, status?: EmployeeStatus, objectName?: string, email?: string, phone?: string) => {
    if (checkLicenseBlocked()) return;
    const newEmp: EmployeeItem = {
      id: `emp-${Date.now()}`,
      name,
      position,
      department,
      status: status || 'Работает',
      objectName,
      email,
      phone,
    };
    setEmployees(prev => [...prev, newEmp]);
    logActivity('Добавлен сотрудник', `Добавлен новый профиль сотрудника "${name}" (${position})${objectName ? ` на объект "${objectName}"` : ''}`, 'create');
  };

  const handleEditEmployee = (id: string, name: string, position: string, department: string, status?: EmployeeStatus, objectName?: string, email?: string, phone?: string) => {
    if (checkLicenseBlocked()) return;
    const target = employees.find(e => e.id === id);
    if (target && target.name !== name) {
      // Renaming employee changes the link in computer inventory items
      setComputers(prev => prev.map(c => c.employeeName === target.name ? { ...c, employeeName: name } : c));
    }
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, name, position, department, status: status || e.status || 'Работает', objectName, email, phone } : e));
    logActivity('Изменен профиль сотрудника', `Обновлены данные о сотруднике "${name}"`, 'update');
  };

  const handleTransferEmployeeEquipment = (sourceEmployeeName: string, targetEmployeeName: string) => {
    if (checkLicenseBlocked()) return;
    setComputers(prev => prev.map(c => {
      if (c.employeeName === sourceEmployeeName) {
        return {
          ...c,
          employeeName: targetEmployeeName,
          status: targetEmployeeName === 'Склад ИТ' ? 'На складе' : c.status
        };
      }
      return c;
    }));
    const destName = targetEmployeeName === 'Склад ИТ' ? 'Склад ИТ (в запас)' : `сотруднику "${targetEmployeeName}"`;
    logActivity('Перемещение оборудования', `Все оборудование сотрудника "${sourceEmployeeName}" передано на ${destName}`, 'update');
  };

  const handleDeleteEmployee = (id: string) => {
    if (checkLicenseBlocked()) return;
    const target = employees.find(e => e.id === id);
    if (!target) return;
    setEmployees(prev => prev.filter(e => e.id !== id));
    logActivity('Удален сотрудник', `Удален сотрудник "${target.name}" из штата`, 'delete');
  };

   // Warehouse CRUD and Transactions
  const handleWarehouseReceipt = (item: Omit<WarehouseItem, 'id' | 'status'> & {
    serialNumber?: string;
    cpuModel?: string;
    ramModel?: string;
    hddModel?: string;
    gpuModel?: string;
    motherboardModel?: string;
    powerSupplyModel?: string;
    caseModel?: string;
  }) => {
    if (checkLicenseBlocked()) return;

    const normalizedItem = {
      ...item,
      name: limitEquipmentTitle(item.name.trim()),
      model: limitEquipmentTitle(item.model.trim()),
    };
    const receiptSpecs = getWarehouseItemSpecs(normalizedItem);
    
    // 1. Add to warehouse array
    const existingIndex = warehouseItems.findIndex(w => w.inventoryNumber === normalizedItem.inventoryNumber);
    if (existingIndex > -1) {
      setWarehouseItems(prev => prev.map((w, index) => 
        index === existingIndex 
          ? { 
              ...w, 
              quantity: w.quantity + normalizedItem.quantity,
              invoiceInfo: normalizedItem.invoiceInfo || w.invoiceInfo,
              memoInfo: normalizedItem.memoInfo || w.memoInfo,
              warrantyInfo: normalizedItem.warrantyInfo || w.warrantyInfo,
              warehouseName: normalizedItem.warehouseName || w.warehouseName,
              pdfFiles: [...(w.pdfFiles || []), ...(normalizedItem.pdfFiles || [])].filter((f, idx, self) => self.findIndex(file => file.name === f.name) === idx),
              serialNumber: normalizedItem.serialNumber || w.serialNumber,
              cpuModel: normalizedItem.cpuModel || w.cpuModel,
              ramModel: normalizedItem.ramModel || w.ramModel,
              hddModel: normalizedItem.hddModel || w.hddModel,
              gpuModel: normalizedItem.gpuModel || w.gpuModel,
              motherboardModel: normalizedItem.motherboardModel || w.motherboardModel,
              powerSupplyModel: normalizedItem.powerSupplyModel || w.powerSupplyModel,
              caseModel: normalizedItem.caseModel || w.caseModel,
            }
          : w
      ));
      logActivity('Пополнение запасов', `Пополнение склада: добавлено +${normalizedItem.quantity} шт. для "${normalizedItem.name}"`, 'update');
    } else {
      const newStock: WarehouseItem = {
        name: normalizedItem.name,
        type: normalizedItem.type,
        model: normalizedItem.model,
        inventoryNumber: normalizedItem.inventoryNumber,
        quantity: normalizedItem.quantity,
        unit: normalizedItem.unit,
        costPerUnit: normalizedItem.costPerUnit,
        invoiceInfo: normalizedItem.invoiceInfo,
        memoInfo: normalizedItem.memoInfo,
        warrantyInfo: normalizedItem.warrantyInfo,
        warehouseName: normalizedItem.warehouseName,
        pdfFiles: normalizedItem.pdfFiles,
        id: `wh-${Date.now()}`,
        status: 'В наличии',
        deviceType: normalizedItem.deviceType,
        ...receiptSpecs,
      };
      setWarehouseItems(prev => [...prev, newStock]);
      logActivity('Поступление ТМЦ', `Принят на баланс склада товар "${normalizedItem.name}" в количестве ${normalizedItem.quantity} ${normalizedItem.unit}`, 'create');
    }

    // 2. Automatically distribute to computers or network catalogs!
    const targetWhName = normalizedItem.warehouseName;
    const linkedWarehouse = warehouses.find(w => w.name === targetWhName);
    const defaultObjectName = linkedWarehouse?.objectName || objects[0]?.name || 'Главный офис';
    
    if (normalizedItem.type === 'Сетевое оборудование') {
      const newNet: NetworkDevice = {
        id: `net-wh-${Date.now()}`,
        deviceName: normalizedItem.name,
        type: resolveNetworkDeviceType({ deviceType: normalizedItem.deviceType, name: normalizedItem.name }),
        objectName: defaultObjectName,
        ipAddress: '192.168.1.1',
        quantity: normalizedItem.quantity,
        inventoryNumber: normalizedItem.inventoryNumber,
        portsCount: 24,
        workingPorts: Array.from({ length: 24 }, (_, i) => i + 1),
        damagedPorts: [],
        pdfFiles: normalizedItem.pdfFiles || [],
        invoiceInfo: normalizedItem.invoiceInfo || '',
        memoInfo: normalizedItem.memoInfo || '',
        warrantyInfo: normalizedItem.warrantyInfo || '',
        cost: normalizedItem.costPerUnit,
      };
      setNetworkDevices(prev => [...prev, newNet]);
      logActivity('Авто-распределение ТМЦ', `Устройство "${normalizedItem.name}" автоматически распределено в Сетевое оборудование`, 'system');
    } else {
      const route = resolveWarehouseComputerRoute(normalizedItem);
      if (!route) return;

      const { category, deviceType, equipmentTab } = route;

      // Since each non-network asset card is tracked as a single asset on ComputersView, we generate individual assets so they can be assigned to different employees!
      const newComputersToAppend: ComputerItem[] = [];
      for (let i = 0; i < normalizedItem.quantity; i++) {
        const suffix = normalizedItem.quantity > 1 ? `-${i + 1}` : '';
        const invNum = `${normalizedItem.inventoryNumber}${suffix}`;
        const unitSpecs = buildComputerSpecsFromReceipt(receiptSpecs, i, normalizedItem.quantity);
        
        const newAsset: ComputerItem = {
          id: `comp-wh-${Date.now()}-${i}-${Math.floor(Math.random() * 10000)}`,
          category,
          deviceType,
          model: normalizedItem.model,
          inventoryNumber: invNum,
          employeeName: 'Склад ИТ',
          status: 'На складе',
          objectName: defaultObjectName,
          pdfFiles: normalizedItem.pdfFiles || [],
          invoiceInfo: normalizedItem.invoiceInfo || '',
          memoInfo: normalizedItem.memoInfo || '',
          warrantyInfo: normalizedItem.warrantyInfo || '',
          cost: normalizedItem.costPerUnit,
          ...unitSpecs,
        };
        newComputersToAppend.push(newAsset);
      }

      setComputers(prev => [...prev, ...newComputersToAppend]);
      logActivity(
        'Авто-распределение ТМЦ',
        `Товар "${normalizedItem.name}" (${normalizedItem.quantity} шт.) добавлен в группу «${equipmentTabLabel(equipmentTab)}» со статусом «На складе»`,
        'system'
      );
    }
  };

  const handleWarehouseWriteOff = (
    inventoryNumber: string, 
    quantityToWriteOff: number, 
    reason?: string, 
    technicalPdf?: { name: string; size?: string; content?: string }
  ): boolean => {
    if (checkLicenseBlocked()) return false;
    const targetItem = warehouseItems.find(item => item.inventoryNumber === inventoryNumber);
    if (!targetItem || targetItem.quantity < quantityToWriteOff) return false;

    // 1. Create a Write-Off history record to persist in history log!
    const newWriteOffRecord: WarehouseWriteOff = {
      id: `wo-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      inventoryNumber,
      name: targetItem.name,
      type: targetItem.type,
      model: targetItem.model,
      quantity: quantityToWriteOff,
      unit: targetItem.unit,
      costPerUnit: targetItem.costPerUnit,
      reason: reason || 'Списание по причине неисправности/амортизации',
      date: new Date().toISOString().split('T')[0],
      pdfFile: technicalPdf,
      warehouseName: targetItem.warehouseName || 'Основной склад ИТ'
    };
    
    setWarehouseWriteOffs(prev => [newWriteOffRecord, ...prev]);

    // 2. Reduce stock or delete/mark written off
    setWarehouseItems(prev => {
      return prev.map(item => {
        if (item.inventoryNumber === inventoryNumber) {
          const newQty = item.quantity - quantityToWriteOff;
          return {
            ...item,
            quantity: newQty,
            status: newQty === 0 ? 'Списано' : 'В наличии'
          };
        }
        return item;
      }).filter(item => item.quantity > 0); // Keep stock positive
    });

    // 3. Cascade write-off from groups
    if (targetItem.type === 'Сетевое оборудование') {
      setNetworkDevices(prev => {
        let remaining = quantityToWriteOff;
        return prev.map(dev => {
          if (dev.inventoryNumber === inventoryNumber && remaining > 0) {
            const subtract = Math.min(dev.quantity || 1, remaining);
            remaining -= subtract;
            return {
              ...dev,
              quantity: (dev.quantity || 1) - subtract
            };
          }
          return dev;
        }).filter(dev => (dev.quantity || 0) > 0);
      });
    } else {
      setComputers(prev => {
        let countRemoved = 0;
        // Identify individual computer items associated with this inventory number
        const matchingIdle = prev.filter(c => 
          matchesBaseInventoryNumber(c.inventoryNumber, inventoryNumber)
          && c.status === 'На складе'
        );
        const matchingActive = prev.filter(c => 
          matchesBaseInventoryNumber(c.inventoryNumber, inventoryNumber)
          && c.status !== 'На складе'
        );

        const idsToRemove = new Set<string>();
        for (const comp of matchingIdle) {
          if (countRemoved < quantityToWriteOff) {
            idsToRemove.add(comp.id);
            countRemoved++;
          }
        }
        for (const comp of matchingActive) {
          if (countRemoved < quantityToWriteOff) {
            idsToRemove.add(comp.id);
            countRemoved++;
          }
        }

        return prev.filter(c => !idsToRemove.has(c.id));
      });
    }

    logActivity('Списание ТМЦ', `Со склада списано ${quantityToWriteOff} ${targetItem.unit} для устройства "${targetItem.name}" (изменения каскадированы во все группы ТМЦ)`, 'delete');
    return true;
  };

  const handleDeployWarehouseAsset = (
    inventoryNumber: string, 
    quantity: number, 
    targetEmployeeName: string, 
    targetObjectName: string
  ): boolean => {
    if (checkLicenseBlocked()) return false;
    
    // 1. Check if we have enough on stock in warehouseItems
    const whItem = warehouseItems.find(item => item.inventoryNumber === inventoryNumber);
    if (!whItem || whItem.quantity < quantity) return false;

    // 2. Reduce the quantity from warehouseItems balances
    setWarehouseItems(prev => {
      return prev.map(item => {
        if (item.inventoryNumber === inventoryNumber) {
          const newQty = item.quantity - quantity;
          return {
            ...item,
            quantity: newQty,
            status: newQty === 0 ? 'Списано' : 'В наличии'
          };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });

    // 3. Update the matching active assets in computers or network catalogues
    const isNetwork = whItem.type === 'Сетевое оборудование';
    let success = false;

    if (isNetwork) {
      const matchingNetwork = networkDevices.find(nd => nd.inventoryNumber === inventoryNumber);
      if (matchingNetwork) {
        if (quantity >= matchingNetwork.quantity) {
          setNetworkDevices(prev => prev.map(nd => nd.id === matchingNetwork.id ? {
            ...nd,
            objectName: targetObjectName,
            cost: nd.cost || whItem.costPerUnit,
          } : nd));
        } else {
          // split
          setNetworkDevices(prev => {
            const splitItem = {
              ...matchingNetwork,
              id: `net-deploy-${Date.now()}`,
              quantity: quantity,
              objectName: targetObjectName,
              cost: matchingNetwork.cost || whItem.costPerUnit,
            };
            return [
              ...prev.map(nd => nd.id === matchingNetwork.id ? { ...nd, quantity: nd.quantity - quantity } : nd),
              splitItem
            ];
          });
        }
        success = true;
      } else {
        // Create new network device dynamically
        const newNet: NetworkDevice = {
          id: `net-deploy-${Date.now()}`,
          deviceName: whItem.name,
          type: resolveNetworkDeviceType({ deviceType: whItem.deviceType, name: whItem.name }),
          objectName: targetObjectName,
          ipAddress: '192.168.1.1',
          quantity: quantity,
          inventoryNumber: whItem.inventoryNumber,
          portsCount: 24,
          workingPorts: Array.from({ length: 24 }, (_, i) => i + 1),
          damagedPorts: [],
          pdfFiles: whItem.pdfFiles || [],
          invoiceInfo: whItem.invoiceInfo || '',
          memoInfo: whItem.memoInfo || '',
          warrantyInfo: whItem.warrantyInfo || '',
          cost: whItem.costPerUnit,
        };
        setNetworkDevices(prev => [...prev, newNet]);
        success = true;
      }
    } else {
      // Find matching items currently "На складе" (on-stock)
      const matchingCompsOnStock = computers.filter(c => 
        matchesBaseInventoryNumber(c.inventoryNumber, inventoryNumber)
        && c.status === 'На складе'
      );

      const countToDeployFromStock = Math.min(matchingCompsOnStock.length, quantity);
      const remainingToCreate = quantity - countToDeployFromStock;

      const idsToDeploy = countToDeployFromStock > 0 
        ? matchingCompsOnStock.slice(0, countToDeployFromStock).map(c => c.id) 
        : [];

      setComputers(prev => {
        let updated = prev.map(c => {
          if (idsToDeploy.includes(c.id)) {
            return {
              ...c,
              status: 'В работе' as const,
              employeeName: targetEmployeeName,
              objectName: targetObjectName,
              cost: c.cost || whItem.costPerUnit
            };
          }
          return c;
        });

        if (remainingToCreate > 0) {
          const route = resolveWarehouseComputerRoute(whItem);
          if (!route) return updated;

          const { category, deviceType } = route;
          const whSpecs = getWarehouseItemSpecs(whItem);
          const templateSpecs =
            matchingCompsOnStock.find((c) => c.cpuModel || c.ramModel || c.serialNumber) || null;

          const newCompsToAppend: ComputerItem[] = [];
          for (let i = 0; i < remainingToCreate; i++) {
            const suffixesCount = prev.filter(c =>
              c.inventoryNumber?.startsWith(`${inventoryNumber}-`)
            ).length;
            const suffix = (quantity > 1 || suffixesCount > 0) ? `-${suffixesCount + i + 1}` : '';
            const invNum = `${inventoryNumber}${suffix}`;
            const unitSpecs = buildComputerSpecsFromReceipt(
              templateSpecs
                ? {
                    serialNumber: templateSpecs.serialNumber,
                    cpuModel: templateSpecs.cpuModel,
                    ramModel: templateSpecs.ramModel,
                    hddModel: templateSpecs.hddModel,
                    gpuModel: templateSpecs.gpuModel,
                    motherboardModel: templateSpecs.motherboardModel,
                    powerSupplyModel: templateSpecs.powerSupplyModel,
                    caseModel: templateSpecs.caseModel,
                  }
                : whSpecs,
              suffixesCount + i,
              Math.max(quantity, suffixesCount + remainingToCreate)
            );

            const newAsset: ComputerItem = {
              id: `comp-deploy-${Date.now()}-${i}-${Math.floor(Math.random() * 10000)}`,
              category,
              deviceType,
              model: whItem.model,
              inventoryNumber: invNum,
              employeeName: targetEmployeeName,
              status: 'В работе',
              objectName: targetObjectName,
              pdfFiles: whItem.pdfFiles || [],
              invoiceInfo: whItem.invoiceInfo || '',
              memoInfo: whItem.memoInfo || '',
              warrantyInfo: whItem.warrantyInfo || '',
              cost: whItem.costPerUnit,
              ...unitSpecs,
            };
            newCompsToAppend.push(newAsset);
          }
          return [...updated, ...newCompsToAppend];
        }

        return updated;
      });

      success = true;
    }

    if (success) {
      logActivity(
        'Выдача со склада', 
        `Артикул "${whItem.name}" (${quantity} шт.) успешно выдан со склада и прикреплен к объекту "${targetObjectName}" закреплен за "${targetEmployeeName || 'Общего пользования'}"`, 
        'update'
      );
      return true;
    }
    return false;
  };

  const handleDeleteWarehouseItem = (id: string) => {
    if (checkLicenseBlocked()) return;
    const target = warehouseItems.find(w => w.id === id);
    if (!target) return;

    setWarehouseItems(prev => prev.filter(w => w.id !== id));
    logActivity('Удален артикул', `Со склада удалена карточка товара "${target.name}"`, 'delete');

    setComputers(prev => prev.filter(c => isNotLinkedToInventoryBase(c.inventoryNumber, target.inventoryNumber)));
    setNetworkDevices(prev => prev.filter(nd => isNotLinkedToInventoryBase(nd.inventoryNumber, target.inventoryNumber)));

    setSelectedDetail(prev => {
      if (!prev) return null;
      if (prev.type === 'warehouse' && prev.id === id) return null;
      if (prev.type === 'computer') {
        const comp = computers.find(c => c.id === prev.id);
        if (comp && matchesBaseInventoryNumber(comp.inventoryNumber, target.inventoryNumber)) return null;
      }
      if (prev.type === 'network') {
        const dev = networkDevices.find(n => n.id === prev.id);
        if (dev && matchesBaseInventoryNumber(dev.inventoryNumber, target.inventoryNumber)) return null;
      }
      return prev;
    });

    logActivity('Каскадное удаление', `Каскадно удалены связанные активные карточки оборудования с инвентарным номером "${target.inventoryNumber}"`, 'system');
  };

  const handleDeleteWarehouseWriteOff = (id: string) => {
    if (checkLicenseBlocked()) return;
    const target = warehouseWriteOffs.find(wo => wo.id === id);
    if (!target) return;
    setWarehouseWriteOffs(prev => prev.filter(wo => wo.id !== id));
    logActivity('Удалено списание ТМЦ', `Из истории списаний удалено списание товара "${target.name}" (Инв. номер: ${target.inventoryNumber})`, 'delete');
  };

  // Audits logs handlers
  const handleAddAudit = (
    title: string, 
    responsibleUser: string, 
    objectName?: string, 
    controllerUser?: string, 
    conductorUser?: string,
    startNotes?: string,
    startPdf?: { name: string; size: string; content: string }
  ) => {
    if (checkLicenseBlocked()) return;
    const newAudit: InventoryAudit = {
      id: `aud-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      title,
      status: 'В процессе',
      responsibleUser,
      itemsAudited: 0,
      mismatchesFound: 0,
      objectName,
      controllerUser,
      conductorUser,
      startNotes,
      pdfFiles: startPdf ? [startPdf] : [],
    };
    setAudits(prev => [newAudit, ...prev]);
    logActivity('Запущен аудит', `Начата инвентаризационная проверка "${title}" (Объект: ${objectName || 'Все'})`, 'create');
  };

  const handleCompleteAudit = (
    id: string, 
    mismatches: number, 
    conclusionNotes?: string,
    conclusionPdf?: { name: string; size: string; content: string }
  ) => {
    if (checkLicenseBlocked()) return;
    setAudits(prev => prev.map(audit => {
      if (audit.id === id) {
        const existingPdfs = audit.pdfFiles || [];
        return {
          ...audit,
          status: 'Завершена',
          itemsAudited: computers.length + networkDevices.length,
          mismatchesFound: mismatches,
          conclusionNotes,
          pdfFiles: conclusionPdf ? [...existingPdfs, conclusionPdf] : existingPdfs,
        };
      }
      return audit;
    }));
    logActivity('Аудит завершен', `Успешно завершена инвентаризация ID: ${id}. Выявлено ${mismatches} расхождений.`, 'system');
  };

  const handleDeleteAudit = (id: string) => {
    if (checkLicenseBlocked()) return;
    const target = audits.find(a => a.id === id);
    if (!target) return;
    setAudits(prev => prev.filter(a => a.id !== id));
    logActivity('Удалена инвентаризация', `Из базы удалена инвентаризационная проверка "${target.title}" (ID: ${id})`, 'delete');
  };

  // Log Clearer
  const handleClearActivities = () => {
    setActivities([]);
    localStorage.removeItem('it_activities');
  };

  // Data Resetter
  const handleResetAllData = () => {
    setObjects(initialObjects);
    setNetworkDevices(initialNetworkDevices);
    setComputers(initialComputers);
    setEmployees(initialEmployees);
    setWarehouseItems(initialWarehouseItems);
    setActivities(initialActivities);
    setAudits(initialAudits);
    setWorkspaceName('Инвентаризация оборудования');
    setAdminEmail('vicariustab@icloud.com');
    localStorage.removeItem('it_deleted_warranties');
    localStorage.removeItem('it_custom_warranties');
    logActivity('Сброс Базы Данных', 'База данных рабочей зоны была успешно переустановлена к заводским демонстрационным значениям', 'system');
  };

  // 3. Rendering correct active views based on Tab ID
  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            objects={objects}
            networkDevices={networkDevices}
            computers={computers}
            employees={employees}
            warehouseItems={warehouseItems}
            softwareItems={softwareItems}
            onNavigate={(id) => setActiveTab(id)}
            onAddObject={() => { setActiveTab('objects'); }}
            onAddNetwork={() => { setActiveTab('warehouse'); }}
            onAddComputer={() => { setActiveTab('warehouse'); }}
            onAddEmployee={() => { setActiveTab('employees'); }}
            onWarehouseReceipt={() => { setActiveTab('warehouse'); }}
            onWarehouseWriteOff={() => { setActiveTab('warehouse'); }}
            onViewDetails={handleNavigateDetail}
          />
        );
      case 'objects':
        return (
          <ObjectsView
            objects={objects}
            networkDevices={networkDevices}
            computers={computers}
            onAdd={handleAddObject}
            onEdit={handleEditObject}
            onDelete={handleDeleteObject}
            onViewDetails={handleNavigateDetail}
            currentUser={currentUser}
          />
        );
      case 'network':
        return (
          <NetworkView
            networkDevices={networkDevices}
            objects={objects}
            warehouseItems={warehouseItems}
            warehouses={warehouses}
            onAdd={handleAddNetwork}
            onEdit={handleEditNetwork}
            onDelete={handleDeleteNetwork}
            onReturnToWarehouse={(id) => handleReturnToWarehouse('network', id)}
            onViewDetails={handleNavigateDetail}
            currentUser={currentUser}
            allowDirectAdd
          />
        );
      case 'computers':
        return (
          <ComputersView
            computers={filterComputersByEquipmentTab(computers, 'computers')}
            employees={employees}
            objects={objects}
            allComputers={computers}
            onAdd={handleAddComputer}
            onEdit={handleEditComputer}
            onReturnToWarehouse={(id) => handleReturnToWarehouse('computer', id)}
            onViewDetails={handleNavigateDetail}
            currentUser={currentUser}
            equipmentTab="computers"
          />
        );
      case 'employees':
        return (
          <EmployeesView
            employees={employees}
            computers={computers}
            objects={objects}
            onAdd={handleAddEmployee}
            onEdit={handleEditEmployee}
            onDelete={handleDeleteEmployee}
            onViewDetails={handleNavigateDetail}
            currentUser={currentUser}
            onTransferEquipment={handleTransferEmployeeEquipment}
          />
        );
      case 'warehouse':
        return (
          <WarehouseView
            warehouseItems={warehouseItems}
            onReceipt={handleWarehouseReceipt}
            onWriteOff={handleWarehouseWriteOff}
            onDelete={handleDeleteWarehouseItem}
            onDeleteWriteOff={handleDeleteWarehouseWriteOff}
            onViewDetails={handleNavigateDetail}
            currentUser={currentUser}
            warehouses={warehouses}
            setWarehouses={setWarehouses}
            warehouseWriteOffs={warehouseWriteOffs}
            objects={objects}
            employees={employees}
            computers={computers}
            networkDevices={networkDevices}
            softwareItems={softwareItems}
            onDeployAsset={handleDeployWarehouseAsset}
            onReturnActiveAssetToWarehouse={handleReturnActiveAssetToWarehouse}
            onTransferActiveAsset={handleTransferActiveAsset}
            onTransferWarehouseStock={handleTransferWarehouseStock}
          />
        );
      case 'inventory':
        return (
          <AuditsView
            audits={audits}
            onAddAudit={handleAddAudit}
            onCompleteAudit={handleCompleteAudit}
            onDeleteAudit={handleDeleteAudit}
            currentUser={currentUser}
            objects={objects}
            employees={employees}
            workspaceName={workspaceName}
            computers={computers}
            networkDevices={networkDevices}
          />
        );
      case 'warranties':
        return (
          <WarrantiesView
            computers={computers}
            networkDevices={networkDevices}
            currentUser={currentUser}
          />
        );
      case 'reports':
        return (
          <ReportsView
            computers={computers}
            networkDevices={networkDevices}
            warehouseItems={warehouseItems}
            objects={objects}
          />
        );
      case 'activity_log':
        return (
          <ActivityLogView
            activities={activities}
            onClear={handleClearActivities}
            currentUser={currentUser}
          />
        );
      case 'security':
        return (
          <SecurityView
            objects={objects}
            networkDevices={networkDevices}
            computers={computers}
            employees={employees}
            warehouseItems={warehouseItems}
            activities={activities}
            users={users}
            currentUser={currentUser}
            onUpdateUser={handleUpdateUser}
            onLogActivity={logActivity}
            onUpdateComputer={(id, fields) => setComputers(prev => prev.map(c => c.id === id ? { ...c, ...fields } : c))}
          />
        );
      case 'settings':
        return (
          <SettingsView
            onResetData={handleResetAllData}
            workspaceName={workspaceName}
            setWorkspaceName={setWorkspaceName}
            adminEmail={adminEmail}
            setAdminEmail={setAdminEmail}
            publicUrl={publicUrl}
            setPublicUrl={setPublicUrl}
            users={users}
            currentUser={currentUser}
            onAddUser={handleAddUser}
            onDeleteUser={handleDeleteUser}
            onUpdateUser={handleUpdateUser}
            tabIcons={tabIcons}
            setTabIcons={setTabIcons}
            panelLogo={panelLogo}
            setPanelLogo={setPanelLogo}
            panelColor={panelColor}
            setPanelColor={setPanelColor}
            onUpdateCurrentUserAvatar={handleUpdateUserAvatar}
            siteFavicon={siteFavicon}
            setSiteFavicon={setSiteFavicon}
            siteLogo={siteLogo}
            setSiteLogo={setSiteLogo}
            sidebarBgColor={sidebarBgColor}
            setSidebarBgColor={setSidebarBgColor}
            sidebarOpacity={sidebarOpacity}
            setSidebarOpacity={setSidebarOpacity}
            licenseStatus={licenseStatus}
            onActivate={handleActivateLicense}
            onDeactivate={handleDeactivateLicense}
            onRefreshLicense={() => setLicenseStatus(getLicenseStatus())}
            onLogActivity={logActivity}
          />
        );
      // Fallback categories inside "Оборудование" dropdown
      case 'peripherals':
        return (
          <ComputersView
            computers={filterComputersByEquipmentTab(computers, 'peripherals')}
            employees={employees}
            objects={objects}
            allComputers={computers}
            onAdd={handleAddComputer}
            onEdit={handleEditComputer}
            onReturnToWarehouse={(id) => handleReturnToWarehouse('computer', id)}
            onViewDetails={handleNavigateDetail}
            addButtonLabel="Добавить Периферию"
            addModalTitle="Добавить Периферию"
            currentUser={currentUser}
            defaultCategory="Периферия"
            defaultDeviceType="Клавиатура"
            equipmentTab="peripherals"
          />
        );
      case 'orgtech':
        return (
          <ComputersView
            computers={filterComputersByEquipmentTab(computers, 'orgtech')}
            employees={employees}
            objects={objects}
            allComputers={computers}
            onAdd={handleAddComputer}
            onEdit={handleEditComputer}
            onReturnToWarehouse={(id) => handleReturnToWarehouse('computer', id)}
            onViewDetails={handleNavigateDetail}
            addButtonLabel="Добавить Оргтехнику"
            addModalTitle="Добавить Оргтехнику"
            currentUser={currentUser}
            defaultCategory="Оргтехника"
            defaultDeviceType="Принтер"
            equipmentTab="orgtech"
          />
        );
      case 'surveillance':
        return (
          <ComputersView
            computers={filterComputersByEquipmentTab(computers, 'surveillance')}
            employees={employees}
            objects={objects}
            allComputers={computers}
            onAdd={handleAddComputer}
            onEdit={handleEditComputer}
            onReturnToWarehouse={(id) => handleReturnToWarehouse('computer', id)}
            onViewDetails={handleNavigateDetail}
            addButtonLabel="Добавить Видеооборудование"
            addModalTitle="Добавить Видеооборудование"
            currentUser={currentUser}
            defaultCategory="Видеонаблюдение"
            defaultDeviceType="Видеокамера"
            equipmentTab="surveillance"
          />
        );
      case 'consumables':
        return (
          <ComputersView
            computers={filterComputersByEquipmentTab(computers, 'consumables')}
            employees={employees}
            objects={objects}
            allComputers={computers}
            onAdd={handleAddComputer}
            onEdit={handleEditComputer}
            onReturnToWarehouse={(id) => handleReturnToWarehouse('computer', id)}
            onViewDetails={handleNavigateDetail}
            addButtonLabel="Добавить расходники"
            addModalTitle="Добавить расходники"
            currentUser={currentUser}
            defaultCategory="Расходники"
            defaultDeviceType="Картридж"
            equipmentTab="consumables"
          />
        );
      case 'other_equip':
        return (
          <ComputersView
            computers={filterComputersByEquipmentTab(computers, 'other_equip')}
            employees={employees}
            objects={objects}
            allComputers={computers}
            onAdd={handleAddComputer}
            onEdit={handleEditComputer}
            onReturnToWarehouse={(id) => handleReturnToWarehouse('computer', id)}
            onViewDetails={handleNavigateDetail}
            addButtonLabel="Добавить другое оборудование"
            addModalTitle="Добавить другое оборудование"
            currentUser={currentUser}
            defaultCategory="Другое"
            defaultDeviceType="Другое"
            equipmentTab="other_equip"
          />
        );
      case 'software':
        return (
          <SoftwareView
            softwareItems={softwareItems}
            employees={employees}
            objects={objects}
            computers={computers}
            onAdd={handleAddSoftware}
            onEdit={handleEditSoftware}
            onDelete={handleDeleteSoftware}
            onReturnToWarehouse={handleReturnSoftwareToWarehouse}
            currentUser={currentUser}
            warehouses={warehouses}
          />
        );
      default:
        return <div>В разработке</div>;
    }
  };

  // Capitalize active view title for header
  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'dashboard': return workspaceName;
      case 'objects': return t('Каталог объектов и филиалов');
      case 'network': return t('Сетевые маршрутизаторы и коммутаторы');
      case 'computers': return t('Учет компьютеров на руках');
      case 'employees': return t('Каталог корпоративных сотрудников');
      case 'warehouse': return t('Склад ИТ-оборудования и ТМЦ');
      case 'software': return t('Учет лицензий и программного обеспечения');
      case 'inventory': return t('Инвентаризационные проверки');
      case 'warranties': return t('Сроки гарантийного обслуживания');
      case 'reports': return t('Аналитическая отчетность');
      case 'activity_log': return t('Журнал операций (Аудит)');
      case 'settings': return t('Конфигурация параметров');
      case 'peripherals': return t('Учет периферии и мониторов');
      case 'orgtech': return t('Учет оргтехники');
      case 'surveillance': return t('Системы видеонаблюдения');
      case 'consumables': return t('Учет расходных материалов');
      case 'other_equip': return t('Другое неучтенное оборудование');
      default: return t('Инвентаризация оборудования');
    }
  };

  // Setup Dynamic Theme Palettes
  const COLOR_MAP: Record<string, string> = {
    blue: '#2563eb',
    emerald: '#10b981',
    purple: '#8b5cf6',
    rose: '#f43f5e',
    amber: '#d97706',
    indigo: '#4f46e5',
    slate: '#475569',
  };

  const COLOR_MAP_HOVER: Record<string, string> = {
    blue: '#1d4ed8',
    emerald: '#059669',
    purple: '#7c3aed',
    rose: '#e11d48',
    amber: '#b45309',
    indigo: '#4338ca',
    slate: '#334155',
  };

  const chosenColor = COLOR_MAP[panelColor] || '#2563eb';
  const chosenHoverColor = COLOR_MAP_HOVER[panelColor] || '#1d4ed8';

  // Check if system trial or year-license has expired (Utkin V.V. 30 days limitation engine)
  if (setupChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 text-sm font-sans">
        {t('Загрузка...')}
      </div>
    );
  }

  if (setupRequired) {
    return (
      <FirstRunSetup
        workspaceName={workspaceName}
        siteLogo={siteLogo}
        onComplete={() => {
          setSetupRequired(false);
          setSetupCompleteMessage('Учётная запись администратора создана. Войдите в систему.');
        }}
      />
    );
  }

  if (licenseStatus.isExpired) {
    const isLockedOut = licenseStatus.lockoutTimeLeft > 0;
    const lockoutSecs = Math.ceil(licenseStatus.lockoutTimeLeft / 1000);
    const licenseRequestCode = getSystemRequestCode();

    const handleCopyRequestCode = async () => {
      const ok = await copyTextToClipboard(licenseRequestCode);
      if (!ok) return;
      setRequestCodeCopied(true);
      setTimeout(() => setRequestCodeCopied(false), 2000);
    };

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans text-slate-300">
        <div className="absolute top-0 left-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        
        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
          <div className="mx-auto w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center text-rose-500 shadow-xl">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-2xl font-black tracking-tight text-white uppercase font-sans">
            {licenseStatus.isTampered ? t("ОБНАРУЖЕНО ВМЕШАТЕЛЬСТВО В СИСТЕМУ") : t("ДОСТУП К СИСТЕМЕ ПРИОСТАНОВЛЕН")}
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            {licenseStatus.isTampered 
              ? t("Несоответствие контрольной сигнатуры безопасности демо-версии.")
              : t("Ознакомительный (30 дней) или годовой период использования ПО завершен.")}
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
          <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-md py-8 px-6 sm:px-10 rounded-3xl shadow-2xl space-y-5">
            {licenseStatus.isTampered ? (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400 text-xs leading-relaxed space-y-1.5 animate-pulse">
                <p className="font-bold text-center uppercase tracking-wide flex items-center justify-center gap-1.5 text-amber-500">
                  ⚠️ {t("ОБНАРУЖЕНО ВМЕШАТЕЛЬСТВО В СИСТЕМУ")}
                </p>
                <p className="text-center">{t("Внимание! Обнаружено несанкционированное изменение локальной базы данных демо-периода. Работа системы приостановлена в целях защиты целостности данных. Пожалуйста, введите официальный лицензионный ключ для восстановления доступа.")}</p>
              </div>
            ) : (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs leading-relaxed space-y-1">
                <p className="font-bold">{t("❌ Лицензионный статус не подтвержден или срок действия исчерпан.")}</p>
                <p>{t("Для продолжения работы введите действующий лицензионный ключ активации (UTKIN-YYYY-HASH).")}</p>
              </div>
            )}

            {isLockedOut && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs leading-relaxed space-y-1">
                <p className="font-bold uppercase tracking-wider block text-center flex items-center justify-center gap-2 text-red-500">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  {t("БЛОКИРОВКА ВВОДА")}
                </p>
                <p className="text-center">
                  {t("Служба защиты временно заблокировала попытки ввода ключа из-за частых ошибок (перебор). Повторите попытку через:")}
                </p>
                <p className="text-center font-mono text-lg font-black text-rose-300 mt-1">
                  {lockoutSecs} {t("сек.")}
                </p>
              </div>
            )}

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center space-y-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">{t("Уникальный Код Запроса Лицензии")}</span>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  readOnly
                  value={licenseRequestCode}
                  onFocus={(e) => e.currentTarget.select()}
                  onClick={(e) => e.currentTarget.select()}
                  aria-label={t("Уникальный Код Запроса Лицензии")}
                  className="flex-1 min-w-0 bg-slate-900 border border-slate-800 p-2.5 rounded-xl font-mono text-xs font-semibold text-blue-400 select-all cursor-text"
                />
                <button
                  type="button"
                  onClick={handleCopyRequestCode}
                  className="text-[9px] bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 px-2.5 py-1.5 rounded-lg transition-all font-sans cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 shrink-0"
                >
                  {requestCodeCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {requestCodeCopied ? t("Скопировано") : t("Копировать")}
                </button>
              </div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (isLockedOut) return;
              const formData = new FormData(e.currentTarget);
              const keyVal = formData.get('activation_key') as string;
              if (keyVal) {
                const ok = handleActivateLicense(keyVal);
                if (!ok) {
                  const freshStatus = getLicenseStatus();
                  setLicenseStatus(freshStatus);
                  if (freshStatus.lockoutTimeLeft > 0) {
                    alert(t("Служба защиты временно заблокировала попытки ввода ключа из-за частых ошибок (перебор). Повторите попытку через:") + " " + Math.ceil(freshStatus.lockoutTimeLeft / 1000) + " " + t("сек."));
                  } else {
                    alert(t("Введен некорректный ключ активации! Обратитесь по адресу vicariustab@icloud.com за новым ключом."));
                  }
                }
              }
            }} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5 font-sans">
                  {t("Лицензионный Ключ Активации")}
                </label>
                <input
                  name="activation_key"
                  type="text"
                  required
                  disabled={isLockedOut}
                  placeholder={isLockedOut ? "OVERRIDE LOCKED" : "UTKIN-YYYY-HASH"}
                  className="block w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono font-bold uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-center disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={isLockedOut}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-xs font-bold font-sans text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all cursor-pointer shadow-lg disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
              >
                {t("Разблокировать систему")}
              </button>
            </form>

            <div className="pt-6 border-t border-slate-800/80 text-center space-y-2">
              <p className="text-xs text-slate-400 font-sans">
                {t('Для получения или покупки годовой лицензии свяжитесь по почте:')}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm">
                <a
                  href={`mailto:${COPYRIGHT_EMAIL}`}
                  className="text-blue-400 hover:text-blue-300 font-bold font-mono hover:underline"
                >
                  {COPYRIGHT_EMAIL}
                </a>
                <a
                  href={COPYRIGHT_TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 hover:text-sky-300 font-bold font-mono hover:underline"
                >
                  Telegram
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        {/* Inject Style Overrides for instant responsive rendering of panelColor */}
        <style>{`
          .bg-blue-600 { background-color: ${chosenColor} !important; }
          .hover\\:bg-blue-700:hover { background-color: ${chosenHoverColor} !important; }
          .text-blue-500 { color: ${chosenColor} !important; }
          .text-blue-600 { color: ${chosenColor} !important; }
          .text-blue-800 { color: ${chosenColor} !important; }
          .border-blue-500 { border-color: ${chosenColor} !important; }
          .focus\\:ring-blue-500\\/20:focus { --tw-ring-color: ${chosenColor}33 !important; }
          .focus\\:border-blue-500:focus { border-color: ${chosenColor} !important; }
          .bg-blue-100 { background-color: ${chosenColor}1a !important; }
          .text-blue-800 { color: ${chosenColor} !important; }
          .bg-blue-50\\/40 { background-color: ${chosenColor}0d !important; }
          .border-blue-150 { border-color: ${chosenColor}26 !important; }
          .border-blue-105 { border-color: ${chosenColor}22 !important; }
          .border-blue-100 { border-color: ${chosenColor}1a !important; }
        `}</style>
        <LoginScreen 
          workspaceName={workspaceName}
          siteLogo={siteLogo}
          setupCompleteMessage={setupCompleteMessage || undefined}
          onLogin={(userId) => void completeUserLogin(userId)}
        />
      </>
    );
  }

  if (!isLoadedFromServer || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-500 text-sm font-sans">
        {t('Загрузка данных...')}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden text-slate-800">
      {/* Inject Style Overrides for instant responsive rendering of panelColor */}
      <style>{`
        .bg-blue-600 { background-color: ${chosenColor} !important; }
        .hover\\:bg-blue-700:hover { background-color: ${chosenHoverColor} !important; }
        .text-blue-500 { color: ${chosenColor} !important; }
        .text-blue-600 { color: ${chosenColor} !important; }
        .text-blue-800 { color: ${chosenColor} !important; }
        .border-blue-500 { border-color: ${chosenColor} !important; }
        .focus\\:ring-blue-500\\/20:focus { --tw-ring-color: ${chosenColor}33 !important; }
        .focus\\:border-blue-500:focus { border-color: ${chosenColor} !important; }
        .bg-blue-100 { background-color: ${chosenColor}1a !important; }
        .text-blue-800 { color: ${chosenColor} !important; }
        .bg-blue-50\\/40 { background-color: ${chosenColor}0d !important; }
        .border-blue-150 { border-color: ${chosenColor}26 !important; }
        .border-blue-105 { border-color: ${chosenColor}22 !important; }
        .border-blue-100 { border-color: ${chosenColor}1a !important; }
      `}</style>

      {/* Sidebar navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        equipmentOpen={equipmentOpen}
        setEquipmentOpen={setEquipmentOpen}
        tabIcons={tabIcons}
        panelLogo={panelLogo}
        panelColor={panelColor}
        workspaceName={workspaceName}
        sidebarBgColor={sidebarBgColor}
        sidebarOpacity={sidebarOpacity}
        licenseStatus={licenseStatus}
      />

      {/* Main dashboard content container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Upper Search/BarHeader */}
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          computers={computers}
          networkDevices={networkDevices}
          employees={employees}
          objects={objects}
          onNavigate={(id) => setActiveTab(id)}
          onViewDetails={handleNavigateDetail}
          title={getHeaderTitle()}
          users={users}
          currentUser={currentUser}
          onSwitchUser={handleSwitchUser}
          onLogout={() => void handleLogout()}
          siteLogo={siteLogo}
          softwareItems={softwareItems}
          audits={audits}
        />

        {/* Dynamic Inner Panel Body */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {saveError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold px-4 py-3 rounded-xl flex items-start justify-between gap-3">
              <span>{saveError}</span>
              <button
                type="button"
                onClick={() => setSaveError('')}
                className="text-rose-500 hover:text-rose-700 shrink-0 font-bold"
              >
                ×
              </button>
            </div>
          )}
          {renderActiveView()}
        </main>
      </div>

      {/* Global integrated Details overlay modal */}
      {selectedDetail && (
        <DetailModal
          isOpen={!!selectedDetail}
          onClose={() => setSelectedDetail(null)}
          itemType={selectedDetail.type}
          itemId={selectedDetail.id}
          objects={objects}
          networkDevices={networkDevices}
          computers={computers}
          employees={employees}
          warehouseItems={warehouseItems}
          onUpdateItem={handleUpdateItem}
          onNavigateDetail={handleNavigateDetail}
          currentUser={currentUser}
          workspaceName={workspaceName}
        />
      )}
    </div>
  );
}
