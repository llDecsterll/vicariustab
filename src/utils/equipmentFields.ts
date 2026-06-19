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
