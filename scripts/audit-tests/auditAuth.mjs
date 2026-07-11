/**
 * Shared audit login helper — skips users that require TOTP unless AUDIT_TOTP_SECRET is set.
 */
const BASE = process.env.AUDIT_BASE_URL || "http://127.0.0.1:8098";

export function extractSessionTokenFromResponse(res, body) {
  if (typeof res.headers.getSetCookie === "function") {
    for (const cookie of res.headers.getSetCookie()) {
      const match = /^vt_session=([^;]+)/.exec(cookie);
      if (match) return decodeURIComponent(match[1]);
    }
  }
  return body?.sessionToken || null;
}

export async function isAuditServerUp() {
  try {
    const res = await fetch(`${BASE}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function ensureAuditSetup() {
  const setup = await (await fetch(`${BASE}/api/auth/setup-status`)).json();
  if (!setup?.setupRequired) return;
  await fetch(`${BASE}/api/auth/setup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      login: "audit_admin",
      password: "audit_pass_8",
      email: "audit@test.local",
    }),
  });
}

export async function auditLogin(login, password, deviceFingerprint = "audit-integration") {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(`${BASE}/api/auth/authenticate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password, deviceFingerprint }),
    });
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
      continue;
    }
    if (!res.ok) return null;
    const data = await res.json();
    if (data.requiresTwoFactor) return null;
    return extractSessionTokenFromResponse(res, data);
  }
  return null;
}

export async function resolveAuditSession() {
  if (!(await isAuditServerUp())) return "";

  await ensureAuditSetup();

  const candidates = [
    [process.env.AUDIT_LOGIN, process.env.AUDIT_PASSWORD],
    ["audit_admin", "audit_pass_8"],
    ["verify_admin", "verify_pass_8"],
  ].filter(([login, password]) => login && password);

  for (const [login, password] of candidates) {
    const token = await auditLogin(login, password);
    if (token) return token;
  }
  return "";
}
