/*
 * Status badge classes for printable documents.
 */
export function getDocStatusBadgeClass(status: string | undefined): string {
  const s = (status || '').toLowerCase().trim();
  if (!s) return 'doc-status-badge doc-status-badge--neutral';

  if (s.includes('списан') || s === 'под списание') {
    return 'doc-status-badge doc-status-badge--red';
  }
  if (s.includes('ремонт') || s.includes('проверк')) {
    return 'doc-status-badge doc-status-badge--yellow';
  }
  if (s.includes('работ') || s.includes('выдан') || s.includes('актив')) {
    return 'doc-status-badge doc-status-badge--green';
  }
  return 'doc-status-badge doc-status-badge--neutral';
}
