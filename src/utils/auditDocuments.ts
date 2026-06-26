import type { ComputerItem, InventoryAudit, NetworkDevice } from '../types';
import type { Language } from './i18n';
import { buildDocumentHeaderPlainText, resolveDocumentOrganizationName } from './documentHeader';
import {
  buildAuditChecklist,
  filterAuditScopeEquipment,
  isAllObjectsScope,
  isNumericLegacyAuditRef,
  resolveAuditObjectDisplayName,
  resolveAuditPersonName,
} from './auditInventory';

export interface AuditEquipmentRow {
  index: number;
  category: string;
  model: string;
  inventory: string;
  responsible: string;
}

export interface AuditStartDocParams {
  auditId: string;
  date: string;
  workspaceName: string;
  location: string;
  controllerUser: string;
  conductorUser: string;
  responsibleUser: string;
  startNotes: string;
  equipmentRows: AuditEquipmentRow[];
}

export interface AuditConclusionDocParams {
  auditId: string;
  date: string;
  workspaceName: string;
  objectName: string;
  controllerUser: string;
  conductorUser: string;
  responsibleUser: string;
  mismatches: number;
  checkedCount: number;
  conclusionNotes: string;
}

function resolveAuditOrg(workspaceName: string | undefined): string {
  return resolveDocumentOrganizationName(workspaceName);
}

function buildEquipmentTable(
  rows: AuditEquipmentRow[],
  emptyLabel: string,
  header: string,
  withPresenceColumns = false
): string {
  if (rows.length === 0) {
    return `   [ ${emptyLabel} ]\n`;
  }
  let table = '---------------------------------------------------------------------------------------------------\n';
  table += header + '\n';
  table += '---------------------------------------------------------------------------------------------------\n';
  for (const row of rows) {
    const num = String(row.index).padEnd(4);
    const cat = row.category.slice(0, 14).padEnd(14);
    const model = row.model.slice(0, 24).padEnd(24);
    const inv = row.inventory.slice(0, 14).padEnd(14);
    const resp = row.responsible.slice(0, 22).padEnd(22);
    if (withPresenceColumns) {
      table += ` ${num}| ${cat} | ${model} | ${inv} | ${resp} | [ ]  | [ ]  \n`;
    } else {
      table += ` ${num}| ${cat} | ${model} | ${inv} | ${resp}\n`;
    }
  }
  table += '---------------------------------------------------------------------------------------------------\n';
  return table;
}

export function formatAuditScopeLabel(
  location: string,
  lang: Language,
  objects: { id: string; name: string }[] = []
): string {
  const resolved = resolveAuditObjectDisplayName(location, objects);
  if (!resolved || isAllObjectsScope(resolved) || isAllObjectsScope(location)) {
    return lang === 'en'
      ? 'Entire organization (all locations)'
      : lang === 'zh'
        ? '全公司（所有地点）'
        : 'Вся компания (все объекты)';
  }
  return resolved;
}

export function buildAuditPrintEquipmentRows(
  audit: Pick<InventoryAudit, 'objectName'>,
  computers: ComputerItem[],
  networkDevices: NetworkDevice[],
  labels: {
    defaultComputer: string;
    defaultNetwork: string;
    itAdmin: string;
    unassigned: string;
  },
  objects: { id: string; name: string }[] = []
): AuditEquipmentRow[] {
  const checklist = buildAuditChecklist(
    audit as InventoryAudit,
    computers,
    networkDevices,
    { defaultComputer: labels.defaultComputer, defaultNetwork: labels.defaultNetwork },
    objects
  );
  const computerMap = new Map(computers.map((c) => [c.id, c]));

  return checklist.map((row, index) => ({
    index: index + 1,
    category: row.category,
    model: row.label,
    inventory: row.inventoryNumber === '—' ? '-' : row.inventoryNumber,
    responsible:
      row.kind === 'computer'
        ? computerMap.get(row.id)?.employeeName || labels.unassigned
        : labels.itAdmin,
  }));
}

export function buildAuditEquipmentRows(
  computers: ComputerItem[],
  networkDevices: NetworkDevice[],
  labels: {
    defaultComputer: string;
    defaultNetwork: string;
    itAdmin: string;
    unassigned: string;
  }
): AuditEquipmentRow[] {
  const rows: AuditEquipmentRow[] = [];
  let index = 1;
  for (const c of computers) {
    if (c.status === 'Списано' || c.status === 'На списание') continue;
    rows.push({
      index: index++,
      category: c.category || labels.defaultComputer,
      model: `${c.deviceType || c.category} ${c.model}`.trim(),
      inventory: c.inventoryNumber || '-',
      responsible: c.employeeName || labels.unassigned,
    });
  }
  for (const n of networkDevices) {
    if (n.status === 'Списано' || n.status === 'На списание') continue;
    const qty = n.quantity || 1;
    rows.push({
      index: index++,
      category: n.type || labels.defaultNetwork,
      model: qty > 1 ? `${n.deviceName} ×${qty}` : n.deviceName,
      inventory: n.inventoryNumber || n.id || '-',
      responsible: labels.itAdmin,
    });
  }
  return rows;
}

export function buildAuditStartDocParams(
  audit: {
    id: string;
    date: string;
    objectName?: string;
    controllerUser?: string;
    conductorUser?: string;
    responsibleUser: string;
    startNotes?: string;
  },
  computers: ComputerItem[],
  networkDevices: NetworkDevice[],
  workspaceName: string,
  labels: {
    defaultComputer: string;
    defaultNetwork: string;
    itAdmin: string;
    unassigned: string;
    allObjects: string;
    allDepartments: string;
  },
  registry?: {
    objects?: { id: string; name: string }[];
    employees?: { id: string; name: string }[];
  }
): AuditStartDocParams {
  const objects = registry?.objects ?? [];
  const employees = registry?.employees ?? [];
  const scopeObjectName = audit.objectName?.trim() || undefined;
  const resolvedScopeName = scopeObjectName
    ? resolveAuditObjectDisplayName(scopeObjectName, objects)
    : '';
  let location =
    scopeObjectName && !isAllObjectsScope(scopeObjectName)
      ? resolvedScopeName || scopeObjectName
      : labels.allObjects;

  let equipmentRows = buildAuditPrintEquipmentRows(
    audit,
    computers,
    networkDevices,
    labels,
    objects
  );

  // Legacy audits stored "1" as 1-based list index — if scope is empty, print all company equipment.
  if (
    equipmentRows.length === 0 &&
    scopeObjectName &&
    !isAllObjectsScope(scopeObjectName) &&
    isNumericLegacyAuditRef(scopeObjectName)
  ) {
    const companyRows = buildAuditPrintEquipmentRows(
      { ...audit, objectName: labels.allObjects },
      computers,
      networkDevices,
      labels,
      objects
    );
    if (companyRows.length > 0) {
      equipmentRows = companyRows;
      location = labels.allObjects;
    }
  }

  return {
    auditId: audit.id,
    date: audit.date,
    workspaceName,
    location,
    controllerUser: resolveAuditPersonName(audit.controllerUser, employees),
    conductorUser: resolveAuditPersonName(audit.conductorUser, employees),
    responsibleUser: resolveAuditPersonName(audit.responsibleUser, employees),
    startNotes: audit.startNotes || '',
    equipmentRows,
  };
}

export function buildAuditStartOrderContent(
  params: AuditStartDocParams,
  lang: Language
): string {
  const org = resolveAuditOrg(params.workspaceName);
  const scopeLabel = formatAuditScopeLabel(params.location, lang);
  const table = buildEquipmentTable(
    params.equipmentRows,
    lang === 'en'
      ? 'No registered equipment at this location'
      : lang === 'zh'
        ? '该地点无登记设备'
        : 'На данном объекте нет зарегистрированного оборудования',
    lang === 'en'
      ? ' №   | Category       | Name / Model             | Inventory No.  | Responsible            | Yes  | No   '
      : lang === 'zh'
        ? ' №   | 类别           | 名称/型号                | 资产编号       | 责任人                 | 在库 | 缺失 '
        : ' №   | Категория      | Наименование / Модель    | Инв. номер     | Ответственный          | Есть | Нет  ',
    true
  );

  const notSpecified =
    lang === 'en' ? 'Not specified' : lang === 'zh' ? '未指定' : 'Не указан';
  const defaultNotes =
    lang === 'en'
      ? 'Verify physical stock against IT asset database records.'
      : lang === 'zh'
        ? '核对实物与 IT 资产数据库记录。'
        : 'Сверить фактическое наличие с записями в базе данных ИТ-учета.';

  const letterhead = buildDocumentHeaderPlainText();

  if (lang === 'en') {
    return `${letterhead}======================================================
  INVENTORY START ORDER No. INV-ST-${params.auditId}
======================================================
Organization: ${org}
Inventory start date: ${params.date}
Scope: ${scopeLabel}
------------------------------------------------------

This order confirms the start of an inventory inspection.

Personnel:
   - Conducts inventory (Auditor):     ${params.conductorUser || notSpecified}
   - Accepts / supervises inventory: ${params.controllerUser || notSpecified}
   - Database responsible:           ${params.responsibleUser || notSpecified}

Equipment to verify (mark Yes / No for each line):

${table}

Basis / Order:
   "${params.startNotes || defaultNotes}"

Instructions: physically verify each item and mark [ ] Yes or [ ] No in the table.

------------------------------------------------------
Signatures:

Conducts inventory: ___________ / ${params.conductorUser} /
Accepts inventory:    ___________ / ${params.controllerUser} /
Database responsible: ___________ / ${params.responsibleUser} /
======================================================
`;
  }

  if (lang === 'zh') {
    return `${letterhead}======================================================
  盘点开始令 № 盘点-开始-${params.auditId}
======================================================
单位：${org}
盘点开始日期：${params.date}
盘点范围：${scopeLabel}
------------------------------------------------------

兹确认启动盘点检查。

人员：
   - 盘点执行人：           ${params.conductorUser || notSpecified}
   - 盘点验收/监督人：     ${params.controllerUser || notSpecified}
   - 系统责任人：           ${params.responsibleUser || notSpecified}

待核对设备（请在每行勾选 在库 / 缺失）：

${table}

依据/说明：
   "${params.startNotes || defaultNotes}"

说明：请逐项实物核对，并在表格中勾选在库或缺失。

------------------------------------------------------
签字：

盘点执行人：___________ / ${params.conductorUser} /
验收监督人：___________ / ${params.controllerUser} /
系统责任人：___________ / ${params.responsibleUser} /
======================================================
`;
  }

  return `${letterhead}======================================================
  ВЕДОМОСТЬ НАЧАЛА ИНВЕНТАРИЗАЦИИ № ИНВ-СТ-${params.auditId}
======================================================
Организация: ${org}
Дата начала инвентаризации: ${params.date}
Объект проведения: ${scopeLabel}
------------------------------------------------------

Настоящая ведомость подтверждает начало инвентаризационной проверки ТМЦ.

Сотрудники:
   - Проводит инвентаризацию:          ${params.conductorUser || notSpecified}
   - Принимает инвентаризацию:         ${params.controllerUser || notSpecified}
   - Ответственный за базу учёта:      ${params.responsibleUser || notSpecified}

Перечень оборудования к проверке (отметить «Есть» или «Нет» напротив каждой позиции):

${table}

Основание / распоряжение:
   "${params.startNotes || defaultNotes}"

Порядок заполнения: при физической сверке отметьте в графах «Есть» [ ] или «Нет» [ ] фактическое наличие каждой единицы.

------------------------------------------------------
Подписи:

Проводит инвентаризацию: ___________ / ${params.conductorUser} /

Принимает инвентаризацию: ___________ / ${params.controllerUser} /

Ответственный за учёт: ___________ / ${params.responsibleUser} /
======================================================
`;
}

export function buildAuditConclusionContent(
  params: AuditConclusionDocParams,
  lang: Language
): string {
  const org = resolveAuditOrg(params.workspaceName);
  const allObjects =
    lang === 'en' ? 'All locations' : lang === 'zh' ? '所有地点' : 'Все объекты';
  const notSpecified =
    lang === 'en' ? 'Not specified' : lang === 'zh' ? '未指定' : 'Не указан';
  const noSignature =
    lang === 'en' ? 'No signature' : lang === 'zh' ? '无签名' : 'Без подписи';
  const defaultConclusion =
    lang === 'en'
      ? 'Inventory completed. All assets match inventory numbers; discrepancies resolved.'
      : lang === 'zh'
        ? '盘点已完成。所有资产与编号一致，差异已处理。'
        : 'Инвентаризация успешно завершена. Все обнаруженные ТМЦ соответствуют инвентарным номерам, расхождения устранены.';

  const letterhead = buildDocumentHeaderPlainText();

  if (lang === 'en') {
    return `${letterhead}======================================================
 INVENTORY CONCLUSION ACT No. INV-ACT-${params.auditId}
------------------------------------------------------
Organization: ${org}
======================================================
Act date: ${params.date}
Location: ${params.objectName || allObjects}

Commission:
   - Chair (Controller): ${params.controllerUser || notSpecified}
   - Auditor (Executor): ${params.conductorUser || notSpecified}

Physical verification of IT equipment and consumables was performed.
Results:

1. ACCOUNTING STATUS:
   - Total items checked: [ ${params.checkedCount} units ]
   - Discrepancies found: [ ${params.mismatches} units ]

2. COMMISSION CONCLUSION:
   "${params.conclusionNotes || defaultConclusion}"

3. RECOMMENDATIONS:
   - Update asset cards if discrepancies exist.
   - Write off defective consumables and components promptly.

------------------------------------------------------
Signatures:

Chair (Controller): ___________ / ${params.controllerUser || noSignature} /
Auditor (Executor): ___________ / ${params.conductorUser || noSignature} /
Materially responsible person: ___________ / ${params.responsibleUser} /
======================================================
`;
  }

  if (lang === 'zh') {
    return `${letterhead}======================================================
 盘点结论书 № 盘点-结论-${params.auditId}
------------------------------------------------------
单位：${org}
======================================================
编制日期：${params.date}
检查地点：${params.objectName || allObjects}

委员会：
   - 主席（监督）：${params.controllerUser || notSpecified}
   - 执行人：${params.conductorUser || notSpecified}

已完成 IT 设备及耗材实物核对。结果如下：

1. 账务情况：
   - 检查设备总数：[ ${params.checkedCount} 件 ]
   - 发现差异：[ ${params.mismatches} 件 ]

2. 委员会结论：
   "${params.conclusionNotes || defaultConclusion}"

3. 建议：
   - 如有差异，及时更新资产卡片。
   - 及时报废缺陷耗材和部件。

------------------------------------------------------
签字：

主席（监督）：___________ / ${params.controllerUser || noSignature} /
执行人：___________ / ${params.conductorUser || noSignature} /
物料责任人：___________ / ${params.responsibleUser} /
======================================================
`;
  }

  return `${letterhead}======================================================
 АКТ (ЗАКЛЮЧЕНИЕ) О РЕЗУЛЬТАТАХ ИНВЕНТАРИЗАЦИИ № ИНВ-АКТ-${params.auditId}
------------------------------------------------------
Организация: ${org}
======================================================
Дата составления акта: ${params.date}
Объект проверки: ${params.objectName || allObjects}

Комиссия в составе:
   - Председатель комиссии (Контролирует): ${params.controllerUser || notSpecified}
   - Проводящий инвентаризацию (Проводит): ${params.conductorUser || notSpecified}

Произвела проверку фактического наличия ИТ-оборудования и расходных материалов.
Настоящим актом подтверждаются следующие результаты:

1. СОСТОЯНИЕ УЧЕТА:
   - Общее число проверенного оборудования: [ ${params.checkedCount} ед. проверено ]
   - Выявлено расхождений (недостачи или излишки): [ ${params.mismatches} ед. ]

2. ЗАКЛЮЧЕНИЕ И ВЫВОДЫ КОМИССИИ:
   "${params.conclusionNotes || defaultConclusion}"

3. РЕКОМЕНДАЦИИ ПО ИТОГАМ:
   - При наличии расхождений внести корректировки в сетевые карточки оборудования.
   - Своевременно списывать непригодные картриджи и дефектные комплектующие.

------------------------------------------------------
Подписи членов комиссии:

Председатель комиссии (Контроль): ___________ / ${params.controllerUser || noSignature} /

Исполнитель (Проводящий аудит): ___________ / ${params.conductorUser || noSignature} /

Материально-ответственное лицо: ___________ / ${params.responsibleUser} /
======================================================
`;
}

export function auditStartPdfName(auditId: string, lang: Language): string {
  if (lang === 'en') return `Start_Order_INV_${auditId}.pdf`;
  if (lang === 'zh') return `盘点开始令_${auditId}.pdf`;
  return `Акт_начала_ИНВ_${auditId}.pdf`;
}

export function auditConclusionPdfName(auditId: string, lang: Language): string {
  if (lang === 'en') return `Conclusion_Act_INV_${auditId}.pdf`;
  if (lang === 'zh') return `盘点结论书_${auditId}.pdf`;
  return `Акт_заключения_ИНВ_${auditId}.pdf`;
}

export function isAuditConclusionPdfName(name: string): boolean {
  const n = name.toLowerCase();
  return (
    n.includes('заключен') ||
    n.includes('conclusion') ||
    n.includes('盘点结论') ||
    n.includes('inv-act') ||
    n.includes('инв-акт')
  );
}

export function isAuditStartPdfName(name: string): boolean {
  if (isAuditConclusionPdfName(name)) return false;
  const n = name.toLowerCase();
  return (
    n.includes('начала') ||
    n.includes('начале') ||
    n.includes('акт_начал') ||
    n.includes('_ст') ||
    n.includes('start_order') ||
    n.includes('start_inv') ||
    n.includes('盘点开始') ||
    n.includes('inv-st') ||
    n.includes('инв-ст')
  );
}
