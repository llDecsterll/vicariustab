import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Check, LayoutDashboard, RotateCcw } from 'lucide-react';
import DashboardDraggableBlock from './DashboardDraggableBlock';
import { useTranslation } from '../utils/i18n';
import {
  DEFAULT_DASHBOARD_LAYOUT,
  loadDashboardLayout,
  moveListItem,
  saveDashboardLayout,
  shiftListItem,
  type AnalyticsWidgetId,
  type DashboardLayoutState,
  type DashboardSectionId,
  type DetailCardId,
  type StatCardId,
  type WarehouseStripId,
} from '../utils/dashboardLayout';

export type DashboardDragScope = 'section' | 'stat' | 'analytics' | 'detail' | 'warehouse';

export interface DashboardDragState {
  scope: DashboardDragScope | null;
  id: string | null;
}

interface DashboardLayoutContextValue {
  layout: DashboardLayoutState;
  editMode: boolean;
  dragState: DashboardDragState;
  setEditMode: (value: boolean) => void;
  resetLayout: () => void;
  beginDrag: (scope: DashboardDragScope, id: string) => void;
  endDrag: () => void;
  dropOn: (scope: DashboardDragScope, targetId: string) => void;
  shiftItem: (scope: DashboardDragScope, id: string, direction: -1 | 1) => void;
}

const DashboardLayoutContext = createContext<DashboardLayoutContextValue | null>(null);

export function useDashboardLayout(): DashboardLayoutContextValue {
  const ctx = useContext(DashboardLayoutContext);
  if (!ctx) {
    throw new Error('useDashboardLayout must be used within DashboardLayoutProvider');
  }
  return ctx;
}

function DashboardEditToolbar() {
  const { t } = useTranslation();
  const { editMode, setEditMode, resetLayout } = useDashboardLayout();

  if (!editMode) {
    return (
      <div className="flex justify-end px-0.5 mb-2">
        <button
          type="button"
          onClick={() => setEditMode(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 shadow-sm hover:bg-blue-100 hover:border-blue-300 transition-colors"
        >
          <LayoutDashboard size={16} />
          {t('Настроить дашборд')}
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-edit-banner sticky top-0 z-40 mb-3 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50/90 px-4 py-3 shadow-md backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-blue-900 flex items-center gap-2">
            <LayoutDashboard size={16} className="shrink-0" />
            {t('Режим настройки дашборда')}
          </p>
          <p className="text-[11px] text-blue-800/80 mt-1 leading-relaxed">
            {t('Используйте стрелки или перетаскивание ⋮⋮. Ряды — целые блоки, карточки — внутри ряда.')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={resetLayout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 transition-colors"
          >
            <RotateCcw size={13} />
            {t('Сбросить')}
          </button>
          <button
            type="button"
            onClick={() => setEditMode(false)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
          >
            <Check size={14} />
            {t('Готово')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DashboardLayoutProvider({ children }: { children: React.ReactNode }) {
  const [layout, setLayout] = useState<DashboardLayoutState>(loadDashboardLayout);
  const [editMode, setEditMode] = useState(false);
  const [dragState, setDragState] = useState<DashboardDragState>({ scope: null, id: null });
  const dragRef = useRef<DashboardDragState>({ scope: null, id: null });

  useEffect(() => {
    saveDashboardLayout(layout);
  }, [layout]);

  const beginDrag = useCallback((scope: DashboardDragScope, id: string) => {
    const next = { scope, id };
    dragRef.current = next;
    setDragState(next);
  }, []);

  const endDrag = useCallback(() => {
    const cleared = { scope: null, id: null };
    dragRef.current = cleared;
    setDragState(cleared);
  }, []);

  const applyListUpdate = useCallback(
    (scope: DashboardDragScope, updater: (prev: DashboardLayoutState) => DashboardLayoutState) => {
      setLayout((prev) => updater(prev));
    },
    []
  );

  const dropOn = useCallback(
    (scope: DashboardDragScope, targetId: string) => {
      const { scope: dragScope, id: draggedId } = dragRef.current;
      if (!draggedId || dragScope !== scope || draggedId === targetId) {
        endDrag();
        return;
      }

      applyListUpdate(scope, (prev) => {
        switch (scope) {
          case 'section':
            return {
              ...prev,
              sections: moveListItem(prev.sections, draggedId as DashboardSectionId, targetId as DashboardSectionId),
            };
          case 'stat':
            return {
              ...prev,
              statCards: moveListItem(prev.statCards, draggedId as StatCardId, targetId as StatCardId),
            };
          case 'analytics':
            return {
              ...prev,
              analytics: moveListItem(prev.analytics, draggedId as AnalyticsWidgetId, targetId as AnalyticsWidgetId),
            };
          case 'detail':
            return {
              ...prev,
              detailCards: moveListItem(prev.detailCards, draggedId as DetailCardId, targetId as DetailCardId),
            };
          case 'warehouse':
            return {
              ...prev,
              warehouseStrip: moveListItem(
                prev.warehouseStrip,
                draggedId as WarehouseStripId,
                targetId as WarehouseStripId
              ),
            };
          default:
            return prev;
        }
      });
      endDrag();
    },
    [applyListUpdate, endDrag]
  );

  const shiftItem = useCallback(
    (scope: DashboardDragScope, id: string, direction: -1 | 1) => {
      setLayout((prev) => {
        let next: DashboardLayoutState;
        switch (scope) {
          case 'section':
            next = { ...prev, sections: shiftListItem(prev.sections, id as DashboardSectionId, direction) };
            break;
          case 'stat':
            next = { ...prev, statCards: shiftListItem(prev.statCards, id as StatCardId, direction) };
            break;
          case 'analytics':
            next = { ...prev, analytics: shiftListItem(prev.analytics, id as AnalyticsWidgetId, direction) };
            break;
          case 'detail':
            next = { ...prev, detailCards: shiftListItem(prev.detailCards, id as DetailCardId, direction) };
            break;
          case 'warehouse':
            next = {
              ...prev,
              warehouseStrip: shiftListItem(prev.warehouseStrip, id as WarehouseStripId, direction),
            };
            break;
          default:
            return prev;
        }
        return next;
      });
    },
    []
  );

  const resetLayout = useCallback(() => {
    setLayout({ ...DEFAULT_DASHBOARD_LAYOUT });
    endDrag();
  }, [endDrag]);

  const value = useMemo(
    () => ({
      layout,
      editMode,
      dragState,
      setEditMode,
      resetLayout,
      beginDrag,
      endDrag,
      dropOn,
      shiftItem,
    }),
    [layout, editMode, dragState, resetLayout, beginDrag, endDrag, dropOn, shiftItem]
  );

  return (
    <DashboardLayoutContext.Provider value={value}>
      <DashboardEditToolbar />
      <div className={editMode ? 'dashboard-edit-mode space-y-4 relative' : 'space-y-4'}>{children}</div>
    </DashboardLayoutContext.Provider>
  );
}

interface DashboardDraggableWidgetProps {
  scope: DashboardDragScope;
  blockId: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'widget' | 'section';
}

export function DashboardDraggableWidget({
  scope,
  blockId,
  children,
  className = '',
  variant = 'widget',
}: DashboardDraggableWidgetProps) {
  const { dragState, editMode, layout, beginDrag, endDrag, dropOn, shiftItem } = useDashboardLayout();

  return (
    <DashboardDraggableBlock
      scope={scope}
      blockId={blockId}
      dragState={dragState}
      editMode={editMode}
      layout={layout}
      onDragStart={beginDrag}
      onDrop={dropOn}
      onDragEnd={endDrag}
      onShift={shiftItem}
      className={className}
      variant={variant}
    >
      {children}
    </DashboardDraggableBlock>
  );
}

interface DashboardSectionShellProps {
  sectionId: DashboardSectionId;
  children: React.ReactNode;
}

export function DashboardSectionShell({ sectionId, children }: DashboardSectionShellProps) {
  return (
    <DashboardDraggableWidget scope="section" blockId={sectionId} variant="section">
      {children}
    </DashboardDraggableWidget>
  );
}

export function DashboardSections({ children }: { children: (sectionId: DashboardSectionId) => React.ReactNode }) {
  const { layout } = useDashboardLayout();

  return (
    <>
      {layout.sections.map((sectionId) => (
        <React.Fragment key={sectionId}>
          <DashboardSectionShell sectionId={sectionId}>{children(sectionId)}</DashboardSectionShell>
        </React.Fragment>
      ))}
    </>
  );
}
