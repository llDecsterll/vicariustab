import { APP_NAME } from '../config/appConfig';

interface BrandLogoProps {
  size?: number;
  className?: string;
  /** compact = "VT", full = "Vicariustab" in circle */
  variant?: 'compact' | 'full';
}

export default function BrandLogo({ size = 40, className = '', variant = 'compact' }: BrandLogoProps) {
  const isFull = variant === 'full';
  const fontSize = isFull ? Math.max(7, Math.round(size * 0.115)) : Math.max(8, Math.round(size * 0.34));
  const label = isFull ? APP_NAME : 'VT';

  return (
    <div
      className={`rounded-full bg-blue-600 text-white font-black flex items-center justify-center border border-blue-500/40 shadow-md shrink-0 leading-none text-center px-0.5 ${className}`}
      style={{ width: size, height: size, fontSize }}
      title={APP_NAME}
      aria-label={APP_NAME}
    >
      {label}
    </div>
  );
}
