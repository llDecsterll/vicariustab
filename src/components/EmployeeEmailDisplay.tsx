import React from 'react';
import { displayEmailAddress, mailtoHrefForEmail } from '../utils/emailIdn';

interface EmployeeEmailDisplayProps {
  email?: string;
  className?: string;
  emptyLabel?: React.ReactNode;
}

export default function EmployeeEmailDisplay({
  email,
  className = '',
  emptyLabel = null,
}: EmployeeEmailDisplayProps) {
  if (!email?.trim()) {
    return emptyLabel ? <span className={className}>{emptyLabel}</span> : null;
  }

  const label = displayEmailAddress(email);
  const href = mailtoHrefForEmail(email);

  return (
    <a href={href} className={className} title={label}>
      {label}
    </a>
  );
}
