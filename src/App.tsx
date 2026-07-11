/*
 * COPYRIGHT NOTICE | УВЕДОМЛЕНИЕ ОБ АВТОРСКИХ ПРАВАХ | 版权声明
 * © 2026 Utkin Vladislav Vyacheslavovich (Уткин Владислав Вячеславович)
 * Email: vicariustab@icloud.com | Telegram: https://t.me/Dexterll
 * All rights reserved. Unauthorized copying, modification, distribution or commercial use is prohibited.
 * 保留所有权利。未经版权所有者事先书面同意，禁止复制、修改、分发或商业使用。
 * Все права защищены. Копирование, изменение, распространение и коммерческое использование без письменного согласия правообладателя запрещено.
 * Release
 */
import React, { useState, useEffect, useCallback, useRef, useMemo, Suspense, lazy } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { UserPreferencesProvider } from './components/UserPreferencesProvider';
import LoginScreen from './components/LoginScreen';
import FirstRunSetup from './components/FirstRunSetup';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import ConfirmReturnModal from './components/ConfirmReturnModal';

const DashboardView = lazy(() => import('./components/DashboardView'));
const ObjectsView = lazy(() => import('./components/ObjectsView'));
const NetworkView = lazy(() => import('./components/NetworkView'));
const ComputersView = lazy(() => import('./components/ComputersView'));
const EmployeesView = lazy(() => import('./components/EmployeesView'));
const WarehouseView = lazy(() => import('./components/WarehouseView'));
const AuditsView = lazy(() => import('./components/AuditsView'));
const WarrantiesView = lazy(() => import('./components/WarrantiesView'));
const ReportsView = lazy(() => import('./components/ReportsView'));
const ActivityLogView = lazy(() => import('./components/ActivityLogView'));
const SettingsView = lazy(() => import('./components/SettingsView'));
const SoftwareView = lazy(() => import('./components/SoftwareView'));
const DetailModal = lazy(() => import('./components/DetailModal'));
import { useTranslation } from './utils/i18n';
import { interpolate } from './utils/localeRuntime';
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

import { ObjectItem, NetworkDevice, ComputerItem, EmployeeItem, EmployeeStatus, WarehouseItem, WarehouseItemType, Activity, InventoryAudit, SystemUser, UserRole, SoftwareItem, ComputerCategory, CustomWarehouse, WarehouseWriteOff, UserPreferences } from './types';
import { getLicenseStatus, activateSystem, deactivateSystem, getSystemRequestCode, applyLicenseStateFromServer, getLicenseWorkspaceFields, canUseWarehouseExcel } from './utils/license';
import { purgeLegacyBrowserStorage, applyWorkspaceMemFieldsFromServer, getWorkspaceMemFieldsForPayload } from './utils/memoryStorage';
import { checkForPlatformUpdate, markInstalledCommit, buildUpdateNotificationText, shouldNotifyForUpdate, markUpdateNotified } from './utils/updateCheck';
import { APP_VERSION } from './config/appConfig';
import {
  filterComputersByEquipmentTab,
  filterNetworkDevicesForEquipmentView,
  resolveWarehouseComputerRoute,
  resolveNetworkDeviceType,
  resolveStockObjectForWarehouse,
  resolveWarehouseNameForObject,
  equipmentTabLabel,
  reconcileWarehouses,
  warehouseCatalogsEqual,
  createDefaultWarehouse,
} from './utils/warehouseRouting';
import {
  allocateBatchInventoryNumbers,
  buildComputerSpecsFromReceipt,
  mergeUnitSerialNumbers,
  formatSplitWarehouseInventoryNumber,
  generateNextInventoryNumber,
  getSplitRootInventoryNumber,
  getWarehouseBatchInventoryKey,
  getWarehouseItemSpecs,
  getWarehouseLineInventoryKey,
  inventoryNumbersMatch,
  limitEquipmentTitle,
  matchesBaseInventoryNumber,
  mergeWarehouseReceiptSpecs,
  normalizeInventoryNumber,
  normalizeUnitSerialNumbers,
  normalizePositiveInt,
  partitionUnitSerialNumbers,
  remapBatchInventoryNumber,
  allocateNextSplitPartIndex,
  repairDuplicateComputerInventoryNumbers,
  reduceWarehouseItemAfterDeploy,
  increaseWarehouseItemAfterReturn,
  findActiveWarehouseStockLineIndex,
  mergeWarehouseLineSpecs,
  reduceWarehouseItemAfterWriteOff,
  consumeUnitSerialNumbers,
  warehouseSpecsForQuantity,
} from './utils/equipmentFields';
import { Copy, Check, Mail } from 'lucide-react';
import { copyTextToClipboard } from './utils/clipboard';
import {
  authenticateCredentials,
  verifyTotpLogin,
  sessionHeartbeat,
  logoutUserSession,
  markSessionNotificationsRead,
  fetchCurrentSession,
} from './utils/sessionAuth';
import { hasStoredSession, clearSessionCredentials, authHeaders, sessionFetch } from './utils/deviceFingerprint';
import { apiFetch } from './utils/apiClient';
import { persistWorkspaceState, purgeWorkspaceOnServer } from './utils/workspaceSync';
import { applyWriteOffRestore } from './utils/restoreWriteOff';
import { applyCancelPendingWriteOff } from './utils/cancelPendingWriteOff';
import { applyMarkForWriteOff } from './utils/markPendingWriteOff';
import { repairWarehousePendingDuplicates } from './utils/warehousePendingMerge';
import {
  applyWarehouseExcelImport,
  type WarehouseExcelImportResult,
  type WarehouseExcelRow,
} from './utils/warehouseExcel';
import { clearActDraftLocalStorage } from './utils/actDraft';
import { clearDocumentHeaderLocalStorage, applyDocumentHeaderFromServer, loadDocumentHeader, loadDocumentHeaderPresets } from './utils/documentHeader';
import { clearInventoryLocalStorage } from './emptyWorkspace';
import { fetchSetupStatus } from './utils/setupAuth';
import { countAuditScopeItems, syncAuditProgressFields, buildAuditChecklist, computeAuditProgressFromRows } from './utils/auditInventory';
import {
  buildDeletePreview,
  filterSoftwareForEquipmentView,
  findSoftwareIdsForWarehouseItem,
  pickStockComputerIdsForWriteOff,
  reduceWarehouseQtyForComputerWriteOff,
  reduceWarehouseQtyByInventoryMatch,
  countRegistryUnitsForWarehouseBatch,
  getSoftwareWarehouseInv,
  isActiveWarehouseStockLine,
  isWrittenOffLifecycleStatus,
  purgeWrittenOffRegistry,
  warehouseItemLinksSoftware,
  type EquipmentDeleteSource,
} from './utils/equipmentDelete';
import {
  applySoftwareSeatPatch,
  buildLicenseSeatsFromForm,
  countAssignedLicenseSeats,
  countFreeLicenseSeats,
  CORPORATE_LICENSE_EMPLOYEE,
  deriveSoftwareAssignmentSummary,
  ensureLicenseSeats,
  findFirstAssignedSeatIndex,
  FREE_LICENSE_EMPLOYEE,
  isLicenseSeatAssigned,
  unassignLicenseSeat,
} from './utils/softwareLicenseUtils';

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
        status.lockoutTimeLeft > 0 ||
        (!status.isActivated && !status.isInstallationLicensed && !status.isExpired)
          ? 1000
          : 5000;
      timeoutId = setTimeout(tick, delay);
    };
    tick();
    return () => clearTimeout(timeoutId);
  }, []);

  const [isLoadedFromServer, setIsLoadedFromServer] = useState<boolean>(false);
  const [serverLoadError, setServerLoadError] = useState('');
  const [serverLoadAttempt, setServerLoadAttempt] = useState(0);
  const [dataRevision, setDataRevision] = useState<number | null>(null);
  const dataRevisionRef = useRef<number | null>(null);
  const [saveError, setSaveError] = useState('');
  const [equipmentDeleteRequest, setEquipmentDeleteRequest] = useState<{
    source: EquipmentDeleteSource;
    id: string;
  } | null>(null);
  const [equipmentReturnRequest, setEquipmentReturnRequest] = useState<{
    source: 'computer' | 'network' | 'software';
    id: string;
  } | null>(null);
  const [setupChecking, setSetupChecking] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [setupCompleteMessage, setSetupCompleteMessage] = useState('');

  // Navigation & UI Layout states
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [equipmentOpen, setEquipmentOpen] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDetail, setSelectedDetail] = useState<{ type: 'computer' | 'network' | 'employee' | 'object' | 'warehouse'; id: string } | null>(null);

  const navigateToTab = useCallback((tab: string) => {
    setActiveTab(tab);
    setMobileNavOpen(false);
  }, []);

  useEffect(() => {
    if (!mobileNavOpen) {
      document.body.style.overflow = '';
      return;
    }
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = () => {
      if (mq.matches) setMobileNavOpen(false);
    };
    closeOnDesktop();
    mq.addEventListener('change', closeOnDesktop);
    return () => mq.removeEventListener('change', closeOnDesktop);
  }, []);

  const [objects, setObjects] = useState<ObjectItem[]>(() => initialObjects);

  const [networkDevices, setNetworkDevices] = useState<NetworkDevice[]>(() => initialNetworkDevices);

  const [computers, setComputers] = useState<ComputerItem[]>(() => initialComputers);

  const [employees, setEmployees] = useState<EmployeeItem[]>(() => initialEmployees);

  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>(() =>
    repairWarehousePendingDuplicates(initialWarehouseItems)
  );

  const [activities, setActivities] = useState<Activity[]>(() => initialActivities);

  const [audits, setAudits] = useState<InventoryAudit[]>(() => initialAudits);

  const [softwareItems, setSoftwareItems] = useState<SoftwareItem[]>(() => initialSoftwareItems);

  const [warehouses, setWarehouses] = useState<CustomWarehouse[]>(() =>
    reconcileWarehouses(
      [createDefaultWarehouse(initialObjects)],
      initialWarehouseItems,
      initialObjects,
      []
    )
  );

  const [warehouseWriteOffs, setWarehouseWriteOffs] = useState<WarehouseWriteOff[]>(() => []);

  const [workspaceName, setWorkspaceName] = useState<string>(() => 'Инвентаризация оборудования');

  const [adminEmail, setAdminEmail] = useState<string>(() => 'vicariustab@icloud.com');

  const [publicUrl, setPublicUrl] = useState<string>(() => '');

  const [users, setUsers] = useState<SystemUser[]>(() => []);

  const [currentUserId, setCurrentUserId] = useState<string>(() => '');

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => false);

  const [tabIcons, setTabIcons] = useState(() => ({
    computers: 'Laptop',
    network: 'Network',
    peripherals: 'Monitor',
    other_equip: 'Server',
  }));

  const [panelLogo, setPanelLogo] = useState<string>(() => '');

  const [panelColor, setPanelColor] = useState<string>(() => 'blue');

  const [siteFavicon, setSiteFavicon] = useState<string>(() => '');

  const [siteLogo, setSiteLogo] = useState<string>(() => '');

  const [sidebarBgColor, setSidebarBgColor] = useState<string>(() => '#0f172a');

  const [sidebarOpacity, setSidebarOpacity] = useState<number>(() => 1.0);

  // Derived current user metadata
  const currentUser = users.find(u => u.id === currentUserId);

  useEffect(() => {
    purgeLegacyBrowserStorage();
  }, []);

  useEffect(() => {
    void (async () => {
      const status = await fetchSetupStatus();
      if (status.setupRequired) {
        clearSessionCredentials();
        clearDocumentHeaderLocalStorage();
        clearActDraftLocalStorage();
        setIsLoggedIn(false);
      }
      setSetupRequired(status.setupRequired);
      setSetupChecking(false);

      if (!status.setupRequired) {
        const session = await fetchCurrentSession();
        if (session) {
          if (session.userId) setCurrentUserId(session.userId);
          setIsLoggedIn(true);
        } else {
          clearSessionCredentials();
          setIsLoggedIn(false);
        }
      }
    })();
  }, []);

  const applyServerPayload = useCallback((data: Record<string, unknown>) => {
    if (typeof data._revision === 'number') {
      setDataRevision(data._revision);
      dataRevisionRef.current = data._revision;
    }
    applyLicenseStateFromServer(data);
    setLicenseStatus(getLicenseStatus());

    const nextObjects = Array.isArray(data.objects) ? (data.objects as ObjectItem[]) : undefined;
    const nextWarehouseItems = Array.isArray(data.warehouseItems)
      ? (data.warehouseItems as WarehouseItem[])
      : undefined;
    const nextWriteOffs = Array.isArray(data.warehouseWriteOffs)
      ? (data.warehouseWriteOffs as WarehouseWriteOff[])
      : undefined;
    const nextWarehouses = Array.isArray(data.warehouses)
      ? (data.warehouses as CustomWarehouse[])
      : undefined;

    if (nextObjects) setObjects(nextObjects);
    if (Array.isArray(data.networkDevices)) setNetworkDevices(data.networkDevices as NetworkDevice[]);
    if (Array.isArray(data.computers)) setComputers(data.computers as ComputerItem[]);
    if (Array.isArray(data.employees)) setEmployees(data.employees as EmployeeItem[]);
    if (nextWarehouseItems) {
      setWarehouseItems(repairWarehousePendingDuplicates(nextWarehouseItems));
    }
    if (Array.isArray(data.activities)) setActivities(data.activities as Activity[]);
    if (Array.isArray(data.audits)) setAudits(data.audits as InventoryAudit[]);
    if (Array.isArray(data.softwareItems)) setSoftwareItems(data.softwareItems as SoftwareItem[]);
    if (nextWriteOffs) setWarehouseWriteOffs(nextWriteOffs);
    if (nextWarehouses && nextWarehouses.length > 0) setWarehouses(nextWarehouses);

    if (typeof data.workspaceName === 'string') setWorkspaceName(data.workspaceName);
    if (typeof data.adminEmail === 'string') setAdminEmail(data.adminEmail);
    if (typeof data.publicUrl === 'string') setPublicUrl(data.publicUrl);
    if (Array.isArray(data.users)) {
      setUsers(
        (data.users as SystemUser[]).map((u) => {
          const { password: _password, ...safe } = u as SystemUser & { password?: string };
          return safe;
        })
      );
    }
    if (data.tabIcons) setTabIcons(data.tabIcons as typeof tabIcons);
    if (typeof data.panelLogo === 'string') setPanelLogo(data.panelLogo);
    if (typeof data.panelColor === 'string') setPanelColor(data.panelColor);
    if (typeof data.siteFavicon === 'string') setSiteFavicon(data.siteFavicon);
    if (typeof data.siteLogo === 'string') setSiteLogo(data.siteLogo);
    if (typeof data.sidebarBgColor === 'string') setSidebarBgColor(data.sidebarBgColor);
    if (typeof data.sidebarOpacity === 'number') setSidebarOpacity(data.sidebarOpacity);
    if (data.documentHeader !== undefined || data.documentHeaderPresets !== undefined) {
      applyDocumentHeaderFromServer(data.documentHeader, data.documentHeaderPresets);
    }
    applyWorkspaceMemFieldsFromServer(data);
  }, []);

  // Restore warehouse catalog from stock lines (legacy server payloads without `warehouses`)
  useEffect(() => {
    setWarehouses((prev) => {
      const next = reconcileWarehouses(prev, warehouseItems, objects, warehouseWriteOffs);
      return warehouseCatalogsEqual(prev, next) ? prev : next;
    });
  }, [warehouseItems, objects, warehouseWriteOffs]);

  // Авто-исправление дублей инв. № после частичного списания (legacy-данные)
  useEffect(() => {
    setWarehouseItems((prev) => {
      const repaired = repairWarehousePendingDuplicates(prev);
      if (repaired.length === prev.length && repaired.every((w, i) => w === prev[i])) {
        return prev;
      }
      return repaired;
    });
  }, [warehouseItems]);

  // Авто-исправление точных дублей инв. № у карточек оборудования (ошибочные выдачи со склада)
  useEffect(() => {
    setComputers((prev) => {
      const repaired = repairDuplicateComputerInventoryNumbers(prev, {
        warehouseItems,
        networkDevices,
        softwareItems,
      });
      return repaired;
    });
  }, [computers, warehouseItems, networkDevices, softwareItems]);

  const loadDataFromServer = useCallback(async (): Promise<boolean> => {
    setServerLoadError('');
    const result = await apiFetch<Record<string, unknown>>('/api/data');
    if (!result.ok) {
      if (result.status === 401) {
        clearSessionCredentials();
        setIsLoggedIn(false);
        return false;
      }
      setServerLoadError(
        result.status === 0
          ? t('Ошибка сети. Проверьте подключение к серверу.')
          : `${t('Не удалось загрузить данные с сервера')}: ${(result as Extract<typeof result, { ok: false }>).error}`
      );
      return false;
    }
    if (result.data && typeof result.data === 'object') {
      applyServerPayload(result.data);
    }
    setIsLoadedFromServer(true);
    setServerLoadError('');
    return true;
  }, [applyServerPayload, t]);

  useEffect(() => {
    if (setupChecking) return;
    if (isLoggedIn && !hasStoredSession()) {
      setIsLoggedIn(false);
      return;
    }
    if (isLoggedIn && hasStoredSession() && !isLoadedFromServer) {
      void loadDataFromServer();
    }
  }, [isLoggedIn, isLoadedFromServer, loadDataFromServer, setupChecking, serverLoadAttempt]);

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
    if (!isLoggedIn || !isLoadedFromServer) return;
    const interval = setInterval(() => {
      void (async () => {
        const result = await apiFetch<Record<string, unknown>>('/api/data');
        if (!result.ok || !result.data || typeof result.data !== 'object') return;
        const serverRev =
          typeof result.data._revision === 'number' ? result.data._revision : null;
        if (
          serverRev !== null &&
          dataRevisionRef.current !== null &&
          serverRev <= dataRevisionRef.current
        ) {
          return;
        }
        applyServerPayload(result.data);
      })();
    }, 30_000);
    return () => clearInterval(interval);
  }, [isLoggedIn, isLoadedFromServer, applyServerPayload]);

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
    setLicenseRevision((r) => r + 1);
    logActivity('Деактивация лицензии', 'Сброшен активный лицензионный ключ системы', 'system');
  };

  const handleUpdateUserAvatar = (userId: string, avatarUrl: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, avatarUrl } : u));
    logActivity('Смена аватара', `Пользователь обновил личный аватар профиля`, 'system');
  };

  const getWorkspacePayload = useCallback(
    (usersOverride?: SystemUser[]) => {
      const repairedWarehouseItems = repairWarehousePendingDuplicates(warehouseItems);
      const repairedComputers = repairDuplicateComputerInventoryNumbers(computers, {
        warehouseItems: repairedWarehouseItems,
        networkDevices,
        softwareItems,
      });
      return {
      objects,
      networkDevices,
      computers: repairedComputers,
      employees,
      warehouseItems: repairedWarehouseItems,
      activities,
      audits,
      softwareItems,
      warehouses,
      warehouseWriteOffs,
      workspaceName,
      adminEmail,
      publicUrl,
      users: usersOverride ?? users,
      tabIcons,
      panelLogo,
      panelColor,
      siteFavicon,
      siteLogo,
      sidebarBgColor,
      sidebarOpacity,
      documentHeader: loadDocumentHeader(),
      documentHeaderPresets: loadDocumentHeaderPresets(),
      ...getLicenseWorkspaceFields(),
      ...getWorkspaceMemFieldsForPayload(),
    };
    },
    [
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
    ]
  );

  const pushWorkspaceToServer = useCallback(
    async (usersOverride?: SystemUser[]): Promise<boolean> => {
      if (!isLoadedFromServer || !isLoggedIn) return false;
      const payload = getWorkspacePayload(usersOverride);
      const repairedComputers = payload.computers;
      if (repairedComputers !== computers) {
        setComputers(repairedComputers);
      }
      const result = await persistWorkspaceState(payload, dataRevisionRef.current, 3);
      if (result.ok === true) {
        setDataRevision(result.revision);
        dataRevisionRef.current = result.revision;
        setSaveError('');
        return true;
      }
      if (result.status === 409) {
        await loadDataFromServer();
      }
      const msg =
        result.status === 403
          ? t('Сохранение отклонено: недостаточно прав (только просмотр).')
          : result.status === 402
            ? t('Сохранение отклонено: лицензия истекла или недействительна.')
            : result.status === 409
              ? t('Конфликт версий данных: загружены актуальные данные с сервера. Повторите изменение.')
            : `${t('Не удалось сохранить данные на сервере')}: ${result.error}`;
      console.warn('Workspace save failed:', result.status, result.error);
      setSaveError(msg);
      return false;
    },
    [getWorkspacePayload, isLoadedFromServer, isLoggedIn, computers, t, loadDataFromServer]
  );

  useEffect(() => {
    if (!isLoggedIn || !isLoadedFromServer || licenseRevision === 0) return;
    void pushWorkspaceToServer();
  }, [licenseRevision, isLoggedIn, isLoadedFromServer, pushWorkspaceToServer]);

  const handleDocumentHeaderPersist = useCallback(() => {
    if (!isLoggedIn || currentUser?.role !== 'Admin') return;
    void pushWorkspaceToServer();
  }, [isLoggedIn, currentUser?.role, pushWorkspaceToServer]);

  const handleAddUser = (u: Omit<SystemUser, 'id'>) => {
    if (checkLicenseBlocked()) return;
    const newUser: SystemUser = {
      ...u,
      login: u.login.trim(),
      email: u.email.trim().toLowerCase(),
      id: `user-${Date.now()}`,
    };
    setUsers((prev) => {
      const next = [...prev, newUser];
      void pushWorkspaceToServer(next);
      return next;
    });
    logActivity('Добавлен пользователь', `Добавлен представитель "${u.name}" с правами "${u.role}"`, 'system');
  };

  const handleDeleteUser = (id: string) => {
    if (checkLicenseBlocked()) return;
    const target = users.find(u => u.id === id);
    if (!target) return;
    setUsers((prev) => {
      const next = prev.filter(u => u.id !== id);
      void pushWorkspaceToServer(next);
      return next;
    });
    logActivity('Отозван доступ', `Отозван доступ к панели у сотрудника "${target.name}"`, 'system');
  };

  const handleUpdateUser = (id: string, updatedFields: Partial<SystemUser>) => {
    if (checkLicenseBlocked()) return;
    const target = users.find(u => u.id === id);
    if (!target) return;
    const normalized: Partial<SystemUser> = { ...updatedFields };
    if (typeof normalized.login === 'string') normalized.login = normalized.login.trim();
    if (typeof normalized.email === 'string') normalized.email = normalized.email.trim().toLowerCase();
    setUsers((prev) => {
      const next = prev.map((u) => (u.id === id ? { ...u, ...normalized } : u));
      if (normalized.password || normalized.login || normalized.email) {
        void pushWorkspaceToServer(next);
      }
      return next;
    });
    logActivity('Изменение параметров доступа', `Обновлены данные учетной записи "${target.name}"`, 'system');

    if (normalized.password && normalized.password !== target.password) {
      const event = new CustomEvent('Vicariustab-password-changed', {
        detail: { userName: target.name }
      });
      window.dispatchEvent(event);
      window.dispatchEvent(new CustomEvent('orbit-password-changed', { detail: event.detail }));
    }
  };

  useEffect(() => {
    if (!isLoadedFromServer || !isLoggedIn) return;

    const timeoutId = setTimeout(() => {
      void pushWorkspaceToServer();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [
    isLoadedFromServer,
    getWorkspacePayload,
    pushWorkspaceToServer,
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
    if (!isLoggedIn) return;
    try {
      const res = await sessionFetch('/api/auth/audit', { headers: authHeaders() });
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
    if (isLoggedIn) {
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

  const handlePreferencesSaved = useCallback((prefs: UserPreferences, revision: number) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUserId ? { ...u, preferences: prefs } : u))
    );
    setDataRevision(revision);
    dataRevisionRef.current = revision;
  }, [currentUserId]);

  const handleSwitchUser = useCallback(async (
    user: SystemUser,
    password: string,
    totp?: { challengeId: string; code: string }
  ): Promise<{ ok: true } | { ok: false; reason: 'credentials' | 'totp_required'; challengeId?: string }> => {
    if (!totp) {
      const prev = users.find((u) => u.id === currentUserId);
      if (prev && isLoggedIn) {
        await logoutUserSession(prev.name);
      }
      clearSessionCredentials();
    }

    if (totp) {
      const session = await verifyTotpLogin(totp.challengeId, totp.code);
      if (!session) return { ok: false, reason: 'credentials' };
      await completeUserLogin(user.id, true);
      return { ok: true };
    }

    const auth = await authenticateCredentials(user.login || user.email, password, user);
    if (!auth) return { ok: false, reason: 'credentials' };
    if (auth.kind === 'totp_required') {
      return { ok: false, reason: 'totp_required', challengeId: auth.challengeId };
    }
    await completeUserLogin(user.id, true);
    return { ok: true };
  }, [users, currentUserId, completeUserLogin]);

  // Session heartbeat + remote security alerts (Admin / Editor)
  useEffect(() => {
    if (!isLoggedIn) return;
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
      alert(t("Доступ заблокирован: Период ознакомления или годовой лицензии завершен. Для разблокировки перейдите на страницу активации и введите ключ."));
      return true;
    }
    return false;
  };

  const equipmentDeleteContext = useMemo(
    () => ({ warehouseItems, networkDevices, softwareItems, computers, warehouses }),
    [warehouseItems, networkDevices, softwareItems, computers, warehouses]
  );

  const equipmentDeletePreview = useMemo(() => {
    if (!equipmentDeleteRequest) return null;
    return buildDeletePreview(
      equipmentDeleteRequest.source,
      equipmentDeleteRequest.id,
      equipmentDeleteContext
    );
  }, [equipmentDeleteRequest, equipmentDeleteContext]);

  const equipmentDeleteModalPreview = useMemo(() => {
    if (!equipmentDeletePreview) return null;
    return {
      title: 'Удаление оборудования',
      subtitle: 'Действие необратимо. Связанные записи будут удалены везде.',
      itemName: equipmentDeletePreview.itemName,
      detailLabel: 'Инв. № / ключ',
      detailValue: equipmentDeletePreview.inventoryLabel,
      cascadeLines: equipmentDeletePreview.cascadeLines,
      confirmLabel: 'Удалить везде',
    };
  }, [equipmentDeletePreview]);

  const equipmentReturnPreview = useMemo(() => {
    if (!equipmentReturnRequest) return null;
    if (equipmentReturnRequest.source === 'computer') {
      const comp = computers.find((c) => c.id === equipmentReturnRequest.id);
      if (!comp) return null;
      const targetWhName = resolveWarehouseNameForObject(comp.objectName, warehouses);
      return {
        itemName: `${comp.category} ${comp.model}`.trim(),
        inventoryLabel: comp.inventoryNumber,
        warehouseName: targetWhName,
      };
    }
    if (equipmentReturnRequest.source === 'network') {
      const dev = networkDevices.find((n) => n.id === equipmentReturnRequest.id);
      if (!dev) return null;
      const targetWhName = resolveWarehouseNameForObject(dev.objectName, warehouses);
      return {
        itemName: dev.deviceName,
        inventoryLabel: normalizeInventoryNumber(dev.inventoryNumber),
        warehouseName: targetWhName,
      };
    }
    const soft = softwareItems.find((s) => s.id === equipmentReturnRequest.id);
    if (!soft) return null;
    const targetWhName = resolveWarehouseNameForObject(soft.objectName, warehouses);
    return {
      itemName: soft.name,
      inventoryLabel: soft.licenseKey || getSoftwareWarehouseInv(soft.id),
      warehouseName: targetWhName,
    };
  }, [equipmentReturnRequest, computers, networkDevices, softwareItems, warehouses]);

  const requestDeleteEquipment = useCallback(
    (source: EquipmentDeleteSource, id: string) => {
      if (currentUser?.role === 'Viewer') return;
      const preview = buildDeletePreview(source, id, equipmentDeleteContext);
      if (!preview) {
        alert(t('Не удалось найти запись для удаления.'));
        return;
      }
      setEquipmentDeleteRequest({ source, id });
    },
    [currentUser, equipmentDeleteContext]
  );

  const requestReturnEquipment = useCallback(
    (source: 'computer' | 'network' | 'software', id: string) => {
      if (currentUser?.role === 'Viewer') return;
      if (source === 'computer') {
        const comp = computers.find((c) => c.id === id);
        if (!comp) {
          alert(t('Не удалось найти активную запись для возврата на склад.'));
          return;
        }
        if (comp.status === 'На складе' || isWrittenOffLifecycleStatus(comp.status)) {
          alert(t('Это оборудование уже на складе или в статусе списания.'));
          return;
        }
      } else if (source === 'network') {
        const dev = networkDevices.find((n) => n.id === id);
        if (!dev) {
          alert(t('Не удалось найти активную запись для возврата на склад.'));
          return;
        }
        if (isWrittenOffLifecycleStatus(dev.status)) {
          alert(t('Это оборудование уже на складе или в статусе списания.'));
          return;
        }
      } else {
        const soft = softwareItems.find((s) => s.id === id);
        if (!soft || soft.status === 'Не активирована') {
          alert(t('Не удалось найти активную запись для возврата на склад.'));
          return;
        }
        if (isWrittenOffLifecycleStatus(soft.status)) {
          alert(t('Это оборудование уже на складе или в статусе списания.'));
          return;
        }
      }
      setEquipmentReturnRequest({ source, id });
    },
    [currentUser, computers, networkDevices, softwareItems, t]
  );

  const clearDetailIfDeleted = useCallback(
    (source: EquipmentDeleteSource, id: string) => {
      setSelectedDetail((prev) => {
        if (!prev) return null;
        if (prev.type === source && prev.id === id) return null;
        return prev;
      });
    },
    []
  );

  const executeEquipmentDelete = useCallback(() => {
    if (!equipmentDeleteRequest) return;
    if (checkLicenseBlocked()) return;

    const { source, id } = equipmentDeleteRequest;
    let logDetail = '';

    if (source === 'warehouse') {
      const target = warehouseItems.find((w) => w.id === id);
      if (!target) {
        setEquipmentDeleteRequest(null);
        return;
      }
      const softIds = findSoftwareIdsForWarehouseItem(target, softwareItems);
      if (target.type === 'Лицензии ПО' || softIds.length > 0) {
        setSoftwareItems((prev) =>
          prev.map((s) =>
            softIds.includes(s.id) ? { ...s, status: 'На списание' as const } : s
          )
        );
        setWarehouseItems((prev) =>
          prev.map((w) =>
            w.id === id ? { ...w, status: 'На списание' as const } : w
          )
        );
        logDetail = `Позиция «${target.name}» и связанные лицензии ПО переведены в статус «На списание»`;
      } else {
        const markQty = normalizePositiveInt(target.quantity);
        const stockIds = new Set(
          pickStockComputerIdsForWriteOff(target, computers, warehouses, markQty)
        );
        setWarehouseItems((prev) =>
          prev.map((w) =>
            w.id === id ? { ...w, status: 'На списание' as const } : w
          )
        );
        setComputers((prev) =>
          prev.map((c) =>
            stockIds.has(c.id) ? { ...c, status: 'На списание' as const } : c
          )
        );
        if (target.type === 'Сетевое оборудование') {
          const lineKey = getWarehouseLineInventoryKey(target.inventoryNumber);
          const matchingNet = networkDevices.find(
            (n) =>
              inventoryNumbersMatch(n.inventoryNumber, lineKey) &&
              n.status !== 'Списано'
          );
          if (matchingNet) {
            setNetworkDevices((prev) =>
              prev.map((n) =>
                n.id === matchingNet.id
                  ? { ...n, status: 'На списание' as const }
                  : n
              )
            );
          }
        }
        logDetail = `Позиция «${target.name}» переведена в статус «На списание»`;
      }
    } else if (source === 'network') {
      const target = networkDevices.find((n) => n.id === id);
      if (!target) {
        setEquipmentDeleteRequest(null);
        return;
      }
      setNetworkDevices((prev) => prev.filter((n) => n.id !== id));
      const targetWhName = resolveWarehouseNameForObject(target.objectName, warehouses);
      returnAssetToWarehouse(
        getWarehouseBatchInventoryKey(target.inventoryNumber),
        target.deviceName,
        'Сетевое оборудование',
        target.deviceName,
        target.cost || 0,
        targetWhName,
        undefined,
        {
          invoiceInfo: target.invoiceInfo,
          memoInfo: target.memoInfo,
          warrantyInfo: target.warrantyInfo,
          pdfFiles: target.pdfFiles,
        },
        target.quantity
      );
      logDetail = `Удалена карточка сетевого оборудования «${target.deviceName}» (инв. № ${target.inventoryNumber}, ${target.quantity} шт.)`;
      clearDetailIfDeleted(source, id);
    } else if (source === 'software') {
      const target = softwareItems.find((s) => s.id === id);
      if (!target) {
        setEquipmentDeleteRequest(null);
        return;
      }
      setSoftwareItems((prev) => prev.filter((s) => s.id !== id));
      setWarehouseItems((prev) => prev.filter((w) => !warehouseItemLinksSoftware(w, target)));
      logDetail = `Удалено ПО «${target.name}» и связанные позиции склада`;
      clearDetailIfDeleted(source, id);
    } else {
      const target = computers.find((c) => c.id === id);
      if (!target) {
        setEquipmentDeleteRequest(null);
        return;
      }
      setComputers((prev) => prev.filter((c) => c.id !== id));
      if (target.status === 'На складе') {
        const batchKey = getWarehouseBatchInventoryKey(target.inventoryNumber);
        const targetWhName = resolveWarehouseNameForObject(target.objectName, warehouses);
        setWarehouseItems((prev) =>
          prev
            .map((w) => {
              if (
                inventoryNumbersMatch(w.inventoryNumber, batchKey) &&
                (w.warehouseName || 'Основной склад ИТ') === targetWhName &&
                isActiveWarehouseStockLine(w)
              ) {
                const newQty = w.quantity - 1;
                return newQty > 0 ? { ...w, quantity: newQty, status: 'В наличии' as const } : null;
              }
              return w;
            })
            .filter((w): w is WarehouseItem => w !== null)
        );
      }
      logDetail = `Удалена карточка «${target.category} ${target.model}» (инв. № ${target.inventoryNumber})`;
      clearDetailIfDeleted(source, id);
    }

    logActivity('Списание оборудования', logDetail, 'update');
    setEquipmentDeleteRequest(null);
  }, [
    equipmentDeleteRequest,
    warehouseItems,
    networkDevices,
    softwareItems,
    computers,
    warehouses,
    clearDetailIfDeleted,
  ]);

  // 2. Data Action handlers (CRUD)
  
  const checkInventoryExists = (invNum: string, excludeId?: string): boolean => {
    const inv = (invNum || '').trim().toLowerCase();
    if (!inv) return false;
    const match = (val?: string) => (val || '').trim().toLowerCase() === inv;
    
    if (warehouseItems.some(w => w.id !== excludeId && match(w.inventoryNumber))) return true;
    if (computers.some(c => c.id !== excludeId && match(c.inventoryNumber))) return true;
    if (networkDevices.some(n => n.id !== excludeId && match(n.inventoryNumber))) return true;
    if (softwareItems.some(s => s.id !== excludeId && (match(s.licenseKey) || match(getSoftwareWarehouseInv(s.id))))) return true;
    
    return false;
  };

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

  const handleArchiveObject = (id: string, isArchived: boolean) => {
    if (checkLicenseBlocked()) return;
    setObjects(prev => prev.map(o => o.id === id ? { ...o, isArchived } : o));
    logActivity('Управление Объектами', `Объект "${objects.find(o => o.id === id)?.name}" ${isArchived ? 'архивирован' : 'восстановлен из архива'}`, 'update');
  };

  const handleDeleteObject = (id: string) => {
    if (checkLicenseBlocked()) return;
    const target = objects.find(o => o.id === id);
    if (!target) return;
    setObjects(prev => prev.filter(obj => obj.id !== id));
    logActivity('Удален объект', `Удален объект "${target.name}"`, 'delete');
  };

  const handleAddNetwork = (device: Omit<NetworkDevice, 'id'>): boolean | void => {
    if (checkLicenseBlocked()) return false;
    if (checkInventoryExists(device.inventoryNumber)) {
      alert(interpolate(t('Оборудование с инвентарным номером {inv} уже существует!'), { inv: device.inventoryNumber }));
      return false;
    }
    const newDevice: NetworkDevice = {
      ...device,
      id: `net-${Date.now()}`,
    };
    setNetworkDevices(prev => [...prev, newDevice]);
    logActivity('Добавлено сетевое оборудование', `Добавлено устройство "${device.deviceName}"`, 'create');
    return true;
  };

  const handleEditNetwork = (id: string, device: Omit<NetworkDevice, 'id'>): boolean | void => {
    if (checkLicenseBlocked()) return false;
    if (checkInventoryExists(device.inventoryNumber, id)) {
      alert(interpolate(t('Оборудование с инвентарным номером {inv} уже существует!'), { inv: device.inventoryNumber }));
      return false;
    }
    setNetworkDevices(prev => prev.map(dev => dev.id === id ? { ...dev, ...device } : dev));
    logActivity('Изменено сетевое оборудование', `Параметры оборудования "${device.deviceName}" изменены`, 'update');
    return true;
  };

  // Computers CRUD
  const handleArchiveEmployee = (id: string, isArchived: boolean) => {
    if (checkLicenseBlocked()) return;
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, isArchived } : e));
    logActivity('Управление Персоналом', `Сотрудник "${employees.find(e => e.id === id)?.name}" ${isArchived ? 'архивирован' : 'восстановлен из архива'}`, 'update');
  };

  const returnAssetToWarehouse = (
    inventoryNumber: string,
    name: string,
    category: string,
    model: string,
    cost: number,
    targetWarehouseName: string,
    specs?: ReturnType<typeof getWarehouseItemSpecs>,
    meta?: {
      deviceType?: string;
      invoiceInfo?: string;
      memoInfo?: string;
      warrantyInfo?: string;
      pdfFiles?: WarehouseItem['pdfFiles'];
    },
    quantity = 1
  ) => {
    const returnQty = Math.max(1, quantity);
    const incomingSpecs = specs || {};
    const returnedSerials = (() => {
      const fromUnits =
        incomingSpecs.unitSerialNumbers?.map((s) => s.trim()).filter(Boolean) ?? [];
      if (fromUnits.length > 0) return fromUnits.slice(0, returnQty);
      const sn = (incomingSpecs.serialNumber || '').trim();
      return sn ? [sn] : [];
    })();

    setWarehouseItems((prev) => {
      const batchKey = getWarehouseLineInventoryKey(inventoryNumber);
      const existingWhIndex = findActiveWarehouseStockLineIndex(
        prev,
        batchKey,
        targetWarehouseName
      );

      if (existingWhIndex > -1) {
        return prev.map((item, idx) => {
          if (idx !== existingWhIndex) return item;
          const baseSpecs = getWarehouseItemSpecs(item);
          const mergedSpecs = mergeWarehouseReceiptSpecs(baseSpecs, incomingSpecs);
          const increased = increaseWarehouseItemAfterReturn(
            { ...item, ...baseSpecs },
            returnQty,
            returnedSerials.length > 0 ? returnedSerials : undefined
          );
          return {
            ...item,
            ...mergedSpecs,
            ...increased,
            status: 'В наличии' as const,
            model: model || item.model,
            costPerUnit: cost || item.costPerUnit,
            deviceType: meta?.deviceType || item.deviceType,
            invoiceInfo: meta?.invoiceInfo || item.invoiceInfo,
            memoInfo: meta?.memoInfo || item.memoInfo,
            warrantyInfo: meta?.warrantyInfo || item.warrantyInfo,
            pdfFiles: meta?.pdfFiles?.length ? meta.pdfFiles : item.pdfFiles,
          };
        });
      }

      let whType: WarehouseItemType = 'Другое';
      if (category === 'Ноутбук' || category === 'ПК') whType = 'Компьютеры';
      else if (category === 'Монитор' || category === 'Периферия') whType = 'Периферия';
      else if (category === 'Оргтехника') whType = 'Оргтехника';
      else if (category === 'Видеонаблюдение') whType = 'Видеонаблюдение';
      else if (category === 'Расходники') whType = 'Расходные материалы';
      else if (category === 'Сетевое оборудование') whType = 'Сетевое оборудование';

      const receiptSpecs = warehouseSpecsForQuantity(
        incomingSpecs,
        returnQty,
        returnedSerials.length > 0
          ? normalizeUnitSerialNumbers(returnQty, returnedSerials)
          : normalizeUnitSerialNumbers(returnQty, incomingSpecs.unitSerialNumbers)
      );

      const newWhItem: WarehouseItem = {
        id: `wh-item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name,
        type: whType,
        model,
        inventoryNumber: batchKey,
        quantity: returnQty,
        unit: 'шт.',
        costPerUnit: cost || 0,
        status: 'В наличии',
        warehouseName: targetWarehouseName,
        deviceType: meta?.deviceType,
        invoiceInfo: meta?.invoiceInfo,
        memoInfo: meta?.memoInfo,
        warrantyInfo: meta?.warrantyInfo,
        pdfFiles: meta?.pdfFiles,
        ...receiptSpecs,
      };
      return [...prev, newWhItem];
    });
  };

  const warehouseReturnMetaFromComputer = (comp: ComputerItem) => ({
    specs: getWarehouseItemSpecs(comp),
    deviceType: comp.deviceType,
    invoiceInfo: comp.invoiceInfo,
    memoInfo: comp.memoInfo,
    warrantyInfo: comp.warrantyInfo,
    pdfFiles: comp.pdfFiles,
  });

  const handleReturnToWarehouse = (itemSource: 'computer' | 'network', itemId: string) => {
    if (itemSource === 'computer') {
      const comp = computers.find((c) => c.id === itemId);
      const targetWhName = comp
        ? resolveWarehouseNameForObject(comp.objectName, warehouses)
        : warehouses[0]?.name || 'Основной склад ИТ';
      handleReturnActiveAssetToWarehouse(itemSource, itemId, targetWhName);
      return;
    }
    const dev = networkDevices.find((n) => n.id === itemId);
    const targetWhName = dev
      ? resolveWarehouseNameForObject(dev.objectName, warehouses)
      : warehouses[0]?.name || 'Основной склад ИТ';
    handleReturnActiveAssetToWarehouse(itemSource, itemId, targetWhName);
  };

  const handleReturnActiveAssetToWarehouse = (
    itemSource: 'computer' | 'network' | 'software',
    itemId: string,
    targetWarehouseName: string
  ) => {
    if (checkLicenseBlocked()) return;

    if (itemSource === 'software') {
      handleReturnSoftwareToWarehouse(itemId, targetWarehouseName);
      return;
    }

    const targetWhName = targetWarehouseName || warehouses[0]?.name || 'Основной склад ИТ';
    const stockObjectName = resolveStockObjectForWarehouse(targetWhName, warehouses, objects);

    if (itemSource === 'computer') {
      const comp = computers.find((c) => c.id === itemId);
      if (!comp || comp.status === 'На складе' || isWrittenOffLifecycleStatus(comp.status)) return;

      const returnMeta = warehouseReturnMetaFromComputer(comp);
      returnAssetToWarehouse(
        comp.inventoryNumber,
        comp.deviceType || comp.category,
        comp.category,
        comp.model,
        comp.cost || 0,
        targetWhName,
        returnMeta.specs,
        returnMeta
      );

      setComputers((prev) =>
        prev.map((c) =>
          c.id === itemId
            ? {
                ...c,
                status: 'На складе',
                employeeName: 'Склад ИТ',
                objectName: stockObjectName,
              }
            : c
        )
      );

      logActivity(
        'Возврат на склад',
        `Оборудование "${comp.category} ${comp.model}" (Инв. № ${comp.inventoryNumber}) возвращено на склад "${targetWhName}" (статус «На складе»)`,
        'update'
      );
    } else {
      const dev = networkDevices.find((n) => n.id === itemId);
      if (!dev || isWrittenOffLifecycleStatus(dev.status)) return;

      const normalizedInv = normalizeInventoryNumber(dev.inventoryNumber);
      const returnQty = 1;

      if (dev.quantity > returnQty) {
        setNetworkDevices((prev) => {
          const stockNet = prev.find(
            (n) =>
              n.id !== itemId &&
              inventoryNumbersMatch(n.inventoryNumber, normalizedInv) &&
              n.objectName === stockObjectName
          );
          const decremented = prev.map((n) =>
            n.id === itemId ? { ...n, quantity: n.quantity - returnQty } : n
          );
          if (stockNet) {
            return decremented.map((n) =>
              n.id === stockNet.id ? { ...n, quantity: n.quantity + returnQty } : n
            );
          }
          const returnedNet: NetworkDevice = {
            ...dev,
            id: `net-wh-ret-${Date.now()}`,
            quantity: returnQty,
            objectName: stockObjectName,
            inventoryNumber: normalizedInv,
          };
          return [...decremented, returnedNet];
        });
      } else {
        setNetworkDevices((prev) =>
          prev.map((n) =>
            n.id === itemId
              ? { ...n, objectName: stockObjectName, inventoryNumber: normalizedInv }
              : n
          )
        );
      }

      returnAssetToWarehouse(
        normalizedInv,
        dev.deviceName,
        'Сетевое оборудование',
        dev.deviceName,
        dev.cost || 0,
        targetWhName,
        undefined,
        {
          invoiceInfo: dev.invoiceInfo,
          memoInfo: dev.memoInfo,
          warrantyInfo: dev.warrantyInfo,
          pdfFiles: dev.pdfFiles,
        }
      );

      logActivity(
        'Возврат на склад',
        `Сетевой актив "${dev.deviceName}" (Инв. № ${normalizedInv}) возвращен на склад "${targetWhName}"`,
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

    const invKey = getWarehouseBatchInventoryKey(sourceItem.inventoryNumber);
    const stockObjectName = resolveStockObjectForWarehouse(targetWarehouseName, warehouses, objects);
    const sourceObjectName = resolveStockObjectForWarehouse(sourceWarehouseName, warehouses, objects);

    setWarehouseItems(prev => {
      let nextList = prev.map(w => {
        if (w.id === itemId) {
          return { ...w, quantity: w.quantity - quantity };
        }
        return w;
      }).filter(w => w.quantity > 0);

      const targetIndex = nextList.findIndex(
        (w) =>
          inventoryNumbersMatch(w.inventoryNumber, invKey) &&
          (w.warehouseName || 'Основной склад ИТ') === targetWarehouseName &&
          isActiveWarehouseStockLine(w)
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
          quantity,
          warehouseName: targetWarehouseName,
          inventoryNumber: invKey,
        };
        nextList.push(newStockItem);
      }

      return nextList;
    });

    setComputers((prev) =>
      prev.map((c) =>
        c.status === 'На складе' && inventoryNumbersMatch(c.inventoryNumber, invKey)
          ? { ...c, objectName: stockObjectName, employeeName: 'Склад ИТ' }
          : c
      )
    );

    setNetworkDevices((prev) =>
      prev.map((n) =>
        inventoryNumbersMatch(n.inventoryNumber, invKey) && n.objectName === sourceObjectName
          ? { ...n, objectName: stockObjectName }
          : n
      )
    );

    logActivity(
      'Перемещение ТМЦ', 
      `Товар "${sourceItem.name}" (${quantity} шт.) перемещен со склада "${sourceWarehouseName}" на склад "${targetWarehouseName}"`, 
      'update'
    );
  };

  const handleWarehouseSplit = (
    id: string,
    options: {
      splitQty: number;
      splitIntoUnits?: boolean;
    }
  ): boolean => {
    if (checkLicenseBlocked()) return false;

    const source = warehouseItems.find((w) => w.id === id);
    if (!source || !isActiveWarehouseStockLine(source)) return false;

    const splitQty = Math.floor(options.splitQty);
    if (splitQty < 1 || splitQty > source.quantity) {
      alert(t('Укажите количество для разделения от 1 до текущего остатка на складе.'));
      return false;
    }

    const isNetwork = source.type === 'Сетевое оборудование';
    const isSoftware = source.type === 'Лицензии ПО';
    const sourceLineKey = getWarehouseLineInventoryKey(source.inventoryNumber);
    const rootBase = getSplitRootInventoryNumber(
      source.inventoryNumber,
      source.splitFromInventoryNumber
    );
    const receiptSpecs = getWarehouseItemSpecs(source);
    const linkedWarehouse = warehouses.find((w) => w.name === source.warehouseName);
    const defaultObjectName = linkedWarehouse?.objectName || objects[0]?.name || 'Главный офис';

    const stockSuffixRank = (inv: string) => {
      const cur = (inv || '').trim();
      const line = getWarehouseLineInventoryKey(cur);
      if (line === sourceLineKey) return 0;
      const m = cur.match(/-(\d+)$/);
      return m ? parseInt(m[1], 10) : 0;
    };

    const stockComputerCards = computers
      .filter(
        (c) =>
          matchesBaseInventoryNumber(c.inventoryNumber, sourceLineKey) &&
          c.status === 'На складе'
      )
      .sort(
        (a, b) =>
          stockSuffixRank(a.inventoryNumber || '') - stockSuffixRank(b.inventoryNumber || '')
      );

    const sourceUnitSerials = (() => {
      const fromLine = normalizeUnitSerialNumbers(source.quantity, source.unitSerialNumbers);
      if (fromLine.some((s) => s.trim())) return fromLine;
      if (stockComputerCards.length > 0) {
        return stockComputerCards.map((c) => (c.serialNumber || '').trim());
      }
      return fromLine;
    })();
    const { taken: takenSerials, remaining: remainingSerials } = partitionUnitSerialNumbers(
      source.quantity,
      sourceUnitSerials,
      splitQty
    );
    const remainingQty = source.quantity - splitQty;
    const remainingSpecs = warehouseSpecsForQuantity(
      receiptSpecs,
      remainingQty,
      remainingSerials
    );

    if (isNetwork) {
      const matchingNetwork = networkDevices.find((n) =>
        inventoryNumbersMatch(n.inventoryNumber, sourceLineKey)
      );
      if (matchingNetwork && splitQty > (matchingNetwork.quantity || 1)) {
        alert(t('Нельзя разделить больше единиц, чем доступно в реестре сетевого оборудования на складе.'));
        return false;
      }
    }

    const allInvNumbers = (): string[] => {
      const nums: string[] = [];
      for (const w of warehouseItems) {
        if (w.inventoryNumber?.trim()) nums.push(w.inventoryNumber.trim());
      }
      for (const c of computers) {
        if (c.inventoryNumber?.trim()) nums.push(c.inventoryNumber.trim());
      }
      for (const n of networkDevices) {
        if (n.inventoryNumber?.trim()) nums.push(n.inventoryNumber.trim());
      }
      return nums;
    };

    const createWarehouseLine = (
      qty: number,
      inv: string,
      lineId: string,
      partIndex: number,
      unitSerials: string[]
    ): WarehouseItem => ({
      ...source,
      ...warehouseSpecsForQuantity(receiptSpecs, qty, unitSerials),
      id: lineId,
      inventoryNumber: inv,
      quantity: qty,
      status: 'В наличии',
      splitFromInventoryNumber: rootBase,
      splitPartIndex: partIndex,
    });

    const newLines: WarehouseItem[] = [];
    const cardReassignments = new Map<string, string>();
    let nextPartIndex = allocateNextSplitPartIndex(rootBase, warehouseItems);

    if (options.splitIntoUnits) {
      for (let i = 0; i < splitQty; i++) {
        const splitInv = formatSplitWarehouseInventoryNumber(rootBase, nextPartIndex);
        const lineId = `wh-split-${Date.now()}-${i}-${Math.floor(Math.random() * 10000)}`;
        newLines.push(
          createWarehouseLine(1, splitInv, lineId, nextPartIndex, [takenSerials[i] || ''])
        );
        const card = stockComputerCards[i];
        if (card) cardReassignments.set(card.id, splitInv);
        nextPartIndex += 1;
      }
    } else {
      const splitInv = formatSplitWarehouseInventoryNumber(rootBase, nextPartIndex);
      const lineId = `wh-split-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      newLines.push(createWarehouseLine(splitQty, splitInv, lineId, nextPartIndex, takenSerials));

      const cardsToMove = stockComputerCards.slice(0, splitQty);
      const newInvNums = allocateBatchInventoryNumbers(splitInv, allInvNumbers(), cardsToMove.length);
      cardsToMove.forEach((card, idx) => {
        cardReassignments.set(card.id, newInvNums[idx] || splitInv);
      });
    }

    setWarehouseItems((prev) => {
      const reduced = prev
        .map((w) => {
          if (w.id !== id) return w;
          const remaining = w.quantity - splitQty;
          if (remaining <= 0) return null;
          return {
            ...w,
            quantity: remaining,
            ...remainingSpecs,
          };
        })
        .filter((w): w is WarehouseItem => w !== null);
      return [...reduced, ...newLines];
    });

    if (cardReassignments.size > 0) {
      setComputers((prev) =>
        prev.map((c) =>
          cardReassignments.has(c.id)
            ? { ...c, inventoryNumber: cardReassignments.get(c.id)! }
            : c
        )
      );
    }

    if (isNetwork) {
      setNetworkDevices((prev) => {
        const matchingNetwork = prev.find((n) =>
          inventoryNumbersMatch(n.inventoryNumber, sourceLineKey)
        );
        if (!matchingNetwork) return prev;

        if (options.splitIntoUnits) {
          const stockNet = { ...matchingNetwork };
          const remainingQty = (stockNet.quantity || 1) - splitQty;
          const splitNets: NetworkDevice[] = newLines.map((line, i) => ({
            ...stockNet,
            id: `net-split-${Date.now()}-${i}-${Math.floor(Math.random() * 10000)}`,
            inventoryNumber: line.inventoryNumber,
            quantity: 1,
            objectName: defaultObjectName,
            cost: stockNet.cost || source.costPerUnit,
          }));
          return [
            ...prev
              .map((n) =>
                n.id === matchingNetwork.id
                  ? remainingQty > 0
                    ? { ...n, quantity: remainingQty }
                    : null
                  : n
              )
              .filter((n): n is NetworkDevice => n !== null),
            ...splitNets,
          ];
        }

        const splitLine = newLines[0];
        const splitNet: NetworkDevice = {
          ...matchingNetwork,
          id: `net-split-${Date.now()}`,
          inventoryNumber: splitLine.inventoryNumber,
          quantity: splitQty,
          objectName: defaultObjectName,
          cost: matchingNetwork.cost || source.costPerUnit,
        };
        const remainingQty = (matchingNetwork.quantity || 1) - splitQty;
        return [
          ...prev
            .map((n) =>
              n.id === matchingNetwork.id
                ? remainingQty > 0
                  ? { ...n, quantity: remainingQty }
                  : null
                : n
            )
            .filter((n): n is NetworkDevice => n !== null),
          splitNet,
        ];
      });
    }

    if (isSoftware) {
      setSoftwareItems((prev) => {
        const linkedSoft = prev.find((s) => warehouseItemLinksSoftware(source, s));
        if (!linkedSoft) return prev;

        if (options.splitIntoUnits) {
          const splitSoftLines: SoftwareItem[] = newLines.map((line, i) => ({
            ...linkedSoft,
            id: `soft-split-${Date.now()}-${i}-${Math.floor(Math.random() * 10000)}`,
            licenseKey:
              line.inventoryNumber.startsWith('SW-') || !linkedSoft.licenseKey
                ? linkedSoft.licenseKey
                : line.inventoryNumber,
            quantity: 1,
            status: 'Не активирована' as const,
          }));
          const remainingQty = (linkedSoft.quantity || 1) - splitQty;
          return [
            ...prev
              .map((s) =>
                s.id === linkedSoft.id
                  ? remainingQty > 0
                    ? { ...s, quantity: remainingQty }
                    : null
                  : s
              )
              .filter((s): s is SoftwareItem => s !== null),
            ...splitSoftLines,
          ];
        }

        const splitLine = newLines[0];
        const splitSoft: SoftwareItem = {
          ...linkedSoft,
          id: `soft-split-${Date.now()}`,
          licenseKey:
            splitLine.inventoryNumber.startsWith('SW-') || !linkedSoft.licenseKey
              ? linkedSoft.licenseKey
              : splitLine.inventoryNumber,
          quantity: splitQty,
          status: 'Не активирована',
        };
        const remainingQty = (linkedSoft.quantity || 1) - splitQty;
        return [
          ...prev
            .map((s) =>
              s.id === linkedSoft.id
                ? remainingQty > 0
                  ? { ...s, quantity: remainingQty }
                  : null
                : s
            )
            .filter((s): s is SoftwareItem => s !== null),
          splitSoft,
        ];
      });
    }

    const newInvSummary = newLines.map((l) => l.inventoryNumber).join(', ');
    logActivity(
      'Разделение партии ТМЦ',
      `Позиция "${source.name}" (${sourceLineKey}): отделено ${splitQty} шт. → ${newInvSummary} (разд. от ${rootBase})`,
      'update'
    );
    return true;
  };

  const handleWarehouseMergeSplit = (splitItemId: string): boolean => {
    if (checkLicenseBlocked()) return false;

    const splitItem = warehouseItems.find((w) => w.id === splitItemId);
    if (!splitItem || !isActiveWarehouseStockLine(splitItem)) return false;

    const rootBase =
      splitItem.splitFromInventoryNumber ||
      getSplitRootInventoryNumber(splitItem.inventoryNumber, splitItem.splitFromInventoryNumber);
    if (!rootBase || getWarehouseLineInventoryKey(splitItem.inventoryNumber) === rootBase) {
      alert(t('Эта позиция не является разделённой частью партии.'));
      return false;
    }

    const whName = splitItem.warehouseName || 'Основной склад ИТ';
    const splitLineKey = getWarehouseLineInventoryKey(splitItem.inventoryNumber);
    const mergeQty = splitItem.quantity;
    const isNetwork = splitItem.type === 'Сетевое оборудование';
    const isSoftware = splitItem.type === 'Лицензии ПО';

    const stockComputerCards = computers
      .filter(
        (c) =>
          matchesBaseInventoryNumber(c.inventoryNumber, splitLineKey) && c.status === 'На складе'
      )
      .sort((a, b) => (a.inventoryNumber || '').localeCompare(b.inventoryNumber || ''));

    const allInvNumbers = (): string[] => {
      const nums: string[] = [];
      for (const w of warehouseItems) {
        if (w.id !== splitItem.id && w.inventoryNumber?.trim()) nums.push(w.inventoryNumber.trim());
      }
      for (const c of computers) {
        if (c.inventoryNumber?.trim()) nums.push(c.inventoryNumber.trim());
      }
      for (const n of networkDevices) {
        if (n.inventoryNumber?.trim()) nums.push(n.inventoryNumber.trim());
      }
      return nums;
    };

    const parentBefore = warehouseItems.find(
      (w) =>
        w.id !== splitItem.id &&
        getWarehouseLineInventoryKey(w.inventoryNumber) === rootBase &&
        (w.warehouseName || 'Основной склад ИТ') === whName &&
        isActiveWarehouseStockLine(w)
    );
    const existingParentUnits = parentBefore
      ? computers.filter(
          (c) =>
            matchesBaseInventoryNumber(c.inventoryNumber, rootBase) &&
            c.status === 'На складе'
        ).length
      : 0;
    const parentQtyAfter = (parentBefore?.quantity || 0) + mergeQty;

    setWarehouseItems((prev) => {
      const withoutSplit = prev.filter((w) => w.id !== splitItemId);
      const parent = prev.find(
        (w) =>
          w.id !== splitItemId &&
          getWarehouseLineInventoryKey(w.inventoryNumber) === rootBase &&
          (w.warehouseName || 'Основной склад ИТ') === whName &&
          isActiveWarehouseStockLine(w)
      );
      if (parent) {
        return withoutSplit.map((w) => {
          if (w.id !== parent.id) return w;
          const mergedLineSpecs = mergeWarehouseLineSpecs(
            w.quantity,
            getWarehouseItemSpecs(w),
            mergeQty,
            getWarehouseItemSpecs(splitItem)
          );
          return {
            ...w,
            quantity: w.quantity + mergeQty,
            ...mergedLineSpecs,
          };
        });
      }

      const restoredSpecs = mergeWarehouseLineSpecs(
        0,
        {},
        mergeQty,
        getWarehouseItemSpecs(splitItem)
      );
      const restored: WarehouseItem = {
        ...splitItem,
        ...restoredSpecs,
        id: `wh-merge-${Date.now()}`,
        inventoryNumber: rootBase,
        quantity: mergeQty,
        splitFromInventoryNumber: undefined,
        splitPartIndex: undefined,
      };
      return [...withoutSplit, restored];
    });

    if (stockComputerCards.length > 0) {
      const newInvNums = allocateBatchInventoryNumbers(
        rootBase,
        allInvNumbers(),
        Math.max(parentQtyAfter, existingParentUnits + stockComputerCards.length)
      );
      const cardReassignments = new Map<string, string>();
      stockComputerCards.forEach((card, idx) => {
        const target =
          newInvNums[existingParentUnits + idx] ||
          (parentQtyAfter > 1 ? `${rootBase}-${existingParentUnits + idx + 1}` : rootBase);
        cardReassignments.set(card.id, target);
      });
      setComputers((prev) =>
        prev.map((c) =>
          cardReassignments.has(c.id)
            ? { ...c, inventoryNumber: cardReassignments.get(c.id)! }
            : c
        )
      );
    }

    if (isNetwork) {
      setNetworkDevices((prev) => {
        const splitNet = prev.find((n) => inventoryNumbersMatch(n.inventoryNumber, splitLineKey));
        if (!splitNet) return prev;
        const parentNet = prev.find(
          (n) =>
            n.id !== splitNet.id &&
            inventoryNumbersMatch(n.inventoryNumber, rootBase) &&
            n.objectName === splitNet.objectName
        );
        const withoutSplitNet = prev.filter((n) => n.id !== splitNet.id);
        if (parentNet) {
          return withoutSplitNet.map((n) =>
            n.id === parentNet.id ? { ...n, quantity: (n.quantity || 1) + mergeQty } : n
          );
        }
        return [
          ...withoutSplitNet,
          {
            ...splitNet,
            id: `net-merge-${Date.now()}`,
            inventoryNumber: rootBase,
            quantity: mergeQty,
          },
        ];
      });
    }

    if (isSoftware) {
      setSoftwareItems((prev) => {
        const splitSoft = prev.find((s) => warehouseItemLinksSoftware(splitItem, s));
        if (!splitSoft) return prev;
        const parentWh =
          parentBefore ||
          ({
            ...splitItem,
            inventoryNumber: rootBase,
            type: 'Лицензии ПО' as const,
          } as WarehouseItem);
        const parentSoft = prev.find(
          (s) => s.id !== splitSoft.id && warehouseItemLinksSoftware(parentWh, s)
        );
        const withoutSplitSoft = prev.filter((s) => s.id !== splitSoft.id);
        if (parentSoft) {
          return withoutSplitSoft.map((s) =>
            s.id === parentSoft.id
              ? { ...s, quantity: (s.quantity || 1) + mergeQty }
              : s
          );
        }
        return [
          ...withoutSplitSoft,
          {
            ...splitSoft,
            id: `soft-merge-${Date.now()}`,
            licenseKey:
              rootBase.startsWith('SW-') || !splitSoft.licenseKey ? splitSoft.licenseKey : rootBase,
            quantity: mergeQty,
            status: 'Не активирована' as const,
          },
        ];
      });
    }

    logActivity(
      'Сборка партии ТМЦ',
      `Разделённая позиция ${splitLineKey} (${mergeQty} шт.) собрана обратно в партию ${rootBase}`,
      'update'
    );
    return true;
  };

  const handleAddComputer = (comp: Omit<ComputerItem, 'id'>): boolean | void => {
    if (checkLicenseBlocked()) return false;
    if (checkInventoryExists(comp.inventoryNumber)) {
      alert(interpolate(t('Оборудование с инвентарным номером {inv} уже существует!'), { inv: comp.inventoryNumber }));
      return false;
    }
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
    return true;
  };

  const handleEditComputer = (id: string, comp: Omit<ComputerItem, 'id'>): boolean | void => {
    if (checkLicenseBlocked()) return false;
    if (checkInventoryExists(comp.inventoryNumber, id)) {
      alert(interpolate(t('Оборудование с инвентарным номером {inv} уже существует!'), { inv: comp.inventoryNumber }));
      return false;
    }

    const prevComp = computers.find((c) => c.id === id);

    if (comp.status === 'На складе') {
      const targetWarehouse = resolveWarehouseNameForObject(comp.objectName, warehouses);
      const stockObject = resolveStockObjectForWarehouse(targetWarehouse, warehouses, objects);
      if (prevComp?.status !== 'На складе') {
        returnAssetToWarehouse(
          comp.inventoryNumber,
          comp.deviceType || comp.category,
          comp.category,
          comp.model,
          comp.cost || 0,
          targetWarehouse,
          getWarehouseItemSpecs(comp),
          {
            deviceType: comp.deviceType,
            invoiceInfo: comp.invoiceInfo,
            memoInfo: comp.memoInfo,
            warrantyInfo: comp.warrantyInfo,
            pdfFiles: comp.pdfFiles,
          }
        );
      }
      setComputers((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                ...comp,
                status: 'На складе',
                employeeName: 'Склад ИТ',
                objectName: stockObject,
                model: limitEquipmentTitle(comp.model.trim()),
              }
            : c
        )
      );
      logActivity(
        'Возврат на склад',
        `Оборудование "${comp.category} ${comp.model}" (Инв. № ${comp.inventoryNumber}) возвращено на склад "${targetWarehouse}" через смену статуса`,
        'update'
      );
    } else {
      setComputers(prev => prev.map(c => c.id === id ? { ...c, ...comp, model: limitEquipmentTitle(comp.model.trim()) } : c));
      logActivity('Изменен статус ПК', `Параметры "${comp.category} ${comp.model}" изменены (Статус: ${comp.status})`, 'update');
    }
    return true;
  };

  // Software CRUD
  const handleAddSoftware = (soft: Omit<SoftwareItem, 'id'>): boolean | void => {
    if (checkLicenseBlocked()) return false;
    const keysToCheck =
      soft.licenseKeys?.filter((k) => k.trim() && k.trim() !== t('Без ключа')) ??
      (soft.licenseKey && soft.licenseKey !== t('Без ключа') ? [soft.licenseKey] : []);
    for (const key of keysToCheck) {
      if (checkInventoryExists(key)) {
        alert(interpolate(t('ПО с ключом/инвентарным номером {key} уже существует!'), { key }));
        return false;
      }
    }
    const newSoft: SoftwareItem = {
      ...soft,
      id: `soft-${Date.now()}`,
    };
    setSoftwareItems(prev => [...prev, newSoft]);
    logActivity('Добавлено ПО', `Добавлена программа "${soft.name} (v${soft.version})" [${soft.category}]`, 'create');
    return true;
  };

  const handleEditSoftware = (id: string, soft: Omit<SoftwareItem, 'id'>): boolean | void => {
    if (checkLicenseBlocked()) return false;
    const keysToCheck =
      soft.licenseKeys?.filter((k) => k.trim() && k.trim() !== t('Без ключа')) ??
      (soft.licenseKey && soft.licenseKey !== t('Без ключа') ? [soft.licenseKey] : []);
    for (const key of keysToCheck) {
      if (checkInventoryExists(key, id)) {
        alert(interpolate(t('ПО с ключом/инвентарным номером {key} уже существует!'), { key }));
        return false;
      }
    }
    setSoftwareItems(prev => prev.map(s => s.id === id ? { ...s, ...soft } : s));
    logActivity('Изменено ПО', `Параметры ПО "${soft.name}" обновлены`, 'update');
    return true;
  };

  const handleUnassignSoftwareSeat = (id: string, seatIndex: number) => {
    if (checkLicenseBlocked()) return;
    const soft = softwareItems.find((s) => s.id === id);
    if (!soft) return;
    const seats = ensureLicenseSeats(soft);
    if (!isLicenseSeatAssigned(seats.find((s) => s.seatIndex === seatIndex) ?? { seatIndex, assignedEmployeeName: FREE_LICENSE_EMPLOYEE })) {
      return;
    }
    const nextSeats = unassignLicenseSeat(seats, seatIndex);
    const updated = applySoftwareSeatPatch(soft, nextSeats);
    setSoftwareItems((prev) => prev.map((s) => (s.id === id ? updated : s)));
    logActivity(
      'Снято с выдачи',
      `ПО «${soft.name}»: место ${seatIndex + 1} откреплено (${countFreeLicenseSeats(nextSeats)} из ${nextSeats.length} свободно)`,
      'update'
    );
  };

  const handleReturnSoftwareToWarehouse = (id: string, _targetWarehouseName?: string) => {
    if (checkLicenseBlocked()) return;
    const soft = softwareItems.find((s) => s.id === id);
    if (!soft || soft.status === 'Не активирована' || isWrittenOffLifecycleStatus(soft.status)) return;

    const seats = ensureLicenseSeats(soft);
    const seatIndex = findFirstAssignedSeatIndex(seats);
    if (seatIndex == null) return;

    const nextSeats = unassignLicenseSeat(seats, seatIndex);
    const updated = applySoftwareSeatPatch(soft, nextSeats);

    setSoftwareItems((prev) => prev.map((s) => (s.id === id ? updated : s)));

    logActivity(
      'Снято с выдачи',
      `ПО «${soft.name}»: место ${seatIndex + 1} возвращено в свободный пул (${countFreeLicenseSeats(nextSeats)} из ${nextSeats.length} свободно)`,
      'update'
    );
  };

  const executeEquipmentReturn = () => {
    if (!equipmentReturnRequest) return;
    if (checkLicenseBlocked()) return;
    const { source, id } = equipmentReturnRequest;
    if (source === 'software') {
      const soft = softwareItems.find((s) => s.id === id);
      const targetWh = soft
        ? resolveWarehouseNameForObject(soft.objectName, warehouses)
        : warehouses[0]?.name || 'Основной склад ИТ';
      handleReturnSoftwareToWarehouse(id, targetWh);
    } else {
      handleReturnToWarehouse(source, id);
    }
    setEquipmentReturnRequest(null);
  };

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

    if (targetEmployeeName === 'Склад ИТ') {
      const toReturn = computers.filter(
        (c) =>
          c.employeeName === sourceEmployeeName &&
          c.status !== 'На складе' &&
          c.status !== 'Списано' &&
          c.status !== 'На списание'
      );
      for (const comp of toReturn) {
        const targetWh = resolveWarehouseNameForObject(comp.objectName, warehouses);
        const returnMeta = warehouseReturnMetaFromComputer(comp);
        returnAssetToWarehouse(
          comp.inventoryNumber,
          comp.deviceType || comp.category,
          comp.category,
          comp.model,
          comp.cost || 0,
          targetWh,
          returnMeta.specs,
          returnMeta
        );
      }
    }

    setComputers((prev) =>
      prev.map((c) => {
        if (c.employeeName !== sourceEmployeeName) return c;
        if (targetEmployeeName === 'Склад ИТ') {
          const targetWh = resolveWarehouseNameForObject(c.objectName, warehouses);
          const stockObject = resolveStockObjectForWarehouse(targetWh, warehouses, objects);
          return {
            ...c,
            employeeName: 'Склад ИТ',
            status: 'На складе',
            objectName: stockObject,
          };
        }
        return { ...c, employeeName: targetEmployeeName };
      })
    );
    const destName = targetEmployeeName === 'Склад ИТ' ? 'Склад ИТ (в запас)' : `сотруднику "${targetEmployeeName}"`;
    logActivity(
      'Перемещение оборудования',
      `Все оборудование сотрудника "${sourceEmployeeName}" передано на ${destName}`,
      'update'
    );
  };

  const handleDeleteEmployee = (id: string) => {
    if (checkLicenseBlocked()) return;
    const target = employees.find((e) => e.id === id);
    if (!target) return;

    computers
      .filter(
        (c) =>
          c.employeeName === target.name &&
          c.status !== 'На складе' &&
          c.status !== 'Списано' &&
          c.status !== 'На списание'
      )
      .forEach((comp) => {
        const targetWh = resolveWarehouseNameForObject(comp.objectName, warehouses);
        handleReturnActiveAssetToWarehouse('computer', comp.id, targetWh);
      });

    softwareItems
      .filter(
        (s) =>
          s.assignedEmployeeName === target.name &&
          s.status === 'Активна'
      )
      .forEach((soft) => {
        const targetWh = resolveWarehouseNameForObject(soft.objectName, warehouses);
        handleReturnSoftwareToWarehouse(soft.id, targetWh);
      });

    setEmployees((prev) => prev.filter((e) => e.id !== id));
    logActivity('Удален сотрудник', `Удален сотрудник "${target.name}" из штата. Выданное оборудование возвращено на склад.`, 'delete');
  };

  const handleMarkForWriteOff = (
    source: 'computer' | 'network' | 'software' | 'warehouse',
    id: string,
    quantity = 1
  ): boolean => {
    if (checkLicenseBlocked()) return false;

    const result = applyMarkForWriteOff(source, id, quantity, {
      warehouseItems,
      computers,
      networkDevices,
      softwareItems,
      warehouses,
    });

    if (!result.ok) return false;

    setWarehouseItems(repairWarehousePendingDuplicates(result.warehouseItems));
    setComputers(result.computers);
    setNetworkDevices(result.networkDevices);
    setSoftwareItems(result.softwareItems);

    logActivity(
      'Помечено на списание',
      result.label || t('Оборудование переведено в статус «На списание»'),
      'update'
    );
    return true;
  };

  const handleCancelMarkForWriteOff = (
    source: 'computer' | 'network' | 'software' | 'warehouse',
    id: string
  ): boolean => {
    if (checkLicenseBlocked()) return false;

    const result = applyCancelPendingWriteOff(source, id, {
      warehouseItems,
      computers,
      networkDevices,
      softwareItems,
      warehouses,
    });

    if (!result.ok) {
      alert(t('Не удалось вернуть оборудование на склад. Позиция не найдена в очереди списания.'));
      return false;
    }

    setWarehouseItems(repairWarehousePendingDuplicates(result.warehouseItems));
    setComputers(result.computers);
    setNetworkDevices(result.networkDevices);
    setSoftwareItems(result.softwareItems);

    logActivity(
      'Возврат со списания',
      result.label || t('Оборудование возвращено на склад с очереди списания'),
      'update'
    );
    return true;
  };

  const handleWarehouseExcelImport = useCallback(
    (rows: WarehouseExcelRow[]): WarehouseExcelImportResult => {
      if (!canUseWarehouseExcel(licenseStatus)) {
        return {
          ok: false,
          items: warehouseItems,
          created: 0,
          updated: 0,
          skipped: rows.length,
          errors: [
            t(
              'Импорт и экспорт Excel доступны только после активации лицензии. Откройте Настройки и введите ключ.'
            ),
          ],
        };
      }
      if (checkLicenseBlocked()) {
        return {
          ok: false,
          items: warehouseItems,
          created: 0,
          updated: 0,
          skipped: rows.length,
          errors: [t('Операция недоступна: проверьте лицензию.')],
        };
      }

      const result = applyWarehouseExcelImport(warehouseItems, rows);

      if (result.created > 0 || result.updated > 0) {
        setWarehouseItems(repairWarehousePendingDuplicates(result.items));
        logActivity(
          'Импорт склада (Excel)',
          `Загружено из Excel: создано ${result.created}, обновлено ${result.updated}${
            result.skipped > 0 ? `, пропущено ${result.skipped}` : ''
          }`,
          'update'
        );
      }

      return result;
    },
    [warehouseItems, licenseStatus, t]
  );

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
  }): boolean | void => {
    if (checkLicenseBlocked()) return false;

    if (item.type === 'Лицензии ПО') {
      alert(
        t('Программное обеспечение добавляется в разделе «Программное обеспечение», не через склад.')
      );
      return false;
    }

    const normalizedItem = {
      ...item,
      name: limitEquipmentTitle(item.name.trim()),
      model: limitEquipmentTitle(item.model.trim()),
    };
    const receiptSpecs = getWarehouseItemSpecs(normalizedItem);
    
    // 1. Add to warehouse array
    const matchedExisting = warehouseItems.find(
      (w) =>
        inventoryNumbersMatch(w.inventoryNumber, normalizedItem.inventoryNumber) &&
        (w.warehouseName || 'Основной склад ИТ') ===
          (normalizedItem.warehouseName || 'Основной склад ИТ') &&
        isActiveWarehouseStockLine(w)
    );
    if (matchedExisting) {
      if (matchedExisting.name !== normalizedItem.name || matchedExisting.type !== normalizedItem.type) {
        alert(
          interpolate(t('ОШИБКА: Инвентарный номер {inv} уже занят другим оборудованием ("{name}"). Пожалуйста, используйте уникальный номер.'), {
            inv: normalizedItem.inventoryNumber,
            name: matchedExisting.name,
          })
        );
        return false;
      }

      const today = new Date().toISOString().split('T')[0];
      setWarehouseItems((prev) =>
        prev.map((w) =>
          w.id === matchedExisting.id
            ? {
                ...w,
                quantity: w.quantity + normalizedItem.quantity,
                receiptDate: w.receiptDate || today,
                invoiceInfo: normalizedItem.invoiceInfo || w.invoiceInfo,
                memoInfo: normalizedItem.memoInfo || w.memoInfo,
                warrantyInfo: normalizedItem.warrantyInfo || w.warrantyInfo,
                warehouseName: normalizedItem.warehouseName || w.warehouseName,
                pdfFiles: [...(w.pdfFiles || []), ...(normalizedItem.pdfFiles || [])].filter(
                  (f, idx, self) => self.findIndex((file) => file.name === f.name) === idx
                ),
                serialNumber: normalizedItem.serialNumber || w.serialNumber,
                photoUrl: normalizedItem.photoUrl || w.photoUrl,
                monitorDiagonalInches: normalizedItem.monitorDiagonalInches ?? w.monitorDiagonalInches,
                unitSerialNumbers: mergeUnitSerialNumbers(
                  w.quantity,
                  w.unitSerialNumbers,
                  normalizedItem.quantity,
                  normalizedItem.unitSerialNumbers
                ),
                ...mergeWarehouseReceiptSpecs(getWarehouseItemSpecs(w), receiptSpecs),
                customSpecs: receiptSpecs.customSpecs?.length ? receiptSpecs.customSpecs : w.customSpecs,
              }
            : w
        )
      );
      logActivity(
        'Пополнение запасов',
        `Пополнение склада: добавлено +${normalizedItem.quantity} шт. для "${normalizedItem.name}"`,
        'update'
      );
    } else {
      if (checkInventoryExists(normalizedItem.inventoryNumber)) {
        alert(interpolate(t('Оборудование с инвентарным номером {inv} уже существует в системе!'), { inv: normalizedItem.inventoryNumber }));
        return false;
      }
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
        receiptDate: new Date().toISOString().split('T')[0],
        deviceType: normalizedItem.deviceType,
        photoUrl: normalizedItem.photoUrl,
        monitorDiagonalInches: normalizedItem.monitorDiagonalInches,
        ...receiptSpecs,
      };
      setWarehouseItems(prev => [...prev, newStock]);
      logActivity('Поступление ТМЦ', `Принят на баланс склада товар "${normalizedItem.name}" в количестве ${normalizedItem.quantity} ${normalizedItem.unit}`, 'create');
    }

    // 2. Sync registry catalogs (computers / network / software)
    const isReplenishment = Boolean(matchedExisting);
    const receiptDelta = normalizedItem.quantity;
    const targetWhQty = isReplenishment
      ? (matchedExisting!.quantity + receiptDelta)
      : receiptDelta;

    const targetWhName = normalizedItem.warehouseName;
    const linkedWarehouse = warehouses.find(w => w.name === targetWhName);
    const defaultObjectName = linkedWarehouse?.objectName || objects[0]?.name || 'Главный офис';

    if (normalizedItem.type === 'Сетевое оборудование') {
      const existingNet = networkDevices.find(
        (nd) =>
          inventoryNumbersMatch(nd.inventoryNumber, normalizedItem.inventoryNumber) &&
          nd.objectName === defaultObjectName
      );
      if (existingNet) {
        setNetworkDevices((prev) =>
          prev.map((nd) =>
            nd.id === existingNet.id
              ? {
                  ...nd,
                  quantity: (nd.quantity || 1) + receiptDelta,
                  cost: normalizedItem.costPerUnit || nd.cost,
                }
              : nd
          )
        );
      } else {
        const newNet: NetworkDevice = {
          id: `net-wh-${Date.now()}`,
          deviceName: normalizedItem.name,
          type: resolveNetworkDeviceType({ deviceType: normalizedItem.deviceType, name: normalizedItem.name }),
          objectName: defaultObjectName,
          ipAddress: '192.168.1.1',
          quantity: receiptDelta,
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
      }
      logActivity('Авто-распределение ТМЦ', `Устройство "${normalizedItem.name}" автоматически распределено в Сетевое оборудование`, 'system');
    } else if (normalizedItem.type === 'Лицензии ПО') {
      const whRef: WarehouseItem = {
        id: matchedExisting?.id || `wh-ref-${Date.now()}`,
        name: normalizedItem.name,
        type: 'Лицензии ПО',
        model: normalizedItem.model,
        inventoryNumber: normalizedItem.inventoryNumber,
        quantity: targetWhQty,
        unit: normalizedItem.unit,
        costPerUnit: normalizedItem.costPerUnit,
        status: 'В наличии',
        warehouseName: normalizedItem.warehouseName || 'Основной склад ИТ',
      };
      const linkedSoft = softwareItems.find((s) => warehouseItemLinksSoftware(whRef, s));
      if (linkedSoft) {
        setSoftwareItems((prev) =>
          prev.map((s) =>
            s.id === linkedSoft.id
              ? {
                  ...s,
                  quantity: (s.quantity || 1) + receiptDelta,
                  cost: normalizedItem.costPerUnit || s.cost,
                }
              : s
          )
        );
      } else {
        setSoftwareItems((prev) => [
          ...prev,
          {
            id: `soft-wh-${Date.now()}`,
            name: normalizedItem.name,
            category: 'Иное ПО',
            licenseKey: normalizedItem.inventoryNumber.startsWith('SW-') ? '' : normalizedItem.inventoryNumber,
            version: normalizedItem.model || '',
            developer: '',
            quantity: receiptDelta,
            assignedEmployeeName: '',
            objectName: defaultObjectName,
            status: 'Не активирована',
            purchaseDate: new Date().toISOString().split('T')[0],
            cost: normalizedItem.costPerUnit,
          },
        ]);
      }
      logActivity(
        'Авто-распределение ТМЦ',
        `Лицензия «${normalizedItem.name}» (${receiptDelta} лиц.) добавлена в реестр ПО`,
        'system'
      );
    } else {
      const route = resolveWarehouseComputerRoute(normalizedItem);
      if (!route) return true;

      const { category, deviceType, equipmentTab } = route;

      const existingUnits = countRegistryUnitsForWarehouseBatch(
        normalizedItem.inventoryNumber,
        computers,
        networkDevices,
        softwareItems
      );
      const cardsToAdd = isReplenishment
        ? Math.max(0, targetWhQty - existingUnits)
        : receiptDelta;

      if (cardsToAdd <= 0) return true;

      const registryInv: string[] = [];
      for (const w of warehouseItems) {
        if (w.inventoryNumber?.trim()) registryInv.push(w.inventoryNumber.trim());
      }
      for (const c of computers) {
        if (c.inventoryNumber?.trim()) registryInv.push(c.inventoryNumber.trim());
      }
      for (const n of networkDevices) {
        if (n.inventoryNumber?.trim()) registryInv.push(n.inventoryNumber.trim());
      }
      const unitInvNumbers = allocateBatchInventoryNumbers(
        normalizedItem.inventoryNumber,
        registryInv,
        cardsToAdd
      );

      const newComputersToAppend: ComputerItem[] = [];
      for (let i = 0; i < cardsToAdd; i++) {
        const invNum =
          unitInvNumbers[i] ||
          `${normalizedItem.inventoryNumber}${cardsToAdd > 1 ? `-${i + 1}` : ''}`;
        const unitSpecs = buildComputerSpecsFromReceipt(receiptSpecs, i, cardsToAdd);

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
          photoUrl: normalizedItem.photoUrl,
          monitorDiagonalInches: normalizedItem.monitorDiagonalInches,
          ...unitSpecs,
        };
        newComputersToAppend.push(newAsset);
      }

      setComputers(prev => [...prev, ...newComputersToAppend]);
      logActivity(
        'Авто-распределение ТМЦ',
        `Товар "${normalizedItem.name}" (${cardsToAdd} шт.) добавлен в группу «${equipmentTabLabel(equipmentTab)}» со статусом «На складе»`,
        'system'
      );
    }
    return true;
  };

  const handleWarehouseEdit = (
    id: string,
    item: Omit<WarehouseItem, 'id' | 'status'> & {
      serialNumber?: string;
      cpuModel?: string;
      ramModel?: string;
      hddModel?: string;
      gpuModel?: string;
      motherboardModel?: string;
      powerSupplyModel?: string;
      caseModel?: string;
      customSpecs?: { label: string; value: string }[];
    }
  ): boolean | void => {
    if (checkLicenseBlocked()) return false;

    const existing = warehouseItems.find((w) => w.id === id);
    if (!existing || !isActiveWarehouseStockLine(existing)) return false;

    const normalizedItem = {
      ...item,
      name: limitEquipmentTitle(item.name.trim()),
      model: limitEquipmentTitle(item.model.trim()),
      inventoryNumber: item.inventoryNumber.trim(),
    };
    const oldInv = existing.inventoryNumber;
    const newInv = normalizedItem.inventoryNumber;

    if (newInv !== oldInv && checkInventoryExists(newInv, id)) {
      alert(interpolate(t('Оборудование с инвентарным номером {inv} уже существует!'), { inv: newInv }));
      return false;
    }

    const receiptSpecs = getWarehouseItemSpecs(normalizedItem);
    const newQty = Math.max(1, Math.floor(item.quantity ?? existing.quantity));
    const oldQty = existing.quantity;
    const linkedWarehouse = warehouses.find(
      (w) => w.name === (normalizedItem.warehouseName || existing.warehouseName)
    );
    const defaultObjectName = linkedWarehouse?.objectName || objects[0]?.name || 'Главный офис';
    const newType = normalizedItem.type;
    const wasNetwork = existing.type === 'Сетевое оборудование';
    const isNetwork = newType === 'Сетевое оборудование';
    const typeChanged = wasNetwork !== isNetwork;

    if (typeChanged) {
      const deployedComputers = computers.filter(
        (c) =>
          matchesBaseInventoryNumber(c.inventoryNumber, oldInv) &&
          c.status !== 'На складе' &&
          !isWrittenOffLifecycleStatus(c.status)
      );
      if (deployedComputers.length > 0) {
        alert(
          t(
            'Нельзя сменить группу ТМЦ: часть единиц уже выдана сотрудникам. Сначала верните оборудование на склад.'
          )
        );
        return false;
      }
      const networkMatch = networkDevices.find((n) => inventoryNumbersMatch(n.inventoryNumber, oldInv));
      if (wasNetwork && networkMatch && (networkMatch.quantity || 1) < existing.quantity) {
        alert(
          t('Нельзя сменить группу ТМЦ: часть сетевого оборудования уже выдана. Сначала верните на склад.')
        );
        return false;
      }
    }

    const mergedItem = { ...existing, ...normalizedItem, type: newType, quantity: newQty };

    const isStockComputer = (c: ComputerItem) =>
      c.status === 'На складе' && matchesBaseInventoryNumber(c.inventoryNumber, oldInv);

    if (newQty < oldQty) {
      if (!isNetwork) {
        const stockCount = computers.filter(isStockComputer).length;
        if (stockCount < oldQty - newQty) {
          alert(
            t(
              'Нельзя уменьшить количество: часть единиц уже выдана. Сначала верните оборудование на склад или уменьшите только свободный остаток.'
            )
          );
          return false;
        }
      }
    }

    setWarehouseItems((prev) =>
      prev.map((w) =>
        w.id === id
          ? {
              ...w,
              name: normalizedItem.name,
              type: newType,
              model: normalizedItem.model,
              inventoryNumber: newInv,
              quantity: newQty,
              unit: normalizedItem.unit,
              costPerUnit: normalizedItem.costPerUnit,
              invoiceInfo: normalizedItem.invoiceInfo,
              memoInfo: normalizedItem.memoInfo,
              warrantyInfo: normalizedItem.warrantyInfo,
              warehouseName: normalizedItem.warehouseName || w.warehouseName,
              pdfFiles: normalizedItem.pdfFiles,
              deviceType: normalizedItem.deviceType ?? w.deviceType,
              photoUrl: normalizedItem.photoUrl ?? w.photoUrl,
              monitorDiagonalInches: normalizedItem.monitorDiagonalInches ?? w.monitorDiagonalInches,
              ...receiptSpecs,
            }
          : w
      )
    );

    const stockSuffixRank = (inv: string) => {
      const cur = (inv || '').trim();
      if (cur === oldInv || cur === newInv) return 1;
      const m = cur.match(/-(\d+)$/);
      return m ? parseInt(m[1], 10) : 0;
    };

    const removeExcessStockCards = (list: ComputerItem[], reduction: number) => {
      const stockCards = list.filter(isStockComputer);
      const sorted = [...stockCards].sort(
        (a, b) => stockSuffixRank(b.inventoryNumber || '') - stockSuffixRank(a.inventoryNumber || '')
      );
      const removeIds = new Set(sorted.slice(0, reduction).map((c) => c.id));
      return list.filter((c) => !removeIds.has(c.id));
    };

    const appendStockComputerCards = (list: ComputerItem[]): ComputerItem[] => {
      const route = resolveWarehouseComputerRoute(mergedItem);
      if (!route || newQty <= oldQty) return list;
      let next = list;
      if (oldQty === 1 && newQty > 1) {
        next = next.map((c) => {
          if (!isStockComputer(c) || (c.inventoryNumber || '').trim() !== oldInv) return c;
          return { ...c, inventoryNumber: `${newInv}-1` };
        });
      }
      const { category, deviceType } = route;
      const additions: ComputerItem[] = [];
      for (let i = oldQty; i < newQty; i++) {
        const suffix = newQty > 1 ? `-${i + 1}` : '';
        const invNum = `${newInv}${suffix}`;
        const unitSpecs = buildComputerSpecsFromReceipt(receiptSpecs, i, newQty);
        additions.push({
          id: `comp-wh-qty-${Date.now()}-${i}-${Math.floor(Math.random() * 10000)}`,
          category,
          deviceType: normalizedItem.deviceType || deviceType,
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
          photoUrl: normalizedItem.photoUrl,
          monitorDiagonalInches: normalizedItem.monitorDiagonalInches,
          ...unitSpecs,
        });
      }
      return [...next, ...additions];
    };

    const createStockComputerCards = (): ComputerItem[] => {
      const route = resolveWarehouseComputerRoute(mergedItem);
      if (!route) return [];
      const { category, deviceType } = route;
      const cards: ComputerItem[] = [];
      for (let i = 0; i < newQty; i++) {
        const suffix = newQty > 1 ? `-${i + 1}` : '';
        const invNum = `${newInv}${suffix}`;
        const unitSpecs = buildComputerSpecsFromReceipt(receiptSpecs, i, newQty);
        cards.push({
          id: `comp-wh-edit-${Date.now()}-${i}-${Math.floor(Math.random() * 10000)}`,
          category,
          deviceType: normalizedItem.deviceType || deviceType,
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
          photoUrl: normalizedItem.photoUrl,
          monitorDiagonalInches: normalizedItem.monitorDiagonalInches,
          ...unitSpecs,
        });
      }
      return cards;
    };

    const createStockNetworkCard = (): NetworkDevice => ({
      id: `net-wh-edit-${Date.now()}`,
      deviceName: normalizedItem.name,
      type: resolveNetworkDeviceType({ deviceType: normalizedItem.deviceType, name: normalizedItem.name }),
      objectName: defaultObjectName,
      ipAddress: '192.168.1.1',
      quantity: newQty,
      inventoryNumber: newInv,
      portsCount: 24,
      workingPorts: Array.from({ length: 24 }, (_, i) => i + 1),
      damagedPorts: [],
      pdfFiles: normalizedItem.pdfFiles || [],
      invoiceInfo: normalizedItem.invoiceInfo || '',
      memoInfo: normalizedItem.memoInfo || '',
      warrantyInfo: normalizedItem.warrantyInfo || '',
      cost: normalizedItem.costPerUnit,
    });

    if (wasNetwork && isNetwork) {
      setNetworkDevices((prev) =>
        prev.map((n) => {
          if (!inventoryNumbersMatch(n.inventoryNumber, oldInv)) return n;
          return {
            ...n,
            deviceName: normalizedItem.name,
            type: resolveNetworkDeviceType({ deviceType: normalizedItem.deviceType, name: normalizedItem.name }),
            inventoryNumber: remapBatchInventoryNumber(oldInv, newInv, n.inventoryNumber || oldInv),
            quantity: newQty,
            invoiceInfo: normalizedItem.invoiceInfo ?? n.invoiceInfo,
            memoInfo: normalizedItem.memoInfo ?? n.memoInfo,
            warrantyInfo: normalizedItem.warrantyInfo ?? n.warrantyInfo,
            pdfFiles: normalizedItem.pdfFiles ?? n.pdfFiles,
            cost: normalizedItem.costPerUnit,
            objectName: defaultObjectName,
          };
        })
      );
    } else if (wasNetwork && !isNetwork) {
      setNetworkDevices((prev) => prev.filter((n) => !inventoryNumbersMatch(n.inventoryNumber, oldInv)));
      const newCards = createStockComputerCards();
      if (newCards.length > 0) {
        setComputers((prev) => [...prev, ...newCards]);
      }
    } else if (!wasNetwork && isNetwork) {
      setComputers((prev) => prev.filter((c) => !isStockComputer(c)));
      setNetworkDevices((prev) => [
        ...prev.filter((n) => !inventoryNumbersMatch(n.inventoryNumber, oldInv)),
        createStockNetworkCard(),
      ]);
    } else {
      const route = resolveWarehouseComputerRoute(mergedItem);
      setComputers((prev) => {
        let next = prev;
        if (newQty < oldQty) {
          next = removeExcessStockCards(next, oldQty - newQty);
        } else if (newQty > oldQty) {
          next = appendStockComputerCards(next);
        }
        return next.map((c) => {
          if (!isStockComputer(c)) return c;
          const unitIndex = matchesBaseInventoryNumber(c.inventoryNumber, oldInv)
            ? (() => {
                const cur = (c.inventoryNumber || '').trim();
                if (cur === oldInv || cur === newInv) return 0;
                const m = cur.match(/-(\d+)$/);
                return m ? parseInt(m[1], 10) - 1 : 0;
              })()
            : 0;
          const unitSpecs = buildComputerSpecsFromReceipt(
            receiptSpecs,
            unitIndex > 0 ? unitIndex : 0,
            newQty
          );
          return {
            ...c,
            model: normalizedItem.model,
            cost: normalizedItem.costPerUnit,
            inventoryNumber: remapBatchInventoryNumber(oldInv, newInv, c.inventoryNumber),
            objectName: defaultObjectName,
            employeeName: 'Склад ИТ',
            invoiceInfo: normalizedItem.invoiceInfo ?? c.invoiceInfo,
            memoInfo: normalizedItem.memoInfo ?? c.memoInfo,
            warrantyInfo: normalizedItem.warrantyInfo ?? c.warrantyInfo,
            pdfFiles: normalizedItem.pdfFiles ?? c.pdfFiles,
            photoUrl: normalizedItem.photoUrl ?? c.photoUrl,
            monitorDiagonalInches: normalizedItem.monitorDiagonalInches ?? c.monitorDiagonalInches,
            ...(route
              ? {
                  category: route.category,
                  deviceType: normalizedItem.deviceType || route.deviceType,
                }
              : {}),
            ...unitSpecs,
          };
        });
      });
    }

    logActivity(
      'Редактирование ТМЦ',
      `Обновлена позиция склада "${normalizedItem.name}" (Инв. № ${oldInv}${newInv !== oldInv ? ` → ${newInv}` : ''})`,
      'update'
    );
    return true;
  };

  const handleWarehouseWriteOff = (
    id: string,
    sourceType: 'computer' | 'network' | 'software' | 'warehouse',
    inventoryNumber: string, 
    quantityToWriteOff: number, 
    reason: string, 
    author: string,
    approver: string,
    documentNumber?: string,
    comment?: string,
    department?: string,
    objectName?: string,
    technicalPdf?: { name: string; size?: string; content?: string }
  ): boolean => {
    if (checkLicenseBlocked()) return false;

    const qty = normalizePositiveInt(quantityToWriteOff);
    if (qty < 1) return false;

    let resolvedInvKey = normalizeInventoryNumber(inventoryNumber);
    let targetName = '';
    let targetType = '';
    let targetModel = '';
    let targetUnit = 'шт.';
    let targetCostPerUnit = 0;
    let targetWhName = 'Основной склад ИТ';
    let purgePendingLinked = false;
    let warehouseRemainingQty = 0;

    let nextWarehouseItems = warehouseItems;
    let nextComputers = computers;
    let nextNetworkDevices = networkDevices;
    let nextSoftwareItems = softwareItems;

    if (sourceType === 'computer') {
      const comp = computers.find(c => c.id === id);
      if (!comp) return false;
      resolvedInvKey = normalizeInventoryNumber(comp.inventoryNumber);
      targetName = comp.category;
      targetType = comp.deviceType || comp.category;
      targetModel = comp.model;
      targetCostPerUnit = comp.cost || 0;
      targetWhName = comp.objectName;
      purgePendingLinked = false;
      nextComputers = computers.filter(c => c.id !== id);
      if (comp.status === 'На складе' || comp.status === 'На списание') {
        nextWarehouseItems = reduceWarehouseQtyForComputerWriteOff(warehouseItems, comp, 1);
      }
    } else if (sourceType === 'network') {
      const net = networkDevices.find(n => n.id === id);
      if (!net) return false;
      resolvedInvKey = normalizeInventoryNumber(net.inventoryNumber);
      targetName = net.deviceName;
      targetType = net.type;
      targetModel = net.type;
      targetCostPerUnit = net.cost || 0;
      targetWhName = net.objectName;
      const newQty = (net.quantity || 1) - qty;
      purgePendingLinked = newQty <= 0;
      nextNetworkDevices = networkDevices.flatMap(n => {
        if (n.id !== id) return [n];
        if (newQty <= 0) return [];
        return [{ ...n, quantity: newQty, status: 'В работе' as const }];
      });
      const linkedWh = warehouseItems.find(
        (w) =>
          w.quantity > 0 &&
          w.status !== 'Списано' &&
          inventoryNumbersMatch(w.inventoryNumber, net.inventoryNumber)
      );
      if (linkedWh) {
        nextWarehouseItems = reduceWarehouseQtyByInventoryMatch(
          warehouseItems,
          net.inventoryNumber,
          qty,
          linkedWh.warehouseName
        );
      }
    } else if (sourceType === 'software') {
      const soft = softwareItems.find(s => s.id === id);
      if (!soft) return false;
      resolvedInvKey = normalizeInventoryNumber(soft.licenseKey || inventoryNumber);
      targetName = soft.name;
      targetType = soft.category;
      targetModel = soft.developer || soft.category;
      targetCostPerUnit = soft.cost || 0;
      targetUnit = 'лиц.';
      targetWhName = soft.objectName;
      const newQty = (soft.quantity || 1) - qty;
      purgePendingLinked = newQty <= 0;
      nextSoftwareItems = softwareItems.flatMap(s => {
        if (s.id !== id) return [s];
        if (newQty <= 0) return [];
        return [{ ...s, quantity: newQty, status: 'Активна' as const }];
      });
      const linkedWh = warehouseItems.find((w) =>
        w.quantity > 0 && w.status !== 'Списано' && warehouseItemLinksSoftware(w, soft)
      );
      if (linkedWh) {
        nextWarehouseItems = reduceWarehouseQtyByInventoryMatch(
          warehouseItems,
          linkedWh.inventoryNumber,
          qty,
          linkedWh.warehouseName
        );
      }
    } else if (sourceType === 'warehouse') {
      const wh = warehouseItems.find(w => w.id === id);
      if (!wh) return false;
      const whQty = normalizePositiveInt(wh.quantity);
      resolvedInvKey = normalizeInventoryNumber(
        getSplitRootInventoryNumber(wh.inventoryNumber, wh.splitFromInventoryNumber)
      );
      if (qty > whQty) return false;
      targetName = wh.name;
      targetType = wh.type;
      targetModel = wh.model;
      targetCostPerUnit = wh.costPerUnit || 0;
      targetUnit = wh.unit || 'шт.';
      targetWhName = wh.warehouseName || 'Основной склад ИТ';
      const newQty = whQty - qty;
      warehouseRemainingQty = newQty;
      purgePendingLinked = newQty <= 0;

      const stockIdsToRemove = pickStockComputerIdsForWriteOff(
        wh,
        computers,
        warehouses,
        qty
      );
      const writtenOffSerials = stockIdsToRemove
        .map((cid) => computers.find((c) => c.id === cid)?.serialNumber?.trim())
        .filter((sn): sn is string => Boolean(sn));
      if (stockIdsToRemove.length > 0) {
        const removeSet = new Set(stockIdsToRemove);
        nextComputers = computers.filter((c) => !removeSet.has(c.id));
      }

      if (wh.type === 'Сетевое оборудование') {
        const whLineKey = getWarehouseLineInventoryKey(wh.inventoryNumber);
        const net = networkDevices.find(
          (n) =>
            inventoryNumbersMatch(n.inventoryNumber, whLineKey) &&
            (n.status === 'На складе' || n.status === 'В работе' || !n.status)
        );
        if (net) {
          const netNewQty = (net.quantity || 1) - qty;
          nextNetworkDevices = networkDevices.flatMap((n) => {
            if (n.id !== net.id) return [n];
            if (netNewQty <= 0) return [];
            return [{ ...n, quantity: netNewQty, status: 'В работе' as const }];
          });
        }
      }

      if (wh.type === 'Лицензии ПО') {
        const softIds = findSoftwareIdsForWarehouseItem(wh, softwareItems);
        let remaining = qty;
        nextSoftwareItems = softwareItems.flatMap((s) => {
          if (!softIds.includes(s.id) || remaining <= 0) return [s];
          const take = Math.min(remaining, s.quantity || 1);
          remaining -= take;
          const softNewQty = (s.quantity || 1) - take;
          if (softNewQty <= 0) return [];
          return [{ ...s, quantity: softNewQty, status: 'Активна' as const }];
        });
      }

      nextWarehouseItems = warehouseItems.flatMap((w) => {
        if (w.id !== id) return [w];
        if (newQty <= 0) return [];
        const nextLine = reduceWarehouseItemAfterWriteOff(
          { ...w, ...getWarehouseItemSpecs(w) },
          qty,
          writtenOffSerials.length > 0 ? writtenOffSerials : undefined
        );
        if (!nextLine) return [];
        const nextStatus =
          w.status === 'На списание' ? ('На списание' as const) : ('В наличии' as const);
        return [{ ...w, ...nextLine, status: nextStatus }];
      });
    } else {
      return false;
    }

    const purged = purgeWrittenOffRegistry(
      {
        warehouseItems: nextWarehouseItems,
        computers: nextComputers,
        networkDevices: nextNetworkDevices,
        softwareItems: nextSoftwareItems,
      },
      resolvedInvKey,
      {
        purgePendingLinked,
        exactInventoryMatch:
          sourceType === 'computer' ||
          (sourceType === 'warehouse' && warehouseRemainingQty > 0),
      }
    );

    setWarehouseItems(repairWarehousePendingDuplicates(purged.warehouseItems));
    setComputers(purged.computers);
    setNetworkDevices(purged.networkDevices);
    setSoftwareItems(purged.softwareItems);

    const newWriteOffRecord: WarehouseWriteOff = {
      id: `wo-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      inventoryNumber,
      name: targetName,
      type: targetType,
      model: targetModel,
      quantity: qty,
      unit: targetUnit,
      costPerUnit: targetCostPerUnit,
      reason: reason || 'Списание по причине неисправности/амортизации',
      date: new Date().toISOString().split('T')[0],
      pdfFile: technicalPdf,
      warehouseName: targetWhName,
      author,
      approver,
      documentNumber,
      comment,
      department,
      objectName,
      sourceType,
      history: [
        {
          date: new Date().toISOString(),
          action: 'Списание оформлено',
          user: author,
        },
        ...(approver?.trim()
          ? [
              {
                date: new Date().toISOString(),
                action: 'Списание подтверждено',
                user: approver.trim(),
              },
            ]
          : []),
      ],
    };
    
    setWarehouseWriteOffs(prev => [newWriteOffRecord, ...prev]);

    logActivity('Списание ТМЦ', `Списано ${qty} ${targetUnit} для устройства "${targetName}" (Инв. № ${inventoryNumber})`, 'delete');
    return true;
  };

  const handleDeployWarehouseAsset = (
    warehouseItemId: string,
    inventoryNumber: string,
    quantity: number,
    targetEmployeeName: string,
    targetObjectName: string,
    targetComputerIds?: string[]
  ): boolean => {
    if (checkLicenseBlocked()) return false;

    const isDeployableWarehouseItem = (item: WarehouseItem) =>
      item.quantity > 0 &&
      item.status !== 'Списано' &&
      item.status !== 'На списание';

    const whItem =
      warehouseItems.find((item) => item.id === warehouseItemId && isDeployableWarehouseItem(item)) ??
      warehouseItems.find(
        (item) =>
          isDeployableWarehouseItem(item) &&
          inventoryNumbersMatch(item.inventoryNumber, inventoryNumber)
      );

    if (!whItem || whItem.quantity < (targetComputerIds?.length || quantity)) return false;

    const deployQuantity = targetComputerIds?.length || quantity;

    const batchInventoryNumber = whItem.inventoryNumber;
    const lineKey = getWarehouseLineInventoryKey(whItem.inventoryNumber);
    const isNetwork = whItem.type === 'Сетевое оборудование';
    const isSoftwareLicense = whItem.type === 'Лицензии ПО';

    if (!isNetwork && !isSoftwareLicense) {
      const matchingCompsOnStock = computers.filter(
        (c) =>
          matchesBaseInventoryNumber(c.inventoryNumber, lineKey) &&
          c.status === 'На складе'
      );
      const countToDeployFromStock = Math.min(matchingCompsOnStock.length, quantity);
      const remainingToCreate = quantity - countToDeployFromStock;
      if (remainingToCreate > 0 && !resolveWarehouseComputerRoute(whItem)) {
        return false;
      }
    }

    const patchWarehouseStock = (deployedSerials?: string[]) => {
      setWarehouseItems((prev) =>
        prev
          .map((item) => {
            if (item.id !== whItem.id) return item;
            const next = reduceWarehouseItemAfterDeploy(item, deployQuantity, deployedSerials);
            if (!next) return null;
            return { ...item, ...next, status: 'В наличии' as const };
          })
          .filter((item): item is WarehouseItem => item !== null)
      );
    };

    let success = false;

    if (isSoftwareLicense) {
      patchWarehouseStock();
      const linkedIds = findSoftwareIdsForWarehouseItem(whItem, softwareItems);
      const storedSoft =
        softwareItems.find(
          (s) => linkedIds.includes(s.id) && s.status === 'Не активирована'
        ) ||
        softwareItems.find((s) => linkedIds.includes(s.id));

      if (storedSoft) {
        const softTotal = storedSoft.quantity || 1;
        if (deployQuantity >= softTotal) {
          setSoftwareItems((prev) =>
            prev.map((s) =>
              s.id === storedSoft.id
                ? {
                    ...s,
                    status: 'Активна',
                    assignedEmployeeName: targetEmployeeName,
                    objectName: targetObjectName,
                    assignedDeviceId: undefined,
                  }
                : s
            )
          );
        } else {
          setSoftwareItems((prev) => [
            ...prev.map((s) =>
              s.id === storedSoft.id
                ? { ...s, quantity: softTotal - deployQuantity }
                : s
            ),
            {
              ...storedSoft,
              id: `soft-deploy-${Date.now()}`,
              quantity: deployQuantity,
              status: 'Активна',
              assignedEmployeeName: targetEmployeeName,
              objectName: targetObjectName,
              assignedDeviceId: undefined,
            },
          ]);
        }
        success = true;
      } else {
        const newSoft: SoftwareItem = {
          id: `soft-deploy-${Date.now()}`,
          name: whItem.name,
          category: 'Иное ПО',
          licenseKey: whItem.inventoryNumber.startsWith('SW-') ? '' : whItem.inventoryNumber,
          version: whItem.model || '',
          developer: '',
          quantity,
          assignedEmployeeName: targetEmployeeName,
          objectName: targetObjectName,
          status: 'Активна',
          purchaseDate: new Date().toISOString().split('T')[0],
          cost: whItem.costPerUnit,
        };
        setSoftwareItems((prev) => [...prev, newSoft]);
        success = true;
      }
    } else if (isNetwork) {
      patchWarehouseStock();
      const matchingNetwork = networkDevices.find((nd) =>
        inventoryNumbersMatch(nd.inventoryNumber, lineKey)
      );
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
          inventoryNumber: batchInventoryNumber,
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
      const matchingCompsOnStock = computers.filter(
        (c) =>
          matchesBaseInventoryNumber(c.inventoryNumber, lineKey) &&
          c.status === 'На складе'
      );

      const explicitIds =
        targetComputerIds?.filter((id) => matchingCompsOnStock.some((c) => c.id === id)) ?? [];
      const deployQty = explicitIds.length > 0 ? explicitIds.length : quantity;
      if (deployQty > whItem.quantity) return false;

      const countToDeployFromStock = explicitIds.length > 0
        ? explicitIds.length
        : Math.min(matchingCompsOnStock.length, deployQty);
      const remainingToCreate = deployQty - countToDeployFromStock;

      const idsToDeploy =
        explicitIds.length > 0
          ? explicitIds
          : countToDeployFromStock > 0
            ? matchingCompsOnStock.slice(0, countToDeployFromStock).map((c) => c.id)
            : [];

      const deployedSerials = matchingCompsOnStock
        .filter((c) => idsToDeploy.includes(c.id))
        .map((c) => (c.serialNumber || '').trim())
        .filter(Boolean);

      const { consumed: consumedSerials } = consumeUnitSerialNumbers(
        whItem.quantity,
        whItem.unitSerialNumbers,
        deployQty,
        deployedSerials.length > 0 ? deployedSerials : undefined
      );

      patchWarehouseStock(deployedSerials);

      setComputers((prev) => {
        let updated = prev.map((c) => {
          if (idsToDeploy.includes(c.id)) {
            return {
              ...c,
              status: 'В работе' as const,
              employeeName: targetEmployeeName,
              objectName: targetObjectName,
              cost: c.cost || whItem.costPerUnit,
              photoUrl: c.photoUrl || whItem.photoUrl,
              monitorDiagonalInches: c.monitorDiagonalInches ?? whItem.monitorDiagonalInches,
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

          const registryInv: string[] = [];
          for (const w of warehouseItems) {
            if (w.inventoryNumber?.trim()) registryInv.push(w.inventoryNumber.trim());
          }
          for (const c of updated) {
            if (c.inventoryNumber?.trim()) registryInv.push(c.inventoryNumber.trim());
          }
          for (const n of networkDevices) {
            if (n.inventoryNumber?.trim()) registryInv.push(n.inventoryNumber.trim());
          }
          const unitInvNumbers = allocateBatchInventoryNumbers(
            lineKey,
            registryInv,
            remainingToCreate
          );

          const newCompsToAppend: ComputerItem[] = [];
          for (let i = 0; i < remainingToCreate; i++) {
            const invNum = unitInvNumbers[i];
            if (!invNum) continue;
            const unitSpecs = buildComputerSpecsFromReceipt(
              templateSpecs
                ? mergeWarehouseReceiptSpecs(whSpecs, getWarehouseItemSpecs(templateSpecs))
                : whSpecs,
              i,
              remainingToCreate
            );
            const issuedSerial =
              consumedSerials[countToDeployFromStock + i]?.trim() || unitSpecs.serialNumber;

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
              photoUrl: whItem.photoUrl,
              monitorDiagonalInches: whItem.monitorDiagonalInches,
              ...unitSpecs,
              serialNumber: issuedSerial,
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
        `Артикул "${whItem.name}" (${deployQuantity} шт.) успешно выдан со склада и прикреплен к объекту "${targetObjectName}" закреплен за "${targetEmployeeName || 'Общего пользования'}"`, 
        'update'
      );
      return true;
    }
    return false;
  };

  const handleDeleteWarehouseWriteOff = (id: string) => {
    if (checkLicenseBlocked()) return;
    const target = warehouseWriteOffs.find(wo => wo.id === id);
    if (!target) return;
    setWarehouseWriteOffs(prev => prev.filter(wo => wo.id !== id));
    logActivity('Удалено списание ТМЦ', `Из истории списаний удалено списание товара "${target.name}" (Инв. номер: ${target.inventoryNumber})`, 'delete');
  };

  const handleRestoreWarehouseWriteOff = (id: string): boolean => {
    if (checkLicenseBlocked()) return false;
    const target = warehouseWriteOffs.find((wo) => wo.id === id);
    if (!target || target.restoredAt) return false;

    const result = applyWriteOffRestore(target, {
      warehouseItems,
      computers,
      networkDevices,
      softwareItems,
      warehouses,
      objects,
    });

    if (!result.ok) {
      const messages: Record<string, string> = {
        restore_already_restored: t('Оборудование по этому акту уже восстановлено.'),
        restore_inventory_exists: t('Оборудование с таким инвентарным номером уже есть в системе.'),
        restore_missing_inventory: t('В акте списания не указан инвентарный номер.'),
        restore_unknown_source: t('Не удалось определить тип списанного оборудования.'),
      };
      alert(messages[result.errorKey || ''] || t('Не удалось восстановить оборудование.'));
      return false;
    }

    setWarehouseItems(repairWarehousePendingDuplicates(result.warehouseItems));
    setComputers(result.computers);
    setNetworkDevices(result.networkDevices);
    setSoftwareItems(result.softwareItems);

    const restoredAt = new Date().toISOString();
    const restoredBy = currentUser?.name || 'admin';
    setWarehouseWriteOffs((prev) =>
      prev.map((wo) =>
        wo.id === id
          ? {
              ...wo,
              restoredAt,
              restoredBy,
              history: [
                ...(wo.history || []),
                {
                  date: restoredAt,
                  action: 'Восстановлено на склад',
                  user: restoredBy,
                },
              ],
            }
          : wo
      )
    );

    logActivity(
      'Восстановление со списания',
      `Восстановлено ${target.quantity} ${target.unit || 'шт.'} «${target.name}» (Инв. № ${target.inventoryNumber})`,
      'create'
    );
    return true;
  };

  // Audits logs handlers
  const handleAddAudit = (
    title: string, 
    responsibleUser: string, 
    objectName?: string, 
    controllerUser?: string, 
    conductorUser?: string,
    startNotes?: string,
    startPdf?: { name: string; size: string; content: string },
    auditId?: string
  ) => {
    if (checkLicenseBlocked()) return;
    const newAudit: InventoryAudit = {
      id: auditId ?? `aud-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      title,
      status: 'В процессе',
      responsibleUser,
      itemsAudited: 0,
      mismatchesFound: 0,
      totalItems: countAuditScopeItems(computers, networkDevices, objectName, objects),
      itemChecks: {},
      objectName,
      controllerUser,
      conductorUser,
      startNotes,
      pdfFiles: startPdf ? [startPdf] : [],
    };
    setAudits(prev => [newAudit, ...prev]);
    logActivity('Запущен аудит', `Начата инвентаризационная проверка "${title}" (Объект: ${objectName || 'Все'})`, 'create');
  };

  const handleUpdateAuditItemCheck = (
    auditId: string,
    itemKey: string,
    status: 'present' | 'missing' | null
  ) => {
    if (checkLicenseBlocked()) return;
    setAudits((prev) =>
      prev.map((audit) => {
        if (audit.id !== auditId) return audit;
        const itemChecks = { ...(audit.itemChecks ?? {}) };
        if (status === null) delete itemChecks[itemKey];
        else itemChecks[itemKey] = status;
        return { ...audit, ...syncAuditProgressFields(audit, itemChecks) };
      })
    );
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
        const rows = buildAuditChecklist(audit, computers, networkDevices, {
          defaultComputer: 'Компьютер',
          defaultNetwork: 'Сетевое',
        }, objects);
        const progress = computeAuditProgressFromRows(rows);
        return {
          ...audit,
          status: 'Завершена',
          itemsAudited: progress.checked || progress.total,
          mismatchesFound: mismatches,
          totalItems: progress.total,
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
  };

  // Full inventory purge (keeps users, license, UI settings)
  const handlePurgeWorkspace = useCallback(async (): Promise<boolean> => {
    if (checkLicenseBlocked()) return false;

    const result = await purgeWorkspaceOnServer(dataRevisionRef.current);
    if (result.ok === false) {
      const msg =
        result.status === 403
          ? t('Очистка доступна только администратору.')
          : result.status === 402
            ? t('Очистка отклонена: лицензия истекла или недействительна.')
            : `${t('Не удалось очистить базу данных')}: ${result.error}`;
      setSaveError(msg);
      return false;
    }

    applyServerPayload(result.data);
    setDataRevision(result.revision);
    dataRevisionRef.current = result.revision;
    clearInventoryLocalStorage();
    clearDocumentHeaderLocalStorage();
    clearActDraftLocalStorage();
    setSelectedDetail(null);
    setSaveError('');
    return true;
  }, [applyServerPayload, t]);

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
            warehouses={warehouses}
            softwareItems={softwareItems}
            activities={activities}
            audits={audits}
            onNavigate={(id) => setActiveTab(id)}
            onAddComputer={() => { setActiveTab('warehouse'); }}
            onAddEmployee={() => { setActiveTab('employees'); }}
            onWarehouseReceipt={() => { setActiveTab('warehouse'); }}
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
            onArchive={handleArchiveObject}
            onViewDetails={handleNavigateDetail}
            currentUser={currentUser}
          />
        );
      case 'network':
        return (
          <NetworkView
            networkDevices={filterNetworkDevicesForEquipmentView(networkDevices, warehouseItems, warehouses)}
            objects={objects}
            warehouseItems={warehouseItems}
            warehouses={warehouses}
            computers={computers}
            onAdd={handleAddNetwork}
            onEdit={handleEditNetwork}
            onMarkForWriteOff={(id) => handleMarkForWriteOff('network', id)}
            onReturnToWarehouse={(id) => requestReturnEquipment('network', id)}
            onViewDetails={handleNavigateDetail}
            currentUser={currentUser}
          />
        );
      case 'computers':
        return (
          <ComputersView
            computers={filterComputersByEquipmentTab(computers, 'computers')}
            employees={employees}
            objects={objects}
            allComputers={computers}
            warehouseItems={warehouseItems}
            networkDevices={networkDevices}
            onAdd={handleAddComputer}
            onEdit={handleEditComputer}
            onMarkForWriteOff={(id) => handleMarkForWriteOff('computer', id)}
            onReturnToWarehouse={(id) => requestReturnEquipment('computer', id)}
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
            onArchive={handleArchiveEmployee}
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
            onEdit={handleWarehouseEdit}
            onWriteOff={handleWarehouseWriteOff}
            onMarkForWriteOff={handleMarkForWriteOff}
            onCancelMarkForWriteOff={handleCancelMarkForWriteOff}
            onDeleteWriteOff={handleDeleteWarehouseWriteOff}
            onRestoreWriteOff={handleRestoreWarehouseWriteOff}
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
            onSplitWarehouseStock={handleWarehouseSplit}
            onMergeWarehouseSplit={handleWarehouseMergeSplit}
            onImportWarehouseExcel={handleWarehouseExcelImport}
            allowWarehouseExcel={canUseWarehouseExcel(licenseStatus)}
          />
        );
      case 'inventory':
        return (
          <AuditsView
            audits={audits}
            onAddAudit={handleAddAudit}
            onCompleteAudit={handleCompleteAudit}
            onUpdateAuditItemCheck={handleUpdateAuditItemCheck}
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
            warehouseWriteOffs={warehouseWriteOffs}
            objects={objects}
            employees={employees}
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
      case 'settings':
        return (
          <SettingsView
            onPurgeWorkspace={handlePurgeWorkspace}
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
            onDocumentHeaderPersist={handleDocumentHeaderPersist}
            onDataRevisionSync={(revision) => {
              setDataRevision(revision);
              dataRevisionRef.current = revision;
            }}
            dataRevision={dataRevision}
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
            warehouseItems={warehouseItems}
            networkDevices={networkDevices}
            onAdd={handleAddComputer}
            onEdit={handleEditComputer}
            onMarkForWriteOff={(id) => handleMarkForWriteOff('computer', id)}
            onReturnToWarehouse={(id) => requestReturnEquipment('computer', id)}
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
            warehouseItems={warehouseItems}
            networkDevices={networkDevices}
            onAdd={handleAddComputer}
            onEdit={handleEditComputer}
            onMarkForWriteOff={(id) => handleMarkForWriteOff('computer', id)}
            onReturnToWarehouse={(id) => requestReturnEquipment('computer', id)}
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
            warehouseItems={warehouseItems}
            networkDevices={networkDevices}
            onAdd={handleAddComputer}
            onEdit={handleEditComputer}
            onMarkForWriteOff={(id) => handleMarkForWriteOff('computer', id)}
            onReturnToWarehouse={(id) => requestReturnEquipment('computer', id)}
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
            warehouseItems={warehouseItems}
            networkDevices={networkDevices}
            onAdd={handleAddComputer}
            onEdit={handleEditComputer}
            onMarkForWriteOff={(id) => handleMarkForWriteOff('computer', id)}
            onReturnToWarehouse={(id) => requestReturnEquipment('computer', id)}
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
            warehouseItems={warehouseItems}
            networkDevices={networkDevices}
            onAdd={handleAddComputer}
            onEdit={handleEditComputer}
            onMarkForWriteOff={(id) => handleMarkForWriteOff('computer', id)}
            onReturnToWarehouse={(id) => requestReturnEquipment('computer', id)}
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
            softwareItems={filterSoftwareForEquipmentView(softwareItems)}
            allSoftwareItems={softwareItems}
            employees={employees}
            objects={objects}
            computers={computers}
            onAdd={handleAddSoftware}
            onEdit={handleEditSoftware}
            onMarkForWriteOff={(id) => handleMarkForWriteOff('software', id)}
            onUnassignSeat={handleUnassignSoftwareSeat}
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
          clearDocumentHeaderLocalStorage();
          clearActDraftLocalStorage();
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
      <div className="min-h-screen bg-[#f4f7fb] flex flex-col items-center justify-center px-4 font-sans">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
            <svg
              className={`w-7 h-7 text-blue-600 ${serverLoadError ? '' : 'animate-spin'}`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden
            >
              {serverLoadError ? (
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
                />
              ) : (
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M4 12a8 8 0 0 1 8-8v2.5M20 12a8 8 0 0 1-8 8V17.5"
                />
              )}
            </svg>
          </div>
          <div>
            <p className="text-base font-semibold text-slate-800">
              {serverLoadError ? t('Не удалось загрузить данные') : t('Загрузка данных с сервера…')}
            </p>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              {serverLoadError
                ? serverLoadError
                : t('Синхронизация workspace из базы данных сервера. Данные не хранятся в браузере.')}
            </p>
          </div>
          {serverLoadError && (
            <button
              type="button"
              onClick={() => setServerLoadAttempt((n) => n + 1)}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              {t('Повторить загрузку')}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <UserPreferencesProvider
      userId={currentUser.id}
      preferences={currentUser.preferences}
      dataRevision={dataRevision}
      onSaved={handlePreferencesSaved}
    >
    <div className="flex h-screen bg-[#f4f6f9] overflow-hidden text-slate-800">
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
        setActiveTab={navigateToTab}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
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
      <div className="flex-1 flex flex-col overflow-hidden bg-[#f4f6f9]">
        {/* Upper Search/BarHeader */}
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          computers={computers}
          networkDevices={networkDevices}
          warehouseItems={warehouseItems}
          employees={employees}
          objects={objects}
          onNavigate={navigateToTab}
          onViewDetails={handleNavigateDetail}
          title={getHeaderTitle()}
          users={users}
          currentUser={currentUser}
          onSwitchUser={handleSwitchUser}
          onLogout={() => void handleLogout()}
          siteLogo={siteLogo}
          softwareItems={softwareItems}
          audits={audits}
          isSidebarHidden={isCollapsed}
          onToggleSidebar={() => setIsCollapsed(false)}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          activeTab={activeTab}
        />

        {/* Dynamic Inner Panel Body */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-5 space-y-4 sm:space-y-5 bg-[#f4f6f9] safe-area-pb">
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
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-12 text-slate-500 text-sm">
                {t('Загрузка...')}
              </div>
            }
          >
            {renderActiveView()}
          </Suspense>
        </main>
      </div>

      {/* Global integrated Details overlay modal */}
      {selectedDetail && (
        <Suspense fallback={null}>
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
          users={users}
        />
        </Suspense>
      )}

      <ConfirmDeleteModal
        preview={equipmentDeleteModalPreview}
        onClose={() => setEquipmentDeleteRequest(null)}
        onConfirm={executeEquipmentDelete}
      />

      <ConfirmReturnModal
        preview={equipmentReturnPreview}
        onClose={() => setEquipmentReturnRequest(null)}
        onConfirm={executeEquipmentReturn}
      />
    </div>
    </UserPreferencesProvider>
  );
}
