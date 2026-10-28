'use client'

import { NetworkIcon, RotateCwIcon, TriangleAlertIcon } from 'lucide-react'
import { translate } from '@/i18n/dataview'
import { EmptyState } from '@/ui/common/empty-state'
import { resolveTranslatable } from '@/ui/dataview/types'
import { Shimmer } from '@/ui/motion/shimmer'
import { Button } from '@/ui/shadcn/button'

const tr = (key: string, fallback: string) => resolveTranslatable({ key }, translate) ?? fallback

const SKELETON_ROWS = [
  { level: 0, width: 'w-56' },
  { level: 1, width: 'w-32' },
  { level: 1, width: 'w-28' },
  { level: 0, width: 'w-48' },
  { level: 1, width: 'w-36' },
]

export function TreeSkeleton() {
  return (
    <div aria-busy="true" className="space-y-1 px-1">
      {SKELETON_ROWS.map(({ level, width }, index) => (
        <div key={index} className="flex h-10 items-center gap-2" style={{ paddingInlineStart: level * 20 }}>
          <Shimmer className="size-4 rounded-sm" />
          <Shimmer className="size-5 rounded-md" />
          <Shimmer className={`h-3.5 ${width}`} />
          <Shimmer className="h-4 w-12 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export function TreeEmpty() {
  return (
    <EmptyState
      outline={false}
      className="py-10"
      icon={<NetworkIcon />}
      title={tr('participants.tree.empty', 'No participants yet.')}
    />
  )
}

export function TreeError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-1 flex flex-wrap items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5 text-sm text-foreground">
      <TriangleAlertIcon aria-hidden="true" className="size-4 shrink-0 text-warning" />
      <p className="flex-1">{tr('participants.tree.error', 'The participants could not be loaded.')}</p>
      <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5 bg-background">
        <RotateCwIcon aria-hidden="true" />
        {tr('participants.tree.retry', 'Try again')}
      </Button>
    </div>
  )
}
