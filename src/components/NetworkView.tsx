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
import { EQUIPMENT_TITLE_MAX_LENGTH, limitEquipmentTitle } from '../utils/equipmentFields';
import { Network, Plus, Search, Trash2, Edit2, ShieldAlert, Upload, FileText } from 'lucide-react';
import { NetworkDevice, NetworkDeviceType, ObjectItem } from '../types';

interface NetworkViewProps {
  networkDevices: NetworkDevice[];
  objects: ObjectItem[];
  onAdd: (device: Omit<NetworkDevice, 'id'>) => void;
  onEdit: (id: string, device: Omit<NetworkDevice, 'id'>) => void;
  onDelete: (id: string) => void;
  onViewDetails?: (type: 'computer' | 'network' | 'employee' | 'object' | 'warehouse', id: string) => void;
  currentUser?: { role: 'Viewer' | 'Editor' | 'Admin' };
  allowDirectAdd?: boolean;
}

export default function NetworkView({
  networkDevices,
  objects,
  onAdd,
  onEdit,
  onDelete,
  onViewDetails,
  currentUser,
  allowDirectAdd = false,
}: NetworkViewProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('Все');
  const [filterObject, setFilterObject] = useState<string>('Все');
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const isViewer = currentUser?.role === 'Viewer';
  const isAdmin = currentUser?.role === 'Admin';

  // Form states
  const [deviceName, setDeviceName] = useState('');
  const [type, setType] = useState<NetworkDeviceType>('Коммутатор');
  const [objectName, setObjectName] = useState(objects[0]?.name || 'Головной офис');
  const [ipAddress, setIpAddress] = useState('');
  const [inventoryNumber, setInventoryNumber] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [portsCount, setPortsCount] = useState<number>(24);
  const [workingPorts, setWorkingPorts] = useState<number[]>([]);
  const [damagedPorts, setDamagedPorts] = useState<number[]>([]);

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
    setDeviceName('');
    setType('Коммутатор');
    setObjectName(objects[0]?.name || 'Головной офис');
    setIpAddress('');
    setInventoryNumber('');
    setQuantity(1);
    setPortsCount(24);
    setWorkingPorts(Array.from({ length: 24 }, (_, i) => i + 1));
    setDamagedPorts([]);
    // Reset document states
    setInvoiceInfo('');
    setMemoInfo('');
    setWarrantyInfo('');
    setPdfFiles([]);
    setCost(0);
    setShowModal(true);
  };

  const handleOpenEdit = (dev: NetworkDevice) => {
    setEditingId(dev.id);
    setDeviceName(dev.deviceName);
    setType(dev.type);
    setObjectName(dev.objectName);
    setIpAddress(dev.ipAddress);
    setInventoryNumber(dev.inventoryNumber || '');
    setQuantity(dev.quantity);
    const pCount = dev.portsCount ?? 24;
    setPortsCount(pCount);
    setWorkingPorts(dev.workingPorts ?? Array.from({ length: pCount }, (_, i) => i + 1));
    setDamagedPorts(dev.damagedPorts ?? []);
    // Populate document states
    setInvoiceInfo(dev.invoiceInfo || '');
    setMemoInfo(dev.memoInfo || '');
    setWarrantyInfo(dev.warrantyInfo || '');
    setPdfFiles(dev.pdfFiles || []);
    setCost(dev.cost || 0);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!limitEquipmentTitle(deviceName.trim()) || !ipAddress.trim() || quantity < 1) return;

    const payload = {
      deviceName: limitEquipmentTitle(deviceName.trim()),
      type,
      objectName,
      ipAddress,
      inventoryNumber,
      quantity,
      portsCount,
      workingPorts,
      damagedPorts,
      invoiceInfo,
      memoInfo,
      warrantyInfo,
      pdfFiles,
      cost: Number(cost) || 0,
    };

    if (editingId) {
      onEdit(editingId, payload);
    } else {
      onAdd(payload);
    }
    setShowModal(false);
  };

  const filtered = networkDevices.filter(dev => {
    const matchesSearch = dev.deviceName.toLowerCase().includes(search.toLowerCase()) || 
                          dev.ipAddress.includes(search);
    const matchesType = filterType === 'Все' || dev.type === filterType;
    const matchesObject = filterObject === 'Все' || dev.objectName === filterObject;
    return matchesSearch && matchesType && matchesObject;
  });

  return (
    <div className="space-y-6">
      {/* Search and Advanced Filters */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <input
              type="text"
              placeholder={t("Поиск по названию или IP-адресу...")}
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
              <Plus size={16} />{t("Добавить сетевое оборудование")}</button>
          )}
          {!isViewer && !allowDirectAdd && (
            <p className="text-[11px] text-slate-500 max-w-xs text-right leading-snug">
              {t('Оборудование добавляется через «Склад ИТ» → Поступление. После приёмки оно автоматически попадает в нужную группу.')}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
          <div>
            <label className="text-[10px] text-slate-400 font-bold block mb-1">{t("Тип устройства")}</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/10 focus:outline-none text-slate-650"
            >
              <option value="Все">{t("Все типы")}</option>
              <option value="Коммутатор">{t("Коммутаторы")}</option>
              <option value="Маршрутизатор">{t("Маршрутизаторы")}</option>
              <option value="Точка доступа">{t("Точки доступа")}</option>
              <option value="Другое">{t("Другое")}</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-bold block mb-1">{t("Локация / Объект")}</label>
            <select
              value={filterObject}
              onChange={(e) => setFilterObject(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/10 focus:outline-none text-slate-650"
            >
              <option value="Все">{t("Все объекты")}</option>
              {objects.map(obj => (
                <option key={obj.id} value={obj.name}>{obj.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Devices Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400">
                <th className="py-3 px-5 font-semibold text-slate-500">{t("Название оборудования")}</th>
                <th className="py-3 px-5 font-semibold text-slate-500">{t("Категория/Тип")}</th>
                <th className="py-3 px-5 font-semibold text-slate-500">{t("Закреплено за объектом")}</th>
                <th className="py-3 px-5 font-semibold text-slate-500">{t("Локальный IP-адрес")}</th>
                <th className="py-3 px-5 font-semibold text-slate-500">{t("Стоимость")}</th>
                <th className="py-3 px-5 text-center font-semibold text-slate-500">{t("Количество (ед.)")}</th>
                <th className="py-3 px-5 text-center font-semibold text-slate-500">{t("Действие")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((dev) => (
                <tr key={dev.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-5 font-medium text-slate-800 flex items-center gap-2.5">
                    <span className="p-1.5 bg-lime-50 text-lime-600 rounded-lg">
                      <Network size={16} />
                    </span>
                    <div className="flex flex-col">
                      <span 
                        onClick={() => onViewDetails?.('network', dev.id)}
                        className="hover:text-blue-600 hover:underline cursor-pointer font-semibold"
                      >
                        {dev.deviceName}
                      </span>
                      {dev.inventoryNumber && (
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5">{dev.inventoryNumber}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-slate-500">{t(dev.type)}</td>
                  <td className="py-3.5 px-5 font-medium text-blue-650">{dev.objectName}</td>
                  <td className="py-3.5 px-5 font-mono text-slate-500 select-all">{dev.ipAddress}</td>
                  <td className="py-3.5 px-5 font-mono text-xs font-semibold text-slate-705">
                    {dev.cost ? `${(dev.cost * dev.quantity).toLocaleString('ru-RU')} ₽` : '—'}
                  </td>
                  <td className="py-3.5 px-5 text-center font-mono font-bold text-slate-800">{dev.quantity}</td>
                  <td className="py-3.5 px-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {!isViewer && (
                        <button
                          onClick={() => handleOpenEdit(dev)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-500 transition-colors cursor-pointer"
                          title={t("Редактировать")}
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => onDelete(dev.id)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                          title={t("Удалить")}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">{t("Устройства не найдены по заданным критериям фильтрации")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit Form */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-100 flex flex-col max-h-[85vh] transform transition-all overflow-hidden">
            <div className="p-6 pb-2 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-lg text-slate-800">
                {editingId ? t("Редактировать сетевое оборудование") : t("Добавить сетевое оборудование")}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 pt-2 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Название устройства")}</label>
                <input
                  type="text"
                  required
                  maxLength={EQUIPMENT_TITLE_MAX_LENGTH}
                  placeholder={t("Например, HPE Aruba 2930F")}
                  value={deviceName}
                  onChange={(e) => setDeviceName(limitEquipmentTitle(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-semibold"
                />
                <span className="text-[10px] text-slate-400">{deviceName.length}/{EQUIPMENT_TITLE_MAX_LENGTH}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Категория/Тип")}</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as NetworkDeviceType)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
                  >
                    <option value="Коммутатор">{t("Коммутатор")}</option>
                    <option value="Маршрутизатор">{t("Маршрутизатор")}</option>
                    <option value="Точка доступа">{t("Точка доступа")}</option>
                    <option value="Другое">{t("Другое")}</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Количество")}</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-semibold"
                    />
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Разместить на объекте")}</label>
                  <select
                    value={objectName}
                    onChange={(e) => setObjectName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-semibold"
                  >
                    {objects.map(obj => (
                      <option key={obj.id} value={obj.name}>{obj.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Локальный IP-адрес")}</label>
                  <input
                    type="text"
                    required
                    placeholder={t("Например, 10.0.1.1")}
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Инвентарный №")}</label>
                <input
                  type="text"
                  placeholder={t("Например, NET-0001")}
                  value={inventoryNumber}
                  onChange={(e) => setInventoryNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-mono focus:bg-white bg-slate-50"
                />
              </div>

              {/* Ports Configuration Section */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-505 uppercase mb-1">{t("Количество сетевых портов")}</label>
                    <select
                      value={[4, 5, 8, 12, 16, 24, 48, 96].includes(portsCount) ? portsCount : 'custom'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val !== 'custom') {
                          const newCount = Number(val);
                          setPortsCount(newCount);
                          setWorkingPorts(prev => {
                            const adjusted = prev.filter(p => p <= newCount);
                            for (let i = 1; i <= newCount; i++) {
                              if (!adjusted.includes(i)) {
                                adjusted.push(i);
                              }
                            }
                            return adjusted.sort((a, b) => a - b);
                          });
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-705 font-medium"
                    >
                      <option value="4">{t("4 порта")}</option>
                      <option value="5">{t("5 портов")}</option>
                      <option value="8">{t("8 портов")}</option>
                      <option value="12">{t("12 портов")}</option>
                      <option value="16">{t("16 портов")}</option>
                      <option value="24">{t("24 порта")}</option>
                      <option value="48">{t("48 портов")}</option>
                      <option value="96">{t("96 портов")}</option>
                      <option value="custom">{t("Другое количество...")}</option>
                    </select>
                  </div>

                  {(![4, 5, 8, 12, 16, 24, 48, 96].includes(portsCount) || portsCount === 0) && (
                    <div className="w-1/3">
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Укажите число")}</label>
                      <input
                        type="number"
                        min={1}
                        max={128}
                        value={portsCount}
                        onChange={(e) => {
                          const val = Math.min(128, Math.max(1, Number(e.target.value)));
                          setPortsCount(val);
                          setWorkingPorts(prev => {
                            const adjusted = prev.filter(p => p <= val);
                            for (let i = 1; i <= val; i++) {
                              if (!adjusted.includes(i) && !damagedPorts.includes(i)) {
                                adjusted.push(i);
                              }
                            }
                            return adjusted.sort((a, b) => a - b);
                          });
                          setDamagedPorts(prev => prev.filter(p => p <= val));
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-medium"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-550 uppercase">{t("Настройка состояния портов")}</span>
                    <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-2">
                      <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-emerald-550 rounded-full inline-block"></span>{t("Включен (зеленый)")}</span>
                      <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-slate-400 rounded-full inline-block"></span>{t("Выключен (серый)")}</span>
                      <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-rose-500 rounded-full inline-block"></span>{t("Поврежден (красный)")}</span>
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-8 gap-1.5 p-2 bg-slate-950 rounded-xl border border-slate-850 max-h-[140px] overflow-y-auto font-mono">
                    {Array.from({ length: portsCount }).map((_, i) => {
                      const portNum = i + 1;
                      const isWorking = workingPorts.includes(portNum);
                      const isDamaged = damagedPorts.includes(portNum);
                      
                      let btnClass = 'bg-slate-900 border-slate-750 text-slate-450';
                      let labelColor = 'text-slate-500';
                      let titleText = `$Порт ${portNum}: $Выключен / Отключен`;
                      
                      if (isWorking) {
                        btnClass = 'bg-emerald-950/80 border-emerald-520 text-emerald-400 font-bold shadow-[0_0_5px_rgba(16,185,129,0.15)]';
                        labelColor = 'text-emerald-400';
                        titleText = `$Порт ${portNum}: $Включен / Работает`;
                      } else if (isDamaged) {
                        btnClass = 'bg-rose-950/80 border-rose-520 text-rose-450 font-bold shadow-[0_0_5px_rgba(239,68,68,0.15)]';
                        labelColor = 'text-rose-400';
                        titleText = `$Порт ${portNum}: $Поврежден`;
                      }

                      return (
                        <button
                          key={portNum}
                          type="button"
                          onClick={() => {
                            if (isWorking) {
                              setWorkingPorts(prev => prev.filter(p => p !== portNum));
                              setDamagedPorts(prev => prev.filter(p => p !== portNum));
                            } else if (isDamaged) {
                              setWorkingPorts(prev => [...prev, portNum].sort((a, b) => a - b));
                              setDamagedPorts(prev => prev.filter(p => p !== portNum));
                            } else {
                              setWorkingPorts(prev => prev.filter(p => p !== portNum));
                              setDamagedPorts(prev => [...prev, portNum].sort((a, b) => a - b));
                            }
                          }}
                          className={`flex flex-col items-center p-1 rounded-sm border transition-all cursor-pointer ${btnClass}`}
                          title={titleText}
                        >
                          <span className="text-[8px] text-slate-400 font-bold mb-0.5">{portNum}</span>
                          <span className={`text-[10px] leading-none ${labelColor}`}>
                            ●
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SECTION 3: Supplementary Documents (Invoice, Internal Memo, and Warranty card) */}
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
                <div className="space-y-2.5 bg-white p-3 rounded-xl border border-slate-150 shadow-3xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t("Гарантийный талон (реквизиты, срок)")}</label>
                    <input
                      type="text"
                      placeholder={t("Гарантия Ситилинк до 12.05.2029 (36 мес)")}
                      value={warrantyInfo}
                      onChange={(e) => setWarrantyInfo(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-250 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-700 font-medium"
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
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-205 text-slate-500 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >{t("Отмена")}</button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                >
                  {editingId ? t("Сохранить изменения") : t("Создать устройство")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
