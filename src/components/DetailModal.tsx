/*
 * COPYRIGHT NOTICE | УВЕДОМЛЕНИЕ ОБ АВТОРСКИХ ПРАВАХ | 版权声明
 * © 2026 Utkin Vladislav Vyacheslavovich (Уткин Владислав Вячеславович)
 * Email: vicariustab@icloud.com | Telegram: https://t.me/Dexterll
 * All rights reserved. Unauthorized copying, modification, distribution or commercial use is prohibited.
 * 保留所有权利。未经版权所有者事先书面同意，禁止复制、修改、分发或商业使用。
 * Все права защищены. Копирование, изменение, распространение и коммерческое использование без письменного согласия правообладателя запрещено.
 * Release
 */
import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Trash2, 
  Download, 
  Plus, 
  User, 
  Building2, 
  Laptop, 
  Network, 
  ChevronRight, 
  Calendar, 
  ShieldAlert, 
  Locate, 
  Briefcase, 
  Layers, 
  Ruler, 
  HelpCircle,
  FileCheck2,
  CheckCircle2,
  ExternalLink,
  Wrench,
  Cpu,
  History,
  Printer,
  RefreshCw,
  Settings,
  Activity,
  Package,
  Clock,
  Edit2
} from 'lucide-react';
import { ObjectItem, NetworkDevice, ComputerItem, EmployeeItem, WarehouseItem, SystemUser } from '../types';
import { getDeviceIcon } from '../utils/deviceIcons';
import { useTranslation } from '../utils/i18n';
import {
  supportsComputerSpecifications,
  hasAnyComputerSpecs,
  matchesBaseInventoryNumber,
} from '../utils/equipmentFields';
import ModalCloseButton from './ModalCloseButton';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: 'computer' | 'network' | 'employee' | 'object' | 'warehouse';
  itemId: string;
  objects: ObjectItem[];
  networkDevices: NetworkDevice[];
  computers: ComputerItem[];
  employees: EmployeeItem[];
  warehouseItems: WarehouseItem[];
  onUpdateItem: (type: string, id: string, updatedFields: any) => void;
  onNavigateDetail: (type: 'computer' | 'network' | 'employee' | 'object' | 'warehouse', id: string) => void;
  currentUser?: SystemUser;
  workspaceName?: string;
}

// Pre-defined gorgeous fallback Unsplash images for various devices
const DEFAULT_IMAGES = {
  laptop: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=400&q=80',
  pc: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=400&q=80',
  monitor: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=400&q=80',
  peripheral: 'https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?auto=format&fit=crop&w=400&q=80',
  network: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80',
  accesspoint: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=400&q=80',
  office: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80',
  warehouse: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80',
  datacenter: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&w=400&q=80',
};

const mapDeviceTypeToCategory = (type: string): string => {
  switch (type) {
    case 'Ноутбук': return 'Ноутбук';
    case 'ПК': return 'ПК';
    case 'Монитор': return 'Монитор';
    case 'Принтер': return 'Оргтехника';
    case 'Клавиатура':
    case 'Мышь':
    case 'Клавиатура + мышь': return 'Периферия';
    case 'Видеокамера':
    case 'Видеорегистратор': return 'Видеонаблюдение';
    case 'Картридж':
    case 'Картриджи': return 'Расходники';
    case 'Сетевое хранилище':
    case 'Инструмент':
    case 'Другое':
    default: return 'Другое';
  }
};

export default function DetailModal({
  isOpen,
  onClose,
  itemType,
  itemId,
  objects,
  networkDevices,
  computers,
  employees,
  warehouseItems,
  onUpdateItem,
  onNavigateDetail,
  currentUser,
  workspaceName,
}: DetailModalProps) {
  const { t } = useTranslation();
  // Find respective item
  let item: any = null;
  if (itemType === 'computer') item = computers.find(c => c.id === itemId);
  else if (itemType === 'network') item = networkDevices.find(n => n.id === itemId);
  else if (itemType === 'employee') item = employees.find(e => e.id === itemId);
  else if (itemType === 'object') item = objects.find(o => o.id === itemId);
  else if (itemType === 'warehouse') item = warehouseItems.find(w => w.id === itemId);

  const [activeTab, setActiveTab] = useState<'info' | 'pdfs'>('info');
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [activePdfContent, setActivePdfContent] = useState<{ name: string; content?: string } | null>(null);
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

  // Print modal states
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printType, setPrintType] = useState<'act' | 'card'>('act');

  // Live Act editable states
  const [actNumber, setActNumber] = useState('');
  const [actDate, setActDate] = useState('');
  const [actCompany, setActCompany] = useState(() => workspaceName || 'ООО "ГЛОБАЛ-КОНСАЛТ ИТ"');
  const [actSub, setActSub] = useState('Корпоративная система ИТ-инвентаря • Технический отдел');
  const [actSender, setActSender] = useState(() => `Администрация ${workspaceName || 'ООО "Глобал-Консалт ИТ"'}`);
  const [actSenderSub, setActSenderSub] = useState('Исполнительный ИТ-Департамент компании');
  const [actReceiver, setActReceiver] = useState('');
  const [actReceiverSub, setActReceiverSub] = useState('');
  const [actText1, setActText1] = useState('1. Работник принимает на себя полную материальную и техническую ответственность за сохранность вышеуказанного ИТ-имущества, компьютерных узлов и прилегающих периферийных приспособлений, переданных для исполнения его прямых трудовых обязательств.');
  const [actText2, setActText2] = useState('2. Работнику строго воспрещается производить самостоятельно несанкционированное вскрытие корпусов оборудования, переустановку операционных систем, замену комплектующих, а также извлечение или передачу деталей третьим лицам без личного согласования с техническим отделом.');
  const [actText3, setActText3] = useState('3. Оборудование возвращается Сторонами в исходном технически исправном состоянии с учетом естественного износа ИТ-комплектующих.');

  // States for Replaced Components form
  const [editingCompId, setEditingCompId] = useState<string | null>(null);
  const [confirmDeleteCompId, setConfirmDeleteCompId] = useState<string | null>(null);
  const [confirmDeleteCartId, setConfirmDeleteCartId] = useState<string | null>(null);
  const [confirmDeletePdfIndex, setConfirmDeletePdfIndex] = useState<number | null>(null);
  const [compName, setCompName] = useState('');
  const [compOldDetails, setCompOldDetails] = useState('');
  const [compNewDetails, setCompNewDetails] = useState('');
  const [compReason, setCompReason] = useState('');
  const [compDate, setCompDate] = useState(() => new Date().toISOString().split('T')[0]);

  // States for Cartridges form
  const [cartModel, setCartModel] = useState('');
  const [cartStatus, setCartStatus] = useState<'Заправлен' | 'Пустой' | 'На заправке'>('Заправлен');
  const [cartColor, setCartColor] = useState('Черный');
  const [cartServiceDate, setCartServiceDate] = useState(() => new Date().toISOString().split('T')[0]);

  // States for linking Consumable (category === 'Расходники') to Printer/MFD (category === 'Оргтехника')
  const [selectedPrinterId, setSelectedPrinterId] = useState<string>('');
  const [bindColor, setBindColor] = useState<string>('Черный');
  const [bindStatus, setBindStatus] = useState<'Заправлен' | 'Пустой' | 'На заправке'>('Заправлен');
  const [bindDate, setBindDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [autoUpdateConsumableStatus, setAutoUpdateConsumableStatus] = useState<string>('in_work');

  const equipmentGroups = [
    'Инструкции и руководства',
    'Гарантийные талоны',
    'Лицензии и сертификаты',
    'Акты приема-передачи',
    'Накладные и счета',
    'Служебная записка',
    'Прочее'
  ];

  const employeeGroups = [
    'Трудовые договора',
    'Личные документы (Скан)',
    'Инструкции и регламенты',
    'Заявления и приказы',
    'Сертификаты обучения',
    'Служебная записка',
    'Прочее'
  ];

  const [selectedGroup, setSelectedGroup] = useState<string>(() => {
    return itemType === 'employee' ? 'Трудовые договора' : 'Инструкции и руководства';
  });

  React.useEffect(() => {
    setSelectedGroup(itemType === 'employee' ? 'Трудовые договора' : 'Инструкции и руководства');
  }, [itemType]);

  React.useEffect(() => {
    if (item && printModalOpen) {
      setActNumber(item.inventoryNumber ? `ЭО-${item.inventoryNumber}` : `ЭО-${item.id?.toString().slice(0, 5).toUpperCase() || 'NEW'}`);
      setActDate(new Date().toISOString().split('T')[0]);
      setActCompany(workspaceName || 'ООО "ГЛОБАЛ-КОНСАЛТ ИТ"');
      setActSub('Корпоративная система ИТ-инвентаря • Технический отдел');
      setActSender(`Администрация ${workspaceName || 'ООО "Глобал-Консалт ИТ"'}`);
      setActSenderSub('Исполнительный ИТ-Департамент компании');
      setActReceiver(item.employeeName || item.name || 'Материальное ответственное лицо');
      setActReceiverSub(`${item.position || 'Штатный сотрудник'} ${item.department ? `• Отдел: ${item.department}` : ''}`);
      setActText1('1. Работник принимает на себя полную материальную и техническую ответственность за сохранность вышеуказанного ИТ-имущества, компьютерных узлов и прилегающих периферийных приспособлений, переданных для исполнения его прямых трудовых обязательств.');
      setActText2('2. Работнику строго воспрещается производить самостоятельно несанкционированное вскрытие корпусов оборудования, переустановку операционных систем, замену комплектующих, а также извлечение или передачу деталей третьим лицам без личного согласования с техническим отделом.');
      setActText3('3. Оборудование возвращается Сторонами в исходном технически исправном состоянии с учетом естественного износа ИТ-комплектующих.');
    }
  }, [item, printModalOpen]);
  
  const isViewer = currentUser?.role === 'Viewer';

  const handleUpdate = (type: string, id: string, updatedFields: any) => {
    if (isViewer) {
      alert('Ошибка: Редактирование заблокировано в режиме просмотра.');
      return;
    }
    onUpdateItem(type, id, updatedFields);
  };
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  if (!item) {
    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-4 relative">
          <div className="absolute top-3 right-3">
            <ModalCloseButton onClick={onClose} />
          </div>
          <p className="text-slate-500 font-medium">{t("Элемент не найден")}</p>
          <button onClick={onClose} className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 px-4 rounded-lg text-xs font-bold">{t("Закрыть")}</button>
        </div>
      </div>
    );
  }

  // Determine fallback image for items
  const getFallbackImage = () => {
    if (itemType === 'object') {
      if (item.name.toLowerCase().includes('склад')) return DEFAULT_IMAGES.warehouse;
      if (item.name.toLowerCase().includes('цод')) return DEFAULT_IMAGES.datacenter;
      return DEFAULT_IMAGES.office;
    }
    
    if (itemType === 'employee') {
      // Return beautiful UI initials background instead
      return null;
    }

    if (itemType === 'computer' || itemType === 'warehouse') {
      const cat = (item.category || item.type || '').toLowerCase();
      if (cat.includes('ноутбук')) return DEFAULT_IMAGES.laptop;
      if (cat.includes('монитор')) return DEFAULT_IMAGES.monitor;
      if (cat.includes('периферия')) return DEFAULT_IMAGES.peripheral;
      return DEFAULT_IMAGES.pc;
    }

    if (itemType === 'network') {
      if (item.type === 'Точка доступа') return DEFAULT_IMAGES.accesspoint;
      return DEFAULT_IMAGES.network;
    }

    return DEFAULT_IMAGES.laptop;
  };

  const imageSrc = item.photoUrl || getFallbackImage();

  // Photo uploading file reader handler (Base64 transformer)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isViewer) {
      alert('Ошибка: Добавление фотографий ограничено для Вашей роли.');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      handleUpdate(itemType, item.id, { photoUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  // PDF Attach reader handler (Converts PDF to Base64 for download / offline retrieval)
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isViewer) {
      alert('Ошибка: Прикрепление PDF файлов ограничено для Вашей роли.');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Пожалуйста, выберите файл в формате PDF!');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const currentPdfs = item.pdfFiles || [];
      const newPdf = {
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} КБ`,
        content: reader.result as string, // Real file Base64 stream
        group: selectedGroup || (itemType === 'employee' ? 'Трудовые договора' : 'Инструкции и руководства'),
        dateUploaded: new Date().toISOString().split('T')[0]
      };
      
      handleUpdate(itemType, item.id, {
        pdfFiles: [...currentPdfs, newPdf]
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePdf = (index: number) => {
    if (isViewer) {
      alert('Ошибка: Удаление PDF документов ограничено для Вашей роли.');
      return;
    }
    const currentPdfs = item.pdfFiles || [];
    const updated = currentPdfs.filter((_: any, idx: number) => idx !== index);
    handleUpdate(itemType, item.id, { pdfFiles: updated });
  };

  // Trigger download helper
  const handleDownloadPdf = (pdf: { name: string; content?: string }) => {
    if (!pdf.content) {
      alert('Содержимое документа недоступно.');
      return;
    }
    const link = document.createElement('a');
    link.href = pdf.content;
    link.download = pdf.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Simulate opening PDF in integrated preview window
  const handlePreviewPdf = (pdf: { name: string; content?: string }) => {
    setActivePdfContent(pdf);
    setPdfModalOpen(true);
  };

  // Related connections logic
  const renderRelatedSection = () => {
    if (itemType === 'object') {
      const locationComputers = computers.filter(c => c.objectName === item.name);
      const locationNetwork = networkDevices.filter(n => n.objectName === item.name);

      const laptopsAndPCs = locationComputers.filter(c => c.category === 'Ноутбук' || c.category === 'ПК');
      const monitors = locationComputers.filter(c => c.category === 'Монитор');
      const peripherals = locationComputers.filter(c => c.category === 'Периферия' || c.category === 'Другое');
      const cctv = locationComputers.filter(c => c.category === 'Видеонаблюдение');
      const officeEq = locationComputers.filter(c => c.category === 'Оргтехника');
      const consumables = locationComputers.filter(c => c.category === 'Расходники');
      const networking = locationNetwork;

      const hasResources = locationComputers.length > 0 || locationNetwork.length > 0;

      return (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-slate-405 uppercase tracking-wider">Прикрепленные ресурсы по группам ({locationComputers.length + locationNetwork.length})</h4>
          
          {!hasResources ? (
            <p className="text-xs text-slate-400 italic">{t("На данном объекте нет зарегистрированной техники.")}</p>
          ) : (
            <div className="space-y-4 max-h-56 overflow-y-auto pr-1">
              {/* Группа 1: Вычислительная техника */}
              {laptopsAndPCs.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50/50 px-2 py-1 rounded-lg">
                    <span>{t("Вычислительная техника (ПК и Ноутбуки)")}</span>
                    <span className="font-mono bg-blue-100 text-blue-800 px-1.5 rounded-full text-[9px]">{laptopsAndPCs.length}</span>
                  </div>
                  <div className="space-y-1.5 pl-0.5">
                    {laptopsAndPCs.map(comp => (
                      <div 
                        key={comp.id}
                        onClick={() => onNavigateDetail('computer', comp.id)}
                        className="flex items-center justify-between p-2 bg-slate-50 hover:bg-blue-50/30 rounded-xl text-xs cursor-pointer border border-transparent hover:border-blue-100 transition-all shadow-2xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="p-1 px-1.5 bg-blue-100/60 text-blue-600 rounded-lg">{getDeviceIcon({ category: comp.category, deviceType: comp.deviceType, model: comp.model, size: 12 })}</span>
                          <div>
                            <p className="font-bold text-slate-700">{comp.category} {comp.model}</p>
                            <p className="text-[10px] text-slate-450">Инв. № {comp.inventoryNumber} • {comp.employeeName}</p>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Группа 2: Сеть */}
              {networking.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-lime-700 bg-lime-50/50 px-2 py-1 rounded-lg">
                    <span>{t("Сетевое инфраструктурное оборудование")}</span>
                    <span className="font-mono bg-lime-100 text-lime-800 px-1.5 rounded-full text-[9px]">{networking.length}</span>
                  </div>
                  <div className="space-y-1.5 pl-0.5">
                    {networking.map(net => (
                      <div 
                        key={net.id}
                        onClick={() => onNavigateDetail('network', net.id)}
                        className="flex items-center justify-between p-2 bg-slate-50 hover:bg-lime-50/30 rounded-xl text-xs cursor-pointer border border-transparent hover:border-lime-100 transition-all shadow-2xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="p-1 px-1.5 bg-lime-100/60 text-lime-650 rounded-lg"><Network size={12} /></span>
                          <div>
                            <p className="font-bold text-slate-700">{net.deviceName}</p>
                            <p className="text-[10px] text-slate-450">IP: {net.ipAddress} • {net.type} • {net.quantity} ед.</p>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Группа 3: Дисплеи */}
              {monitors.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50/50 px-2 py-1 rounded-lg">
                    <span>{t("Средства отображения (Мониторы)")}</span>
                    <span className="font-mono bg-indigo-100 text-indigo-800 px-1.5 rounded-full text-[9px]">{monitors.length}</span>
                  </div>
                  <div className="space-y-1.5 pl-0.5">
                    {monitors.map(comp => (
                      <div 
                        key={comp.id}
                        onClick={() => onNavigateDetail('computer', comp.id)}
                        className="flex items-center justify-between p-2 bg-slate-50 hover:bg-indigo-50/30 rounded-xl text-xs cursor-pointer border border-transparent hover:border-indigo-100 transition-all shadow-2xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="p-1 px-1.5 bg-indigo-100/60 text-indigo-600 rounded-lg">{getDeviceIcon({ category: comp.category, deviceType: comp.deviceType, model: comp.model, size: 12 })}</span>
                          <div>
                            <p className="font-bold text-slate-700">{comp.category} {comp.model}</p>
                            <p className="text-[10px] text-slate-450">Инв. № {comp.inventoryNumber} • {comp.employeeName}</p>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Группа 4: Периферия */}
              {peripherals.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50/50 px-2 py-1 rounded-lg">
                    <span>{t("Периферия и другое оборудование")}</span>
                    <span className="font-mono bg-orange-100 text-orange-850 px-1.5 rounded-full text-[9px]">{peripherals.length}</span>
                  </div>
                  <div className="space-y-1.5 pl-0.5">
                    {peripherals.map(comp => (
                      <div 
                        key={comp.id}
                        onClick={() => onNavigateDetail('computer', comp.id)}
                        className="flex items-center justify-between p-2 bg-slate-50 hover:bg-orange-50/30 rounded-xl text-xs cursor-pointer border border-transparent hover:border-orange-100 transition-all shadow-2xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="p-1 px-1.5 bg-orange-100/60 text-orange-600 rounded-lg">{getDeviceIcon({ category: comp.category, deviceType: comp.deviceType, model: comp.model, size: 12 })}</span>
                          <div>
                            <p className="font-bold text-slate-700">{comp.category} {comp.model}</p>
                            <p className="text-[10px] text-slate-450">Инв. № {comp.inventoryNumber} • {comp.employeeName}</p>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Группа 5: Видеонаблюдение */}
              {cctv.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-violet-600 bg-violet-50/50 px-2 py-1 rounded-lg">
                    <span>{t("Видеонаблюдение")}</span>
                    <span className="font-mono bg-violet-100 text-violet-850 px-1.5 rounded-full text-[9px]">{cctv.length}</span>
                  </div>
                  <div className="space-y-1.5 pl-0.5">
                    {cctv.map(comp => (
                      <div 
                        key={comp.id}
                        onClick={() => onNavigateDetail('computer', comp.id)}
                        className="flex items-center justify-between p-2 bg-slate-50 hover:bg-violet-50/30 rounded-xl text-xs cursor-pointer border border-transparent hover:border-violet-100 transition-all shadow-2xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="p-1 px-1.5 bg-violet-100/60 text-violet-600 rounded-lg">{getDeviceIcon({ category: comp.category, deviceType: comp.deviceType, model: comp.model, size: 12 })}</span>
                          <div>
                            <p className="font-bold text-slate-700">{comp.category} {comp.model}</p>
                            <p className="text-[10px] text-slate-450">Инв. № {comp.inventoryNumber} • {comp.employeeName}</p>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Группа 6: Оргтехника */}
              {officeEq.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50/50 px-2 py-1 rounded-lg">
                    <span>{t("Оргтехника")}</span>
                    <span className="font-mono bg-emerald-100 text-emerald-850 px-1.5 rounded-full text-[9px]">{officeEq.length}</span>
                  </div>
                  <div className="space-y-1.5 pl-0.5">
                    {officeEq.map(comp => (
                      <div 
                        key={comp.id}
                        onClick={() => onNavigateDetail('computer', comp.id)}
                        className="flex items-center justify-between p-2 bg-slate-50 hover:bg-emerald-50/30 rounded-xl text-xs cursor-pointer border border-transparent hover:border-emerald-100 transition-all shadow-2xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="p-1 px-1.5 bg-emerald-100/60 text-emerald-600 rounded-lg">{getDeviceIcon({ category: comp.category, deviceType: comp.deviceType, model: comp.model, size: 12 })}</span>
                          <div>
                            <p className="font-bold text-slate-700">{comp.category} {comp.model}</p>
                            <p className="text-[10px] text-slate-450">Инв. № {comp.inventoryNumber} • {comp.employeeName}</p>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Группа 7: Расходники */}
              {consumables.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50/50 px-2 py-1 rounded-lg">
                    <span>{t("Расходники")}</span>
                    <span className="font-mono bg-rose-100 text-rose-850 px-1.5 rounded-full text-[9px]">{consumables.length}</span>
                  </div>
                  <div className="space-y-1.5 pl-0.5">
                    {consumables.map(comp => (
                      <div 
                        key={comp.id}
                        onClick={() => onNavigateDetail('computer', comp.id)}
                        className="flex items-center justify-between p-2 bg-slate-50 hover:bg-rose-50/30 rounded-xl text-xs cursor-pointer border border-transparent hover:border-rose-100 transition-all shadow-2xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="p-1 px-1.5 bg-rose-100/60 text-rose-600 rounded-lg">{getDeviceIcon({ category: comp.category, deviceType: comp.deviceType, model: comp.model, size: 12 })}</span>
                          <div>
                            <p className="font-bold text-slate-700">{comp.category} {comp.model}</p>
                            <p className="text-[10px] text-slate-450">Инв. № {comp.inventoryNumber} • {comp.employeeName}</p>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (itemType === 'employee') {
      const assignedComps = computers.filter(c => c.employeeName === item.name);

      return (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Закрепленное оборудование ({assignedComps.length})</h4>
          
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {assignedComps.length === 0 ? (
              <p className="text-xs text-slate-400 italic">{t("За сотрудником не закреплен ни один рабочий компьютер.")}</p>
            ) : (
              assignedComps.map(comp => (
                <div 
                  key={comp.id}
                  onClick={() => onNavigateDetail('computer', comp.id)}
                  className="flex items-center justify-between p-2 bg-slate-50 hover:bg-slate-100/80 rounded-xl text-xs cursor-pointer border border-transparent hover:border-slate-205 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="p-1 px-1.5 bg-blue-105 text-blue-600 rounded-lg">{getDeviceIcon({ category: comp.category, deviceType: comp.deviceType, model: comp.model, size: 12 })}</span>
                    <div>
                      <p className="font-bold text-slate-700">{comp.category} {comp.model}</p>
                      <p className="text-[10px] text-slate-450">Инв: {comp.inventoryNumber} • Локация: {comp.objectName}</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-400" />
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    if (itemType === 'computer') {
      const staffOwner = employees.find(e => e.name === item.employeeName);
      const locObj = objects.find(o => o.name === item.objectName);

      return (
        <div className="grid grid-cols-2 gap-3 pt-2">
          {item.category !== 'Оргтехника' && (
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t("Сотрудник")}</span>
              {staffOwner ? (
                <div 
                  onClick={() => onNavigateDetail('employee', staffOwner.id)}
                  className="p-2 border border-slate-150 hover:border-blue-500 bg-slate-50 hover:bg-slate-100/50 rounded-xl flex items-center justify-between gap-1 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <User size={14} className="text-blue-500 shrink-0" />
                    <span className="text-xs font-bold text-slate-700 truncate">{staffOwner.name}</span>
                  </div>
                  <ChevronRight size={12} className="text-slate-400" />
                </div>
              ) : (
                <div className="p-2 border border-dashed border-slate-200 bg-slate-50 rounded-xl text-xs text-slate-400 italic">{t("Не назначен")}</div>
              )}
            </div>
          )}

          <div className={`space-y-1.5 ${item.category === 'Оргтехника' ? 'col-span-2' : ''}`}>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t("Расположение / Офис")}</span>
            {locObj ? (
              <div 
                onClick={() => onNavigateDetail('object', locObj.id)}
                className="p-2 border border-slate-150 hover:border-indigo-500 bg-slate-50 hover:bg-slate-100/50 rounded-xl flex items-center justify-between gap-1 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Building2 size={14} className="text-indigo-500 shrink-0" />
                  <span className="text-xs font-bold text-slate-700 truncate">{locObj.name}</span>
                </div>
                <ChevronRight size={12} className="text-slate-400" />
              </div>
            ) : (
              <div className="p-2 border border-dashed border-slate-200 bg-slate-50 rounded-xl text-xs text-slate-400 italic">{t("Не определено")}</div>
            )}
          </div>
        </div>
      );
    }

    if (itemType === 'network') {
      const locObj = objects.find(o => o.name === item.objectName);

      return (
        <div className="space-y-1.5 pt-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t("Установлено на объекте")}</span>
          {locObj ? (
            <div 
              onClick={() => onNavigateDetail('object', locObj.id)}
              className="p-2.5 border border-slate-150 hover:border-indigo-500 bg-slate-50 hover:bg-slate-100/50 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-all max-w-xs"
            >
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-indigo-505 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-700 block">{locObj.name}</span>
                  <span className="text-[10px] text-slate-450 block">{locObj.address}</span>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic">{t("Локация удалена.")}</div>
          )}
        </div>
      );
    }

    return null;
  };

  // Generate gorgeous colors for letter avatar (Employees)
  const renderAvatarInitials = (name: string) => {
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const bgColors = [
      'from-blue-500 to-indigo-600',
      'from-emerald-400 to-teal-500',
      'from-purple-500 to-indigo-500',
      'from-orange-400 to-rose-500',
      'from-fuchsia-500 to-pink-500'
    ];
    // Hash of letters to choose color consistently
    const hash = name.charCodeAt(0) % bgColors.length;
    return (
      <div className={`w-28 h-28 rounded-2xl bg-gradient-to-tr ${bgColors[hash]} shadow-md flex flex-col items-center justify-center text-white font-black text-3xl relative pointer-events-none group-hover:opacity-90 transition-opacity`}>
        {initials}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-45 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all border border-slate-100 flex flex-col max-h-[85vh]">
        
        {/* Header toolbar */}
        <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono tracking-wider bg-slate-200 text-slate-600">
              {itemType === 'computer' ? 'Компьютер' :
               itemType === 'network' ? 'Сетевое оборудование' :
               itemType === 'employee' ? 'Сотрудник' :
               itemType === 'object' ? 'Объект/Филиал' : 'Складской запас'}
            </span>
            <span className="text-[10px] text-slate-400 uppercase font-bold font-mono">ID: {item.id}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setPrintType((item.employeeName || itemType === 'employee') ? 'act' : 'card');
                setPrintModalOpen(true);
              }}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
              title={t("Сгенерировать акт приема-передачи оборудования")}
            >
              <Printer size={13} />{t("Печать Акта")}</button>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-full transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal content body (scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isViewer && (
            <div className="p-3 bg-amber-50 border border-amber-105 rounded-xl text-amber-800 text-xs font-semibold flex items-center gap-2 shadow-2xs">
              <ShieldAlert size={14} className="text-amber-500 animate-pulse" />
              <span>{t("Режим просмотра: Изменение параметров карточки и загрузка медиафайлов ограничены.")}</span>
            </div>
          )}
          <div className="flex flex-col md:flex-row gap-6">
            
            {/* Left Col: Photo uploading and management */}
            <div className="flex flex-col items-center space-y-3 shrink-0">
              <div className="relative group rounded-3xl overflow-hidden cursor-pointer">
                {imageSrc ? (
                  <img 
                    src={imageSrc} 
                    alt={item.name || item.model || item.deviceName}
                    referrerPolicy="no-referrer"
                    className="w-28 h-28 object-cover rounded-2xl shadow-md group-hover:scale-105 transition-all"
                  />
                ) : (
                  renderAvatarInitials(item.name || 'Сотрудник')
                )}

                <div 
                  onClick={() => photoInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
                >
                  <Upload size={20} />
                  <span className="text-[9px] mt-1 font-bold">{t("Изменить фото")}</span>
                </div>
              </div>

              {/* Secret File inputs */}
              <input 
                type="file" 
                ref={photoInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />

              <button
                onClick={() => photoInputRef.current?.click()}
                className="px-2.5 py-1 border border-slate-205 text-[11px] text-slate-500 hover:bg-slate-100 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Upload size={12} />{t("Загрузить фото")}</button>
            </div>

            {/* Right Col: Primary profile facts */}
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-xl font-bold text-slate-800 leading-tight">
                  {item.name || item.deviceName || (
                    (item.category === 'ПК' || item.deviceType === 'ПК')
                    ? `Системный блок ПК ${item.model ? `(${item.model})` : ''}`
                    : `${item.deviceType || item.category} ${item.model}`
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {itemType === 'computer' && `Инвентарный номер: ${item.inventoryNumber}${item.serialNumber && item.deviceType !== 'Картриджи' ? ` • S/N: ${item.serialNumber}` : ''}`}
                  {itemType === 'network' && `Спецификация: ${item.type} (IP: ${item.ipAddress})`}
                  {itemType === 'employee' && `${item.position} • отдел ${item.department}`}
                  {itemType === 'object' && `Адрес: ${item.address}`}
                  {itemType === 'warehouse' && `Складской код: ${item.inventoryNumber} • В наличии ${item.quantity} ${item.unit}`}
                </p>
              </div>

              {/* Dynamic facts widget table depending on Item Type */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4">
                {itemType === 'computer' && (
                  <>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">{t("Тип устройства")}</span>
                      <select
                        value={item.deviceType || item.category}
                        onChange={(e) => {
                          const val = e.target.value;
                          const mappedCat = mapDeviceTypeToCategory(val);
                          handleUpdate('computer', item.id, { deviceType: val, category: mappedCat });
                        }}
                        className="text-xs font-bold text-slate-700 bg-transparent border-b border-transparent hover:border-slate-350 focus:border-blue-500 focus:outline-none py-0.5 w-full"
                      >
                        <option value="Ноутбук">{t("Ноутбук")}</option>
                        <option value="ПК">{t("ПК")}</option>
                        <option value="Монитор">{t("Монитор")}</option>
                        <option value="Принтер">{t("Принтер")}</option>
                        <option value="Клавиатура">{t("Клавиатура")}</option>
                        <option value="Мышь">{t("Мышь")}</option>
                        <option value="Клавиатура + мышь">{t("Клавиатура + мышь")}</option>
                        <option value="Видеокамера">{t("Видеокамера")}</option>
                        <option value="Видеорегистратор">{t("Видеорегистратор")}</option>
                        <option value="Сетевое хранилище">{t("Сетевое хранилище")}</option>
                        <option value="Инструмент">{t("Инструмент")}</option>
                        <option value="Картриджи">{t("Картриджи")}</option>
                        <option value="Другое">{t("Другое")}</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">{t("Группа оборудования")}</span>
                      <select
                        value={item.category}
                        onChange={(e) => handleUpdate('computer', item.id, { category: e.target.value })}
                        className="text-xs font-bold text-slate-700 bg-transparent border-b border-transparent hover:border-slate-350 focus:border-blue-500 focus:outline-none py-0.5 w-full"
                      >
                        <option value="Ноутбук">{t("Ноутбуки")}</option>
                        <option value="ПК">{t("ПК")}</option>
                        <option value="Монитор">{t("Мониторы")}</option>
                        <option value="Периферия">{t("Периферия")}</option>
                        <option value="Оргтехника">{t("Оргтехника")}</option>
                        <option value="Видеонаблюдение">{t("Видеонаблюдение")}</option>
                        <option value="Расходники">{t("Расходники")}</option>
                        <option value="Другое">{t("Другое")}</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">{t("Текущий Статус")}</span>
                      <select
                        value={item.status}
                        onChange={(e) => handleUpdate('computer', item.id, { status: e.target.value })}
                        className="text-xs font-bold text-slate-700 bg-transparent border-b border-transparent hover:border-slate-350 focus:border-blue-500 focus:outline-none py-0.5 w-full"
                      >
                        <option value="В работе">{t("В работе")}</option>
                        <option value="На ремонте">{t("На ремонте")}</option>
                        <option value="На складе">{t("На складе")}</option>
                        <option value="Списано">{t("Списано")}</option>
                      </select>
                    </div>
                    {item.category !== 'Оргтехника' && (
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">{t("Сотрудник")}</span>
                        <select
                          value={item.employeeName}
                          onChange={(e) => handleUpdate('computer', item.id, { employeeName: e.target.value })}
                          className="text-xs font-bold text-slate-700 bg-transparent border-b border-transparent hover:border-slate-350 focus:border-blue-500 focus:outline-none py-0.5 w-full truncate"
                        >
                          {employees.map(e => (
                            <option key={e.id} value={e.name}>{e.name}</option>
                          ))}
                          <option value="Склад ИТ">{t("Склад ИТ")}</option>
                        </select>
                      </div>
                    )}

                    {item.category !== 'ПК' && item.category !== 'Ноутбук' && item.category !== 'Оргтехника' && (
                      (() => {
                        const isVideo = item.category === 'Видеонаблюдение';
                        if (isVideo) {
                          if (item.deviceType !== 'Видеокамера') {
                            return null;
                          }
                          return (
                            <div className="col-span-2">
                              <span className="text-[10px] text-slate-400 font-bold uppercase block">{t("Привязать к Видеорегистратору")}</span>
                              <select
                                value={item.linkedToDeviceId || 'none'}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  handleUpdate('computer', item.id, { linkedToDeviceId: val === 'none' ? undefined : val });
                                }}
                                className="text-xs font-bold text-slate-700 bg-transparent border-b border-transparent hover:border-slate-350 focus:border-blue-500 focus:outline-none py-0.5 w-full"
                              >
                                <option value="none">{t("Без привязки к устройству")}</option>
                                {computers
                                  .filter(pc => pc.category === 'Видеонаблюдение' && pc.deviceType === 'Видеорегистратор')
                                  .map(pc => (
                                    <option key={pc.id} value={pc.id}>{pc.model} ({pc.inventoryNumber})</option>
                                  ))
                                }
                              </select>
                            </div>
                          );
                        }

                        const isConsumable = item.deviceType === 'Картриджи' || item.deviceType === 'Картридж' || item.deviceType === 'картриджи' || item.deviceType === 'Расходные материалы для МФУ';
                        if (isConsumable) {
                          return (
                            <div className="col-span-2">
                              <span className="text-[10px] text-slate-400 font-bold uppercase block">{t("Привязать к МФУ")}</span>
                              <select
                                value={item.linkedToDeviceId || 'none'}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  handleUpdate('computer', item.id, { linkedToDeviceId: val === 'none' ? undefined : val });
                                }}
                                className="text-xs font-bold text-slate-700 bg-transparent border-b border-transparent hover:border-slate-350 focus:border-blue-500 focus:outline-none py-0.5 w-full"
                              >
                                <option value="none">{t("Без привязки к устройству")}</option>
                                {computers
                                  .filter(pc => pc.category === 'Оргтехника')
                                  .map(pc => (
                                    <option key={pc.id} value={pc.id}>{pc.model} ({pc.inventoryNumber})</option>
                                  ))
                                }
                              </select>
                            </div>
                          );
                        }

                        return (
                          <div className="col-span-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">{t("Привязать к ПК / Ноутбуку")}</span>
                            <select
                              value={item.linkedToDeviceId || 'none'}
                              onChange={(e) => {
                                const val = e.target.value;
                                  handleUpdate('computer', item.id, { linkedToDeviceId: val === 'none' ? undefined : val });
                              }}
                              className="text-xs font-bold text-slate-700 bg-transparent border-b border-transparent hover:border-slate-350 focus:border-blue-500 focus:outline-none py-0.5 w-full"
                            >
                              <option value="none">{t("Без привязки к устройству")}</option>
                              {computers
                                .filter(pc => pc.category === 'ПК' || pc.category === 'Ноутбук')
                                .map(pc => (
                                  <option key={pc.id} value={pc.id}>{pc.model} ({pc.inventoryNumber})</option>
                                ))
                              }
                            </select>
                          </div>
                        );
                      })()
                    )}
                  </>
                )}

                {itemType === 'network' && (
                  <>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">{t("Тип Устройства")}</span>
                      <strong className="text-xs font-bold text-slate-700">{item.type}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">{t("Установленное Количество")}</span>
                      <strong className="text-xs font-bold text-slate-700">{item.quantity} ед.</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">{t("Инвентарный №")}</span>
                      <input
                        type="text"
                        placeholder="NET-0001"
                        value={item.inventoryNumber || ''}
                        onChange={(e) => handleUpdate('network', item.id, { inventoryNumber: e.target.value })}
                        className="text-xs font-bold font-mono text-slate-705 bg-transparent border-b border-transparent hover:border-slate-350 focus:outline-none py-0.5 w-full"
                      />
                    </div>
                  </>
                )}

                {itemType === 'employee' && (
                  <>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">{t("Департамент")}</span>
                      <select
                        value={item.department}
                        onChange={(e) => handleUpdate('employee', item.id, { department: e.target.value })}
                        className="text-xs font-bold text-slate-700 bg-transparent border-b border-transparent hover:border-slate-350 focus:outline-none py-0.5"
                      >
                        <option value="IT">IT</option>
                        <option value="Продажи">{t("Продажи")}</option>
                        <option value="Разработка">{t("Разработка")}</option>
                        <option value="Бухгалтерия">{t("Бухгалтерия")}</option>
                        <option value="Маркетинг">{t("Маркетинг")}</option>
                        <option value="Дизайн">{t("Дизайн")}</option>
                        <option value="Тестирование">{t("Тестирование")}</option>
                        <option value="Руководство">{t("Руководство")}</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">{t("Должность")}</span>
                      <input
                        type="text"
                        value={item.position}
                        onChange={(e) => handleUpdate('employee', item.id, { position: e.target.value })}
                        className="text-xs font-bold text-slate-705 bg-transparent border-b border-transparent hover:border-slate-350 focus:outline-none py-0.5 w-full"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">{t("Эл. почта")}</span>
                      <input
                        type="email"
                        placeholder="mail@corp.ru"
                        value={item.email || ''}
                        onChange={(e) => handleUpdate('employee', item.id, { email: e.target.value })}
                        className="text-xs font-bold text-slate-705 bg-transparent border-b border-transparent hover:border-slate-350 focus:outline-none py-0.5 w-full font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">{t("Телефон")}</span>
                      <input
                        type="text"
                        placeholder="+7 (900) 123-45-67"
                        value={item.phone || ''}
                        onChange={(e) => handleUpdate('employee', item.id, { phone: e.target.value })}
                        className="text-xs font-bold text-slate-705 bg-transparent border-b border-transparent hover:border-slate-350 focus:outline-none py-0.5 w-full font-mono"
                      />
                    </div>
                  </>
                )}

                {itemType === 'object' && (
                  <>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">{t("Название филиала")}</span>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdate('object', item.id, { name: e.target.value })}
                        className="text-xs font-bold text-slate-705 bg-transparent border-b border-transparent hover:border-slate-350 focus:outline-none py-0.5 w-full"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">{t("Адрес расположения")}</span>
                      <input
                        type="text"
                        value={item.address}
                        onChange={(e) => handleUpdate('object', item.id, { address: e.target.value })}
                        className="text-xs font-bold text-slate-705 bg-transparent border-b border-transparent hover:border-slate-350 focus:outline-none py-0.5 w-full"
                      />
                    </div>
                  </>
                )}

                {itemType === 'warehouse' && (
                  <>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">{t("Стоимость единицы")}</span>
                      <strong className="text-xs font-mono font-bold text-slate-700">
                        {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(item.costPerUnit)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">{t("Капитализация запаса")}</span>
                      <strong className="text-xs font-mono font-bold text-emerald-600 block">
                        {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(item.costPerUnit * item.quantity)}
                      </strong>
                    </div>
                  </>
                )}
              </div>

              {renderRelatedSection()}
            </div>
          </div>

          {(itemType === 'computer' || itemType === 'network' || itemType === 'warehouse' || itemType === 'employee') && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex border-b border-slate-100 pb-0.5 gap-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('info')}
                  className={`text-xs font-bold hover:text-slate-850 pb-2 border-b-2 transition-all cursor-pointer ${
                    activeTab === 'info' ? 'border-blue-600 text-slate-800' : 'border-transparent text-slate-400'
                  }`}
                >{t("Обзор")}</button>
                <button
                  type="button"
                  onClick={() => setActiveTab('pdfs')}
                  className={`text-xs font-bold hover:text-slate-850 pb-2 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'pdfs' ? 'border-blue-600 text-slate-850' : 'border-transparent text-slate-400'
                  }`}
                >
                  Документы PDF ({item.pdfFiles?.length || 0})
                </button>
              </div>

              {activeTab === 'pdfs' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-707 block">
                        Прикрепить документацию {itemType === 'employee' ? 'сотрудника' : 'к оборудованию'}
                      </span>
                      <span className="text-[10px] text-slate-400 block leading-normal">
                        {itemType === 'employee' 
                          ? 'Вы можете прикрепить трудовые договора, инструкции, дипломы, сканы паспорта или заявления в формате PDF.'
                          : 'Вы можете прикрепить инструкции, гарантийные талоны, накладные или схемы сетей в формате PDF.'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                      <select
                        value={selectedGroup}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-205 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500/10 focus:outline-none text-slate-705 shadow-2xs cursor-pointer"
                      >
                        {(itemType === 'employee' ? employeeGroups : equipmentGroups).map(g => (
                          <option key={g} value={g}>{t(g)}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => pdfInputRef.current?.click()}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm select-none"
                      >
                        <Plus size={14} />{t("Добавить PDF")}</button>
                    </div>
                    <input 
                      type="file" 
                      ref={pdfInputRef}
                      onChange={handlePdfUpload}
                      accept=".pdf"
                      className="hidden"
                    />
                  </div>

                  {/* Attached PDF document list grouped by categories */}
                  <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                    {(!item.pdfFiles || item.pdfFiles.length === 0) ? (
                      <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center space-y-1">
                        <FileText className="text-slate-300 mx-auto" size={32} />
                        <p className="text-xs text-slate-400 italic">{t("Нет прикрепленных файлов.")}</p>
                      </div>
                    ) : (
                      (itemType === 'employee' ? employeeGroups : equipmentGroups).map(group => {
                        const filesInGroup = (item.pdfFiles || []).filter((pdf: any) => {
                          const fileGroup = pdf.group || (itemType === 'employee' ? 'Трудовые договора' : 'Инструкции и руководства');
                          return fileGroup === group;
                        });

                        if (filesInGroup.length === 0) return null;

                        return (
                          <div key={group} className="space-y-2">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-md inline-block">
                              {group} ({filesInGroup.length})
                            </h4>
                            <div className="space-y-2 pl-0.5">
                              {filesInGroup.map((pdf: any, idx: number) => {
                                // Find overall index in main item.pdfFiles array to run delete correctly
                                const mainIndex = (item.pdfFiles || []).findIndex((p: any) => p === pdf);

                                return (
                                  <div 
                                    key={pdf.name + '-' + idx}
                                    className="flex items-center justify-between p-3 bg-white border border-slate-150 rounded-2xl hover:shadow-xs transition-shadow"
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="p-2 bg-rose-50 text-rose-500 rounded-xl"><FileText size={18} /></span>
                                      <div>
                                        <p className="text-xs font-bold text-slate-707 leading-tight truncate max-w-[280px]">{pdf.name}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">Размер: {pdf.size} {pdf.dateUploaded && `• Загружен: ${pdf.dateUploaded}`}</p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                      <button
                                        onClick={() => handlePreviewPdf(pdf)}
                                        className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer text-[10px] font-bold flex items-center gap-1"
                                        title={t("Просмотреть")}
                                      >
                                        <ExternalLink size={12} />{t("Открыть")}</button>
                                      <button
                                        onClick={() => handleDownloadPdf(pdf)}
                                        className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                                        title={t("Скачать на ПК")}
                                      >
                                        <Download size={13} />
                                      </button>
                                      {confirmDeletePdfIndex === (mainIndex >= 0 ? mainIndex : idx) ? (
                                        <div className="flex items-center gap-1 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200 text-[10px] animate-fade-in shadow-xs shrink-0 z-10">
                                          <span className="text-rose-700 font-bold">{t("Вы уверены?")}</span>
                                          <button
                                            onClick={() => {
                                              handleDeletePdf(mainIndex >= 0 ? mainIndex : idx);
                                              setConfirmDeletePdfIndex(null);
                                            }}
                                            className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold cursor-pointer transition-colors"
                                          >{t("Да")}</button>
                                          <button
                                            onClick={() => setConfirmDeletePdfIndex(null)}
                                            className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-bold cursor-pointer transition-colors"
                                          >{t("Нет")}</button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => setConfirmDeletePdfIndex(mainIndex >= 0 ? mainIndex : idx)}
                                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                                          title={t("Удалить")}
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    )}

                    {/* Any unassigned/older pdf files that didn't match any groups */}
                    {(item.pdfFiles || []).some((pdf: any) => {
                      const fileGroup = pdf.group || (itemType === 'employee' ? 'Трудовые договора' : 'Инструкции и руководства');
                      return !(itemType === 'employee' ? employeeGroups : equipmentGroups).includes(fileGroup);
                    }) && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-md inline-block">{t("Разные документы")}</h4>
                        <div className="space-y-2 pl-0.5">
                          {(item.pdfFiles || []).filter((pdf: any) => {
                            const fileGroup = pdf.group || (itemType === 'employee' ? 'Трудовые договора' : 'Инструкции и руководства');
                            return !(itemType === 'employee' ? employeeGroups : equipmentGroups).includes(fileGroup);
                          }).map((pdf: any, idx: number) => {
                            const mainIndex = (item.pdfFiles || []).findIndex((p: any) => p === pdf);

                            return (
                              <div 
                                key={pdf.name + '-misc-' + idx}
                                className="flex items-center justify-between p-3 bg-white border border-slate-150 rounded-2xl hover:shadow-xs transition-shadow"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="p-2 bg-rose-50 text-rose-500 rounded-xl"><FileText size={18} /></span>
                                  <div>
                                    <p className="text-xs font-bold text-slate-707 leading-tight truncate max-w-[280px]">{pdf.name}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">Размер: {pdf.size} {pdf.dateUploaded && `• Загружен: ${pdf.dateUploaded}`}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handlePreviewPdf(pdf)}
                                    className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer text-[10px] font-bold flex items-center gap-1"
                                    title={t("Просмотреть")}
                                  >
                                    <ExternalLink size={12} />{t("Открыть")}</button>
                                  <button
                                    onClick={() => handleDownloadPdf(pdf)}
                                    className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                                    title={t("Скачать на ПК")}
                                  >
                                    <Download size={13} />
                                  </button>
                                  {confirmDeletePdfIndex === (mainIndex >= 0 ? mainIndex : idx) ? (
                                    <div className="flex items-center gap-1 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200 text-[10px] animate-fade-in shadow-xs shrink-0 z-10">
                                      <span className="text-rose-700 font-bold">{t("Вы уверены?")}</span>
                                      <button
                                        onClick={() => {
                                          handleDeletePdf(mainIndex >= 0 ? mainIndex : idx);
                                          setConfirmDeletePdfIndex(null);
                                        }}
                                        className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold cursor-pointer transition-colors"
                                      >{t("Да")}</button>
                                      <button
                                        onClick={() => setConfirmDeletePdfIndex(null)}
                                        className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-bold cursor-pointer transition-colors"
                                      >{t("Нет")}</button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setConfirmDeletePdfIndex(mainIndex >= 0 ? mainIndex : idx)}
                                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                                      title={t("Удалить")}
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'info' && (
                <div className="space-y-6 animate-fade-in text-xs text-slate-750">
                  {/* Computer: replaced parts & cartridges */}
                  {itemType === 'computer' && (
                    <div className={(item.category === 'Оргтехника' || item.category === 'ПК' || item.category === 'Ноутбук' || item.deviceType === 'ПК' || item.deviceType === 'Ноутбук') ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "grid grid-cols-1 gap-6"}>
                      {/* Left: Replaced parts */}
                      {item.category === 'Расходники' ? (
                        (() => {
                          const printers = computers.filter(c => c.category === 'Оргтехника');
                          const linkedPrinters = computers.filter(c => 
                            c.category === 'Оргтехника' && 
                            (c.cartridges || []).some((cart: any) => 
                              cart.model.toLowerCase().includes(item.model.toLowerCase()) || 
                              item.model.toLowerCase().includes(cart.model.toLowerCase())
                            )
                          );

                          return (
                            <div className="space-y-6">
                              {/* Alert info banner */}
                              <div className="p-3.5 bg-blue-50/60 border border-blue-150/85 rounded-xl text-blue-800 text-xs flex gap-2.5 items-start">
                                <Printer className="text-blue-500 shrink-0 mt-0.5" size={16} />
                                <div>
                                  <p className="font-bold">Расходный материал (Картридж) — «{item.model}»</p>
                                  <p className="text-slate-500 mt-0.5 text-[11px] leading-relaxed">{t("Для расходных материалов замена запчастей и ремонт не предусмотрены. Вы можете")}<strong>{t("привязать (закрепить)")}</strong> этот тип картриджа за печатным устройством 
                                    из каталога «Оргтехника». Это автоматически создаст запись в его истории расходных материалов.
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                {/* Form for binding a consumable */}
                                <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-2xs space-y-4">
                                  <div className="border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                                    <Plus size={14} className="text-emerald-500" />
                                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">{t("Привязать к оргтехнике")}</h4>
                                  </div>

                                  {printers.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic py-2">{t("В системе еще не создано принтеров или МФУ (устройств класса «Оргтехника») для привязки. Сначала добавьте оргтехнику в каталог.")}</p>
                                  ) : (
                                    <div className="space-y-3 text-[11px]">
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">{t("Выберите принтер / МФУ")}</label>
                                        <select
                                          value={selectedPrinterId}
                                          onChange={(e) => setSelectedPrinterId(e.target.value)}
                                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-xs text-slate-755 focus:ring-1 focus:ring-blue-500/20 focus:outline-none"
                                        >
                                          <option value="">{t("-- Выберите печатное устройство --")}</option>
                                          {printers.map((p) => (
                                            <option key={p.id} value={p.id}>
                                              {p.model} ({p.inventoryNumber}) • {p.objectName}
                                            </option>
                                          ))}
                                        </select>
                                      </div>

                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">{t("Цвет картриджа")}</label>
                                          <select
                                            value={bindColor}
                                            onChange={(e) => setBindColor(e.target.value)}
                                            className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white text-xs text-slate-755 focus:outline-none cursor-pointer"
                                          >
                                            <option value="Черный">{t("Черный (Black)")}</option>
                                            <option value="Cyan">{t("Cyan (Голубой)")}</option>
                                            <option value="Magenta">{t("Magenta (Пурпурный)")}</option>
                                            <option value="Yellow">{t("Yellow (Желтый)")}</option>
                                            <option value="Разноцветный">{t("Разноцветный")}</option>
                                          </select>
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">{t("Состояние")}</label>
                                          <select
                                            value={bindStatus}
                                            onChange={(e) => setBindStatus(e.target.value as any)}
                                            className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white text-xs text-slate-755 focus:outline-none cursor-pointer"
                                          >
                                            <option value="Заправлен">{t("Заправлен")}</option>
                                            <option value="Пустой">{t("Пустой")}</option>
                                            <option value="На заправке">{t("На заправке")}</option>
                                          </select>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">{t("Дата установки")}</label>
                                          <input
                                            type="date"
                                            value={bindDate}
                                            onChange={(e) => setBindDate(e.target.value)}
                                            className="w-full px-2 py-1 border border-slate-200 rounded bg-white text-xs text-slate-755 focus:outline-none font-mono"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">{t("Статус расходного мат.")}</label>
                                          <select
                                            value={autoUpdateConsumableStatus}
                                            onChange={(e) => setAutoUpdateConsumableStatus(e.target.value)}
                                            className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white text-xs text-slate-755 focus:outline-none cursor-pointer"
                                          >
                                            <option value="in_work">Изменить на "В работе"</option>
                                            <option value="written_off">Списать ("Списано")</option>
                                            <option value="no">{t("Оставить без изменений")}</option>
                                          </select>
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        disabled={isViewer}
                                        onClick={() => {
                                          if (!selectedPrinterId) {
                                            alert('Пожалуйста, выберите принтер или МФУ из списка!');
                                            return;
                                          }
                                          const targetPrinter = computers.find(c => c.id === selectedPrinterId);
                                          if (!targetPrinter) {
                                            alert('Указанное устройство Оргтехники не найдено.');
                                            return;
                                          }

                                          // Append cartridge to printer list
                                          const existingCartridges = targetPrinter.cartridges || [];
                                          const newCartridge = {
                                            id: `cart-${Date.now()}`,
                                            model: item.model, // Cartridge model is inherited from current consumable model
                                            status: bindStatus,
                                            color: bindColor,
                                            lastServiceDate: bindDate
                                          };
                                          
                                          // Update target printer
                                          handleUpdate('computer', selectedPrinterId, {
                                            cartridges: [...existingCartridges, newCartridge]
                                          });

                                          // Optionally update the status of this consumable itself
                                          if (autoUpdateConsumableStatus === 'in_work') {
                                            handleUpdate('computer', item.id, { status: 'В работе' });
                                          } else if (autoUpdateConsumableStatus === 'written_off') {
                                            handleUpdate('computer', item.id, { status: 'Списано' });
                                          }

                                          alert(`Расходник "${item.model}" успешно привязан к "${targetPrinter.model}"!`);
                                          setSelectedPrinterId('');
                                        }}
                                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer mt-2 shadow-sm flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <Plus size={13} />{t("Выполнить привязку")}</button>
                                    </div>
                                  )}
                                </div>

                                {/* Linked places / Back ties list */}
                                <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-4">
                                  <div className="border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                                    <Printer size={14} className="text-blue-500" />
                                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Где установлен ({linkedPrinters.length})</h4>
                                  </div>

                                  {linkedPrinters.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic py-6 text-center">{t("Этот расходный материал в настоящий момент не числится установленным ни на одном печатном оборудовании.")}</p>
                                  ) : (
                                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                                      <p className="text-[10px] text-slate-400 leading-relaxed mb-2">{t("Данный расходник обнаружен в конфигурации следующих устройств оргтехники:")}</p>
                                      {linkedPrinters.map((p) => {
                                        // Find specific cartridges of this type
                                        const matchingCarts = (p.cartridges || []).filter((c: any) =>
                                          c.model.toLowerCase().includes(item.model.toLowerCase()) ||
                                          item.model.toLowerCase().includes(c.model.toLowerCase())
                                        );

                                        return (
                                          <div key={p.id} className="p-2.5 bg-white border border-slate-100 rounded-xl flex flex-col gap-1.5 shadow-2xs">
                                            <div className="flex items-start justify-between gap-2">
                                              <div className="min-w-0">
                                                <span 
                                                  onClick={() => onNavigateDetail?.('computer', p.id)} 
                                                  className="font-bold text-slate-700 text-[11px] hover:text-blue-600 hover:underline transition-colors cursor-pointer block truncate"
                                                >
                                                  {p.model}
                                                </span>
                                                <span className="text-[9px] text-slate-400 font-mono block truncate">
                                                  Инв: {p.inventoryNumber} • {p.objectName}
                                                </span>
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => onNavigateDetail?.('computer', p.id)}
                                                className="text-[9px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md transition-colors cursor-pointer shrink-0"
                                              >{t("Перейти")}</button>
                                            </div>

                                            <div className="mt-1 border-t border-slate-50 pt-1.5 space-y-1">
                                              {matchingCarts.map((c: any, idx: number) => {
                                                let badgeColor = '';
                                                if (c.status === 'Заправлен') badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                                                else if (c.status === 'Пустой') badgeColor = 'bg-rose-50 text-rose-800 border-rose-200';
                                                else badgeColor = 'bg-amber-50 text-amber-800 border-amber-250';

                                                return (
                                                  <div key={c.id || idx} className="flex justify-between items-center text-[10px] pl-2 border-l border-emerald-500/40">
                                                    <div className="flex items-center gap-1 min-w-0 mr-2">
                                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                                      <span className="text-slate-500 truncate text-[9px]">Цвет: {c.color || 'Черный'}</span>
                                                      <span className="text-slate-350 shrink-0">•</span>
                                                      <span className="text-slate-400 text-[9px] shrink-0 font-mono">{c.lastServiceDate || 'Нет даты'}</span>
                                                    </div>
                                                    <span className={`px-1 rounded text-[8px] font-semibold border ${badgeColor} shrink-0`}>
                                                      {c.status}
                                                    </span>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                    );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                              <Wrench size={14} className="text-slate-500" />{t("Замена комплектующих и ремонт")}</h4>
                            <span className="font-mono bg-slate-100 text-slate-650 px-1.5 py-0.5 rounded-md text-[10px] font-bold">
                              {(item.replacedComponents || []).length}
                            </span>
                          </div>

                          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                            {(!item.replacedComponents || item.replacedComponents.length === 0) ? (
                              <p className="text-xs text-slate-400 italic py-4 text-center">{t("Ремонты или замены запчастей не зафиксированы. Устройство находится в исходной заводской комплектации.")}</p>
                            ) : (
                              item.replacedComponents.map((comp: any) => (
                                <div key={comp.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100/80 hover:shadow-2xs transition-shadow relative group">
                                  <div className="flex justify-between items-start">
                                    <span className="font-bold text-slate-800 text-[11px] leading-tight flex items-center gap-1">
                                      <Cpu size={10} className="text-blue-500" />
                                      {comp.name}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-medium font-mono">{comp.date}</span>
                                  </div>
                                  <div className="mt-1.5 space-y-0.5 pl-3 border-l-2 border-slate-200">
                                    <div className="text-[10px] text-slate-500">{t("Было:")}<span className="font-medium text-slate-700 font-mono">{comp.oldDetails}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500">{t("Новое:")}<span className="font-bold text-emerald-700 font-mono">{comp.newDetails}</span>
                                    </div>
                                    {comp.reason && (
                                      <div className="text-[9.5px] text-slate-400 italic mt-0.5">
                                        Причина: {comp.reason}
                                      </div>
                                    )}
                                  </div>
                                  {!isViewer && (
                                    <div className="absolute top-2 right-2 flex items-center gap-1">
                                      <button
                                        onClick={() => {
                                          setEditingCompId(comp.id);
                                          setCompName(comp.name);
                                          setCompOldDetails(comp.oldDetails || '');
                                          setCompNewDetails(comp.newDetails);
                                          setCompReason(comp.reason || '');
                                          setCompDate(comp.date || new Date().toISOString().split('T')[0]);
                                        }}
                                        className="p-1 bg-white hover:bg-blue-50 text-blue-500 hover:text-blue-700 rounded border border-slate-200 transition-all cursor-pointer inline-flex items-center justify-center"
                                        title={t("Редактировать замену")}
                                      >
                                        <Edit2 size={11} />
                                      </button>
                                      {confirmDeleteCompId === comp.id ? (
                                        <div className="flex items-center gap-1 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 text-[10px] animate-fade-in z-20 shadow-xs">
                                          <span className="text-rose-700 font-bold">{t("Удалить?")}</span>
                                          <button
                                            onClick={() => {
                                              const filtered = item.replacedComponents.filter((rc: any) => rc.id !== comp.id);
                                              handleUpdate('computer', item.id, { replacedComponents: filtered });
                                              if (editingCompId === comp.id) {
                                                setEditingCompId(null);
                                                setCompName('');
                                                setCompOldDetails('');
                                                setCompNewDetails('');
                                                setCompReason('');
                                              }
                                              setConfirmDeleteCompId(null);
                                            }}
                                            className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold cursor-pointer transition-colors"
                                          >{t("Да")}</button>
                                          <button
                                            onClick={() => setConfirmDeleteCompId(null)}
                                            className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-bold cursor-pointer transition-colors"
                                          >{t("Нет")}</button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => setConfirmDeleteCompId(comp.id)}
                                          className="p-1 bg-white hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded border border-slate-200 transition-all cursor-pointer inline-flex items-center justify-center"
                                          title={t("Удалить замену")}
                                        >
                                          <Trash2 size={11} />
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>

                          {/* Add component replacement form */}
                          {!isViewer && (
                            <div className={`p-3 border rounded-xl space-y-2.5 shadow-2xs ${editingCompId ? 'bg-amber-50/30 border-amber-100' : 'bg-blue-50/30 border-blue-100'}`}>
                              <div className="flex justify-between items-center">
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${editingCompId ? 'text-amber-800' : 'text-blue-800'}`}>
                                  {editingCompId ? 'Редактировать замену комплектующей' : 'Зафиксировать замену комплектующей'}
                                </span>
                                {editingCompId && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCompId(null);
                                      setCompName('');
                                      setCompOldDetails('');
                                      setCompNewDetails('');
                                      setCompReason('');
                                    }}
                                    className="text-[9.5px] font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                                  >{t("Отмена")}</button>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  placeholder={t("Например: SSD диск")}
                                  value={compName}
                                  onChange={(e) => setCompName(e.target.value)}
                                  className="px-2 py-1.5 border border-slate-205 rounded bg-white text-[11px] focus:outline-none"
                                />
                                <input
                                  type="date"
                                  value={compDate}
                                  onChange={(e) => setCompDate(e.target.value)}
                                  className="px-2 py-1.5 border border-slate-205 rounded bg-white text-[11px] focus:outline-none font-mono text-slate-600"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  placeholder={t("Было: Kingmax 120GB")}
                                  value={compOldDetails}
                                  onChange={(e) => setCompOldDetails(e.target.value)}
                                  className="px-2 py-1.5 border border-slate-205 rounded bg-white text-[11px] focus:outline-none"
                                />
                                <input
                                  type="text"
                                  placeholder={t("Стало: Kingston 480GB")}
                                  value={compNewDetails}
                                  onChange={(e) => setCompNewDetails(e.target.value)}
                                  className="px-2 py-1.5 border border-slate-205 rounded bg-white text-[11px] focus:outline-none"
                                />
                              </div>
                              <input
                                type="text"
                                placeholder={t("Причина замены (например, Износ или Апгрейд)")}
                                value={compReason}
                                onChange={(e) => setCompReason(e.target.value)}
                                className="w-full px-2 py-1.5 border border-slate-205 rounded bg-white text-[11px] focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (!compName.trim() || !compNewDetails.trim()) {
                                    alert('Укажите название комплектующей и характеристики заменяемой детали!');
                                    return;
                                  }
                                  if (editingCompId) {
                                    const list = (item.replacedComponents || []).map((rc: any) =>
                                      rc.id === editingCompId
                                        ? { ...rc, name: compName, oldDetails: compOldDetails || 'Не указано', newDetails: compNewDetails, date: compDate, reason: compReason || undefined }
                                        : rc
                                    );
                                    handleUpdate('computer', item.id, { replacedComponents: list });
                                    setEditingCompId(null);
                                  } else {
                                    const list = [
                                      ...(item.replacedComponents || []),
                                      {
                                        id: `rep-${Date.now()}`,
                                        name: compName,
                                        oldDetails: compOldDetails || 'Не указано',
                                        newDetails: compNewDetails,
                                        date: compDate,
                                        reason: compReason || undefined
                                      }
                                    ];
                                    handleUpdate('computer', item.id, { replacedComponents: list });
                                  }
                                  setCompName('');
                                  setCompOldDetails('');
                                  setCompNewDetails('');
                                  setCompReason('');
                                }}
                                className={`w-full py-1.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                                  editingCompId
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                                }`}
                              >
                                {editingCompId ? 'Сохранить изменения' : 'Сохранить замену'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Right: Cartridges tracking */}
                      {item.category === 'Оргтехника' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                              <Printer size={14} className="text-slate-500" />{t("Учет картриджей (Принтеры и МФУ)")}</h4>
                            <span className="font-mono bg-slate-100 text-slate-650 px-1.5 py-0.5 rounded-md text-[10px] font-bold">
                              {(item.cartridges || []).length}
                            </span>
                          </div>

                          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                            {(!item.cartridges || item.cartridges.length === 0) ? (
                              <p className="text-xs text-slate-400 italic py-4 text-center">{t("Прикрепленные картриджи не найдены. Вы можете поставить расходники на контроль.")}</p>
                            ) : (
                              item.cartridges.map((cart: any) => {
                                let badgeColor = '';
                                if (cart.status === 'Заправлен') badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                                else if (cart.status === 'Пустой') badgeColor = 'bg-rose-50 text-rose-800 border-rose-200';
                                else badgeColor = 'bg-amber-50 text-amber-800 border-amber-250';

                                // Color dot styling helper
                                let dotClass = 'bg-slate-400';
                                if (cart.color === 'Черный') dotClass = 'bg-slate-900 border border-slate-750';
                                else if (cart.color === 'Cyan') dotClass = 'bg-sky-400 border border-sky-500';
                                else if (cart.color === 'Magenta') dotClass = 'bg-pink-500 border border-pink-600';
                                else if (cart.color === 'Yellow') dotClass = 'bg-yellow-300 border border-yellow-400';
                                else if (cart.color === 'Разноцветный') dotClass = 'bg-linear-to-r from-sky-400 via-pink-400 to-yellow-300';

                                return (
                                  <div key={cart.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between relative group">
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} title={`$Цвет: ${t(cart.color || "Черный")}`} />
                                        <p className="font-bold text-slate-800 text-[11px] leading-tight">{cart.model}</p>
                                      </div>
                                      <p className="text-[9px] text-slate-400 font-medium font-mono mt-1.5 flex items-center gap-1.5 flex-wrap">
                                        <Clock size={8} /> Обслуживание: {t(cart.lastServiceDate || "Не указано")}
                                        <span className="text-slate-300">•</span>
                                        <span className="text-slate-500 font-sans">Цвет: {t(cart.color || "Черный")}</span>
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <select
                                        value={cart.status}
                                        onChange={(e) => {
                                          const updated = item.cartridges.map((c: any) =>
                                            c.id === cart.id ? { ...c, status: e.target.value, lastServiceDate: new Date().toISOString().split('T')[0] } : c
                                          );
                                          handleUpdate('computer', item.id, { cartridges: updated });
                                        }}
                                        disabled={isViewer}
                                        className={`px-2 py-0.5 rounded border text-[9px] font-bold cursor-pointer transition-all ${badgeColor}`}
                                      >
                                        <option value="Заправлен">{t("Заправлен")}</option>
                                        <option value="Пустой">{t("Пустой")}</option>
                                        <option value="На заправке">{t("На заправке")}</option>
                                      </select>

                                      {!isViewer && (
                                        <button
                                          onClick={() => {
                                            if (true) {
                                              const filtered = item.cartridges.filter((rc: any) => rc.id !== cart.id);
                                              handleUpdate('computer', item.id, { cartridges: filtered });
                                            }
                                          }}
                                          className="p-1.5 bg-white hover:bg-rose-50 text-slate-300 hover:text-rose-550 rounded border border-slate-150 cursor-pointer"
                                          title={t("Списать картридж")}
                                        >
                                          <Trash2 size={9} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}

                      {supportsComputerSpecifications({
                        category: item.category,
                        deviceType: item.deviceType,
                      }) && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                              <Cpu size={14} className="text-amber-500" />{t("Спецификация комплектующих и документы")}</h4>
                          </div>

                          <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4 space-y-4">
                            {/* Hardware Configuration */}
                            <div className="space-y-2.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1">{t("Аппаратные компоненты")}</span>
                              
                              <div className="grid grid-cols-2 gap-3 text-[11px]">
                                <div className="space-y-0.5">
                                  <span className="text-slate-400 block font-bold text-[9px] uppercase">{t("Процессор (CPU):")}</span>
                                  <span className="font-semibold text-slate-705">
                                    {item.cpuModel || <span className="text-slate-400 italic font-medium">{t("Не указан")}</span>}
                                    {item.cpuSerial && <span className="text-slate-400 text-[10px] block font-mono">S/N: {item.cpuSerial}</span>}
                                  </span>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-slate-400 block font-bold text-[9px] uppercase">{t("Материнская плата:")}</span>
                                  <span className="font-semibold text-slate-705">
                                    {item.motherboardModel || <span className="text-slate-400 italic font-medium">{t("Не указана")}</span>}
                                    {item.motherboardSerial && <span className="text-slate-400 text-[10px] block font-mono">S/N: {item.motherboardSerial}</span>}
                                  </span>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-slate-400 block font-bold text-[9px] uppercase">{t("Оперативная память (RAM):")}</span>
                                  <span className="font-semibold text-slate-705">
                                    {item.ramModel || <span className="text-slate-400 italic font-medium">{t("Не указана")}</span>}
                                    {item.ramSerial && <span className="text-slate-400 text-[10px] block font-mono">S/N: {item.ramSerial}</span>}
                                  </span>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-slate-400 block font-bold text-[9px] uppercase">{t("Накопитель (SSD / HDD):")}</span>
                                  <span className="font-semibold text-slate-705">
                                    {item.hddModel || <span className="text-slate-400 italic font-medium">{t("Не указан")}</span>}
                                    {item.hddSerial && <span className="text-slate-400 text-[10px] block font-mono">S/N: {item.hddSerial}</span>}
                                  </span>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-slate-400 block font-bold text-[9px] uppercase">{t("Видеокарта (GPU):")}</span>
                                  <span className="font-semibold text-slate-705">
                                    {item.gpuModel || <span className="text-slate-400 italic font-medium">{t("Не указана")}</span>}
                                    {item.gpuSerial && <span className="text-slate-400 text-[10px] block font-mono">S/N: {item.gpuSerial}</span>}
                                  </span>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-slate-400 block font-bold text-[9px] uppercase">{t("Блок питания (PSU):")}</span>
                                  <span className="font-semibold text-slate-705">
                                    {item.powerSupplyModel || <span className="text-slate-400 italic font-medium">{t("Не указан")}</span>}
                                    {item.powerSupplySerial && <span className="text-slate-400 text-[10px] block font-mono">S/N: {item.powerSupplySerial}</span>}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="space-y-0.5 pt-1.5 border-t border-slate-100 text-[11px]">
                                <span className="text-slate-400 block font-bold text-[9px] uppercase">{t("Корпус (Case):")}</span>
                                <span className="font-semibold text-slate-705">{item.caseModel || <span className="text-slate-400 italic font-medium">{t("Не указан")}</span>}</span>
                              </div>
                            </div>

                            {/* Documents Credentials */}
                            <div className="space-y-2.5 pt-2 border-t border-slate-100">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1">{t("Реквизиты документов")}</span>
                              
                              <div className="space-y-2 text-[11px]">
                                <div className="space-y-0.5 bg-white p-2 rounded-lg border border-slate-100">
                                  <span className="text-slate-400 block font-bold text-[9px] uppercase">{t("Оплаченный счет:")}</span>
                                  <span className="font-medium text-slate-705 block leading-relaxed">{item.invoiceInfo || <span className="text-slate-400 italic">{t("Счет не прописан")}</span>}</span>
                                </div>
                                
                                <div className="space-y-0.5 bg-white p-2 rounded-lg border border-slate-100">
                                  <span className="text-slate-400 block font-bold text-[9px] uppercase">{t("Служебная записка:")}</span>
                                  <span className="font-medium text-slate-705 block leading-relaxed">{item.memoInfo || <span className="text-slate-400 italic">{t("Реквизиты записки не указаны")}</span>}</span>
                                </div>

                                {true && (
                                  <div className="space-y-0.5 bg-white p-2 rounded-lg border border-slate-100">
                                    <span className="text-slate-400 block font-bold text-[9px] uppercase">{t("Гарантийный талон:")}</span>
                                    <span className="font-medium text-slate-705 block leading-relaxed">{item.warrantyInfo || <span className="text-slate-400 italic">{t("Гарантия не указана")}</span>}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Network: status layout switch */}
                  {itemType === 'network' && (() => {
                    const portsCount = item.portsCount ?? 24;
                    const workingPorts = item.workingPorts ?? Array.from({ length: portsCount }, (_, i) => {
                      const portNum = i + 1;
                      return (portNum % 3 !== 0 && portNum % 5 !== 0) ? portNum : 0;
                    }).filter(p => p > 0);

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl border border-slate-800 space-y-4 shadow-md md:col-span-2">
                          <div className="flex items-center justify-between col-span-2">
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{t("Физическое состояние портов")}</span>
                              {!isViewer && <span className="text-[8px] text-slate-505">{t("Нажмите на порт для смены его статуса")}</span>}
                            </div>
                          </div>
                          <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 p-2 bg-slate-950 rounded-xl border border-slate-800 font-mono max-h-[220px] overflow-y-auto">
                            {Array.from({ length: portsCount }).map((_, i) => {
                              const portNum = i + 1;
                              const isWorking = workingPorts.includes(portNum);
                              const isDamaged = item.damagedPorts?.includes(portNum) ?? false;
                              
                              let statusLabel = 'Отключен';
                              if (isWorking) statusLabel = 'Работает';
                              if (isDamaged) statusLabel = 'Поврежден';

                              return (
                                <div 
                                  key={i} 
                                  onClick={() => {
                                    if (isViewer) return;
                                    
                                    let newWorkingPorts = [...workingPorts];
                                    let newDamagedPorts = [...(item.damagedPorts ?? [])];

                                    if (isWorking) {
                                      // Working -> Disabled
                                      newWorkingPorts = newWorkingPorts.filter(p => p !== portNum);
                                      newDamagedPorts = newDamagedPorts.filter(p => p !== portNum);
                                    } else if (!isWorking && !isDamaged) {
                                      // Disabled -> Damaged
                                      if (!newDamagedPorts.includes(portNum)) newDamagedPorts.push(portNum);
                                    } else {
                                      // Damaged -> Working
                                      newDamagedPorts = newDamagedPorts.filter(p => p !== portNum);
                                      if (!newWorkingPorts.includes(portNum)) newWorkingPorts.push(portNum);
                                    }
                                    
                                    handleUpdate('network', item.id, { 
                                      workingPorts: newWorkingPorts.sort((a,b)=>a-b),
                                      damagedPorts: newDamagedPorts.sort((a,b)=>a-b)
                                    });
                                  }}
                                  className={`flex flex-col items-center space-y-1 p-0.5 rounded ${!isViewer ? 'cursor-pointer select-none hover:bg-slate-800 transition-colors' : ''}`}
                                  title={!isViewer ? `Порт ${portNum}: Нажмите для смены статуса (Текущий: ${statusLabel})` : `Порт ${portNum}: ${statusLabel}`}
                                >
                                  <span className="text-[8px] text-slate-550">{portNum}</span>
                                  <div className={`w-5 h-5 rounded border ${
                                    isWorking 
                                      ? 'bg-emerald-950 border-emerald-500 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                                      : isDamaged
                                        ? 'bg-rose-950 border-rose-500 text-rose-400 shadow-[0_0_8px_rgba(225,29,72,0.3)]'
                                        : 'bg-slate-900 border-slate-705 text-slate-500'
                                  } flex items-center justify-center text-[8px] font-bold`}>
                                    ●
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Documents Credentials for Network Equipment */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 shadow-2xs md:col-span-2">
                          <h4 className="text-xs font-bold text-slate-705 uppercase tracking-wider flex items-center gap-1.5">{t("Реквизиты документов")}</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div className="space-y-0.5 bg-white p-2.5 rounded-lg border border-slate-150">
                              <span className="text-slate-400 block font-bold text-[9px] uppercase">{t("Оплаченный счет:")}</span>
                              <span className="font-semibold text-slate-705 block leading-relaxed">{item.invoiceInfo || <span className="text-slate-400 italic">{t("Счет не прописан")}</span>}</span>
                            </div>
                            
                            <div className="space-y-0.5 bg-white p-2.5 rounded-lg border border-slate-150">
                              <span className="text-slate-400 block font-bold text-[9px] uppercase">{t("Служебная записка:")}</span>
                              <span className="font-semibold text-slate-705 block leading-relaxed">{item.memoInfo || <span className="text-slate-400 italic">{t("Реквизиты записки не указаны")}</span>}</span>
                            </div>

                            <div className="space-y-0.5 bg-white p-2.5 rounded-lg border border-slate-150">
                              <span className="text-slate-400 block font-bold text-[9px] uppercase">{t("Гарантийный талон:")}</span>
                              <span className="font-semibold text-slate-705 block leading-relaxed">{item.warrantyInfo || <span className="text-slate-400 italic">{t("Гарантия не указана")}</span>}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Warehouse stock count toggles */}
                  {itemType === 'warehouse' && item.type === 'Компьютеры' && hasAnyComputerSpecs(item) && (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3 shadow-2xs">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Cpu size={14} className="text-amber-500" />
                        {t("Характеристики комплектующих (шаблон партии)")}
                      </h4>
                      {item.quantity > 1 && (
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                          {t("Каждая единица в реестре получает эти характеристики. Откройте карточку конкретного инв. номера для просмотра.")}
                        </p>
                      )}
                      <div className="grid grid-cols-2 gap-3 text-[11px]">
                        <div><span className="text-slate-400 font-bold text-[9px] uppercase block">{t("Процессор (CPU):")}</span><span className="font-semibold text-slate-700">{item.cpuModel || '—'}</span></div>
                        <div><span className="text-slate-400 font-bold text-[9px] uppercase block">{t("Оперативная память (RAM):")}</span><span className="font-semibold text-slate-700">{item.ramModel || '—'}</span></div>
                        <div><span className="text-slate-400 font-bold text-[9px] uppercase block">{t("Накопитель (SSD / HDD):")}</span><span className="font-semibold text-slate-700">{item.hddModel || '—'}</span></div>
                        <div><span className="text-slate-400 font-bold text-[9px] uppercase block">{t("Видеокарта (GPU):")}</span><span className="font-semibold text-slate-700">{item.gpuModel || '—'}</span></div>
                        <div><span className="text-slate-400 font-bold text-[9px] uppercase block">{t("Материнская плата:")}</span><span className="font-semibold text-slate-700">{item.motherboardModel || '—'}</span></div>
                        <div><span className="text-slate-400 font-bold text-[9px] uppercase block">{t("Блок питания (PSU):")}</span><span className="font-semibold text-slate-700">{item.powerSupplyModel || '—'}</span></div>
                        <div className="col-span-2"><span className="text-slate-400 font-bold text-[9px] uppercase block">{t("Корпус (Case):")}</span><span className="font-semibold text-slate-700">{item.caseModel || '—'}</span></div>
                        {item.serialNumber && (
                          <div className="col-span-2"><span className="text-slate-400 font-bold text-[9px] uppercase block">{t("Серийный номер (базовый):")}</span><span className="font-semibold text-slate-700 font-mono">{item.serialNumber}</span></div>
                        )}
                      </div>
                      {item.quantity > 1 && (() => {
                        const linkedUnits = computers.filter((c) =>
                          matchesBaseInventoryNumber(c.inventoryNumber, item.inventoryNumber)
                        );
                        if (linkedUnits.length === 0) return null;
                        return (
                          <div className="pt-2 border-t border-slate-100 space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">{t("Единицы в реестре")}</span>
                            {linkedUnits.map((unit) => (
                              <button
                                key={unit.id}
                                type="button"
                                onClick={() => onNavigateDetail('computer', unit.id)}
                                className="w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-150 bg-white hover:border-blue-300 hover:text-blue-700 transition-colors font-mono"
                              >
                                {unit.inventoryNumber} • {unit.deviceType || unit.category}
                                {(unit.cpuModel || unit.ramModel) ? ` • ${unit.cpuModel || ''} ${unit.ramModel || ''}`.trim() : ''}
                              </button>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {itemType === 'warehouse' && (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3 shadow-2xs">
                      <h4 className="text-xs font-bold text-slate-705 uppercase tracking-wider flex items-center gap-1.5">
                        <Package size={14} className="text-blue-500" />{t("Управление остатками на складе")}</h4>
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold font-mono text-slate-800">
                          {item.quantity} <span className="text-sm font-medium text-slate-400 font-sans">{item.unit || 'ед.'}</span>
                        </div>
                        {!isViewer && (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleUpdate('warehouse', item.id, { quantity: Math.max(0, item.quantity - 1) })}
                              className="w-8 h-8 flex items-center justify-center bg-white border border-slate-205 hover:bg-slate-100 text-slate-600 rounded-lg text-sm font-bold transition-all cursor-pointer shadow-sm"
                            >
                              -
                            </button>
                            <button
                              onClick={() => handleUpdate('warehouse', item.id, { quantity: item.quantity + 1 })}
                              className="w-8 h-8 flex items-center justify-center bg-white border border-slate-205 hover:bg-slate-100 text-slate-600 rounded-lg text-sm font-bold transition-all cursor-pointer shadow-sm"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">{t("Вы можете оперативно списывать или приходовать товарно-материальные ценности. Изменения склада мгновенно зафиксируются в системном журнале.")}</p>
                    </div>
                  )}

                  {/* Employee detailed assignments card */}
                  {itemType === 'employee' && (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3 shadow-2xs font-sans">
                      <h4 className="text-xs font-bold text-slate-705 uppercase tracking-wider flex items-center gap-1.5">
                        <Briefcase size={14} className="text-indigo-500" />{t("Основные данные сотрудника")}</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between border-b border-slate-100 pb-1.5 text-slate-500">
                          <span>{t("Полное ФИО:")}</span>
                          <strong className="text-slate-800 font-bold">{item.name}</strong>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-1.5 text-slate-500">
                          <span>{t("Должность:")}</span>
                          <strong className="text-slate-705 font-bold">{item.position}</strong>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-1.5 text-slate-500">
                          <span>{t("Отдел:")}</span>
                          <strong className="text-slate-705 font-bold">{item.department}</strong>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-1.5 text-slate-500">
                          <span>{t("Эл. почта:")}</span>
                          <strong className="text-slate-705 font-semibold font-mono">{item.email || '—'}</strong>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-1.5 text-slate-500">
                          <span>{t("Телефон:")}</span>
                          <strong className="text-slate-705 font-semibold font-mono">{item.phone || '—'}</strong>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>{t("Учетный статус рабочего места:")}</span>
                          <strong className="text-emerald-700 font-bold">{t("🟢 Проверен (Активирован)")}</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all"
          >{t("Закрыть просмотр")}</button>
        </div>
      </div>

      {/* PDF Integrated Lightbox viewer popup */}
      {pdfModalOpen && activePdfContent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-705 flex items-center gap-1.5">
                <FileCheck2 className="text-emerald-500" />{t("Интегрированный просмотр документов")}</span>
              <button 
                onClick={() => { setPdfModalOpen(false); setActivePdfContent(null); }}
                className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer"
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
                      <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                    </div>

                    {/* Metadata details */}
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">{t("Имя файла")}</span>
                        <p className="text-xs font-bold text-slate-750 break-all bg-slate-50 p-2 rounded-lg mt-0.5">
                          {activePdfContent.name}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-[8px] text-slate-400 font-bold block uppercase leading-none">{t("Документ-Класс")}</span>
                          <span className="text-[10px] font-bold text-slate-600 block mt-1">{t("PDF-СПЕЦИФИКАЦИЯ")}</span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-[8px] text-slate-400 font-bold block uppercase leading-none">{t("Защита")}</span>
                          <span className="text-[10px] font-bold text-emerald-600 block mt-1">{t("ШИФРОВАНИЕ")}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                        <span className="text-[8px] text-slate-400 font-bold block uppercase">{t("Статус ЭЦП подписи")}</span>
                        <span className="text-[11px] font-bold text-emerald-650 flex items-center gap-1">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse inline-block" />{t("ПОДПИСАН И ПРОВЕРЕН • ОК")}</span>
                        <p className="text-[9px] text-slate-400 leading-normal">{t("Цифровая подпись организации действительна. Документ защищен от изменений во внутреннем хранилище СУБД LocalStorage.")}</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-[9px] text-slate-400 border-t border-slate-100 pt-3 text-center mt-4">{t("База данных: ИТ-Орбита СУБД")}</div>
                </div>
              </div>
            </div>

            {/* Quick download toolbar */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between shadow-md">
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

      {/* Corporate official Handover Act Printing preview popup */}
      {printModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              body * { visibility: hidden !important; }
              #printable-act-block, #printable-act-block * { visibility: visible !important; }
              #printable-act-block { 
                position: absolute !important; 
                left: 0 !important; 
                top: 0 !important; 
                width: 100% !important; 
                padding: 1.5in !important;
                background: white !important;
                color: black !important;
                box-shadow: none !important;
                border: none !important;
              }
              .no-print { display: none !important; }
            }
          `}} />

          <div className="bg-white rounded-3xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl border border-slate-200">
            {/* Header info bar */}
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between no-print">
              <span className="text-xs font-bold text-slate-705 flex items-center gap-2">
                <Printer size={15} className="text-blue-500 animate-pulse" />{t("Официальный бланк акта передачи оборудования (Интерактивный редактор)")}</span>
              <button 
                onClick={() => setPrintModalOpen(false)}
                className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Simulated document sandbox ready to print */}
            <div className="flex-1 overflow-y-auto bg-slate-100 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
              
              {/* Left editable panel (hidden on print) */}
              <div className="lg:col-span-5 flex flex-col gap-4 bg-white p-5 rounded-2xl border border-slate-200 overflow-y-auto text-xs no-print max-h-[70vh]">
                <h3 className="font-bold text-slate-800 text-[11px] border-b border-slate-100 pb-2 flex items-center gap-1.5 uppercase tracking-wider">
                  <Edit2 size={12} className="text-blue-500" />{t("Редактировать параметры акта")}</h3>
                
                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{t("Номер Акта")}</label>
                      <input
                        type="text"
                        value={actNumber}
                        onChange={(e) => setActNumber(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{t("Дата выдачи")}</label>
                      <input
                        type="date"
                        value={actDate}
                        onChange={(e) => setActDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs text-slate-705"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{t("Организация (Заголовок)")}</label>
                    <input
                      type="text"
                      value={actCompany}
                      onChange={(e) => setActCompany(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs text-slate-700 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{t("Подзаголовок Шапки")}</label>
                    <input
                      type="text"
                      value={actSub}
                      onChange={(e) => setActSub(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs text-slate-700 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{t("Передающая Сторона")}</label>
                      <input
                        type="text"
                        value={actSender}
                        onChange={(e) => setActSender(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{t("Кем отпущено")}</label>
                      <input
                        type="text"
                        value={actSenderSub}
                        onChange={(e) => setActSenderSub(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs text-slate-700"
                      />
                    </div>
                  </div>

                  {itemType === 'object' ? (
                    <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-lg text-slate-600 space-y-1">
                      <p className="font-extrabold text-blue-800 text-[10px] uppercase">{t("Режим ведомости:")}</p>
                      <p className="text-[10px] leading-relaxed">{t("В режиме паспорта система автоматически выгружает и форматирует список всех закрепленных за сотрудниками устройств, а также общую ИТ-инфраструктуру объекта")}<strong className="text-slate-850">{item.name}</strong>.</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{t("Получатель (Сотрудник)")}</label>
                          <input
                            type="text"
                            value={actReceiver}
                            onChange={(e) => setActReceiver(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs text-slate-700"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{t("Должность и отдел")}</label>
                          <input
                            type="text"
                            value={actReceiverSub}
                            onChange={(e) => setActReceiverSub(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs text-slate-700"
                          />
                        </div>
                      </div>

                      <div className="space-y-2.5 border-t border-slate-100 pt-3">
                        <span className="block text-[10px] uppercase font-black text-slate-400 tracking-wider">{t("Условия ответственности сотрудников")}</span>
                        <div>
                          <label className="block text-[9px] text-slate-455 mb-0.5 font-bold">{t("Пункт 1")}</label>
                          <textarea
                            value={actText1}
                            onChange={(e) => setActText1(e.target.value)}
                            rows={2}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs leading-snug focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none text-slate-600"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-slate-455 mb-0.5 font-bold">{t("Пункт 2")}</label>
                          <textarea
                            value={actText2}
                            onChange={(e) => setActText2(e.target.value)}
                            rows={3}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs leading-snug focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none text-slate-600"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-slate-455 mb-0.5 font-bold">{t("Пункт 3")}</label>
                          <textarea
                            value={actText3}
                            onChange={(e) => setActText3(e.target.value)}
                            rows={2}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs leading-snug focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none text-slate-600"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Right document preview (Printed document portion) */}
              <div className="lg:col-span-7 flex justify-center items-start overflow-y-auto max-h-[70vh]">
                <div 
                  id="printable-act-block"
                  className="w-full max-w-[210mm] bg-white border border-slate-350 p-8 font-sans text-slate-900 shadow-lg text-[10px] leading-relaxed relative rounded-lg"
                >
                  {/* Official standard letterhead seal */}
                  <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-5">
                    <div className="space-y-1">
                      <span className="text-[11px] uppercase font-black tracking-widest text-slate-900 block">{actCompany}</span>
                      <span className="text-[7.5px] text-slate-500 uppercase block font-mono leading-none">{actSub}</span>
                    </div>
                    <div className="text-right space-y-0.5">
                      <span className="text-[8px] font-bold block">{itemType === 'object' ? 'ПАСПОРТ ИНВЕНТАРЯ' : `АКТ № ${actNumber}`}</span>
                      <span className="text-[7.5px] text-slate-500 block font-mono">{itemType === 'object' ? 'Дата выгрузки' : 'Дата выдачи'}: {actDate}</span>
                    </div>
                  </div>

                  {itemType === 'object' ? (
                    /* ---------------- OBJECT PRINTING ---------------- */
                    <div className="space-y-5">
                      {/* Document title */}
                      <div className="text-center space-y-1 mb-4">
                        <h1 className="text-[12px] font-extrabold uppercase tracking-wide">{t("Паспорт ИТ-Инвентаря и Учета Объезда")}</h1>
                        <p className="text-[8.5px] text-slate-500 italic leading-none">{t("Сводная ведомость по сотрудникам и прикрепленному оборудованию филиала:")}<strong className="text-slate-800">{item.name}</strong></p>
                      </div>

                      {/* Object summary details */}
                      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 border border-slate-200 rounded-md">
                        <div>
                          <span className="text-[7.5px] text-slate-400 uppercase font-black block tracking-wider font-mono">{t("Объект / Филиал")}</span>
                          <strong className="text-[10px] text-slate-800 block mt-0.5">{item.name}</strong>
                          <span className="text-[8.5px] text-slate-500 block truncate">{item.address}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-right">
                          <div>
                            <span className="text-[7.5px] text-slate-400 uppercase font-black block tracking-wider font-mono">{t("Компьютеров")}</span>
                            <span className="text-[11px] font-bold text-blue-600 block mt-0.5">
                              {computers.filter(c => c.objectName === item.name && c.category !== 'Видеонаблюдение').length} шт.
                            </span>
                          </div>
                          <div>
                            <span className="text-[7.5px] text-slate-400 uppercase font-black block tracking-wider font-mono font-bold">{t("Сетевых систем")}</span>
                            <span className="text-[11px] font-bold text-emerald-600 block mt-0.5">
                              {networkDevices.filter(n => n.objectName === item.name).reduce((sum, d) => sum + d.quantity, 0)} шт.
                            </span>
                          </div>
                          <div>
                            <span className="text-[7.5px] text-slate-400 uppercase font-black block tracking-wider font-mono font-bold">{t("Видеонаблюдение")}</span>
                            <span className="text-[11px] font-bold text-indigo-600 block mt-0.5">
                              {computers.filter(c => c.objectName === item.name && c.category === 'Видеонаблюдение').length} шт.
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Section 1: Employees and assigned equipment */}
                      <div className="space-y-2.5 pt-1">
                        <span className="text-[8.5px] uppercase font-bold tracking-wider text-slate-800 block border-b border-slate-200 pb-1 font-sans">{t("1. Выписка по сотрудникам и закрепленному оборудованию")}</span>
                        
                        {(() => {
                          const objComputers = computers.filter(c => c.objectName === item.name);
                          // Filter unique employee names that have equipment attached to this object
                          const assignedNames = Array.from(new Set(
                            objComputers.map(c => c.employeeName)
                              .filter(name => name && name !== 'Свободен' && name !== 'Склад' && name.trim() !== '')
                          ));

                          if (assignedNames.length === 0) {
                            return (
                              <p className="text-[8.5px] text-slate-450 italic p-2 bg-slate-50 rounded-lg">{t("На данном объекте нет сотрудников с персонально закрепленным оборудованием.")}</p>
                            );
                          }

                          return (
                            <div className="space-y-3">
                              {assignedNames.map((name, index) => {
                                const emp = employees.find(e => e.name === name);
                                const empComps = objComputers.filter(c => c.employeeName === name);

                                return (
                                  <div key={index} className="p-2.5 border border-slate-200 rounded-lg space-y-1.5 bg-slate-50/50">
                                    <div className="flex justify-between items-center border-b border-slate-205 pb-1">
                                      <span className="font-extrabold text-slate-850 text-[9px]">
                                        👤 {name}
                                      </span>
                                      <span className="text-[8px] text-slate-500">
                                        {emp?.position || 'Штатный сотрудник'} • {emp?.department || 'Не указан'}
                                      </span>
                                    </div>
                                    <table className="w-full text-left text-[8px] border-collapse">
                                      <thead>
                                        <tr className="text-slate-500 uppercase tracking-wider text-[7px] border-b border-slate-200">
                                          <th className="py-0.5 font-bold w-1/4">{t("Категория")}</th>
                                          <th className="py-0.5 font-bold">{t("Модель / Сецификация")}</th>
                                          <th className="py-0.5 font-mono font-bold text-right">{t("Инвентарный №")}</th>
                                          <th className="py-0.5 font-bold text-right">{t("Статус")}</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {empComps.map(ec => (
                                          <tr key={ec.id} className="border-b border-slate-100/50 last:border-none">
                                            <td className="py-1 font-semibold text-slate-700 flex items-center gap-1">
                                              {getDeviceIcon({ category: ec.category, deviceType: ec.deviceType, model: ec.model, size: 8 })}
                                              {ec.category}
                                            </td>
                                            <td className="py-1 text-slate-800">{ec.model}</td>
                                            <td className="py-1 font-mono text-slate-600 text-right">{ec.inventoryNumber}</td>
                                            <td className="py-1 text-slate-650 text-right font-medium">{ec.status}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Section 2: Complete List of Equipment and Infrastructure */}
                      <div className="space-y-2.5 pt-1">
                        <span className="text-[8.5px] uppercase font-bold tracking-wider text-slate-800 block border-b border-slate-200 pb-1 font-sans">{t("2. Полный перечень ИТ-оборудования и инфраструктуры объекта")}</span>
                        
                        {(() => {
                          const objComputers = computers.filter(c => c.objectName === item.name);
                          const objNetwork = networkDevices.filter(n => n.objectName === item.name);

                          if (objComputers.length === 0 && objNetwork.length === 0) {
                            return <p className="text-[8.5px] text-slate-450 italic p-2 bg-slate-50 rounded-lg">{t("Зарегистрированное оборудование отсутствует на данном объекте.")}</p>;
                          }

                          return (
                            <table className="w-full text-left border-collapse border border-slate-200 text-[8px] leading-tight">
                              <thead>
                                <tr className="bg-slate-100/80 text-slate-700 font-bold">
                                  <th className="p-1 border border-slate-200">{t("Категория / Тип")}</th>
                                  <th className="p-1 border border-slate-200">{t("Модель / Описание")}</th>
                                  <th className="p-1 border border-slate-200">{t("Инв. № / IP адрес")}</th>
                                  <th className="p-1 border border-slate-200">{t("Спецификация")}</th>
                                  <th className="p-1 border border-slate-200">{t("Сотрудник / Статус")}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {/* Computers list */}
                                {objComputers.map(c => (
                                  <tr key={c.id} className="hover:bg-slate-50/50">
                                    <td className="p-1 border border-slate-200 font-semibold text-slate-700">
                                      <span className="inline-flex items-center gap-1">
                                        {getDeviceIcon({ category: c.category, deviceType: c.deviceType, model: c.model, size: 8 })}
                                        {c.category}
                                      </span>
                                    </td>
                                    <td className="p-1 border border-slate-200 text-slate-800">{c.model}</td>
                                    <td className="p-1 border border-slate-200 font-mono text-slate-600">{c.inventoryNumber}</td>
                                    <td className="p-1 border border-slate-200 text-slate-500">
                                      {c.deviceType || 'Базовая техника'}
                                    </td>
                                    <td className="p-1 border border-slate-200">
                                      <div className="font-bold text-slate-700">
                                        {c.employeeName && c.employeeName !== 'Свободен' && c.employeeName !== 'Склад' ? c.employeeName : 'Общее / Резерв'}
                                      </div>
                                      <div className="text-[7px] text-slate-400 font-mono italic">{c.status}</div>
                                    </td>
                                  </tr>
                                ))}
                                {/* Network Devices list */}
                                {objNetwork.map(n => (
                                  <tr key={n.id} className="bg-lime-50/20 hover:bg-slate-50/50">
                                    <td className="p-1 border border-slate-200 font-semibold text-emerald-800">
                                      📡 Сеть ({n.type})
                                    </td>
                                    <td className="p-1 border border-slate-200 text-slate-800 font-bold">{n.deviceName}</td>
                                    <td className="p-1 border border-slate-200 font-mono text-emerald-700 font-bold">{n.ipAddress || 'DHCP/Авто'}</td>
                                    <td className="p-1 border border-slate-200 text-slate-500">
                                      Количество: {n.quantity} шт. {n.portsCount ? `(${n.portsCount} портов)` : ''}
                                    </td>
                                    <td className="p-1 border border-slate-200 text-slate-800 font-semibold">{t("Инфраструктура объекта")}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          );
                        })()}
                      </div>

                      {/* Responsibilities and terms text (small layout) */}
                      <p className="text-[7.5px] text-slate-400 italic text-justify leading-snug border-t border-slate-100 pt-2 shrink-0">{t("* Данная ведомость является официальным внутренним документом ИТ-инвентаризации. Все прикрепленные устройства находятся в зоне ответственности закрепленных за ними сотрудников, либо под общим контролем материально-ответственного лица данного подразделения. Любые перемещения техники должны быть согласованы с администрацией.")}</p>

                      {/* Bottom signatures block */}
                      <div className="grid grid-cols-2 gap-8 mt-4 pt-3 border-t border-slate-200">
                        <div className="space-y-4">
                          <span className="text-[8px] text-slate-400 uppercase font-black tracking-wider block">{t("Выгрузку произвел Администратор:")}</span>
                          <div className="flex justify-between items-baseline border-b border-slate-400 pb-1">
                            <span className="text-[9px] text-slate-400 italic">{t("подпись")}</span>
                            <span className="text-[9px] font-bold text-slate-800 font-mono">___________ / {currentUser?.login || 'Admin-ИТ'}</span>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <span className="text-[8px] text-slate-400 uppercase font-black tracking-wider block">{t("Согласовано Руководитель объекта:")}</span>
                          <div className="flex justify-between items-baseline border-b border-slate-400 pb-1">
                            <span className="text-[9px] text-slate-400 italic">{t("подпись")}</span>
                            <span className="text-[9px] font-bold text-slate-800">___________ / _________________</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : itemType === 'employee' ? (
                    /* ---------------- EMPLOYEE PRINTING ---------------- */
                    <div className="space-y-5">
                      {/* Document title */}
                      <div className="text-center space-y-1 mb-4">
                        <h1 className="text-[12px] font-extrabold uppercase tracking-wide">{t("Паспорт Закрепления ИТ-Оборудования")}</h1>
                        <p className="text-[8.5px] text-slate-500 italic leading-none">{t("Карточка учета ТМЦ и акты приема-передачи во временное служебное пользование")}</p>
                      </div>

                      {/* Employee summary details */}
                      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 border border-slate-200 rounded-md">
                        <div>
                          <span className="text-[7.5px] text-slate-400 uppercase font-black block tracking-wider font-mono">{t("Сотрудник (Получатель)")}</span>
                          <strong className="text-[10px] text-slate-800 block mt-0.5">{actReceiver}</strong>
                          <span className="text-[8.5px] text-slate-505 block truncate">{actReceiverSub}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[7.5px] text-slate-400 uppercase font-black block tracking-wider font-mono font-bold">{t("Всего числится")}</span>
                          <span className="text-[11px] font-bold text-blue-600 block mt-0.5">
                            {computers.filter(c => c.employeeName === item.name).length} устр.
                          </span>
                        </div>
                      </div>

                      {/* Section 1: Attached equipment table */}
                      <div className="space-y-2.5 pt-1">
                        <span className="text-[8.5px] uppercase font-bold tracking-wider text-slate-800 block border-b border-slate-200 pb-1 font-sans">{t("1. Спецификация закрепленных технических средств (ТМЦ)")}</span>

                        {(() => {
                          const empComps = computers.filter(c => c.employeeName === item.name);

                          if (empComps.length === 0) {
                            return (
                              <p className="text-[8.5px] text-slate-450 italic p-2 bg-slate-50 rounded-lg">{t("За данным сотрудником в системе не зарегистрировано персональное ИТ-оборудование.")}</p>
                            );
                          }

                          return (
                            <table className="w-full text-left border-collapse border border-slate-200 text-[8.5px] leading-tight">
                              <thead>
                                <tr className="bg-slate-100/80 text-slate-705 font-bold">
                                  <th className="p-1 px-2 border border-slate-200 w-[5%] font-mono text-center">№</th>
                                  <th className="p-1 border border-slate-200 w-[25%] font-semibold">{t("Категория / Тип")}</th>
                                  <th className="p-1 border border-slate-200 w-[45%] font-semibold">{t("Модель / Описание")}</th>
                                  <th className="p-1 border border-slate-200 w-[25%] font-semibold font-mono text-right">{t("Инвентарный №")}</th>
                                  <th className="p-1 border border-slate-200 w-[15%] font-semibold text-center">{t("Статус")}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {empComps.map((c, idx) => (
                                  <tr key={c.id} className="hover:bg-slate-50/50">
                                    <td className="p-1 px-2 border border-slate-200 font-mono text-center">{idx + 1}</td>
                                    <td className="p-1 border border-slate-200 font-semibold text-slate-700">
                                      <span className="inline-flex items-center gap-1">
                                        {getDeviceIcon({ category: c.category, deviceType: c.deviceType, model: c.model, size: 8 })}
                                        {c.category}
                                      </span>
                                    </td>
                                    <td className="p-1 border border-slate-200 text-slate-800 font-medium font-sans">
                                      {c.model} {c.deviceType ? `(${c.deviceType})` : ''}
                                      {c.replacedComponents && c.replacedComponents.length > 0 && (
                                        <div className="text-[7px] text-slate-400 font-sans italic mt-0.5">{t("* Модернизировано (память, SSD)")}</div>
                                      )}
                                    </td>
                                    <td className="p-1 border border-slate-200 font-mono text-slate-650 text-right font-bold">{c.inventoryNumber}</td>
                                    <td className="p-1 border border-slate-200 text-center">
                                      <span className="text-[8px] px-1 py-0.5 bg-green-50 text-green-700 border border-green-100 rounded-sm font-medium">
                                        {c.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          );
                        })()}
                      </div>

                      {/* Section 2: Terms and Responsibilities */}
                      <div className="space-y-1.5 text-justify text-[8px] text-slate-600 border-t border-slate-200 pt-3 leading-relaxed">
                        <p>{actText1}</p>
                        <p>{actText2}</p>
                        <p>{actText3}</p>
                      </div>

                      {/* Handover signature grid */}
                      <div className="grid grid-cols-2 gap-8 mt-6 pt-3 border-t border-slate-200">
                        <div className="space-y-4">
                          <span className="text-[8px] text-slate-400 uppercase font-black tracking-wider block">{t("Отпустил (Сдал) Администратор:")}</span>
                          <div className="flex justify-between items-baseline border-b border-slate-400 pb-1">
                            <span className="text-[9px] text-slate-400 italic">{t("подпись")}</span>
                            <span className="text-[9px] font-bold text-slate-800 font-mono">___________ / {currentUser?.login || 'Admin-ИТ'}</span>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <span className="text-[8px] text-slate-400 uppercase font-black tracking-wider block">{t("Принял на баланс Получатель:")}</span>
                          <div className="flex justify-between items-baseline border-b border-slate-400 pb-1">
                            <span className="text-[9px] text-slate-400 italic">{t("подпись")}</span>
                            <span className="text-[9px] font-bold text-slate-800 font-mono">___________ / {actReceiver}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ---------------- INDIVIDUAL ITEM DEED PRINTING ---------------- */
                    <>
                      {/* Subtitle heading */}
                      <div className="text-center space-y-1 mb-6">
                        <h1 className="text-[13px] font-extrabold uppercase tracking-wide">{t("Акт Приема-Передачи ИТ-Оборудования")}</h1>
                        <p className="text-[8.5px] text-slate-505 italic leading-none">{t("во временное служебное пользование сотруднику компании")}</p>
                      </div>

                      {/* Sender/Receiver details block */}
                      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 border border-slate-200 rounded-md mb-5">
                        <div>
                          <span className="text-[7.5px] text-slate-400 uppercase font-black block tracking-wider font-mono">{t("Передающая Сторона")}</span>
                          <strong className="text-[9.5px] text-slate-800 block mt-0.5">{actSender}</strong>
                          <span className="text-[8.5px] text-slate-505 block font-serif">{actSenderSub}</span>
                        </div>
                        <div>
                          <span className="text-[7.5px] text-slate-400 uppercase font-black block tracking-wider font-mono">{t("Получающая Сторона (Сотрудник)")}</span>
                          <strong className="text-[9.5px] text-slate-800 block mt-0.5">{actReceiver}</strong>
                          <span className="text-[8.5px] text-slate-505 block">{actReceiverSub}</span>
                        </div>
                      </div>

                      {/* Primary device details block */}
                      <div className="space-y-3">
                        <span className="text-[8.5px] uppercase font-bold tracking-wider text-slate-800 block border-b border-slate-200 pb-1">{t("1. Сведения о передаваемом оборудовании")}</span>
                        <table className="w-full text-left border-collapse border border-slate-200 text-[9.5px]">
                          <tbody>
                            <tr className="bg-slate-50/50">
                              <th className="p-1.5 border border-slate-200 w-1/3">{t("Наименование / Модель:")}</th>
                              <td className="p-1.5 border border-slate-200 font-bold text-slate-800">
                                {item.name || item.model || item.deviceName || 'Базовое ИТ-оборудование'}
                              </td>
                            </tr>
                            <tr>
                              <th className="p-1.5 border border-slate-200">{t("Инвентарный номер ТМЦ:")}</th>
                              <td className="p-1.5 border border-slate-200 font-mono text-slate-700">
                                {item.inventoryNumber || 'ИНВ-НЕУКАЗАН'}
                              </td>
                            </tr>
                            {item.deviceType !== 'Картриджи' && (
                              <tr className="bg-slate-50/50">
                                <th className="p-1.5 border border-slate-200">{t("Серийный номер:")}</th>
                                <td className="p-1.5 border border-slate-200 font-mono text-slate-805">
                                  {item.serialNumber || 'SN-НЕУКАЗАН'}
                                </td>
                              </tr>
                            )}
                            <tr>
                              <th className="p-1.5 border border-slate-200">{t("Размещение / Объект:")}</th>
                              <td className="p-1.5 border border-slate-200">
                                {item.objectLocation || item.placementLocation || 'Корпоративный Склад'}
                              </td>
                            </tr>
                            {item.cpu && (
                              <tr className="bg-slate-50/50">
                                <th className="p-1.5 border border-slate-200">{t("Действующая конфигурация:")}</th>
                                <td className="p-1.5 border border-slate-200">
                                  Процессор: {item.cpu} • ОЗУ: {item.ram} • Накопитель: {item.storage} ({item.os || 'Служебная ОС'})
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Replaced Parts history or Cartridges under control details */}
                      {item.replacedComponents && item.replacedComponents.length > 0 && (
                        <div className="space-y-2 mt-5 font-sans">
                          <span className="text-[8.5px] uppercase font-bold tracking-wider text-slate-800 block border-b border-slate-200 pb-1">{t("2. История замен комплектующих и модернизаций")}</span>
                          <table className="w-full text-left border-collapse border border-slate-200 text-[8.5px]">
                            <thead>
                              <tr className="bg-slate-100 text-slate-700">
                                <th className="p-1 border border-slate-200">{t("Дата")}</th>
                                <th className="p-1 border border-slate-200">{t("Название замены")}</th>
                                <th className="p-1 border border-slate-200">{t("Предыдущая деталь")}</th>
                                <th className="p-1 border border-slate-200">{t("Действующая деталь")}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {item.replacedComponents.map((comp: any) => (
                                <tr key={comp.id}>
                                  <td className="p-1 border border-slate-200 font-mono">{comp.date}</td>
                                  <td className="p-1 border border-slate-200 font-bold">{comp.name}</td>
                                  <td className="p-1 border border-slate-200 italic text-slate-500">{comp.oldDetails}</td>
                                  <td className="p-1 border border-slate-200 font-bold text-slate-800">{comp.newDetails}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Responsibilities block */}
                      <div className="mt-6 space-y-1.5 text-justify text-[8.5px] text-slate-600 border-t border-slate-200 pt-3 leading-normal">
                        <p>{actText1}</p>
                        <p>{actText2}</p>
                        <p>{actText3}</p>
                      </div>

                      {/* Handover signature grid */}
                      <div className="grid grid-cols-2 gap-8 mt-8 pt-4 border-t border-slate-200">
                        <div className="space-y-4">
                          <span className="text-[8px] text-slate-400 uppercase font-black tracking-wider block">{t("Отпустил (Сдал) Администратор:")}</span>
                          <div className="flex justify-between items-baseline border-b border-slate-400 pb-1">
                            <span className="text-[9px] text-slate-400 italic">{t("подпись")}</span>
                            <span className="text-[9px] font-bold text-slate-800 font-mono">___________ / {currentUser?.login || 'Admin-ИТ'}</span>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <span className="text-[8px] text-slate-400 uppercase font-black tracking-wider block">{t("Принял на баланс Получатель:")}</span>
                          <div className="flex justify-between items-baseline border-b border-slate-400 pb-1">
                            <span className="text-[9px] text-slate-400 italic">{t("подпись")}</span>
                            <span className="text-[9px] font-bold text-slate-800 font-mono">___________ / {actReceiver}</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Bottom official footer stamp wrapper */}
                  <div className="absolute bottom-8 right-8 pointer-events-none opacity-20 flex items-center justify-center border-4 border-double border-blue-800 rounded-full w-20 h-20 rotate-12 flex-col text-center">
                    <span className="text-[7px] font-black text-blue-800 tracking-widest leading-none">{t("ТЕХОТДЕЛ")}</span>
                    <span className="text-[4.5px] text-blue-800 font-bold leading-normal">{workspaceName ? workspaceName.toUpperCase() : 'ГЛОБАЛ-КОНСАЛТ ИТ'}</span>
                    <span className="text-[3.5px] text-blue-800">{t("ДЛЯ ДОКУМЕНТОВ")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dialog toolbar action buttons */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-end gap-2 no-print">
              <button
                onClick={() => setPrintModalOpen(false)}
                className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-250 text-slate-650 hover:text-slate-800 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                type="button"
              >{t("Закрыть")}</button>
              <button
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-md select-none"
                type="button"
              >
                <Printer size={13} />{t("Запустить Печать")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
