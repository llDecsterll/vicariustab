import type { NetworkDevice, SoftwareItem, WarehouseItem } from '../types';
import {
  getSplitRootInventoryNumber,
  inventoryNumbersMatch,
  normalizeInventoryNumber,
} from './equipmentFields';
import { isNotLinkedToInventoryKey } from './equipmentDelete';

function warehouseNameOf(item: { warehouseName?: string }): string {
  return item.warehouseName || 'Основной склад ИТ';
}

function sameWarehouseBatch(
  a: Pick<WarehouseItem, 'inventoryNumber' | 'warehouseName'>,
  b: Pick<WarehouseItem, 'inventoryNumber' | 'warehouseName'>
): boolean {
  return (
    inventoryNumbersMatch(a.inventoryNumber, b.inventoryNumber) &&
    warehouseNameOf(a) === warehouseNameOf(b)
  );
}

/** Складская строка «В наличии» — остаток после частичной отправки на списание (по корневому инв. №). */
export function findWarehouseMergeSibling(
  items: WarehouseItem[],
  pending: WarehouseItem,
  excludeId: string
): WarehouseItem | undefined {
  const stockSibling = findWarehouseStockSibling(items, pending, excludeId);
  if (stockSibling) return stockSibling;

  const rootInv = getSplitRootInventoryNumber(
    pending.inventoryNumber,
    pending.splitFromInventoryNumber
  );

  return items.find(
    (w) =>
      w.id !== excludeId &&
      w.status === 'В наличии' &&
      warehouseNameOf(w) === warehouseNameOf(pending) &&
      (inventoryNumbersMatch(w.inventoryNumber, rootInv) ||
        getSplitRootInventoryNumber(w.inventoryNumber, w.splitFromInventoryNumber) === rootInv)
  );
}

/**
 * Убрать дубли инв. № на складе: объединить pending-строку с остатком или несколько строк «В наличии».
 * Исправляет данные после частичного списания до внедрения уникальных номеров pending-строк.
 */
export function repairWarehousePendingDuplicates(
  items: WarehouseItem[]
): WarehouseItem[] {
  const groupKey = (w: WarehouseItem) =>
    `${warehouseNameOf(w)}::${(w.inventoryNumber || '').trim().toLowerCase()}`;

  const byKey = new Map<string, WarehouseItem[]>();
  for (const w of items) {
    const inv = (w.inventoryNumber || '').trim();
    if (!inv || inv.toUpperCase() === 'NET-EQ') continue;
    const list = byKey.get(groupKey(w)) || [];
    list.push(w);
    byKey.set(groupKey(w), list);
  }

  let result = items;
  for (const [, group] of byKey) {
    if (group.length < 2) continue;

    const inStock = group.filter((w) => w.status === 'В наличии');
    const pending = group.filter((w) => w.status === 'На списание');

    if (inStock.length >= 1 && pending.length >= 1) {
      const target = inStock[0];
      const extraQty = pending.reduce((sum, w) => sum + w.quantity, 0);
      const removeIds = new Set([
        ...pending.map((w) => w.id),
        ...inStock.slice(1).map((w) => w.id),
      ]);
      result = result
        .filter((w) => !removeIds.has(w.id))
        .map((w) =>
          w.id === target.id ? { ...w, quantity: w.quantity + extraQty } : w
        );
    } else if (inStock.length >= 2) {
      const target = inStock[0];
      const extraQty = inStock.slice(1).reduce((sum, w) => sum + w.quantity, 0);
      const removeIds = new Set(inStock.slice(1).map((w) => w.id));
      result = result
        .filter((w) => !removeIds.has(w.id))
        .map((w) =>
          w.id === target.id ? { ...w, quantity: w.quantity + extraQty } : w
        );
    }
  }

  return result;
}

function findWarehouseStockSibling(
  items: WarehouseItem[],
  line: WarehouseItem,
  excludeId?: string
): WarehouseItem | undefined {
  const skipId = excludeId ?? line.id;
  return items.find(
    (w) =>
      w.id !== skipId &&
      w.status === 'В наличии' &&
      sameWarehouseBatch(w, line)
  );
}

/**
 * Возврат из очереди списания: объединить pending-строку с остатком или снять статус «На списание».
 */
export function mergeWarehousePendingOnCancel(
  items: WarehouseItem[],
  pendingId: string
): WarehouseItem[] {
  const pending = items.find((w) => w.id === pendingId);
  if (!pending) return items;

  const sibling = findWarehouseMergeSibling(items, pending, pendingId);
  if (sibling) {
    return items
      .filter((w) => w.id !== pendingId)
      .map((w) =>
        w.id === sibling.id
          ? { ...w, quantity: w.quantity + pending.quantity }
          : w
      );
  }

  if (pending.status === 'На списание') {
    return items.map((w) =>
      w.id === pendingId ? { ...w, status: 'В наличии' as const } : w
    );
  }

  return items;
}

/**
 * Восстановление из истории: прибавить количество к строке «В наличии» и убрать дубликаты с тем же инв. №.
 * Дубликаты (например, остаток после частичной отправки на списание) удаляются без суммирования —
 * восстанавливаемое количество уже отражено в акте списания.
 */
export function mergeWarehouseOnRestore(
  items: WarehouseItem[],
  inv: string,
  whName: string,
  qty: number,
  costPerUnit?: number
): { items: WarehouseItem[]; mergedLine: WarehouseItem | null } {
  const batch = items.filter((w) =>
    sameWarehouseBatch(w, { inventoryNumber: inv, warehouseName: whName })
  );

  if (batch.length === 0) {
    return { items, mergedLine: null };
  }

  const stockLine = batch.find((w) => w.status === 'В наличии');
  const target = stockLine ?? batch[0];
  const removeIds = new Set(
    batch.filter((w) => w.id !== target.id).map((w) => w.id)
  );

  const baseQty = stockLine ? stockLine.quantity : 0;
  const merged: WarehouseItem = {
    ...target,
    quantity: baseQty + qty,
    status: 'В наличии',
    costPerUnit: costPerUnit || target.costPerUnit,
  };

  const next = items
    .filter((w) => !removeIds.has(w.id))
    .map((w) => (w.id === target.id ? merged : w));

  return { items: next, mergedLine: merged };
}

export function mergeNetworkPendingOnCancel(
  items: NetworkDevice[],
  pendingId: string,
  restoreStatus: NetworkDevice['status']
): NetworkDevice[] {
  const pending = items.find((n) => n.id === pendingId);
  if (!pending || pending.status !== 'На списание') return items;

  const invKey = normalizeInventoryNumber(pending.inventoryNumber);
  const sibling = items.find(
    (n) =>
      n.id !== pendingId &&
      (n.status === 'На складе' || n.status === 'В работе' || !n.status) &&
      !isNotLinkedToInventoryKey(n.inventoryNumber, invKey)
  );

  if (sibling) {
    return items
      .filter((n) => n.id !== pendingId)
      .map((n) =>
        n.id === sibling.id
          ? { ...n, quantity: (n.quantity || 1) + (pending.quantity || 1) }
          : n
      );
  }

  return items.map((n) =>
    n.id === pendingId ? { ...n, status: restoreStatus } : n
  );
}

export function mergeSoftwarePendingOnCancel(
  items: SoftwareItem[],
  pendingId: string,
  restoreStatus: SoftwareItem['status']
): SoftwareItem[] {
  const pending = items.find((s) => s.id === pendingId);
  if (!pending || pending.status !== 'На списание') return items;

  const sibling = items.find(
    (s) =>
      s.id !== pendingId &&
      s.status !== 'На списание' &&
      s.status !== 'Списано' &&
      s.name === pending.name &&
      (s.developer || '') === (pending.developer || '') &&
      (s.licenseKey || '') === (pending.licenseKey || '')
  );

  if (sibling) {
    return items
      .filter((s) => s.id !== pendingId)
      .map((s) =>
        s.id === sibling.id
          ? { ...s, quantity: (s.quantity || 1) + (pending.quantity || 1) }
          : s
      );
  }

  return items.map((s) =>
    s.id === pendingId ? { ...s, status: restoreStatus } : s
  );
}
