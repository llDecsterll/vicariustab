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
  DashboardSections,
  DashboardDraggableWidget,
  useDashboardLayout,
} from './DashboardLayoutContext';
import {
  analyticsWidgetColClass,
  type AnalyticsWidgetId,
  type DetailCardId,
  type StatCardId,
  type WarehouseStripId,
} from '../utils/dashboardLayout';

const CARD = 'bg-white rounded-2xl border border-slate-100 shadow-sm';
const TITLE = 'font-bold text-sm text-slate-900';
const MUTED = 'text-slate-500';
const LINK = 'text-blue-600 text-[11px] font-semibold flex items-center gap-1 hover:text-blue-700 transition-colors';

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

function FooterLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`${LINK} mt-4`}>
      {label} <ArrowRight size={12} />
    </button>
  );
}

function DynamicsStatBox({
  label,
  value,
  suffix,
  suffixClassName = 'text-slate-400',
}: {
  label: string;
  value: number;
  suffix?: React.ReactNode;
  suffixClassName?: string;
}) {
  const displayed = useAnimatedNumber(value, 850, 0);

  return (
    <div className="rounded-xl border border-slate-100 bg-white px-3.5 py-3 min-h-[74px] flex flex-col justify-between">
      <p className={`text-[11px] font-medium ${MUTED} leading-none`}>{label}</p>
      <div className="flex items-end justify-between gap-2 mt-3">
        <span className="text-[22px] font-bold text-slate-900 tabular-nums leading-none">{displayed}</span>
        {suffix != null && suffix !== '' && (
          <span className={`text-[11px] font-medium tabular-nums pb-0.5 shrink-0 text-right ${suffixClassName}`}>
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
}: {
  label: string;
  numericValue: number;
  subDetail?: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
  iconBg: string;
  staggerIndex?: number;
}) {
  const displayed = useAnimatedNumber(numericValue, 850, staggerIndex * 50);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${CARD} p-3.5 flex flex-col text-left hover:shadow-md hover:border-blue-200 transition-all group min-h-[104px] ${dashboardStaggerClass(staggerIndex)}`}
    >
      <div className="flex items-start gap-2.5 mb-2">
        <div className={`p-2 rounded-xl shrink-0 transition-transform duration-300 group-hover:scale-105 ${iconBg}`}>
          {icon}
        </div>
        <span className={`text-[11px] font-semibold ${MUTED} leading-tight pt-0.5`}>{label}</span>
      </div>
      <div className="text-[26px] font-bold text-slate-900 leading-none tabular-nums pl-0.5">{displayed}</div>
      {subDetail && <div className={`text-[10px] ${MUTED} mt-2 leading-relaxed`}>{subDetail}</div>}
    </button>
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
      className="dashboard-legend-item flex gap-2.5 min-w-0"
      style={{ animationDelay: `${400 + rowIndex * 120}ms` }}
    >
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
        style={{ backgroundColor: color }}
      />
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-slate-800 leading-snug">{t(name)}</p>
        <p className="text-[10px] text-slate-400 tabular-nums mt-0.5">
          {animatedPct}% ({value})
        </p>
      </div>
    </div>
  );
};

function CircularProgress({ percent, size = 'md' }: { percent: number; size?: 'md' | 'lg' }) {
  const { t } = useTranslation();
  const animated = useAnimatedNumber(percent, 1200, 200);
  const large = size === 'lg';
  const dim = large ? 152 : 100;
  const r = large ? 58 : 38;
  const stroke = large ? 9 : 7;
  const c = 2 * Math.PI * r;
  const offset = c - (animated / 100) * c;
  const center = dim / 2;

  return (
    <div className="relative shrink-0" style={{ width: dim, height: dim }}>
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
        <span className={`${large ? 'text-3xl' : 'text-xl'} font-bold text-slate-900 tabular-nums leading-none`}>
          {animated}%
        </span>
        <span className={`${large ? 'text-xs mt-1' : 'text-[9px] mt-0.5'} text-slate-500`}>{t('Прогресс')}</span>
      </div>
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
  const delay = 420 + staggerIndex * 70;
  const animatedCount = useAnimatedNumber(count, 820, delay);
  const animatedPrice = useAnimatedNumber(price, 920, delay + 90);
  const sparkData = useMemo(() => buildSparkline(Math.max(count, 1)), [count]);
  const sparkMotion = fastChartMotionProps(reduceMotion);
  const gradientId = `wh-spark-${staggerIndex}`;

  return (
    <div
      className={`rounded-xl border border-slate-100 bg-slate-50/60 p-3 flex flex-col gap-2 group transition-all duration-300 hover:shadow-md hover:border-blue-200/80 hover:bg-white hover:-translate-y-0.5 ${dashboardStaggerClass(staggerIndex, 9)}`}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 dashboard-icon-pop transition-transform duration-300 group-hover:scale-110 ${iconBox} ${iconColor}`}
          style={{ animationDelay: `${delay + 100}ms` }}
        >
          <Icon size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <p className={`text-[10px] font-medium ${MUTED} leading-none`}>{label}</p>
          <p className="text-lg font-bold text-slate-900 leading-tight tabular-nums mt-1">
            {animatedCount} <span className="text-[11px] font-semibold text-slate-500">шт.</span>
          </p>
          <p className="text-[11px] font-semibold text-blue-600 mt-0.5 tabular-nums transition-colors duration-300 group-hover:text-blue-700">
            {formatMoney(animatedPrice)}
          </p>
        </div>
      </div>
      <div
        className="h-7 -mx-0.5 dashboard-spark-reveal"
        style={{ animationDelay: `${delay + 180}ms` }}
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
  warehouses = [],
  activities,
  audits,
  onNavigate,
}: DashboardViewProps) {
  const { t, language } = useTranslation();
  const { layout, editMode } = useDashboardLayout();
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
  const activeStatusSlices = useMemo(
    () => statusSlices.filter((s) => s.value > 0),
    [statusSlices]
  );
  const statusTotal = statusSlices.reduce((s, x) => s + x.value, 0);
  const animatedStatusTotal = useAnimatedNumber(statusTotal, 360, 0);

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
          />
        );
      case 'warehouse':
        return (
          <StatCard
            label={t('Оборудование на складе')}
            numericValue={warehouseCount}
            subDetail={
              <span>
                {t('На сумму')}: <strong className="text-slate-600 font-semibold">{formatMoney(warehouseCostSum)}</strong>
              </span>
            }
            icon={<Warehouse size={18} />}
            iconBg="bg-emerald-50 text-emerald-600"
            onClick={() => !editMode && onNavigate('warehouse')}
            staggerIndex={staggerIndex}
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
          <div className={`${CARD} p-5 dashboard-chart-glow flex flex-col ${dashboardStaggerClass(staggerIndex, 1)}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={TITLE}>{t('Динамика оборудования')}</h2>
              <select
                value={dynamicsPeriod}
                onChange={(e) => setDynamicsPeriod(e.target.value as DynamicsPeriod)}
                className="text-[10px] font-medium text-slate-600 bg-slate-50 pl-2.5 pr-7 py-1 rounded-lg border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 cursor-pointer appearance-none bg-[length:10px] bg-[right_8px_center] bg-no-repeat"
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
            <div className="h-[190px]">
              {chartsReady && (
                <ResponsiveContainer key={dynamicsPeriod} width="100%" height="100%">
                  <ComposedChart data={dynamicsData} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dashDynamicsFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.22} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: chartTick }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: chartTick }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                    <Tooltip contentStyle={chartTooltip} labelFormatter={(l) => `${t('Месяц')}: ${l}`} cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Area type="monotone" dataKey="count" fill="url(#dashDynamicsFill)" stroke="none" tooltipType="none" {...motion} animationBegin={150} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: lineDotFill, stroke: '#3b82f6', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                      name={t('Добавлено')}
                      {...motion}
                      animationBegin={200}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-slate-100">
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
          <div className={`${CARD} p-4 flex flex-col ${dashboardStaggerClass(staggerIndex, 1)}`}>
            <h2 className={`${TITLE} mb-3`}>{t('Статусы оборудования')}</h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 flex-1 min-h-[160px] sm:min-h-[190px]">
              <div className="relative h-[140px] w-[140px] sm:h-[190px] sm:w-[190px] shrink-0">
                {activeStatusSlices.length > 0 && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <Pie
                        data={activeStatusSlices}
                        cx="50%"
                        cy="50%"
                        innerRadius="52%"
                        outerRadius="88%"
                        paddingAngle={2}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                        stroke="none"
                        {...statusMotion}
                        animationBegin={0}
                      >
                        {activeStatusSlices.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={chartTooltip} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[28px] font-bold text-slate-900 tabular-nums leading-none">{animatedStatusTotal}</span>
                  <span className={`text-[10px] ${MUTED} mt-0.5`}>{t('Всего')}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5 w-full sm:w-auto max-w-sm sm:max-w-none">
                {statusSlices.map((s, i) => (
                  <StatusLegendRow key={s.name} name={s.name} color={s.color} value={s.value} total={statusTotal} rowIndex={i} />
                ))}
              </div>
            </div>
            <div className={`flex items-center gap-1.5 text-[10px] ${MUTED} mt-3 pt-2.5 border-t border-slate-100`}>
              <span>
                {t('Последнее обновление')}: {t('сегодня')}, {lastUpdated}
              </span>
              <RefreshCw size={11} className="text-slate-400 shrink-0" />
            </div>
          </div>
        );
      case 'alerts':
        return (
          <div className={`${CARD} p-5 flex flex-col ${dashboardStaggerClass(staggerIndex, 1)}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={TITLE}>{t('Требуют внимания')}</h2>
              {alerts.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center">
                  {alerts.length}
                </span>
              )}
            </div>
            <div className="space-y-2 flex-1">
              {alerts.length === 0 ? (
                <p className={`text-xs ${MUTED} text-center py-10`}>{t('Нет срочных уведомлений')}</p>
              ) : (
                alerts.slice(0, 2).map((a, i) => {
                  const localized = translateDashboardAlert(a, t);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => !editMode && onNavigate(a.tab)}
                      className={`dashboard-rise w-full text-left p-3 rounded-xl border text-xs transition-colors ${
                        a.tone === 'danger'
                          ? 'bg-rose-50 border-rose-100 text-rose-800'
                          : 'bg-amber-50 border-amber-100 text-amber-900'
                      }`}
                      style={{ animationDelay: `${200 + i * 80}ms` }}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className={`p-1.5 rounded-lg shrink-0 ${a.tone === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                          <AlertTriangle size={14} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold leading-snug text-slate-900">{localized.title}</p>
                          <p className="text-[11px] text-slate-600 mt-0.5">{localized.subtitle}</p>
                          {localized.detail && <p className={`text-[10px] ${MUTED} mt-0.5`}>{localized.detail}</p>}
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
          <div className={`${CARD} p-5 flex flex-col ${dashboardStaggerClass(staggerIndex, 2)}`}>
            <h2 className={`${TITLE} mb-4`}>{t('Сетевое оборудование')}</h2>
            {networkSummary.length === 0 ? (
              <p className={`text-xs ${MUTED}`}>{t('Нет данных')}</p>
            ) : (
              <div className="space-y-1 flex-1">
                <div className="grid grid-cols-[1fr_52px_80px] gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400 pb-2 border-b border-slate-100">
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
                    <span className="text-[12px] text-slate-700 truncate">{t(row.type)}</span>
                    <span className="text-[12px] font-bold text-slate-900 text-right tabular-nums">{row.count}</span>
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
          <div className={`${CARD} p-5 flex flex-col ${dashboardStaggerClass(staggerIndex, 2)}`}>
            <h2 className={`${TITLE} mb-4`}>{t('Последние действия')}</h2>
            <div className="space-y-0 flex-1">
              {recentActivities.length === 0 ? (
                <p className={`text-xs ${MUTED}`}>{t('Журнал пуст')}</p>
              ) : (
                recentActivities.map((act, i) => {
                  const { icon: Icon, box } = pickActivityStyle(act.action, act.detail);
                  const actionLabel = translateActivityAction(act.action, t);
                  const detailLabel = translateActivityDetail(act.detail, t);
                  return (
                    <div
                      key={act.id}
                      className="dashboard-legend-item flex gap-3 py-3 border-b border-slate-50 last:border-0"
                      style={{ animationDelay: `${250 + i * 70}ms` }}
                    >
                      <span className={`p-2 rounded-xl h-fit shrink-0 ${box}`}>
                        <Icon size={14} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-semibold text-slate-800 leading-snug">
                          {actionLabel}
                          {detailLabel ? `. ${detailLabel}` : ''}
                        </p>
                      </div>
                      <span className={`text-[10px] ${MUTED} shrink-0 tabular-nums self-start pt-0.5`}>
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
          <div className={`${CARD} p-5 flex flex-col ${dashboardStaggerClass(staggerIndex, 2)}`}>
            <h2 className={`${TITLE} mb-4`}>{t('Оборудование по объектам')}</h2>
            <div className="space-y-3 flex-1">
              {byObject.length === 0 ? (
                <p className={`text-xs ${MUTED}`}>{t('Нет данных')}</p>
              ) : (
                byObject.map((obj, i) => (
                  <div key={obj.name} className="dashboard-legend-item" style={{ animationDelay: `${300 + i * 90}ms` }}>
                    <div className="flex justify-between text-[12px] mb-1.5 gap-2">
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
          <div className={`${CARD} p-6 sm:p-8 flex flex-col items-center text-center min-h-[300px] ${dashboardStaggerClass(staggerIndex, 2)}`}>
            <div className="w-full max-w-[280px] space-y-3 mb-4">
              <h2 className={`${TITLE} text-center`}>{t('Инвентаризация')}</h2>
              {audits.length > 0 ? (
                <select
                  value={selectedAudit?.id ?? ''}
                  onChange={(e) => handleAuditSelectionChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                >
                  {audits.map((audit) => (
                    <option key={audit.id} value={audit.id}>
                      {audit.title} ({audit.date})
                    </option>
                  ))}
                </select>
              ) : (
                <p className={`text-xs ${MUTED}`}>{t('Нет запланированных инвентаризаций')}</p>
              )}
              {selectedAudit && (
                <div className="flex flex-col items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${auditStatusTone(selectedAudit.status)}`}
                  >
                    {t(selectedAudit.status)}
                  </span>
                  {auditCard.objectLabel && (
                    <p className="text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-1 rounded-lg">
                      {t('Объект')}: {auditCard.objectLabel}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col items-center justify-center gap-5 sm:gap-6 flex-1 w-full">
              <CircularProgress percent={inventoryProgress.percent} size="lg" />
              <div className="space-y-2.5 text-sm text-slate-700 w-full max-w-[260px] text-left">
                <p>
                  {t('Проверено')}:{' '}
                  <strong className="text-slate-900 tabular-nums text-base">
                    {inventoryProgress.checked}/{inventoryProgress.total}
                  </strong>
                </p>
                <p>
                  {t('Осталось')}:{' '}
                  <strong className="text-slate-900 tabular-nums text-base">
                    {inventoryProgress.remaining} {t('позиций')}
                  </strong>
                </p>
                <p>
                  {t('Объектов')}:{' '}
                  <strong className="text-slate-900 tabular-nums text-base">
                    {inventoryProgress.objectsDone} {t('из')} {inventoryProgress.objectsTotal}
                  </strong>
                </p>
                {selectedAudit && (
                  <div className="pt-2 mt-1 border-t border-slate-100 space-y-2 text-[11px]">
                    <p>
                      <span className="text-slate-500 font-semibold">{t('Кто проводит:')}</span>{' '}
                      <span className="text-slate-800 font-medium">{auditCard.conductorUser || t('Не указан')}</span>
                    </p>
                    <p>
                      <span className="text-slate-500 font-semibold">{t('Кто принимает:')}</span>{' '}
                      <span className="text-slate-800 font-medium">{auditCard.controllerUser || t('Не указан')}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="w-full flex justify-center mt-6">
              <FooterLink label={t('Перейти к инвентаризации')} onClick={() => !editMode && onNavigate('inventory')} />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 max-w-[1600px]">
      <DashboardSections>
        {(sectionId) => {
          switch (sectionId) {
            case 'stat_cards':
              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3" key={`stats-${layout.statCards.join('-')}`}>
                  {layout.statCards.map((id, i) => (
                    <React.Fragment key={id}>
                      <DashboardDraggableWidget scope="stat" blockId={id} className="h-full">
                        {renderStatCard(id, i)}
                      </DashboardDraggableWidget>
                    </React.Fragment>
                  ))}
                </div>
              );
            case 'analytics_row':
              return (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4" key={`analytics-${layout.analytics.join('-')}`}>
                  {layout.analytics.map((id, i) => (
                    <React.Fragment key={id}>
                      <DashboardDraggableWidget
                        scope="analytics"
                        blockId={id}
                        className={`${analyticsWidgetColClass(id)} h-full`}
                      >
                        {renderAnalyticsWidget(id, i)}
                      </DashboardDraggableWidget>
                    </React.Fragment>
                  ))}
                </div>
              );
            case 'details_row':
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4" key={`details-${layout.detailCards.join('-')}`}>
                  {layout.detailCards.map((id, i) => (
                    <React.Fragment key={id}>
                      <DashboardDraggableWidget scope="detail" blockId={id} className="h-full">
                        {renderDetailCard(id, i)}
                      </DashboardDraggableWidget>
                    </React.Fragment>
                  ))}
                </div>
              );
            case 'warehouse_strip':
              return (
                <div className={`${CARD} p-5 dashboard-chart-glow ${dashboardStaggerClass(0, 8)}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <h2 className="font-bold text-[15px] text-slate-900">{t('Оборудование на складе')}</h2>
                    <button
                      type="button"
                      onClick={() => !editMode && onNavigate('warehouse')}
                      className={`${LINK} text-sm self-start sm:self-auto`}
                    >
                      {t('Перейти на склад')} <ArrowRight size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3" key={`warehouse-${layout.warehouseStrip.join('-')}`}>
                    {layout.warehouseStrip.map((id, i) => {
                      const item = warehouseStripById[id];
                      return (
                        <React.Fragment key={id}>
                          <DashboardDraggableWidget scope="warehouse" blockId={id} className="h-full">
                            <WarehouseCategoryCard
                              label={item.label}
                              count={item.count}
                              price={item.price}
                              formatMoney={formatMoney}
                              icon={item.icon}
                              iconBox={item.iconBox}
                              iconColor={item.iconColor}
                              sparkColor={item.sparkColor}
                              staggerIndex={i}
                              chartsReady={chartsReady}
                              reduceMotion={reduceMotion}
                            />
                          </DashboardDraggableWidget>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              );
            default:
              return null;
          }
        }}
      </DashboardSections>

      <footer className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1 pb-2 text-[11px] text-slate-400">
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
