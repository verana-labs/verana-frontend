'use client'

import { ArrowLeftIcon, ChevronLeftIcon } from 'lucide-react'
import Link from 'next/link'
import { type ReactNode, useId, useRef, useState } from 'react'
import { translate } from '@/i18n/dataview'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/ui/common/page-header'
import { type Step, StepRail } from '@/ui/common/wizard/step-rail'
import { DotPattern } from '@/ui/dashboard/dot-pattern'
import { Button } from '@/ui/shadcn/button'
import { Spinner } from '@/ui/shadcn/spinner'

export type WizardContinue = {
  label?: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  form?: string
  missing?: string
  onMissing?: () => void
  pending?: boolean
  className?: string
}

export type WizardLayoutProps = {
  title: ReactNode
  description?: ReactNode
  back?: { href: string; label: ReactNode }
  steps: Step[]
  current: string
  onStepClick?: (id: string) => void
  summary?: ReactNode
  summaryTitle?: ReactNode
  onBack?: () => void
  backLabel?: ReactNode
  next: WizardContinue
  children: ReactNode
  className?: string
}

export function WizardLayout({
  title,
  description,
  back,
  steps,
  current,
  onStepClick,
  summary,
  summaryTitle,
  onBack,
  backLabel,
  next,
  children,
  className,
}: WizardLayoutProps) {
  const blocked = Boolean(next.missing)
  const missingId = useId()
  const bodyRef = useRef<HTMLDivElement>(null)
  const [attempted, setAttempted] = useState<string | null>(null)
  const flagged = blocked && attempted === current

  function focusFirstInvalid() {
    requestAnimationFrame(() => {
      bodyRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    })
  }

  return (
    <div data-slot="wizard" className={cn('@container/wizard min-w-0', className)}>
      {back ? (
        <Link
          href={back.href}
          className="mb-3 inline-flex items-center gap-1 rounded-md text-[13px] text-muted-foreground outline-none transition-colors duration-(--duration-fast) hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ChevronLeftIcon aria-hidden="true" className="size-3.5 rtl:rotate-180" />
          {back.label}
        </Link>
      ) : null}
      <PageHeader title={title} description={description} />
      <div
        className={cn(
          'grid min-w-0 gap-6 md:grid-cols-[208px_minmax(0,1fr)]',
          summary ? '@5xl/wizard:grid-cols-[208px_minmax(0,1fr)_288px]' : null
        )}
      >
        <StepRail
          steps={steps}
          current={current}
          onStepClick={onStepClick}
          className="md:sticky md:top-20 md:row-span-2 md:self-start"
        />
        <section className="min-w-0 self-start overflow-hidden rounded-xl bg-card shadow-card">
          <div
            ref={bodyRef}
            key={current}
            className="min-w-0 animate-in p-4 duration-200 ease-standard fade-in-0 slide-in-from-bottom-1 motion-reduce:animate-none sm:p-6"
          >
            {children}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 bg-muted/30 px-4 py-3 sm:px-6">
            {onBack ? (
              <Button type="button" variant="ghost" onClick={onBack}>
                <ArrowLeftIcon aria-hidden="true" className="rtl:rotate-180" />
                {backLabel ?? translate('wizard.back')}
              </Button>
            ) : (
              <span />
            )}
            <div className="ms-auto flex min-w-0 flex-wrap items-center justify-end gap-x-3 gap-y-1">
              <p
                id={missingId}
                data-missing={blocked || undefined}
                aria-live="polite"
                className={cn(
                  'order-first min-w-0 text-[13px] transition-colors duration-(--duration-fast) empty:hidden',
                  flagged ? 'font-medium text-destructive' : 'text-muted-foreground'
                )}
              >
                {blocked ? next.missing : null}
              </p>
              <Button
                type={blocked ? 'button' : (next.type ?? 'button')}
                form={blocked ? undefined : next.form}
                aria-disabled={next.pending || undefined}
                aria-describedby={blocked ? missingId : undefined}
                onClick={(event) => {
                  if (next.pending) {
                    event.preventDefault()
                    return
                  }
                  if (blocked) {
                    event.preventDefault()
                    setAttempted(current)
                    next.onMissing?.()
                    focusFirstInvalid()
                    return
                  }
                  next.onClick?.()
                }}
                className={cn('min-w-28', next.className)}
              >
                {next.pending ? <Spinner /> : null}
                {next.label ?? translate('wizard.continue')}
              </Button>
            </div>
          </div>
        </section>
        {summary ? (
          <aside
            aria-label={typeof summaryTitle === 'string' ? summaryTitle : translate('wizard.summary')}
            className="min-w-0 md:col-start-2 @5xl/wizard:sticky @5xl/wizard:top-20 @5xl/wizard:col-start-3 @5xl/wizard:row-start-1 @5xl/wizard:self-start"
          >
            <div className="relative isolate overflow-hidden rounded-xl bg-card p-4 shadow-card">
              <DotPattern
                width={14}
                height={14}
                className="-z-10 text-primary/25 [mask-image:radial-gradient(140px_circle_at_top_right,white,transparent)]"
              />
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                {summaryTitle ?? translate('wizard.summary')}
              </h2>
              <div className="mt-3 min-w-0 text-sm">{summary}</div>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  )
}
