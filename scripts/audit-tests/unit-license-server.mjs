/**
 * Server-side license evaluation (ephemeral Ed25519 — no keyserver PEM on disk).
 */
import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  buildLicensePayloadString,
  issueSignedLicenseKey,
  verifySignedLicenseKeyWithPublicKey,
} from "../../server/licenseCrypto.ts";
import {
  evaluateLicenseFromState,
  isLicenseActivationPayload,
} from "../../server/licenseCore.ts";
import { hashLicenseString } from "../../server/licenseKeyFormat.ts";

const MAC = "D4:BC:CD:27:D4:1D";
const MAC_RAW = "D4BCCD27D41D";

function ephemeralKeypair() {
  const pair = crypto.generateKeyPairSync("ed25519");
  const privatePem = pair.privateKey.export({ type: "pkcs8", format: "pem" });
  return { privatePem, publicKey: pair.publicKey };
}

function issueTestKey(expiresYear, keypair = ephemeralKeypair()) {
  const { privatePem } = keypair;
  const payload = buildLicensePayloadString(String(expiresYear), MAC_RAW, "Audit", "audit@test.local", "-");
  return issueSignedLicenseKey(payload, privatePem);
}

test("issueSignedLicenseKey + verifySignedLicenseKeyWithPublicKey roundtrip", () => {
  const { privatePem, publicKey } = ephemeralKeypair();
  const key = issueTestKey(2099, { privatePem });
  const decoded = verifySignedLicenseKeyWithPublicKey(key, MAC_RAW, publicKey);
  assert.ok(decoded);
  assert.equal(decoded.expiresYear, 2099);
});

test("verifySignedLicenseKeyWithPublicKey rejects foreign MAC", () => {
  const { privatePem, publicKey } = ephemeralKeypair();
  const key = issueTestKey(2099, { privatePem });
  assert.equal(verifySignedLicenseKeyWithPublicKey(key, "AABBCCDDEEFF", publicKey), null);
});

test("evaluateLicenseFromState — trial without key", () => {
  const start = String(Date.now());
  const sig = hashLicenseString(start + "_secured_trial_integrity");
  const ev = evaluateLicenseFromState({ trial_start: start, trial_sig: sig });
  assert.equal(ev.isActivated, false);
  assert.equal(ev.isExpired, false);
});

test("evaluateLicenseFromState — tamper flag blocks trial", () => {
  const start = String(Date.now());
  const sig = hashLicenseString(start + "_secured_trial_integrity");
  const ev = evaluateLicenseFromState({ trial_start: start, trial_sig: sig, tamper_flag: "true" });
  assert.equal(ev.isExpired, true);
  assert.equal(ev.reason, "tamper");
});

test("evaluateLicenseFromState — invalid key falls back to trial", () => {
  const start = String(Date.now());
  const sig = hashLicenseString(start + "_secured_trial_integrity");
  const ev = evaluateLicenseFromState({
    license_key: "UTKIN-not-a-real-key",
    system_mac: MAC,
    trial_start: start,
    trial_sig: sig,
  });
  assert.equal(ev.isActivated, false);
});

test("isLicenseActivationPayload rejects mismatched MAC", () => {
  const { privatePem } = ephemeralKeypair();
  const key = issueTestKey(2099, { privatePem });
  assert.equal(isLicenseActivationPayload({ license_key: key, system_mac: "AA:BB:CC:DD:EE:FF" }), false);
});

test("evaluateLicenseFromState — empty state", () => {
  const ev = evaluateLicenseFromState(null);
  assert.equal(ev.isActivated, false);
  assert.equal(ev.isExpired, false);
});
