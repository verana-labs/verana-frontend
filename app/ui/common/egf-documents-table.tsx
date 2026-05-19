'use client'

import { faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { ReactNode } from 'react'
import { translate } from '@/i18n/dataview'
import { getLabelByValue } from '@/ui/dataview/datasections/gfd'
import { TrData } from '@/ui/dataview/datasections/tr'
import { resolveTranslatable } from '@/ui/dataview/types'
import { formatDate } from '@/util/util'

const HEADER_CELL_CLASS =
  'px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-70 dark:text-neutral-70 uppercase tracking-wider'
const BODY_CELL_CLASS = 'px-4 sm:px-6 py-4'

function Th({ children }: { children: ReactNode }) {
  return <th className={HEADER_CELL_CLASS}>{children}</th>
}

type Versions = NonNullable<TrData['versions']>

export type EgfDocumentsTableProps = {
  versions: Versions
  activeVersion: number
}

type RowState = 'active' | 'draft' | 'inactive'

type Row = {
  key: string
  version: number
  url: string
  language: string
  state: RowState
  statusText: string
}

function statusPillClass(state: RowState): string {
  if (state === 'active') {
    return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
  }
  if (state === 'draft') {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
  }
  return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
}

function buildRows(versions: Versions, activeVersion: number): Row[] {
  const sorted = [...versions].sort((a, b) => a.version - b.version)

  const rows: Row[] = []
  sorted.forEach((version, index) => {
    const documents = version.documents ?? []
    documents.forEach((doc) => {
      let state: RowState
      let statusText: string

      if (version.version === activeVersion) {
        state = 'active'
        statusText =
          resolveTranslatable(
            { key: 'datalist.egf.status.activeSince', values: { date: formatDate(version.active_since) } },
            translate
          ) ?? `Active since ${formatDate(version.active_since)}`
      } else if (version.version > activeVersion) {
        state = 'draft'
        statusText = resolveTranslatable({ key: 'datalist.egf.status.draft' }, translate) ?? 'Draft'
      } else {
        state = 'inactive'
        const next = sorted[index + 1]
        const fromDate = formatDate(version.active_since)
        if (next?.active_since) {
          statusText =
            resolveTranslatable(
              { key: 'datalist.egf.status.range', values: { from: fromDate, to: formatDate(next.active_since) } },
              translate
            ) ?? `${fromDate} to ${formatDate(next.active_since)}`
        } else {
          statusText =
            resolveTranslatable({ key: 'datalist.egf.status.from', values: { from: fromDate } }, translate) ??
            `From ${fromDate}`
        }
      }

      rows.push({
        key: `${version.id}-${doc.id}`,
        version: version.version,
        url: doc.url,
        language: getLabelByValue(doc.language),
        state,
        statusText,
      })
    })
  })

  const order: Record<RowState, number> = { active: 0, inactive: 1, draft: 2 }
  return rows.sort((a, b) => {
    if (order[a.state] !== order[b.state]) return order[a.state] - order[b.state]
    return b.version - a.version
  })
}

export default function EgfDocumentsTable({ versions, activeVersion }: EgfDocumentsTableProps) {
  const rows = buildRows(versions, activeVersion)

  const versionHeader = resolveTranslatable({ key: 'datalist.egf.header.version' }, translate) ?? 'Version'
  const uriHeader = resolveTranslatable({ key: 'datalist.egf.header.uri' }, translate) ?? 'URI'
  const languageHeader = resolveTranslatable({ key: 'datalist.egf.header.language' }, translate) ?? 'Language'
  const statusHeader = resolveTranslatable({ key: 'datalist.egf.header.status' }, translate) ?? 'Status'

  return (
    <div className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-20 dark:divide-neutral-70">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <Th>{versionHeader}</Th>
              <Th>{uriHeader}</Th>
              <Th>{languageHeader}</Th>
              <Th>{statusHeader}</Th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-surface divide-y divide-neutral-20 dark:divide-neutral-70">
            {rows.map((row) => (
              <tr key={row.key} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className={`${BODY_CELL_CLASS} whitespace-nowrap`}>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {versionHeader} {row.version}
                  </span>
                </td>
                <td className={BODY_CELL_CLASS}>
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 inline-flex items-center gap-1 break-all"
                  >
                    <span>{row.url}</span>
                    <FontAwesomeIcon icon={faUpRightFromSquare} className="text-xs flex-shrink-0" />
                  </a>
                </td>
                <td className={`${BODY_CELL_CLASS} whitespace-nowrap`}>
                  <span className="text-sm text-gray-900 dark:text-white">{row.language}</span>
                </td>
                <td className={`${BODY_CELL_CLASS} whitespace-nowrap`}>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusPillClass(row.state)}`}
                  >
                    {row.statusText}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
