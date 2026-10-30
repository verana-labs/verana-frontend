'use client'

import { CheckIcon, MonitorIcon, MoonIcon, SunIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export const THEMES = ['system', 'light', 'dark'] as const

export type ThemeOption = (typeof THEMES)[number]

const ICONS = { system: MonitorIcon, light: SunIcon, dark: MoonIcon }

function WindowPreview({ dark, className }: { dark: boolean; className?: string }) {
  const line = dark ? 'bg-white/15' : 'bg-neutral-900/10'
  return (
    <div className={cn('flex h-full w-full gap-1.5 p-2', dark ? 'bg-neutral-950' : 'bg-neutral-100', className)}>
      <div className="flex w-1/4 flex-col gap-1 pt-1">
        <span className="h-1.5 w-3/4 rounded-full bg-linear-to-r from-primary to-primary/50" />
        <span className={cn('h-1.5 w-full rounded-full', line)} />
        <span className={cn('h-1.5 w-2/3 rounded-full', line)} />
      </div>
      <div
        className={cn(
          'flex flex-1 flex-col gap-1.5 rounded-md p-2',
          dark ? 'bg-neutral-900 ring-1 ring-white/10' : 'bg-white shadow-sm ring-1 ring-neutral-900/5'
        )}
      >
        <span className={cn('h-2 w-1/2 rounded-full', dark ? 'bg-white/70' : 'bg-neutral-900/80')} />
        <span className={cn('h-1.5 w-5/6 rounded-full', line)} />
        <div className="mt-auto flex items-end gap-1">
          <span className={cn('h-4 flex-1 rounded-sm', dark ? 'bg-white/10' : 'bg-neutral-900/5')} />
          <span className="flex h-4 flex-1 items-end gap-px rounded-sm bg-primary/15 px-0.5 pb-0.5">
            <span className="h-1/3 flex-1 rounded-[1px] bg-primary/60" />
            <span className="h-2/3 flex-1 rounded-[1px] bg-primary/80" />
            <span className="h-full flex-1 rounded-[1px] bg-primary" />
          </span>
        </div>
      </div>
    </div>
  )
}

function ThemePreview({ option }: { option: ThemeOption }) {
  if (option !== 'system') return <WindowPreview dark={option === 'dark'} />
  return (
    <div className="relative h-full w-full">
      <WindowPreview dark={false} />
      <div className="absolute inset-y-0 end-0 w-1/2 overflow-hidden">
        <WindowPreview dark className="absolute inset-y-0 end-0 w-[200%]" />
      </div>
    </div>
  )
}

export function ThemeRadioCards({
  value,
  onChange,
  label,
  optionLabel,
}: {
  value: ThemeOption | undefined
  onChange: (next: ThemeOption) => void
  label: string
  optionLabel: (option: ThemeOption) => string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-3 sm:max-w-lg">
      {THEMES.map((option) => {
        const Icon = ICONS[option]
        const checked = value === option
        return (
          <label key={option} className="group relative flex min-w-0 cursor-pointer flex-col gap-2">
            <input
              type="radio"
              name="settings-theme"
              value={option}
              checked={checked}
              onChange={() => onChange(option)}
              className="peer absolute inset-0 z-10 size-full cursor-pointer appearance-none rounded-xl opacity-0 outline-none"
            />
            <span
              aria-hidden="true"
              className="relative aspect-[4/3] overflow-hidden rounded-xl border border-input shadow-xs outline-offset-2 transition-[border-color,box-shadow,translate] duration-(--duration-base) ease-standard group-hover:-translate-y-px group-hover:border-ring/60 peer-checked:border-primary peer-checked:shadow-[0_0_0_1px_var(--color-primary),0_0_0_5px_var(--color-tint-accent)] motion-reduce:transition-none motion-reduce:group-hover:translate-y-0 peer-focus-visible:outline-2 peer-focus-visible:outline-ring"
            >
              <ThemePreview option={option} />
              <span className="absolute end-1.5 top-1.5 flex size-4 scale-0 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-sm transition-[scale,opacity] duration-(--duration-base) ease-emphasized group-has-checked:scale-100 group-has-checked:opacity-100">
                <CheckIcon className="size-2.5" strokeWidth={3} />
              </span>
            </span>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors peer-checked:font-medium peer-checked:text-foreground">
              <Icon aria-hidden="true" className="size-3.5" />
              {optionLabel(option)}
            </span>
          </label>
        )
      })}
    </div>
  )
}
