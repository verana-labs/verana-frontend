'use client'

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { translate } from '@/i18n/dataview'
import { resolveTranslatable } from '@/ui/dataview/types'
import { Button } from '@/ui/shadcn/button'
import { Pagination, PaginationContent, PaginationItem } from '@/ui/shadcn/pagination'

type Props = {
  showing: number
  itemsLabel: string
  hasPrevious: boolean
  hasNext: boolean
  onPrevious: () => void
  onNext: () => void
  loadedOnlyNote?: boolean
}

export default function KeysetPagination({
  showing,
  itemsLabel,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  loadedOnlyNote = true,
}: Props) {
  const t = (key: string, fallback: string) => resolveTranslatable({ key }, translate) ?? fallback
  const previous = t('pagination.previous', 'Previous page')
  const next = t('pagination.next', 'Next page')

  return (
    <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
      <div className="text-center text-sm text-muted-foreground sm:text-start">
        {t('pagination.showing', 'Showing')} <span className="font-medium text-foreground tabular-nums">{showing}</span>{' '}
        {itemsLabel}
        {loadedOnlyNote && (hasPrevious || hasNext) ? (
          <span className="mt-0.5 block text-xs">
            {t('pagination.loadedOnly', 'Sorting and filters apply to the loaded results only.')}
          </span>
        ) : null}
      </div>
      <Pagination aria-label={t('pagination.label', 'Pagination')} className="mx-0 w-auto">
        <PaginationContent className="gap-2">
          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasPrevious}
              onClick={onPrevious}
              aria-label={previous}
              className="h-8 px-2.5 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon aria-hidden="true" className="rtl:rotate-180" />
              <span className="hidden sm:inline">{previous}</span>
            </Button>
          </PaginationItem>
          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasNext}
              onClick={onNext}
              aria-label={next}
              className="h-8 px-2.5 disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">{next}</span>
              <ChevronRightIcon aria-hidden="true" className="rtl:rotate-180" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}

export function ShowMoreButton({ onClick, indent = 0 }: { onClick: () => void; indent?: number }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      style={indent ? { marginInlineStart: indent } : undefined}
      className="text-primary hover:text-primary"
    >
      {resolveTranslatable({ key: 'pagination.showMore' }, translate) ?? 'Show more'}
    </Button>
  )
}
