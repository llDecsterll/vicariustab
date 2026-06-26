/**
 * Unit tests: warehouse Excel import/export helpers
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyWarehouseExcelImport,
  excelRowToWarehouseItem,
  parseWarehouseExcelBuffer,
  warehouseItemToExcelRow,
  WAREHOUSE_EXCEL_HEADERS,
} from '../../src/utils/warehouseExcel.ts';
import * as XLSX from 'xlsx';

describe('warehouseExcel', () => {
  it('builds export row with serial numbers', () => {
    const row = warehouseItemToExcelRow({
      id: 'wh-1',
      name: 'Монитор',
      type: 'Периферия',
      model: 'Dell P2422H',
      inventoryNumber: 'ST-0001',
      quantity: 2,
      unit: 'шт.',
      costPerUnit: 15000,
      status: 'В наличии',
      warehouseName: 'Основной склад ИТ',
      receiptDate: '2026-01-15',
      unitSerialNumbers: ['SN1', 'SN2'],
      monitorDiagonalInches: 24,
    });
    assert.equal(row['Инвентарный номер'], 'ST-0001');
    assert.equal(row['Количество'], 2);
    assert.equal(row['Серийные номера (по ед.)'], 'SN1; SN2');
    assert.ok(WAREHOUSE_EXCEL_HEADERS.length >= 10);
  });

  it('validates parsed import rows', () => {
    const bad = excelRowToWarehouseItem(
      { name: '', type: 'Периферия', model: 'X', inventoryNumber: 'A', quantity: 1 },
      3
    );
    assert.ok(bad.error?.includes('наименование'));

    const good = excelRowToWarehouseItem(
      {
        name: 'Клавиатура',
        type: 'Периферия',
        model: 'Logitech',
        inventoryNumber: 'KB-001',
        quantity: 5,
        warehouseName: 'Основной склад ИТ',
      },
      4
    );
    assert.equal(good.error, undefined);
    assert.equal(good.item.quantity, 5);
  });

  it('upserts by id and creates new lines', () => {
    const current = [
      {
        id: 'wh-100',
        name: 'Монитор',
        type: 'Периферия',
        model: 'Dell',
        inventoryNumber: 'ST-0001',
        quantity: 6,
        unit: 'шт.',
        costPerUnit: 10000,
        status: 'В наличии',
        warehouseName: 'Основной склад ИТ',
      },
    ];

    const result = applyWarehouseExcelImport(current, [
      {
        id: 'wh-100',
        name: 'Монитор',
        type: 'Периферия',
        model: 'Dell',
        inventoryNumber: 'ST-0001',
        quantity: 12,
        unit: 'шт.',
        costPerUnit: 10000,
        warehouseName: 'Основной склад ИТ',
        status: 'В наличии',
      },
      {
        name: 'Мышь',
        type: 'Периферия',
        model: 'Logitech',
        inventoryNumber: 'MS-001',
        quantity: 3,
        warehouseName: 'Основной склад ИТ',
      },
    ]);

    assert.equal(result.ok, true);
    assert.equal(result.updated, 1);
    assert.equal(result.created, 1);
    const restored = result.items.find((w) => w.id === 'wh-100');
    assert.equal(restored?.quantity, 12);
    assert.ok(result.items.some((w) => w.inventoryNumber === 'MS-001'));
  });

  it('reads legacy sheet name Склад', () => {
    const wb = XLSX.utils.book_new();
    const row = warehouseItemToExcelRow({
      id: 'wh-legacy',
      name: 'Тест',
      type: 'Другое',
      model: 'M1',
      inventoryNumber: 'LEG-1',
      quantity: 1,
      unit: 'шт.',
      costPerUnit: 100,
      status: 'В наличии',
      warehouseName: 'Основной склад ИТ',
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([row], { header: [...WAREHOUSE_EXCEL_HEADERS] }), 'Склад');
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const rows = parseWarehouseExcelBuffer(buffer);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].inventoryNumber, 'LEG-1');
  });

  it('rejects duplicate inventory on import', () => {
    const current = [
      {
        id: 'wh-a',
        name: 'A',
        type: 'Другое',
        model: 'M',
        inventoryNumber: 'DUP-1',
        quantity: 1,
        unit: 'шт.',
        costPerUnit: 1,
        status: 'В наличии',
        warehouseName: 'Основной склад ИТ',
      },
    ];
    const result = applyWarehouseExcelImport(current, [
      {
        name: 'B',
        type: 'Другое',
        model: 'M2',
        inventoryNumber: 'DUP-1',
        quantity: 2,
        warehouseName: 'Основной склад ИТ',
      },
    ]);
    assert.equal(result.created, 0);
    assert.ok(result.errors.some((e) => e.includes('DUP-1')));
  });
});
