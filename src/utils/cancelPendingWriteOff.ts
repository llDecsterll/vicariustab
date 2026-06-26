import type {
  ComputerItem,
  ComputerStatus,
  CustomWarehouse,
  NetworkDevice,
  SoftwareItem,
  WarehouseItem,
} from '../types';
import { getSplitRootInventoryNumber, inventoryNumbersMatch, normalizeInventoryNumber } from './equipmentFields';
import type { EquipmentDeleteSource } from './equipmentDelete';
import {
  findSoftwareIdsForWarehouseItem,
  isNotLinkedToInventoryKey,
  pickStockComputerIdsForWriteOff,
  warehouseItemLinksSoftware,
} from './equipmentDelete';
import {
  mergeNetworkPendingOnCancel,
  mergeSoftwarePendingOnCancel,
  mergeWarehousePendingOnCancel,
  repairWarehousePendingDuplicates,
} from './warehousePendingMerge';

export interface CancelPendingWriteOffContext {
  warehouseItems: WarehouseItem[];
  computers: ComputerItem[];
  networkDevices: NetworkDevice[];
  softwareItems: SoftwareItem[];
  warehouses: CustomWarehouse[];
}

export interface CancelPendingWriteOffResult {
  ok: boolean;
  label?: string;
  warehouseItems: WarehouseItem[];
  computers: ComputerItem[];
  networkDevices: NetworkDevice[];
  softwareItems: SoftwareItem[];
}

function stockObjectNameSet(warehouses: CustomWarehouse[]): Set<string> {
  return new Set(warehouses.map((w) => w.objectName).filter(Boolean) as string[]);
}

function computerStatusAfterCancel(
  c: ComputerItem,
  stockObjects: Set<string>
): ComputerStatus {
  if (c.employeeName === 'Склад ИТ' || stockObjects.has(c.objectName || '')) {
    return 'На складе';
  }
  return 'В работе';
}

function networkStatusAfterCancel(
  n: NetworkDevice,
  stockObjects: Set<string>
): NetworkDevice['status'] {
  if (stockObjects.has(n.objectName || '')) return 'На складе';
  return 'В работе';
}

function unmarkWarehouseByInv(
  items: WarehouseItem[],
  invKey: string
): WarehouseItem[] {
  return items.map((w) =>
    w.status === 'На списание' && !isNotLinkedToInventoryKey(w.inventoryNumber, invKey)
      ? { ...w, status: 'В наличии' as const }
      : w
  );
}

function unmarkComputersByInv(
  items: ComputerItem[],
  invKey: string,
  stockObjects: Set<string>,
  onlyIds?: Set<string>
): ComputerItem[] {
  return items.map((c) => {
    if (c.status !== 'На списание') return c;
    const linked =
      (onlyIds?.has(c.id) ?? false) ||
      !isNotLinkedToInventoryKey(c.inventoryNumber, invKey);
    if (!linked) return c;
    return { ...c, status: computerStatusAfterCancel(c, stockObjects) };
  });
}

function unmarkNetworkByInv(
  items: NetworkDevice[],
  invKey: string,
  stockObjects: Set<string>
): NetworkDevice[] {
  return items.map((n) =>
    n.status === 'На списание' && !isNotLinkedToInventoryKey(n.inventoryNumber, invKey)
      ? { ...n, status: networkStatusAfterCancel(n, stockObjects) }
      : n
  );
}

export function applyCancelPendingWriteOff(
  source: EquipmentDeleteSource,
  id: string,
  ctx: CancelPendingWriteOffContext
): CancelPendingWriteOffResult {
  const stockObjects = stockObjectNameSet(ctx.warehouses);
  let warehouseItems = ctx.warehouseItems;
  let computers = ctx.computers;
  let networkDevices = ctx.networkDevices;
  let softwareItems = ctx.softwareItems;
  let label = '';

  if (source === 'warehouse') {
    const target = warehouseItems.find((w) => w.id === id);
    if (!target || target.status !== 'На списание') {
      return { ok: false, warehouseItems, computers, networkDevices, softwareItems };
    }
    const softIds = findSoftwareIdsForWarehouseItem(target, softwareItems);
    if (target.type === 'Лицензии ПО' || softIds.length > 0) {
      softwareItems = softwareItems.map((s) =>
        s.status === 'На списание' && softIds.includes(s.id)
          ? {
              ...s,
              status: (s.assignedEmployeeName?.trim()
                ? 'Активна'
                : 'Не активирована') as SoftwareItem['status'],
            }
          : s
      );
      warehouseItems = mergeWarehousePendingOnCancel(warehouseItems, id);
      warehouseItems = warehouseItems.map((w) => {
        if (w.status !== 'На списание') return w;
        const linked = softIds.some((sid) => {
          const soft = softwareItems.find((s) => s.id === sid);
          return soft ? warehouseItemLinksSoftware(w, soft) : false;
        });
        return linked ? { ...w, status: 'В наличии' as const } : w;
      });
      warehouseItems = repairWarehousePendingDuplicates(warehouseItems);
      label = `Позиция «${target.name}» возвращена на склад (снята с очереди списания)`;
    } else {
      const rootInv = getSplitRootInventoryNumber(
        target.inventoryNumber,
        target.splitFromInventoryNumber
      );
      const invKey = normalizeInventoryNumber(rootInv);
      const markedStockIds = new Set(
        pickStockComputerIdsForWriteOff(
          { ...target, inventoryNumber: rootInv },
          ctx.computers,
          ctx.warehouses,
          target.quantity
        )
      );
      warehouseItems = mergeWarehousePendingOnCancel(warehouseItems, id);
      warehouseItems = unmarkWarehouseByInv(warehouseItems, invKey);
      warehouseItems = repairWarehousePendingDuplicates(warehouseItems);
      computers = unmarkComputersByInv(computers, invKey, stockObjects, markedStockIds);
      networkDevices = unmarkNetworkByInv(networkDevices, invKey, stockObjects);
      label = `Позиция «${target.name}» возвращена на склад (объединено ${target.quantity} ${target.unit || 'шт.'})`;
    }
  } else if (source === 'network') {
    const target = networkDevices.find((n) => n.id === id);
    if (!target || target.status !== 'На списание') {
      return { ok: false, warehouseItems, computers, networkDevices, softwareItems };
    }
    const invKey = normalizeInventoryNumber(target.inventoryNumber);
    networkDevices = mergeNetworkPendingOnCancel(
      networkDevices,
      id,
      networkStatusAfterCancel(target, stockObjects)
    );
    networkDevices = networkDevices.map((n) =>
      n.status === 'На списание' && !isNotLinkedToInventoryKey(n.inventoryNumber, invKey)
        ? { ...n, status: networkStatusAfterCancel(n, stockObjects) }
        : n
    );
    warehouseItems = unmarkWarehouseByInv(warehouseItems, invKey);
    computers = unmarkComputersByInv(computers, invKey, stockObjects);
    label = `Сетевое оборудование «${target.deviceName}» возвращено с очереди списания`;
  } else if (source === 'software') {
    const target = softwareItems.find((s) => s.id === id);
    if (!target || target.status !== 'На списание') {
      return { ok: false, warehouseItems, computers, networkDevices, softwareItems };
    }
    const restoreSoftStatus = (target.assignedEmployeeName?.trim()
      ? 'Активна'
      : 'Не активирована') as SoftwareItem['status'];
    softwareItems = mergeSoftwarePendingOnCancel(softwareItems, id, restoreSoftStatus);
    warehouseItems = warehouseItems.map((w) =>
      w.status === 'На списание' && warehouseItemLinksSoftware(w, target)
        ? { ...w, status: 'В наличии' as const }
        : w
    );
    label = `Лицензия ПО «${target.name}» возвращена с очереди списания`;
  } else {
    const target = computers.find((c) => c.id === id);
    if (!target || target.status !== 'На списание') {
      return { ok: false, warehouseItems, computers, networkDevices, softwareItems };
    }
    const invKey = normalizeInventoryNumber(target.inventoryNumber);
    computers = computers.map((c) =>
      c.status === 'На списание' &&
      (c.id === id || !isNotLinkedToInventoryKey(c.inventoryNumber, invKey))
        ? { ...c, status: computerStatusAfterCancel(c, stockObjects) }
        : c
    );
    warehouseItems = warehouseItems.map((w) =>
      w.status === 'На списание' && inventoryNumbersMatch(w.inventoryNumber, invKey)
        ? { ...w, status: 'В наличии' as const }
        : w
    );
    networkDevices = unmarkNetworkByInv(networkDevices, invKey, stockObjects);
    label = `Оборудование «${target.category} ${target.model}» возвращено с очереди списания`;
  }

  return {
    ok: true,
    label,
    warehouseItems: repairWarehousePendingDuplicates(warehouseItems),
    computers,
    networkDevices,
    softwareItems,
  };
}
