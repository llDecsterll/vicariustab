/**
 * Unit tests: warehouse lifecycle helpers (return routing, search, batch keys, write-off purge)
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getWarehouseBatchInventoryKey,
  inventoryNumbersMatch,
  matchesInventorySearch,
  isActiveWarehouseStockLine,
  purgeWrittenOffRegistry,
} from '../../src/utils/equipmentFields.ts';
import {
  countRegistryUnitsForWarehouseBatch,
  reduceWarehouseQtyByInventoryMatch,
} from '../../src/utils/equipmentDelete.ts';
import { splitWarehouseItem } from '../../src/utils/warehouseLifecycleEngine.ts';

describe('warehouse lifecycle helpers', () => {
  it('getWarehouseBatchInventoryKey collapses batch suffix for warehouse line', () => {
    assert.equal(getWarehouseBatchInventoryKey('ST-0061-2'), 'ST-0061');
    assert.equal(getWarehouseBatchInventoryKey('ST-0061'), 'ST-0061');
  });

  it('matchesInventorySearch finds batch family by base inv', () => {
    assert.ok(matchesInventorySearch('ST-0061', 'ST-0061-2'));
    assert.ok(matchesInventorySearch('ST-0061-2', 'ST-0061'));
    assert.ok(matchesInventorySearch('ST-0061-2', '0061'));
    assert.ok(!matchesInventorySearch('ST-0062', 'ST-0061'));
  });

  it('return flow: issued unit inv links to warehouse batch line', () => {
    const issuedInv = 'ST-0070-1';
    const batchKey = getWarehouseBatchInventoryKey(issuedInv);
    assert.ok(inventoryNumbersMatch(batchKey, 'ST-0070'));
    assert.equal(batchKey, 'ST-0070');
  });

  it('inventoryNumbersMatch is symmetric for batch families', () => {
    assert.ok(inventoryNumbersMatch('ST-0100-3', 'ST-0100'));
    assert.ok(inventoryNumbersMatch('ST-0100', 'ST-0100-3'));
  });

  it('isActiveWarehouseStockLine rejects written-off and pending lines', () => {
    assert.ok(
      isActiveWarehouseStockLine({
        id: '1',
        name: 'PC',
        type: 'Компьютеры',
        model: 'X',
        inventoryNumber: 'ST-1',
        quantity: 2,
        unit: 'шт.',
        costPerUnit: 0,
        status: 'В наличии',
      })
    );
    assert.ok(
      !isActiveWarehouseStockLine({
        id: '2',
        name: 'PC',
        type: 'Компьютеры',
        model: 'X',
        inventoryNumber: 'ST-1',
        quantity: 0,
        unit: 'шт.',
        costPerUnit: 0,
        status: 'Списано',
      })
    );
    assert.ok(
      !isActiveWarehouseStockLine({
        id: '3',
        name: 'PC',
        type: 'Компьютеры',
        model: 'X',
        inventoryNumber: 'ST-1',
        quantity: 1,
        unit: 'шт.',
        costPerUnit: 0,
        status: 'На списание',
      })
    );
  });

  it('purgeWrittenOffRegistry removes finalized batch from active registries', () => {
    const inv = 'ST-0200';
    const base = {
      warehouseItems: [
        {
          id: 'wh',
          name: 'Laptop',
          type: 'Компьютеры',
          model: 'X',
          inventoryNumber: inv,
          quantity: 0,
          unit: 'шт.',
          costPerUnit: 0,
          status: 'Списано',
        },
      ],
      computers: [
        {
          id: 'c1',
          category: 'Ноутбук',
          model: 'X',
          inventoryNumber: inv,
          employeeName: '—',
          status: 'На списание',
          objectName: 'Office',
        },
      ],
      networkDevices: [],
      softwareItems: [],
    };
    const purged = purgeWrittenOffRegistry(base, inv, { purgePendingLinked: true });
    assert.equal(purged.warehouseItems.length, 0);
    assert.equal(purged.computers.length, 0);
  });

  it('countRegistryUnitsForWarehouseBatch counts computers and network qty', () => {
    const total = countRegistryUnitsForWarehouseBatch(
      'ST-0300',
      [
        { id: 'c1', inventoryNumber: 'ST-0300', status: 'На складе' },
        { id: 'c2', inventoryNumber: 'ST-0300-1', status: 'В работе' },
      ],
      [{ id: 'n1', inventoryNumber: 'ST-0300', quantity: 2 }],
      []
    );
    assert.equal(total, 4);
  });

  it('reduceWarehouseQtyByInventoryMatch decrements linked warehouse line', () => {
    const items = [
      {
        id: 'wh-1',
        inventoryNumber: 'NET-001',
        quantity: 5,
        status: 'В наличии',
        warehouseName: 'Основной склад ИТ',
      },
    ];
    const next = reduceWarehouseQtyByInventoryMatch(items, 'NET-001', 2, 'Основной склад ИТ');
    assert.equal(next.length, 1);
    assert.equal(next[0].quantity, 3);
  });

  it('replenishment adds only missing registry cards', () => {
    const existingUnits = countRegistryUnitsForWarehouseBatch(
      'ST-0400',
      [
        { id: 'c1', inventoryNumber: 'ST-0400', status: 'На складе' },
        { id: 'c2', inventoryNumber: 'ST-0400-1', status: 'На складе' },
        { id: 'c3', inventoryNumber: 'ST-0400-2', status: 'В работе' },
      ],
      [],
      []
    );
    const targetWhQty = 5;
    const cardsToAdd = Math.max(0, targetWhQty - existingUnits);
    assert.equal(existingUnits, 3);
    assert.equal(cardsToAdd, 2);
  });

  it('splitWarehouseItem partitions unit serial numbers to split line', () => {
    const state = {
      warehouseItems: [
        {
          id: 'wh-batch',
          name: 'Laptop',
          type: 'Компьютеры',
          model: 'ThinkPad',
          inventoryNumber: 'ST-0500',
          quantity: 4,
          unit: 'шт.',
          costPerUnit: 1000,
          status: 'В наличии',
          warehouseName: 'Основной склад ИТ',
          unitSerialNumbers: ['S1', 'S2', 'S3', 'S4'],
        },
      ],
      computers: [],
      networkDevices: [],
      softwareItems: [],
      warehouses: [{ id: 'w1', name: 'Основной склад ИТ', objectName: 'Office', description: '' }],
      objects: [{ id: 'o1', name: 'Office', address: 'Main' }],
    };
    const next = splitWarehouseItem(state, 'wh-batch', 2);
    assert.ok(next);
    const source = next.warehouseItems.find((w) => w.id === 'wh-batch');
    const splitLine = next.warehouseItems.find((w) => w.id !== 'wh-batch');
    assert.equal(source?.quantity, 2);
    assert.deepEqual(source?.unitSerialNumbers, ['S3', 'S4']);
    assert.equal(splitLine?.quantity, 2);
    assert.deepEqual(splitLine?.unitSerialNumbers, ['S1', 'S2']);
  });
});
