/*
 * Structured «было / стало» replacement form with history list.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Wrench, Cpu, Edit2, Trash2 } from 'lucide-react';
import { useTranslation } from '../utils/i18n';
import {
  ComponentReplacementProfile,
  getComponentReplacementSlots,
  latestComponentValueByName,
} from '../utils/componentReplacementTemplates';

export interface ReplacedComponentEntry {
  id: string;
  name: string;
  oldDetails: string;
  newDetails: string;
  date: string;
  reason?: string;
}

interface SlotDraft {
  customName: string;
  was: string;
  became: string;
}

interface ComponentReplacementSectionProps {
  profile: ComponentReplacementProfile;
  itemId: string;
  replacedComponents?: ReplacedComponentEntry[];
  isViewer: boolean;
  onUpdate: (list: ReplacedComponentEntry[]) => void;
}

function emptyDrafts(): Record<string, SlotDraft> {
  return {};
}

export default function ComponentReplacementSection({
  profile,
  itemId,
  replacedComponents = [],
  isViewer,
  onUpdate,
}: ComponentReplacementSectionProps) {
  const { t } = useTranslation();
  const slots = useMemo(() => getComponentReplacementSlots(profile), [profile]);

  const [drafts, setDrafts] = useState<Record<string, SlotDraft>>(emptyDrafts);
  const [compDate, setCompDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [compReason, setCompReason] = useState('');
  const [editingCompId, setEditingCompId] = useState<string | null>(null);
  const [confirmDeleteCompId, setConfirmDeleteCompId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editOld, setEditOld] = useState('');
  const [editNew, setEditNew] = useState('');
  const [editReason, setEditReason] = useState('');
  const [editDate, setEditDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const next: Record<string, SlotDraft> = {};
    for (const slot of slots) {
      const label = slot.label.trim();
      const prefillWas = label ? latestComponentValueByName(replacedComponents, label) : '';
      next[slot.key] = { customName: '', was: prefillWas, became: '' };
    }
    setDrafts(next);
    setEditingCompId(null);
    setConfirmDeleteCompId(null);
  }, [profile, itemId, slots]);

  const updateDraft = (key: string, patch: Partial<SlotDraft>) => {
    setDrafts((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...patch },
    }));
  };

  const handleSaveReplacements = () => {
    const entries: ReplacedComponentEntry[] = [];
    const baseTs = Date.now();

    slots.forEach((slot, index) => {
      const draft = drafts[slot.key];
      if (!draft) return;
      const name = slot.customLabel ? draft.customName.trim() : slot.label.trim();
      const became = draft.became.trim();
      if (!name || !became) return;
      entries.push({
        id: `rep-${baseTs}-${index}`,
        name,
        oldDetails: draft.was.trim() || 'Не указано',
        newDetails: became,
        date: compDate,
        reason: compReason.trim() || undefined,
      });
    });

    if (entries.length === 0) {
      alert('Заполните хотя бы одну строку: укажите «Стало» (и название для пустых строк).');
      return;
    }

    onUpdate([...replacedComponents, ...entries]);

    setDrafts((prev) => {
      const next = { ...prev };
      for (const slot of slots) {
        const draft = next[slot.key];
        if (!draft) continue;
        const name = slot.customLabel ? draft.customName.trim() : slot.label.trim();
        const became = draft.became.trim();
        if (!name || !became) continue;
        next[slot.key] = {
          customName: slot.customLabel ? draft.customName : '',
          was: became,
          became: '',
        };
      }
      return next;
    });
    setCompReason('');
  };

  const handleSaveEdit = () => {
    if (!editingCompId || !editName.trim() || !editNew.trim()) {
      alert('Укажите название комплектующей и значение «Стало».');
      return;
    }
    const list = replacedComponents.map((rc) =>
      rc.id === editingCompId
        ? {
            ...rc,
            name: editName.trim(),
            oldDetails: editOld.trim() || 'Не указано',
            newDetails: editNew.trim(),
            date: editDate,
            reason: editReason.trim() || undefined,
          }
        : rc
    );
    onUpdate(list);
    setEditingCompId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-wider">
          <Wrench size={14} className="text-slate-500" />
          {t('Замена комплектующих и ремонт')}
        </h4>
        <span className="font-mono bg-slate-100 text-slate-650 px-1.5 py-0.5 rounded-md text-[10px] font-bold">
          {replacedComponents.length}
        </span>
      </div>

      <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
        {replacedComponents.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4 text-center">
            {t(
              'Ремонты или замены запчастей не зафиксированы. Устройство находится в исходной заводской комплектации.'
            )}
          </p>
        ) : (
          replacedComponents.map((comp) => (
            <div
              key={comp.id}
              className="p-2.5 bg-slate-50 rounded-xl border border-slate-100/80 hover:shadow-2xs transition-shadow relative group"
            >
              <div className="flex justify-between items-start">
                <span className="font-bold text-slate-800 text-[11px] leading-tight flex items-center gap-1">
                  <Cpu size={10} className="text-blue-500" />
                  {comp.name}
                </span>
                <span className="text-[9px] text-slate-400 font-medium font-mono">{comp.date}</span>
              </div>
              <div className="mt-1.5 space-y-0.5 pl-3 border-l-2 border-slate-200">
                <div className="text-[10px] text-slate-500">
                  {t('Было:')}
                  <span className="font-medium text-slate-700 font-mono">{comp.oldDetails}</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  {t('Новое:')}
                  <span className="font-bold text-emerald-700 font-mono">{comp.newDetails}</span>
                </div>
                {comp.reason && (
                  <div className="text-[9.5px] text-slate-400 italic mt-0.5">{t('Причина:')} {comp.reason}</div>
                )}
              </div>
              {!isViewer && (
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCompId(comp.id);
                      setEditName(comp.name);
                      setEditOld(comp.oldDetails || '');
                      setEditNew(comp.newDetails);
                      setEditReason(comp.reason || '');
                      setEditDate(comp.date || new Date().toISOString().split('T')[0]);
                    }}
                    className="p-1 bg-white hover:bg-blue-50 text-blue-500 hover:text-blue-700 rounded border border-slate-200 transition-all cursor-pointer inline-flex items-center justify-center"
                    title={t('Редактировать замену')}
                  >
                    <Edit2 size={11} />
                  </button>
                  {confirmDeleteCompId === comp.id ? (
                    <div className="flex items-center gap-1 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 text-[10px] animate-fade-in z-20 shadow-xs">
                      <span className="text-rose-700 font-bold">{t('Удалить?')}</span>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdate(replacedComponents.filter((rc) => rc.id !== comp.id));
                          if (editingCompId === comp.id) setEditingCompId(null);
                          setConfirmDeleteCompId(null);
                        }}
                        className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold cursor-pointer transition-colors"
                      >
                        {t('Да')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteCompId(null)}
                        className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-bold cursor-pointer transition-colors"
                      >
                        {t('Нет')}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteCompId(comp.id)}
                      className="p-1 bg-white hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded border border-slate-200 transition-all cursor-pointer inline-flex items-center justify-center"
                      title={t('Удалить замену')}
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {!isViewer && editingCompId && (
        <div className="p-3 border rounded-xl space-y-2.5 shadow-2xs bg-amber-50/30 border-amber-100">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
              {t('Редактировать замену комплектующей')}
            </span>
            <button
              type="button"
              onClick={() => setEditingCompId(null)}
              className="text-[9.5px] font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
            >
              {t('Отмена')}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="px-2 py-1.5 border border-slate-205 rounded bg-white text-[11px] focus:outline-none"
            />
            <input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="px-2 py-1.5 border border-slate-205 rounded bg-white text-[11px] focus:outline-none font-mono text-slate-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder={t('Было')}
              value={editOld}
              onChange={(e) => setEditOld(e.target.value)}
              className="px-2 py-1.5 border border-slate-205 rounded bg-white text-[11px] focus:outline-none"
            />
            <input
              type="text"
              placeholder={t('Стало')}
              value={editNew}
              onChange={(e) => setEditNew(e.target.value)}
              className="px-2 py-1.5 border border-slate-205 rounded bg-white text-[11px] focus:outline-none"
            />
          </div>
          <input
            type="text"
            placeholder={t('Причина замены (например, Износ или Апгрейд)')}
            value={editReason}
            onChange={(e) => setEditReason(e.target.value)}
            className="w-full px-2 py-1.5 border border-slate-205 rounded bg-white text-[11px] focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSaveEdit}
            className="w-full py-1.5 rounded text-[10px] font-bold transition-colors cursor-pointer bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
          >
            {t('Сохранить изменения')}
          </button>
        </div>
      )}

      {!isViewer && !editingCompId && (
        <div className="p-4 border rounded-xl space-y-3 shadow-2xs bg-blue-50/30 border-blue-100">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-800 block">
            {t('Зафиксировать замену комплектующих')}
          </span>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="hidden sm:grid sm:grid-cols-[minmax(200px,1.35fr)_1fr_1fr] gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-[11px] font-bold uppercase text-slate-500 tracking-wide">
              <span>{t('Комплектующая')}</span>
              <span>{t('Было')}</span>
              <span>{t('Стало')}</span>
            </div>
            <div className="divide-y divide-slate-100">
              {slots.map((slot) => {
                const draft = drafts[slot.key] || { customName: '', was: '', became: '' };
                return (
                  <div
                    key={slot.key}
                    className="px-4 py-3 sm:grid sm:grid-cols-[minmax(200px,1.35fr)_1fr_1fr] sm:gap-3 sm:items-center space-y-2 sm:space-y-0"
                  >
                    <div className="min-w-0">
                      {slot.customLabel ? (
                        <input
                          type="text"
                          placeholder={t('Название комплектующей')}
                          value={draft.customName}
                          onChange={(e) => updateDraft(slot.key, { customName: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      ) : (
                        <span className="text-sm font-medium text-slate-700 leading-snug block">{slot.label}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <label className="sm:hidden text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                        {t('Было')}
                      </label>
                      <input
                        type="text"
                        placeholder={t('Было')}
                        value={draft.was}
                        onChange={(e) => updateDraft(slot.key, { was: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <div className="min-w-0">
                      <label className="sm:hidden text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                        {t('Стало')}
                      </label>
                      <input
                        type="text"
                        placeholder={t('Стало')}
                        value={draft.became}
                        onChange={(e) => updateDraft(slot.key, { became: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="date"
              value={compDate}
              onChange={(e) => setCompDate(e.target.value)}
              className="px-3 py-2 border border-slate-205 rounded-lg bg-white text-sm focus:outline-none font-mono text-slate-600 focus:ring-2 focus:ring-blue-100"
            />
            <input
              type="text"
              placeholder={t('Причина замены (например, Износ или Апгрейд)')}
              value={compReason}
              onChange={(e) => setCompReason(e.target.value)}
              className="px-3 py-2 border border-slate-205 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="button"
            onClick={handleSaveReplacements}
            className="w-full py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
          >
            {t('Сохранить замены')}
          </button>
        </div>
      )}
    </div>
  );
}
