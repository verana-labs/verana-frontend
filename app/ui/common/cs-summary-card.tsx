'use client'

import { faEye, faSitemap } from '@fortawesome/free-solid-svg-icons'
import { ReactNode } from 'react'
import { translate } from '@/i18n/dataview'
import IconActionButton from '@/ui/common/icon-action-button'
import { CsList, getModePillClass } from '@/ui/datatable/columnslist/cs'
import { resolveTranslatable } from '@/ui/dataview/types'
import { formatNumber, formatVNA } from '@/util/util'

export type CsSummaryCardProps = {
  cs: CsList
  onView: () => void
  onParticipants: () => void
}

function RolePill({ value, suffix }: { value?: string | number; suffix: string }) {
  const raw = value !== undefined && value !== null ? String(value) : ''
  if (!raw.trim()) return null
  const klass = getModePillClass(raw, suffix)
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${klass}`}>{raw}</span>
  )
}

function StatRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-neutral-70 dark:text-neutral-70">{label}:</span>
      <span className="font-medium text-gray-900 dark:text-white">{value}</span>
    </div>
  )
}

export default function CsSummaryCard({ cs, onView, onParticipants }: CsSummaryCardProps) {
  const isArchived = !!cs.archived

  const previewLabel = resolveTranslatable({ key: 'datatable.cs.card.previewSchema' }, translate) ?? 'Preview Schema'
  const participantsLabel =
    resolveTranslatable({ key: 'datatable.cs.card.viewParticipants' }, translate) ?? 'View Participants'
  const archivedLabel = resolveTranslatable({ key: 'datatable.cs.card.archived' }, translate) ?? 'ARCHIVED'
  const participants = resolveTranslatable({ key: 'datatable.cs.card.participants' }, translate) ?? 'Participants'
  const issued = resolveTranslatable({ key: 'datatable.cs.card.issuedCredentials' }, translate) ?? 'Issued Credentials'
  const verified =
    resolveTranslatable({ key: 'datatable.cs.card.verifiedCredentials' }, translate) ?? 'Verified Credentials'
  const trustValue = resolveTranslatable({ key: 'datatable.cs.card.trustValue' }, translate) ?? 'Trust Value'

  return (
    <div
      className={`relative bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 hover:shadow-lg transition-shadow overflow-hidden ${isArchived ? 'opacity-95' : ''}`}
    >
      {isArchived ? (
        <>
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-black/[0.03] dark:bg-white/[0.04]" />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
          >
            <span className="text-3xl sm:text-4xl font-bold text-red-500/20 dark:text-white/15 -rotate-45 whitespace-nowrap tracking-widest">
              {archivedLabel}
            </span>
          </div>
        </>
      ) : null}

      <div className="relative z-10 p-4 sm:p-6">
        <div className="flex items-start justify-between mb-4 gap-2">
          <button
            type="button"
            onClick={onView}
            className="text-left text-base sm:text-lg font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex-1 pr-2 break-words"
          >
            {cs.title}
          </button>
          <div className="flex items-center gap-1 flex-shrink-0">
            <IconActionButton icon={faEye} label={previewLabel} onClick={onView} />
            <IconActionButton icon={faSitemap} label={participantsLabel} onClick={onParticipants} />
          </div>
        </div>

        {cs.description ? (
          <p className="text-xs sm:text-sm text-neutral-70 dark:text-neutral-70 mb-4 line-clamp-2">{cs.description}</p>
        ) : null}

        <div className="flex flex-wrap gap-2 mb-4">
          <RolePill value={cs.issuerPermManagementMode} suffix="_ISSUER" />
          <RolePill value={cs.verifierPermManagementMode} suffix="_VERIFIER" />
        </div>

        <div className="space-y-2 text-xs sm:text-sm">
          <StatRow label={participants} value={formatNumber(cs.participants, true)} />
          <StatRow label={issued} value={formatNumber(cs.issuedCredentials, true)} />
          <StatRow label={verified} value={formatNumber(cs.verifiedCredentials, true)} />
          <StatRow label={trustValue} value={formatVNA(cs.trustValue ?? '0', 6) || '0 VNA'} />
        </div>
      </div>
    </div>
  )
}
