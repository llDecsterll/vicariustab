/*
 * Strict warehouse → equipment group routing.
 * Warehouse receipt type is the source of truth for sidebar groups.
 */
import type { ComputerCategory, ComputerItem, NetworkDeviceType, WarehouseItemType } from '../types';

export type EquipmentTab =
  | 'computers'
  | 'peripherals'
  | 'orgtech'
  | 'surveillance'
  | 'consumables'
  | 'other_equip';

export interface WarehouseComputerRoute {
  category: ComputerCategory;
  deviceType: string;
  equipmentTab: EquipmentTab;
}

const WAREHOUSE_TYPE_TAB: Record<WarehouseItemType, EquipmentTab | 'network' | 'software'> = {
  Компьютеры: 'computers',
  'Сетевое оборудование': 'network',
  Периферия: 'peripherals',
  Оргтехника: 'orgtech',
  Видеонаблюдение: 'surveillance',
  'Расходные материалы': 'consumables',
  'Лицензии ПО': 'software',
  Другое: 'other_equip',
};

/** Map sidebar tab → allowed computer categories */
export function filterComputersByEquipmentTab(
  computers: ComputerItem[],
  tab: EquipmentTab
): ComputerItem[] {
  switch (tab) {
    case 'computers':
      return computers.filter((c) => c.category === 'Ноутбук' || c.category === 'ПК');
    case 'peripherals':
      return computers.filter((c) => c.category === 'Монитор' || c.category === 'Периферия');
    case 'orgtech':
      return computers.filter((c) => c.category === 'Оргтехника');
    case 'surveillance':
      return computers.filter((c) => c.category === 'Видеонаблюдение');
    case 'consumables':
      return computers.filter((c) => c.category === 'Расходники');
    case 'other_equip':
      return computers.filter((c) => c.category === 'Другое');
    default:
      return computers;
  }
}

export function getEquipmentTabForCategory(category: ComputerCategory): EquipmentTab {
  switch (category) {
    case 'Ноутбук':
    case 'ПК':
      return 'computers';
    case 'Монитор':
    case 'Периферия':
      return 'peripherals';
    case 'Оргтехника':
      return 'orgtech';
    case 'Видеонаблюдение':
      return 'surveillance';
    case 'Расходники':
      return 'consumables';
    default:
      return 'other_equip';
  }
}

function normalizeDeviceType(deviceType: string | undefined, fallback: string): string {
  const dt = (deviceType || fallback).trim();
  return dt || fallback;
}

/** Strict route: warehouse group + device type → category & equipment tab */
export function resolveWarehouseComputerRoute(item: {
  type: WarehouseItemType;
  deviceType?: string;
  name?: string;
  model?: string;
}): WarehouseComputerRoute | null {
  const tab = WAREHOUSE_TYPE_TAB[item.type];
  if (tab === 'network' || tab === 'software') return null;

  const nameLower = `${item.name || ''} ${item.model || ''}`.toLowerCase();
  const dt = normalizeDeviceType(item.deviceType, item.name || 'Оборудование');

  switch (item.type) {
    case 'Компьютеры': {
      const isLaptop =
        dt === 'Ноутбук' ||
        nameLower.includes('ноутбук') ||
        nameLower.includes('laptop') ||
        nameLower.includes('macbook');
      return {
        category: isLaptop ? 'Ноутбук' : 'ПК',
        deviceType: isLaptop ? 'Ноутбук' : dt === 'Сервер' ? 'Сервер' : 'ПК',
        equipmentTab: 'computers',
      };
    }
    case 'Периферия':
      return {
        category: dt === 'Монитор' || nameLower.includes('монитор') ? 'Монитор' : 'Периферия',
        deviceType: dt === 'Монитор' ? 'Монитор' : dt,
        equipmentTab: 'peripherals',
      };
    case 'Оргтехника': {
      let orgDevice = dt;
      if (dt === 'Другое' || !dt) {
        if (nameLower.includes('мфу')) orgDevice = 'МФУ';
        else if (nameLower.includes('принтер')) orgDevice = 'Принтер';
        else if (nameLower.includes('сканер')) orgDevice = 'Сканер';
        else orgDevice = 'МФУ';
      }
      return {
        category: 'Оргтехника',
        deviceType: orgDevice,
        equipmentTab: 'orgtech',
      };
    }
    case 'Видеонаблюдение':
      return {
        category: 'Видеонаблюдение',
        deviceType:
          dt === 'Видеорегистратор' || nameLower.includes('nvr') || nameLower.includes('dvr')
            ? 'DVR/NVR'
            : 'Видеокамера',
        equipmentTab: 'surveillance',
      };
    case 'Расходные материалы':
      return {
        category: 'Расходники',
        deviceType: dt === 'Картриджи' || nameLower.includes('картридж') ? 'Картриджи' : dt,
        equipmentTab: 'consumables',
      };
    case 'Другое':
    default:
      return {
        category: 'Другое',
        deviceType: dt,
        equipmentTab: 'other_equip',
      };
  }
}

export function resolveNetworkDeviceType(item: {
  deviceType?: string;
  name?: string;
}): NetworkDeviceType {
  const raw = `${item.deviceType || ''} ${item.name || ''}`.toLowerCase();
  if (raw.includes('маршрутиз') || raw.includes('router') || raw.includes('роутер')) {
    return 'Маршрутизатор';
  }
  if (raw.includes('точка') || raw.includes('access point') || raw.includes('wifi')) {
    return 'Точка доступа';
  }
  if (raw.includes('коммут') || raw.includes('switch')) {
    return 'Коммутатор';
  }
  return 'Коммутатор';
}

export function equipmentTabLabel(tab: EquipmentTab): string {
  switch (tab) {
    case 'computers':
      return 'Компьютеры';
    case 'peripherals':
      return 'Периферия';
    case 'orgtech':
      return 'Принтеры';
    case 'surveillance':
      return 'Видеонаблюдение';
    case 'consumables':
      return 'Расходники';
    case 'other_equip':
      return 'Другое оборудование';
    default:
      return tab;
  }
}
