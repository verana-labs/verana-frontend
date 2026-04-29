'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DidTrustState } from '@/lib/resolverClient';
import { trustStateBadge } from '@/lib/trust-state';

export type TrustBadgeProps = {
  state: DidTrustState | undefined;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
};

const SIZE_CLASS: Record<NonNullable<TrustBadgeProps['size']>, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

export default function TrustBadge({ state, size = 'md', className = '' }: TrustBadgeProps) {
  const { label, icon, iconColorClass } = trustStateBadge(state);
  return (
    <FontAwesomeIcon
      icon={icon}
      className={`${iconColorClass} ${SIZE_CLASS[size]} flex-shrink-0 ${className}`}
      title={label}
      aria-label={label}
    />
  );
}
