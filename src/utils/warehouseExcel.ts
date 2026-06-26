import * as XLSX from 'xlsx';
import type { WarehouseItem, WarehouseItemStatus, WarehouseItemType } from '../types';
import { inventoryNumbersMatch, normalizeInventoryNumber } from './equipmentFields';
import { repairWarehousePendingDuplicates } from './warehousePendingMerge';

export const WAREHOUSE_EXCEL_SHEET = 'Warehouse';
export const WAREHOUSE_EXCEL_SHEET_LEGACY = 'Склад';
export const WAREHOUSE_EXCEL_META_SHEET = 'Info';
export const WAREHOUSE_EXCEL_META_SHEET_LEGACY = 'Инфо';
export const WAREHOUSE_EXCEL_VERSION = 'vicariustab-warehouse-v1';

/** Заголовки столбцов (рус.) — совпадают с экспортом и ожидаются при импорте */
export const WAREHOUSE_EXCEL_HEADERS = [
  'ID',
  'Наименование',
  'Категория',
  'Тип устройства',
  'Модель',
  'Инвентарный номер',
  'Количество',
  'Ед. изм.',
  'Цена за ед.',
  'Статус',
  'Склад',
  'Дата поступления',
  'Серийный номер',
  'Серийные номера (по ед.)',
  'Диагональ монитора (дюйм)',
  'Разделено от инв. №',
  'Номер части',
  'CPU',
  'RAM',
  'HDD/SSD',
  'GPU',
  'Материнская плата',
  'Блок питания',
  'Корпус',
  'Счёт-фактура',
  'Служебная записка',
  'Гарантия',
  'Доп. характеристики',
] as const;

const HEADER_ALIASES: Record<string, keyof WarehouseExcelRow> = {
  id: 'id',
  ID: 'id',
  name: 'name',
  type: 'type',
  model: 'model',
  quantity: 'quantity',
  unit: 'unit',
  status: 'status',
  inventorynumber: 'inventoryNumber',
  'inventory number': 'inventoryNumber',
  warehouse: 'warehouseName',
  'warehouse name': 'warehouseName',
  наименование: 'name',
  категория: 'type',
  'тип устройства': 'deviceType',
  модель: 'model',
  'инвентарный номер': 'inventoryNumber',
  количество: 'quantity',
  'ед. изм.': 'unit',
  'цена за ед.': 'costPerUnit',
  статус: 'status',
  склад: 'warehouseName',
  'дата поступления': 'receiptDate',
  'серийный номер': 'serialNumber',
  'серийные номера (по ед.)': 'unitSerialNumbers',
  'диагональ монитора (дюйм)': 'monitorDiagonalInches',
  'разделено от инв. №': 'splitFromInventoryNumber',
  'номер части': 'splitPartIndex',
  cpu: 'cpuModel',
  ram: 'ramModel',
  'hdd/ssd': 'hddModel',
  gpu: 'gpuModel',
  'материнская плата': 'motherboardModel',
  'блок питания': 'powerSupplyModel',
  корпус: 'caseModel',
  'счёт-фактура': 'invoiceInfo',
  'служебная записка': 'memoInfo',
  гарантия: 'warrantyInfo',
  'доп. характеристики': 'customSpecs',
};

const WAREHOUSE_TYPES = new Set<WarehouseItemType>([
  'Компьютеры',
  'Сетевое оборудование',
  'Периферия',
  'Оргтехника',
  'Видеонаблюдение',
  'Расходные материалы',
  'Лицензии ПО',
  'Другое',
]);

export interface WarehouseExcelRow {
  id?: string;
  name?: string;
  type?: string;
  deviceType?: string;
  model?: string;
  inventoryNumber?: string;
  quantity?: string | number;
  unit?: string;
  costPerUnit?: string | number;
  status?: string;
  warehouseName?: string;
  receiptDate?: string;
  serialNumber?: string;
  unitSerialNumbers?: string;
  monitorDiagonalInches?: string | number;
  splitFromInventoryNumber?: string;
  splitPartIndex?: string | number;
  cpuModel?: string;
  ramModel?: string;
  hddModel?: string;
  gpuModel?: string;
  motherboardModel?: string;
  powerSupplyModel?: string;
  caseModel?: string;
  invoiceInfo?: string;
  memoInfo?: string;
  warrantyInfo?: string;
  customSpecs?: string;
}

export interface WarehouseExcelImportResult {
  ok: boolean;
  items: WarehouseItem[];
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

function normalizeHeader(header: string): string {
  return header
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function headerToField(header: string): keyof WarehouseExcelRow | undefined {
  const norm = normalizeHeader(header);
  return HEADER_ALIASES[norm] ?? HEADER_ALIASES[header.trim()];
}

function isMetaSheetName(name: string): boolean {
  const n = normalizeHeader(name);
  return (
    n === normalizeHeader(WAREHOUSE_EXCEL_META_SHEET) ||
    n === normalizeHeader(WAREHOUSE_EXCEL_META_SHEET_LEGACY) ||
    n === 'info' ||
    n === 'инфо'
  );
}

function sheetHasWarehouseHeaders(sheet: XLSX.WorkSheet): boolean {
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  });
  const headerRow = (matrix[0] || []).map((c) => normalizeHeader(cellStr(c)));
  return (
    headerRow.includes('наименование') ||
    headerRow.includes('инвентарный номер') ||
    headerRow.includes('inventorynumber') ||
    headerRow.includes('name')
  );
}

function findWarehouseDataSheet(wb: XLSX.WorkBook): XLSX.WorkSheet | null {
  const preferredNames = [
    WAREHOUSE_EXCEL_SHEET,
    WAREHOUSE_EXCEL_SHEET_LEGACY,
    'Sheet1',
    'Лист1',
  ];
  for (const name of preferredNames) {
    const sheet = wb.Sheets[name];
    if (sheet && sheetHasWarehouseHeaders(sheet)) return sheet;
  }
  for (const name of wb.SheetNames) {
    if (isMetaSheetName(name)) continue;
    const sheet = wb.Sheets[name];
    if (sheet && sheetHasWarehouseHeaders(sheet)) return sheet;
  }
  for (const name of wb.SheetNames) {
    if (!isMetaSheetName(name) && wb.Sheets[name]) return wb.Sheets[name];
  }
  return wb.Sheets[wb.SheetNames[0]] ?? null;
}

export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === 'function') {
    return file.arrayBuffer().catch(() => readFileViaReader(file));
  }
  return readFileViaReader(file);
}

function readFileViaReader(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
        return;
      }
      reject(new Error('FileReader returned unexpected result'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
    reader.readAsArrayBuffer(file);
  });
}

function cellStr(v: unknown): string {
  if (v == null) return '';
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return v.toISOString().split('T')[0];
  }
  return String(v).trim();
}

function cellNum(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const n = parseFloat(cellStr(v).replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
}

function cellInt(v: unknown, fallback = 0): number {
  const n = Math.floor(cellNum(v, fallback));
  return Number.isFinite(n) ? n : fallback;
}

function parseUnitSerials(raw: string): string[] | undefined {
  const text = raw.trim();
  if (!text) return undefined;
  const parts = text.split(/[;|,\n]/).map((s) => s.trim()).filter(Boolean);
  return parts.length > 0 ? parts : undefined;
}

function serializeUnitSerials(nums?: string[]): string {
  if (!nums?.length) return '';
  return nums.join('; ');
}

function parseCustomSpecs(raw: string): { label: string; value: string }[] | undefined {
  const text = raw.trim();
  if (!text) return undefined;
  try {
    const parsed = JSON.parse(text) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .map((x) => ({
          label: cellStr((x as { label?: string }).label),
          value: cellStr((x as { value?: string }).value),
        }))
        .filter((x) => x.label);
    }
  } catch {
    /* pipe format */
  }
  const specs = text
    .split('|')
    .map((chunk) => {
      const eq = chunk.indexOf('=');
      if (eq <= 0) return null;
      return { label: chunk.slice(0, eq).trim(), value: chunk.slice(eq + 1).trim() };
    })
    .filter((x): x is { label: string; value: string } => !!x?.label);
  return specs.length > 0 ? specs : undefined;
}

function serializeCustomSpecs(specs?: { label: string; value: string }[]): string {
  if (!specs?.length) return '';
  return specs.map((s) => `${s.label}=${s.value}`).join('|');
}

export function warehouseItemToExcelRow(item: WarehouseItem): Record<string, string | number> {
  return {
    ID: item.id,
    Наименование: item.name,
    Категория: item.type,
    'Тип устройства': item.deviceType || '',
    Модель: item.model,
    'Инвентарный номер': item.inventoryNumber,
    Количество: item.quantity,
    'Ед. изм.': item.unit || 'шт.',
    'Цена за ед.': item.costPerUnit ?? 0,
    Статус: item.status,
    Склад: item.warehouseName || 'Основной склад ИТ',
    'Дата поступления': item.receiptDate || '',
    'Серийный номер': item.serialNumber || '',
    'Серийные номера (по ед.)': serializeUnitSerials(item.unitSerialNumbers),
    'Диагональ монитора (дюйм)': item.monitorDiagonalInches ?? '',
    'Разделено от инв. №': item.splitFromInventoryNumber || '',
    'Номер части': item.splitPartIndex ?? '',
    CPU: item.cpuModel || '',
    RAM: item.ramModel || '',
    'HDD/SSD': item.hddModel || '',
    GPU: item.gpuModel || '',
    'Материнская плата': item.motherboardModel || '',
    'Блок питания': item.powerSupplyModel || '',
    Корпус: item.caseModel || '',
    'Счёт-фактура': item.invoiceInfo || '',
    'Служебная записка': item.memoInfo || '',
    Гарантия: item.warrantyInfo || '',
    'Доп. характеристики': serializeCustomSpecs(item.customSpecs),
  };
}

function mapSheetRow(raw: Record<string, unknown>): WarehouseExcelRow {
  const mapped: WarehouseExcelRow = {};
  for (const [header, value] of Object.entries(raw)) {
    const key = headerToField(header);
    if (key) {
      (mapped as Record<string, unknown>)[key] = value;
    }
  }
  return mapped;
}

export function excelRowToWarehouseItem(
  row: WarehouseExcelRow,
  lineNo: number
): { item: Omit<WarehouseItem, 'id'> & { id?: string }; error?: string } {
  const name = cellStr(row.name);
  const type = cellStr(row.type) as WarehouseItemType;
  const model = cellStr(row.model);
  const inventoryNumber = cellStr(row.inventoryNumber);
  const quantity = cellInt(row.quantity, 0);
  const warehouseName = cellStr(row.warehouseName) || 'Основной склад ИТ';

  if (!name) return { item: {} as WarehouseItem, error: `Строка ${lineNo}: не указано наименование` };
  if (!WAREHOUSE_TYPES.has(type)) {
    return { item: {} as WarehouseItem, error: `Строка ${lineNo}: неверная категория «${row.type || ''}»` };
  }
  if (!model) return { item: {} as WarehouseItem, error: `Строка ${lineNo}: не указана модель` };
  if (!inventoryNumber) {
    return { item: {} as WarehouseItem, error: `Строка ${lineNo}: не указан инвентарный номер` };
  }
  if (quantity < 1) {
    return { item: {} as WarehouseItem, error: `Строка ${lineNo}: количество должно быть ≥ 1` };
  }

  const status = (cellStr(row.status) || 'В наличии') as WarehouseItemStatus;
  const splitPartRaw = cellStr(row.splitPartIndex);
  const splitPartIndex = splitPartRaw ? cellInt(splitPartRaw, 0) : undefined;

  const item: Omit<WarehouseItem, 'id'> & { id?: string } = {
    id: cellStr(row.id) || undefined,
    name,
    type,
    deviceType: cellStr(row.deviceType) || undefined,
    model,
    inventoryNumber,
    quantity,
    unit: cellStr(row.unit) || 'шт.',
    costPerUnit: Math.max(0, cellNum(row.costPerUnit, 0)),
    status,
    warehouseName,
    receiptDate: cellStr(row.receiptDate) || new Date().toISOString().split('T')[0],
    serialNumber: cellStr(row.serialNumber) || undefined,
    unitSerialNumbers: parseUnitSerials(cellStr(row.unitSerialNumbers)),
    monitorDiagonalInches: cellStr(row.monitorDiagonalInches)
      ? cellNum(row.monitorDiagonalInches)
      : undefined,
    splitFromInventoryNumber: cellStr(row.splitFromInventoryNumber) || undefined,
    splitPartIndex: splitPartIndex && splitPartIndex > 0 ? splitPartIndex : undefined,
    cpuModel: cellStr(row.cpuModel) || undefined,
    ramModel: cellStr(row.ramModel) || undefined,
    hddModel: cellStr(row.hddModel) || undefined,
    gpuModel: cellStr(row.gpuModel) || undefined,
    motherboardModel: cellStr(row.motherboardModel) || undefined,
    powerSupplyModel: cellStr(row.powerSupplyModel) || undefined,
    caseModel: cellStr(row.caseModel) || undefined,
    invoiceInfo: cellStr(row.invoiceInfo) || undefined,
    memoInfo: cellStr(row.memoInfo) || undefined,
    warrantyInfo: cellStr(row.warrantyInfo) || undefined,
    customSpecs: parseCustomSpecs(cellStr(row.customSpecs)),
  };

  return { item };
}

function duplicateInvInList(
  items: WarehouseItem[],
  inv: string,
  warehouseName: string,
  excludeId?: string
): boolean {
  const wh = warehouseName || 'Основной склад ИТ';
  return items.some(
    (w) =>
      w.id !== excludeId &&
      inventoryNumbersMatch(w.inventoryNumber, inv) &&
      (w.warehouseName || 'Основной склад ИТ') === wh
  );
}

export function applyWarehouseExcelImport(
  current: WarehouseItem[],
  rows: WarehouseExcelRow[]
): WarehouseExcelImportResult {
  const errors: string[] = [];
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let next = [...current];

  rows.forEach((row, index) => {
    const lineNo = index + 2;
    const parsed = excelRowToWarehouseItem(row, lineNo);
    if (parsed.error) {
      errors.push(parsed.error);
      skipped += 1;
      return;
    }

    const data = parsed.item;
    const whName = data.warehouseName || 'Основной склад ИТ';

    if (data.id) {
      const byId = next.find((w) => w.id === data.id);
      if (byId) {
        if (
          !inventoryNumbersMatch(byId.inventoryNumber, data.inventoryNumber) &&
          duplicateInvInList(next, data.inventoryNumber, whName, data.id)
        ) {
          errors.push(
            `Строка ${lineNo}: инв. № «${data.inventoryNumber}» уже занят на складе «${whName}»`
          );
          skipped += 1;
          return;
        }
        next = next.map((w) =>
          w.id === data.id
            ? {
                ...w,
                ...data,
                id: w.id,
                status: data.status === 'Списано' ? w.status : (data.status || 'В наличии'),
              }
            : w
        );
        updated += 1;
        return;
      }
    }

    const byInv = next.find(
      (w) =>
        inventoryNumbersMatch(w.inventoryNumber, data.inventoryNumber) &&
        (w.warehouseName || 'Основной склад ИТ') === whName
    );

    if (byInv) {
      if (byInv.name !== data.name || byInv.type !== data.type) {
        errors.push(
          `Строка ${lineNo}: инв. № «${data.inventoryNumber}» уже привязан к «${byInv.name}»`
        );
        skipped += 1;
        return;
      }
      next = next.map((w) =>
        w.id === byInv.id
          ? {
              ...w,
              ...data,
              id: w.id,
              status: data.status === 'Списано' ? w.status : (data.status || w.status),
            }
          : w
      );
      updated += 1;
      return;
    }

    if (duplicateInvInList(next, data.inventoryNumber, whName)) {
      errors.push(`Строка ${lineNo}: дублирующийся инв. № «${data.inventoryNumber}»`);
      skipped += 1;
      return;
    }

    const invKey = normalizeInventoryNumber(data.inventoryNumber);
    const crossDup = next.some(
      (w) =>
        w.id !== data.id &&
        normalizeInventoryNumber(w.inventoryNumber).toLowerCase() === invKey.toLowerCase() &&
        (w.warehouseName || 'Основной склад ИТ') !== whName
    );
    if (crossDup) {
      errors.push(`Строка ${lineNo}: инв. № «${data.inventoryNumber}» уже используется в системе`);
      skipped += 1;
      return;
    }

    const newItem: WarehouseItem = {
      ...(data as WarehouseItem),
      id: data.id && !next.some((w) => w.id === data.id) ? data.id : `wh-${Date.now()}-${index}`,
      status: data.status || 'В наличии',
    };
    next.push(newItem);
    created += 1;
  });

  next = repairWarehousePendingDuplicates(next);

  const dupCheck = new Map<string, string>();
  for (const w of next) {
    const inv = (w.inventoryNumber || '').trim();
    if (!inv) continue;
    const key = `${(w.warehouseName || 'Основной склад ИТ').toLowerCase()}::${inv.toLowerCase()}`;
    if (dupCheck.has(key)) {
      errors.push(`Конфликт инв. № «${inv}» после импорта (${dupCheck.get(key)} и ${w.id})`);
    } else {
      dupCheck.set(key, w.id);
    }
  }

  const hasBlockingErrors = errors.length > 0 && created === 0 && updated === 0;

  return {
    ok: !hasBlockingErrors,
    items: next,
    created,
    updated,
    skipped,
    errors,
  };
}

export function exportWarehouseItemsToExcelFile(
  items: WarehouseItem[],
  filename?: string
): void {
  const rows = items.map(warehouseItemToExcelRow);
  const meta = [{ Параметр: 'Формат', Значение: WAREHOUSE_EXCEL_VERSION }];
  const wsData = XLSX.utils.json_to_sheet(rows, { header: [...WAREHOUSE_EXCEL_HEADERS] });
  const wsMeta = XLSX.utils.json_to_sheet(meta);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsMeta, WAREHOUSE_EXCEL_META_SHEET);
  XLSX.utils.book_append_sheet(wb, wsData, WAREHOUSE_EXCEL_SHEET);
  const date = new Date().toISOString().split('T')[0];
  const outName = filename || `vicariustab-sklad-${date}.xlsx`;
  const bytes = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  triggerBlobDownload(blob, outName);
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function parseWarehouseExcelBuffer(buffer: ArrayBuffer): WarehouseExcelRow[] {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true, codepage: 65001 });
  const sheet = findWarehouseDataSheet(wb);
  if (!sheet) return [];

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: false,
  });

  return rawRows
    .map(mapSheetRow)
    .filter((row) => cellStr(row.name) || cellStr(row.inventoryNumber));
}

export async function parseWarehouseExcelFile(file: File): Promise<WarehouseExcelRow[]> {
  const buffer = await readFileAsArrayBuffer(file);
  if (!buffer.byteLength) {
    throw new Error('empty file');
  }
  return parseWarehouseExcelBuffer(buffer);
}
