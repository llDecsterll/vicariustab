/**
 * Pure warehouse lifecycle engine for receipt → split → deploy → write-off simulations.
 * Mirrors App.tsx handlers without React state.
 */
import type {
  ComputerItem,
  CustomWarehouse,
  NetworkDevice,
  SoftwareItem,
  WarehouseItem,
  WarehouseItemType,
} from '../types';
import {
  allocateBatchInventoryNumbers,
  allocateNextSplitPartIndex,
  buildComputerSpecsFromReceipt,
  formatSplitWarehouseInventoryNumber,
  getSplitRootInventoryNumber,
  getWarehouseItemSpecs,
  getWarehouseLineInventoryKey,
  inventoryNumbersMatch,
  isActiveWarehouseStockLine,
  limitEquipmentTitle,
  matchesBaseInventoryNumber,
  normalizeInventoryNumber,
  normalizePositiveInt,
  purgeWrittenOffRegistry,
} from './equipmentFields';
import {
  countRegistryUnitsForWarehouseBatch,
  findSoftwareIdsForWarehouseItem,
  pickStockComputerIdsForWriteOff,
  warehouseItemLinksSoftware,
} from './equipmentDelete';
import { applyMarkForWriteOff } from './markPendingWriteOff';
import { repairWarehousePendingDuplicates } from './warehousePendingMerge';
import {
  resolveNetworkDeviceType,
  resolveWarehouseComputerRoute,
} from './warehouseRouting';

export interface WarehouseLifecycleState {
  warehouseItems: WarehouseItem[];
  computers: ComputerItem[];
  networkDevices: NetworkDevice[];
  softwareItems: SoftwareItem[];
  warehouses: CustomWarehouse[];
  defaultObjectName: string;
}

export const RECEIPT_DEVICE_TYPES: Record<WarehouseItemType, string[]> = {
  Компьютеры: ['Ноутбук', 'ПК', 'Моноблок', 'Неттоп', 'Сервер'],
  'Сетевое оборудование': ['Маршрутизатор', 'Коммутатор', 'Точка доступа', 'Другое'],
  Периферия: ['Монитор', 'Клавиатура', 'Мышь', 'Клавиатура + Мышь', 'Веб-камера', 'Другое'],
  Оргтехника: ['МФУ', 'Принтер', 'Сканер', 'Другое'],
  Видеонаблюдение: ['Видеокамера', 'Видеорегистратор', 'Другое'],
  'Расходные материалы': ['Картриджи', 'Расходные материалы для МФУ', 'Расходники', 'Провода'],
  'Лицензии ПО': ['Лицензионный ключ ПО', 'Подписка', 'Бессрочная лицензия', 'Другое'],
  Другое: ['Другое'],
};

export function createEmptyLifecycleState(): WarehouseLifecycleState {
  return {
    warehouseItems: [],
    computers: [],
    networkDevices: [],
    softwareItems: [],
    warehouses: [
      {
        id: 'wh-main',
        name: 'Основной склад ИТ',
        objectName: 'Office',
        description: '',
      },
    ],
    defaultObjectName: 'Office',
  };
}

function allInvNumbers(state: WarehouseLifecycleState): string[] {
  const nums: string[] = [];
  for (const w of state.warehouseItems) {
    if (w.inventoryNumber?.trim()) nums.push(w.inventoryNumber.trim());
  }
  for (const c of state.computers) {
    if (c.inventoryNumber?.trim()) nums.push(c.inventoryNumber.trim());
  }
  for (const n of state.networkDevices) {
    if (n.inventoryNumber?.trim()) nums.push(n.inventoryNumber.trim());
  }
  return nums;
}

function stockComputerCards(
  state: WarehouseLifecycleState,
  lineKey: string
): ComputerItem[] {
  const rank = (inv: string) => {
    const cur = (inv || '').trim();
    if (cur === lineKey) return 0;
    const m = cur.match(/-(\d+)$/);
    return m ? parseInt(m[1], 10) : 999;
  };
  return state.computers
    .filter(
      (c) =>
        matchesBaseInventoryNumber(c.inventoryNumber, lineKey) &&
        c.status === 'На складе'
    )
    .sort(
      (a, b) =>
        rank(a.inventoryNumber || '') - rank(b.inventoryNumber || '')
    );
}

export function receiptWarehouseItem(
  state: WarehouseLifecycleState,
  item: {
    type: WarehouseItemType;
    deviceType: string;
    name: string;
    model: string;
    inventoryNumber: string;
    quantity: number;
    costPerUnit?: number;
  }
): WarehouseLifecycleState {
  const normalizedItem = {
    ...item,
    name: limitEquipmentTitle(item.name.trim()),
    model: limitEquipmentTitle(item.model.trim()),
    quantity: normalizePositiveInt(item.quantity),
    unit: 'шт.' as const,
    costPerUnit: item.costPerUnit ?? 1000,
    warehouseName: 'Основной склад ИТ',
  };
  const receiptSpecs = getWarehouseItemSpecs({
    ...normalizedItem,
    id: 'receipt-temp',
    status: 'В наличии',
  });
  const defaultObjectName = state.defaultObjectName;

  let warehouseItems = [...state.warehouseItems];
  const matchedExisting = warehouseItems.find(
    (w) =>
      inventoryNumbersMatch(w.inventoryNumber, normalizedItem.inventoryNumber) &&
      (w.warehouseName || 'Основной склад ИТ') === normalizedItem.warehouseName &&
      isActiveWarehouseStockLine(w)
  );

  if (matchedExisting) {
    warehouseItems = warehouseItems.map((w) =>
      w.id === matchedExisting.id
        ? { ...w, quantity: w.quantity + normalizedItem.quantity }
        : w
    );
  } else {
    warehouseItems.push({
      id: `wh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      status: 'В наличии',
      receiptDate: new Date().toISOString().split('T')[0],
      deviceType: normalizedItem.deviceType,
      ...normalizedItem,
    });
  }

  let computers = [...state.computers];
  let networkDevices = [...state.networkDevices];
  let softwareItems = [...state.softwareItems];

  const isReplenishment = Boolean(matchedExisting);
  const receiptDelta = normalizedItem.quantity;
  const targetWhQty = isReplenishment
    ? (matchedExisting!.quantity + receiptDelta)
    : receiptDelta;

  if (normalizedItem.type === 'Сетевое оборудование') {
    const existingNet = networkDevices.find(
      (nd) =>
        inventoryNumbersMatch(nd.inventoryNumber, normalizedItem.inventoryNumber) &&
        nd.objectName === defaultObjectName
    );
    if (existingNet) {
      networkDevices = networkDevices.map((nd) =>
        nd.id === existingNet.id
          ? { ...nd, quantity: (nd.quantity || 1) + receiptDelta }
          : nd
      );
    } else {
      networkDevices.push({
        id: `net-wh-${Date.now()}`,
        deviceName: normalizedItem.name,
        type: resolveNetworkDeviceType({
          deviceType: normalizedItem.deviceType,
          name: normalizedItem.name,
        }),
        objectName: defaultObjectName,
        ipAddress: '192.168.1.1',
        quantity: receiptDelta,
        inventoryNumber: normalizedItem.inventoryNumber,
        portsCount: 24,
        workingPorts: Array.from({ length: 24 }, (_, i) => i + 1),
        damagedPorts: [],
        cost: normalizedItem.costPerUnit,
      });
    }
  } else if (normalizedItem.type === 'Лицензии ПО') {
    const whRef: WarehouseItem = {
      id: matchedExisting?.id || `wh-ref`,
      name: normalizedItem.name,
      type: 'Лицензии ПО',
      model: normalizedItem.model,
      inventoryNumber: normalizedItem.inventoryNumber,
      quantity: targetWhQty,
      unit: 'шт.',
      costPerUnit: normalizedItem.costPerUnit,
      status: 'В наличии',
      warehouseName: normalizedItem.warehouseName,
    };
    const linkedSoft = softwareItems.find((s) => warehouseItemLinksSoftware(whRef, s));
    if (linkedSoft) {
      softwareItems = softwareItems.map((s) =>
        s.id === linkedSoft.id
          ? { ...s, quantity: (s.quantity || 1) + receiptDelta }
          : s
      );
    } else {
      softwareItems.push({
        id: `soft-wh-${Date.now()}`,
        name: normalizedItem.name,
        category: 'Иное ПО',
        licenseKey: normalizedItem.inventoryNumber,
        version: normalizedItem.model,
        developer: '',
        quantity: receiptDelta,
        assignedEmployeeName: '',
        objectName: defaultObjectName,
        status: 'Не активирована',
        purchaseDate: new Date().toISOString().split('T')[0],
        cost: normalizedItem.costPerUnit,
      });
    }
  } else {
    const route = resolveWarehouseComputerRoute(normalizedItem);
    if (route) {
      const existingUnits = countRegistryUnitsForWarehouseBatch(
        normalizedItem.inventoryNumber,
        computers,
        networkDevices,
        softwareItems
      );
      const cardsToAdd = isReplenishment
        ? Math.max(0, targetWhQty - existingUnits)
        : receiptDelta;
      if (cardsToAdd > 0) {
        const unitInvNumbers = allocateBatchInventoryNumbers(
          normalizedItem.inventoryNumber,
          allInvNumbers({ ...state, warehouseItems, computers, networkDevices, softwareItems }),
          cardsToAdd
        );
        for (let i = 0; i < cardsToAdd; i++) {
          const invNum =
            unitInvNumbers[i] ||
            `${normalizedItem.inventoryNumber}${cardsToAdd > 1 ? `-${i + 1}` : ''}`;
          computers.push({
            id: `comp-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 5)}`,
            category: route.category,
            deviceType: route.deviceType,
            model: normalizedItem.model,
            inventoryNumber: invNum,
            employeeName: 'Склад ИТ',
            status: 'На складе',
            objectName: defaultObjectName,
            cost: normalizedItem.costPerUnit,
            ...buildComputerSpecsFromReceipt(receiptSpecs, i, cardsToAdd),
          });
        }
      }
    }
  }

  return repairState({
    ...state,
    warehouseItems: repairWarehousePendingDuplicates(warehouseItems),
    computers,
    networkDevices,
    softwareItems,
  });
}

function repairState(s: WarehouseLifecycleState): WarehouseLifecycleState {
  return {
    ...s,
    warehouseItems: repairWarehousePendingDuplicates(s.warehouseItems),
  };
}

export function splitWarehouseItem(
  state: WarehouseLifecycleState,
  id: string,
  splitQty: number
): WarehouseLifecycleState | null {
  const source = state.warehouseItems.find((w) => w.id === id);
  if (!source || !isActiveWarehouseStockLine(source)) return null;
  const take = normalizePositiveInt(splitQty);
  if (take < 1 || take > source.quantity) return null;

  const isNetwork = source.type === 'Сетевое оборудование';
  const isSoftware = source.type === 'Лицензии ПО';
  const sourceLineKey = getWarehouseLineInventoryKey(source.inventoryNumber);
  const rootBase = getSplitRootInventoryNumber(
    source.inventoryNumber,
    source.splitFromInventoryNumber
  );
  const cards = stockComputerCards(state, sourceLineKey);
  if (!isNetwork && !isSoftware && cards.length > 0 && take > cards.length) {
    return null;
  }

  if (isNetwork) {
    const matchingNetwork = state.networkDevices.find((n) =>
      inventoryNumbersMatch(n.inventoryNumber, sourceLineKey)
    );
    if (matchingNetwork && take > (matchingNetwork.quantity || 1)) return null;
  }

  const receiptSpecs = getWarehouseItemSpecs(source);
  let nextPartIndex = allocateNextSplitPartIndex(rootBase, state.warehouseItems);
  const splitInv = formatSplitWarehouseInventoryNumber(rootBase, nextPartIndex);
  const splitLineId = `wh-split-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const cardReassignments = new Map<string, string>();
  const cardsToMove = cards.slice(0, take);
  const newInvNums = allocateBatchInventoryNumbers(
    splitInv,
    allInvNumbers(state),
    cardsToMove.length
  );
  cardsToMove.forEach((card, idx) => {
    cardReassignments.set(card.id, newInvNums[idx] || splitInv);
  });

  let warehouseItems = state.warehouseItems
    .map((w) => {
      if (w.id !== id) return w;
      const remaining = w.quantity - take;
      if (remaining <= 0) return null;
      return { ...w, quantity: remaining };
    })
    .filter((w): w is WarehouseItem => w !== null);

  warehouseItems.push({
    ...source,
    ...receiptSpecs,
    id: splitLineId,
    inventoryNumber: splitInv,
    quantity: take,
    status: 'В наличии',
    splitFromInventoryNumber: rootBase,
    splitPartIndex: nextPartIndex,
  });

  let computers = state.computers.map((c) =>
    cardReassignments.has(c.id)
      ? { ...c, inventoryNumber: cardReassignments.get(c.id)! }
      : c
  );

  let networkDevices = [...state.networkDevices];
  if (isNetwork) {
    const matchingNetwork = networkDevices.find((n) =>
      inventoryNumbersMatch(n.inventoryNumber, sourceLineKey)
    );
    if (matchingNetwork) {
      const remainingQty = (matchingNetwork.quantity || 1) - take;
      networkDevices = [
        ...networkDevices
          .map((n) =>
            n.id === matchingNetwork.id
              ? remainingQty > 0
                ? { ...n, quantity: remainingQty }
                : null
              : n
          )
          .filter((n): n is NetworkDevice => n !== null),
        {
          ...matchingNetwork,
          id: `net-split-${Date.now()}`,
          inventoryNumber: splitInv,
          quantity: take,
          objectName: state.defaultObjectName,
        },
      ];
    }
  }

  let softwareItems = [...state.softwareItems];
  if (isSoftware) {
    const linkedSoft = softwareItems.find((s) => warehouseItemLinksSoftware(source, s));
    if (linkedSoft) {
      const remainingQty = (linkedSoft.quantity || 1) - take;
      softwareItems = [
        ...softwareItems
          .map((s) =>
            s.id === linkedSoft.id
              ? remainingQty > 0
                ? { ...s, quantity: remainingQty }
                : null
              : s
          )
          .filter((s): s is SoftwareItem => s !== null),
        {
          ...linkedSoft,
          id: `soft-split-${Date.now()}`,
          licenseKey: splitInv,
          quantity: take,
          status: 'Не активирована',
        },
      ];
    }
  }

  return repairState({
    ...state,
    warehouseItems,
    computers,
    networkDevices,
    softwareItems,
  });
}

export function deployFromWarehouse(
  state: WarehouseLifecycleState,
  warehouseItemId: string,
  quantity: number,
  employeeName: string,
  objectName: string
): WarehouseLifecycleState | null {
  const whItem = state.warehouseItems.find(
    (w) => w.id === warehouseItemId && w.quantity > 0 && w.status !== 'Списано' && w.status !== 'На списание'
  );
  if (!whItem) return null;
  const deployQty = normalizePositiveInt(quantity);
  if (deployQty < 1 || deployQty > whItem.quantity) return null;

  const lineKey = getWarehouseLineInventoryKey(whItem.inventoryNumber);
  const isNetwork = whItem.type === 'Сетевое оборудование';
  const isSoftware = whItem.type === 'Лицензии ПО';

  if (!isNetwork && !isSoftware) {
    const onStock = stockComputerCards(state, lineKey);
    if (onStock.length < deployQty && !resolveWarehouseComputerRoute(whItem)) return null;
  }

  let warehouseItems = state.warehouseItems
    .map((w) =>
      w.id === whItem.id ? { ...w, quantity: w.quantity - deployQty } : w
    )
    .filter((w) => w.quantity > 0);

  let computers = [...state.computers];
  let networkDevices = [...state.networkDevices];
  let softwareItems = [...state.softwareItems];

  if (isSoftware) {
    const softIds = findSoftwareIdsForWarehouseItem(whItem, softwareItems);
    const storedSoft =
      softwareItems.find((s) => softIds.includes(s.id) && s.status === 'Не активирована') ||
      softwareItems.find((s) => softIds.includes(s.id));
    if (!storedSoft) return null;
    const softTotal = storedSoft.quantity || 1;
    if (deployQty >= softTotal) {
      softwareItems = softwareItems.map((s) =>
        s.id === storedSoft.id
          ? {
              ...s,
              status: 'Активна',
              assignedEmployeeName: employeeName,
              objectName,
            }
          : s
      );
    } else {
      softwareItems = [
        ...softwareItems.map((s) =>
          s.id === storedSoft.id ? { ...s, quantity: softTotal - deployQty } : s
        ),
        {
          ...storedSoft,
          id: `soft-deploy-${Date.now()}`,
          quantity: deployQty,
          status: 'Активна',
          assignedEmployeeName: employeeName,
          objectName,
        },
      ];
    }
  } else if (isNetwork) {
    const matchingNetwork = networkDevices.find((n) =>
      inventoryNumbersMatch(n.inventoryNumber, lineKey)
    );
    if (!matchingNetwork) return null;
    if (deployQty >= (matchingNetwork.quantity || 1)) {
      networkDevices = networkDevices.map((n) =>
        n.id === matchingNetwork.id
          ? { ...n, objectName, status: 'В работе' as const }
          : n
      );
    } else {
      networkDevices = [
        ...networkDevices.map((n) =>
          n.id === matchingNetwork.id
            ? { ...n, quantity: (n.quantity || 1) - deployQty }
            : n
        ),
        {
          ...matchingNetwork,
          id: `net-deploy-${Date.now()}`,
          quantity: deployQty,
          objectName,
          status: 'В работе' as const,
        },
      ];
    }
  } else {
    const onStock = stockComputerCards({ ...state, computers }, lineKey);
    const idsToDeploy = onStock.slice(0, deployQty).map((c) => c.id);
    computers = computers.map((c) =>
      idsToDeploy.includes(c.id)
        ? {
            ...c,
            status: 'В работе' as const,
            employeeName,
            objectName,
          }
        : c
    );
  }

  return repairState({
    ...state,
    warehouseItems,
    computers,
    networkDevices,
    softwareItems,
  });
}

export function writeOffWarehouseLine(
  state: WarehouseLifecycleState,
  warehouseItemId: string,
  quantity: number
): WarehouseLifecycleState | null {
  const wh = state.warehouseItems.find((w) => w.id === warehouseItemId);
  if (!wh) return null;
  const qty = normalizePositiveInt(quantity);
  const whQty = normalizePositiveInt(wh.quantity);
  if (qty < 1 || qty > whQty) return null;

  const resolvedInvKey = normalizeInventoryNumber(
    getSplitRootInventoryNumber(wh.inventoryNumber, wh.splitFromInventoryNumber)
  );
  const newQty = whQty - qty;
  const purgePendingLinked = newQty <= 0;

  const stockIdsToRemove = pickStockComputerIdsForWriteOff(
    wh,
    state.computers,
    state.warehouses,
    qty
  );
  const removeSet = new Set(stockIdsToRemove);

  let computers = state.computers.filter((c) => !removeSet.has(c.id));
  let networkDevices = [...state.networkDevices];
  let softwareItems = [...state.softwareItems];

  if (wh.type === 'Сетевое оборудование') {
    const whLineKey = getWarehouseLineInventoryKey(wh.inventoryNumber);
    const net = networkDevices.find(
      (n) =>
        inventoryNumbersMatch(n.inventoryNumber, whLineKey) &&
        (n.status === 'На складе' || n.status === 'В работе' || !n.status)
    );
    if (net) {
      const netNewQty = (net.quantity || 1) - qty;
      networkDevices = networkDevices.flatMap((n) => {
        if (n.id !== net.id) return [n];
        if (netNewQty <= 0) return [];
        return [{ ...n, quantity: netNewQty, status: 'В работе' as const }];
      });
    }
  }

  if (wh.type === 'Лицензии ПО') {
    const softIds = findSoftwareIdsForWarehouseItem(wh, softwareItems);
    let remaining = qty;
    softwareItems = softwareItems.flatMap((s) => {
      if (!softIds.includes(s.id) || remaining <= 0) return [s];
      const take = Math.min(remaining, s.quantity || 1);
      remaining -= take;
      const softNewQty = (s.quantity || 1) - take;
      if (softNewQty <= 0) return [];
      return [{ ...s, quantity: softNewQty, status: 'Активна' as const }];
    });
  }

  let warehouseItems = state.warehouseItems.flatMap((w) => {
    if (w.id !== warehouseItemId) return [w];
    if (newQty <= 0) return [];
    return [{ ...w, quantity: newQty, status: 'В наличии' as const }];
  });

  const purged = purgeWrittenOffRegistry(
    { warehouseItems, computers, networkDevices, softwareItems },
    resolvedInvKey,
    {
      purgePendingLinked,
      exactInventoryMatch: newQty > 0,
    }
  );

  return repairState({ ...state, ...purged });
}

export function totalStockQuantityForRoot(
  state: WarehouseLifecycleState,
  rootInv: string
): number {
  const root = rootInv.trim();
  return state.warehouseItems
    .filter(
      (w) =>
        w.status === 'В наличии' &&
        w.quantity > 0 &&
        getSplitRootInventoryNumber(w.inventoryNumber, w.splitFromInventoryNumber) === root
    )
    .reduce((sum, w) => sum + w.quantity, 0);
}

export interface ScenarioConfig {
  type: WarehouseItemType;
  deviceType: string;
  label: string;
  invNumber: string;
  batchQty: number;
}

export interface ScenarioResult {
  ok: boolean;
  error?: string;
  finalState?: WarehouseLifecycleState;
}

/** 100 → split 50 → deploy 50 → split 25 → write-off 25 → stock 25 */
export function runWarehouseBatchScenario(
  config: ScenarioConfig
): ScenarioResult {
  const { type, deviceType, label, invNumber, batchQty } = config;
  const half = Math.floor(batchQty / 2);
  const quarter = Math.floor(batchQty / 4);

  if (half + half !== batchQty || quarter * 4 !== batchQty) {
    return { ok: false, error: `batchQty ${batchQty} must be divisible by 4` };
  }

  let state = createEmptyLifecycleState();

  state = receiptWarehouseItem(state, {
    type,
    deviceType,
    name: label,
    model: 'TestModel',
    inventoryNumber: invNumber,
    quantity: batchQty,
  });

  const mainLine = state.warehouseItems.find(
    (w) =>
      w.inventoryNumber === invNumber &&
      w.status === 'В наличии' &&
      w.quantity === batchQty
  );
  if (!mainLine) {
    return { ok: false, error: 'receipt: main warehouse line missing' };
  }

  const afterSplit1 = splitWarehouseItem(state, mainLine.id, half);
  if (!afterSplit1) {
    return { ok: false, error: 'split 50% failed' };
  }
  state = afterSplit1;

  const splitLine = state.warehouseItems.find(
    (w) =>
      w.status === 'В наличии' &&
      w.quantity === half &&
      w.inventoryNumber.includes('/р')
  );
  if (!splitLine) {
    return { ok: false, error: 'split line not created' };
  }

  const afterDeploy = deployFromWarehouse(
    state,
    splitLine.id,
    half,
    'Иванов И.И.',
    state.defaultObjectName
  );
  if (!afterDeploy) {
    return { ok: false, error: 'deploy 50% failed' };
  }
  state = afterDeploy;

  const remainderLine = state.warehouseItems.find(
    (w) =>
      w.status === 'В наличии' &&
      w.quantity === half &&
      !w.inventoryNumber.includes('/р')
  );
  if (!remainderLine) {
    return { ok: false, error: 'remainder line after deploy missing' };
  }

  const afterSplit2 = splitWarehouseItem(state, remainderLine.id, quarter);
  if (!afterSplit2) {
    return { ok: false, error: 'split 25% failed' };
  }
  state = afterSplit2;

  const writeOffLine = state.warehouseItems.find(
    (w) =>
      w.status === 'В наличии' &&
      w.quantity === quarter &&
      w.inventoryNumber.includes('/р') &&
      w.id !== splitLine.id
  );
  if (!writeOffLine) {
    return { ok: false, error: 'write-off candidate line missing' };
  }

  const afterWriteOff = writeOffWarehouseLine(state, writeOffLine.id, quarter);
  if (!afterWriteOff) {
    return { ok: false, error: 'write-off 25% failed' };
  }
  state = afterWriteOff;

  const stockLeft = totalStockQuantityForRoot(state, invNumber);
  if (stockLeft !== quarter) {
    return {
      ok: false,
      error: `expected ${quarter} on stock, got ${stockLeft}`,
      finalState: state,
    };
  }

  const stockLine = state.warehouseItems.find(
    (w) =>
      w.status === 'В наличии' &&
      w.quantity === quarter &&
      getSplitRootInventoryNumber(w.inventoryNumber, w.splitFromInventoryNumber) === invNumber
  );
  if (!stockLine) {
    return { ok: false, error: 'final stock line missing' };
  }

  const markTest = applyMarkForWriteOff('warehouse', stockLine.id, 1, {
    warehouseItems: state.warehouseItems,
    computers: state.computers,
    networkDevices: state.networkDevices,
    softwareItems: state.softwareItems,
    warehouses: state.warehouses,
  });
  if (!markTest.ok) {
    return { ok: false, error: 'mark pending 1 failed' };
  }

  return { ok: true, finalState: state };
}
