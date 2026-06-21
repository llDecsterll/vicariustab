/*
 * Unified confirmation dialog for deletions across the platform
 */
import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useTranslation } from '../utils/i18n';
import ModalCloseButton from './ModalCloseButton';

export interface ConfirmDeletePreview {
  title: string;
  subtitle: string;
  itemName: string;
  detailLabel: string;
  detailValue: string;
  cascadeLines: string[];
  confirmLabel?: string;
}

interface ConfirmDeleteModalProps {
  preview: ConfirmDeletePreview | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmDeleteModal({
  preview,
  onClose,
  onConfirm,
}: ConfirmDeleteModalProps) {
  const { t } = useTranslation();
  if (!preview) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-100 overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800">{t(preview.title)}</h3>
                <p className="text-xs text-slate-500 mt-1">{t(preview.subtitle)}</p>
              </div>
            </div>
            <ModalCloseButton onClick={onClose} />
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm space-y-2">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">{t('Наименование')}</span>
              <p className="font-semibold text-slate-800">{preview.itemName}</p>
            </div>
            {preview.detailValue && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">{t(preview.detailLabel)}</span>
                <p className="font-mono text-xs text-slate-600 break-all">{preview.detailValue}</p>
              </div>
            )}
          </div>

          {preview.cascadeLines.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase">{t('Будет удалено также')}</p>
              <ul className="text-xs text-slate-600 space-y-1.5">
                {preview.cascadeLines.map((line) => (
                  <li key={line} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-500 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
            >
              {t('Отмена')}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              {t(preview.confirmLabel || 'Удалить')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
