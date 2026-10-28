'use client'

import { motion } from 'framer-motion'
import { CheckIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DURATION, EASE } from '@/ui/motion/tokens'

type StepState = 'completed' | 'active' | 'inactive'

export type StepperStep = {
  title: string
  description?: string
}

type StepperProps = {
  steps: StepperStep[]
  activeStep: number
  label: string
  completedLabel: string
  className?: string
}

function stepState(step: number, activeStep: number): StepState {
  if (step < activeStep) return 'completed'
  return step === activeStep ? 'active' : 'inactive'
}

export function Stepper({ steps, activeStep, label, completedLabel, className }: StepperProps) {
  return (
    <nav aria-label={label} className={className}>
      <ol className="flex w-full items-start">
        {steps.map(({ title, description }, index) => {
          const step = index + 1
          const state = stepState(step, activeStep)
          const last = step === steps.length
          return (
            <li
              key={title}
              data-state={state}
              aria-current={state === 'active' ? 'step' : undefined}
              className={cn('group/step flex min-w-0 items-start gap-3', !last && 'flex-1')}
            >
              <span
                data-state={state}
                className="relative flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground tabular-nums ring-1 ring-foreground/10 transition-colors duration-(--duration-base) ease-standard data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:ring-4 data-[state=active]:ring-primary/15 data-[state=completed]:bg-primary data-[state=completed]:text-primary-foreground data-[state=completed]:ring-0"
              >
                <span
                  className="transition-all duration-(--duration-base) group-data-[state=completed]/step:scale-0 group-data-[state=completed]/step:opacity-0 motion-reduce:transition-none"
                  aria-hidden={state === 'completed'}
                >
                  {step}
                </span>
                <CheckIcon
                  aria-hidden="true"
                  className="absolute size-4 scale-0 opacity-0 transition-all duration-(--duration-base) ease-emphasized group-data-[state=completed]/step:scale-100 group-data-[state=completed]/step:opacity-100 motion-reduce:transition-none"
                />
              </span>
              <span className="flex min-w-0 flex-col gap-0.5 pt-1">
                <span
                  className={cn(
                    'text-sm leading-tight font-medium',
                    state === 'inactive' ? 'text-muted-foreground' : 'text-foreground'
                  )}
                >
                  {title}
                  {state === 'completed' ? <span className="sr-only"> ({completedLabel})</span> : null}
                </span>
                {description ? (
                  <span className="hidden text-xs text-muted-foreground sm:block">{description}</span>
                ) : null}
              </span>
              {last ? null : (
                <span
                  aria-hidden="true"
                  className="relative mx-2 mt-3.5 h-0.5 min-w-6 flex-1 overflow-hidden rounded-full bg-muted"
                >
                  <motion.span
                    className="absolute inset-0 origin-left bg-primary rtl:origin-right"
                    initial={false}
                    animate={{ scaleX: state === 'completed' ? 1 : 0 }}
                    transition={{ duration: DURATION.slow, ease: EASE.emphasized }}
                  />
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
