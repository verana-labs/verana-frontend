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
    <Empty className={cn(outline && 'border border-dashed border-border', className)}>
      <EmptyHeader>
        {icon ? (
          <EmptyMedia
            variant="icon"
            className="size-9 rounded-lg bg-tint-accent text-primary [&_svg]:size-4"
            aria-hidden="true"
          >
            {icon}
          </EmptyMedia>
        ) : null}
        <EmptyTitle className="text-base font-semibold tracking-[-0.01em] text-balance [overflow-wrap:anywhere]">
          {title}
        </EmptyTitle>
        {description ? (
          <EmptyDescription className="text-pretty [overflow-wrap:anywhere]">{description}</EmptyDescription>
        ) : null}
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  )
}
