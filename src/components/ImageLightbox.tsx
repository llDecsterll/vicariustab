import React, { useEffect } from 'react';
import ModalCloseButton from './ModalCloseButton';

interface ImageLightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export default function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <div className="absolute top-4 right-4 z-10">
        <ModalCloseButton onClick={onClose} className="!bg-white/10 !text-white hover:!bg-white/20" />
      </div>

      <div
        className="flex items-center justify-center w-full h-full max-w-[min(96vw,1400px)] max-h-[min(92vh,1000px)]"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl shadow-2xl"
          draggable={false}
        />
      </div>
    </div>
  );
}
