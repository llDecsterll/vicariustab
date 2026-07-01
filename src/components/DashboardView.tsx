/*
 * COPYRIGHT NOTICE | УВЕДОМЛЕНИЕ ОБ АВТОРСКИХ ПРАВАХ | 版权声明
 * © 2026 Utkin Vladislav Vyacheslavovich (Уткин Владислав Вячеславович)
 */
import React, { useMemo, useState, useEffect } from 'react';
import {
  Laptop,
  Network,
  Users,
  Warehouse,
  Printer,
  Camera,
  ArrowRight,
  AlertTriangle,
  Monitor,
  Server,
  Package,
  Wifi,
  Box,
  UserPlus,
  ClipboardList,
  PackagePlus,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  ObjectItem,
  NetworkDevice,
  ComputerItem,
  EmployeeItem,
  WarehouseItem,
  Activity,
  InventoryAudit,
  CustomWarehouse,
  SoftwareItem,
} from '../types';
import { useTranslation } from '../utils/i18n';
import {
  countDashboardEquipmentByTab,
  countDashboardNetworkEquipment,
} from '../utils/warehouseRouting';
import {
  buildEquipmentStatusSlices,
  buildEquipmentDynamicsSeries,
  buildNetworkTypeSummary,
  buildEquipmentByObject,
  buildDashboardAlerts,
  buildEquipmentTotals,
  dynamicsPeriodDelta,
  buildDashboardAuditCard,
  resolveDefaultDashboardAudit,
  countEmployeeDashboardStats,
  countWarehouseStripComputers,
  countWarehouseStripNetwork,
  buildSoftwareMonitoringSummary,
  type DynamicsPeriod,
} from '../utils/dashboardAnalytics';
import {
  useAnimatedNumber,
  dashboardStaggerClass,
  chartMotionProps,
  fastChartMotionProps,
} from '../utils/dashboardAnimation';
import { APP_VERSION } from '../config/appConfig';
import { COPYRIGHT_YEAR } from '../legal/copyright';
import {
  formatDashboardActivityTime,
  translateActivityAction,
  translateActivityDetail,
  translateDashboardAlert,
} from '../utils/dashboardI18n';
import {
  DashboardLayoutProvider,
  useDashboardLayout,
} from './DashboardLayoutContext';
import DashboardGridLayout from './DashboardGridLayout';
import { useDashboardWidgetMetrics, useDashChartTypography } from './DashboardWidgetScaler';
import type { AnalyticsWidgetId, DetailCardId, StatCardId, WarehouseStripId } from '../utils/dashboardLayout';

const CARD = 'bg-white rounded-2xl border border-slate-100 shadow-sm';
const PANEL = `${CARD} dash-widget-panel flex flex-col h-full min-h-0 overflow-hidden`;
const STAT = `${CARD} dash-widget-stat flex flex-col justify-start gap-1.5 text-left h-full min-h-0 w-full`;
const TITLE = 'text-sm font-bold text-slate-900 shrink-0';
const CAPTION = 'text-[11px] font-bold uppercase tracking-wider text-slate-400';
const BODY = 'text-sm text-slate-700';
const META = 'text-xs text-slate-500';
const LINK = 'text-xs font-semibold text-blue-600 flex items-center gap-1 hover:text-blue-700 transition-colors';

interface DashboardViewProps {
  objects: ObjectItem[];
  networkDevices: NetworkDevice[];
  computers: ComputerItem[];
  employees: EmployeeItem[];
  warehouseItems: WarehouseItem[];
  softwareItems?: SoftwareItem[];
  warehouses?: CustomWarehouse[];
  activities: Activity[];
  audits: InventoryAudit[];
  onNavigate: (tabId: string) => void;
  onAddComputer: () => void;
  onWarehouseReceipt: () => void;
  onAddEmployee: () => void;
}

function pickActivityStyle(action: string, detail: string): { icon: LucideIcon; box: string } {
  const text = `${action} ${detail}`.toLowerCase();
  if (text.includes('ноутбук') || text.includes('компьютер') || text.includes('пк') || text.includes('выдан'))
    return { icon: Laptop, box: 'bg-blue-50 text-blue-600' };
  if (text.includes('принтер') || text.includes('мфу'))
    return { icon: Printer, box: 'bg-violet-50 text-violet-600' };
  if (text.includes('сотрудник') || text.includes('создан'))
    return { icon: UserPlus, box: 'bg-emerald-50 text-emerald-600' };
  if (text.includes('инвентар') || text.includes('аудит'))
    return { icon: ClipboardList, box: 'bg-amber-50 text-amber-600' };
  if (text.includes('склад') || text.includes('поступ'))
    return { icon: PackagePlus, box: 'bg-sky-50 text-sky-600' };
  return { icon: Package, box: 'bg-slate-100 text-slate-500' };
}

function buildSparkline(base: number) {
  const factors = [0.52, 0.6, 0.55, 0.72, 0.66, 1];
  return factors.map((f, i) => ({ i, v: Math.max(0, Math.round(base * f)) }));
}

function DashChartArea({ children }: { children: React.ReactNode }) {
  const { width, height } = useDashboardWidgetMetrics();
  return (
    <div className="dash-widget-chart flex-1 min-h-0 w-full" key={`chart-${width}x${height}`}>
      {children}
    </div>
  );
}

function DynamicsChartInner({
  data,
  motion,
  chartGrid,
  chartTick,
  chartTooltip,
  lineDotFill,
  t,
}: {
  data: ReturnType<typeof buildEquipmentDynamicsSeries>;
  motion: ReturnType<typeof chartMotionProps>;
  chartGrid: string;
  chartTick: string;
  chartTooltip: object;
  lineDotFill: string;
  t: (key: string) => string;
}) {
  const typo = useDashChartTypography();
  return (
    <ComposedChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
      <defs>
        <linearGradient id="dashDynamicsFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.22} />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
      <XAxis dataKey="month" tick={{ fontSize: typo.tick, fill: chartTick }} axisLine={false} tickLine={false} />
      <YAxis
        tick={{ fontSize: typo.tick, fill: chartTick }}
        axisLine={false}
        tickLine={false}
        width={typo.axisWidth}
        allowDecimals={false}
      />
      <Tooltip
        contentStyle={{ ...chartTooltip, fontSize: typo.tooltipFontSize }}
        labelFormatter={(l) => `${t('Месяц')}: ${l}`}
        cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }}
      />
      <Area type="monotone" dataKey="count" fill="url(#dashDynamicsFill)" stroke="none" tooltipType="none" {...motion} animationBegin={150} />
      <Line
        type="monotone"
        dataKey="count"
        stroke="#3b82f6"
        strokeWidth={typo.strokeWidth}
        dot={{ r: typo.dotRadius, fill: lineDotFill, stroke: '#3b82f6', strokeWidth: 1.5 }}
        activeDot={{ r: typo.dotRadius + 1.5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
        name={t('Добавлено')}
        {...motion}
        animationBegin={200}
      />
    </ComposedChart>
  );
}

function useVisibleAlertCount(): number {
  const { height } = useDashboardWidgetMetrics();
  if (height > 360) return 5;
  if (height > 280) return 4;
  if (height > 200) return 3;
  return 2;
}

function FooterLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`${LINK} mt-auto pt-2 shrink-0 self-start`}>
      {label} <ArrowRight size={12} />
    </button>
  );
}

function AlertsWidgetList({
  alerts,
  editMode,
  onNavigate,
}: {
  alerts: ReturnType<typeof buildDashboardAlerts>;
  editMode: boolean;
  onNavigate: (tabId: string) => void;
}) {
  const { t } = useTranslation();
  const visibleCount = useVisibleAlertCount();

  return (
    <div className="space-y-2 flex-1 min-h-0 overflow-auto">
      {alerts.length === 0 ? (
        <p className={`text-xs ${META} text-center py-6`}>{t('Нет срочных уведомлений')}</p>
      ) : (
        alerts.slice(0, visibleCount).map((a, i) => {
          const localized = translateDashboardAlert(a, t);
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => !editMode && onNavigate(a.tab)}
              className={`dashboard-rise w-full text-left p-2.5 rounded-xl border text-sm transition-colors ${
                a.tone === 'danger'
                  ? 'bg-rose-50 border-rose-100 text-rose-800'
                  : 'bg-amber-50 border-amber-100 text-amber-900'
              }`}
              style={{ animationDelay: `${200 + i * 80}ms` }}
            >
              <div className="flex items-start gap-2.5">
                <span
                  className={`p-1.5 rounded-lg shrink-0 ${
                    a.tone === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                  }`}
                >
                  <AlertTriangle size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold leading-snug text-slate-900`}>{localized.title}</p>
                  <p className={`text-xs text-slate-600 mt-0.5`}>{localized.subtitle}</p>
                  {localized.detail && <p className={`text-xs ${META} mt-0.5`}>{localized.detail}</p>}
                </div>
                {localized.badge && (
                  <span
                    className={`shrink-0 text-[9px] font-bold px-2 py-1 rounded-md whitespace-nowrap ${
                      a.tone === 'danger' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {localized.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })
      )}
    </div>
  );
}

function DynamicsStatBox({
  label,
  value,
  suffix,
  suffixClassName = 'text-slate-400',
  compact = false,
}: {
  label: string;
  value: number;
  suffix?: React.ReactNode;
  suffixClassName?: string;
  compact?: boolean;
}) {
  const displayed = useAnimatedNumber(value, 850, 0);

  return (
    <div
      className={`rounded-xl border border-slate-100 bg-slate-50/80 flex flex-col justify-center p-2.5 min-h-0 ${
        compact ? 'min-h-0' : 'min-h-[52px]'
      }`}
    >
      <p className={`text-[11px] font-bold uppercase tracking-wider ${META} leading-none line-clamp-2`}>{label}</p>
      <div className={`flex items-end justify-between gap-2 ${compact ? 'mt-1' : 'mt-1.5'}`}>
        <span className="text-sm font-bold text-slate-900 tabular-nums leading-none">
          {displayed}
        </span>
        {suffix != null && suffix !== '' && (
          <span className={`text-xs font-medium tabular-nums pb-0.5 shrink-0 text-right ${suffixClassName}`}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  numericValue,
  subDetail,
  icon,
  onClick,
  iconBg,
  staggerIndex = 0,
  interactive = true,
}: {
  label: string;
  numericValue: number;
  subDetail?: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
  iconBg: string;
  staggerIndex?: number;
  interactive?: boolean;
}) {
  const { t } = useTranslation();
  const Tag = interactive ? 'button' : 'div';
  const iconSize = 16;

  return (
    <Tag
      type={interactive ? 'button' : undefined}
      onClick={interactive ? onClick : undefined}
      aria-label={interactive ? `${label}: ${numericValue}` : undefined}
      className={`${STAT} ${
        interactive ? 'hover:shadow-md hover:border-blue-200 transition-all group cursor-pointer' : ''
      } ${dashboardStaggerClass(staggerIndex)}`}
    >
      <div className="flex items-center gap-2.5 w-full min-h-0 flex-1">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 ${
            interactive ? 'group-hover:scale-105' : ''
          } ${iconBg}`}
        >
          {React.isValidElement(icon)
            ? React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: iconSize })
            : icon}
        </div>

        <div className="flex flex-col justify-center gap-0.5 min-w-0 flex-1 py-0.5">
          <span className="text-xs font-semibold text-slate-600 leading-tight line-clamp-2">{label}</span>
          {subDetail ? (
            <div className={`text-[11px] ${META} leading-snug line-clamp-2`}>{subDetail}</div>
          ) : null}
        </div>

        <div className="flex flex-col items-center justify-center shrink-0 self-stretch border-l border-slate-100 pl-2.5 min-w-[2.5rem]">
          <span className="text-lg font-bold text-slate-700 tabular-nums leading-none">{numericValue}</span>
          <span className="text-[9px] text-slate-400 mt-1 lowercase tracking-wide">{t('Всего')}</span>
        </div>
      </div>
    </Tag>
  );
}

function AnimatedBar({ percent, delay = 0, tall = false }: { percent: number; delay?: number; tall?: boolean }) {
  return (
    <div className={`${tall ? 'h-2' : 'h-1.5'} rounded-full bg-slate-100 overflow-hidden min-w-[48px]`}>
      <div
        className={`dashboard-bar h-full rounded-full ${tall ? 'bg-gradient-to-r from-blue-600 to-blue-400' : 'bg-blue-500'}`}
        style={{ width: `${percent}%`, animationDelay: `${delay}ms` }}
      />
    </div>
  );
}

const StatusLegendRow: React.FC<{
  name: string;
  color: string;
  value: number;
  total: number;
  rowIndex: number;
}> = ({ name, color, value, total, rowIndex }) => {
  const { t } = useTranslation();
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const animatedPct = useAnimatedNumber(pct, 360, rowIndex * 40);

  return (
    <div
      className="dashboard-legend-item flex items-center gap-2 min-w-0"
      style={{ animationDelay: `${400 + rowIndex * 120}ms` }}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs font-semibold text-slate-800 leading-none truncate">{t(name)}</span>
      <span className="text-xs text-slate-400 tabular-nums leading-none shrink-0 ml-auto">
        {animatedPct}% ({value})
      </span>
    </div>
  );
};

function StatusTotalBadge({ total }: { total: number }) {
  const { t } = useTranslation();
  const animatedTotal = useAnimatedNumber(total, 360, 0);

  return (
    <div className="flex flex-col items-center justify-center shrink-0 border-r border-slate-100 pr-2.5 mr-0.5 min-w-[2.75rem]">
      <span className="text-base font-bold text-slate-900 tabular-nums leading-none">{animatedTotal}</span>
      <span className={`text-[9px] ${META} mt-0.5 lowercase tracking-wide`}>{t('Всего')}</span>
    </div>
  );
}

function StatusChartDonut({
  slices,
  total,
  motion,
  tooltipStyle,
}: {
  slices: ReturnType<typeof buildEquipmentStatusSlices>;
  total: number;
  motion: ReturnType<typeof fastChartMotionProps>;
  tooltipStyle: React.CSSProperties;
}) {
  const activeSlices = slices.filter((s) => s.value > 0);
  const chartDim = 64;

  if (activeSlices.length === 0) {
    return <StatusTotalBadge total={total} />;
  }

  return (
    <div className="relative shrink-0 border-r border-slate-100 pr-2.5 mr-0.5" style={{ width: chartDim, height: chartDim }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Pie
            data={activeSlices}
            cx="50%"
            cy="50%"
            innerRadius="52%"
            outerRadius="88%"
            paddingAngle={2}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            stroke="none"
            {...motion}
            animationBegin={0}
          >
            {activeSlices.map((entry) => (
              <Cell key={entry.name} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
        <span className="text-xs font-bold text-slate-900 tabular-nums leading-none">{total}</span>
      </div>
    </div>
  );
}

function CircularProgress({ percent, compact = false }: { percent: number; compact?: boolean }) {
  const { t } = useTranslation();
  const { width, height, scale } = useDashboardWidgetMetrics();
  const animated = useAnimatedNumber(percent, 1200, 200);
  const maxDim = compact ? 92 : height < 240 ? 108 : 168;
  const minDim = compact ? 52 : 64;
  const dim = Math.round(
    Math.min(Math.max(Math.min(width, height) * (compact ? 0.42 : 0.48), minDim), maxDim) *
      Math.min(scale, 1.12)
  );
  const r = dim * 0.38;
  const stroke = Math.max(4, dim * 0.06);
  const c = 2 * Math.PI * r;
  const offset = c - (animated / 100) * c;
  const center = dim / 2;

  return (
    <div className="relative shrink-0 dash-widget-progress" style={{ width: dim, height: dim }}>
      <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`} className="-rotate-90">
        <circle cx={center} cy={center} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-sm font-bold text-slate-900 tabular-nums leading-none"
          style={{ fontSize: compact ? '12px' : '14px' }}
        >
          {animated}%
        </span>
        {!compact && <span className="text-xs text-slate-500 mt-0.5">{t('Прогресс')}</span>}
      </div>
    </div>
  );
}

function InventoryDetailCard({
  staggerIndex,
  audits,
  selectedAudit,
  auditCard,
  inventoryProgress,
  editMode,
  auditStatusTone,
  onAuditSelectionChange,
  onNavigate,
}: {
  staggerIndex: number;
  audits: InventoryAudit[];
  selectedAudit: InventoryAudit | undefined;
  auditCard: ReturnType<typeof buildDashboardAuditCard>;
  inventoryProgress: ReturnType<typeof buildDashboardAuditCard>['progress'];
  editMode: boolean;
  auditStatusTone: (status: InventoryAudit['status']) => string;
  onAuditSelectionChange: (auditId: string) => void;
  onNavigate: (tabId: string) => void;
}) {
  const { t } = useTranslation();
  const showAuditMeta = true;

  return (
    <div className={`${PANEL} text-left ${dashboardStaggerClass(staggerIndex, 2)}`}>
      <h2 className={`${TITLE} mb-2`}>{t('Инвентаризация')}</h2>
      {audits.length > 0 ? (
        <select
          value={selectedAudit?.id ?? ''}
          onChange={(e) => onAuditSelectionChange(e.target.value)}
          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shrink-0 mb-2"
        >
          {audits.map((audit) => (
            <option key={audit.id} value={audit.id}>
              {audit.title} ({audit.date})
            </option>
          ))}
        </select>
      ) : (
        <p className={`text-xs ${META} shrink-0 mb-2`}>{t('Нет запланированных инвентаризаций')}</p>
      )}
      {selectedAudit && (
        <div className="flex flex-wrap items-center gap-1.5 mb-2 shrink-0">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${auditStatusTone(selectedAudit.status)}`}
          >
            {t(selectedAudit.status)}
          </span>
          {auditCard.objectLabel && showAuditMeta && (
            <span className="text-xs text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md truncate max-w-full">
              {t('Объект')}: {auditCard.objectLabel}
            </span>
          )}
        </div>
      )}
      <div className="flex flex-1 min-h-0 gap-3 items-center">
        <CircularProgress percent={inventoryProgress.percent} compact />
        <div className={`flex-1 min-w-0 space-y-1 text-sm text-slate-700`}>
          <p className="leading-snug">
            {t('Проверено')}:{' '}
            <strong className="text-slate-900 tabular-nums">
              {inventoryProgress.checked}/{inventoryProgress.total}
            </strong>
          </p>
          <p className="leading-snug">
            {t('Осталось')}:{' '}
            <strong className="text-slate-900 tabular-nums">
              {inventoryProgress.remaining} {t('позиций')}
            </strong>
          </p>
          <p className="leading-snug">
            {t('Объектов')}:{' '}
            <strong className="text-slate-900 tabular-nums">
              {inventoryProgress.objectsDone} {t('из')} {inventoryProgress.objectsTotal}
            </strong>
          </p>
          {selectedAudit && showAuditMeta && (
            <div className="pt-1.5 mt-1 border-t border-slate-100 space-y-1 text-xs leading-snug">
              <p>
                <span className="text-slate-500 font-semibold">{t('Кто проводит:')}</span>{' '}
                <span className="text-slate-800">{auditCard.conductorUser || t('Не указан')}</span>
              </p>
              <p>
                <span className="text-slate-500 font-semibold">{t('Кто принимает:')}</span>{' '}
                <span className="text-slate-800">{auditCard.controllerUser || t('Не указан')}</span>
              </p>
            </div>
          )}
        </div>
      </div>
      <FooterLink label={t('Перейти к инвентаризации')} onClick={() => !editMode && onNavigate('inventory')} />
    </div>
  );
}

const WarehouseCategoryCard: React.FC<{
  label: string;
  count: number;
  price: number;
  formatMoney: (val: number) => string;
  icon: React.ElementType<{ size?: number }>;
  iconBox: string;
  iconColor: string;
  sparkColor: string;
  staggerIndex: number;
  chartsReady: boolean;
  reduceMotion: boolean;
}> = ({
  label,
  count,
  price,
  formatMoney,
  icon: Icon,
  iconBox,
  iconColor,
  sparkColor,
  staggerIndex,
  chartsReady,
  reduceMotion,
}) => {
  const { tier, scale, width, height } = useDashboardWidgetMetrics();
  const delay = 420 + staggerIndex * 70;
  const animatedCount = useAnimatedNumber(count, 820, delay);
  const animatedPrice = useAnimatedNumber(price, 920, delay + 90);
  const sparkData = useMemo(() => buildSparkline(Math.max(count, 1)), [count]);
  const sparkMotion = fastChartMotionProps(reduceMotion);
  const gradientId = `wh-spark-${staggerIndex}`;
  const iconSize = Math.round(14 + scale * 4);
  const showSpark = tier !== 'xs' && height > 100;

  return (
    <div
      className={`rounded-xl border border-slate-100 bg-slate-50/60 flex flex-col gap-1.5 h-full min-h-0 p-2.5 group transition-all duration-300 hover:shadow-md hover:border-blue-200/80 hover:bg-white ${
        dashboardStaggerClass(staggerIndex, 9)
      }`}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 dashboard-icon-pop transition-transform duration-300 group-hover:scale-110 ${iconBox} ${iconColor}`}
          style={{ animationDelay: `${delay + 100}ms` }}
        >
          <Icon size={iconSize} />
        </span>
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-medium ${META} leading-none`}>{label}</p>
          <p className="text-sm font-bold text-slate-900 leading-tight tabular-nums mt-0.5">
            {animatedCount} <span className="text-xs font-semibold text-slate-500">шт.</span>
          </p>
          <p className="text-xs font-semibold text-blue-600 mt-0.5 tabular-nums transition-colors duration-300 group-hover:text-blue-700">
            {formatMoney(animatedPrice)}
          </p>
        </div>
      </div>
      {showSpark && (
      <div
        className="warehouse-spark-wrap flex-1 min-h-[24px] max-h-[40px] -mx-0.5 dashboard-spark-reveal"
        style={{ animationDelay: `${delay + 180}ms` }}
        key={`spark-${width}x${height}`}
      >
        {chartsReady && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparkColor} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke="none"
                fill={`url(#${gradientId})`}
                isAnimationActive={!reduceMotion}
                animationDuration={720}
                animationBegin={delay + 220}
                animationEasing="ease-out"
              />
              <Line
                type="monotone"
                dataKey="v"
                stroke={sparkColor}
                strokeWidth={1.75}
                dot={false}
                {...sparkMotion}
                animationBegin={delay + 160}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
      )}
    </div>
  );
};

export default function DashboardView(props: DashboardViewProps) {
  return (
    <DashboardLayoutProvider>
      <DashboardViewInner {...props} />
    </DashboardLayoutProvider>
  );
}

function DashboardViewInner({
  objects,
  networkDevices,
  computers,
  employees,
  warehouseItems,
  softwareItems = [],
  warehouses = [],
  activities,
  audits,
  onNavigate,
}: DashboardViewProps) {
  const { t, language } = useTranslation();
  const { editMode, gridItems, updateGridLayout, removeWidget } = useDashboardLayout();
  const [chartsReady, setChartsReady] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [dynamicsPeriod, setDynamicsPeriod] = useState<DynamicsPeriod>('quarter');

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener('change', onChange);
    const timer = window.setTimeout(() => setChartsReady(true), 80);
    return () => {
      mq.removeEventListener('change', onChange);
      window.clearTimeout(timer);
    };
  }, []);

  const motion = chartMotionProps(reduceMotion);
  const statusMotion = fastChartMotionProps(reduceMotion);
  const chartGrid = '#e2e8f0';
  const chartTick = '#94a3b8';
  const chartTooltip = {
    fontSize: 11,
    borderRadius: 10,
    border: '1px solid #e2e8f0',
    boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
  };
  const lineDotFill = '#fff';

  const isWrittenOffComputer = (c: ComputerItem) =>
    c.status === 'Списано' || c.status === 'На списание';
  const isWrittenOffNetwork = (n: NetworkDevice) =>
    n.status === 'Списано' || n.status === 'На списание';
  const isWrittenOffWarehouse = (w: WarehouseItem) =>
    w.status === 'Списано' || w.status === 'На списание' || w.quantity <= 0;

  const activeComputers = computers.filter((c) => !isWrittenOffComputer(c));
  const activeNetworkDevices = networkDevices.filter((n) => !isWrittenOffNetwork(n));
  const activeWarehouseItems = warehouseItems.filter((w) => !isWrittenOffWarehouse(w));

  const pcStats = countDashboardEquipmentByTab(activeComputers, 'computers');
  const employeeStats = countEmployeeDashboardStats(employees);
  const netStats = countDashboardNetworkEquipment(activeNetworkDevices, warehouseItems, warehouses);
  const printerStats = countDashboardEquipmentByTab(activeComputers, 'orgtech');
  const cameraStats = countDashboardEquipmentByTab(activeComputers, 'surveillance');
  const consumableStats = countDashboardEquipmentByTab(activeComputers, 'consumables');
  const otherStats = countDashboardEquipmentByTab(activeComputers, 'other_equip');
  const warehouseCount = activeWarehouseItems.reduce((sum, item) => sum + item.quantity, 0);
  const warehouseCostSum = activeWarehouseItems.reduce(
    (sum, item) => sum + item.quantity * item.costPerUnit,
    0
  );

  const formatMoney = (val: number) => {
    let loc = 'ru-RU';
    let cur = 'RUB';
    let converted = val;
    if (language === 'en') {
      loc = 'en-US';
      cur = 'USD';
      converted = val / 90;
    } else if (language === 'zh') {
      loc = 'zh-CN';
      cur = 'CNY';
      converted = val / 12;
    }
    return new Intl.NumberFormat(loc, { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(
      converted
    );
  };

  const statusSlices = useMemo(
    () => buildEquipmentStatusSlices(computers, networkDevices),
    [computers, networkDevices]
  );
  const statusTotal = statusSlices.reduce((s, x) => s + x.value, 0);

  const dateLocale = language === 'en' ? 'en-US' : language === 'zh' ? 'zh-CN' : 'ru-RU';

  const dynamicsData = useMemo(
    () => buildEquipmentDynamicsSeries(activities, dynamicsPeriod, dateLocale),
    [activities, dynamicsPeriod, dateLocale]
  );
  const equipmentTotals = useMemo(
    () => buildEquipmentTotals(computers, networkDevices),
    [computers, networkDevices]
  );
  const periodDelta = useMemo(() => dynamicsPeriodDelta(dynamicsData), [dynamicsData]);

  const DASHBOARD_AUDIT_STORAGE_KEY = 'dashboard_selected_audit_id';
  const [selectedAuditId, setSelectedAuditId] = useState<string>(() => {
    try {
      return localStorage.getItem(DASHBOARD_AUDIT_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    if (audits.length === 0) {
      if (selectedAuditId) setSelectedAuditId('');
      return;
    }
    const stillExists = selectedAuditId && audits.some((a) => a.id === selectedAuditId);
    if (!stillExists) {
      const fallback = resolveDefaultDashboardAudit(audits);
      setSelectedAuditId(fallback?.id ?? '');
    }
  }, [audits, selectedAuditId]);

  const selectedAudit = useMemo(
    () => audits.find((a) => a.id === selectedAuditId) ?? resolveDefaultDashboardAudit(audits),
    [audits, selectedAuditId]
  );

  const auditCard = useMemo(
    () =>
      buildDashboardAuditCard(
        selectedAudit,
        objects,
        equipmentTotals.total,
        computers,
        networkDevices
      ),
    [selectedAudit, objects, equipmentTotals.total, computers, networkDevices]
  );

  const inventoryProgress = auditCard.progress;

  const handleAuditSelectionChange = (auditId: string) => {
    setSelectedAuditId(auditId);
    try {
      if (auditId) localStorage.setItem(DASHBOARD_AUDIT_STORAGE_KEY, auditId);
      else localStorage.removeItem(DASHBOARD_AUDIT_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const auditStatusTone = (status: InventoryAudit['status']) => {
    switch (status) {
      case 'Завершена':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'В процессе':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-amber-50 text-amber-800 border-amber-200';
    }
  };

  const networkSummary = useMemo(
    () => buildNetworkTypeSummary(activeNetworkDevices),
    [activeNetworkDevices]
  );
  const byObject = useMemo(
    () => buildEquipmentByObject(objects, activeComputers, activeNetworkDevices),
    [objects, activeComputers, activeNetworkDevices]
  );
  const alerts = useMemo(
    () => buildDashboardAlerts({ computers: activeComputers, audits }),
    [activeComputers, audits]
  );
  const softwareMonitoring = useMemo(
    () => buildSoftwareMonitoringSummary(softwareItems),
    [softwareItems]
  );

  const recentActivities = activities.slice(0, 4);
  const maxObjectCount = Math.max(1, ...byObject.map((o) => o.count));
  const maxNetworkCount = Math.max(1, ...networkSummary.map((n) => n.count));

  const sumWarehouseCost = (predicate: (w: WarehouseItem) => boolean) =>
    activeWarehouseItems.filter(predicate).reduce((s, w) => s + w.quantity * w.costPerUnit, 0);

  const laptopStrip = countWarehouseStripComputers(activeComputers, activeWarehouseItems, 'laptop');
  const desktopStrip = countWarehouseStripComputers(activeComputers, activeWarehouseItems, 'desktop');
  const switchStrip = countWarehouseStripNetwork(
    activeNetworkDevices,
    activeWarehouseItems,
    warehouses,
    'Коммутатор'
  );
  const apStrip = countWarehouseStripNetwork(
    activeNetworkDevices,
    activeWarehouseItems,
    warehouses,
    'Точка доступа'
  );

  const monitorCount = activeWarehouseItems
    .filter((w) => w.type === 'Периферия')
    .reduce((s, w) => s + w.quantity, 0);

  const printerWarehouseCount = activeWarehouseItems
    .filter((w) => w.type === 'Оргтехника')
    .reduce((s, w) => s + w.quantity, 0);

  const warehouseStripById: Record<
    WarehouseStripId,
    {
      label: string;
      icon: React.ElementType<{ size?: number }>;
      iconBox: string;
      iconColor: string;
      sparkColor: string;
      count: number;
      price: number;
    }
  > = {
    laptops: {
      label: t('Ноутбуки'),
      icon: Laptop,
      iconBox: 'bg-blue-50',
      iconColor: 'text-blue-600',
      sparkColor: '#3b82f6',
      count: laptopStrip.count,
      price: laptopStrip.cost,
    },
    monitors: {
      label: t('Мониторы'),
      icon: Monitor,
      iconBox: 'bg-violet-50',
      iconColor: 'text-violet-600',
      sparkColor: '#8b5cf6',
      count: monitorCount,
      price: sumWarehouseCost((w) => w.type === 'Периферия'),
    },
    desktops: {
      label: t('Системные блоки'),
      icon: Server,
      iconBox: 'bg-violet-50',
      iconColor: 'text-violet-600',
      sparkColor: '#7c3aed',
      count: desktopStrip.count,
      price: desktopStrip.cost,
    },
    printers: {
      label: t('Принтеры'),
      icon: Printer,
      iconBox: 'bg-violet-50',
      iconColor: 'text-violet-600',
      sparkColor: '#a855f7',
      count: printerWarehouseCount,
      price: sumWarehouseCost((w) => w.type === 'Оргтехника'),
    },
    switches: {
      label: t('Коммутаторы'),
      icon: Box,
      iconBox: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      sparkColor: '#10b981',
      count: switchStrip.count,
      price: switchStrip.cost,
    },
    access_points: {
      label: t('Точки доступа'),
      icon: Wifi,
      iconBox: 'bg-sky-50',
      iconColor: 'text-sky-600',
      sparkColor: '#0ea5e9',
      count: apStrip.count,
      price: apStrip.cost,
    },
  };

  const subStrong = (label: string, value: number) => (
    <span>
      {label}: <strong className="text-slate-600 font-semibold">{value}</strong>
    </span>
  );

  const warehouseIssuedDetail = (onWarehouse: number, issued: number) => (
    <>
      {subStrong(t('На складе'), onWarehouse)}
      <span className="mx-1">·</span>
      {subStrong(t('Выдано'), issued)}
    </>
  );

  const lastUpdated = new Date().toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' });
  const issuedPct = equipmentTotals.total > 0 ? ((equipmentTotals.issued / equipmentTotals.total) * 100).toFixed(1) : '0';
  const warehousePct = equipmentTotals.total > 0 ? ((equipmentTotals.warehouse / equipmentTotals.total) * 100).toFixed(1) : '0';
  const writtenOffPct = equipmentTotals.total > 0 ? ((equipmentTotals.writtenOff / equipmentTotals.total) * 100).toFixed(1) : '0';

  const renderStatCard = (id: StatCardId, staggerIndex: number) => {
    switch (id) {
      case 'computers':
        return (
          <StatCard
            label={t('Компьютеры')}
            numericValue={pcStats.total}
            subDetail={warehouseIssuedDetail(pcStats.onWarehouse, pcStats.issued)}
            icon={<Laptop size={18} />}
            iconBg="bg-blue-50 text-blue-600"
            onClick={() => !editMode && onNavigate('computers')}
            staggerIndex={staggerIndex}
            interactive={!editMode}
          />
        );
      case 'employees':
        return (
          <StatCard
            label={t('Сотрудники')}
            numericValue={employeeStats.total}
            subDetail={
              <>
                {subStrong(t('Работа'), employeeStats.working)}
                <span className="mx-1">·</span>
                {subStrong(t('Отпуск'), employeeStats.vacation)}
              </>
            }
            icon={<Users size={18} />}
            iconBg="bg-violet-50 text-violet-600"
            onClick={() => !editMode && onNavigate('employees')}
            staggerIndex={staggerIndex}
            interactive={!editMode}
          />
        );
      case 'warehouse':
        return (
          <StatCard
            label={t('Оборудование на складе')}
            numericValue={warehouseCount}
            subDetail={
              <span>
                {t('На сумму')}:{' '}
                <strong className="text-slate-600 font-semibold">{formatMoney(warehouseCostSum)}</strong>
              </span>
            }
            icon={<Warehouse size={18} />}
            iconBg="bg-emerald-50 text-emerald-600"
            onClick={() => !editMode && onNavigate('warehouse')}
            staggerIndex={staggerIndex}
            interactive={!editMode}
          />
        );
      case 'network':
        return (
          <StatCard
            label={t('Сетевое оборудование')}
            numericValue={netStats.total}
            subDetail={warehouseIssuedDetail(netStats.onWarehouse, netStats.issued)}
            icon={<Network size={18} />}
            iconBg="bg-blue-50 text-blue-600"
            onClick={() => !editMode && onNavigate('network')}
            staggerIndex={staggerIndex}
            interactive={!editMode}
          />
        );
      case 'printers':
        return (
          <StatCard
            label={t('Принтеры')}
            numericValue={printerStats.total}
            subDetail={warehouseIssuedDetail(printerStats.onWarehouse, printerStats.issued)}
            icon={<Printer size={18} />}
            iconBg="bg-violet-50 text-violet-600"
            onClick={() => !editMode && onNavigate('orgtech')}
            staggerIndex={staggerIndex}
            interactive={!editMode}
          />
        );
      case 'cameras':
        return (
          <StatCard
            label={t('Камеры СКУД')}
            numericValue={cameraStats.total}
            subDetail={warehouseIssuedDetail(cameraStats.onWarehouse, cameraStats.issued)}
            icon={<Camera size={18} />}
            iconBg="bg-slate-100 text-slate-500"
            onClick={() => !editMode && onNavigate('surveillance')}
            staggerIndex={staggerIndex}
            interactive={!editMode}
          />
        );
      case 'consumables':
        return (
          <StatCard
            label={t('Расходники')}
            numericValue={consumableStats.total}
            subDetail={warehouseIssuedDetail(consumableStats.onWarehouse, consumableStats.issued)}
            icon={<Package size={18} />}
            iconBg="bg-emerald-50 text-emerald-600"
            onClick={() => !editMode && onNavigate('consumables')}
            staggerIndex={staggerIndex}
            interactive={!editMode}
          />
        );
      case 'other':
        return (
          <StatCard
            label={t('Прочее оборудование')}
            numericValue={otherStats.total}
            subDetail={warehouseIssuedDetail(otherStats.onWarehouse, otherStats.issued)}
            icon={<Server size={18} />}
            iconBg="bg-slate-100 text-slate-500"
            onClick={() => !editMode && onNavigate('other_equip')}
            staggerIndex={staggerIndex}
            interactive={!editMode}
          />
        );
      default:
        return null;
    }
  };

  const renderAnalyticsWidget = (id: AnalyticsWidgetId, staggerIndex: number) => {
    switch (id) {
      case 'dynamics':
        return (
          <div className={`${PANEL} dashboard-chart-glow ${dashboardStaggerClass(staggerIndex, 1)}`}>
            <div className="flex items-center justify-between mb-2 shrink-0">
              <h2 className={TITLE}>{t('Динамика оборудования')}</h2>
              <select
                value={dynamicsPeriod}
                onChange={(e) => setDynamicsPeriod(e.target.value as DynamicsPeriod)}
                className="text-xs font-medium text-slate-600 bg-slate-50 pl-2.5 pr-7 py-1 rounded-lg border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 cursor-pointer appearance-none bg-[length:10px] bg-[right_8px_center] bg-no-repeat"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                }}
                aria-label={t('Период')}
              >
                <option value="month">{t('Месяц')}</option>
                <option value="quarter">{t('Квартал')}</option>
                <option value="year">{t('Год')}</option>
              </select>
            </div>
            <DashChartArea>
              {chartsReady && (
                <ResponsiveContainer width="100%" height="100%">
                  <DynamicsChartInner
                    data={dynamicsData}
                    motion={motion}
                    chartGrid={chartGrid}
                    chartTick={chartTick}
                    chartTooltip={chartTooltip}
                    lineDotFill={lineDotFill}
                    t={t}
                  />
                </ResponsiveContainer>
              )}
            </DashChartArea>
            <div className="dash-widget-stats grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-100 shrink-0">
              <DynamicsStatBox
                label={t('Всего единиц')}
                value={equipmentTotals.total}
                suffix={periodDelta > 0 ? `+${periodDelta} ${t('за период')}` : undefined}
                suffixClassName="text-emerald-600"
              />
              <DynamicsStatBox label={t('Выдано')} value={equipmentTotals.issued} suffix={`${issuedPct}%`} />
              <DynamicsStatBox label={t('На складе')} value={equipmentTotals.warehouse} suffix={`${warehousePct}%`} />
              <DynamicsStatBox label={t('Списано')} value={equipmentTotals.writtenOff} suffix={`${writtenOffPct}%`} />
            </div>
          </div>
        );
      case 'status_chart':
        return (
          <div className={`${PANEL} dash-widget-status ${dashboardStaggerClass(staggerIndex, 1)}`}>
            <h2 className={`${TITLE} mb-1.5`}>{t('Статусы оборудования')}</h2>
            <div className="flex items-center gap-2 w-full shrink-0">
              <StatusChartDonut
                slices={statusSlices}
                total={statusTotal}
                motion={statusMotion}
                tooltipStyle={chartTooltip}
              />
              <div className="dash-widget-legend flex flex-col gap-1 flex-1 min-w-0">
                {statusSlices.map((s, i) => (
                  <StatusLegendRow key={s.name} name={s.name} color={s.color} value={s.value} total={statusTotal} rowIndex={i} />
                ))}
              </div>
            </div>
            <div className={`flex items-center gap-1.5 text-xs ${META} mt-auto pt-2 border-t border-slate-100 shrink-0`}>
              <span>
                {t('Последнее обновление')}: {t('сегодня')}, {lastUpdated}
              </span>
              <RefreshCw size={11} className="text-slate-400 shrink-0" />
            </div>
          </div>
        );
      case 'alerts':
        return (
          <div className={`${PANEL} ${dashboardStaggerClass(staggerIndex, 1)}`}>
            <div className="flex items-center justify-between mb-2 shrink-0">
              <h2 className={TITLE}>{t('Требуют внимания')}</h2>
              {alerts.length > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center">
                  {alerts.length}
                </span>
              )}
            </div>
            <AlertsWidgetList alerts={alerts} editMode={editMode} onNavigate={onNavigate} />
            {alerts.length > 0 && <FooterLink label={t('Смотреть все')} onClick={() => !editMode && onNavigate('warranties')} />}
          </div>
        );
      default:
        return null;
    }
  };

  const renderDetailCard = (id: DetailCardId, staggerIndex: number) => {
    switch (id) {
      case 'network_summary':
        return (
          <div className={`${PANEL} ${dashboardStaggerClass(staggerIndex, 2)}`}>
            <h2 className={`${TITLE} mb-2`}>{t('Сетевое оборудование')}</h2>
            {networkSummary.length === 0 ? (
              <div className="flex-1 min-h-0 flex items-start">
                <p className={`text-sm ${META}`}>{t('Нет данных')}</p>
              </div>
            ) : (
              <div className="space-y-1 flex-1 min-h-0 overflow-auto">
                <div className={`grid grid-cols-[1fr_3.2em_5em] gap-2 ${CAPTION} pb-2 border-b border-slate-100`}>
                  <span>{t('Тип')}</span>
                  <span className="text-right">{t('Количество')}</span>
                  <span>{t('Устройства')}</span>
                </div>
                {networkSummary.map((row, i) => (
                  <div
                    key={row.type}
                    className="dashboard-legend-item grid grid-cols-[1fr_52px_80px] gap-2 items-center py-2 border-b border-slate-50 last:border-0"
                    style={{ animationDelay: `${300 + i * 100}ms` }}
                  >
                    <span className={`${BODY} truncate`}>{t(row.type)}</span>
                    <span className="text-sm font-bold text-slate-900 text-right tabular-nums">{row.count}</span>
                    <AnimatedBar percent={Math.round((row.count / maxNetworkCount) * 100)} delay={350 + i * 100} />
                  </div>
                ))}
              </div>
            )}
            <FooterLink label={t('Перейти к сетевому оборудованию')} onClick={() => !editMode && onNavigate('network')} />
          </div>
        );
      case 'activities':
        return (
          <div className={`${PANEL} ${dashboardStaggerClass(staggerIndex, 2)}`}>
            <h2 className={`${TITLE} mb-2`}>{t('Последние действия')}</h2>
            <div className="space-y-0 flex-1 min-h-0 overflow-auto scrollbar-none">
              {recentActivities.length === 0 ? (
                <p className={`text-xs ${META}`}>{t('Журнал пуст')}</p>
              ) : (
                recentActivities.map((act, i) => {
                  const { icon: Icon, box } = pickActivityStyle(act.action, act.detail);
                  const actionLabel = translateActivityAction(act.action, t);
                  const detailLabel = translateActivityDetail(act.detail, t);
                  return (
                    <div
                      key={act.id}
                      className="dashboard-legend-item flex gap-2.5 py-2 border-b border-slate-50 last:border-0"
                      style={{ animationDelay: `${250 + i * 70}ms` }}
                    >
                      <span className={`p-1.5 rounded-lg h-fit shrink-0 ${box}`}>
                        <Icon size={14} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold leading-snug text-slate-900">{actionLabel}</p>
                        {detailLabel ? (
                          <p className={`text-xs text-slate-600 mt-0.5 leading-snug`}>{detailLabel}</p>
                        ) : null}
                      </div>
                      <span className={`text-xs ${META} shrink-0 tabular-nums self-start pt-0.5`}>
                        {formatDashboardActivityTime(act.timestamp, language, t)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
            <FooterLink label={t('Все действия')} onClick={() => !editMode && onNavigate('activity_log')} />
          </div>
        );
      case 'by_object':
        return (
          <div className={`${PANEL} ${dashboardStaggerClass(staggerIndex, 2)}`}>
            <h2 className={`${TITLE} mb-2`}>{t('Оборудование по объектам')}</h2>
            <div className="space-y-3 flex-1 min-h-0 overflow-auto">
              {byObject.length === 0 ? (
                <p className={`text-sm ${META}`}>{t('Нет данных')}</p>
              ) : (
                byObject.map((obj, i) => (
                  <div key={obj.name} className="dashboard-legend-item" style={{ animationDelay: `${300 + i * 90}ms` }}>
                    <div className="flex justify-between text-sm mb-1.5 gap-2">
                      <span className="text-slate-700 truncate font-medium">{obj.name}</span>
                      <span className="font-bold text-slate-900 shrink-0 tabular-nums">{obj.count}</span>
                    </div>
                    <AnimatedBar percent={Math.round((obj.count / maxObjectCount) * 100)} delay={400 + i * 90} tall />
                  </div>
                ))
              )}
            </div>
            <FooterLink label={t('Смотреть все объекты')} onClick={() => !editMode && onNavigate('objects')} />
          </div>
        );
      case 'inventory':
        return (
          <InventoryDetailCard
            staggerIndex={staggerIndex}
            audits={audits}
            selectedAudit={selectedAudit}
            auditCard={auditCard}
            inventoryProgress={inventoryProgress}
            editMode={editMode}
            auditStatusTone={auditStatusTone}
            onAuditSelectionChange={handleAuditSelectionChange}
            onNavigate={onNavigate}
          />
        );
      case 'software_monitoring':
        return (
          <div className={`${PANEL} dash-widget-software ${dashboardStaggerClass(staggerIndex, 2)}`}>
            <div className="flex items-center justify-between gap-2 shrink-0">
              <h2 className={`${TITLE} leading-tight`}>{t('Мониторинг ПО')}</h2>
              {softwareMonitoring.rows.length === 0 && (
                <span className={`text-xs ${META} shrink-0`}>{t('Нет данных')}</span>
              )}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 shrink-0">
              <DynamicsStatBox compact label={t('Всего мест')} value={softwareMonitoring.totalSeats} />
              <DynamicsStatBox compact label={t('Выдано')} value={softwareMonitoring.assignedSeats} suffixClassName="text-emerald-600" />
              <DynamicsStatBox
                compact
                label={t('Не задействовано')}
                value={softwareMonitoring.unassignedSeats}
                suffixClassName="text-amber-600"
              />
              <DynamicsStatBox compact label={t('Всего программ')} value={softwareMonitoring.totalProducts} />
            </div>
            {softwareMonitoring.rows.length > 0 && (
              <div className="flex-1 min-h-0 overflow-auto">
                <div className={`grid grid-cols-[1fr_4.5em_5.5em_5.5em] gap-2 ${CAPTION} pb-1.5 border-b border-slate-100 sticky top-0 bg-white`}>
                  <span>{t('Программа')}</span>
                  <span className="text-right">{t('Всего')}</span>
                  <span className="text-right">{t('Выдано')}</span>
                  <span className="text-right">{t('Не задействовано')}</span>
                </div>
                {softwareMonitoring.rows.map((row, i) => (
                  <div
                    key={row.id}
                    className="dashboard-legend-item grid grid-cols-[1fr_4.5em_5.5em_5.5em] gap-2 items-center py-1.5 border-b border-slate-50 last:border-0"
                    style={{ animationDelay: `${280 + i * 70}ms` }}
                  >
                    <span className={`${BODY} truncate font-medium`}>{row.name}</span>
                    <span className="text-sm font-bold text-slate-900 text-right tabular-nums">{row.totalSeats}</span>
                    <span className="text-sm font-bold text-emerald-700 text-right tabular-nums">{row.assignedSeats}</span>
                    <span className="text-sm font-bold text-amber-700 text-right tabular-nums">{row.unassignedSeats}</span>
                  </div>
                ))}
              </div>
            )}
            <FooterLink label={t('Перейти к реестру ПО')} onClick={() => !editMode && onNavigate('software')} />
          </div>
        );
      default:
        return null;
    }
  };

  const renderWidget = (widgetId: string): React.ReactNode => {
    if (widgetId === 'warehouse:title') {
      return (
        <div className={`${CARD} dash-widget-strip-title px-4 py-2.5 flex flex-row items-center justify-between gap-3 h-full min-h-0`}>
          <h2 className={`${TITLE} leading-tight`}>{t('Оборудование на складе')}</h2>
          <button
            type="button"
            onClick={() => !editMode && onNavigate('warehouse')}
            className={`${LINK} shrink-0`}
          >
            {t('Перейти на склад')} <ArrowRight size={14} />
          </button>
        </div>
      );
    }

    if (widgetId.startsWith('stat:')) {
      const id = widgetId.slice(5) as StatCardId;
      const index = ['computers', 'employees', 'warehouse', 'network', 'printers', 'cameras', 'consumables', 'other'].indexOf(id);
      return renderStatCard(id, Math.max(0, index));
    }

    if (widgetId.startsWith('analytics:')) {
      const id = widgetId.slice(10) as AnalyticsWidgetId;
      const index = ['dynamics', 'status_chart', 'alerts'].indexOf(id);
      return renderAnalyticsWidget(id, Math.max(0, index));
    }

    if (widgetId.startsWith('detail:')) {
      const id = widgetId.slice(7) as DetailCardId;
      const index = ['network_summary', 'activities', 'by_object', 'inventory', 'software_monitoring'].indexOf(id);
      return renderDetailCard(id, Math.max(0, index));
    }

    if (widgetId.startsWith('warehouse:')) {
      const id = widgetId.slice(10) as WarehouseStripId;
      const item = warehouseStripById[id];
      if (!item) return null;
      const index = ['laptops', 'monitors', 'desktops', 'printers', 'switches', 'access_points'].indexOf(id);
      return (
        <WarehouseCategoryCard
          label={item.label}
          count={item.count}
          price={item.price}
          formatMoney={formatMoney}
          icon={item.icon}
          iconBox={item.iconBox}
          iconColor={item.iconColor}
          sparkColor={item.sparkColor}
          staggerIndex={Math.max(0, index)}
          chartsReady={chartsReady}
          reduceMotion={reduceMotion}
        />
      );
    }

    return null;
  };

  return (
    <div className="dashboard-page w-full max-w-[1600px] mx-auto">
      <DashboardGridLayout
        layout={gridItems}
        editMode={editMode}
        onLayoutChange={updateGridLayout}
        onRemoveWidget={editMode ? removeWidget : undefined}
      >
        {renderWidget}
      </DashboardGridLayout>

      <footer className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-4 pb-2 text-xs text-slate-400">
        <span>
          © {COPYRIGHT_YEAR} {t('Инвентаризация оборудования')}. {t('Все права защищены')}.
        </span>
        <span className="flex flex-wrap items-center gap-1">
          {t('Версия')} {APP_VERSION}
          <span className="mx-1">·</span>
          <button type="button" className="hover:text-blue-600 transition-colors">
            {t('Документация')}
          </button>
          <span>·</span>
          <button type="button" className="hover:text-blue-600 transition-colors">
            {t('Поддержка')}
          </button>
        </span>
      </footer>
    </div>
  );
}
