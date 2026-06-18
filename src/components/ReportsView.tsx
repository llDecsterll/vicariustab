/*
 * COPYRIGHT NOTICE | УВЕДОМЛЕНИЕ ОБ АВТОРСКИХ ПРАВАХ | 版权声明
 * © 2026 Utkin Vladislav Vyacheslavovich (Уткин Владислав Вячеславович)
 * Email: assetorbit@icloud.com | Telegram: https://t.me/Dexterll
 * All rights reserved. Unauthorized copying, modification, distribution or commercial use is prohibited.
 * 保留所有权利。未经版权所有者事先书面同意，禁止复制、修改、分发或商业使用。
 * Все права защищены. Копирование, изменение, распространение и коммерческое использование без письменного согласия правообладателя запрещено.
 */
import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FileBarChart2, Printer, Building2, Globe, TrendingUp, PieChart as PieIcon, BarChart2 } from 'lucide-react';
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
import { ComputerItem, NetworkDevice, WarehouseItem, ObjectItem } from '../types';
import { useTranslation } from '../utils/i18n';

interface ReportsViewProps {
  computers: ComputerItem[];
  networkDevices: NetworkDevice[];
  warehouseItems: WarehouseItem[];
  objects: ObjectItem[];
}

export default function ReportsView({
  computers,
  networkDevices,
  warehouseItems,
  objects = [],
}: ReportsViewProps) {
  const { t } = useTranslation();

  const printAreaRef = useRef<HTMLDivElement>(null);

  // States for filtering reports by Company vs specific Objects
  const [reportScope, setReportScope] = useState<'company' | 'object'>('company');
  const [selectedObjectName, setSelectedObjectName] = useState<string>(
    objects[0]?.name || 'Головной офис'
  );

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
    стоимость: warehouseCategoryRaw[key].cost,
    количество: warehouseCategoryRaw[key].count,
  }));

  // Trigger standard browser print window
  const handlePrint = () => {
    window.print();
  };

  const formatRub = (val: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);
  };

  const totalInvSum = filteredWarehouseItems.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0);

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
      </div>

      {/* Grid of micro-KPI widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center relative overflow-hidden">
          <span className="text-[10px] text-slate-450 font-bold block uppercase tracking-wider">{t("Балансовая стоимость склада")}</span>
          <strong className="text-slate-800 text-xl font-bold block mt-1">{formatRub(totalInvSum)}</strong>
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
                  <Tooltip formatter={(value) => [formatRub(Number(value)), 'Капитализация']} />
                  <Legend iconType="rect" wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="стоимость" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <p className="text-[10px] text-slate-404 italic text-center">{t("Суммированная стоимость ТМЦ, ожидающих распределения на складе.")}</p>
        </div>
      </div>

      {/* Printable Report Preview structure rendered using React Portal */}
      {createPortal(
        <div id="printable-report-area" ref={printAreaRef} className="hidden print:block bg-white p-8 space-y-6 text-slate-800">
          <div className="border-b-2 border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{t("ОТЧЕТ ПО УЧЕТУ ИТ-ИНВЕНТАРЯ")}</h1>
              <p className="text-xs text-slate-500 mt-1">{t("Область аналитики:")}<strong className="text-slate-850">{reportScope === 'company' ? 'Вся компания' : `Объект: ${selectedObjectName}`}</strong>
              </p>
              <p className="text-xs text-slate-500">Сформирован автоматически системой учета • {new Date().toLocaleDateString('ru-RU')}</p>
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
                  <td className="border border-slate-300 p-2 text-right">{formatRub(totalInvSum)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-4 pt-10">
            <h2 className="text-lg font-bold border-b border-slate-300 pb-1 font-sans">{t("2. Список локаций и филиалов")}</h2>
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
        </div>,
        document.body
      )}
    </div>
  );
}
