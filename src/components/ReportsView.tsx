/*
 * COPYRIGHT NOTICE | УВЕДОМЛЕНИЕ ОБ АВТОРСКИХ ПРАВАХ | 版权声明
 * © 2026 Utkin Vladislav Vyacheslavovich (Уткин Владислав Вячеславович)
 * Email: vicariustab@icloud.com | Telegram: https://t.me/Dexterll
 * All rights reserved. Unauthorized copying, modification, distribution or commercial use is prohibited.
 * 保留所有权利。未经版权所有者事先书面同意，禁止复制、修改、分发或商业使用。
 * Все права защищены. Копирование, изменение, распространение и коммерческое использование без письменного согласия правообладателя запрещено.
 * Release
 */
import React, { useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FileBarChart2, Printer, Building2, Globe, TrendingUp, PieChart as PieIcon, BarChart2, Clock, Users, History } from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { ComputerItem, NetworkDevice, WarehouseItem, ObjectItem, EmployeeItem, WarehouseWriteOff } from '../types';
import { useTranslation } from '../utils/i18n';
import {
  type WarehouseCurrency,
  convertRubAmount,
  formatWarehouseCurrency,
  formatCurrencyAmount,
  WAREHOUSE_CURRENCY_OPTIONS,
} from '../utils/currencyUtils';
import {
  REPORT_LIFECYCLE_ORDER,
  AGE_BUCKET_ORDER,
  buildReportEquipmentUnits,
  countByLifecycleStatus,
  countByAgeBucket,
  getAverageAgeYears,
  countOlderThan,
  countByDepartment,
  buildRepairHistory,
  loadWarrantyPurchaseDates,
  formatAgeYears,
  buildEquipmentCostByCategory,
} from '../utils/reportAnalytics';
import DocumentPrintShell from './DocumentPrintShell';
import { printDocument } from '../utils/printDocument';

interface ReportsViewProps {
  computers: ComputerItem[];
  networkDevices: NetworkDevice[];
  warehouseItems: WarehouseItem[];
  warehouseWriteOffs?: WarehouseWriteOff[];
  objects: ObjectItem[];
  employees?: EmployeeItem[];
}

export default function ReportsView({
  computers,
  networkDevices,
  warehouseItems,
  warehouseWriteOffs = [],
  objects = [],
  employees = [],
}: ReportsViewProps) {
  const { t, language } = useTranslation();

  const printAreaRef = useRef<HTMLDivElement>(null);

  // States for filtering reports by Company vs specific Objects
  const [reportScope, setReportScope] = useState<'company' | 'object'>('company');
  const [selectedObjectName, setSelectedObjectName] = useState<string>(
    objects[0]?.name || 'Головной офис'
  );
  const [currency, setCurrency] = useState<WarehouseCurrency>('RUB');
  const [warranties] = useState(() => loadWarrantyPurchaseDates());

  // Filter computers, network devices and warehouse items depending on selected scope
  const filteredComputers = reportScope === 'company'
    ? computers
    : computers.filter(c => c.objectName === selectedObjectName);

  const filteredNetworkDevices = reportScope === 'company'
    ? networkDevices
    : networkDevices.filter(d => d.objectName === selectedObjectName);

  // If filtered by object, let's include warehouse items if the object belongs to "Склад/Склады/Головной" 
  // or matches storage keywords. Otherwise, warehouse items reside on the Central Warehouse, so they are 0 for non-storage entities.
  const filteredWarehouseItems = reportScope === 'company'
    ? warehouseItems
    : warehouseItems.filter(() => {
        const lowerName = selectedObjectName.toLowerCase();
        return lowerName.includes('склад') || lowerName.includes('головной');
      });

  const filteredWriteOffs = reportScope === 'company'
    ? warehouseWriteOffs
    : warehouseWriteOffs.filter((wo) => {
        if (wo.objectName === selectedObjectName) return true;
        const lowerName = selectedObjectName.toLowerCase();
        return lowerName.includes('склад') || lowerName.includes('головной');
      });

  // 1. Data mapping for computer statuses
  const statusDataRaw = filteredComputers.reduce((acc: { [key: string]: number }, cur) => {
    acc[cur.status] = (acc[cur.status] || 0) + 1;
    return acc;
  }, {});

  const statusPieData = Object.keys(statusDataRaw).map((key) => ({
    name: key,
    value: statusDataRaw[key],
  }));

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444'];

  // 2. Data mapping for Category Costs inside the warehouse
  const warehouseCategoryRaw = filteredWarehouseItems.reduce((acc: { [key: string]: { cost: number; count: number } }, cur) => {
    if (!acc[cur.type]) {
      acc[cur.type] = { cost: 0, count: 0 };
    }
    acc[cur.type].cost += cur.quantity * cur.costPerUnit;
    acc[cur.type].count += cur.quantity;
    return acc;
  }, {});

  const barChartData = Object.keys(warehouseCategoryRaw).map((key) => ({
    category: key,
    стоимость: convertRubAmount(warehouseCategoryRaw[key].cost, currency),
    количество: warehouseCategoryRaw[key].count,
  }));

  // Trigger standard browser print window
  const handlePrint = () => {
    printDocument();
  };

  const formatMoney = (valRub: number) => formatWarehouseCurrency(valRub, currency);

  const totalInvSum = filteredWarehouseItems.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0);

  const equipmentUnits = useMemo(
    () =>
      buildReportEquipmentUnits({
        computers: filteredComputers,
        networkDevices: filteredNetworkDevices,
        warehouseItems: filteredWarehouseItems,
        warehouseWriteOffs: filteredWriteOffs,
        employees,
        warranties,
      }),
    [filteredComputers, filteredNetworkDevices, filteredWarehouseItems, filteredWriteOffs, employees, warranties]
  );

  const lifecycleCounts = useMemo(
    () => countByLifecycleStatus(equipmentUnits, filteredComputers),
    [equipmentUnits, filteredComputers]
  );

  const equipmentCategoryCostData = useMemo(() => {
    const rows = buildEquipmentCostByCategory({
      computers: filteredComputers,
      networkDevices: filteredNetworkDevices,
      warehouseItems: filteredWarehouseItems,
    });
    return rows.map((row) => ({
      category: row.category,
      стоимость: convertRubAmount(row.costRub, currency),
      количество: row.count,
    }));
  }, [filteredComputers, filteredNetworkDevices, filteredWarehouseItems, currency]);

  const ageBucketCounts = useMemo(() => countByAgeBucket(equipmentUnits), [equipmentUnits]);
  const ageChartData = useMemo(
    () =>
      AGE_BUCKET_ORDER.map((key) => ({
        name: t(key),
        count: ageBucketCounts[key],
      })),
    [ageBucketCounts, language, t]
  );

  const averageAgeYears = useMemo(() => getAverageAgeYears(equipmentUnits), [equipmentUnits]);
  const olderThan3 = useMemo(() => countOlderThan(equipmentUnits, 3), [equipmentUnits]);
  const olderThan5 = useMemo(() => countOlderThan(equipmentUnits, 5), [equipmentUnits]);
  const olderThan7 = useMemo(() => countOlderThan(equipmentUnits, 7), [equipmentUnits]);
  const departmentData = useMemo(() => countByDepartment(equipmentUnits), [equipmentUnits]);
  const repairHistory = useMemo(
    () => buildRepairHistory(filteredComputers, filteredNetworkDevices, employees),
    [filteredComputers, filteredNetworkDevices, employees]
  );

  const LIFECYCLE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f97316', '#94a3b8'];
  const AGE_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];
  const CATEGORY_COST_COLORS = ['#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#64748b'];

  return (
    <div className="space-y-6">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          #root {
            display: none !important;
          }
          #printable-report-area {
            display: block !important;
            background: white !important;
            color: black !important;
            padding: 30px !important;
            margin: 0 !important;
            width: 100% !important;
            min-height: 100% !important;
          }
        }
      `}} />
      
      {/* Banner / Header Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileBarChart2 className="text-blue-500" />{t("Интерактивные отчеты и аналитика")}</h2>
          <p className="text-slate-400 text-xs">{t("Сводные графики распределения ресурсов, стоимостной аудит и выгрузка печатных форм.")}</p>
        </div>
        
        <button
          onClick={handlePrint}
          className="bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
        >
          <Printer size={14} />{t("Напечатать отчет")}</button>
      </div>

      {/* FILTER CONTROLS: Company vs Objects Switcher */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Масштаб аналитики:")}</span>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setReportScope('company')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                reportScope === 'company'
                  ? 'bg-white text-blue-600 shadow-3xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Globe size={13} />{t("Вся компания")}</button>
            <button
              onClick={() => {
                setReportScope('object');
                if (objects.length > 0 && !objects.some(o => o.name === selectedObjectName)) {
                  setSelectedObjectName(objects[0].name);
                }
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                reportScope === 'object'
                  ? 'bg-white text-blue-600 shadow-3xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 size={13} />{t("По отдельным объектам")}</button>
          </div>
        </div>

        {reportScope === 'object' && objects.length > 0 && (
          <div className="flex items-center gap-2 animate-fade-in">
            <span className="text-xs font-semibold text-slate-400">{t("Выберите объект:")}</span>
            <select
              value={selectedObjectName}
              onChange={(e) => setSelectedObjectName(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-indigo-700 bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500/25"
            >
              {objects.map((obj) => (
                <option key={obj.id} value={obj.name}>
                  🏢 {obj.name} (ул. {obj.address})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">{t("Валюта склада")}:</span>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as WarehouseCurrency)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500/25"
          >
            {WAREHOUSE_CURRENCY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of micro-KPI widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center relative overflow-hidden">
          <span className="text-[10px] text-slate-450 font-bold block uppercase tracking-wider">{t("Балансовая стоимость склада")}</span>
          <strong className="text-slate-800 text-xl font-bold block mt-1">{formatMoney(totalInvSum)}</strong>
          {reportScope === 'object' && !selectedObjectName.toLowerCase().includes('склад') && !selectedObjectName.toLowerCase().includes('головной') && (
            <span className="text-[9.5px] text-slate-400 block mt-1 italic leading-tight">{t("(Позиции размещены на Центр. Складе)")}</span>
          )}
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
          <span className="text-[10px] text-slate-455 font-bold block uppercase tracking-wider font-sans">{t("Компьютеров на руках")}</span>
          <strong className="text-slate-800 text-xl font-bold block mt-1">
            {filteredComputers.filter(c => c.status === 'В работе').length} ед.
          </strong>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
          <span className="text-[10px] text-slate-455 font-bold block uppercase tracking-wider">{t("Оборудования в ремонте")}</span>
          <strong className="text-rose-600 text-xl font-bold block mt-1">
            {filteredComputers.filter(c => c.status === 'На ремонте').length} ед.
          </strong>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-101 text-center font-semibold">
          <span className="text-[10px] text-slate-455 font-bold block uppercase tracking-wider">{t("Роутеров / Коммутаторов")}</span>
          <strong className="text-slate-800 text-xl font-bold block mt-1">
            {filteredNetworkDevices.length} ед.
          </strong>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Status breakdown (Pie Chart) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 lg:col-span-1">
          <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-1.5 border-b border-slate-50 pb-2">
            <PieIcon size={16} className="text-blue-500" />
            {reportScope === 'company' ? t('Статус техники в компании') : `${t('Статус техники на: ')} ${t(selectedObjectName)}`}
          </h3>
          
          <div className="h-64 flex items-center justify-center">
            {statusPieData.length === 0 ? (
              <span className="text-slate-400 text-xs italic">{t("Нет оборудования на данном объекте")}</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} ед.`, 'Количество']} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <p className="text-[10px] text-slate-404 italic text-center">{t("Процентное распределение компьютеров по эксплуатационному статусу.")}</p>
        </div>

        {/* Right Col: Warehouse valuation breakdown by categories (Bar Chart) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 lg:col-span-2">
          <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-1.5 border-b border-slate-50 pb-2">
            <BarChart2 size={16} className="text-[#84cc16]" />
            {t("Категории Склада ИТ (По цене)")} {reportScope === 'object' && !selectedObjectName.toLowerCase().includes('склад') && !selectedObjectName.toLowerCase().includes('головной') && '(Показано на Центр. Складе)'}
          </h3>

          <div className="h-64">
            {barChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">{t("Вне склада ТМЦ отсутствуют на хранении.")}</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barChartData}
                  margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} />
                  <Tooltip formatter={(value) => [formatCurrencyAmount(Number(value), currency), t('Капитализация')]} />
                  <Legend iconType="rect" wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="стоимость" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <p className="text-[10px] text-slate-404 italic text-center">{t("Суммированная стоимость ТМЦ, ожидающих распределения на складе.")}</p>
        </div>
      </div>

      {/* Lifecycle status KPIs */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 print:hidden">
        <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-1.5 border-b border-slate-50 pb-2">
          <TrendingUp size={16} className="text-indigo-500" />
          {t("Состояние оборудования")}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {REPORT_LIFECYCLE_ORDER.map((status, idx) => (
            <div
              key={status}
              className="bg-slate-50 rounded-xl border border-slate-100 p-3 text-center"
            >
              <span
                className="inline-block w-2 h-2 rounded-full mb-1.5"
                style={{ backgroundColor: LIFECYCLE_COLORS[idx] }}
              />
              <span className="text-[9px] text-slate-500 font-bold uppercase block leading-tight">{t(status)}</span>
              <strong className="text-lg font-bold text-slate-800 block mt-1">{lifecycleCounts[status]}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Age analytics KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
          <span className="text-[10px] text-slate-500 font-bold uppercase flex items-center justify-center gap-1">
            <Clock size={12} />{t("Средний возраст оборудования")}
          </span>
          <strong className="text-slate-800 text-xl font-bold block mt-1">
            {averageAgeYears !== null ? `${formatAgeYears(averageAgeYears)} ${t('лет')}` : '—'}
          </strong>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm text-center">
          <span className="text-[10px] text-amber-700 font-bold uppercase">{t("Старше 3 лет")}</span>
          <strong className="text-amber-800 text-xl font-bold block mt-1">{olderThan3} {t('ед.')}</strong>
        </div>
        <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm text-center">
          <span className="text-[10px] text-orange-700 font-bold uppercase">{t("Старше 5 лет")}</span>
          <strong className="text-orange-800 text-xl font-bold block mt-1">{olderThan5} {t('ед.')}</strong>
        </div>
        <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm text-center">
          <span className="text-[10px] text-rose-700 font-bold uppercase">{t("Старше 7 лет")}</span>
          <strong className="text-rose-800 text-xl font-bold block mt-1">{olderThan7} {t('ед.')}</strong>
        </div>
      </div>

      {/* Lifecycle + Age charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-50 pb-2">
            <BarChart2 size={16} className="text-indigo-500" />
            {t('Категории Оборудования (По цене)')}
          </h3>
          <div className="h-72">
            {equipmentCategoryCostData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                {t('Нет оборудования для отображения')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={equipmentCategoryCostData} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 9, fill: '#64748b' }}
                    axisLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === 'стоимость') {
                        return [formatCurrencyAmount(Number(value), currency), t('Стоимость')];
                      }
                      return [`${value} ${t('ед.')}`, t('Количество')];
                    }}
                  />
                  <Legend iconType="rect" wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="стоимость" radius={[6, 6, 0, 0]}>
                    {equipmentCategoryCostData.map((_, index) => (
                      <Cell key={`eq-cat-${index}`} fill={CATEGORY_COST_COLORS[index % CATEGORY_COST_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <p className="text-[10px] text-slate-400 italic text-center">
            {t('Суммарная стоимость всего учтённого оборудования: компьютеры, сеть и склад.')}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-50 pb-2">
            <Clock size={16} className="text-emerald-500" />
            {t("Возраст техники")}
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageChartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} allowDecimals={false} />
                <Tooltip formatter={(value) => [`${value} ${t('ед.')}`, t('Количество')]} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {ageChartData.map((_, index) => (
                    <Cell key={`age-${index}`} fill={AGE_COLORS[index % AGE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-slate-400 italic text-center">
            {t("Диаграмма: до 1 года · 1–3 года · 3–5 лет · более 5 лет")}
          </p>
        </div>
      </div>

      {/* Department + Repair history */}
      <div className="grid grid-cols-1 gap-6 print:hidden">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-50 pb-2">
            <Users size={16} className="text-blue-500" />
            {t("Техника по подразделениям")}
          </h3>
          <div className="h-72">
            {departmentData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">{t("Нет данных по подразделениям")}</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="department" width={100} tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} />
                  <Tooltip formatter={(value) => [`${value} ${t('ед.')}`, t('Количество')]} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-2">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <History size={16} className="text-rose-500" />
              {t("История ремонтов и замен комплектующих")}
            </h3>
            <span className="font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-bold">
              {repairHistory.length}
            </span>
          </div>
          <div className="max-h-[28rem] overflow-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-[11px] min-w-[960px]">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr className="text-slate-500 uppercase text-[9px]">
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">{t("Дата")}</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">{t("Инв. №")}</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">{t("Категория")}</th>
                  <th className="py-2.5 px-3 font-semibold min-w-[140px]">{t("Оборудование")}</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">{t("Объект")}</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">{t("Подразделение")}</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">{t("Ответственный")}</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">{t("Статус")}</th>
                  <th className="py-2.5 px-3 font-semibold min-w-[120px]">{t("Комплектующая")}</th>
                  <th className="py-2.5 px-3 font-semibold min-w-[100px]">{t("Было")}</th>
                  <th className="py-2.5 px-3 font-semibold min-w-[100px]">{t("Стало")}</th>
                  <th className="py-2.5 px-3 font-semibold min-w-[120px]">{t("Причина")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {repairHistory.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-10 text-center text-slate-400 italic">{t("Записей о ремонтах и заменах пока нет")}</td>
                  </tr>
                ) : (
                  repairHistory.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 align-top">
                      <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">{row.date}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">{row.inventoryNumber}</td>
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{row.category}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{row.equipmentLabel}</td>
                      <td className="py-2.5 px-3 text-slate-600">{row.objectName || '—'}</td>
                      <td className="py-2.5 px-3 text-slate-600">{row.department}</td>
                      <td className="py-2.5 px-3 text-slate-600">{row.employeeName}</td>
                      <td className="py-2.5 px-3">
                        <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium whitespace-nowrap">
                          {row.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-700">{row.component}</td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[10px]">{row.oldDetails}</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-mono text-[10px] font-semibold">{row.newDetails}</td>
                      <td className="py-2.5 px-3 text-slate-500 italic">{row.reason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {repairHistory.length > 0 && (
            <p className="text-[10px] text-slate-400 italic">
              {t('Показаны все зафиксированные замены комплектующих по компьютерам и сетевому оборудованию.')}
            </p>
          )}
        </div>
      </div>

      {/* Printable Report Preview structure rendered using React Portal */}
      {createPortal(
        <div id="printable-report-area" ref={printAreaRef} className="doc-official-page hidden print:block bg-white p-8 space-y-6 text-slate-800">
          <DocumentPrintShell>
          <div className="border-b-2 border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{t("ОТЧЕТ ПО УЧЕТУ ИТ-ИНВЕНТАРЯ")}</h1>
              <p className="text-xs text-slate-500 mt-1">{t("Область аналитики:")}<strong className="text-slate-850">{reportScope === 'company' ? 'Вся компания' : `Объект: ${selectedObjectName}`}</strong>
              </p>
              <p className="text-xs text-slate-500">{t('Сформирован автоматически системой учета')} • {new Date().toLocaleDateString(language === 'zh' ? 'zh-CN' : language === 'en' ? 'en-US' : 'ru-RU')}</p>
            </div>
            <span className="font-bold text-xs uppercase text-slate-500">{t("Экземпляр №1")}</span>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold border-b border-slate-300 pb-1 font-sans">{t("1. Сводные показатели")}</h2>
            <table className="w-full text-sm border-collapse border border-slate-300 text-left">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-2">{t("Показатель")}</th>
                  <th className="border border-slate-300 p-2 text-right">{t("Текущий параметр")}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-2">{t("Общее число рабочих станций / ПК")}</td>
                  <td className="border border-slate-300 p-2 text-right">{filteredComputers.length} шт.</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2">{t("Активно у сотрудников в работе")}</td>
                  <td className="border border-slate-300 p-2 text-right">{filteredComputers.filter(c => c.status === 'В работе').length} шт.</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2">{t("Роутеры и коммутаторы на сетях")}</td>
                  <td className="border border-slate-300 p-2 text-right">{filteredNetworkDevices.length} шт.</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2">{t("Действующий баланс оцениваемого склада")}</td>
                  <td className="border border-slate-300 p-2 text-right">{formatMoney(totalInvSum)}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2">{t("Средний возраст оборудования")}</td>
                  <td className="border border-slate-300 p-2 text-right">
                    {averageAgeYears !== null ? `${formatAgeYears(averageAgeYears)} ${t('лет')}` : '—'}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2">{t("Старше 3 лет")}</td>
                  <td className="border border-slate-300 p-2 text-right">{olderThan3} шт.</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2">{t("Старше 5 лет")}</td>
                  <td className="border border-slate-300 p-2 text-right">{olderThan5} шт.</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2">{t("Старше 7 лет")}</td>
                  <td className="border border-slate-300 p-2 text-right">{olderThan7} шт.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-4 pt-6">
            <h2 className="text-lg font-bold border-b border-slate-300 pb-1 font-sans">{t("2. Состояние оборудования")}</h2>
            <table className="w-full text-sm border-collapse border border-slate-300 text-left">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-2">{t("Статус")}</th>
                  <th className="border border-slate-300 p-2 text-right">{t("Количество")}</th>
                </tr>
              </thead>
              <tbody>
                {REPORT_LIFECYCLE_ORDER.map((status) => (
                  <tr key={status}>
                    <td className="border border-slate-300 p-2">{t(status)}</td>
                    <td className="border border-slate-300 p-2 text-right">{lifecycleCounts[status]} шт.</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-4 pt-6">
            <h2 className="text-lg font-bold border-b border-slate-300 pb-1 font-sans">{t("3. Возраст техники")}</h2>
            <table className="w-full text-sm border-collapse border border-slate-300 text-left">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-2">{t("Возрастная группа")}</th>
                  <th className="border border-slate-300 p-2 text-right">{t("Количество")}</th>
                </tr>
              </thead>
              <tbody>
                {AGE_BUCKET_ORDER.map((bucket) => (
                  <tr key={bucket}>
                    <td className="border border-slate-300 p-2">{t(bucket)}</td>
                    <td className="border border-slate-300 p-2 text-right">{ageBucketCounts[bucket]} шт.</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-4 pt-6">
            <h2 className="text-lg font-bold border-b border-slate-300 pb-1 font-sans">{t("4. История ремонтов и замен")}</h2>
            {repairHistory.length === 0 ? (
              <p className="text-sm text-slate-500 italic">{t("Записей о ремонтах и заменах пока нет")}</p>
            ) : (
              <table className="w-full text-[10px] border-collapse border border-slate-300 text-left">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 p-1.5">{t("Дата")}</th>
                    <th className="border border-slate-300 p-1.5">{t("Инв. №")}</th>
                    <th className="border border-slate-300 p-1.5">{t("Оборудование")}</th>
                    <th className="border border-slate-300 p-1.5">{t("Подразделение")}</th>
                    <th className="border border-slate-300 p-1.5">{t("Комплектующая")}</th>
                    <th className="border border-slate-300 p-1.5">{t("Было")}</th>
                    <th className="border border-slate-300 p-1.5">{t("Стало")}</th>
                    <th className="border border-slate-300 p-1.5">{t("Причина")}</th>
                  </tr>
                </thead>
                <tbody>
                  {repairHistory.map((row) => (
                    <tr key={row.id}>
                      <td className="border border-slate-300 p-1.5 font-mono">{row.date}</td>
                      <td className="border border-slate-300 p-1.5 font-mono">{row.inventoryNumber}</td>
                      <td className="border border-slate-300 p-1.5">{row.equipmentLabel}</td>
                      <td className="border border-slate-300 p-1.5">{row.department}</td>
                      <td className="border border-slate-300 p-1.5">{row.component}</td>
                      <td className="border border-slate-300 p-1.5">{row.oldDetails}</td>
                      <td className="border border-slate-300 p-1.5">{row.newDetails}</td>
                      <td className="border border-slate-300 p-1.5">{row.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="space-y-4 pt-10">
            <h2 className="text-lg font-bold border-b border-slate-300 pb-1 font-sans">{t("5. Список локаций и филиалов")}</h2>
            <table className="w-full text-sm border-collapse border border-slate-300 text-left">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-2">{t("Название объекта")}</th>
                  <th className="border border-slate-300 p-2">{t("Физический адрес")}</th>
                </tr>
              </thead>
              <tbody>
                {reportScope === 'company' ? (
                  objects.map(obj => (
                    <tr key={obj.id}>
                      <td className="border border-slate-300 p-2 font-bold">{obj.name}</td>
                      <td className="border border-slate-300 p-2">{obj.address}</td>
                    </tr>
                  ))
                ) : (
                  objects.filter(obj => obj.name === selectedObjectName).map(obj => (
                    <tr key={obj.id}>
                      <td className="border border-slate-300 p-2 font-bold">{obj.name}</td>
                      <td className="border border-slate-300 p-2">{obj.address}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pt-24 flex items-center justify-between text-xs border-t border-slate-300 text-slate-500">
            <span>{t("Подпись администратора аналитики: _______________________")}</span>
            <span>{t("Дата и время сверки: _______________________")}</span>
          </div>
          </DocumentPrintShell>
        </div>,
        document.body
      )}
    </div>
  );
}
