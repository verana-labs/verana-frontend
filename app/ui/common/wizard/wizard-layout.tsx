'use client'

import { ArrowLeftIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { translate } from '@/i18n/dataview'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/ui/common/page-header'
import { type Step, StepRail } from '@/ui/common/wizard/step-rail'
import { Button } from '@/ui/shadcn/button'
import { Spinner } from '@/ui/shadcn/spinner'

export type WizardContinue = {
  label?: ReactNode
  onClick?: () => void
  disabled?: boolean
  pending?: boolean
  className?: string
}

export type WizardLayoutProps = {
  title: ReactNode
  description?: ReactNode
  steps: Step[]
  current: string
  onBack?: () => void
  backLabel?: ReactNode
  next: WizardContinue
  children: ReactNode
  className?: string
}

export function WizardLayout({
  title,
  description,
  steps,
  current,
  onBack,
  backLabel,
  next,
  children,
  className,
}: WizardLayoutProps) {
  return (
    <div data-slot="wizard" className={cn('@container/wizard min-w-0', className)}>
      <PageHeader title={title} description={description} />
      <div className="grid min-w-0 gap-6 md:grid-cols-[208px_minmax(0,1fr)]">
        <StepRail steps={steps} current={current} className="md:sticky md:top-20 md:row-span-2 md:self-start" />
        <section className="min-w-0 self-start overflow-hidden rounded-xl bg-card shadow-card">
          <div
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
            <Button
              type="button"
              disabled={next.disabled || next.pending}
              onClick={next.onClick}
              className={cn('ms-auto min-w-28', next.className)}
            >
              {next.pending ? <Spinner /> : null}
              {next.label ?? translate('wizard.continue')}
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
