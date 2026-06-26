import type {
  Activity,
  ComputerItem,
  CustomWarehouse,
  EmployeeItem,
  InventoryAudit,
  NetworkDevice,
  NetworkDeviceType,
  ObjectItem,
  WarehouseItem,
} from '../types';
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

export interface EquipmentStatusSlice {
  name: string;
  value: number;
  color: string;
}

export function buildEquipmentStatusSlices(
  computers: ComputerItem[],
  networkDevices: NetworkDevice[]
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
    if (n.status === 'Списано' || n.status === 'На списание') writtenOff += qty;
    else if (n.status === 'На складе') warehouse += qty;
    else working += qty;
  }

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
  networkDevices: NetworkDevice[]
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
    if (n.status === 'Списано' || n.status === 'На списание') writtenOff += qty;
    else if (n.status === 'На складе') warehouse += qty;
    else issued += qty;
  }

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

export function buildDashboardAlerts(params: {
  computers: ComputerItem[];
  audits: InventoryAudit[];
}): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];

  try {
    const warranties = JSON.parse(localStorage.getItem('it_custom_warranties') || '{}');
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

  return alerts.slice(0, 5);
}
