import React from 'react';
import type { Language } from '../utils/i18n';

type FlagCode = 'ru' | 'us' | 'cn';

export function languageToFlagCode(language: Language): FlagCode {
  switch (language) {
    case 'en':
      return 'us';
    case 'zh':
      return 'cn';
    default:
      return 'ru';
  }
}

interface CountryFlagProps {
  code: FlagCode;
  className?: string;
  title?: string;
}

export default function CountryFlag({ code, className = 'w-5 h-3.5', title }: CountryFlagProps) {
  const label =
    title ??
    (code === 'ru' ? 'Россия' : code === 'us' ? 'США' : 'Китай');

  if (code === 'ru') {
    return (
      <svg viewBox="0 0 9 6" className={className} aria-label={label} role="img">
        <rect width="9" height="2" fill="#FFFFFF" />
        <rect y="2" width="9" height="2" fill="#0039A6" />
        <rect y="4" width="9" height="2" fill="#D52B1E" />
      </svg>
    );
  }

  if (code === 'us') {
    return (
      <svg viewBox="0 0 19 10" className={className} aria-label={label} role="img">
        <rect width="19" height="10" fill="#B22234" />
        <rect y="1" width="19" height="1" fill="#FFFFFF" />
        <rect y="3" width="19" height="1" fill="#FFFFFF" />
        <rect y="5" width="19" height="1" fill="#FFFFFF" />
        <rect y="7" width="19" height="1" fill="#FFFFFF" />
        <rect y="9" width="19" height="1" fill="#FFFFFF" />
        <rect width="8" height="5.5" fill="#3C3B6E" />
        <circle cx="1.4" cy="1.1" r="0.35" fill="#FFFFFF" />
        <circle cx="2.8" cy="1.1" r="0.35" fill="#FFFFFF" />
        <circle cx="4.2" cy="1.1" r="0.35" fill="#FFFFFF" />
        <circle cx="5.6" cy="1.1" r="0.35" fill="#FFFFFF" />
        <circle cx="2.1" cy="2.3" r="0.35" fill="#FFFFFF" />
        <circle cx="3.5" cy="2.3" r="0.35" fill="#FFFFFF" />
        <circle cx="4.9" cy="2.3" r="0.35" fill="#FFFFFF" />
        <circle cx="1.4" cy="3.5" r="0.35" fill="#FFFFFF" />
        <circle cx="2.8" cy="3.5" r="0.35" fill="#FFFFFF" />
        <circle cx="4.2" cy="3.5" r="0.35" fill="#FFFFFF" />
        <circle cx="5.6" cy="3.5" r="0.35" fill="#FFFFFF" />
        <circle cx="2.1" cy="4.7" r="0.35" fill="#FFFFFF" />
        <circle cx="3.5" cy="4.7" r="0.35" fill="#FFFFFF" />
        <circle cx="4.9" cy="4.7" r="0.35" fill="#FFFFFF" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 9 6" className={className} aria-label={label} role="img">
      <rect width="9" height="6" fill="#DE2910" />
      <polygon
        points="1.2,0.8 1.45,1.55 2.25,1.55 1.6,2 1.85,2.75 1.2,2.3 0.55,2.75 0.8,2 0.15,1.55 0.95,1.55"
        fill="#FFDE00"
      />
      <circle cx="2.55" cy="0.75" r="0.22" fill="#FFDE00" />
      <circle cx="2.95" cy="1.15" r="0.22" fill="#FFDE00" />
      <circle cx="2.95" cy="1.65" r="0.22" fill="#FFDE00" />
      <circle cx="2.55" cy="2.05" r="0.22" fill="#FFDE00" />
    </svg>
  );
}
