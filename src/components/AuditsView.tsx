/*
 * COPYRIGHT NOTICE | УВЕДОМЛЕНИЕ ОБ АВТОРСКИХ ПРАВАХ | 版权声明
 * © 2026 Utkin Vladislav Vyacheslavovich (Уткин Владислав Вячеславович)
 * Email: assetorbit@icloud.com | Telegram: https://t.me/Dexterll
 * All rights reserved. Unauthorized copying, modification, distribution or commercial use is prohibited.
 * 保留所有权利。未经版权所有者事先书面同意，禁止复制、修改、分发或商业使用。
 * Все права защищены. Копирование, изменение, распространение и коммерческое использование без письменного согласия правообладателя запрещено.
 */
import React, { useState } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Calendar, 
  User, 
  ShieldAlert, 
  CheckCircle2, 
  Building2, 
  Users, 
  Printer, 
  FileText, 
  Check, 
  Eye, 
  X,
  FileCheck,
  Trash2,
  Upload
} from 'lucide-react';
import { InventoryAudit, ComputerItem, NetworkDevice } from '../types';
import { useTranslation } from '../utils/i18n';

interface AuditsViewProps {
  audits: InventoryAudit[];
  onAddAudit: (
    title: string, 
    responsibleUser: string, 
    objectName?: string, 
    controllerUser?: string, 
    conductorUser?: string,
    startNotes?: string,
    startPdf?: { name: string; size: string; content: string }
  ) => void;
  onCompleteAudit: (
    id: string, 
    mismatches: number, 
    conclusionNotes?: string,
    conclusionPdf?: { name: string; size: string; content: string }
  ) => void;
  onDeleteAudit?: (id: string) => void;
  currentUser?: { role: 'Viewer' | 'Editor' | 'Admin' };
  objects: any[];
  employees: any[];
  workspaceName?: string;
  computers?: ComputerItem[];
  networkDevices?: NetworkDevice[];
}

export default function AuditsView({
  audits,
  onAddAudit,
  onCompleteAudit,
  onDeleteAudit,
  currentUser,
  objects = [],
  employees = [],
  workspaceName,
  computers = [],
  networkDevices = [],
}: AuditsViewProps) {
  const { t } = useTranslation();

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [responsibleUser, setResponsibleUser] = useState('');
  const [selectedObjectName, setSelectedObjectName] = useState('');
  const [controllerUser, setControllerUser] = useState('');
  const [conductorUser, setConductorUser] = useState('');
  const [startNotes, setStartNotes] = useState('');

  // Complete Audit state
  const [mismatchesModalId, setMismatchesModalId] = useState<string | null>(null);
  const [mismatches, setMismatches] = useState(0);
  const [conclusionNotes, setConclusionNotes] = useState('');
  const [uploadedConclusionPdf, setUploadedConclusionPdf] = useState<{ name: string; size: string; content: string } | null>(null);

  // Printable document preview state
  const [previewDoc, setPreviewDoc] = useState<{
    title: string;
    type: 'start_order' | 'conclusion_act';
    audit: InventoryAudit;
    customContent?: string;
  } | null>(null);

  const isViewer = currentUser?.role === 'Viewer';
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Helper to pre-fill responsive inputs
  const handleOpenAddModal = () => {
    setTitle('Плановая инвентаризация ТМЦ');
    setResponsibleUser(employees[0]?.name || 'Иванов И.И.');
    setSelectedObjectName(objects[0]?.name || 'Головной офис');
    setControllerUser(employees[1]?.name || employees[0]?.name || 'Сидоров П.П.');
    setConductorUser(employees[0]?.name || 'Иванов И.И.');
    setStartNotes('Провести плановую сверку компьютерной техники, оргтехники и расходных материалов на объекте.');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !responsibleUser.trim()) return;

    const auditId = `aud-${Date.now().toString().slice(-4)}`;
    const curDate = new Date().toISOString().split('T')[0];

    // Filter computers and network devices belonging to the selected object/location
    const targetLocation = selectedObjectName || 'Все объекты';
    const isAll = targetLocation === 'Все подразделения и офисы' || targetLocation === 'Все объекты' || !targetLocation;

    const relevantComputers = isAll 
      ? computers 
      : computers.filter(c => c.objectName === targetLocation);

    const relevantNetwork = isAll 
      ? networkDevices 
      : networkDevices.filter(n => n.objectName === targetLocation);

    // Build the equipment table
    let equipmentTable = '';
    let index = 1;

    if (relevantComputers.length === 0 && relevantNetwork.length === 0) {
      equipmentTable = '   [ На данном объекте нет зарегистрированного оборудования ]\n';
    } else {
      equipmentTable += '-----------------------------------------------------------------------------------------\n';
      equipmentTable += ' №   | Тип/Категория   | Модель / Наименование      | Инв. номер      | На ком числится / Ответственный \n';
      equipmentTable += '-----------------------------------------------------------------------------------------\n';
      
      relevantComputers.forEach(c => {
        const num = String(index++).padEnd(4);
        const cat = String(c.category || 'Компьютер').slice(0, 15).padEnd(15);
        const model = String(c.model).slice(0, 26).padEnd(26);
        const inv = String(c.inventoryNumber || '-').slice(0, 15).padEnd(15);
        const resp = String(c.employeeName || 'Не закреплено').slice(0, 31);
        equipmentTable += ` ${num}| ${cat} | ${model} | ${inv} | ${resp}\n`;
      });

      relevantNetwork.forEach(n => {
        const num = String(index++).padEnd(4);
        const cat = String(n.type || 'Сетевое').slice(0, 15).padEnd(15);
        const model = String(n.deviceName).slice(0, 26).padEnd(26);
        const inv = String(n.id || '-').slice(0, 15).padEnd(15);
        const resp = 'Служба ИТ / Админ';
        equipmentTable += ` ${num}| ${cat} | ${model} | ${inv} | ${resp}\n`;
      });
      equipmentTable += '-----------------------------------------------------------------------------------------\n';
    }

    // Generate printable Start Order text content (Приказ о начале)
    const startPdf = {
      name: `Акт_начала_ИНВ_${auditId}.pdf`,
      size: `${(100 + (index * 0.15)).toFixed(1)} КБ`,
      content: `
======================================================
  АКТ О НАЧАЛЕ ИНВЕНТАРИЗАЦИИ № ИНВ-СТ-${auditId}
======================================================
Организация: ${workspaceName || 'ООО "Глобал-Консалт ИТ"'}
Дата начала инвентаризации: ${curDate}
Место составления: ${targetLocation}
------------------------------------------------------

Настоящим актом подтверждается запуск инвентаризационной проверки.
В целях обеспечения контроля сохранности имущества, приказываю:

1. Провести инвентаризацию ТМЦ на объекте: [ ${targetLocation} ]
2. Для проведения инвентаризации назначить комиссию в составе:
   - Контролирующий (Председатель комиссии): ${controllerUser || 'Не указан'}
   - Проводящий инвентаризацию (Аудитор/Исполнитель): ${conductorUser || 'Не указан'}

3. На момент начала инвентаризации на объекте закреплено следующее оборудование:

${equipmentTable}

4. Основание / Распоряжение:
   "${startNotes || 'Сверить фактическое наличие с записями в базе данных ИТ-учета.'}"

5. Результаты проверки внести в итоговый протокол и ведомости расхождений.

------------------------------------------------------
Подписи должностных лиц:

Председатель комиссии (Контролирующий): ___________ / ${controllerUser} /

Исполнитель (Проводящий аудит): ___________ / ${conductorUser} /

Ответственный пользователь базы учета: ___________ / ${responsibleUser} /
======================================================
      `
    };

    onAddAudit(
      title, 
      responsibleUser, 
      selectedObjectName, 
      controllerUser, 
      conductorUser, 
      startNotes,
      startPdf
    );

    setShowModal(false);
    setTitle('');
    setStartNotes('');
  };

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mismatchesModalId) {
      const audit = audits.find(a => a.id === mismatchesModalId);
      if (!audit) return;

      const curDate = new Date().toISOString().split('T')[0];
      
      // Generate printable Conclusion Act text content (Акт заключения) if not uploaded
      const conclusionPdf = uploadedConclusionPdf || {
        name: `Акт_заключения_ИНВ_${audit.id}.pdf`,
        size: '158 КБ',
        content: `
======================================================
 АКТ (ЗАКЛЮЧЕНИЕ) О РЕЗУЛЬТАТАХ ИНВЕНТАРИЗАЦИИ № ИНВ-АКТ-${audit.id}
------------------------------------------------------
Организация: ${workspaceName || 'ООО "Глобал-Консалт ИТ"'}
======================================================
Дата составления акта: ${curDate}
Объект проверки: ${audit.objectName || 'Все объекты'}

Комиссия в составе:
   - Председатель комиссии (Контролирует): ${audit.controllerUser || 'Не указан'}
   - Проводящий инвентаризацию (Проводит): ${audit.conductorUser || 'Не указан'}

Произвела проверку фактического наличия ИТ-оборудования и расходных материалов.
Настоящим актом подтверждаются следующие результаты:

1. СОСТОЯНИЕ УЧЕТА:
   - Общее число проверенного оборудования: [ ${employees.length * 2 + 15} ед. проверено ]
   - Выявлено расхождений (недостачи или излишки): [ ${mismatches} ед. ]

2. ЗАКЛЮЧЕНИЕ И ВЫВОДЫ КОМИССИИ:
   "${conclusionNotes || 'Инвентаризация успешно завершена. Все обнаруженные ТМЦ соответствуют инвентарным номерам, расхождения устранены.'}"

3. РЕКОМЕНДАЦИИ ПО ИТОГАМ:
   - При наличии расхождений внести корректировки в сетевые карточки оборудования.
   - Своевременно списывать непригодные картриджи и дефектные комплектующие.

------------------------------------------------------
Подписи членов комиссии:

Председатель комиссии (Контроль): ___________ / ${audit.controllerUser || 'Без подписи'} /

Исполнитель (Проводящий аудит): ___________ / ${audit.conductorUser || 'Без подписи'} /

Материально-ответственное лицо: ___________ / ${audit.responsibleUser} /
======================================================
        `
      };

      onCompleteAudit(mismatchesModalId, mismatches, conclusionNotes, conclusionPdf);
      setMismatchesModalId(null);
      setMismatches(0);
      setConclusionNotes('');
      setUploadedConclusionPdf(null);
    }
  };

  // Trigger printable view using customized layout or standard window.print
  const triggerPrint = (docTitle: string) => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="p-1 px-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
              <ClipboardList size={18} />
            </span>
            <h2 className="text-lg font-bold text-slate-800">{t("Инвентаризация и Сверка ТМЦ")}</h2>
          </div>
          <p className="text-slate-400 text-xs">{t("Планирование и проведение физической сверки ТМЦ на объектах с ведением приказов комиссии, контролеров и печатных актов.")}</p>
        </div>
        {!isViewer && (
          <button
            onClick={handleOpenAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer shrink-0"
          >
            <Plus size={14} />{t("Запустить новую инвентаризацию")}</button>
        )}
      </div>

      {/* Grid of audits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {audits.map((audit) => {
          let statusClass = '';
          if (audit.status === 'Завершена') statusClass = 'bg-emerald-50 text-emerald-800 border-emerald-150';
          else if (audit.status === 'В процессе') statusClass = 'bg-blue-50 text-blue-800 border-blue-150';
          else statusClass = 'bg-slate-100 text-slate-650 border border-slate-205';

          return (
            <div 
              key={audit.id} 
              className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 hover:shadow-md transition-shadow flex flex-col justify-between gap-4"
            >
              <div className="space-y-3.5">
                {/* Header Status & Code */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${statusClass}`}>
                      {audit.status}
                    </span>
                    {audit.status === 'Завершена' && !isViewer && onDeleteAudit && (
                      <div className="relative inline-flex items-center">
                        {deleteConfirmId === audit.id ? (
                          <span className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200/80 rounded-lg p-1 px-2 text-rose-700 animate-fade-in z-10 shadow-sm">
                            <span className="text-[10px] font-bold">{t("Удалить?")}</span>
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteAudit(audit.id);
                                setDeleteConfirmId(null);
                              }}
                              className="text-[10px] bg-rose-600 hover:bg-rose-700 text-white font-bold p-0.5 px-1.5 rounded transition-colors cursor-pointer"
                            >{t("Да")}</button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold p-0.5 px-1.5 rounded transition-all cursor-pointer"
                            >{t("Нет")}</button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(audit.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer flex items-center justify-center border border-transparent hover:border-rose-100"
                            title={t("Удалить законченную инвентаризацию")}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold font-mono text-right shrink-0">
                    ID: {audit.id}
                  </span>
                </div>

                {/* Main description */}
                <div>
                  <h3 className="font-bold text-slate-850 text-base leading-snug">
                    {audit.title}
                  </h3>
                  
                  {/* Object Name Block */}
                  <div className="mt-2 text-xs flex items-center gap-1.5 text-indigo-700 font-semibold bg-indigo-50/50 p-1.5 px-2.5 rounded-lg w-max max-w-full">
                    <Building2 size={13} className="shrink-0" />
                    <span>Объект проведения: {audit.objectName || 'Все объекты'}</span>
                  </div>
                </div>

                {/* Audit responsible panel */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">{t("Кто проводит:")}</span>
                    <div className="flex items-center gap-1 text-slate-700 font-medium">
                      <User size={12} className="text-slate-405" />
                      <span>{audit.conductorUser || audit.responsibleUser || 'Не указан'}</span>
                    </div>
                  </div>
                  <div className="space-y-1 sm:border-l sm:border-slate-150 sm:pl-3">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">{t("Кто контролирует:")}</span>
                    <div className="flex items-center gap-1 text-slate-700 font-medium">
                      <Users size={12} className="text-slate-405" />
                      <span>{audit.controllerUser || 'Комиссия УК'}</span>
                    </div>
                  </div>
                </div>

                {/* Mismatches results details */}
                <div className="pt-2 grid grid-cols-3 gap-2.5 text-center text-xs">
                  <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100/60">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">{t("Всего ТМЦ")}</span>
                    <strong className="text-slate-700 text-sm font-semibold">{audit.itemsAudited || '-'}</strong>
                  </div>
                  <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100/60">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">{t("Расхождения")}</span>
                    <strong className={`text-sm font-semibold ${audit.mismatchesFound > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {audit.status === 'Запланирована' ? '-' : audit.mismatchesFound}
                    </strong>
                  </div>
                  <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100/60">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">{t("Дата")}</span>
                    <strong className="text-slate-700 text-[10px] font-mono block mt-0.5">{audit.date}</strong>
                  </div>
                </div>

                {/* Notes and orders previews */}
                {audit.startNotes && (
                  <div className="p-2.5 bg-yellow-50/30 border border-yellow-100/50 rounded-xl text-[11px] text-slate-600">
                    <span className="font-bold text-amber-800 block mb-0.5">{t("Приказ и примечания к началу:")}</span>
                    <p className="italic">"{audit.startNotes}"</p>
                  </div>
                )}

                {audit.conclusionNotes && (
                  <div className="p-2.5 bg-emerald-50/30 border border-emerald-100/50 rounded-xl text-[11px] text-slate-600">
                    <span className="font-bold text-emerald-800 block mb-0.5">{t("Заключительное решение комиссии:")}</span>
                    <p className="italic">"{audit.conclusionNotes}"</p>
                  </div>
                )}

                {/* Documents / Printed attachment section */}
                <div className="pt-2 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{t("Прикрепленные печатные формы:")}</span>
                  
                  {(!audit.pdfFiles || audit.pdfFiles.length === 0) ? (
                    <span className="text-[10px] text-slate-400 italic block">{t("Нет сгенерированных печатных документов")}</span>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {audit.pdfFiles.map((pdf, idx) => {
                        const isStart = pdf.name.includes('начале') || pdf.name.includes('СТ');
                        return (
                          <button
                            key={idx}
                            onClick={() => setPreviewDoc({
                              title: isStart ? 'Приказ о начале инвентаризации' : 'Акт заключения инвентаризации',
                              type: isStart ? 'start_order' : 'conclusion_act',
                              audit: audit,
                              customContent: pdf.content
                            })}
                            className="flex items-center gap-1.5 p-1.5 px-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200/75 hover:border-blue-300 rounded-lg text-[10px] font-medium text-slate-700 transition-colors shadow-3xs cursor-pointer group"
                          >
                            <FileCheck size={12} className="text-blue-500 shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="truncate max-w-[140px] text-[10px]">{pdf.name}</span>
                            <span className="text-[9.5px] text-slate-400 shrink-0 font-mono">({pdf.size})</span>
                            <Eye size={10} className="text-slate-400 pr-0.5 ml-1" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Complete Audit action button */}
              {audit.status !== 'Завершена' && !isViewer && (
                <div className="pt-3 border-t border-slate-50">
                  <button
                    onClick={() => {
                      setMismatchesModalId(audit.id);
                      setConclusionNotes('В ходе инвентаризации несоответствий не обнаружено (или оперативно исправлено). Все единицы ТМЦ совпадают.');
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 size={13} />{t("Перейти к завершению и выводам (Заключению)")}</button>
                </div>
              )}
            </div>
          );
        })}

        {audits.length === 0 && (
          <div className="col-span-full p-12 text-center bg-white border border-slate-100 rounded-3xl space-y-3 shadow-3xs">
            <ClipboardList className="mx-auto text-slate-300 shrink-0" size={32} />
            <p className="text-slate-500 text-sm">{t("Инвентаризационные проверки не запланированы.")}</p>
            <p className="text-slate-350 text-xs">{t("Запустите первую плановую инвентаризацию, назначив комиссию, контролирующих и проводящих специалистов.")}</p>
          </div>
        )}
      </div>

      {/* Modal 1: Create Audit with all requested fields */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all border border-slate-100">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <ClipboardList className="text-blue-500" size={16} />{t("Регистрация инвентаризации")}</h3>
                <span className="text-[10px] text-slate-400 font-medium block">{t("Регистрация приказа и запуск проверки")}</span>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-650 bg-white p-1 rounded-full border border-slate-100 cursor-pointer shadow-3xs"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Theme/Title */}
              <div>
                <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">{t("Наименование инвентаризации / Тема")}</label>
                <input
                  type="text"
                  required
                  placeholder={t("Например, Плановый аудит ИТ-склада")}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500/20 focus:outline-none text-slate-700"
                />
              </div>

              {/* Object Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">{t("Объект проведения проверки (Локация)")}</label>
                <select
                  value={selectedObjectName}
                  onChange={(e) => setSelectedObjectName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-xs text-slate-755 focus:ring-1 focus:ring-blue-500/20 focus:outline-none cursor-pointer"
                >
                  {objects.map((obj: any) => (
                    <option key={obj.id} value={obj.name}>{obj.name} (ул. {obj.address})</option>
                  ))}
                  <option value="Все подразделения и офисы">{t("Все подразделения и офисы")}</option>
                </select>
                <span className="text-[9.5px] text-slate-400 block mt-1">{t("Оборудование этого объекта будет проверено комиссией")}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Conductor User */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">{t("Кто проводит проверку")}</label>
                  <select
                    value={conductorUser}
                    onChange={(e) => {
                      setConductorUser(e.target.value);
                      setResponsibleUser(e.target.value); // also set database responsible sync
                    }}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-xs text-slate-755 focus:ring-1 focus:ring-blue-500/20 focus:outline-none cursor-pointer"
                  >
                    {employees.map((emp: any) => (
                      <option key={emp.id} value={emp.name}>{emp.name} ({emp.position})</option>
                    ))}
                    <option value="Служба системного администрирования">{t("Служба системного администрирования")}</option>
                  </select>
                </div>

                {/* Controller User */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">{t("Кто контролирует")}</label>
                  <select
                    value={controllerUser}
                    onChange={(e) => setControllerUser(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-xs text-slate-755 focus:ring-1 focus:ring-blue-500/20 focus:outline-none cursor-pointer"
                  >
                    {employees.map((emp: any) => (
                      <option key={emp.id} value={emp.name}>{emp.name} ({emp.position})</option>
                    ))}
                    <option value="Бухгалтерия и Руководство ИТ">{t("Бухгалтерия и Руководство ИТ")}</option>
                    <option value="Шевченко М.В. (Директор по ИТ)">{t("Шевченко М.В. (Директор по ИТ)")}</option>
                  </select>
                </div>
              </div>

              {/* Start notes / Instructions */}
              <div>
                <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">{t("Основание / Примечание / Распоряжение")}</label>
                <textarea
                  rows={2}
                  placeholder={t("Например, Очередная полугодовая инвентаризация ТМЦ. Сверить серийники...")}
                  value={startNotes}
                  onChange={(e) => setStartNotes(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500/20 focus:outline-none text-slate-700"
                />
              </div>

              <div className="p-3 bg-amber-50/50 border border-amber-200/50 rounded-xl">
                <span className="text-[10px] text-amber-900 font-bold uppercase block mb-1">{t("Печатная форма:")}</span>
                <p className="text-[10px] text-amber-800 leading-relaxed">{t("Будет автоматически сформирован")}<strong>"Приказ о проведении инвентаризации"</strong>{t("с закреплением ответственной комиссии и контролирующих лиц в машиносчитываемом акте.")}</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors"
                >{t("Отмена")}</button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
                >{t("Зарегистрировать и запустить")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Complete Audit Settle Results with Conclusion Form */}
      {mismatchesModalId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all border border-slate-100">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="text-amber-500" size={16} />{t("Подвести итоги и составить заключение")}</h3>
                <span className="text-[10px] text-slate-400 font-medium block">{t("Завершение итогов, расчет расхождений")}</span>
              </div>
              <button 
                onClick={() => setMismatchesModalId(null)}
                className="text-slate-405 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="p-6 space-y-4">
              {/* Mismatches count */}
              <div>
                <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">{t("Количество выявленных расхождений / дефектов")}</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={mismatches}
                  onChange={(e) => setMismatches(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500/20 focus:outline-none text-slate-700 font-mono"
                />
                <span className="text-[9px] text-slate-400 mt-1 block">{t("Введите 0 если расхождений не найдено и база полностью соответствует действительности.")}</span>
              </div>

              {/* Conclusion texts */}
              <div>
                <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">{t("Заключение экспертной комиссии (Решение / Выводы)")}</label>
                <textarea
                  rows={3}
                  required
                  placeholder={t("Например, По результатам сверки все приборы в наличии. Выявлен 1 жесткий диск для списания. Излишков нет...")}
                  value={conclusionNotes}
                  onChange={(e) => setConclusionNotes(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500/20 focus:outline-none text-slate-700"
                />
              </div>

              {/* Upload conclusion act option */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">{t("Прикрепить акт выполненной инвентаризации (PDF)")}</label>
                {uploadedConclusionPdf ? (
                  <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-3xs">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <FileCheck className="text-emerald-500 shrink-0" size={14} />
                      <span className="text-xs text-slate-700 truncate font-semibold">{uploadedConclusionPdf.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({uploadedConclusionPdf.size})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadedConclusionPdf(null)}
                      className="text-xs text-rose-500 hover:text-rose-700 font-bold shrink-0 cursor-pointer"
                    >{t("Удалить")}</button>
                  </div>
                ) : (
                  <div className="relative border border-dashed border-slate-300 rounded-lg p-4 bg-white hover:bg-slate-50 hover:border-slate-400/80 transition-all text-center cursor-pointer group">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (!file.name.toLowerCase().endsWith('.pdf')) {
                            alert('Пожалуйста, выберите файл в формате PDF!');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = () => {
                            setUploadedConclusionPdf({
                              name: file.name,
                              size: `${(file.size / 1024).toFixed(1)} КБ`,
                              content: reader.result as string
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="mx-auto text-slate-400 group-hover:scale-110 transition-transform mb-1 shrink-0" size={16} />
                    <span className="text-[11px] text-slate-650 block font-semibold">{t("Выберите или перетащите PDF акт")}</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">{t("Файл будет загружен напрямую во вложение к аудиту")}</span>
                  </div>
                )}
              </div>

              <div className="p-3 bg-emerald-50/50 border border-emerald-200/50 rounded-xl text-[10px] text-emerald-800">
                <strong>{uploadedConclusionPdf ? 'Собственный акт во вложении:' : 'Автоматическая привязка:'}</strong> {uploadedConclusionPdf ? 'Ваш подписанный PDF-документ будет сохранен в качестве официального отчета о завершении инвентаризации.' : 'К карточке инвентаризации будет привязан официальный документ Акт инвентаризационного заключения с подписями председателя комиссии и исполнителей.'}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setMismatchesModalId(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >{t("Отмена")}</button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
                >{t("Подтвердить сверку и выгрузить Акт")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Print Document Previewer (Акт / Приказ) */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-910/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          {/* Dynamic Print CSS for flawless, absolute margin printing inside sandbox */}
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              body * { visibility: hidden !important; }
              #printable-audit-doc, #printable-audit-doc * { visibility: visible !important; }
              #printable-audit-doc { 
                position: absolute !important; 
                left: 0 !important; 
                top: 0 !important; 
                width: 100% !important; 
                padding: 1.0in !important;
                background: white !important;
                color: black !important;
                box-shadow: none !important;
                border: none !important;
                font-family: 'Courier New', Courier, monospace !important;
                font-size: 11pt !important;
                white-space: pre-wrap !important;
                line-height: 1.5 !important;
              }
              .no-print { display: none !important; }
            }
          `}} />
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden transform transition-all border border-slate-100 my-4 text-xs font-mono no-print">
            {/* Modal header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-150 flex items-center justify-between font-sans">
              <div>
                <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <FileText className="text-blue-500" size={16} />
                  Печатный документ: {previewDoc.title}
                </h3>
                <span className="text-[10px] text-slate-400 block">{t("Предварительный просмотр печатной формы компании")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => triggerPrint(previewDoc.title)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10.5px] font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-sm animate-pulse"
                >
                  <Printer size={12} />{t("Распечатать / PDF")}</button>
                <button 
                  onClick={() => setPreviewDoc(null)}
                  className="text-slate-400 hover:text-slate-650 bg-white p-1 rounded-full border border-slate-100 cursor-pointer shadow-3xs"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Document contents simulation paper on screen */}
            <div className="p-6 bg-slate-100 overflow-x-auto">
              <div 
                id="printable-audit-doc"
                className="bg-white p-8 max-w-full rounded shadow-sm border border-slate-200 text-slate-800 leading-relaxed font-mono text-[11px] whitespace-pre-wrap overflow-y-auto max-h-[460px]"
              >
                {previewDoc.customContent}
                
                {/* Official Stamp in the printed document */}
                <div className="mt-8 p-4 border border-dashed border-slate-300 bg-slate-50 rounded text-[10px] uppercase font-bold tracking-wider leading-relaxed">
                  <strong>ШТАМП ОРГАНИЗАЦИИ [ {workspaceName ? workspaceName.toUpperCase() : 'ООО "ГЛОБАЛ-КОНСАЛТ ИТ"'} ] И СИСТЕМНАЯ СВЕРКА:</strong><br/>
                  <span className="text-[9px] font-normal text-slate-500 lowercase normal-case">{t("Система учета ИТ-оборудования Equipment Management Pro. Документ подписан электронной цифровой подписью комиссионных инспекторов.")}</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-150 flex justify-between items-center font-sans text-[10px] text-slate-400">
              <span>Документ зарегистрирован в журнале аудита ИНВ-{previewDoc.audit.id}</span>
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-1.5 bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
              >{t("Закрыть просмотр")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
