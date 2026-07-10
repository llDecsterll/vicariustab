/**
 * Server-install license field preservation (Editor save must not wipe activation).
 */
import test from "node:test";
import assert from "node:assert/strict";
import { preserveServerInstallLicenseFields, redactLicenseSecretsForNonAdmin, computeServerInstallStatusSig } from "../../server/licenseInstallFields.ts";
import { sanitizePayloadForClientWithRole } from "../../server/userCredentials.ts";

test("preserveServerInstallLicenseFields keeps license when Editor omits keys", () => {
  const existing = {
    license_key: "UTKIN-activated-key",
    license_key_sig: "sig-123",
    system_mac: "D4:BC:CD:27:D4:1D",
    system_fingerprint: "ABC123",
    computers: [{ id: "c1" }],
  };
  const incoming = {
    computers: [{ id: "c1", model: "updated" }],
    license_key: "",
    license_key_sig: "",
  };
  const merged = preserveServerInstallLicenseFields(incoming, existing);
  assert.equal(merged.license_key, "UTKIN-activated-key");
  assert.equal(merged.license_key_sig, "sig-123");
  assert.equal(merged.system_mac, "D4:BC:CD:27:D4:1D");
  assert.deepEqual(merged.computers, incoming.computers);
});

test("preserveServerInstallLicenseFields keeps key when incoming is blank", () => {
  const existing = { license_key: "UTKIN-old", system_mac: "AA:BB:CC:DD:EE:FF" };
  const incoming = { license_key: "", computers: [] };
  const merged = preserveServerInstallLicenseFields(incoming, existing);
  assert.equal(merged.license_key, "UTKIN-old");
});

test("redactLicenseSecretsForNonAdmin removes key and adds status summary", () => {
  const source = {
    license_key: "UTKIN-secret-key-value",
    license_key_sig: "sig-hidden",
    system_mac: "D4:BC:CD:27:D4:1D",
    trial_start: String(Date.now()),
    trial_sig: "valid-sig-not-checked-here",
  };
  const payload = { ...source, users: [] };
  const redacted = redactLicenseSecretsForNonAdmin(payload, source);
  assert.equal(redacted.license_key, undefined);
  assert.equal(redacted.license_key_sig, undefined);
  assert.equal(typeof redacted.license_is_activated, "boolean");
  assert.equal(typeof redacted.license_is_expired, "boolean");
  assert.equal(typeof redacted.license_status_sig, "string");
  assert.ok(redacted.license_status_sig.length > 0);
});

test("computeServerInstallStatusSig is deterministic for install status", () => {
  const sig = computeServerInstallStatusSig("AA:BB:CC:DD:EE:FF", true, false, "annual", 2027);
  assert.equal(sig, computeServerInstallStatusSig("AA:BB:CC:DD:EE:FF", true, false, "annual", 2027));
  assert.notEqual(sig, computeServerInstallStatusSig("AA:BB:CC:DD:EE:FF", false, false, "annual", 2027));
});

test("sanitizePayloadForClientWithRole keeps key for Admin only", () => {
  const data = {
    license_key: "UTKIN-admin-visible",
    license_key_sig: "sig",
    system_mac: "D4:BC:CD:27:D4:1D",
    users: [{ id: "u1", name: "Admin", role: "Admin", login: "admin", email: "a@t.local" }],
  };
  const adminView = sanitizePayloadForClientWithRole(data, "Admin", data);
  assert.equal(adminView?.license_key, "UTKIN-admin-visible");
  assert.equal(typeof adminView?.license_status_sig, "string");

  const editorView = sanitizePayloadForClientWithRole(data, "Editor", data);
  assert.equal(editorView?.license_key, undefined);
  assert.equal(editorView?.license_is_expired, true);

  const viewerView = sanitizePayloadForClientWithRole(data, "Viewer", data);
  assert.equal(viewerView?.license_key, undefined);
});
