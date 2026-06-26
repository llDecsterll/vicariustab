/*
 * Password hashing (scrypt) — server-side only
 */
import crypto from "crypto";

const SCRYPT_OPTS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 } as const;
const KEY_LEN = 64;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, KEY_LEN, SCRYPT_OPTS);
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export function isPasswordHash(value: string): boolean {
  return value.startsWith("scrypt$");
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!isPasswordHash(stored)) return false;
  const parts = stored.split("$");
  if (parts.length !== 3) return false;
  const salt = parts[1];
  const expectedHex = parts[2];
  try {
    const derived = crypto.scryptSync(password, salt, KEY_LEN, SCRYPT_OPTS);
    const expected = Buffer.from(expectedHex, "hex");
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function validateLoginField(login: string): string | null {
  const v = login.trim();
  if (v.length < 3) return "Логин должен содержать не менее 3 символов";
  if (v.length > 64) return "Логин слишком длинный";
  if (!/^[a-zA-Z0-9._-]+$/.test(v)) return "Логин может содержать только буквы, цифры, точку, дефис и подчёркивание";
  return null;
}

export function validatePasswordField(password: string): string | null {
  if (password.length < 8) return "Пароль должен содержать не менее 8 символов";
  if (password.length > 128) return "Пароль слишком длинный";
  return null;
}

export function validateEmailField(email: string): string | null {
  const v = email.trim();
  if (!v) return "Укажите электронную почту";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Некорректный формат email";
  if (v.length > 254) return "Email слишком длинный";
  return null;
}
