/**
 * Server-install license field preservation (Editor save must not wipe activation).
 */
import test from "node:test";
import assert from "node:assert/strict";
import { preserveServerInstallLicenseFields } from "../../server/licenseInstallFields.ts";

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
