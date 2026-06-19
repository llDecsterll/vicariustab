/*
 * COPYRIGHT NOTICE | УВЕДОМЛЕНИЕ ОБ АВТОРСКИХ ПРАВАХ | 版权声明
 * © 2026 Utkin Vladislav Vyacheslavovich (Уткин Владислав Вячеславович)
 * Email: vicariustab@icloud.com | Telegram: https://t.me/Dexterll
 * All rights reserved. Unauthorized copying, modification, distribution or commercial use is prohibited.
 * 保留所有权利。未经版权所有者事先书面同意，禁止复制、修改、分发或商业使用。
 * Все права защищены. Копирование, изменение, распространение и коммерческое использование без письменного согласия правообладателя запрещено.
 * Release
 */
import React from 'react';
import { useTranslation } from '../utils/i18n';
import BrandLogo from './BrandLogo';
import { COPYRIGHT_EMAIL } from '../legal/copyright';
import { 
  LayoutDashboard, 
  Building2, 
  Laptop, 
  Network, 
  Users, 
  Warehouse, 
  ClipboardList, 
  FileBarChart2, 
  Shield,
  ShieldCheck, 
  History, 
  Settings as SettingsIcon, 
  ChevronLeft, 
  ChevronRight,
  Database,
  Key,
  // Additional icons for section settings
  Monitor,
  Server,
  Wifi,
  Cpu,
  Router,
  HardDrive,
  Smartphone,
  Keyboard,
  Printer,
  Camera,
  Package,
  Copy,
  Check
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  equipmentOpen: boolean;
  setEquipmentOpen: (open: boolean) => void;
  tabIcons?: {
    computers: string;
    network: string;
    peripherals: string;
    other_equip: string;
  };
  panelLogo?: string;
  panelColor?: string;
  workspaceName?: string;
  sidebarBgColor?: string;
  sidebarOpacity?: number;
  licenseStatus?: {
    isActivated: boolean;
    licenseType: 'trial' | 'annual' | 'perpetual';
    trialDaysLeft: number;
    isExpired: boolean;
    expiresYear: number | null;
  };
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  equipmentOpen,
  setEquipmentOpen,
  tabIcons,
  panelLogo,
  panelColor,
  workspaceName = 'IT Inventory',
  sidebarBgColor = '#0f172a',
  sidebarOpacity = 1.0,
  licenseStatus,
}: SidebarProps) {
  const { t } = useTranslation();
  const [emailCopied, setEmailCopied] = React.useState(false);

  const copyEmailToClipboard = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(COPYRIGHT_EMAIL);
    setEmailCopied(true);
    setTimeout(() => {
      setEmailCopied(false);
    }, 2000);
  };
  
  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
  };

  const hexToRgba = (hex: string, alpha: number) => {
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      cleanHex = cleanHex[0] + cleanHex[0] + cleanHex[1] + cleanHex[1] + cleanHex[2] + cleanHex[2];
    }
    const r = parseInt(cleanHex.substring(0, 2), 16) || 15;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 23;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 42;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const handleEquipmentToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCollapsed) {
      setIsCollapsed(false);
    }
    setEquipmentOpen(!equipmentOpen);
  };

  // Dynamic Icon Map for customized selection
  const iconMap: Record<string, any> = {
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
    Database,
    Building2,
  };

  const getCustomIcon = (name: string, fallback: any) => {
    return iconMap[name] || fallback;
  };

  const CompIcon = getCustomIcon(tabIcons?.computers || 'Laptop', Laptop);
  const NetIcon = getCustomIcon(tabIcons?.network || 'Network', Network);
  const PeriphIcon = getCustomIcon(tabIcons?.peripherals || 'Monitor', Monitor);
  const OtherIcon = getCustomIcon(tabIcons?.other_equip || 'Server', Server);

  return (
    <aside 
      style={{
        backgroundColor: hexToRgba(sidebarBgColor, sidebarOpacity)
      }}
      className={`text-slate-350 flex flex-col h-screen sticky top-0 transition-all duration-300 z-10 select-none border-r border-[#1e293b] ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Logo */}
      <div className="h-16 flex items-center px-4 border-b border-[#1e293b] gap-3 overflow-hidden">
        <div className="bg-[#2563eb] text-white p-1 rounded-lg flex items-center justify-center shrink-0 shadow-md">
          {panelLogo ? (
            <img src={panelLogo} alt="Custom Logo" className="w-[20px] h-[20px] object-contain rounded" referrerPolicy="no-referrer" />
          ) : (
            <BrandLogo size={28} variant="compact" className="shadow-none border-0" />
          )}
        </div>
        {!isCollapsed && (
          <span className="font-bold text-white text-lg tracking-tight whitespace-nowrap truncate">
            {workspaceName}
          </span>
        )}
      </div>

      {/* Menu / Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden space-y-1 px-2 scrollbar-thin">
        {/* Дашборд */}
        <button
          onClick={() => handleTabClick('dashboard')}
          className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'dashboard'
              ? 'bg-[#2563eb] text-white font-semibold'
              : 'text-slate-400 hover:bg-[#1e293b] hover:text-slate-200'
          }`}
          title={t("Дашборд")}
        >
          <LayoutDashboard size={18} className="shrink-0" />
          {!isCollapsed && <span className="truncate min-w-0">{t("Дашборд")}</span>}
        </button>

        {/* Объекты */}
        <button
          onClick={() => handleTabClick('objects')}
          className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'objects'
              ? 'bg-[#2563eb] text-white font-semibold'
              : 'text-slate-400 hover:bg-[#1e293b] hover:text-slate-200'
          }`}
          title={t("Объекты")}
        >
          <Building2 size={18} className="shrink-0" />
          {!isCollapsed && <span className="truncate min-w-0">{t("Объекты")}</span>}
        </button>

        {/* Оборудование (With Dropdown for Computers, Network, other) */}
        <div>
          <button
            onClick={handleEquipmentToggle}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              ['computers', 'network', 'peripherals', 'other_equip', 'orgtech', 'surveillance', 'consumables'].includes(activeTab)
                ? 'bg-[#1e293b] text-white'
                : 'text-slate-400 hover:bg-[#1e293b] hover:text-slate-200'
            }`}
            title={t("Оборудование")}
          >
            <div className="flex items-center gap-3">
              <Laptop size={18} className="shrink-0" />
              {!isCollapsed && <span className="truncate min-w-0">{t("Оборудование")}</span>}
            </div>
            {!isCollapsed && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`w-4 h-4 transition-transform ${equipmentOpen ? 'rotate-180' : ''}`}
               >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>

          {equipmentOpen && !isCollapsed && (
            <div className="pl-9 mt-1 space-y-1">
              <button
                onClick={() => handleTabClick('computers')}
                className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${
                  activeTab === 'computers'
                    ? 'text-[#60a5fa] font-semibold bg-[#1e293b]/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e293b]/30'
                }`}
              >
                <CompIcon size={12} className="shrink-0" />
                <span className="truncate min-w-0">{t("Компьютеры")}</span>
              </button>
              <button
                onClick={() => handleTabClick('network')}
                className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${
                  activeTab === 'network'
                    ? 'text-[#60a5fa] font-semibold bg-[#1e293b]/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e293b]/30'
                }`}
              >
                <NetIcon size={12} className="shrink-0" />
                <span className="truncate min-w-0">{t("Сетевое оборуд.")}</span>
              </button>
              <button
                onClick={() => handleTabClick('peripherals')}
                className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-all flex items-center gap-2  ${
                  activeTab === 'peripherals'
                    ? 'text-[#60a5fa] font-semibold bg-[#1e293b]/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e293b]/30'
                }`}
              >
                <PeriphIcon size={12} className="shrink-0" />
                <span className="truncate min-w-0">{t("Периферия")}</span>
              </button>
              <button
                onClick={() => handleTabClick('orgtech')}
                className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-all flex items-center gap-2  ${
                  activeTab === 'orgtech'
                    ? 'text-[#60a5fa] font-semibold bg-[#1e293b]/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e293b]/30'
                }`}
              >
                <Printer size={12} className="shrink-0 text-slate-450" />
                <span className="truncate min-w-0">{t("Принтеры")}</span>
              </button>
              <button
                onClick={() => handleTabClick('surveillance')}
                className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-all flex items-center gap-2  ${
                  activeTab === 'surveillance'
                    ? 'text-[#60a5fa] font-semibold bg-[#1e293b]/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e293b]/30'
                }`}
              >
                <Camera size={12} className="shrink-0 text-slate-450" />
                <span className="truncate min-w-0">{t("Камеры СКУД")}</span>
              </button>
              <button
                onClick={() => handleTabClick('consumables')}
                className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-all flex items-center gap-2  ${
                  activeTab === 'consumables'
                    ? 'text-[#60a5fa] font-semibold bg-[#1e293b]/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e293b]/30'
                }`}
              >
                <Package size={12} className="shrink-0 text-slate-450" />
                <span className="truncate min-w-0">{t("Расходники")}</span>
              </button>
              <button
                onClick={() => handleTabClick('other_equip')}
                className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-all flex items-center gap-2  ${
                  activeTab === 'other_equip'
                    ? 'text-[#60a5fa] font-semibold bg-[#1e293b]/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e293b]/30'
                }`}
              >
                <OtherIcon size={12} className="shrink-0" />
                <span className="truncate min-w-0">{t("Прочее обор.")}</span>
              </button>
            </div>
          )}
        </div>

        {/* Сотрудники */}
        <button
          onClick={() => handleTabClick('employees')}
          className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'employees'
              ? 'bg-[#2563eb] text-white font-semibold'
              : 'text-slate-400 hover:bg-[#1e293b] hover:text-slate-200'
          }`}
          title={t("Сотрудники")}
        >
          <Users size={18} className="shrink-0" />
          {!isCollapsed && <span className="truncate min-w-0">{t("Сотрудники")}</span>}
        </button>

        {/* Склад ИТ */}
        <button
          onClick={() => handleTabClick('warehouse')}
          className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'warehouse'
              ? 'bg-[#2563eb] text-white font-semibold'
              : 'text-slate-400 hover:bg-[#1e293b] hover:text-slate-200'
          }`}
          title={t("Склад ИТ")}
        >
          <Warehouse size={18} className="shrink-0" />
          {!isCollapsed && <span className="truncate min-w-0">{t("Склад ИТ")}</span>}
        </button>

        {/* Учет ПО */}
        <button
          onClick={() => handleTabClick('software')}
          className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'software'
              ? 'bg-[#2563eb] text-white font-semibold'
              : 'text-slate-400 hover:bg-[#1e293b] hover:text-slate-200'
          }`}
          title={t("Учет ПО")}
        >
          <Key size={18} className="shrink-0" />
          {!isCollapsed && <span className="truncate min-w-0">{t("Учет ПО")}</span>}
        </button>

        {/* Инвентаризация */}
        <button
          onClick={() => handleTabClick('inventory')}
          className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'inventory'
              ? 'bg-[#2563eb] text-white font-semibold'
              : 'text-slate-400 hover:bg-[#1e293b] hover:text-slate-200'
          }`}
          title={t("Инвентаризация")}
        >
          <ClipboardList size={18} className="shrink-0" />
          {!isCollapsed && <span className="truncate min-w-0">{t("Инвентаризация")}</span>}
        </button>

        {/* Отчеты */}
        <button
          onClick={() => handleTabClick('reports')}
          className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'reports'
              ? 'bg-[#2563eb] text-white font-semibold'
              : 'text-slate-400 hover:bg-[#1e293b] hover:text-slate-200'
          }`}
          title={t("Отчеты")}
        >
          <FileBarChart2 size={18} className="shrink-0" />
          {!isCollapsed && <span className="truncate min-w-0">{t("Отчеты")}</span>}
        </button>

        {/* Гарантии и обслуживание */}
        <button
          onClick={() => handleTabClick('warranties')}
          className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'warranties'
              ? 'bg-[#2563eb] text-white font-semibold'
              : 'text-slate-400 hover:bg-[#1e293b] hover:text-slate-200'
          }`}
          title={t("Гарантия и обсл.")}
        >
          <ShieldCheck size={18} className="shrink-0" />
          {!isCollapsed && <span className="truncate min-w-0">{t("Гарантия и обсл.")}</span>}
        </button>

        {/* Журнал действий */}
        <button
          onClick={() => handleTabClick('activity_log')}
          className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'activity_log'
              ? 'bg-[#2563eb] text-white font-semibold'
              : 'text-slate-400 hover:bg-[#1e293b] hover:text-slate-200'
          }`}
          title={t("Журнал действий")}
        >
          <History size={18} className="shrink-0" />
          {!isCollapsed && <span className="truncate min-w-0">{t("Журнал действий")}</span>}
        </button>

        {/* Настройки */}
        <button
          onClick={() => handleTabClick('settings')}
          className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'settings'
              ? 'bg-[#2563eb] text-white font-semibold'
              : 'text-slate-400 hover:bg-[#1e293b] hover:text-slate-200'
          }`}
          title={t("Настройки")}
        >
          <SettingsIcon size={18} className="shrink-0" />
          {!isCollapsed && <span className="truncate min-w-0">{t("Настройки")}</span>}
        </button>
      </nav>

      {/* Licensing indicator */}
      <div className="border-t border-[#1e293b]/85 bg-[#090d16]/30">
        <div
          className={`${isCollapsed ? 'py-2.5 flex justify-center' : 'p-3.5'} select-none`}
          title={
            licenseStatus?.isActivated
              ? licenseStatus.licenseType === 'perpetual'
                ? t('Вечная лицензия')
                : `${t('Лицензия: до ')}${licenseStatus.expiresYear}`
              : `${t('Пробный период:')} ${licenseStatus?.trialDaysLeft} ${t('дн.')}`
          }
        >
          <div
            className={`rounded-lg border flex items-center gap-1.5 ${
              isCollapsed ? 'p-1.5' : 'p-1.5 px-2 w-full'
            } ${
              licenseStatus?.isActivated
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                : 'bg-blue-600/10 border-blue-500/25 text-blue-400 animate-pulse'
            }`}
          >
            <ShieldCheck size={isCollapsed ? 14 : 11} className="shrink-0" />
            {!isCollapsed && (
              <span className="font-semibold tracking-wide text-[10px] leading-relaxed">
                {licenseStatus?.isActivated
                  ? licenseStatus.licenseType === 'perpetual'
                    ? t('Вечная лицензия')
                    : `${t('Лицензия: до ')}${licenseStatus.expiresYear}`
                  : `${t('Пробный период:')} ${licenseStatus?.trialDaysLeft} ${t('дн.')}`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Collapse button at bottom */}
      <div className="p-3 border-t border-[#1e293b]">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-[#1e293b] transition-all"
        >
          {isCollapsed ? (
            <ChevronRight size={16} />
          ) : (
            <>
              <ChevronLeft size={16} />
              <span className="truncate min-w-0">{t("Свернуть")}</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
