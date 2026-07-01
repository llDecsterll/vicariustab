import {
  DASHBOARD_GRID_COLS,
  DASHBOARD_GRID_MARGIN,
  DASHBOARD_ROW_HEIGHT,
  type GridLayout,
  type GridLayoutItem,
} from './dashboardLayout';

export interface GridMetrics {
  width: number;
  colWidth: number;
  rowHeight: number;
  marginX: number;
  marginY: number;
  cols: number;
}

export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

function resolveRowHeight(containerWidth: number): number {
  if (containerWidth < 480) return 34;
  if (containerWidth < 768) return 36;
  if (containerWidth < 1200) return 38;
  return DASHBOARD_ROW_HEIGHT;
}

function resolveMargin(containerWidth: number): [number, number] {
  if (containerWidth < 640) return [6, 6];
  if (containerWidth < 1024) return [7, 7];
  return DASHBOARD_GRID_MARGIN;
}

export function getGridMetrics(containerWidth: number): GridMetrics {
  const [marginX, marginY] = resolveMargin(containerWidth);
  const colWidth = (containerWidth - marginX * (DASHBOARD_GRID_COLS - 1)) / DASHBOARD_GRID_COLS;

  return {
    width: containerWidth,
    colWidth,
    rowHeight: resolveRowHeight(containerWidth),
    marginX,
    marginY,
    cols: DASHBOARD_GRID_COLS,
  };
}

export function gridItemToPixels(item: GridLayoutItem, metrics: GridMetrics) {
  const left = item.x * (metrics.colWidth + metrics.marginX);
  const top = item.y * (metrics.rowHeight + metrics.marginY);
  const width = item.w * metrics.colWidth + (item.w - 1) * metrics.marginX;
  const height = item.h * metrics.rowHeight + (item.h - 1) * metrics.marginY;

  return { left, top, width, height };
}

export function gridContainerHeight(items: GridLayout, metrics: GridMetrics): number {
  if (items.length === 0) return 280;

  let maxBottom = 0;
  for (const item of items) {
    const { top, height } = gridItemToPixels(item, metrics);
    maxBottom = Math.max(maxBottom, top + height);
  }

  return maxBottom + metrics.marginY;
}

function deltaCols(dx: number, metrics: GridMetrics): number {
  return Math.round(dx / (metrics.colWidth + metrics.marginX));
}

function deltaRows(dy: number, metrics: GridMetrics): number {
  return Math.round(dy / (metrics.rowHeight + metrics.marginY));
}

function clampItem(item: GridLayoutItem, next: Pick<GridLayoutItem, 'x' | 'y' | 'w' | 'h'>): GridLayoutItem {
  const minW = item.minW ?? 1;
  const minH = item.minH ?? 1;
  const maxW = item.maxW ?? DASHBOARD_GRID_COLS;
  const maxH = item.maxH ?? 48;

  let { x, y, w, h } = next;
  w = Math.max(minW, Math.min(w, maxW, DASHBOARD_GRID_COLS));
  h = Math.max(minH, Math.min(h, maxH));
  x = Math.max(0, Math.min(x, DASHBOARD_GRID_COLS - w));
  y = Math.max(0, y);

  if (w < minW) {
    w = minW;
    x = Math.min(x, DASHBOARD_GRID_COLS - w);
  }
  if (h < minH) {
    h = minH;
  }

  return { ...item, x, y, w, h };
}

export function moveGridItem(
  item: GridLayoutItem,
  dx: number,
  dy: number,
  metrics: GridMetrics
): GridLayoutItem {
  return clampItem(item, {
    x: item.x + deltaCols(dx, metrics),
    y: item.y + deltaRows(dy, metrics),
    w: item.w,
    h: item.h,
  });
}

export function resizeGridItem(
  item: GridLayoutItem,
  handle: ResizeHandle,
  dx: number,
  dy: number,
  metrics: GridMetrics
): GridLayoutItem {
  const dc = deltaCols(dx, metrics);
  const dr = deltaRows(dy, metrics);
  let { x, y, w, h } = item;

  if (handle.includes('e')) w += dc;
  if (handle.includes('w')) {
    x += dc;
    w -= dc;
  }
  if (handle.includes('s')) h += dr;
  if (handle.includes('n')) {
    y += dr;
    h -= dr;
  }

  return clampItem(item, { x, y, w, h });
}

export const RESIZE_HANDLES: ResizeHandle[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
