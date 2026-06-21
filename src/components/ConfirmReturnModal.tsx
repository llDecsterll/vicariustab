/*
 * Unified confirmation dialog for returning equipment to warehouse
 */
import React from 'react';
import { Package, RotateCcw } from 'lucide-react';
import { useTranslation } from '../utils/i18n';
import ModalCloseButton from './ModalCloseButton';

export interface ConfirmReturnPreview {
  itemName: string;
  inventoryLabel: string;
  warehouseName: string;
}

interface ConfirmReturnModalProps {
  preview: ConfirmReturnPreview | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmReturnModal({
  preview,
  onClose,
  onConfirm,
}: ConfirmReturnModalProps) {
  const { t } = useTranslation();
  if (!preview) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-100 overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                <Package size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800">{t('Возврат на склад')}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {t('Оборудование будет возвращено на склад и отображено в разделе «Склад ИТ».')}
                </p>
              </div>
            </div>
            <ModalCloseButton onClick={onClose} />
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm space-y-2">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">{t('Наименование')}</span>
              <p className="font-semibold text-slate-800">{preview.itemName}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">{t('Инв. № / ключ')}</span>
              <p className="font-mono text-xs text-slate-600 break-all">{preview.inventoryLabel}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">{t('Целевой склад')}</span>
              <p className="text-xs font-semibold text-emerald-700">{preview.warehouseName}</p>
            </div>
          </div>

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
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
            >
              <RotateCcw size={14} />
              {t('Вернуть на склад')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
