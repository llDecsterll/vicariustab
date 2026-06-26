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
});
