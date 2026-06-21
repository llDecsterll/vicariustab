/*
 * Empty inventory workspace — no demo seed after purge
 */
import type {
  Activity,
  ComputerItem,
  CustomWarehouse,
  EmployeeItem,
  InventoryAudit,
  NetworkDevice,
  ObjectItem,
  SoftwareItem,
  WarehouseItem,
  WarehouseWriteOff,
} from './types';

export const DEFAULT_WAREHOUSES: CustomWarehouse[] = [
  {
    id: 'wh-1',
    name: 'Основной склад ИТ',
    objectName: 'Главный офис',
    description: 'Основной склад для ИТ-оборудования компании',
  },
];

export interface EmptyInventoryState {
  objects: ObjectItem[];
  networkDevices: NetworkDevice[];
  computers: ComputerItem[];
  employees: EmployeeItem[];
  warehouseItems: WarehouseItem[];
  softwareItems: SoftwareItem[];
  audits: InventoryAudit[];
  warehouseWriteOffs: WarehouseWriteOff[];
  warehouses: CustomWarehouse[];
}

export function createEmptyInventoryState(): EmptyInventoryState {
  return {
    objects: [],
    networkDevices: [],
    computers: [],
    employees: [],
    warehouseItems: [],
    softwareItems: [],
    audits: [],
    warehouseWriteOffs: [],
    warehouses: DEFAULT_WAREHOUSES.map((w) => ({ ...w })),
  };
}

export function createPurgeActivityLog(actorName?: string): Activity {
  return {
    id: `act-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
    timestamp: new Date().toISOString(),
    user: `${actorName || 'Администратор'} (Админ)`,
    action: 'Очистка базы данных',
    detail:
      'Удалены все данные инвентаризации (объекты, сотрудники, оборудование, склад, ПО, аудиты). Учётные записи, лицензия и настройки системы сохранены.',
    type: 'system',
  };
}

/** Remove inventory tables from browser cache (users/license/UI settings stay). */
export function clearInventoryLocalStorage(): void {
  const keys = [
    'it_objects',
    'it_network',
    'it_computers',
    'it_employees',
    'it_warehouse',
    'it_software',
    'it_activities',
    'it_audits',
    'it_warehouse_writeoffs',
    'it_custom_warehouses',
    'it_custom_warranties',
    'it_custom_departments',
    'it_deleted_warranties',
  ];
  for (const key of keys) {
    localStorage.removeItem(key);
  }
}
