/*
 * COPYRIGHT NOTICE | УВЕДОМЛЕНИЕ ОБ АВТОРСКИХ ПРАВАХ | 版权声明
 * © 2026 Utkin Vladislav Vyacheslavovich (Уткин Владислав Вячеславович)
 */
import React from 'react';
import { useTranslation } from '../utils/i18n';
import BrandLogo from './BrandLogo';
import {
  LayoutDashboard,
  Building2,
  Laptop,
  Network,
  Users,
  Warehouse,
  ClipboardList,
  FileBarChart2,
  ShieldCheck,
  Shield,
  History,
  ChevronLeft,
  ChevronRight,
  Key,
  Monitor,
  Server,
  Printer,
  Camera,
  Package,
  X,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  equipmentOpen?: boolean;
  setEquipmentOpen?: (open: boolean) => void;
  tabIcons?: {
    computers: string;
    network: string;
    peripherals: string;
    other_equip: string;
  };
  panelLogo?: string;
  workspaceName?: string;
  licenseStatus?: {
    isActivated: boolean;
    isInstallationLicensed?: boolean;
    licenseType: 'trial' | 'annual' | 'perpetual';
    trialDaysLeft: number;
    isExpired: boolean;
    expiresYear: number | null;
  };
  panelColor?: string;
  sidebarBgColor?: string;
  sidebarOpacity?: number;
}

type NavItem = { id: string; label: string; icon: React.ReactNode };

export default function Sidebar({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  mobileOpen = false,
  onCloseMobile,
  panelLogo,
  workspaceName = 'Инвентаризация',
  licenseStatus,
}: SidebarProps) {
  const { t } = useTranslation();

  const equipmentTabs: NavItem[] = [
    { id: 'computers', label: t('Компьютеры'), icon: <Laptop size={17} /> },
    { id: 'network', label: t('Сетевое оборудование'), icon: <Network size={17} /> },
    { id: 'peripherals', label: t('Периферия'), icon: <Monitor size={17} /> },
    { id: 'orgtech', label: t('Принтеры'), icon: <Printer size={17} /> },
    { id: 'surveillance', label: t('Камеры СКУД'), icon: <Camera size={17} /> },
    { id: 'consumables', label: t('Расходники'), icon: <Package size={17} /> },
    { id: 'other_equip', label: t('Другое оборудование'), icon: <Server size={17} /> },
  ];

  const orgTabs: NavItem[] = [
    { id: 'employees', label: t('Сотрудники'), icon: <Users size={17} /> },
    { id: 'objects', label: t('Объекты'), icon: <Building2 size={17} /> },
  ];

  const manageTabs: NavItem[] = [
    { id: 'warehouse', label: t('Склад IT'), icon: <Warehouse size={17} /> },
    { id: 'software', label: t('ПО и лицензии'), icon: <Key size={17} /> },
    { id: 'inventory', label: t('Инвентаризация'), icon: <ClipboardList size={17} /> },
  ];

  const serviceTabs: NavItem[] = [
    { id: 'warranties', label: t('Гарантия и обслуживание'), icon: <ShieldCheck size={17} /> },
    { id: 'reports', label: t('Отчеты'), icon: <FileBarChart2 size={17} /> },
    { id: 'activity_log', label: t('Журнал действий'), icon: <History size={17} /> },
    { id: 'security', label: t('Кибербезопасность'), icon: <Shield size={17} /> },
  ];

  const pickTab = (id: string) => {
    setActiveTab(id);
    onCloseMobile?.();
  };

  const renderItem = (item: NavItem) => {
    const active = activeTab === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => pickTab(item.id)}
        className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 sm:py-2 rounded-lg text-[13px] font-medium transition-all ${
          active
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
        }`}
        title={item.label}
      >
        <span className="shrink-0 opacity-90">{item.icon}</span>
        <span className="truncate">{item.label}</span>
      </button>
    );
  };

  const renderSection = (title: string, items: NavItem[]) => (
    <div className="space-y-1">
      <p className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {title}
      </p>
      {items.map(renderItem)}
    </div>
  );

  const trialDays = licenseStatus?.trialDaysLeft ?? 0;
  const trialTotal = 30;
  const trialUsed = licenseStatus?.isActivated ? 100 : Math.min(100, Math.max(8, ((trialTotal - trialDays) / trialTotal) * 100));

  const drawerVisible = mobileOpen;
  const desktopVisible = !isCollapsed;

  return (
    <>
      {drawerVisible && (
        <button
          type="button"
          aria-label={t('Закрыть меню')}
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-[1px] lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`flex flex-col h-screen border-r border-slate-200 bg-white transition-all duration-300 ease-out
          fixed inset-y-0 left-0 z-40 w-[min(280px,88vw)] max-w-[280px]
          lg:sticky lg:top-0 lg:z-10 lg:shrink-0 lg:max-w-none
          ${drawerVisible ? 'translate-x-0 shadow-xl' : '-translate-x-full'}
          ${desktopVisible ? 'lg:translate-x-0 lg:w-[260px] lg:opacity-100 lg:pointer-events-auto lg:border-r' : 'lg:w-0 lg:min-w-0 lg:overflow-hidden lg:opacity-0 lg:pointer-events-none lg:border-r-0'}
        `}
      >
        <div className="h-14 sm:h-[72px] px-4 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 relative shrink-0">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
            {panelLogo ? (
              <img src={panelLogo} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            ) : (
              <BrandLogo size={32} variant="compact" className="shadow-none border-0" />
            )}
          </div>
          <div className="min-w-0 flex-1 pr-8">
            <p className="font-bold text-slate-900 dark:text-white text-[15px] leading-tight truncate">{workspaceName}</p>
            <p className="text-[10px] text-slate-400 truncate">{t('Система учета активов')}</p>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label={t('Закрыть меню')}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 py-3 px-2 overflow-y-auto scrollbar-none space-y-1 overscroll-contain">
          <button
            type="button"
            onClick={() => pickTab('dashboard')}
            className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 sm:py-2 rounded-lg text-[13px] font-semibold transition-all mb-2 ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <LayoutDashboard size={17} />
            {t('Дашборд')}
          </button>

          {renderSection(t('Активы'), equipmentTabs)}
          {renderSection(t('Организация'), orgTabs)}
          {renderSection(t('Управление'), manageTabs)}
          {renderSection(t('Сервис'), serviceTabs)}
        </nav>

        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-3 shrink-0 safe-area-pb">
          {!licenseStatus?.isActivated && !licenseStatus?.isInstallationLicensed && (
            <div className="rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-[#1e2a3f] p-3 space-y-2">
              <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                <span>{t('Пробный период')}</span>
                <span className="text-blue-600">{trialDays} {t('дн.')}</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${trialUsed}%` }} />
              </div>
            </div>
          )}

          {(licenseStatus?.isActivated || licenseStatus?.isInstallationLicensed) && (
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 px-3 py-2 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
              {licenseStatus.licenseType === 'perpetual'
                ? t('Вечная лицензия')
                : `${t('Лицензия: до ')}${licenseStatus.expiresYear}`}
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex w-full items-center justify-center gap-2 py-2 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            <span>{t('Свернуть меню')}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
