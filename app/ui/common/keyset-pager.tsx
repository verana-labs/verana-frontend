'use client'

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { translate } from '@/i18n/dataview'
import type { KeysetPaging } from '@/lib/keyset'

const BUTTON_CLASS =
  'px-3 py-1 border border-neutral-20 dark:border-neutral-70 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'

type Props = {
  paging: KeysetPaging
  showing: number
  loading?: boolean
}

export function KeysetPager({ paging, showing, loading = false }: Props) {
  if (!paging.partial) return null
  return (
    <nav className="mt-6 flex items-center justify-between gap-4" aria-label={translate('list.pager.label')}>
      <span className="text-sm text-neutral-70 dark:text-neutral-70">
        {translate('list.pager.loaded', { n: showing })}
      </span>
      <div className="flex items-center space-x-2">
        <button
          type="button"
          disabled={!paging.hasPrev || loading}
          onClick={paging.prev}
          aria-label={translate('list.pager.previous')}
          className={BUTTON_CLASS}
        >
          <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
        </button>
        <button
          type="button"
          disabled={!paging.hasNext || loading}
          onClick={paging.next}
          aria-label={translate('list.pager.next')}
          className={BUTTON_CLASS}
        >
          <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
        </button>
      </div>
    </nav>
  )
}

export function LoadedWindowNote({ partial }: { partial: boolean }) {
  if (!partial) return null
  return (
    <p role="note" className="mb-4 text-xs text-neutral-70 dark:text-neutral-70">
      {translate('list.scoped')}
    </p>
  )
}
