/** Allowed characters in employee phone: digits, leading +, spaces, dashes, parentheses. */
export const EMPLOYEE_PHONE_PATTERN = /^\+?[\d\s\-()]*$/;

export function normalizeEmployeePhone(phone: string | undefined | null): string {
  return (phone ?? '').trim();
}

export function isValidEmployeePhone(phone: string | undefined | null): boolean {
  const value = normalizeEmployeePhone(phone);
  if (!value) return true;
  if (!EMPLOYEE_PHONE_PATTERN.test(value)) return false;
  const digits = value.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

export const EMPLOYEE_PHONE_VALIDATION_ERROR_KEY =
  'Некорректный формат телефона. Разрешены цифры, «+» в начале, пробелы, дефисы и скобки (7–15 цифр).';
