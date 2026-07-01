import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, LayoutDashboard, Pencil, Plus, RotateCcw } from 'lucide-react';
import { useTranslation } from '../utils/i18n';
import {
  DASHBOARD_HEADER_EDIT_SLOT_ID,
  buildDefaultGridLayout,
  dashboardWidgetLabelKey,
  findPlacementForWidget,
  getAvailableWidgets,
  getWidgetCatalogGroups,
  hasOverlappingGridItems,
  loadDashboardLayout,
  packDashboardLayout,
  sanitizeLayoutItems,
  saveDashboardLayout,
  type DashboardLayoutState,
  type DashboardWidgetId,
  type GridLayout,
} from '../utils/dashboardLayout';

interface DashboardLayoutContextValue {
  layout: DashboardLayoutState;
  gridItems: GridLayout;
  editMode: boolean;
  selectedWidgetId: string | null;
  availableWidgets: DashboardWidgetId[];
  setEditMode: (value: boolean) => void;
  setSelectedWidgetId: (widgetId: string | null) => void;
  resetLayout: () => void;
  updateGridLayout: (items: GridLayout) => void;
  removeWidget: (widgetId: string) => void;
  addWidget: (widgetId: DashboardWidgetId) => void;
}

const DashboardLayoutContext = createContext<DashboardLayoutContextValue | null>(null);

export function useDashboardLayout(): DashboardLayoutContextValue {
  const ctx = useContext(DashboardLayoutContext);
  if (!ctx) {
    throw new Error('useDashboardLayout must be used within DashboardLayoutProvider');
  }
  return ctx;
}

function DashboardHeaderEditPortal() {
  const { t } = useTranslation();
  const { editMode, setEditMode } = useDashboardLayout();
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const resolve = () => setSlot(document.getElementById(DASHBOARD_HEADER_EDIT_SLOT_ID));
    resolve();
    const observer = new MutationObserver(resolve);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  if (!slot || editMode) return null;

  return createPortal(
    <button
      type="button"
      onClick={() => setEditMode(true)}
      title={t('Настроить дашборд')}
      aria-label={t('Настроить дашборд')}
      className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-blue-700 bg-blue-50 border border-blue-200 shadow-sm hover:bg-blue-100 hover:border-blue-300 hover:text-blue-800 transition-colors"
    >
      <Pencil size={16} strokeWidth={2.25} className="sm:hidden" />
      <Pencil size={17} strokeWidth={2.25} className="hidden sm:block" />
    </button>,
    slot
  );
}

function DashboardEditBanner() {
  const { t } = useTranslation();
  const { setEditMode, resetLayout, availableWidgets, addWidget, selectedWidgetId } = useDashboardLayout();
  const [pickerOpen, setPickerOpen] = useState(false);

  const catalog = getWidgetCatalogGroups()
    .map((group) => ({
      ...group,
      ids: group.ids.filter((id) => availableWidgets.includes(id)),
    }))
    .filter((group) => group.ids.length > 0);

  return (
    <div className="dashboard-edit-banner sticky top-0 z-40 mb-3 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50/90 px-4 py-3 shadow-md backdrop-blur-sm">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-blue-900 flex items-center gap-2">
              <LayoutDashboard size={16} className="shrink-0" />
              {t('Режим настройки дашборда')}
            </p>
            <p className="text-[11px] text-blue-800/80 mt-1 leading-relaxed">
              {t(
                'Нажмите виджет для выделения. Перетаскивайте и меняйте размер. Удаляйте кнопкой ×, добавляйте из каталога.'
              )}
            </p>
            {selectedWidgetId ? (
              <p className="text-[11px] font-semibold text-blue-900 mt-1.5">
                {t('Выбран')}: {t(dashboardWidgetLabelKey(selectedWidgetId))}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setPickerOpen((open) => !open)}
              disabled={availableWidgets.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-blue-700 bg-white border border-blue-200 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus size={13} />
              {t('Добавить виджет')}
            </button>
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

        {pickerOpen && catalog.length > 0 && (
          <div className="rounded-xl border border-blue-200/80 bg-white/90 p-3 max-h-56 overflow-y-auto">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {catalog.map((group) => (
                <div key={group.labelKey}>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">
                    {t(group.labelKey)}
                  </p>
                  <div className="flex flex-col gap-1">
                    {group.ids.map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          addWidget(id);
                          setPickerOpen(false);
                        }}
                        className="text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-800 transition-colors"
                      >
                        {t(dashboardWidgetLabelKey(id))}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function DashboardLayoutProvider({ children }: { children: React.ReactNode }) {
  const [layout, setLayout] = useState<DashboardLayoutState>(loadDashboardLayout);
  const [editMode, setEditModeRaw] = useState(false);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);

  const setEditMode = useCallback((value: boolean) => {
    if (value) {
      setLayout((prev) =>
        hasOverlappingGridItems(prev.items)
          ? { version: 10, items: buildDefaultGridLayout() }
          : prev
      );
    } else {
      setSelectedWidgetId(null);
    }
    setEditModeRaw(value);
  }, []);

  useEffect(() => {
    saveDashboardLayout(layout);
  }, [layout]);

  const updateGridLayout = useCallback((items: GridLayout) => {
    const sanitized = sanitizeLayoutItems(items);
    const packed = packDashboardLayout(sanitized);
    setLayout({ version: 10, items: hasOverlappingGridItems(packed) ? sanitized : packed });
  }, []);

  const resetLayout = useCallback(() => {
    setLayout({
      version: 10,
      items: buildDefaultGridLayout().map((item) => ({ ...item })),
    });
  }, []);

  const removeWidget = useCallback((widgetId: string) => {
    setLayout((prev) => {
      const next = prev.items.filter((item) => item.i !== widgetId);
      if (next.length === 0) {
        return prev;
      }
      return { version: 10, items: next };
    });
    setSelectedWidgetId((prev) => (prev === widgetId ? null : prev));
  }, []);

  const addWidget = useCallback((widgetId: DashboardWidgetId) => {
    setLayout((prev) => {
      if (prev.items.some((item) => item.i === widgetId)) {
        return prev;
      }
      const placement = findPlacementForWidget(prev.items, widgetId);
      return { version: 10, items: [...prev.items, placement] };
    });
  }, []);

  const availableWidgets = useMemo(
    () => getAvailableWidgets(layout.items),
    [layout.items]
  );

  const value = useMemo(
    () => ({
      layout,
      gridItems: layout.items,
      editMode,
      selectedWidgetId,
      availableWidgets,
      setEditMode,
      setSelectedWidgetId,
      resetLayout,
      updateGridLayout,
      removeWidget,
      addWidget,
    }),
    [
      layout,
      editMode,
      selectedWidgetId,
      availableWidgets,
      setEditMode,
      resetLayout,
      updateGridLayout,
      removeWidget,
      addWidget,
    ]
  );

  return (
    <DashboardLayoutContext.Provider value={value}>
      <DashboardHeaderEditPortal />
      {editMode && <DashboardEditBanner />}
      <div className={editMode ? 'dashboard-edit-mode' : undefined}>{children}</div>
    </DashboardLayoutContext.Provider>
  );
}
