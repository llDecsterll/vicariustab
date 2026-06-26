/*
 * Wraps printable document body with a letterhead in normal document flow.
 */
import React from 'react';
import DocumentHeader, { useDocumentHeaderConfig } from './DocumentHeader';
import { hasActiveDocumentHeader } from '../utils/documentHeader';

interface DocumentPrintShellProps {
  children: React.ReactNode;
  className?: string;
}

export default function DocumentPrintShell({ children, className = '' }: DocumentPrintShellProps) {
  const config = useDocumentHeaderConfig();
  const showHeader = hasActiveDocumentHeader(config);

  return (
    <div className={`doc-print-shell ${showHeader ? 'doc-print-shell--with-header' : ''} ${className}`.trim()}>
      {showHeader ? <DocumentHeader /> : null}
      <div className="doc-print-body">{children}</div>
    </div>
  );
}
