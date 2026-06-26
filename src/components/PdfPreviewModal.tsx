import React, { useEffect, useState } from 'react';
import { ExternalLink, Download, FileText } from 'lucide-react';
import ModalCloseButton from './ModalCloseButton';
import { useTranslation } from '../utils/i18n';

export interface PdfPreviewFile {
  name: string;
  size?: string;
  content?: string;
}

interface PdfPreviewModalProps {
  file: PdfPreviewFile;
  onClose: () => void;
  subtitle?: string;
}

function resolveBlobUrl(dataUrl: string): string {
  if (!dataUrl.startsWith('data:')) return dataUrl;
  try {
    const parts = dataUrl.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/pdf';
    const binary = atob(parts[1]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes], { type: mime }));
  } catch {
    return dataUrl;
  }
}

export default function PdfPreviewModal({ file, onClose, subtitle }: PdfPreviewModalProps) {
  const { t } = useTranslation();
  const [blobUrl, setBlobUrl] = useState('');

  useEffect(() => {
    if (!file.content) {
      setBlobUrl('');
      return;
    }
    const url = resolveBlobUrl(file.content);
    setBlobUrl(url);
    return () => {
      if (url.startsWith('blob:')) URL.revokeObjectURL(url);
    };
  }, [file]);

  const handleDownload = () => {
    const href = blobUrl || file.content || '';
    if (!href) return;
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = file.name;
    anchor.click();
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={file.name}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5 truncate">
              <FileText size={14} className="text-blue-500 shrink-0" />
              <span className="truncate">{file.name}</span>
            </p>
            {subtitle && <p className="text-[10px] text-slate-400 mt-0.5 truncate">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {blobUrl && (
              <a
                href={blobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold transition-colors"
              >
                <ExternalLink size={12} />
                {t('Открыть в новой вкладке')}
              </a>
            )}
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-colors"
            >
              <Download size={12} />
              {t('Скачать')}
            </button>
            <ModalCloseButton onClick={onClose} />
          </div>
        </div>

        <div className="flex-1 min-h-[50vh] bg-slate-100 p-3">
          {blobUrl ? (
            <iframe
              src={blobUrl}
              title={file.name}
              className="w-full h-full min-h-[50vh] rounded-xl border border-slate-200 bg-white"
            />
          ) : (
            <div className="h-full min-h-[40vh] flex items-center justify-center text-slate-400 text-sm">
              {t('Документ недоступен для просмотра')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
