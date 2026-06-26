/*
 * Standard top-right close control for modal panels
 */
import React from 'react';
import { X } from 'lucide-react';

interface ModalCloseButtonProps {
  onClick: () => void;
  className?: string;
}

export default function ModalCloseButton({ onClick, className = '' }: ModalCloseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Закрыть"
      className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 ${className}`}
    >
      <X size={18} />
    </button>
  );
}
