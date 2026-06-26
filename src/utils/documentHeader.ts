/*
 * Custom document letterhead — cached in localStorage, synced via workspace payload.
 */

export type DocumentHeaderLineSize = 'sm' | 'md' | 'lg';

export interface DocumentHeaderLine {
  text: string;
  color: string;
  /** Legacy preset; used when fontSizePt is missing */
  size: DocumentHeaderLineSize;
  /** Exact font size in points */
  fontSizePt: number;
  bold: boolean;
}

export interface DocumentHeaderConfig {
  enabled: boolean;
  /** When true, letterhead is injected into every printable document */
  applyToAllDocuments: boolean;
  showDivider: boolean;
  line1: DocumentHeaderLine;
  line2: DocumentHeaderLine;
  line3: DocumentHeaderLine;
}

export interface DocumentHeaderPreset {
  id: string;
  name: string;
  config: DocumentHeaderConfig;
  updatedAt: string;
}

export const DOCUMENT_HEADER_STORAGE_KEY = 'it_document_header_local';
export const DOCUMENT_HEADER_PRESETS_KEY = 'it_document_header_presets_local';
export const DOCUMENT_HEADER_CHANGED = 'vicariustab-document-header-changed';

const SIZE_TO_PT: Record<DocumentHeaderLineSize, number> = {
  sm: 10,
  md: 12,
  lg: 14,
};

export const TSI_HEADER_EXAMPLE: DocumentHeaderConfig = {
  enabled: true,
  applyToAllDocuments: true,
  showDivider: true,
  line1: {
    text: 'Общество с ограниченной ответственностью',
    color: '#335588',
    size: 'sm',
    fontSizePt: 10,
    bold: false,
  },
  line2: {
    text: '«Группа Компаний «Трансстройинвест»',
    color: '#335588',
    size: 'lg',
    fontSizePt: 14,
    bold: true,
  },
  line3: {
    text: 'ООО «ГК «ТСИ»',
    color: '#000000',
    size: 'md',
    fontSizePt: 12,
    bold: false,
  },
};

export const DEFAULT_DOCUMENT_HEADER: DocumentHeaderConfig = {
  enabled: false,
  applyToAllDocuments: true,
  showDivider: true,
  line1: { text: '', color: '#335588', size: 'sm', fontSizePt: 10, bold: false },
  line2: { text: '', color: '#335588', size: 'lg', fontSizePt: 14, bold: true },
  line3: { text: '', color: '#000000', size: 'md', fontSizePt: 12, bold: false },
};

function clampPt(value: number): number {
  if (!Number.isFinite(value)) return 12;
  return Math.min(28, Math.max(8, Math.round(value)));
}

function normalizeLine(raw: unknown, fallback: DocumentHeaderLine): DocumentHeaderLine {
  if (!raw || typeof raw !== 'object') return { ...fallback };
  const row = raw as Partial<DocumentHeaderLine>;
  const size = row.size === 'sm' || row.size === 'md' || row.size === 'lg' ? row.size : fallback.size;
  const fontSizePt =
    typeof row.fontSizePt === 'number'
      ? clampPt(row.fontSizePt)
      : typeof (row as { size?: string }).size === 'string'
        ? SIZE_TO_PT[size]
        : fallback.fontSizePt;
  return {
    text: typeof row.text === 'string' ? row.text : fallback.text,
    color: typeof row.color === 'string' && row.color.trim() ? row.color : fallback.color,
    size,
    fontSizePt,
    bold: Boolean(row.bold),
  };
}

export function normalizeDocumentHeaderConfig(raw: Partial<DocumentHeaderConfig> | null | undefined): DocumentHeaderConfig {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_DOCUMENT_HEADER };
  return {
    enabled: Boolean(raw.enabled),
    applyToAllDocuments: raw.applyToAllDocuments !== false,
    showDivider: raw.showDivider !== false,
    line1: normalizeLine(raw.line1, DEFAULT_DOCUMENT_HEADER.line1),
    line2: normalizeLine(raw.line2, DEFAULT_DOCUMENT_HEADER.line2),
    line3: normalizeLine(raw.line3, DEFAULT_DOCUMENT_HEADER.line3),
  };
}

export function loadDocumentHeader(): DocumentHeaderConfig {
  try {
    const saved = localStorage.getItem(DOCUMENT_HEADER_STORAGE_KEY);
    if (!saved) return { ...DEFAULT_DOCUMENT_HEADER };
    return normalizeDocumentHeaderConfig(JSON.parse(saved) as Partial<DocumentHeaderConfig>);
  } catch {
    return { ...DEFAULT_DOCUMENT_HEADER };
  }
}

export function saveDocumentHeader(config: DocumentHeaderConfig): void {
  localStorage.setItem(DOCUMENT_HEADER_STORAGE_KEY, JSON.stringify(normalizeDocumentHeaderConfig(config)));
  window.dispatchEvent(new CustomEvent(DOCUMENT_HEADER_CHANGED));
}

/** Reset letterhead to empty defaults (first install / workspace reset). */
export function clearDocumentHeaderLocalStorage(): void {
  localStorage.removeItem(DOCUMENT_HEADER_STORAGE_KEY);
  localStorage.removeItem(DOCUMENT_HEADER_PRESETS_KEY);
  window.dispatchEvent(new CustomEvent(DOCUMENT_HEADER_CHANGED));
}

/** Apply letterhead from server workspace (all users receive the same config). */
export function applyDocumentHeaderFromServer(config: unknown, presets?: unknown): void {
  if (config && typeof config === 'object') {
    saveDocumentHeader(normalizeDocumentHeaderConfig(config as Partial<DocumentHeaderConfig>));
  }
  if (Array.isArray(presets)) {
    const normalized = presets
      .filter((p) => p && typeof p === 'object' && typeof p.id === 'string' && typeof p.name === 'string')
      .map((p) => ({
        id: p.id,
        name: p.name,
        updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : new Date().toISOString(),
        config: normalizeDocumentHeaderConfig(p.config as Partial<DocumentHeaderConfig>),
      }));
    saveDocumentHeaderPresets(normalized);
  }
}

export function loadDocumentHeaderPresets(): DocumentHeaderPreset[] {
  try {
    const saved = localStorage.getItem(DOCUMENT_HEADER_PRESETS_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((p) => p && typeof p === 'object' && typeof p.id === 'string' && typeof p.name === 'string')
      .map((p) => ({
        id: p.id,
        name: p.name,
        updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : new Date().toISOString(),
        config: normalizeDocumentHeaderConfig(p.config as Partial<DocumentHeaderConfig>),
      }));
  } catch {
    return [];
  }
}

export function saveDocumentHeaderPresets(presets: DocumentHeaderPreset[]): void {
  localStorage.setItem(DOCUMENT_HEADER_PRESETS_KEY, JSON.stringify(presets));
  window.dispatchEvent(new CustomEvent(DOCUMENT_HEADER_CHANGED));
}

export function upsertDocumentHeaderPreset(name: string, config: DocumentHeaderConfig): DocumentHeaderPreset[] {
  const trimmed = name.trim();
  if (!trimmed) return loadDocumentHeaderPresets();
  const presets = loadDocumentHeaderPresets();
  const existing = presets.find((p) => p.name.toLowerCase() === trimmed.toLowerCase());
  const entry: DocumentHeaderPreset = {
    id: existing?.id || `hdr-${Date.now()}`,
    name: trimmed,
    config: normalizeDocumentHeaderConfig({ ...config, enabled: true, applyToAllDocuments: true }),
    updatedAt: new Date().toISOString(),
  };
  const next = existing
    ? presets.map((p) => (p.id === existing.id ? entry : p))
    : [entry, ...presets];
  saveDocumentHeaderPresets(next);
  saveDocumentHeader(entry.config);
  return next;
}

export function deleteDocumentHeaderPreset(id: string): DocumentHeaderPreset[] {
  const next = loadDocumentHeaderPresets().filter((p) => p.id !== id);
  saveDocumentHeaderPresets(next);
  return next;
}

export function applyDocumentHeaderPreset(id: string): DocumentHeaderConfig | null {
  const preset = loadDocumentHeaderPresets().find((p) => p.id === id);
  if (!preset) return null;
  const config = normalizeDocumentHeaderConfig({
    ...preset.config,
    enabled: true,
    applyToAllDocuments: true,
  });
  saveDocumentHeader(config);
  return config;
}

export function hasDocumentHeaderContent(config: DocumentHeaderConfig): boolean {
  return [config.line1, config.line2, config.line3].some((line) => line.text.trim());
}

export function hasActiveDocumentHeader(config = loadDocumentHeader()): boolean {
  if (!config.enabled || config.applyToAllDocuments === false) return false;
  return hasDocumentHeaderContent(config);
}

/** Company name for printable documents — letterhead lines 2–3, then workspace title. */
export function resolveDocumentOrganizationName(
  workspaceName?: string,
  config = loadDocumentHeader()
): string {
  if (hasActiveDocumentHeader(config)) {
    const parts = [config.line2, config.line3]
      .map((line) => line.text.trim())
      .filter(Boolean);
    if (parts.length > 0) return parts.join(', ');
    const line1 = config.line1.text.trim();
    if (line1) return line1;
  }
  return workspaceName?.trim() || '';
}

export function getDocumentHeaderOffsetMm(config: DocumentHeaderConfig): number {
  const activeLines = [config.line1, config.line2, config.line3].filter((l) => l.text.trim());
  if (!activeLines.length) return 0;
  const PT_TO_MM = 0.352778;
  const LINE_HEIGHT = 1.35;
  let heightMm = 2;
  for (const line of activeLines) {
    heightMm += line.fontSizePt * PT_TO_MM * LINE_HEIGHT;
  }
  if (config.showDivider) heightMm += 4;
  heightMm += 2;
  return Math.ceil(heightMm);
}

/** @deprecated use getDocumentHeaderOffsetMm */
export function getDocumentHeaderBodyHeightMm(config = loadDocumentHeader()): number {
  if (!hasActiveDocumentHeader(config)) return 0;
  return getDocumentHeaderOffsetMm(config);
}

export function stripEmbeddedLetterheadFromPlainDoc(
  content: string,
  config = loadDocumentHeader()
): string {
  if (!hasActiveDocumentHeader(config) || !content) return content;
  const header = buildDocumentHeaderPlainText(config);
  if (content.startsWith(header)) return content.slice(header.length).replace(/^\s+/, '');
  const normalizedHeader = header.trimEnd();
  if (content.trimStart().startsWith(normalizedHeader)) {
    return content.trimStart().slice(normalizedHeader.length).replace(/^\s+/, '');
  }
  return content;
}

export function buildDocumentHeaderPlainText(config = loadDocumentHeader()): string {
  if (!hasActiveDocumentHeader(config)) return '';
  const lines = [config.line1, config.line2, config.line3].filter((line) => line.text.trim());
  const body = lines.map((line) => `                    ${line.text.trim()}`).join('\n');
  const divider = config.showDivider ? `\n${'─'.repeat(72)}` : '';
  return `${body}${divider}\n\n`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Static HTML for isolated print — always from localStorage config. */
export function buildDocumentHeaderHtml(config = loadDocumentHeader()): string {
  if (!hasActiveDocumentHeader(config)) return '';

  const lines = [config.line1, config.line2, config.line3].filter((line) => line.text.trim());
  const lineHtml = lines
    .map(line => {
      const boldClass = line.bold ? ' doc-header-line-bold' : '';
      const color = escapeHtml(line.color);
      const size = clampPt(line.fontSizePt);
      const text = escapeHtml(line.text.trim());
      return `<p class="doc-header-line${boldClass}" style="color:${color};font-size:${size}pt">${text}</p>`;
    })
    .join('');

  const divider = config.showDivider ? '<hr class="doc-header-divider" />' : '';

  return `<header class="doc-custom-header" aria-label="Document letterhead">${lineHtml}${divider}</header>`;
}
