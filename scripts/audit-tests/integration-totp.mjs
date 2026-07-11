/**
 * Integration: TOTP 2FA setup + login flow (isolated user — does not mutate audit_admin).
 */
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { isAuditServerUp, resolveAuditSession, auditLogin, extractSessionTokenFromResponse } from "./auditAuth.mjs";

const BASE = process.env.AUDIT_BASE_URL || "http://127.0.0.1:8098";

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(input) {
  const normalized = input.toUpperCase().replace(/[^A-Z2-7]/g, "");
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
  return Buffer.from(bytes);
}

function totpCode(secretBase32) {
  const secret = base32Decode(secretBase32);
  const counter = Math.floor(Date.now() / 1000 / 30);
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

let serverUp = false;
let adminToken = "";
let token = "";
const totpLogin = `totp_audit_${Date.now()}`;
const totpPassword = "totp_audit_pass8";

async function seedTotpUser() {
  const dataRes = await fetch(`${BASE}/api/data`, {
    headers: { "X-Session-Token": adminToken },
  });
  assert.ok(dataRes.ok, `GET /api/data failed: ${dataRes.status}`);
  const data = await dataRes.json();
  const users = Array.isArray(data.users) ? [...data.users] : [];
  const idx = users.findIndex((u) => u.login === totpLogin);
  const row = {
    id: idx >= 0 ? users[idx].id : `totp-audit-${Date.now()}`,
    name: "TOTP Audit User",
    email: `${totpLogin}@audit.local`,
    role: "Editor",
    login: totpLogin,
    password: totpPassword,
    passwordSet: true,
    isCustom: true,
  };
  if (idx >= 0) users[idx] = { ...users[idx], ...row };
  else users.push(row);
  const payload = { ...data, users };
  delete payload._revision;
  const saveRes = await fetch(`${BASE}/api/data`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Session-Token": adminToken,
      "X-Data-Revision": String(data._revision),
    },
    body: JSON.stringify(payload),
  });
  assert.ok(saveRes.ok, `seed totp user failed: ${saveRes.status}`);
}

before(async () => {
  serverUp = await isAuditServerUp();
  if (!serverUp) return;

  adminToken = await resolveAuditSession();
  if (!adminToken) return;

  await seedTotpUser();
  token = await auditLogin(totpLogin, totpPassword, "totp-test");
});

describe("integration TOTP", () => {
  it("setup-begin returns secret when authenticated", async (t) => {
    if (!serverUp || !token) {
      t.skip("Server or session unavailable");
      return;
    }
    const res = await fetch(`${BASE}/api/auth/totp/setup-begin`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Session-Token": token },
    });
    const body = await res.json().catch(() => ({}));
    assert.equal(res.status, 200, `setup-begin failed: ${res.status} ${JSON.stringify(body)}`);
    assert.ok(body.secret, "missing secret");
    assert.ok(body.otpauthUrl?.includes("otpauth://"), "missing otpauthUrl");
  });

  it("full 2FA enable + login flow", async (t) => {
    if (!serverUp || !token) {
      t.skip("Server or session unavailable");
      return;
    }

    const begin = await fetch(`${BASE}/api/auth/totp/setup-begin`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Session-Token": token },
    });
    if (!begin.ok) {
      const err = await begin.json().catch(() => ({}));
      t.skip(`setup-begin failed: ${begin.status} ${JSON.stringify(err)}`);
      return;
    }
    const { secret } = await begin.json();
    const code = totpCode(secret);

    const confirm = await fetch(`${BASE}/api/auth/totp/setup-confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Session-Token": token },
      body: JSON.stringify({ code }),
    });
    const confirmBody = await confirm.json().catch(() => ({}));
    assert.equal(confirm.status, 200, `confirm failed: ${confirm.status} ${JSON.stringify(confirmBody)}`);

    const status = await fetch(`${BASE}/api/auth/totp/status`, {
      headers: { "X-Session-Token": token },
    });
    const statusBody = await status.json();
    assert.equal(statusBody.enabled, true, `status not enabled: ${JSON.stringify(statusBody)}`);

    const auth1 = await fetch(`${BASE}/api/auth/authenticate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        login: totpLogin,
        password: totpPassword,
        deviceFingerprint: "totp-test-2",
      }),
    });
    const auth1Body = await auth1.json();
    assert.equal(auth1.status, 200, `auth step1: ${auth1.status}`);
    assert.equal(auth1Body.requiresTwoFactor, true, `expected 2FA challenge: ${JSON.stringify(auth1Body)}`);
    assert.ok(auth1Body.challengeId);

    const code2 = totpCode(secret);
    const auth2 = await fetch(`${BASE}/api/auth/authenticate/totp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId: auth1Body.challengeId, code: code2 }),
    });
    const auth2Body = await auth2.json().catch(() => ({}));
    assert.equal(auth2.status, 200, `auth totp step failed: ${auth2.status} ${JSON.stringify(auth2Body)}`);
    assert.ok(
      extractSessionTokenFromResponse(auth2, auth2Body) || auth2Body.sessionId,
      "missing session after totp"
    );

    const disable = await fetch(`${BASE}/api/auth/totp/disable`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Session-Token": token },
      body: JSON.stringify({ code: totpCode(secret) }),
    });
    const disableBody = await disable.json().catch(() => ({}));
    assert.equal(disable.status, 200, `disable failed: ${disable.status} ${JSON.stringify(disableBody)}`);
  });
});
