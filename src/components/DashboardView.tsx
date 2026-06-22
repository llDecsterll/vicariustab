/*
 * COPYRIGHT NOTICE | УВЕДОМЛЕНИЕ ОБ АВТОРСКИХ ПРАВАХ | 版权声明
 * © 2026 Utkin Vladislav Vyacheslavovich (Уткин Владислав Вячеславович)
 * Email: vicariustab@icloud.com | Telegram: https://t.me/Dexterll
 * All rights reserved. Unauthorized copying, modification, distribution or commercial use is prohibited.
 * 保留所有权利。未经版权所有者事先书面同意，禁止复制、修改、分发或商业使用。
 * Все права защищены. Копирование, изменение, распространение и коммерческое использование без письменного согласия правообладателя запрещено.
 * Release
 */
import React, { useState } from 'react';
import { 
  Building2, 
  Laptop, 
  Network, 
  Users, 
  Warehouse, 
  Plus, 
  ArrowRight, 
  Key,
  Monitor,
  Printer,
  Camera,
  Package,
  Box,
} from 'lucide-react';
import { ObjectItem, NetworkDevice, ComputerItem, EmployeeItem, WarehouseItem, SoftwareItem } from '../types';
import { getDeviceIcon } from '../utils/deviceIcons';
import { useTranslation } from '../utils/i18n';
import {
  countDashboardEquipmentByTab,
  DASHBOARD_EXTRA_EQUIPMENT_TABS,
  equipmentTabTitleKey,
  filterComputersByEquipmentTab,
  getCategoriesForEquipmentTab,
  type DashboardExtraEquipmentTab,
} from '../utils/warehouseRouting';

interface DashboardViewProps {
  objects: ObjectItem[];
  networkDevices: NetworkDevice[];
  computers: ComputerItem[];
  employees: EmployeeItem[];
  warehouseItems: WarehouseItem[];
  softwareItems: SoftwareItem[];
  onNavigate: (tabId: string) => void;
  onAddObject: () => void;
  onAddNetwork: () => void;
  onAddComputer: () => void;
  onAddEmployee: () => void;
  onWarehouseReceipt: () => void;
  onWarehouseWriteOff: () => void;
  onViewDetails?: (type: 'computer' | 'network' | 'employee' | 'object' | 'warehouse', id: string) => void;
}

export default function DashboardView({
  objects,
  networkDevices,
  computers,
  employees,
  warehouseItems,
  softwareItems,
  onNavigate,
  onAddObject,
  onAddNetwork,
  onAddComputer,
  onAddEmployee,
  onWarehouseReceipt,
  onWarehouseWriteOff,
  onViewDetails,
}: DashboardViewProps) {
  const { t, language } = useTranslation();

  const isWrittenOffComputer = (c: ComputerItem) =>
    c.status === 'Списано' || c.status === 'На списание';
  const isWrittenOffNetwork = (n: NetworkDevice) =>
    n.status === 'Списано' || n.status === 'На списание';
  const isWrittenOffWarehouse = (w: WarehouseItem) =>
    w.status === 'Списано' || w.status === 'На списание' || w.quantity <= 0;
  const isWrittenOffSoftware = (s: SoftwareItem) =>
    s.status === 'Списано' || s.status === 'На списание';

  const activeComputers = computers.filter((c) => !isWrittenOffComputer(c));
  const activeNetworkDevices = networkDevices.filter((n) => !isWrittenOffNetwork(n));
  const activeWarehouseItems = warehouseItems.filter((w) => !isWrittenOffWarehouse(w));
  const activeSoftwareItems = softwareItems.filter((s) => !isWrittenOffSoftware(s));
  
  // Warehouse Tab Filter state
  const [warehouseTab, setWarehouseTab] = useState<'Все' | 'Компьютеры' | 'Сетевое оборудование' | 'Периферия' | 'Оргтехника' | 'Видеонаблюдение' | 'Расходные материалы' | 'Другое'>('Все');

  const pcStats = countDashboardEquipmentByTab(activeComputers, 'computers');
  const displayTotalPC = pcStats.total;
  const displayEmployeePC = filterComputersByEquipmentTab(activeComputers, 'computers').filter(
    (c) => c.employeeName && c.employeeName !== 'Склад ИТ' && c.status === 'В работе'
  ).length;
  const displayPcOnWarehouse = pcStats.onWarehouse;

  const equipmentGroupStats = DASHBOARD_EXTRA_EQUIPMENT_TABS.map((tab) => ({
    tab,
    ...countDashboardEquipmentByTab(activeComputers, tab),
  }));

  const dashboardIssuedComputers = filterComputersByEquipmentTab(activeComputers, 'computers');
  const computerCategories = getCategoriesForEquipmentTab('computers');

  const displayTotalNet = activeNetworkDevices.reduce((sum, item) => sum + item.quantity, 0);

  const warehouseCount = activeWarehouseItems.reduce((sum, item) => sum + item.quantity, 0);
  const warehouseCostSum = activeWarehouseItems.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0);

  const displayTotalEmployees = employees.length;
  const displayActiveEmployees = employees.filter((e) =>
    filterComputersByEquipmentTab(activeComputers, 'computers').some(
      (c) => c.employeeName === e.name && c.status === 'В работе'
    )
  ).length;

  const formatMoney = (val: number) => {
    let loc = 'ru-RU';
    let cur = 'RUB';
    let converted = val;
    if (language === 'en') {
      loc = 'en-US';
      cur = 'USD';
      converted = val / 90;
    } else if (language === 'zh') {
      loc = 'zh-CN';
      cur = 'CNY';
      converted = val / 12;
    }
    return new Intl.NumberFormat(loc, { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(converted);
  };

  const equipmentGroupIcon = (tab: DashboardExtraEquipmentTab) => {
    switch (tab) {
      case 'peripherals':
        return Monitor;
      case 'orgtech':
        return Printer;
      case 'surveillance':
        return Camera;
      case 'consumables':
        return Package;
      default:
        return Box;
    }
  };

  const equipmentGroupStyles: Record<
    DashboardExtraEquipmentTab,
    { border: string; bg: string; text: string; hover: string }
  > = {
    peripherals: { border: 'hover:border-violet-200', bg: 'bg-violet-50', text: 'text-violet-600', hover: 'group-hover:bg-violet-100' },
    orgtech: { border: 'hover:border-orange-200', bg: 'bg-orange-50', text: 'text-orange-600', hover: 'group-hover:bg-orange-100' },
    surveillance: { border: 'hover:border-cyan-200', bg: 'bg-cyan-50', text: 'text-cyan-600', hover: 'group-hover:bg-cyan-100' },
    consumables: { border: 'hover:border-lime-200', bg: 'bg-lime-50', text: 'text-lime-700', hover: 'group-hover:bg-lime-100' },
    other_equip: { border: 'hover:border-stone-200', bg: 'bg-stone-100', text: 'text-stone-600', hover: 'group-hover:bg-stone-200' },
  };

  // Filter Warehouse Items for dashboard bottom table
  const filteredWarehouse = activeWarehouseItems.filter(item => {
    if (warehouseTab === 'Все') return true;
    return item.type === warehouseTab;
  });

  return (
    <div className="space-y-6">
      {/* 1. Stats row representing exact live database entries */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Компьютеры */}
        <div 
          className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md cursor-pointer hover:border-blue-200 group" 
          id="card-computers"
          onClick={() => onNavigate('computers')}
          title={t("Открыть раздел компьютеров")}
        >
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 block">{t("Компьютеры")}</span>
            <div className="text-3xl font-bold text-slate-800">{displayTotalPC}</div>
            <span className="text-xs text-slate-400 block">
              {t("У сотрудников:")}<strong className="text-slate-600">{displayEmployeePC}</strong>
              {displayPcOnWarehouse > 0 && (
                <span className="block mt-0.5">
                  {t("На складе:")}<strong className="text-slate-600">{displayPcOnWarehouse}</strong>
                </span>
              )}
            </span>
          </div>
          <div className="bg-blue-50 text-blue-600 p-3 rounded-xl transition-colors group-hover:bg-blue-100">
            <Laptop size={24} />
          </div>
        </div>

        {/* Card 2: Сетевое оборудование */}
        <div 
          className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md cursor-pointer hover:border-emerald-200 group" 
          id="card-network"
          onClick={() => onNavigate('network')}
          title={t("Открыть раздел сетевого оборудования")}
        >
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 block">{t("Сетевое оборудование")}</span>
            <div className="text-3xl font-bold text-slate-800">{displayTotalNet}</div>
            <span className="text-xs text-slate-400 block">{t("Всего портов:")}<strong className="text-slate-600">{displayTotalNet}</strong>
            </span>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl transition-colors group-hover:bg-emerald-100">
            <Network size={24} />
          </div>
        </div>

        {/* Card 3: Оборудование на складе */}
        <div 
          className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md cursor-pointer hover:border-amber-200 group"
          onClick={() => onNavigate('warehouse')}
          title={t("Открыть ИТ-склад")}
        >
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 block">{t("Оборудование на складе")}</span>
            <div className="text-3xl font-bold text-slate-800">{warehouseCount}</div>
            <span className="text-xs text-slate-400 block">{t("На сумму:")}<strong className="text-slate-600">{formatMoney(warehouseCostSum)}</strong>
            </span>
          </div>
          <div className="bg-amber-50 text-amber-600 p-3 rounded-xl transition-colors group-hover:bg-amber-100">
            <Warehouse size={24} />
          </div>
        </div>

        {/* Card 4: Объекты */}
        <div 
          className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md cursor-pointer hover:border-indigo-200 group"
          onClick={() => onNavigate('objects')}
          title={t("Открыть объекты")}
        >
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 block">{t("Объекты")}</span>
            <div className="text-3xl font-bold text-slate-800">{objects.length}</div>
            <span className="text-xs text-slate-400 block">{t("Активных:")}<strong className="text-slate-600">{objects.length}</strong>
            </span>
          </div>
          <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl transition-colors group-hover:bg-indigo-100">
            <Building2 size={24} />
          </div>
        </div>

        {/* Card 5: Сотрудники */}
        <div 
          className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md cursor-pointer hover:border-rose-200 group" 
          id="card-employees"
          onClick={() => onNavigate('employees')}
          title={t("Открыть список сотрудников")}
        >
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 block">{t("Сотрудники")}</span>
            <div className="text-3xl font-bold text-slate-800">{displayTotalEmployees}</div>
            <span className="text-xs text-slate-400 block">{t("С оборудованием:")}<strong className="text-slate-600">{displayActiveEmployees}</strong>
            </span>
          </div>
          <div className="bg-[#ec4899]/5 text-[#ec4899] p-3 rounded-xl transition-colors group-hover:bg-[#ec4899]/10">
            <Users size={24} />
          </div>
        </div>

        {/* Card 6: Программное обеспечение (ПО) */}
        <div 
          className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md cursor-pointer hover:border-sky-200 group" 
          id="card-software"
          onClick={() => onNavigate('software')}
          title={t("Открыть учет лицензий и ПО")}
        >
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 block">{t("ПО и Лицензии")}</span>
            <div className="text-3xl font-bold text-slate-800">{activeSoftwareItems.length}</div>
            <span className="text-xs text-slate-400 block">{t("Лицензий всего:")}<strong className="text-slate-600">{activeSoftwareItems.reduce((sum, item) => sum + (item.quantity || 1), 0)} {t("шт.")}</strong>
            </span>
          </div>
          <div className="bg-sky-50 text-sky-600 p-3 rounded-xl transition-colors group-hover:bg-sky-100">
            <Key size={24} />
          </div>
        </div>
      </div>

      {/* 1b. Equipment groups — strict category breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {equipmentGroupStats.map(({ tab, total, onWarehouse, issued }) => {
          const Icon = equipmentGroupIcon(tab);
          const styles = equipmentGroupStyles[tab];
          const titleKey = equipmentTabTitleKey(tab);
          return (
            <div
              key={tab}
              className={`bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md cursor-pointer group ${styles.border}`}
              onClick={() => onNavigate(tab)}
              title={t("Открыть раздел") + ': ' + t(titleKey)}
            >
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 block">{t(titleKey)}</span>
                <div className="text-3xl font-bold text-slate-800">{total}</div>
                <span className="text-xs text-slate-400 block">
                  {t("На складе:")}<strong className="text-slate-600">{onWarehouse}</strong>
                  <span className="mx-1">·</span>
                  {t("Выдано:")}<strong className="text-slate-600">{issued}</strong>
                </span>
              </div>
              <div className={`${styles.bg} ${styles.text} p-3 rounded-xl transition-colors ${styles.hover}`}>
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Objects and Network Equipment side-by-side gridding (Row 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Col: Объекты */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-850 text-md tracking-tight flex items-center gap-2">{t("Объекты")}</h2>
            <button 
              onClick={onAddObject}
              className="bg-blue-50 hover:bg-blue-100 text-blue-600 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
            >
              <Plus size={14} />{t("Добавить объект")}</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-105 text-slate-400">
                  <th className="py-2.5 font-semibold text-slate-500">{t("Название объекта")}</th>
                  <th className="py-2.5 font-semibold text-slate-500">{t("Адрес")}</th>
                  <th className="py-2.5 text-center font-semibold text-slate-500">{t("Сетевое обор.")}</th>
                  <th className="py-2.5 text-center font-semibold text-slate-500">{t("Компьютеры")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {objects.slice(0, 8).map((obj) => {
                  const displayNet = activeNetworkDevices.filter(n => n.objectName === obj.name).reduce((sum, n) => sum + n.quantity, 0);
                  const displayPC = activeComputers.filter(
                    (c) =>
                      c.objectName === obj.name && computerCategories.includes(c.category)
                  ).length;

                  return (
                    <tr key={obj.id} className="hover:bg-slate-50 transition-colors text-[13px]">
                      <td 
                        className="py-2.5 font-semibold text-blue-600 hover:underline cursor-pointer" 
                        onClick={() => onViewDetails ? onViewDetails('object', obj.id) : onNavigate('objects')}
                      >
                        {obj.name}
                      </td>
                      <td className="py-2.5 text-slate-500 truncate max-w-[200px]">{obj.address}</td>
                      <td className="py-2.5 text-center font-mono text-slate-600">{displayNet}</td>
                      <td className="py-2.5 text-center font-mono text-slate-600">{displayPC}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            onClick={() => onNavigate('objects')}
            className="text-blue-500 hover:text-blue-600 text-xs font-semibold flex items-center gap-1 mt-2 cursor-pointer border-t border-slate-100 pt-3 w-full text-left"
          >{t("Смотреть все объекты")}<ArrowRight size={14} />
          </button>
        </div>

        {/* Right Col: Network Equipment */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-850 text-md tracking-tight flex items-center gap-2">{t("Сетевое оборудование")}<span className="text-xs font-normal text-slate-400">{t("(прикреплено к объектам)")}</span>
            </h2>
            <button 
              onClick={onAddNetwork}
              className="bg-blue-50 hover:bg-blue-100 text-blue-600 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
            >
              <Plus size={14} />{t("На склад")}</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-105 text-slate-400">
                  <th className="py-2.5 font-semibold text-slate-500">{t("Наименование")}</th>
                  <th className="py-2.5 font-semibold text-slate-500">{t("Тип")}</th>
                  <th className="py-2.5 font-semibold text-slate-500">{t("Объект")}</th>
                  <th className="py-2.5 font-semibold text-slate-500">{t("IP-адрес")}</th>
                  <th className="py-2.5 text-center font-semibold text-slate-500">{t("Количество")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {activeNetworkDevices.slice(0, 8).map((device) => (
                  <tr key={device.id} className="hover:bg-slate-50 transition-colors text-[13px]">
                    <td 
                      className="py-2.5 font-semibold text-blue-600 hover:underline cursor-pointer" 
                      onClick={() => onViewDetails ? onViewDetails('network', device.id) : onNavigate('network')}
                    >
                      {device.deviceName}
                    </td>
                    <td className="py-2.5 text-slate-500">{t(device.type)}</td>
                    <td className="py-2.5 text-slate-600 font-medium">{device.objectName}</td>
                    <td className="py-2.5 font-mono text-slate-500">{device.ipAddress}</td>
                    <td className="py-2.5 text-center font-mono text-slate-600">{device.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={() => onNavigate('network')}
            className="text-blue-500 hover:text-blue-600 text-xs font-semibold flex items-center gap-1 mt-2 cursor-pointer border-t border-slate-100 pt-3 w-full text-left"
          >{t("Смотреть все сетевое оборудование")}<ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* 3. Computers and Employees gridding (Row 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left card: Компьютеры */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-850 text-md tracking-tight flex items-center gap-2">{t("Компьютеры")}<span className="text-xs font-normal text-slate-400">{t("(прикреплены к сотрудникам)")}</span>
            </h2>
            <button 
              onClick={onAddComputer}
              className="bg-blue-50 hover:bg-blue-100 text-blue-600 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
            >
              <Plus size={14} />{t("На склад")}</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-105 text-slate-400">
                  <th className="py-2.5 font-semibold text-slate-500">{t("Устройство")}</th>
                  <th className="py-2.5 font-semibold text-slate-500">{t("Модель")}</th>
                  <th className="py-2.5 font-semibold text-slate-500">{t("Инв. номер")}</th>
                  <th className="py-2.5 font-semibold text-slate-500">{t("Сотрудник")}</th>
                  <th className="py-2.5 text-center font-semibold text-slate-500">{t("Статус")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {dashboardIssuedComputers.slice(0, 8).map((comp) => {
                  let statusClass = '';
                  if (comp.status === 'В работе') statusClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  else if (comp.status === 'На ремонте') statusClass = 'bg-amber-50 text-amber-700 border-amber-250';
                  else if (comp.status === 'На складе') statusClass = 'bg-blue-50 text-blue-700 border-blue-200';
                  else statusClass = 'bg-slate-100 text-slate-650 border-slate-200';

                  return (
                    <tr key={comp.id} className="hover:bg-slate-50 transition-colors text-[13px]">
                      <td className="py-2.5 font-medium flex items-center gap-2">
                        <span className="text-slate-400">{getDeviceIcon({ category: comp.category, deviceType: comp.deviceType, model: comp.model, size: 14 })}</span>
                        {t(comp.category)}
                      </td>
                      <td 
                        className="py-2.5 text-blue-655 hover:underline font-bold cursor-pointer"
                        onClick={() => onViewDetails ? onViewDetails('computer', comp.id) : onNavigate('computers')}
                      >
                        {comp.model}
                      </td>
                      <td className="py-2.5 font-mono text-slate-400">{comp.inventoryNumber}</td>
                      <td 
                        className="py-2.5 text-blue-600 hover:underline cursor-pointer font-medium" 
                        onClick={() => {
                          const emp = employees.find(e => e.name === comp.employeeName);
                          if (emp && onViewDetails) {
                            onViewDetails('employee', emp.id);
                          } else {
                            onNavigate('employees');
                          }
                        }}
                      >
                        {comp.employeeName}
                      </td>
                      <td className="py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusClass}`}>
                          {t(comp.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            onClick={() => onNavigate('computers')}
            className="text-blue-500 hover:text-blue-600 text-xs font-semibold flex items-center gap-1 mt-2 cursor-pointer border-t border-slate-100 pt-3 w-full text-left"
          >{t("Смотреть все компьютеры")}<ArrowRight size={14} />
          </button>
        </div>

        {/* Right card: Сотрудники */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-850 text-md tracking-tight flex items-center gap-2">{t("Сотрудники")}</h2>
            <button 
              onClick={onAddEmployee}
              className="bg-blue-50 hover:bg-blue-100 text-blue-600 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
            >
              <Plus size={14} />{t("Добавить")}</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-105 text-slate-400">
                  <th className="py-2.5 font-semibold text-slate-500">{t("ФИО")}</th>
                  <th className="py-2.5 font-semibold text-slate-500">{t("Должность")}</th>
                  <th className="py-2.5 text-center font-semibold text-slate-500">{t("Оборудование")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {employees.slice(0, 8).map((emp) => {
                  const itemsCount = filterComputersByEquipmentTab(activeComputers, 'computers').filter(
                    (c) => c.employeeName === emp.name && c.status === 'В работе'
                  ).length;
                  const badgeText = `${itemsCount} ${t('ед.')}`;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors text-[13px]">
                      <td 
                        className="py-2.5 font-semibold text-blue-655 hover:underline cursor-pointer" 
                        onClick={() => onViewDetails ? onViewDetails('employee', emp.id) : onNavigate('employees')}
                      >
                        {emp.name}
                      </td>
                      <td className="py-2.5 text-slate-500 truncate max-w-[200px]">{emp.position}</td>
                      <td className="py-2.5 text-center font-mono text-slate-600 font-medium">
                        {badgeText}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            onClick={() => onNavigate('employees')}
            className="text-blue-500 hover:text-blue-600 text-xs font-semibold flex items-center gap-1 mt-2 cursor-pointer border-t border-slate-100 pt-3 w-full text-left"
          >{t("Смотреть всех сотрудников")}<ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* 4. Bottom Full-width container: Склад ИТ */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="font-bold text-slate-850 text-md tracking-tight flex items-center gap-2">{t("Склад ИТ")}</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={onWarehouseReceipt}
              className="bg-blue-50 hover:bg-blue-100 text-blue-600 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
            >
              <Plus size={14} />{t("+ Поступление")}</button>
            <button 
              onClick={onWarehouseWriteOff}
              className="bg-rose-50 hover:bg-rose-100 text-rose-600 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
            >{t("- Списание")}</button>
          </div>
        </div>

        {/* Categories navigation Tabs */}
        <div className="flex flex-wrap gap-1 border-b border-slate-100 pb-2 scrollbar-none overflow-x-auto">
          {(['Все', 'Компьютеры', 'Сетевое оборудование', 'Периферия', 'Оргтехника', 'Видеонаблюдение', 'Расходные материалы', 'Другое'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setWarehouseTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                warehouseTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              {t(tab)}
            </button>
          ))}
        </div>

        {/* Warehouse Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-105 text-slate-400">
                <th className="py-2.5 font-semibold text-slate-500">{t("Наименование")}</th>
                <th className="py-2.5 font-semibold text-slate-500">{t("Тип")}</th>
                <th className="py-2.5 font-semibold text-slate-500">{t("Модель")}</th>
                <th className="py-2.5 font-semibold text-slate-500">{t("Инв. номер")}</th>
                <th className="py-2.5 text-center font-semibold text-slate-500">{t("Количество")}</th>
                <th className="py-2.5 font-semibold text-slate-500">{t("Ед. изм.")}</th>
                <th className="py-2.5 text-right font-semibold text-slate-500">{t("Стоимость за ед.")}</th>
                <th className="py-2.5 text-right font-semibold text-slate-500">{t("Общая стоимость")}</th>
                <th className="py-2.5 text-center font-semibold text-slate-500">{t("Статус")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredWarehouse.slice(0, 10).map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors text-[13px]">
                  <td 
                    className="py-3 font-semibold text-blue-655 hover:underline cursor-pointer" 
                    onClick={() => onViewDetails ? onViewDetails('warehouse', item.id) : onNavigate('warehouse')}
                  >
                    {item.name}
                  </td>
                  <td className="py-3 text-slate-500">{t(item.type)}</td>
                  <td className="py-3 text-slate-650 font-medium">{item.model}</td>
                  <td className="py-3 font-mono text-slate-400">{item.inventoryNumber}</td>
                  <td className="py-3 text-center font-mono text-slate-800 font-semibold">{item.quantity}</td>
                  <td className="py-3 text-slate-400">{t(item.unit)}</td>
                  <td className="py-3 text-right font-mono text-slate-655">{formatMoney(item.costPerUnit)}</td>
                  <td className="py-3 text-right font-mono font-semibold text-slate-800">{formatMoney(item.costPerUnit * item.quantity)}</td>
                  <td className="py-3 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">{t("В наличии")}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={() => onNavigate('warehouse')}
          className="text-blue-500 hover:text-blue-600 text-xs font-semibold flex items-center gap-1 mt-2 cursor-pointer border-t border-slate-100 pt-3 w-full text-left"
        >{t("Смотреть весь склад")}<ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
