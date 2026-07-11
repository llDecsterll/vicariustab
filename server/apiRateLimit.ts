/*
 * IP-based API rate limiting (read vs write buckets)
 */
import type { Request, Response, NextFunction } from "express";
import { getClientIp } from "./sessionEngine.ts";

const WINDOW_MS = Number(process.env.API_RATE_LIMIT_WINDOW_MS) || 60_000;
const READ_MAX = Number(process.env.API_RATE_LIMIT_READ_MAX) || 240;
const WRITE_MAX = Number(process.env.API_RATE_LIMIT_WRITE_MAX) || 48;

function limits() {
  return {
    windowMs: Number(process.env.API_RATE_LIMIT_WINDOW_MS) || WINDOW_MS,
    readMax: Number(process.env.API_RATE_LIMIT_READ_MAX) || READ_MAX,
    writeMax: Number(process.env.API_RATE_LIMIT_WRITE_MAX) || WRITE_MAX,
  };
}

interface Bucket {
  count: number;
  windowStart: number;
}

const readBuckets = new Map<string, Bucket>();
const writeBuckets = new Map<string, Bucket>();

function isWriteMethod(method: string): boolean {
  const m = method.toUpperCase();
  return m === "POST" || m === "PUT" || m === "PATCH" || m === "DELETE";
}

function isExemptPath(path: string): boolean {
  return path === "/api/health" || path === "/health";
}

function checkBucket(
  buckets: Map<string, Bucket>,
  key: string,
  max: number,
  windowMs: number,
  now: number
): { allowed: boolean; retryAfterMs: number } {
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart >= windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, retryAfterMs: 0 };
  }
  if (bucket.count >= max) {
    const retryAfterMs = windowMs - (now - bucket.windowStart);
    return { allowed: false, retryAfterMs: Math.max(1000, retryAfterMs) };
  }
  bucket.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

export function resetApiRateLimitBucketsForTests(): void {
  readBuckets.clear();
  writeBuckets.clear();
}

export function apiIpRateLimit(req: Request, res: Response, next: NextFunction): void {
  const path = req.originalUrl?.split("?")[0] || req.path || "";
  if (isExemptPath(path)) {
    next();
    return;
  }

  const ip = getClientIp(req);
  const now = Date.now();
  const { windowMs, readMax, writeMax } = limits();
  const write = isWriteMethod(req.method);
  const max = write ? writeMax : readMax;
  const buckets = write ? writeBuckets : readBuckets;
  const bucketKey = `${ip}:${write ? "w" : "r"}`;

  const { allowed, retryAfterMs } = checkBucket(buckets, bucketKey, max, windowMs, now);
  if (!allowed) {
    const retrySec = Math.ceil(retryAfterMs / 1000);
    res.setHeader("Retry-After", String(retrySec));
    res.status(429).json({
      error: "Too many API requests from this IP. Try again later.",
      code: "API_RATE_LIMITED",
      retryAfterMs,
    });
    return;
  }

  next();
}
