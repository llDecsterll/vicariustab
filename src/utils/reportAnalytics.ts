import type { ComputerItem, EmployeeItem, NetworkDevice, WarehouseItem, WarehouseWriteOff } from '../types';

export type ReportLifecycleStatus =
  | 'На складе'
  | 'Выдано'
  | 'В ремонте'
  | 'К списанию'
  | 'Списано';

export const REPORT_LIFECYCLE_ORDER: ReportLifecycleStatus[] = [
  'На складе',
  'Выдано',
  'В ремонте',
  'К списанию',
  'Списано',
];

export type AgeBucketKey = 'до 1 года' | '1–3 года' | '3–5 лет' | 'более 5 лет';

export const AGE_BUCKET_ORDER: AgeBucketKey[] = [
  'до 1 года',
  '1–3 года',
  '3–5 лет',
  'более 5 лет',
];

export interface WarrantyLookup {
  purchaseDate: string;
}

export interface ReportEquipmentUnit {
  id: string;
  label: string;
  inventoryNumber: string;
  status: string;
  department: string;
  objectName: string;
  purchaseDate: string | null;
  ageYears: number | null;
  quantity: number;
}

export interface RepairHistoryRow {
  id: string;
  date: string;
  equipmentLabel: string;
  inventoryNumber: string;
  category: string;
  status: string;
  objectName: string;
  employeeName: string;
  department: string;
  component: string;
  oldDetails: string;
  newDetails: string;
  details: string;
  reason: string;
}

function parseDate(value: string | undefined | null): Date | null {
  if (!value?.trim()) return null;
  const d = new Date(value.trim());
  return Number.isNaN(d.getTime()) ? null : d;
}

function yearsBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  if (ms < 0) return 0;
  return ms / (365.25 * 24 * 60 * 60 * 1000);
}

export function resolvePurchaseDate(
  inventoryNumber: string,
  warranties: Record<string, WarrantyLookup>,
  fallback = '2025-08-15'
): string {
  const custom = warranties[inventoryNumber]?.purchaseDate;
  if (custom?.trim()) return custom.trim();
  return fallback;
}

export function getAgeYears(purchaseDate: string | null, asOf = new Date()): number | null {
  const d = parseDate(purchaseDate);
  if (!d) return null;
  return yearsBetween(d, asOf);
}

export function mapToReportLifecycleStatus(
  status: string,
  opts?: { hasModernizationMarker?: boolean; reserved?: boolean }
): ReportLifecycleStatus {
  const s = (status || '').trim();
  if (s === 'Списано') return 'Списано';
  if (opts?.reserved || s === 'Заказано') return 'На складе';
  if (s === 'На списание' || s === 'Под списание') return 'К списанию';
  if (s === 'На складе' || s === 'В наличии') return 'На складе';
  if (s === 'На ремонте' || s === 'В ремонте' || s === 'На проверке' || opts?.hasModernizationMarker) {
    return 'В ремонте';
  }
  if (s === 'В работе' || s === 'Выдано' || s === 'Активно' || s === 'Активна') return 'Выдано';
  return 'Выдано';
}

function hasModernizationMarker(computer: ComputerItem): boolean {
  return Boolean(
    computer.replacedComponents?.some((c) => {
      const blob = `${c.name} ${c.reason || ''} ${c.newDetails}`.toLowerCase();
      return blob.includes('модерн') || blob.includes('upgrade') || blob.includes('апгрейд');
    })
  );
}

function isReservedEmployee(employeeName: string | undefined): boolean {
  const n = (employeeName || '').toLowerCase();
  return n.includes('резерв') || n.includes('reserve');
}

function departmentForComputer(
  computer: ComputerItem,
  employees: EmployeeItem[]
): string {
  const emp = employees.find((e) => e.name === computer.employeeName);
  if (emp?.department?.trim()) return emp.department.trim();
  if (computer.objectName?.trim()) return computer.objectName.trim();
  return 'Не указано';
}

export function buildReportEquipmentUnits(params: {
  computers: ComputerItem[];
  networkDevices: NetworkDevice[];
  warehouseItems: WarehouseItem[];
  warehouseWriteOffs?: WarehouseWriteOff[];
  employees: EmployeeItem[];
  warranties: Record<string, WarrantyLookup>;
  asOf?: Date;
}): ReportEquipmentUnit[] {
  const { computers, networkDevices, warehouseItems, warehouseWriteOffs = [], employees, warranties } = params;
  const asOf = params.asOf || new Date();
  const units: ReportEquipmentUnit[] = [];

  for (const c of computers) {
    const purchaseDate = resolvePurchaseDate(c.inventoryNumber, warranties);
    units.push({
      id: `c-${c.id}`,
      label: `${c.deviceType || c.category} ${c.model}`.trim(),
      inventoryNumber: c.inventoryNumber,
      status: c.status,
      department: departmentForComputer(c, employees),
      objectName: c.objectName,
      purchaseDate,
      ageYears: getAgeYears(purchaseDate, asOf),
      quantity: 1,
    });
  }

  for (const n of networkDevices) {
    const inv = n.inventoryNumber || `NET-${n.id.slice(0, 4).toUpperCase()}`;
    const purchaseDate = resolvePurchaseDate(inv, warranties);
    const qty = n.quantity || 1;
    for (let i = 0; i < qty; i++) {
      units.push({
        id: `n-${n.id}-${i}`,
        label: n.deviceName,
        inventoryNumber: inv,
        status: n.status || 'В работе',
        department: n.objectName || 'Не указано',
        objectName: n.objectName,
        purchaseDate,
        ageYears: getAgeYears(purchaseDate, asOf),
        quantity: 1,
      });
    }
  }

  for (const w of warehouseItems) {
    const writtenOff = w.status === 'Списано';
    if (w.quantity <= 0 && !writtenOff) continue;
    const purchaseDate = resolvePurchaseDate(w.inventoryNumber, warranties);
    units.push({
      id: `w-${w.id}`,
      label: `${w.name} ${w.model}`.trim(),
      inventoryNumber: w.inventoryNumber,
      status: w.status,
      department: w.warehouseName || 'Склад ИТ',
      objectName: w.warehouseName || 'Склад ИТ',
      purchaseDate,
      ageYears: getAgeYears(purchaseDate, asOf),
      quantity: w.quantity > 0 ? w.quantity : 1,
    });
  }

  for (const wo of warehouseWriteOffs) {
    const qty = wo.quantity > 0 ? wo.quantity : 1;
    const purchaseDate = resolvePurchaseDate(wo.inventoryNumber, warranties);
    units.push({
      id: `wo-${wo.id}`,
      label: `${wo.type || wo.name} ${wo.model}`.trim() || wo.name,
      inventoryNumber: wo.inventoryNumber,
      status: 'Списано',
      department: wo.department?.trim() || wo.warehouseName || 'Не указано',
      objectName: wo.objectName?.trim() || wo.warehouseName || '',
      purchaseDate,
      ageYears: getAgeYears(purchaseDate, asOf),
      quantity: qty,
    });
  }

  return units;
}

export function countByLifecycleStatus(
  units: ReportEquipmentUnit[],
  computers: ComputerItem[]
): Record<ReportLifecycleStatus, number> {
  const computerById = new Map(computers.map((c) => [`c-${c.id}`, c]));
  const counts = Object.fromEntries(
    REPORT_LIFECYCLE_ORDER.map((k) => [k, 0])
  ) as Record<ReportLifecycleStatus, number>;

  for (const unit of units) {
    const computer = computerById.get(unit.id);
    const lifecycle = mapToReportLifecycleStatus(unit.status, {
      hasModernizationMarker: computer ? hasModernizationMarker(computer) : false,
      reserved:
        unit.status === 'Заказано' ||
        (computer ? isReservedEmployee(computer.employeeName) : false),
    });
    counts[lifecycle] += unit.quantity;
  }

  return counts;
}

export function getAgeBucket(ageYears: number | null): AgeBucketKey | null {
  if (ageYears === null) return null;
  if (ageYears < 1) return 'до 1 года';
  if (ageYears < 3) return '1–3 года';
  if (ageYears < 5) return '3–5 лет';
  return 'более 5 лет';
}

export function countByAgeBucket(units: ReportEquipmentUnit[]): Record<AgeBucketKey, number> {
  const counts = Object.fromEntries(AGE_BUCKET_ORDER.map((k) => [k, 0])) as Record<AgeBucketKey, number>;
  for (const unit of units) {
    const bucket = getAgeBucket(unit.ageYears);
    if (!bucket) continue;
    counts[bucket] += unit.quantity;
  }
  return counts;
}

export function getAverageAgeYears(units: ReportEquipmentUnit[]): number | null {
  let sum = 0;
  let count = 0;
  for (const unit of units) {
    if (unit.ageYears === null) continue;
    sum += unit.ageYears * unit.quantity;
    count += unit.quantity;
  }
  if (count === 0) return null;
  return sum / count;
}

export function countOlderThan(units: ReportEquipmentUnit[], years: number): number {
  return units.reduce((sum, u) => {
    if (u.ageYears === null) return sum;
    return u.ageYears >= years ? sum + u.quantity : sum;
  }, 0);
}

export function countByDepartment(units: ReportEquipmentUnit[]): { department: string; count: number }[] {
  const map = new Map<string, number>();
  for (const unit of units) {
    const key = unit.department || 'Не указано';
    map.set(key, (map.get(key) || 0) + unit.quantity);
  }
  return [...map.entries()]
    .map(([department, count]) => ({ department, count }))
    .sort((a, b) => b.count - a.count);
}

export function buildRepairHistory(
  computers: ComputerItem[],
  networkDevices: NetworkDevice[],
  employees: EmployeeItem[]
): RepairHistoryRow[] {
  const rows: RepairHistoryRow[] = [];

  const appendRows = (params: {
    entityId: string;
    prefix: 'c' | 'n';
    inventoryNumber: string;
    label: string;
    category: string;
    status: string;
    objectName: string;
    employeeName?: string;
    department: string;
    replacements?: ComputerItem['replacedComponents'];
  }) => {
    for (const comp of params.replacements || []) {
      rows.push({
        id: `${params.prefix}-${params.entityId}-${comp.id}`,
        date: comp.date,
        equipmentLabel: params.label,
        inventoryNumber: params.inventoryNumber,
        category: params.category,
        status: params.status,
        objectName: params.objectName,
        employeeName: params.employeeName?.trim() || '—',
        department: params.department,
        component: comp.name,
        oldDetails: comp.oldDetails?.trim() || '—',
        newDetails: comp.newDetails,
        details: `${comp.oldDetails || '—'} → ${comp.newDetails}`,
        reason: comp.reason?.trim() || '—',
      });
    }
  };

  for (const c of computers) {
    appendRows({
      entityId: c.id,
      prefix: 'c',
      inventoryNumber: c.inventoryNumber,
      label: `${c.deviceType || c.category} ${c.model}`.trim(),
      category: c.category,
      status: c.status,
      objectName: c.objectName,
      employeeName: c.employeeName,
      department: departmentForComputer(c, employees),
      replacements: c.replacedComponents,
    });
  }

  for (const n of networkDevices) {
    appendRows({
      entityId: n.id,
      prefix: 'n',
      inventoryNumber: n.inventoryNumber || `NET-${n.id.slice(0, 6).toUpperCase()}`,
      label: n.deviceName,
      category: 'Сетевое оборудование',
      status: n.status || 'В работе',
      objectName: n.objectName,
      department: n.objectName || 'Не указано',
      replacements: n.replacedComponents,
    });
  }

  return rows.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

export function loadWarrantyPurchaseDates(): Record<string, WarrantyLookup> {
  try {
    const saved = localStorage.getItem('it_custom_warranties');
    if (!saved) return {};
    const parsed = JSON.parse(saved) as Record<string, WarrantyLookup>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function formatAgeYears(value: number | null, fractionDigits = 1): string {
  if (value === null) return '—';
  return `${value.toFixed(fractionDigits)}`;
}

export interface EquipmentCategoryCostRow {
  category: string;
  costRub: number;
  count: number;
}

/** Sum cost and quantity by equipment category across computers, network and warehouse stock. */
export function buildEquipmentCostByCategory(params: {
  computers: ComputerItem[];
  networkDevices: NetworkDevice[];
  warehouseItems: WarehouseItem[];
}): EquipmentCategoryCostRow[] {
  const { computers, networkDevices, warehouseItems } = params;
  const map = new Map<string, { costRub: number; count: number }>();

  const add = (category: string, costRub: number, count: number) => {
    const key = category.trim() || 'Другое';
    const prev = map.get(key) || { costRub: 0, count: 0 };
    map.set(key, {
      costRub: prev.costRub + costRub,
      count: prev.count + count,
    });
  };

  for (const c of computers) {
    add(c.category || 'Другое', c.cost || 0, 1);
  }

  for (const n of networkDevices) {
    const qty = n.quantity || 1;
    add('Сетевое оборудование', (n.cost || 0) * qty, qty);
  }

  for (const w of warehouseItems) {
    const qty = Math.max(0, w.quantity || 0);
    if (qty === 0) continue;
    add(w.type || 'Другое', qty * (w.costPerUnit || 0), qty);
  }

  return [...map.entries()]
    .map(([category, { costRub, count }]) => ({ category, costRub, count }))
    .sort((a, b) => b.costRub - a.costRub || b.count - a.count);
}
