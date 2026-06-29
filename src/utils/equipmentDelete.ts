import type {
  ComputerItem,
  CustomWarehouse,
  NetworkDevice,
  SoftwareItem,
  WarehouseItem,
  WarehouseItemType,
} from '../types';
import {
  getSplitRootInventoryNumber,
  getWarehouseLineInventoryKey,
  findActiveWarehouseStockLineIndex,
  inventoryNumbersMatch,
  matchesBaseInventoryNumber,
  normalizeInventoryNumber,
  getSoftwareWarehouseInv,
  getWarehouseBatchInventoryKey,
  isActiveWarehouseStockLine,
  isWrittenOffLifecycleStatus,
  purgeWrittenOffRegistry,
} from './equipmentFields';

export {
  isActiveWarehouseStockLine,
  isWrittenOffLifecycleStatus,
  purgeWrittenOffRegistry,
} from './equipmentFields';

const WAREHOUSE_COMPUTER_TYPES: WarehouseItemType[] = [
  'Компьютеры',
  'Периферия',
  'Оргтехника',
  'Видеонаблюдение',
  'Расходные материалы',
  'Другое',
];

export type EquipmentDeleteSource = 'warehouse' | 'network' | 'software' | 'computer';

export interface EquipmentDeleteContext {
  warehouseItems: WarehouseItem[];
  networkDevices: NetworkDevice[];
  softwareItems: SoftwareItem[];
  computers: ComputerItem[];
  warehouses?: CustomWarehouse[];
}

/** Stock registry cards linked to a warehouse line (by line inv. key, not whole root batch). */
export function findLinkedStockComputerIds(
  item: WarehouseItem,
  computers: ComputerItem[],
  _warehouses: CustomWarehouse[] = []
): string[] {
  if (!WAREHOUSE_COMPUTER_TYPES.includes(item.type)) return [];

  const lineKey = getWarehouseLineInventoryKey(item.inventoryNumber);
  if (!lineKey) return [];

  const ids: string[] = [];
  for (const c of computers) {
    if (c.status !== 'На складе') continue;
    if (matchesBaseInventoryNumber(c.inventoryNumber, lineKey)) {
      ids.push(c.id);
    }
  }

  return ids.slice(0, Math.max(0, item.quantity));
}

function stockUnitSuffixRank(inv: string, lineKey: string): number {
  const cur = (inv || '').trim();
  if (cur === lineKey) return 0;
  const m = cur.match(/-(\d+)$/);
  return m ? parseInt(m[1], 10) : 999;
}

/** Registry computers linked to a specific warehouse line (not the whole root batch). */
export function findRegistryComputersForWarehouseLine(
  item: WarehouseItem,
  computers: ComputerItem[]
): { onStock: ComputerItem[]; issued: ComputerItem[] } {
  if (!WAREHOUSE_COMPUTER_TYPES.includes(item.type)) {
    return { onStock: [], issued: [] };
  }
  const lineKey = getWarehouseLineInventoryKey(item.inventoryNumber);
  if (!lineKey) return { onStock: [], issued: [] };

  const matching = computers.filter(
    (c) =>
      matchesBaseInventoryNumber(c.inventoryNumber, lineKey) &&
      c.status !== 'Списано'
  );

  const sortBySuffix = (a: ComputerItem, b: ComputerItem) =>
    stockUnitSuffixRank(a.inventoryNumber || '', lineKey) -
    stockUnitSuffixRank(b.inventoryNumber || '', lineKey);

  const onStock = matching
    .filter((c) => c.status === 'На складе')
    .sort(sortBySuffix)
    .slice(0, Math.max(0, item.quantity));

  const issued = matching
    .filter((c) => c.status !== 'На складе' && c.status !== 'На списание')
    .sort(sortBySuffix);

  return { onStock, issued };
}

/** Stock registry cards to remove on partial/full warehouse write-off (suffix order). */
export function pickStockComputerIdsForWriteOff(
  item: WarehouseItem,
  computers: ComputerItem[],
  warehouses: CustomWarehouse[] = [],
  quantity: number
): string[] {
  const take = Math.max(0, Math.floor(quantity));
  if (take === 0) return [];
  const linkedIds = findLinkedStockComputerIds(item, computers, warehouses);
  const lineKey = getWarehouseLineInventoryKey(item.inventoryNumber);
  const suffixRank = (inv: string): number => {
    const cur = (inv || '').trim();
    if (cur === lineKey) return 0;
    const m = cur.match(/-(\d+)$/);
    return m ? parseInt(m[1], 10) : 999;
  };
  return computers
    .filter((c) => linkedIds.includes(c.id))
    .sort(
      (a, b) =>
        suffixRank(a.inventoryNumber || '') - suffixRank(b.inventoryNumber || '')
    )
    .slice(0, take)
    .map((c) => c.id);
}

/** Уменьшить складскую строку на 1 при списании карточки ПК со склада / из очереди. */
export function reduceWarehouseQtyForComputerWriteOff(
  items: WarehouseItem[],
  computer: Pick<ComputerItem, 'inventoryNumber' | 'status'>,
  qty = 1
): WarehouseItem[] {
  if (computer.status !== 'На складе' && computer.status !== 'На списание') {
    return items;
  }
  const take = Math.max(1, Math.floor(qty));
  const inv = (computer.inventoryNumber || '').trim();
  if (!inv) return items;

  const findLineForComputer = (): WarehouseItem | undefined => {
    const matchesLine = (w: WarehouseItem) =>
      w.quantity > 0 &&
      matchesBaseInventoryNumber(inv, getWarehouseLineInventoryKey(w.inventoryNumber));

    if (computer.status === 'На списание') {
      return items.find((w) => w.status === 'На списание' && matchesLine(w));
    }
    return items.find(
      (w) => w.status !== 'Списано' && w.status !== 'На списание' && matchesLine(w)
    );
  };

  const targetLine = findLineForComputer();
  if (!targetLine) return items;

  return items.flatMap((w) => {
    if (w.id !== targetLine.id) return [w];
    const newQty = w.quantity - take;
    if (newQty <= 0) return [];
    const nextStatus =
      w.status === 'На списание' ? ('На списание' as const) : ('В наличии' as const);
    return [{ ...w, quantity: newQty, status: nextStatus }];
  });
}

/** Count registry cards/units linked to a warehouse batch inv. */
export function countRegistryUnitsForWarehouseBatch(
  inventoryNumber: string,
  computers: ComputerItem[],
  networkDevices: NetworkDevice[] = [],
  softwareItems: SoftwareItem[] = []
): number {
  const compUnits = computers.filter((c) =>
    matchesBaseInventoryNumber(c.inventoryNumber, inventoryNumber)
  ).length;
  const netUnits = networkDevices
    .filter((n) => inventoryNumbersMatch(n.inventoryNumber, inventoryNumber))
    .reduce((sum, n) => sum + (n.quantity || 1), 0);
  const softUnits = softwareItems
    .filter(
      (s) =>
        inventoryNumbersMatch(s.licenseKey, inventoryNumber) ||
        getSoftwareWarehouseInv(s.id) === inventoryNumber.trim()
    )
    .reduce((sum, s) => sum + (s.quantity || 1), 0);
  return compUnits + netUnits + softUnits;
}

/** Decrease warehouse stock line qty by inv match (network/software/computer finalize). */
export function reduceWarehouseQtyByInventoryMatch(
  items: WarehouseItem[],
  inventoryNumber: string,
  qty: number,
  warehouseName?: string
): WarehouseItem[] {
  const take = Math.max(1, Math.floor(qty));
  const whName = warehouseName || 'Основной склад ИТ';
  const lineKey = getWarehouseLineInventoryKey(inventoryNumber);
  const targetIdx = findActiveWarehouseStockLineIndex(items, lineKey, whName);
  if (targetIdx < 0) return items;
  const target = items[targetIdx]!;

  return items.flatMap((w) => {
    if (w.id !== target.id) return [w];
    const newQty = w.quantity - take;
    if (newQty <= 0) return [];
    const nextStatus =
      w.status === 'На списание' ? ('На списание' as const) : ('В наличии' as const);
    return [{ ...w, quantity: newQty, status: nextStatus }];
  });
}

export interface EquipmentDeletePreview {
  source: EquipmentDeleteSource;
  id: string;
  itemName: string;
  inventoryLabel: string;
  cascadeLines: string[];
}

export { getSoftwareWarehouseInv } from './equipmentFields';

export function findSoftwareIdsForWarehouseItem(
  item: WarehouseItem,
  softwareItems: SoftwareItem[]
): string[] {
  return softwareItems
    .filter((s) => warehouseItemLinksSoftware(item, s))
    .map((s) => s.id);
}

export function warehouseItemLinksSoftware(
  item: WarehouseItem,
  soft: SoftwareItem
): boolean {
  return (
    getSoftwareWarehouseInv(soft.id) === item.inventoryNumber ||
    (!!soft.licenseKey && soft.licenseKey === item.inventoryNumber) ||
    (item.type === 'Лицензии ПО' && item.name === soft.name)
  );
}

export function isSoftwareStoredOnWarehouse(
  soft: SoftwareItem,
  warehouseItems: WarehouseItem[]
): boolean {
  return warehouseItems.some(
    (w) => w.quantity > 0 && warehouseItemLinksSoftware(w, soft)
  );
}

export function filterSoftwareForEquipmentView(softwareItems: SoftwareItem[]): SoftwareItem[] {
  return softwareItems.filter(
    (s) => s.status !== 'На списание' && s.status !== 'Списано'
  );
}

function countByInventory(
  inventoryNumber: string | undefined | null,
  ctx: EquipmentDeleteContext
): { warehouse: number; network: number; computer: number; software: number } {
  const base = normalizeInventoryNumber(inventoryNumber);
  return {
    warehouse: ctx.warehouseItems.filter((w) =>
      inventoryNumbersMatch(w.inventoryNumber, base)
    ).length,
    network: ctx.networkDevices.filter((n) =>
      inventoryNumbersMatch(n.inventoryNumber, base)
    ).length,
    computer: ctx.computers.filter((c) =>
      inventoryNumbersMatch(c.inventoryNumber, base)
    ).length,
    software: 0,
  };
}

function countSoftwareLinks(softwareId: string, ctx: EquipmentDeleteContext): number {
  const soft = ctx.softwareItems.find((s) => s.id === softwareId);
  if (!soft) return 0;
  return ctx.warehouseItems.filter((w) => warehouseItemLinksSoftware(w, soft)).length;
}

function buildCascadeLines(
  counts: { warehouse: number; network: number; computer: number; software: number },
  includeSelf: { warehouse?: boolean; network?: boolean; computer?: boolean; software?: boolean }
): string[] {
  const lines: string[] = [];
  if (includeSelf.warehouse && counts.warehouse > 0) {
    lines.push(`Склад ИТ — ${counts.warehouse} поз.`);
  }
  if (includeSelf.network && counts.network > 0) {
    lines.push(`Сетевое оборудование — ${counts.network} карточ.`);
  }
  if (includeSelf.computer && counts.computer > 0) {
    lines.push(`Оборудование / компьютеры — ${counts.computer} карточ.`);
  }
  if (includeSelf.software && counts.software > 0) {
    lines.push(`Программное обеспечение — ${counts.software} лиценз.`);
  }
  return lines;
}

export function buildDeletePreview(
  source: EquipmentDeleteSource,
  id: string,
  ctx: EquipmentDeleteContext
): EquipmentDeletePreview | null {
  if (source === 'warehouse') {
    const item = ctx.warehouseItems.find((w) => w.id === id);
    if (!item) return null;
    const softIds = findSoftwareIdsForWarehouseItem(item, ctx.softwareItems);
    const invCounts = countByInventory(item.inventoryNumber, ctx);
    const stockComputerIds = findLinkedStockComputerIds(
      item,
      ctx.computers,
      ctx.warehouses ?? []
    );
    const cascadeLines = buildCascadeLines(
      {
        warehouse: 1,
        network: invCounts.network,
        computer: stockComputerIds.length,
        software: softIds.length,
      },
      { warehouse: true, network: true, computer: true, software: true }
    );
    return {
      source,
      id,
      itemName: item.name,
      inventoryLabel: item.inventoryNumber,
      cascadeLines,
    };
  }

  if (source === 'network') {
    const dev = ctx.networkDevices.find((n) => n.id === id);
    if (!dev) return null;
    const batchKey = getWarehouseBatchInventoryKey(dev.inventoryNumber);
    const whRestore = ctx.warehouseItems.some(
      (w) => inventoryNumbersMatch(w.inventoryNumber, batchKey) && isActiveWarehouseStockLine(w)
    );
    const cascadeLines = [
      `Сетевое оборудование — 1 карточ. (${dev.quantity} шт.)`,
      ...(whRestore ? [`Склад ИТ — остаток +${dev.quantity} шт.`] : []),
    ];
    return {
      source,
      id,
      itemName: dev.deviceName,
      inventoryLabel: normalizeInventoryNumber(dev.inventoryNumber),
      cascadeLines,
    };
  }

  if (source === 'software') {
    const soft = ctx.softwareItems.find((s) => s.id === id);
    if (!soft) return null;
    const whCount = countSoftwareLinks(id, ctx);
    const cascadeLines = buildCascadeLines(
      { warehouse: whCount, network: 0, computer: 0, software: 1 },
      { warehouse: whCount > 0, network: false, computer: false, software: true }
    );
    return {
      source,
      id,
      itemName: soft.name,
      inventoryLabel: soft.licenseKey || getSoftwareWarehouseInv(id),
      cascadeLines,
    };
  }

  const comp = ctx.computers.find((c) => c.id === id);
  if (!comp) return null;
  const cascadeLines: string[] = ['Оборудование / компьютеры — 1 карточ.'];
  if (comp.status === 'На складе') {
    cascadeLines.push('Склад ИТ — остаток −1 шт.');
  }
  return {
    source,
    id,
    itemName: `${comp.category} ${comp.model}`.trim(),
    inventoryLabel: comp.inventoryNumber,
    cascadeLines,
  };
}

export function resolveDeleteInventoryKey(
  source: EquipmentDeleteSource,
  id: string,
  ctx: EquipmentDeleteContext
): string | null {
  if (source === 'warehouse') {
    const item = ctx.warehouseItems.find((w) => w.id === id);
    return item ? normalizeInventoryNumber(item.inventoryNumber) : null;
  }
  if (source === 'network') {
    const dev = ctx.networkDevices.find((n) => n.id === id);
    return dev ? normalizeInventoryNumber(dev.inventoryNumber) : null;
  }
  if (source === 'software') return null;
  const comp = ctx.computers.find((c) => c.id === id);
  return comp ? normalizeInventoryNumber(comp.inventoryNumber) : null;
}

export function matchesInventoryKey(
  itemInventoryNumber: string | undefined | null,
  inventoryKey: string
): boolean {
  return inventoryNumbersMatch(itemInventoryNumber, inventoryKey);
}

export function isNotLinkedToInventoryKey(
  itemInventoryNumber: string | undefined | null,
  inventoryKey: string
): boolean {
  return !matchesInventoryKey(itemInventoryNumber, inventoryKey);
}
