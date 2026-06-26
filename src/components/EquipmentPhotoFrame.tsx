import React from 'react';

interface EquipmentPhotoFrameProps {
  src: string;
  alt: string;
  /** User-uploaded photo — fit fully inside frame without cropping */
  isUserPhoto?: boolean;
  onClick?: () => void;
  className?: string;
  imgClassName?: string;
}

export default function EquipmentPhotoFrame({
  src,
  alt,
  isUserPhoto = true,
  onClick,
  className = '',
  imgClassName = '',
}: EquipmentPhotoFrameProps) {
  return (
    <div
      className={`relative w-36 h-36 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shadow-md ${
        onClick ? 'cursor-zoom-in' : ''
      } ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        className={
          isUserPhoto
            ? `max-w-full max-h-full w-auto h-auto object-contain ${imgClassName}`
            : `w-full h-full object-cover ${imgClassName}`
        }
        draggable={false}
      />
    </div>
  );
}
