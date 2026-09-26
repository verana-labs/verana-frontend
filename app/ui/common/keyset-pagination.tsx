'use client'

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { translate } from '@/i18n/dataview'
import { resolveTranslatable } from '@/ui/dataview/types'

type Props = {
  showing: number
  itemsLabel: string
  hasPrevious: boolean
  hasNext: boolean
  onPrevious: () => void
  onNext: () => void
}

// Cursor paging per [VFE-DATA-IDX-1]. The indexer returns no total count, so the
// bar shows neither numbered pages nor a row total.
export default function KeysetPagination({ showing, itemsLabel, hasPrevious, hasNext, onPrevious, onNext }: Props) {
  const t = (key: string, fallback: string) => resolveTranslatable({ key }, translate) ?? fallback

  return (
    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-sm text-neutral-70 dark:text-neutral-70">
        {t('pagination.showing', 'Showing')}{' '}
        <span className="font-medium text-gray-900 dark:text-white">{showing}</span> {itemsLabel}
        {hasPrevious || hasNext ? (
          <span className="block text-xs">
            {t('pagination.loadedOnly', 'Sorting and filters apply to the loaded results only.')}
          </span>
        ) : null}
      </div>
      <div className="flex items-center space-x-2">
        <button
          type="button"
          disabled={!hasPrevious}
          onClick={onPrevious}
          aria-label={t('pagination.previous', 'Previous page')}
          className="px-3 py-1 border border-neutral-20 dark:border-neutral-70 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
        </button>
        <button
          type="button"
          disabled={!hasNext}
          onClick={onNext}
          aria-label={t('pagination.next', 'Next page')}
          className="px-3 py-1 border border-neutral-20 dark:border-neutral-70 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
        </button>
      </div>
    </div>
  )
}

export function ShowMoreButton({ onClick, indent = 0 }: { onClick: () => void; indent?: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={indent ? { marginLeft: indent } : undefined}
      className="p-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
    >
      {resolveTranslatable({ key: 'pagination.showMore' }, translate) ?? 'Show more'}
    </button>
  )
}
