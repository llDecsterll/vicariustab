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
  getWarehouseLineInventoryKey,
  inventoryNumbersMatch,
  normalizeInventoryNumber,
  normalizePositiveInt,
} from './equipmentFields';
import type { EquipmentDeleteSource } from './equipmentDelete';
import {
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
    if (!w || w.status === 'На списание' || w.status === 'Списано' || normalizePositiveInt(w.quantity, 0) < 1) return null;
    return {
      name: w.name,
      model: w.model,
      maxQty: normalizePositiveInt(w.quantity),
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

function syncNetworkPartialMarkFromWarehouse(
  target: WarehouseItem,
  markQty: number,
  pendingInv: string,
  networkDevices: NetworkDevice[]
): NetworkDevice[] {
  if (target.type !== 'Сетевое оборудование') return networkDevices;
  const lineKey = getWarehouseLineInventoryKey(target.inventoryNumber);
  const matchingNet = networkDevices.find(
    (n) =>
      inventoryNumbersMatch(n.inventoryNumber, lineKey) &&
      n.status !== 'На списание' &&
      n.status !== 'Списано'
  );
  if (!matchingNet) return networkDevices;
  const total = normalizePositiveInt(matchingNet.quantity, 1);
  if (markQty >= total) {
    return networkDevices.map((n) =>
      n.id === matchingNet.id ? { ...n, status: 'На списание' as const } : n
    );
  }
  return [
    ...networkDevices.map((n) =>
      n.id === matchingNet.id ? { ...n, quantity: total - markQty } : n
    ),
    {
      ...matchingNet,
      id: `net-pending-${Date.now()}`,
      inventoryNumber: pendingInv,
      quantity: markQty,
      status: 'На списание',
    },
  ];
}

function syncSoftwarePartialMarkFromWarehouse(
  target: WarehouseItem,
  markQty: number,
  pendingInv: string,
  softwareItems: SoftwareItem[],
  softIds: string[]
): SoftwareItem[] {
  if (target.type !== 'Лицензии ПО' && softIds.length === 0) return softwareItems;
  const linkedSoft = softwareItems.find((s) => softIds.includes(s.id));
  if (!linkedSoft) return softwareItems;
  const total = normalizePositiveInt(linkedSoft.quantity, 1);
  if (markQty >= total) {
    return softwareItems.map((s) =>
      softIds.includes(s.id) ? { ...s, status: 'На списание' as const } : s
    );
  }
  return [
    ...softwareItems.map((s) =>
      s.id === linkedSoft.id ? { ...s, quantity: total - markQty } : s
    ),
    {
      ...linkedSoft,
      id: `soft-pending-${Date.now()}`,
      licenseKey:
        pendingInv.startsWith('SW-') || !linkedSoft.licenseKey
          ? linkedSoft.licenseKey
          : pendingInv,
      quantity: markQty,
      status: 'На списание',
    },
  ];
}

function markWarehouseLineFullPending(
  target: WarehouseItem,
  id: string,
  markQty: number,
  warehouseItems: WarehouseItem[],
  computers: ComputerItem[],
  networkDevices: NetworkDevice[],
  softwareItems: SoftwareItem[],
  softIds: string[],
  warehouses: CustomWarehouse[]
): {
  warehouseItems: WarehouseItem[];
  computers: ComputerItem[];
  networkDevices: NetworkDevice[];
  softwareItems: SoftwareItem[];
} {
  const stockIds = new Set(
    pickStockComputerIdsForWriteOff(target, computers, warehouses, markQty)
  );
  const nextWarehouse = warehouseItems.map((w) =>
    w.id === id ? { ...w, status: 'На списание' as const } : w
  );
  const nextComputers = computers.map((c) =>
    stockIds.has(c.id) ? { ...c, status: 'На списание' as const } : c
  );

  let nextNetwork = networkDevices;
  if (target.type === 'Сетевое оборудование') {
    const lineKey = getWarehouseLineInventoryKey(target.inventoryNumber);
    const matchingNet = networkDevices.find(
      (n) =>
        inventoryNumbersMatch(n.inventoryNumber, lineKey) &&
        n.status !== 'Списано'
    );
    if (matchingNet) {
      nextNetwork = networkDevices.map((n) =>
        n.id === matchingNet.id ? { ...n, status: 'На списание' as const } : n
      );
    }
  }

  let nextSoftware = softwareItems;
  if (target.type === 'Лицензии ПО' || softIds.length > 0) {
    nextSoftware = softwareItems.map((s) =>
      softIds.includes(s.id) ? { ...s, status: 'На списание' as const } : s
    );
  }

  return {
    warehouseItems: nextWarehouse,
    computers: nextComputers,
    networkDevices: nextNetwork,
    softwareItems: nextSoftware,
  };
}

export function applyMarkForWriteOff(
  source: EquipmentDeleteSource,
  id: string,
  quantity: number,
  ctx: MarkPendingContext
): MarkPendingWriteOffResult {
  const requestedQty = normalizePositiveInt(quantity);
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
    const targetQty = normalizePositiveInt(target.quantity, 0);
    if (targetQty < 1) {
      return { ok: false, warehouseItems, computers, networkDevices, softwareItems };
    }
    const markQty = Math.min(requestedQty, targetQty);
    const isPartialMark = markQty < targetQty;
    const softIds = findSoftwareIdsForWarehouseItem(target, softwareItems);

    if (target.type === 'Лицензии ПО' || softIds.length > 0) {
      if (isPartialMark) {
        warehouseItems = warehouseItems.map((w) =>
          w.id === id ? { ...w, quantity: targetQty - markQty } : w
        );
        const pendingLine = buildPendingWarehouseLine(target, markQty, warehouseItems);
        warehouseItems.push(pendingLine);
        softwareItems = syncSoftwarePartialMarkFromWarehouse(
          target,
          markQty,
          pendingLine.inventoryNumber,
          softwareItems,
          softIds
        );
      } else {
        const full = markWarehouseLineFullPending(
          target,
          id,
          markQty,
          warehouseItems,
          computers,
          networkDevices,
          softwareItems,
          softIds,
          ctx.warehouses
        );
        warehouseItems = full.warehouseItems;
        computers = full.computers;
        networkDevices = full.networkDevices;
        softwareItems = full.softwareItems;
      }
      label = `Позиция «${target.name}» (${markQty} ${target.unit || 'шт.'}) переведена в статус «На списание»`;
    } else if (isPartialMark) {
      const stockIds = pickStockComputerIdsForWriteOff(
        target,
        computers,
        ctx.warehouses,
        markQty
      );
      warehouseItems = warehouseItems.map((w) =>
        w.id === id ? { ...w, quantity: targetQty - markQty } : w
      );
      const pendingLine = buildPendingWarehouseLine(target, markQty, warehouseItems);
      warehouseItems.push(pendingLine);
      computers = markStockComputerIds(computers, stockIds);
      networkDevices = syncNetworkPartialMarkFromWarehouse(
        target,
        markQty,
        pendingLine.inventoryNumber,
        networkDevices
      );
      label = `На списание отправлено ${markQty} ${target.unit || 'шт.'} из «${target.name}»`;
    } else {
      const full = markWarehouseLineFullPending(
        target,
        id,
        markQty,
        warehouseItems,
        computers,
        networkDevices,
        softwareItems,
        softIds,
        ctx.warehouses
      );
      warehouseItems = full.warehouseItems;
      computers = full.computers;
      networkDevices = full.networkDevices;
      softwareItems = full.softwareItems;
      label = `Позиция «${target.name}» (${markQty} ${target.unit || 'шт.'}) переведена в статус «На списание»`;
    }
  } else if (source === 'network') {
    const target = networkDevices.find((n) => n.id === id);
    if (!target || target.status === 'На списание' || target.status === 'Списано') {
      return { ok: false, warehouseItems, computers, networkDevices, softwareItems };
    }
    const total = normalizePositiveInt(target.quantity || 1);
    const markQty = Math.min(requestedQty, total);
    const isPartialMark = markQty < total;
    const invKey = normalizeInventoryNumber(target.inventoryNumber);

    if (isPartialMark) {
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
    const total = normalizePositiveInt(target.quantity || 1);
    const markQty = Math.min(requestedQty, total);
    const isPartialMark = markQty < total;

    if (isPartialMark) {
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
    computers = computers.map((c) =>
      c.id === id ? { ...c, status: 'На списание' as const } : c
    );
    label = `Оборудование «${target.category} ${target.model}» (${target.inventoryNumber || 'без инв. №'}) переведено в статус «На списание»`;
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
