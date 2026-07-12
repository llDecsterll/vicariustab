/*
 * COPYRIGHT NOTICE | УВЕДОМЛЕНИЕ ОБ АВТОРСКИХ ПРАВАХ | 版权声明
 * © 2026 Utkin Vladislav Vyacheslavovich (Уткин Владислав Вячеславович)
 * Email: vicariustab@icloud.com | Telegram: https://t.me/Dexterll
 * All rights reserved. Unauthorized copying, modification, distribution or commercial use is prohibited.
 * 保留所有权利。未经版权所有者事先书面同意，禁止复制、修改、分发或商业使用。
 * Все права защищены. Копирование, изменение, распространение и коммерческое использование без письменного согласия правообладателя запрещено.
 * Release
 */
import React, { useState, useRef, useEffect, memo } from 'react';
import { useTranslation, type Language } from '../utils/i18n';
import { interpolate, translateNotificationText, translateSecurityText } from '../utils/localeRuntime';
import { Search, Bell, Laptop, Network, Users, Building2, X, PanelLeftOpen, Settings, Globe, ChevronDown, ChevronRight, LogOut, Package } from 'lucide-react';
import { ComputerItem, NetworkDevice, EmployeeItem, ObjectItem, SystemUser, SoftwareItem, InventoryAudit, WarehouseItem } from '../types';
import BrandLogo from './BrandLogo';
import { DASHBOARD_HEADER_EDIT_SLOT_ID } from '../utils/dashboardLayout';
import CountryFlag, { languageToFlagCode } from './CountryFlag';
import ModalCloseButton from './ModalCloseButton';
import { parseMemJson, WORKSPACE_MEM_KEYS } from '../utils/memoryStorage';
import {
  computerMatchesSearch,
  findMatchingSerialValue,
  warehouseItemMatchesSearch,
  networkDeviceMatchesSearch,
} from '../utils/equipmentFields';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  computers: ComputerItem[];
  networkDevices: NetworkDevice[];
  warehouseItems?: WarehouseItem[];
  employees: EmployeeItem[];
  objects: ObjectItem[];
  onNavigate: (tabId: string) => void;
  onViewDetails?: (type: 'computer' | 'network' | 'employee' | 'object' | 'warehouse', id: string) => void;
  title?: string;
  users: SystemUser[];
  currentUser: SystemUser;
  onSwitchUser: (
    user: SystemUser,
    password: string,
    totp?: { challengeId: string; code: string }
  ) => Promise<{ ok: true } | { ok: false; reason: 'credentials' | 'totp_required'; challengeId?: string }>;
  onLogout: () => void;
  siteLogo?: string;
  softwareItems?: SoftwareItem[];
  audits?: InventoryAudit[];
  isSidebarHidden?: boolean;
  onToggleSidebar?: () => void;
  onOpenMobileNav?: () => void;
  activeTab?: string;
}

function Header({
  searchQuery,
  setSearchQuery,
  computers,
  networkDevices,
  warehouseItems = [],
  employees,
  objects,
  onNavigate,
  onViewDetails,
  title = 'Инвентаризация оборудования',
  users,
  currentUser,
  onSwitchUser,
  onLogout,
  siteLogo,
  softwareItems,
  audits,
  isSidebarHidden = false,
  onToggleSidebar,
  onOpenMobileNav,
  activeTab = 'dashboard',
}: HeaderProps) {
  const { t, language, setLanguage } = useTranslation();
  const [showResults, setShowResults] = useState(false);
  const [notifications, setNotifications] = useState<{ id: number; text: string; title?: string; body?: string; read: boolean; targetTab?: string; isSecurity?: boolean; serverNotifId?: string }[]>(() => [
      { id: 1, text: 'Срок гарантии PC-0006 истекает через 30 дней', read: false, targetTab: 'warranties' },
      { id: 2, text: 'Новое поступление оборудования на склад: Dell Latitude x5', read: false, targetTab: 'warehouse' },
      { id: 3, text: 'Обнаружено расхождение в аудите офиса на Мира', read: true, targetTab: 'inventory' }
    ]);

  // Safe calculators inside Header.tsx for dynamic matching
  const getExpiringWarrantiesCount = () => {
    try {
      const customWarranties = parseMemJson(WORKSPACE_MEM_KEYS.customWarranties, {});
      const deletedWarranties = parseMemJson<string[]>(WORKSPACE_MEM_KEYS.deletedWarranties, []);
      const manualWarranties = parseMemJson(WORKSPACE_MEM_KEYS.manualWarranties, []);
      
      const mockWarranties = [
        { id: 'w-1', deviceName: 'Dell Latitude 5420', type: 'computer', inventoryNumber: 'PC-0001', purchaseDate: '2025-01-10', warrantyPeriodMonths: 24, provider: 'Dell LLC Support' },
        { id: 'w-2', deviceName: 'Cisco Catalyst 2960', type: 'network', inventoryNumber: 'net-1', purchaseDate: '2023-01-15', warrantyPeriodMonths: 36, provider: 'Cisco SmartNet' },
        { id: 'w-3', deviceName: 'HP ProBook 450 G8', type: 'computer', inventoryNumber: 'PC-0002', purchaseDate: '2025-03-22', warrantyPeriodMonths: 12, provider: 'HP Care Pack' },
        { id: 'w-4', deviceName: 'Apple MacBook Air M1', type: 'computer', inventoryNumber: 'PC-0004', purchaseDate: '2024-06-01', warrantyPeriodMonths: 24, provider: 'AppleCare+' },
        { id: 'w-5', deviceName: 'Dell Latitude 5430', type: 'computer', inventoryNumber: 'PC-0006', purchaseDate: '2025-12-05', warrantyPeriodMonths: 12, provider: 'Dell Premium Care' },
        { id: 'w-6', deviceName: 'Lenovo ThinkCentre M720', type: 'computer', inventoryNumber: 'PC-0007', purchaseDate: '2022-09-10', warrantyPeriodMonths: 24, provider: 'Lenovo Depot Support' },
        { id: 'w-7', deviceName: 'Ubiquiti UniFi AP AC', type: 'network', inventoryNumber: 'net-5', purchaseDate: '2025-05-18', warrantyPeriodMonths: 12, provider: 'Ubiquiti Elite Support' },
      ];

      const today = new Date('2026-06-09');
      const combinedList = [...mockWarranties, ...manualWarranties];

      computers.forEach(c => {
        if (!combinedList.some(item => item.inventoryNumber === c.inventoryNumber)) {
          combinedList.push({
            id: `w-c-${c.id}`,
            deviceName: `${c.deviceType || c.category || 'Устройство'} ${c.model}`,
            type: 'computer',
            inventoryNumber: c.inventoryNumber,
            purchaseDate: '2025-08-15',
            warrantyPeriodMonths: 24,
            provider: 'Стандартный дилер',
          });
        }
      });

      let aliveList = combinedList.filter(item => {
        if (manualWarranties.some((m: any) => m.inventoryNumber === item.inventoryNumber)) return true;
        if (item.type === 'computer') {
          return computers.some(c => c.inventoryNumber === item.inventoryNumber);
        } else {
          return networkDevices.some(n => {
            const expectedNetInv = `NET-${n.id.substring(0,4).toUpperCase()}`;
            return (
              n.deviceName === item.deviceName ||
              item.inventoryNumber === n.id ||
              item.inventoryNumber === expectedNetInv ||
              item.inventoryNumber === `net-${n.id}`
            );
          });
        }
      });

      aliveList = aliveList.filter(item => !deletedWarranties.includes(item.inventoryNumber));

      return aliveList.map(item => {
        const customValue = customWarranties[item.inventoryNumber];
        const finalItem = customValue ? { ...item, ...customValue } : item;

        const pDate = new Date(finalItem.purchaseDate);
        const expDate = new Date(pDate.setMonth(pDate.getMonth() + finalItem.warrantyPeriodMonths));
        const diffTime = expDate.getTime() - today.getTime();
        const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let status = 'Действует';
        if (remainingDays < 0) status = 'Истекла';
        else if (remainingDays <= 60) status = 'Истекает';

        return {
          ...finalItem,
          remainingDays,
          status,
        };
      });
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const getExpiringSoftwareCount = () => {
    try {
      const items = softwareItems || [];
      const today = new Date('2026-06-09');
      
      return items.filter((item: any) => {
        if (!item.expirationDate) return false;
        const expDate = new Date(item.expirationDate);
        const diffTime = expDate.getTime() - today.getTime();
        const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return remainingDays >= 0 && remainingDays <= 60;
      }).map((item: any) => {
        const expDate = new Date(item.expirationDate);
        const diffTime = expDate.getTime() - today.getTime();
        const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
          ...item,
          remainingDays
        };
      });
    } catch (e) {
      return [];
    }
  };

  // Synchronize system notifications when database records alter
  useEffect(() => {
    const isSecurityPrivileged = currentUser?.role === 'Admin' || currentUser?.role === 'Editor';
    if (!isSecurityPrivileged) return;

    const expiringWarranties = getExpiringWarrantiesCount().filter(item => item.status === 'Истекает');
    const expiringSoftware = getExpiringSoftwareCount();
    const completedAudits = (audits || []).filter(item => item.status === 'Завершена');

    const generatedNotifs: { text: string; targetTab: string }[] = [];

    expiringWarranties.forEach(item => {
      generatedNotifs.push({
        text: `Срок гарантии оборудования ${item.deviceName} (${item.inventoryNumber}) истекает через ${item.remainingDays} дней`,
        targetTab: 'warranties'
      });
    });

    expiringSoftware.forEach(item => {
      generatedNotifs.push({
        text: `Лицензия на ПО "${item.name}" истекает через ${item.remainingDays} дней`,
        targetTab: 'software'
      });
    });

    completedAudits.forEach(audit => {
      generatedNotifs.push({
        text: `Проведена инвентаризация: "${audit.title}" (${audit.mismatchesFound} расхождений)`,
        targetTab: 'audits'
      });
    });

    setNotifications(prev => {
      let updated = [...prev];
      let changed = false;

      generatedNotifs.forEach(gen => {
        if (!updated.some(notif => notif.text === gen.text)) {
          updated.push({
            id: Date.now() + Math.floor(Math.random() * 100000),
            text: gen.text,
            read: false,
            targetTab: gen.targetTab
          });
          changed = true;
        }
      });

      return changed ? updated : prev;
    });
  }, [computers, networkDevices, softwareItems, audits, currentUser]);

  // Platform update notifications from GitHub version check
  useEffect(() => {
    const handleUpdateAvailable = (e: Event) => {
      const detail = (e as CustomEvent).detail as { text?: string };
      const text = detail?.text || t('Доступно обновление Vicariustab. Откройте Настройки → Центр обновлений.');
      setNotifications((prev) => {
        if (prev.some((n) => n.text === text && !n.read)) return prev;
        return [
          {
            id: Date.now() + Math.floor(Math.random() * 1000),
            text,
            read: false,
            targetTab: 'settings',
          },
          ...prev,
        ];
      });
    };
    window.addEventListener('Vicariustab-update-available', handleUpdateAvailable);

    const handleUpdateCompleted = (e: Event) => {
      const detail = (e as CustomEvent).detail as { text?: string };
      const text = detail?.text || t('Обновление Vicariustab установлено. Платформа перезапускается.');
      setNotifications((prev) => [
        {
          id: Date.now() + Math.floor(Math.random() * 1000),
          text,
          read: false,
          targetTab: 'settings',
        },
        ...prev,
      ]);
    };
    window.addEventListener('Vicariustab-update-completed', handleUpdateCompleted);

    return () => {
      window.removeEventListener('Vicariustab-update-available', handleUpdateAvailable);
      window.removeEventListener('Vicariustab-update-completed', handleUpdateCompleted);
    };
  }, []);

  // Session security alerts (new device login)
  useEffect(() => {
    const handleSessionSecurity = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        title?: string;
        body?: string;
        targetTab?: string;
        isSecurity?: boolean;
        serverNotifId?: string;
      };
      const title = detail?.title || 'Обнаружен новый вход в учётную запись';
      const body = detail?.body || '';
      const summary = body.split('\n').filter(Boolean).slice(0, 2).join(' · ') || title;

      setNotifications((prev) => {
        if (detail.serverNotifId && prev.some((n) => n.serverNotifId === detail.serverNotifId && !n.read)) {
          return prev;
        }
        return [
          {
            id: Date.now() + Math.floor(Math.random() * 1000),
            text: summary,
            title,
            body,
            read: false,
            targetTab: detail?.targetTab || 'settings',
            isSecurity: true,
            serverNotifId: detail.serverNotifId,
          },
          ...prev,
        ];
      });
    };

    window.addEventListener('Vicariustab-session-security-alert', handleSessionSecurity);
    return () => window.removeEventListener('Vicariustab-session-security-alert', handleSessionSecurity);
  }, []);

  // Listen to password change events
  useEffect(() => {
    const handlePasswordChangedEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const userName = customEvent.detail?.userName || 'пользователь';
      
      const newNotif = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        text: `Смена пользователем пароля: сотрудник "${userName}" успешно изменил пароль`,
        read: false,
        targetTab: 'settings',
        isSecurity: true
      };
      
      setNotifications(prev => {
        if (prev.some(n => n.text === newNotif.text && !n.read)) return prev;
        return [newNotif, ...prev];
      });
    };
    
    window.addEventListener('Vicariustab-password-changed', handlePasswordChangedEvent);
    window.addEventListener('orbit-password-changed', handlePasswordChangedEvent);
    return () => {
      window.removeEventListener('Vicariustab-password-changed', handlePasswordChangedEvent);
      window.removeEventListener('orbit-password-changed', handlePasswordChangedEvent);
    };
  }, []);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [bellArrived, setBellArrived] = useState(false);
  const prevNotificationsLenRef = useRef(notifications.length);
  
  // Custom User switching authorization states
  const [pendingUser, setPendingUser] = useState<SystemUser | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [switchTotpStep, setSwitchTotpStep] = useState(false);
  const [switchTotpChallengeId, setSwitchTotpChallengeId] = useState('');
  const [switchTotpCode, setSwitchTotpCode] = useState('');

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
        setShowLanguageMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter results dynamically
  const q = searchQuery.trim();
  const filteredComputers = q ? computers.filter((c) => computerMatchesSearch(c, q)) : [];

  const filteredNetwork = q ? networkDevices.filter((n) => networkDeviceMatchesSearch(n, q)) : [];

  const filteredWarehouse = q
    ? warehouseItems.filter((w) => w.quantity > 0 && warehouseItemMatchesSearch(w, q))
    : [];

  const filteredEmployees = q
    ? employees.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.position.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const filteredObjects = searchQuery.trim()
    ? objects.filter(o => o.name.toLowerCase().includes(searchQuery.toLowerCase()) || o.address.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const totalResults =
    filteredComputers.length +
    filteredNetwork.length +
    filteredWarehouse.length +
    filteredEmployees.length +
    filteredObjects.length;

  const isSecurityPrivileged = currentUser?.role === 'Admin' || currentUser?.role === 'Editor';

  const getVisibleNotifications = () => {
    if (isSecurityPrivileged) return notifications;
    
    return notifications.filter(n => {
      const text = n.text.toLowerCase();
      const isWarranty = text.includes('гаранти');
      const isLicense = text.includes('лицензия') || text.includes('лицензион');
      const isInventory = text.includes('инвентаризац') || text.includes('аудит');
      const isPassword = text.includes('парол');
      const isUpdate = text.includes('обновлен') || text.includes('update') || text.includes('Vicariustab');
      return !(isWarranty || isLicense || isInventory || isPassword) || isUpdate;
    });
  };

  const visibleNotifications = getVisibleNotifications();

  const markAllRead = () => {
    setNotifications(notifications.map(n => {
      const isVisible = visibleNotifications.some(v => v.id === n.id);
      return isVisible ? { ...n, read: true } : n;
    }));
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    const visibleIds = new Set(visibleNotifications.map(v => v.id));
    setNotifications(notifications.filter(n => !visibleIds.has(n.id)));
  };

  const unreadCount = visibleNotifications.filter(n => !n.read).length;

  const languageLabel = (lang: Language) => {
    switch (lang) {
      case 'en':
        return 'English';
      case 'zh':
        return '中文';
      default:
        return 'Русский';
    }
  };

  const closeUserMenu = () => {
    setShowUserMenu(false);
    setShowLanguageMenu(false);
  };

  const openSettings = () => {
    onNavigate('settings');
    closeUserMenu();
  };

  useEffect(() => {
    const prevLen = prevNotificationsLenRef.current;
    if (notifications.length > prevLen) {
      setBellArrived(true);
      const timer = window.setTimeout(() => setBellArrived(false), 1000);
      prevNotificationsLenRef.current = notifications.length;
      return () => window.clearTimeout(timer);
    }
    prevNotificationsLenRef.current = notifications.length;
  }, [notifications]);

  const isDashboard = activeTab === 'dashboard';

  return (
    <header
      className={`bg-white border-b border-slate-200 sticky top-0 z-20 select-none shadow-sm ${
        isDashboard ? 'lg:min-h-[72px]' : 'lg:min-h-16'
      }`}
    >
      <div
        className={`grid grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_minmax(0,36rem)_minmax(0,1fr)] gap-x-2 gap-y-2 lg:gap-4 px-3 sm:px-4 lg:px-6 py-2 lg:py-0 items-center ${
          isDashboard ? 'lg:h-[72px]' : 'lg:h-16'
        }`}
      >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 col-start-1 row-start-1 lg:justify-self-start">
        {onOpenMobileNav && (
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title={t('Показать меню')}
            aria-label={t('Показать меню')}
          >
            <PanelLeftOpen size={20} />
          </button>
        )}
        {isSidebarHidden && onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="hidden lg:inline-flex p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={t('Показать меню')}
            aria-label={t('Показать меню')}
          >
            <PanelLeftOpen size={20} />
          </button>
        )}
        {isDashboard ? (
          <div className="min-w-0 flex items-start gap-2 sm:gap-2.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                  {t('Добро пожаловать')}, {currentUser.name.split(' ')[0]} 👋
                </h1>
                <div id={DASHBOARD_HEADER_EDIT_SLOT_ID} className="shrink-0" />
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 line-clamp-2 sm:line-clamp-none">
                {t('Обзор состояния вашей инфраструктуры на сегодня')}
              </p>
            </div>
          </div>
        ) : (
          <>
            {siteLogo ? (
              <img
                src={siteLogo}
                alt="Site Logo"
                className="w-8 h-8 object-contain rounded shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <BrandLogo size={32} variant="compact" className="shrink-0" />
            )}
            <h1 className="text-sm sm:text-base lg:text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight truncate min-w-0">
              {t(title)}
            </h1>
          </>
        )}
      </div>

      {/* Center Search with advanced instant results */}
      <div
        ref={searchRef}
        className="relative w-full min-w-0 col-span-2 row-start-2 lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:justify-self-center"
      >
        <div className="relative">
          <input
            type="text"
            placeholder={t("Поиск по оборудованию, серийному номеру, сотруднику...")}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 placeholder:text-slate-400"
          />
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        {/* Global Instant Search Overlays */}
        {showResults && searchQuery.trim() && (
          <div className="absolute top-12 left-0 w-full bg-white rounded-xl shadow-xl border border-slate-100 max-h-96 overflow-y-auto z-50 p-2">
            <h3 className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1 bg-slate-50 rounded mb-2">
              {interpolate(t('Результаты поиска ({count})'), { count: totalResults })}
            </h3>
            
            {totalResults === 0 ? (
              <div className="text-center py-6 text-slate-400 text-sm">
                {interpolate(t('Ничего не найдено по запросу "{query}"'), { query: searchQuery })}
              </div>
            ) : (
              <div className="space-y-1 text-sm">
                {/* Computers */}
                {filteredComputers.map(comp => {
                  const matchedSerial = findMatchingSerialValue(comp, q);
                  return (
                  <button
                    key={comp.id}
                    onClick={() => {
                      if (onViewDetails) {
                        onViewDetails('computer', comp.id);
                      } else {
                        onNavigate('computers');
                      }
                      setShowResults(false);
                      setSearchQuery('');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Laptop size={15} className="text-blue-500" />
                    <div>
                      <div className="font-medium text-slate-800">{comp.model}</div>
                      <div className="text-xs text-slate-400">
                        {t('Компьютер')} • {t('Инв. №')}{comp.inventoryNumber} • {comp.employeeName}
                        {matchedSerial ? ` • S/N: ${matchedSerial}` : ''}
                      </div>
                    </div>
                  </button>
                );})}

                {/* Warehouse stock */}
                {filteredWarehouse.map((item) => {
                  const matchedSerial = findMatchingSerialValue(item, q);
                  return (
                    <button
                      key={`wh-${item.id}`}
                      onClick={() => {
                        if (onViewDetails) {
                          onViewDetails('warehouse', item.id);
                        } else {
                          onNavigate('warehouse');
                        }
                        setShowResults(false);
                        setSearchQuery('');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Package size={15} className="text-amber-600" />
                      <div>
                        <div className="font-medium text-slate-800">{item.name}</div>
                        <div className="text-xs text-slate-400">
                          {t('Склад')} • {t('Инв. №')}{item.inventoryNumber} • {item.model}
                          {matchedSerial ? ` • S/N: ${matchedSerial}` : ''}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {/* Network Devices */}
                {filteredNetwork.map(net => (
                  <button
                    key={net.id}
                    onClick={() => {
                      if (onViewDetails) {
                        onViewDetails('network', net.id);
                      } else {
                        onNavigate('network');
                      }
                      setShowResults(false);
                      setSearchQuery('');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Network size={15} className="text-[#84cc16]" />
                    <div>
                      <div className="font-medium text-slate-800">{net.deviceName}</div>
                      <div className="text-xs text-slate-400">{t('Сетевое')} • IP: {net.ipAddress} • {t(net.type)}</div>
                    </div>
                  </button>
                ))}

                {/* Employees */}
                {filteredEmployees.map(emp => (
                  <button
                    key={emp.id}
                    onClick={() => {
                      if (onViewDetails) {
                        onViewDetails('employee', emp.id);
                      } else {
                        onNavigate('employees');
                      }
                      setShowResults(false);
                      setSearchQuery('');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Users size={15} className="text-[#3b82f6]" />
                    <div>
                      <span className="font-medium text-slate-800 block">{emp.name}</span>
                      <span className="text-xs text-slate-400 block">{emp.position} • {emp.department}</span>
                    </div>
                  </button>
                ))}

                {/* Objects */}
                {filteredObjects.map(obj => (
                  <button
                    key={obj.id}
                    onClick={() => {
                      if (onViewDetails) {
                        onViewDetails('object', obj.id);
                      } else {
                        onNavigate('objects');
                      }
                      setShowResults(false);
                      setSearchQuery('');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Building2 size={15} className="text-indigo-500" />
                    <div>
                      <span className="font-medium text-slate-800 block">{obj.name}</span>
                      <span className="text-xs text-slate-400 block">{t('Локация •')} {obj.address}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right User Bar */}
      <div className="flex items-center shrink-0 justify-self-end col-start-2 row-start-1 lg:col-start-3 lg:row-start-1">
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="relative flex items-center justify-center min-w-[44px] min-h-[44px] p-2.5 rounded-xl text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label={unreadCount > 0 ? `${t('Уведомления')}: ${unreadCount}` : t('Уведомления')}
          >
            <Bell
              size={22}
              strokeWidth={2.25}
              className={`${unreadCount > 0 ? 'bell-unread text-slate-800' : ''} ${bellArrived ? 'bell-arrived' : ''}`}
            />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] font-bold leading-none min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center border-2 border-white shadow-sm notif-badge-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-[min(20rem,calc(100vw-1.5rem))] bg-white shadow-xl rounded-xl border border-slate-100 z-50 py-2">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                <span className="font-semibold text-sm text-slate-800">{t('Уведомления')}</span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer transition-colors"
                    >
                      {t('Прочитать всё')}
                    </button>
                  )}
                  {visibleNotifications.length > 0 && (
                    <>
                      {unreadCount > 0 && <span className="text-slate-200 text-xs">|</span>}
                      <button
                        onClick={clearAllNotifications}
                        className="text-xs text-rose-500 hover:text-rose-600 font-medium cursor-pointer flex items-center gap-0.5 transition-colors"
                      >
                        {t('Очистить всё')}
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto py-1">
                {visibleNotifications.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">{t('Нет новых уведомлений')}</div>
                ) : (
                  visibleNotifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        setNotifications(notifications.map((notif) => (notif.id === n.id ? { ...notif, read: true } : notif)));
                        if (n.targetTab) onNavigate(n.targetTab);
                        setShowNotifications(false);
                      }}
                      className={`px-4 py-2.5 text-xs border-b border-slate-50 hover:bg-slate-50 flex gap-2 items-center justify-between transition-colors cursor-pointer group ${
                        !n.read ? 'bg-blue-50/40 font-semibold text-slate-900 border-l-2 border-l-blue-500' : 'text-slate-600'
                      }`}
                    >
                      <div className="flex gap-2 items-start flex-1 mr-2 min-w-0">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-blue-500' : 'bg-slate-300'}`} />
                        <div className="flex-1 leading-normal break-words min-w-0">
                          {n.title ? (
                            <>
                              <div className={`${!n.read ? 'font-bold' : 'font-semibold'} text-slate-800`}>{translateSecurityText(n.title, t)}</div>
                              <div className="text-[10px] text-slate-500 mt-1 whitespace-pre-line leading-relaxed">{translateNotificationText(n.body || n.text, t)}</div>
                              {n.isSecurity && (
                                <div className="text-[10px] text-blue-600 mt-1.5 font-semibold">{t('Открыть активные сессии →')}</div>
                              )}
                            </>
                          ) : (
                            translateNotificationText(n.text, t)
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(n.id);
                        }}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded-md hover:bg-slate-100 transition-all opacity-0 group-hover:opacity-100 shrink-0 self-center"
                        title={t('Удалить')}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div ref={userMenuRef} className="relative lg:border-l lg:border-slate-100">
          <button
            type="button"
            onClick={() => {
              setShowUserMenu((open) => !open);
              setShowLanguageMenu(false);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 pl-3 pr-2.5 py-2 hover:bg-slate-50 rounded-lg transition-colors text-left"
          >
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover border border-slate-200"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                {currentUser.name[0].toUpperCase()}
              </div>
            )}
            <div className="hidden sm:block min-w-0">
              <span className="font-semibold block text-slate-800 text-sm leading-tight truncate">{currentUser.name}</span>
              <span className="text-slate-500 block leading-tight text-[11px]">
                {currentUser.role === 'Admin' ? t('Администратор') : currentUser.role === 'Editor' ? t('Редактирование') : t('Просмотр')}
              </span>
            </div>
            <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-[248px] bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 animate-fade-in">
              <button
                type="button"
                onClick={openSettings}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Settings size={16} className="text-slate-500 shrink-0" />
                {t('Настройки')}
              </button>

              <div className="py-0.5">
                <button
                  type="button"
                  onClick={() => setShowLanguageMenu((open) => !open)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    showLanguageMenu ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Globe size={16} className={`shrink-0 ${showLanguageMenu ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span className="flex-1 text-left">{t('Язык')}</span>
                  <span className={`flex items-center gap-1.5 text-xs ${showLanguageMenu ? 'text-blue-600' : 'text-slate-400'}`}>
                    <CountryFlag code={languageToFlagCode(language)} className="w-4 h-3 rounded-sm" />
                    {languageLabel(language)}
                    <ChevronRight size={14} />
                  </span>
                </button>
                {showLanguageMenu && (
                  <div className="px-2 pb-1">
                    {(['ru', 'en', 'zh'] as Language[]).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => {
                          setLanguage(lang);
                          setShowLanguageMenu(false);
                        }}
                        className={`w-full flex items-center gap-2 px-8 py-2 text-sm rounded-lg transition-colors ${
                          language === lang ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <CountryFlag code={languageToFlagCode(lang)} className="w-4 h-3 rounded-sm shrink-0" />
                        {languageLabel(lang)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="my-1 border-t border-slate-100" />

              <button
                type="button"
                onClick={() => {
                  closeUserMenu();
                  onLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut size={16} className="shrink-0" />
                {t('Выйти')}
              </button>

              {currentUser.role === 'Admin' && users.some((u) => u.role === 'Admin' && u.id !== currentUser.id) && (
                <>
                  <div className="my-1 border-t border-slate-100" />
                  <div className="px-3 py-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 px-1">
                      {t('Сменить пользователя')}
                    </span>
                    <div className="space-y-0.5 max-h-28 overflow-y-auto">
                      {users
                        .filter((u) => u.role === 'Admin' && u.id !== currentUser.id)
                        .map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setPendingUser(u);
                              closeUserMenu();
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded-lg transition-colors text-left text-xs"
                          >
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                              {u.name[0].toUpperCase()}
                            </span>
                            <span className="truncate text-slate-700 font-medium">{u.name}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Account Password Authorization Dialog overlay modal */}
      {pendingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl space-y-4 animate-fade-in text-xs relative">
            <div className="absolute top-4 right-4">
              <ModalCloseButton
                onClick={() => {
                  setPendingUser(null);
                  setPasswordInput('');
                  setPasswordError('');
                  setSwitchTotpStep(false);
                  setSwitchTotpChallengeId('');
                  setSwitchTotpCode('');
                }}
              />
            </div>
            <div className="text-center space-y-2">
              {pendingUser.avatarUrl ? (
                <img src={pendingUser.avatarUrl} alt={pendingUser.name} className="w-14 h-14 rounded-full mx-auto object-cover border-2 border-blue-500" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-lg mx-auto">
                  {pendingUser.name[0].toUpperCase()}
                </div>
              )}
              <h3 className="font-bold text-slate-850 text-sm">
                {switchTotpStep ? t('Код двухэтапной аутентификации') : t('Вход в учетную запись')}
              </h3>
              <p className="text-slate-500 text-xs text-center">
                {switchTotpStep
                  ? t('Введите 6-значный код из приложения аутентификатора.')
                  : <>{t('Введите пароль для')}<strong className="text-slate-700">{pendingUser.name}</strong></>}
              </p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              void (async () => {
                if (switchTotpStep && pendingUser) {
                  const result = await onSwitchUser(pendingUser, passwordInput, {
                    challengeId: switchTotpChallengeId,
                    code: switchTotpCode,
                  });
                  if (result.ok) {
                    setPendingUser(null);
                    setPasswordInput('');
                    setPasswordError('');
                    setSwitchTotpStep(false);
                    setSwitchTotpChallengeId('');
                    setSwitchTotpCode('');
                  } else {
                    setPasswordError(t('Неверный код двухэтапной аутентификации.'));
                  }
                  return;
                }
                const result = await onSwitchUser(pendingUser!, passwordInput);
                if (result.ok) {
                  setPendingUser(null);
                  setPasswordInput('');
                  setPasswordError('');
                  setSwitchTotpStep(false);
                  setSwitchTotpChallengeId('');
                  setSwitchTotpCode('');
                } else if (result.ok === false && result.reason === 'totp_required' && result.challengeId) {
                  setSwitchTotpChallengeId(result.challengeId);
                  setSwitchTotpStep(true);
                  setSwitchTotpCode('');
                  setPasswordError('');
                } else {
                  setPasswordError(t('Неверный пароль.'));
                }
              })();
            }} className="space-y-3">
              {!switchTotpStep ? (
              <div>
                <input
                  type="password"
                  autoFocus
                  required
                  placeholder={t("Введите пароль")}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError('');
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                />
                {passwordError && (
                  <p className="text-red-500 text-[10px] mt-1 text-center font-bold">{passwordError}</p>
                )}
              </div>
              ) : (
              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  autoFocus
                  required
                  placeholder="000000"
                  value={switchTotpCode}
                  onChange={(e) => {
                    setSwitchTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setPasswordError('');
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-center font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                />
                {passwordError && (
                  <p className="text-red-500 text-[10px] mt-1 text-center font-bold">{passwordError}</p>
                )}
              </div>
              )}

              <div className="flex gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setPendingUser(null);
                    setPasswordInput('');
                    setPasswordError('');
                  }}
                  className="flex-1 py-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
                >{t("Отмена")}</button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow"
                >{t("Войти")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}

export default memo(Header);
