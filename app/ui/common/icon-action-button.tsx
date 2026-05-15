'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export type IconActionButtonProps = {
  icon: IconDefinition;
  label: string;
  onClick: () => void;
  className?: string;
  iconClassName?: string;
};

const DEFAULT_CLASS = 'px-2 text-neutral-70 hover:text-primary-600 dark:hover:text-primary-400 transition-colors';

export default function IconActionButton({
  icon,
  label,
  onClick,
  className,
  iconClassName = 'text-sm',
}: IconActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={className ?? DEFAULT_CLASS}
    >
      <FontAwesomeIcon icon={icon} className={iconClassName} />
    </button>
  );
}
