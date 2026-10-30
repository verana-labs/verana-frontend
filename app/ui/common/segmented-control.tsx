'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ToggleGroup, ToggleGroupItem } from '@/ui/shadcn/toggle-group'

export type SegmentedItem<T extends string> = {
  value: T
  label: ReactNode
  icon?: ReactNode
  ariaLabel?: string
  disabled?: boolean
}

export type SegmentedControlProps<T extends string> = {
  items: SegmentedItem<T>[]
  value: T
  onValueChange: (value: T) => void
  label: string
  size?: 'sm' | 'md'
  className?: string
}

export function SegmentedControl<T extends string>({
  items,
  value,
  onValueChange,
  label,
  size = 'sm',
  className,
}: SegmentedControlProps<T>) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(next) => {
        const match = items.find((item) => item.value === next)
        if (match) onValueChange(match.value)
      }}
      spacing={1}
      aria-label={label}
      className={cn('rounded-[10px] bg-muted p-1', className)}
    >
      {items.map((item) => (
        <ToggleGroupItem
          key={item.value}
          value={item.value}
          disabled={item.disabled}
          aria-label={item.ariaLabel}
          className={cn(
            'gap-1.5 rounded-md px-3 font-medium text-muted-foreground transition-[color,background-color,box-shadow] duration-(--duration-fast) ease-standard hover:bg-transparent hover:text-foreground data-[state=on]:bg-card dark:data-[state=on]:bg-neutral-700 data-[state=on]:text-foreground data-[state=on]:shadow-segment',
            size === 'sm' ? 'h-7 text-xs' : 'h-8 text-sm'
          )}
        >
          {item.icon}
          {item.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
