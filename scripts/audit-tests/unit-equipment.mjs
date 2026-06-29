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
  partitionUnitSerialNumbers,
  consumeUnitSerialNumbers,
  increaseWarehouseItemAfterReturn,
  reduceWarehouseItemAfterDeploy,
  reduceWarehouseItemAfterWriteOff,
  mergeWarehouseLineSpecs,
  findActiveWarehouseStockLineIndex,
  repairDuplicateComputerInventoryNumbers,
  resolveWarehouseItemSerialLines,
  warehouseSpecsForQuantity,
  isActiveWarehouseStockLine,
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

  it('partitionUnitSerialNumbers moves first N serials to split portion', () => {
    const { taken, remaining } = partitionUnitSerialNumbers(
      5,
      ['SN1', 'SN2', 'SN3', 'SN4', 'SN5'],
      2
    );
    assert.deepEqual(taken, ['SN1', 'SN2']);
    assert.deepEqual(remaining, ['SN3', 'SN4', 'SN5']);
  });

  it('warehouseSpecsForQuantity assigns serials per batch qty', () => {
    const single = warehouseSpecsForQuantity({ cpuModel: 'i7' }, 1, ['SN-A']);
    assert.equal(single.serialNumber, 'SN-A');
    assert.equal(single.unitSerialNumbers, undefined);

    const batch = warehouseSpecsForQuantity({ cpuModel: 'i7' }, 3, ['A', 'B', 'C']);
    assert.deepEqual(batch.unitSerialNumbers, ['A', 'B', 'C']);
  });

  it('consumeUnitSerialNumbers removes issued serials from warehouse batch', () => {
    const { consumed, remaining } = consumeUnitSerialNumbers(
      5,
      ['1', '2', '3', '4', '5'],
      1,
      ['3']
    );
    assert.deepEqual(consumed, ['3']);
    assert.deepEqual(remaining, ['1', '2', '4', '5']);
  });

  it('resolveWarehouseItemSerialLines hides serials of issued units', () => {
    const lines = resolveWarehouseItemSerialLines(
      {
        id: 'w1',
        name: 'Laptop',
        type: 'Компьютеры',
        model: 'X',
        inventoryNumber: 'ST-0001',
        quantity: 2,
        unit: 'шт.',
        costPerUnit: 1,
        status: 'В наличии',
        unitSerialNumbers: ['3', '4'],
      },
      [
        {
          id: 'c1',
          category: 'Ноутбук',
          model: 'X',
          inventoryNumber: 'ST-0001-3',
          employeeName: 'User',
          status: 'В работе',
          objectName: 'Office',
          serialNumber: '3',
        },
      ]
    );
    assert.deepEqual(lines, ['4']);
  });

  it('reduceWarehouseItemAfterDeploy decrements quantity and serials', () => {
    const next = reduceWarehouseItemAfterDeploy(
      {
        quantity: 5,
        unitSerialNumbers: ['1', '2', '3', '4', '5'],
      },
      1,
      ['3']
    );
    assert.equal(next?.quantity, 4);
    assert.deepEqual(next?.unitSerialNumbers, ['1', '2', '4', '5']);
  });

  it('increaseWarehouseItemAfterReturn restores serial to warehouse batch', () => {
    const next = increaseWarehouseItemAfterReturn(
      {
        quantity: 2,
        unitSerialNumbers: ['1', '2'],
      },
      1,
      ['3']
    );
    assert.equal(next.quantity, 3);
    assert.deepEqual(next.unitSerialNumbers, ['1', '2', '3']);
  });

  it('resolveWarehouseItemSerialLines shows returned unit serial from registry', () => {
    const lines = resolveWarehouseItemSerialLines(
      {
        id: 'w1',
        name: 'Laptop',
        type: 'Компьютеры',
        model: 'X',
        inventoryNumber: 'ST-0001',
        quantity: 3,
        unit: 'шт.',
        costPerUnit: 1,
        status: 'В наличии',
        unitSerialNumbers: ['1', '2'],
      },
      [
        {
          id: 'c1',
          category: 'Ноутбук',
          model: 'X',
          inventoryNumber: 'ST-0001-3',
          employeeName: 'Склад ИТ',
          status: 'На складе',
          objectName: 'Stock',
          serialNumber: '3',
        },
      ]
    );
    assert.deepEqual(lines, ['1', '2', '3']);
  });

  it('reduceWarehouseItemAfterWriteOff decrements quantity and serials', () => {
    const next = reduceWarehouseItemAfterWriteOff(
      {
        quantity: 5,
        unitSerialNumbers: ['1', '2', '3', '4', '5'],
      },
      2,
      ['2', '4']
    );
    assert.equal(next?.quantity, 3);
    assert.deepEqual(next?.unitSerialNumbers, ['1', '3', '5']);
  });

  it('mergeWarehouseLineSpecs combines parent and split serial lists', () => {
    const merged = mergeWarehouseLineSpecs(
      3,
      { unitSerialNumbers: ['1', '2', '3'] },
      2,
      { unitSerialNumbers: ['4', '5'] }
    );
    assert.deepEqual(merged.unitSerialNumbers, ['1', '2', '3', '4', '5']);
  });

  it('findActiveWarehouseStockLineIndex prefers exact split line', () => {
    const items = [
      {
        id: 'w-root',
        name: 'PC',
        type: 'Компьютеры',
        model: 'X',
        inventoryNumber: 'ST-0001',
        quantity: 2,
        unit: 'шт.',
        costPerUnit: 1,
        status: 'В наличии',
        warehouseName: 'Основной склад ИТ',
      },
      {
        id: 'w-split',
        name: 'PC',
        type: 'Компьютеры',
        model: 'X',
        inventoryNumber: 'ST-0001/р1',
        quantity: 1,
        unit: 'шт.',
        costPerUnit: 1,
        status: 'В наличии',
        warehouseName: 'Основной склад ИТ',
        splitFromInventoryNumber: 'ST-0001',
      },
    ];
    assert.equal(
      findActiveWarehouseStockLineIndex(items, 'ST-0001/р1', 'Основной склад ИТ'),
      1
    );
    assert.ok(isActiveWarehouseStockLine(items[0]));
  });

  it('repairDuplicateComputerInventoryNumbers reassigns duplicate deploy cards', () => {
    const computers = [
      { id: 'comp-deploy-a', inventoryNumber: 'ST-0001' },
      { id: 'comp-deploy-b', inventoryNumber: 'ST-0001' },
    ];
    const fixed = repairDuplicateComputerInventoryNumbers(computers, {
      warehouseItems: [{ id: 'wh-1', inventoryNumber: 'ST-0001' }],
      networkDevices: [],
      softwareItems: [],
    });
    const invs = fixed.map((c) => c.inventoryNumber);
    assert.equal(new Set(invs).size, invs.length);
    assert.ok(invs.includes('ST-0001'));
    assert.ok(invs.includes('ST-0001-1'));
  });
});
