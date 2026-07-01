import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type DashboardWidgetTier = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type DashboardWidgetKind = 'stat' | 'analytics' | 'detail' | 'warehouse' | 'title' | 'default';

export interface DashboardWidgetMetrics {
  width: number;
  height: number;
  scale: number;
  tier: DashboardWidgetTier;
  fontSize: number;
  kind: DashboardWidgetKind;
}

const defaultMetrics: DashboardWidgetMetrics = {
  width: 280,
  height: 220,
  scale: 1,
  tier: 'md',
  fontSize: 14,
  kind: 'default',
};

const DashboardWidgetMetricsContext = createContext<DashboardWidgetMetrics>(defaultMetrics);

export function useDashboardWidgetMetrics(): DashboardWidgetMetrics {
  return useContext(DashboardWidgetMetricsContext);
}

export function useDashChartTypography() {
  return {
    tick: 11,
    axisWidth: 28,
    strokeWidth: 2,
    dotRadius: 3,
    tooltipFontSize: 12,
  };
}

export function resolveWidgetKind(widgetId?: string): DashboardWidgetKind {
  if (!widgetId) return 'default';
  if (widgetId.startsWith('stat:')) return 'stat';
  if (widgetId.startsWith('analytics:')) return 'analytics';
  if (widgetId.startsWith('detail:')) return 'detail';
  if (widgetId === 'warehouse:title') return 'title';
  if (widgetId.startsWith('warehouse:')) return 'warehouse';
  return 'default';
}

function resolveTier(width: number, height: number, kind: DashboardWidgetKind): DashboardWidgetTier {
  const area = width * height;
  if (kind === 'stat') {
    if (height < 90 || area < 14_000) return 'xs';
    if (height < 120 || area < 24_000) return 'sm';
    if (height < 170 || area < 40_000) return 'md';
    return 'lg';
  }
  if (area < 22_000 || height < 110) return 'xs';
  if (area < 50_000 || height < 180) return 'sm';
  if (area < 100_000 || height < 260) return 'md';
  if (area < 160_000 || height < 340) return 'lg';
  return 'xl';
}

function resolveScale(_width: number, _height: number, _kind: DashboardWidgetKind): number {
  return 1;
}

function resolveFontSize(): number {
  return 14;
}

export default function DashboardWidgetScaler({
  children,
  className = '',
  widgetId,
}: {
  children: React.ReactNode;
  className?: string;
  widgetId?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const kind = useMemo(() => resolveWidgetKind(widgetId), [widgetId]);
  const [metrics, setMetrics] = useState<DashboardWidgetMetrics>({ ...defaultMetrics, kind });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width < 1 || height < 1) return;
      const scale = resolveScale(width, height, kind);
      setMetrics({
        width: Math.round(width),
        height: Math.round(height),
        scale,
        tier: resolveTier(width, height, kind),
        fontSize: resolveFontSize(),
        kind,
      });
    };

    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, [kind]);

  return (
    <DashboardWidgetMetricsContext.Provider value={metrics}>
      <div
        ref={ref}
        className={`dashboard-widget-scaler dashboard-widget-scaler--${kind} dashboard-widget-scaler--${metrics.tier} ${className}`.trim()}
        style={
          {
            '--dash-scale': 1,
          } as React.CSSProperties
        }
      >
        <div className="dashboard-widget-scaler__body">{children}</div>
      </div>
    </DashboardWidgetMetricsContext.Provider>
  );
}
