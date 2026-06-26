/*
 * Local document letterhead settings (not synced to server).
 */
import React, { useEffect, useState } from 'react';
import { FileText, RotateCcw, Save, Sparkles, Trash2 } from 'lucide-react';
import { useTranslation } from '../utils/i18n';
import {
  applyDocumentHeaderPreset,
  DEFAULT_DOCUMENT_HEADER,
  deleteDocumentHeaderPreset,
  DOCUMENT_HEADER_CHANGED,
  loadDocumentHeader,
  loadDocumentHeaderPresets,
  saveDocumentHeader,
  TSI_HEADER_EXAMPLE,
  upsertDocumentHeaderPreset,
  type DocumentHeaderConfig,
  type DocumentHeaderLine,
  type DocumentHeaderPreset,
} from '../utils/documentHeader';
import DocumentHeader from './DocumentHeader';

const LINE_FIELDS: Array<{ key: 'line1' | 'line2' | 'line3'; labelKey: string }> = [
  { key: 'line1', labelKey: 'Строка 1' },
  { key: 'line2', labelKey: 'Строка 2' },
  { key: 'line3', labelKey: 'Строка 3' },
];

export default function DocumentHeaderSettings({
  compact = false,
  onSaved,
}: {
  compact?: boolean;
  onSaved?: () => void;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<DocumentHeaderConfig>(() => loadDocumentHeader());
  const [presets, setPresets] = useState<DocumentHeaderPreset[]>(() => loadDocumentHeaderPresets());
  const [presetName, setPresetName] = useState('');
  const [saved, setSaved] = useState(false);

  const refresh = () => {
    setDraft(loadDocumentHeader());
    setPresets(loadDocumentHeaderPresets());
  };

  useEffect(() => {
    window.addEventListener(DOCUMENT_HEADER_CHANGED, refresh);
    return () => window.removeEventListener(DOCUMENT_HEADER_CHANGED, refresh);
  }, []);

  const updateLine = (key: 'line1' | 'line2' | 'line3', patch: Partial<DocumentHeaderLine>) => {
    setDraft((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const handleSaveAndApplyAll = () => {
    const next: DocumentHeaderConfig = {
      ...draft,
      enabled: true,
      applyToAllDocuments: true,
    };
    saveDocumentHeader(next);
    setDraft(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    onSaved?.();
  };

  const handleSaveAsPreset = () => {
    const name = presetName.trim() || t('Моя шапка');
    const nextPresets = upsertDocumentHeaderPreset(name, {
      ...draft,
      enabled: true,
      applyToAllDocuments: true,
    });
    setPresets(nextPresets);
    setDraft(loadDocumentHeader());
    setPresetName('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    onSaved?.();
  };

  const handleLoadPreset = (id: string) => {
    const applied = applyDocumentHeaderPreset(id);
    if (applied) {
      setDraft(applied);
      onSaved?.();
    }
  };

  const handleDeletePreset = (id: string) => {
    setPresets(deleteDocumentHeaderPreset(id));
    onSaved?.();
  };

  const applyExample = () => setDraft({ ...TSI_HEADER_EXAMPLE });

  const resetEmpty = () => setDraft({ ...DEFAULT_DOCUMENT_HEADER });

  const rootClass = compact
    ? 'bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3'
    : 'bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4';

  return (
    <div className={rootClass}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <FileText size={16} className="text-blue-500" />
            {t('Шапка печатных документов')}
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
            {t(
              'Локально на этом ПК. Шапка накладывается поверх всех печатных документов: акты, отчёты, инвентаризация.'
            )}
          </p>
        </div>
        <label className="flex items-center gap-2 shrink-0 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={draft.enabled}
            onChange={(e) => setDraft((prev) => ({ ...prev, enabled: e.target.checked }))}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-xs font-semibold text-slate-600">{t('Включить')}</span>
        </label>
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none bg-blue-50/80 border border-blue-100 rounded-lg px-2.5 py-2">
        <input
          type="checkbox"
          checked={draft.applyToAllDocuments !== false}
          onChange={(e) => setDraft((prev) => ({ ...prev, applyToAllDocuments: e.target.checked }))}
          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-xs font-semibold text-slate-700">
          {t('Применять эту шапку ко всем документам (акты, отчёты, инвентаризация)')}
        </span>
      </label>

      {presets.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase">{t('Сохранённые шаблоны')}</p>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-lg border border-slate-200 bg-slate-50 text-[11px]"
              >
                <button
                  type="button"
                  onClick={() => handleLoadPreset(preset.id)}
                  className="font-semibold text-slate-700 hover:text-blue-700 cursor-pointer"
                >
                  {preset.name}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePreset(preset.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                  aria-label={t('Удалить шаблон')}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={applyExample}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer"
        >
          <Sparkles size={13} />
          {t('Пример ТСИ')}
        </button>
        <button
          type="button"
          onClick={resetEmpty}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <RotateCcw size={13} />
          {t('Очистить')}
        </button>
      </div>

      <div className="grid gap-2">
        {LINE_FIELDS.map(({ key, labelKey }) => {
          const line = draft[key];
          return (
            <div
              key={key}
              className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto_auto_auto] gap-1.5 items-end bg-slate-50/80 p-2 rounded-lg border border-slate-100"
            >
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">{t(labelKey)}</label>
                <input
                  type="text"
                  value={line.text}
                  onChange={(e) => updateLine(key, { text: e.target.value })}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder={t('Текст строки шапки')}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">{t('Размер, pt')}</label>
                <input
                  type="number"
                  min={8}
                  max={28}
                  step={1}
                  value={line.fontSizePt}
                  onChange={(e) => updateLine(key, { fontSizePt: Number(e.target.value) || 12 })}
                  className="w-16 px-1.5 py-1.5 border border-slate-200 rounded-lg text-sm text-center font-mono text-slate-700"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">{t('Цвет')}</label>
                <input
                  type="color"
                  value={line.color}
                  onChange={(e) => updateLine(key, { color: e.target.value })}
                  className="h-[34px] w-12 border border-slate-200 rounded-lg cursor-pointer bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">HEX</label>
                <input
                  type="text"
                  value={line.color}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) updateLine(key, { color: v });
                  }}
                  maxLength={7}
                  className="w-20 px-1.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 uppercase"
                />
              </div>
              <label className="flex items-center gap-1.5 h-[34px] px-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={line.bold}
                  onChange={(e) => updateLine(key, { bold: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600"
                />
                <span className="text-[11px] font-medium text-slate-600">{t('Жирный')}</span>
              </label>
            </div>
          );
        })}
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={draft.showDivider}
          onChange={(e) => setDraft((prev) => ({ ...prev, showDivider: e.target.checked }))}
          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-xs text-slate-600">{t('Горизонтальная линия под шапкой')}</span>
      </label>

      <div className="border border-dashed border-slate-200 rounded-lg p-3 bg-white relative overflow-hidden">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t('Предпросмотр')}</p>
        <div className="relative border border-slate-100 rounded-lg p-3 min-h-[72px] bg-white">
          <DocumentHeader config={{ ...draft, enabled: true, applyToAllDocuments: true }} />
          <p className="text-[9pt] text-slate-500 text-center mt-3 font-serif">
            {t('…текст документа под шапкой…')}
          </p>
        </div>
        {!draft.enabled && (
          <p className="text-xs text-slate-400 italic text-center mt-2">{t('Шапка отключена — в документах не отображается')}</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:items-center">
        <button
          type="button"
          onClick={handleSaveAndApplyAll}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
        >
          <Save size={14} />
          {t('Сохранить и применить ко всем документам')}
        </button>
        <div className="flex gap-2 flex-1 min-w-[200px]">
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder={t('Имя шаблона')}
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700"
          />
          <button
            type="button"
            onClick={handleSaveAsPreset}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer whitespace-nowrap"
          >
            {t('В шаблоны')}
          </button>
        </div>
        {saved && <span className="text-xs text-emerald-600 font-medium">{t('Сохранено на этом ПК')}</span>}
      </div>
    </div>
  );
}
