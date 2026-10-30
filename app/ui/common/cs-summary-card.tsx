'use client'

import { faEye, faSitemap } from '@fortawesome/free-solid-svg-icons'
import { FileJson2Icon } from 'lucide-react'
import type { ReactNode } from 'react'
import { translate } from '@/i18n/dataview'
import { cn } from '@/lib/utils'
import IconActionButton from '@/ui/common/icon-action-button'
import { type CredentialSchemaListItem, getModePillClass } from '@/ui/datatable/columnslist/cs'
import { resolveTranslatable } from '@/ui/dataview/types'
import { hoverLift } from '@/ui/motion/interaction'
import { formatNumber, formatVNA } from '@/util/util'

export type CsSummaryCardProps = {
  credentialSchema: CredentialSchemaListItem
  onView: () => void
  onParticipants: () => void
}

function ModeRow({ label, value, suffix }: { label: string; value: string | null; suffix: string }) {
  if (!value?.trim()) return null
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <span className="shrink-0 text-muted-foreground">{label}:</span>
      <span
        title={value}
        className={`inline-flex min-w-0 items-center truncate rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide ${getModePillClass(value, suffix)}`}
      >
        {value}
      </span>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate text-base font-semibold tracking-tight tabular-nums">{value}</dd>
    </div>
  )
}

export default function CsSummaryCard({ credentialSchema, onView, onParticipants }: CsSummaryCardProps) {
  const isArchived = !!credentialSchema.archived

  const previewLabel = resolveTranslatable({ key: 'datatable.cs.card.previewSchema' }, translate) ?? 'Preview Schema'
  const participantsLabel =
    resolveTranslatable({ key: 'datatable.cs.card.viewParticipants' }, translate) ?? 'View Participants'
  const archivedLabel = resolveTranslatable({ key: 'datatable.cs.card.archived' }, translate) ?? 'ARCHIVED'
  const participants = resolveTranslatable({ key: 'datatable.cs.card.participants' }, translate) ?? 'Participants'
  const issued = resolveTranslatable({ key: 'datatable.cs.card.issuedCredentials' }, translate) ?? 'Issued Credentials'
  const verified =
    resolveTranslatable({ key: 'datatable.cs.card.verifiedCredentials' }, translate) ?? 'Verified Credentials'
  const trustValue = resolveTranslatable({ key: 'datatable.cs.card.trustValue' }, translate) ?? 'Trust Value'
  const issuerLabel = resolveTranslatable({ key: 'participantcard.role.singular.issuer' }, translate) ?? 'Issuer'
  const verifierLabel = resolveTranslatable({ key: 'participantcard.role.singular.verifier' }, translate) ?? 'Verifier'
  const holderLabel = resolveTranslatable({ key: 'participantcard.role.singular.holder' }, translate) ?? 'Holder'

  return (
    <div
      className={cn(
        'group/schema relative flex h-full flex-col overflow-hidden rounded-xl bg-card shadow-card',
        hoverLift,
        isArchived && 'bg-muted/40'
      )}
    >
      {isArchived ? (
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center select-none">
          <span className="-rotate-12 text-3xl font-bold tracking-[0.3em] whitespace-nowrap text-destructive/15 sm:text-4xl dark:text-destructive/20">
            {archivedLabel}
          </span>
        </div>
      ) : null}

      <div className={cn('relative z-10 flex flex-1 flex-col p-5', isArchived && 'opacity-75')}>
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileJson2Icon className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={onView}
              className="block max-w-full truncate rounded-sm text-left text-base font-semibold tracking-tight transition-colors outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
              title={credentialSchema.title}
            >
              {credentialSchema.title}
            </button>
            <p className="font-mono text-xs text-muted-foreground">#{credentialSchema.id}</p>
          </div>
          <div className="-mt-1 -mr-1.5 flex shrink-0 items-center">
            <IconActionButton icon={faEye} label={previewLabel} onClick={onView} />
            <IconActionButton icon={faSitemap} label={participantsLabel} onClick={onParticipants} />
          </div>
        </div>

        {credentialSchema.description ? (
          <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{credentialSchema.description}</p>
        ) : null}

        <div className="mt-4 space-y-2 text-sm">
          <ModeRow label={issuerLabel} value={credentialSchema.issuerOnboardingMode} suffix="_ISSUER" />
          <ModeRow label={verifierLabel} value={credentialSchema.verifierOnboardingMode} suffix="_VERIFIER" />
          <ModeRow label={holderLabel} value={credentialSchema.holderOnboardingMode} suffix="_HOLDER" />
        </div>

        <div className="mt-auto pt-5">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4">
            <Stat label={participants} value={formatNumber(credentialSchema.participants, true)} />
            <Stat label={trustValue} value={formatVNA(String(credentialSchema.weight), 6) || '0 VNA'} />
            <Stat label={issued} value={formatNumber(credentialSchema.issuedCredentials, true)} />
            <Stat label={verified} value={formatNumber(credentialSchema.verifiedCredentials, true)} />
          </dl>
        </div>
      </div>
    </div>
  )
}
