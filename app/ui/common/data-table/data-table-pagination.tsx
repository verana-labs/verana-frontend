'use client'

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { translate } from '@/i18n/dataview'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/shadcn/select'

const DEFAULT_PAGE_SIZES = [10, 25, 50]

const SQUARE =
  'inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-sm font-medium text-foreground tabular-nums outline-none transition-colors duration-(--duration-fast) ease-standard hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 dark:bg-input/30'

export function pageWindow(page: number, pages: number): Array<number | 'gap'> {
  if (pages <= 7) return Array.from({ length: pages }, (_, index) => index + 1)
  const around = [page - 1, page, page + 1].filter((item) => item > 1 && item < pages)
  const out: Array<number | 'gap'> = [1]
  if (around[0] > 2) out.push('gap')
  out.push(...around)
  if (around[around.length - 1] < pages - 1) out.push('gap')
  out.push(pages)
  return out
}

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
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(pageIndex + 1, pages)
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const sizes = pageSizes.includes(pageSize) ? pageSizes : [...pageSizes, pageSize].sort((a, b) => a - b)

  return (
    <nav
      aria-label={translate('datatable.page', { page, pages })}
      className={cn('flex flex-wrap items-center gap-2 px-4 py-3', className)}
    >
      <p className="me-auto text-[13px] text-muted-foreground tabular-nums">
        {translate('datatable.range', { from, to, total })}
      </p>
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
        disabled={page <= 1}
        onClick={() => onPageChange(page - 2)}
        className={SQUARE}
      >
        <ChevronLeftIcon aria-hidden="true" className="size-4 rtl:rotate-180" />
      </button>
      <span className="flex items-center gap-1 max-sm:hidden">
        {pageWindow(page, pages).map((item, index) =>
          item === 'gap' ? (
            <span key={`gap-${index}`} aria-hidden="true" className="px-1 text-muted-foreground">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              aria-current={item === page ? 'page' : undefined}
              aria-label={translate('datatable.page', { page: item, pages })}
              onClick={() => onPageChange(item - 1)}
              className={cn(
                SQUARE,
                item === page &&
                  'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15 dark:border-primary/40 dark:bg-primary/20'
              )}
            >
              {item}
            </button>
          )
        )}
      </span>
      <span className="text-[13px] text-muted-foreground tabular-nums sm:hidden">
        {translate('datatable.page', { page, pages })}
      </span>
      <button
        type="button"
        aria-label={translate('datatable.next')}
        disabled={page >= pages}
        onClick={() => onPageChange(page)}
        className={SQUARE}
      >
        <ChevronRightIcon aria-hidden="true" className="size-4 rtl:rotate-180" />
      </button>
    </nav>
  )
}
