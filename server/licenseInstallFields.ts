/**
 * Server-install license fields: bound to the deployment (DB), not to a user session.
 * Non-admin saves must not overwrite these when the client omits them.
 */
import { evaluateLicenseFromState } from "./licenseCore.ts";
import { verifySignedLicenseKey } from "./licenseCrypto.ts";
import { hashLicenseString } from "./licenseKeyFormat.ts";

export const SERVER_INSTALL_STATUS_SUFFIX = "_server_install_status_integrity";

/** Signed install status — allows app access without exposing the license key to the client bundle. */
export function computeServerInstallStatusSig(
  mac: string,
  isActivated: boolean,
  isExpired: boolean,
  licenseType: string,
  expiresYear: number | null | undefined
): string {
  const payload = [
    mac,
    isActivated ? "1" : "0",
    isExpired ? "1" : "0",
    licenseType || "",
    expiresYear != null && !Number.isNaN(expiresYear) ? String(expiresYear) : "",
  ].join("|");
  return hashLicenseString(payload + SERVER_INSTALL_STATUS_SUFFIX);
}

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

const LICENSE_SECRET_READ_KEYS = ["license_key", "license_key_sig"] as const;

/** Public license status for Editor/Viewer — no secret key material. */
export function buildLicenseStatusForClient(data: Record<string, unknown>): Record<string, unknown> {
  const evaluation = evaluateLicenseFromState(data);
  const mac = typeof data.system_mac === "string" ? data.system_mac.trim() : "";
  const key = typeof data.license_key === "string" ? data.license_key.trim() : "";

  const summary: Record<string, unknown> = {
    license_is_activated: evaluation.isActivated,
    license_is_expired: evaluation.isExpired,
  };

  if (key && mac) {
    const decoded = verifySignedLicenseKey(key, mac);
    if (decoded) {
      summary.license_type = decoded.type;
      summary.license_expires_year = decoded.expiresYear;
      if (decoded.clientName) summary.license_client_name = decoded.clientName;
      if (decoded.clientEmail) summary.license_client_email = decoded.clientEmail;
      if (decoded.clientPhone) summary.license_client_phone = decoded.clientPhone;
    }
  } else if (!evaluation.isActivated) {
    summary.license_type = "trial";
  }

  const licenseType =
    typeof summary.license_type === "string" ? summary.license_type : "trial";
  const expiresYear =
    typeof summary.license_expires_year === "number" ? summary.license_expires_year : null;

  if (mac) {
    summary.license_status_sig = computeServerInstallStatusSig(
      mac,
      evaluation.isActivated,
      evaluation.isExpired,
      licenseType,
      expiresYear
    );
  }

  return summary;
}

export function redactLicenseSecretsForNonAdmin(
  payload: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  const out = { ...payload };
  for (const key of LICENSE_SECRET_READ_KEYS) {
    delete out[key];
  }
  return { ...out, ...buildLicenseStatusForClient(source) };
}
