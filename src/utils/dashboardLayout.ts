import { memStorage } from './memoryStorage';

export interface GridLayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export type GridLayout = GridLayoutItem[];

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

export type DetailCardId =
  | 'network_summary'
  | 'activities'
  | 'by_object'
  | 'inventory'
  | 'software_monitoring';

export type WarehouseStripId =
  | 'laptops'
  | 'monitors'
  | 'desktops'
  | 'printers'
  | 'switches'
  | 'access_points';

export type DashboardWidgetId =
  | `stat:${StatCardId}`
  | `analytics:${AnalyticsWidgetId}`
  | `detail:${DetailCardId}`
  | 'warehouse:title'
  | `warehouse:${WarehouseStripId}`;

export const DASHBOARD_GRID_COLS = 12;
export const DASHBOARD_ROW_HEIGHT = 36;
export const DASHBOARD_GRID_MARGIN: [number, number] = [8, 8];
export const DASHBOARD_HEADER_EDIT_SLOT_ID = 'dashboard-header-edit-slot';

export interface DashboardLayoutStateV1 {
  sections: DashboardSectionId[];
  statCards: StatCardId[];
  analytics: AnalyticsWidgetId[];
  detailCards: DetailCardId[];
  warehouseStrip: WarehouseStripId[];
}

export interface DashboardLayoutState {
  version: 11;
  items: GridLayout;
}

interface StoredDashboardLayout {
  version: number;
  items: GridLayout;
}

const STORAGE_KEY = 'vicariustab_dashboard_layout_v11';
const STORAGE_KEY_V10 = 'vicariustab_dashboard_layout_v10';
const STORAGE_KEY_V9 = 'vicariustab_dashboard_layout_v9';
const STORAGE_KEY_V8 = 'vicariustab_dashboard_layout_v8';
const STORAGE_KEY_V7 = 'vicariustab_dashboard_layout_v7';
const STORAGE_KEY_V6 = 'vicariustab_dashboard_layout_v6';
const STORAGE_KEY_V5 = 'vicariustab_dashboard_layout_v5';
const STORAGE_KEY_V4 = 'vicariustab_dashboard_layout_v4';
const STORAGE_KEY_V3 = 'vicariustab_dashboard_layout_v3';
const STORAGE_KEY_V2 = 'vicariustab_dashboard_layout_v2';
const STORAGE_KEY_V1 = 'vicariustab_dashboard_layout_v1';

const STAT_IDS: StatCardId[] = [
  'computers',
  'employees',
  'warehouse',
  'network',
  'printers',
  'cameras',
  'consumables',
  'other',
];

const ANALYTICS_IDS: AnalyticsWidgetId[] = ['dynamics', 'status_chart', 'alerts'];

const DETAIL_IDS: DetailCardId[] = [
  'network_summary',
  'activities',
  'by_object',
  'inventory',
  'software_monitoring',
];

const WAREHOUSE_IDS: WarehouseStripId[] = [
  'laptops',
  'monitors',
  'desktops',
  'printers',
  'switches',
  'access_points',
];

export const ALL_DASHBOARD_WIDGET_IDS: DashboardWidgetId[] = [
  ...STAT_IDS.map((id) => `stat:${id}` as const),
  ...ANALYTICS_IDS.map((id) => `analytics:${id}` as const),
  ...DETAIL_IDS.map((id) => `detail:${id}` as const),
  'warehouse:title',
  ...WAREHOUSE_IDS.map((id) => `warehouse:${id}` as const),
];

const WIDGET_SIZE: Record<
  DashboardWidgetId,
  { w: number; h: number; minW: number; minH: number; maxW: number; maxH: number }
> = {
  'stat:computers': { w: 2, h: 2, minW: 1, minH: 2, maxW: 4, maxH: 4 },
  'stat:employees': { w: 2, h: 2, minW: 1, minH: 2, maxW: 4, maxH: 4 },
  'stat:warehouse': { w: 2, h: 2, minW: 1, minH: 2, maxW: 4, maxH: 4 },
  'stat:network': { w: 2, h: 2, minW: 1, minH: 2, maxW: 4, maxH: 4 },
  'stat:printers': { w: 2, h: 2, minW: 1, minH: 2, maxW: 4, maxH: 4 },
  'stat:cameras': { w: 2, h: 2, minW: 1, minH: 2, maxW: 4, maxH: 4 },
  'stat:consumables': { w: 2, h: 2, minW: 1, minH: 2, maxW: 4, maxH: 4 },
  'stat:other': { w: 2, h: 2, minW: 1, minH: 2, maxW: 4, maxH: 4 },
  'analytics:dynamics': { w: 5, h: 6, minW: 4, minH: 5, maxW: 12, maxH: 12 },
  'analytics:status_chart': { w: 4, h: 6, minW: 3, minH: 4, maxW: 12, maxH: 12 },
  'analytics:alerts': { w: 3, h: 6, minW: 2, minH: 4, maxW: 12, maxH: 12 },
  'detail:network_summary': { w: 5, h: 6, minW: 3, minH: 4, maxW: 12, maxH: 14 },
  'detail:activities': { w: 4, h: 6, minW: 2, minH: 5, maxW: 12, maxH: 14 },
  'detail:by_object': { w: 5, h: 6, minW: 2, minH: 3, maxW: 12, maxH: 14 },
  'detail:inventory': { w: 3, h: 12, minW: 2, minH: 8, maxW: 12, maxH: 14 },
  'detail:software_monitoring': { w: 4, h: 6, minW: 3, minH: 4, maxW: 12, maxH: 8 },
  'warehouse:title': { w: 12, h: 1, minW: 3, minH: 1, maxW: 12, maxH: 2 },
  'warehouse:laptops': { w: 2, h: 3, minW: 1, minH: 2, maxW: 6, maxH: 8 },
  'warehouse:monitors': { w: 2, h: 3, minW: 1, minH: 2, maxW: 6, maxH: 8 },
  'warehouse:desktops': { w: 2, h: 3, minW: 1, minH: 2, maxW: 6, maxH: 8 },
  'warehouse:printers': { w: 2, h: 3, minW: 1, minH: 2, maxW: 6, maxH: 8 },
  'warehouse:switches': { w: 2, h: 3, minW: 1, minH: 2, maxW: 6, maxH: 8 },
  'warehouse:access_points': { w: 2, h: 3, minW: 1, minH: 2, maxW: 6, maxH: 8 },
};

function gridItem(id: DashboardWidgetId, x: number, y: number): GridLayoutItem {
  const size = WIDGET_SIZE[id];
  return {
    i: id,
    x,
    y,
    w: size.w,
    h: size.h,
    minW: size.minW,
    minH: size.minH,
    maxW: size.maxW,
    maxH: size.maxH,
  };
}

function statCardItem(id: StatCardId, x: number, y: number): GridLayoutItem {
  const base = gridItem(`stat:${id}`, x, y);
  return { ...base, w: 3, minW: 2, maxW: 6 };
}

export function buildDefaultGridLayout(): GridLayout {
  const items: GridLayoutItem[] = [];

  // Два ряда по 4 сводные карточки (4×3 = 12 колонок)
  (['computers', 'employees', 'warehouse', 'network'] as const).forEach((id, index) => {
    items.push(statCardItem(id, index * 3, 0));
  });
  (['printers', 'cameras', 'consumables', 'other'] as const).forEach((id, index) => {
    items.push(statCardItem(id, index * 3, 2));
  });

  // Аналитика (y=4, h=6): 4 + 5 + 3 = 12
  items.push(gridItem('analytics:status_chart', 0, 4));
  items.push(gridItem('analytics:dynamics', 4, 4));
  items.push(gridItem('analytics:alerts', 9, 4));

  // Детализация верх (y=10, h=6): действия | сеть | инвентаризация (высокая колонка справа)
  items.push(gridItem('detail:activities', 0, 10));
  items.push(gridItem('detail:network_summary', 4, 10));
  items.push(gridItem('detail:inventory', 9, 10));

  // Детализация низ (y=16, h=6): мониторинг ПО | по объектам — заполняют левую и центральную колонки
  items.push(gridItem('detail:software_monitoring', 0, 16));
  items.push(gridItem('detail:by_object', 4, 16));

  const warehouseTitleY = 22;
  items.push(gridItem('warehouse:title', 0, warehouseTitleY));
  WAREHOUSE_IDS.forEach((id, index) => {
    items.push(gridItem(`warehouse:${id}`, index * 2, warehouseTitleY + 1));
  });

  return items;
}

export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayoutState = {
  version: 11,
  items: buildDefaultGridLayout(),
};

function applyCanonicalDashboardLayout(items: GridLayout): GridLayout {
  const templates = buildDefaultGridLayout();
  const byId = new Map(items.map((item) => [item.i, item]));

  return templates.map((template) => {
    const existing = byId.get(template.i);
    if (!existing) return { ...template };
    return {
      ...existing,
      x: template.x,
      y: template.y,
      w: template.w,
      h: template.h,
      minW: template.minW,
      minH: template.minH,
      maxW: template.maxW,
      maxH: template.maxH,
    };
  });
}

function tightenStoredLayout(items: GridLayout): GridLayout {
  let next = sanitizeLayoutItems(items);
  if (hasOverlappingGridItems(next)) {
    next = applyCanonicalDashboardLayout(next);
    if (hasOverlappingGridItems(next)) {
      return buildDefaultGridLayout();
    }
  }
  return next;
}

function mergeOrder<T extends string>(saved: unknown, defaults: readonly T[]): T[] {
  if (!Array.isArray(saved)) return [...defaults];
  const valid = saved.filter((x): x is T => typeof x === 'string' && defaults.includes(x as T));
  const missing = defaults.filter((id) => !valid.includes(id));
  return [...valid, ...missing];
}

function layoutFromV1(v1: DashboardLayoutStateV1): GridLayout {
  const items: GridLayoutItem[] = [];
  let y = 0;

  const sectionOrder = mergeOrder(v1.sections, [
    'stat_cards',
    'analytics_row',
    'details_row',
    'warehouse_strip',
  ] as const);

  for (const section of sectionOrder) {
    switch (section) {
      case 'stat_cards': {
        const stats = mergeOrder(v1.statCards, STAT_IDS);
        stats.forEach((id, index) => {
          const col = index % 6;
          const row = Math.floor(index / 6);
          items.push(gridItem(`stat:${id}`, col * 2, y + row * 3));
        });
        y += Math.ceil(stats.length / 6) * 3;
        break;
      }
      case 'analytics_row': {
        const analytics = mergeOrder(v1.analytics, ANALYTICS_IDS);
        let x = 0;
        for (const id of analytics) {
          const item = gridItem(`analytics:${id}`, x, y);
          items.push(item);
          x += item.w;
        }
        y += 10;
        break;
      }
      case 'details_row': {
        const details = mergeOrder(v1.detailCards, DETAIL_IDS);
        details.forEach((id, index) => {
          items.push(gridItem(`detail:${id}`, index * 3, y));
        });
        y += 9;
        break;
      }
      case 'warehouse_strip': {
        items.push(gridItem('warehouse:title', 0, y));
        y += 1;
        const strip = mergeOrder(v1.warehouseStrip, WAREHOUSE_IDS);
        strip.forEach((id, index) => {
          items.push(gridItem(`warehouse:${id}`, index * 2, y));
        });
        y += 4;
        break;
      }
      default:
        break;
    }
  }

  return items.length > 0 ? items : buildDefaultGridLayout();
}

function clampLayoutItem(id: DashboardWidgetId, existing: GridLayoutItem): GridLayoutItem {
  const size = WIDGET_SIZE[id as DashboardWidgetId];
  const w = Math.max(size.minW, Math.min(existing.w, size.maxW, DASHBOARD_GRID_COLS));
  const h = Math.max(size.minH, Math.min(existing.h, size.maxH));
  const x = Math.max(0, Math.min(existing.x, DASHBOARD_GRID_COLS - w));
  const y = Math.max(0, existing.y);

  return {
    i: id,
    x,
    y,
    w,
    h,
    minW: size.minW,
    minH: size.minH,
    maxW: size.maxW,
    maxH: size.maxH,
  };
}

function rebalanceSavedSizes(existing: GridLayoutItem, id: DashboardWidgetId): GridLayoutItem {
  const defaults = WIDGET_SIZE[id];
  let { w, h } = existing;

  if (id.startsWith('stat:')) {
    if (h < defaults.minH) h = defaults.minH;
    if (w < defaults.minW) w = defaults.minW;
  } else if (id.startsWith('analytics:') && h > defaults.h + 6) {
    h = defaults.h;
  } else if (id.startsWith('detail:') && h > defaults.h + 6) {
    h = defaults.h;
  }

  return clampLayoutItem(id, { ...existing, w, h });
}

function applyMinimalRepair(items: GridLayout): GridLayout {
  return items.map((existing) => rebalanceSavedSizes(existing, existing.i as DashboardWidgetId));
}

function needsLayoutRepair(items: GridLayout): boolean {
  if (items.length === 0 || hasOverlappingGridItems(items)) return true;

  for (const item of items) {
    const id = item.i as DashboardWidgetId;
    const defaults = WIDGET_SIZE[id];
    if (!defaults) continue;

    if (item.w < defaults.minW || item.h < defaults.minH) return true;
    if (id.startsWith('stat:') && item.h < defaults.h) return true;
    if (id.startsWith('analytics:') && item.h > defaults.h + 6) return true;
    if (id.startsWith('detail:') && item.h > defaults.h + 6) return true;
  }

  return false;
}

export function sanitizeLayoutItems(saved: GridLayout): GridLayout {
  const validIds = new Set(ALL_DASHBOARD_WIDGET_IDS);
  const seen = new Set<string>();
  const result: GridLayoutItem[] = [];

  for (const existing of saved) {
    const id = existing.i as DashboardWidgetId;
    if (!validIds.has(id) || seen.has(id)) continue;
    seen.add(id);
    result.push(rebalanceSavedSizes(existing, id));
  }

  return result.length > 0 ? result : buildDefaultGridLayout();
}

function mergeMissingDefaultWidgets(items: GridLayout): GridLayout {
  const visible = new Set(items.map((item) => item.i));
  let next = [...items];

  for (const template of buildDefaultGridLayout()) {
    if (!visible.has(template.i)) {
      next.push(findPlacementForWidget(next, template.i as DashboardWidgetId));
    }
  }

  return next;
}

/** @deprecated use sanitizeLayoutItems */
export function normalizeLayoutItems(saved: GridLayout): GridLayout {
  return sanitizeLayoutItems(saved);
}

export function findPlacementForWidget(items: GridLayout, id: DashboardWidgetId): GridLayoutItem {
  const template = gridItem(id, 0, 0);

  if (items.length === 0) {
    return template;
  }

  const maxY = Math.max(...items.map((item) => item.y + item.h));

  for (let y = 0; y <= maxY + template.h + 6; y++) {
    for (let x = 0; x <= DASHBOARD_GRID_COLS - template.w; x++) {
      const candidate = { ...template, x, y };
      if (!items.some((other) => cellsOverlap(candidate, other))) {
        return candidate;
      }
    }
  }

  return { ...template, x: 0, y: maxY + 1 };
}

export function getAvailableWidgets(items: GridLayout): DashboardWidgetId[] {
  const visible = new Set(items.map((item) => item.i));
  return ALL_DASHBOARD_WIDGET_IDS.filter((id) => !visible.has(id));
}

export function getWidgetCatalogGroups(): { labelKey: string; ids: DashboardWidgetId[] }[] {
  return [
    { labelKey: 'Сводные карточки', ids: STAT_IDS.map((id) => `stat:${id}` as const) },
    { labelKey: 'Аналитика', ids: ANALYTICS_IDS.map((id) => `analytics:${id}` as const) },
    { labelKey: 'Детализация', ids: DETAIL_IDS.map((id) => `detail:${id}` as const) },
    {
      labelKey: 'Склад',
      ids: ['warehouse:title', ...WAREHOUSE_IDS.map((id) => `warehouse:${id}` as const)],
    },
  ];
}

export const DASHBOARD_LAYOUT_FULL_WIDTH_PX = 1024;
export const DASHBOARD_LAYOUT_TABLET_STACK_PX = 768;

function sortLayoutReadingOrder(items: GridLayout): GridLayout {
  return [...items].sort((a, b) => a.y - b.y || a.x - b.x || a.i.localeCompare(b.i));
}

function isWideDashboardWidget(item: GridLayoutItem): boolean {
  return item.w >= 6 || item.h >= 5;
}

/** View-only reflow for narrow viewports; saved layout in memStorage is unchanged. */
export function buildResponsiveLayout(items: GridLayout, containerWidth: number): GridLayout {
  if (!items.length || containerWidth >= DASHBOARD_LAYOUT_FULL_WIDTH_PX) {
    return items;
  }

  const sorted = sortLayoutReadingOrder(items);

  if (containerWidth < DASHBOARD_LAYOUT_TABLET_STACK_PX) {
    let y = 0;
    return sorted.map((item) => {
      const h = Math.max(item.h, item.minH ?? 2);
      const next: GridLayoutItem = { ...item, x: 0, y, w: 12, h };
      y += h;
      return next;
    });
  }

  const result: GridLayoutItem[] = [];
  let y = 0;

  for (let index = 0; index < sorted.length; ) {
    const item = sorted[index];

    if (isWideDashboardWidget(item)) {
      const h = Math.max(item.h, item.minH ?? 2);
      result.push({ ...item, x: 0, y, w: 12, h });
      y += h;
      index += 1;
      continue;
    }

    const sibling = sorted[index + 1];
    if (sibling && !isWideDashboardWidget(sibling) && item.w <= 3 && sibling.w <= 3) {
      const h = Math.max(item.h, sibling.h, item.minH ?? 2, sibling.minH ?? 2);
      result.push({ ...item, x: 0, y, w: 6, h });
      result.push({ ...sibling, x: 6, y, w: 6, h });
      y += h;
      index += 2;
      continue;
    }

    const h = Math.max(item.h, item.minH ?? 2);
    result.push({ ...item, x: 0, y, w: 12, h });
    y += h;
    index += 1;
  }

  return result;
}

export function packDashboardLayout(items: GridLayout): GridLayout {
  const warehouseTitle = items.find((item) => item.i === 'warehouse:title');
  const warehouseStrip = items
    .filter((item) => item.i.startsWith('warehouse:') && item.i !== 'warehouse:title')
    .sort((a, b) => a.x - b.x || a.i.localeCompare(b.i));
  const main = items.filter((item) => !item.i.startsWith('warehouse:'));

  const sorted = [...main].sort((a, b) => a.y - b.y || a.x - b.x || a.i.localeCompare(b.i));
  const packed: GridLayoutItem[] = [];

  for (const item of sorted) {
    let y = 0;
    while (
      packed.some(
        (placed) =>
          !(
            item.x + item.w <= placed.x ||
            placed.x + placed.w <= item.x ||
            y + item.h <= placed.y ||
            placed.y + placed.h <= y
          )
      )
    ) {
      y += 1;
    }
    packed.push({ ...item, y });
  }

  if (!warehouseTitle && warehouseStrip.length === 0) {
    return packed;
  }

  let maxY = 0;
  for (const item of packed) {
    maxY = Math.max(maxY, item.y + item.h);
  }

  const result: GridLayoutItem[] = [...packed];
  if (warehouseTitle) {
    result.push({ ...warehouseTitle, x: 0, y: maxY, w: 12 });
    maxY += warehouseTitle.h;
  }

  warehouseStrip.forEach((item) => {
    result.push({ ...item, y: maxY });
  });

  return result;
}

/** @deprecated use packDashboardLayout */
export function compactLayoutVertically(items: GridLayout): GridLayout {
  return packDashboardLayout(items);
}

function cellsOverlap(a: GridLayoutItem, b: GridLayoutItem): boolean {
  if (a.i === b.i) return false;
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function hasOverlappingGridItems(items: GridLayout): boolean {
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (cellsOverlap(items[i], items[j])) return true;
    }
  }
  return false;
}

function isLayoutBroken(items: GridLayout): boolean {
  if (items.length === 0) return true;
  const validIds = new Set(ALL_DASHBOARD_WIDGET_IDS);
  if (items.some((item) => !validIds.has(item.i as DashboardWidgetId))) return true;
  if (items.some((item) => item.y > 200 || item.x < 0 || item.x + item.w > DASHBOARD_GRID_COLS)) return true;
  return false;
}

function layoutWasteRatio(items: GridLayout): number {
  if (items.length === 0) return 1;
  let minY = Infinity;
  let maxY = 0;
  let occupiedCells = 0;
  for (const item of items) {
    minY = Math.min(minY, item.y);
    maxY = Math.max(maxY, item.y + item.h);
    occupiedCells += item.w * item.h;
  }
  const span = Math.max(1, maxY - minY);
  const boundingCells = DASHBOARD_GRID_COLS * span;
  return boundingCells > 0 ? 1 - occupiedCells / boundingCells : 0;
}

function finalizeLoadedLayout(items: GridLayout): GridLayout {
  let next = sanitizeLayoutItems(items);
  if (isLayoutBroken(next) || hasOverlappingGridItems(next)) {
    return buildDefaultGridLayout();
  }
  next = mergeMissingDefaultWidgets(next);
  if (needsLayoutRepair(next) || layoutWasteRatio(next) > 0.22) {
    next = applyCanonicalDashboardLayout(next);
    if (hasOverlappingGridItems(next)) {
      return buildDefaultGridLayout();
    }
  }
  return tightenStoredLayout(next);
}

export function loadDashboardLayout(): DashboardLayoutState {
  try {
    const rawV11 = memStorage.getItem(STORAGE_KEY);
    if (rawV11) {
      const parsed = JSON.parse(rawV11) as DashboardLayoutState;
      if (parsed.version === 11 && Array.isArray(parsed.items)) {
        return { version: 11, items: finalizeLoadedLayout(parsed.items) };
      }
    }

    const rawV10 = memStorage.getItem(STORAGE_KEY_V10);
    if (rawV10) {
      const parsed = JSON.parse(rawV10) as StoredDashboardLayout;
      if (parsed.version === 10 && Array.isArray(parsed.items)) {
        return { version: 11, items: applyCanonicalDashboardLayout(parsed.items) };
      }
    }

    const rawV9 = memStorage.getItem(STORAGE_KEY_V9);
    if (rawV9) {
      const parsed = JSON.parse(rawV9) as StoredDashboardLayout;
      if (parsed.version === 9 && Array.isArray(parsed.items)) {
        return { version: 11, items: applyCanonicalDashboardLayout(parsed.items) };
      }
    }

    const rawV8 = memStorage.getItem(STORAGE_KEY_V8);
    if (rawV8) {
      const parsed = JSON.parse(rawV8) as StoredDashboardLayout;
      if (parsed.version === 8 && Array.isArray(parsed.items)) {
        return { version: 11, items: applyCanonicalDashboardLayout(parsed.items) };
      }
    }

    const rawV7 = memStorage.getItem(STORAGE_KEY_V7);
    if (rawV7) {
      const parsed = JSON.parse(rawV7) as StoredDashboardLayout;
      if (parsed.version === 7 && Array.isArray(parsed.items)) {
        return { version: 11, items: applyCanonicalDashboardLayout(parsed.items) };
      }
    }

    const rawV6 = memStorage.getItem(STORAGE_KEY_V6);
    if (rawV6) {
      const parsed = JSON.parse(rawV6) as StoredDashboardLayout;
      if (parsed.version === 6 && Array.isArray(parsed.items)) {
        return { version: 11, items: applyCanonicalDashboardLayout(parsed.items) };
      }
    }

    const rawV5 = memStorage.getItem(STORAGE_KEY_V5);
    if (rawV5) {
      return { version: 11, items: buildDefaultGridLayout() };
    }

    const rawV4 = memStorage.getItem(STORAGE_KEY_V4);
    if (rawV4) {
      const parsed = JSON.parse(rawV4) as StoredDashboardLayout;
      if (parsed.version === 4 && Array.isArray(parsed.items)) {
        return { version: 11, items: buildDefaultGridLayout() };
      }
    }

    const rawV3 = memStorage.getItem(STORAGE_KEY_V3);
    if (rawV3) {
      const parsed = JSON.parse(rawV3) as { version: number; items: GridLayout };
      if (parsed.version === 3 && Array.isArray(parsed.items)) {
        return { version: 11, items: buildDefaultGridLayout() };
      }
    }

    const rawV2 = memStorage.getItem(STORAGE_KEY_V2);
    if (rawV2) {
      const parsed = JSON.parse(rawV2) as { version: number; items: GridLayout };
      if (parsed.version === 2 && Array.isArray(parsed.items)) {
        return { version: 11, items: buildDefaultGridLayout() };
      }
    }

    const rawV1 = memStorage.getItem(STORAGE_KEY_V1);
    if (rawV1) {
      const parsed = JSON.parse(rawV1) as DashboardLayoutStateV1;
      return { version: 11, items: buildDefaultGridLayout() };
    }
  } catch {
    /* ignore */
  }
  return { version: 11, items: buildDefaultGridLayout() };
}

export function saveDashboardLayout(layout: DashboardLayoutState, userId?: string | null): void {
  try {
    const key = userId ? `${STORAGE_KEY}:${userId}` : STORAGE_KEY;
    memStorage.setItem(key, JSON.stringify({ version: 11, items: layout.items }));
  } catch {
    /* ignore */
  }
}

export function loadDashboardLayoutFromCache(userId?: string | null): DashboardLayoutState | null {
  try {
    const keyed = userId ? memStorage.getItem(`${STORAGE_KEY}:${userId}`) : null;
    const raw = keyed || memStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DashboardLayoutState;
    if (parsed.version === 11 && Array.isArray(parsed.items)) {
      return { version: 11, items: finalizeLoadedLayout(parsed.items) };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function resolveDashboardLayout(
  serverLayout?: { version: 11; items: GridLayout } | null,
  userId?: string | null
): DashboardLayoutState {
  if (serverLayout?.version === 11 && Array.isArray(serverLayout.items)) {
    return { version: 11, items: finalizeLoadedLayout(serverLayout.items) };
  }
  const cached = loadDashboardLayoutFromCache(userId);
  if (cached) return cached;
  return loadDashboardLayout();
}

export function dashboardWidgetLabelKey(widgetId: string): string {
  if (widgetId === 'warehouse:title') return 'Оборудование на складе';

  const [scope, id] = widgetId.split(':');
  switch (scope) {
    case 'stat':
      return dashboardWidgetLabelKeyLegacy('stat', id);
    case 'analytics':
      return dashboardWidgetLabelKeyLegacy('analytics', id);
    case 'detail':
      return dashboardWidgetLabelKeyLegacy('detail', id);
    case 'warehouse':
      return dashboardWidgetLabelKeyLegacy('warehouse', id);
    default:
      return widgetId;
  }
}

function dashboardWidgetLabelKeyLegacy(scope: string, id: string): string {
  switch (scope) {
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
        case 'software_monitoring':
          return 'Мониторинг ПО';
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

/** @deprecated use dashboardWidgetLabelKey(widgetId) */
export function analyticsWidgetColClass(_id: AnalyticsWidgetId): string {
  return '';
}
