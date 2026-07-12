/**
 * Unit tests: act print closing block (signatures + stamp stay on one page)
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('act print closing block', () => {
  it('ActPrintContent wraps signatures and stamp in doc-closing-block', () => {
    const source = readFileSync(path.join(root, 'src/components/ActPrintContent.tsx'), 'utf8');
    assert.match(source, /function DocClosingSection/);
    assert.match(source, /className="doc-closing-block"/);
    assert.match(source, /<DocStampSeal workspaceName=\{workspaceName\} \/>/);
    assert.ok((source.match(/<DocClosingSection/g) || []).length >= 4);
  });

  it('print stylesheet keeps table rows unbreakable', () => {
    const css = readFileSync(path.join(root, 'src/utils/printStyles.ts'), 'utf8');
    assert.match(css, /\.doc-equipment-table tr[\s\S]*page-break-inside:\s*avoid/);
    assert.match(css, /\.doc-equipment-table thead[\s\S]*table-header-group/);
  });

  it('print stylesheet keeps closing block unbreakable', () => {
    const css = readFileSync(path.join(root, 'src/utils/printStyles.ts'), 'utf8');
    assert.match(css, /\.doc-closing-block[\s\S]*break-inside:\s*avoid/);
    assert.match(css, /page-break-inside:\s*avoid/);
    assert.match(css, /\.doc-closing-block__inner/);
  });

  it('stamp is positioned inside closing block, not page footer', () => {
    const css = readFileSync(path.join(root, 'src/utils/printStyles.ts'), 'utf8');
    const stampRule = css.match(/\.doc-stamp-seal\s*\{[^}]+\}/)?.[0] || '';
    assert.match(stampRule, /right:\s*0/);
    assert.match(stampRule, /bottom:\s*0/);
    assert.doesNotMatch(stampRule, /bottom:\s*6mm/);
  });

  it('ActEditorModal no longer places stamp outside print content', () => {
    const source = readFileSync(path.join(root, 'src/components/ActEditorModal.tsx'), 'utf8');
    assert.doesNotMatch(source, /<DocStampSeal/);
  });

  it('object act uses DocSection with page break for full equipment list', () => {
    const source = readFileSync(path.join(root, 'src/components/ActPrintContent.tsx'), 'utf8');
    assert.match(source, /function DocSection/);
    assert.match(source, /doc-section--page-start/);
    assert.match(
      source,
      /DocSection[\s\S]*Полный перечень ИТ-оборудования[\s\S]*pageStart/
    );
  });

  it('warehouse and device acts use DocSection for table sections', () => {
    const source = readFileSync(path.join(root, 'src/components/ActPrintContent.tsx'), 'utf8');
    assert.match(source, /WarehouseActBody[\s\S]*DocSection[\s\S]*передаваемой партии/);
    assert.match(source, /DeviceActBody[\s\S]*DocSection[\s\S]*передаваемом оборудовании/);
    assert.match(source, /История замен комплектующих[\s\S]*pageStart/);
  });

  it('ActPrintContent uses DocPrintTable with HTML border for reliable cell grid', () => {
    const source = readFileSync(path.join(root, 'src/components/ActPrintContent.tsx'), 'utf8');
    assert.match(source, /function DocPrintTable/);
    assert.match(source, /border=\{1\}/);
    assert.match(source, /cellSpacing=\{0\}/);
    assert.match(source, /<colgroup>/);
  });

  it('print stylesheet uses visible table borders and safe word wrapping', () => {
    const css = readFileSync(path.join(root, 'src/utils/printStyles.ts'), 'utf8');
    assert.match(css, /border:\s*1px solid #111/);
    assert.match(css, /overflow-wrap:\s*break-word/);
    assert.doesNotMatch(css, /overflow-wrap:\s*anywhere/);
  });
});
