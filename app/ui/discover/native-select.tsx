import { ChevronDownIcon } from 'lucide-react'
import type * as React from 'react'
import { cn } from '@/lib/utils'

export function NativeSelect({ className, ...props }: React.ComponentProps<'select'>) {
  return (
    <div
      data-slot="native-select-wrapper"
      className="group/native-select relative w-full has-[select:disabled]:opacity-50"
    >
      <select
        data-slot="native-select"
        className={cn(
          'h-9 w-full min-w-0 cursor-pointer appearance-none rounded-lg border border-input bg-background py-2 pr-9 pl-3 text-sm text-foreground transition-[color,box-shadow,border-color] duration-(--duration-base) ease-standard outline-none hover:border-ring/60 disabled:pointer-events-none disabled:cursor-not-allowed dark:bg-input/30 dark:hover:bg-input/50',
          'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
          className
        )}
        {...props}
      />
      <ChevronDownIcon
        aria-hidden="true"
        data-slot="native-select-icon"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground select-none"
      />
    </div>
  )
}

export function NativeSelectOption({ className, ...props }: React.ComponentProps<'option'>) {
  return (
    <option data-slot="native-select-option" className={cn('bg-[Canvas] text-[CanvasText]', className)} {...props} />
  )
}
