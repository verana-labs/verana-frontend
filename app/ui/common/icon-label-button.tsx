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
      className={clsx('btn-action h-8',
        className
      )}
    >
      {Icon && <Icon className="data-view-section-icon" />}
      {label}
    </button>
  );
}