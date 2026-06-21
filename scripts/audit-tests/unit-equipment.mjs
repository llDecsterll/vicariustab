/**
 * Unit tests: equipment inventory helpers
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  allocateBatchInventoryNumbers,
  exactInventoryNumberTaken,
  getSoftwareWarehouseInv,
  inventoryBaseFamilyTaken,
  inventoryNumbersMatch,
  findWarehouseItemByInventoryNumber,
} from '../../src/utils/equipmentFields.ts';

describe('equipmentFields', () => {
  it('getSoftwareWarehouseInv matches client convention SW- + suffix', () => {
    assert.equal(getSoftwareWarehouseInv('abcdefghijklmnop'), 'SW-IJKLMNOP');
  });

  it('inventoryNumbersMatch links base and batch suffix', () => {
    assert.ok(inventoryNumbersMatch('ST-0061', 'ST-0061-2'));
    assert.ok(!inventoryNumbersMatch('ST-0061', 'ST-0062'));
  });

  it('allocateBatchInventoryNumbers avoids taken slots', () => {
    assert.deepEqual(allocateBatchInventoryNumbers('ST-0061', [], 1), ['ST-0061']);
    assert.deepEqual(allocateBatchInventoryNumbers('ST-0061', ['ST-0061'], 1), ['ST-0061-1']);
    assert.deepEqual(allocateBatchInventoryNumbers('ST-0061', [], 3), [
      'ST-0061-1',
      'ST-0061-2',
      'ST-0061-3',
    ]);
  });

  it('inventoryBaseFamilyTaken detects batch family across entities', () => {
    const ctx = {
      warehouseItems: [{ id: 'w1', inventoryNumber: 'ST-0061' }],
      computers: [{ id: 'c1', inventoryNumber: 'ST-0061-1' }],
      networkDevices: [],
      softwareItems: [],
      softwareWarehouseInv: getSoftwareWarehouseInv,
    };
    assert.ok(inventoryBaseFamilyTaken('ST-0061', ctx));
    assert.ok(exactInventoryNumberTaken('ST-0061-1', ctx));
  });

  it('findWarehouseItemByInventoryNumber resolves batch base', () => {
    const items = [{ id: 'w1', inventoryNumber: 'ST-0061', quantity: 5 }];
    assert.equal(findWarehouseItemByInventoryNumber(items, 'ST-0061-2')?.id, 'w1');
  });
});
