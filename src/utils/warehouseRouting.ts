/*
 * Strict warehouse → equipment group routing.
 * Warehouse receipt type is the source of truth for sidebar groups.
 */
import type {
  ComputerCategory,
  ComputerItem,
  ComputerStatus,
  CustomWarehouse,
  NetworkDevice,
  NetworkDeviceType,
  WarehouseItem,
  WarehouseItemType,
} from '../types';
import { inventoryNumbersMatch } from './equipmentFields';

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
  const active = computers.filter(
    (c) => c.status !== 'На складе' && c.status !== 'Списано'
  );
  switch (tab) {
    case 'computers':
      return active.filter((c) => c.category === 'Ноутбук' || c.category === 'ПК');
    case 'peripherals':
      return active.filter((c) => c.category === 'Монитор' || c.category === 'Периферия');
    case 'orgtech':
      return active.filter((c) => c.category === 'Оргтехника');
    case 'surveillance':
      return active.filter((c) => c.category === 'Видеонаблюдение');
    case 'consumables':
      return active.filter((c) => c.category === 'Расходники');
    case 'other_equip':
      return active.filter((c) => c.category === 'Другое');
    default:
      return active;
  }
}

export function getCategoriesForEquipmentTab(tab: EquipmentTab): ComputerCategory[] {
  switch (tab) {
    case 'computers':
      return ['ПК', 'Ноутбук'];
    case 'peripherals':
      return ['Монитор', 'Периферия'];
    case 'orgtech':
      return ['Оргтехника'];
    case 'surveillance':
      return ['Видеонаблюдение'];
    case 'consumables':
      return ['Расходники'];
    case 'other_equip':
      return ['Другое'];
    default:
      return [];
  }
}

export function getCategoryFilterLabel(category: ComputerCategory): string {
  switch (category) {
    case 'Ноутбук':
      return 'Ноутбуки';
    case 'ПК':
      return 'Персональные компьютеры (ПК)';
    case 'Монитор':
      return 'Мониторы';
    case 'Периферия':
      return 'Периферия';
    case 'Оргтехника':
      return 'Оргтехника';
    case 'Видеонаблюдение':
      return 'Видеонаблюдение';
    case 'Расходники':
      return 'Расходники';
    case 'Другое':
      return 'Другое';
    default:
      return category;
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

/** Derive lifecycle status for network devices (no explicit status field on model). */
export function getNetworkDeviceDisplayStatus(
  device: NetworkDevice,
  warehouseItems: WarehouseItem[],
  warehouses: CustomWarehouse[]
): ComputerStatus {
  const whItem = warehouseItems.find(
    (w) =>
      inventoryNumbersMatch(w.inventoryNumber, device.inventoryNumber) &&
      w.quantity > 0 &&
      w.type === 'Сетевое оборудование'
  );
  if (whItem) {
    const wh = warehouses.find((w) => w.name === whItem.warehouseName);
    const stockObject = wh?.objectName ?? warehouses[0]?.objectName;
    if (stockObject && device.objectName === stockObject) {
      return 'На складе';
    }
  }
  return 'В работе';
}

export function filterNetworkDevicesForEquipmentView(
  devices: NetworkDevice[],
  warehouseItems: WarehouseItem[],
  warehouses: CustomWarehouse[]
): NetworkDevice[] {
  return devices.filter(
    (d) => getNetworkDeviceDisplayStatus(d, warehouseItems, warehouses) !== 'На складе'
  );
}

export const NETWORK_CATEGORY_FILTER_OPTIONS: { value: NetworkDeviceType | 'Все'; label: string }[] = [
  { value: 'Все', label: 'Все категории' },
  { value: 'Коммутатор', label: 'Коммутаторы' },
  { value: 'Маршрутизатор', label: 'Маршрутизаторы' },
  { value: 'Точка доступа', label: 'Точки доступа' },
  { value: 'Другое', label: 'Другое' },
];
