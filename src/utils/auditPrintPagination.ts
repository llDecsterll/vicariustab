/** Approximate equipment rows that fit on one A4 inventory start sheet (screen preview). */
export const AUDIT_EQUIPMENT_ROWS_PER_PREVIEW_PAGE = 20;

export function chunkAuditEquipmentRows<T>(rows: T[], perPage = AUDIT_EQUIPMENT_ROWS_PER_PREVIEW_PAGE): T[][] {
  if (rows.length === 0) return [[]];
  const chunks: T[][] = [];
  for (let i = 0; i < rows.length; i += perPage) {
    chunks.push(rows.slice(i, i + perPage));
  }
  return chunks;
}
