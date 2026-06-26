/*
 * Self-contained print stylesheet — no app Tailwind (avoids layout breaks in print).
 */
export const DOCUMENT_PRINT_CSS = `
  @page {
    size: A4 portrait;
    margin: 0;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 12mm 15mm;
    background: #fff;
    color: #0f172a;
    font-family: 'Times New Roman', Times, serif;
    font-size: 10pt;
    line-height: 1.45;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .doc-print-root {
    width: 100%;
    max-width: 180mm;
    margin: 0 auto;
    padding: 0;
  }
  .doc-official-page {
    position: relative;
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    padding: 0;
    background: #fff;
    color: #0f172a;
    font-family: 'Times New Roman', Times, serif;
    font-size: 10pt;
    line-height: 1.45;
    border: none;
    box-shadow: none;
    border-radius: 0;
  }
  .doc-print-shell,
  .doc-print-body {
    width: 100%;
  }
  .doc-fallback-header {
    text-align: center;
    margin: 0 0 4mm;
  }
  .doc-fallback-header-title {
    display: block;
    font-size: 11pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .doc-fallback-header-sub {
    display: block;
    margin-top: 1mm;
    font-size: 7.5pt;
    color: #64748b;
    text-transform: uppercase;
  }
  .doc-custom-header {
    text-align: center;
    margin: 0 0 4mm;
    width: 100%;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .doc-print-shell--with-header .doc-custom-header {
    margin: 0 0 4mm;
  }
  .doc-header-line {
    margin: 0;
    line-height: 1.35;
    font-family: 'Times New Roman', Times, serif;
  }
  .doc-header-line-bold {
    font-weight: 700;
  }
  .doc-header-divider {
    display: block;
    width: 85%;
    margin: 3mm auto 0;
    border: none;
    border-top: 1px solid #94a3b8;
  }
  .doc-act-meta-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 4mm;
    width: 100%;
    margin: 0 0 5mm;
    font-size: 9pt;
  }
  .doc-act-meta-left { font-weight: 700; flex: 1 1 auto; }
  .doc-act-meta-right {
    flex: 0 0 auto;
    font-family: ui-monospace, 'Cascadia Code', monospace;
    font-size: 8.5pt;
    color: #64748b;
    white-space: nowrap;
  }
  .doc-act-title-block {
    text-align: center;
    margin: 0 0 5mm;
  }
  .doc-act-title-block h1 {
    margin: 0;
    font-size: 12pt;
    font-weight: 800;
    text-transform: uppercase;
    line-height: 1.3;
  }
  .doc-act-title-block p {
    margin: 2mm 0 0;
    font-size: 8.5pt;
    color: #64748b;
    font-style: italic;
    line-height: 1.35;
  }
  .doc-section-title {
    display: block;
    margin: 0 0 2mm;
    padding-bottom: 1mm;
    border-bottom: 1px solid #e2e8f0;
    font-size: 8.5pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }
  .doc-info-panel {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5mm;
    background: #eff6ff;
    border: 1px solid #dbeafe;
    border-radius: 3px;
    padding: 3mm 4mm;
    margin: 0 0 5mm;
  }
  .doc-info-panel-col--right { text-align: right; }
  .doc-info-label {
    display: block;
    margin-bottom: 1mm;
    font-size: 7.5pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: #64748b;
  }
  .doc-info-value {
    display: block;
    margin-bottom: 1mm;
    font-size: 10pt;
    font-weight: 700;
    color: #0f172a;
  }
  .doc-info-sub {
    display: block;
    font-size: 8.5pt;
    color: #475569;
    line-height: 1.35;
  }
  .doc-info-count {
    display: block;
    margin-top: 1mm;
    font-size: 11pt;
    font-weight: 700;
    color: #2563eb;
  }
  .doc-equipment-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 8.5pt;
    line-height: 1.35;
    margin-bottom: 4mm;
  }
  .doc-equipment-table th,
  .doc-equipment-table td {
    border: 1px solid #cbd5e1;
    padding: 1.5mm 2mm;
    vertical-align: top;
    word-wrap: break-word;
    overflow-wrap: anywhere;
  }
  .doc-equipment-table thead tr {
    background: #f1f5f9;
    font-weight: 700;
  }
  .doc-equipment-table .col-num { width: 7%; text-align: center; }
  .doc-equipment-table .col-model { width: 24%; }
  .doc-equipment-table .col-desc { width: 28%; }
  .doc-equipment-table .col-cat { width: 20%; }
  .doc-equipment-table .col-inv { width: 18%; text-align: right; font-family: ui-monospace, monospace; }
  .doc-status-cell { text-align: center; white-space: nowrap; width: 15%; }
  .doc-status-badge {
    display: inline-block;
    white-space: nowrap;
    font-size: 7.5pt;
    line-height: 1.2;
    padding: 0.5mm 1.5mm;
    border-radius: 2px;
    font-weight: 600;
  }
  .doc-status-badge--green { background: #f0fdf4; color: #15803d; border: 1px solid #86efac; }
  .doc-status-badge--yellow { background: #fffbeb; color: #b45309; border: 1px solid #fcd34d; }
  .doc-status-badge--red { background: #fef2f2; color: #b91c1c; border: 1px solid #fca5a5; }
  .doc-status-badge--neutral { background: #f8fafc; color: #475569; border: 1px solid #cbd5e1; }
  .doc-clauses { margin: 4mm 0; text-align: justify; font-size: 8pt; line-height: 1.45; }
  .doc-clauses p { margin: 0 0 2mm; }
  .doc-signatures-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8mm;
    margin-top: 6mm;
    padding-top: 3mm;
    border-top: 1px solid #e2e8f0;
  }
  .doc-signature-label {
    display: block;
    margin-bottom: 4mm;
    font-size: 8pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: #94a3b8;
  }
  .doc-signature-line {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 3mm;
    border-bottom: 1px solid #64748b;
    padding-bottom: 1mm;
    font-size: 9pt;
  }
  .doc-signature-hint { font-style: italic; color: #94a3b8; }
  .doc-signature-name { font-weight: 700; font-family: ui-monospace, monospace; white-space: nowrap; }
  .doc-block { margin-bottom: 4mm; }
  .doc-empty-note {
    margin: 2mm 0;
    padding: 2mm 3mm;
    font-size: 8.5pt;
    font-style: italic;
    color: #64748b;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 2px;
  }
  .doc-footnote {
    margin-top: 4mm;
    padding-top: 2mm;
    border-top: 1px solid #f1f5f9;
    font-size: 7.5pt;
    font-style: italic;
    color: #64748b;
    text-align: justify;
    line-height: 1.4;
  }
  .doc-object-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 3mm;
    text-align: right;
  }
  .doc-object-stat-value {
    display: block;
    margin-top: 1mm;
    font-size: 11pt;
    font-weight: 700;
  }
  .doc-object-stat-value--blue { color: #2563eb; }
  .doc-object-stat-value--green { color: #059669; }
  .doc-object-stat-value--indigo { color: #4f46e5; }
  .doc-employee-block {
    margin-bottom: 4mm;
    padding: 2.5mm 3mm;
    border: 1px solid #e2e8f0;
    border-radius: 3px;
    background: #f8fafc;
  }
  .doc-employee-block-title {
    display: flex;
    justify-content: space-between;
    gap: 3mm;
    margin-bottom: 2mm;
    padding-bottom: 1mm;
    border-bottom: 1px solid #e2e8f0;
    font-size: 9pt;
    font-weight: 700;
  }
  .doc-employee-block-meta {
    font-size: 8pt;
    font-weight: 400;
    color: #64748b;
    text-align: right;
  }
  .doc-details-table th {
    width: 34%;
    font-weight: 700;
    background: #f8fafc;
    text-align: left;
  }
  .doc-details-table td { font-weight: 400; }
  .doc-details-table .mono { font-family: ui-monospace, monospace; }
  .doc-stamp-seal {
    position: absolute;
    right: 6mm;
    bottom: 6mm;
    width: 26mm;
    height: 26mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.4mm;
    padding: 2mm;
    border: 0.55mm double #1e3a8a;
    border-radius: 50%;
    transform: rotate(-12deg);
    opacity: 0.3;
    pointer-events: none;
    color: #1e3a8a;
    text-align: center;
    line-height: 1.1;
    z-index: 2;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .doc-stamp-seal__title {
    display: block;
    font-size: 6.5pt;
    font-weight: 800;
    letter-spacing: 0.08em;
  }
  .doc-stamp-seal__org {
    display: block;
    font-size: 4.5pt;
    font-weight: 700;
    max-width: 22mm;
    word-break: break-word;
  }
  .doc-stamp-seal__sub {
    display: block;
    font-size: 3.5pt;
    font-weight: 600;
    letter-spacing: 0.04em;
  }
  svg, img { display: none !important; }

  /* Inventory audit print */
  .audit-print-page {
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    padding: 0;
    box-sizing: border-box;
    overflow: hidden;
  }
  .audit-a4-sheet {
    width: 100%;
    max-width: 100%;
    padding: 0;
    margin: 0;
    font-family: 'Times New Roman', Times, serif;
    font-size: 10pt;
    line-height: 1.45;
    color: #111;
    overflow-wrap: anywhere;
    word-wrap: break-word;
  }
  .audit-doc-title {
    font-size: 12pt;
    font-weight: 700;
    text-align: center;
    text-transform: uppercase;
    margin: 0 0 8mm;
    line-height: 1.35;
  }
  .audit-meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3mm 6mm;
    margin-bottom: 5mm;
  }
  .audit-meta-wide { grid-column: 1 / -1; }
  .audit-meta-label {
    display: block;
    font-size: 8.5pt;
    color: #555;
    text-transform: uppercase;
    margin-bottom: 1mm;
  }
  .audit-meta-value {
    display: block;
    font-size: 10.5pt;
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  .audit-personnel { margin-bottom: 4mm; font-size: 10pt; }
  .audit-personnel p { margin: 0 0 2mm; }
  .audit-table-caption {
    font-size: 9.5pt;
    font-weight: 600;
    margin: 0 0 3mm;
  }
  .audit-equipment-table {
    width: 100%;
    max-width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 8.5pt;
    margin-bottom: 4mm;
  }
  .audit-equipment-table th,
  .audit-equipment-table td {
    border: 1px solid #333;
    padding: 1.5mm 1.5mm;
    vertical-align: top;
    word-wrap: break-word;
    overflow-wrap: anywhere;
  }
  .audit-equipment-table th {
    background: #f3f4f6;
    font-weight: 700;
    text-align: center;
    font-size: 8pt;
  }
  .audit-check-box {
    display: inline-block;
    width: 4mm;
    height: 4mm;
    border: 1px solid #333;
  }
  .audit-empty {
    font-style: italic;
    color: #666;
    margin-bottom: 4mm;
  }
  .audit-notes { margin-bottom: 3mm; font-size: 9.5pt; }
  .audit-notes p { margin: 1.5mm 0 0; font-style: italic; }
  .audit-instruction {
    font-size: 9pt;
    color: #444;
    margin: 0 0 6mm;
  }
  .audit-signatures { margin-top: 6mm; font-size: 10pt; }
  .audit-signatures p { margin: 0 0 4mm; }
`;
