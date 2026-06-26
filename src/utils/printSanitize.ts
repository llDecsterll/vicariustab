/*
 * Prepare printable HTML — sanitize DOM clone and inject letterhead from localStorage.
 */
import { buildDocumentHeaderHtml, hasActiveDocumentHeader, loadDocumentHeader } from './documentHeader';

function applyDocumentHeaderToClone(clone: HTMLElement): void {
  clone.querySelector('.doc-custom-header')?.remove();

  const config = loadDocumentHeader();
  if (!hasActiveDocumentHeader(config)) return;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = buildDocumentHeaderHtml(config);
  const header = wrapper.firstElementChild;
  if (!header) return;

  const shell = clone.querySelector('.doc-print-shell');
  if (shell) {
    shell.classList.add('doc-print-shell--with-header');
    shell.insertBefore(header, shell.firstChild);
    return;
  }

  const body = clone.querySelector('.doc-print-body');
  if (body) {
    body.insertBefore(header, body.firstChild);
    return;
  }

  clone.insertBefore(header, clone.firstChild);
}

export function sanitizePrintHtml(root: HTMLElement): string {
  const clone = root.cloneNode(true) as HTMLElement;

  clone.querySelectorAll('svg, img, picture, canvas, button, input, select, textarea').forEach(el => {
    el.remove();
  });

  clone.querySelectorAll('.no-print').forEach(el => {
    el.remove();
  });

  clone.querySelectorAll('.doc-cell-icon').forEach(el => {
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    const span = el.ownerDocument.createElement('span');
    span.textContent = text;
    el.replaceWith(span);
  });

  applyDocumentHeaderToClone(clone);

  return clone.outerHTML;
}
