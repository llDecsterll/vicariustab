/**
 * Unit tests: partial write-off, cancel merge, restore merge, duplicate repair
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyMarkForWriteOff } from '../../src/utils/markPendingWriteOff.ts';
import { applyCancelPendingWriteOff } from '../../src/utils/cancelPendingWriteOff.ts';
import {
  mergeWarehouseOnRestore,
  mergeWarehousePendingOnCancel,
  repairWarehousePendingDuplicates,
} from '../../src/utils/warehousePendingMerge.ts';
import { formatSplitWarehouseInventoryNumber } from '../../src/utils/equipmentFields.ts';

const baseWarehouseLine = {
  id: 'wh-1',
  name: 'Laptop',
  type: 'Компьютеры',
  model: 'ThinkPad',
  inventoryNumber: 'ST-0001',
  quantity: 12,
  unit: 'шт.',
  costPerUnit: 1000,
  status: 'В наличии',
  warehouseName: 'Основной склад ИТ',
};

const ctx = {
  warehouseItems: [baseWarehouseLine],
  computers: [],
  networkDevices: [],
  softwareItems: [],
  warehouses: [{ id: 'wh-1', name: 'Основной склад ИТ', objectName: 'Office', description: '' }],
};

describe('write-off lifecycle', () => {
  it('partial mark splits qty and assigns unique pending inv', () => {
    const result = applyMarkForWriteOff('warehouse', 'wh-1', 6, ctx);
    assert.equal(result.ok, true);
    const stock = result.warehouseItems.find((w) => w.id === 'wh-1');
    const pending = result.warehouseItems.find((w) => w.status === 'На списание');
    assert.ok(stock);
    assert.ok(pending);
    assert.equal(stock.quantity, 6);
    assert.equal(pending.quantity, 6);
    assert.notEqual(pending.inventoryNumber, stock.inventoryNumber);
    assert.ok(pending.inventoryNumber.includes('/р'));
  });

  it('cancel pending merges back to single stock line', () => {
    const marked = applyMarkForWriteOff('warehouse', 'wh-1', 6, ctx);
    const pending = marked.warehouseItems.find((w) => w.status === 'На списание');
    assert.ok(pending);
    const merged = mergeWarehousePendingOnCancel(marked.warehouseItems, pending.id);
    const stockLines = merged.filter(
      (w) => w.inventoryNumber === 'ST-0001' && w.status === 'В наличии'
    );
    assert.equal(stockLines.length, 1);
    assert.equal(stockLines[0].quantity, 12);
    assert.equal(merged.filter((w) => w.status === 'На списание').length, 0);
  });

  it('applyCancelPendingWriteOff restores linked registries', () => {
    const marked = applyMarkForWriteOff('warehouse', 'wh-1', 6, {
      ...ctx,
      computers: [
        {
          id: 'c1',
          category: 'Ноутбук',
          model: 'ThinkPad',
          inventoryNumber: 'ST-0001-1',
          employeeName: 'Склад ИТ',
          status: 'На списание',
          objectName: 'Office',
        },
      ],
    });
    const pending = marked.warehouseItems.find((w) => w.status === 'На списание');
    const cancelled = applyCancelPendingWriteOff('warehouse', pending.id, {
      ...ctx,
      warehouseItems: marked.warehouseItems,
      computers: marked.computers,
      networkDevices: marked.networkDevices,
      softwareItems: marked.softwareItems,
    });
    assert.equal(cancelled.ok, true);
    assert.equal(
      cancelled.warehouseItems.filter((w) => w.status === 'В наличии' && w.quantity === 12).length,
      1
    );
    assert.equal(cancelled.computers[0].status, 'На складе');
  });

  it('repairWarehousePendingDuplicates merges same inv stock + pending', () => {
    const broken = [
      { ...baseWarehouseLine, id: 'a', quantity: 6, status: 'В наличии' },
      {
        ...baseWarehouseLine,
        id: 'b',
        quantity: 6,
        status: 'На списание',
        inventoryNumber: 'ST-0001',
      },
    ];
    const fixed = repairWarehousePendingDuplicates(broken);
    assert.equal(fixed.length, 1);
    assert.equal(fixed[0].quantity, 12);
    assert.equal(fixed[0].status, 'В наличии');
  });

  it('mergeWarehouseOnRestore adds qty to stock line', () => {
    const items = [{ ...baseWarehouseLine, quantity: 6 }];
    const { items: next, mergedLine } = mergeWarehouseOnRestore(
      items,
      'ST-0001',
      'Основной склад ИТ',
      6,
      1000
    );
    assert.ok(mergedLine);
    assert.equal(mergedLine.quantity, 12);
    assert.equal(next.length, 1);
  });

  it('formatSplitWarehouseInventoryNumber uses /р suffix', () => {
    assert.equal(formatSplitWarehouseInventoryNumber('ST-0001', 1), 'ST-0001/р1');
    assert.equal(formatSplitWarehouseInventoryNumber('ST-0001', 2), 'ST-0001/р2');
  });
});
