/*
 * Printable act document body — live preview and print target.
 */
import React from 'react';
import { ComputerItem, EmployeeItem, NetworkDevice, SystemUser } from '../types';
import { useTranslation } from '../utils/i18n';
import { hasActiveDocumentHeader } from '../utils/documentHeader';
import { formatClauseNumber, type ActFormState } from '../utils/actDraft';
import { formatPersonShortName } from '../utils/personName';
import { getDocStatusBadgeClass } from '../utils/docStatus';
import { getDeviceSerialDisplayLines } from '../utils/equipmentFields';
import DocumentPrintShell from './DocumentPrintShell';
import DocStampSeal from './DocStampSeal';

function equipmentCategoryLabel(
  c: { category: string; deviceType?: string },
  t: (key: string) => string
): string {
  const category = t(c.category);
  const deviceType = c.deviceType ? t(c.deviceType) : '';
  if (deviceType && deviceType !== category) {
    return `${category} / ${deviceType}`;
  }
  return category;
}

function equipmentDescriptionLabel(c: {
  category: string;
  deviceType?: string;
  replacedComponents?: unknown[];
}): string {
  return (c.deviceType?.trim() || c.category?.trim() || '—');
}

export type ActItemType = 'computer' | 'employee' | 'object' | 'network' | 'warehouse';

export interface ActPrintContentProps {
  itemType: ActItemType;
  item: Record<string, unknown>;
  form: ActFormState;
  computers: ComputerItem[];
  employees: EmployeeItem[];
  networkDevices: NetworkDevice[];
  currentUser?: SystemUser | null;
  workspaceName?: string;
}

export default function ActPrintContent({
  itemType,
  item,
  form,
  computers,
  employees,
  networkDevices,
  currentUser,
  workspaceName,
}: ActPrintContentProps) {
  const { t } = useTranslation();
  const {
    actNumber,
    actDate,
    actCompany,
    actSub,
    actSender,
    actSenderSub,
    releasedBy,
    actReceiver,
    actReceiverSub,
    clauses,
  } = form;

  const signerName = formatPersonShortName(releasedBy || currentUser?.name || 'Администратор ИТ');

  return (
    <DocumentPrintShell>
      {!hasActiveDocumentHeader() && (actCompany || actSub) && (
        <div className="doc-fallback-header">
          {actCompany && <span className="doc-fallback-header-title">{actCompany}</span>}
          {actSub && <span className="doc-fallback-header-sub">{actSub}</span>}
        </div>
      )}
      <div className="doc-act-meta-row">
        <span className="doc-act-meta-left">
          {itemType === 'object' ? t('ПАСПОРТ ИНВЕНТАРЯ') : `${t('АКТ №')} ${actNumber}`}
        </span>
        <span className="doc-act-meta-right">
          {itemType === 'object' ? t('Дата выгрузки') : t('Дата выдачи')}: {actDate}
        </span>
      </div>

      {itemType === 'object' ? (
        <ObjectActBody
          item={item}
          computers={computers}
          employees={employees}
          networkDevices={networkDevices}
          signerName={signerName}
          workspaceName={workspaceName}
          t={t}
        />
      ) : itemType === 'employee' ? (
        <EmployeeActBody
          item={item}
          computers={computers}
          actReceiver={actReceiver}
          actReceiverSub={actReceiverSub}
          clauses={clauses}
          signerName={signerName}
          workspaceName={workspaceName}
          t={t}
        />
      ) : itemType === 'warehouse' ? (
        <WarehouseActBody
          item={item}
          actSender={actSender}
          actSenderSub={actSenderSub}
          actReceiver={actReceiver}
          actReceiverSub={actReceiverSub}
          clauses={clauses}
          signerName={signerName}
          workspaceName={workspaceName}
          t={t}
        />
      ) : (
        <DeviceActBody
          item={item}
          actSender={actSender}
          actSenderSub={actSenderSub}
          actReceiver={actReceiver}
          actReceiverSub={actReceiverSub}
          clauses={clauses}
          signerName={signerName}
          workspaceName={workspaceName}
          t={t}
        />
      )}
    </DocumentPrintShell>
  );
}

function ClausesBlock({ clauses, t }: { clauses: string[]; t: (s: string) => string }) {
  if (clauses.length === 0) return null;
  return (
    <div className="doc-clauses">
      {clauses.map((text, idx) => (
        <p key={idx}>{formatClauseNumber(text, idx + 1)}</p>
      ))}
    </div>
  );
}

function DocPrintTable({
  colWidths,
  className = '',
  children,
}: {
  colWidths?: string[];
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <table
      className={`doc-equipment-table${className ? ` ${className}` : ''}`}
      border={1}
      cellSpacing={0}
      cellPadding={0}
    >
      {colWidths && colWidths.length > 0 && (
        <colgroup>
          {colWidths.map((width, index) => (
            <col key={index} style={{ width }} />
          ))}
        </colgroup>
      )}
      {children}
    </table>
  );
}

const DOC_TABLE_COLS = {
  employeeEquipment: ['6%', '24%', '26%', '22%', '22%'],
  objectEmployeeEquipment: ['28%', '28%', '22%', '22%'],
  objectFullInventory: ['16%', '22%', '18%', '22%', '22%'],
  warehouseDetails: ['34%', '66%'],
  warehouseSerial: ['10%', '90%'],
  deviceReplacement: ['14%', '22%', '32%', '32%'],
} as const;

function DocSection({
  title,
  children,
  pageStart = false,
}: {
  title: string;
  children: React.ReactNode;
  pageStart?: boolean;
}) {
  return (
    <section className={`doc-section${pageStart ? ' doc-section--page-start' : ''}`}>
      <div className="doc-section-head">
        <h2 className="doc-section-title">{title}</h2>
      </div>
      <div className="doc-section-body">{children}</div>
    </section>
  );
}

function DocClosingSection({
  workspaceName,
  children,
}: {
  workspaceName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="doc-closing-block">
      <div className="doc-closing-block__inner">
        {children}
        <DocStampSeal workspaceName={workspaceName} />
      </div>
    </div>
  );
}

function SignaturesBlock({
  leftLabel,
  rightLabel,
  signerName,
  actReceiver,
  t,
}: {
  leftLabel: string;
  rightLabel: string;
  signerName: string;
  actReceiver: string;
  t: (s: string) => string;
}) {
  return (
    <div className="doc-signatures-grid">
      <div>
        <span className="doc-signature-label">{leftLabel}</span>
        <div className="doc-signature-line">
          <span className="doc-signature-hint">{t('подпись')}</span>
          <span className="doc-signature-name">___________ / {signerName}</span>
        </div>
      </div>
      <div>
        <span className="doc-signature-label">{rightLabel}</span>
        <div className="doc-signature-line">
          <span className="doc-signature-hint">{t('подпись')}</span>
          <span className="doc-signature-name">___________ / {actReceiver}</span>
        </div>
      </div>
    </div>
  );
}

function EmployeeActBody({
  item,
  computers,
  actReceiver,
  actReceiverSub,
  clauses,
  signerName,
  workspaceName,
  t,
}: {
  item: Record<string, unknown>;
  computers: ComputerItem[];
  actReceiver: string;
  actReceiverSub: string;
  clauses: string[];
  signerName: string;
  workspaceName?: string;
  t: (s: string) => string;
}) {
  const itemName = item.name as string;
  const empComps = computers.filter(c => c.employeeName === itemName);

  return (
    <div className="doc-block">
      <div className="doc-act-title-block">
        <h1>{t('Паспорт Закрепления ИТ-Оборудования')}</h1>
        <p>{t('Карточка учета ТМЦ и акты приема-передачи во временное служебное пользование')}</p>
      </div>

      <div className="doc-info-panel">
        <div>
          <span className="doc-info-label">{t('Сотрудник (Получатель)')}</span>
          <strong className="doc-info-value">{actReceiver}</strong>
          <span className="doc-info-sub">{actReceiverSub}</span>
        </div>
        <div className="doc-info-panel-col--right">
          <span className="doc-info-label">{t('Всего числится')}</span>
          <span className="doc-info-count">
            {empComps.length} {t('устр.')}
          </span>
        </div>
      </div>

      <DocSection title={t('1. Спецификация закрепленных технических средств (ТМЦ)')}>
        {empComps.length === 0 ? (
          <p className="doc-empty-note">
            {t('За данным сотрудником в системе не зарегистрировано персональное ИТ-оборудование.')}
          </p>
        ) : (
          <DocPrintTable colWidths={[...DOC_TABLE_COLS.employeeEquipment]}>
            <thead>
              <tr>
                <th className="col-num">№</th>
                <th className="col-model">{t('Модель')}</th>
                <th className="col-desc">{t('Описание')}</th>
                <th className="col-inv">{t('Инвентарный №')}</th>
                <th className="doc-status-cell">{t('Статус')}</th>
              </tr>
            </thead>
            <tbody>
              {empComps.map((c, idx) => (
                <tr key={c.id}>
                  <td className="col-num">{idx + 1}</td>
                  <td className="col-model">{c.model || '—'}</td>
                  <td className="col-desc">
                    {equipmentDescriptionLabel(c)}
                    {c.replacedComponents && c.replacedComponents.length > 0 && (
                      <div className="doc-table-note">
                        {t('* Модернизировано (память, SSD)')}
                      </div>
                    )}
                  </td>
                  <td className="col-inv">{c.inventoryNumber}</td>
                  <td className="doc-status-cell">
                    <span className={getDocStatusBadgeClass(c.status)}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </DocPrintTable>
        )}
      </DocSection>

      <ClausesBlock clauses={clauses} t={t} />
      <DocClosingSection workspaceName={workspaceName}>
        <SignaturesBlock
          leftLabel={t('Отпустил (Сдал) Администратор:')}
          rightLabel={t('Принял на баланс Получатель:')}
          signerName={signerName}
          actReceiver={actReceiver}
          t={t}
        />
      </DocClosingSection>
    </div>
  );
}

function WarehouseActBody({
  item,
  actSender,
  actSenderSub,
  actReceiver,
  actReceiverSub,
  clauses,
  signerName,
  workspaceName,
  t,
}: {
  item: Record<string, unknown>;
  actSender: string;
  actSenderSub: string;
  actReceiver: string;
  actReceiverSub: string;
  clauses: string[];
  signerName: string;
  workspaceName?: string;
  t: (s: string) => string;
}) {
  const qty = Math.max(1, Number(item.quantity) || 1);
  const serialLines = getDeviceSerialDisplayLines({
    serialNumber: item.serialNumber as string | undefined,
    unitSerialNumbers: item.unitSerialNumbers as string[] | undefined,
    quantity: qty,
  });
  const itemTypeLabel = item.type ? t(String(item.type)) : t('Склад IT');

  return (
    <div className="doc-block">
      <div className="doc-act-title-block">
        <h1>{t('Акт Приема-Передачи ИТ-Оборудования')}</h1>
        <p>{t('передача партии ТМЦ со склада')}</p>
      </div>

      <div className="doc-info-panel">
        <div>
          <span className="doc-info-label">{t('Передающая Сторона')}</span>
          <strong className="doc-info-value">{actSender || t('Основной склад ИТ')}</strong>
          <span className="doc-info-sub">{actSenderSub || itemTypeLabel}</span>
        </div>
        <div>
          <span className="doc-info-label">{t('Получающая Сторона (Сотрудник)')}</span>
          <strong className="doc-info-value">{actReceiver}</strong>
          <span className="doc-info-sub">{actReceiverSub}</span>
        </div>
      </div>

      <DocSection title={t('1. Сведения о передаваемой партии')}>
        <DocPrintTable colWidths={[...DOC_TABLE_COLS.warehouseDetails]} className="doc-details-table">
          <tbody>
            <tr>
              <th>{t('Наименование / Модель:')}</th>
              <td className="doc-info-value doc-cell-value">{item.name as string || item.model as string || t('Базовое ИТ-оборудование')}</td>
            </tr>
            <tr>
              <th>{t('Категория:')}</th>
              <td>{itemTypeLabel}</td>
            </tr>
            <tr>
              <th>{t('Инвентарный номер ТМЦ:')}</th>
              <td className="mono">{(item.inventoryNumber as string) || t('ИНВ-НЕУКАЗАН')}</td>
            </tr>
            <tr>
              <th>{t('Количество:')}</th>
              <td>
                {qty} {t('шт.')}
              </td>
            </tr>
            <tr>
              <th>{t('Склад хранения:')}</th>
              <td>{t(String(item.warehouseName || 'Основной склад ИТ'))}</td>
            </tr>
          </tbody>
        </DocPrintTable>

        {serialLines.length > 0 && (
          <DocPrintTable colWidths={[...DOC_TABLE_COLS.warehouseSerial]} className="doc-serial-table">
            <thead>
              <tr>
                <th className="col-num">{t('№')}</th>
                <th>{t('Серийный номер')}</th>
              </tr>
            </thead>
            <tbody>
              {serialLines.map((sn, idx) => (
                <tr key={`${sn}-${idx}`}>
                  <td className="col-num">{idx + 1}</td>
                  <td className="mono">{sn || t('SN-НЕУКАЗАН')}</td>
                </tr>
              ))}
            </tbody>
          </DocPrintTable>
        )}
      </DocSection>

      <ClausesBlock clauses={clauses} t={t} />
      <DocClosingSection workspaceName={workspaceName}>
        <SignaturesBlock
          leftLabel={t('Отпустил (Сдал) Администратор:')}
          rightLabel={t('Принял на баланс Получатель:')}
          signerName={signerName}
          actReceiver={actReceiver}
          t={t}
        />
      </DocClosingSection>
    </div>
  );
}

function DeviceActBody({
  item,
  actSender,
  actSenderSub,
  actReceiver,
  actReceiverSub,
  clauses,
  signerName,
  workspaceName,
  t,
}: {
  item: Record<string, unknown>;
  actSender: string;
  actSenderSub: string;
  actReceiver: string;
  actReceiverSub: string;
  clauses: string[];
  signerName: string;
  workspaceName?: string;
  t: (s: string) => string;
}) {
  const replacedComponents = item.replacedComponents as { id: string; date: string; name: string; oldDetails: string; newDetails: string }[] | undefined;

  return (
    <div className="doc-block">
      <div className="doc-act-title-block">
        <h1>{t('Акт Приема-Передачи ИТ-Оборудования')}</h1>
        <p>{t('во временное служебное пользование сотруднику компании')}</p>
      </div>

      <div className="doc-info-panel">
        <div>
          <span className="doc-info-label">{t('Передающая Сторона')}</span>
          <strong className="doc-info-value">{actSender}</strong>
          <span className="doc-info-sub">{actSenderSub}</span>
        </div>
        <div>
          <span className="doc-info-label">{t('Получающая Сторона (Сотрудник)')}</span>
          <strong className="doc-info-value">{actReceiver}</strong>
          <span className="doc-info-sub">{actReceiverSub}</span>
        </div>
      </div>

      <DocSection title={t('1. Сведения о передаваемом оборудовании')}>
        <DocPrintTable colWidths={[...DOC_TABLE_COLS.warehouseDetails]} className="doc-details-table">
          <tbody>
            <tr>
              <th>{t('Наименование / Модель:')}</th>
              <td className="doc-info-value doc-cell-value">
                {(item.name as string) || (item.model as string) || (item.deviceName as string) || 'Базовое ИТ-оборудование'}
              </td>
            </tr>
            <tr>
              <th>{t('Инвентарный номер ТМЦ:')}</th>
              <td className="mono">{(item.inventoryNumber as string) || 'ИНВ-НЕУКАЗАН'}</td>
            </tr>
            {item.deviceType !== 'Картриджи' && (
              <tr>
                <th>{t('Серийный номер:')}</th>
                <td className="mono">{(item.serialNumber as string) || 'SN-НЕУКАЗАН'}</td>
              </tr>
            )}
            <tr>
              <th>{t('Размещение / Объект:')}</th>
              <td>{(item.objectLocation as string) || (item.placementLocation as string) || 'Корпоративный Склад'}</td>
            </tr>
            {item.cpu && (
              <tr>
                <th>{t('Действующая конфигурация:')}</th>
                <td>
                  Процессор: {item.cpu as string} • ОЗУ: {item.ram as string} • Накопитель: {item.storage as string} ({(item.os as string) || 'Служебная ОС'})
                </td>
              </tr>
            )}
          </tbody>
        </DocPrintTable>
      </DocSection>

      {replacedComponents && replacedComponents.length > 0 && (
        <DocSection
          title={t('2. История замен комплектующих и модернизаций')}
          pageStart={replacedComponents.length > 4}
        >
          <DocPrintTable colWidths={[...DOC_TABLE_COLS.deviceReplacement]}>
            <thead>
              <tr>
                <th className="col-date">{t('Дата')}</th>
                <th>{t('Название замены')}</th>
                <th>{t('Предыдущая деталь')}</th>
                <th>{t('Действующая деталь')}</th>
              </tr>
            </thead>
            <tbody>
              {replacedComponents.map(comp => (
                <tr key={comp.id}>
                  <td className="mono col-date">{comp.date}</td>
                  <td className="doc-cell-bold">{comp.name}</td>
                  <td className="doc-cell-muted">{comp.oldDetails}</td>
                  <td className="doc-cell-bold">{comp.newDetails}</td>
                </tr>
              ))}
            </tbody>
          </DocPrintTable>
        </DocSection>
      )}

      <ClausesBlock clauses={clauses} t={t} />
      <DocClosingSection workspaceName={workspaceName}>
        <SignaturesBlock
          leftLabel={t('Отпустил (Сдал) Администратор:')}
          rightLabel={t('Принял на баланс Получатель:')}
          signerName={signerName}
          actReceiver={actReceiver}
          t={t}
        />
      </DocClosingSection>
    </div>
  );
}

function ObjectActBody({
  item,
  computers,
  employees,
  networkDevices,
  signerName,
  workspaceName,
  t,
}: {
  item: Record<string, unknown>;
  computers: ComputerItem[];
  employees: EmployeeItem[];
  networkDevices: NetworkDevice[];
  signerName: string;
  workspaceName?: string;
  t: (s: string) => string;
}) {
  const objectName = item.name as string;
  const objComputers = computers.filter(c => c.objectName === objectName);
  const objNetwork = networkDevices.filter(n => n.objectName === objectName);
  const assignedNames = Array.from(
    new Set(
      objComputers
        .map(c => c.employeeName)
        .filter(name => name && name !== 'Свободен' && name !== 'Склад' && name.trim() !== '')
    )
  );

  return (
    <>
      <div className="doc-block">
        <div className="doc-act-title-block">
          <h1>{t('Паспорт ИТ-Инвентаря и Учета Объезда')}</h1>
          <p>
            {t('Сводная ведомость по сотрудникам и прикрепленному оборудованию филиала:')}{' '}
            <strong>{objectName}</strong>
          </p>
        </div>

        <div className="doc-info-panel">
          <div>
            <span className="doc-info-label">{t('Объект / Филиал')}</span>
            <strong className="doc-info-value">{objectName}</strong>
            <span className="doc-info-sub">{item.address as string}</span>
          </div>
          <div className="doc-info-panel-col--right doc-object-stats">
            <div>
              <span className="doc-info-label">{t('Компьютеров')}</span>
              <span className="doc-object-stat-value doc-object-stat-value--blue">
                {computers.filter(c => c.objectName === objectName && c.category !== 'Видеонаблюдение').length} шт.
              </span>
            </div>
            <div>
              <span className="doc-info-label">{t('Сетевых систем')}</span>
              <span className="doc-object-stat-value doc-object-stat-value--green">
                {networkDevices.filter(n => n.objectName === objectName).reduce((sum, d) => sum + d.quantity, 0)} шт.
              </span>
            </div>
            <div>
              <span className="doc-info-label">{t('Видеонаблюдение')}</span>
              <span className="doc-object-stat-value doc-object-stat-value--indigo">
                {computers.filter(c => c.objectName === objectName && c.category === 'Видеонаблюдение').length} шт.
              </span>
            </div>
          </div>
        </div>
      </div>

      <DocSection title={t('1. Выписка по сотрудникам и закрепленному оборудованию')}>
        {assignedNames.length === 0 ? (
          <p className="doc-empty-note">
            {t('На данном объекте нет сотрудников с персонально закрепленным оборудованием.')}
          </p>
        ) : (
          assignedNames.map((name, index) => {
            const emp = employees.find(e => e.name === name);
            const empComps = objComputers.filter(c => c.employeeName === name);
            return (
              <div key={index} className="doc-employee-block">
                <div className="doc-employee-block-title">
                  <span>{name}</span>
                  <span className="doc-employee-block-meta">
                    {emp?.position || 'Штатный сотрудник'} • {emp?.department || 'Не указан'}
                  </span>
                </div>
                <DocPrintTable colWidths={[...DOC_TABLE_COLS.objectEmployeeEquipment]}>
                  <thead>
                    <tr>
                      <th className="col-model">{t('Модель')}</th>
                      <th className="col-desc">{t('Описание')}</th>
                      <th className="col-inv">{t('Инвентарный №')}</th>
                      <th className="doc-status-cell">{t('Статус')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empComps.map(ec => (
                      <tr key={ec.id}>
                        <td className="col-model">{ec.model || '—'}</td>
                        <td className="col-desc">{equipmentDescriptionLabel(ec)}</td>
                        <td className="col-inv">{ec.inventoryNumber}</td>
                        <td className="doc-status-cell">
                          <span className={getDocStatusBadgeClass(ec.status)}>{ec.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </DocPrintTable>
              </div>
            );
          })
        )}
      </DocSection>

      <DocSection
        title={t('2. Полный перечень ИТ-оборудования и инфраструктуры объекта')}
        pageStart
      >
        {objComputers.length === 0 && objNetwork.length === 0 ? (
          <p className="doc-empty-note">
            {t('Зарегистрированное оборудование отсутствует на данном объекте.')}
          </p>
        ) : (
          <DocPrintTable colWidths={[...DOC_TABLE_COLS.objectFullInventory]}>
            <thead>
              <tr>
                <th className="col-cat">{t('Категория / Тип')}</th>
                <th className="col-model">{t('Модель / Описание')}</th>
                <th className="col-inv">{t('Инв. № / IP адрес')}</th>
                <th className="col-spec">{t('Спецификация')}</th>
                <th className="col-emp-status">{t('Сотрудник / Статус')}</th>
              </tr>
            </thead>
            <tbody>
              {objComputers.map(c => (
                <tr key={c.id}>
                  <td className="col-cat">{equipmentCategoryLabel(c, t)}</td>
                  <td className="col-model">{c.model}</td>
                  <td className="col-inv">{c.inventoryNumber}</td>
                  <td className="col-spec">{c.deviceType || 'Базовая техника'}</td>
                  <td className="col-emp-status">
                    <div className="doc-cell-bold">
                      {c.employeeName && c.employeeName !== 'Свободен' && c.employeeName !== 'Склад' ? c.employeeName : 'Общее / Резерв'}
                    </div>
                    <span className={getDocStatusBadgeClass(c.status)}>{c.status}</span>
                  </td>
                </tr>
              ))}
              {objNetwork.map(n => (
                <tr key={n.id}>
                  <td className="col-cat">{t('Сеть')} ({n.type})</td>
                  <td className="col-model doc-cell-bold">{n.deviceName}</td>
                  <td className="col-inv doc-col-inv-ip">{n.ipAddress || 'DHCP/Авто'}</td>
                  <td className="col-spec">
                    Количество: {n.quantity} шт. {n.portsCount ? `(${n.portsCount} портов)` : ''}
                  </td>
                  <td className="col-emp-status doc-cell-semibold">{t('Инфраструктура объекта')}</td>
                </tr>
              ))}
            </tbody>
          </DocPrintTable>
        )}
      </DocSection>

      <p className="doc-footnote">
        {t('* Данная ведомость является официальным внутренним документом ИТ-инвентаризации. Все прикрепленные устройства находятся в зоне ответственности закрепленных за ними сотрудников, либо под общим контролем материально-ответственного лица данного подразделения. Любые перемещения техники должны быть согласованы с администрацией.')}
      </p>

      <DocClosingSection workspaceName={workspaceName}>
        <SignaturesBlock
          leftLabel={t('Выгрузку произвел Администратор:')}
          rightLabel={t('Согласовано Руководитель объекта:')}
          signerName={signerName}
          actReceiver="_________________"
          t={t}
        />
      </DocClosingSection>
    </>
  );
}
