/*
 * Idempotency-Key support for mutating API requests
 */
import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";
import { getClientIp, resolveSessionFromToken } from "./sessionEngine.ts";
import { readSessionToken, type AuthedRequest } from "./apiAuth.ts";

const TTL_MS = Number(process.env.IDEMPOTENCY_TTL_MS) || 24 * 60 * 60 * 1000;
const MAX_ENTRIES = Number(process.env.IDEMPOTENCY_MAX_ENTRIES) || 10_000;

interface IdempotencyEntry {
  status: number;
  body: string;
  contentType: string;
  createdAt: number;
}

const store = new Map<string, IdempotencyEntry>();
const inFlight = new Set<string>();

function pruneStore(now: number): void {
  if (store.size <= MAX_ENTRIES) return;
  for (const [key, entry] of store) {
    if (now - entry.createdAt > TTL_MS) store.delete(key);
  }
  if (store.size <= MAX_ENTRIES) return;
  const sorted = [...store.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt);
  const remove = sorted.length - MAX_ENTRIES;
  for (let i = 0; i < remove; i++) store.delete(sorted[i][0]);
}

export function readIdempotencyKey(req: Request): string {
  const raw = String(
    req.headers["idempotency-key"] || req.headers["x-idempotency-key"] || ""
  ).trim();
  return raw;
}

function buildStoreKey(req: Request, idempotencyKey: string, scope: string): string {
  const path = req.originalUrl?.split("?")[0] || req.path || "";
  const payload = `${scope}:${req.method.toUpperCase()}:${path}:${idempotencyKey}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
}

function replayEntry(res: Response, entry: IdempotencyEntry): void {
  res.setHeader("Content-Type", entry.contentType);
  res.setHeader("X-Idempotency-Replayed", "true");
  res.status(entry.status).send(entry.body);
}

export function resetIdempotencyStoreForTests(): void {
  store.clear();
  inFlight.clear();
}

export function createIdempotencyMiddleware(scopeForRequest: (req: Request) => string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const method = req.method.toUpperCase();
    if (method !== "POST" && method !== "PUT" && method !== "PATCH" && method !== "DELETE") {
      next();
      return;
    }

    const idempotencyKey = readIdempotencyKey(req);
    if (!idempotencyKey) {
      next();
      return;
    }
    if (idempotencyKey.length > 128 || !/^[\w.-]+$/.test(idempotencyKey)) {
      res.status(400).json({
        error: "Invalid Idempotency-Key (max 128 chars, alphanumeric/dash/dot/underscore)",
        code: "IDEMPOTENCY_KEY_INVALID",
      });
      return;
    }

    const now = Date.now();
    pruneStore(now);
    const scope = scopeForRequest(req);
    const storeKey = buildStoreKey(req, idempotencyKey, scope);

    const cached = store.get(storeKey);
    if (cached && now - cached.createdAt <= TTL_MS) {
      replayEntry(res, cached);
      return;
    }
    if (cached) store.delete(storeKey);

    if (inFlight.has(storeKey)) {
      res.status(409).json({
        error: "Duplicate request is still processing",
        code: "IDEMPOTENCY_IN_FLIGHT",
      });
      return;
    }

    inFlight.add(storeKey);

    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    const finalize = (body: string, contentType: string) => {
      inFlight.delete(storeKey);
      const status = res.statusCode;
      if (status >= 200 && status < 500) {
        store.set(storeKey, { status, body, contentType, createdAt: Date.now() });
      }
    };

    res.json = (body: unknown) => {
      try {
        const serialized = JSON.stringify(body);
        finalize(serialized, "application/json; charset=utf-8");
        return originalJson(body);
      } catch (err) {
        inFlight.delete(storeKey);
        throw err;
      }
    };

    res.send = (body?: unknown) => {
      try {
        const serialized = body === undefined ? "" : String(body);
        const type = String(res.getHeader("Content-Type") || "text/plain; charset=utf-8");
        finalize(serialized, type);
        return originalSend(body);
      } catch (err) {
        inFlight.delete(storeKey);
        throw err;
      }
    };

    res.on("close", () => {
      if (!res.writableFinished) inFlight.delete(storeKey);
    });

    next();
  };
}

export const publicIdempotencyMiddleware = createIdempotencyMiddleware((req) =>
  getClientIp(req)
);

export const authedIdempotencyMiddleware = createIdempotencyMiddleware((req) => {
  const authed = req as AuthedRequest;
  return authed.authSession?.userId || getClientIp(req);
});

/** Resolves user from session token when global auth middleware has not run yet. */
export const apiIdempotencyMiddleware = createIdempotencyMiddleware((req) => {
  const authed = req as AuthedRequest;
  if (authed.authSession?.userId) return authed.authSession.userId;
  const token = readSessionToken(req);
  const session = token ? resolveSessionFromToken(token) : null;
  if (session?.userId) return session.userId;
  return getClientIp(req);
});
