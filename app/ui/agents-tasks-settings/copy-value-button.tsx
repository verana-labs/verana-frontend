'use client'

import { CheckIcon, CopyIcon } from 'lucide-react'
import { useCopyFeedback } from '@/hooks/useCopyFeedback'
import { translate } from '@/i18n/dataview'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/shadcn/tooltip'

export function CopyValueButton({ value, label, className }: { value: string; label: string; className?: string }) {
  const { copied, copy } = useCopyFeedback(value)
  const action = copied ? translate('copied.label') : `${translate('messages.copy')} ${label}`
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={action}
          onClick={() => void copy()}
          className={cn(
            'relative inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-[color,background-color,box-shadow] duration-(--duration-base) ease-standard hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50',
            className
          )}
        >
          <CheckIcon
            aria-hidden="true"
            className={cn(
              'size-3.5 text-success transition-[scale,opacity] duration-(--duration-base) ease-emphasized',
              copied ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
            )}
          />
          <CopyIcon
            aria-hidden="true"
            className={cn(
              'absolute size-3.5 transition-[scale,opacity] duration-(--duration-base) ease-emphasized',
              copied ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
            )}
          />
        </button>
      </TooltipTrigger>
      <TooltipContent>{action}</TooltipContent>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? translate('copied.label') : ''}
      </span>
    </Tooltip>
  )
}
