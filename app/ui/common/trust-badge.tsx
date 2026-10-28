'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { DidTrustState } from '@/lib/resolverClient'
import { trustStateBadge } from '@/lib/trust-state'
import { cn } from '@/lib/utils'

export type TrustBadgeProps = {
  state: DidTrustState | undefined
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const SIZE_CLASS: Record<NonNullable<TrustBadgeProps['size']>, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
}

const STATE_CLASS: Record<string, string> = {
  TRUSTED: 'text-success',
  UNTRUSTED: 'text-destructive',
}

export default function TrustBadge({ state, size = 'md', className = '' }: TrustBadgeProps) {
  const { label, icon } = trustStateBadge(state)
  return (
    <FontAwesomeIcon
      icon={icon}
      className={cn('shrink-0 text-muted-foreground', state && STATE_CLASS[state], SIZE_CLASS[size], className)}
      title={label}
      aria-label={label}
    />
  )
}
