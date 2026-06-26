import type {
  ComputerCategory,
  ComputerItem,
  CustomWarehouse,
  NetworkDevice,
  NetworkDeviceType,
  ObjectItem,
  SoftwareCategory,
  SoftwareItem,
  WarehouseItem,
  WarehouseItemType,
  WarehouseWriteOff,
} from '../types';
import { allocateBatchInventoryNumbers, inventoryNumbersMatch, matchesBaseInventoryNumber, normalizeInventoryNumber } from './equipmentFields';
import type { EquipmentDeleteSource } from './equipmentDelete';
import {
  resolveNetworkDeviceType,
  resolveWarehouseComputerRoute,
  resolveStockObjectForWarehouse,
} from './warehouseRouting';
import { mergeWarehouseOnRestore, repairWarehousePendingDuplicates } from './warehousePendingMerge';

const WAREHOUSE_ITEM_TYPES = new Set<WarehouseItemType>([
  'Компьютеры',
  'Сетевое оборудование',
  'Периферия',
  'Оргтехника',
  'Видеонаблюдение',
  'Расходные материалы',
  'Лицензии ПО',
  'Другое',
]);

const SOFTWARE_CATEGORIES = new Set<SoftwareCategory>([
  'Системное ПО',
  'Операционные системы (ОС)',
  'Утилиты и антивирусы',
  'Офисные приложения',
  'Графические редакторы',
  'Корпоративные системы',
  'Иное ПО',
]);

const NETWORK_DEVICE_TYPES = new Set<NetworkDeviceType>([
  'Коммутатор',
  'Маршрутизатор',
  'Точка доступа',
  'Другое',
]);

const COMPUTER_CATEGORIES = new Set<ComputerCategory>([
  'ПК',
  'Ноутбук',
  'Периферия',
  'Монитор',
  'Оргтехника',
  'Видеонаблюдение',
  'Расходники',
  'Другое',
]);

export interface RestoreWriteOffContext {
  warehouseItems: WarehouseItem[];
  computers: ComputerItem[];
  networkDevices: NetworkDevice[];
  softwareItems: SoftwareItem[];
  warehouses: CustomWarehouse[];
  objects: ObjectItem[];
}

export interface RestoreWriteOffResult extends RestoreWriteOffContext {
  ok: boolean;
  errorKey?: string;
}

export function inferWriteOffSourceType(wo: WarehouseWriteOff): EquipmentDeleteSource {
  if (wo.sourceType) return wo.sourceType;
  if (WAREHOUSE_ITEM_TYPES.has(wo.type as WarehouseItemType)) return 'warehouse';
  if (SOFTWARE_CATEGORIES.has(wo.type as SoftwareCategory)) return 'software';
  if (NETWORK_DEVICE_TYPES.has(wo.type as NetworkDeviceType)) return 'network';
  if (COMPUTER_CATEGORIES.has(wo.name as ComputerCategory)) return 'computer';
  return 'warehouse';
}

function bumpWarehouseFromWriteOffAct(
  wo: WarehouseWriteOff,
  warehouseItems: WarehouseItem[]
): WarehouseItem[] {
  const inv = (wo.inventoryNumber || '').trim();
  if (!inv) return warehouseItems;
  const whName = wo.warehouseName || 'Основной склад ИТ';
  const qty = Math.max(1, Math.floor(wo.quantity));
  const { items } = mergeWarehouseOnRestore(
    warehouseItems,
    inv,
    whName,
    qty,
    wo.costPerUnit
  );
  return repairWarehousePendingDuplicates(items);
}

function appendStockComputerCards(
  item: Pick<WarehouseItem, 'type' | 'name' | 'model' | 'inventoryNumber' | 'costPerUnit' | 'monitorDiagonalInches' | 'photoUrl' | 'deviceType'>,
  quantity: number,
  objectName: string,
  computers: ComputerItem[]
): ComputerItem[] {
  const route = resolveWarehouseComputerRoute({
    type: item.type,
    deviceType: item.deviceType,
    name: item.name,
    model: item.model,
  });
  if (!route) return [];

  const registryInv: string[] = computers
    .map((c) => c.inventoryNumber?.trim())
    .filter((v): v is string => Boolean(v));
  const invNumbers = allocateBatchInventoryNumbers(
    item.inventoryNumber,
    registryInv,
    quantity
  );
  return invNumbers.map((invNum, i) => ({
    id: `comp-restored-${Date.now()}-${i}-${Math.floor(Math.random() * 10000)}`,
    category: route.category,
    deviceType: route.deviceType,
    model: item.model,
    inventoryNumber: invNum,
    employeeName: 'Склад ИТ',
    status: 'На складе' as const,
    objectName,
    cost: item.costPerUnit,
    photoUrl: item.photoUrl,
    monitorDiagonalInches: item.monitorDiagonalInches,
  }));
}

function restoreWarehouseLine(
  wo: WarehouseWriteOff,
  ctx: RestoreWriteOffContext
): RestoreWriteOffResult {
  const qty = Math.max(1, Math.floor(wo.quantity));
  const inv = (wo.inventoryNumber || '').trim();
  if (!inv) return { ...ctx, ok: false, errorKey: 'restore_missing_inventory' };

  const whName = wo.warehouseName || 'Основной склад ИТ';
  const warehouseType = wo.type as WarehouseItemType;
  const objectName =
    wo.objectName ||
    resolveStockObjectForWarehouse(
      wo.warehouseName || 'Основной склад ИТ',
      ctx.warehouses,
      ctx.objects
    );

  let warehouseItems = [...ctx.warehouseItems];
  const { items: mergedItems, mergedLine } = mergeWarehouseOnRestore(
    warehouseItems,
    inv,
    whName,
    qty,
    wo.costPerUnit
  );
  warehouseItems = mergedItems;

  let warehouseLine: WarehouseItem;
  if (mergedLine) {
    warehouseLine = mergedLine;
  } else {
    warehouseLine = {
      id: `wh-restored-${Date.now()}`,
      name: wo.name,
      type: warehouseType,
      model: wo.model,
      inventoryNumber: inv,
      quantity: qty,
      unit: wo.unit || 'шт.',
      costPerUnit: wo.costPerUnit || 0,
      status: 'В наличии',
      warehouseName: whName,
      receiptDate: new Date().toISOString().split('T')[0],
    };
    warehouseItems.push(warehouseLine);
  }

  let computers = [...ctx.computers];
  let networkDevices = [...ctx.networkDevices];
  let softwareItems = [...ctx.softwareItems];

  if (warehouseType === 'Сетевое оборудование') {
    const net = networkDevices.find((n) => inventoryNumbersMatch(n.inventoryNumber, inv));
    if (net) {
      networkDevices = networkDevices.map((n) =>
        n.id === net.id
          ? {
              ...n,
              quantity: (n.quantity || 1) + qty,
              status: 'На складе' as const,
              cost: wo.costPerUnit || n.cost,
            }
          : n
      );
    } else {
      networkDevices.push({
        id: `net-restored-${Date.now()}`,
        deviceName: wo.name,
        type: resolveNetworkDeviceType({ name: wo.name, deviceType: wo.model }),
        objectName,
        ipAddress: '192.168.1.1',
        quantity: qty,
        inventoryNumber: inv,
        portsCount: 24,
        workingPorts: Array.from({ length: 24 }, (_, i) => i + 1),
        damagedPorts: [],
        cost: wo.costPerUnit,
        status: 'На складе',
      });
    }
  } else if (warehouseType === 'Лицензии ПО') {
    const soft = softwareItems.find(
      (s) =>
        (s.licenseKey && s.licenseKey === inv) ||
        (s.name === wo.name && s.developer === wo.model)
    );
    if (soft) {
      softwareItems = softwareItems.map((s) =>
        s.id === soft.id
          ? {
              ...s,
              quantity: (s.quantity || 1) + qty,
              status: 'Не активирована' as const,
              cost: wo.costPerUnit || s.cost,
            }
          : s
      );
    } else {
      softwareItems.push({
        id: `soft-restored-${Date.now()}`,
        name: wo.name,
        category: 'Иное ПО',
        licenseKey: inv,
        version: '',
        developer: wo.model,
        quantity: qty,
        assignedEmployeeName: '',
        objectName,
        status: 'Не активирована',
        cost: wo.costPerUnit,
      });
    }
  } else {
    const additions = appendStockComputerCards(warehouseLine, qty, objectName, computers);
    computers = [...computers, ...additions];
  }

  return {
    ...ctx,
    warehouseItems: repairWarehousePendingDuplicates(warehouseItems),
    computers,
    networkDevices,
    softwareItems,
    ok: true,
  };
}

function restoreComputerLine(
  wo: WarehouseWriteOff,
  ctx: RestoreWriteOffContext
): RestoreWriteOffResult {
  const inv = (wo.inventoryNumber || '').trim();
  if (!inv) return { ...ctx, ok: false, errorKey: 'restore_missing_inventory' };
  if (
    ctx.computers.some(
      (c) => normalizeInventoryNumber(c.inventoryNumber) === normalizeInventoryNumber(inv)
    )
  ) {
    return { ...ctx, ok: false, errorKey: 'restore_inventory_exists' };
  }

  const objectName =
    wo.objectName ||
    resolveStockObjectForWarehouse(
      wo.warehouseName || 'Основной склад ИТ',
      ctx.warehouses,
      ctx.objects
    );
  const category = (COMPUTER_CATEGORIES.has(wo.name as ComputerCategory)
    ? wo.name
    : 'Другое') as ComputerCategory;

  const computer: ComputerItem = {
    id: `comp-restored-${Date.now()}`,
    category,
    deviceType: wo.type !== wo.name ? wo.type : undefined,
    model: wo.model,
    inventoryNumber: inv,
    employeeName: wo.objectName ? 'Общего пользования' : 'Склад ИТ',
    status: 'На складе',
    objectName,
    cost: wo.costPerUnit,
  };

  return {
    ...ctx,
    warehouseItems: bumpWarehouseFromWriteOffAct(wo, ctx.warehouseItems),
    computers: [...ctx.computers, computer],
    ok: true,
  };
}

function restoreNetworkLine(
  wo: WarehouseWriteOff,
  ctx: RestoreWriteOffContext
): RestoreWriteOffResult {
  const qty = Math.max(1, Math.floor(wo.quantity));
  const inv = (wo.inventoryNumber || '').trim();
  const objectName =
    wo.objectName ||
    resolveStockObjectForWarehouse(
      wo.warehouseName || 'Основной склад ИТ',
      ctx.warehouses,
      ctx.objects
    );

  const net = ctx.networkDevices.find((n) => inventoryNumbersMatch(n.inventoryNumber, inv));
  let networkDevices = [...ctx.networkDevices];
  if (net) {
    networkDevices = networkDevices.map((n) =>
      n.id === net.id
        ? {
            ...n,
            quantity: (n.quantity || 1) + qty,
            status: 'В работе' as const,
            cost: wo.costPerUnit || n.cost,
          }
        : n
    );
  } else {
    networkDevices.push({
      id: `net-restored-${Date.now()}`,
      deviceName: wo.name,
      type: (NETWORK_DEVICE_TYPES.has(wo.type as NetworkDeviceType)
        ? wo.type
        : 'Другое') as NetworkDeviceType,
      objectName,
      ipAddress: '192.168.1.1',
      quantity: qty,
      inventoryNumber: inv || `NET-${Date.now()}`,
      portsCount: 24,
      workingPorts: Array.from({ length: 24 }, (_, i) => i + 1),
      damagedPorts: [],
      cost: wo.costPerUnit,
      status: 'В работе',
    });
  }

  return {
    ...ctx,
    warehouseItems: bumpWarehouseFromWriteOffAct(wo, ctx.warehouseItems),
    networkDevices,
    ok: true,
  };
}

function restoreSoftwareLine(
  wo: WarehouseWriteOff,
  ctx: RestoreWriteOffContext
): RestoreWriteOffResult {
  const qty = Math.max(1, Math.floor(wo.quantity));
  const inv = (wo.inventoryNumber || '').trim();
  const objectName =
    wo.objectName ||
    resolveStockObjectForWarehouse(
      wo.warehouseName || 'Основной склад ИТ',
      ctx.warehouses,
      ctx.objects
    );

  const soft = ctx.softwareItems.find(
    (s) =>
      (inv && s.licenseKey === inv) ||
      (s.name === wo.name && (s.developer === wo.model || s.category === wo.type))
  );
  let softwareItems = [...ctx.softwareItems];
  if (soft) {
    softwareItems = softwareItems.map((s) =>
      s.id === soft.id
        ? {
            ...s,
            quantity: (s.quantity || 1) + qty,
            status: 'Активна' as const,
            cost: wo.costPerUnit || s.cost,
          }
        : s
    );
  } else {
    softwareItems.push({
      id: `soft-restored-${Date.now()}`,
      name: wo.name,
      category: (SOFTWARE_CATEGORIES.has(wo.type as SoftwareCategory)
        ? wo.type
        : 'Иное ПО') as SoftwareCategory,
      licenseKey: inv || `LIC-${Date.now()}`,
      version: '',
      developer: wo.model,
      quantity: qty,
      assignedEmployeeName: wo.author || '',
      objectName,
      status: 'Активна',
      cost: wo.costPerUnit,
    });
  }

  return {
    ...ctx,
    warehouseItems: bumpWarehouseFromWriteOffAct(wo, ctx.warehouseItems),
    softwareItems,
    ok: true,
  };
}

export function applyWriteOffRestore(
  wo: WarehouseWriteOff,
  ctx: RestoreWriteOffContext
): RestoreWriteOffResult {
  if (wo.restoredAt) {
    return { ...ctx, ok: false, errorKey: 'restore_already_restored' };
  }

  const sourceType = inferWriteOffSourceType(wo);
  switch (sourceType) {
    case 'warehouse':
      return restoreWarehouseLine(wo, ctx);
    case 'computer':
      return restoreComputerLine(wo, ctx);
    case 'network':
      return restoreNetworkLine(wo, ctx);
    case 'software':
      return restoreSoftwareLine(wo, ctx);
    default:
      return { ...ctx, ok: false, errorKey: 'restore_unknown_source' };
  }
}
