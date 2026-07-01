import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GripVertical, X } from 'lucide-react';
import {
  buildResponsiveLayout,
  DASHBOARD_LAYOUT_FULL_WIDTH_PX,
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
import { useDashboardLayout } from './DashboardLayoutContext';
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

type PendingPointer =
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

const DRAG_THRESHOLD_PX = 5;

function layoutSignature(items: GridLayout): string {
  return items.map((item) => `${item.i}:${item.x},${item.y},${item.w},${item.h}`).join('|');
}

function updateLayoutItem(items: GridLayout, nextItem: GridLayoutItem): GridLayout {
  return items.map((item) => (item.i === nextItem.i ? nextItem : item));
}

function pendingToInteraction(pending: PendingPointer): Interaction {
  if (pending.kind === 'move') {
    return {
      kind: 'move',
      id: pending.id,
      pointerId: pending.pointerId,
      startX: pending.startX,
      startY: pending.startY,
      origin: pending.origin,
    };
  }

  return {
    kind: 'resize',
    id: pending.id,
    pointerId: pending.pointerId,
    handle: pending.handle,
    startX: pending.startX,
    startY: pending.startY,
    origin: pending.origin,
  };
}

export default function DashboardGridLayout({
  layout,
  editMode,
  onLayoutChange,
  onRemoveWidget,
  children,
}: DashboardGridLayoutProps) {
  const { t } = useTranslation();
  const { selectedWidgetId, setSelectedWidgetId } = useDashboardLayout();
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [liveLayout, setLiveLayout] = useState(layout);
  const [interaction, setInteraction] = useState<Interaction | null>(null);
  const interactionRef = useRef<Interaction | null>(null);
  const pendingRef = useRef<PendingPointer | null>(null);
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
    if (!editMode) return;

    const onPointerMove = (event: PointerEvent) => {
      const pending = pendingRef.current;
      const currentMetrics = metricsRef.current;

      if (pending && !interactionRef.current && event.pointerId === pending.pointerId) {
        const dx = event.clientX - pending.startX;
        const dy = event.clientY - pending.startY;
        if (Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX) {
          const next = pendingToInteraction(pending);
          interactionRef.current = next;
          setInteraction(next);
          pendingRef.current = null;
        }
        return;
      }

      const active = interactionRef.current;
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
      const pending = pendingRef.current;
      if (pending && !interactionRef.current && event.pointerId === pending.pointerId) {
        setSelectedWidgetId(pending.id);
        pendingRef.current = null;
        return;
      }

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

      setSelectedWidgetId(active.id);
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
  }, [editMode, onLayoutChange, setSelectedWidgetId]);

  const queuePointer = useCallback(
    (pending: PendingPointer, event: React.PointerEvent) => {
      if (!editMode || event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();

      pendingRef.current = pending;
      setSelectedWidgetId(pending.id);
    },
    [editMode, setSelectedWidgetId]
  );

  const startMove = useCallback(
    (item: GridLayoutItem, event: React.PointerEvent) => {
      queuePointer(
        {
          kind: 'move',
          id: item.i,
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          origin: { ...item },
        },
        event
      );
    },
    [queuePointer]
  );

  const startResize = useCallback(
    (item: GridLayoutItem, handle: ResizeHandle, event: React.PointerEvent) => {
      if (!editMode || event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();

      const pending: PendingPointer = {
        kind: 'resize',
        id: item.i,
        pointerId: event.pointerId,
        handle,
        startX: event.clientX,
        startY: event.clientY,
        origin: { ...item },
      };
      pendingRef.current = pending;
      setSelectedWidgetId(item.i);

      const next = pendingToInteraction(pending);
      interactionRef.current = next;
      setInteraction(next);
      pendingRef.current = null;
    },
    [editMode, setSelectedWidgetId]
  );

  const displayLayout = useMemo(() => {
    if (editMode || width < 1) return liveLayout;
    return buildResponsiveLayout(liveLayout, width);
  }, [editMode, liveLayout, width]);

  const responsiveView = !editMode && width > 0 && width < DASHBOARD_LAYOUT_FULL_WIDTH_PX;

  if (!metrics) {
    return <div ref={containerRef} className="dashboard-grid-root min-h-[400px]" />;
  }

  const canvasHeight = gridContainerHeight(displayLayout, metrics) + (editMode ? 72 : 0);
  const activeId = interaction?.id ?? null;

  return (
    <div
      ref={containerRef}
      className={`dashboard-grid-root ${editMode ? 'dashboard-grid-root--edit' : ''} ${
        responsiveView ? 'dashboard-grid-root--responsive' : ''
      }`}
    >
      <div
        className="dashboard-grid-canvas relative w-full"
        style={{ height: canvasHeight }}
        onPointerDown={(event) => {
          if (editMode && event.target === event.currentTarget) {
            setSelectedWidgetId(null);
          }
        }}
      >
        {displayLayout.map((item) => {
          const { left, top, width: itemWidth, height: itemHeight } = gridItemToPixels(item, metrics);
          const isActive = activeId === item.i;
          const isSelected = selectedWidgetId === item.i;

          return (
            <div
              key={item.i}
              className={[
                'dashboard-grid-item',
                editMode ? 'dashboard-grid-item--edit' : 'dashboard-grid-item--view',
                isSelected ? 'dashboard-grid-item--selected' : '',
                isActive ? 'dashboard-grid-item--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
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
