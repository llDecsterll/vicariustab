export type DashboardSectionId =
  | 'stat_cards'
  | 'analytics_row'
  | 'details_row'
  | 'warehouse_strip';

export type StatCardId =
  | 'computers'
  | 'employees'
  | 'warehouse'
  | 'network'
  | 'printers'
  | 'cameras'
  | 'consumables'
  | 'other';

export type AnalyticsWidgetId = 'dynamics' | 'status_chart' | 'alerts';

export type DetailCardId = 'network_summary' | 'activities' | 'by_object' | 'inventory';

export type WarehouseStripId =
  | 'laptops'
  | 'monitors'
  | 'desktops'
  | 'printers'
  | 'switches'
  | 'access_points';

export interface DashboardLayoutState {
  sections: DashboardSectionId[];
  statCards: StatCardId[];
  analytics: AnalyticsWidgetId[];
  detailCards: DetailCardId[];
  warehouseStrip: WarehouseStripId[];
}

export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayoutState = {
  sections: ['stat_cards', 'analytics_row', 'details_row', 'warehouse_strip'],
  statCards: [
    'computers',
    'employees',
    'warehouse',
    'network',
    'printers',
    'cameras',
    'consumables',
    'other',
  ],
  analytics: ['dynamics', 'status_chart', 'alerts'],
  detailCards: ['network_summary', 'activities', 'by_object', 'inventory'],
  warehouseStrip: ['laptops', 'monitors', 'desktops', 'printers', 'switches', 'access_points'],
};

const STORAGE_KEY = 'vicariustab_dashboard_layout_v1';

function mergeOrder<T extends string>(
  saved: unknown,
  defaults: readonly T[],
  allowed: readonly T[]
): T[] {
  if (!Array.isArray(saved)) return [...defaults];
  const valid = saved.filter((x): x is T => typeof x === 'string' && allowed.includes(x as T));
  const missing = defaults.filter((id) => !valid.includes(id));
  return [...valid, ...missing];
}

export function loadDashboardLayout(): DashboardLayoutState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DASHBOARD_LAYOUT };
    const parsed = JSON.parse(raw) as Partial<DashboardLayoutState>;
    return {
      sections: mergeOrder(parsed.sections, DEFAULT_DASHBOARD_LAYOUT.sections, DEFAULT_DASHBOARD_LAYOUT.sections),
      statCards: mergeOrder(parsed.statCards, DEFAULT_DASHBOARD_LAYOUT.statCards, DEFAULT_DASHBOARD_LAYOUT.statCards),
      analytics: mergeOrder(parsed.analytics, DEFAULT_DASHBOARD_LAYOUT.analytics, DEFAULT_DASHBOARD_LAYOUT.analytics),
      detailCards: mergeOrder(parsed.detailCards, DEFAULT_DASHBOARD_LAYOUT.detailCards, DEFAULT_DASHBOARD_LAYOUT.detailCards),
      warehouseStrip: mergeOrder(
        parsed.warehouseStrip,
        DEFAULT_DASHBOARD_LAYOUT.warehouseStrip,
        DEFAULT_DASHBOARD_LAYOUT.warehouseStrip
      ),
    };
  } catch {
    return { ...DEFAULT_DASHBOARD_LAYOUT };
  }
}

export function saveDashboardLayout(layout: DashboardLayoutState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    /* ignore */
  }
}

export function moveListItem<T>(list: readonly T[], dragged: T, target: T): T[] {
  if (dragged === target) return [...list];
  const without = list.filter((item) => item !== dragged);
  const targetIndex = without.indexOf(target);
  if (targetIndex < 0) return [...list];
  const next = [...without];
  next.splice(targetIndex, 0, dragged);
  return next;
}

export function shiftListItem<T>(list: readonly T[], id: T, delta: -1 | 1): T[] {
  const index = list.indexOf(id);
  if (index < 0) return [...list];
  const target = index + delta;
  if (target < 0 || target >= list.length) return [...list];
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/** Ключи для t() — подписи виджетов в режиме настройки */
export function dashboardWidgetLabelKey(scope: string, id: string): string {
  switch (scope) {
    case 'section':
      switch (id as DashboardSectionId) {
        case 'stat_cards':
          return 'Показатели';
        case 'analytics_row':
          return 'Аналитика';
        case 'details_row':
          return 'Детали';
        case 'warehouse_strip':
          return 'Склад';
        default:
          return id;
      }
    case 'stat':
      switch (id as StatCardId) {
        case 'computers':
          return 'Компьютеры';
        case 'employees':
          return 'Сотрудники';
        case 'warehouse':
          return 'Оборудование на складе';
        case 'network':
          return 'Сетевое оборудование';
        case 'printers':
          return 'Принтеры';
        case 'cameras':
          return 'Камеры СКУД';
        case 'consumables':
          return 'Расходники';
        case 'other':
          return 'Прочее оборудование';
        default:
          return id;
      }
    case 'analytics':
      switch (id as AnalyticsWidgetId) {
        case 'dynamics':
          return 'Динамика оборудования';
        case 'status_chart':
          return 'Статусы оборудования';
        case 'alerts':
          return 'Требуют внимания';
        default:
          return id;
      }
    case 'detail':
      switch (id as DetailCardId) {
        case 'network_summary':
          return 'Сетевое оборудование';
        case 'activities':
          return 'Последние действия';
        case 'by_object':
          return 'Оборудование по объектам';
        case 'inventory':
          return 'Инвентаризация';
        default:
          return id;
      }
    case 'warehouse':
      switch (id as WarehouseStripId) {
        case 'laptops':
          return 'Ноутбуки';
        case 'monitors':
          return 'Мониторы';
        case 'desktops':
          return 'Системные блоки';
        case 'printers':
          return 'Принтеры';
        case 'switches':
          return 'Коммутаторы';
        case 'access_points':
          return 'Точки доступа';
        default:
          return id;
      }
    default:
      return id;
  }
}

export function listIndexOf<T>(list: readonly T[], id: T): number {
  return list.indexOf(id);
}

export function analyticsWidgetColClass(id: AnalyticsWidgetId): string {
  switch (id) {
    case 'dynamics':
      return 'lg:col-span-5';
    case 'status_chart':
      return 'lg:col-span-4';
    case 'alerts':
      return 'lg:col-span-3';
    default:
      return 'lg:col-span-12';
  }
}
