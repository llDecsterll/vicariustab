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
  iconName?: string; // custom icon name like 'Building2', 'Warehouse', 'Server', 'Wifi', 'Laptop'
}

export type NetworkDeviceType = 'Коммутатор' | 'Маршрутизатор' | 'Точка доступа' | 'Другое';

export interface NetworkDevice {
  id: string;
  deviceName: string;
  type: NetworkDeviceType;
  objectName: string; // Referenced Object name
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
  cost?: number; // Cost / price of the equipment
}

export type ComputerCategory = 'Ноутбук' | 'ПК' | 'Монитор' | 'Периферия' | 'Оргтехника' | 'Видеонаблюдение' | 'Расходники' | 'Другое';
export type ComputerStatus = 'В работе' | 'На ремонте' | 'На складе' | 'Списано';

export interface ComputerItem {
  id: string;
  category: ComputerCategory;
  model: string;
  inventoryNumber: string;
  employeeName: string; // Referenced Employee Name
  status: ComputerStatus;
  objectName: string; // Location
  photoUrl?: string;
  deviceType?: string; // Specific device type e.g. 'Ноутбук', 'Видеокамера', etc.
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
  linkedToDeviceId?: string; // ID of PC or Laptop this peripheral/monitor is linked to
  cost?: number; // Cost / price of the equipment
  replacedComponents?: {
    id: string;
    name: string; // e.g. "SSD", "RAM", etc.
    oldDetails: string; // e.g. "Kingston 240GB"
    newDetails: string; // e.g. "Crucial 500GB"
    date: string;
    reason?: string;
  }[];
  cartridges?: {
    id: string;
    model: string; // e.g. "HP 85A"
    status: 'Заправлен' | 'Пустой' | 'На заправке';
    color?: string; // e.g. "Черный", "Голубой", etc.
    lastServiceDate?: string;
  }[];
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
  objectName?: string; // Attached location/object
  email?: string;
  phone?: string;
}

export type WarehouseItemType = 'Компьютеры' | 'Сетевое оборудование' | 'Периферия' | 'Оргтехника' | 'Видеонаблюдение' | 'Расходные материалы' | 'Лицензии ПО' | 'Другое';
export type WarehouseItemStatus = 'В наличии' | 'Заказано' | 'Списано';

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
  warehouseName?: string; // NEW: Linked warehouse name
  deviceType?: string; // Specific device type e.g. 'ПК', 'Ноутбук'
  serialNumber?: string;
  cpuModel?: string;
  ramModel?: string;
  hddModel?: string;
  gpuModel?: string;
  motherboardModel?: string;
  powerSupplyModel?: string;
  caseModel?: string;
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
  isCustom?: boolean; // to delete custom added users
  login?: string; // username for sign-in (form-only password below)
  password?: string; // form-only; never returned from server after save
  passwordSet?: boolean; // server indicates credentials exist
  isBlocked?: boolean; // NEW: true if user block status is active
  emailVerified?: boolean;
  emailNotificationsEnabled?: boolean;
  telegramChatId?: string;
  telegramNotificationsEnabled?: boolean;
}

export type SoftwareCategory = 'Системное ПО' | 'Операционные системы (ОС)' | 'Утилиты и антивирусы' | 'Офисные приложения' | 'Графические редакторы' | 'Корпоративные системы' | 'Иное ПО';

export interface SoftwareItem {
  id: string;
  name: string;
  category: SoftwareCategory;
  licenseKey: string;
  version: string;
  developer: string;
  quantity: number;
  assignedEmployeeName: string;
  assignedDeviceId?: string; // ID устройства к которому привязано ПО
  objectName: string;
  status: 'Активна' | 'Истекла' | 'Не активирована';
  purchaseDate?: string;
  expirationDate?: string;
  notes?: string;
}

export interface CustomWarehouse {
  id: string;
  name: string;
  objectName: string; // Linked branch/object
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
}
