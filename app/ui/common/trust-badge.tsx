'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DidTrustState } from '@/lib/resolverClient';
import { trustStateBadge } from '@/lib/trust-state';

export type TrustBadgeProps = {
  state: DidTrustState | undefined;
  size?: 'sm' | 'md';
  className?: string;
};

export default function TrustBadge({ state, size = 'md', className = '' }: TrustBadgeProps) {
  const { label, icon, iconColorClass } = trustStateBadge(state);
  const sizeClass = size === 'sm' ? 'text-xs' : 'text-sm';
  return (
    <FontAwesomeIcon
      icon={icon}
      className={`${iconColorClass} ${sizeClass} flex-shrink-0 ${className}`}
      title={label}
      aria-label={label}
    />
  );
}
