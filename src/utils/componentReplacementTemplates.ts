/*
 * Predefined «было / стало» rows for component replacement by equipment type.
 */
export type ComponentReplacementProfile =
  | 'pc'
  | 'laptop'
  | 'network'
  | 'monitor'
  | 'printer_mfu'
  | 'scanner'
  | 'video_recorder'
  | 'generic_other';

export interface ComponentReplacementSlot {
  key: string;
  label: string;
  /** User types the component name (generic «Другое» rows). */
  customLabel?: boolean;
}

const PC_SLOTS: ComponentReplacementSlot[] = [
  { key: 'cpu', label: 'Процессор (CPU)' },
  { key: 'motherboard', label: 'Материнская плата' },
  { key: 'ram', label: 'Оперативная память (RAM)' },
  { key: 'storage', label: 'Накопитель (SSD или HDD)' },
  { key: 'psu', label: 'Блок питания (PSU)' },
  { key: 'case', label: 'Корпус' },
  { key: 'cooling', label: 'Система охлаждения' },
];

const LAPTOP_SLOTS: ComponentReplacementSlot[] = [
  { key: 'display', label: 'Экран (дисплей)' },
  { key: 'motherboard', label: 'Материнская плата' },
  { key: 'cpu', label: 'Процессор (CPU)' },
  { key: 'ram', label: 'Оперативная память (RAM)' },
  { key: 'storage', label: 'Накопитель (SSD или HDD)' },
  { key: 'gpu', label: 'Видеокарта' },
  { key: 'battery', label: 'Аккумулятор (батарея)' },
  { key: 'cooling', label: 'Система охлаждения (кулер и тепловые трубки)' },
  { key: 'keyboard_touchpad', label: 'Клавиатура и тачпад' },
  { key: 'wifi_bt', label: 'Модули Wi-Fi и Bluetooth' },
  { key: 'av', label: 'Веб-камера, микрофон и динамики' },
  { key: 'charger', label: 'Зарядное устройство (адаптер питания)' },
];

const NETWORK_SLOTS: ComponentReplacementSlot[] = [
  { key: 'charger', label: 'Зарядное устройство (адаптер питания)' },
];

const MONITOR_SLOTS: ComponentReplacementSlot[] = [
  { key: 'charger', label: 'Зарядное устройство (адаптер питания)' },
  { key: 'display', label: 'Экран (дисплей)' },
];

const PRINTER_MFU_SLOTS: ComponentReplacementSlot[] = [
  { key: 'scanner', label: 'Сканер (матрица, лампа подсветки)' },
  { key: 'copy_module', label: 'Копировальный модуль' },
  { key: 'psu', label: 'Блок питания' },
  { key: 'paper_feed', label: 'Механизм подачи бумаги' },
  { key: 'print_head', label: 'Печатающая головка (струйный) или лазерный модуль (лазерный)' },
];

const SCANNER_SLOTS: ComponentReplacementSlot[] = [
  { key: 'optics', label: 'Оптическая система' },
  { key: 'backlight', label: 'Светодиодная или ламповая подсветка' },
  { key: 'sensor_matrix', label: 'Матрица считывания изображения' },
  { key: 'control_board', label: 'Плата управления' },
  { key: 'psu', label: 'Блок питания' },
];

const VIDEO_RECORDER_SLOTS: ComponentReplacementSlot[] = [
  { key: 'storage', label: 'Накопитель (SSD или HDD)' },
];

const GENERIC_OTHER_SLOTS: ComponentReplacementSlot[] = [
  { key: 'custom-1', label: '', customLabel: true },
  { key: 'custom-2', label: '', customLabel: true },
  { key: 'custom-3', label: '', customLabel: true },
  { key: 'custom-4', label: '', customLabel: true },
];

const PROFILE_SLOTS: Record<ComponentReplacementProfile, ComponentReplacementSlot[]> = {
  pc: PC_SLOTS,
  laptop: LAPTOP_SLOTS,
  network: NETWORK_SLOTS,
  monitor: MONITOR_SLOTS,
  printer_mfu: PRINTER_MFU_SLOTS,
  scanner: SCANNER_SLOTS,
  video_recorder: VIDEO_RECORDER_SLOTS,
  generic_other: GENERIC_OTHER_SLOTS,
};

export function getComponentReplacementSlots(
  profile: ComponentReplacementProfile
): ComponentReplacementSlot[] {
  return PROFILE_SLOTS[profile];
}

export function resolveComponentReplacementProfile(input: {
  itemType?: 'computer' | 'network' | 'warehouse';
  category?: string;
  deviceType?: string;
  warehouseType?: string;
}): ComponentReplacementProfile | null {
  const { itemType, category, deviceType, warehouseType } = input;
  const dt = (deviceType || '').trim();

  if (itemType === 'network' || warehouseType === 'Сетевое оборудование') {
    return 'network';
  }

  if (category === 'ПК' || dt === 'ПК') return 'pc';
  if (category === 'Ноутбук' || dt === 'Ноутбук') return 'laptop';
  if (category === 'Монитор' || dt === 'Монитор') return 'monitor';

  if (category === 'Видеонаблюдение' || warehouseType === 'Видеонаблюдение') {
    if (dt === 'Видеорегистратор') return 'video_recorder';
  }

  if (category === 'Оргтехника' || warehouseType === 'Оргтехника') {
    if (dt === 'Сканер') return 'scanner';
    if (dt === 'Принтер' || dt === 'МФУ' || !dt || dt === 'Другое') return 'printer_mfu';
  }

  if (category === 'Другое' || dt === 'Другое') return 'generic_other';

  if (
    category === 'Периферия' ||
    category === 'Видеонаблюдение' ||
    category === 'Оргтехника'
  ) {
    return 'generic_other';
  }

  return null;
}

/** Latest «стало» per component name — used to pre-fill «было». */
export function latestComponentValueByName(
  replacedComponents: { name: string; newDetails: string; date: string }[] | undefined,
  componentName: string
): string {
  if (!replacedComponents?.length || !componentName.trim()) return '';
  const matches = replacedComponents
    .filter((c) => c.name.trim() === componentName.trim())
    .sort((a, b) => b.date.localeCompare(a.date));
  return matches[0]?.newDetails || '';
}
