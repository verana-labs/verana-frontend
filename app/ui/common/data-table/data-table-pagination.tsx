'use client'

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { translate } from '@/i18n/dataview'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/shadcn/select'

const DEFAULT_PAGE_SIZES = [10, 25, 50]

const SQUARE =
  'inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-sm font-medium text-foreground tabular-nums outline-none transition-colors duration-(--duration-fast) ease-standard hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 dark:bg-input/30'

export type DataTablePaginationProps = {
  pageIndex: number
  pageSize: number
  total: number
  pageSizes?: number[]
  onPageChange: (pageIndex: number) => void
  onPageSizeChange?: (pageSize: number) => void
  className?: string
}

export function DataTablePagination({
  pageIndex,
  pageSize,
  total,
  pageSizes = DEFAULT_PAGE_SIZES,
  onPageChange,
  onPageSizeChange,
  className,
}: DataTablePaginationProps) {
  const lastIndex = Math.max(0, Math.ceil(total / pageSize) - 1)
  const index = Math.min(pageIndex, lastIndex)
  const sizes = pageSizes.includes(pageSize) ? pageSizes : [...pageSizes, pageSize].sort((a, b) => a - b)

  return (
    <nav
      aria-label={translate('datatable.pagination')}
      className={cn('flex flex-wrap items-center justify-end gap-2 px-4 py-3', className)}
    >
      {onPageSizeChange ? (
        <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
          <SelectTrigger
            size="sm"
            aria-label={translate('datatable.rowsPerPage')}
            className="w-auto gap-1.5 text-[13px] text-muted-foreground max-sm:hidden"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {sizes.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {translate('datatable.perPage', { size })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      <button
        type="button"
        aria-label={translate('datatable.previous')}
        disabled={index <= 0}
        onClick={() => onPageChange(index - 1)}
        className={SQUARE}
      >
        <ChevronLeftIcon aria-hidden="true" className="size-4 rtl:rotate-180" />
      </button>
      <button
        type="button"
        aria-label={translate('datatable.next')}
        disabled={index >= lastIndex}
        onClick={() => onPageChange(index + 1)}
        className={SQUARE}
      >
        <ChevronRightIcon aria-hidden="true" className="size-4 rtl:rotate-180" />
      </button>
    </nav>
  )
}
