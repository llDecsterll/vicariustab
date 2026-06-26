/*
 * Vicariustab license key parsing (Ed25519 v2 only for activation keys).
 * hashLicenseString is retained for REQ checksums and trial anti-tamper only.
 */

export const LEGACY_LICENSE_SALT = [
  String.fromCharCode(85, 116, 107, 105, 110),
  String.fromCharCode(76, 105, 99, 101, 110, 115, 101, 83, 97, 108, 116),
  "_",
  "assetorbit",
  "@",
  "icloud.com",
  "_",
  "SecuredTokenKey_2026",
].join("");

export function hashLicenseString(text: string): string {
  const str = text + LEGACY_LICENSE_SALT;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(8, "0");
}

function bytesToBinaryString(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += String.fromCharCode(bytes[i]);
  }
  return out;
}

function binaryStringToBytes(binary: string): Uint8Array {
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

export function base64ToUtf8(str: string): string {
  try {
    let binary: string;
    if (typeof atob === "function") {
      binary = atob(str);
    } else {
      binary = bytesToBinaryString(
        Uint8Array.from(globalThis.Buffer.from(str, "base64"))
      );
    }
    try {
      return decodeURIComponent(
        binary
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
    } catch {
      return binary;
    }
  } catch {
    return "";
  }
}

export function utf8ToBase64(str: string): string {
  const binary = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
    String.fromCharCode(parseInt(p1, 16))
  );
  if (typeof btoa === "function") {
    return btoa(binary);
  }
  return globalThis.Buffer.from(binaryStringToBytes(binary)).toString("base64");
}

export interface ParsedLicensePayload {
  expiresYear: number;
  macPart: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  type: "annual" | "perpetual";
}

export function parseUtkinKeyParts(key: string): {
  base64Part: string;
  tailPart: string;
} | null {
  if (!key) return null;
  const trimmed = key.trim();

  // v2 only: UTKIN-{base64_payload}.{base64url_signature}
  if (!trimmed.startsWith("UTKIN-") || !trimmed.includes(".")) return null;

  const rest = trimmed.slice("UTKIN-".length);
  const dotIdx = rest.lastIndexOf(".");
  if (dotIdx <= 0) return null;

  const base64Part = rest.slice(0, dotIdx);
  const tailPart = rest.slice(dotIdx + 1);
  if (!base64Part || !tailPart || tailPart.length < 32) return null;

  return { base64Part, tailPart };
}

export function decodeLicensePayload(
  base64Part: string
): Omit<ParsedLicensePayload, "type"> | null {
  const normalizedBase64 = base64Part.replace(/-/g, "+").replace(/_/g, "/");
  const decodedPayload = base64ToUtf8(normalizedBase64);
  if (!decodedPayload) return null;

  const fields = decodedPayload.split("|");
  if (fields.length < 2) return null;

  const expiresYear = parseInt(fields[0].trim(), 10);
  if (isNaN(expiresYear)) return null;

  return {
    expiresYear,
    macPart: fields[1].trim(),
    clientName: fields[2] || "",
    clientEmail: fields[3] || "",
    clientPhone: fields[4] || "",
  };
}

export function payloadMatchesMac(macPart: string, currentMac: string): boolean {
  const cleanMacPart = macPart.replace(/:/g, "").toUpperCase().trim();
  const cleanCurrent = currentMac.replace(/:/g, "").toUpperCase().trim();
  return cleanMacPart === cleanCurrent;
}

export function toLicenseDetails(
  decoded: Omit<ParsedLicensePayload, "type">
): ParsedLicensePayload {
  return {
    ...decoded,
    type: decoded.expiresYear === 9999 ? "perpetual" : "annual",
  };
}

export function buildLicensePayloadString(
  expiresYear: string,
  mac12: string,
  clientName: string,
  clientEmail: string,
  clientPhone: string
): string {
  return [
    expiresYear.toUpperCase().trim(),
    mac12.replace(/:/g, "").toUpperCase().trim(),
    (clientName || "Unknown Buyer").trim(),
    (clientEmail || "-").trim(),
    (clientPhone || "-").trim(),
  ].join("|");
}
