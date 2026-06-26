import type {
  ComputerItem,
  CustomWarehouse,
  NetworkDevice,
  SoftwareItem,
  WarehouseItem,
} from '../types';
import {
  allocateNextSplitPartIndex,
  formatSplitWarehouseInventoryNumber,
  getSplitRootInventoryNumber,
  inventoryNumbersMatch,
  normalizeInventoryNumber,
} from './equipmentFields';
import type { EquipmentDeleteSource } from './equipmentDelete';
import {
  findLinkedStockComputerIds,
  findSoftwareIdsForWarehouseItem,
  isNotLinkedToInventoryKey,
  pickStockComputerIdsForWriteOff,
  warehouseItemLinksSoftware,
} from './equipmentDelete';

export interface MarkPendingContext {
  warehouseItems: WarehouseItem[];
  computers: ComputerItem[];
  networkDevices: NetworkDevice[];
  softwareItems: SoftwareItem[];
  warehouses: CustomWarehouse[];
}

export interface MarkPendingTargetInfo {
  name: string;
  model: string;
  maxQty: number;
  unit: string;
  inventoryNumber: string;
}

export interface MarkPendingWriteOffResult {
  ok: boolean;
  label?: string;
  warehouseItems: WarehouseItem[];
  computers: ComputerItem[];
  networkDevices: NetworkDevice[];
  softwareItems: SoftwareItem[];
}

export function resolveMarkPendingTarget(
  source: EquipmentDeleteSource,
  id: string,
  ctx: MarkPendingContext
): MarkPendingTargetInfo | null {
  if (source === 'warehouse') {
    const w = ctx.warehouseItems.find((x) => x.id === id);
    if (!w || w.status === 'На списание' || w.status === 'Списано' || w.quantity < 1) return null;
    return {
      name: w.name,
      model: w.model,
      maxQty: w.quantity,
      unit: w.unit || 'шт.',
      inventoryNumber: w.inventoryNumber,
    };
  }
  if (source === 'network') {
    const n = ctx.networkDevices.find((x) => x.id === id);
    if (!n || n.status === 'На списание' || n.status === 'Списано') return null;
    return {
      name: n.deviceName,
      model: n.type,
      maxQty: Math.max(1, n.quantity || 1),
      unit: 'шт.',
      inventoryNumber: n.inventoryNumber || '',
    };
  }
  if (source === 'software') {
    const s = ctx.softwareItems.find((x) => x.id === id);
    if (!s || s.status === 'На списание' || s.status === 'Списано') return null;
    return {
      name: s.name,
      model: s.developer || s.category,
      maxQty: Math.max(1, s.quantity || 1),
      unit: 'лиц.',
      inventoryNumber: s.licenseKey || '',
    };
  }
  const c = ctx.computers.find((x) => x.id === id);
  if (!c || c.status === 'На списание' || c.status === 'Списано') return null;
  return {
    name: c.deviceType || c.category,
    model: c.model,
    maxQty: 1,
    unit: 'шт.',
    inventoryNumber: c.inventoryNumber,
  };
}

function markStockComputerIds(
  computers: ComputerItem[],
  ids: string[]
): ComputerItem[] {
  const set = new Set(ids);
  return computers.map((c) =>
    set.has(c.id) ? { ...c, status: 'На списание' as const } : c
  );
}

function buildPendingWarehouseLine(
  target: WarehouseItem,
  markQty: number,
  warehouseItems: WarehouseItem[]
): WarehouseItem {
  const rootInv = getSplitRootInventoryNumber(
    target.inventoryNumber,
    target.splitFromInventoryNumber
  );
  const partIndex = allocateNextSplitPartIndex(rootInv, warehouseItems);
  return {
    ...target,
    id: `wh-pending-${Date.now()}`,
    inventoryNumber: formatSplitWarehouseInventoryNumber(rootInv, partIndex),
    splitFromInventoryNumber: rootInv,
    quantity: markQty,
    status: 'На списание',
  };
}

export function applyMarkForWriteOff(
  source: EquipmentDeleteSource,
  id: string,
  quantity: number,
  ctx: MarkPendingContext
): MarkPendingWriteOffResult {
  const qty = Math.max(1, Math.floor(quantity));
  let warehouseItems = ctx.warehouseItems;
  let computers = ctx.computers;
  let networkDevices = ctx.networkDevices;
  let softwareItems = ctx.softwareItems;
  let label = '';

  if (source === 'warehouse') {
    const target = warehouseItems.find((w) => w.id === id);
    if (!target || target.status === 'На списание' || target.status === 'Списано') {
      return { ok: false, warehouseItems, computers, networkDevices, softwareItems };
    }
    const markQty = Math.min(qty, target.quantity);
    const softIds = findSoftwareIdsForWarehouseItem(target, softwareItems);

    if (target.type === 'Лицензии ПО' || softIds.length > 0) {
      if (markQty < target.quantity) {
        warehouseItems = warehouseItems.map((w) =>
          w.id === id ? { ...w, quantity: w.quantity - markQty } : w
        );
        warehouseItems.push(buildPendingWarehouseLine(target, markQty, warehouseItems));
        if (markQty >= (softwareItems.find((s) => softIds.includes(s.id))?.quantity || markQty)) {
          softwareItems = softwareItems.map((s) =>
            softIds.includes(s.id) ? { ...s, status: 'На списание' as const } : s
          );
        }
      } else {
        softwareItems = softwareItems.map((s) =>
          softIds.includes(s.id) ? { ...s, status: 'На списание' as const } : s
        );
        warehouseItems = warehouseItems.map((w) => {
          if (w.id === id) return { ...w, status: 'На списание' as const };
          const linked = softIds.some((sid) => {
            const soft = softwareItems.find((s) => s.id === sid);
            return soft ? warehouseItemLinksSoftware(w, soft) : false;
          });
          return linked ? { ...w, status: 'На списание' as const } : w;
        });
      }
      label = `Позиция «${target.name}» (${markQty} ${target.unit || 'шт.'}) переведена в статус «На списание»`;
    } else if (markQty < target.quantity) {
      const stockIds = pickStockComputerIdsForWriteOff(
        target,
        computers,
        ctx.warehouses,
        markQty
      );
      warehouseItems = warehouseItems.map((w) =>
        w.id === id ? { ...w, quantity: w.quantity - markQty } : w
      );
      warehouseItems.push(buildPendingWarehouseLine(target, markQty, warehouseItems));
      computers = markStockComputerIds(computers, stockIds);
      label = `На списание отправлено ${markQty} ${target.unit || 'шт.'} из «${target.name}»`;
    } else {
      const invKey = normalizeInventoryNumber(target.inventoryNumber);
      const linkedStockIds = new Set(
        findLinkedStockComputerIds(target, computers, ctx.warehouses)
      );
      warehouseItems = warehouseItems.map((w) =>
        isNotLinkedToInventoryKey(w.inventoryNumber, invKey)
          ? w
          : { ...w, status: 'На списание' as const }
      );
      computers = computers.map((c) =>
        linkedStockIds.has(c.id) || !isNotLinkedToInventoryKey(c.inventoryNumber, invKey)
          ? { ...c, status: 'На списание' as const }
          : c
      );
      networkDevices = networkDevices.map((nd) =>
        isNotLinkedToInventoryKey(nd.inventoryNumber, invKey)
          ? nd
          : { ...nd, status: 'На списание' as const }
      );
      label = `Позиция «${target.name}» и связанные карточки переведены в статус «На списание»`;
    }
  } else if (source === 'network') {
    const target = networkDevices.find((n) => n.id === id);
    if (!target || target.status === 'На списание' || target.status === 'Списано') {
      return { ok: false, warehouseItems, computers, networkDevices, softwareItems };
    }
    const total = Math.max(1, target.quantity || 1);
    const markQty = Math.min(qty, total);
    const invKey = normalizeInventoryNumber(target.inventoryNumber);

    if (markQty < total) {
      networkDevices = networkDevices.map((n) =>
        n.id === id ? { ...n, quantity: total - markQty } : n
      );
      networkDevices.push({
        ...target,
        id: `net-pending-${Date.now()}`,
        quantity: markQty,
        status: 'На списание',
      });
    } else {
      networkDevices = networkDevices.map((n) =>
        n.id === id || !isNotLinkedToInventoryKey(n.inventoryNumber, invKey)
          ? { ...n, status: 'На списание' as const }
          : n
      );
      warehouseItems = warehouseItems.map((w) =>
        isNotLinkedToInventoryKey(w.inventoryNumber, invKey)
          ? w
          : { ...w, status: 'На списание' as const }
      );
      computers = computers.map((c) =>
        isNotLinkedToInventoryKey(c.inventoryNumber, invKey)
          ? c
          : { ...c, status: 'На списание' as const }
      );
    }
    label = `Сетевое оборудование «${target.deviceName}» (${markQty} шт.) отправлено на списание`;
  } else if (source === 'software') {
    const target = softwareItems.find((s) => s.id === id);
    if (!target || target.status === 'На списание' || target.status === 'Списано') {
      return { ok: false, warehouseItems, computers, networkDevices, softwareItems };
    }
    const total = Math.max(1, target.quantity || 1);
    const markQty = Math.min(qty, total);

    if (markQty < total) {
      softwareItems = softwareItems.map((s) =>
        s.id === id ? { ...s, quantity: total - markQty } : s
      );
      softwareItems.push({
        ...target,
        id: `soft-pending-${Date.now()}`,
        quantity: markQty,
        status: 'На списание',
      });
    } else {
      softwareItems = softwareItems.map((s) =>
        s.id === id ? { ...s, status: 'На списание' as const } : s
      );
      warehouseItems = warehouseItems.map((w) =>
        warehouseItemLinksSoftware(w, target)
          ? { ...w, status: 'На списание' as const }
          : w
      );
    }
    label = `Лицензия ПО «${target.name}» (${markQty} лиц.) отправлена на списание`;
  } else {
    const target = computers.find((c) => c.id === id);
    if (!target || target.status === 'На списание' || target.status === 'Списано') {
      return { ok: false, warehouseItems, computers, networkDevices, softwareItems };
    }
    const invKey = normalizeInventoryNumber(target.inventoryNumber);
    computers = computers.map((c) =>
      c.id === id || !isNotLinkedToInventoryKey(c.inventoryNumber, invKey)
        ? { ...c, status: 'На списание' as const }
        : c
    );
    warehouseItems = warehouseItems.map((w) =>
      inventoryNumbersMatch(w.inventoryNumber, invKey)
        ? { ...w, status: 'На списание' as const }
        : w
    );
    networkDevices = networkDevices.map((nd) =>
      isNotLinkedToInventoryKey(nd.inventoryNumber, invKey)
        ? nd
        : { ...nd, status: 'На списание' as const }
    );
    label = `Оборудование «${target.category} ${target.model}» переведено в статус «На списание»`;
  }

  return {
    ok: true,
    label,
    warehouseItems,
    computers,
    networkDevices,
    softwareItems,
  };
}
