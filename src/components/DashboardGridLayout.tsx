import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GripVertical, X } from 'lucide-react';
import {
  dashboardWidgetLabelKey,
  type GridLayout,
  type GridLayoutItem,
} from '../utils/dashboardLayout';
import {
  getGridMetrics,
  gridContainerHeight,
  gridItemToPixels,
  moveGridItem,
  resizeGridItem,
  RESIZE_HANDLES,
  type GridMetrics,
  type ResizeHandle,
} from '../utils/dashboardGridMetrics';
import { useTranslation } from '../utils/i18n';
import DashboardWidgetScaler from './DashboardWidgetScaler';

interface DashboardGridLayoutProps {
  layout: GridLayout;
  editMode: boolean;
  onLayoutChange: (items: GridLayout) => void;
  onRemoveWidget?: (widgetId: string) => void;
  children: (widgetId: string) => React.ReactNode;
}

type Interaction =
  | {
      kind: 'move';
      id: string;
      pointerId: number;
      startX: number;
      startY: number;
      origin: GridLayoutItem;
    }
  | {
      kind: 'resize';
      id: string;
      pointerId: number;
      handle: ResizeHandle;
      startX: number;
      startY: number;
      origin: GridLayoutItem;
    };

function layoutSignature(items: GridLayout): string {
  return items.map((item) => `${item.i}:${item.x},${item.y},${item.w},${item.h}`).join('|');
}

function updateLayoutItem(items: GridLayout, nextItem: GridLayoutItem): GridLayout {
  return items.map((item) => (item.i === nextItem.i ? nextItem : item));
}

export default function DashboardGridLayout({
  layout,
  editMode,
  onLayoutChange,
  onRemoveWidget,
  children,
}: DashboardGridLayoutProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [liveLayout, setLiveLayout] = useState(layout);
  const [interaction, setInteraction] = useState<Interaction | null>(null);
  const interactionRef = useRef<Interaction | null>(null);
  const metricsRef = useRef<GridMetrics | null>(null);
  const layoutPropKey = layoutSignature(layout);

  useEffect(() => {
    interactionRef.current = interaction;
  }, [interaction]);

  useEffect(() => {
    if (!interaction) {
      setLiveLayout(layout);
    }
  }, [layoutPropKey, interaction, layout]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => setWidth(el.offsetWidth);
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const metrics = width > 0 ? getGridMetrics(width) : null;
  metricsRef.current = metrics;

  useEffect(() => {
    if (!interaction) return;

    const onPointerMove = (event: PointerEvent) => {
      const active = interactionRef.current;
      const currentMetrics = metricsRef.current;
      if (!active || !currentMetrics || event.pointerId !== active.pointerId) return;

      const dx = event.clientX - active.startX;
      const dy = event.clientY - active.startY;

      setLiveLayout((items) => {
        const current = items.find((item) => item.i === active.id);
        if (!current) return items;

        const nextItem =
          active.kind === 'move'
            ? moveGridItem(active.origin, dx, dy, currentMetrics)
            : resizeGridItem(active.origin, active.handle, dx, dy, currentMetrics);

        return updateLayoutItem(items, nextItem);
      });
    };

    const onPointerUp = (event: PointerEvent) => {
      const active = interactionRef.current;
      const currentMetrics = metricsRef.current;
      if (!active || !currentMetrics || event.pointerId !== active.pointerId) return;

      const dx = event.clientX - active.startX;
      const dy = event.clientY - active.startY;

      setLiveLayout((items) => {
        const nextItem =
          active.kind === 'move'
            ? moveGridItem(active.origin, dx, dy, currentMetrics)
            : resizeGridItem(active.origin, active.handle, dx, dy, currentMetrics);
        const next = updateLayoutItem(items, nextItem);
        onLayoutChange(next);
        return next;
      });

      setInteraction(null);
      interactionRef.current = null;
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [interaction, onLayoutChange]);

  const startMove = useCallback(
    (item: GridLayoutItem, event: React.PointerEvent) => {
      if (!editMode || event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);

      const next: Interaction = {
        kind: 'move',
        id: item.i,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        origin: { ...item },
      };
      interactionRef.current = next;
      setInteraction(next);
    },
    [editMode]
  );

  const startResize = useCallback(
    (item: GridLayoutItem, handle: ResizeHandle, event: React.PointerEvent) => {
      if (!editMode || event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();

      const next: Interaction = {
        kind: 'resize',
        id: item.i,
        pointerId: event.pointerId,
        handle,
        startX: event.clientX,
        startY: event.clientY,
        origin: { ...item },
      };
      interactionRef.current = next;
      setInteraction(next);
    },
    [editMode]
  );

  if (!metrics) {
    return <div ref={containerRef} className="dashboard-grid-root min-h-[400px]" />;
  }

  const canvasHeight = gridContainerHeight(liveLayout, metrics) + (editMode ? 72 : 0);
  const activeId = interaction?.id ?? null;

  return (
    <div
      ref={containerRef}
      className={`dashboard-grid-root ${editMode ? 'dashboard-grid-root--edit' : ''}`}
    >
      <div className="dashboard-grid-canvas relative w-full" style={{ height: canvasHeight }}>
        {liveLayout.map((item) => {
          const { left, top, width: itemWidth, height: itemHeight } = gridItemToPixels(item, metrics);
          const isActive = activeId === item.i;

          return (
            <div
              key={item.i}
              className={`dashboard-grid-item ${editMode ? 'dashboard-grid-item--edit' : ''} ${isActive ? 'dashboard-grid-item--active' : ''}`}
              style={{
                left,
                top,
                width: itemWidth,
                height: itemHeight,
              }}
            >
              {editMode && (
                <>
                  <div
                    className="dashboard-grid-handle dashboard-grid-handle--overlay"
                    onPointerDown={(event) => startMove(item, event)}
                    title={t(dashboardWidgetLabelKey(item.i))}
                    aria-label={t('Перетащить')}
                  >
                    <GripVertical size={13} className="shrink-0 text-blue-500" />
                    <span className="truncate font-semibold text-[10px] text-slate-600 flex-1">
                      {t(dashboardWidgetLabelKey(item.i))}
                    </span>
                    {onRemoveWidget && (
                      <button
                        type="button"
                        className="dashboard-grid-remove shrink-0"
                        title={t('Удалить виджет')}
                        aria-label={t('Удалить виджет')}
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                          event.stopPropagation();
                          onRemoveWidget(item.i);
                        }}
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>
                  {RESIZE_HANDLES.map((handle) => (
                    <div
                      key={handle}
                      className={`dashboard-grid-resize dashboard-grid-resize-${handle}`}
                      onPointerDown={(event) => startResize(item, handle, event)}
                      aria-hidden
                    />
                  ))}
                </>
              )}
              <div
                className={`dashboard-grid-content ${editMode ? 'dashboard-grid-content--edit select-none' : ''}`}
                onPointerDown={editMode ? (event) => startMove(item, event) : undefined}
              >
                <DashboardWidgetScaler widgetId={item.i} className="h-full min-h-0">
                  {children(item.i)}
                </DashboardWidgetScaler>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
