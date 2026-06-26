/*
 * Server-side license validation (Ed25519 v2 only).
 */
import { hashLicenseString } from "./licenseKeyFormat.ts";
import { verifySignedLicenseKey, type ParsedLicensePayload } from "./licenseCrypto.ts";

export { hashLicenseString } from "./licenseKeyFormat.ts";

export interface DecodedKeyDetails {
  type: "annual" | "perpetual";
  expiresYear: number;
}

function toDecoded(details: ParsedLicensePayload): DecodedKeyDetails {
  return { type: details.type, expiresYear: details.expiresYear };
}

export function validateKeyForMac(key: string, macAddress: string): DecodedKeyDetails | null {
  const result = verifySignedLicenseKey(key, macAddress);
  return result ? toDecoded(result) : null;
}

export interface LicenseEvaluation {
  isExpired: boolean;
  isActivated: boolean;
  reason?: string;
}

const TRIAL_MS = 30 * 24 * 60 * 60 * 1000;

function trialSignatureValid(start: string, sig: string): boolean {
  return sig === hashLicenseString(start + "_secured_trial_integrity");
}

export function evaluateLicenseFromState(data: Record<string, unknown> | null): LicenseEvaluation {
  if (!data || typeof data !== "object") {
    return { isExpired: false, isActivated: false };
  }

  const tamperFlag =
    data.tamper_flag === "true" ||
    data.tamper_flag === true ||
    data._ao_telemetry_tf === "true";

  const mac =
    typeof data.system_mac === "string" && data.system_mac.trim()
      ? data.system_mac.trim()
      : "";

  const licenseKey = typeof data.license_key === "string" ? data.license_key.trim() : "";
  if (licenseKey && mac) {
    const validation = validateKeyForMac(licenseKey, mac);
    if (validation) {
      const currentYear = new Date().getFullYear();
      const expired = currentYear > validation.expiresYear;
      return { isExpired: expired, isActivated: !expired, reason: expired ? "license_year" : undefined };
    }
  }

  const trialStartRaw = data.trial_start ?? data._ao_telemetry_pt;
  const trialSigRaw = data.trial_sig ?? data._ao_telemetry_sig;
  const trialStart = typeof trialStartRaw === "string" ? trialStartRaw : "";
  const trialSig = typeof trialSigRaw === "string" ? trialSigRaw : "";

  let trialStartTs = Date.now();
  if (trialStart && trialSig && trialSignatureValid(trialStart, trialSig)) {
    const parsed = parseInt(trialStart, 10);
    if (!isNaN(parsed)) trialStartTs = parsed;
  }

  const maxTimeRaw = data.max_time ?? data._ao_telemetry_mt;
  const maxTime = typeof maxTimeRaw === "string" ? parseInt(maxTimeRaw, 10) : 0;
  const now = Date.now();
  if (!isNaN(maxTime) && now < maxTime - 300000) {
    return { isExpired: true, isActivated: false, reason: "clock_tamper" };
  }

  const elapsed = now - trialStartTs;
  const trialExpired = elapsed > TRIAL_MS || tamperFlag;
  return {
    isExpired: trialExpired,
    isActivated: false,
    reason: tamperFlag ? "tamper" : trialExpired ? "trial" : undefined,
  };
}

export function isLicenseActivationPayload(data: Record<string, unknown>): boolean {
  const mac = typeof data.system_mac === "string" ? data.system_mac.trim() : "";
  const key = typeof data.license_key === "string" ? data.license_key.trim() : "";
  if (!mac || !key) return false;
  const validation = validateKeyForMac(key, mac);
  if (!validation) return false;
  return new Date().getFullYear() <= validation.expiresYear;
}
