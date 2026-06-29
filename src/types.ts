/*
 * COPYRIGHT NOTICE | УВЕДОМЛЕНИЕ ОБ АВТОРСКИХ ПРАВАХ | 版权声明
 * © 2026 Utkin Vladislav Vyacheslavovich (Уткин Владислав Вячеславович)
 * Email: vicariustab@icloud.com | Telegram: https://t.me/Dexterll
 * All rights reserved. Unauthorized copying, modification, distribution or commercial use is prohibited.
 * 保留所有权利。未经版权所有者事先书面同意，禁止复制、修改、分发或商业使用。
 * Все права защищены. Копирование, изменение, распространение и коммерческое использование без письменного согласия правообладателя запрещено.
 * Release
 */
export interface ObjectItem {
  id: string;
  name: string;
  address: string;
  photoUrl?: string;
  iconName?: string;
  isArchived?: boolean; // NEW: Archiving objects
}

export type NetworkDeviceType = 'Коммутатор' | 'Маршрутизатор' | 'Точка доступа' | 'Другое';

export interface NetworkDevice {
  id: string;
  deviceName: string;
  type: NetworkDeviceType;
  objectName: string;
  ipAddress: string;
  quantity: number;
  inventoryNumber?: string;
  photoUrl?: string;
  pdfFiles?: { name: string; size?: string; content?: string; group?: string; dateUploaded?: string }[];
  portsCount?: number;
  workingPorts?: number[];
  damagedPorts?: number[];
  invoiceInfo?: string;
  memoInfo?: string;
  warrantyInfo?: string;
  cost?: number;
  status?: 'В работе' | 'На списание' | 'Активно' | 'На складе' | 'Выдано' | 'В ремонте' | 'На проверке' | 'Под списание' | 'Списано';
  replacedComponents?: {
    id: string;
    name: string;
    oldDetails: string;
    newDetails: string;
    date: string;
    reason?: string;
  }[];
}

export type ComputerCategory = 'Ноутбук' | 'ПК' | 'Монитор' | 'Периферия' | 'Оргтехника' | 'Видеонаблюдение' | 'Расходники' | 'Другое';
export type ComputerStatus = 'В работе' | 'На ремонте' | 'На складе' | 'Списано' | 'На списание' | 'Активно' | 'Выдано' | 'В ремонте' | 'На проверке' | 'Под списание';

export interface EquipmentCustomSpec {
  label: string;
  value: string;
  serial?: string;
}

export interface ComputerItem {
  id: string;
  category: ComputerCategory;
  model: string;
  inventoryNumber: string;
  employeeName: string;
  status: ComputerStatus;
  objectName: string;
  photoUrl?: string;
  deviceType?: string;
  /** Monitor screen size in inches (peripherals) */
  monitorDiagonalInches?: number;
  serialNumber?: string;
  pdfFiles?: { name: string; size?: string; content?: string }[];
  motherboardModel?: string;
  motherboardSerial?: string;
  hddModel?: string;
  hddSerial?: string;
  ramModel?: string;
  ramSerial?: string;
  caseModel?: string;
  powerSupplyModel?: string;
  powerSupplySerial?: string;
  cpuModel?: string;
  cpuSerial?: string;
  gpuModel?: string;
  gpuSerial?: string;
  invoiceInfo?: string;
  memoInfo?: string;
  warrantyInfo?: string;
  linkedToDeviceId?: string;
  cost?: number;
  replacedComponents?: {
    id: string;
    name: string;
    oldDetails: string;
    newDetails: string;
    date: string;
    reason?: string;
  }[];
  cartridges?: {
    id: string;
    model: string;
    status: 'Заправлен' | 'Пустой' | 'На заправке';
    color?: string;
    lastServiceDate?: string;
  }[];
  /** User-defined specification rows (warehouse receipt / edit) */
  customSpecs?: EquipmentCustomSpec[];
}

export type EmployeeStatus = 'Работает' | 'Уволен' | 'В отпуске' | 'На удаленном рабочем месте';

export interface EmployeeItem {
  id: string;
  name: string;
  position: string;
  department: string;
  photoUrl?: string;
  pdfFiles?: { name: string; size?: string; content?: string }[];
  status?: EmployeeStatus;
  objectName?: string;
  email?: string;
  phone?: string;
  isArchived?: boolean; // NEW: Archiving employees
}

export type WarehouseItemType = 'Компьютеры' | 'Сетевое оборудование' | 'Периферия' | 'Оргтехника' | 'Видеонаблюдение' | 'Расходные материалы' | 'Лицензии ПО' | 'Другое';
export type WarehouseItemStatus = 'В наличии' | 'Заказано' | 'Списано' | 'На списание' | 'Активно' | 'Выдано' | 'В ремонте' | 'На проверке' | 'Под списание';

export interface WarehouseItem {
  id: string;
  name: string;
  type: WarehouseItemType;
  model: string;
  inventoryNumber: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  status: WarehouseItemStatus;
  photoUrl?: string;
  pdfFiles?: { name: string; size?: string; content?: string; group?: string; dateUploaded?: string }[];
  invoiceInfo?: string;
  memoInfo?: string;
  warrantyInfo?: string;
  warehouseName?: string;
  deviceType?: string;
  /** Monitor screen size in inches (peripherals) */
  monitorDiagonalInches?: number;
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
  customSpecs?: EquipmentCustomSpec[];
  /** Root inventory number this line was split from (e.g. ST-0010) */
  splitFromInventoryNumber?: string;
  /** 1-based split part index for display (ST-0010/р1) */
  splitPartIndex?: number;
  /** Per-unit serial numbers when quantity > 1 (index 0 = first unit) */
  unitSerialNumbers?: string[];
  /** First receipt date (YYYY-MM-DD) */
  receiptDate?: string;
}

export interface Activity {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  detail: string;
  type: 'create' | 'update' | 'delete' | 'system' | 'auth';
}

export interface InventoryAudit {
  id: string;
  date: string;
  title: string;
  status: 'Завершена' | 'В процессе' | 'Запланирована';
  responsibleUser: string;
  itemsAudited: number;
  mismatchesFound: number;
  objectName?: string;
  controllerUser?: string;
  conductorUser?: string;
  startNotes?: string;
  conclusionNotes?: string;
  pdfFiles?: { name: string; size?: string; content?: string }[];
  /** Total TMC positions in audit scope */
  totalItems?: number;
  /** Per-item verification: present / missing */
  itemChecks?: Record<string, 'present' | 'missing'>;
}

export type UserRole = 'Viewer' | 'Editor' | 'Admin';

export interface UserSession {
  id: string;
  userId: string;
  userName: string;
  userRole: 'Admin' | 'Editor';
  deviceFingerprint: string;
  ipAddress: string;
  country?: string;
  city?: string;
  browser: string;
  os: string;
  device: string;
  userAgent: string;
  createdAt: string;
  lastActivityAt: string;
  status: 'active' | 'revoked' | 'expired';
  isCurrent?: boolean;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  isCustom?: boolean;
  login?: string;
  password?: string;
  passwordSet?: boolean;
  isBlocked?: boolean; // NEW: Block users
  emailVerified?: boolean;
  emailNotificationsEnabled?: boolean;
  telegramChatId?: string;
  telegramNotificationsEnabled?: boolean;
}

export type SoftwareCategory = 'Системное ПО' | 'Операционные системы (ОС)' | 'Утилиты и антивирусы' | 'Офисные приложения' | 'Графические редакторы' | 'Корпоративные системы' | 'Иное ПО';

export interface SoftwareLicenseSeat {
  seatIndex: number;
  licenseKey?: string;
  assignedEmployeeName?: string;
  assignedDeviceId?: string;
  objectName?: string;
}

export interface SoftwareItem {
  id: string;
  name: string;
  category: SoftwareCategory;
  licenseKey: string;
  /** Отдельный ключ на каждое место при quantity > 1 */
  licenseKeys?: string[];
  /** Поштучная выдача: quantity = licenseSeats.length */
  licenseSeats?: SoftwareLicenseSeat[];
  version: string;
  developer: string;
  quantity: number;
  assignedEmployeeName: string;
  assignedDeviceId?: string;
  objectName: string;
  status: 'Активна' | 'Истекла' | 'Не активирована' | 'На списание' | 'Активно' | 'На складе' | 'Выдано' | 'В ремонте' | 'На проверке' | 'Под списание' | 'Списано';
  purchaseDate?: string;
  expirationDate?: string;
  notes?: string;
  cost?: number;
}

export interface CustomWarehouse {
  id: string;
  name: string;
  objectName: string;
  description?: string;
  isCustom?: boolean;
}

export interface WarehouseWriteOff {
  id: string;
  inventoryNumber: string;
  name: string;
  type: string;
  model: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  reason: string;
  date: string;
  pdfFile?: { name: string; size?: string; content?: string };
  warehouseName?: string;
  author?: string;
  approver?: string;
  documentNumber?: string; // NEW fields
  comment?: string;
  department?: string;
  objectName?: string;
  photos?: string[];
  history?: { date: string; action: string; user: string }[];
  /** Registry source at write-off time (for restore). */
  sourceType?: 'warehouse' | 'computer' | 'network' | 'software';
  /** ISO timestamp when equipment was restored from this act. */
  restoredAt?: string;
  restoredBy?: string;
}
