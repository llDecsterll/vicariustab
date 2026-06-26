/**
 * Unit tests: equipment group routing — strict tab assignment
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  filterComputersByEquipmentTab,
  resolveWarehouseComputerRoute,
  WAREHOUSE_TYPE_TAB,
} from '../../src/utils/warehouseRouting.ts';

const stockComputer = {
  id: 'c1',
  category: 'Ноутбук',
  model: 'X',
  inventoryNumber: 'ST-1',
  employeeName: 'Склад ИТ',
  status: 'На складе',
  objectName: 'Office',
};

const workingComputer = {
  ...stockComputer,
  id: 'c2',
  status: 'В работе',
  employeeName: 'Иванов',
};

describe('warehouseRouting groups', () => {
  it('WAREHOUSE_TYPE_TAB maps every warehouse type to a tab', () => {
    const types = [
      'Компьютеры',
      'Сетевое оборудование',
      'Периферия',
      'Оргтехника',
      'Видеонаблюдение',
      'Расходные материалы',
      'Лицензии ПО',
      'Другое',
    ];
    for (const t of types) {
      assert.ok(WAREHOUSE_TYPE_TAB[t], `missing tab for ${t}`);
    }
  });

  it('resolveWarehouseComputerRoute respects receipt type', () => {
    assert.equal(
      resolveWarehouseComputerRoute({ type: 'Компьютеры', deviceType: 'Ноутбук' })?.equipmentTab,
      'computers'
    );
    assert.equal(
      resolveWarehouseComputerRoute({ type: 'Периферия', deviceType: 'Монитор' })?.equipmentTab,
      'peripherals'
    );
    assert.equal(
      resolveWarehouseComputerRoute({ type: 'Оргтехника', deviceType: 'Принтер' })?.equipmentTab,
      'orgtech'
    );
    assert.equal(
      resolveWarehouseComputerRoute({ type: 'Видеонаблюдение', deviceType: 'Камера' })?.equipmentTab,
      'surveillance'
    );
    assert.equal(
      resolveWarehouseComputerRoute({ type: 'Расходные материалы', deviceType: 'Картридж' })?.equipmentTab,
      'consumables'
    );
    assert.equal(
      resolveWarehouseComputerRoute({ type: 'Другое', deviceType: 'Иное' })?.equipmentTab,
      'other_equip'
    );
  });

  it('filterComputersByEquipmentTab excludes stock from working tabs', () => {
    const list = [stockComputer, workingComputer];
    const computersTab = filterComputersByEquipmentTab(list, 'computers');
    assert.equal(computersTab.length, 1);
    assert.equal(computersTab[0].id, 'c2');
  });

  it('written-off computers are excluded from equipment tabs', () => {
    const written = { ...workingComputer, id: 'c3', status: 'Списано' };
    const tab = filterComputersByEquipmentTab([written], 'computers');
    assert.equal(tab.length, 0);
  });
});
