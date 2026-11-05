'use client'

import { CircleAlertIcon, InboxIcon, RotateCwIcon, SearchXIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { translate } from '@/i18n/dataview'
import { cn } from '@/lib/utils'
import { DotPattern } from '@/ui/dashboard/dot-pattern'
import { Button } from '@/ui/shadcn/button'

export type DataTableError = { message?: ReactNode; onRetry?: () => void }

const GHOST_WIDTHS = ['w-3/5', 'w-2/5', 'w-1/2', 'w-1/3']

function GhostRows({ columns }: { columns: number }) {
  return (
    <div aria-hidden="true" className="pointer-events-none col-start-1 row-start-1 opacity-[0.22] select-none">
      {Array.from({ length: 4 }, (_, row) => (
        <div key={row} className="flex items-center gap-6 border-b border-border px-4 py-3.5 last:border-0">
          <span className="size-6 shrink-0 rounded-md bg-primary/40" />
          {Array.from({ length: Math.max(columns, 2) }, (_, column) => (
            <span
              key={column}
              className={cn(
                'h-2.5 flex-1 rounded-full bg-foreground/40',
                column === 0 ? 'max-w-48' : 'max-w-24',
                GHOST_WIDTHS[(row + column) % GHOST_WIDTHS.length]
              )}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function DataTableMessage({
  error,
  empty,
  filtered = false,
  columns = 3,
  className,
}: {
  error?: DataTableError | null
  empty?: ReactNode
  filtered?: boolean
  columns?: number
  className?: string
}) {
  if (error)
    return (
      <div role="alert" className={cn('flex flex-col items-center gap-3 px-4 py-10 text-center text-sm', className)}>
        <span className="flex size-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
          <CircleAlertIcon aria-hidden="true" className="size-4" />
        </span>
        <span className="text-foreground">{error.message ?? translate('datatable.error')}</span>
        {error.onRetry ? (
          <Button type="button" variant="outline" size="sm" onClick={error.onRetry}>
            <RotateCwIcon aria-hidden="true" />
            {translate('dashboard.retry')}
          </Button>
        ) : null}
      </div>
    )

  const Icon = filtered ? SearchXIcon : InboxIcon
  return (
    <div data-slot="data-table-empty" className={cn('relative isolate grid overflow-hidden', className)}>
      <GhostRows columns={columns} />
      <DotPattern
        width={14}
        height={14}
        className="-z-10 text-primary/20 [mask-image:radial-gradient(220px_circle_at_center,white,transparent)]"
      />
      <div className="col-start-1 row-start-1 flex flex-col items-center justify-center gap-2.5 px-6 py-8 text-center">
        <span
          aria-hidden="true"
          className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-card"
        >
          <Icon className="size-4" />
        </span>
        <div className="max-w-sm text-sm font-medium text-foreground">
          {filtered ? translate('datatable.noMatches') : (empty ?? translate('datatable.empty'))}
        </div>
      </div>
    </div>
  )
}
