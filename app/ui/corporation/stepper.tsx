'use client'

import { CheckIcon, LoaderCircleIcon } from 'lucide-react'
import { type ComponentProps, createContext, useContext } from 'react'
import { cn } from '@/lib/utils'

type StepState = 'active' | 'completed' | 'inactive'

const StepperContext = createContext<{ activeStep: number }>({ activeStep: 0 })
const StepItemContext = createContext<{ step: number; state: StepState; loading: boolean }>({
  step: 0,
  state: 'inactive',
  loading: false,
})

export function Stepper({ value, className, ...props }: ComponentProps<'ol'> & { value: number }) {
  return (
    <StepperContext.Provider value={{ activeStep: value }}>
      <ol data-slot="stepper" className={cn('group/stepper flex w-full items-start', className)} {...props} />
    </StepperContext.Provider>
  )
}

export function StepperItem({
  step,
  completed = false,
  loading = false,
  className,
  ...props
}: ComponentProps<'li'> & { step: number; completed?: boolean; loading?: boolean }) {
  const { activeStep } = useContext(StepperContext)
  const state: StepState = completed || step < activeStep ? 'completed' : step === activeStep ? 'active' : 'inactive'
  const isLoading = loading && step === activeStep
  return (
    <StepItemContext.Provider value={{ step, state, loading: isLoading }}>
      <li
        data-slot="stepper-item"
        data-state={state}
        data-loading={isLoading || undefined}
        aria-current={state === 'active' ? 'step' : undefined}
        className={cn('group/step relative flex flex-1 flex-col items-center gap-2 text-center', className)}
        {...props}
      />
    </StepItemContext.Provider>
  )
}

export function StepperIndicator({ className }: { className?: string }) {
  const { step, state, loading } = useContext(StepItemContext)
  return (
    <span
      data-slot="stepper-indicator"
      data-state={state}
      className={cn(
        'relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground ring-4 ring-card transition-colors duration-(--duration-base) ease-standard data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=completed]:bg-primary data-[state=completed]:text-primary-foreground',
        className
      )}
    >
      <span
        className={cn(
          'transition-all duration-(--duration-base) ease-emphasized',
          (state === 'completed' || loading) && 'scale-0 opacity-0'
        )}
      >
        {step + 1}
      </span>
      <CheckIcon
        aria-hidden="true"
        className={cn(
          'absolute size-3.5 transition-all duration-(--duration-base) ease-emphasized',
          state === 'completed' ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
        )}
      />
      {loading ? <LoaderCircleIcon aria-hidden="true" className="absolute size-3.5 animate-spin" /> : null}
    </span>
  )
}

export function StepperTitle({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      data-slot="stepper-title"
      className={cn(
        'text-xs font-medium text-muted-foreground group-data-[state=active]/step:text-foreground sm:text-sm',
        className
      )}
      {...props}
    />
  )
}

export function StepperSeparator({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      data-slot="stepper-separator"
      className={cn(
        'absolute top-3.5 start-[calc(50%+1rem)] h-0.5 w-[calc(100%-2rem)] -translate-y-1/2 rounded-full bg-muted group-last/step:hidden after:absolute after:inset-0 after:origin-left after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform after:duration-(--duration-slow) after:ease-emphasized group-data-[state=completed]/step:after:scale-x-100 rtl:after:origin-right',
        className
      )}
    />
  )
}
