/*
 * In-memory login rate limiter (brute-force mitigation)
 */
import type { Request } from "express";
import { getClientIp } from "./sessionEngine.ts";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

interface Bucket {
  failures: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

function bucketKey(req: Request, login: string): string {
  return `${getClientIp(req)}:${login.trim().toLowerCase()}`;
}

export function isLoginRateLimited(req: Request, login: string): boolean {
  const key = bucketKey(req, login);
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket) return false;
  if (now - bucket.windowStart > WINDOW_MS) {
    buckets.delete(key);
    return false;
  }
  return bucket.failures >= MAX_ATTEMPTS;
}

export function recordLoginFailure(req: Request, login: string): void {
  const key = bucketKey(req, login);
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    buckets.set(key, { failures: 1, windowStart: now });
    return;
  }
  bucket.failures += 1;
}

export function clearLoginFailures(req: Request, login: string): void {
  buckets.delete(bucketKey(req, login));
}

export function loginRateLimitMessage(): string {
  return "Слишком много неудачных попыток входа. Повторите через 15 минут.";
}
