/**
 * Server-install license fields: bound to the deployment (DB), not to a user session.
 * Non-admin saves must not overwrite these when the client omits them.
 */
export const SERVER_INSTALL_LICENSE_KEYS = [
  "license_key",
  "license_key_sig",
  "system_mac",
  "system_fingerprint",
  "trial_start",
  "trial_sig",
  "_ao_telemetry_pt",
  "_ao_telemetry_sig",
  "max_time",
  "_ao_telemetry_mt",
  "tamper_flag",
  "license_failures",
  "license_failures_sig",
  "license_lockout_until",
  "license_lockout_sig",
  "license_last_attempt",
] as const;

export function preserveServerInstallLicenseFields(
  incoming: Record<string, unknown>,
  existing: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  if (!existing || typeof existing !== "object") return incoming;
  const out = { ...incoming };
  for (const key of SERVER_INSTALL_LICENSE_KEYS) {
    const prev = existing[key];
    if (prev !== undefined && prev !== null && prev !== "") {
      out[key] = prev;
    }
  }
  return out;
}
