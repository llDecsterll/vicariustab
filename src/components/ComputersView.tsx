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
import { Laptop, Plus, Search, Trash2, Edit2, Shield, Settings2, FileText, Upload, Paperclip, RotateCcw } from 'lucide-react';
import { ComputerItem, ComputerCategory, ComputerStatus, EmployeeItem, ObjectItem } from '../types';
import { getDeviceIcon } from '../utils/deviceIcons';
import { useTranslation } from '../utils/i18n';
import {
  EQUIPMENT_TITLE_MAX_LENGTH,
  limitEquipmentTitle,
  supportsComputerSpecifications,
} from '../utils/equipmentFields';
import {
  type EquipmentTab,
  getCategoriesForEquipmentTab,
  getCategoryFilterLabel,
  isVideoCameraDevice,
  isVideoRecorderDevice,
} from '../utils/warehouseRouting';
import EquipmentGroupFilters, { HARDWARE_STATUS_FILTER_OPTIONS } from './EquipmentGroupFilters';
import ModalCloseButton from './ModalCloseButton';

interface ComputersViewProps {
  computers: ComputerItem[];
  employees: EmployeeItem[];
  objects: ObjectItem[];
  allComputers?: ComputerItem[];
  onAdd: (comp: Omit<ComputerItem, 'id'>) => boolean | void;
  onEdit: (id: string, item: Omit<ComputerItem, 'id'>) => boolean | void;
  onMarkForWriteOff?: (id: string) => void;
  onReturnToWarehouse?: (id: string) => void;
  onViewDetails?: (type: 'computer' | 'employee' | 'object', id: string) => void;
  addButtonLabel?: string;
  addModalTitle?: string;
  currentUser?: { role: 'Viewer' | 'Editor' | 'Admin' };
  defaultCategory?: ComputerCategory;
  defaultDeviceType?: string;
  /** When set, view is an equipment group: scoped categories, no delete — return to warehouse only */
  equipmentTab?: EquipmentTab;
  /** Equipment is added only via warehouse; direct add in group views is disabled by default */
  allowDirectAdd?: boolean;
}

const mapDeviceTypeToCategory = (type: string, currentCategory?: ComputerCategory): ComputerCategory => {
  switch (type) {
    case 'Ноутбук': return 'Ноутбук';
    case 'ПК': return 'ПК';
    case 'Монитор': return 'Монитор';
    case 'Принтер':
    case 'МФУ': return 'Оргтехника';
    case 'Клавиатура':
    case 'Мышь':
    case 'Клавиатура + мышь':
    case 'Клавиатура + Мышь': return 'Периферия';
    case 'Видеокамера':
    case 'Видеорегистратор': return 'Видеонаблюдение';
    case 'Картридж':
    case 'Картриджи':
    case 'картриджи':
    case 'Расходные материалы для МФУ': return 'Расходники';
    case 'Другое':
      if (currentCategory === 'Периферия' || currentCategory === 'Монитор') {
        return 'Периферия';
      }
      return 'Другое';
    default:
      if (currentCategory) return currentCategory;
      return 'Другое';
  }
};

export default function ComputersView({
  computers,
  employees,
  objects,
  allComputers,
  onAdd,
  onEdit,
  onMarkForWriteOff,
  onReturnToWarehouse,
  onViewDetails,
  addButtonLabel = 'Добавить компьютер',
  addModalTitle = 'Добавить компьютер',
  currentUser,
  defaultCategory,
  defaultDeviceType,
  equipmentTab,
  allowDirectAdd = false,
}: ComputersViewProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('Все');
  const [filterCategory, setFilterCategory] = useState<string>('Все');
  const [filterObject, setFilterObject] = useState<string>('Все');

  const isEquipmentGroup = Boolean(equipmentTab);
  const allowedCategories = equipmentTab ? getCategoriesForEquipmentTab(equipmentTab) : null;

  const isViewer = currentUser?.role === 'Viewer';
  const isAdmin = currentUser?.role === 'Admin';

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const getDeviceTypeOptions = (cat?: ComputerCategory): string[] => {
    const activeCat = cat || defaultCategory;
    if (!activeCat || activeCat === 'ПК' || activeCat === 'Ноутбук') {
      return ['ПК', 'Ноутбук', 'Сервер'];
    }
    if (activeCat === 'Периферия' || activeCat === 'Монитор') {
      return ['Клавиатура', 'Мышь', 'Клавиатура + Мышь', 'Монитор', 'Другое'];
    }
    if (activeCat === 'Оргтехника') {
      return ['МФУ', 'Принтер', 'Сканер', 'Другое'];
    }
    if (activeCat === 'Видеонаблюдение') {
      return ['Видеокамера', 'Видеорегистратор', 'Другое'];
    }
    if (activeCat === 'Расходники') {
      return ['Картриджи', 'Расходные материалы для МФУ', 'Расходники'];
    }
    return ['Другое'];
  };

  const options = getDeviceTypeOptions();
  let initialDevType = defaultDeviceType || options[0] || 'Ноутбук';
  if (defaultCategory === 'Оргтехника' && initialDevType === 'Принтер') {
    initialDevType = 'МФУ';
  }
  if (defaultCategory === 'Расходники' && initialDevType === 'Картридж') {
    initialDevType = 'Картриджи';
  }

  // Form states
  const [category, setCategory] = useState<ComputerCategory>(defaultCategory || mapDeviceTypeToCategory(initialDevType, defaultCategory));
  const [deviceType, setDeviceType] = useState<string>(initialDevType);
  const [model, setModel] = useState('');
  const [inventoryNumber, setInventoryNumber] = useState('');
  const [employeeName, setEmployeeName] = useState(employees[0]?.name || 'Иванов И.И.');
  const [status, setStatus] = useState<ComputerStatus>('В работе');
  const [objectName, setObjectName] = useState(objects[0]?.name || 'Головной офис');
  const [linkedToDeviceId, setLinkedToDeviceId] = useState<string>('none');

  // New hardware components states (PCs specific)
  const [motherboardModel, setMotherboardModel] = useState('');
  const [motherboardSerial, setMotherboardSerial] = useState('');
  const [hddModel, setHddModel] = useState('');
  const [hddSerial, setHddSerial] = useState('');
  const [ramModel, setRamModel] = useState('');
  const [ramSerial, setRamSerial] = useState('');
  const [caseModel, setCaseModel] = useState('');
  const [powerSupplyModel, setPowerSupplyModel] = useState('');
  const [powerSupplySerial, setPowerSupplySerial] = useState('');
  const [cpuModel, setCpuModel] = useState('');
  const [cpuSerial, setCpuSerial] = useState('');
  const [gpuModel, setGpuModel] = useState('');
  const [gpuSerial, setGpuSerial] = useState('');
  const [serialNumber, setSerialNumber] = useState('');

  // Paper documents states
  const [invoiceInfo, setInvoiceInfo] = useState('');
  const [memoInfo, setMemoInfo] = useState('');
  const [warrantyInfo, setWarrantyInfo] = useState('');
  const [pdfFiles, setPdfFiles] = useState<{ name: string; size?: string; content?: string; group?: string; dateUploaded?: string }[]>([]);
  const [cost, setCost] = useState<number>(0);

  const handleFileUpload = (file: File | null, groupName: string) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Пожалуйста, выберите файл в формате PDF!');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const newFile = {
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} КБ`,
        content: reader.result as string,
        group: groupName,
        dateUploaded: new Date().toISOString().split('T')[0]
      };
      setPdfFiles(prev => [...prev.filter(f => f.group !== groupName), newFile]);
    };
    reader.readAsDataURL(file);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    const opts = getDeviceTypeOptions();
    let devType = opts[0] || 'Ноутбук';
    if (defaultCategory === 'Оргтехника') {
      devType = 'МФУ';
    } else if (defaultCategory === 'Расходники') {
      devType = 'Картриджи';
    }
    const cat = defaultCategory || mapDeviceTypeToCategory(devType, defaultCategory);
    setCategory(cat);
    setDeviceType(devType);
    setModel('');
    
    let prefix = 'PC';
    if (cat === 'Ноутбук') prefix = 'NB';
    else if (cat === 'ПК') prefix = 'PC';
    else if (cat === 'Монитор') prefix = 'MON';
    else if (cat === 'Периферия') prefix = 'PER';
    else if (cat === 'Оргтехника') prefix = 'PRN';
    else if (cat === 'Видеонаблюдение') prefix = 'CAM';
    else if (cat === 'Расходники') prefix = 'CON';
    else prefix = 'EQ';

    setInventoryNumber(`${prefix}-00${Math.floor(Math.random() * 900) + 100}`);
    setEmployeeName(employees[0]?.name || 'Иванов И.И.');
    setStatus('В работе');
    setObjectName(objects[0]?.name || 'Головной офис');
    setLinkedToDeviceId('none');
    setCost(0);

    // Reset hardware & document states
    setMotherboardModel('');
    setMotherboardSerial('');
    setHddModel('');
    setHddSerial('');
    setRamModel('');
    setRamSerial('');
    setCaseModel('');
    setPowerSupplyModel('');
    setPowerSupplySerial('');
    setCpuModel('');
    setCpuSerial('');
    setGpuModel('');
    setGpuSerial('');
    setSerialNumber('');
    setInvoiceInfo('');
    setMemoInfo('');
    setWarrantyInfo('');
    setPdfFiles([]);

    setShowModal(true);
  };

  const handleOpenEdit = (comp: ComputerItem) => {
    setEditingId(comp.id);
    setCategory(comp.category);
    setDeviceType(comp.deviceType || comp.category);
    setModel(comp.model);
    setInventoryNumber(comp.inventoryNumber);
    setEmployeeName(comp.employeeName);
    setStatus(comp.status);
    setObjectName(comp.objectName);
    setLinkedToDeviceId(comp.linkedToDeviceId || 'none');

    // Populate hardware & document states
    setMotherboardModel(comp.motherboardModel || '');
    setMotherboardSerial(comp.motherboardSerial || '');
    setHddModel(comp.hddModel || '');
    setHddSerial(comp.hddSerial || '');
    setRamModel(comp.ramModel || '');
    setRamSerial(comp.ramSerial || '');
    setCaseModel(comp.caseModel || '');
    setPowerSupplyModel(comp.powerSupplyModel || '');
    setPowerSupplySerial(comp.powerSupplySerial || '');
    setCpuModel(comp.cpuModel || '');
    setCpuSerial(comp.cpuSerial || '');
    setGpuModel(comp.gpuModel || '');
    setGpuSerial(comp.gpuSerial || '');
    setSerialNumber(comp.serialNumber || '');
    setInvoiceInfo(comp.invoiceInfo || '');
    setMemoInfo(comp.memoInfo || '');
    setWarrantyInfo(comp.warrantyInfo || '');
    setPdfFiles(comp.pdfFiles || []);
    setCost(comp.cost || 0);

    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedModel = limitEquipmentTitle(model.trim());
    if (!trimmedModel || !inventoryNumber.trim()) return;

    const payload = {
      category,
      deviceType,
      model: trimmedModel,
      inventoryNumber,
      employeeName: category === 'Оргтехника' ? 'Склад ИТ' : employeeName,
      status,
      objectName,
      motherboardModel,
      motherboardSerial,
      hddModel,
      hddSerial,
      ramModel,
      ramSerial,
      caseModel,
      powerSupplyModel,
      powerSupplySerial,
      cpuModel,
      cpuSerial,
      gpuModel,
      gpuSerial,
      serialNumber,
      invoiceInfo,
      memoInfo,
      warrantyInfo,
      pdfFiles,
      linkedToDeviceId: linkedToDeviceId === 'none' ? undefined : linkedToDeviceId,
      cost: Number(cost) || 0,
    };

    const ok = editingId ? onEdit(editingId, payload) : onAdd(payload);
    if (ok !== false) {
      setShowModal(false);
    }
  };

  const handleReturnToWarehouse = (comp: ComputerItem) => {
    if (!onReturnToWarehouse) return;
    if (comp.status === 'На складе' || comp.status === 'Списано') return;
    onReturnToWarehouse(comp.id);
  };

  const categoryOptionsForForm = (() => {
    const base = allowedCategories ?? (['ПК', 'Ноутбук', 'Монитор', 'Периферия', 'Оргтехника', 'Видеонаблюдение', 'Расходники', 'Другое'] as ComputerCategory[]);
    if (editingId && category && !base.includes(category)) {
      return [...base, category];
    }
    return base;
  })();

  const filtered = computers.filter(c => {
    const matchesSearch = c.model.toLowerCase().includes(search.toLowerCase()) || 
                          c.inventoryNumber.toLowerCase().includes(search.toLowerCase()) || 
                          c.employeeName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'Все' || c.status === filterStatus;
    const matchesCategory = filterCategory === 'Все' || c.category === filterCategory;
    const matchesObject = filterObject === 'Все' || c.objectName === filterObject;
    return matchesSearch && matchesStatus && matchesCategory && matchesObject;
  });

  const categoryFilterOptions = (() => {
    const cats =
      allowedCategories ??
      (['ПК', 'Ноутбук', 'Монитор', 'Периферия', 'Оргтехника', 'Видеонаблюдение', 'Расходники', 'Другое'] as ComputerCategory[]);
    return [
      { value: 'Все', label: 'Все категории' },
      ...cats.map((cat) => ({ value: cat, label: getCategoryFilterLabel(cat) })),
    ];
  })();

  const objectFilterOptions = [
    { value: 'Все', label: 'Все объекты' },
    ...objects.map((obj) => ({ value: obj.name, label: obj.name })),
  ];

  return (
    <div className="space-y-6">
      {/* Search and Quick Filters container */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <input
              type="text"
              placeholder={t("Поиск по модели, инвентарному, сотруднику...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          {!isViewer && allowDirectAdd && (
            <button
              onClick={handleOpenAdd}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Plus size={16} />
              {t(addButtonLabel)}
            </button>
          )}
          {!isViewer && !allowDirectAdd && (
            <p className="text-[11px] text-slate-500 max-w-xs text-right leading-snug">
              {t('Оборудование добавляется через «Склад ИТ» → Поступление. После приёмки оно автоматически попадает в нужную группу.')}
            </p>
          )}
        </div>

        {isEquipmentGroup && (
          <EquipmentGroupFilters
            categoryValue={filterCategory}
            onCategoryChange={setFilterCategory}
            categoryOptions={categoryFilterOptions}
            statusValue={filterStatus}
            onStatusChange={setFilterStatus}
            statusOptions={HARDWARE_STATUS_FILTER_OPTIONS}
            objectValue={filterObject}
            onObjectChange={setFilterObject}
            objectOptions={objectFilterOptions}
          />
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400">
                <th className="py-3 px-5 font-semibold text-slate-500">{t("Устройство")}</th>
                <th className="py-3 px-5 font-semibold text-slate-500">{t("Модель")}</th>
                <th className="py-3 px-5 font-semibold text-slate-500">{t("Инв. номер")}</th>
                <th className="py-3 px-5 font-semibold text-slate-500">{t("Сотрудник")}</th>
                <th className="py-3 px-5 font-semibold text-slate-500">{t("Локация / Объект")}</th>
                <th className="py-3 px-5 font-semibold text-slate-500">{t("Стоимость")}</th>
                <th className="py-3 px-5 text-center font-semibold text-slate-500">{t("Статус")}</th>
                <th className="py-3 px-5 text-center font-semibold text-slate-500">{t("Действия")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((c) => {
                let statusClass = '';
                if (c.status === 'В работе') statusClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                else if (c.status === 'На ремонте') statusClass = 'bg-amber-50 text-amber-700 border-amber-250';
                else if (c.status === 'На складе') statusClass = 'bg-blue-50 text-blue-700 border-blue-200';
                else statusClass = 'bg-slate-100 text-slate-650 border-slate-200';

                return (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-medium flex items-center gap-2.5">
                      <span className="p-1.5 bg-blue-50 text-blue-601 rounded-lg">
                        {getDeviceIcon({ category: c.category, deviceType: c.deviceType, model: c.model, size: 16 })}
                      </span>
                      <span 
                        onClick={() => onViewDetails?.('computer', c.id)}
                        className="hover:text-blue-600 hover:underline cursor-pointer font-semibold text-slate-705"
                      >
                        {t(c.deviceType) || t(c.category)}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span 
                        onClick={() => onViewDetails?.('computer', c.id)}
                        className="hover:text-blue-650 hover:underline cursor-pointer font-bold text-slate-800"
                      >
                        {c.model}
                      </span>
                      {c.linkedToDeviceId && (
                        <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-1">
                          <span className="inline-block px-1 bg-slate-100 text-slate-600 rounded text-[10px] font-medium uppercase">
                            {c.category === 'Видеонаблюдение' 
                              ? t("Привязан к Видеорегистратору") 
                              : (c.deviceType === 'Картриджи' || c.category === 'Расходники' 
                                ? t("Привязан к Принтеру") 
                                : t("Привязан к ПК/Ноутбуку"))}:
                          </span>
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewDetails?.('computer', c.linkedToDeviceId!);
                            }}
                            className="text-blue-600 hover:underline hover:text-blue-700 cursor-pointer font-medium"
                          >
                            {((allComputers || computers).find(pc => pc.id === c.linkedToDeviceId)?.model) || t("Неизвестное устройство")}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-slate-400 font-medium">{c.inventoryNumber}</td>
                    <td className="py-3.5 px-5 font-semibold">
                      {c.category === 'Оргтехника' ? (
                        <span className="text-slate-400 font-normal">—</span>
                      ) : (
                        <span 
                          onClick={() => {
                            const emp = employees.find(e => e.name === c.employeeName);
                            if (emp) {
                              onViewDetails?.('employee', emp.id);
                            }
                          }}
                          className="hover:text-blue-600 hover:underline cursor-pointer text-blue-600 font-medium"
                        >
                          {c.employeeName}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <span 
                        onClick={() => {
                          const obj = objects.find(o => o.name === c.objectName);
                          if (obj) {
                            onViewDetails?.('object', obj.id);
                          }
                        }}
                        className="hover:text-indigo-600 hover:underline cursor-pointer font-medium text-slate-500"
                      >
                        {c.objectName}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-xs font-semibold text-slate-705">
                      {c.cost ? `${c.cost.toLocaleString('ru-RU')} ₽` : '—'}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusClass}`}>
                        {t(c.status)}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {!isViewer && (
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-500 transition-colors cursor-pointer"
                            title={t("Редактировать")}
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                        {isEquipmentGroup && !isViewer && onReturnToWarehouse && c.status !== 'На складе' && c.status !== 'Списано' && c.status !== 'На списание' && (
                          <button
                            onClick={() => handleReturnToWarehouse(c)}
                            className="p-1 hover:bg-emerald-50 rounded text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                            title={t("Вернуть на склад")}
                          >
                            <RotateCcw size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">{t("Оборудование не найдено по заданным фильтрам")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal computer form */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[92vh] overflow-y-auto transform transition-all p-6 space-y-4 border border-slate-100">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2">
              <h3 className="font-bold text-lg text-slate-800">
                {editingId ? t('Редактировать параметры устройства') : t(addModalTitle)}
              </h3>
              <ModalCloseButton onClick={() => setShowModal(false)} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* SECTION 1: Base Information */}
              <div className="space-y-3.5">
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider">{t("Основная информация")}</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Группа оборудования")}</label>
                    <select
                      value={category}
                      onChange={(e) => {
                        const newCat = e.target.value as ComputerCategory;
                        setCategory(newCat);
                        const opts = getDeviceTypeOptions(newCat);
                        setDeviceType(opts[0] || 'Другое');
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-semibold"
                    >
                      {categoryOptionsForForm.map((cat) => (
                        <option key={cat} value={cat}>
                          {t(cat)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Тип устройства")}</label>
                    <select
                      value={deviceType}
                      onChange={(e) => setDeviceType(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-semibold"
                    >
                      {(() => {
                        const opts = getDeviceTypeOptions(category);
                        if (deviceType && !opts.includes(deviceType)) {
                          opts.push(deviceType);
                        }
                        return opts.map((opt) => (
                          <option key={opt} value={opt}>
                            {t(opt)}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Инвентарный №")}</label>
                  <input
                    type="text"
                    required
                    placeholder="PC-0001"
                    value={inventoryNumber}
                    onChange={(e) => setInventoryNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-705 font-mono"
                  />
                </div>

                <div className={(deviceType === 'ПК' || category === 'ПК') ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
                  <div className={(deviceType === 'ПК' || category === 'ПК') ? "w-full" : ""}>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                      {(deviceType === 'ПК' || category === 'ПК') 
                        ? t("Номер счета и число") 
                        : (deviceType === 'Картриджи') 
                          ? t("Наименование") 
                          : t("Модель устройства")}
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={EQUIPMENT_TITLE_MAX_LENGTH}
                      placeholder={(deviceType === 'ПК' || category === 'ПК') 
                        ? t("Счет № 4758 от 12.05.2026") 
                        : (deviceType === 'Картриджи') 
                          ? t("Наименование") 
                          : "Dell Latitude 5420 / AMD Ryzen 5, etc"}
                      value={model}
                      onChange={(e) => setModel(limitEquipmentTitle(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-205 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
                    />
                    <span className="text-[10px] text-slate-400">{model.length}/{EQUIPMENT_TITLE_MAX_LENGTH}</span>
                  </div>

                  {!(deviceType === 'ПК' || category === 'ПК') && deviceType !== 'Картриджи' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Серийный номер устройства")}</label>
                      <input
                        type="text"
                        placeholder="S/N: CN-0HG72L-..."
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-205 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-mono"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {category !== 'Оргтехника' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Сотрудник владелец")}</label>
                      <select
                        value={employeeName}
                        onChange={(e) => setEmployeeName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
                      >
                        <option value="Склад ИТ">{t("Склад ИТ (Свободен)")}</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.name}>{emp.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className={category === 'Оргтехника' ? "col-span-2" : ""}>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Филиал / Локация")}</label>
                    <select
                      value={objectName}
                      onChange={(e) => setObjectName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-205 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
                    >
                      {objects.map(obj => (
                        <option key={obj.id} value={obj.name}>{obj.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Статус устройства")}</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as ComputerStatus)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
                    >
                      <option value="В работе">{t("В работе")}</option>
                      <option value="На ремонте">{t("На ремонте")}</option>
                      <option value="На складе">{t("На складе")}</option>
                      <option value="Списано">{t("Списано (Архив)")}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Стоимость (руб.)")}</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={cost || ''}
                      onChange={(e) => setCost(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-mono"
                    />
                  </div>
                </div>

                {category !== 'ПК' && category !== 'Ноутбук' && category !== 'Оргтехника' && deviceType !== 'ПК' && deviceType !== 'Ноутбук' && (
                  (() => {
                    const isVideo = category === 'Видеонаблюдение';
                    if (isVideo) {
                      if (!isVideoCameraDevice({ category, deviceType })) {
                        return null;
                      }
                      return (
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                            {t("Привязать к Видеорегистратору")}
                          </label>
                          <select
                            value={linkedToDeviceId}
                            onChange={(e) => setLinkedToDeviceId(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
                          >
                            <option value="none">{t("Без привязки к устройству")}</option>
                            {(allComputers || computers)
                              .filter((c) => isVideoRecorderDevice(c))
                              .map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.model} ({c.inventoryNumber})
                                </option>
                              ))
                            }
                          </select>
                        </div>
                      );
                    }

                    const isConsumable = deviceType === 'Картриджи' || deviceType === 'Картридж' || deviceType === 'картриджи' || deviceType === 'Расходные материалы для МФУ';
                    if (isConsumable) {
                      return (
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                            {t("Привязать к МФУ")}
                          </label>
                          <select
                            value={linkedToDeviceId}
                            onChange={(e) => setLinkedToDeviceId(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
                          >
                            <option value="none">{t("Без привязки к устройству")}</option>
                            {(allComputers || computers)
                              .filter(c => c.category === 'Оргтехника')
                              .map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.model} ({c.inventoryNumber})
                                </option>
                              ))
                            }
                          </select>
                        </div>
                      );
                    }

                    return (
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                          {t("Привязать к ПК / Ноутбуку")}
                        </label>
                        <select
                          value={linkedToDeviceId}
                          onChange={(e) => setLinkedToDeviceId(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
                        >
                          <option value="none">{t("Без привязки к устройству")}</option>
                          {(allComputers || computers)
                            .filter(c => c.category === 'ПК' || c.category === 'Ноутбук')
                            .map(c => (
                              <option key={c.id} value={c.id}>
                                {c.model} ({c.inventoryNumber})
                              </option>
                            ))
                          }
                        </select>
                      </div>
                    );
                  })()
                )}
              </div>

              {/* SECTION 2: PC Hardware Components (Shown only when category or deviceType is "ПК") */}
              {supportsComputerSpecifications({ category, deviceType }) && (
                <div className="space-y-3.5 pt-4 border-t border-slate-100 bg-slate-50/50 p-4 rounded-2xl">
                  <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                    {deviceType === 'Ноутбук' || category === 'Ноутбук'
                      ? t("Конфигурация ноутбука")
                      : deviceType === 'Сервер'
                        ? t("Конфигурация сервера")
                        : t("Конфигурация комплектующих ПК")}
                  </h4>
                  
                  {/* CPU */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-3 border-b border-slate-100/55">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">{t("Процессор (Модель)")}</label>
                      <input
                        type="text"
                        placeholder="Intel Core i5-12400f"
                        value={cpuModel}
                        onChange={(e) => setCpuModel(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 text-slate-700 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">{t("Процессор (Серийный №)")}</label>
                      <input
                        type="text"
                        placeholder="S/N: ..."
                        value={cpuSerial}
                        onChange={(e) => setCpuSerial(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 text-slate-705 font-mono"
                      />
                    </div>
                  </div>

                  {/* Motherboard */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-3 border-b border-slate-100/55">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">{t("Материнская плата (Модель)")}</label>
                      <input
                        type="text"
                        placeholder="ASUS Prime B660M-A"
                        value={motherboardModel}
                        onChange={(e) => setMotherboardModel(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 text-slate-700 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">{t("Материнская плата (Серийный №)")}</label>
                      <input
                        type="text"
                        placeholder="S/N: ..."
                        value={motherboardSerial}
                        onChange={(e) => setMotherboardSerial(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 text-slate-750 font-mono"
                      />
                    </div>
                  </div>

                  {/* RAM */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-3 border-b border-slate-100/55">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">{t("Оперативная память")}</label>
                      <input
                        type="text"
                        placeholder="Kingston FURY DDR4 16GB (2x8)"
                        value={ramModel}
                        onChange={(e) => setRamModel(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 text-slate-700 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">{t("Оперативная память (Серийный №)")}</label>
                      <input
                        type="text"
                        placeholder="S/N: ..."
                        value={ramSerial}
                        onChange={(e) => setRamSerial(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 text-slate-705 font-mono"
                      />
                    </div>
                  </div>

                  {/* HDD/SSD */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-3 border-b border-slate-100/55">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">{t("Накопитель (SSD / HDD)")}</label>
                      <input
                        type="text"
                        placeholder="Samsung 980 NVMe SSD 500GB"
                        value={hddModel}
                        onChange={(e) => setHddModel(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 text-slate-705 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">{t("Накопитель (Серийный №)")}</label>
                      <input
                        type="text"
                        placeholder="S/N: ..."
                        value={hddSerial}
                        onChange={(e) => setHddSerial(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 text-slate-705 font-mono"
                      />
                    </div>
                  </div>

                  {/* GPU */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-3 border-b border-slate-100/55">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">{t("Видеокарта")}</label>
                      <input
                        type="text"
                        placeholder="NVIDIA GeForce RTX 3060"
                        value={gpuModel}
                        onChange={(e) => setGpuModel(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 text-slate-700 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">{t("Видеокарта (Серийный №)")}</label>
                      <input
                        type="text"
                        placeholder="S/N: ..."
                        value={gpuSerial}
                        onChange={(e) => setGpuSerial(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 text-slate-705 font-mono"
                      />
                    </div>
                  </div>

                  {/* Power Supply */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-3 border-b border-slate-100/55">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">{t("Блок питания")}</label>
                      <input
                        type="text"
                        placeholder="be quiet! System Power 9 600W"
                        value={powerSupplyModel}
                        onChange={(e) => setPowerSupplyModel(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-205 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 text-slate-700 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">{t("Блок питания (Серийный №)")}</label>
                      <input
                        type="text"
                        placeholder="S/N: ..."
                        value={powerSupplySerial}
                        onChange={(e) => setPowerSupplySerial(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 text-slate-705 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">{t("Корпус ПК")}</label>
                    <input
                      type="text"
                      placeholder="Deepcool MATREXX 40"
                      value={caseModel}
                      onChange={(e) => setCaseModel(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 text-slate-700 font-semibold"
                    />
                  </div>
                </div>
              )}

              {/* SECTION 3: Supplementary Documents (Invoice, Internal Memo, and Warranty card) */}
              {true && (
                <div className="space-y-4 pt-4 border-t border-slate-100 bg-slate-50/50 p-4 rounded-2xl">
                  <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{t("Сопроводительные документы")}</h4>
                  
                  {/* Document 1: Invoice */}
                  <div className="space-y-2.5 bg-white p-3 rounded-xl border border-slate-150 shadow-3xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t("Счет (реквизиты, номер, комментарий)")}</label>
                      <input
                        type="text"
                        placeholder={t("Счет № 4758-ИТ от 12.05.2026 на сумму 85 000 руб.")}
                        value={invoiceInfo}
                        onChange={(e) => setInvoiceInfo(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-250 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-700 font-medium"
                      />
                    </div>
                    
                    <div>
                      <span className="block text-[9px] text-slate-400 font-bold uppercase mb-1">{t("Прикрепить оригинал счета (PDF)")}</span>
                      <div className="flex items-center gap-3">
                        <label className="relative flex items-center gap-1.5 bg-slate-100 hover:bg-slate-250/70 border border-slate-250 px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-650 cursor-pointer transition-all">
                          <Upload size={12} className="text-slate-500" />
                          <span>{t("Загрузить PDF")}</span>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => handleFileUpload(e.target.files?.[0] || null, 'Накладные и счета')}
                            className="hidden"
                          />
                        </label>
                        
                        {pdfFiles.filter(f => f.group === 'Накладные и счета').map((file, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-150 text-emerald-800 text-[10px] px-2.5 py-1 rounded-md max-w-[200px] truncate">
                            <FileText size={10} className="shrink-0 text-emerald-600" />
                            <span className="truncate">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => setPdfFiles(prev => prev.filter(f => f.group !== 'Накладные и счета'))}
                              className="text-rose-500 hover:text-rose-700 font-bold ml-1.5 cursor-pointer text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Document 2: Memo */}
                  <div className="space-y-2.5 bg-white p-3 rounded-xl border border-slate-150 shadow-3xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t("Служебная записка (прописать реквизиты)")}</label>
                      <input
                        type="text"
                        placeholder={t("Служебная записка СЗ-88 от ИТ-отдела о выделении рабочего ПК")}
                        value={memoInfo}
                        onChange={(e) => setMemoInfo(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-250 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-700 font-medium"
                      />
                    </div>
                    
                    <div>
                      <span className="block text-[9px] text-slate-400 font-bold uppercase mb-1">{t("Прикрепить служебную записку (PDF)")}</span>
                      <div className="flex items-center gap-3">
                        <label className="relative flex items-center gap-1.5 bg-slate-100 hover:bg-slate-250/70 border border-slate-250 px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-650 cursor-pointer transition-all">
                          <Upload size={12} className="text-slate-500" />
                          <span>{t("Загрузить PDF")}</span>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => handleFileUpload(e.target.files?.[0] || null, 'Служебная записка')}
                            className="hidden"
                          />
                        </label>
                        
                        {pdfFiles.filter(f => f.group === 'Служебная записка').map((file, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-150 text-emerald-800 text-[10px] px-2.5 py-1 rounded-md max-w-[200px] truncate">
                            <FileText size={10} className="shrink-0 text-emerald-600" />
                            <span className="truncate">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => setPdfFiles(prev => prev.filter(f => f.group !== 'Служебная записка'))}
                              className="text-rose-500 hover:text-rose-700 font-bold ml-1.5 cursor-pointer text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Document 3: Warranty Card */}
                  {true && (
                    <div className="space-y-2.5 bg-white p-3 rounded-xl border border-slate-150 shadow-3xs">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t("Гарантийный талон (реквизиты, срок)")}</label>
                        <input
                          type="text"
                          placeholder={t("Гарантия Ситилинк до 12.05.2029 (36 мес)")}
                          value={warrantyInfo}
                          onChange={(e) => setWarrantyInfo(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-250 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-750 font-medium"
                        />
                      </div>
                      
                      <div>
                        <span className="block text-[9px] text-slate-400 font-bold uppercase mb-1">{t("Прикрепить гарантийный талон (PDF)")}</span>
                        <div className="flex items-center gap-3">
                          <label className="relative flex items-center gap-1.5 bg-slate-100 hover:bg-slate-250/70 border border-slate-250 px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-650 cursor-pointer transition-all">
                            <Upload size={12} className="text-slate-500" />
                            <span>{t("Загрузить PDF")}</span>
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={(e) => handleFileUpload(e.target.files?.[0] || null, 'Гарантийные талоны')}
                              className="hidden"
                            />
                          </label>
                          
                          {pdfFiles.filter(f => f.group === 'Гарантийные талоны').map((file, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-150 text-emerald-800 text-[10px] px-2.5 py-1 rounded-md max-w-[200px] truncate">
                              <FileText size={10} className="shrink-0 text-emerald-600" />
                              <span className="truncate">{file.name}</span>
                              <button
                                type="button"
                                onClick={() => setPdfFiles(prev => prev.filter(f => f.group !== 'Гарантийные талоны'))}
                                className="text-rose-500 hover:text-rose-700 font-bold ml-1.5 cursor-pointer text-xs"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-505 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >{t("Отмена")}</button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  {t(editingId ? 'Сохранить изменения' : 'Создать запись')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

