'use client'

import { translate } from '@/i18n/dataview'
import { configFooter } from '@/lib/dashlinks'
import { formatCount } from '@/ui/dashboard/format'
import { BlurFade } from '@/ui/motion/blur-fade'

export function DashboardHeader({ blockHeight }: { blockHeight: number | null }) {
  return (
    <BlurFade className="flex flex-col gap-3 pb-2">
      {blockHeight ? (
        <span
          data-stat="blockHeight"
          data-stat-value={formatCount(blockHeight)}
          className="inline-flex h-6 w-fit items-center gap-1.5 rounded-full border border-border bg-card px-2.5 text-xs shadow-card"
        >
          <span aria-hidden="true" className="pulse-dot relative size-1.5 rounded-full bg-success" />
          <span className="text-muted-foreground">{translate('dataview.dashboard.fields.blockHeight')}</span>
          <span className="font-mono font-medium tabular-nums">{formatCount(blockHeight)}</span>
        </span>
      ) : (
        <span aria-hidden="true" className="h-6" />
      )}
      <h1 className="page-title">
        {translate('dashboard.welcome')}{' '}
        <span className="bg-linear-to-r from-primary-700 via-primary-600 to-primary-400 bg-clip-text text-transparent dark:from-primary-400 dark:via-primary-300 dark:to-primary-200">
          {configFooter.title}
        </span>
      </h1>
      <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{translate('dashboard.desc')}</p>
    </BlurFade>
  )
}
