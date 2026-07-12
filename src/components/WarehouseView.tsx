/*
 * COPYRIGHT NOTICE | УВЕДОМЛЕНИЕ ОБ АВТОРСКИХ ПРАВАХ | 版权声明
 * © 2026 Utkin Vladislav Vyacheslavovich (Уткин Владислав Вячеславович)
 * Email: vicariustab@icloud.com | Telegram: https://t.me/Dexterll
 * All rights reserved. Unauthorized copying, modification, distribution or commercial use is prohibited.
 * 保留所有权利。未经版权所有者事先书面同意，禁止复制、修改、分发或商业使用。
 * Все права защищены. Копирование, изменение, распространение и коммерческое использование без письменного согласия правообладателя запрещено.
 * Release
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Warehouse, Plus, Search, Trash2, Edit2, AlertTriangle, Upload, FileText, Building, ClipboardList, Check, ArrowLeftRight, RotateCcw, Shuffle, Eye, Split, Combine, Image as ImageIcon, Download, FileSpreadsheet } from 'lucide-react';
import { WarehouseItem, WarehouseItemType, WarehouseItemStatus, CustomWarehouse, WarehouseWriteOff, ObjectItem, EmployeeItem, ComputerItem, NetworkDevice, SoftwareItem, SystemUser, EquipmentCustomSpec } from '../types';
import { useTranslation } from '../utils/i18n';
import { interpolate } from '../utils/localeRuntime';
import {
  EQUIPMENT_TITLE_MAX_LENGTH,
  limitEquipmentTitle,
  supportsComputerSpecifications,
  allocateNextSplitPartIndex,
  formatSplitWarehouseInventoryNumber,
  generateNextInventoryNumber,
  getSplitRootInventoryNumber,
  getWarehouseLineInventoryKey,
  inventoryNumbersMatch,
  isSplitWarehouseInventoryNumber,
  matchesBaseInventoryNumber,
  matchesInventorySearch,
  normalizeUnitSerialNumbers,
  computerMatchesSearch,
  warehouseItemMatchesSearch,
  networkDeviceMatchesSearch,
  getDeviceSerialDisplayLines,
  resolveWarehouseItemSerialLines,
} from '../utils/equipmentFields';
import { isStockRegistryDuplicateOfWarehouseBatch, getNetworkDeviceDisplayStatus, DEFAULT_WAREHOUSE_NAME } from '../utils/warehouseRouting';
import {
  getSoftwareWarehouseInv,
  warehouseItemLinksSoftware,
} from '../utils/equipmentDelete';
import { prepareEquipmentPhoto } from '../utils/imageUtils';
import { resolveMarkPendingTarget } from '../utils/markPendingWriteOff';
import {
  exportWarehouseItemsToExcelFile,
  parseWarehouseExcelFile,
  readFileAsArrayBuffer,
  parseWarehouseExcelBuffer,
  type WarehouseExcelImportResult,
} from '../utils/warehouseExcel';
import ModalCloseButton from './ModalCloseButton';
import PdfPreviewModal from './PdfPreviewModal';

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
    customSpecs?: EquipmentCustomSpec[];
    unitSerialNumbers?: string[];
  }) => boolean | void;
  onEdit?: (
    id: string,
    item: Omit<WarehouseItem, 'id' | 'status'> & {
      serialNumber?: string;
      cpuModel?: string;
      ramModel?: string;
      hddModel?: string;
      gpuModel?: string;
      motherboardModel?: string;
      powerSupplyModel?: string;
      caseModel?: string;
      customSpecs?: { label: string; value: string }[];
      unitSerialNumbers?: string[];
    }
  ) => boolean | void;
  onWriteOff: (
    id: string, 
    sourceType: 'computer' | 'network' | 'software' | 'warehouse', 
    inventoryNumber: string, 
    quantity: number, 
    reason: string, 
    author: string, 
    approver: string, 
    documentNumber?: string,
    comment?: string,
    department?: string,
    objectName?: string,
    pdf?: { name: string; size?: string; content?: string }
  ) => boolean | void;
  onDeleteEquipment?: (source: 'warehouse' | 'network' | 'software' | 'computer', id: string) => void;
  onDeleteWriteOff?: (id: string) => void;
  onRestoreWriteOff?: (id: string) => boolean | void;
  onMarkForWriteOff?: (
    source: 'warehouse' | 'network' | 'software' | 'computer',
    id: string,
    quantity?: number
  ) => boolean | void;
  onCancelMarkForWriteOff?: (
    source: 'warehouse' | 'network' | 'software' | 'computer',
    id: string
  ) => boolean | void;
  onViewDetails?: (type: 'computer' | 'network' | 'employee' | 'object' | 'warehouse', id: string) => void;
  currentUser?: Pick<SystemUser, 'role' | 'name'>;
  
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
  onDeployAsset?: (
    warehouseItemId: string,
    inventoryNumber: string,
    quantity: number,
    targetEmployeeName: string,
    targetObjectName: string,
    targetComputerIds?: string[]
  ) => boolean;
  onReturnActiveAssetToWarehouse?: (itemSource: 'computer' | 'network' | 'software', itemId: string, targetWarehouseName: string) => void;
  onTransferActiveAsset?: (itemSource: 'computer' | 'network' | 'software', itemId: string, targetObjectName: string, targetEmployeeName?: string) => void;
  onTransferWarehouseStock?: (itemId: string, sourceWarehouseName: string, targetWarehouseName: string, quantity: number) => void;
  onSplitWarehouseStock?: (
    itemId: string,
    options: { splitQty: number; splitIntoUnits?: boolean }
  ) => boolean | void;
  onMergeWarehouseSplit?: (itemId: string) => boolean | void;
  onImportWarehouseExcel?: (
    rows: import('../utils/warehouseExcel').WarehouseExcelRow[]
  ) => WarehouseExcelImportResult;
  /** false в пробном периоде без ключа активации */
  allowWarehouseExcel?: boolean;
}

export const WAREHOUSE_RECEIPT_GROUP_OPTIONS: WarehouseItemType[] = [
  'Компьютеры',
  'Сетевое оборудование',
  'Периферия',
  'Оргтехника',
  'Видеонаблюдение',
  'Расходные материалы',
  'Другое',
];

export const WAREHOUSE_CATEGORY_FILTER_TABS = [
  'Все',
  ...WAREHOUSE_RECEIPT_GROUP_OPTIONS,
] as const;

export function getReceiptGroupSelectOptions(
  currentType?: WarehouseItemType
): WarehouseItemType[] {
  if (currentType === 'Лицензии ПО') {
    return [...WAREHOUSE_RECEIPT_GROUP_OPTIONS, 'Лицензии ПО'];
  }
  return WAREHOUSE_RECEIPT_GROUP_OPTIONS;
}

export const getDeviceTypesForReceiptGroup = (group: WarehouseItemType): string[] => {
  switch (group) {
    case 'Компьютеры':
      return ['Ноутбук', 'ПК', 'Моноблок', 'Неттоп', 'Сервер'];
    case 'Сетевое оборудование':
      return ['Маршрутизатор', 'Коммутатор', 'Точка доступа', 'Другое'];
    case 'Периферия':
      return ['Монитор', 'Клавиатура', 'Мышь', 'Клавиатура + Мышь', 'Веб-камера', 'Другое'];
    case 'Оргтехника':
      return ['МФУ', 'Принтер', 'Сканер', 'Другое'];
    case 'Видеонаблюдение':
      return ['Видеокамера', 'Видеорегистратор', 'Другое'];
    case 'Расходные материалы':
      return ['Картриджи', 'Расходные материалы для МФУ', 'Расходники', 'Провода'];
    case 'Лицензии ПО':
      return ['Лицензионный ключ ПО', 'Подписка', 'Бессрочная лицензия', 'Другое'];
    case 'Другое':
    default:
      return ['Другое'];
  }
};

type StandardSpecKey =
  | 'serialNumber'
  | 'cpuModel'
  | 'ramModel'
  | 'hddModel'
  | 'gpuModel'
  | 'motherboardModel'
  | 'powerSupplyModel'
  | 'caseModel';

const SERIAL_SPEC_META = {
  labelKey: 'Серийный номер',
  placeholder: 'S/N: 4859HSK293',
};

type PickableSpecKey = Exclude<StandardSpecKey, 'serialNumber'>;

type ComponentSerialKey =
  | 'cpuSerial'
  | 'ramSerial'
  | 'hddSerial'
  | 'gpuSerial'
  | 'motherboardSerial'
  | 'powerSupplySerial'
  | 'caseSerial';

const SPEC_TO_SERIAL: Record<PickableSpecKey, ComponentSerialKey> = {
  cpuModel: 'cpuSerial',
  ramModel: 'ramSerial',
  hddModel: 'hddSerial',
  gpuModel: 'gpuSerial',
  motherboardModel: 'motherboardSerial',
  powerSupplyModel: 'powerSupplySerial',
  caseModel: 'caseSerial',
};

const PICKABLE_SPEC_CATALOG: Array<{
  key: PickableSpecKey;
  labelKey: string;
  placeholder: string;
}> = [
  { key: 'cpuModel', labelKey: 'Процессор (CPU)', placeholder: 'Intel Core i7-12705H' },
  { key: 'ramModel', labelKey: 'Оперативная память (RAM)', placeholder: '16GB DDR5 4800MHz' },
  { key: 'hddModel', labelKey: 'Накопитель (SSD/HDD)', placeholder: 'Kingston 1TB NVMe PCIe 4.0' },
  { key: 'gpuModel', labelKey: 'Видеокарта (GPU)', placeholder: 'NVIDIA RTX 4060 Laptop' },
  { key: 'motherboardModel', labelKey: 'Материнская плата', placeholder: 'ASUS ROG Strix B650' },
  { key: 'powerSupplyModel', labelKey: 'Блок питания', placeholder: 'Corsair RM750x 750W' },
  { key: 'caseModel', labelKey: 'Корпус', placeholder: 'NZXT H5 Flow Black' },
];

function collectActiveStandardSpecs(item: {
  serialNumber?: string;
  cpuModel?: string;
  cpuSerial?: string;
  ramModel?: string;
  ramSerial?: string;
  hddModel?: string;
  hddSerial?: string;
  gpuModel?: string;
  gpuSerial?: string;
  motherboardModel?: string;
  motherboardSerial?: string;
  powerSupplyModel?: string;
  powerSupplySerial?: string;
  caseModel?: string;
  caseSerial?: string;
}): PickableSpecKey[] {
  return PICKABLE_SPEC_CATALOG.filter(({ key }) => {
    const serialKey = SPEC_TO_SERIAL[key];
    return Boolean((item[key] || '').trim()) || Boolean((item[serialKey] || '').trim());
  }).map(({ key }) => key);
}

const WH_ACTION_ICON_TONES = {
  neutral: 'wh-action-icon--neutral',
  blue: 'wh-action-icon--blue',
  violet: 'wh-action-icon--violet',
  teal: 'wh-action-icon--teal',
  indigo: 'wh-action-icon--indigo',
  amber: 'wh-action-icon--amber',
  rose: 'wh-action-icon--rose',
  emerald: 'wh-action-icon--emerald',
} as const;

function WhTableIconButton({
  title,
  onClick,
  children,
  tone = 'neutral',
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  tone?: keyof typeof WH_ACTION_ICON_TONES;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`wh-action-icon ${WH_ACTION_ICON_TONES[tone]}`}
    >
      {children}
    </button>
  );
}

function WhTableActionSlot({
  title,
  onClick,
  children,
  tone = 'neutral',
  visible,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  tone?: keyof typeof WH_ACTION_ICON_TONES;
  visible: boolean;
}) {
  if (!visible) {
    return <span className="wh-action-icon wh-action-icon--slot" aria-hidden="true" />;
  }

  return (
    <WhTableIconButton title={title} onClick={onClick} tone={tone}>
      {children}
    </WhTableIconButton>
  );
}

export default function WarehouseView({
  warehouseItems,
  onReceipt,
  onEdit,
  onWriteOff,
  onDeleteEquipment,
  onMarkForWriteOff,
  onCancelMarkForWriteOff,
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
  onRestoreWriteOff,
  onReturnActiveAssetToWarehouse,
  onTransferActiveAsset,
  onTransferWarehouseStock,
  onSplitWarehouseStock,
  onMergeWarehouseSplit,
  onImportWarehouseExcel,
  allowWarehouseExcel = false,
}: WarehouseViewProps) {
  const { t } = useTranslation();
  
  // Secondary layout navigation
  const [currentWhTab, setCurrentWhTab] = useState<'stock' | 'history' | 'warehouses'>('stock');
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState('all');
  const [activeWriteOffTab, setActiveWriteOffTab] = useState<'pending' | 'history'>('pending');

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<WarehouseItemType | 'Все'>('Все');
  const [placementFilter, setPlacementFilter] = useState<'all' | 'stock' | 'issued'>('all');

  const isViewer = currentUser?.role === 'Viewer';
  const isAdmin = currentUser?.role === 'Admin';

  // Modals controllers
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [editingWarehouseId, setEditingWarehouseId] = useState<string | null>(null);
  const [showWriteOffModal, setShowWriteOffModal] = useState(false);
  const [showMarkPendingModal, setShowMarkPendingModal] = useState(false);
  const [markPendingTarget, setMarkPendingTarget] = useState<{
    source: 'warehouse' | 'network' | 'software' | 'computer';
    id: string;
    name: string;
    model: string;
    maxQty: number;
    unit: string;
    inventoryNumber: string;
  } | null>(null);
  const [markPendingQtyInput, setMarkPendingQtyInput] = useState('1');
  const [markPendingError, setMarkPendingError] = useState('');
  const warehouseImportInputRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<WarehouseExcelImportResult | null>(null);
  const [importLoading, setImportLoading] = useState(false);

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
  const [unitSerialNumbers, setUnitSerialNumbers] = useState<string[]>(['']);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [monitorDiagonalInput, setMonitorDiagonalInput] = useState('');
  const [cpuModel, setCpuModel] = useState('');
  const [cpuSerial, setCpuSerial] = useState('');
  const [ramModel, setRamModel] = useState('');
  const [ramSerial, setRamSerial] = useState('');
  const [hddModel, setHddModel] = useState('');
  const [hddSerial, setHddSerial] = useState('');
  const [gpuModel, setGpuModel] = useState('');
  const [gpuSerial, setGpuSerial] = useState('');
  const [motherboardModel, setMotherboardModel] = useState('');
  const [motherboardSerial, setMotherboardSerial] = useState('');
  const [powerSupplyModel, setPowerSupplyModel] = useState('');
  const [powerSupplySerial, setPowerSupplySerial] = useState('');
  const [caseModel, setCaseModel] = useState('');
  const [caseSerial, setCaseSerial] = useState('');

  const [activeStandardSpecs, setActiveStandardSpecs] = useState<PickableSpecKey[]>([]);
  const [showSpecFieldPicker, setShowSpecFieldPicker] = useState(false);

  type CustomSpecRow = { id: string; label: string; value: string; serial: string };
  const [customSpecRows, setCustomSpecRows] = useState<CustomSpecRow[]>([]);

  const specsBlockActive = activeStandardSpecs.length > 0 || customSpecRows.length > 0;
  const isMonitorReceipt = deviceType === 'Монитор';

  useEffect(() => {
    if (quantity <= 1) return;
    setUnitSerialNumbers((prev) => normalizeUnitSerialNumbers(quantity, prev));
  }, [quantity]);

  const buildSerialFieldsForSubmit = (qty: number) => {
    if (qty <= 1) {
      const sn = serialNumber.trim();
      return { serialNumber: sn, unitSerialNumbers: sn ? [sn] : undefined };
    }
    const units = normalizeUnitSerialNumbers(qty, unitSerialNumbers).map((s) => s.trim());
    return {
      serialNumber: units.find(Boolean) || serialNumber.trim() || '',
      unitSerialNumbers: units,
    };
  };

  const componentSerialValues: Record<ComponentSerialKey, string> = {
    cpuSerial,
    ramSerial,
    hddSerial,
    gpuSerial,
    motherboardSerial,
    powerSupplySerial,
    caseSerial,
  };

  const setComponentSerial = (key: ComponentSerialKey, value: string) => {
    switch (key) {
      case 'cpuSerial':
        setCpuSerial(value);
        break;
      case 'ramSerial':
        setRamSerial(value);
        break;
      case 'hddSerial':
        setHddSerial(value);
        break;
      case 'gpuSerial':
        setGpuSerial(value);
        break;
      case 'motherboardSerial':
        setMotherboardSerial(value);
        break;
      case 'powerSupplySerial':
        setPowerSupplySerial(value);
        break;
      case 'caseSerial':
        setCaseSerial(value);
        break;
    }
  };

  const clearComponentSerial = (key: ComponentSerialKey) => setComponentSerial(key, '');

  const specValues: Record<StandardSpecKey, string> = {
    serialNumber,
    cpuModel,
    ramModel,
    hddModel,
    gpuModel,
    motherboardModel,
    powerSupplyModel,
    caseModel,
  };

  const setSpecValue = (key: StandardSpecKey, value: string) => {
    switch (key) {
      case 'serialNumber':
        setSerialNumber(value);
        break;
      case 'cpuModel':
        setCpuModel(value);
        break;
      case 'ramModel':
        setRamModel(value);
        break;
      case 'hddModel':
        setHddModel(value);
        break;
      case 'gpuModel':
        setGpuModel(value);
        break;
      case 'motherboardModel':
        setMotherboardModel(value);
        break;
      case 'powerSupplyModel':
        setPowerSupplyModel(value);
        break;
      case 'caseModel':
        setCaseModel(value);
        break;
    }
  };

  const addStandardSpecField = (key: PickableSpecKey) => {
    setActiveStandardSpecs((prev) => (prev.includes(key) ? prev : [...prev, key]));
    setShowSpecFieldPicker(false);
  };

  const removeStandardSpecField = (key: PickableSpecKey) => {
    setActiveStandardSpecs((prev) => prev.filter((k) => k !== key));
    setSpecValue(key, '');
    clearComponentSerial(SPEC_TO_SERIAL[key]);
  };

  const addCustomSpecRow = () => {
    setCustomSpecRows((prev) => [
      ...prev,
      { id: `cs-${Date.now()}-${Math.floor(Math.random() * 10000)}`, label: '', value: '', serial: '' },
    ]);
    setShowSpecFieldPicker(false);
  };

  const updateCustomSpecRow = (
    id: string,
    patch: Partial<Pick<CustomSpecRow, 'label' | 'value' | 'serial'>>
  ) => {
    setCustomSpecRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const removeCustomSpecRow = (id: string) => {
    setCustomSpecRows((prev) => prev.filter((row) => row.id !== id));
  };

  const buildCustomSpecsPayload = (): EquipmentCustomSpec[] =>
    customSpecRows
      .map((row) => ({
        label: row.label.trim(),
        value: row.value.trim(),
        serial: row.serial.trim() || undefined,
      }))
      .filter((row) => row.label || row.value || row.serial);

  const receiptHasComputerSpecs = supportsComputerSpecifications({ warehouseType: type, deviceType });

  // Form States - Custom Warehouse Adding
  const [newWhName, setNewWhName] = useState('');
  const [newWhObject, setNewWhObject] = useState(objects[0]?.name || 'Главный офис');
  const [newWhDesc, setNewWhDesc] = useState('');

  // Form States - Write Off
  const [writeOffInvNum, setWriteOffInvNum] = useState('');
  const [writeOffQty, setWriteOffQty] = useState(1);
  const [writeOffReason, setWriteOffReason] = useState('');
  const [writeOffAuthor, setWriteOffAuthor] = useState('');
  const [writeOffApprover, setWriteOffApprover] = useState('');
  const [writeOffDocument, setWriteOffDocument] = useState('');
  const [writeOffComment, setWriteOffComment] = useState('');
  const [writeOffDepartment, setWriteOffDepartment] = useState('');
  const [writeOffObject, setWriteOffObject] = useState('');
  const [writeOffPdf, setWriteOffPdf] = useState<{ name: string; size?: string; content?: string } | null>(null);
  const [writeOffError, setWriteOffError] = useState('');
  const [writeOffPdfPreview, setWriteOffPdfPreview] = useState<WarehouseWriteOff['pdfFile'] | null>(null);
  const [activeWriteOffSourceItem, setActiveWriteOffSourceItem] = useState<{
    id: string;
    sourceType: 'computer' | 'network' | 'software' | 'warehouse';
    name: string;
    model: string;
    inventoryNumber: string;
    quantity: number;
    unit: string;
    cost: number;
  } | null>(null);
  /** Позиция из очереди списания — не показываем select (иначе required блокирует submit). */
  const [writeOffSourceLocked, setWriteOffSourceLocked] = useState(false);

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
  const [transferQtyInput, setTransferQtyInput] = useState('1');
  const [transferError, setTransferError] = useState('');

  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitStockItem, setSplitStockItem] = useState<WarehouseItem | null>(null);
  const [splitQtyInput, setSplitQtyInput] = useState('1');
  const [splitIntoUnits, setSplitIntoUnits] = useState(false);
  const [splitError, setSplitError] = useState('');

  const getSplitPreviewInv = (item: WarehouseItem, qty: number, intoUnits: boolean): string => {
    const root = getSplitRootInventoryNumber(item.inventoryNumber, item.splitFromInventoryNumber);
    const nextPart = allocateNextSplitPartIndex(root, warehouseItems);
    if (intoUnits && qty > 1) {
      const parts = Array.from({ length: qty }, (_, i) =>
        formatSplitWarehouseInventoryNumber(root, nextPart + i)
      );
      return parts.join(', ');
    }
    return formatSplitWarehouseInventoryNumber(root, nextPart);
  };

  const canMergeSplitItem = (item: WarehouseItem): boolean =>
    Boolean(
      item.splitFromInventoryNumber ||
        isSplitWarehouseInventoryNumber(item.inventoryNumber)
    );

  const getMergeTargetLabel = (item: WarehouseItem): string =>
    item.splitFromInventoryNumber ||
    getSplitRootInventoryNumber(item.inventoryNumber, item.splitFromInventoryNumber);

  const getSplittableUnitCount = (item: WarehouseItem): number => {
    if (item.type === 'Сетевое оборудование') {
      const net = networkDevices.find((n) => inventoryNumbersMatch(n.inventoryNumber, item.inventoryNumber));
      if (net) return Math.min(item.quantity, net.quantity || 1);
    }
    return item.quantity;
  };

  const handleOpenStockSplit = (item: WarehouseItem) => {
    const whItem = warehouseItems.find((w) => w.id === item.id) || item;
    setSplitStockItem(whItem);
    setSplitQtyInput('1');
    setSplitIntoUnits(false);
    setSplitError('');
    setShowSplitModal(true);
  };

  const handleStockSplitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!splitStockItem || !onSplitWarehouseStock) return;

    const maxSplittable = getSplittableUnitCount(splitStockItem);
    const splitQty = parseInt(splitQtyInput, 10);
    if (!Number.isFinite(splitQty) || splitQty < 1) {
      setSplitError(t('Количество должно быть не менее 1'));
      return;
    }
    if (splitQty > splitStockItem.quantity) {
      setSplitError(
        interpolate(t('Максимум для разделения: {max} шт.'), { max: String(splitStockItem.quantity) })
      );
      return;
    }
    if (splitQty > maxSplittable) {
      setSplitError(
        t('Часть единиц уже выдана — можно разделить только остаток, который ещё на складе.')
      );
      return;
    }
    if (splitQty >= splitStockItem.quantity && !splitIntoUnits) {
      setSplitError(t('Оставьте хотя бы 1 шт. в исходной позиции или включите «Отдельная позиция на каждую единицу».'));
      return;
    }

    const success = onSplitWarehouseStock(splitStockItem.id, {
      splitQty,
      splitIntoUnits,
    });

    if (success !== false) {
      setShowSplitModal(false);
      if (editingWarehouseId === splitStockItem.id) {
        const remaining = splitStockItem.quantity - splitQty;
        if (remaining <= 0) {
          closeStockModal();
        } else {
          setQuantity(remaining);
        }
      }
    } else {
      setSplitError(t('Не удалось разделить партию. Проверьте остаток на складе.'));
    }
  };

  const handleMergeSplit = (item: WarehouseItem) => {
    if (!onMergeWarehouseSplit) return;
    const root = getMergeTargetLabel(item);
    if (
      !confirm(
        interpolate(t('Собрать позицию {inv} обратно в партию {root}?'), {
          inv: item.inventoryNumber,
          root,
        })
      )
    ) {
      return;
    }
    onMergeWarehouseSplit(item.id);
  };

  const handleOpenActiveAssetTransition = (item: any) => {
    setTransitionAssetItem(item);
    setTransitionMode('return');
    // Set default target warehouse
    const currentWhName = item.warehouseName || warehouses[0]?.name || 'Основной склад ИТ';
    setTransitionTargetWarehouse(currentWhName);
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
    setTransferQtyInput('1');
    setTransferError('');
    setShowStockTransferModal(true);
  };

  const handleStockTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferStockItem || !onTransferWarehouseStock) return;

    const transferQty = parseInt(transferQtyInput, 10);
    if (!Number.isFinite(transferQty) || transferQty < 1) {
      setTransferError(t('Количество должно быть не менее 1'));
      return;
    }
    if (transferQty > transferStockItem.quantity) {
      setTransferError(`Доступно всего ${transferStockItem.quantity} шт. на складе "${transferSourceWarehouse}"`);
      return;
    }
    if (transferSourceWarehouse === transferTargetWarehouse) {
      setTransferError(t('Склад-источник и склад-получатель должны отличаться'));
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
  const [deployQtyInput, setDeployQtyInput] = useState('1');
  const [deployEmployee, setDeployEmployee] = useState('');
  const [deployObject, setDeployObject] = useState('');
  const [deployError, setDeployError] = useState('');
  const [deploySelectedUnitIds, setDeploySelectedUnitIds] = useState<string[]>([]);

  const deployStockUnits = deployItem
    ? (computers || [])
        .filter(
          (c) =>
            matchesBaseInventoryNumber(c.inventoryNumber, deployItem.inventoryNumber) &&
            c.status === 'На складе'
        )
        .sort((a, b) => {
          const rank = (inv: string) => {
            const cur = (inv || '').trim();
            if (cur === deployItem.inventoryNumber) return 0;
            const m = cur.match(/-(\d+)$/);
            return m ? parseInt(m[1], 10) : 999;
          };
          return rank(a.inventoryNumber || '') - rank(b.inventoryNumber || '');
        })
    : [];

  const handleOpenDeploy = (row: { id: string }) => {
    const wh = warehouseItems.find((w) => w.id === row.id);
    if (!wh) return;
    setDeployItem(wh);
    setDeployQtyInput('1');
    setDeploySelectedUnitIds([]);
    setDeployEmployee(employees?.[0]?.name || 'Свободен / Общий');
    setDeployObject(objects?.[0]?.name || 'Главный офис');
    setDeployError('');
    setShowDeployModal(true);
  };

  const handleDeploySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deployItem || !onDeployAsset) return;

    const deployQty = parseInt(deployQtyInput, 10);
    if (!Number.isFinite(deployQty) || deployQty < 1) {
      setDeployError(t('Количество должно быть не менее 1'));
      return;
    }

    const selectedIds =
      deploySelectedUnitIds.length > 0
        ? deploySelectedUnitIds
        : undefined;
    const effectiveQty = selectedIds?.length ?? deployQty;

    if (effectiveQty > deployItem.quantity) {
      setDeployError(`Доступно для выдачи всего ${deployItem.quantity} шт.`);
      return;
    }

    if (selectedIds && selectedIds.length > effectiveQty) {
      setDeployError(t('Выбрано больше единиц, чем доступно на складе'));
      return;
    }

    const success = onDeployAsset(
      deployItem.id,
      deployItem.inventoryNumber,
      effectiveQty,
      deployEmployee,
      deployObject,
      selectedIds
    );

    if (success) {
      setShowDeployModal(false);
    } else {
      setDeployError(t('Не удалось выдать товар со склада. Возможно, устройство не найдено или возникла непредвиденная ошибка.'));
    }
  };

  const handlePhotoUpload = async (file: File | null) => {
    if (!file) return;
    setPhotoUploading(true);
    try {
      const dataUrl = await prepareEquipmentPhoto(file);
      setPhotoUrl(dataUrl);
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      if (code === 'NOT_IMAGE') {
        alert(t('Пожалуйста, выберите файл изображения (JPG, PNG, WebP и т.д.).'));
      } else if (code === 'TOO_LARGE') {
        alert(t('Файл слишком большой. Максимальный размер — 20 МБ.'));
      } else {
        alert(t('Не удалось загрузить изображение. Попробуйте другой файл.'));
      }
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleFileUpload = (file: File | null, groupName: string) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert(t('Пожалуйста, выберите файл в формате PDF!'));
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
      alert(t('Пожалуйста, выберите файл в формате PDF!'));
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
    setEditingWarehouseId(null);
    setName('');
    setType('Компьютеры');
    setDeviceType('Ноутбук');
    setModel('');
    setInventoryNumber(
      generateNextInventoryNumber('ST', {
        warehouseItems,
        computers,
        networkDevices,
        softwareItems,
        softwareWarehouseInv: getSoftwareWarehouseInv,
      })
    );
    setQuantity(1);
    setUnit('шт.');
    setCostPerUnit(1000);
    setInvoiceInfo('');
    setMemoInfo('');
    setWarrantyInfo('');
    setPdfFiles([]);
    setReceiptWarehouseName(warehouses[0]?.name || 'Основной склад ИТ');
    
    // Reset Specs
    setShowSpecs(false);
    setActiveStandardSpecs([]);
    setShowSpecFieldPicker(false);
    setSerialNumber('');
    setUnitSerialNumbers(['']);
    setPhotoUrl('');
    setMonitorDiagonalInput('');
    setCpuModel('');
    setCpuSerial('');
    setRamModel('');
    setRamSerial('');
    setHddModel('');
    setHddSerial('');
    setGpuModel('');
    setGpuSerial('');
    setMotherboardModel('');
    setMotherboardSerial('');
    setPowerSupplyModel('');
    setPowerSupplySerial('');
    setCaseModel('');
    setCaseSerial('');
    setCustomSpecRows([]);

    setShowReceiptModal(true);
  };

  const closeStockModal = () => {
    setShowReceiptModal(false);
    setEditingWarehouseId(null);
  };

  const handleOpenEdit = (itemId: string) => {
    const item = warehouseItems.find((w) => w.id === itemId);
    if (!item) return;

    setEditingWarehouseId(item.id);
    setName(item.name);
    setType(item.type);
    setDeviceType(item.deviceType || getDeviceTypesForReceiptGroup(item.type)[0] || 'Другое');
    setModel(item.model);
    setInventoryNumber(item.inventoryNumber);
    setQuantity(item.quantity);
    setUnit(item.unit || 'шт.');
    setCostPerUnit(item.costPerUnit || 0);
    setInvoiceInfo(item.invoiceInfo || '');
    setMemoInfo(item.memoInfo || '');
    setWarrantyInfo(item.warrantyInfo || '');
    setPdfFiles(item.pdfFiles || []);
    setReceiptWarehouseName(item.warehouseName || warehouses[0]?.name || 'Основной склад ИТ');
    setPhotoUrl(item.photoUrl || '');
    setMonitorDiagonalInput(
      item.monitorDiagonalInches != null && item.monitorDiagonalInches > 0
        ? String(item.monitorDiagonalInches)
        : ''
    );
    setSerialNumber(item.serialNumber || '');
    const suffixRank = (inv: string) => {
      const cur = (inv || '').trim();
      if (cur === item.inventoryNumber) return 0;
      const m = cur.match(/-(\d+)$/);
      return m ? parseInt(m[1], 10) : 999;
    };
    const serialsFromRegistry =
      !item.unitSerialNumbers?.length && item.quantity > 1
        ? computers
            .filter(
              (c) =>
                matchesBaseInventoryNumber(c.inventoryNumber, item.inventoryNumber) &&
                c.status === 'На складе'
            )
            .sort(
              (a, b) =>
                suffixRank(a.inventoryNumber || '') - suffixRank(b.inventoryNumber || '')
            )
            .map((c) => c.serialNumber || '')
        : [];
    setUnitSerialNumbers(
      item.unitSerialNumbers?.length
        ? normalizeUnitSerialNumbers(item.quantity, item.unitSerialNumbers)
        : serialsFromRegistry.some((s) => s.trim())
          ? normalizeUnitSerialNumbers(item.quantity, serialsFromRegistry)
          : normalizeUnitSerialNumbers(item.quantity, [])
    );
    setCpuModel(item.cpuModel || '');
    setCpuSerial(item.cpuSerial || '');
    setRamModel(item.ramModel || '');
    setRamSerial(item.ramSerial || '');
    setHddModel(item.hddModel || '');
    setHddSerial(item.hddSerial || '');
    setGpuModel(item.gpuModel || '');
    setGpuSerial(item.gpuSerial || '');
    setMotherboardModel(item.motherboardModel || '');
    setMotherboardSerial(item.motherboardSerial || '');
    setPowerSupplyModel(item.powerSupplyModel || '');
    setPowerSupplySerial(item.powerSupplySerial || '');
    setCaseModel(item.caseModel || '');
    setCaseSerial(item.caseSerial || '');
    const standardActive = collectActiveStandardSpecs(item);
    setActiveStandardSpecs(standardActive);
    setCustomSpecRows(
      (item.customSpecs || []).map((spec, idx) => ({
        id: `cs-edit-${idx}-${item.id}`,
        label: spec.label,
        value: spec.value,
        serial: spec.serial || '',
      }))
    );
    setShowSpecFieldPicker(false);
    setShowSpecs(
      Boolean(
        standardActive.length > 0 ||
          (item.customSpecs && item.customSpecs.length > 0)
      )
    );
    setShowReceiptModal(true);
  };

  type WriteOffSourceItem = NonNullable<typeof activeWriteOffSourceItem>;

  const getWritableWarehouseItems = () =>
    warehouseItems.filter(
      (w) => w.quantity > 0 && w.status !== 'Списано' && w.status !== 'На списание'
    );

  const buildWriteOffSourceFromWarehouse = (w: WarehouseItem): WriteOffSourceItem => ({
    id: w.id,
    sourceType: 'warehouse',
    name: w.name,
    model: w.model,
    inventoryNumber: w.inventoryNumber,
    quantity: w.quantity,
    unit: w.unit || 'шт.',
    cost: w.costPerUnit || 0,
  });

  const resolveWriteOffSource = (
    invNum?: string,
    explicitSource?: WriteOffSourceItem | null
  ): WriteOffSourceItem | null => {
    if (explicitSource) return explicitSource;
    const writable = getWritableWarehouseItems();
    if (!writable.length) return null;
    const trimmed = (invNum || '').trim();
    if (trimmed) {
      const match = writable.find((w) => inventoryNumbersMatch(w.inventoryNumber, trimmed));
      if (match) return buildWriteOffSourceFromWarehouse(match);
    }
    return buildWriteOffSourceFromWarehouse(writable[0]);
  };

  const formatWriteOffSourceLabel = (source: WriteOffSourceItem) =>
    `${source.name} (${source.inventoryNumber || t('Без инв. №')}) — ${t('Доступно')} ${source.quantity} ${t(source.unit || 'шт.')}`;

  const openWriteOffModal = (options?: {
    invNum?: string;
    qty?: number;
    source?: WriteOffSourceItem | null;
  }) => {
    const resolved = resolveWriteOffSource(options?.invNum, options?.source ?? null);
    setWriteOffSourceLocked(Boolean(options?.source));
    setWriteOffInvNum(resolved?.inventoryNumber ?? options?.invNum ?? '');
    setWriteOffQty(
      resolved
        ? Math.min(Math.max(1, options?.qty ?? 1), resolved.quantity)
        : Math.max(1, options?.qty ?? 1)
    );
    setActiveWriteOffSourceItem(resolved);
    setWriteOffAuthor(currentUser?.name || '');
    setWriteOffApprover('');
    setWriteOffReason('');
    setWriteOffDocument('');
    setWriteOffComment('');
    setWriteOffDepartment('');
    setWriteOffObject('');
    setWriteOffPdf(null);
    setWriteOffError('');
    setShowWriteOffModal(true);
  };

  const handleOpenWriteOff = (defaultInvNum = '') => {
    openWriteOffModal({ invNum: defaultInvNum || warehouseItems[0]?.inventoryNumber || '' });
  };

  const goToPendingWriteOffTab = () => {
    setCurrentWhTab('history');
    setActiveWriteOffTab('pending');
  };

  const handleMarkForWriteOffClick = (
    source: 'warehouse' | 'network' | 'software' | 'computer',
    id: string
  ) => {
    const info = resolveMarkPendingTarget(source, id, {
      warehouseItems,
      computers: computers || [],
      networkDevices: networkDevices || [],
      softwareItems: softwareItems || [],
      warehouses,
    });
    if (!info) {
      alert(t('Не удалось отправить оборудование на списание.'));
      return;
    }

    if (info.maxQty <= 1) {
      const ok = onMarkForWriteOff?.(source, id, 1);
      if (ok !== false) goToPendingWriteOffTab();
      return;
    }

    setMarkPendingTarget({
      source,
      id,
      name: info.name,
      model: info.model,
      maxQty: info.maxQty,
      unit: info.unit,
      inventoryNumber: info.inventoryNumber,
    });
    setMarkPendingQtyInput('1');
    setMarkPendingError('');
    setShowMarkPendingModal(true);
  };

  const handleMarkPendingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!markPendingTarget) return;
    setMarkPendingError('');

    let qty = parseInt(markPendingQtyInput, 10);
    if (!Number.isFinite(qty) || qty < 1) qty = 1;
    if (qty > markPendingTarget.maxQty) qty = markPendingTarget.maxQty;

    const ok = onMarkForWriteOff?.(markPendingTarget.source, markPendingTarget.id, qty);
    if (ok === false) {
      setMarkPendingError(t('Не удалось отправить оборудование на списание.'));
      return;
    }

    setShowMarkPendingModal(false);
    setMarkPendingTarget(null);
    goToPendingWriteOffTab();
  };

  const goToStockTab = () => {
    setCurrentWhTab('stock');
  };

  const handleCancelPendingWriteOffClick = (
    source: 'warehouse' | 'network' | 'software' | 'computer',
    id: string
  ) => {
    if (
      !window.confirm(
        t('Вернуть оборудование на склад и снять с очереди списания?')
      )
    ) {
      return;
    }
    const ok = onCancelMarkForWriteOff?.(source, id);
    if (ok !== false) {
      goToStockTab();
    }
  };

  const handleRestoreFromHistoryClick = (writeOffId: string) => {
    if (
      !window.confirm(
        t('Вернуть оборудование на склад по этому акту списания?')
      )
    ) {
      return;
    }
    const ok = onRestoreWriteOff?.(writeOffId);
    if (ok !== false) {
      goToStockTab();
    }
  };

  const handleReceiptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = limitEquipmentTitle(name.trim());
    const trimmedModel = limitEquipmentTitle(model.trim());
    if (!trimmedName || !trimmedModel || !inventoryNumber.trim() || quantity < 1 || costPerUnit < 0) return;

    const serialFields = buildSerialFieldsForSubmit(quantity);
    const monitorDiagonal = isMonitorReceipt
      ? parseFloat(monitorDiagonalInput.replace(',', '.'))
      : undefined;
    const payload = {
      name: trimmedName,
      type,
      model: trimmedModel,
      inventoryNumber,
      unit,
      costPerUnit,
      invoiceInfo,
      memoInfo,
      warrantyInfo,
      warehouseName: receiptWarehouseName,
      pdfFiles,
      photoUrl: photoUrl || undefined,
      monitorDiagonalInches:
        monitorDiagonal != null && Number.isFinite(monitorDiagonal) && monitorDiagonal > 0
          ? monitorDiagonal
          : undefined,
      ...serialFields,
      cpuModel,
      cpuSerial,
      ramModel,
      ramSerial,
      hddModel,
      hddSerial,
      gpuModel,
      gpuSerial,
      motherboardModel,
      motherboardSerial,
      powerSupplyModel,
      powerSupplySerial,
      caseModel,
      caseSerial,
      deviceType,
      customSpecs: buildCustomSpecsPayload(),
    };

    if (!editingWarehouseId && type === 'Лицензии ПО') {
      return;
    }

    const success = editingWarehouseId
      ? onEdit?.(editingWarehouseId, { ...payload, quantity })
      : onReceipt({
          ...payload,
          quantity,
        });

    if (success !== false) {
      closeStockModal();
    }
  };

  const handleWriteOffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWriteOffError('');

    if (!activeWriteOffSourceItem) {
      setWriteOffError(t('Не выбран элемент для списания.'));
      return;
    }

    const writeOffQuantity = Math.max(
      1,
      Math.floor(Number(writeOffQty)) || 1
    );

    if (writeOffQuantity > activeWriteOffSourceItem.quantity) {
      setWriteOffError(`${t('Недостаточное количество.')} ${t('Доступно для списания всего')} ${activeWriteOffSourceItem.quantity} ${t(activeWriteOffSourceItem.unit || 'шт.')}`);
      return;
    }

    if (!writeOffAuthor.trim() || !writeOffApprover.trim()) {
      setWriteOffError(t('Укажите ФИО инициатора и согласующего.'));
      return;
    }

    const success = onWriteOff(
      activeWriteOffSourceItem.id,
      activeWriteOffSourceItem.sourceType,
      activeWriteOffSourceItem.inventoryNumber || writeOffInvNum,
      writeOffQuantity, 
      writeOffReason, 
      writeOffAuthor,
      writeOffApprover,
      writeOffDocument,
      writeOffComment,
      writeOffDepartment,
      writeOffObject,
      writeOffPdf || undefined
    );
    
    if (success) {
      setShowWriteOffModal(false);
      setWriteOffSourceLocked(false);
    } else {
      setWriteOffError(t('Произошла ошибка при списании товара.'));
    }
  };

  // Unified stock registry lists (memoized — rebuilt only when source data changes)
  const warehouseNameByObject = useMemo(() => {
    const map = new Map<string, string>();
    for (const w of warehouses) {
      if (w.objectName) map.set(w.objectName, w.name);
    }
    return map;
  }, [warehouses]);

  const warehouseById = useMemo(
    () => new Map(warehouseItems.map((w) => [w.id, w])),
    [warehouseItems]
  );

  const computerById = useMemo(
    () => new Map((computers || []).map((c) => [c.id, c])),
    [computers]
  );

  const networkById = useMemo(
    () => new Map((networkDevices || []).map((n) => [n.id, n])),
    [networkDevices]
  );

  const whUnified = useMemo(
    () =>
      warehouseItems
        .filter(
          (item) =>
            item.type !== 'Лицензии ПО' &&
            item.quantity > 0 &&
            item.status !== 'Списано' &&
            item.status !== 'На списание'
        )
        .map((item) => ({
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
          splitFromInventoryNumber: item.splitFromInventoryNumber,
          splitPartIndex: item.splitPartIndex,
          serialNumbers: resolveWarehouseItemSerialLines(item, computers || []),
          receiptDate: item.receiptDate,
        })),
    [warehouseItems, computers]
  );

  const compsUnified = useMemo(
    () =>
      (computers || [])
        .filter(
          (c) =>
            c.status !== 'На складе' && c.status !== 'Списано' && c.status !== 'На списание'
        )
        .map((c) => {
          const linkedWhName =
            warehouseNameByObject.get(c.objectName) || 'Основной склад ИТ';
          return {
            id: c.id,
            name: t(c.deviceType || c.category),
            type:
              c.category === 'Ноутбук' || c.category === 'ПК'
                ? 'Компьютеры'
                : c.category === 'Периферия' || c.category === 'Монитор'
                  ? 'Периферия'
                  : c.category === 'Оргтехника'
                    ? 'Оргтехника'
                    : c.category === 'Видеонаблюдение'
                      ? 'Видеонаблюдение'
                      : c.category === 'Расходники'
                        ? 'Расходные материалы'
                        : 'Другое',
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
            serialNumbers: getDeviceSerialDisplayLines({ serialNumber: c.serialNumber, quantity: 1 }),
            receiptDate: undefined as string | undefined,
          };
        }),
    [computers, warehouseNameByObject, t]
  );

  const stockCompsUnified = useMemo(
    () =>
      (computers || [])
        .filter(
          (c) =>
            c.status === 'На складе' &&
            !isStockRegistryDuplicateOfWarehouseBatch(c, warehouseItems || [])
        )
        .map((c) => {
          const linkedWhName =
            warehouseNameByObject.get(c.objectName) || 'Основной склад ИТ';
          return {
            id: c.id,
            name: t(c.deviceType || c.category),
            type:
              c.category === 'Ноутбук' || c.category === 'ПК'
                ? 'Компьютеры'
                : c.category === 'Периферия' || c.category === 'Монитор'
                  ? 'Периферия'
                  : c.category === 'Оргтехника'
                    ? 'Оргтехника'
                    : c.category === 'Видеонаблюдение'
                      ? 'Видеонаблюдение'
                      : c.category === 'Расходники'
                        ? 'Расходные материалы'
                        : 'Другое',
            model: c.model,
            inventoryNumber: c.inventoryNumber,
            quantity: 1,
            unit: 'шт.',
            costPerUnit: c.cost || 0,
            status: 'На складе' as const,
            location: c.objectName,
            employeeName: '—',
            itemSource: 'computer' as const,
            warehouseName: linkedWhName,
            isStockRegistry: true as const,
            serialNumbers: getDeviceSerialDisplayLines({ serialNumber: c.serialNumber, quantity: 1 }),
            receiptDate: undefined as string | undefined,
          };
        }),
    [computers, warehouseItems, warehouseNameByObject, t]
  );

  const netUnified = useMemo(
    () =>
      (networkDevices || [])
        .filter((n) => {
          const displayStatus = getNetworkDeviceDisplayStatus(
            n,
            warehouseItems || [],
            warehouses,
            objects
          );
          return (
            displayStatus !== 'На списание' &&
            displayStatus !== 'Списано' &&
            !isStockRegistryDuplicateOfWarehouseBatch(n, warehouseItems || [])
          );
        })
        .map((n) => {
          const displayStatus = getNetworkDeviceDisplayStatus(
            n,
            warehouseItems || [],
            warehouses,
            objects
          );
          const linkedWhName =
            warehouseNameByObject.get(n.objectName) || 'Основной склад ИТ';
          return {
            id: n.id,
            name: n.deviceName,
            type: 'Сетевое оборудование' as const,
            model: n.deviceName,
            inventoryNumber: n.inventoryNumber || 'NET-EQ',
            quantity: n.quantity || 1,
            unit: 'шт.',
            costPerUnit: n.cost || 0,
            status: displayStatus === 'На складе' ? ('На складе' as const) : ('Привязано' as const),
            location: n.objectName,
            employeeName: '—',
            itemSource: 'network' as const,
            warehouseName: linkedWhName,
            serialNumbers: [] as string[],
            receiptDate: undefined as string | undefined,
          };
        }),
    [networkDevices, warehouseItems, warehouses, objects, warehouseNameByObject]
  );

  const totalUnifiedList = useMemo(
    () => [...whUnified, ...stockCompsUnified, ...compsUnified, ...netUnified],
    [whUnified, stockCompsUnified, compsUnified, netUnified]
  );

  const selectedWarehouseName = useMemo(() => {
    if (selectedWarehouseFilter === 'all') return null;
    return warehouses.find((w) => w.id === selectedWarehouseFilter)?.name ?? null;
  }, [selectedWarehouseFilter, warehouses]);

  const filtered = useMemo(() => {
    const searchTrimmed = search.trim();
    return totalUnifiedList.filter((item) => {
      const matchesSearch =
        !searchTrimmed ||
        (item.itemSource === 'computer'
          ? (() => {
              const c = computerById.get(item.id);
              return c ? computerMatchesSearch(c, search) : false;
            })()
          : item.itemSource === 'warehouse'
            ? (() => {
                const w = warehouseById.get(item.id);
                return w ? warehouseItemMatchesSearch(w, search) : false;
              })()
            : item.itemSource === 'network'
              ? (() => {
                  const n = networkById.get(item.id);
                  return n ? networkDeviceMatchesSearch(n, search) : false;
                })()
              : false);

      const matchesTab = activeTab === 'Все' || item.type === activeTab;

      let matchesWarehouse = true;
      if (selectedWarehouseName) {
        const itemWarehouse = item.warehouseName || 'Основной склад ИТ';
        matchesWarehouse = itemWarehouse === selectedWarehouseName;
      }

      let matchesPlacement = true;
      if (placementFilter === 'stock') {
        matchesPlacement =
          item.itemSource === 'warehouse' ||
          (item.itemSource === 'computer' && item.status === 'На складе') ||
          (item.itemSource === 'network' && item.status === 'На складе');
      } else if (placementFilter === 'issued') {
        matchesPlacement =
          (item.itemSource === 'computer' && item.status !== 'На складе') ||
          (item.itemSource === 'network' && item.status !== 'На складе');
      }

      return matchesSearch && matchesTab && matchesWarehouse && matchesPlacement;
    });
  }, [
    totalUnifiedList,
    search,
    activeTab,
    selectedWarehouseName,
    placementFilter,
    computerById,
    warehouseById,
    networkById,
  ]);

  const getWarehouseItemsForExcelExport = (): WarehouseItem[] => {
    const ids = new Set(
      filtered
        .filter((item) => item.itemSource === 'warehouse')
        .map((item) => item.id)
    );
    return warehouseItems.filter((w) => ids.has(w.id));
  };

  const alertWarehouseExcelBlocked = () => {
    window.alert(
      t(
        'Импорт и экспорт Excel доступны только после активации лицензии. Откройте Настройки и введите ключ.'
      )
    );
  };

  const handleExportWarehouseExcel = () => {
    if (!allowWarehouseExcel) {
      alertWarehouseExcelBlocked();
      return;
    }
    const items = getWarehouseItemsForExcelExport();
    if (items.length === 0) {
      window.alert(t('Нет позиций склада для экспорта по текущим фильтрам.'));
      return;
    }
    void exportWarehouseItemsToExcelFile(items);
  };

  const handleWarehouseImportFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file || !onImportWarehouseExcel) {
      input.value = '';
      return;
    }

    if (!allowWarehouseExcel) {
      input.value = '';
      alertWarehouseExcelBlocked();
      return;
    }

    setImportLoading(true);
    try {
      const buffer = await readFileAsArrayBuffer(file);
      if (!buffer.byteLength) {
        window.alert(t('Выбранный файл пуст. Выберите сохранённый .xlsx со склада Vicariustab.'));
        return;
      }

      let rows;
      try {
        rows = await parseWarehouseExcelBuffer(buffer);
      } catch {
        rows = await parseWarehouseExcelFile(file);
      }

      if (rows.length === 0) {
        window.alert(
          t('В файле не найдены строки склада. Используйте файл, экспортированный из Vicariustab (лист Warehouse / Склад).')
        );
        return;
      }

      if (
        !window.confirm(
          interpolate(t('Импортировать {n} поз. из Excel? Существующие строки с тем же ID или инв. номером будут обновлены.'), {
            n: String(rows.length),
          })
        )
      ) {
        return;
      }

      const result = onImportWarehouseExcel(rows);
      setImportResult(result);
    } catch {
      window.alert(
        t('Не удалось прочитать файл. Сохраните книгу в Excel как .xlsx и выберите файл с диска (не открытую вкладку).')
      );
    } finally {
      input.value = '';
      setImportLoading(false);
    }
  };

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

  const pendingWarehouseItems = warehouseItems.filter((w) => w.status === 'На списание');

  const isInvCoveredByPendingWarehouse = (inv?: string) =>
    pendingWarehouseItems.some(
      (w) =>
        inventoryNumbersMatch(w.inventoryNumber, inv) ||
        (w.splitFromInventoryNumber &&
          inventoryNumbersMatch(w.splitFromInventoryNumber, inv))
    );

  const isSoftwareCoveredByPendingWarehouse = (s: SoftwareItem) =>
    pendingWarehouseItems.some((w) => warehouseItemLinksSoftware(w, s));

  const pendingWriteOffItems = [
    ...pendingWarehouseItems.map((w) => ({
      id: w.id,
      sourceType: 'warehouse' as const,
      name: w.name,
      model: w.model,
      inventoryNumber: w.inventoryNumber || '',
      quantity: w.quantity || 1,
      unit: w.unit || 'шт.',
      cost: w.costPerUnit || 0,
      originalItem: w,
    })),
    ...computers
      .filter(
        (c) => c.status === 'На списание' && !isInvCoveredByPendingWarehouse(c.inventoryNumber)
      )
      .map((c) => ({
        id: c.id,
        sourceType: 'computer' as const,
        name: c.category,
        model: c.model,
        inventoryNumber: c.inventoryNumber || '',
        quantity: 1,
        unit: 'шт.',
        cost: c.cost || 0,
        originalItem: c,
      })),
    ...networkDevices
      .filter(
        (n) => n.status === 'На списание' && !isInvCoveredByPendingWarehouse(n.inventoryNumber)
      )
      .map((n) => ({
        id: n.id,
        sourceType: 'network' as const,
        name: n.deviceName,
        model: n.type,
        inventoryNumber: n.inventoryNumber || '',
        quantity: n.quantity || 1,
        unit: 'шт.',
        cost: n.cost || 0,
        originalItem: n,
      })),
    ...softwareItems
      .filter(
        (s) => s.status === 'На списание' && !isSoftwareCoveredByPendingWarehouse(s)
      )
      .map((s) => ({
        id: s.id,
        sourceType: 'software' as const,
        name: s.name,
        model: s.developer || s.category,
        inventoryNumber: s.licenseKey || '',
        quantity: s.quantity || 1,
        unit: 'лиц.',
        cost: s.cost || 0,
        originalItem: s,
      })),
  ];

  // Total company TMZ value metric
  const grandCompanyValueSum = totalUnifiedList.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0);
  const grandCompanyValueCount = totalUnifiedList.reduce((sum, item) => sum + item.quantity, 0);

  const [currency, setCurrency] = useState<'RUB' | 'USD' | 'CNY'>('RUB');

  const formatReceiptDate = (iso?: string): string | null => {
    if (!iso?.trim()) return null;
    const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return iso.trim();
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Sub-navigation tabs for Warehouse views */}
      <div className="flex overflow-x-auto scrollbar-none flex-nowrap gap-1 border-b border-slate-100 bg-white p-2 rounded-xl border shadow-3xs">
        <button
          onClick={() => setCurrentWhTab('stock')}
          className={`flex items-center gap-2 py-2 px-3 sm:px-4 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 ${
            currentWhTab === 'stock'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          <Warehouse size={13} />
          {t("ТМЦ в наличии")}
        </button>
        <button
          onClick={() => {
            setCurrentWhTab('history');
            if (pendingWriteOffItems.length > 0) {
              setActiveWriteOffTab('pending');
            }
          }}
          className={`flex items-center gap-2 py-2 px-3 sm:px-4 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 ${
            currentWhTab === 'history'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          <ClipboardList size={13} />
          {t("Списание оборудования")}
          {pendingWriteOffItems.length > 0 && (
            <span
              className={`min-w-[1.25rem] px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                currentWhTab === 'history'
                  ? 'bg-white/20 text-white'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {pendingWriteOffItems.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setCurrentWhTab('warehouses')}
          className={`flex items-center gap-2 py-2 px-3 sm:px-4 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 ${
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
      <div className="bg-gradient-to-r from-slate-800 to-indigo-900 text-white p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md border border-slate-700/50">
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
        
        <div className="flex flex-wrap items-center justify-start md:justify-end gap-2 shrink-0">
          <select 
            value={currency} 
            onChange={(e) => setCurrency(e.target.value as 'RUB' | 'USD' | 'CNY')}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl text-xs font-semibold text-white cursor-pointer focus:outline-none transition-all shadow-sm"
          >
            <option value="RUB">RUB ₽</option>
            <option value="USD">USD $</option>
            <option value="CNY">CNY ¥</option>
          </select>
          {!isViewer && currentWhTab === 'stock' && (
            <>
              <button
                type="button"
                onClick={handleExportWarehouseExcel}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm text-white border ${
                  allowWarehouseExcel
                    ? 'bg-slate-700 hover:bg-slate-600 border-slate-600 cursor-pointer'
                    : 'bg-slate-800/80 border-slate-700 opacity-55 cursor-not-allowed'
                }`}
                title={
                  allowWarehouseExcel
                    ? t('Экспорт в Excel')
                    : t('Доступно после активации лицензии')
                }
              >
                <Download size={13} />
                <span className="hidden sm:inline">{t('Экспорт Excel')}</span>
              </button>
              {onImportWarehouseExcel &&
                (allowWarehouseExcel ? (
                  <label
                    className={`px-3 py-2 bg-emerald-700 hover:bg-emerald-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer text-white border border-emerald-600 ${
                      importLoading ? 'opacity-60 pointer-events-none' : ''
                    }`}
                    title={t('Импорт из Excel')}
                  >
                    <FileSpreadsheet size={13} />
                    <span className="hidden sm:inline">
                      {importLoading ? t('Загрузка…') : t('Импорт Excel')}
                    </span>
                    <input
                      ref={warehouseImportInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                      className="sr-only"
                      disabled={importLoading}
                      onChange={(e) => void handleWarehouseImportFileChange(e)}
                    />
                  </label>
                ) : (
                  <button
                    type="button"
                    onClick={alertWarehouseExcelBlocked}
                    className="px-3 py-2 bg-emerald-900/50 border border-emerald-800 opacity-55 rounded-xl text-xs font-bold flex items-center gap-1.5 text-white cursor-not-allowed"
                    title={t('Доступно после активации лицензии')}
                  >
                    <FileSpreadsheet size={13} />
                    <span className="hidden sm:inline">{t('Импорт Excel')}</span>
                  </button>
                ))}
            </>
          )}
          {!isViewer && currentWhTab !== 'history' && (
            <button
              onClick={handleOpenReceipt}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer text-white border border-blue-500"
            >
              <Plus size={13} />{t("Поступление")}</button>
          )}
        </div>
      </div>

      {/* RENDER TAB 1: STOCK INVENTORY */}
      {currentWhTab === 'stock' && (
        <div className="space-y-6">
          {pendingWriteOffItems.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-semibold text-amber-900">
                {interpolate(t('Ожидает списания: {n} поз.'), {
                  n: String(pendingWriteOffItems.length),
                })}
              </p>
              <button
                type="button"
                onClick={goToPendingWriteOffTab}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shrink-0"
              >
                {t('Открыть очередь списания')}
              </button>
            </div>
          )}
          {/* Control Filters and Tabs */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
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
            <div className="flex border-b border-slate-100 pb-1.5 gap-1 overflow-x-auto scrollbar-none">
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
                {t("На складе")} ({whUnified.length + stockCompsUnified.length})
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
                {t("В работе")} ({compsUnified.length + netUnified.length})
              </button>
            </div>

            {/* Dynamic Category Filter bar matching the dashboard layout */}
            <div className="flex flex-wrap gap-1 border-t border-slate-50 pt-3 overflow-x-auto scrollbar-none">
              {WAREHOUSE_CATEGORY_FILTER_TABS.map((tab) => (
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
              <table className="warehouse-stock-table w-full text-left text-sm border-collapse">
                <colgroup>
                  <col className="wh-col-name" />
                  <col className="wh-col-category" />
                  <col className="wh-col-model" />
                  <col className="wh-col-inv" />
                  <col className="wh-col-date" />
                  <col className="wh-col-qty" />
                  <col className="wh-col-unit" />
                  <col className="wh-col-price" />
                  <col className="wh-col-total" />
                  <col className="wh-col-status" />
                  <col className="wh-col-actions" />
                </colgroup>
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400">
                    <th className="font-semibold text-slate-500 uppercase">{t("Товар / Склад хранения")}</th>
                    <th className="font-semibold text-slate-500 uppercase">{t("Категория")}</th>
                    <th className="font-semibold text-slate-500 uppercase">{t("Модель")}</th>
                    <th className="font-semibold text-slate-500 uppercase">{t("Инвентарный номер")}</th>
                    <th className="font-semibold text-slate-500 uppercase">{t("Дата поступления")}</th>
                    <th className="text-center font-semibold text-slate-500 uppercase">{t("Остаток")}</th>
                    <th className="text-center font-semibold text-slate-500 uppercase">{t("Ед.")}</th>
                    <th className="text-right font-semibold text-slate-500 uppercase">{t("Цена за ед.")}</th>
                    <th className="text-right font-semibold text-slate-500 uppercase">{t("Общая сумма")}</th>
                    <th className="text-center font-semibold text-slate-500 uppercase">{t("Статус")}</th>
                    <th className="wh-actions-head text-center font-semibold text-slate-500 uppercase">{t("Действия")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filtered.map((item) => {
                    const whItem =
                      item.itemSource === 'warehouse'
                        ? warehouseItems.find((w) => w.id === item.id)
                        : undefined;
                    const isWarehouseRow = item.itemSource === 'warehouse';
                    const isComputerOnStock =
                      item.itemSource === 'computer' && item.status === 'На складе';
                    const showEdit = !isViewer && !!onEdit && isWarehouseRow;
                    const showSplit =
                      !isViewer && !!onSplitWarehouseStock && item.quantity > 1 && isWarehouseRow;
                    const showMerge =
                      !isViewer &&
                      !!onMergeWarehouseSplit &&
                      isWarehouseRow &&
                      !!whItem &&
                      canMergeSplitItem(whItem);
                    const showDeploy = !isViewer && !!onDeployAsset && isWarehouseRow;
                    const showTransfer =
                      !isViewer && warehouses.length > 1 && isWarehouseRow;
                    const showWriteOff = !isViewer && isWarehouseRow;
                    const showMarkPending =
                      !isViewer &&
                      !!onMarkForWriteOff &&
                      (isWarehouseRow ||
                        isComputerOnStock ||
                        item.itemSource === 'network' ||
                        item.itemSource === 'computer');
                    const showReturn =
                      !isViewer &&
                      !isWarehouseRow &&
                      !isComputerOnStock &&
                      (item.itemSource === 'network' || item.itemSource === 'computer');

                    return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="wh-name-cell font-medium text-slate-850">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="p-1.5 bg-blue-50 text-blue-601 rounded-lg shrink-0">
                            <Warehouse size={14} />
                          </span>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span 
                              onClick={() => onViewDetails?.(item.itemSource === 'warehouse' ? 'warehouse' : item.itemSource === 'computer' ? 'computer' : 'network', item.id)}
                              className="hover:text-blue-650 hover:underline cursor-pointer font-bold text-slate-900 wh-cell-clamp-2"
                              title={item.name}
                            >
                              {item.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold flex items-center flex-wrap gap-1 mt-0.5 min-w-0">
                              <span className="wh-cell-truncate" title={t(item.warehouseName || 'Основной склад ИТ')}>{t(item.warehouseName || 'Основной склад ИТ')}</span>
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
                      <td className="text-slate-500 text-xs font-semibold">
                        <span className="wh-cell-wrap" title={t(item.type)}>{t(item.type)}</span>
                      </td>
                      <td className="text-slate-600 font-bold text-xs">
                        <span className="wh-cell-clamp-2" title={item.model}>{item.model}</span>
                      </td>
                      <td className="font-mono text-slate-500 text-xs font-bold">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="wh-cell-truncate" title={item.inventoryNumber}>{item.inventoryNumber}</span>
                          {item.itemSource === 'warehouse' && item.splitFromInventoryNumber && (
                            <span className="text-[9px] font-sans font-semibold text-violet-600 normal-case">
                              {interpolate(t('разд. от {root}'), { root: item.splitFromInventoryNumber })}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-slate-500 text-xs whitespace-nowrap">
                        {formatReceiptDate(item.receiptDate) ? (
                          <span className="font-semibold">{formatReceiptDate(item.receiptDate)}</span>
                        ) : (
                          <span className="text-slate-300 italic">{t('—')}</span>
                        )}
                      </td>
                      <td className="text-center">
                        <span className={`wh-qty-badge px-2 py-0.5 rounded-lg font-mono text-xs font-bold ${item.quantity <= 2 ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'text-slate-800 bg-slate-100'}`}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="text-center text-slate-450 text-xs">{t(item.unit || 'шт.')}</td>
                      <td className="text-right font-mono text-slate-650 font-medium text-xs wh-num-cell">{formatCurrency(item.costPerUnit)}</td>
                      <td className="text-right font-mono font-extrabold text-slate-900 text-xs wh-num-cell">{formatCurrency(item.costPerUnit * item.quantity)}</td>
                      <td className="text-center">
                        {item.itemSource === 'warehouse' ||
                        (item.itemSource === 'computer' && item.status === 'На складе') ? (
                          item.status === 'Заказано' ? (
                            <span className="wh-status-badge inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
                              {t("Заказано")}
                            </span>
                          ) : item.status === 'Списано' ? (
                            <span className="wh-status-badge inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                              {t("Списано")}
                            </span>
                          ) : (
                            <span className="wh-status-badge inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                              {t("На складе")}
                            </span>
                          )
                        ) : (
                          item.status === 'На ремонте' ? (
                            <span className="wh-status-badge inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                              {t("На ремонте")}
                            </span>
                          ) : (
                            <span className="wh-status-badge inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                              {t("В работе")}
                            </span>
                          )
                        )}
                      </td>
                      <td className="wh-actions-cell">
                        <div className="wh-actions-toolbar" role="group" aria-label={t('Действия')}>
                          <WhTableActionSlot
                            visible={showEdit}
                            title={t('Редактировать')}
                            tone="blue"
                            onClick={() => handleOpenEdit(item.id)}
                          >
                            <Edit2 size={15} strokeWidth={2} />
                          </WhTableActionSlot>
                          <WhTableActionSlot
                            visible={showSplit}
                            title={t('Разделить партию')}
                            tone="violet"
                            onClick={() => {
                              if (whItem) handleOpenStockSplit(whItem);
                            }}
                          >
                            <Split size={15} strokeWidth={2} />
                          </WhTableActionSlot>
                          <WhTableActionSlot
                            visible={showMerge}
                            title={t('Собрать с партией')}
                            tone="teal"
                            onClick={() => {
                              if (whItem) handleMergeSplit(whItem);
                            }}
                          >
                            <Combine size={15} strokeWidth={2} />
                          </WhTableActionSlot>
                          <WhTableActionSlot
                            visible={showDeploy}
                            title={t('Прикрепить / Выдать ТМЦ на объект')}
                            tone="indigo"
                            onClick={() => handleOpenDeploy(item)}
                          >
                            <Plus size={16} strokeWidth={2.25} />
                          </WhTableActionSlot>
                          <WhTableActionSlot
                            visible={showTransfer || showReturn}
                            title={
                              showReturn
                                ? t('Вернуть на склад или переместить')
                                : t('Переместить на другой склад')
                            }
                            tone={showReturn ? 'emerald' : 'amber'}
                            onClick={() =>
                              showReturn
                                ? handleOpenActiveAssetTransition(item)
                                : handleOpenStockTransfer(whItem!)
                            }
                          >
                            {showReturn ? (
                              <RotateCcw size={15} strokeWidth={2} />
                            ) : (
                              <ArrowLeftRight size={15} strokeWidth={2} />
                            )}
                          </WhTableActionSlot>
                          <WhTableActionSlot
                            visible={showWriteOff}
                            title={t('Списать')}
                            tone="rose"
                            onClick={() => {
                              if (whItem) {
                                openWriteOffModal({ source: buildWriteOffSourceFromWarehouse(whItem) });
                              } else {
                                handleOpenWriteOff(item.inventoryNumber);
                              }
                            }}
                          >
                            <Trash2 size={15} strokeWidth={2} />
                          </WhTableActionSlot>
                          <WhTableActionSlot
                            visible={showMarkPending}
                            title={t('На списание')}
                            tone={isWarehouseRow ? 'amber' : 'rose'}
                            onClick={() =>
                              handleMarkForWriteOffClick(
                                item.itemSource === 'network'
                                  ? 'network'
                                  : item.itemSource === 'computer'
                                    ? 'computer'
                                    : 'warehouse',
                                item.id
                              )
                            }
                          >
                            <ClipboardList size={15} strokeWidth={2} />
                          </WhTableActionSlot>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={11} className="text-center py-10 text-slate-400">{t("На балансе склада нет позиций по заданным критериям фильтрации.")}</td>
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
          {/* Sub tabs for Write-offs */}
          <div className="flex border-b border-slate-100 bg-white p-2 rounded-xl border shadow-3xs gap-1 w-max">
            <button
              onClick={() => setActiveWriteOffTab('pending')}
              className={`flex items-center gap-2 py-2 px-3 sm:px-4 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeWriteOffTab === 'pending'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              {t("Ожидает списания")} ({pendingWriteOffItems.length})
            </button>
            <button
              onClick={() => setActiveWriteOffTab('history')}
              className={`flex items-center gap-2 py-2 px-3 sm:px-4 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeWriteOffTab === 'history'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              {t("История актов списания")}
            </button>
          </div>

          {activeWriteOffTab === 'history' && (
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
                    <th className="py-3 px-4 font-semibold text-slate-500 text-xs uppercase">{t("Списал (ФИО)")}</th>
                    <th className="py-3 px-4 font-semibold text-slate-500 text-xs uppercase">{t("Подтвердил (ФИО)")}</th>
                    <th className="py-3 px-4 font-semibold text-slate-500 text-xs uppercase">{t("Причина утилизации и технический акт")}</th>
                    <th className="py-3 px-4 font-semibold text-slate-500 text-xs uppercase">{t("Документ списания")}</th>
                    <th className="py-3 px-4 text-center font-semibold text-slate-500 text-xs uppercase">{t("Действия")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                  {warehouseWriteOffs.map((wo) => (
                    <tr key={wo.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 text-slate-500 font-semibold text-xs font-mono">{wo.date}</td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs font-bold">{t(wo.warehouseName || 'Основной склад ИТ')}</td>
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
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-700 max-w-[8rem]">
                        {wo.author?.trim() || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-700 max-w-[8rem]">
                        {wo.approver?.trim() || '—'}
                      </td>
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="text-xs text-slate-650 font-medium italic break-words mb-1">
                          "{wo.reason}"
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium mb-1.5 flex flex-wrap gap-1">
                          {wo.documentNumber && <span className="bg-blue-50 px-1.5 py-0.5 rounded text-blue-600">{t("Док:")} {wo.documentNumber}</span>}
                          {wo.department && <span className="bg-purple-50 px-1.5 py-0.5 rounded text-purple-600">{t("Отдел:")} {wo.department}</span>}
                          {wo.objectName && <span className="bg-indigo-50 px-1.5 py-0.5 rounded text-indigo-600">{t("Объект:")} {wo.objectName}</span>}
                        </div>
                        {wo.comment && (
                          <div className="text-[10px] text-slate-400 mb-1">
                            {t("Комментарий:")} {wo.comment}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {wo.pdfFile?.content ? (
                          <button
                            type="button"
                            onClick={() => setWriteOffPdfPreview(wo.pdfFile!)}
                            className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-1.5 rounded-md transition-all border border-blue-100"
                            title={wo.pdfFile.name}
                          >
                            <Eye size={12} className="text-blue-600 shrink-0" />
                            <span className="max-w-[10rem] truncate">{t('Открыть документ')}</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">{t("Без технического заключения")}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center select-none">
                        <div className="flex items-center justify-center gap-1">
                          {wo.restoredAt ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {t('Восстановлено')}
                            </span>
                          ) : (
                            !isViewer &&
                            onRestoreWriteOff && (
                              <button
                                type="button"
                                onClick={() => handleRestoreFromHistoryClick(wo.id)}
                                className="px-2 py-1.5 hover:bg-emerald-50 border border-emerald-100 hover:border-emerald-200 rounded-lg text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                                title={t('Вернуть на склад')}
                              >
                                <RotateCcw size={12} className="shrink-0" />
                                <span>{t('Вернуть на склад')}</span>
                              </button>
                            )
                          )}
                          {!isViewer && onDeleteWriteOff && (
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    t('Удалить акт списания из истории? Оборудование не будет восстановлено.')
                                  )
                                ) {
                                  onDeleteWriteOff(wo.id);
                                }
                              }}
                              className="p-1.5 hover:bg-red-50 rounded-lg text-slate-405 hover:text-red-600 transition-colors cursor-pointer"
                              title={t('Удалить акт (без восстановления)')}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {warehouseWriteOffs.length === 0 && (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-slate-400">{t("Ни одного оборудования еще не было списано по акту.")}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            </div>
          )}

          {activeWriteOffTab === 'pending' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Trash2 size={16} className="text-red-500" />
                {t("Оборудование, ожидающее списания")}
              </h3>
              <p className="text-xs text-slate-455">
                {t("Выберите оборудование и нажмите «Оформить акт», чтобы окончательно списать его и перенести в историю.")}
              </p>

              <div className="overflow-x-auto border border-slate-100 rounded-xl bg-slate-50/20">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-slate-400">
                      <th className="py-3 px-4 font-semibold text-slate-500 text-xs uppercase">{t("Категория")}</th>
                      <th className="py-3 px-4 font-semibold text-slate-500 text-xs uppercase">{t("Модель / Детали")}</th>
                      <th className="py-3 px-4 font-semibold text-slate-500 text-xs uppercase">{t("Инвентарный №")}</th>
                      <th className="py-3 px-4 text-center font-semibold text-slate-500 text-xs uppercase">{t("Кол-во")}</th>
                      <th className="py-3 px-4 text-right font-semibold text-slate-500 text-xs uppercase">{t("Стоимость")}</th>
                      <th className="py-3 px-4 text-center font-semibold text-slate-500 text-xs uppercase">{t("Действия")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                    {pendingWriteOffItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-800">{item.name}</td>
                        <td className="py-3.5 px-4 text-slate-600 text-xs font-semibold">{item.model}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-500 text-xs font-bold">{item.inventoryNumber || '—'}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 font-mono text-xs font-bold">
                            {item.quantity} {item.unit}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">
                          {formatCurrency(item.cost * item.quantity)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {!isViewer && (
                            <div className="flex flex-wrap items-center justify-center gap-1.5">
                              {onCancelMarkForWriteOff && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCancelPendingWriteOffClick(
                                      item.sourceType,
                                      item.id
                                    )
                                  }
                                  className="px-2 py-1.5 hover:bg-emerald-50 border border-emerald-100 hover:border-emerald-200 rounded-lg text-emerald-700 hover:text-emerald-800 text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1"
                                >
                                  <RotateCcw size={12} className="shrink-0" />
                                  {t('Вернуть на склад')}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  openWriteOffModal({
                                    invNum: item.inventoryNumber || '',
                                    qty: item.quantity,
                                    source: {
                                      id: item.id,
                                      sourceType: item.sourceType,
                                      name: String(item.name),
                                      model: item.model,
                                      inventoryNumber: item.inventoryNumber,
                                      quantity: item.quantity,
                                      unit: item.unit,
                                      cost: item.cost,
                                    },
                                  });
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-xs transition-colors whitespace-nowrap"
                              >
                                {t('Оформить акт')}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {pendingWriteOffItems.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-400">{t("Нет оборудования, ожидающего списания")}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
                  alert(t('Склад с таким названием уже существует!'));
                  return;
                }
                const newWh: CustomWarehouse = {
                  id: `wh-${Date.now()}`,
                  name: newWhName.trim(),
                  objectName: newWhObject,
                  description: newWhDesc.trim() || t('Филиальный склад IT оборудования'),
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
                    <h4 className="font-bold text-sm text-slate-800">{t("Основной склад ИТ")}</h4>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {t("Главный распределительный архивный склад для закупки техники.")}
                  </p>
                </div>
                
                <div className="flex justify-between items-center text-[11px] text-slate-455 border-t pt-2 border-slate-100">
                  <span>{t("Связанный объект:")} <strong className="text-slate-700">{t("Главный офис")}</strong></span>
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
                          const whName = w.name;
                          const hasStock = warehouseItems.some(
                            (item) =>
                              (item.warehouseName || DEFAULT_WAREHOUSE_NAME) === whName &&
                              item.quantity > 0 &&
                              (item.status === 'В наличии' || item.status === 'На списание')
                          );
                          if (hasStock) {
                            alert(
                              t(
                                'Невозможно удалить склад «{name}»: на нём есть оборудование. Переместите или спишите позиции, затем повторите удаление.'
                              ).replace('{name}', whName)
                            );
                            return;
                          }
                          if (
                            confirm(
                              t('Вы действительно хотите безвозвратно удалить подразделение склада «{name}»?').replace(
                                '{name}',
                                whName
                              )
                            )
                          ) {
                            setWarehouses((prev) => prev.filter((item) => item.id !== w.id));
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
                  <Warehouse className="text-blue-600" />
                  {editingWarehouseId ? t("Редактирование позиции на складе") : t("Новое поступление на Склад")}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  {editingWarehouseId
                    ? t("Изменения синхронизируются с карточками оборудования на складе. Количество меняется через поступление или списание.")
                    : t("Автоматически распределяется в ИТ-отдел со статусом 'На складе'.")}
                </p>
              </div>
              <ModalCloseButton onClick={closeStockModal} />
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
                    {getReceiptGroupSelectOptions(editingWarehouseId ? type : undefined).map((group) => (
                      <option key={group} value={group}>
                        {t(group)}
                      </option>
                    ))}
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
                    placeholder={t("Например, MSI Katana")}
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

              <div className="rounded-xl border border-slate-150 bg-slate-50/50 p-3 flex flex-col sm:flex-row gap-3 items-start">
                <div className="w-20 h-20 rounded-lg border border-slate-200 bg-white overflow-hidden shrink-0 flex items-center justify-center">
                  {photoUrl ? (
                    <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={28} className="text-slate-300" />
                  )}
                </div>
                <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                  <span className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                    {t('Фото оборудования')}
                  </span>
                  <label className="inline-flex self-start items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white border border-slate-200 hover:border-blue-300 text-slate-700 cursor-pointer transition-colors shrink-0">
                    <Upload size={13} />
                    {photoUploading ? t('Загрузка…') : t('Загрузить')}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={photoUploading}
                      onChange={(e) => {
                        void handlePhotoUpload(e.target.files?.[0] || null);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="block text-[10px] text-rose-600 hover:underline font-semibold"
                    >
                      {t('Удалить фото')}
                    </button>
                  )}
                </div>
              </div>

              {isMonitorReceipt && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    {t('Диагональ монитора (дюймы)')}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    step={0.1}
                    placeholder="24"
                    value={monitorDiagonalInput}
                    onChange={(e) => setMonitorDiagonalInput(e.target.value)}
                    className="w-full max-w-[140px] px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-mono"
                  />
                </div>
              )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Количество")}</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-bold"
                    />
                    {editingWarehouseId && (
                      <p className="text-[9px] text-slate-400 mt-0.5 leading-snug">
                        {t('Уменьшить можно только на единицы, которые ещё на складе (не выданы).')}
                      </p>
                    )}
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

                {editingWarehouseId && quantity > 1 && onSplitWarehouseStock && (() => {
                  const editItem = warehouseItems.find((w) => w.id === editingWarehouseId);
                  if (!editItem) return null;
                  const maxSplittable = getSplittableUnitCount(editItem);
                  return (
                    <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-violet-800 uppercase tracking-wide flex items-center gap-1.5">
                          <Split size={13} />
                          {t('Разделение партии')}
                        </span>
                        <span className="text-[9px] text-violet-600 font-medium">
                          {t('Доступно для разделения')}: {maxSplittable} {unit}
                        </span>
                      </div>
                      <p className="text-[10px] text-violet-700/90 leading-relaxed">
                        {t('Отделите часть количества в отдельную складскую позицию с пометкой «разд.» и тем же базовым инвентарным номером. Каждую позицию можно выдавать, возвращать и списывать отдельно.')}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleOpenStockSplit(editItem)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-violet-800 bg-white border border-violet-200 hover:bg-violet-50 transition-colors cursor-pointer"
                      >
                        <Split size={14} />
                        {t('Разделить партию…')}
                      </button>
                    </div>
                  );
                })()}

                {editingWarehouseId && onMergeWarehouseSplit && (() => {
                  const editItem = warehouseItems.find((w) => w.id === editingWarehouseId);
                  if (!editItem || !canMergeSplitItem(editItem)) return null;
                  const root = getMergeTargetLabel(editItem);
                  return (
                    <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-3 space-y-2">
                      <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wide flex items-center gap-1.5">
                        <Combine size={13} />
                        {t('Сборка партии')}
                      </span>
                      <p className="text-[10px] text-teal-800/90 leading-relaxed">
                        {interpolate(t('Собрать обратно в партию {root}'), { root })}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleMergeSplit(editItem)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-teal-800 bg-white border border-teal-200 hover:bg-teal-50 transition-colors cursor-pointer"
                      >
                        <Combine size={14} />
                        {interpolate(t('Собрать обратно в партию {root}'), { root })}
                      </button>
                    </div>
                  );
                })()}

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
                {type !== 'Расходные материалы' && !receiptHasComputerSpecs && quantity <= 1 && (
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

              {type !== 'Расходные материалы' && quantity > 1 && (
                <div className="rounded-xl border border-slate-150 bg-slate-50/60 p-3 space-y-2">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                    {t("Серийные номера по единицам")}
                  </span>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    {t("Укажите S/N для каждой единицы партии. Пустые поля можно заполнить позже при редактировании.")}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {unitSerialNumbers.map((sn, idx) => (
                      <div key={`unit-sn-${idx}`}>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                          {interpolate(t('Единица {n}'), { n: String(idx + 1) })}
                        </label>
                        <input
                          type="text"
                          placeholder={`S/N ${idx + 1}`}
                          value={sn}
                          onChange={(e) => {
                            const next = [...unitSerialNumbers];
                            next[idx] = e.target.value;
                            setUnitSerialNumbers(next);
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Computer / laptop / server specifications */}
              {receiptHasComputerSpecs && (
                <div className="border border-slate-150 rounded-xl p-3 bg-slate-50/50 space-y-2 shrink-0">
                  <div 
                    className="flex items-center justify-between cursor-pointer select-none"
                    onClick={() => {
                      setShowSpecs((v) => !v);
                      setShowSpecFieldPicker(false);
                    }}
                  >
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                      {showSpecs ? "▼ " : "► "}
                      {t("Матрица КТ / Характеристики компьютера")}
                    </span>
                    <span className="text-[10px] text-blue-600 font-bold hover:underline">
                      {showSpecs ? t("Скрыть спецификации") : t("Заполнить спецификации")}
                    </span>
                  </div>
                  {showSpecs && (
                    <div className="pt-2 border-t border-slate-200/50 space-y-3">
                      {quantity > 1 && (
                        <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5 leading-relaxed">
                          {t("При количестве более 1 шт. укажите серийный номер каждой единицы в блоке выше. Характеристики комплектующих ниже применяются ко всем единицам; их S/N получат суффикс -1, -2 и т.д., если не заданы отдельно.")}
                        </p>
                      )}

                      {specsBlockActive && (
                        <div className="space-y-3">
                          {activeStandardSpecs.map((key) => {
                            const meta = PICKABLE_SPEC_CATALOG.find((f) => f.key === key)!;
                            const serialKey = SPEC_TO_SERIAL[key];
                            return (
                              <div key={key} className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                                    {t(SERIAL_SPEC_META.labelKey)}
                                  </label>
                                  <input
                                    type="text"
                                    placeholder={SERIAL_SPEC_META.placeholder}
                                    value={componentSerialValues[serialKey]}
                                    onChange={(e) => setComponentSerial(serialKey, e.target.value)}
                                    className="w-full px-2.5 py-1.5 border border-slate-250 bg-white rounded-lg text-[11px] font-medium font-mono focus:ring-1 focus:ring-blue-500/50 text-slate-700"
                                  />
                                </div>
                                <div className="relative">
                                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1 pr-6">
                                    {t(meta.labelKey)}
                                  </label>
                                  <input
                                    type="text"
                                    placeholder={meta.placeholder}
                                    value={specValues[key]}
                                    onChange={(e) => setSpecValue(key, e.target.value)}
                                    className="w-full px-2.5 py-1.5 border border-slate-250 bg-white rounded-lg text-[11px] font-medium focus:ring-1 focus:ring-blue-500/50 text-slate-700"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeStandardSpecField(key)}
                                    className="absolute right-0 top-0 p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                    aria-label={t('Удалить')}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                          {customSpecRows.map((row) => (
                            <div key={row.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                                  {t(SERIAL_SPEC_META.labelKey)}
                                </label>
                                <input
                                  type="text"
                                  placeholder={SERIAL_SPEC_META.placeholder}
                                  value={row.serial}
                                  onChange={(e) => updateCustomSpecRow(row.id, { serial: e.target.value })}
                                  className="w-full px-2.5 py-1.5 border border-slate-250 bg-white rounded-lg text-[11px] font-medium font-mono focus:ring-1 focus:ring-blue-500/50 text-slate-700"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">{t('Название')}</label>
                                <input
                                  type="text"
                                  placeholder={t('Например: Монитор')}
                                  value={row.label}
                                  onChange={(e) => updateCustomSpecRow(row.id, { label: e.target.value })}
                                  className="w-full px-2.5 py-1.5 border border-slate-250 bg-white rounded-lg text-[11px] font-medium focus:ring-1 focus:ring-blue-500/50 text-slate-700"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">{t('Значение')}</label>
                                <input
                                  type="text"
                                  placeholder={t('Значение')}
                                  value={row.value}
                                  onChange={(e) => updateCustomSpecRow(row.id, { value: e.target.value })}
                                  className="w-full px-2.5 py-1.5 border border-slate-250 bg-white rounded-lg text-[11px] font-medium focus:ring-1 focus:ring-blue-500/50 text-slate-700"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeCustomSpecRow(row.id)}
                                className="p-1.5 mb-0.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                aria-label={t('Удалить')}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {activeStandardSpecs.length === 0 && customSpecRows.length === 0 && (
                        <p className="text-[10px] text-slate-400 italic text-center py-2">
                          {t('Добавьте нужные характеристики кнопкой ниже — отображаются только выбранные поля.')}
                        </p>
                      )}

                      <div className="flex flex-col sm:flex-row gap-2 sm:items-center pt-1">
                        <button
                          type="button"
                          onClick={() => setShowSpecFieldPicker((v) => !v)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                          <Plus size={14} />
                          {t('Добавить характеристику')}
                        </button>
                        {showSpecFieldPicker && (
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              const v = e.target.value;
                              if (!v) return;
                              if (v === '__custom__') addCustomSpecRow();
                              else addStandardSpecField(v as PickableSpecKey);
                              e.target.value = '';
                            }}
                            className="flex-1 min-w-0 px-2.5 py-1.5 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                          >
                            <option value="">{t('Выберите характеристику…')}</option>
                            {PICKABLE_SPEC_CATALOG.filter(({ key }) => !activeStandardSpecs.includes(key)).map(
                              ({ key, labelKey }) => (
                                <option key={key} value={key}>
                                  {t(labelKey)}
                                </option>
                              )
                            )}
                            <option value="__custom__">{t('Своё поле (произвольное)')}</option>
                          </select>
                        )}
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
                  onClick={closeStockModal}
                  className="px-4 py-2 border border-slate-200 text-slate-500 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >{t("Отмена")}</button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                >{editingWarehouseId ? t("Сохранить изменения") : t("Принять на склад")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: отправка на списание (очередь) */}
      {showMarkPendingModal && markPendingTarget && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all p-6 space-y-4 border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="shrink-0 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-lg text-amber-600 flex items-center gap-2">
                  <ClipboardList size={20} />{t('Отправка на списание')}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  {t('Укажите количество единиц для перевода в очередь «Ожидает списания».')}
                </p>
              </div>
              <ModalCloseButton
                onClick={() => {
                  setShowMarkPendingModal(false);
                  setMarkPendingTarget(null);
                }}
              />
            </div>

            {markPendingError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl font-medium border border-rose-100 shrink-0">
                {markPendingError}
              </div>
            )}

            <form onSubmit={handleMarkPendingSubmit} className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1">
                <div><strong>{t('Артикул:')}</strong> {markPendingTarget.name}</div>
                <div><strong>{t('Модель:')}</strong> {markPendingTarget.model}</div>
                <div>
                  <strong>{t('Доступно на складе:')}</strong> {markPendingTarget.maxQty}{' '}
                  {t(markPendingTarget.unit || 'шт.')}
                </div>
                {markPendingTarget.inventoryNumber && (
                  <div>
                    <strong>{t('Инвентарный №:')}</strong> {markPendingTarget.inventoryNumber}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  {t('Количество для отправки на списание')}
                </label>
                <input
                  type="number"
                  min={1}
                  max={markPendingTarget.maxQty}
                  required
                  value={markPendingQtyInput}
                  onChange={(e) => setMarkPendingQtyInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowMarkPendingModal(false);
                    setMarkPendingTarget(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {t('Отмена')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  {t('Отправить на списание')}
                </button>
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
              <ModalCloseButton
                onClick={() => {
                  setShowWriteOffModal(false);
                  setWriteOffSourceLocked(false);
                }}
              />
            </div>

            {writeOffError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl font-medium border border-rose-100 shrink-0">
                {writeOffError}
              </div>
            )}

            <form onSubmit={handleWriteOffSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Выбранный товар для списания")}</label>
                {writeOffSourceLocked ||
                (activeWriteOffSourceItem?.sourceType &&
                  activeWriteOffSourceItem.sourceType !== 'warehouse') ? (
                  <div className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-700 font-semibold">
                    {activeWriteOffSourceItem
                      ? formatWriteOffSourceLabel(activeWriteOffSourceItem)
                      : t('Не выбран элемент для списания.')}
                  </div>
                ) : (
                  <select
                    required
                    value={activeWriteOffSourceItem?.id ?? ''}
                    onChange={(e) => {
                      const wh = warehouseItems.find((w) => w.id === e.target.value);
                      if (!wh) {
                        setActiveWriteOffSourceItem(null);
                        setWriteOffInvNum('');
                        return;
                      }
                      const source = buildWriteOffSourceFromWarehouse(wh);
                      setActiveWriteOffSourceItem(source);
                      setWriteOffInvNum(wh.inventoryNumber);
                      setWriteOffQty((prev) => Math.min(Math.max(1, prev), wh.quantity));
                      setWriteOffError('');
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/15 focus:border-rose-400"
                  >
                    <option value="">{t('Выберите товар')}</option>
                    {getWritableWarehouseItems().map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.inventoryNumber}) — {t('Доступно')} {w.quantity}{' '}
                        {t(w.unit || 'шт.')}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t("Количество для списания")}</label>
                  <input
                    type="number"
                    min={1}
                    max={activeWriteOffSourceItem?.quantity ?? undefined}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t("Инициатор списания (ФИО)")}</label>
                  <input
                    type="text"
                    required
                    placeholder="Иванов И.И."
                    value={writeOffAuthor}
                    onChange={(e) => setWriteOffAuthor(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t("Согласующий (ФИО)")}</label>
                  <input
                    type="text"
                    required
                    placeholder="Петров П.П."
                    value={writeOffApprover}
                    onChange={(e) => setWriteOffApprover(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t("Документ / Номер акта")}</label>
                  <input
                    type="text"
                    placeholder="№ А-123 от 20.06.2026"
                    value={writeOffDocument}
                    onChange={(e) => setWriteOffDocument(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t("Доп. Комментарий")}</label>
                  <input
                    type="text"
                    placeholder={t("Например: Утилизация через эко-сервис")}
                    value={writeOffComment}
                    onChange={(e) => setWriteOffComment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t("Подразделение (Откуда)")}</label>
                  <input
                    type="text"
                    placeholder={t("Например: Бухгалтерия")}
                    value={writeOffDepartment}
                    onChange={(e) => setWriteOffDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t("Объект / Локация")}</label>
                  <input
                    type="text"
                    placeholder={t("Например: Главный офис")}
                    value={writeOffObject}
                    onChange={(e) => setWriteOffObject(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
                  />
                </div>
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
                  value={deployQtyInput}
                  disabled={deploySelectedUnitIds.length > 0}
                  onChange={(e) => setDeployQtyInput(e.target.value)}
                  onBlur={() => {
                    let n = parseInt(deployQtyInput, 10);
                    if (!Number.isFinite(n) || n < 1) n = 1;
                    if (n > deployItem.quantity) n = deployItem.quantity;
                    setDeployQtyInput(String(n));
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 disabled:bg-slate-50 disabled:text-slate-400"
                />
                {deployStockUnits.length > 0 && (
                  <div className="mt-3 space-y-2 rounded-xl border border-indigo-100 bg-indigo-50/40 p-3">
                    <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wide">
                      {t('Выбор единиц по серийному номеру')}
                    </span>
                    <p className="text-[10px] text-indigo-700/90 leading-relaxed">
                      {t('Отметьте конкретные единицы или укажите только количество выше.')}
                    </p>
                    <div className="max-h-36 overflow-y-auto space-y-1.5">
                      {deployStockUnits.map((unit) => {
                        const checked = deploySelectedUnitIds.includes(unit.id);
                        return (
                          <label
                            key={unit.id}
                            className={`flex items-start gap-2 p-2 rounded-lg border text-[11px] cursor-pointer ${
                              checked
                                ? 'border-indigo-300 bg-white'
                                : 'border-slate-200 bg-white/80 hover:border-indigo-200'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5"
                              checked={checked}
                              onChange={(e) => {
                                setDeploySelectedUnitIds((prev) => {
                                  const next = e.target.checked
                                    ? [...prev, unit.id]
                                    : prev.filter((id) => id !== unit.id);
                                  if (next.length > 0) {
                                    setDeployQtyInput(String(next.length));
                                  }
                                  return next;
                                });
                              }}
                            />
                            <span className="font-mono text-slate-800 leading-snug">
                              {unit.inventoryNumber}
                              {unit.serialNumber ? (
                                <span className="block text-slate-500 font-sans">
                                  S/N: {unit.serialNumber}
                                </span>
                              ) : (
                                <span className="block text-slate-400 font-sans italic">
                                  {t('Серийный номер не указан')}
                                </span>
                              )}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {deploySelectedUnitIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setDeploySelectedUnitIds([]);
                          setDeployQtyInput('1');
                        }}
                        className="text-[10px] font-bold text-indigo-700 hover:underline"
                      >
                        {t('Сбросить выбор единиц')}
                      </button>
                    )}
                  </div>
                )}
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
              <div><strong>{t("Текущее расположение:")}</strong> {transitionAssetItem.location} ({transitionAssetItem.employeeName || t('Основной')})</div>
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
                  value={transferQtyInput}
                  onChange={(e) => setTransferQtyInput(e.target.value)}
                  onBlur={() => {
                    let n = parseInt(transferQtyInput, 10);
                    if (!Number.isFinite(n) || n < 1) n = 1;
                    if (n > transferStockItem.quantity) n = transferStockItem.quantity;
                    setTransferQtyInput(String(n));
                  }}
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

      {/* RENDER MODAL 7: SPLIT WAREHOUSE BATCH */}
      {showSplitModal && splitStockItem && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center z-[60] p-4 font-sans">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[92vh] overflow-y-auto transform transition-all p-6 space-y-4 border border-slate-100">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Split size={18} className="text-violet-600 shrink-0" />
                {t('Разделить партию')}
              </h3>
              <ModalCloseButton onClick={() => setShowSplitModal(false)} />
            </div>

            <div className="p-3 bg-violet-50/60 border border-violet-100 rounded-xl text-xs space-y-1">
              <div><strong>{t('ТМЦ:')}</strong> {splitStockItem.name} ({splitStockItem.model})</div>
              <div><strong>{t('Инвентарный №:')}</strong> {splitStockItem.inventoryNumber}</div>
              <div><strong>{t('На складе:')}</strong> {splitStockItem.quantity} {splitStockItem.unit || 'шт.'}</div>
              <div><strong>{t('Доступно для разделения:')}</strong> {getSplittableUnitCount(splitStockItem)} {splitStockItem.unit || 'шт.'}</div>
            </div>

            <form onSubmit={handleStockSplitSubmit} className="space-y-4">
              {splitError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-100">
                  {splitError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t('Сколько единиц отделить')}</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={splitStockItem.quantity}
                  value={splitQtyInput}
                  onChange={(e) => setSplitQtyInput(e.target.value)}
                  onBlur={() => {
                    let n = parseInt(splitQtyInput, 10);
                    if (!Number.isFinite(n) || n < 1) n = 1;
                    if (n > splitStockItem.quantity) n = splitStockItem.quantity;
                    setSplitQtyInput(String(n));
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                />
              </div>

              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={splitIntoUnits}
                  onChange={(e) => setSplitIntoUnits(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-violet-600 focus:ring-violet-500/30"
                />
                <span className="text-[11px] text-slate-600 leading-relaxed">
                  {t('Отдельная складская позиция на каждую единицу (по 1 шт.)')}
                </span>
              </label>

              <div className="p-3 bg-white border border-violet-100 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-violet-800 uppercase">{t('Инвентарный № новой позиции')}</span>
                <p className="text-sm font-mono font-bold text-slate-800">
                  {getSplitPreviewInv(
                    splitStockItem,
                    Math.min(
                      parseInt(splitQtyInput, 10) || 1,
                      splitStockItem.quantity
                    ),
                    splitIntoUnits
                  )}
                </p>
                <p className="text-[10px] text-violet-700">
                  {interpolate(t('разд. от {root}'), {
                    root: getSplitRootInventoryNumber(
                      splitStockItem.inventoryNumber,
                      splitStockItem.splitFromInventoryNumber
                    ),
                  })}
                </p>
                {!splitIntoUnits && parseInt(splitQtyInput, 10) > 1 && (
                  <p className="text-[9px] text-slate-400">
                    {t('Единицы в реестре получат суффиксы -1, -2 при количестве более 1 в новой партии.')}
                  </p>
                )}
              </div>

              <p className="text-[10px] text-slate-500 leading-relaxed">
                {t('Новая позиция появится в списке склада. Её можно выдавать, возвращать на склад и списывать независимо от исходной партии.')}
              </p>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSplitModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {t('Отмена')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  {t('Разделить')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {writeOffPdfPreview?.content && (
        <PdfPreviewModal
          file={writeOffPdfPreview}
          onClose={() => setWriteOffPdfPreview(null)}
          subtitle={t('Акт списания оборудования')}
        />
      )}

      {importResult && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden p-6 space-y-4 border border-slate-100">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <FileSpreadsheet size={20} className="text-emerald-600" />
                {t('Результат импорта Excel')}
              </h3>
              <ModalCloseButton onClick={() => setImportResult(null)} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <div className="font-extrabold text-emerald-800 text-lg">{importResult.created}</div>
                <div className="text-emerald-700 font-semibold">{t('Создано')}</div>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                <div className="font-extrabold text-blue-800 text-lg">{importResult.updated}</div>
                <div className="text-blue-700 font-semibold">{t('Обновлено')}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="font-extrabold text-slate-700 text-lg">{importResult.skipped}</div>
                <div className="text-slate-600 font-semibold">{t('Пропущено')}</div>
              </div>
            </div>
            {importResult.errors.length > 0 && (
              <div className="max-h-40 overflow-y-auto p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-900 space-y-1">
                {importResult.errors.map((err, i) => (
                  <p key={`imp-err-${i}`}>{err}</p>
                ))}
              </div>
            )}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setImportResult(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg"
              >
                {t('Закрыть')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
