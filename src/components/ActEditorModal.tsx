/*
 * Full-screen interactive act editor — split form + live preview (per mockup).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Trash2,
  Plus,
  Printer,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Save,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { ComputerItem, EmployeeItem, NetworkDevice, SystemUser } from '../types';
import { useTranslation } from '../utils/i18n';
import {
  actDraftKey,
  actFormsEqual,
  buildDefaultActForm,
  clearActDraft,
  loadActDraft,
  releasedByOptionsFromUsers,
  resolveReleasedByDisplayName,
  saveActDraft,
  type ActFormState,
} from '../utils/actDraft';
import { formatPersonShortName } from '../utils/personName';
import { downloadDocumentAsPdf, printDocument } from '../utils/printDocument';
import ActPrintContent, { type ActItemType } from './ActPrintContent';

interface ActEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: ActItemType;
  item: Record<string, unknown>;
  computers: ComputerItem[];
  employees: EmployeeItem[];
  networkDevices: NetworkDevice[];
  users: SystemUser[];
  currentUser?: SystemUser | null;
  workspaceName?: string;
}

function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50/80 hover:bg-slate-100/80 transition-colors cursor-pointer"
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{title}</span>
        {open ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
      </button>
      {open && <div className="p-3.5 space-y-3 border-t border-slate-100">{children}</div>}
    </div>
  );
}

export default function ActEditorModal({
  isOpen,
  onClose,
  itemType,
  item,
  computers,
  employees,
  networkDevices,
  users,
  currentUser,
  workspaceName,
}: ActEditorModalProps) {
  const { t } = useTranslation();
  const itemId = String(item.id ?? '');
  const draftKey = actDraftKey(itemType, itemId);

  const [form, setForm] = useState<ActFormState>(() =>
    buildDefaultActForm(item, itemType, workspaceName, currentUser)
  );
  const [baseline, setBaseline] = useState<ActFormState>(form);
  const [lastSaved, setLastSaved] = useState<ActFormState | null>(null);
  const [dragClauseIndex, setDragClauseIndex] = useState<number | null>(null);
  const [previewZoom, setPreviewZoom] = useState(100);
  const [fitWidth, setFitWidth] = useState(false);
  const previewWrapRef = useRef<HTMLDivElement>(null);

  const isDirty = !actFormsEqual(form, baseline);
  const isSaved = lastSaved !== null && actFormsEqual(form, lastSaved) && !isDirty;

  useEffect(() => {
    if (!isOpen) return;
    const draft = loadActDraft(draftKey);
    const defaults = buildDefaultActForm(item, itemType, workspaceName, currentUser);
    const initial = draft
      ? {
          ...defaults,
          ...draft,
          clauses: draft.clauses.length ? draft.clauses : defaults.clauses,
          releasedBy: resolveReleasedByDisplayName(draft.releasedBy, users),
        }
      : defaults;
    setForm(initial);
    setBaseline(initial);
    setLastSaved(draft ? initial : null);
    setPreviewZoom(100);
    setFitWidth(false);
  }, [isOpen, draftKey, item, itemType, workspaceName, currentUser, users]);

  const updateForm = useCallback((patch: Partial<ActFormState>) => {
    setForm(prev => ({ ...prev, ...patch }));
  }, []);

  const employeeOptions = useMemo(() => employees.map(e => e.name).filter(Boolean), [employees]);

  const departmentOptions = useMemo(() => {
    const deps = new Set<string>();
    employees.forEach(e => {
      if (e.department?.trim()) deps.add(e.department.trim());
    });
    return Array.from(deps);
  }, [employees]);

  const releasedByOptions = useMemo(
    () => releasedByOptionsFromUsers(users, form.releasedBy),
    [users, form.releasedBy]
  );

  const handleReceiverChange = (name: string) => {
    const emp = employees.find(e => e.name === name);
    updateForm({
      actReceiver: formatPersonShortName(name),
      actReceiverSub: emp
        ? `${emp.position || 'Штатный сотрудник'}${emp.department ? ` • Отдел: ${emp.department}` : ''}`
        : form.actReceiverSub,
    });
  };

  const handleSaveDraft = () => {
    saveActDraft(draftKey, form);
    setLastSaved({ ...form });
    setBaseline({ ...form });
  };

  const handleReset = () => {
    const message = lastSaved
      ? t('Сбросить несохранённые изменения к последней сохранённой версии черновика?')
      : t('Сбросить несохранённые изменения к исходным значениям?');
    if (!window.confirm(message)) return;
    setForm({ ...baseline });
  };

  const handleDeleteDraft = () => {
    if (!lastSaved) return;
    if (!window.confirm(t('Удалить сохранённый черновик акта? Это действие нельзя отменить.'))) return;
    clearActDraft(draftKey);
    const defaults = buildDefaultActForm(item, itemType, workspaceName, currentUser);
    setForm(defaults);
    setBaseline(defaults);
    setLastSaved(null);
  };

  const handleAddClause = () => {
    updateForm({ clauses: [...form.clauses, t('Новый пункт ответственности.')] });
  };

  const handleRemoveClause = (index: number) => {
    if (form.clauses.length <= 1) return;
    updateForm({ clauses: form.clauses.filter((_, i) => i !== index) });
  };

  const handleClauseChange = (index: number, value: string) => {
    const next = [...form.clauses];
    next[index] = value;
    updateForm({ clauses: next });
  };

  const handleClauseDrop = (targetIndex: number) => {
    if (dragClauseIndex === null || dragClauseIndex === targetIndex) return;
    const next = [...form.clauses];
    const [moved] = next.splice(dragClauseIndex, 1);
    next.splice(targetIndex, 0, moved);
    updateForm({ clauses: next });
    setDragClauseIndex(null);
  };

  const pdfFilename = `Акт_${form.actNumber.replace(/[^\w\-а-яА-ЯёЁ]/gi, '_')}.pdf`;

  const effectiveZoom = useMemo(() => {
    if (!fitWidth || !previewWrapRef.current) return previewZoom;
    const wrapW = previewWrapRef.current.clientWidth - 32;
    const pageW = 794;
    return Math.min(150, Math.max(40, Math.round((wrapW / pageW) * 100)));
  }, [fitWidth, previewZoom]);

  if (!isOpen) return null;

  return (
    <div className="act-editor-modal fixed inset-0 z-[60] flex flex-col bg-slate-100">
      <header className="no-print shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-sm font-bold text-slate-800 truncate">{t('Акт передачи оборудования')}</h2>
          <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
            {t('Черновик')}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {isSaved ? (
            <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
              <CheckCircle2 size={14} />
              {t('Все изменения сохранены')}
            </span>
          ) : isDirty ? (
            <span className="hidden sm:block text-[11px] text-slate-400">{t('Есть несохранённые изменения')}</span>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer"
            aria-label={t('Закрыть')}
          >
            <X size={18} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="no-print act-editor-form flex flex-col min-h-0 border-r border-slate-200 bg-slate-50/50 xl:w-[42%] xl:max-w-xl w-full shrink-0">
            <div className="px-4 py-3 border-b border-slate-200 bg-white">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t('Редактирование акта')}</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <CollapsibleSection title={t('Основная информация')}>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{t('Номер акта')}</label>
                    <input
                      type="text"
                      value={form.actNumber}
                      onChange={e => updateForm({ actNumber: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{t('Дата выдачи')}</label>
                    <input
                      type="date"
                      value={form.actDate}
                      onChange={e => updateForm({ actDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{t('Организация (заголовок)')}</label>
                  <input
                    type="text"
                    value={form.actCompany}
                    onChange={e => updateForm({ actCompany: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{t('Подзаголовок')}</label>
                  <input
                    type="text"
                    value={form.actSub}
                    onChange={e => updateForm({ actSub: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{t('Передающая сторона')}</label>
                    <input
                      type="text"
                      value={form.actSender}
                      onChange={e => updateForm({ actSender: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{t('Кем отпущено')}</label>
                    <select
                      value={form.releasedBy}
                      onChange={e => updateForm({ releasedBy: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      {releasedByOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {itemType !== 'object' && (
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{t('Получатель (сотрудник)')}</label>
                      {employeeOptions.length > 0 ? (
                        <select
                          value={form.actReceiver}
                          onChange={e => handleReceiverChange(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                          <option value={form.actReceiver}>{form.actReceiver}</option>
                          {employeeOptions
                            .filter(n => n !== form.actReceiver)
                            .map(name => (
                              <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={form.actReceiver}
                          onChange={e => updateForm({ actReceiver: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{t('Должность и отдел')}</label>
                      {departmentOptions.length > 0 ? (
                        <select
                          value={form.actReceiverSub}
                          onChange={e => updateForm({ actReceiverSub: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                          <option value={form.actReceiverSub}>{form.actReceiverSub}</option>
                          {departmentOptions.map(dep => {
                            const label = `Штатный сотрудник • Отдел: ${dep}`;
                            return (
                              <option key={dep} value={label}>{label}</option>
                            );
                          })}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={form.actReceiverSub}
                          onChange={e => updateForm({ actReceiverSub: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      )}
                    </div>
                  </div>
                )}
                {itemType === 'object' && (
                  <p className="text-[10px] text-slate-500 leading-relaxed bg-blue-50/60 border border-blue-100 rounded-lg p-2.5">
                    {t('В режиме паспорта объекта список оборудования формируется автоматически из реестра.')}{' '}
                    <strong className="text-slate-700">{String(item.name)}</strong>
                  </p>
                )}
              </CollapsibleSection>

              {itemType !== 'object' && (
                <CollapsibleSection title={t('Условия ответственности сотрудников')}>
                  <div className="space-y-2">
                    {form.clauses.map((clause, index) => (
                      <div
                        key={index}
                        draggable
                        onDragStart={() => setDragClauseIndex(index)}
                        onDragOver={e => e.preventDefault()}
                        onDrop={() => handleClauseDrop(index)}
                        onDragEnd={() => setDragClauseIndex(null)}
                        className={`flex gap-1.5 items-start rounded-lg border p-2 transition-colors ${
                          dragClauseIndex === index ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <button
                          type="button"
                          className="shrink-0 p-1 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing"
                          aria-label={t('Перетащить')}
                        >
                          <GripVertical size={14} />
                        </button>
                        <div className="flex-1 min-w-0">
                          <label className="block text-[9px] font-bold text-slate-400 mb-0.5">
                            {t('Пункт')} {index + 1}
                          </label>
                          <textarea
                            value={clause}
                            onChange={e => handleClauseChange(index, e.target.value)}
                            rows={2}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs leading-snug resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveClause(index)}
                          disabled={form.clauses.length <= 1}
                          className="shrink-0 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                          aria-label={t('Удалить пункт')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddClause}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 border border-dashed border-blue-200 rounded-lg cursor-pointer transition-colors"
                  >
                    <Plus size={14} />
                    {t('Добавить пункт')}
                  </button>
                </CollapsibleSection>
              )}

              <div className="flex gap-2 items-start p-3 bg-blue-50 border border-blue-100 rounded-xl text-[10px] text-blue-800 leading-relaxed">
                <Info size={14} className="shrink-0 mt-0.5" />
                <p>
                  {t('Поля слева автоматически обновляют документ справа. Сохраните черновик, чтобы не потерять правки при закрытии окна.')}
                </p>
              </div>
            </div>
          </div>

        <div className="act-editor-preview flex flex-col min-h-0 flex-1 bg-slate-200/60 min-w-0">
          <div className="no-print act-editor-preview-toolbar shrink-0 flex items-center justify-between gap-2 px-4 py-2 bg-white border-b border-slate-200">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => { setFitWidth(false); setPreviewZoom(z => Math.max(50, z - 10)); }}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                  title={t('Уменьшить')}
                >
                  <ZoomOut size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => { setFitWidth(false); setPreviewZoom(100); }}
                  className="px-2 py-1 rounded-lg hover:bg-slate-100 text-[11px] font-mono text-slate-600 cursor-pointer min-w-12"
                >
                  {fitWidth ? `${effectiveZoom}%` : `${previewZoom}%`}
                </button>
                <button
                  type="button"
                  onClick={() => { setFitWidth(false); setPreviewZoom(z => Math.min(150, z + 10)); }}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                  title={t('Увеличить')}
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setFitWidth(true)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                  title={t('По ширине')}
                >
                  <Maximize2 size={16} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => downloadDocumentAsPdf(pdfFilename)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
              >
                <Download size={14} />
                {t('Скачать PDF')}
              </button>
            </div>

            <div ref={previewWrapRef} className="act-editor-preview-wrap flex-1 overflow-auto p-4 sm:p-6 flex justify-center items-start">
              <div
                style={{
                  transform: `scale(${effectiveZoom / 100})`,
                  transformOrigin: 'top center',
                }}
                className="act-editor-preview-zoom transition-transform duration-150"
              >
                <div
                  id="printable-act-block"
                  className="doc-official-page doc-official-page--preview"
                >
                  <ActPrintContent
                    itemType={itemType}
                    item={item}
                    form={form}
                    computers={computers}
                    employees={employees}
                    networkDevices={networkDevices}
                    currentUser={currentUser}
                    workspaceName={workspaceName}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

      <footer className="no-print shrink-0 bg-white border-t border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleReset}
          className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw size={14} />
          {t('Сбросить изменения')}
        </button>
        {lastSaved ? (
          <button
            type="button"
            onClick={handleDeleteDraft}
            className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 size={14} />
            {t('Удалить черновик')}
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleSaveDraft}
          className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 cursor-pointer"
        >
          <Save size={14} />
          {t('Сохранить черновик')}
        </button>
        <button
          type="button"
          onClick={() => printDocument({ title: pdfFilename })}
          className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
        >
          <Printer size={14} />
          {t('Сформировать и печать')}
        </button>
      </footer>
    </div>
  );
}
