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
import { Warehouse, Plus, Minus, Search, Trash2, Edit2, Download, AlertTriangle, Upload, FileText, Building, ClipboardList, Check, ArrowLeftRight, RotateCcw, Shuffle } from 'lucide-react';
import { WarehouseItem, WarehouseItemType, WarehouseItemStatus, CustomWarehouse, WarehouseWriteOff, ObjectItem, EmployeeItem, ComputerItem, NetworkDevice, SoftwareItem } from '../types';
import { useTranslation } from '../utils/i18n';
import {
  EQUIPMENT_TITLE_MAX_LENGTH,
  limitEquipmentTitle,
  supportsComputerSpecifications,
  inventoryNumbersMatch,
} from '../utils/equipmentFields';
import { getSoftwareWarehouseInv, isSoftwareStoredOnWarehouse } from '../utils/equipmentDelete';
import ModalCloseButton from './ModalCloseButton';

interface WarehouseViewProps {
  warehouseItems: WarehouseItem[];
  onReceipt: (item: Omit<WarehouseItem, 'id' | 'status'> & {
    serialNumber?: string;
    cpuModel?: string;
    ramModel?: string;
    hddModel?: string;
    gpuModel?: string;
    motherboardModel?: string;
    powerSupplyModel?: string;
    caseModel?: string;
  }) => void;
  onWriteOff: (
    inventoryNumber: string, 
    quantityToWriteOff: number, 
    reason?: string, 
    technicalPdf?: { name: string; size?: string; content?: string }
  ) => boolean;
  onDeleteEquipment?: (source: 'warehouse' | 'network' | 'software' | 'computer', id: string) => void;
  onDeleteWriteOff?: (id: string) => void;
  onViewDetails?: (type: 'computer' | 'network' | 'employee' | 'object' | 'warehouse', id: string) => void;
  currentUser?: { role: 'Viewer' | 'Editor' | 'Admin' };
  
  // Custom warehouses and write-offs
  warehouses: CustomWarehouse[];
  setWarehouses: React.Dispatch<React.SetStateAction<CustomWarehouse[]>>;
  warehouseWriteOffs: WarehouseWriteOff[];
  objects: ObjectItem[];

  // New props for warehouse-to-object deployment
  employees?: EmployeeItem[];
  computers?: ComputerItem[];
  networkDevices?: NetworkDevice[];
  softwareItems?: SoftwareItem[];
  onDeployAsset?: (inventoryNumber: string, quantity: number, targetEmployeeName: string, targetObjectName: string) => boolean;
  onReturnActiveAssetToWarehouse?: (itemSource: 'computer' | 'network' | 'software', itemId: string, targetWarehouseName: string) => void;
  onTransferActiveAsset?: (itemSource: 'computer' | 'network' | 'software', itemId: string, targetObjectName: string, targetEmployeeName?: string) => void;
  onTransferWarehouseStock?: (itemId: string, sourceWarehouseName: string, targetWarehouseName: string, quantity: number) => void;
}

export const getDeviceTypesForReceiptGroup = (group: WarehouseItemType): string[] => {
  switch (group) {
    case 'Компьютеры':
      return ['Ноутбук', 'ПК', 'Сервер'];
    case 'Сетевое оборудование':
      return ['Маршрутизатор', 'Коммутатор', 'Точка доступа', 'Другое'];
    case 'Периферия':
      return ['Монитор', 'Клавиатура', 'Мышь', 'Клавиатура + Мышь', 'Веб-камера', 'Другое'];
    case 'Оргтехника':
      return ['МФУ', 'Принтер', 'Сканер', 'Другое'];
    case 'Видеонаблюдение':
      return ['Видеокамера', 'Видеорегистратор', 'Другое'];
    case 'Расходные материалы':
      return ['Картриджи', 'Расходные материалы для МФУ', 'Расходники'];
    case 'Лицензии ПО':
      return ['Лицензионный ключ ПО', 'Подписка', 'Бессрочная лицензия', 'Другое'];
    case 'Другое':
    default:
      return ['Другое'];
  }
};

export default function WarehouseView({
  warehouseItems,
  onReceipt,
  onWriteOff,
  onDeleteEquipment,
  onViewDetails,
  currentUser,
  warehouses = [],
  setWarehouses,
  warehouseWriteOffs = [],
  objects = [],
  employees = [],
  computers = [],
  networkDevices = [],
  softwareItems = [],
  onDeployAsset,
  onDeleteWriteOff,
  onReturnActiveAssetToWarehouse,
  onTransferActiveAsset,
  onTransferWarehouseStock,
}: WarehouseViewProps) {
  const { t } = useTranslation();
  
  // Secondary layout navigation
  const [currentWhTab, setCurrentWhTab] = useState<'stock' | 'history' | 'warehouses'>('stock');
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState('all');

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<WarehouseItemType | 'Все'>('Все');
  const [placementFilter, setPlacementFilter] = useState<'all' | 'stock' | 'issued'>('all');

  const isViewer = currentUser?.role === 'Viewer';
  const isAdmin = currentUser?.role === 'Admin';

  // Modals controllers
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showWriteOffModal, setShowWriteOffModal] = useState(false);

  // Form States - Receipt
  const [name, setName] = useState('');
  const [type, setType] = useState<WarehouseItemType>('Компьютеры');
  const [deviceType, setDeviceType] = useState<string>('Ноутбук');
  const [model, setModel] = useState('');
  const [inventoryNumber, setInventoryNumber] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('шт.');
  const [costPerUnit, setCostPerUnit] = useState(1000);
  const [invoiceInfo, setInvoiceInfo] = useState('');
  const [memoInfo, setMemoInfo] = useState('');
  const [warrantyInfo, setWarrantyInfo] = useState('');
  const [receiptWarehouseName, setReceiptWarehouseName] = useState(warehouses[0]?.name || 'Основной склад ИТ');
  const [pdfFiles, setPdfFiles] = useState<{ name: string; size?: string; content?: string; group?: string; dateUploaded?: string }[]>([]);

  // Specifications Collapsible (for Computers replication)
  const [showSpecs, setShowSpecs] = useState(false);
  const [serialNumber, setSerialNumber] = useState('');
  const [cpuModel, setCpuModel] = useState('');
  const [ramModel, setRamModel] = useState('');
  const [hddModel, setHddModel] = useState('');
  const [gpuModel, setGpuModel] = useState('');
  const [motherboardModel, setMotherboardModel] = useState('');
  const [powerSupplyModel, setPowerSupplyModel] = useState('');
  const [caseModel, setCaseModel] = useState('');

  const receiptHasComputerSpecs = supportsComputerSpecifications({ warehouseType: type, deviceType });

  // Form States - Custom Warehouse Adding
  const [newWhName, setNewWhName] = useState('');
  const [newWhObject, setNewWhObject] = useState(objects[0]?.name || 'Главный офис');
  const [newWhDesc, setNewWhDesc] = useState('');

  // Form States - Write Off
  const [writeOffInvNum, setWriteOffInvNum] = useState('');
  const [writeOffQty, setWriteOffQty] = useState(1);
  const [writeOffReason, setWriteOffReason] = useState('');
  const [writeOffPdf, setWriteOffPdf] = useState<{ name: string; size?: string; content?: string } | null>(null);
  const [writeOffError, setWriteOffError] = useState('');

  // Form States - Return or Move Active Issued Equipment
  const [showActiveAssetTransitionModal, setShowActiveAssetTransitionModal] = useState(false);
  const [transitionAssetItem, setTransitionAssetItem] = useState<any | null>(null);
  const [transitionTargetWarehouse, setTransitionTargetWarehouse] = useState('');
  const [transitionTargetObject, setTransitionTargetObject] = useState('');
  const [transitionTargetEmployee, setTransitionTargetEmployee] = useState('');
  const [transitionMode, setTransitionMode] = useState<'return' | 'transfer'>('return');
  const [transitionError, setTransitionError] = useState('');

  // Form States - Transfer Warehouse Stock Item
  const [showStockTransferModal, setShowStockTransferModal] = useState(false);
  const [transferStockItem, setTransferStockItem] = useState<WarehouseItem | null>(null);
  const [transferSourceWarehouse, setTransferSourceWarehouse] = useState('');
  const [transferTargetWarehouse, setTransferTargetWarehouse] = useState('');
  const [transferQty, setTransferQty] = useState(1);
  const [transferError, setTransferError] = useState('');

  const handleOpenActiveAssetTransition = (item: any) => {
    setTransitionAssetItem(item);
    setTransitionMode('return');
    // Set default target warehouse
    const currentWhName = item.warehouseName || warehouses[0]?.name || 'Основной склад ИТ';
    const differentWh = warehouses.find(w => w.name !== currentWhName) || warehouses[0];
    setTransitionTargetWarehouse(differentWh?.name || 'Основной склад ИТ');
    setTransitionTargetObject(objects[0]?.name || 'Главный офис');
    setTransitionTargetEmployee('Без изменений');
    setTransitionError('');
    setShowActiveAssetTransitionModal(true);
  };

  const handleActiveAssetTransitionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transitionAssetItem) return;

    if (transitionMode === 'return') {
      if (!onReturnActiveAssetToWarehouse) return;
      onReturnActiveAssetToWarehouse(
        transitionAssetItem.itemSource,
        transitionAssetItem.id,
        transitionTargetWarehouse
      );
    } else {
      if (!onTransferActiveAsset) return;
      onTransferActiveAsset(
        transitionAssetItem.itemSource,
        transitionAssetItem.id,
        transitionTargetObject,
        transitionTargetEmployee === 'Без изменений' ? undefined : transitionTargetEmployee
      );
    }
    setShowActiveAssetTransitionModal(false);
  };

  const handleOpenStockTransfer = (item: WarehouseItem) => {
    setTransferStockItem(item);
    const sourceWh = item.warehouseName || 'Основной склад ИТ';
    setTransferSourceWarehouse(sourceWh);
    const differentWh = warehouses.find(w => w.name !== sourceWh) || warehouses[0];
    setTransferTargetWarehouse(differentWh?.name || 'Основной склад ИТ');
    setTransferQty(1);
    setTransferError('');
    setShowStockTransferModal(true);
  };

  const handleStockTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferStockItem || !onTransferWarehouseStock) return;

    if (transferQty < 1) {
      setTransferError('Количество должно быть не менее 1');
      return;
    }
    if (transferQty > transferStockItem.quantity) {
      setTransferError(`Доступно всего ${transferStockItem.quantity} шт. на складе "${transferSourceWarehouse}"`);
      return;
    }
    if (transferSourceWarehouse === transferTargetWarehouse) {
      setTransferError('Склад-источник и склад-получатель должны отличаться');
      return;
    }

    onTransferWarehouseStock(
      transferStockItem.id,
      transferSourceWarehouse,
      transferTargetWarehouse,
      transferQty
    );
    setShowStockTransferModal(false);
  };

  // Form States - Deploy / Assign to Object
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deployItem, setDeployItem] = useState<WarehouseItem | null>(null);
  const [deployQty, setDeployQty] = useState(1);
  const [deployEmployee, setDeployEmployee] = useState('');
  const [deployObject, setDeployObject] = useState('');
  const [deployError, setDeployError] = useState('');

  const handleOpenDeploy = (item: WarehouseItem) => {
    setDeployItem(item);
    setDeployQty(1);
    setDeployEmployee(employees?.[0]?.name || 'Свободен / Общий');
    setDeployObject(objects?.[0]?.name || 'Главный офис');
    setDeployError('');
    setShowDeployModal(true);
  };

  const handleDeploySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deployItem || !onDeployAsset) return;

    if (deployQty < 1) {
      setDeployError('Количество должно быть не менее 1');
      return;
    }

    if (deployQty > deployItem.quantity) {
      setDeployError(`Доступно для выдачи всего ${deployItem.quantity} шт.`);
      return;
    }

    const success = onDeployAsset(
      deployItem.inventoryNumber,
      deployQty,
      deployEmployee,
      deployObject
    );

    if (success) {
      setShowDeployModal(false);
    } else {
      setDeployError('Не удалось выдать товар со склада. Возможно, устройство не найдено или возникла непредвиденная ошибка.');
    }
  };

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

  const handleWriteOffPdfUpload = (file: File | null) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Пожалуйста, выберите файл в формате PDF!');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setWriteOffPdf({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} КБ`,
        content: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleOpenReceipt = () => {
    setName('');
    setType('Компьютеры');
    setDeviceType('Ноутбук');
    setModel('');
    setInventoryNumber(`ST-00${Math.floor(Math.random() * 90) + 10}`);
    setQuantity(1);
    setUnit('шт.');
    setCostPerUnit(1000);
    setInvoiceInfo('');
    setMemoInfo('');
    setWarrantyInfo('');
    setPdfFiles([]);
    setReceiptWarehouseName(warehouses[0]?.name || 'Основной склад ИТ');
    
    // Reset Specs
    setShowSpecs(true);
    setSerialNumber('');
    setCpuModel('');
    setRamModel('');
    setHddModel('');
    setGpuModel('');
    setMotherboardModel('');
    setPowerSupplyModel('');
    setCaseModel('');

    setShowReceiptModal(true);
  };

  const handleOpenWriteOff = (defaultInvNum = '') => {
    setWriteOffInvNum(defaultInvNum || warehouseItems[0]?.inventoryNumber || '');
    setWriteOffQty(1);
    setWriteOffReason('');
    setWriteOffPdf(null);
    setWriteOffError('');
    setShowWriteOffModal(true);
  };

  const handleReceiptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = limitEquipmentTitle(name.trim());
    const trimmedModel = limitEquipmentTitle(model.trim());
    if (!trimmedName || !trimmedModel || !inventoryNumber.trim() || quantity < 1 || costPerUnit < 0) return;

    onReceipt({
      name: trimmedName,
      type,
      model: trimmedModel,
      inventoryNumber,
      quantity,
      unit,
      costPerUnit,
      invoiceInfo,
      memoInfo,
      warrantyInfo,
      warehouseName: receiptWarehouseName,
      pdfFiles,
      serialNumber,
      cpuModel,
      ramModel,
      hddModel,
      gpuModel,
      motherboardModel,
      powerSupplyModel,
      caseModel,
      deviceType,
    });

    setShowReceiptModal(false);
  };

  const handleWriteOffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWriteOffError('');

    const targetItem = warehouseItems.find(item => item.inventoryNumber === writeOffInvNum);
    if (!targetItem) {
      setWriteOffError('Элемент с таким инвентарным номером не найден на складе.');
      return;
    }

    if (writeOffQty > targetItem.quantity) {
      setWriteOffError(`Недостаточное количество. На складе всего ${targetItem.quantity} ${targetItem.unit}`);
      return;
    }

    const success = onWriteOff(
      writeOffInvNum, 
      writeOffQty, 
      writeOffReason, 
      writeOffPdf || undefined
    );
    
    if (success) {
      setShowWriteOffModal(false);
    } else {
      setWriteOffError('Произошла ошибка при списании товара.');
    }
  };

  // 1. Standard Warehouse Stock items
  const whUnified = warehouseItems.map(item => ({
    id: item.id,
    name: item.name,
    type: item.type,
    model: item.model,
    inventoryNumber: item.inventoryNumber,
    quantity: item.quantity,
    unit: item.unit || 'шт.',
    costPerUnit: item.costPerUnit || 0,
    status: item.status || 'В наличии',
    location: item.warehouseName || 'Основной склад ИТ',
    employeeName: '—',
    itemSource: 'warehouse' as const,
    warehouseName: item.warehouseName || 'Основной склад ИТ',
  }));

  // 2. Active Issued Computers (status is not "На складе" and not "Списано")
  const compsUnified = (computers || [])
    .filter(c => c.status !== 'На складе' && c.status !== 'Списано')
    .map(c => {
      // Find the warehouse associated with the object location of the computer
      const linkedWhName = warehouses.find(w => w.objectName === c.objectName)?.name || 'Основной склад ИТ';
      return {
        id: c.id,
        name: t(c.deviceType || c.category),
        type: c.category === 'Ноутбук' || c.category === 'ПК' ? 'Компьютеры' : 
              c.category === 'Периферия' || c.category === 'Монитор' ? 'Периферия' :
              c.category === 'Оргтехника' ? 'Оргтехника' :
              c.category === 'Видеонаблюдение' ? 'Видеонаблюдение' :
              c.category === 'Расходники' ? 'Расходные материалы' : 'Другое',
        model: c.model,
        inventoryNumber: c.inventoryNumber,
        quantity: 1,
        unit: 'шт.',
        costPerUnit: c.cost || 0,
        status: c.status === 'В работе' ? 'Привязано' : c.status,
        location: c.objectName,
        employeeName: c.employeeName,
        itemSource: 'computer' as const,
        warehouseName: linkedWhName,
      };
    });

  // 3. Active Network Devices linked to objects
  const netUnified = (networkDevices || [])
    .filter(n => {
      // If there is an active warehouse item with this inventory number and positive quantity,
      // and the network device is located at that warehouse's objectName,
      // it is a stock item that is already shown as part of whUnified. We filter those out to avoid duplication.
      const matchingWhItem = (warehouseItems || []).find(
        item => inventoryNumbersMatch(item.inventoryNumber, n.inventoryNumber) && item.quantity > 0
      );
      if (matchingWhItem) {
        const linkedWh = warehouses.find(w => w.name === matchingWhItem.warehouseName);
        const whObjectName = linkedWh?.objectName || warehouses[0]?.objectName || 'Главный офис';
        if (n.objectName === whObjectName) {
          return false;
        }
      }
      return true;
    })
    .map(n => {
      const linkedWhName = warehouses.find(w => w.objectName === n.objectName)?.name || 'Основной склад ИТ';
      return {
        id: n.id,
        name: n.deviceName,
        type: 'Сетевое оборудование' as const,
        model: n.deviceName,
        inventoryNumber: n.inventoryNumber || 'NET-EQ',
        quantity: n.quantity || 1,
        unit: 'шт.',
        costPerUnit: n.cost || 0,
        status: 'Привязано',
        location: n.objectName,
        employeeName: '—',
        itemSource: 'network' as const,
        warehouseName: linkedWhName,
      };
    });

  // 4. Active Software Licenses / keys (hide stock already shown in whUnified)
  const softUnified = (softwareItems || [])
    .filter((s) => !(s.status === 'Не активирована' && isSoftwareStoredOnWarehouse(s, warehouseItems || [])))
    .map(s => {
    const linkedWhName = warehouses.find(w => w.objectName === s.objectName)?.name || 'Основной склад ИТ';
    return {
      id: s.id,
      name: s.name,
      type: 'Лицензии ПО' as const,
      model: `${s.developer || ''} (v${s.version || ''})`,
      inventoryNumber: s.licenseKey || getSoftwareWarehouseInv(s.id),
      quantity: s.quantity || 1,
      unit: 'шт.',
      costPerUnit: 0,
      status: s.status === 'Активна' ? 'В работе' : s.status === 'Не активирована' ? 'На складе' : s.status,
      location: s.objectName || 'Главный офис',
      employeeName: s.assignedEmployeeName || '—',
      itemSource: 'software' as const,
      warehouseName: linkedWhName,
    };
  });

  // Combine lists of overall company-wide TMZ assets
  const totalUnifiedList = [...whUnified, ...compsUnified, ...netUnified, ...softUnified];

  // Apply filters on the unified assets list
  const filtered = totalUnifiedList.filter(item => {
    // Search matching
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          item.model.toLowerCase().includes(search.toLowerCase()) || 
                          (item.inventoryNumber || '').toLowerCase().includes(search.toLowerCase());
    
    // Category match
    const matchesTab = activeTab === 'Все' || item.type === activeTab;
    
    // Warehouse Filter
    let matchesWarehouse = true;
    if (selectedWarehouseFilter !== 'all') {
      const activeWhName = warehouses.find(w => w.id === selectedWarehouseFilter)?.name;
      const itemWarehouse = item.warehouseName || 'Основной склад ИТ';
      matchesWarehouse = (itemWarehouse === activeWhName);
    }

    // Placement status filter
    let matchesPlacement = true;
    if (placementFilter === 'stock') {
      matchesPlacement = item.itemSource === 'warehouse' || (item.itemSource === 'software' && item.status === 'На складе');
    } else if (placementFilter === 'issued') {
      matchesPlacement = item.itemSource === 'computer' || item.itemSource === 'network' || (item.itemSource === 'software' && item.status === 'В работе');
    }

    return matchesSearch && matchesTab && matchesWarehouse && matchesPlacement;
  });

  // Math metrics for selected warehouse vs total company TMZ
  const selectedWhName = selectedWarehouseFilter === 'all' 
    ? 'Все склады' 
    : warehouses.find(w => w.id === selectedWarehouseFilter)?.name || 'Основной склад ИТ';

  const whSpecificItems = totalUnifiedList.filter(item => {
    if (selectedWarehouseFilter === 'all') return true;
    const activeWh = warehouses.find(w => w.id === selectedWarehouseFilter);
    return item.warehouseName === activeWh?.name;
  });

  const selectedWarehouseSum = whSpecificItems.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0);
  const selectedWarehouseCount = whSpecificItems.reduce((sum, item) => sum + item.quantity, 0);

  // Total company TMZ value metric
  const grandCompanyValueSum = totalUnifiedList.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0);
  const grandCompanyValueCount = totalUnifiedList.reduce((sum, item) => sum + item.quantity, 0);

  const [currency, setCurrency] = useState<'RUB' | 'USD' | 'CNY'>('RUB');

  const formatCurrency = (val: number) => {
    let loc = 'ru-RU';
    let cur = 'RUB';
    let convertedValue = val;

    if (currency === 'USD') {
      loc = 'en-US';
      cur = 'USD';
      convertedValue = val / 90;
    } else if (currency === 'CNY') {
      loc = 'zh-CN';
      cur = 'CNY';
      convertedValue = val / 12;
    }

    return new Intl.NumberFormat(loc, { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(convertedValue);
  };

  // Export Warehouse Stock to CSV
  const exportToCSV = () => {
    const headers = ['Наименование,Тип,Модель,Инвентарный номер,Количество,Ед. изм.,Стоимость за ед.,Общая стоимость,Статус'];
    const rows = warehouseItems.map(item => 
      `"${item.name}","${item.type}","${item.model}","${item.inventoryNumber}",${item.quantity},"${item.unit}",${item.costPerUnit},${item.costPerUnit * item.quantity},"${item.status}"`
    );
    const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `warehouse_stock_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Sub-navigation tabs for Warehouse views */}
      <div className="flex border-b border-slate-100 bg-white p-2 rounded-xl border shadow-3xs gap-1">
        <button
          onClick={() => setCurrentWhTab('stock')}
          className={`flex items-center gap-2 py-2 px-4 text-xs font-bold rounded-lg transition-all ${
            currentWhTab === 'stock'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          <Warehouse size={13} />
          {t("ТМЦ в наличии")}
        </button>
        <button
          onClick={() => setCurrentWhTab('history')}
          className={`flex items-center gap-2 py-2 px-4 text-xs font-bold rounded-lg transition-all ${
            currentWhTab === 'history'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          <ClipboardList size={13} />
          {t("История списаний складов")}
        </button>
        <button
          onClick={() => setCurrentWhTab('warehouses')}
          className={`flex items-center gap-2 py-2 px-4 text-xs font-bold rounded-lg transition-all ${
            currentWhTab === 'warehouses'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          <Building size={13} />
          {t("Управление складами")} {warehouses.length > 0 && `(${warehouses.length})`}
        </button>
      </div>

      {/* Dynamic Summary Panel */}
      <div className="bg-gradient-to-r from-slate-800 to-indigo-900 text-white p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md border border-slate-700/50">
        <div className="space-y-1">
          <span className="text-indigo-200 text-xs font-semibold tracking-wider uppercase">
            {currentWhTab === 'history' 
              ? t("СПИСАНО С ПРЕДПРИЯТИЯ") 
              : selectedWarehouseFilter === 'all'
                ? t("СТОИМОСТЬ (ВСЕ СКЛАДЫ)") 
                : `${t("СТОИМОСТЬ")} (${t(selectedWhName).toUpperCase()})`}
          </span>
          <div className="text-3xl font-extrabold tracking-tight md:text-4xl">
            {currentWhTab === 'history'
              ? formatCurrency(warehouseWriteOffs.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0))
              : formatCurrency(selectedWarehouseSum)}
          </div>
          {currentWhTab !== 'history' ? (
            <div className="space-y-1">
              <p className="text-slate-350 text-xs text-indigo-150">
                {t("Наличие в выбранном разрезе складов:")} <strong className="text-white font-semibold">{selectedWarehouseCount} {t("ед.")}</strong>
              </p>
              <div className="text-xs text-indigo-200 font-medium mt-1 pt-1.5 border-t border-indigo-500/30">
                {t("ОБЩАЯ СТОИМОСТЬ ПО КОМПАНИИ:")}{' '}
                <strong className="text-lime-300 font-bold select-all">{formatCurrency(grandCompanyValueSum)}</strong>{' '}
                <span className="text-[10px] text-indigo-200">({grandCompanyValueCount} {t("активов и ТМЦ")})</span>
              </div>
            </div>
          ) : (
            <p className="text-slate-350 text-xs text-indigo-150">
              {t("Общая история:")} <strong className="text-white font-semibold">{warehouseWriteOffs.length} {t("актов списания")}</strong>
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2.5">
          <select 
            value={currency} 
            onChange={(e) => setCurrency(e.target.value as 'RUB' | 'USD' | 'CNY')}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl text-xs font-semibold text-white cursor-pointer focus:outline-none transition-all shadow-sm"
          >
            <option value="RUB">RUB ₽</option>
            <option value="USD">USD $</option>
            <option value="CNY">CNY ¥</option>
          </select>
          <button 
            onClick={exportToCSV}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ml-1"
          >
            <Download size={13} />
            {t("Экспорт ТМЦ в CSV")}
          </button>
          {!isViewer && (
            <>
              <button
                onClick={handleOpenReceipt}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer text-white border border-blue-500"
              >
                <Plus size={13} />{t("Поступление")}</button>
              <button
                onClick={() => handleOpenWriteOff()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer text-white border border-rose-500"
              >
                <Minus size={13} />{t("Списание")}</button>
            </>
          )}
        </div>
      </div>

      {/* RENDER TAB 1: STOCK INVENTORY */}
      {currentWhTab === 'stock' && (
        <div className="space-y-6">
          {/* Control Filters and Tabs */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative w-full max-w-md">
                <input
                  type="text"
                  placeholder={t("Быстрый поиск по названию или штрих-коду...")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-705"
                />
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>

              {/* Warehouse selector dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-bold uppercase">{t("Склад:")}</span>
                <select
                  value={selectedWarehouseFilter}
                  onChange={(e) => setSelectedWarehouseFilter(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-650 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="all">{t("Все склады")}</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.objectName})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Placement Segment Control (All / Stock / Issued) */}
            <div className="flex border-b border-slate-100 pb-2 mb-2 gap-1 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setPlacementFilter('all')}
                className={`py-1.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  placementFilter === 'all'
                    ? 'bg-slate-800 text-white shadow-xs font-semibold'
                    : 'text-slate-500 hover:bg-slate-50/50 hover:text-slate-800'
                }`}
              >
                {t("Все ТМЦ и активы")} ({totalUnifiedList.length})
              </button>
              <button
                type="button"
                onClick={() => setPlacementFilter('stock')}
                className={`py-1.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  placementFilter === 'stock'
                    ? 'bg-slate-800 text-white shadow-xs font-semibold'
                    : 'text-slate-500 hover:bg-slate-50/50 hover:text-slate-800'
                }`}
              >
                {t("На складе")} ({whUnified.length + softUnified.filter(s => s.status === 'На складе').length})
              </button>
              <button
                type="button"
                onClick={() => setPlacementFilter('issued')}
                className={`py-1.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  placementFilter === 'issued'
                    ? 'bg-slate-800 text-white shadow-xs font-semibold'
                    : 'text-slate-500 hover:bg-slate-50/50 hover:text-slate-800'
                }`}
              >
                {t("В работе")} ({compsUnified.length + netUnified.length + softUnified.filter(s => s.status === 'В работе').length})
              </button>
            </div>

            {/* Dynamic Category Filter bar matching the dashboard layout */}
            <div className="flex flex-wrap gap-1 border-t border-slate-50 pt-3 overflow-x-auto scrollbar-none">
              {(['Все', 'Компьютеры', 'Сетевое оборудование', 'Периферия', 'Оргтехника', 'Видеонаблюдение', 'Расходные материалы', 'Лицензии ПО', 'Другое'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-blue-600 text-white shadow-xs font-semibold'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  {t(tab)}
                </button>
              ))}
            </div>
          </div>

          {/* Stock Inventory Table View */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400">
                    <th className="py-3 px-5 font-semibold text-slate-500 text-xs uppercase tracking-wider">{t("Товар / Склад хранения")}</th>
                    <th className="py-3 px-5 font-semibold text-slate-500 text-xs uppercase tracking-wider">{t("Категория")}</th>
                    <th className="py-3 px-5 font-semibold text-slate-500 text-xs uppercase tracking-wider">{t("Модель")}</th>
                    <th className="py-3 px-5 font-semibold text-slate-500 text-xs uppercase tracking-wider">{t("Инвентарный номер")}</th>
                    <th className="py-3 px-5 text-center font-semibold text-slate-500 text-xs uppercase tracking-wider">{t("Остаток")}</th>
                    <th className="py-3 px-5 font-semibold text-slate-500 text-xs uppercase tracking-wider">{t("Ед.")}</th>
                    <th className="py-3 px-5 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider">{t("Цена за ед.")}</th>
                    <th className="py-3 px-5 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider">{t("Общая сумма")}</th>
                    <th className="py-3 px-5 text-center font-semibold text-slate-500 text-xs uppercase tracking-wider">{t("Статус")}</th>
                    <th className="py-3 px-5 text-center font-semibold text-slate-500 text-xs uppercase tracking-wider">{t("Действия")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-5 font-medium text-slate-850">
                        <div className="flex items-center gap-2.5">
                          <span className="p-2 bg-blue-50 text-blue-601 rounded-xl shrink-0">
                            <Warehouse size={15} />
                          </span>
                          <div className="flex flex-col">
                            <span 
                              onClick={() => onViewDetails?.(item.itemSource === 'warehouse' ? 'warehouse' : item.itemSource === 'computer' ? 'computer' : 'network', item.id)}
                              className="hover:text-blue-650 hover:underline cursor-pointer font-bold text-slate-900"
                            >
                              {item.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold flex items-center flex-wrap gap-1 mt-0.5">
                              <span>{item.warehouseName || 'Основной склад ИТ'}</span>
                              {item.employeeName && item.employeeName !== '—' ? (
                                <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[9px] font-bold border border-amber-200">
                                  {t("В работе:")} {item.employeeName} ({item.location})
                                </span>
                              ) : item.itemSource !== 'warehouse' ? (
                                <span className="text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[9px] font-bold border border-indigo-200">
                                  {t("Привязано к объекту:")} {item.location}
                                </span>
                              ) : null}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 text-xs font-semibold">{t(item.type)}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-bold">{item.model}</td>
                      <td className="py-3.5 px-5 font-mono text-slate-500 text-xs font-bold">{item.inventoryNumber}</td>
                      <td className="py-3.5 px-5 text-center">
                        <span className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold ${item.quantity <= 2 ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'text-slate-800 bg-slate-100'}`}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-450 text-xs">{item.unit || 'шт.'}</td>
                      <td className="py-3.5 px-5 text-right font-mono text-slate-650 font-medium">{formatCurrency(item.costPerUnit)}</td>
                      <td className="py-3.5 px-5 text-right font-mono font-extrabold text-slate-900">{formatCurrency(item.costPerUnit * item.quantity)}</td>
                      <td className="py-3.5 px-5 text-center">
                        {item.itemSource === 'warehouse' ? (
                          item.status === 'Заказано' ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                              {t("Заказано")}
                            </span>
                          ) : item.status === 'Списано' ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              {t("Списано")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              {t("На складе")}
                            </span>
                          )
                        ) : (
                          item.status === 'На ремонте' ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                              {t("На ремонте")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                              {t("В работе")}
                            </span>
                          )
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {item.itemSource === 'warehouse' ? (
                            <>
                              {!isViewer && (
                                <button
                                  onClick={() => handleOpenWriteOff(item.inventoryNumber)}
                                  className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  title={t("Списать")}
                                >
                                  <Minus size={14} />
                                </button>
                              )}
                              {!isViewer && onDeployAsset && (
                                <button
                                  onClick={() => handleOpenDeploy(item)}
                                  className="px-2 py-1.5 hover:bg-indigo-50 border border-indigo-100 hover:border-indigo-200 rounded-lg text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                                  title={t("Прикрепить / Выдать ТМЦ на объект")}
                                >
                                  <Plus size={11} className="text-indigo-500 shrink-0" />
                                  <span>{t("Выдать")}</span>
                                </button>
                              )}
                              {!isViewer && warehouses.length > 1 && (
                                <button
                                  onClick={() => handleOpenStockTransfer(item)}
                                  className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-500 hover:text-amber-700 transition-colors cursor-pointer"
                                  title={t("Переместить на другой склад")}
                                >
                                  <ArrowLeftRight size={14} />
                                </button>
                              )}
                              {!isViewer && onDeleteEquipment && (
                                <button
                                  onClick={() => onDeleteEquipment('warehouse', item.id)}
                                  className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                                  title={t("Удалить везде")}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </>
                          ) : (
                            <div className="flex flex-col items-center gap-1.5">
                              {!isViewer && onDeleteEquipment && (
                                <button
                                  onClick={() =>
                                    onDeleteEquipment(
                                      item.itemSource === 'network'
                                        ? 'network'
                                        : item.itemSource === 'software'
                                          ? 'software'
                                          : 'computer',
                                      item.id
                                    )
                                  }
                                  className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                                  title={t("Удалить везде")}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                              <span className="text-[10px] text-slate-400 italic font-medium">
                                {item.status === 'На ремонте' ? t("На ремонте") : item.employeeName && item.employeeName !== '—' ? t("Выдан коллеге") : t("В работе")}
                              </span>
                              {!isViewer && (
                                <button
                                  onClick={() => handleOpenActiveAssetTransition(item)}
                                  className="px-2 py-1 hover:bg-emerald-50 border border-emerald-100 hover:border-emerald-200 rounded-lg text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                                  title={t("Вернуть на склад или переместить")}
                                >
                                  <RotateCcw size={11} className="text-emerald-500 shrink-0" />
                                  <span>{t("Действие")}</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={10} className="text-center py-10 text-slate-400">{t("На балансе склада нет позиций по заданным критериям фильтрации.")}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RENDER TAB 2: WRITE-OFFS HISTORY */}
      {currentWhTab === 'history' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <ClipboardList size={16} className="text-slate-500" />
              {t("История списаний и утилизации материальных ценностей")}
            </h3>
            <p className="text-xs text-slate-455">
              {t("Здесь отображаются все оформленные акты списания с указанием технического обоснования от сервисного центра и причин.")}
            </p>

            <div className="overflow-x-auto border border-slate-100 rounded-xl bg-slate-50/20">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-400">
                    <th className="py-3 px-4 font-semibold text-slate-500 text-xs uppercase">{t("Дата списания")}</th>
                    <th className="py-3 px-4 font-semibold text-slate-500 text-xs uppercase">{t("Склад")}</th>
                    <th className="py-3 px-4 font-semibold text-slate-500 text-xs uppercase">{t("Наименование / Модель")}</th>
                    <th className="py-3 px-4 font-semibold text-slate-500 text-xs uppercase">{t("Инвентарный")}</th>
                    <th className="py-3 px-4 text-center font-semibold text-slate-500 text-xs uppercase">{t("Кол-во")}</th>
                    <th className="py-3 px-4 text-right font-semibold text-slate-500 text-xs uppercase">{t("Стоимость")}</th>
                    <th className="py-3 px-4 font-semibold text-slate-500 text-xs uppercase">{t("Причина утилизации и технический акт")}</th>
                    <th className="py-3 px-4 text-center font-semibold text-slate-500 text-xs uppercase">{t("Действия")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                  {warehouseWriteOffs.map((wo) => (
                    <tr key={wo.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 text-slate-500 font-semibold text-xs font-mono">{wo.date}</td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs font-bold">{wo.warehouseName || 'Основной склад ИТ'}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{wo.name}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">{wo.model} ({t(wo.type)})</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 text-xs font-bold">{wo.inventoryNumber}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 font-mono text-xs font-bold">
                          -{wo.quantity} {wo.unit || 'шт.'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">
                        {formatCurrency(wo.costPerUnit * wo.quantity)}
                      </td>
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="text-xs text-slate-650 font-medium italic break-words mb-1">
                          "{wo.reason}"
                        </div>
                        {wo.pdfFile ? (
                          <a
                            href={wo.pdfFile.content}
                            download={wo.pdfFile.name}
                            className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-1 rounded-md transition-all border border-blue-100"
                          >
                            <FileText size={11} className="text-blue-600 animate-pulse" />
                            <span>{wo.pdfFile.name} ({wo.pdfFile.size || 'PDF'})</span>
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">{t("Без технического заключения")}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center select-none">
                        {!isViewer && onDeleteWriteOff && (
                          <button
                            type="button"
                            onClick={() => onDeleteWriteOff(wo.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-slate-405 hover:text-red-600 transition-colors cursor-pointer"
                            title={t("Удалить из истории")}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {warehouseWriteOffs.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400">{t("Ни одного оборудования еще не было списано по акту.")}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RENDER TAB 3: MANAGE WAREHOUSES */}
      {currentWhTab === 'warehouses' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* New Warehouse creation form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-850 text-sm flex items-center gap-1.5">
              <Plus size={16} className="text-blue-600" />
              {t("Построить / Добавить склад")}
            </h3>
            <p className="text-xs text-slate-400">
              {t("Вы можете создать дополнительный филиальный склад и жестко привязать его к физическому объекту из списка недвижимости.")}
            </p>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!newWhName.trim()) return;
                if (warehouses.some(w => w.name.toLowerCase() === newWhName.trim().toLowerCase())) {
                  alert('Склад с таким названием уже существует!');
                  return;
                }
                const newWh: CustomWarehouse = {
                  id: `wh-${Date.now()}`,
                  name: newWhName.trim(),
                  objectName: newWhObject,
                  description: newWhDesc.trim() || 'Филиальный склад IT оборудования',
                  isCustom: true
                };
                setWarehouses(prev => [...prev, newWh]);
                setNewWhName('');
                setNewWhDesc('');
                alert(`Филиальный склад "${newWh.name}" зарегистрирован и закреплен за объектом "${newWh.objectName}"!`);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t("Название склада")}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Склад Солигорск"
                  value={newWhName}
                  onChange={(e) => setNewWhName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-slate-700"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t("Привязка к объекту")}</label>
                <select
                  value={newWhObject}
                  onChange={(e) => setNewWhObject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white focus:outline-none text-slate-700 cursor-pointer"
                >
                  {objects.map(obj => (
                    <option key={obj.id} value={obj.name}>{obj.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t("Описание склада (опц.)")}</label>
                <textarea
                  placeholder="Временный склад для ремонта ТМЦ на южном филиале"
                  value={newWhDesc}
                  onChange={(e) => setNewWhDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-slate-755 h-20"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-3xs"
              >
                {t("Создать склад")}
              </button>
            </form>
          </div>

          {/* List of active Warehouses */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-850 text-sm flex items-center gap-1.5">
              <Building size={16} className="text-slate-500" />
              {t("Зарегистрированные структуры складов ТМЦ")}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Default Main Warehouse (Non-deletable) */}
              <div className="border border-blue-150 bg-gradient-to-br from-blue-50/20 to-indigo-50/10 p-4 rounded-xl flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="p-1 px-1.5 rounded-md bg-blue-600 text-white text-[9px] font-bold uppercase">{t("ГЛАВНЫЙ")}</span>
                    <h4 className="font-bold text-sm text-slate-800">Основной склад ИТ</h4>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {t("Главный распределительный архивный склад для закупки техники.")}
                  </p>
                </div>
                
                <div className="flex justify-between items-center text-[11px] text-slate-455 border-t pt-2 border-slate-100">
                  <span>{t("Связанный объект:")} <strong className="text-slate-700">Главный офис</strong></span>
                </div>
              </div>

              {/* Custom Warehouses loops */}
              {warehouses.filter(w => w.id !== 'wh-1').map(w => (
                <div key={w.id} className="border border-slate-150 p-4 rounded-xl flex flex-col justify-between space-y-3 bg-white hover:shadow-2xs transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-800">{w.name}</h4>
                      <button
                        onClick={() => {
                          if (confirm(`Вы действительно хотите безвозвратно удалить подразделение склада "${w.name}"?`)) {
                            setWarehouses(prev => prev.filter(item => item.id !== w.id));
                          }
                        }}
                        className="text-xs text-rose-500 hover:text-rose-700 hover:underline font-bold cursor-pointer"
                      >
                        {t("Удалить")}
                      </button>
                    </div>
                    <p className="text-xs text-slate-550 leading-relaxed font-semibold">{w.description}</p>
                  </div>
                  
                  <div className="flex justify-between items-center text-[11px] text-slate-455 border-t pt-2 border-slate-100">
                    <span>{t("Объект:")} <strong className="text-slate-700">{w.objectName}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: + Поступление (Restock/Add stock card) */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden transform transition-all border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 shrink-0 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-lg text-slate-850 flex items-center gap-2 animate-fade-in">
                  <Warehouse className="text-blue-600" />{t("Новое поступление на Склад")}</h3>
                <p className="text-[11px] text-slate-400 mt-1">{t("Автоматически распределяется в ИТ-отдел со статусом 'На складе'.")}</p>
              </div>
              <ModalCloseButton onClick={() => setShowReceiptModal(false)} />
            </div>

            <form onSubmit={handleReceiptSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Группа ТМЦ")}</label>
                  <select
                    value={type}
                    onChange={(e) => {
                      const newType = e.target.value as WarehouseItemType;
                      setType(newType);
                      const options = getDeviceTypesForReceiptGroup(newType);
                      setDeviceType(options[0] || 'Другое');
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-semibold"
                  >
                    <option value="Компьютеры">{t("Компьютеры")}</option>
                    <option value="Сетевое оборудование">{t("Сетевое оборудование")}</option>
                    <option value="Периферия">{t("Периферия")}</option>
                    <option value="Оргтехника">{t("Оргтехника")}</option>
                    <option value="Видеонаблюдение">{t("Видеонаблюдение")}</option>
                    <option value="Расходные материалы">{t("Расходные материалы")}</option>
                    <option value="Лицензии ПО">{t("Лицензии ПО")}</option>
                    <option value="Другое">{t("Другое")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Тип оборудования")}</label>
                  <select
                    value={deviceType}
                    onChange={(e) => setDeviceType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
                  >
                    {getDeviceTypesForReceiptGroup(type).map((opt) => (
                      <option key={opt} value={opt}>
                        {t(opt)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Склад хранения")}</label>
                  <select
                    value={receiptWarehouseName}
                    onChange={(e) => setReceiptWarehouseName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-semibold"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.name}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Наименование товара")}</label>
                  <input
                    type="text"
                    required
                    maxLength={EQUIPMENT_TITLE_MAX_LENGTH}
                    placeholder="e.g. Ноутбук ASUS ExpertBook"
                    value={name}
                    onChange={(e) => setName(limitEquipmentTitle(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-slate-700"
                  />
                  <span className="text-[10px] text-slate-400">{name.length}/{EQUIPMENT_TITLE_MAX_LENGTH}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Модель")}</label>
                  <input
                    type="text"
                    required
                    maxLength={EQUIPMENT_TITLE_MAX_LENGTH}
                    placeholder="e.g. L2400CDA"
                    value={model}
                    onChange={(e) => setModel(limitEquipmentTitle(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-slate-700"
                  />
                  <span className="text-[10px] text-slate-400">{model.length}/{EQUIPMENT_TITLE_MAX_LENGTH}</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Код / Штрихкод")}</label>
                  <input
                    type="text"
                    required
                    placeholder="ST-0001"
                    value={inventoryNumber}
                    onChange={(e) => setInventoryNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-mono"
                  />
                </div>
              </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Количество")}</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Ед. изм.")}</label>
                    <input
                      type="text"
                      required
                      placeholder="шт."
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
                    />
                  </div>
                </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Стоимость (шт.)")}</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-mono"
                  />
                </div>
                {type !== 'Расходные материалы' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Серийный номер")}</label>
                    <input
                      type="text"
                      placeholder="e.g. S/N: CN-0HG..."
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Computer / laptop / server specifications */}
              {receiptHasComputerSpecs && (
                <div className="border border-slate-150 rounded-xl p-3 bg-slate-50/50 space-y-2 shrink-0">
                  <div 
                    className="flex items-center justify-between cursor-pointer select-none"
                    onClick={() => setShowSpecs(!showSpecs)}
                  >
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                      {showSpecs ? "▼ " : "► "}
                      {t("Матрица КТ / Характеристики компьютера")}
                    </span>
                    <span className="text-[10px] text-blue-600 font-bold hover:underline">
                      {showSpecs ? t("Скрыть спецификации") : t("Заполнить спецификации")}
                    </span>
                  </div>
                  {quantity > 1 && (
                    <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5 leading-relaxed">
                      {t("При количестве более 1 шт. указанные характеристики будут применены к каждой единице в реестре. Серийный номер, если указан, получит суффикс -1, -2 и т.д.")}
                    </p>
                  )}
                  
                  {showSpecs && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/50">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">{t("Серийный номер")}</label>
                        <input
                          type="text"
                          placeholder="S/N: 4859HSK293"
                          value={serialNumber}
                          onChange={(e) => setSerialNumber(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-250 bg-white rounded-lg text-[11px] font-medium focus:ring-1 focus:ring-blue-500/50 text-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">{t("Процессор (CPU)")}</label>
                        <input
                          type="text"
                          placeholder="Intel Core i7-12705H"
                          value={cpuModel}
                          onChange={(e) => setCpuModel(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-250 bg-white rounded-lg text-[11px] font-medium focus:ring-1 focus:ring-blue-500/50 text-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">{t("Оперативная память (RAM)")}</label>
                        <input
                          type="text"
                          placeholder="16GB DDR5 4800MHz"
                          value={ramModel}
                          onChange={(e) => setRamModel(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-250 bg-white rounded-lg text-[11px] font-medium focus:ring-1 focus:ring-blue-500/50 text-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">{t("Накопитель (SSD/HDD)")}</label>
                        <input
                          type="text"
                          placeholder="Kingston 1TB NVMe PCIe 4.0"
                          value={hddModel}
                          onChange={(e) => setHddModel(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-250 bg-white rounded-lg text-[11px] font-medium focus:ring-1 focus:ring-blue-500/50 text-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">{t("Видеокарта (GPU)")}</label>
                        <input
                          type="text"
                          placeholder="NVIDIA RTX 4060 Laptop"
                          value={gpuModel}
                          onChange={(e) => setGpuModel(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-250 bg-white rounded-lg text-[11px] font-medium focus:ring-1 focus:ring-blue-500/50 text-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">{t("Материнская плата")}</label>
                        <input
                          type="text"
                          placeholder="ASUS ROG Strix B650"
                          value={motherboardModel}
                          onChange={(e) => setMotherboardModel(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-250 bg-white rounded-lg text-[11px] font-medium focus:ring-1 focus:ring-blue-500/50 text-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">{t("Блок питания")}</label>
                        <input
                          type="text"
                          placeholder="Corsair RM750x 750W"
                          value={powerSupplyModel}
                          onChange={(e) => setPowerSupplyModel(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-250 bg-white rounded-lg text-[11px] font-medium focus:ring-1 focus:ring-blue-500/50 text-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">{t("Корпус")}</label>
                        <input
                          type="text"
                          placeholder="NZXT H5 Flow Black"
                          value={caseModel}
                          onChange={(e) => setCaseModel(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-250 bg-white rounded-lg text-[11px] font-medium focus:ring-1 focus:ring-blue-500/50 text-slate-700"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION: Supplementary Documents (Invoice, Internal Memo, and Warranty card) */}
              <div className="space-y-4 pt-4 border-t border-slate-100 bg-slate-50/50 p-4 rounded-2xl">
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider">{t("Сопроводительные документы")}</h4>
                
                {/* Document 1: Invoice */}
                <div className="space-y-2.5 bg-white p-3 rounded-xl border border-slate-150 shadow-3xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t("Счет (реквизиты, номер, комментарий)")}</label>
                    <input
                      type="text"
                      placeholder={t("Счет № 4758-ИТ от 12.05.2026 на сумму 85 000 руб.")}
                      value={invoiceInfo}
                      onChange={(e) => setInvoiceInfo(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-250 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-slate-700 font-medium"
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
                        <div key={idx} className="flex items-center gap-1.5 bg-blue-50 border border-blue-150 text-blue-800 text-[10px] px-2.5 py-1 rounded-md max-w-[200px] truncate">
                          <FileText size={10} className="shrink-0 text-blue-600" />
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
                      className="w-full px-3 py-1.5 border border-slate-250 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-slate-700 font-medium"
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
                        <div key={idx} className="flex items-center gap-1.5 bg-blue-50 border border-blue-150 text-blue-800 text-[10px] px-2.5 py-1 rounded-md max-w-[200px] truncate">
                          <FileText size={10} className="shrink-0 text-blue-600" />
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
                      className="w-full px-3 py-1.5 border border-slate-250 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-slate-700 font-medium"
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
                        <div key={idx} className="flex items-center gap-1.5 bg-blue-50 border border-blue-150 text-blue-800 text-[10px] px-2.5 py-1 rounded-md max-w-[200px] truncate">
                          <FileText size={10} className="shrink-0 text-blue-600" />
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

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-105 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >{t("Отмена")}</button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                >{t("Принять на склад")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: - Списание (Write Off warehouse units) */}
      {showWriteOffModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all p-6 space-y-4 border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="shrink-0 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-lg text-rose-600 flex items-center gap-2">
                  <AlertTriangle size={20} />{t("Списание ТМЦ со склада")}</h3>
                <p className="text-[11px] text-slate-400 mt-1">{t("Укажите техническое заключение и причину списания устройства с баланса.")}</p>
              </div>
              <ModalCloseButton onClick={() => setShowWriteOffModal(false)} />
            </div>

            {writeOffError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl font-medium border border-rose-100 shrink-0">
                {writeOffError}
              </div>
            )}

            <form onSubmit={handleWriteOffSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Выберите товар для списания")}</label>
                <select
                  value={writeOffInvNum}
                  onChange={(e) => setWriteOffInvNum(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-semibold cursor-pointer"
                >
                  {warehouseItems.map(item => (
                    <option key={item.id} value={item.inventoryNumber}>
                      {item.name} ({item.inventoryNumber}) — В наличии {item.quantity} {item.unit || 'шт.'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Количество для списания")}</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={writeOffQty}
                    onChange={(e) => setWriteOffQty(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Статус утилизации")}</label>
                  <div className="w-full px-3 py-2 border border-slate-105 bg-slate-50 rounded-lg text-xs font-bold text-rose-600">
                    {t("Списано по акту")}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Причина утилизации / списания")}</label>
                <textarea
                  required
                  rows={3}
                  placeholder={t("Вышла из строя материнская плата ноутбука. Цена ремонта превышает остаточную стоимость покупки нового.")}
                  value={writeOffReason}
                  onChange={(e) => setWriteOffReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 text-slate-750"
                />
              </div>

              {/* TECHNICAL REPORT DOCUMENT */}
              <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-150 space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">{t("Техническое заключение СЦ о списании")}</label>
                
                <div className="flex items-center gap-3">
                  <label className="relative flex items-center gap-1.5 bg-white hover:bg-slate-105 border border-slate-250 px-2.5 py-1.5 rounded-md text-[11px] font-bold text-slate-650 cursor-pointer transition-all shadow-3xs">
                    <Upload size={12} className="text-slate-500" />
                    <span>{t("Выберите PDF заключение СЦ")}</span>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleWriteOffPdfUpload(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                  
                  {writeOffPdf && (
                    <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-150 text-blue-800 text-[10px] px-2.5 py-1 rounded-md max-w-[200px] truncate">
                      <FileText size={10} className="shrink-0 text-blue-600" />
                      <span className="truncate">{writeOffPdf.name}</span>
                      <button
                        type="button"
                        onClick={() => setWriteOffPdf(null)}
                        className="text-rose-500 hover:text-rose-700 font-bold ml-1 cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowWriteOffModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >{t("Отмена")}</button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
                >{t("Провести списание")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RENDER MODAL 4: DEPLOY ASSET TO OBJECT / EMPLOYEE */}
      {showDeployModal && deployItem && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[92vh] overflow-y-auto transform transition-all p-6 space-y-4 border border-slate-100">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2">
              <h3 className="font-bold text-lg text-slate-800">
                {t("Выдать ТМЦ со склада")}
              </h3>
              <ModalCloseButton onClick={() => setShowDeployModal(false)} />
            </div>
            
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1">
              <div><strong>{t("Артикул:")}</strong> {deployItem.name}</div>
              <div><strong>{t("Модель:")}</strong> {deployItem.model}</div>
              <div><strong>{t("Доступно на складе:")}</strong> {deployItem.quantity} {deployItem.unit || 'шт.'}</div>
              <div><strong>{t("Инвентарный №:")}</strong> {deployItem.inventoryNumber}</div>
            </div>

            <form onSubmit={handleDeploySubmit} className="space-y-4">
              {deployError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-100">
                  {deployError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Прикрепить к объекту (филиал)")}</label>
                <select
                  value={deployObject}
                  onChange={(e) => setDeployObject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-semibold"
                >
                  {objects.map(obj => (
                    <option key={obj.id} value={obj.name}>{obj.name}</option>
                  ))}
                </select>
              </div>

              {deployItem.type !== 'Сетевое оборудование' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Закрепить за сотрудником")}</label>
                  <select
                    value={deployEmployee}
                    onChange={(e) => setDeployEmployee(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-semibold"
                  >
                    <option value="Общего пользования">{t("Общего пользования")}</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.name}>{emp.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Количество для выдачи")}</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={deployItem.quantity}
                  value={deployQty}
                  onChange={(e) => setDeployQty(Math.min(deployItem.quantity, Math.max(1, Number(e.target.value))))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  {t("Каждое выданное устройство будет автоматически переведено в статус \"В работе\" и закреплено за объектом.")}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDeployModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {t("Отмена")}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  {t("Подтвердить выдачу")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RENDER MODAL 5: RETURN OR MOVE ACTIVE ISSUED EQUIPMENT */}
      {showActiveAssetTransitionModal && transitionAssetItem && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[92vh] overflow-y-auto transform transition-all p-6 space-y-4 border border-slate-100">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2">
              <h3 className="font-bold text-lg text-slate-800">
                {t("Управление выданным оборудованием")}
              </h3>
              <ModalCloseButton onClick={() => setShowActiveAssetTransitionModal(false)} />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1">
              <div><strong>{t("Оборудование:")}</strong> {transitionAssetItem.name} ({transitionAssetItem.model})</div>
              <div><strong>{t("Инвентарный №:")}</strong> {transitionAssetItem.inventoryNumber}</div>
              <div><strong>{t("Текущее расположение:")}</strong> {transitionAssetItem.location} ({transitionAssetItem.employeeName || 'Основной'})</div>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setTransitionMode('return')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  transitionMode === 'return' ? 'bg-white text-slate-850 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t("Вернуть на склад")}
              </button>
              <button
                type="button"
                onClick={() => setTransitionMode('transfer')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  transitionMode === 'transfer' ? 'bg-white text-slate-850 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t("Переместить на объект")}
              </button>
            </div>

            <form onSubmit={handleActiveAssetTransitionSubmit} className="space-y-4">
              {transitionError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-100">
                  {transitionError}
                </div>
              )}

              {transitionMode === 'return' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Целевой склад для возврата")}</label>
                  <select
                    value={transitionTargetWarehouse}
                    onChange={(e) => setTransitionTargetWarehouse(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-semibold"
                  >
                    {warehouses.map(wh => (
                      <option key={wh.id} value={wh.name}>{wh.name}</option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 block mt-1.5 text-justify">
                    {t("Оборудование исчезнет из группы активного оборудования и будет возвращено как свободный остаток на выбранный склад.")}
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Новый объект (Филиал)")}</label>
                    <select
                      value={transitionTargetObject}
                      onChange={(e) => setTransitionTargetObject(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-semibold"
                    >
                      {objects.map(obj => (
                        <option key={obj.id} value={obj.name}>{obj.name}</option>
                      ))}
                    </select>
                  </div>

                  {transitionAssetItem.itemSource === 'computer' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Закрепить за сотрудником")}</label>
                      <select
                        value={transitionTargetEmployee}
                        onChange={(e) => setTransitionTargetEmployee(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-semibold"
                      >
                        <option value="Без изменений">{t("Оставить текущего сотрудника")}</option>
                        <option value="Общего пользования">{t("Общего пользования")}</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.name}>{emp.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <span className="text-[10px] text-slate-400 block mt-1.5 text-justify">
                    {t("Оборудование будет виртуально перемещено и закреплено за новой локацией.")}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowActiveAssetTransitionModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {t("Отмена")}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  {t("Подтвердить")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RENDER MODAL 6: INTER-WAREHOUSE STOCK TRANSFER */}
      {showStockTransferModal && transferStockItem && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[92vh] overflow-y-auto transform transition-all p-6 space-y-4 border border-slate-100">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2">
              <h3 className="font-bold text-lg text-slate-800">
                {t("Переместить ТМЦ на другой склад")}
              </h3>
              <ModalCloseButton onClick={() => setShowStockTransferModal(false)} />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1">
              <div><strong>{t("ТМЦ:")}</strong> {transferStockItem.name} ({transferStockItem.model})</div>
              <div><strong>{t("Инвентарный №:")}</strong> {transferStockItem.inventoryNumber}</div>
              <div><strong>{t("Текущий склад:")}</strong> {transferSourceWarehouse}</div>
              <div><strong>{t("Доступно:")}</strong> {transferStockItem.quantity} {transferStockItem.unit || 'шт.'}</div>
            </div>

            <form onSubmit={handleStockTransferSubmit} className="space-y-4">
              {transferError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-100">
                  {transferError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Склад-получатель")}</label>
                <select
                  value={transferTargetWarehouse}
                  onChange={(e) => setTransitionTargetWarehouse(e.target.value)} // set target wh
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-semibold"
                >
                  {warehouses
                    .filter(w => w.name !== transferSourceWarehouse)
                    .map(wh => (
                      <option key={wh.id} value={wh.name}>{wh.name}</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Количество для перемещения")}</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={transferStockItem.quantity}
                  value={transferQty}
                  onChange={(e) => setTransferQty(Math.min(transferStockItem.quantity, Math.max(1, Number(e.target.value))))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStockTransferModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {t("Отмена")}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  {t("Подтвердить перемещение")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
