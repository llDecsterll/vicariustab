/* Release */
/**
 * Sync product/server/licensePublicKey.ts from existing keyserver private PEM.
 * Does NOT regenerate keys — safe when licenses were already issued with current PEM.
 *
 * Run: node scripts/sync-license-public-from-pem.mjs
 * Private key stays in keyserver/ only (never commit).
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const productRoot = path.join(__dirname, "..");
const keyserverRoot = path.join(productRoot, "..", "keyserver");

const privatePath =
  process.env.LICENSE_ED25519_PRIVATE_KEY_PATH ||
  path.join(keyserverRoot, "data", "license_ed25519.pem");

if (!fs.existsSync(privatePath)) {
  console.error(`[sync-license-public] Missing private key: ${privatePath}`);
  console.error("Generate a new pair only if no licenses exist yet:");
  console.error("  node scripts/generate-license-keypair.mjs");
  process.exit(1);
}

const privatePem = fs.readFileSync(privatePath, "utf8");
const publicKey = crypto.createPublicKey(crypto.createPrivateKey(privatePem));
const spkiDer = publicKey.export({ type: "spki", format: "der" });
const publicRaw = spkiDer.subarray(spkiDer.length - 32);

const publicTsPath = path.join(productRoot, "server", "licensePublicKey.ts");
const ts = `/*
 * Ed25519 public key for Vicariustab license verification (auto-generated).
 * Private key: keyserver/data/license_ed25519.pem — never commit.
 */
export const LICENSE_ED25519_SPKI_DER_B64 = ${JSON.stringify(spkiDer.toString("base64"))};
export const LICENSE_ED25519_PUBLIC_RAW_B64 = ${JSON.stringify(publicRaw.toString("base64"))};
`;

fs.writeFileSync(publicTsPath, ts, "utf8");
console.log("[sync-license-public] Updated:", publicTsPath);
console.log("[sync-license-public] Private key unchanged:", privatePath);
