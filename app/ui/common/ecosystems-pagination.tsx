'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { translate } from '@/i18n/dataview';
import { resolveTranslatable } from '@/ui/dataview/types';

type Props = {
  page: number;
  pageCount: number;
  showing: number;
  total: number;
  onChange: (page: number) => void;
};

function buildPageList(page: number, pageCount: number): Array<number | 'ellipsis'> {
  if (pageCount <= 9) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const out: Array<number | 'ellipsis'> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);
  if (start > 2) out.push('ellipsis');
  for (let i = start; i <= end; i++) out.push(i);
  if (end < pageCount - 1) out.push('ellipsis');
  out.push(pageCount);
  return out;
}

export default function EcosystemsPagination({
  page,
  pageCount,
  showing,
  total,
  onChange,
}: Props) {
  if (pageCount <= 0) return null;

  const pages = buildPageList(page, pageCount);
  const t = (key: string, fallback: string) =>
    resolveTranslatable({ key }, translate) ?? fallback;

  return (
    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-sm text-neutral-70 dark:text-neutral-70">
        {t('datatable.tr.pagination.showing', 'Showing')}{' '}
        <span className="font-medium text-gray-900 dark:text-white">{showing}</span>{' '}
        {t('datatable.tr.pagination.of', 'of')}{' '}
        <span className="font-medium text-gray-900 dark:text-white">{total}</span>{' '}
        {t('datatable.tr.pagination.ecosystems', 'ecosystems')}
      </div>
      <div className="flex items-center space-x-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onChange(Math.max(1, page - 1))}
          aria-label={t('datatable.tr.pagination.previous', 'Previous page')}
          className="px-3 py-1 border border-neutral-20 dark:border-neutral-70 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
        </button>
        <div className="flex flex-wrap gap-1 justify-center">
          {pages.map((p, idx) =>
            p === 'ellipsis' ? (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 py-1 text-sm text-gray-500"
                aria-hidden="true"
              >
                ...
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onChange(p)}
                aria-current={p === page ? 'page' : undefined}
                className={`px-3 py-1 text-sm rounded-lg ${
                  p === page
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {p}
              </button>
            ),
          )}
        </div>
        <button
          type="button"
          disabled={page >= pageCount}
          onClick={() => onChange(Math.min(pageCount, page + 1))}
          aria-label={t('datatable.tr.pagination.next', 'Next page')}
          className="px-3 py-1 border border-neutral-20 dark:border-neutral-70 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
        </button>
      </div>
    </div>
  );
}
