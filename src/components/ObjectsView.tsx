/*
 * COPYRIGHT NOTICE | УВЕДОМЛЕНИЕ ОБ АВТОРСКИХ ПРАВАХ | 版权声明
 * © 2026 Utkin Vladislav Vyacheslavovich (Уткин Владислав Вячеславович)
 * Email: assetorbit@icloud.com | Telegram: https://t.me/Dexterll
 * All rights reserved. Unauthorized copying, modification, distribution or commercial use is prohibited.
 * 保留所有权利。未经版权所有者事先书面同意，禁止复制、修改、分发或商业使用。
 * Все права защищены. Копирование, изменение, распространение и коммерческое использование без письменного согласия правообладателя запрещено.
 */
import React, { useState, useRef } from 'react';
import { 
  Building2, 
  MapPin, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Network, 
  Laptop,
  Server,
  Wifi,
  Shield,
  Globe,
  User,
  Warehouse,
  Upload,
  Lock,
  Video
} from 'lucide-react';
import { ObjectItem, NetworkDevice, ComputerItem, SystemUser } from '../types';
import { useTranslation } from '../utils/i18n';

interface ObjectsViewProps {
  objects: ObjectItem[];
  networkDevices: NetworkDevice[];
  computers: ComputerItem[];
  onAdd: (name: string, address: string, iconName?: string) => void;
  onEdit: (id: string, name: string, address: string, iconName?: string) => void;
  onDelete: (id: string) => void;
  onViewDetails?: (type: 'computer' | 'network' | 'employee' | 'object' | 'warehouse', id: string) => void;
  currentUser?: SystemUser;
}

export const renderLocationIcon = (iconName?: string, size = 12) => {
  if (!iconName) return <Building2 size={size} />;
  if (iconName.startsWith('data:image/')) {
    return <img src={iconName} style={{ width: `${size}px`, height: `${size}px` }} className="object-contain" referrerPolicy="no-referrer" />;
  }
  switch (iconName) {
    case 'Warehouse': return <Warehouse size={size} />;
    case 'Server': return <Server size={size} />;
    case 'Wifi': return <Wifi size={size} />;
    case 'Laptop': return <Laptop size={size} />;
    case 'Shield': return <Shield size={size} />;
    case 'Globe': return <Globe size={size} />;
    case 'User': return <User size={size} />;
    default: return <Building2 size={size} />;
  }
};

const DEFAULT_IMAGES = {
  office: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80',
  warehouse: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80',
  datacenter: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&w=400&q=80',
};

export default function ObjectsView({
  objects,
  networkDevices,
  computers,
  onAdd,
  onEdit,
  onDelete,
  onViewDetails,
  currentUser,
}: ObjectsViewProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [iconName, setIconName] = useState('Building2');
  
  const iconUploadRef = useRef<HTMLInputElement>(null);

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setAddress('');
    setIconName('Building2');
    setShowModal(true);
  };

  const handleOpenEdit = (obj: ObjectItem) => {
    setEditingId(obj.id);
    setName(obj.name);
    setAddress(obj.address);
    setIconName(obj.iconName || 'Building2');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;
    
    if (editingId) {
      onEdit(editingId, name, address, iconName);
    } else {
      onAdd(name, address, iconName);
    }
    setShowModal(false);
  };

  const handleCustomIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setIconName(reader.result as string); // base64 representation
    };
    reader.readAsDataURL(file);
  };

  const filtered = objects.filter(
    o => o.name.toLowerCase().includes(search.toLowerCase()) || 
         o.address.toLowerCase().includes(search.toLowerCase())
  );

  const isViewer = currentUser?.role === 'Viewer';

  return (
    <div className="space-y-6">
      {/* Role-spec Warning Box */}
      {isViewer && (
        <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl text-amber-800 text-xs font-semibold flex items-center gap-2.5 shadow-2xs">
          <Lock size={14} className="text-amber-500 animate-pulse" />
          <span>{t("Режим просмотра: Добавление, редактирование объектов и загрузка своих иконок ограничены.")}</span>
        </div>
      )}

      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            placeholder={t("Поиск объектов...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        
        {!isViewer && (
          <button
            onClick={handleOpenAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Plus size={16} />{t("Добавить объект")}</button>
        )}
      </div>

      {/* Grid of location cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((obj) => {
          const locationNet = networkDevices.filter(n => n.objectName === obj.name);
          const locationPCAll = computers.filter(c => c.objectName === obj.name);
          const locationPC = locationPCAll.filter(c => c.category !== 'Видеонаблюдение');
          const locationCCTV = locationPCAll.filter(c => c.category === 'Видеонаблюдение');
          const totalNetDevices = locationNet.reduce((sum, d) => sum + d.quantity, 0);

          const getCardCoverUrl = () => {
            if (obj.photoUrl) return obj.photoUrl;
            if (obj.name.toLowerCase().includes('склад')) return DEFAULT_IMAGES.warehouse;
            if (obj.name.toLowerCase().includes('цод')) return DEFAULT_IMAGES.datacenter;
            return DEFAULT_IMAGES.office;
          };

          return (
            <div key={obj.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all relative overflow-hidden group flex flex-col justify-between">
              
              {/* Cover Banner */}
              <div 
                onClick={() => onViewDetails?.('object', obj.id)}
                className="h-28 relative overflow-hidden cursor-pointer w-full bg-slate-100"
              >
                <img 
                  src={getCardCoverUrl()} 
                  alt={obj.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
                <span className="absolute bottom-3 left-4 text-white font-bold text-base leading-tight tracking-tight shadow-text">
                  {obj.name}
                </span>
                <span className="absolute top-3 left-3 px-2 py-0.5 bg-white/90 text-slate-800 text-[10px] font-bold rounded-md flex items-center gap-1">
                  {renderLocationIcon(obj.iconName, 10)}
                  Филиал
                </span>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="relative z-10 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-1.5">
                    <p className="text-slate-500 text-xs flex items-center gap-1 truncate max-w-[180px]">
                      <MapPin size={12} className="text-slate-400" />
                      {obj.address}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      {!isViewer && (
                        <button
                          onClick={() => handleOpenEdit(obj)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-500 transition-colors cursor-pointer"
                          title={t("Редактировать параметры")}
                        >
                          <Edit2 size={13} />
                        </button>
                      )}
                      {currentUser?.role === 'Admin' && (
                        <button
                          onClick={() => onDelete(obj.id)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                          title={t("Удалить объект")}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                  <div 
                    onClick={() => onViewDetails?.('object', obj.id)}
                    className="bg-slate-50 hover:bg-slate-100/50 p-2 rounded-xl text-center cursor-pointer transition-colors flex flex-col justify-between"
                  >
                    <span className="text-[9px] text-slate-400 font-bold block uppercase leading-tight truncate" title={t("Сетевых систем")}>{t("Сетевых систем")}</span>
                    <strong className="text-slate-700 font-mono text-base flex items-center justify-center gap-1 mt-0.5">
                      <Network size={12} className="text-[#84cc16] shrink-0" />
                      {totalNetDevices}
                    </strong>
                  </div>
                  <div 
                    onClick={() => onViewDetails?.('object', obj.id)}
                    className="bg-slate-50 hover:bg-slate-100/50 p-2 rounded-xl text-center cursor-pointer transition-colors flex flex-col justify-between"
                  >
                    <span className="text-[9px] text-slate-400 font-bold block uppercase leading-tight truncate" title={t("Компьютеров")}>{t("Компьютеров")}</span>
                    <strong className="text-slate-700 font-mono text-base flex items-center justify-center gap-1 mt-0.5">
                      <Laptop size={12} className="text-blue-500 shrink-0" />
                      {locationPC.length}
                    </strong>
                  </div>
                  <div 
                    onClick={() => onViewDetails?.('object', obj.id)}
                    className="bg-slate-50 hover:bg-slate-100/50 p-2 rounded-xl text-center cursor-pointer transition-colors flex flex-col justify-between"
                  >
                    <span className="text-[9px] text-slate-400 font-bold block uppercase leading-tight truncate" title={t("Видеонаблюдение")}>{t("Видеонаблюдение")}</span>
                    <strong className="text-slate-700 font-mono text-base flex items-center justify-center gap-1 mt-0.5">
                      <Video size={12} className="text-indigo-500 shrink-0" />
                      {locationCCTV.length}
                    </strong>
                  </div>
                </div>

                <button
                  onClick={() => onViewDetails?.('object', obj.id)}
                  className="w-full text-center py-2 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer border border-transparent hover:border-blue-100"
                >{t("Посмотреть подробный паспорт →")}</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add/Edit Object */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all p-6 space-y-4 border border-slate-100">
            <h3 className="font-bold text-lg text-slate-800">
              {editingId ? t('Редактировать локацию/объект') : t('Добавить объект')}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t('Название объекта')}</label>
                <input
                  type="text"
                  required
                  placeholder={t('Например, Офис на Мира')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t('Физический адрес')}</label>
                <input
                   type="text"
                   required
                   placeholder={t('г. Москва, ул. Примерная, д. 10')}
                   value={address}
                   onChange={(e) => setAddress(e.target.value)}
                   className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t('Иконка или Свой Логотип')}</label>
                <div className="grid grid-cols-4 gap-2 mb-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
                  {[
                    { id: 'Building2', label: t('Офис') },
                    { id: 'Warehouse', label: t('Склад') },
                    { id: 'Server', label: t('ЦОД') },
                    { id: 'Wifi', label: t('Сеть') },
                    { id: 'Laptop', label: t('Зона ПК') },
                    { id: 'Shield', label: t('Защита') },
                    { id: 'Globe', label: t('Филиал') },
                    { id: 'User', label: t('Персона') }
                  ].map((ic) => (
                    <button
                      key={ic.id}
                      type="button"
                      onClick={() => setIconName(ic.id)}
                      className={`py-1.5 px-1 rounded-lg flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                        iconName === ic.id 
                          ? 'bg-blue-50 border-blue-200 text-blue-600 font-bold' 
                          : 'bg-white border-slate-100 text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {renderLocationIcon(ic.id, 16)}
                      <span className="text-[9px] scale-90">{ic.label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="w-9 h-9 bg-white border border-slate-150 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                    {renderLocationIcon(iconName, 20)}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-700 block">{t('Загрузить свой значок')}</span>
                    <span className="text-[9px] text-slate-400 block">{t('SVG, PNG, JPG (квадратный)')}</span>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => iconUploadRef.current?.click()}
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                    >
                      <Upload size={10} />
                      {t('Обзоры')}
                    </button>
                    <input
                      type="file"
                      ref={iconUploadRef}
                      onChange={handleCustomIconUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {t('Отмена')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                >
                  {editingId ? t('Сохранить изменения') : t('Создать объект')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
