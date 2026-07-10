/**
 * Integration: TOTP 2FA setup + login flow
 */
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

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
let token = "";
const login = `totp_test_${Date.now()}`;
const password = "totp_pass_8xx";
let sessionLogin = login;
let sessionPassword = password;

before(async () => {
  try {
    const health = await fetch(`${BASE}/api/health`);
    serverUp = health.ok;
  } catch {
    serverUp = false;
  }
  if (!serverUp) return;

  const setup = await (await fetch(`${BASE}/api/auth/setup-status`)).json();
  if (setup.setupRequired) {
    await fetch(`${BASE}/api/auth/setup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password, email: `${login}@test.local` }),
    });
    sessionLogin = login;
    sessionPassword = password;
  } else {
    // create user via data API if admin exists
    for (const [l, p] of [
      [process.env.AUDIT_LOGIN, process.env.AUDIT_PASSWORD],
      ["audit_admin", "audit_pass_8"],
      ["verify_admin", "verify_pass_8"],
    ]) {
      if (!l || !p) continue;
      const auth = await fetch(`${BASE}/api/auth/authenticate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: l, password: p, deviceFingerprint: "totp-test" }),
      });
      if (auth.ok) {
        token = (await auth.json()).sessionToken;
        sessionLogin = l;
        sessionPassword = p;
        break;
      }
    }
  }

  if (!token) {
    const auth = await fetch(`${BASE}/api/auth/authenticate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password, deviceFingerprint: "totp-test" }),
    });
    if (auth.ok) {
      token = (await auth.json()).sessionToken;
      sessionLogin = login;
      sessionPassword = password;
    }
  }
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

    // get login from session user
    const me = await fetch(`${BASE}/api/data`, { headers: { "X-Session-Token": token } });
    const data = await me.json();
    const users = data.users || [];
    const sessionUser = users.find((u) => u.twoFactorEnabled);
    assert.ok(sessionUser, "no user with twoFactorEnabled in client data");

    const userLogin = sessionUser.login || sessionUser.email;
    const auth1 = await fetch(`${BASE}/api/auth/authenticate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        login: userLogin,
        password: sessionPassword,
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
    assert.ok(auth2Body.sessionToken, "missing session after totp");

    // cleanup: disable 2FA
    await fetch(`${BASE}/api/auth/totp/disable`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Session-Token": token },
      body: JSON.stringify({ code: code2 }),
    });
  });
});
