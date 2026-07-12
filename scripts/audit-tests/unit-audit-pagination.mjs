/**
 * Unit tests: audit print pagination helpers
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  AUDIT_EQUIPMENT_ROWS_PER_PREVIEW_PAGE,
  chunkAuditEquipmentRows,
} from '../../src/utils/auditPrintPagination.ts';

describe('auditPrintPagination', () => {
  it('chunkAuditEquipmentRows splits rows for multi-page preview', () => {
    const rows = Array.from({ length: 45 }, (_, i) => ({ index: i + 1 }));
    const pages = chunkAuditEquipmentRows(rows, 20);
    assert.equal(pages.length, 3);
    assert.equal(pages[0].length, 20);
    assert.equal(pages[1].length, 20);
    assert.equal(pages[2].length, 5);
  });

  it('uses default page size constant', () => {
    const rows = Array.from({ length: AUDIT_EQUIPMENT_ROWS_PER_PREVIEW_PAGE + 1 }, (_, i) => i);
    assert.equal(chunkAuditEquipmentRows(rows).length, 2);
  });
});
