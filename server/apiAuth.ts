/*
 * API authentication middleware and credential verification
 */
import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";
import { resolveSessionFromToken, type UserSessionRecord } from "./sessionEngine.ts";
import { evaluateLicenseFromState, isLicenseActivationPayload } from "./licenseCore.ts";
import { findUserByLogin, loadApplicationData, type StoredUser } from "./dataStore.ts";
import { verifyPassword, isPasswordHash } from "./passwordHash.ts";

export interface AuthedRequest extends Request {
  authSession?: UserSessionRecord;
}

export function readSessionToken(req: Request): string {
  const header = String(req.headers["x-session-token"] || "").trim();
  if (header) return header;
  const auth = String(req.headers.authorization || "");
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return "";
}

export function secureCompare(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export function verifyUserPassword(user: StoredUser, password: string): boolean {
  if (user.isBlocked) return false;
  const given = password.trim();
  if (!given) return false;

  if (user.passwordHash && isPasswordHash(user.passwordHash)) {
    return verifyPassword(given, user.passwordHash);
  }

  // Legacy plaintext (migrate on next save)
  if (user.password) {
    return secureCompare(user.password.toLowerCase(), given.toLowerCase());
  }

  return false;
}

export async function verifyCredentials(
  login: string,
  password: string
): Promise<StoredUser | null> {
  const user = await findUserByLogin(login);
  if (!user) return null;
  if (!verifyUserPassword(user, password)) return null;
  return user;
}

const PUBLIC_API = new Set<string>([
  "POST:/api/auth/authenticate",
  "GET:/api/auth/setup-status",
  "POST:/api/auth/setup",
]);

export function isPublicApiRoute(method: string, originalUrl: string): boolean {
  const path = originalUrl.split("?")[0];
  return PUBLIC_API.has(`${method.toUpperCase()}:${path}`);
}

export function requireApiAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (isPublicApiRoute(req.method, req.originalUrl)) {
    next();
    return;
  }

  const token = readSessionToken(req);
  const session = resolveSessionFromToken(token);
  if (!session) {
    res.status(401).json({ error: "Unauthorized", code: "AUTH_REQUIRED" });
    return;
  }
  req.authSession = session;
  next();
}

export function requireWriteRole(req: AuthedRequest, res: Response, next: NextFunction): void {
  const role = req.authSession?.userRole;
  if (role !== "Admin" && role !== "Editor") {
    res.status(403).json({ error: "Read-only role cannot modify data", code: "READ_ONLY" });
    return;
  }
  next();
}

export function requireAdminRole(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (req.authSession?.userRole !== "Admin") {
    res.status(403).json({ error: "Administrator role required", code: "ADMIN_REQUIRED" });
    return;
  }
  next();
}

export async function requireValidLicenseForWrite(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const body = req.body;
  if (!body || typeof body !== "object") {
    next();
    return;
  }

  const incoming = body as Record<string, unknown>;
  if (isLicenseActivationPayload(incoming)) {
    next();
    return;
  }

  const { data } = await loadApplicationData();
  const merged = { ...(data || {}), ...incoming };
  const license = evaluateLicenseFromState(merged);
  if (license.isExpired) {
    res.status(402).json({
      error: "License expired or invalid",
      code: "LICENSE_EXPIRED",
      reason: license.reason,
    });
    return;
  }
  next();
}

export function parseExpectedRevision(req: Request): number | null {
  const header = req.headers["x-data-revision"];
  if (header === undefined || header === "") return null;
  const n = parseInt(String(header), 10);
  return isNaN(n) ? null : n;
}
