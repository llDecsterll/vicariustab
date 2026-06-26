/*
 * Russian full name → short form: «Уткин Владислав Вячеславович» → «Уткин В.В.»
 */
export function formatPersonShortName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return '';

  if (/^[А-ЯЁA-Z][а-яёa-z-]+\s+[А-ЯЁA-Z]\.[А-ЯЁA-Z]?\.?$/u.test(trimmed)) {
    const [surname, initials] = trimmed.split(/\s+/, 2);
    const normalized = initials.replace(/\s/g, '');
    const withDots = normalized.endsWith('.') ? normalized : `${normalized}.`;
    return `${surname} ${withDots}`;
  }

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];

  const surname = parts[0];
  const initials = parts
    .slice(1)
    .map(part => {
      const letter = part.replace(/\./g, '').charAt(0).toUpperCase();
      return letter ? `${letter}.` : '';
    })
    .filter(Boolean)
    .join('');

  return initials ? `${surname} ${initials}` : surname;
}
