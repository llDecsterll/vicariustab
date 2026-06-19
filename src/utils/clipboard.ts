function fallbackCopyTextToClipboard(text: string): boolean {
  if (typeof document === 'undefined') return false;

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '0';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, text.length);

  let success = false;
  try {
    success = document.execCommand('copy');
  } catch {
    success = false;
  }

  document.body.removeChild(textarea);
  return success;
}

/** Copies text to clipboard; works on HTTP via execCommand fallback. */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  const value = String(text ?? '').trim();
  if (!value || typeof window === 'undefined') return false;

  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // fall through to legacy copy
    }
  }

  return fallbackCopyTextToClipboard(value);
}
