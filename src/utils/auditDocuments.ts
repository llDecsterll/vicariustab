import type { ComputerItem, NetworkDevice } from '../types';
import type { Language } from './i18n';

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

const DEFAULT_ORG = 'ООО "Глобал-Консалт ИТ"';

function buildEquipmentTable(
  rows: AuditEquipmentRow[],
  emptyLabel: string,
  header: string
): string {
  if (rows.length === 0) {
    return `   [ ${emptyLabel} ]\n`;
  }
  let table = '-----------------------------------------------------------------------------------------\n';
  table += header + '\n';
  table += '-----------------------------------------------------------------------------------------\n';
  for (const row of rows) {
    const num = String(row.index).padEnd(4);
    const cat = row.category.slice(0, 15).padEnd(15);
    const model = row.model.slice(0, 26).padEnd(26);
    const inv = row.inventory.slice(0, 15).padEnd(15);
    const resp = row.responsible.slice(0, 31);
    table += ` ${num}| ${cat} | ${model} | ${inv} | ${resp}\n`;
  }
  table += '-----------------------------------------------------------------------------------------\n';
  return table;
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
    rows.push({
      index: index++,
      category: c.category || labels.defaultComputer,
      model: c.model,
      inventory: c.inventoryNumber || '-',
      responsible: c.employeeName || labels.unassigned,
    });
  }
  for (const n of networkDevices) {
    rows.push({
      index: index++,
      category: n.type || labels.defaultNetwork,
      model: n.deviceName,
      inventory: n.inventoryNumber || n.id || '-',
      responsible: labels.itAdmin,
    });
  }
  return rows;
}

export function buildAuditStartOrderContent(
  params: AuditStartDocParams,
  lang: Language
): string {
  const org = params.workspaceName || DEFAULT_ORG;
  const table = buildEquipmentTable(
    params.equipmentRows,
    lang === 'en'
      ? 'No registered equipment at this location'
      : lang === 'zh'
        ? '该地点无登记设备'
        : 'На данном объекте нет зарегистрированного оборудования',
    lang === 'en'
      ? ' №   | Type/Category   | Model / Name               | Inventory No.   | Assigned to / Responsible'
      : lang === 'zh'
        ? ' №   | 类型/类别       | 型号/名称                  | 资产编号        | 责任人'
        : ' №   | Тип/Категория   | Модель / Наименование      | Инв. номер      | На ком числится / Ответственный'
  );

  const notSpecified =
    lang === 'en' ? 'Not specified' : lang === 'zh' ? '未指定' : 'Не указан';
  const defaultNotes =
    lang === 'en'
      ? 'Verify physical stock against IT asset database records.'
      : lang === 'zh'
        ? '核对实物与 IT 资产数据库记录。'
        : 'Сверить фактическое наличие с записями в базе данных ИТ-учета.';

  if (lang === 'en') {
    return `
======================================================
  INVENTORY START ORDER No. INV-ST-${params.auditId}
======================================================
Organization: ${org}
Inventory start date: ${params.date}
Place of issue: ${params.location}
------------------------------------------------------

This order confirms the start of an inventory inspection.
To safeguard assets, I hereby order:

1. Conduct inventory at location: [ ${params.location} ]
2. Appoint the commission:
   - Controller (Chair): ${params.controllerUser || notSpecified}
   - Auditor (Executor): ${params.conductorUser || notSpecified}

3. Equipment registered at the location at start of inventory:

${table}

4. Basis / Order:
   "${params.startNotes || defaultNotes}"

5. Record results in the final protocol and discrepancy reports.

------------------------------------------------------
Signatures:

Chair (Controller): ___________ / ${params.controllerUser} /
Auditor (Executor): ___________ / ${params.conductorUser} /
Database responsible: ___________ / ${params.responsibleUser} /
======================================================
`;
  }

  if (lang === 'zh') {
    return `
======================================================
  盘点开始令 № 盘点-开始-${params.auditId}
======================================================
单位：${org}
盘点开始日期：${params.date}
编制地点：${params.location}
------------------------------------------------------

兹确认启动盘点检查。为保障资产安全，命令如下：

1. 在地点进行盘点：[ ${params.location} ]
2. 成立盘点委员会：
   - 监督人（主席）：${params.controllerUser || notSpecified}
   - 盘点执行人：${params.conductorUser || notSpecified}

3. 盘点开始时该地点登记设备：

${table}

4. 依据/说明：
   "${params.startNotes || defaultNotes}"

5. 将结果记入最终报告及差异清单。

------------------------------------------------------
签字：

主席（监督）：___________ / ${params.controllerUser} /
执行人：___________ / ${params.conductorUser} /
系统责任人：___________ / ${params.responsibleUser} /
======================================================
`;
  }

  return `
======================================================
  АКТ О НАЧАЛЕ ИНВЕНТАРИЗАЦИИ № ИНВ-СТ-${params.auditId}
======================================================
Организация: ${org}
Дата начала инвентаризации: ${params.date}
Место составления: ${params.location}
------------------------------------------------------

Настоящим актом подтверждается запуск инвентаризационной проверки.
В целях обеспечения контроля сохранности имущества, приказываю:

1. Провести инвентаризацию ТМЦ на объекте: [ ${params.location} ]
2. Для проведения инвентаризации назначить комиссию в составе:
   - Контролирующий (Председатель комиссии): ${params.controllerUser || notSpecified}
   - Проводящий инвентаризацию (Аудитор/Исполнитель): ${params.conductorUser || notSpecified}

3. На момент начала инвентаризации на объекте закреплено следующее оборудование:

${table}

4. Основание / Распоряжение:
   "${params.startNotes || defaultNotes}"

5. Результаты проверки внести в итоговый протокол и ведомости расхождений.

------------------------------------------------------
Подписи должностных лиц:

Председатель комиссии (Контролирующий): ___________ / ${params.controllerUser} /

Исполнитель (Проводящий аудит): ___________ / ${params.conductorUser} /

Ответственный пользователь базы учета: ___________ / ${params.responsibleUser} /
======================================================
`;
}

export function buildAuditConclusionContent(
  params: AuditConclusionDocParams,
  lang: Language
): string {
  const org = params.workspaceName || DEFAULT_ORG;
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

  if (lang === 'en') {
    return `
======================================================
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
    return `
======================================================
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

  return `
======================================================
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

export function isAuditStartPdfName(name: string): boolean {
  const n = name.toLowerCase();
  return (
    n.includes('начале') ||
    n.includes('_ст') ||
    n.includes('start_order') ||
    n.includes('盘点开始') ||
    n.includes('inv-st') ||
    n.includes('盘点-开始')
  );
}
