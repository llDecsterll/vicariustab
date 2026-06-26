/*
 * License fields that must never be included in database backups (export/import).
 */
export const LICENSE_BLOCKED_DB_KEYS = [
  "license_key",
  "license_key_sig",
  "system_mac",
  "system_fingerprint",
  "trial_start",
  "trial_sig",
  "_ao_telemetry_pt",
  "_ao_telemetry_sig",
  "_ao_telemetry_mt",
  "_ao_telemetry_tf",
  "max_time",
  "tamper_flag",
  "license_failures",
  "license_failures_sig",
  "license_lockout_until",
  "license_lockout_sig",
  "license_last_attempt",
] as const;

export const LICENSE_BLOCKED_LOCAL_STORAGE_KEYS = [
  "it_license_key",
  "it_license_key_sig",
  "it_system_mac",
  "it_system_fingerprint",
  "it_trial_start",
  "it_trial_sig",
  "it_max_time",
  "it_tamper_flag",
  "it_license_failures",
  "it_license_failures_sig",
  "it_license_lockout_until",
  "it_license_lockout_sig",
  "it_license_last_attempt",
  "_ao_telemetry_pt",
  "_ao_telemetry_sig",
  "_ao_telemetry_mt",
  "_ao_telemetry_tf",
] as const;

const BLOCKED_KEY_SET = new Set<string>([
  ...LICENSE_BLOCKED_DB_KEYS,
  ...LICENSE_BLOCKED_LOCAL_STORAGE_KEYS,
]);

export function isBlockedBackupKey(key: string): boolean {
  return BLOCKED_KEY_SET.has(key);
}

export function stripLicenseFromServerData<T extends Record<string, unknown>>(data: T): T {
  const cleaned = { ...data };
  for (const key of LICENSE_BLOCKED_DB_KEYS) {
    delete cleaned[key];
  }
  return cleaned;
}

export function stripLicenseFromLocalBackupData(
  data: Record<string, string | null>
): Record<string, string | null> {
  const cleaned = { ...data };
  for (const key of BLOCKED_KEY_SET) {
    delete cleaned[key];
  }
  return cleaned;
}

export function assertBackupHasNoLicenseFields(data: Record<string, unknown>): void {
  for (const key of LICENSE_BLOCKED_DB_KEYS) {
    const value = data[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      throw new Error(`Backup compliance violation: field "${key}" must not be exported`);
    }
  }
}
