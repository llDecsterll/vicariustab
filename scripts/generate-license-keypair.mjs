/* Release */
/**
 * Generate Ed25519 license signing keypair.
 * Private key → keyserver/data/license_ed25519.pem (gitignored)
 * Public key  → product/server/licensePublicKey.ts
 *
 * Run once: node scripts/generate-license-keypair.mjs
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const productRoot = path.join(__dirname, "..");
const keyserverRoot = path.join(productRoot, "..", "keyserver");

const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
const spkiDer = publicKey.export({ type: "spki", format: "der" });
const privatePem = privateKey.export({ type: "pkcs8", format: "pem" });
const publicRaw = spkiDer.subarray(spkiDer.length - 32);

const privatePath = path.join(keyserverRoot, "data", "license_ed25519.pem");
const publicTsPath = path.join(productRoot, "server", "licensePublicKey.ts");

fs.mkdirSync(path.dirname(privatePath), { recursive: true });
fs.writeFileSync(privatePath, privatePem, { mode: 0o600 });

const ts = `/*
 * Ed25519 public key for Vicariustab license verification (auto-generated).
 * Private key: keyserver/data/license_ed25519.pem — never commit.
 */
export const LICENSE_ED25519_SPKI_DER_B64 = ${JSON.stringify(spkiDer.toString("base64"))};
export const LICENSE_ED25519_PUBLIC_RAW_B64 = ${JSON.stringify(publicRaw.toString("base64"))};
`;

fs.writeFileSync(publicTsPath, ts, "utf8");
console.log("[license-keypair] Public key written:", publicTsPath);
console.log("[license-keypair] Private key written:", privatePath);
