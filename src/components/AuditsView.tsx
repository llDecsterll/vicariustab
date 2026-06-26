/*
 * COPYRIGHT NOTICE | УВЕДОМЛЕНИЕ ОБ АВТОРСКИХ ПРАВАХ | 版权声明
 * © 2026 Utkin Vladislav Vyacheslavovich (Уткин Владислав Вячеславович)
 * Email: vicariustab@icloud.com | Telegram: https://t.me/Dexterll
 * All rights reserved. Unauthorized copying, modification, distribution or commercial use is prohibited.
 * 保留所有权利。未经版权所有者事先书面同意，禁止复制、修改、分发或商业使用。
 * Все права защищены. Копирование, изменение, распространение и коммерческое использование без письменного согласия правообладателя запрещено.
 * Release
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
  Upload,
  Maximize2,
} from 'lucide-react';
import { InventoryAudit, ComputerItem, NetworkDevice } from '../types';
import { useTranslation } from '../utils/i18n';
import {
  auditConclusionPdfName,
  auditStartPdfName,
  buildAuditConclusionContent,
  buildAuditStartDocParams,
  buildAuditStartOrderContent,
  isAuditConclusionPdfName,
  isAuditStartPdfName,
  type AuditStartDocParams,
} from '../utils/auditDocuments';
import AuditStartPrintDocument from './AuditStartPrintDocument';
import DocumentPrintShell from './DocumentPrintShell';
import AuditChecklistFullscreen from './AuditChecklistFullscreen';
import {
  buildAuditChecklist,
  computeAuditProgressFromRows,
  isAllObjectsScope,
  resolveAuditObjectDisplayName,
  resolveAuditPersonName,
  type AuditItemCheckStatus,
} from '../utils/auditInventory';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { stripEmbeddedLetterheadFromPlainDoc, resolveDocumentOrganizationName } from '../utils/documentHeader';
import { printDocument } from '../utils/printDocument';

interface AuditsViewProps {
  audits: InventoryAudit[];
  onAddAudit: (
    title: string, 
    responsibleUser: string, 
    objectName?: string, 
    controllerUser?: string, 
    conductorUser?: string,
    startNotes?: string,
    startPdf?: { name: string; size: string; content: string },
    auditId?: string
  ) => void;
  onCompleteAudit: (
    id: string, 
    mismatches: number, 
    conclusionNotes?: string,
    conclusionPdf?: { name: string; size: string; content: string }
  ) => void;
  onUpdateAuditItemCheck?: (
    auditId: string,
    itemKey: string,
    status: AuditItemCheckStatus | null
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
  onUpdateAuditItemCheck,
  onDeleteAudit,
  currentUser,
  objects = [],
  employees = [],
  workspaceName,
  computers = [],
  networkDevices = [],
}: AuditsViewProps) {
  const { t, language } = useTranslation();

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
    startParams?: AuditStartDocParams;
  } | null>(null);

  const isViewer = currentUser?.role === 'Viewer';
  const [deleteTarget, setDeleteTarget] = useState<InventoryAudit | null>(null);
  const [fullscreenChecklistAuditId, setFullscreenChecklistAuditId] = useState<string | null>(null);

  const checklistLabels = {
    defaultComputer: t('Компьютер'),
    defaultNetwork: t('Сетевое'),
  };

  const equipmentDocLabels = {
    defaultComputer: t('Компьютер'),
    defaultNetwork: t('Сетевое'),
    itAdmin: t('Служба ИТ / Админ'),
    unassigned: t('Не закреплено'),
    allObjects: t('Все объекты'),
    allDepartments: t('Все подразделения и офисы'),
  };

  const displayAuditObject = (ref?: string) => {
    if (!ref || isAllObjectsScope(ref)) return t('Все объекты');
    return resolveAuditObjectDisplayName(ref, objects) || ref;
  };

  const displayAuditPerson = (ref?: string, fallback?: string) => {
    const name = resolveAuditPersonName(ref, employees);
    if (name) return name;
    return fallback ?? t('Не указан');
  };

  const buildStartParams = (audit: Pick<InventoryAudit, 'id' | 'date' | 'objectName' | 'controllerUser' | 'conductorUser' | 'responsibleUser' | 'startNotes'>) =>
    buildAuditStartDocParams(audit, computers, networkDevices, workspaceName || '', equipmentDocLabels, {
      objects,
      employees,
    });

  // Helper to pre-fill responsive inputs
  const handleOpenAddModal = () => {
    setTitle(t('Плановая инвентаризация ТМЦ'));
    const defaultConductor = employees[0]?.id || employees[0]?.name || '';
    setResponsibleUser(defaultConductor);
    setSelectedObjectName(t('Все объекты'));
    setControllerUser(employees[1]?.id || employees[0]?.id || employees[1]?.name || employees[0]?.name || '');
    setConductorUser(defaultConductor);
    setStartNotes(t('Провести плановую сверку компьютерной техники, оргтехники и расходных материалов на объекте.'));
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !responsibleUser.trim()) return;

    const auditId = `aud-${Date.now().toString().slice(-4)}`;
    const curDate = new Date().toISOString().split('T')[0];

    const startParams = buildAuditStartDocParams(
      {
        id: auditId,
        date: curDate,
        objectName: selectedObjectName,
        controllerUser,
        conductorUser,
        responsibleUser,
        startNotes,
      },
      computers,
      networkDevices,
      workspaceName || '',
      equipmentDocLabels,
      { objects, employees }
    );

    const startContent = buildAuditStartOrderContent(startParams, language);

    const kbUnit = language === 'ru' ? 'КБ' : 'KB';
    const startPdf = {
      name: auditStartPdfName(auditId, language),
      size: `${(100 + startParams.equipmentRows.length * 0.15).toFixed(1)} ${kbUnit}`,
      content: startContent,
    };

    onAddAudit(
      title, 
      responsibleUser, 
      selectedObjectName, 
      controllerUser, 
      conductorUser, 
      startNotes,
      startPdf,
      auditId
    );

    const createdAudit: InventoryAudit = {
      id: auditId,
      date: curDate,
      title,
      status: 'В процессе',
      responsibleUser,
      itemsAudited: 0,
      mismatchesFound: 0,
      totalItems: startParams.equipmentRows.length,
      itemChecks: {},
      objectName: selectedObjectName,
      controllerUser,
      conductorUser,
      startNotes,
      pdfFiles: [startPdf],
    };

    setPreviewDoc({
      title: t('Приказ о начале инвентаризации'),
      type: 'start_order',
      audit: createdAudit,
      startParams,
      customContent: startContent,
    });

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
      const rows = buildAuditChecklist(audit, computers, networkDevices, checklistLabels, objects);
      const auditProgress = computeAuditProgressFromRows(rows);
      const checkedCount = auditProgress.checked || auditProgress.total;
      const kbUnit = language === 'ru' ? 'КБ' : 'KB';

      const conclusionPdf = uploadedConclusionPdf || {
        name: auditConclusionPdfName(audit.id, language),
        size: `158 ${kbUnit}`,
        content: buildAuditConclusionContent(
          {
            auditId: audit.id,
            date: curDate,
            workspaceName: workspaceName || '',
            objectName: audit.objectName || '',
            controllerUser: audit.controllerUser || '',
            conductorUser: audit.conductorUser || '',
            responsibleUser: audit.responsibleUser,
            mismatches,
            checkedCount,
            conclusionNotes,
          },
          language
        ),
      };

      onCompleteAudit(mismatchesModalId, mismatches, conclusionNotes, conclusionPdf);
      setMismatchesModalId(null);
      setMismatches(0);
      setConclusionNotes('');
      setUploadedConclusionPdf(null);
    }
  };

  // Trigger printable view using customized layout or standard window.print
  const triggerPrint = (_docTitle: string) => {
    printDocument();
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

          const checklistRows =
            audit.status === 'В процессе'
              ? buildAuditChecklist(audit, computers, networkDevices, checklistLabels, objects)
              : [];
          const progress =
            audit.status === 'В процессе'
              ? computeAuditProgressFromRows(checklistRows)
              : null;
          const totalTmc =
            audit.status === 'В процессе'
              ? progress?.total ?? audit.totalItems ?? 0
              : audit.itemsAudited || audit.totalItems || '-';

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
                      {t(audit.status)}
                    </span>
                    {audit.status === 'Завершена' && !isViewer && onDeleteAudit && (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(audit)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer flex items-center justify-center border border-transparent hover:border-rose-100"
                        title={t("Удалить законченную инвентаризацию")}
                      >
                        <Trash2 size={13} />
                      </button>
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
                    <span>{t("Объект проведения:")} {displayAuditObject(audit.objectName)}</span>
                  </div>
                </div>

                {/* Audit responsible panel */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">{t("Кто проводит:")}</span>
                    <div className="flex items-center gap-1 text-slate-700 font-medium">
                      <User size={12} className="text-slate-405" />
                      <span>{displayAuditPerson(audit.conductorUser || audit.responsibleUser)}</span>
                    </div>
                  </div>
                  <div className="space-y-1 sm:border-l sm:border-slate-150 sm:pl-3">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">{t("Кто контролирует:")}</span>
                    <div className="flex items-center gap-1 text-slate-700 font-medium">
                      <Users size={12} className="text-slate-405" />
                      <span>{displayAuditPerson(audit.controllerUser, t('Комиссия УК'))}</span>
                    </div>
                  </div>
                </div>

                {/* Mismatches results details */}
                <div className="pt-2 grid grid-cols-3 gap-2.5 text-center text-xs">
                  <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100/60">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">{t("Всего ТМЦ")}</span>
                    <strong className="text-slate-700 text-sm font-semibold">{totalTmc}</strong>
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

                {progress && progress.total > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-600">{t('Ход инвентаризации')}</span>
                      <span className="font-bold text-blue-600 tabular-nums">{progress.percent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500"
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 tabular-nums">
                      {t('Проверено')}: {progress.checked}/{progress.total}
                      {progress.remaining > 0 && (
                        <span className="ml-2">
                          · {t('Осталось')}: {progress.remaining}
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {audit.status === 'В процессе' && checklistRows.length > 0 && !isViewer && onUpdateAuditItemCheck && (
                  <button
                    type="button"
                    onClick={() => setFullscreenChecklistAuditId(audit.id)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-50 transition-colors text-left group"
                  >
                    <div>
                      <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wide block">
                        {t('Проверка позиций')}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        {t('Открыть на весь экран')} · {progress?.checked ?? 0}/{progress?.total ?? checklistRows.length}
                      </span>
                    </div>
                    <Maximize2 size={18} className="text-blue-600 shrink-0 group-hover:scale-110 transition-transform" />
                  </button>
                )}

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
                        const isConclusion = isAuditConclusionPdfName(pdf.name);
                        const isStart = isAuditStartPdfName(pdf.name) || !isConclusion;
                        return (
                          <button
                            key={idx}
                            onClick={() =>
                              setPreviewDoc({
                                title: isStart ? t('Приказ о начале инвентаризации') : t('Акт заключения инвентаризации'),
                                type: isStart ? 'start_order' : 'conclusion_act',
                                audit,
                                customContent: pdf.content,
                                startParams: isStart ? buildStartParams(audit) : undefined,
                              })
                            }
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
                      setMismatches(progress?.missing ?? audit.mismatchesFound ?? 0);
                      setConclusionNotes(t('В ходе инвентаризации несоответствий не обнаружено (или оперативно исправлено). Все единицы ТМЦ совпадают.'));
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
                  <option value={t('Все объекты')}>{t('Все объекты')}</option>
                  <option value={t('Все подразделения и офисы')}>{t('Все подразделения и офисы')}</option>
                  {objects.map((obj: any) => (
                    <option key={obj.id} value={obj.id}>{obj.name} (ул. {obj.address})</option>
                  ))}
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
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.position})</option>
                    ))}
                    <option value={t("Служба системного администрирования")}>{t("Служба системного администрирования")}</option>
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
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.position})</option>
                    ))}
                    <option value={t("Бухгалтерия и Руководство ИТ")}>{t("Бухгалтерия и Руководство ИТ")}</option>
                    <option value={t("Шевченко М.В. (Директор по ИТ)")}>{t("Шевченко М.В. (Директор по ИТ)")}</option>
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
                <p className="text-[10px] text-amber-800 leading-relaxed">{t("Будет автоматически сформирован")} <strong>{t("Приказ о начале инвентаризации")}</strong> {t("с закреплением ответственной комиссии и контролирующих лиц в машиносчитываемом акте.")}</p>
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
                            alert(t('Пожалуйста, выберите файл в формате PDF!'));
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
                <strong>{uploadedConclusionPdf ? t('Собственный акт во вложении:') : t('Автоматическая привязка:')}</strong>{' '}
                {uploadedConclusionPdf
                  ? t('Ваш подписанный PDF-документ будет сохранен в качестве официального отчета о завершении инвентаризации.')
                  : t('К карточке инвентаризации будет привязан официальный документ Акт инвентаризационного заключения с подписями председателя комиссии и исполнителей.')}
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
        <div className="fixed inset-0 z-50 flex flex-col">
          <div
            className="absolute inset-0 bg-slate-910/60 backdrop-blur-xs no-print"
            onClick={() => setPreviewDoc(null)}
            aria-hidden
          />

          <div className="relative z-10 flex flex-col h-full max-h-screen pointer-events-none">
            <div className="no-print sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm px-4 sm:px-6 py-3 flex items-center justify-between gap-3 pointer-events-auto">
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide flex items-center gap-1.5 truncate">
                  <FileText className="text-blue-500 shrink-0" size={16} />
                  {t('Печатный документ:')} {previewDoc.title}
                </h3>
                <span className="text-[10px] text-slate-400 block">{t('Предварительный просмотр печатной формы компании')}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => triggerPrint(previewDoc.title)}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Printer size={14} />
                  {t('Распечатать / PDF')}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="text-slate-400 hover:text-slate-650 bg-white p-2 rounded-full border border-slate-200 cursor-pointer shadow-3xs"
                  aria-label={t('Закрыть')}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-auto bg-slate-100 p-4 sm:p-6 flex justify-center min-h-0 pointer-events-auto">
              <div
                id="printable-audit-doc"
                className="doc-official-page audit-print-page shadow-lg border border-slate-200 bg-white"
              >
                <DocumentPrintShell>
                {(previewDoc.type === 'start_order' || previewDoc.startParams) ? (
                  <AuditStartPrintDocument
                    params={buildStartParams(previewDoc.audit)}
                    workspaceName={workspaceName}
                    objects={objects}
                  />
                ) : (
                  <div className="audit-a4-sheet whitespace-pre-wrap font-mono text-[10pt]">
                    {stripEmbeddedLetterheadFromPlainDoc(previewDoc.customContent || '')}
                  </div>
                )}

                <div className="audit-a4-footer no-print">
                  <div className="p-3 border border-dashed border-slate-300 bg-slate-50 rounded text-[9pt] uppercase font-bold tracking-wider leading-relaxed">
                    <strong>
                      {t('ШТАМП ОРГАНИЗАЦИИ')} [{' '}
                      {(resolveDocumentOrganizationName(workspaceName) || workspaceName || 'ООО "ГЛОБАЛ-КОНСАЛТ ИТ"').toUpperCase()}{' '}
                      ] {t('И СИСТЕМНАЯ СВЕРКА:')}
                    </strong>
                    <br />
                    <span className="text-[8pt] font-normal text-slate-500 lowercase normal-case">
                      {t(
                        'Система учета ИТ-оборудования Equipment Management Pro. Документ подписан электронной цифровой подписью комиссионных инспекторов.'
                      )}
                    </span>
                  </div>
                </div>
                </DocumentPrintShell>
              </div>
            </div>

            <div className="no-print bg-white px-4 sm:px-6 py-3 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400 pointer-events-auto">
              <span>
                {t('Документ зарегистрирован в журнале аудита')} ИНВ-{previewDoc.audit.id}
              </span>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-1.5 bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
              >
                {t('Закрыть просмотр')}
              </button>
            </div>
          </div>
        </div>
      )}

      {fullscreenChecklistAuditId && onUpdateAuditItemCheck && (() => {
        const fsAudit = audits.find((a) => a.id === fullscreenChecklistAuditId);
        if (!fsAudit) return null;
        const fsRows = buildAuditChecklist(fsAudit, computers, networkDevices, checklistLabels, objects);
        return (
          <AuditChecklistFullscreen
            audit={fsAudit}
            rows={fsRows}
            onUpdateItemCheck={onUpdateAuditItemCheck}
            onClose={() => setFullscreenChecklistAuditId(null)}
          />
        );
      })()}

      <ConfirmDeleteModal
        preview={
          deleteTarget
            ? {
                title: t('Удаление инвентаризации'),
                subtitle: t('Запись об инвентаризации будет удалена. Это действие необратимо.'),
                itemName: deleteTarget.title,
                detailLabel: 'ID',
                detailValue: deleteTarget.id,
                cascadeLines: [],
                confirmLabel: t('Удалить'),
              }
            : null
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget && onDeleteAudit) {
            onDeleteAudit(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}
