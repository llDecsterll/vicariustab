import type { ComputerItem, NetworkDevice, SoftwareItem, WarehouseItem } from '../types';
import { matchesBaseInventoryNumber } from './equipmentFields';

export type EquipmentDeleteSource = 'warehouse' | 'network' | 'software' | 'computer';

export interface EquipmentDeleteContext {
  warehouseItems: WarehouseItem[];
  networkDevices: NetworkDevice[];
  softwareItems: SoftwareItem[];
  computers: ComputerItem[];
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
    .filter(
      (s) =>
        getSoftwareWarehouseInv(s.id) === item.inventoryNumber ||
        s.licenseKey === item.inventoryNumber ||
        (item.type === 'Лицензии ПО' && s.name === item.name)
    )
    .map((s) => s.id);
}

function countByInventory(
  inventoryNumber: string | undefined | null,
  ctx: EquipmentDeleteContext
): { warehouse: number; network: number; computer: number; software: number } {
  if (!inventoryNumber) {
    return { warehouse: 0, network: 0, computer: 0, software: 0 };
  }
  return {
    warehouse: ctx.warehouseItems.filter((w) =>
      matchesBaseInventoryNumber(w.inventoryNumber, inventoryNumber)
    ).length,
    network: ctx.networkDevices.filter((n) =>
      matchesBaseInventoryNumber(n.inventoryNumber, inventoryNumber)
    ).length,
    computer: ctx.computers.filter((c) =>
      matchesBaseInventoryNumber(c.inventoryNumber, inventoryNumber)
    ).length,
    software: 0,
  };
}

function countSoftwareLinks(softwareId: string, ctx: EquipmentDeleteContext): number {
  const soft = ctx.softwareItems.find((s) => s.id === softwareId);
  if (!soft) return 0;
  const swInv = getSoftwareWarehouseInv(softwareId);
  return ctx.warehouseItems.filter(
    (w) =>
      w.inventoryNumber === swInv ||
      w.inventoryNumber === soft.licenseKey ||
      (w.type === 'Лицензии ПО' && w.name === soft.name)
  ).length;
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
    const cascadeLines = buildCascadeLines(
      {
        warehouse: 1,
        network: invCounts.network,
        computer: invCounts.computer,
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
    const invCounts = countByInventory(dev.inventoryNumber, ctx);
    const cascadeLines = buildCascadeLines(
      {
        warehouse: invCounts.warehouse,
        network: 1,
        computer: invCounts.computer,
        software: 0,
      },
      { warehouse: true, network: true, computer: invCounts.computer > 0, software: false }
    );
    return {
      source,
      id,
      itemName: dev.deviceName,
      inventoryLabel: dev.inventoryNumber || '—',
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
    { warehouse: invCounts.warehouse > 0, network: false, computer: true, software: false }
  );
  return {
    source,
    id,
    itemName: `${comp.category} ${comp.model}`.trim(),
    inventoryLabel: comp.inventoryNumber,
    cascadeLines,
  };
}
