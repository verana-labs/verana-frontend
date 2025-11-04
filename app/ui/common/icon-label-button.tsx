'use client';

import React, { ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export interface IconLabelButtonProps {
  onClick?: () => void;
  label?: ReactNode;
  Icon?: React.ComponentType<{ className?: string }> | any;
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
      className={className}
    >
      {Icon && (
        typeof Icon === 'object' && Icon.iconName ? (
          <FontAwesomeIcon icon={Icon} />
        ) : (
          <Icon className="icon-sm" />
        )
      )}      
      {label}
    </button>
  );
}