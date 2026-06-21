import type { ComputerCategory, WarehouseItem, WarehouseItemType } from '../types';

/** Max length for product title and model on all equipment forms */
export const EQUIPMENT_TITLE_MAX_LENGTH = 32;

export function limitEquipmentTitle(value: string): string {
  return value.slice(0, EQUIPMENT_TITLE_MAX_LENGTH);
}

export interface ComputerReceiptSpecs {
  serialNumber?: string;
  cpuModel?: string;
  ramModel?: string;
  hddModel?: string;
  gpuModel?: string;
  motherboardModel?: string;
  powerSupplyModel?: string;
  caseModel?: string;
}

export function supportsComputerSpecifications(params: {
  category?: ComputerCategory | string;
  deviceType?: string;
  warehouseType?: WarehouseItemType;
}): boolean {
  if (params.warehouseType === 'Компьютеры') return true;
  const dt = params.deviceType || '';
  const cat = params.category || '';
  return (
    cat === 'ПК' ||
    cat === 'Ноутбук' ||
    dt === 'ПК' ||
    dt === 'Ноутбук' ||
    dt === 'Сервер'
  );
}

export function getWarehouseItemSpecs(item: WarehouseItem | ComputerReceiptSpecs): ComputerReceiptSpecs {
  return {
    serialNumber: item.serialNumber,
    cpuModel: item.cpuModel,
    ramModel: item.ramModel,
    hddModel: item.hddModel,
    gpuModel: item.gpuModel,
    motherboardModel: item.motherboardModel,
    powerSupplyModel: item.powerSupplyModel,
    caseModel: item.caseModel,
  };
}

/** Match base inventory number or batch suffix (e.g. INV-001, INV-001-2) */
export function matchesBaseInventoryNumber(
  itemInventoryNumber: string | undefined | null,
  baseInventoryNumber: string | undefined | null
): boolean {
  if (!itemInventoryNumber || !baseInventoryNumber) return false;
  return (
    itemInventoryNumber === baseInventoryNumber ||
    itemInventoryNumber.startsWith(`${baseInventoryNumber}-`)
  );
}

/** Fallback for network equipment without an assigned inventory number */
export function normalizeInventoryNumber(inventoryNumber: string | undefined | null): string {
  const trimmed = (inventoryNumber || '').trim();
  return trimmed || 'NET-EQ';
}

export function inventoryNumbersMatch(
  a: string | undefined | null,
  b: string | undefined | null
): boolean {
  const na = normalizeInventoryNumber(a);
  const nb = normalizeInventoryNumber(b);
  if (na === nb) return true;
  return matchesBaseInventoryNumber(a, b) || matchesBaseInventoryNumber(b, a);
}

/** Allocate unique inv. numbers for a warehouse batch (base, base-1, base-2, …). */
export function allocateBatchInventoryNumbers(
  baseInventoryNumber: string,
  existingInventoryNumbers: (string | undefined | null)[],
  count: number
): string[] {
  const base = baseInventoryNumber.trim();
  if (!base || count <= 0) return [];

  const taken = new Set(
    existingInventoryNumbers
      .filter((inv): inv is string => Boolean(inv?.trim()))
      .filter((inv) => matchesBaseInventoryNumber(inv, base))
      .map((inv) => inv.trim())
  );

  if (count === 1 && !taken.has(base)) {
    return [base];
  }

  const result: string[] = [];
  let n = 1;
  while (result.length < count) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) {
      result.push(candidate);
      taken.add(candidate);
    }
    n++;
  }
  return result;
}

export function isNotLinkedToInventoryBase(
  itemInventoryNumber: string | undefined | null,
  baseInventoryNumber: string | undefined | null
): boolean {
  if (!baseInventoryNumber) return true;
  return !inventoryNumbersMatch(itemInventoryNumber, baseInventoryNumber);
}

/** Apply receipt specs to a single registry unit (supports batch qty > 1) */
export function buildComputerSpecsFromReceipt(
  specs: ComputerReceiptSpecs,
  unitIndex: number,
  totalQty: number
): Required<ComputerReceiptSpecs> {
  const serial = (specs.serialNumber || '').trim();
  const unitSerial = totalQty > 1 && serial ? `${serial}-${unitIndex + 1}` : serial;

  return {
    serialNumber: unitSerial,
    cpuModel: specs.cpuModel || '',
    ramModel: specs.ramModel || '',
    hddModel: specs.hddModel || '',
    gpuModel: specs.gpuModel || '',
    motherboardModel: specs.motherboardModel || '',
    powerSupplyModel: specs.powerSupplyModel || '',
    caseModel: specs.caseModel || '',
  };
}

export function hasAnyComputerSpecs(specs: ComputerReceiptSpecs): boolean {
  return Boolean(
    specs.serialNumber ||
      specs.cpuModel ||
      specs.ramModel ||
      specs.hddModel ||
      specs.gpuModel ||
      specs.motherboardModel ||
      specs.powerSupplyModel ||
      specs.caseModel
  );
}
