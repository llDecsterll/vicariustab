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
import DocumentPrintShell from './DocumentPrintShell';

function equipmentCategoryLabel(c: { category: string; deviceType?: string }): string {
  if (c.deviceType && c.deviceType !== c.category) {
    return `${c.category} / ${c.deviceType}`;
  }
  return c.category;
}

function equipmentDescriptionLabel(c: {
  category: string;
  deviceType?: string;
  replacedComponents?: unknown[];
}): string {
  return (c.deviceType?.trim() || c.category?.trim() || '—');
}

export type ActItemType = 'computer' | 'employee' | 'object' | 'network';

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
          {itemType === 'object' ? t('ПАСПОРТ ИНВЕНТАРЯ') : `АКТ № ${actNumber}`}
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
  t,
}: {
  item: Record<string, unknown>;
  computers: ComputerItem[];
  actReceiver: string;
  actReceiverSub: string;
  clauses: string[];
  signerName: string;
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

      <div className="doc-block">
        <span className="doc-section-title">{t('1. Спецификация закрепленных технических средств (ТМЦ)')}</span>
        {empComps.length === 0 ? (
          <p className="doc-empty-note">
            {t('За данным сотрудником в системе не зарегистрировано персональное ИТ-оборудование.')}
          </p>
        ) : (
          <table className="doc-equipment-table">
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
                      <div style={{ fontSize: '7pt', fontStyle: 'italic', color: '#94a3b8', marginTop: '1mm' }}>
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
          </table>
        )}
      </div>

      <ClausesBlock clauses={clauses} t={t} />
      <SignaturesBlock
        leftLabel={t('Отпустил (Сдал) Администратор:')}
        rightLabel={t('Принял на баланс Получатель:')}
        signerName={signerName}
        actReceiver={actReceiver}
        t={t}
      />
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
  t,
}: {
  item: Record<string, unknown>;
  actSender: string;
  actSenderSub: string;
  actReceiver: string;
  actReceiverSub: string;
  clauses: string[];
  signerName: string;
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

      <div className="doc-block">
        <span className="doc-section-title">{t('1. Сведения о передаваемом оборудовании')}</span>
        <table className="doc-equipment-table doc-details-table">
          <tbody>
            <tr>
              <th>{t('Наименование / Модель:')}</th>
              <td className="doc-info-value" style={{ fontSize: '9pt' }}>
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
        </table>
      </div>

      {replacedComponents && replacedComponents.length > 0 && (
        <div className="doc-block">
          <span className="doc-section-title">{t('2. История замен комплектующих и модернизаций')}</span>
          <table className="doc-equipment-table">
            <thead>
              <tr>
                <th>{t('Дата')}</th>
                <th>{t('Название замены')}</th>
                <th>{t('Предыдущая деталь')}</th>
                <th>{t('Действующая деталь')}</th>
              </tr>
            </thead>
            <tbody>
              {replacedComponents.map(comp => (
                <tr key={comp.id}>
                  <td className="mono">{comp.date}</td>
                  <td style={{ fontWeight: 700 }}>{comp.name}</td>
                  <td style={{ fontStyle: 'italic', color: '#64748b' }}>{comp.oldDetails}</td>
                  <td style={{ fontWeight: 700 }}>{comp.newDetails}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ClausesBlock clauses={clauses} t={t} />
      <SignaturesBlock
        leftLabel={t('Отпустил (Сдал) Администратор:')}
        rightLabel={t('Принял на баланс Получатель:')}
        signerName={signerName}
        actReceiver={actReceiver}
        t={t}
      />
    </div>
  );
}

function ObjectActBody({
  item,
  computers,
  employees,
  networkDevices,
  signerName,
  t,
}: {
  item: Record<string, unknown>;
  computers: ComputerItem[];
  employees: EmployeeItem[];
  networkDevices: NetworkDevice[];
  signerName: string;
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

      <div className="doc-block">
        <span className="doc-section-title">{t('1. Выписка по сотрудникам и закрепленному оборудованию')}</span>
        {assignedNames.length === 0 ? (
          <p className="doc-empty-note">
            {t('На данном объекте нет сотрудников с персонально закрепленным оборудованием.')}
          </p>
        ) : (
          <>
            {assignedNames.map((name, index) => {
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
                  <table className="doc-equipment-table">
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
                  </table>
                </div>
              );
            })}
          </>
        )}
      </div>

      <div className="doc-block">
        <span className="doc-section-title">{t('2. Полный перечень ИТ-оборудования и инфраструктуры объекта')}</span>
        {objComputers.length === 0 && objNetwork.length === 0 ? (
          <p className="doc-empty-note">
            {t('Зарегистрированное оборудование отсутствует на данном объекте.')}
          </p>
        ) : (
          <table className="doc-equipment-table">
            <thead>
              <tr>
                <th className="col-cat">{t('Категория / Тип')}</th>
                <th className="col-model">{t('Модель / Описание')}</th>
                <th className="col-inv">{t('Инв. № / IP адрес')}</th>
                <th>{t('Спецификация')}</th>
                <th>{t('Сотрудник / Статус')}</th>
              </tr>
            </thead>
            <tbody>
              {objComputers.map(c => (
                <tr key={c.id}>
                  <td className="col-cat">{equipmentCategoryLabel(c)}</td>
                  <td className="col-model">{c.model}</td>
                  <td className="col-inv">{c.inventoryNumber}</td>
                  <td>{c.deviceType || 'Базовая техника'}</td>
                  <td>
                    <div style={{ fontWeight: 700 }}>
                      {c.employeeName && c.employeeName !== 'Свободен' && c.employeeName !== 'Склад' ? c.employeeName : 'Общее / Резерв'}
                    </div>
                    <span className={getDocStatusBadgeClass(c.status)}>{c.status}</span>
                  </td>
                </tr>
              ))}
              {objNetwork.map(n => (
                <tr key={n.id}>
                  <td className="col-cat">{t('Сеть')} ({n.type})</td>
                  <td className="col-model" style={{ fontWeight: 700 }}>{n.deviceName}</td>
                  <td className="col-inv" style={{ color: '#059669', fontWeight: 700 }}>{n.ipAddress || 'DHCP/Авто'}</td>
                  <td>
                    Количество: {n.quantity} шт. {n.portsCount ? `(${n.portsCount} портов)` : ''}
                  </td>
                  <td style={{ fontWeight: 600 }}>{t('Инфраструктура объекта')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="doc-footnote">
        {t('* Данная ведомость является официальным внутренним документом ИТ-инвентаризации. Все прикрепленные устройства находятся в зоне ответственности закрепленных за ними сотрудников, либо под общим контролем материально-ответственного лица данного подразделения. Любые перемещения техники должны быть согласованы с администрацией.')}
      </p>

      <SignaturesBlock
        leftLabel={t('Выгрузку произвел Администратор:')}
        rightLabel={t('Согласовано Руководитель объекта:')}
        signerName={signerName}
        actReceiver="_________________"
        t={t}
      />
    </div>
  );
}
