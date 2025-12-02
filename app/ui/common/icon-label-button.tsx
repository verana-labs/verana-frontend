'use client';

import React, { ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export interface IconLabelButtonProps {
  onClick?: () => void;
  label?: ReactNode;
  icon?: IconDefinition;
  className?: string;
  title?: string;
}

export default function IconLabelButton({
  onClick,
  label,
  icon,
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
      {icon && ( <FontAwesomeIcon icon={icon} /> )}      
      {label}
    </button>
  );
}