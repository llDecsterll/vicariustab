/*
 * Browser-side Ed25519 license signature verification (v2 keys only).
 */
import * as ed from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha512";
import { LICENSE_ED25519_PUBLIC_RAW_B64 } from "../../server/licensePublicKey.ts";
import {
  decodeLicensePayload,
  parseUtkinKeyParts,
  payloadMatchesMac,
  toLicenseDetails,
  type ParsedLicensePayload,
} from "../../server/licenseKeyFormat.ts";

ed.etc.sha512Sync = (...messages: Uint8Array[]) =>
  sha512(ed.etc.concatBytes(...messages));

const PUBLIC_KEY_RAW = Uint8Array.from(
  atob(LICENSE_ED25519_PUBLIC_RAW_B64),
  (c) => c.charCodeAt(0)
);

export function verifyEd25519LicenseSignatureClient(
  payloadBase64: string,
  signatureBase64Url: string
): boolean {
  try {
    const normalized = signatureBase64Url.replace(/-/g, "+").replace(/_/g, "/");
    const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
    const sig = Uint8Array.from(atob(normalized + pad), (c) => c.charCodeAt(0));
    const message = new TextEncoder().encode(payloadBase64);
    return ed.verify(sig, message, PUBLIC_KEY_RAW);
  } catch {
    return false;
  }
}

/** Accepts only Ed25519 v2 keys (UTKIN-{base64}.{signature}). */
export function verifySignedLicenseKeyClient(
  key: string,
  macAddress: string
): ParsedLicensePayload | null {
  const parsed = parseUtkinKeyParts(key);
  if (!parsed) return null;

  const { base64Part, tailPart } = parsed;
  const decoded = decodeLicensePayload(base64Part);
  if (!decoded) return null;
  if (!payloadMatchesMac(decoded.macPart, macAddress)) return null;
  if (!verifyEd25519LicenseSignatureClient(base64Part, tailPart)) return null;

  return toLicenseDetails(decoded);
}

export type { ParsedLicensePayload };
