import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/ui/shadcn/empty'

export type EmptyStateProps = {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  outline?: boolean
  className?: string
}

export function EmptyState({ icon, title, description, action, outline = true, className }: EmptyStateProps) {
  return (
    <Empty className={cn(outline && 'border border-border', className)}>
      <EmptyHeader>
        {icon ? (
          <EmptyMedia variant="icon" className="text-muted-foreground" aria-hidden="true">
            {icon}
          </EmptyMedia>
        ) : null}
        <EmptyTitle className="text-base font-semibold">{title}</EmptyTitle>
        {description ? <EmptyDescription>{description}</EmptyDescription> : null}
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  )
}
