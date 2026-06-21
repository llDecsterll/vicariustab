import type {
  ComputerItem,
  CustomWarehouse,
  NetworkDevice,
  SoftwareItem,
  WarehouseItem,
  WarehouseItemType,
} from '../types';
import {
  inventoryNumbersMatch,
  normalizeInventoryNumber,
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

/** Stock registry cards linked to a warehouse line (by inv. batch or same model at stock object). */
export function findLinkedStockComputerIds(
  item: WarehouseItem,
  computers: ComputerItem[],
  warehouses: CustomWarehouse[] = []
): string[] {
  if (!WAREHOUSE_COMPUTER_TYPES.includes(item.type)) return [];

  const ids: string[] = [];
  const baseInv = item.inventoryNumber;

  for (const c of computers) {
    if (c.status !== 'На складе') continue;
    if (inventoryNumbersMatch(c.inventoryNumber, baseInv)) {
      ids.push(c.id);
    }
  }

  let remaining = item.quantity - ids.length;
  if (remaining <= 0) return ids;

  const wh = warehouses.find(
    (w) => w.name === (item.warehouseName || 'Основной склад ИТ')
  );
  const stockObject = wh?.objectName;

  for (const c of computers) {
    if (remaining <= 0) break;
    if (c.status !== 'На складе') continue;
    if (ids.includes(c.id)) continue;
    if (c.model !== item.model) continue;
    if (stockObject && c.objectName !== stockObject) continue;
    ids.push(c.id);
    remaining--;
  }

  return ids;
}

export interface EquipmentDeletePreview {
  source: EquipmentDeleteSource;
  id: string;
  itemName: string;
  inventoryLabel: string;
  cascadeLines: string[];
}

export function getSoftwareWarehouseInv(softwareId: string): string {
  return `SW-${softwareId.slice(-8).toUpperCase()}`;
}

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

export function filterSoftwareForEquipmentView(
  softwareItems: SoftwareItem[],
  warehouseItems: WarehouseItem[]
): SoftwareItem[] {
  return softwareItems.filter(
    (s) => !(s.status === 'Не активирована' && isSoftwareStoredOnWarehouse(s, warehouseItems))
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
    const invNorm = normalizeInventoryNumber(dev.inventoryNumber);
    const invCounts = countByInventory(invNorm, ctx);
    const cascadeLines = buildCascadeLines(
      {
        warehouse: invCounts.warehouse,
        network: invCounts.network,
        computer: invCounts.computer,
        software: 0,
      },
      { warehouse: true, network: true, computer: invCounts.computer > 0, software: false }
    );
    return {
      source,
      id,
      itemName: dev.deviceName,
      inventoryLabel: invNorm,
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
  const invCounts = countByInventory(comp.inventoryNumber, ctx);
  const cascadeLines = buildCascadeLines(
    {
      warehouse: invCounts.warehouse,
      network: invCounts.network,
      computer: 1,
      software: 0,
    },
    {
      warehouse: invCounts.warehouse > 0 || comp.status === 'На складе',
      network: invCounts.network > 0,
      computer: true,
      software: false,
    }
  );
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
