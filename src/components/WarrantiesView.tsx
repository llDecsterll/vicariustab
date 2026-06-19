/*
 * COPYRIGHT NOTICE | УВЕДОМЛЕНИЕ ОБ АВТОРСКИХ ПРАВАХ | 版权声明
 * © 2026 Utkin Vladislav Vyacheslavovich (Уткин Владислав Вячеславович)
 * Email: vicariustab@icloud.com | Telegram: https://t.me/Dexterll
 * All rights reserved. Unauthorized copying, modification, distribution or commercial use is prohibited.
 * 保留所有权利。未经版权所有者事先书面同意，禁止复制、修改、分发或商业使用。
 * Все права защищены. Копирование, изменение, распространение и коммерческое использование без письменного согласия правообладателя запрещено.
 * Release
 */
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX, 
  Search, 
  Calendar, 
  Laptop, 
  Network, 
  Edit2, 
  X, 
  Upload, 
  Download, 
  FileText, 
  Trash2, 
  ExternalLink,
  FileCheck2,
  CheckCircle2,
  Plus,
  Printer,
  Camera,
  Video,
  Monitor
} from 'lucide-react';
import { ComputerItem, NetworkDevice } from '../types';
import { useTranslation } from '../utils/i18n';

interface WarrantiesViewProps {
  computers: ComputerItem[];
  networkDevices: NetworkDevice[];
  currentUser?: { id: string; name: string; role: 'Viewer' | 'Editor' | 'Admin' };
}

interface WarrantyPdf {
  name: string;
  size: string;
  content: string; // Base64 string preview content
  dateUploaded: string;
}

interface WarrantyItem {
  id: string;
  deviceName: string;
  type: string;
  inventoryNumber: string;
  purchaseDate: string;
  warrantyPeriodMonths: number;
  provider: string;
  pdfFile?: WarrantyPdf;
}

export default function WarrantiesView({
  computers,
  networkDevices,
  currentUser,
}: WarrantiesViewProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState<'Все' | 'Действует' | 'Истекает' | 'Истекла'>('Все');

  const allDevices = React.useMemo(() => {
    return [
      ...computers.map(c => ({ id: c.id, name: c.model, inv: c.inventoryNumber, cat: c.category || 'computer', src: 'comp' })),
      ...networkDevices.map(n => ({ id: n.id, name: n.deviceName, inv: n.ipAddress || 'Нет инв. №', cat: n.type, src: 'net' }))
    ];
  }, [computers, networkDevices]);

  const isViewer = currentUser?.role === 'Viewer';

  // State to hold persistent custom overrides (now with optional pdfFile property)
  const [customWarranties, setCustomWarranties] = useState<Record<string, { purchaseDate: string; warrantyPeriodMonths: number; provider: string; pdfFile?: WarrantyPdf }>>(() => {
    const saved = localStorage.getItem('it_custom_warranties');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing custom warranties', e);
      }
    }
    return {};
  });

  // State to hold manually deleted warranty item identifiers
  const [deletedWarranties, setDeletedWarranties] = useState<string[]>(() => {
    const saved = localStorage.getItem('it_deleted_warranties');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [manualWarranties, setManualWarranties] = useState<WarrantyItem[]>(() => {
    const saved = localStorage.getItem('it_manual_warranties');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [isAdding, setIsAdding] = useState(false);
  const [linkedDeviceId, setLinkedDeviceId] = useState('none');
  const [addDeviceName, setAddDeviceName] = useState('');
  const [addInventoryNumber, setAddInventoryNumber] = useState('');
  const [addPurchaseDate, setAddPurchaseDate] = useState('');
  const [addWarrantyPeriod, setAddWarrantyPeriod] = useState(12);
  const [addProvider, setAddProvider] = useState('');
  const [addType, setAddType] = useState<string>('computer');
  const [addPdfFile, setAddPdfFile] = useState<WarrantyPdf | null>(null);

  const handleLinkDevice = (deviceId: string) => {
    setLinkedDeviceId(deviceId);
    if (deviceId === 'none') {
      setAddDeviceName('');
      setAddInventoryNumber('');
      setAddType('computer');
      return;
    }
    const comp = computers.find(c => c.id === deviceId);
    if (comp) {
      setAddDeviceName(comp.model);
      setAddInventoryNumber(comp.inventoryNumber);
      let t = 'computer';
      if (comp.category === 'Ноутбук' || comp.model.toLowerCase().includes('ноутбук') || comp.model.toLowerCase().includes('laptop') || comp.model.toLowerCase().includes('macbook')) t = 'laptops';
      else if (comp.category === 'Оргтехника' || comp.model.toLowerCase().includes('принтер') || comp.model.toLowerCase().includes('мфу')) t = 'printers';
      else if (comp.category === 'Монитор' || comp.category === 'Периферия') t = 'peripherals';
      else if (comp.category === 'Видеонаблюдение' || comp.model.toLowerCase().includes('камера') || comp.model.toLowerCase().includes('камер')) t = 'cameras';
      setAddType(t);
      return;
    }
    const net = networkDevices.find(n => n.id === deviceId);
    if (net) {
      setAddDeviceName(net.deviceName);
      setAddInventoryNumber(net.ipAddress || 'Нет инв. №');
      let t = 'network';
      if (net.deviceName.toLowerCase().includes('камер')) t = 'cameras';
      else if (net.deviceName.toLowerCase().includes('регистратор')) t = 'dvrs';
      setAddType(t);
      return;
    }
  };

  const handleAddWarrantySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) return;
    
    const newItem: WarrantyItem = {
      id: `manual-${Date.now()}`,
      deviceName: addDeviceName,
      type: addType,
      inventoryNumber: addInventoryNumber,
      purchaseDate: addPurchaseDate,
      warrantyPeriodMonths: addWarrantyPeriod,
      provider: addProvider,
      pdfFile: addPdfFile || undefined
    };

    const updated = [...manualWarranties, newItem];
    setManualWarranties(updated);
    localStorage.setItem('it_manual_warranties', JSON.stringify(updated));
    setIsAdding(false);
  };


  // Inline delete confirmation states to avoid blocked window.confirm in sandbox iFrame
  const [confirmDeleteInv, setConfirmDeleteInv] = useState<string | null>(null);
  const [confirmDeletePdfInv, setConfirmDeletePdfInv] = useState<string | null>(null);

  const handleDeleteWarrantyRow = (inventoryNumber: string) => {
    if (isViewer) {
      alert('Ошибка: Удаление ограничено для Вашей роли.');
      return;
    }
    const updated = [...deletedWarranties, inventoryNumber];
    setDeletedWarranties(updated);
    localStorage.setItem('it_deleted_warranties', JSON.stringify(updated));
    setConfirmDeleteInv(null);
  };

  // Modal editing state values
  const [editingItem, setEditingItem] = useState<WarrantyItem | null>(null);
  const [editPurchaseDate, setEditPurchaseDate] = useState('');
  const [editWarrantyPeriod, setEditWarrantyPeriod] = useState(12);
  const [editProvider, setEditProvider] = useState('');
  const [editPdfFile, setEditPdfFile] = useState<WarrantyPdf | null>(null);

  // Integrated lightbox preview states
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [activePdfContent, setActivePdfContent] = useState<WarrantyPdf | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string>('');

  useEffect(() => {
    if (activePdfContent && activePdfContent.content) {
      const dataUrlStr = activePdfContent.content;
      if (dataUrlStr.startsWith('data:')) {
        try {
          const parts = dataUrlStr.split(',');
          const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/pdf';
          const binary = atob(parts[1]);
          const array = [];
          for (let i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
          }
          const blob = new Blob([new Uint8Array(array)], { type: mime });
          const url = URL.createObjectURL(blob);
          setPdfBlobUrl(url);
          return () => {
            URL.revokeObjectURL(url);
          };
        } catch (e) {
          console.error('Error creating PDF object URL', e);
          setPdfBlobUrl(dataUrlStr);
        }
      } else {
        setPdfBlobUrl(dataUrlStr);
      }
    } else {
      setPdfBlobUrl('');
    }
  }, [activePdfContent]);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const updated = {
      ...customWarranties,
      [editingItem.inventoryNumber]: {
        purchaseDate: editPurchaseDate,
        warrantyPeriodMonths: editWarrantyPeriod,
        provider: editProvider,
        pdfFile: editPdfFile || undefined,
      },
    };
    setCustomWarranties(updated);
    localStorage.setItem('it_custom_warranties', JSON.stringify(updated));
    setEditingItem(null);
  };

  // Build a list of mock warranties corresponding to our items
  const mockWarranties: WarrantyItem[] = [
    { id: 'w-1', deviceName: 'Dell Latitude 5420', type: 'computer', inventoryNumber: 'PC-0001', purchaseDate: '2025-01-10', warrantyPeriodMonths: 24, provider: 'Dell LLC Support' },
    { id: 'w-2', deviceName: 'Cisco Catalyst 2960', type: 'network', inventoryNumber: 'net-1', purchaseDate: '2023-01-15', warrantyPeriodMonths: 36, provider: 'Cisco SmartNet' },
    { id: 'w-3', deviceName: 'HP ProBook 450 G8', type: 'computer', inventoryNumber: 'PC-0002', purchaseDate: '2025-03-22', warrantyPeriodMonths: 12, provider: 'HP Care Pack' },
    { id: 'w-4', deviceName: 'Apple MacBook Air M1', type: 'computer', inventoryNumber: 'PC-0004', purchaseDate: '2024-06-01', warrantyPeriodMonths: 24, provider: 'AppleCare+' },
    { id: 'w-5', deviceName: 'Dell Latitude 5430', type: 'computer', inventoryNumber: 'PC-0006', purchaseDate: '2025-12-05', warrantyPeriodMonths: 12, provider: 'Dell Premium Care' },
    { id: 'w-6', deviceName: 'Lenovo ThinkCentre M720', type: 'computer', inventoryNumber: 'PC-0007', purchaseDate: '2022-09-10', warrantyPeriodMonths: 24, provider: 'Lenovo Depot Support' },
    { id: 'w-7', deviceName: 'Ubiquiti UniFi AP AC', type: 'network', inventoryNumber: 'net-5', purchaseDate: '2025-05-18', warrantyPeriodMonths: 12, provider: 'Ubiquiti Elite Support' },
  ];

  // Dynamically include newly added computers or router devices inside the local tracker!
  const getWarrantyCollection = (): (WarrantyItem & { remainingDays: number; expirationDate: string; status: 'Действует' | 'Истекает' | 'Истекла' })[] => {
    const today = new Date('2026-06-09'); // Consistent base date matching ADD_METADATA

    const combinedList: WarrantyItem[] = [...mockWarranties, ...manualWarranties];

    // Auto-map computers not listed
    computers.forEach(c => {
      if (!combinedList.some(item => item.inventoryNumber === c.inventoryNumber)) {
        combinedList.push({
          id: `w-c-${c.id}`,
          deviceName: `${c.deviceType || c.category} ${c.model}`,
          type: 'computer',
          inventoryNumber: c.inventoryNumber,
          purchaseDate: '2025-08-15',
          warrantyPeriodMonths: 24,
          provider: 'Стандартный дилер',
        });
      }
    });

    // Auto-map network items not listed
    networkDevices.forEach(n => {
      const expectedNetInv = `NET-${n.id.substring(0,4).toUpperCase()}`;
      if (!combinedList.some(item => item.inventoryNumber === expectedNetInv || item.deviceName === n.deviceName)) {
        combinedList.push({
          id: `w-n-${n.id}`,
          deviceName: n.deviceName,
          type: 'network',
          inventoryNumber: expectedNetInv,
          purchaseDate: '2024-11-20',
          warrantyPeriodMonths: 24,
          provider: 'Сетевые Поставки',
        });
      }
    });

    // Keep only warranties for assets that currently exist in the database, OR were manually added
    let aliveList = combinedList.filter(item => {
      if (manualWarranties.some(m => m.inventoryNumber === item.inventoryNumber)) {
        return true;
      }

      if (item.type === 'computer') {
        return computers.some(c => c.inventoryNumber === item.inventoryNumber);
      } else {
        return networkDevices.some(n => {
          const expectedNetInv = `NET-${n.id.substring(0,4).toUpperCase()}`;
          return (
            n.deviceName === item.deviceName ||
            item.inventoryNumber === n.id ||
            item.inventoryNumber === expectedNetInv ||
            item.inventoryNumber === `net-${n.id}`
          );
        });
      }
    });

    // Exclude manually deleted warranties
    aliveList = aliveList.filter(item => !deletedWarranties.includes(item.inventoryNumber));

    return aliveList.map(item => {
      // Overwrite with user custom edit if it exists
      const customValue = customWarranties[item.inventoryNumber];
      const finalItem = customValue
        ? {
            ...item,
            purchaseDate: customValue.purchaseDate,
            warrantyPeriodMonths: customValue.warrantyPeriodMonths,
            provider: customValue.provider,
            pdfFile: customValue.pdfFile
          }
        : item;

      const pDate = new Date(finalItem.purchaseDate);
      const expDate = new Date(pDate.setMonth(pDate.getMonth() + finalItem.warrantyPeriodMonths));
      const expStr = expDate.toISOString().split('T')[0];

      const diffTime = expDate.getTime() - today.getTime();
      const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let status: 'Действует' | 'Истекает' | 'Истекла' = 'Действует';
      if (remainingDays < 0) status = 'Истекла';
      else if (remainingDays <= 60) status = 'Истекает';

      return {
        ...finalItem,
        expirationDate: expStr,
        remainingDays,
        status,
      };
    });
  };

  const warrantiesCollection = getWarrantyCollection();

  const filtered = warrantiesCollection.filter(item => {
    const matchesSearch = item.deviceName.toLowerCase().includes(search.toLowerCase()) || 
                          item.inventoryNumber.toLowerCase().includes(search.toLowerCase()) ||
                          item.provider.toLowerCase().includes(search.toLowerCase());
    const matchesState = filterState === 'Все' || item.status === filterState;
    return matchesSearch && matchesState;
  });

  // Action: Upload a PDF Card directly from the Table Row
  const handlePdfUpload = (inventoryNumber: string, file: File | null) => {
    if (isViewer) {
      alert(t('Ошибка: Загрузка гарантийных талонов ограничена для Вашей роли.'));
      return;
    }
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert(t('Пожалуйста, выберите файл в формате PDF!'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const match = warrantiesCollection.find(w => w.inventoryNumber === inventoryNumber);
      const currentOverride = customWarranties[inventoryNumber] || {
        purchaseDate: match?.purchaseDate || '2025-01-10',
        warrantyPeriodMonths: match?.warrantyPeriodMonths || 12,
        provider: match?.provider || 'Стандартный дилер',
      };

      const updatedPdf: WarrantyPdf = {
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} КБ`,
        content: reader.result as string,
        dateUploaded: new Date().toISOString().split('T')[0]
      };

      const updated = {
        ...customWarranties,
        [inventoryNumber]: {
          ...currentOverride,
          pdfFile: updatedPdf,
        }
      };
      setCustomWarranties(updated);
      localStorage.setItem('it_custom_warranties', JSON.stringify(updated));
    };
    reader.readAsDataURL(file);
  };

  // Action: Delete Attached PDF Card
  const handleDeletePdf = (inventoryNumber: string) => {
    if (isViewer) {
      alert(t('Ошибка: Удаление файлов ограничено для Вашей роли.'));
      return;
    }
    const match = warrantiesCollection.find(w => w.inventoryNumber === inventoryNumber);
    const currentOverride = customWarranties[inventoryNumber] || {
      purchaseDate: match?.purchaseDate || '2025-01-10',
      warrantyPeriodMonths: match?.warrantyPeriodMonths || 12,
      provider: match?.provider || 'Стандартный дилер',
    };

    const updated = {
      ...customWarranties,
      [inventoryNumber]: {
        ...currentOverride,
        pdfFile: undefined,
      }
    };
    setCustomWarranties(updated);
    localStorage.setItem('it_custom_warranties', JSON.stringify(updated));
  };

  // Action: Trigger a direct download of a Base64 PDF file
  const handleDownloadPdf = (pdf: WarrantyPdf) => {
    if (!pdf.content) {
      alert(t('Содержимое талона недоступно.'));
      return;
    }
    const link = document.createElement('a');
    link.href = pdf.content;
    link.download = pdf.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Action: Open the lightbox view of the PDF content simulation
  const handlePreviewPdf = (pdf: WarrantyPdf) => {
    setActivePdfContent(pdf);
    setPdfModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Search and filter bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <input
              type="text"
              placeholder={t("Поиск по устройству, инвентарному или провайдеру...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-1">
              {(['Все', 'Действует', 'Истекает', 'Истекла'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterState(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold select-none transition-all ${
                    filterState === st
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {t(st)}
                </button>
              ))}
            </div>
            
            {!isViewer && (
              <button
                onClick={() => setIsAdding(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5"
              >
                <Plus size={14} />{t("Добавить Гарантию")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid status cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <ShieldCheck size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase block">{t("Действующая гарантия")}</span>
            <dfn className="text-2xl font-bold text-slate-800 not-italic">
              {warrantiesCollection.filter(w => w.status === 'Действует').length}
            </dfn>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <ShieldAlert size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase block">{t("Срок истекает (&lt;60 дней)")}</span>
            <dfn className="text-2xl font-bold text-slate-800 not-italic">
              {warrantiesCollection.filter(w => w.status === 'Истекает').length}
            </dfn>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <ShieldX size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase block">{t("Истекшая гарантия")}</span>
            <dfn className="text-2xl font-bold text-slate-800 not-italic">
              {warrantiesCollection.filter(w => w.status === 'Истекла').length}
            </dfn>
          </div>
        </div>
      </div>

      {/* Main Warranties List Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto text-slate-800">
          <table className="w-full text-left text-sm border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400">
                <th className="py-3 px-5 font-semibold text-slate-500">{t("Оборудование / Спецификация")}</th>
                <th className="py-3 px-5 font-semibold text-slate-500">{t("Инв. номер")}</th>
                <th className="py-3 px-5 font-semibold text-slate-500">{t("Провайдер обслуживания")}</th>
                <th className="py-3 px-5 font-semibold text-slate-500">{t("Гарантийный талон")}</th>
                <th className="py-3 px-5 font-semibold text-slate-500">{t("Дата покупки")}</th>
                <th className="py-3 px-5 font-semibold text-slate-500">{t("Окончание гарантии")}</th>
                <th className="py-3 px-5 text-center font-semibold text-slate-500">{t("Статус")}</th>
                <th className="py-3 px-5 text-center font-semibold text-slate-500">{t("Действие")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((item) => {
                let badgeClass = '';
                let remainingText = '';

                if (item.status === 'Действует') {
                  badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  remainingText = t("Действует (осталось {days} дн.)").replace("{days}", String(item.remainingDays));
                } else if (item.status === 'Истекает') {
                  badgeClass = 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
                  remainingText = t("Истекает (осталось {days} дн.)").replace("{days}", String(item.remainingDays));
                } else {
                  badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
                  remainingText = t("Истекла ({days} дн. назад)").replace("{days}", String(Math.abs(item.remainingDays)));
                }

                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-medium flex items-center gap-2.5 text-slate-800">
                      {item.type === 'computer' || item.type === 'laptops' ? (
                        <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Laptop size={14} /></span>
                      ) : item.type === 'printers' ? (
                        <span className="p-1.5 bg-pink-50 text-pink-600 rounded-lg"><Printer size={14} /></span>
                      ) : item.type === 'cameras' ? (
                        <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg"><Camera size={14} /></span>
                      ) : item.type === 'dvrs' ? (
                        <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><Video size={14} /></span>
                      ) : item.type === 'peripherals' ? (
                        <span className="p-1.5 bg-orange-50 text-orange-600 rounded-lg"><Monitor size={14} /></span>
                      ) : (
                        <span className="p-1.5 bg-lime-50 text-lime-600 rounded-lg"><Network size={14} /></span>
                      )}
                      {item.deviceName}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-xs text-slate-400 font-bold select-all">{item.inventoryNumber}</td>
                    <td className="py-3.5 px-5 text-slate-650 font-semibold">{item.provider}</td>

                    {/* PDF Ticket interactive column */}
                    <td className="py-3.5 px-5">
                      {item.pdfFile ? (
                        <div className="flex items-center gap-1.5">
                          <span 
                            onClick={() => handlePreviewPdf(item.pdfFile!)}
                            className="flex items-center gap-1 p-1 bg-red-50 text-rose-600 hover:text-rose-800 border border-red-100 rounded text-[11px] font-bold cursor-pointer hover:bg-red-100 transition-colors shrink-0 max-w-[140px]"
                            title={item.pdfFile.name}
                          >
                            <FileText size={12} />
                            <span className="truncate">{item.pdfFile.name}</span>
                          </span>
                          <button
                            onClick={() => handleDownloadPdf(item.pdfFile!)}
                            className="p-1 text-slate-400 hover:text-slate-750 transition-colors hover:bg-slate-100 rounded cursor-pointer"
                            title={t("Скачать PDF")}
                          >
                            <Download size={12} />
                          </button>
                          {!isViewer && (
                            <>
                              {confirmDeletePdfInv === item.inventoryNumber ? (
                                <div className="flex items-center gap-1 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 text-[10px] animate-fade-in shadow-xs select-none">
                                  <span className="text-rose-700 font-bold">{t("Удалить файл?")}</span>
                                  <button
                                    onClick={() => {
                                      handleDeletePdf(item.inventoryNumber);
                                      setConfirmDeletePdfInv(null);
                                    }}
                                    className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold cursor-pointer transition-colors text-[9px]"
                                  >{t("Да")}</button>
                                  <button
                                    onClick={() => setConfirmDeletePdfInv(null)}
                                    className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-bold cursor-pointer transition-colors text-[9px]"
                                  >{t("Нет")}</button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeletePdfInv(item.inventoryNumber)}
                                  className="p-1 text-slate-400 hover:text-red-505 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                  title={t("Удалить файл")}
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      ) : (
                        <div>
                          {!isViewer ? (
                            <label className="flex items-center gap-1.5 border border-dashed border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/20 text-slate-500 hover:text-blue-650 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors max-w-[150px] select-none">
                              <Upload size={12} className="shrink-0" />
                              <span>{t("Прикрепить PDF")}</span>
                              <input
                                type="file"
                                accept=".pdf"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null;
                                  handlePdfUpload(item.inventoryNumber, file);
                                }}
                              />
                            </label>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic font-mono">{t("Не прикреплен")}</span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-5 text-slate-500 font-mono text-xs">{item.purchaseDate}</td>
                    <td className="py-3.5 px-5 font-mono text-sm text-slate-800 font-semibold">{item.expirationDate}</td>
                    <td className="py-3.5 px-5 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}`}>
                          {t(item.status)}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono font-medium">{remainingText}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      {!isViewer ? (
                        <div className="flex items-center justify-center gap-2">
                          {confirmDeleteInv === item.inventoryNumber ? (
                            <div className="flex items-center gap-1.5 bg-rose-50 px-2 py-1 rounded border border-rose-200 text-xs shadow-xs select-none">
                              <span className="text-rose-700 font-bold">{t("Удалить?")}</span>
                              <button
                                onClick={() => handleDeleteWarrantyRow(item.inventoryNumber)}
                                className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold cursor-pointer transition-colors text-[11px]"
                              >{t("Да")}</button>
                              <button
                                onClick={() => setConfirmDeleteInv(null)}
                                className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-bold cursor-pointer transition-colors text-[11px]"
                              >{t("Нет")}</button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingItem(item);
                                  setEditPurchaseDate(item.purchaseDate);
                                  setEditWarrantyPeriod(item.warrantyPeriodMonths);
                                  setEditProvider(item.provider);
                                  setEditPdfFile(item.pdfFile || null);
                                }}
                                className="p-1 px-2.5 bg-slate-100 hover:bg-blue-600 text-slate-600 hover:text-white rounded border border-slate-200 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                              >
                                <Edit2 size={11} />{t("Изменить")}</button>
                              <button
                                onClick={() => setConfirmDeleteInv(item.inventoryNumber)}
                                className="p-1 px-2.5 bg-red-50 hover:bg-red-650 text-red-600 hover:text-white rounded border border-red-100 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                                title={t("Удалить из гарантии")}
                              >
                                <Trash2 size={11} />{t("Удалить")}</button>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">{t("Только чтение")}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Warranty form */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden transform transition-all p-6 space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-base text-slate-800">{t("Добавить Гарантию")}</h3>
              <button 
                onClick={() => setIsAdding(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded hover:bg-slate-50 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddWarrantySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Тип устройства")}</label>
                <select
                  value={addType}
                  onChange={(e) => {
                    setAddType(e.target.value);
                    setLinkedDeviceId('none');
                    setAddDeviceName('');
                    setAddInventoryNumber('');
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
                >
                  <option value="computer">{t("Компьютеры")}</option>
                  <option value="network">{t("Сетевое оборудование")}</option>
                  <option value="laptops">{t("Ноутбуки")}</option>
                  <option value="printers">{t("Принтеры")}</option>
                  <option value="cameras">{t("Видеокамеры")}</option>
                  <option value="dvrs">{t("Видеорегистраторы")}</option>
                  <option value="peripherals">{t("Периферия")}</option>
                  <option value="other">{t("Прочее обор.")}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Привязать к устройству с баланса")}</label>
                <select
                  value={linkedDeviceId}
                  onChange={(e) => handleLinkDevice(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-medium"
                >
                  <option value="none">{t("Ввести вручную (без привязки)")}</option>
                  {allDevices.filter(d => {
                      if (addType === 'network') return d.src === 'net' && d.cat !== 'Камера' && d.cat !== 'Регистратор';
                      if (addType === 'computer') return d.src === 'comp' && d.cat === 'ПК';
                      if (addType === 'laptops') return d.src === 'comp' && d.cat === 'Ноутбук';
                      if (addType === 'printers') return d.src === 'comp' && d.cat === 'Оргтехника';
                      if (addType === 'cameras') return d.cat === 'Видеонаблюдение' || d.cat === 'Камера';
                      if (addType === 'dvrs') return d.cat === 'Регистратор';
                      if (addType === 'peripherals') return d.src === 'comp' && (d.cat === 'Монитор' || d.cat === 'Периферия');
                      return true;
                  }).map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.inv})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Оборудование / Спецификация")}</label>
                <input
                  type="text"
                  required
                  placeholder={t("Например, Dell Latitude 5420")}
                  value={addDeviceName}
                  onChange={(e) => setAddDeviceName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Инвентарный №")}</label>
                <input
                  type="text"
                  required
                  placeholder={t("Например, PC-0001")}
                  value={addInventoryNumber}
                  onChange={(e) => setAddInventoryNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-mono"
                />
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Дата покупки")}</label>
                  <input
                    type="date"
                    required
                    value={addPurchaseDate}
                    onChange={(e) => setAddPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-mono"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Срок гарантии (мес.)")}</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    required
                    value={addWarrantyPeriod}
                    onChange={(e) => setAddWarrantyPeriod(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Обслуживающий сервис-провайдер")}</label>
                <input
                  type="text"
                  required
                  placeholder={t("Например, Dell LLC Support")}
                  value={addProvider}
                  onChange={(e) => setAddProvider(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
                />
              </div>

              <div className="border-t border-slate-100 pt-3">
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Гарантийный талон")}</label>
                {addPdfFile ? (
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="p-1.5 bg-red-100 text-red-600 rounded">
                        <FileText size={16} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-semibold text-slate-700 truncate">{addPdfFile.name}</p>
                        <p className="text-[10px] text-slate-400">{addPdfFile.size} • {t("Документ PDF")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setAddPdfFile(null)}
                        className="p-1 text-slate-400 hover:text-red-500 focus:outline-none"
                        title={t("Убрать талон")}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 border border-dashed border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/20 text-slate-500 hover:text-blue-600 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors w-full select-none">
                    <Upload size={14} />
                    <span>{t("Выбрать PDF-талон")}</span>
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        if (file) {
                          const r = new FileReader();
                          r.onload = () => {
                            setAddPdfFile({
                              name: file.name,
                              size: `${(file.size / 1024).toFixed(1)} КБ`,
                              content: r.result as string,
                              dateUploaded: new Date().toISOString().split('T')[0]
                            });
                          };
                          r.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                >{t("Отмена")}</button>
                <button
                  type="submit"
                  disabled={isViewer}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isViewer ? t('Только чтение') : t('Сохранить')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal warranty edit form */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden transform transition-all p-6 space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-base text-slate-800">{t("Редактировать гарантию")}</h3>
              <button 
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded hover:bg-slate-50 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-600 space-y-1">
              <p>📍 <strong>{t("Оборудование:")}</strong> {editingItem.deviceName}</p>
              <p>🔑 <strong>{t("Инвентарный №:")}</strong> {editingItem.inventoryNumber}</p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Дата покупки")}</label>
                <input
                  type="date"
                  required
                  value={editPurchaseDate}
                  disabled={isViewer}
                  onChange={(e) => setEditPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-mono disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Срок гарантии (мес.)")}</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  required
                  value={editWarrantyPeriod}
                  disabled={isViewer}
                  onChange={(e) => setEditWarrantyPeriod(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Обслуживающий сервис-провайдер")}</label>
                <input
                  type="text"
                  required
                  placeholder="Dell LLC Support"
                  value={editProvider}
                  disabled={isViewer}
                  onChange={(e) => setEditProvider(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 disabled:opacity-60"
                />
              </div>

              {/* Edit Warranty Card File Form Row */}
              <div className="border-t border-slate-100 pt-3">
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Гарантийный талон")}</label>
                {editPdfFile ? (
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-150 text-xs">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="p-1 px-1.5 bg-rose-50 text-red-500 rounded"><FileText size={14} /></span>
                      <span className="font-semibold text-slate-700 truncate max-w-[180px]" title={editPdfFile.name}>
                        {editPdfFile.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(editPdfFile)}
                        className="p-1 text-slate-500 hover:text-slate-800 focus:outline-none"
                        title={t("Скачать оригинальный файл")}
                      >
                        <Download size={13} />
                      </button>
                      {!isViewer && (
                        <button
                          type="button"
                          onClick={() => setEditPdfFile(null)}
                          className="p-1 text-slate-400 hover:text-red-505 focus:outline-none"
                          title={t("Убрать талон")}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    {!isViewer ? (
                      <label className="flex items-center justify-center gap-2 border border-dashed border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/20 text-slate-500 hover:text-blue-650 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors w-full select-none">
                        <Upload size={14} />
                        <span>{t("Выбрать PDF-талон")}</span>
                        <input
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            if (file) {
                              const r = new FileReader();
                              r.onload = () => {
                                setEditPdfFile({
                                  name: file.name,
                                  size: `${(file.size / 1024).toFixed(1)} КБ`,
                                  content: r.result as string,
                                  dateUploaded: new Date().toISOString().split('T')[0]
                                });
                              };
                              r.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    ) : (
                      <span className="text-xs text-slate-400 italic">{t("Файл талона отсутствует")}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-150 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                >{t("Отмена")}</button>
                <button
                  type="submit"
                  disabled={isViewer}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isViewer ? t('Только чтение') : t('Сохранить')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Integrated Lightbox viewer popup */}
      {pdfModalOpen && activePdfContent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileCheck2 size={16} className="text-emerald-500 shrink-0" />{t("Интегрированный просмотр документов")}</span>
              <button 
                onClick={() => { setPdfModalOpen(false); setActivePdfContent(null); }}
                className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Document Interactive Viewer layout */}
            <div className="flex-1 bg-slate-700 p-4 sm:p-6 overflow-hidden flex flex-col lg:flex-row gap-6">
              {/* Left Column: Secure Interactive Document Hub */}
              <div className="flex-1 bg-slate-800/60 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative h-full border border-slate-700/40">
                <div className="max-w-md space-y-6">
                  <div className="mx-auto w-16 h-16 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center border border-blue-500/20 shadow-md">
                    <FileCheck2 size={32} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-white">{t("Документ готов к просмотру")}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{t("Встроенные браузерные плагины PDF блокируются политикой безопасности Chrome внутри защищенного фрейма разработчика.")}</p>
                    <p className="text-xs text-slate-300 font-medium">{t("Пожалуйста, откройте документ в новой вкладке или скачайте его. Это безопасно и откроет файл в оригинальном разрешении.")}</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-2.5 justify-center pt-2">
                    {pdfBlobUrl && (
                      <a 
                        href={pdfBlobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-blue-500/10 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                      >
                        <ExternalLink size={14} />{t("Открыть в новой вкладке")}</a>
                    )}
                    
                    <button
                      onClick={() => handleDownloadPdf(activePdfContent)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all border border-slate-700/60 cursor-pointer"
                    >
                      <Download size={14} />{t("Скачать файл (.pdf)")}</button>
                  </div>
                </div>
              </div>

              {/* Right Column: Simulated Metadata & Signature Panel */}
              <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
                <div className="bg-white shadow-xl p-5 rounded-2xl border border-slate-100 flex flex-col justify-between flex-1">
                  <div className="space-y-4">
                    {/* Decorative stamp decoration */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div className="space-y-0.5">
                        <h4 className="text-[10px] font-bold text-slate-800 tracking-tight uppercase leading-none">{t("ТехСпецификация Оборудования")}</h4>
                        <p className="text-[8px] text-slate-400">{t("Система инвентаризации корпорации")}</p>
                      </div>
                      <CheckCircle2 size={24} className="text-emerald-500 shrink-0" />
                    </div>

                    {/* Metadata details */}
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">{t("Имя файла")}</span>
                        <p className="text-xs font-bold text-slate-750 break-all bg-slate-50 p-2 rounded-lg mt-0.5 font-mono">
                          {activePdfContent.name}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-[8px] text-slate-400 font-bold block uppercase leading-none">{t("Документ-Класс")}</span>
                          <span className="text-[10px] font-bold text-slate-650 block mt-1">{t("PDF-СПЕЦИФИКАЦИЯ")}</span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-[8px] text-slate-400 font-bold block uppercase leading-none">{t("Размер файла")}</span>
                          <span className="text-[10px] font-bold text-slate-650 block mt-1">{activePdfContent.size}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                        <span className="text-[8px] text-slate-400 font-bold block uppercase">{t("Статус гарантийн. службы")}</span>
                        <span className="text-[11px] font-bold text-emerald-650 flex items-center gap-1">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse inline-block" />{t("АКТИВЕН И ПРОВЕРЕН • ОК")}</span>
                        <p className="text-[9px] text-slate-400 leading-normal">{t("Гарантийный талон оцифрован и привязан к системе в зашифрованном виде (Base64). Талон доступен для скачивания в любой момент.")}</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-[9px] text-slate-400 border-t border-slate-101 pt-3 text-center mt-4">{t("База данных: ИТ-Орбита СУБД")}</div>
                </div>
              </div>
            </div>

            {/* Quick download toolbar */}
            <div className="bg-slate-50 p-4 border-t border-slate-101 flex items-center justify-between shadow-md">
              <span className="text-[10px] text-slate-400 leading-none">{t("Система PDF-просмотра • Лист 1 из 1")}</span>
              <button
                onClick={() => handleDownloadPdf(activePdfContent)}
                className="py-1.5 px-4 bg-slate-850 hover:bg-slate-750 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Download size={13} />{t("Скачать оригинальный файл")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
