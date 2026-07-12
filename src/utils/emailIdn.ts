import punycode from 'punycode';

const { toASCII, toUnicode } = punycode;

export function splitEmailAddress(email: string): { local: string; domain: string } | null {
  const trimmed = email.trim();
  const at = trimmed.lastIndexOf('@');
  if (at <= 0 || at >= trimmed.length - 1) return null;
  return {
    local: trimmed.slice(0, at),
    domain: trimmed.slice(at + 1),
  };
}

function encodeDomain(domain: string): string {
  const labels = domain.trim().split('.');
  return labels
    .map((label) => {
      const trimmed = label.trim();
      if (!trimmed) return trimmed;
      try {
        return toASCII(trimmed);
      } catch {
        return trimmed;
      }
    })
    .join('.');
}

function decodeDomain(domain: string): string {
  const labels = domain.trim().split('.');
  return labels
    .map((label) => {
      const trimmed = label.trim();
      if (!trimmed) return trimmed;
      try {
        return toUnicode(trimmed);
      } catch {
        return trimmed;
      }
    })
    .join('.');
}

/** Store email with ASCII (Punycode) domain for compatibility; local part unchanged. */
export function normalizeEmailForStorage(email: string): string {
  const trimmed = email.trim();
  if (!trimmed) return '';
  const parts = splitEmailAddress(trimmed);
  if (!parts) return trimmed.toLowerCase();
  const asciiDomain = encodeDomain(parts.domain).toLowerCase();
  return `${parts.local}@${asciiDomain}`;
}

/** Display email with Unicode domain for UI; local part unchanged. */
export function displayEmailAddress(email: string): string {
  const trimmed = email.trim();
  if (!trimmed) return '';
  const parts = splitEmailAddress(trimmed);
  if (!parts) return trimmed;
  const unicodeDomain = decodeDomain(parts.domain);
  return `${parts.local}@${unicodeDomain}`;
}

/** RFC-safe mailto href uses Punycode domain. */
export function mailtoHrefForEmail(email: string): string {
  const stored = normalizeEmailForStorage(email);
  return stored ? `mailto:${stored}` : '';
}

export function employeeEmailMatchesSearch(email: string | undefined, query: string): boolean {
  if (!email?.trim() || !query.trim()) return false;
  const q = query.trim().toLowerCase();
  const stored = email.toLowerCase();
  const display = displayEmailAddress(email).toLowerCase();
  return stored.includes(q) || display.includes(q);
}

export function validateEmployeeEmailField(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return null;
  const normalized = normalizeEmailForStorage(trimmed);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return 'Некорректный формат email';
  }
  if (normalized.length > 254) return 'Email слишком длинный';
  return null;
}
