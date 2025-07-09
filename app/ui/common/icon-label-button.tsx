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
        'border border-button-light-border dark:border-button-dark-border ' +
        'inline-flex items-center justify-center gap-2 rounded-md py-1 px-2 transition-all ' +
        'hover:text-light-selected-text hover:bg-light-selected-bg ' +
        'dark:hover:text-dark-selected-text dark:hover:bg-dark-selected-bg ' +
        'disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none',
        className
      )}
    >
      {Icon && <Icon className="h-6 w-6 flex-shrink-0" />}
      {label}
    </button>
  );
}