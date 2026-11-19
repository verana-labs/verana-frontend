'use client'

import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/ui/shadcn/button'

export type IconActionButtonProps = {
  icon: IconDefinition
  label: string
  onClick: () => void
  className?: string
  iconClassName?: string
}

const DEFAULT_CLASS = cn(
  buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
  'text-muted-foreground hover:text-primary'
)

export default function IconActionButton({
  icon,
  label,
  onClick,
  className,
  iconClassName = 'text-sm',
}: IconActionButtonProps) {
  return (
    <button type="button" onClick={onClick} title={label} aria-label={label} className={className ?? DEFAULT_CLASS}>
      <FontAwesomeIcon icon={icon} className={iconClassName} aria-hidden="true" />
    </button>
  )
}
