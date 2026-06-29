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
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Plus, Key, Edit2, Copy, Check, Eye, EyeOff, 
  Layers, User, MapPin, Clock, Database, Code, Banknote
} from 'lucide-react';
import ModalCloseButton from './ModalCloseButton';
import { useTranslation } from '../utils/i18n';
import { EQUIPMENT_TITLE_MAX_LENGTH, limitEquipmentTitle } from '../utils/equipmentFields';
import EquipmentGroupFilters, { SOFTWARE_STATUS_FILTER_OPTIONS } from './EquipmentGroupFilters';
import { SoftwareItem, SoftwareCategory, SoftwareLicenseSeat, EmployeeItem, ObjectItem, ComputerItem } from '../types';
import {
  formatWarehouseCurrency,
  WAREHOUSE_CURRENCY_OPTIONS,
  type WarehouseCurrency,
} from '../utils/currencyUtils';
import {
  buildLicenseSeatsFromForm,
  countAssignedLicenseSeats,
  countFreeLicenseSeats,
  CORPORATE_LICENSE_EMPLOYEE,
  deriveSoftwareAssignmentSummary,
  ensureLicenseSeats,
  formatLicenseSeatAssignmentLabel,
  FREE_LICENSE_EMPLOYEE,
  getSoftwareItemLicenseKeys,
  isLicenseSeatAssigned,
  normalizeSoftwareLicenseKeys,
  resizeLicenseKeyInputs,
  softwareItemMatchesKeySearch,
} from '../utils/softwareLicenseUtils';

interface SoftwareViewProps {
  softwareItems: SoftwareItem[];
  allSoftwareItems?: SoftwareItem[];
  employees: EmployeeItem[];
  objects: ObjectItem[];
  computers: ComputerItem[];
  onAdd: (item: Omit<SoftwareItem, 'id'>) => boolean | void;
  onEdit: (id: string, item: Omit<SoftwareItem, 'id'>) => boolean | void;
  onMarkForWriteOff?: (id: string) => void;
  onUnassignSeat?: (id: string, seatIndex: number) => void;
  currentUser?: { role: 'Viewer' | 'Editor' | 'Admin' };
  warehouses?: { name: string }[];
  allowCreate?: boolean;
}

export default function SoftwareView({
  softwareItems,
  allSoftwareItems,
  employees,
  objects,
  computers,
  onAdd,
  onEdit,
  onMarkForWriteOff,
  onUnassignSeat,
  currentUser,
  warehouses = [],
  allowCreate = true,
}: SoftwareViewProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('Все');
  const [filterStatus, setFilterStatus] = useState<string>('Все');
  const [filterObject, setFilterObject] = useState<string>('Все');
  
  // Modals and editing state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currency, setCurrency] = useState<WarehouseCurrency>('RUB');

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState<SoftwareCategory>('Системное ПО');
  const [licenseKeys, setLicenseKeys] = useState<string[]>(['']);
  const [version, setVersion] = useState('');
  const [developer, setDeveloper] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cost, setCost] = useState(0);
  const [licenseSeats, setLicenseSeats] = useState<SoftwareLicenseSeat[]>([
    { seatIndex: 0, assignedEmployeeName: FREE_LICENSE_EMPLOYEE },
  ]);
  const [objectName, setObjectName] = useState('Головной офис');
  const [status, setStatus] = useState<'Активна' | 'Истекла' | 'Не активирована'>('Активна');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [notes, setNotes] = useState('');

  const isViewer = currentUser?.role === 'Viewer';

  const categories: SoftwareCategory[] = [
    'Системное ПО',
    'Операционные системы (ОС)',
    'Утилиты и антивирусы',
    'Офисные приложения',
    'Графические редакторы',
    'Корпоративные системы',
    'Иное ПО'
  ];

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setCategory('Системное ПО');
    setLicenseKeys(['']);
    setVersion('');
    setDeveloper('');
    setQuantity(1);
    setCost(0);
    setLicenseSeats([{ seatIndex: 0, assignedEmployeeName: FREE_LICENSE_EMPLOYEE }]);
    setObjectName(objects[0]?.name || 'Головной офис');
    setStatus('Активна');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setExpirationDate('');
    setNotes('');
    setShowModal(true);
  };

  const handleOpenEdit = (item: SoftwareItem) => {
    setEditingId(item.id);
    setName(item.name);
    setCategory(item.category);
    const existingKeys = getSoftwareItemLicenseKeys(item);
    setLicenseKeys(
      resizeLicenseKeyInputs(
        existingKeys.length ? existingKeys : [item.licenseKey || ''],
        item.quantity || 1
      )
    );
    setVersion(item.version);
    setDeveloper(item.developer);
    setQuantity(item.quantity);
    setCost(item.cost || 0);
    setLicenseSeats(ensureLicenseSeats(item));
    setObjectName(item.objectName);
    setStatus(item.status);
    setPurchaseDate(item.purchaseDate || '');
    setExpirationDate(item.expirationDate || '');
    setNotes(item.notes || '');
    setShowModal(true);
  };

  const handleQuantityChange = (nextQty: number) => {
    const qty = Math.max(1, nextQty || 1);
    setQuantity(qty);
    setLicenseKeys((prevKeys) => {
      const nextKeys = resizeLicenseKeyInputs(prevKeys, qty);
      setLicenseSeats((prevSeats) =>
        buildLicenseSeatsFromForm(nextKeys, qty, prevSeats, objectName, t('Без ключа'))
      );
      return nextKeys;
    });
  };

  const handleLicenseKeyChange = (index: number, value: string) => {
    setLicenseKeys((prev) => {
      const next = [...prev];
      next[index] = value;
      setLicenseSeats((prevSeats) =>
        buildLicenseSeatsFromForm(next, quantity, prevSeats, objectName, t('Без ключа'))
      );
      return next;
    });
  };

  const handleSeatEmployeeChange = (seatIndex: number, employeeName: string) => {
    const isFree =
      !employeeName ||
      employeeName === FREE_LICENSE_EMPLOYEE ||
      employeeName === 'none';
    setLicenseSeats((prev) =>
      prev.map((s) =>
        s.seatIndex === seatIndex
          ? {
              ...s,
              assignedEmployeeName: isFree ? FREE_LICENSE_EMPLOYEE : employeeName,
              assignedDeviceId: isFree ? undefined : s.assignedDeviceId,
            }
          : s
      )
    );
  };

  const handleSeatDeviceChange = (seatIndex: number, deviceId: string) => {
    setLicenseSeats((prev) =>
      prev.map((s) =>
        s.seatIndex === seatIndex
          ? { ...s, assignedDeviceId: deviceId === 'none' ? undefined : deviceId }
          : s
      )
    );
  };

  const handleUnassignSeatLocal = (seatIndex: number) => {
    handleSeatEmployeeChange(seatIndex, FREE_LICENSE_EMPLOYEE);
  };

  const handleSetFreeLicense = () => {
    const free = 'FREE-OPEN-SOURCE-LICENSE';
    setLicenseKeys(Array.from({ length: Math.max(1, quantity) }, () => free));
  };

  const handleCopyKey = (id: string, keyVal: string) => {
    navigator.clipboard.writeText(keyVal);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleRevealKey = (id: string) => {
    setRevealedKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = limitEquipmentTitle(name.trim());
    if (!trimmedName) {
      alert(t('Укажите название программы'));
      return;
    }

    const qty = Math.max(1, Number(quantity) || 1);
    const seats = buildLicenseSeatsFromForm(licenseKeys, qty, licenseSeats, objectName, t('Без ключа'));
    const { licenseKey, licenseKeys: normalizedKeys } = normalizeSoftwareLicenseKeys(
      seats.map((s) => s.licenseKey || ''),
      qty,
      t('Без ключа')
    );
    const summary = deriveSoftwareAssignmentSummary(seats, status);

    const payload = {
      name: trimmedName,
      category,
      licenseKey,
      licenseKeys: qty > 1 ? normalizedKeys : undefined,
      licenseSeats: seats,
      version: version || '1.0',
      developer: developer || 'Не указан',
      quantity: qty,
      cost: Number(cost) || 0,
      assignedEmployeeName: summary.assignedEmployeeName,
      assignedDeviceId: summary.assignedDeviceId,
      objectName,
      status: summary.status,
      purchaseDate,
      expirationDate,
      notes
    };

    if (!allowCreate && !editingId) {
      alert(t('Ручное добавление ПО отключено. Используйте выдачу/перемещение.'));
      return;
    }

    const ok = editingId ? onEdit(editingId, payload) : onAdd(payload);
    if (ok !== false) {
      setShowModal(false);
    }
  };

  const filtered = softwareItems.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(search.toLowerCase()) || 
      softwareItemMatchesKeySearch(item, search) ||
      item.developer.toLowerCase().includes(search.toLowerCase()) ||
      ensureLicenseSeats(item).some((s) =>
        (s.assignedEmployeeName || '').toLowerCase().includes(search.toLowerCase())
      );
    
    const matchesCategory = filterCategory === 'Все' || item.category === filterCategory;
    const matchesStatus = filterStatus === 'Все' || item.status === filterStatus;
    const matchesObject = filterObject === 'Все' || item.objectName === filterObject;

    return matchesSearch && matchesCategory && matchesStatus && matchesObject;
  });

  const categoryFilterOptions = [
    { value: 'Все', label: 'Все категории' },
    ...categories.map((cat) => ({ value: cat, label: cat })),
  ];

  const objectFilterOptions = [
    { value: 'Все', label: 'Все объекты' },
    ...objects.map((obj) => ({ value: obj.name, label: obj.name })),
  ];

  // Analytics helper calculations (full registry, not only active group view)
  const registryItems = allSoftwareItems ?? softwareItems;
  const totalApps = registryItems.length;
  const activeLicenses = registryItems.filter(i => i.status === 'Активна').length;
  const expiredLicenses = registryItems.filter(i => i.status === 'Истекла').length;
  const totalLicenseSeats = registryItems.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalRegistryValue = registryItems.reduce(
    (acc, curr) => acc + (curr.quantity || 1) * (curr.cost || 0),
    0
  );

  const formatMoney = (valRub: number) => formatWarehouseCurrency(valRub, currency);

  return (
    <div className="space-y-6">
      {/* Analytics KPI Dashboard tiles */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-sm font-bold text-slate-800">{t('Реестр программного обеспечения')}</h2>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value as WarehouseCurrency)}
          className="text-xs font-semibold text-slate-600 bg-white pl-2.5 pr-7 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer self-start sm:self-auto"
          aria-label={t('Валюта')}
        >
          {WAREHOUSE_CURRENCY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1 */}
        <div id="soft-kpi-total" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Layers size={22} />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold block tracking-wider uppercase">{t("Всего программ")}</span>
            <span className="text-2xl font-bold text-slate-800">{totalApps}</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div id="soft-kpi-active" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Key size={22} />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold block tracking-wider uppercase">{t("Активных лицензий")}</span>
            <span className="text-2xl font-bold text-slate-800">{activeLicenses}</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div id="soft-kpi-expired" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold block tracking-wider uppercase">{t("Срок истек")}</span>
            <span className="text-2xl font-bold text-slate-800">{expiredLicenses}</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div id="soft-kpi-seats" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center shrink-0">
            <Database size={22} />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold block tracking-wider uppercase">{t("Всего мест (копий)")}</span>
            <span className="text-2xl font-bold text-slate-800">{totalLicenseSeats}</span>
          </div>
        </div>

        {/* KPI 5 */}
        <div id="soft-kpi-value" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Banknote size={22} />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold block tracking-wider uppercase">{t("Стоимость лицензий")}</span>
            <span className="text-2xl font-bold text-slate-800">{formatMoney(totalRegistryValue)}</span>
          </div>
        </div>
      </div>

      {/* Main Filter & Utility Container */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <input
              type="text"
              placeholder={t("Поиск по названию, ключу, разработчику...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          {!isViewer && allowCreate && (
            <button
              onClick={handleOpenAdd}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Plus size={16} />{t("Добавить ПО")}</button>
          )}
        </div>

        <EquipmentGroupFilters
          categoryValue={filterCategory}
          onCategoryChange={setFilterCategory}
          categoryOptions={categoryFilterOptions}
          statusValue={filterStatus}
          onStatusChange={setFilterStatus}
          statusOptions={SOFTWARE_STATUS_FILTER_OPTIONS}
          objectValue={filterObject}
          onObjectChange={setFilterObject}
          objectOptions={objectFilterOptions}
        />
      </div>

      {/* Grid List & Detailed Software Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-5">{t("Название и разработчик")}</th>
                <th className="py-3 px-5">{t("Категория")}</th>
                <th className="py-3 px-5">{t("Лицензионный Ключ")}</th>
                <th className="py-3 px-5">{t("Мест (Лицензий)")}</th>
                <th className="py-3 px-5">{t("Стоимость")}</th>
                <th className="py-3 px-4">{t("Сотрудник / Локация")}</th>
                <th className="py-3 px-4">{t("Срок действия")}</th>
                <th className="py-3 px-4">{t("Статус")}</th>
                {!isViewer && <th className="py-3 px-5 text-right">{t("Действия")}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Key size={36} className="text-slate-300 stroke-1" />
                      <p className="text-sm font-medium">{t("Программное обеспечение не найдено")}</p>
                      <p className="text-xs text-slate-400">
                        {softwareItems.length === 0 && !search.trim() && filterCategory === 'Все' && filterStatus === 'Все' && filterObject === 'Все'
                          ? t('Добавьте программу кнопкой «Добавить ПО» — учёт ведётся только в этом разделе.')
                          : t('Попробуйте изменить поисковый запрос или фильтры')}
                      </p>
                      {!isViewer && allowCreate && softwareItems.length === 0 && (
                        <button
                          type="button"
                          onClick={handleOpenAdd}
                          className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2 px-4 rounded-lg inline-flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                        >
                          <Plus size={16} />
                          {t('Добавить ПО')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const itemKeys = getSoftwareItemLicenseKeys(item);
                  const isRevealed = !!revealedKeys[item.id];
                  const keyDisplay = isRevealed
                    ? itemKeys.length > 1
                      ? itemKeys.map((k, i) => `${i + 1}. ${k}`).join('\n')
                      : itemKeys[0] || item.licenseKey
                    : itemKeys.length > 1
                      ? `${itemKeys.length} ${t('ключей')}`
                      : '•••••-•••••-•••••-•••••-•••••';
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-slate-800 leading-tight flex items-center gap-1.5">
                          {item.name}
                          <span className="text-[10.5px] bg-slate-100 text-slate-500 rounded px-1 py-0.5 font-mono">
                            v{item.version}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">{item.developer}</div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="text-xs bg-slate-50 text-slate-600 rounded-md px-2 py-1 border border-slate-100">
                          {t(item.category)}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`${isRevealed ? 'text-slate-700 bg-slate-50' : 'text-slate-300'} px-2 py-1 rounded border border-slate-100 font-bold tracking-wide select-all whitespace-pre-line`}>
                            {keyDisplay}
                          </span>
                          <button
                            onClick={() => toggleRevealKey(item.id)}
                            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-all"
                            title={isRevealed ? t("Скрыть ключ") : t("Показать ключ")}
                          >
                            {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button
                            onClick={() => handleCopyKey(item.id, itemKeys.join('\n') || item.licenseKey)}
                            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-all relative"
                            title={t("Копировать в буфер")}
                          >
                            {copiedId === item.id ? (
                              <Check size={14} className="text-emerald-500 animate-scale" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 font-bold text-slate-600">
                        {item.quantity} шт.
                      </td>
                      <td className="py-3.5 px-5 text-xs text-slate-600">
                        <div className="font-semibold text-slate-700">{formatMoney((item.cost || 0) * (item.quantity || 1))}</div>
                        {(item.cost || 0) > 0 && (
                          <div className="text-[10px] text-slate-400">{formatMoney(item.cost || 0)} / {t("место")}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs space-y-1">
                        <div className="flex items-center gap-1 text-slate-600">
                          <User size={12} className="text-slate-400" />
                          <span className="font-medium">{formatLicenseSeatAssignmentLabel(item, t)}</span>
                        </div>
                        {ensureLicenseSeats(item)
                          .filter(isLicenseSeatAssigned)
                          .slice(0, 3)
                          .map((seat) => (
                            <div key={seat.seatIndex} className="flex items-center gap-1 text-slate-500 pl-4">
                              <span>
                                #{seat.seatIndex + 1}: {seat.assignedEmployeeName}
                                {seat.assignedDeviceId && (
                                  <> · {computers.find((c) => c.id === seat.assignedDeviceId)?.model || t('ПК')}</>
                                )}
                              </span>
                              {!isViewer && onUnassignSeat && (
                                <button
                                  type="button"
                                  onClick={() => onUnassignSeat(item.id, seat.seatIndex)}
                                  className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold ml-1"
                                  title={t('Открепить')}
                                >
                                  {t('Открепить')}
                                </button>
                              )}
                            </div>
                          ))}
                        {countAssignedLicenseSeats(ensureLicenseSeats(item)) > 3 && (
                          <div className="text-[10px] text-slate-400 pl-4">
                            +{countAssignedLicenseSeats(ensureLicenseSeats(item)) - 3} {t('ещё')}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-slate-400">
                          <MapPin size={12} className="text-slate-400" />
                          <span>{item.objectName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-500">
                        {item.expirationDate ? (
                          <div className="space-y-0.5">
                            <div>До {item.expirationDate}</div>
                            {item.purchaseDate && <div className="text-[10px] text-slate-400">Куплено: {item.purchaseDate}</div>}
                          </div>
                        ) : (
                          <span className="text-slate-450 italic">{t("Бессрочная")}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full ${
                          item.status === 'Активна' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : item.status === 'Истекла' 
                              ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            item.status === 'Активна' ? 'bg-emerald-500' : item.status === 'Истекла' ? 'bg-rose-500' : 'bg-amber-500'
                          }`} />
                          {t(item.status)}
                        </span>
                      </td>
                      {!isViewer && (
                        <td className="py-3.5 px-5 text-right space-x-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 bg-slate-50 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-100 hover:border-blue-100 rounded-lg transition-all"
                            title={t("Редактировать")}
                          >
                            <Edit2 size={13} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Software Modal overlay */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/75">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Key size={16} />
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">
                    {editingId ? t('Редактировать ПО') : t('Зарегистрировать новое ПО')}
                  </h3>
                </div>
                <ModalCloseButton onClick={() => setShowModal(false)} />
              </div>

              {/* Form body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">{t("Название программы *")}</label>
                    <input
                      type="text"
                      required
                      maxLength={EQUIPMENT_TITLE_MAX_LENGTH}
                      placeholder={t("Например: Microsoft Office, Adobe Photoshop")}
                      value={name}
                      onChange={(e) => setName(limitEquipmentTitle(e.target.value))}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400">{name.length}/{EQUIPMENT_TITLE_MAX_LENGTH}</span>
                  </div>

                  {/* Category Selection */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">{t("Категория ПО *")}</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as SoftwareCategory)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/10 focus:outline-none"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{t(cat)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Developer */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">{t("Разработчик")}</label>
                    <input
                      type="text"
                      placeholder={t("Например: Microsoft, JetBrains, 1С")}
                      value={developer}
                      onChange={(e) => setDeveloper(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:outline-none"
                    />
                  </div>

                  {/* Version */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">{t("Версия ПО")}</label>
                    <input
                      type="text"
                      placeholder={t("Например: 2024, LTSC, 8.3")}
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:outline-none"
                    />
                  </div>

                  {/* Quantity of licenses */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">{t("Количество лицензий (копий)")}</label>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => handleQuantityChange(Number(e.target.value))}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:outline-none"
                    />
                  </div>

                  {/* Cost per license seat */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">{t("Стоимость за место, ₽")}</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={cost}
                      onChange={(e) => setCost(Number(e.target.value))}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:outline-none"
                    />
                  </div>

                  {/* Activation keys — отдельное поле на каждую лицензию */}
                  <div className="col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                        <Key size={13} className="text-blue-500" />
                        {quantity > 1
                          ? `${t('Лицензионные ключи')} (${quantity})`
                          : t('Лицензионный Ключ Активации')}
                      </label>
                      <button
                        type="button"
                        onClick={handleSetFreeLicense}
                        className="text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-2 py-1 rounded inline-flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Code size={11} />
                        {t('Без ключа')}
                      </button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {licenseKeys.map((keyVal, index) => (
                        <div key={index}>
                          {quantity > 1 && (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                              {t('Место')} {index + 1}
                            </span>
                          )}
                          <input
                            type="text"
                            placeholder={t('Введите ключ активации')}
                            value={keyVal}
                            onChange={(e) => handleLicenseKeyChange(index, e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-white font-mono placeholder:font-sans focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                    <span className="text-[10.5px] text-slate-400 block leading-relaxed">
                      {t('При нескольких лицензиях укажите отдельный ключ для каждого места. Суммы в реестре хранятся в рублях; отображение пересчитывается по выбранной валюте.')}
                    </span>
                  </div>

                  {/* Распределение лицензий по местам */}
                  <div className="col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                        {t('Назначение лицензий')}
                      </label>
                      <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 rounded-lg px-2 py-1">
                        {countAssignedLicenseSeats(licenseSeats)} {t('выдано')} · {countFreeLicenseSeats(licenseSeats)} {t('свободно')} / {licenseSeats.length}
                      </span>
                    </div>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {licenseSeats.map((seat) => {
                        const assigned = isLicenseSeatAssigned(seat);
                        const employeeValue = assigned ? seat.assignedEmployeeName || '' : FREE_LICENSE_EMPLOYEE;
                        return (
                          <div
                            key={seat.seatIndex}
                            className={`rounded-lg border p-3 space-y-2 ${assigned ? 'bg-white border-blue-100' : 'bg-slate-100/80 border-slate-200'}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                {t('Место')} {seat.seatIndex + 1}
                                {!assigned && (
                                  <span className="ml-2 text-emerald-600 normal-case">{t('Свободна')}</span>
                                )}
                              </span>
                              {assigned && (
                                <button
                                  type="button"
                                  onClick={() => handleUnassignSeatLocal(seat.seatIndex)}
                                  className="text-[10px] font-bold text-rose-600 hover:text-rose-700"
                                >
                                  {t('Открепить')}
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <select
                                value={employeeValue}
                                onChange={(e) => handleSeatEmployeeChange(seat.seatIndex, e.target.value)}
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500/10 focus:outline-none"
                              >
                                <option value={FREE_LICENSE_EMPLOYEE}>{t('Свободная лицензия (в запасе)')}</option>
                                <option value={CORPORATE_LICENSE_EMPLOYEE}>{t('Все сотрудники (корпоративная)')}</option>
                                {employees.map((emp) => (
                                  <option key={emp.id} value={emp.name}>
                                    {emp.name} ({emp.position})
                                  </option>
                                ))}
                              </select>
                              <select
                                value={seat.assignedDeviceId || 'none'}
                                onChange={(e) => handleSeatDeviceChange(seat.seatIndex, e.target.value)}
                                disabled={!assigned}
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500/10 focus:outline-none disabled:opacity-50"
                              >
                                <option value="none">{t('Без привязки к устройству')}</option>
                                {computers
                                  .filter((c) => c.category === 'ПК' || c.category === 'Ноутбук')
                                  .map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.model} ({c.inventoryNumber})
                                    </option>
                                  ))}
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <span className="text-[10.5px] text-slate-400 block leading-relaxed">
                      {t('Общее количество мест не меняется: свободные лицензии остаются в пуле. При откреплении место снова становится свободным.')}
                    </span>
                  </div>

                  {/* Object Attachment */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">{t("Адресный объект установки")}</label>
                    <select
                      value={objectName}
                      onChange={(e) => setObjectName(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/10 focus:outline-none"
                    >
                      {objects.map((obj) => (
                        <option key={obj.id} value={obj.name}>{obj.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">{t("Статус действия")}</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/10 focus:outline-none"
                    >
                      <option value="Активна">{t("Активна")}</option>
                      <option value="Истекла">{t("Истекла")}</option>
                      <option value="Не активирована">{t("Не активирована")}</option>
                    </select>
                  </div>

                  {/* Purchase Date */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">{t("Дата покупки")}</label>
                    <input
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:outline-none"
                    />
                  </div>

                  {/* Expiration Date */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">{t("Дата истечения лицензии")}</label>
                    <input
                      type="date"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/10 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400">{t("Оставьте пустым для бессрочной лицензии")}</span>
                  </div>

                  {/* Notes */}
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">{t("Дополнительные комментарии")}</label>
                    <textarea
                      placeholder={t("Например: закупка по тендеру 2026 года...")}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500/10 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Submit actions */}
                <div className="pt-4 border-t border-slate-150 flex items-center justify-end gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-50 transition-all font-medium cursor-pointer"
                  >{t("Отмена")}</button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-semibold shadow-sm cursor-pointer"
                  >
                    {editingId ? t('Изменить') : t('Добавить')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
