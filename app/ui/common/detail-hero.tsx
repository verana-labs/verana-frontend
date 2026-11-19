'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { CopyButton } from '@/ui/ecosystem-detail/copy-button'
import { shortenMiddle } from '@/util/util'

export type DetailHeroProps = {
  title: ReactNode
  avatar?: ReactNode
  badges?: ReactNode
  did?: string
  meta?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  tabs?: ReactNode
  children?: ReactNode
  className?: string
}

function DidLine({ did }: { did: string }) {
  return (
    <span className="flex min-w-0 items-center gap-1 text-muted-foreground">
      <span className="min-w-0 truncate font-mono text-xs sm:text-sm" title={did}>
        <span aria-hidden="true" className="sm:hidden">
          {shortenMiddle(did, 30)}
        </span>
        <span aria-hidden="true" className="hidden sm:inline">
          {did}
        </span>
        <span className="sr-only">{did}</span>
      </span>
      <CopyButton value={did} className="shrink-0" />
    </span>
  )
}

export function DetailHero({
  title,
  avatar,
  badges,
  did,
  meta,
  description,
  actions,
  tabs,
  children,
  className,
}: DetailHeroProps) {
  return (
    <section className={cn('mb-6 overflow-hidden rounded-xl bg-card shadow-card', className)}>
      <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          {avatar ? (
            <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-primary ring-1 ring-border sm:size-16">
              {avatar}
            </div>
          ) : null}
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
              <h1 className="page-title min-w-0">{title}</h1>
              {badges ? <div className="flex flex-wrap items-center gap-2">{badges}</div> : null}
            </div>
            {did ? <DidLine did={did} /> : null}
            {description ? (
              <div className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</div>
            ) : null}
            {meta ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1 text-xs text-muted-foreground">
                {meta}
              </div>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-start gap-2 lg:justify-end">{actions}</div> : null}
      </div>
      {children}
      {tabs ? <div className="border-t border-border px-3 sm:px-4">{tabs}</div> : null}
    </section>
  )
}
