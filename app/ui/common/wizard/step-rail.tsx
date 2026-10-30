'use client'

import { CheckIcon, CircleAlertIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { translate } from '@/i18n/dataview'
import { cn } from '@/lib/utils'

export type StepStatus = 'complete' | 'current' | 'upcoming' | 'error'

export type Step = {
  id: string
  title: ReactNode
  description?: ReactNode
  status?: StepStatus
}

export type StepRailProps = {
  steps: Step[]
  current: string
  onStepClick?: (id: string) => void
  label?: string
  className?: string
}

export function stepStatus(steps: Step[], current: string, step: Step, index: number): StepStatus {
  if (step.status) return step.status
  const currentIndex = steps.findIndex((item) => item.id === current)
  if (index < currentIndex) return 'complete'
  if (index === currentIndex) return 'current'
  return 'upcoming'
}

function StepMarker({ status, index }: { status: StepStatus; index: number }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums transition-[background-color,color,box-shadow] duration-(--duration-base) ease-standard',
        status === 'current' && 'bg-primary text-primary-foreground ring-4 ring-primary/15',
        status === 'complete' && 'bg-primary/10 text-primary dark:bg-primary/20',
        status === 'upcoming' && 'bg-card text-muted-foreground ring-1 ring-border',
        status === 'error' && 'bg-destructive/10 text-destructive ring-1 ring-destructive/30'
      )}
    >
      {status === 'complete' ? (
        <CheckIcon className="size-3.5" strokeWidth={2.5} />
      ) : status === 'error' ? (
        <CircleAlertIcon className="size-3.5" />
      ) : (
        index + 1
      )}
    </span>
  )
}

export function StepRail({ steps, current, onStepClick, label, className }: StepRailProps) {
  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === current)
  )
  const currentStep = steps[currentIndex]

  return (
    <nav aria-label={label ?? translate('wizard.steps')} className={cn('min-w-0', className)}>
      <div className="md:hidden">
        <p className="text-xs font-medium text-primary tabular-nums">
          {translate('wizard.stepOf', { current: currentIndex + 1, total: steps.length })}
        </p>
        <p className="mt-0.5 text-sm font-semibold tracking-tight text-foreground">{currentStep?.title}</p>
        <div className="mt-2.5 flex gap-1" aria-hidden="true">
          {steps.map((step, index) => (
            <span
              key={step.id}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors duration-(--duration-base) ease-standard',
                index < currentIndex ? 'bg-primary/50' : index === currentIndex ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>
      </div>
      <ol className="hidden md:block">
        {steps.map((step, index) => {
          const status = stepStatus(steps, current, step, index)
          const clickable = Boolean(onStepClick) && status === 'complete'
          const body = (
            <>
              <StepMarker status={status} index={index} />
              <span className="min-w-0 pt-1 text-start">
                <span
                  data-step-title=""
                  className={cn(
                    'block text-sm leading-5 font-medium tracking-tight',
                    status === 'upcoming' ? 'text-muted-foreground' : 'text-foreground',
                    status === 'current' && 'font-semibold'
                  )}
                >
                  {step.title}
                </span>
                {step.description ? (
                  <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{step.description}</span>
                ) : null}
              </span>
            </>
          )
          return (
            <li
              key={step.id}
              data-step={step.id}
              data-status={status}
              aria-current={status === 'current' ? 'step' : undefined}
              className="relative pb-6 last:pb-0"
            >
              {index < steps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute start-3.5 top-8 bottom-1 w-px -translate-x-1/2 transition-colors duration-(--duration-base) rtl:translate-x-1/2',
                    status === 'complete' ? 'bg-primary/40' : 'bg-border'
                  )}
                />
              ) : null}
              {clickable ? (
                <button
                  type="button"
                  onClick={() => onStepClick?.(step.id)}
                  className="flex w-full items-start gap-3 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&:hover_[data-step-title]]:text-primary"
                >
                  {body}
                </button>
              ) : (
                <div className="flex items-start gap-3">{body}</div>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
