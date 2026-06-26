import test from "node:test";
import assert from "node:assert/strict";
import {
  assertBackupHasNoLicenseFields,
  isBlockedBackupKey,
  stripLicenseFromLocalBackupData,
  stripLicenseFromServerData,
} from "../../server/backupLicensePolicy.ts";

test("stripLicenseFromServerData removes activation fields", () => {
  const input = {
    it_computers: "[]",
    license_key: "UTKIN-stolen",
    license_key_sig: "sig",
    system_mac: "AA:BB:CC:DD:EE:FF",
    trial_start: "123",
  };
  const cleaned = stripLicenseFromServerData(input);
  assert.equal(cleaned.it_computers, "[]");
  assert.equal(cleaned.license_key, undefined);
  assert.equal(cleaned.system_mac, undefined);
});

test("assertBackupHasNoLicenseFields rejects leaked license key", () => {
  assert.throws(
    () => assertBackupHasNoLicenseFields({ license_key: "UTKIN-leak" }),
    /compliance violation/
  );
});

test("stripLicenseFromLocalBackupData removes local activation keys", () => {
  const cleaned = stripLicenseFromLocalBackupData({
    it_computers: "[]",
    it_license_key: "UTKIN-local",
    it_system_mac: "MAC",
  });
  assert.equal(cleaned.it_computers, "[]");
  assert.equal(cleaned.it_license_key, undefined);
});

test("isBlockedBackupKey covers server and local storage keys", () => {
  assert.equal(isBlockedBackupKey("license_key"), true);
  assert.equal(isBlockedBackupKey("it_license_key_sig"), true);
  assert.equal(isBlockedBackupKey("it_computers"), false);
});
