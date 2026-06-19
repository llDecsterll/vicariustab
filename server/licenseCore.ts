/*
 * Server-side license validation (mirrors client hashLicenseString / validateKey)
 */
export function hashLicenseString(text: string): string {
  const salt = [
    String.fromCharCode(85, 116, 107, 105, 110),
    String.fromCharCode(76, 105, 99, 101, 110, 115, 101, 83, 97, 108, 116),
    "_",
    "assetorbit",
    "@",
    "icloud.com",
    "_",
    "SecuredTokenKey_2026",
  ].join("");
  const str = text + salt;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(8, "0");
}

function base64ToUtf8(str: string): string {
  try {
    return Buffer.from(str, "base64").toString("utf8");
  } catch {
    return "";
  }
}

export interface DecodedKeyDetails {
  type: "annual" | "perpetual";
  expiresYear: number;
}

export function validateKeyForMac(key: string, macAddress: string): DecodedKeyDetails | null {
  if (!key || !macAddress) return null;
  const parts = key.trim().split("-");
  const currentMac = macAddress.replace(/:/g, "").toUpperCase().trim();

  if (parts.length === 4 && parts[0].toUpperCase() === "UTKIN") {
    const expiresYearStr = parts[1];
    const macPart = parts[2].toUpperCase();
    const hash = parts[3].toUpperCase();
    const cleanMacPart = macPart.replace(/:/g, "").toUpperCase().trim();
    if (cleanMacPart !== currentMac) return null;
    const correctHash = hashLicenseString(`${expiresYearStr}_${macPart}`);
    if (hash !== correctHash) return null;
    const expiresYear = parseInt(expiresYearStr, 10);
    return {
      type: expiresYear === 9999 ? "perpetual" : "annual",
      expiresYear: isNaN(expiresYear) ? 2027 : expiresYear,
    };
  }

  if (parts.length < 3 || parts[0].toUpperCase() !== "UTKIN") return null;

  const base64Part = parts.slice(1, parts.length - 1).join("-");
  const hashPart = parts[parts.length - 1].toUpperCase();
  if (hashLicenseString(base64Part) !== hashPart) return null;

  const normalizedBase64 = base64Part.replace(/-/g, "+").replace(/_/g, "/");
  const decodedPayload = base64ToUtf8(normalizedBase64);
  if (!decodedPayload) return null;

  const fields = decodedPayload.split("|");
  if (fields.length < 2) return null;

  const expiresYearStr = fields[0].trim();
  const macPart = fields[1].trim();
  const cleanMacPart = macPart.replace(/:/g, "").toUpperCase().trim();
  if (cleanMacPart !== currentMac) return null;

  const expiresYear = parseInt(expiresYearStr, 10);
  if (isNaN(expiresYear)) return null;

  return {
    type: expiresYear === 9999 ? "perpetual" : "annual",
    expiresYear,
  };
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

/** Allow save when activating a newly valid license key */
export function isLicenseActivationPayload(data: Record<string, unknown>): boolean {
  const mac = typeof data.system_mac === "string" ? data.system_mac.trim() : "";
  const key = typeof data.license_key === "string" ? data.license_key.trim() : "";
  if (!mac || !key) return false;
  const validation = validateKeyForMac(key, mac);
  if (!validation) return false;
  return new Date().getFullYear() <= validation.expiresYear;
}
