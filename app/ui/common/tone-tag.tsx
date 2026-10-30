import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'info' | 'destructive'

export const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'bg-tint-neutral text-muted-foreground',
  accent: 'bg-tint-accent text-primary',
  success: 'bg-tint-success text-success',
  warning: 'bg-tint-warning text-warning',
  info: 'bg-tint-info text-info',
  destructive: 'bg-tint-destructive text-destructive',
}

export type ToneTagProps = {
  tone?: Tone
  dot?: boolean
  pulse?: boolean
  children: ReactNode
  className?: string
}

export function ToneTag({ tone = 'neutral', dot = false, pulse = false, children, className }: ToneTagProps) {
  return (
    <span
      className={cn(
        'inline-flex h-[22px] max-w-full items-center gap-1.5 rounded-md px-2 text-xs leading-none font-medium whitespace-nowrap',
        TONE_CLASSES[tone],
        className
      )}
    >
      {dot ? (
        <span
          aria-hidden="true"
          className={cn('relative size-1.5 shrink-0 rounded-full bg-current', pulse && 'pulse-dot')}
        />
      ) : null}
      <span className="truncate">{children}</span>
    </span>
  )
}
