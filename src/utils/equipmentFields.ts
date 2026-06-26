import type {
  ComputerCategory,
  ComputerItem,
  EquipmentCustomSpec,
  NetworkDevice,
  SoftwareItem,
  WarehouseItem,
  WarehouseItemType,
} from '../types';

/** Max length for product title and model on all equipment forms */
export const EQUIPMENT_TITLE_MAX_LENGTH = 32;

export function limitEquipmentTitle(value: string): string {
  return value.slice(0, EQUIPMENT_TITLE_MAX_LENGTH);
}

export interface ComputerReceiptSpecs {
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
  unitSerialNumbers?: string[];
}

function normalizeCustomSpecs(raw: unknown): EquipmentCustomSpec[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((row) => row && typeof row === 'object')
    .map((row) => {
      const r = row as EquipmentCustomSpec;
      return {
        label: typeof r.label === 'string' ? r.label.trim() : '',
        value: typeof r.value === 'string' ? r.value.trim() : '',
        serial: typeof r.serial === 'string' ? r.serial.trim() : '',
      };
    })
    .filter((row) => row.label || row.value || row.serial);
}

export function supportsComputerSpecifications(params: {
  category?: ComputerCategory | string;
  deviceType?: string;
  warehouseType?: WarehouseItemType;
}): boolean {
  if (params.warehouseType === 'Компьютеры') return true;
  const dt = params.deviceType || '';
  const cat = params.category || '';
  return (
    cat === 'ПК' ||
    cat === 'Ноутбук' ||
    dt === 'ПК' ||
    dt === 'Ноутбук' ||
    dt === 'Сервер' ||
    dt === 'Моноблок' ||
    dt === 'Неттоп'
  );
}

export function getWarehouseItemSpecs(item: WarehouseItem | ComputerReceiptSpecs): ComputerReceiptSpecs {
  return {
    serialNumber: item.serialNumber,
    unitSerialNumbers: item.unitSerialNumbers,
    cpuModel: item.cpuModel,
    cpuSerial: item.cpuSerial,
    ramModel: item.ramModel,
    ramSerial: item.ramSerial,
    hddModel: item.hddModel,
    hddSerial: item.hddSerial,
    gpuModel: item.gpuModel,
    gpuSerial: item.gpuSerial,
    motherboardModel: item.motherboardModel,
    motherboardSerial: item.motherboardSerial,
    powerSupplyModel: item.powerSupplyModel,
    powerSupplySerial: item.powerSupplySerial,
    caseModel: item.caseModel,
    caseSerial: item.caseSerial,
    customSpecs: normalizeCustomSpecs(item.customSpecs),
  };
}

/** Warehouse/stock line key without per-unit suffix (-1, -2). */
export function getWarehouseLineInventoryKey(
  inventoryNumber: string | undefined | null
): string {
  const trimmed = (inventoryNumber || '').trim();
  if (!trimmed) return trimmed;
  const lastDash = trimmed.lastIndexOf('-');
  if (lastDash <= 0) return trimmed;
  const suffix = trimmed.slice(lastDash + 1);
  const base = trimmed.slice(0, lastDash);
  if (/^\d+$/.test(suffix) && (base.includes('-') || base.includes('/'))) {
    return base;
  }
  return trimmed;
}

/** @deprecated alias — use getWarehouseLineInventoryKey */
export function getWarehouseBatchInventoryKey(
  inventoryNumber: string | undefined | null
): string {
  return getWarehouseLineInventoryKey(inventoryNumber);
}

const SPLIT_PART_SUFFIX_RE = /\/р(\d+)$/i;

export function isSplitWarehouseInventoryNumber(
  inventoryNumber: string | undefined | null
): boolean {
  const lineKey = getWarehouseLineInventoryKey(inventoryNumber);
  return SPLIT_PART_SUFFIX_RE.test(lineKey);
}

export function getSplitRootInventoryNumber(
  inventoryNumber: string,
  splitFromInventoryNumber?: string | null
): string {
  if (splitFromInventoryNumber?.trim()) return splitFromInventoryNumber.trim();
  const lineKey = getWarehouseLineInventoryKey(inventoryNumber);
  const withoutPart = lineKey.replace(SPLIT_PART_SUFFIX_RE, '');
  return withoutPart || lineKey;
}

export function formatSplitWarehouseInventoryNumber(
  rootInventoryNumber: string,
  partIndex: number
): string {
  return `${rootInventoryNumber.trim()}/р${partIndex}`;
}

export function allocateNextSplitPartIndex(
  rootInventoryNumber: string,
  items: Array<{ inventoryNumber?: string | null; splitFromInventoryNumber?: string | null }>
): number {
  const root = rootInventoryNumber.trim();
  let maxPart = 0;
  for (const item of items) {
    const lineKey = getWarehouseLineInventoryKey(item.inventoryNumber);
    if (item.splitFromInventoryNumber?.trim() === root || lineKey.startsWith(`${root}/`)) {
      const m = lineKey.match(SPLIT_PART_SUFFIX_RE);
      if (m) maxPart = Math.max(maxPart, parseInt(m[1], 10));
    }
  }
  return maxPart + 1;
}

/** Match base inventory number or batch suffix (e.g. INV-001, INV-001-2, ST-0010/р1-2) */
export function matchesBaseInventoryNumber(
  itemInventoryNumber: string | undefined | null,
  baseInventoryNumber: string | undefined | null
): boolean {
  if (!itemInventoryNumber || !baseInventoryNumber) return false;
  const item = itemInventoryNumber.trim();
  const base = baseInventoryNumber.trim();
  if (item === base) return true;
  if (item.startsWith(`${base}-`)) return true;
  const itemLine = getWarehouseLineInventoryKey(item);
  const baseLine = getWarehouseLineInventoryKey(base);
  return itemLine === baseLine || itemLine.startsWith(`${baseLine}-`);
}

/** Fallback for network equipment without an assigned inventory number */
export function normalizeInventoryNumber(inventoryNumber: string | undefined | null): string {
  const trimmed = (inventoryNumber || '').trim();
  return trimmed || 'NET-EQ';
}

/** Synthetic warehouse inv. number for software stored on stock (shared client + server). */
export function getSoftwareWarehouseInv(softwareId: string): string {
  return `SW-${softwareId.slice(-8).toUpperCase()}`;
}

export function findWarehouseItemByInventoryNumber<
  T extends { inventoryNumber?: string | null }
>(items: T[], inventoryNumber: string): T | undefined {
  return items.find((w) => inventoryNumbersMatch(w.inventoryNumber, inventoryNumber));
}

export function inventoryNumbersMatch(
  a: string | undefined | null,
  b: string | undefined | null
): boolean {
  const na = normalizeInventoryNumber(a);
  const nb = normalizeInventoryNumber(b);
  if (na === nb) return true;
  return matchesBaseInventoryNumber(a, b) || matchesBaseInventoryNumber(b, a);
}

/** Warehouse list search: substring or batch-family match (ST-0061 finds ST-0061-2). */
export function matchesInventorySearch(
  itemInventoryNumber: string | undefined | null,
  query: string
): boolean {
  const q = (query || '').trim();
  if (!q) return true;
  const inv = (itemInventoryNumber || '').toLowerCase();
  if (inv.includes(q.toLowerCase())) return true;
  return inventoryNumbersMatch(itemInventoryNumber, q);
}

/** When renaming a warehouse batch base inv, remap unit cards (ST-0001-2 → ST-0002-2). */
export function remapBatchInventoryNumber(
  oldBase: string,
  newBase: string,
  currentInventoryNumber: string
): string {
  const oldB = oldBase.trim();
  const newB = newBase.trim();
  const cur = (currentInventoryNumber || '').trim();
  if (!oldB || !newB || oldB === newB) return cur;
  if (cur === oldB) return newB;
  const escaped = escapeRegExp(oldB);
  const batchMatch = cur.match(new RegExp(`^${escaped}-(\\d+)$`));
  if (batchMatch) return `${newB}-${batchMatch[1]}`;
  const splitBatchMatch = cur.match(new RegExp(`^${escaped}/р\\d+-(\\d+)$`, 'i'));
  if (splitBatchMatch) {
    const partMatch = oldB.match(SPLIT_PART_SUFFIX_RE);
    if (partMatch) {
      return cur.replace(new RegExp(`^${escapeRegExp(oldB)}`), newB);
    }
  }
  const splitLineMatch = cur.match(new RegExp(`^${escaped}/р(\\d+)$`, 'i'));
  if (splitLineMatch && newB.match(SPLIT_PART_SUFFIX_RE)) {
    return newB;
  }
  if (splitLineMatch) {
    return formatSplitWarehouseInventoryNumber(newB, parseInt(splitLineMatch[1], 10));
  }
  return cur;
}

/** Allocate unique inv. numbers for a warehouse batch (base, base-1, base-2, …). */
export function allocateBatchInventoryNumbers(
  baseInventoryNumber: string,
  existingInventoryNumbers: (string | undefined | null)[],
  count: number
): string[] {
  const base = baseInventoryNumber.trim();
  if (!base || count <= 0) return [];

  const taken = new Set(
    existingInventoryNumbers
      .filter((inv): inv is string => Boolean(inv?.trim()))
      .filter((inv) => matchesBaseInventoryNumber(inv, base))
      .map((inv) => inv.trim())
  );

  if (count === 1 && !taken.has(base)) {
    return [base];
  }

  const result: string[] = [];
  let n = 1;
  const maxAttempts = Math.max(count * 2, taken.size + count + 512);
  while (result.length < count && n <= maxAttempts) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) {
      result.push(candidate);
      taken.add(candidate);
    }
    n++;
  }
  return result;
}

export type InventoryRegistryContext = {
  warehouseItems: { id?: string; inventoryNumber?: string | null }[];
  computers: { id?: string; inventoryNumber?: string | null }[];
  networkDevices: { id?: string; inventoryNumber?: string | null }[];
  softwareItems?: { id?: string; licenseKey?: string | null }[];
  softwareWarehouseInv?: (softwareId: string) => string;
};

export function getInventoryPrefixForCategory(category: string): string {
  switch (category) {
    case 'Ноутбук':
      return 'NB';
    case 'ПК':
      return 'PC';
    case 'Монитор':
      return 'MON';
    case 'Периферия':
      return 'PER';
    case 'Оргтехника':
      return 'PRN';
    case 'Видеонаблюдение':
      return 'CAM';
    case 'Расходники':
      return 'CON';
    default:
      return 'EQ';
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseInventorySequenceNumber(
  inventoryNumber: string | undefined | null,
  prefix: string
): number | null {
  const inv = (inventoryNumber || '').trim();
  if (!inv) return null;
  const re = new RegExp(`^${escapeRegExp(prefix)}-(\\d+)`, 'i');
  const match = inv.match(re);
  if (!match) return null;
  const parsed = parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function collectRegistryInventoryNumbers(ctx: InventoryRegistryContext): string[] {
  const nums: string[] = [];
  for (const item of ctx.warehouseItems) {
    if (item.inventoryNumber?.trim()) nums.push(item.inventoryNumber.trim());
  }
  for (const item of ctx.computers) {
    if (item.inventoryNumber?.trim()) nums.push(item.inventoryNumber.trim());
  }
  for (const item of ctx.networkDevices) {
    if (item.inventoryNumber?.trim()) nums.push(item.inventoryNumber.trim());
  }
  for (const soft of ctx.softwareItems || []) {
    if (soft.licenseKey?.trim()) nums.push(soft.licenseKey.trim());
    if (soft.id) {
      const swInv = (ctx.softwareWarehouseInv || getSoftwareWarehouseInv)(soft.id);
      if (swInv?.trim()) nums.push(swInv.trim());
    }
  }
  return nums;
}

/** Next sequential inv. number for a prefix (PC-0008, ST-0062, NET-0003), unique across all registries. */
export function generateNextInventoryNumber(
  prefix: string,
  ctx: InventoryRegistryContext,
  padLength = 4
): string {
  const normalizedPrefix = prefix.trim().toUpperCase();
  if (!normalizedPrefix) return '';

  const takenNumbers = collectRegistryInventoryNumbers(ctx);
  let maxSequence = 0;
  for (const inv of takenNumbers) {
    const seq = parseInventorySequenceNumber(inv, normalizedPrefix);
    if (seq !== null && seq > maxSequence) maxSequence = seq;
  }

  const validationCtx = {
    warehouseItems: ctx.warehouseItems,
    computers: ctx.computers,
    networkDevices: ctx.networkDevices,
    softwareItems: ctx.softwareItems || [],
    softwareWarehouseInv: ctx.softwareWarehouseInv || getSoftwareWarehouseInv,
  };

  let candidateSequence = maxSequence + 1;
  let candidate = `${normalizedPrefix}-${String(candidateSequence).padStart(padLength, '0')}`;
  const safetyLimit = maxSequence + takenNumbers.length + 1024;

  while (
    candidateSequence <= safetyLimit &&
    exactInventoryNumberTaken(candidate, validationCtx)
  ) {
    candidateSequence += 1;
    candidate = `${normalizedPrefix}-${String(candidateSequence).padStart(padLength, '0')}`;
  }

  return candidate;
}

/** True if base inv. or any batch suffix (base-1, base-2, …) is already used anywhere. */
export function inventoryBaseFamilyTaken(
  baseInv: string,
  ctx: {
    warehouseItems: { id?: string; inventoryNumber?: string }[];
    computers: { id?: string; inventoryNumber?: string }[];
    networkDevices: { id?: string; inventoryNumber?: string }[];
    softwareItems: { id?: string; licenseKey?: string }[];
    softwareWarehouseInv: (softwareId: string) => string;
  },
  excludeId?: string
): boolean {
  const base = (baseInv || '').trim();
  if (!base) return false;
  const familyMatch = (val?: string | null) => inventoryNumbersMatch(val, base);

  if (ctx.warehouseItems.some((w) => w.id !== excludeId && familyMatch(w.inventoryNumber))) return true;
  if (ctx.computers.some((c) => c.id !== excludeId && familyMatch(c.inventoryNumber))) return true;
  if (ctx.networkDevices.some((n) => n.id !== excludeId && familyMatch(n.inventoryNumber))) return true;
  if (
    ctx.softwareItems.some(
      (s) =>
        s.id !== excludeId &&
        (familyMatch(s.licenseKey) || familyMatch(ctx.softwareWarehouseInv(s.id)))
    )
  ) {
    return true;
  }
  return false;
}

/** Exact inv. number collision across warehouse, equipment groups, and software keys. */
export function exactInventoryNumberTaken(
  invNum: string,
  ctx: {
    warehouseItems: { id?: string; inventoryNumber?: string }[];
    computers: { id?: string; inventoryNumber?: string }[];
    networkDevices: { id?: string; inventoryNumber?: string }[];
    softwareItems: { id?: string; licenseKey?: string }[];
    softwareWarehouseInv: (softwareId: string) => string;
  },
  excludeId?: string
): boolean {
  const inv = (invNum || '').trim().toLowerCase();
  if (!inv) return false;
  const match = (val?: string) => (val || '').trim().toLowerCase() === inv;

  if (ctx.warehouseItems.some((w) => w.id !== excludeId && match(w.inventoryNumber))) return true;
  if (ctx.computers.some((c) => c.id !== excludeId && match(c.inventoryNumber))) return true;
  if (ctx.networkDevices.some((n) => n.id !== excludeId && match(n.inventoryNumber))) return true;
  if (
    ctx.softwareItems.some(
      (s) =>
        s.id !== excludeId &&
        (match(s.licenseKey) || match(ctx.softwareWarehouseInv(s.id)))
    )
  ) {
    return true;
  }
  return false;
}

export function isNotLinkedToInventoryBase(
  itemInventoryNumber: string | undefined | null,
  baseInventoryNumber: string | undefined | null
): boolean {
  if (!baseInventoryNumber) return true;
  return !inventoryNumbersMatch(itemInventoryNumber, baseInventoryNumber);
}

/** Normalize per-unit serial list to match batch quantity. */
export function normalizeUnitSerialNumbers(
  quantity: number,
  unitSerialNumbers?: string[] | null
): string[] {
  const qty = Math.max(1, Math.floor(quantity));
  const list = Array.isArray(unitSerialNumbers) ? [...unitSerialNumbers] : [];
  while (list.length < qty) list.push('');
  return list.slice(0, qty).map((s) => (typeof s === 'string' ? s : ''));
}

/** Device-level serial numbers for lists (not component S/N). */
export function getDeviceSerialDisplayLines(
  item: {
    serialNumber?: string;
    unitSerialNumbers?: string[];
    quantity?: number;
  } | null | undefined
): string[] {
  if (!item) return [];
  const qty = Math.max(1, item.quantity ?? 1);
  const units = normalizeUnitSerialNumbers(qty, item.unitSerialNumbers)
    .map((s) => s.trim())
    .filter(Boolean);
  if (units.length > 0) return units;
  const sn = (item.serialNumber || '').trim();
  return sn ? [sn] : [];
}

function stockUnitSuffixRank(inv: string, baseInv: string): number {
  const cur = (inv || '').trim();
  if (cur === baseInv) return 0;
  const m = cur.match(/-(\d+)$/);
  return m ? parseInt(m[1], 10) : 999;
}

/** Warehouse row S/N: stored unit list, fallback to stock registry cards. */
export function resolveWarehouseItemSerialLines(
  item: WarehouseItem,
  stockComputers: ComputerItem[] = []
): string[] {
  const fromItem = getDeviceSerialDisplayLines(item);
  if (fromItem.length > 0) return fromItem;

  if (item.quantity > 1 && stockComputers.length > 0) {
    const baseInv = item.inventoryNumber;
    const fromRegistry = stockComputers
      .filter(
        (c) =>
          matchesBaseInventoryNumber(c.inventoryNumber, baseInv) &&
          c.status === 'На складе'
      )
      .sort(
        (a, b) =>
          stockUnitSuffixRank(a.inventoryNumber || '', baseInv) -
          stockUnitSuffixRank(b.inventoryNumber || '', baseInv)
      )
      .map((c) => (c.serialNumber || '').trim())
      .filter(Boolean);
    if (fromRegistry.length > 0) return fromRegistry;
  }
  return [];
}

export function mergeUnitSerialNumbers(
  existingQty: number,
  existing: string[] | undefined,
  addedQty: number,
  incoming: string[] | undefined
): string[] {
  return [
    ...normalizeUnitSerialNumbers(existingQty, existing),
    ...normalizeUnitSerialNumbers(addedQty, incoming),
  ];
}

/** Apply receipt specs to a single registry unit (supports batch qty > 1) */
export function buildComputerSpecsFromReceipt(
  specs: ComputerReceiptSpecs,
  unitIndex: number,
  totalQty: number
): Required<ComputerReceiptSpecs> {
  const units = normalizeUnitSerialNumbers(totalQty, specs.unitSerialNumbers);
  const explicitSerial = (units[unitIndex] || '').trim();
  const serial = (specs.serialNumber || '').trim();
  const unitSerial =
    explicitSerial || (totalQty > 1 && serial ? `${serial}-${unitIndex + 1}` : serial);

  return {
    serialNumber: unitSerial,
    unitSerialNumbers: units,
    cpuModel: specs.cpuModel || '',
    cpuSerial: specs.cpuSerial || '',
    ramModel: specs.ramModel || '',
    ramSerial: specs.ramSerial || '',
    hddModel: specs.hddModel || '',
    hddSerial: specs.hddSerial || '',
    gpuModel: specs.gpuModel || '',
    gpuSerial: specs.gpuSerial || '',
    motherboardModel: specs.motherboardModel || '',
    motherboardSerial: specs.motherboardSerial || '',
    powerSupplyModel: specs.powerSupplyModel || '',
    powerSupplySerial: specs.powerSupplySerial || '',
    caseModel: specs.caseModel || '',
    caseSerial: specs.caseSerial || '',
    customSpecs: normalizeCustomSpecs(specs.customSpecs),
  };
}

export function hasAnyComputerSpecs(specs: ComputerReceiptSpecs): boolean {
  return Boolean(
    specs.serialNumber ||
      (specs.unitSerialNumbers && specs.unitSerialNumbers.some((s) => s?.trim())) ||
      specs.cpuModel ||
      specs.cpuSerial ||
      specs.ramModel ||
      specs.ramSerial ||
      specs.hddModel ||
      specs.hddSerial ||
      specs.gpuModel ||
      specs.gpuSerial ||
      specs.motherboardModel ||
      specs.motherboardSerial ||
      specs.powerSupplyModel ||
      specs.powerSupplySerial ||
      specs.caseModel ||
      specs.caseSerial ||
      (specs.customSpecs && specs.customSpecs.length > 0)
  );
}

/** Prefer newly returned unit specs; keep existing warehouse values when incoming is empty. */
export function mergeWarehouseReceiptSpecs(
  existing: ComputerReceiptSpecs,
  incoming: ComputerReceiptSpecs
): ComputerReceiptSpecs {
  return {
    serialNumber: incoming.serialNumber || existing.serialNumber,
    unitSerialNumbers:
      incoming.unitSerialNumbers && incoming.unitSerialNumbers.some((s) => s.trim())
        ? normalizeUnitSerialNumbers(
            Math.max(incoming.unitSerialNumbers.length, existing.unitSerialNumbers?.length || 0),
            incoming.unitSerialNumbers
          )
        : existing.unitSerialNumbers,
    cpuModel: incoming.cpuModel || existing.cpuModel,
    cpuSerial: incoming.cpuSerial || existing.cpuSerial,
    ramModel: incoming.ramModel || existing.ramModel,
    ramSerial: incoming.ramSerial || existing.ramSerial,
    hddModel: incoming.hddModel || existing.hddModel,
    hddSerial: incoming.hddSerial || existing.hddSerial,
    gpuModel: incoming.gpuModel || existing.gpuModel,
    gpuSerial: incoming.gpuSerial || existing.gpuSerial,
    motherboardModel: incoming.motherboardModel || existing.motherboardModel,
    motherboardSerial: incoming.motherboardSerial || existing.motherboardSerial,
    powerSupplyModel: incoming.powerSupplyModel || existing.powerSupplyModel,
    powerSupplySerial: incoming.powerSupplySerial || existing.powerSupplySerial,
    caseModel: incoming.caseModel || existing.caseModel,
    caseSerial: incoming.caseSerial || existing.caseSerial,
    customSpecs:
      incoming.customSpecs && incoming.customSpecs.length > 0
        ? normalizeCustomSpecs(incoming.customSpecs)
        : normalizeCustomSpecs(existing.customSpecs),
  };
}

export function isWrittenOffLifecycleStatus(
  status: string | undefined | null
): boolean {
  return status === 'Списано' || status === 'На списание';
}

/** Warehouse line that can receive a return or receipt merge (not written off / pending). */
export function isActiveWarehouseStockLine(item: WarehouseItem): boolean {
  return (
    item.quantity > 0 &&
    item.status !== 'Списано' &&
    item.status !== 'На списание'
  );
}

function warehouseItemLinksSoftwareForPurge(
  item: WarehouseItem,
  soft: SoftwareItem
): boolean {
  return (
    getSoftwareWarehouseInv(soft.id) === item.inventoryNumber ||
    (!!soft.licenseKey && soft.licenseKey === item.inventoryNumber) ||
    (item.type === 'Лицензии ПО' && item.name === soft.name)
  );
}

/** Remove finalized write-off rows from active registries; optionally purge pending batch linked by inv. */
export function purgeWrittenOffRegistry(
  items: {
    warehouseItems: WarehouseItem[];
    computers: ComputerItem[];
    networkDevices: NetworkDevice[];
    softwareItems: SoftwareItem[];
  },
  inventoryKey: string,
  options: { purgePendingLinked?: boolean } = {}
): {
  warehouseItems: WarehouseItem[];
  computers: ComputerItem[];
  networkDevices: NetworkDevice[];
  softwareItems: SoftwareItem[];
} {
  const invKey = normalizeInventoryNumber(inventoryKey);
  const { purgePendingLinked = false } = options;

  const warehouseItems = items.warehouseItems.filter((w) => {
    if (!inventoryNumbersMatch(w.inventoryNumber, invKey)) return true;
    if (w.quantity <= 0 || w.status === 'Списано') return false;
    if (purgePendingLinked && w.status === 'На списание') return false;
    return true;
  });

  const computers = items.computers.filter((c) => {
    if (!inventoryNumbersMatch(c.inventoryNumber, invKey)) return true;
    if (c.status === 'Списано') return false;
    if (purgePendingLinked && c.status === 'На списание') return false;
    return true;
  });

  const networkDevices = items.networkDevices.filter((n) => {
    if (!inventoryNumbersMatch(n.inventoryNumber, invKey)) return true;
    if (n.status === 'Списано' || (n.quantity ?? 1) <= 0) return false;
    if (purgePendingLinked && n.status === 'На списание') return false;
    return true;
  });

  const softwareItems = items.softwareItems.filter((s) => {
    const linkedToInvWh = items.warehouseItems.some(
      (w) =>
        warehouseItemLinksSoftwareForPurge(w, s) &&
        inventoryNumbersMatch(w.inventoryNumber, invKey)
    );
    if (!linkedToInvWh) return true;
    if (s.status === 'Списано' || (s.quantity ?? 1) <= 0) return false;
    if (purgePendingLinked && s.status === 'На списание') return false;
    return true;
  });

  return {
    warehouseItems,
    computers,
    networkDevices,
    softwareItems,
  };
}

const STANDARD_SERIAL_FIELDS = [
  'serialNumber',
  'cpuSerial',
  'ramSerial',
  'hddSerial',
  'gpuSerial',
  'motherboardSerial',
  'powerSupplySerial',
  'caseSerial',
] as const satisfies readonly (keyof ComputerReceiptSpecs)[];

/** All non-empty serial numbers on a computer / warehouse stock line. */
export function collectEquipmentSerialValues(
  item: (Partial<ComputerReceiptSpecs> & { unitSerialNumbers?: string[] }) | null | undefined
): string[] {
  if (!item) return [];
  const values: string[] = [];
  if (Array.isArray(item.unitSerialNumbers)) {
    for (const sn of item.unitSerialNumbers) {
      if (typeof sn === 'string' && sn.trim()) values.push(sn.trim());
    }
  }
  for (const key of STANDARD_SERIAL_FIELDS) {
    const raw = item[key];
    if (typeof raw === 'string' && raw.trim()) values.push(raw.trim());
  }
  for (const row of normalizeCustomSpecs(item.customSpecs)) {
    if (row.serial?.trim()) values.push(row.serial.trim());
  }
  return values;
}

export function matchesSerialQuery(
  item: Partial<ComputerReceiptSpecs> | null | undefined,
  query: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return collectEquipmentSerialValues(item).some((serial) => serial.toLowerCase().includes(q));
}

export function findMatchingSerialValue(
  item: Partial<ComputerReceiptSpecs> | null | undefined,
  query: string
): string | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  return collectEquipmentSerialValues(item).find((serial) => serial.toLowerCase().includes(q));
}

function matchesTextFields(query: string, fields: (string | undefined | null)[]): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return fields.some((field) => field && field.toLowerCase().includes(q));
}

export function computerMatchesSearch(computer: ComputerItem, query: string): boolean {
  if (!(query || '').trim()) return true;
  return (
    matchesTextFields(query, [
      computer.model,
      computer.inventoryNumber,
      computer.employeeName,
      computer.deviceType,
      computer.objectName,
      computer.category,
    ]) || matchesSerialQuery(computer, query)
  );
}

export function warehouseItemMatchesSearch(item: WarehouseItem, query: string): boolean {
  if (!(query || '').trim()) return true;
  return (
    matchesTextFields(query, [item.name, item.model, item.inventoryNumber]) ||
    matchesSerialQuery(getWarehouseItemSpecs(item), query)
  );
}

export function networkDeviceMatchesSearch(device: NetworkDevice, query: string): boolean {
  if (!(query || '').trim()) return true;
  return matchesTextFields(query, [
    device.deviceName,
    device.ipAddress,
    device.inventoryNumber,
    device.type,
    device.objectName,
  ]);
}
