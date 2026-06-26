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
import { useTranslation } from '../utils/i18n';
import { interpolate } from '../utils/localeRuntime';
import { Users, Plus, Search, Trash2, Edit2, ShieldAlert, Laptop, Briefcase, Mail, Phone, ArrowLeftRight, Check, X, MapPin, Building2 } from 'lucide-react';
import { EmployeeItem, ComputerItem, EmployeeStatus, ObjectItem } from '../types';
import ModalCloseButton from './ModalCloseButton';
import ConfirmDeleteModal from './ConfirmDeleteModal';

interface EmployeesViewProps {
  employees: EmployeeItem[];
  computers: ComputerItem[];
  objects?: ObjectItem[];
  onAdd: (name: string, position: string, department: string, status: EmployeeStatus, objectName?: string, email?: string, phone?: string) => void;
  onEdit: (id: string, name: string, position: string, department: string, status: EmployeeStatus, objectName?: string, email?: string, phone?: string) => void;
  onDelete: (id: string) => void;
  onArchive?: (id: string, isArchived: boolean) => void;
  onViewDetails?: (type: 'computer' | 'network' | 'employee' | 'object' | 'warehouse', id: string) => void;
  currentUser?: { role: 'Viewer' | 'Editor' | 'Admin' };
  onTransferEquipment?: (sourceEmployeeName: string, targetEmployeeName: string) => void;
}

export default function EmployeesView({
  employees,
  computers,
  objects = [],
  onAdd,
  onEdit,
  onDelete,
  onArchive,
  onViewDetails,
  currentUser,
  onTransferEquipment,
}: EmployeesViewProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('Все отделы');
  const [selectedObjectFilter, setSelectedObjectFilter] = useState<string>('Все объекты');

  const [customDepts, setCustomDepts] = useState<string[]>(() => {
    const saved = localStorage.getItem('it_custom_departments');
    return saved ? JSON.parse(saved) : [];
  });
  const [removedDepts, setRemovedDepts] = useState<string[]>(() => {
    const saved = localStorage.getItem('it_removed_departments');
    return saved ? JSON.parse(saved) : [];
  });
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');

  const isViewer = currentUser?.role === 'Viewer';
  const isAdmin = currentUser?.role === 'Admin';

  // Form states
  const [name, setName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<EmployeeItem | null>(null);
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('IT');
  const [status, setStatus] = useState<EmployeeStatus>('Работает');
  const [objectName, setObjectName] = useState('Без привязки');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Transfer states
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferSourceEmp, setTransferSourceEmp] = useState<EmployeeItem | null>(null);
  const [transferTargetId, setTransferTargetId] = useState<string>('');

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setPosition('');
    setDepartment('IT');
    setStatus('Работает');
    setObjectName('Без привязки');
    setEmail('');
    setPhone('');
    setShowModal(true);
  };

  const handleOpenEdit = (emp: EmployeeItem) => {
    setEditingId(emp.id);
    setName(emp.name);
    setPosition(emp.position);
    setDepartment(emp.department);
    setStatus(emp.status || 'Работает');
    setObjectName(emp.objectName || 'Без привязки');
    setEmail(emp.email || '');
    setPhone(emp.phone || '');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !position.trim()) return;

    const finalObjectName = objectName === 'Без привязки' ? undefined : objectName;
    if (editingId) {
      onEdit(editingId, name, position, department, status, finalObjectName, email, phone);
    } else {
      onAdd(name, position, department, status, finalObjectName, email, phone);
    }
    setShowModal(false);
  };

  const handleOpenTransfer = (emp: EmployeeItem) => {
    setTransferSourceEmp(emp);
    setTransferTargetId('');
    setShowTransferModal(true);
  };

  const handleConfirmTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferSourceEmp || !transferTargetId) return;

    if (transferTargetId === 'warehouse') {
      if (onTransferEquipment) {
        onTransferEquipment(transferSourceEmp.name, 'Склад ИТ');
      }
    } else {
      const targetEmp = employees.find(emp => emp.id === transferTargetId);
      if (!targetEmp) return;

      if (onTransferEquipment) {
        onTransferEquipment(transferSourceEmp.name, targetEmp.name);
      }
    }
    setShowTransferModal(false);
    setTransferSourceEmp(null);
    setTransferTargetId('');
  };

  const DEFAULT_DEPARTMENTS = [
    'IT',
    'Продажи',
    'Разработка',
    'Бухгалтерия',
    'Маркетинг',
    'Дизайн',
    'Тестирование',
    'Руководство'
  ];

  const allDepartments = Array.from(
    new Set([
      ...DEFAULT_DEPARTMENTS,
      ...customDepts,
      ...employees.map((e) => e.department).filter(Boolean),
    ])
  ).filter((dept) => !removedDepts.includes(dept));

  // List of unique departments for the dropdown filter
  const departmentsList = ['Все отделы', ...allDepartments];

  const persistDepartments = (custom: string[], removed: string[]) => {
    localStorage.setItem('it_custom_departments', JSON.stringify(custom));
    localStorage.setItem('it_removed_departments', JSON.stringify(removed));
  };

  const handleAddDepartment = (deptName: string) => {
    const trimmed = deptName.trim();
    if (!trimmed) return;
    const nextRemoved = removedDepts.filter((d) => d !== trimmed);
    let nextCustom = customDepts;
    if (!customDepts.includes(trimmed) && !DEFAULT_DEPARTMENTS.includes(trimmed)) {
      nextCustom = [...customDepts, trimmed];
      setCustomDepts(nextCustom);
    }
    if (nextRemoved.length !== removedDepts.length) {
      setRemovedDepts(nextRemoved);
    }
    persistDepartments(nextCustom, nextRemoved);
    setDepartment(trimmed);
    setNewDeptName('');
  };

  const handleDeleteDepartment = (deptName: string) => {
    const assignedCount = employees.filter((e) => e.department === deptName).length;
    if (assignedCount > 0) {
      alert(
        interpolate(t('Нельзя удалить отдел «{name}»: к нему привязано сотрудников: {count}.'), {
          name: deptName,
          count: String(assignedCount),
        })
      );
      return;
    }
    const nextCustom = customDepts.filter((d) => d !== deptName);
    const nextRemoved = removedDepts.includes(deptName)
      ? removedDepts
      : [...removedDepts, deptName];
    setCustomDepts(nextCustom);
    setRemovedDepts(nextRemoved);
    persistDepartments(nextCustom, nextRemoved);
    if (selectedDepartment === deptName) setSelectedDepartment('Все отделы');
    if (department === deptName) setDepartment(allDepartments[0] || 'IT');
  };

  const filtered = employees.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) || 
         e.position.toLowerCase().includes(search.toLowerCase()) || 
         e.department.toLowerCase().includes(search.toLowerCase()) ||
         (e.email && e.email.toLowerCase().includes(search.toLowerCase())) ||
         (e.phone && e.phone.toLowerCase().includes(search.toLowerCase()));
    const matchesDept = selectedDepartment === 'Все отделы' || e.department === selectedDepartment;
    const matchesObj = selectedObjectFilter === 'Все объекты' 
      ? true 
      : selectedObjectFilter === 'Без привязки' 
        ? !e.objectName 
        : e.objectName === selectedObjectFilter;
    const matchesArchive = showArchived ? true : !e.isArchived;
    return matchesSearch && matchesDept && matchesObj && matchesArchive;
  });

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm font-sans">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full max-w-3xl">
          <div className="relative flex-1 min-w-[180px]">
            <input
              type="text"
              placeholder={t("Поиск сотрудников...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 select-none">{t("Отдел:")}</span>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-w-[110px]"
            >
              {departmentsList.map(dept => (
                <option key={dept} value={dept}>{t(dept)}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 select-none">{t("Объект:")}</span>
            <select
              value={selectedObjectFilter}
              onChange={(e) => setSelectedObjectFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-w-[120px]"
            >
              {['Все объекты', 'Без привязки', ...objects.map(o => o.name)].map(objName => (
                <option key={objName} value={objName}>
                  {objName === 'Все объекты' ? t('Все объекты') : objName === 'Без привязки' ? t('Без привязки') : objName}
                </option>
              ))}
            </select>
          </div>
        </div>
        {!isViewer && (
          <div className="flex items-center gap-2 shrink-0">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 cursor-pointer mr-2">
              <input 
                type="checkbox" 
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              {t('Показать архив')}
            </label>
            <button
              onClick={() => {
                setNewDeptName('');
                setShowDeptModal(true);
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2 px-3 border border-slate-200 bg-white/70 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
              title={t("Управление отделами")}
            >
              <Briefcase size={14} className="text-slate-500" />{t("Отделы")}
            </button>
            <button
              onClick={handleOpenAdd}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Plus size={16} />{t("Добавить сотрудника")}
            </button>
          </div>
        )}
      </div>

      {/* Grid of employees cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((emp) => {
          const empHardware = computers.filter(
            c =>
              c.employeeName === emp.name &&
              c.status !== 'На складе' &&
              c.status !== 'Списано'
          );

          const getStatusBadge = (status: EmployeeStatus | undefined) => {
            const currentStatus = status || 'Работает';
            switch (currentStatus) {
              case 'Работает':
                return (
                  <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider shrink-0 select-none">{t("Работает")}</span>
                );
              case 'Уволен':
                return (
                  <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-rose-50 text-rose-600 border border-rose-100 uppercase tracking-wider shrink-0 select-none">{t("Уволен")}</span>
                );
              case 'В отпуске':
                return (
                  <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wider shrink-0 select-none">{t("В отпуске")}</span>
                );
              case 'На удаленном рабочем месте':
                return (
                  <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider shrink-0 select-none">{t("Удаленка")}</span>
                );
              default:
                return (
                  <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider shrink-0 select-none">{t("Работает")}</span>
                );
            }
          };

          return (
            <div key={emp.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 hover:shadow-md hover:border-slate-200 transition-all relative overflow-hidden group">
              <div className="flex items-start justify-between">
                <div 
                  onClick={() => onViewDetails?.('employee', emp.id)}
                  className="flex items-center gap-3 cursor-pointer group/name grow"
                >
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm border border-blue-100 shrink-0 overflow-hidden select-none">
                    {emp.photoUrl ? (
                      <img src={emp.photoUrl} alt={emp.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      emp.name.split(' ').map(n => n[0]).join('')
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-850 text-base leading-tight group-hover/name:text-blue-600 group-hover/name:underline decoration-blue-500 truncate">
                      {emp.name}
                    </h3>
                    <p className="text-slate-400 text-xs mt-1 flex items-center gap-1 truncate mb-1">
                      <Briefcase size={12} className="shrink-0" />
                      {emp.position}
                    </p>
                    <div className="mt-1 flex">
                      {getStatusBadge(emp.status)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {!isViewer && (
                    <button
                      onClick={() => handleOpenEdit(emp)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-500 transition-colors cursor-pointer"
                      title={t("Редактировать сотрудника")}
                    >
                      <Edit2 size={13} />
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => setDeleteTarget(emp)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                      title={t("Удалить сотрудника")}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                  {!isViewer && onArchive && (
                    <button
                      onClick={() => onArchive(emp.id, !emp.isArchived)}
                      className={`p-1 hover:bg-slate-100 rounded transition-colors cursor-pointer ${emp.isArchived ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'}`}
                      title={emp.isArchived ? t("Разархивировать") : t("В архив")}
                    >
                      <span className="text-[10px] font-bold">{emp.isArchived ? '🗃️' : '📁'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Department badge & email & phone details */}
              <div className="space-y-1.5 py-2.5 border-y border-slate-50 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-600">{emp.department}</span>
                  <span className="text-slate-600 flex items-center gap-1 font-mono">
                    <Mail size={12} className="text-slate-450" />
                    {emp.email || <span className="text-slate-350 italic">{t("не указана")}</span>}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="text-slate-400 font-medium">{t("Телефон:")}</span>
                  <span className="text-slate-600 flex items-center gap-1 font-mono font-semibold">
                    <Phone size={11} className="text-slate-400" />
                    {emp.phone || <span className="text-slate-350 italic font-normal">{t("не указан")}</span>}
                  </span>
                </div>
              </div>

              {/* Attached Location / Object */}
              <div className="flex items-center justify-between text-xs py-0.5 text-slate-500">
                <span className="text-slate-450 flex items-center gap-1 font-medium font-sans">
                  <Building2 size={12} className="text-slate-400" />{t("Закрепленный объект:")}</span>
                {emp.objectName ? (
                  <span 
                    className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-0.5"
                    onClick={() => {
                      const obj = objects.find(o => o.name === emp.objectName);
                      if (obj && onViewDetails) onViewDetails('object', obj.id);
                    }}
                  >
                    <MapPin size={11} className="text-blue-500 shrink-0" />
                    {emp.objectName}
                  </span>
                ) : (
                  <span className="text-slate-400 italic">{t("Не привязан")}</span>
                )}
              </div>

              {/* Hardware assigned details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Закрепленное оборудование ({empHardware.length})</span>
                  {empHardware.length > 0 && !isViewer && (
                    <button
                      onClick={() => handleOpenTransfer(emp)}
                      className="text-blue-600 hover:text-blue-700 text-[10px] font-bold flex items-center gap-1 hover:underline transition-all cursor-pointer bg-blue-50/50 hover:bg-blue-50 px-2 py-0.5 rounded border border-blue-100"
                      title={t("Переместить все закрепленное оборудование на другого сотрудника")}
                    >
                      <ArrowLeftRight size={10} />{t("Передать всё")}</button>
                  )}
                </div>
                {empHardware.length === 0 ? (
                  <p className="text-slate-400 text-xs italic">{t("Оборудование не закреплено")}</p>
                ) : (
                  <div className="space-y-1">
                    {empHardware.map((hw) => (
                      <div 
                        key={hw.id} 
                        onClick={() => onViewDetails?.('computer', hw.id)}
                        className="bg-slate-50 hover:bg-blue-50/50 cursor-pointer transition-colors px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-slate-705 truncate max-w-[200px] flex items-center gap-1.5">
                          <Laptop size={12} className="text-blue-500 shrink-0" />
                          {hw.model}
                        </span>
                        <code className="text-[10px] text-slate-400 select-all font-mono font-semibold">{hw.inventoryNumber}</code>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add/Edit Employee */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all p-6 space-y-4 border border-slate-100">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-bold text-lg text-slate-800">
                {editingId ? t('Редактировать сотрудника') : t('Добавить сотрудника')}
              </h3>
              <ModalCloseButton onClick={() => setShowModal(false)} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("ФИО Сотрудника")}</label>
                <input
                  type="text"
                  required
                  placeholder={t("Например, Смирнов А.Д.")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Должность")}</label>
                <input
                  type="text"
                  required
                  placeholder={t("Например, Ведущий разработчик")}
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-500 uppercase">{t("Департамент / Отдел")}</label>
                  <button
                    type="button"
                    onClick={() => {
                      setNewDeptName('');
                      setShowDeptModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-700 text-xs font-semibold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Plus size={12} />{t("Новый отдел")}</button>
                </div>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-medium"
                >
                  {allDepartments.map(dept => (
                    <option key={dept} value={dept}>{t(dept)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Статус сотрудника")}</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as EmployeeStatus)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
                >
                  <option value="Работает">{t("Работает")}</option>
                  <option value="Уволен">{t("Уволен")}</option>
                  <option value="В отпуске">{t("В отпуске")}</option>
                  <option value="На удаленном рабочем месте">{t("На удаленном рабочем месте")}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Привязать к объекту / подразделению")}</label>
                <select
                  value={objectName}
                  onChange={(e) => setObjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-medium"
                >
                  <option value="Без привязки">{t("Без привязки")}</option>
                  {objects.map(obj => (
                    <option key={obj.id} value={obj.name}>{obj.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Эл. почта")}</label>
                  <input
                    type="email"
                    placeholder="mail@it-dep.ru"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-705 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Телефон")}</label>
                  <input
                    type="text"
                    placeholder="+7 (999) 000-00-00"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-705 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >{t("Отмена")}</button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                >
                  {editingId ? t('Сохранить изменения') : t('Добавить сотрудника')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Manage departments */}
      {showDeptModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all p-6 space-y-4 border border-slate-100 animate-fade-in animate-duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-2 shrink-0">
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-1.5">
                <Briefcase className="text-blue-600" size={18} />{t("Управление отделами")}
              </h3>
              <button
                onClick={() => setShowDeptModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddDepartment(newDeptName);
              }}
              className="space-y-3 shrink-0"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Название отдела / департамента")}</label>
                <input
                  type="text"
                  required
                  placeholder={t("Например, Отдел логистики, HR-служба")}
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >{t("Закрыть")}</button>
                <button
                  type="submit"
                  disabled={!newDeptName.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors shadow-sm cursor-pointer flex items-center gap-1"
                >
                  <Plus size={14} />{t("Создать отдел")}
                </button>
              </div>
            </form>

            <div className="border-t border-slate-100 pt-3 flex-1 min-h-0 flex flex-col">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">{t("Список отделов")}</p>
              <div className="space-y-1.5 overflow-y-auto max-h-56 pr-1">
                {allDepartments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">{t("Отделы не созданы")}</p>
                ) : (
                  allDepartments.map((dept) => {
                    const assignedCount = employees.filter((e) => e.department === dept).length;
                    return (
                      <div
                        key={dept}
                        className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-slate-100 bg-slate-50/80"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{dept}</p>
                          <p className="text-[10px] text-slate-500">
                            {interpolate(t('Сотрудников: {count}'), { count: String(assignedCount) })}
                          </p>
                        </div>
                        {!isViewer && (
                          <button
                            type="button"
                            onClick={() => handleDeleteDepartment(dept)}
                            disabled={assignedCount > 0}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                            title={
                              assignedCount > 0
                                ? interpolate(t('Нельзя удалить: привязано сотрудников — {count}'), {
                                    count: String(assignedCount),
                                  })
                                : t('Удалить отдел')
                            }
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Transfer Equipment to another employee */}
      {showTransferModal && transferSourceEmp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all p-6 space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-1.5">
                <ArrowLeftRight className="text-blue-500" size={18} />{t("Передача оборудования")}</h3>
              <button 
                onClick={() => { setShowTransferModal(false); setTransferSourceEmp(null); }} 
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmTransfer} className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-800 space-y-1 border border-blue-100">
                <p>
                  {transferTargetId === 'warehouse' ? (
                    <span>Все закрепленные устройства ({computers.filter(c => c.employeeName === transferSourceEmp.name && c.status !== 'На складе' && c.status !== 'Списано').length} шт.) сотрудника <strong className="text-blue-900">"{transferSourceEmp.name}"</strong>{t("будут перенесены на")}<strong>{t("Склад ИТ")}</strong>{t(", а статус устройств изменится на")}<strong>"На складе"</strong>.</span>
                  ) : (
                    <span>Все закрепленные устройства ({computers.filter(c => c.employeeName === transferSourceEmp.name).length} шт.) сотрудника <strong className="text-blue-900">"{transferSourceEmp.name}"</strong>{t("будут перемещены на выбранного сотрудника.")}</span>
                  )}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Выберите получателя оборудования")}</label>
                <select
                  required
                  value={transferTargetId}
                  onChange={(e) => setTransferTargetId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-medium"
                >
                  <option value="">{t("-- Выберите получателя / Склад --")}</option>
                  <option value="warehouse" className="font-bold text-blue-600">{t("📦 Сдать ВСЕ на Склад ИТ (в запас)")}</option>
                  {employees
                    .filter(emp => emp.id !== transferSourceEmp.id)
                    .map(emp => (
                      <option key={emp.id} value={emp.id}>
                        👤 {emp.name} ({emp.position} - {emp.department})
                      </option>
                    ))
                  }
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowTransferModal(false); setTransferSourceEmp(null); }}
                  className="px-4 py-2 border border-slate-200 text-slate-500 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >{t("Отмена")}</button>
                <button
                  type="submit"
                  disabled={!transferTargetId}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
                >{t("Подтвердить перенос")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        preview={
          deleteTarget
            ? {
                title: 'Удаление сотрудника',
                subtitle: 'Профиль сотрудника будет удалён из системы. Это действие необратимо.',
                itemName: deleteTarget.name,
                detailLabel: 'Должность',
                detailValue: deleteTarget.position,
                cascadeLines: [],
                confirmLabel: 'Удалить',
              }
            : null
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDelete(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}
