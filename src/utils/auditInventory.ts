import type { ComputerItem, InventoryAudit, NetworkDevice } from '../types';

/** Stored audit.objectName values that mean «entire organization» (all locales). */
export const ALL_OBJECTS_SCOPE_LABELS = [
  'Все объекты',
  'Все подразделения и офисы',
  'All Locations',
  'All locations',
  'All objects',
  'All divisions and offices',
  '所有地点',
  '所有对象',
  '各部门及办公室',
] as const;

export function isAllObjectsScope(objectName?: string): boolean {
  if (!objectName?.trim()) return true;
  return (ALL_OBJECTS_SCOPE_LABELS as readonly string[]).includes(objectName.trim());
}

function normalizeRef(ref: unknown): string {
  if (ref === null || ref === undefined) return '';
  return String(ref).trim();
}

function findByIdRef<T extends { id: string }>(list: T[], ref: string): T | undefined {
  return list.find((item) => normalizeRef(item.id) === ref);
}

function findByLegacyIndex<T extends { name: string }>(list: T[], ref: string): T | undefined {
  if (!/^\d+$/.test(ref)) return undefined;
  const n = parseInt(ref, 10);
  if (n >= 1 && n <= list.length) return list[n - 1];
  return undefined;
}

function findByIdSuffix<T extends { id: string }>(list: T[], ref: string, prefix: string): T | undefined {
  return list.find((item) => {
    const id = normalizeRef(item.id);
    return id === `${prefix}${ref}` || id.endsWith(`-${ref}`);
  });
}

/** Resolve stored object ref (id, legacy index, or name) to display / filter name. */
export function resolveAuditObjectDisplayName(
  ref: string | undefined,
  objects: { id: string; name: string }[]
): string {
  const trimmed = normalizeRef(ref);
  if (!trimmed) return '';
  if (isAllObjectsScope(trimmed)) return trimmed;

  const byId = findByIdRef(objects, trimmed);
  if (byId?.name) return byId.name;

  const byName = objects.find((o) => o.name === trimmed);
  if (byName?.name) return byName.name;

  const bySuffix = findByIdSuffix(objects, trimmed, 'obj-');
  if (bySuffix?.name) return bySuffix.name;

  const byIndex = findByLegacyIndex(objects, trimmed);
  if (byIndex?.name) return byIndex.name;

  return trimmed;
}

/** Resolve stored employee ref (id, legacy index, or name) to display name. */
export function resolveAuditPersonName(
  ref: string | undefined,
  employees: { id: string; name: string }[]
): string {
  const trimmed = normalizeRef(ref);
  if (!trimmed) return '';

  const byId = findByIdRef(employees, trimmed);
  if (byId?.name) return byId.name;

  const byName = employees.find((e) => e.name === trimmed);
  if (byName?.name) return byName.name;

  const bySuffix = findByIdSuffix(employees, trimmed, 'emp-');
  if (bySuffix?.name) return bySuffix.name;

  const byIndex = findByLegacyIndex(employees, trimmed);
  if (byIndex?.name) return byIndex.name;

  return trimmed;
}

export function isNumericLegacyAuditRef(ref?: string): boolean {
  const trimmed = normalizeRef(ref);
  return trimmed.length > 0 && /^\d+$/.test(trimmed);
}

function objectRefsMatch(
  itemRef: string | undefined,
  scopeRef: string | undefined,
  objects: { id: string; name: string }[]
): boolean {
  if (!scopeRef?.trim() || isAllObjectsScope(scopeRef)) return true;
  const scopeName = resolveAuditObjectDisplayName(scopeRef, objects);
  const itemName = resolveAuditObjectDisplayName(itemRef, objects);
  if (!itemName) return false;
  return itemName === scopeName;
}

export function filterAuditScopeEquipment(
  computers: ComputerItem[],
  networkDevices: NetworkDevice[],
  objectName?: string,
  objects: { id: string; name: string }[] = []
): { computers: ComputerItem[]; networkDevices: NetworkDevice[] } {
  if (isAllObjectsScope(objectName)) {
    return { computers, networkDevices };
  }
  return {
    computers: computers.filter((c) => objectRefsMatch(c.objectName, objectName, objects)),
    networkDevices: networkDevices.filter((n) => objectRefsMatch(n.objectName, objectName, objects)),
  };
}

export function countAuditScopeItems(
  computers: ComputerItem[],
  networkDevices: NetworkDevice[],
  objectName?: string,
  objects: { id: string; name: string }[] = []
): number {
  const scope = filterAuditScopeEquipment(computers, networkDevices, objectName, objects);
  const activeComputers = scope.computers.filter(
    (c) => c.status !== 'Списано' && c.status !== 'На списание'
  );
  const activeNetwork = scope.networkDevices.filter(
    (n) => n.status !== 'Списано' && n.status !== 'На списание'
  );
  return activeComputers.length + activeNetwork.reduce((sum, n) => sum + (n.quantity || 1), 0);
}

export function auditItemKey(kind: 'computer' | 'network', id: string): string {
  return `${kind}:${id}`;
}

export type AuditItemCheckStatus = 'present' | 'missing';

export interface AuditChecklistRow {
  key: string;
  kind: 'computer' | 'network';
  id: string;
  label: string;
  inventoryNumber: string;
  category: string;
  status: 'unchecked' | AuditItemCheckStatus;
}

export function buildAuditChecklist(
  audit: InventoryAudit,
  computers: ComputerItem[],
  networkDevices: NetworkDevice[],
  labels: { defaultComputer: string; defaultNetwork: string },
  objects: { id: string; name: string }[] = []
): AuditChecklistRow[] {
  const scope = filterAuditScopeEquipment(computers, networkDevices, audit.objectName, objects);
  const checks = audit.itemChecks ?? {};
  const rows: AuditChecklistRow[] = [];

  for (const computer of scope.computers) {
    if (computer.status === 'Списано' || computer.status === 'На списание') continue;
    const key = auditItemKey('computer', computer.id);
    rows.push({
      key,
      kind: 'computer',
      id: computer.id,
      label: `${computer.deviceType || computer.category} ${computer.model}`.trim(),
      inventoryNumber: computer.inventoryNumber || '—',
      category: computer.category || labels.defaultComputer,
      status: checks[key] ?? 'unchecked',
    });
  }

  for (const device of scope.networkDevices) {
    if (device.status === 'Списано' || device.status === 'На списание') continue;
    const qty = device.quantity || 1;
    const key = auditItemKey('network', device.id);
    rows.push({
      key,
      kind: 'network',
      id: device.id,
      label: qty > 1 ? `${device.deviceName} ×${qty}` : device.deviceName,
      inventoryNumber: device.inventoryNumber || '—',
      category: device.type || labels.defaultNetwork,
      status: checks[key] ?? 'unchecked',
    });
  }

  return rows;
}

export function computeAuditProgressFromRows(rows: AuditChecklistRow[]): {
  total: number;
  checked: number;
  present: number;
  missing: number;
  remaining: number;
  percent: number;
} {
  const total = rows.length;
  if (total === 0) {
    return { total: 0, checked: 0, present: 0, missing: 0, remaining: 0, percent: 0 };
  }

  let present = 0;
  let missing = 0;
  for (const row of rows) {
    if (row.status === 'present') present += 1;
    else if (row.status === 'missing') missing += 1;
  }

  const checked = present + missing;
  const remaining = Math.max(0, total - checked);
  const percent = Math.min(100, Math.round((checked / total) * 100));

  return { total, checked, present, missing, remaining, percent };
}

export function getActiveInProgressAudit(audits: InventoryAudit[]): InventoryAudit | null {
  return audits.find((audit) => audit.status === 'В процессе') ?? null;
}

export function syncAuditProgressFields(
  audit: InventoryAudit,
  itemChecks: InventoryAudit['itemChecks']
): Pick<InventoryAudit, 'itemChecks' | 'itemsAudited' | 'mismatchesFound' | 'totalItems'> {
  const missing = Object.values(itemChecks ?? {}).filter((status) => status === 'missing').length;
  const checked = Object.values(itemChecks ?? {}).length;
  return {
    itemChecks,
    itemsAudited: checked,
    mismatchesFound: missing,
    totalItems: audit.totalItems,
  };
}
