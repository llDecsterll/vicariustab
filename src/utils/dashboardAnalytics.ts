import type {
  Activity,
  ComputerItem,
  CustomWarehouse,
  EmployeeItem,
  InventoryAudit,
  NetworkDevice,
  NetworkDeviceType,
  ObjectItem,
  SoftwareItem,
  WarehouseItem,
} from '../types';
import { parseMemJson, WORKSPACE_MEM_KEYS } from './memoryStorage';
import {
  buildAuditChecklist,
  computeAuditProgressFromRows,
  getActiveInProgressAudit,
  isAllObjectsScope,
} from './auditInventory';
import {
  filterComputersByEquipmentTab,
  getNetworkDeviceDisplayStatus,
  isStockRegistryDuplicateOfWarehouseBatch,
  resolveNetworkDeviceType,
  resolveWarehouseComputerRoute,
} from './warehouseRouting';
import {
  countAssignedLicenseSeats,
  ensureLicenseSeats,
} from './softwareLicenseUtils';

export interface EquipmentStatusSlice {
  name: string;
  value: number;
  color: string;
}

function resolveNetworkAssetBucket(
  device: NetworkDevice,
  warehouseItems: WarehouseItem[],
  warehouses: CustomWarehouse[]
): 'working' | 'warehouse' | 'writtenOff' {
  if (device.status === 'Списано' || device.status === 'На списание') return 'writtenOff';
  const displayStatus =
    warehouses.length > 0
      ? getNetworkDeviceDisplayStatus(device, warehouseItems, warehouses)
      : device.status === 'На складе'
        ? 'На складе'
        : 'В работе';
  return displayStatus === 'На складе' ? 'warehouse' : 'working';
}

export function countActiveWarehouseStock(warehouseItems: WarehouseItem[]): number {
  return warehouseItems
    .filter(isActiveWarehouseLine)
    .reduce((sum, item) => sum + item.quantity, 0);
}

function countWrittenOffWarehouseStock(warehouseItems: WarehouseItem[]): number {
  return warehouseItems
    .filter((item) => item.status === 'Списано' || item.status === 'На списание')
    .reduce((sum, item) => sum + Math.max(item.quantity, 0), 0);
}

export function buildEquipmentStatusSlices(
  computers: ComputerItem[],
  networkDevices: NetworkDevice[],
  warehouseItems: WarehouseItem[] = [],
  warehouses: CustomWarehouse[] = []
): EquipmentStatusSlice[] {
  let working = 0;
  let warehouse = 0;
  let writtenOff = 0;

  for (const c of computers) {
    if (c.status === 'Списано' || c.status === 'На списание') writtenOff += 1;
    else if (c.status === 'На складе') warehouse += 1;
    else working += 1;
  }

  for (const n of networkDevices) {
    const qty = n.quantity || 1;
    const bucket = resolveNetworkAssetBucket(n, warehouseItems, warehouses);
    if (bucket === 'writtenOff') writtenOff += qty;
    else if (bucket === 'warehouse') warehouse += qty;
    else working += qty;
  }

  warehouse += countActiveWarehouseStock(warehouseItems);
  writtenOff += countWrittenOffWarehouseStock(warehouseItems);

  return [
    { name: 'Работает', value: working, color: '#22c55e' },
    { name: 'На складе', value: warehouse, color: '#3b82f6' },
    { name: 'Списано', value: writtenOff, color: '#94a3b8' },
  ];
}

export type DynamicsPeriod = 'month' | 'quarter' | 'year';

export function dynamicsPeriodLabel(period: DynamicsPeriod): string {
  switch (period) {
    case 'month':
      return 'Месяц';
    case 'quarter':
      return 'Квартал';
    case 'year':
      return 'Год';
    default:
      return 'Квартал';
  }
}

export function buildEquipmentDynamicsSeries(
  activities: Activity[],
  period: DynamicsPeriod = 'quarter',
  locale = 'ru-RU'
) {
  const now = new Date();
  const buckets: { key: string; label: string; start: Date; end: Date }[] = [];

  if (period === 'month') {
    for (let i = 3; i >= 0; i--) {
      const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 7, 23, 59, 59, 999);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);
      const key = `w-${weekStart.getTime()}`;
      const label = weekStart.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
      buckets.push({ key, label, start: weekStart, end: weekEnd });
    }
  } else if (period === 'quarter') {
    for (let i = 2; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString(locale, { month: 'short' });
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      buckets.push({ key, label, start, end });
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString(locale, { month: 'short' });
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      buckets.push({ key, label, start, end });
    }
  }

  const counts = Object.fromEntries(buckets.map((b) => [b.key, 0]));

  for (const act of activities) {
    if (act.type !== 'create') continue;
    const ts = new Date(act.timestamp);
    if (Number.isNaN(ts.getTime())) continue;
    for (const bucket of buckets) {
      if (ts >= bucket.start && ts <= bucket.end) {
        counts[bucket.key] += 1;
        break;
      }
    }
  }

  return buckets.map((b) => ({
    month: b.label,
    count: counts[b.key],
  }));
}

export function buildNetworkTypeSummary(networkDevices: NetworkDevice[]) {
  const map = new Map<string, number>();
  for (const n of networkDevices) {
    const type = n.type || 'Другое';
    map.set(type, (map.get(type) || 0) + (n.quantity || 1));
  }
  const max = Math.max(1, ...map.values());
  return [...map.entries()]
    .map(([type, count]) => ({ type, count, percent: Math.round((count / max) * 100) }))
    .sort((a, b) => b.count - a.count);
}

export function buildEquipmentByObject(
  objects: ObjectItem[],
  computers: ComputerItem[],
  networkDevices: NetworkDevice[]
) {
  return objects
    .map((obj) => {
      const count =
        computers.filter((c) => c.objectName === obj.name).length +
        networkDevices
          .filter((n) => n.objectName === obj.name)
          .reduce((s, n) => s + (n.quantity || 1), 0);
      return { name: obj.name, count };
    })
    .filter((o) => o.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

export function countPrinters(computers: ComputerItem[]) {
  return filterComputersByEquipmentTab(computers, 'orgtech').length;
}

export function countCameras(computers: ComputerItem[]) {
  return filterComputersByEquipmentTab(computers, 'surveillance').length;
}

export function countConsumables(computers: ComputerItem[]) {
  return filterComputersByEquipmentTab(computers, 'consumables').length;
}

export function countOtherEquipment(computers: ComputerItem[]) {
  return filterComputersByEquipmentTab(computers, 'other_equip').length;
}

function isActiveWarehouseLine(item: WarehouseItem): boolean {
  return item.status !== 'Списано' && item.status !== 'На списание' && item.quantity > 0;
}

function isComputerWrittenOff(c: ComputerItem): boolean {
  return c.status === 'Списано' || c.status === 'На списание';
}

export function classifyWarehouseComputerKind(item: WarehouseItem): 'laptop' | 'desktop' | null {
  if (item.type !== 'Компьютеры') return null;
  const route = resolveWarehouseComputerRoute(item);
  if (!route) return null;
  if (route.category === 'Ноутбук') return 'laptop';
  if (route.category === 'ПК') return 'desktop';
  return null;
}

export function classifyWarehouseNetworkKind(item: WarehouseItem): NetworkDeviceType | null {
  if (item.type !== 'Сетевое оборудование') return null;
  const dt = (item.deviceType || '').trim();
  if (dt === 'Коммутатор' || dt === 'Маршрутизатор' || dt === 'Точка доступа' || dt === 'Другое') {
    return dt;
  }
  return resolveNetworkDeviceType({ deviceType: item.deviceType, name: `${item.name} ${item.model}` });
}

export function countWarehouseStripComputers(
  computers: ComputerItem[],
  warehouseItems: WarehouseItem[],
  kind: 'laptop' | 'desktop'
): { count: number; cost: number } {
  let count = 0;
  let cost = 0;

  for (const item of warehouseItems) {
    if (!isActiveWarehouseLine(item)) continue;
    if (classifyWarehouseComputerKind(item) !== kind) continue;
    count += item.quantity;
    cost += item.quantity * item.costPerUnit;
  }

  for (const computer of computers) {
    if (isComputerWrittenOff(computer)) continue;
    if (computer.status !== 'На складе') continue;
    const matches =
      kind === 'laptop'
        ? computer.category === 'Ноутбук'
        : computer.category === 'ПК' || computer.deviceType === 'ПК';
    if (!matches) continue;
    count += 1;
    cost += computer.cost || 0;
  }

  return { count, cost };
}

export function countWarehouseStripNetwork(
  devices: NetworkDevice[],
  warehouseItems: WarehouseItem[],
  warehouses: CustomWarehouse[],
  networkType: NetworkDeviceType
): { count: number; cost: number } {
  let count = 0;
  let cost = 0;

  for (const item of warehouseItems) {
    if (!isActiveWarehouseLine(item)) continue;
    if (classifyWarehouseNetworkKind(item) !== networkType) continue;
    count += item.quantity;
    cost += item.quantity * item.costPerUnit;
  }

  for (const device of devices) {
    if (device.status === 'Списано' || device.status === 'На списание') continue;
    if (device.type !== networkType) continue;
    if (isStockRegistryDuplicateOfWarehouseBatch(device, warehouseItems)) continue;
    const displayStatus =
      warehouses.length > 0
        ? getNetworkDeviceDisplayStatus(device, warehouseItems, warehouses)
        : device.status === 'На складе'
          ? 'На складе'
          : 'В работе';
    if (displayStatus !== 'На складе') continue;
    const qty = device.quantity || 1;
    count += qty;
    cost += qty * (device.cost || 0);
  }

  return { count, cost };
}

export function countEmployeeDashboardStats(employees: EmployeeItem[]) {
  let working = 0;
  let vacation = 0;
  for (const e of employees) {
    if (e.status === 'Уволен') continue;
    if (e.status === 'В отпуске') vacation += 1;
    else working += 1;
  }
  return { total: working + vacation, working, vacation };
}

export interface EquipmentTotals {
  total: number;
  issued: number;
  warehouse: number;
  writtenOff: number;
}

export function buildEquipmentTotals(
  computers: ComputerItem[],
  networkDevices: NetworkDevice[],
  warehouseItems: WarehouseItem[] = [],
  warehouses: CustomWarehouse[] = []
): EquipmentTotals {
  let issued = 0;
  let warehouse = 0;
  let writtenOff = 0;

  for (const c of computers) {
    if (c.status === 'Списано' || c.status === 'На списание') writtenOff += 1;
    else if (c.status === 'На складе') warehouse += 1;
    else issued += 1;
  }

  for (const n of networkDevices) {
    const qty = n.quantity || 1;
    const bucket = resolveNetworkAssetBucket(n, warehouseItems, warehouses);
    if (bucket === 'writtenOff') writtenOff += qty;
    else if (bucket === 'warehouse') warehouse += qty;
    else issued += qty;
  }

  warehouse += countActiveWarehouseStock(warehouseItems);
  writtenOff += countWrittenOffWarehouseStock(warehouseItems);

  return { total: issued + warehouse + writtenOff, issued, warehouse, writtenOff };
}

export function dynamicsPeriodDelta(series: { count: number }[]): number {
  return series.reduce((sum, row) => sum + row.count, 0);
}

export interface InventoryProgress {
  percent: number;
  checked: number;
  total: number;
  remaining: number;
  objectsDone: number;
  objectsTotal: number;
}

export interface DashboardAuditCardData {
  progress: InventoryProgress;
  audit: InventoryAudit | null;
  conductorUser: string;
  controllerUser: string;
  objectLabel: string;
}

export function resolveDefaultDashboardAudit(audits: InventoryAudit[]): InventoryAudit | null {
  const inProgress = getActiveInProgressAudit(audits);
  if (inProgress) return inProgress;
  if (audits.length === 0) return null;
  const sorted = [...audits].sort((a, b) => b.date.localeCompare(a.date));
  const pending = sorted.find((a) => a.status === 'Запланирована' || a.status === 'В процессе');
  return pending ?? sorted[0];
}

export function buildDashboardAuditCard(
  audit: InventoryAudit | null,
  objects: ObjectItem[],
  equipmentTotal: number,
  computers: ComputerItem[] = [],
  networkDevices: NetworkDevice[] = []
): DashboardAuditCardData {
  if (!audit) {
    const total = Math.max(equipmentTotal, 1);
    return {
      audit: null,
      progress: {
        percent: 0,
        checked: 0,
        total,
        remaining: total,
        objectsDone: 0,
        objectsTotal: objects.length,
      },
      conductorUser: '',
      controllerUser: '',
      objectLabel: '',
    };
  }

  const rows = buildAuditChecklist(audit, computers, networkDevices, {
    defaultComputer: 'Компьютер',
    defaultNetwork: 'Сетевое',
  }, objects);
  const rowProgress = computeAuditProgressFromRows(rows);
  const scopedSingleObject =
    Boolean(audit.objectName) && !isAllObjectsScope(audit.objectName);
  const objectsTotal = scopedSingleObject ? 1 : objects.length;
  const objectsDone =
    audit.status === 'Завершена'
      ? objectsTotal
      : audit.status === 'В процессе' && rowProgress.percent >= 100
        ? objectsTotal
        : 0;

  return {
    audit,
    progress: {
      percent: rowProgress.percent,
      checked: rowProgress.checked,
      total: rowProgress.total,
      remaining: rowProgress.remaining,
      objectsDone,
      objectsTotal,
    },
    conductorUser: audit.conductorUser || audit.responsibleUser || '',
    controllerUser: audit.controllerUser || '',
    objectLabel: audit.objectName && !isAllObjectsScope(audit.objectName)
      ? audit.objectName
      : '',
  };
}

export function buildInventoryProgress(
  audits: InventoryAudit[],
  objects: ObjectItem[],
  equipmentTotal: number,
  computers: ComputerItem[] = [],
  networkDevices: NetworkDevice[] = []
): InventoryProgress {
  const activeAudit = getActiveInProgressAudit(audits);
  if (activeAudit) {
    const rows = buildAuditChecklist(activeAudit, computers, networkDevices, {
      defaultComputer: 'Компьютер',
      defaultNetwork: 'Сетевое',
    }, objects);
    const progress = computeAuditProgressFromRows(rows);
    const auditedObjects = new Set(
      audits
        .filter((a) => a.status === 'Завершена' || a.status === 'В процессе')
        .map((a) => a.objectName)
        .filter(Boolean)
    );
    return {
      percent: progress.percent,
      checked: progress.checked,
      total: progress.total,
      remaining: progress.remaining,
      objectsDone: auditedObjects.size,
      objectsTotal: objects.length,
    };
  }

  const checked = audits.reduce((s, a) => s + (a.itemsAudited || 0), 0);
  const total = Math.max(equipmentTotal, checked, 1);
  const remaining = Math.max(0, total - checked);
  const percent = Math.min(100, Math.round((checked / total) * 100));
  const auditedObjects = new Set(
    audits.filter((a) => a.status === 'Завершена' || a.status === 'В процессе').map((a) => a.objectName).filter(Boolean)
  );
  return {
    percent,
    checked,
    total,
    remaining,
    objectsDone: auditedObjects.size,
    objectsTotal: objects.length,
  };
}

export interface DashboardAlert {
  id: string;
  tone: 'danger' | 'warning';
  title: string;
  subtitle: string;
  detail?: string;
  badge?: string;
  tab: string;
}

export interface SoftwareLicenseDashboardRow {
  id: string;
  name: string;
  quantity: number;
  purchaseDate?: string;
  expirationDate?: string;
  costRub: number;
  status: SoftwareItem['status'];
  daysUntilExpiry: number | null;
}

export interface SoftwareLicenseDashboardSummary {
  rows: SoftwareLicenseDashboardRow[];
  totalSeats: number;
  totalCostRub: number;
  expiringSoon: number;
  expired: number;
  recentPurchases: { monthKey: string; monthLabel: string; seats: number; costRub: number }[];
}

function parseDateOnly(iso?: string): Date | null {
  if (!iso?.trim()) return null;
  const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysUntil(date: Date, today: Date): number {
  return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function buildSoftwareLicenseDashboard(
  softwareItems: SoftwareItem[],
  dateLocale = 'ru-RU'
): SoftwareLicenseDashboardSummary {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const active = softwareItems.filter(
    (s) => s.status !== 'Списано' && s.status !== 'На списание'
  );

  const rows: SoftwareLicenseDashboardRow[] = active
    .map((s) => {
      const expiry = parseDateOnly(s.expirationDate);
      const days = expiry ? daysUntil(expiry, today) : null;
      return {
        id: s.id,
        name: s.name,
        quantity: s.quantity || 1,
        purchaseDate: s.purchaseDate,
        expirationDate: s.expirationDate,
        costRub: (s.quantity || 1) * (s.cost || 0),
        status: s.status,
        daysUntilExpiry: days,
      };
    })
    .sort((a, b) => {
      if (a.daysUntilExpiry == null && b.daysUntilExpiry == null) return a.name.localeCompare(b.name, 'ru');
      if (a.daysUntilExpiry == null) return 1;
      if (b.daysUntilExpiry == null) return -1;
      return a.daysUntilExpiry - b.daysUntilExpiry;
    });

  const totalSeats = rows.reduce((sum, r) => sum + r.quantity, 0);
  const totalCostRub = rows.reduce((sum, r) => sum + r.costRub, 0);
  const expiringSoon = rows.filter(
    (r) => r.daysUntilExpiry != null && r.daysUntilExpiry > 0 && r.daysUntilExpiry <= 30
  ).length;
  const expired = rows.filter((r) => r.daysUntilExpiry != null && r.daysUntilExpiry <= 0).length;

  const purchaseMap = new Map<string, { seats: number; costRub: number; sortKey: string }>();
  for (const s of active) {
    const purchase = parseDateOnly(s.purchaseDate);
    if (!purchase) continue;
    const monthKey = `${purchase.getFullYear()}-${String(purchase.getMonth() + 1).padStart(2, '0')}`;
    const prev = purchaseMap.get(monthKey) ?? { seats: 0, costRub: 0, sortKey: monthKey };
    prev.seats += s.quantity || 1;
    prev.costRub += (s.quantity || 1) * (s.cost || 0);
    purchaseMap.set(monthKey, prev);
  }

  const recentPurchases = [...purchaseMap.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 6)
    .map(([monthKey, data]) => {
      const [y, m] = monthKey.split('-').map(Number);
      const labelDate = new Date(y, m - 1, 1);
      return {
        monthKey,
        monthLabel: labelDate.toLocaleDateString(dateLocale, { month: 'long', year: 'numeric' }),
        seats: data.seats,
        costRub: data.costRub,
      };
    });

  return { rows, totalSeats, totalCostRub, expiringSoon, expired, recentPurchases };
}

export interface SoftwareMonitoringRow {
  id: string;
  name: string;
  totalSeats: number;
  assignedSeats: number;
  unassignedSeats: number;
  status: SoftwareItem['status'];
}

export interface SoftwareMonitoringSummary {
  rows: SoftwareMonitoringRow[];
  totalProducts: number;
  totalSeats: number;
  assignedSeats: number;
  unassignedSeats: number;
}

export function buildSoftwareMonitoringSummary(softwareItems: SoftwareItem[]): SoftwareMonitoringSummary {
  const active = softwareItems.filter(
    (item) => item.status !== 'Списано' && item.status !== 'На списание'
  );

  const rows: SoftwareMonitoringRow[] = active
    .map((item) => {
      const seats = ensureLicenseSeats(item);
      const assignedSeats = countAssignedLicenseSeats(seats);
      const totalSeats = seats.length;
      return {
        id: item.id,
        name: item.name,
        totalSeats,
        assignedSeats,
        unassignedSeats: totalSeats - assignedSeats,
        status: item.status,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'));

  return {
    rows,
    totalProducts: rows.length,
    totalSeats: rows.reduce((sum, row) => sum + row.totalSeats, 0),
    assignedSeats: rows.reduce((sum, row) => sum + row.assignedSeats, 0),
    unassignedSeats: rows.reduce((sum, row) => sum + row.unassignedSeats, 0),
  };
}

export function buildDashboardAlerts(params: {
  computers: ComputerItem[];
  audits: InventoryAudit[];
  softwareItems?: SoftwareItem[];
}): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];

  try {
    const warranties = parseMemJson(WORKSPACE_MEM_KEYS.customWarranties, {});
    const today = new Date();
    for (const c of params.computers) {
      const purchase = warranties[c.inventoryNumber]?.purchaseDate;
      if (!purchase) continue;
      const start = new Date(purchase);
      const expiry = new Date(start);
      expiry.setMonth(expiry.getMonth() + 24);
      const days = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (days > 0 && days <= 30) {
        alerts.push({
          id: `w-${c.id}`,
          tone: 'danger',
          title:
            days <= 14
              ? `Гарантия истекает через ${days} дней`
              : `Истекает гарантия: ${c.model}`,
          subtitle: c.model,
          detail: `Инв. №: ${c.inventoryNumber}`,
          badge: expiry.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
          tab: 'warranties',
        });
      }
    }
  } catch {
    /* ignore */
  }

  for (const audit of params.audits) {
    if (audit.status === 'В процессе') {
      const left = Math.max(0, (audit.itemsAudited || 0) > 0 ? audit.mismatchesFound + 7 : 7);
      alerts.push({
        id: `a-${audit.id}`,
        tone: 'warning',
        title: 'Не завершена инвентаризация',
        subtitle: audit.objectName ? `Объект: ${audit.objectName}` : audit.title,
        detail: `Осталось проверить: ${left} позиций`,
        badge: 'В процессе',
        tab: 'inventory',
      });
    } else if (audit.mismatchesFound > 0) {
      alerts.push({
        id: `a-${audit.id}`,
        tone: 'warning',
        title: `Расхождения: ${audit.title}`,
        subtitle: audit.objectName || audit.responsibleUser,
        badge: 'В процессе',
        tab: 'inventory',
      });
    }
  }

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  for (const soft of params.softwareItems ?? []) {
    if (soft.status === 'Списано' || soft.status === 'На списание' || !soft.expirationDate) continue;
    const expiry = parseDateOnly(soft.expirationDate);
    if (!expiry) continue;
    const days = daysUntil(expiry, today);
    if (days > 0 && days <= 30) {
      alerts.push({
        id: `sw-${soft.id}`,
        tone: days <= 14 ? 'danger' : 'warning',
        title:
          days <= 14
            ? `Лицензия истекает через ${days} дн.`
            : `Скоро истекает лицензия: ${soft.name}`,
        subtitle: soft.name,
        detail: `${soft.quantity || 1} мест · куплено ${soft.purchaseDate || '—'}`,
        badge: expiry.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
        tab: 'software',
      });
    } else if (days <= 0) {
      alerts.push({
        id: `sw-exp-${soft.id}`,
        tone: 'danger',
        title: `Истекла лицензия: ${soft.name}`,
        subtitle: `${soft.quantity || 1} мест`,
        detail: soft.purchaseDate ? `Куплено: ${soft.purchaseDate}` : undefined,
        badge: expiry.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
        tab: 'software',
      });
    }
  }

  return alerts.slice(0, 5);
}
