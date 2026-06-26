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
import { reduceWarehouseQtyForComputerWriteOff, findLinkedStockComputerIds } from '../../src/utils/equipmentDelete.ts';

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
  it('partial mark 2 of 5 leaves stock 3 and pending 2', () => {
    const line = { ...baseWarehouseLine, quantity: 5 };
    const result = applyMarkForWriteOff('warehouse', 'wh-1', 2, {
      ...ctx,
      warehouseItems: [line],
    });
    assert.equal(result.ok, true);
    const stock = result.warehouseItems.find((w) => w.id === 'wh-1');
    const pending = result.warehouseItems.find((w) => w.status === 'На списание');
    assert.equal(stock?.quantity, 3);
    assert.equal(stock?.status, 'В наличии');
    assert.equal(pending?.quantity, 2);
    assert.equal(result.warehouseItems.filter((w) => w.status === 'На списание').length, 1);
  });

  it('partial mark 2 of 5 marks only two stock computer cards', () => {
    const batchCtx = {
      ...ctx,
      warehouseItems: [{ ...baseWarehouseLine, quantity: 5 }],
      computers: [
        { id: 'c1', category: 'Ноутбук', model: 'ThinkPad', inventoryNumber: 'ST-0001', employeeName: 'Склад', status: 'На складе', objectName: 'Office' },
        { id: 'c2', category: 'Ноутбук', model: 'ThinkPad', inventoryNumber: 'ST-0001-1', employeeName: 'Склад', status: 'На складе', objectName: 'Office' },
        { id: 'c3', category: 'Ноутбук', model: 'ThinkPad', inventoryNumber: 'ST-0001-2', employeeName: 'Склад', status: 'На складе', objectName: 'Office' },
        { id: 'c4', category: 'Ноутбук', model: 'ThinkPad', inventoryNumber: 'ST-0001-3', employeeName: 'Склад', status: 'На складе', objectName: 'Office' },
        { id: 'c5', category: 'Ноутбук', model: 'ThinkPad', inventoryNumber: 'ST-0001-4', employeeName: 'Склад', status: 'На складе', objectName: 'Office' },
      ],
    };
    const result = applyMarkForWriteOff('warehouse', 'wh-1', 2, batchCtx);
    assert.equal(result.ok, true);
    assert.equal(result.computers.filter((c) => c.status === 'На списание').length, 2);
    assert.equal(result.computers.filter((c) => c.status === 'На складе').length, 3);
    assert.equal(result.warehouseItems.find((w) => w.id === 'wh-1')?.quantity, 3);
  });

  it('rejects mark when warehouse quantity is missing', () => {
    const line = { ...baseWarehouseLine, quantity: undefined };
    const result = applyMarkForWriteOff('warehouse', 'wh-1', 2, {
      ...ctx,
      warehouseItems: [line],
    });
    assert.equal(result.ok, false);
  });

  it('mark remaining 3 after partial 2 does not mark entire batch', () => {
    const batchCtx = {
      ...ctx,
      warehouseItems: [{ ...baseWarehouseLine, quantity: 5 }],
      computers: [
        { id: 'c1', category: 'Ноутбук', model: 'ThinkPad', inventoryNumber: 'ST-0001', employeeName: 'Склад', status: 'На складе', objectName: 'Office' },
        { id: 'c2', category: 'Ноутбук', model: 'ThinkPad', inventoryNumber: 'ST-0001-1', employeeName: 'Склад', status: 'На складе', objectName: 'Office' },
        { id: 'c3', category: 'Ноутбук', model: 'ThinkPad', inventoryNumber: 'ST-0001-2', employeeName: 'Склад', status: 'На складе', objectName: 'Office' },
        { id: 'c4', category: 'Ноутбук', model: 'ThinkPad', inventoryNumber: 'ST-0001-3', employeeName: 'Склад', status: 'На складе', objectName: 'Office' },
        { id: 'c5', category: 'Ноутбук', model: 'ThinkPad', inventoryNumber: 'ST-0001-4', employeeName: 'Склад', status: 'На складе', objectName: 'Office' },
      ],
    };
    const step1 = applyMarkForWriteOff('warehouse', 'wh-1', 2, batchCtx);
    const stockAfter = step1.warehouseItems.find((w) => w.id === 'wh-1');
    assert.equal(stockAfter?.quantity, 3);
    const step2 = applyMarkForWriteOff('warehouse', 'wh-1', 3, {
      ...batchCtx,
      warehouseItems: step1.warehouseItems,
      computers: step1.computers,
      networkDevices: step1.networkDevices,
      softwareItems: step1.softwareItems,
    });
    assert.equal(step2.computers.filter((c) => c.status === 'На списание').length, 5);
    assert.equal(step2.computers.filter((c) => c.status === 'На складе').length, 0);
    assert.equal(step2.warehouseItems.find((w) => w.id === 'wh-1')?.status, 'На списание');
  });

  it('repairWarehousePendingDuplicates keeps split pending line separate', () => {
    const items = [
      { ...baseWarehouseLine, id: 'stock', quantity: 3, status: 'В наличии', inventoryNumber: 'ST-0001' },
      {
        ...baseWarehouseLine,
        id: 'pending',
        quantity: 2,
        status: 'На списание',
        inventoryNumber: 'ST-0001/р1',
        splitFromInventoryNumber: 'ST-0001',
      },
    ];
    const fixed = repairWarehousePendingDuplicates(items);
    assert.equal(fixed.length, 2);
    assert.equal(fixed.find((w) => w.id === 'stock')?.quantity, 3);
    assert.equal(fixed.find((w) => w.id === 'pending')?.quantity, 2);
  });

  it('partial mark on network warehouse splits network registry', () => {
    const netCtx = {
      ...ctx,
      warehouseItems: [{
        ...baseWarehouseLine,
        id: 'wh-net',
        type: 'Сетевое оборудование',
        name: 'Switch',
        quantity: 5,
        inventoryNumber: 'NET-001',
      }],
      networkDevices: [{
        id: 'n1',
        deviceName: 'Switch',
        type: 'Коммутатор',
        inventoryNumber: 'NET-001',
        quantity: 5,
        status: 'На складе',
        objectName: 'Office',
      }],
    };
    const result = applyMarkForWriteOff('warehouse', 'wh-net', 2, netCtx);
    assert.equal(result.ok, true);
    assert.equal(result.networkDevices.filter((n) => n.status === 'На списание').length, 1);
    assert.equal(result.networkDevices.find((n) => n.id === 'n1')?.quantity, 3);
    assert.equal(result.warehouseItems.find((w) => w.id === 'wh-net')?.quantity, 3);
  });

  it('findLinkedStockComputerIds scopes to warehouse line not root batch', () => {
    const splitLine = {
      ...baseWarehouseLine,
      inventoryNumber: 'ST-0001/р1',
      splitFromInventoryNumber: 'ST-0001',
      quantity: 2,
    };
    const computers = [
      { id: 'c1', category: 'Ноутбук', model: 'ThinkPad', inventoryNumber: 'ST-0001', employeeName: 'Склад', status: 'На складе', objectName: 'Office' },
      { id: 'c2', category: 'Ноутбук', model: 'ThinkPad', inventoryNumber: 'ST-0001-1', employeeName: 'Склад', status: 'На складе', objectName: 'Office' },
      { id: 'c3', category: 'Ноутбук', model: 'ThinkPad', inventoryNumber: 'ST-0001/р1', employeeName: 'Склад', status: 'На складе', objectName: 'Office' },
      { id: 'c4', category: 'Ноутбук', model: 'ThinkPad', inventoryNumber: 'ST-0001/р1-1', employeeName: 'Склад', status: 'На складе', objectName: 'Office' },
    ];
    const linked = findLinkedStockComputerIds(splitLine, computers, ctx.warehouses);
    assert.deepEqual(linked, ['c3', 'c4']);
  });

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

  it('mark computer for write-off affects only the selected card', () => {
    const batchCtx = {
      ...ctx,
      warehouseItems: [{ ...baseWarehouseLine, quantity: 3 }],
      computers: [
        {
          id: 'c1',
          category: 'Ноутбук',
          model: 'ThinkPad',
          inventoryNumber: 'ST-0001',
          employeeName: 'Склад ИТ',
          status: 'На складе',
          objectName: 'Office',
        },
        {
          id: 'c2',
          category: 'Ноутбук',
          model: 'ThinkPad',
          inventoryNumber: 'ST-0001-1',
          employeeName: 'Иванов',
          status: 'В работе',
          objectName: 'Office',
        },
        {
          id: 'c3',
          category: 'Ноутбук',
          model: 'ThinkPad',
          inventoryNumber: 'ST-0001-2',
          employeeName: 'Петров',
          status: 'В работе',
          objectName: 'Office',
        },
      ],
    };
    const result = applyMarkForWriteOff('computer', 'c2', 1, batchCtx);
    assert.equal(result.ok, true);
    assert.equal(result.computers.find((c) => c.id === 'c1')?.status, 'На складе');
    assert.equal(result.computers.find((c) => c.id === 'c2')?.status, 'На списание');
    assert.equal(result.computers.find((c) => c.id === 'c3')?.status, 'В работе');
    assert.equal(result.warehouseItems[0].status, 'В наличии');
    assert.equal(result.warehouseItems[0].quantity, 3);
  });

  it('cancel computer pending write-off restores only selected card', () => {
    const marked = applyMarkForWriteOff('computer', 'c2', 1, {
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
        {
          id: 'c2',
          category: 'Ноутбук',
          model: 'ThinkPad',
          inventoryNumber: 'ST-0001-2',
          employeeName: 'Иванов',
          status: 'На списание',
          objectName: 'Филиал',
        },
      ],
    });
    const cancelled = applyCancelPendingWriteOff('computer', 'c2', {
      ...ctx,
      warehouseItems: marked.warehouseItems,
      computers: marked.computers,
      networkDevices: marked.networkDevices,
      softwareItems: marked.softwareItems,
    });
    assert.equal(cancelled.ok, true);
    assert.equal(cancelled.computers.find((c) => c.id === 'c1')?.status, 'На списание');
    assert.equal(cancelled.computers.find((c) => c.id === 'c2')?.status, 'В работе');
  });

  it('reduceWarehouseQtyForComputerWriteOff decrements stock line for warehouse PC', () => {
    const items = [
      {
        id: 'wh-1',
        inventoryNumber: 'ST-0001',
        quantity: 5,
        status: 'В наличии',
        warehouseName: 'Основной склад ИТ',
      },
    ];
    const next = reduceWarehouseQtyForComputerWriteOff(
      items,
      { inventoryNumber: 'ST-0001-2', status: 'На складе' },
      1
    );
    assert.equal(next.length, 1);
    assert.equal(next[0].quantity, 4);
  });
});
