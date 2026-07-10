/**
 * Unit tests: TOTP engine (RFC 6238)
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  generateTotpSecret,
  buildOtpAuthUri,
  verifyTotpCode,
} from "../../server/totpEngine.ts";
import crypto from "node:crypto";

function hotpForTest(secretBase32, counter) {
  const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const normalized = secretBase32.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const bytes = [];
  for (const char of normalized) {
    const idx = BASE32.indexOf(char);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  const secret = Buffer.from(bytes);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac("sha1", secret).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 1_000_000).padStart(6, "0");
}

describe("totpEngine", () => {
  it("generates base32 secret", () => {
    const secret = generateTotpSecret();
    assert.ok(secret.length >= 16);
    assert.match(secret, /^[A-Z2-7]+$/);
  });

  it("builds otpauth URI", () => {
    const uri = buildOtpAuthUri("JBSWY3DPEHPK3PXP", "admin@test");
    assert.ok(uri.startsWith("otpauth://totp/"));
    assert.ok(uri.includes("secret=JBSWY3DPEHPK3PXP"));
    assert.ok(uri.includes("issuer=Vicariustab"));
  });

  it("verifies valid TOTP code for current window", () => {
    const secret = "JBSWY3DPEHPK3PXP";
    const counter = Math.floor(Date.now() / 1000 / 30);
    const code = hotpForTest(secret, counter);
    assert.equal(verifyTotpCode(secret, code), true);
  });

  it("rejects invalid TOTP code", () => {
    assert.equal(verifyTotpCode("JBSWY3DPEHPK3PXP", "000000"), false);
    assert.equal(verifyTotpCode("JBSWY3DPEHPK3PXP", "abc"), false);
  });
});
