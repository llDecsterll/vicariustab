import React from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { useTranslation } from '../utils/i18n';
import { dashboardWidgetLabelKey, listIndexOf, type DashboardLayoutState } from '../utils/dashboardLayout';
import type { DashboardDragScope, DashboardDragState } from './DashboardLayoutContext';

interface DashboardDraggableBlockProps {
  scope: DashboardDragScope;
  blockId: string;
  dragState: DashboardDragState;
  editMode: boolean;
  layout: DashboardLayoutState;
  onDragStart: (scope: DashboardDragScope, id: string) => void;
  onDrop: (scope: DashboardDragScope, id: string) => void;
  onDragEnd: () => void;
  onShift: (scope: DashboardDragScope, id: string, direction: -1 | 1) => void;
  children: React.ReactNode;
  className?: string;
  variant?: 'widget' | 'section';
}

export default function DashboardDraggableBlock({
  scope,
  blockId,
  dragState,
  editMode,
  layout,
  onDragStart,
  onDrop,
  onDragEnd,
  onShift,
  children,
  className = '',
  variant = 'widget',
}: DashboardDraggableBlockProps) {
  const { t } = useTranslation();

  const isDragging = editMode && dragState.scope === scope && dragState.id === blockId;
  const isDropTarget =
    editMode && dragState.scope === scope && dragState.id !== null && dragState.id !== blockId;

  const listForScope = (() => {
    switch (scope) {
      case 'section':
        return layout.sections;
      case 'stat':
        return layout.statCards;
      case 'analytics':
        return layout.analytics;
      case 'detail':
        return layout.detailCards;
      case 'warehouse':
        return layout.warehouseStrip;
      default:
        return [];
    }
  })();

  const index = listIndexOf(listForScope, blockId as (typeof listForScope)[number]);
  const canMoveBack = index > 0;
  const canMoveForward = index >= 0 && index < listForScope.length - 1;
  const label = t(dashboardWidgetLabelKey(scope, blockId));

  const handleDragStart = (e: React.DragEvent) => {
    if (!editMode) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${scope}:${blockId}`);
    onDragStart(scope, blockId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!editMode || dragState.scope !== scope) return;
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!editMode || dragState.scope !== scope) return;
    e.preventDefault();
    e.stopPropagation();
    onDrop(scope, blockId);
  };

  if (!editMode) {
    return <div className={className}>{children}</div>;
  }

  const isSection = variant === 'section';
  const MoveBackIcon = isSection ? ChevronUp : ChevronLeft;
  const MoveForwardIcon = isSection ? ChevronDown : ChevronRight;
  const moveBackLabel = isSection ? t('Переместить ряд выше') : t('Переместить левее');
  const moveForwardLabel = isSection ? t('Переместить ряд ниже') : t('Переместить правее');

  return (
    <div
      className={`relative ${className} ${isDragging ? 'z-30' : ''} ${
        isSection ? 'pointer-events-none [&_.dashboard-edit-chrome]:pointer-events-auto' : ''
      }`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div
        className={`rounded-2xl border-2 border-dashed transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50/40 shadow-lg'
            : isDropTarget
              ? 'border-blue-400 bg-blue-50/30'
              : 'border-blue-200/80 bg-blue-50/20'
        }`}
      >
        <div
          className={`dashboard-edit-chrome pointer-events-auto relative z-30 flex items-center gap-1.5 px-2 py-2 border-b border-blue-100/80 bg-white rounded-t-2xl shadow-sm ${
            isSection ? 'text-[12px]' : 'text-[11px]'
          }`}
        >
          <span className="font-semibold text-slate-700 truncate flex-1 min-w-0" title={label}>
            {isSection ? `${t('Ряд')}: ${label}` : label}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              disabled={!canMoveBack}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onShift(scope, blockId, -1);
              }}
              className="p-1.5 rounded-lg text-slate-600 bg-slate-50 border border-slate-200 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50 disabled:opacity-30 disabled:pointer-events-none"
              aria-label={moveBackLabel}
              title={moveBackLabel}
            >
              <MoveBackIcon size={15} />
            </button>
            <div
              role="button"
              tabIndex={0}
              draggable
              onDragStart={handleDragStart}
              onDragEnd={onDragEnd}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') e.preventDefault();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg text-slate-600 bg-slate-50 border border-slate-200 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50 cursor-grab active:cursor-grabbing"
              aria-label={t('Перетащить')}
              title={t('Перетащить')}
            >
              <GripVertical size={15} />
            </div>
            <button
              type="button"
              disabled={!canMoveForward}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onShift(scope, blockId, 1);
              }}
              className="p-1.5 rounded-lg text-slate-600 bg-slate-50 border border-slate-200 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50 disabled:opacity-30 disabled:pointer-events-none"
              aria-label={moveForwardLabel}
              title={moveForwardLabel}
            >
              <MoveForwardIcon size={15} />
            </button>
          </div>
        </div>
        <div className="pointer-events-none select-none opacity-95">{children}</div>
      </div>
    </div>
  );
}
