'use client';

import React, { ReactNode } from 'react';
import clsx from 'clsx';

export interface IconLabelButtonProps {
  onClick?: () => void;
  label?: ReactNode;
  Icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  title?: string;
}

export default function IconLabelButton({
  onClick,
  label,
  Icon,
  title,
  className,
}: IconLabelButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-md border border-transparent py-1 px-2 text-sm text-white transition-all hover:text-slate-600 hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none',
        className
      )}
    >
      {Icon && <Icon className="h-6 w-6 flex-shrink-0" />}
      {label}
    </button>
  );
}