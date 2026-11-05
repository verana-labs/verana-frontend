'use client'

import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { translate } from '@/i18n/dataview'
import { EmptyState } from '@/ui/common/empty-state'
import { Button } from '@/ui/shadcn/button'

export function HiddenByFilters({ count, all, onShowAll }: { count: number; all: boolean; onShowAll: () => void }) {
  if (count === 0) return null
  const title = translate('participants.filters.hidden', { count })
  if (all) {
    return (
      <EmptyState
        outline={false}
        className="py-10"
        icon={<EyeOffIcon />}
        title={title}
        action={
          <Button size="sm" onClick={onShowAll} className="gap-1.5">
            <EyeIcon aria-hidden="true" />
            {translate('participants.filters.showall')}
          </Button>
        }
      />
    )
  }
  return (
    <p className="mx-1 mb-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
      <EyeOffIcon aria-hidden="true" className="size-4 shrink-0" />
      {title}{' '}
      <button
        type="button"
        onClick={onShowAll}
        className="rounded-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {translate('participants.filters.showall')}
      </button>
    </p>
  )
}
