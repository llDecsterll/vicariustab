/*
 * Isolated print via hidden iframe — no extra browser window, letterhead from localStorage.
 */
import { DOCUMENT_PRINT_CSS } from './printStyles';
import { sanitizePrintHtml } from './printSanitize';

export interface PrintDocumentOptions {
  elementId?: string;
  title?: string;
}

const PRINTABLE_IDS = ['printable-act-block', 'printable-audit-doc', 'printable-report-area'] as const;

function resolvePrintTarget(elementId?: string): HTMLElement | null {
  if (elementId) return document.getElementById(elementId);
  for (const id of PRINTABLE_IDS) {
    const el = document.getElementById(id);
    if (el) return el;
  }
  return null;
}

function buildPrintHtml(innerHtml: string): string {
  const lang = document.documentElement.lang || 'ru';
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <title></title>
  <style>${DOCUMENT_PRINT_CSS}</style>
</head>
<body>
  <div class="doc-print-root">${innerHtml}</div>
</body>
</html>`;
}

function printHtmlInHiddenFrame(html: string): boolean {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.setAttribute('tabindex', '-1');
  iframe.style.cssText =
    'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;pointer-events:none';

  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  const frameDoc = frameWindow?.document;
  if (!frameWindow || !frameDoc) {
    iframe.remove();
    return false;
  }

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    window.setTimeout(() => {
      try {
        iframe.remove();
      } catch {
        /* ignore */
      }
    }, 800);
  };

  frameDoc.open();
  frameDoc.write(html);
  frameDoc.close();

  const runPrint = () => {
    try {
      frameDoc.title = '';
      frameWindow.focus();
      frameWindow.print();
    } catch {
      cleanup();
      return;
    }
    frameWindow.addEventListener('afterprint', cleanup, { once: true });
    window.setTimeout(cleanup, 120_000);
  };

  if (frameDoc.readyState === 'complete') {
    window.setTimeout(runPrint, 120);
  } else {
    iframe.onload = () => window.setTimeout(runPrint, 120);
  }

  return true;
}

export function printDocument(options?: PrintDocumentOptions): void {
  const target = resolvePrintTarget(options?.elementId);
  const previousTitle = document.title;

  const restoreTitle = () => {
    document.title = previousTitle;
    window.removeEventListener('afterprint', restoreTitle);
  };

  if (!target) {
    document.title = '';
    window.addEventListener('afterprint', restoreTitle);
    window.print();
    window.setTimeout(restoreTitle, 2000);
    return;
  }

  const html = buildPrintHtml(sanitizePrintHtml(target));
  const printed = printHtmlInHiddenFrame(html);

  if (!printed) {
    document.title = '';
    window.addEventListener('afterprint', restoreTitle);
    window.print();
    window.setTimeout(restoreTitle, 2000);
  }
}

export function downloadDocumentAsPdf(_filename?: string): void {
  printDocument();
}
