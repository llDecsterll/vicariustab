/*
 * Vicariustab license Ed25519 verification and signing (Node.js only).
 */
import crypto from "crypto";
import {
  LICENSE_ED25519_PUBLIC_RAW_B64,
  LICENSE_ED25519_SPKI_DER_B64,
} from "./licensePublicKey.ts";
import {
  buildLicensePayloadString,
  decodeLicensePayload,
  parseUtkinKeyParts,
  payloadMatchesMac,
  toLicenseDetails,
  utf8ToBase64,
  type ParsedLicensePayload,
} from "./licenseKeyFormat.ts";

export {
  hashLicenseString,
  LEGACY_LICENSE_SALT,
  buildLicensePayloadString,
  decodeLicensePayload,
  type ParsedLicensePayload,
} from "./licenseKeyFormat.ts";

function base64UrlToBuffer(value: string): Buffer {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + pad, "base64");
}

function bufferToBase64Url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

let cachedPublicKey: crypto.KeyObject | null = null;

function getEd25519PublicKey(): crypto.KeyObject {
  if (!cachedPublicKey) {
    cachedPublicKey = crypto.createPublicKey({
      key: Buffer.from(LICENSE_ED25519_SPKI_DER_B64, "base64"),
      format: "der",
      type: "spki",
    });
  }
  return cachedPublicKey;
}

export function verifyEd25519LicenseSignature(
  payloadBase64: string,
  signatureBase64Url: string
): boolean {
  try {
    const message = Buffer.from(payloadBase64, "utf8");
    const signature = base64UrlToBuffer(signatureBase64Url);
    return crypto.verify(null, message, getEd25519PublicKey(), signature);
  } catch {
    return false;
  }
}

export function signEd25519LicensePayload(
  payloadBase64: string,
  privateKeyPem: string
): string {
  const privateKey = crypto.createPrivateKey(privateKeyPem);
  const message = Buffer.from(payloadBase64, "utf8");
  const signature = crypto.sign(null, message, privateKey);
  return bufferToBase64Url(signature);
}

/** Accepts only Ed25519 v2 keys (UTKIN-{base64}.{signature}). */
export function verifySignedLicenseKey(
  key: string,
  macAddress: string
): ParsedLicensePayload | null {
  return verifySignedLicenseKeyWithPublicKey(key, macAddress, getEd25519PublicKey());
}

/** For tests or tooling when the signing keypair is not the product default. */
export function verifySignedLicenseKeyWithPublicKey(
  key: string,
  macAddress: string,
  publicKey: crypto.KeyObject
): ParsedLicensePayload | null {
  const parsed = parseUtkinKeyParts(key);
  if (!parsed) return null;

  const { base64Part, tailPart } = parsed;
  const decoded = decodeLicensePayload(base64Part);
  if (!decoded) return null;
  if (!payloadMatchesMac(decoded.macPart, macAddress)) return null;
  try {
    const message = Buffer.from(base64Part, "utf8");
    const signature = base64UrlToBuffer(tailPart);
    if (!crypto.verify(null, message, publicKey, signature)) return null;
  } catch {
    return null;
  }

  return toLicenseDetails(decoded);
}

export function issueSignedLicenseKey(
  payload: string,
  privateKeyPem: string
): string {
  const base64Data = utf8ToBase64(payload);
  const signature = signEd25519LicensePayload(base64Data, privateKeyPem);
  return `UTKIN-${base64Data}.${signature}`;
}

export function getEd25519PublicKeyRaw(): Uint8Array {
  return new Uint8Array(Buffer.from(LICENSE_ED25519_PUBLIC_RAW_B64, "base64"));
}
