/*
 * Login/password validation (mirrors server/passwordHash.ts rules)
 */

export function validateLoginField(login: string): string | null {
  const v = login.trim();
  if (v.length < 3) return 'Логин должен содержать не менее 3 символов';
  if (v.length > 64) return 'Логин слишком длинный';
  if (!/^[a-zA-Z0-9._-]+$/.test(v)) {
    return 'Логин может содержать только буквы, цифры, точку, дефис и подчёркивание';
  }
  return null;
}

export function validatePasswordField(password: string): string | null {
  if (password.length < 8) return 'Пароль должен содержать не менее 8 символов';
  if (password.length > 128) return 'Пароль слишком длинный';
  return null;
}

export function validateEmailField(email: string): string | null {
  const v = email.trim();
  if (!v) return 'Укажите электронную почту';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Некорректный формат email';
  if (v.length > 254) return 'Email слишком длинный';
  return null;
}
