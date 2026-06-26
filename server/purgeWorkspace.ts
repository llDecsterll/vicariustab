/*
 * Purge all inventory data while preserving accounts, license and UI settings
 */

const WORKSPACE_SETTINGS_KEYS = [
  'workspaceName',
  'adminEmail',
  'publicUrl',
  'tabIcons',
  'panelLogo',
  'panelColor',
  'siteFavicon',
  'siteLogo',
  'sidebarBgColor',
  'sidebarOpacity',
  'documentHeader',
  'documentHeaderPresets',
  'users',
  'license_key',
  'license_key_sig',
  'system_mac',
  'system_fingerprint',
  'trial_start',
  'trial_sig',
  '_ao_telemetry_pt',
  '_ao_telemetry_sig',
  '_ao_telemetry_mt',
  '_ao_telemetry_tf',
  'max_time',
  'tamper_flag',
  'license_failures',
  'license_failures_sig',
  'license_lockout_until',
  'license_lockout_sig',
  'license_last_attempt',
] as const;

const DEFAULT_WAREHOUSES = [
  {
    id: 'wh-1',
    name: 'Основной склад ИТ',
    objectName: 'Главный офис',
    description: 'Основной склад для ИТ-оборудования компании',
  },
];

export function buildPurgedWorkspacePayload(
  current: Record<string, unknown>,
  actorName?: string
): Record<string, unknown> {
  const preserved: Record<string, unknown> = {};
  for (const key of WORKSPACE_SETTINGS_KEYS) {
    if (current[key] !== undefined) preserved[key] = current[key];
  }

  const activity = {
    id: `act-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
    timestamp: new Date().toISOString(),
    user: `${actorName || 'Администратор'} (Админ)`,
    action: 'Очистка базы данных',
    detail:
      'Удалены все данные инвентаризации (объекты, сотрудники, оборудование, склад, ПО, аудиты). Учётные записи, лицензия и настройки системы сохранены.',
    type: 'system',
  };

  return {
    ...preserved,
    objects: [],
    networkDevices: [],
    computers: [],
    employees: [],
    warehouseItems: [],
    softwareItems: [],
    audits: [],
    warehouseWriteOffs: [],
    warehouses: DEFAULT_WAREHOUSES,
    activities: [activity],
  };
}
