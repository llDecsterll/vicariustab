/*
 * Printable letterhead block for documents (local config).
 */
import React, { useEffect, useState } from 'react';
import {
  DOCUMENT_HEADER_CHANGED,
  hasActiveDocumentHeader,
  hasDocumentHeaderContent,
  loadDocumentHeader,
  type DocumentHeaderConfig,
  type DocumentHeaderLine,
} from '../utils/documentHeader';

interface DocumentHeaderProps {
  className?: string;
  config?: DocumentHeaderConfig;
}

export function useDocumentHeaderConfig(): DocumentHeaderConfig {
  const [config, setConfig] = useState<DocumentHeaderConfig>(() => loadDocumentHeader());

  useEffect(() => {
    const refresh = () => setConfig(loadDocumentHeader());
    window.addEventListener(DOCUMENT_HEADER_CHANGED, refresh);
    return () => window.removeEventListener(DOCUMENT_HEADER_CHANGED, refresh);
  }, []);

  return config;
}

function renderLine(line: DocumentHeaderLine, index: number) {
  if (!line.text.trim()) return null;
  return (
    <p
      key={index}
      className={`doc-header-line ${line.bold ? 'doc-header-line-bold' : ''}`}
      style={{ color: line.color, fontSize: `${line.fontSizePt}pt` }}
    >
      {line.text.trim()}
    </p>
  );
}

export default function DocumentHeader({
  className = '',
  config: configProp,
}: DocumentHeaderProps) {
  const liveConfig = useDocumentHeaderConfig();
  const config = configProp ?? liveConfig;
  const visible = configProp
    ? config.enabled && hasDocumentHeaderContent(config)
    : hasActiveDocumentHeader(config);

  if (!visible) return null;

  const lines = [config.line1, config.line2, config.line3];

  return (
    <header className={`doc-custom-header ${className}`.trim()} aria-label="Document letterhead">
      {lines.map(renderLine)}
      {config.showDivider ? <hr className="doc-header-divider" /> : null}
    </header>
  );
}
