/**
 * Unit tests: equipment inventory helpers
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  allocateBatchInventoryNumbers,
  exactInventoryNumberTaken,
  getSoftwareWarehouseInv,
  getWarehouseBatchInventoryKey,
  inventoryBaseFamilyTaken,
  inventoryNumbersMatch,
  findWarehouseItemByInventoryNumber,
  mergeWarehouseReceiptSpecs,
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

  it('getWarehouseBatchInventoryKey strips only trailing batch suffix', () => {
    assert.equal(getWarehouseBatchInventoryKey('ST-0061-2'), 'ST-0061');
    assert.equal(getWarehouseBatchInventoryKey('ST-0061'), 'ST-0061');
    assert.equal(getWarehouseBatchInventoryKey('INV-100'), 'INV-100');
  });

  it('mergeWarehouseReceiptSpecs keeps serial when restoring to warehouse', () => {
    const merged = mergeWarehouseReceiptSpecs(
      { serialNumber: '', cpuModel: '' },
      { serialNumber: 'SN-12345', cpuModel: 'Intel i7' }
    );
    assert.equal(merged.serialNumber, 'SN-12345');
    assert.equal(merged.cpuModel, 'Intel i7');
  });
});
