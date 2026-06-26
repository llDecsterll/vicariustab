/**
 * Unit tests: restore equipment from write-off history (applyWriteOffRestore)
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyWriteOffRestore,
  inferWriteOffSourceType,
} from '../../src/utils/restoreWriteOff.ts';

const baseCtx = {
  warehouseItems: [],
  computers: [],
  networkDevices: [],
  softwareItems: [],
  warehouses: [{ id: 'wh-1', name: 'Основной склад ИТ', objectName: 'Office', description: '' }],
  objects: [{ id: 'obj-1', name: 'Office', address: 'Main St' }],
};

const warehouseWo = {
  id: 'wo-1',
  inventoryNumber: 'ST-0100',
  name: 'Ноутбук',
  type: 'Компьютеры',
  model: 'ThinkPad',
  quantity: 3,
  unit: 'шт.',
  costPerUnit: 50000,
  reason: 'audit',
  date: '2026-06-22',
  warehouseName: 'Основной склад ИТ',
  sourceType: 'warehouse',
};

describe('restore write-off', () => {
  it('inferWriteOffSourceType detects warehouse by type', () => {
    assert.equal(inferWriteOffSourceType(warehouseWo), 'warehouse');
    assert.equal(
      inferWriteOffSourceType({ ...warehouseWo, sourceType: 'network', type: 'Коммутатор' }),
      'network'
    );
  });

  it('rejects already restored act', () => {
    const result = applyWriteOffRestore({ ...warehouseWo, restoredAt: '2026-01-01T00:00:00Z' }, baseCtx);
    assert.equal(result.ok, false);
    assert.equal(result.errorKey, 'restore_already_restored');
  });

  it('rejects restore when inventory number is missing', () => {
    const result = applyWriteOffRestore({ ...warehouseWo, inventoryNumber: '' }, baseCtx);
    assert.equal(result.ok, false);
    assert.equal(result.errorKey, 'restore_missing_inventory');
  });

  it('restores warehouse computer line with stock cards', () => {
    const result = applyWriteOffRestore(warehouseWo, baseCtx);
    assert.equal(result.ok, true);
    const wh = result.warehouseItems.find((w) => w.inventoryNumber === 'ST-0100');
    assert.ok(wh);
    assert.equal(wh.status, 'В наличии');
    assert.equal(wh.quantity, 3);
    assert.equal(result.computers.length, 3);
    assert.ok(result.computers.every((c) => c.status === 'На складе'));
    assert.ok(result.computers.every((c) => c.employeeName === 'Склад ИТ'));
  });

  it('merges qty onto existing warehouse line', () => {
    const ctx = {
      ...baseCtx,
      warehouseItems: [
        {
          id: 'wh-existing',
          name: 'Ноутбук',
          type: 'Компьютеры',
          model: 'ThinkPad',
          inventoryNumber: 'ST-0100',
          quantity: 2,
          unit: 'шт.',
          costPerUnit: 50000,
          status: 'В наличии',
          warehouseName: 'Основной склад ИТ',
          receiptDate: '2026-01-01',
        },
      ],
    };
    const result = applyWriteOffRestore({ ...warehouseWo, quantity: 2 }, ctx);
    assert.equal(result.ok, true);
    const wh = result.warehouseItems.find((w) => w.id === 'wh-existing');
    assert.equal(wh?.quantity, 4);
    assert.equal(result.computers.length, 2);
  });

  it('restores network warehouse line to registry', () => {
    const wo = {
      ...warehouseWo,
      inventoryNumber: 'NET-001',
      name: 'Switch',
      type: 'Сетевое оборудование',
      model: 'Cisco',
      quantity: 5,
    };
    const result = applyWriteOffRestore(wo, baseCtx);
    assert.equal(result.ok, true);
    assert.equal(result.networkDevices.length, 1);
    assert.equal(result.networkDevices[0].quantity, 5);
    assert.equal(result.networkDevices[0].status, 'На складе');
    const wh = result.warehouseItems.find((w) => w.inventoryNumber === 'NET-001');
    assert.ok(wh);
    assert.equal(wh.quantity, 5);
  });

  it('increments existing network device on restore', () => {
    const ctx = {
      ...baseCtx,
      networkDevices: [
        {
          id: 'net-1',
          deviceName: 'Switch',
          type: 'Коммутатор',
          objectName: 'Office',
          ipAddress: '10.0.0.1',
          quantity: 2,
          inventoryNumber: 'NET-001',
          status: 'На складе',
        },
      ],
    };
    const wo = {
      ...warehouseWo,
      inventoryNumber: 'NET-001',
      name: 'Switch',
      type: 'Сетевое оборудование',
      model: 'Cisco',
      quantity: 3,
    };
    const result = applyWriteOffRestore(wo, ctx);
    assert.equal(result.ok, true);
    assert.equal(result.networkDevices.length, 1);
    assert.equal(result.networkDevices[0].quantity, 5);
  });

  it('restores software warehouse line', () => {
    const wo = {
      ...warehouseWo,
      inventoryNumber: 'SW-001',
      name: 'Office',
      type: 'Лицензии ПО',
      model: 'Microsoft',
      quantity: 10,
    };
    const result = applyWriteOffRestore(wo, baseCtx);
    assert.equal(result.ok, true);
    assert.equal(result.softwareItems.length, 1);
    assert.equal(result.softwareItems[0].quantity, 10);
    assert.equal(result.softwareItems[0].status, 'Не активирована');
  });

  it('restores computer registry line', () => {
    const wo = {
      ...warehouseWo,
      inventoryNumber: 'PC-001',
      name: 'Ноутбук',
      type: 'Компьютеры',
      quantity: 1,
      sourceType: 'computer',
    };
    const result = applyWriteOffRestore(wo, baseCtx);
    assert.equal(result.ok, true);
    assert.equal(result.computers.length, 1);
    assert.equal(result.computers[0].inventoryNumber, 'PC-001');
    assert.equal(result.computers[0].status, 'На складе');
  });

  it('computer restore bumps qty on existing warehouse line', () => {
    const ctx = {
      ...baseCtx,
      warehouseItems: [
        {
          id: 'wh-pc',
          name: 'Ноутбук',
          type: 'Компьютеры',
          model: 'ThinkPad',
          inventoryNumber: 'PC-001',
          quantity: 1,
          unit: 'шт.',
          costPerUnit: 50000,
          status: 'В наличии',
          warehouseName: 'Основной склад ИТ',
          receiptDate: '2026-01-01',
        },
      ],
    };
    const wo = {
      ...warehouseWo,
      inventoryNumber: 'PC-001',
      name: 'Ноутбук',
      type: 'Компьютеры',
      quantity: 1,
      sourceType: 'computer',
    };
    const result = applyWriteOffRestore(wo, ctx);
    assert.equal(result.ok, true);
    const wh = result.warehouseItems.find((w) => w.inventoryNumber === 'PC-001');
    assert.ok(wh);
    assert.equal(wh.quantity, 2);
    assert.equal(result.computers.length, 1);
  });

  it('rejects duplicate computer inventory on computer restore', () => {
    const ctx = {
      ...baseCtx,
      computers: [
        {
          id: 'c1',
          category: 'Ноутбук',
          model: 'X',
          inventoryNumber: 'PC-001',
          employeeName: 'Склад',
          status: 'На складе',
          objectName: 'Office',
        },
      ],
    };
    const wo = {
      ...warehouseWo,
      inventoryNumber: 'PC-001',
      sourceType: 'computer',
      quantity: 1,
    };
    const result = applyWriteOffRestore(wo, ctx);
    assert.equal(result.ok, false);
    assert.equal(result.errorKey, 'restore_inventory_exists');
  });

  it('restores network registry line (non-warehouse source)', () => {
    const wo = {
      ...warehouseWo,
      inventoryNumber: 'NET-200',
      name: 'Router',
      type: 'Маршрутизатор',
      model: 'Mikrotik',
      quantity: 2,
      sourceType: 'network',
    };
    const result = applyWriteOffRestore(wo, baseCtx);
    assert.equal(result.ok, true);
    assert.equal(result.networkDevices.length, 1);
    assert.equal(result.networkDevices[0].status, 'В работе');
    assert.equal(result.networkDevices[0].quantity, 2);
  });

  it('restores software registry line (non-warehouse source)', () => {
    const wo = {
      ...warehouseWo,
      inventoryNumber: 'LIC-100',
      name: 'Antivirus',
      type: 'Утилиты и антивирусы',
      model: 'Kaspersky',
      quantity: 5,
      sourceType: 'software',
    };
    const result = applyWriteOffRestore(wo, baseCtx);
    assert.equal(result.ok, true);
    assert.equal(result.softwareItems.length, 1);
    assert.equal(result.softwareItems[0].status, 'Активна');
    assert.equal(result.softwareItems[0].quantity, 5);
  });
});
