/*
 * HttpOnly session cookie helpers
 */
import type { Request, Response } from "express";

export const SESSION_COOKIE_NAME = "vt_session";
const SESSION_MAX_AGE_SEC = 30 * 24 * 60 * 60;

export function parseCookieHeader(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  }
  return out;
}

export function readSessionCookie(req: Request): string {
  const cookies = parseCookieHeader(req.headers.cookie);
  return String(cookies[SESSION_COOKIE_NAME] || "").trim();
}

export function isSecureRequest(req: Request): boolean {
  if ((req as Request & { secure?: boolean }).secure) return true;
  const proto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
  return proto === "https";
}

export function setSessionCookie(res: Response, req: Request, token: string): void {
  const secure = isSecureRequest(req);
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Strict",
    `Max-Age=${SESSION_MAX_AGE_SEC}`,
  ];
  if (secure) parts.push("Secure");
  res.append("Set-Cookie", parts.join("; "));
}

export function clearSessionCookie(res: Response, req: Request): void {
  const secure = isSecureRequest(req);
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    "HttpOnly",
    "Path=/",
    "SameSite=Strict",
    "Max-Age=0",
  ];
  if (secure) parts.push("Secure");
  res.append("Set-Cookie", parts.join("; "));
}
