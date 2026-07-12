/*
 * A4 print layout for inventory start order
 */
import React from 'react';
import { useTranslation } from '../utils/i18n';
import { formatAuditScopeLabel, type AuditStartDocParams } from '../utils/auditDocuments';
import { resolveDocumentOrganizationName } from '../utils/documentHeader';

import { chunkAuditEquipmentRows } from '../utils/auditPrintPagination';

interface AuditStartPrintDocumentProps {
  params: AuditStartDocParams;
  workspaceName?: string;
  objects?: { id: string; name: string }[];
  /** Split long equipment lists into visual A4 pages for on-screen preview. */
  previewPaginated?: boolean;
}

function AuditEquipmentTable({
  rows,
  t,
}: {
  rows: AuditStartDocParams['equipmentRows'];
  t: (key: string) => string;
}) {
  return (
    <table className="audit-equipment-table">
      <colgroup>
        <col style={{ width: '4%' }} />
        <col style={{ width: '12%' }} />
        <col style={{ width: '28%' }} />
        <col style={{ width: '14%' }} />
        <col style={{ width: '24%' }} />
        <col style={{ width: '9%' }} />
        <col style={{ width: '9%' }} />
      </colgroup>
      <thead>
        <tr>
          <th>№</th>
          <th>{t('Категория')}</th>
          <th>{t('Наименование / Модель')}</th>
          <th>{t('Инв. номер')}</th>
          <th>{t('Ответственный')}</th>
          <th>{t('Есть')}</th>
          <th>{t('Нет')}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.index}>
            <td className="text-center tabular-nums">{row.index}</td>
            <td>{t(row.category)}</td>
            <td>{row.model}</td>
            <td className="font-mono text-[9pt]">{row.inventory}</td>
            <td>{row.responsible}</td>
            <td className="text-center">
              <span className="audit-check-box" aria-hidden />
            </td>
            <td className="text-center">
              <span className="audit-check-box" aria-hidden />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function AuditStartPrintDocument({
  params,
  workspaceName,
  objects = [],
  previewPaginated = false,
}: AuditStartPrintDocumentProps) {
  const { t, language } = useTranslation();
  const org =
    resolveDocumentOrganizationName(workspaceName || params.workspaceName) ||
    'ООО "Глобал-Консалт ИТ"';
  const scopeLabel = formatAuditScopeLabel(params.location, language, objects);
  const notSpecified = t('Не указан');

  const auditIdLabel = params.auditId.replace(/^aud-/i, 'AUD-').toUpperCase();
  const title = t('ВЕДОМОСТЬ НАЧАЛА ИНВЕНТАРИЗАЦИИ № ИНВ-СТ-{id}').replace('{id}', auditIdLabel);
  const rowPages = previewPaginated
    ? chunkAuditEquipmentRows(params.equipmentRows)
    : [params.equipmentRows];

  const renderHeader = () => (
    <>
      <h1 className="audit-doc-title">{title}</h1>
      <div className="audit-meta-grid">
        <div>
          <span className="audit-meta-label">{t('Организация')}</span>
          <span className="audit-meta-value">{org}</span>
        </div>
        <div>
          <span className="audit-meta-label">{t('Дата начала инвентаризации')}</span>
          <span className="audit-meta-value">{params.date}</span>
        </div>
        <div className="audit-meta-wide">
          <span className="audit-meta-label">{t('Объект проведения')}</span>
          <span className="audit-meta-value">{scopeLabel}</span>
        </div>
      </div>
      <div className="audit-personnel">
        <p>
          <strong>{t('Проводит инвентаризацию:')}</strong> {params.conductorUser || notSpecified}
        </p>
        <p>
          <strong>{t('Принимает инвентаризацию:')}</strong> {params.controllerUser || notSpecified}
        </p>
        <p>
          <strong>{t('Ответственный за базу учёта:')}</strong> {params.responsibleUser || notSpecified}
        </p>
      </div>
    </>
  );

  const renderFooter = () => (
    <>
      {params.startNotes && (
        <div className="audit-notes">
          <strong>{t('Основание / распоряжение:')}</strong>
          <p>{params.startNotes}</p>
        </div>
      )}
      <p className="audit-instruction">
        {t('При физической сверке отметьте в графах «Есть» или «Нет» фактическое наличие каждой единицы.')}
      </p>
      <div className="audit-signatures">
        <p>
          {t('Проводит инвентаризацию:')} ___________ / {params.conductorUser || notSpecified} /
        </p>
        <p>
          {t('Принимает инвентаризацию:')} ___________ / {params.controllerUser || notSpecified} /
        </p>
        <p>
          {t('Ответственный за учёт:')} ___________ / {params.responsibleUser || notSpecified} /
        </p>
      </div>
    </>
  );

  if (previewPaginated && rowPages.length > 1) {
    return (
      <div className="audit-preview-pages">
        {rowPages.map((pageRows, pageIndex) => (
          <div key={`audit-page-${pageIndex}`} className="audit-a4-sheet audit-preview-page text-slate-900">
            {pageIndex === 0 ? renderHeader() : (
              <h2 className="audit-doc-title audit-doc-title--continued">{title}</h2>
            )}
            <p className="audit-table-caption">
              {pageIndex === 0
                ? t('Перечень оборудования к проверке (отметить «Есть» или «Нет» напротив каждой позиции):')
                : t('Перечень оборудования (продолжение):')}
            </p>
            {pageRows.length === 0 ? (
              <p className="audit-empty">{t('На данном объекте нет зарегистрированного оборудования')}</p>
            ) : (
              <AuditEquipmentTable rows={pageRows} t={t} />
            )}
            {pageIndex === rowPages.length - 1 ? renderFooter() : null}
            <p className="audit-page-number no-print">{t('Страница {n} из {total}').replace('{n}', String(pageIndex + 1)).replace('{total}', String(rowPages.length))}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="audit-a4-sheet text-slate-900">
      {renderHeader()}

      <p className="audit-table-caption">{t('Перечень оборудования к проверке (отметить «Есть» или «Нет» напротив каждой позиции):')}</p>

      {params.equipmentRows.length === 0 ? (
        <p className="audit-empty">{t('На данном объекте нет зарегистрированного оборудования')}</p>
      ) : (
        <AuditEquipmentTable rows={params.equipmentRows} t={t} />
      )}

      {renderFooter()}
    </div>
  );
}
