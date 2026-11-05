'use client'

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  faBan,
  faCheck,
  faClockRotateLeft,
  faHandHoldingDollar,
  faPlay,
  faPlus,
  faQuestion,
  faRotate,
  faTriangleExclamation,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { ReactNode } from 'react'
import { translate } from '@/i18n/dataview'
import { formatSchemaAmount, type SchemaPricing } from '@/lib/pricing-asset'
import { cn } from '@/lib/utils'
import { resolveTranslatable } from '@/ui/dataview/types'
import {
  TimelineContent,
  TimelineDate,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from '@/ui/participants/timeline'
import { formatDateTime, formatVNAFromUVNA, shortenMiddle } from '@/util/util'
import type { ParticipantHistory } from '../dataview/datasections/participant'

const tr = (key: string, fallback: string) => resolveTranslatable({ key }, translate) ?? fallback

export default function ParticipantTimeline({
  participantHistory,
  feePricing,
}: {
  participantHistory: ParticipantHistory
  feePricing?: SchemaPricing | null
}) {
  const { label, icon, iconBgClass, iconColorClass } = getTimelineStyle(participantHistory.msg)
  const account = participantHistory.account ? shortenMiddle(participantHistory.account, 20) : ''
  const summary = describeChanges(participantHistory.msg, participantHistory.changes, feePricing)

  return (
    <TimelineItem>
      <TimelineIndicator className={cn(iconBgClass, iconColorClass)}>
        <FontAwesomeIcon icon={icon} className="size-3" />
      </TimelineIndicator>
      <TimelineSeparator />
      <TimelineTitle>{label}</TimelineTitle>
      <TimelineContent className="text-xs break-all">
        <TimelineDate dateTime={participantHistory.timestamp} className="inline">
          {formatDateTime(participantHistory.timestamp)}
        </TimelineDate>
        {account ? (
          <>
            {' '}
            {tr('participantcard.timeline.by', 'by')}{' '}
            <span className="font-mono" title={participantHistory.account}>
              {account}
            </span>
          </>
        ) : null}
      </TimelineContent>
      {summary ? (
        <p className="mt-1 w-fit max-w-full rounded-md bg-muted px-1.5 py-0.5 text-xs text-foreground/80 break-words">
          {summary}
        </p>
      ) : null}
    </TimelineItem>
  )
}

type TimelineStyle = {
  label: string
  icon: IconDefinition
  iconBgClass: string
  iconColorClass: string
}

export function getTimelineStyle(msg: string): TimelineStyle {
  switch (msg) {
    case 'CreateRootParticipant':
    case 'SelfCreateParticipant':
      return {
        label: tr('participantcard.timeline.event.created', 'Participant Created'),
        icon: faPlus,
        iconBgClass: 'bg-primary/10',
        iconColorClass: 'text-primary',
      }
    case 'StartParticipantOP':
      return {
        label: tr('participantcard.timeline.event.startop', 'Start Onboarding Process'),
        icon: faPlay,
        iconBgClass: 'bg-info/10',
        iconColorClass: 'text-info',
      }
    case 'SetParticipantOPToValidated':
      return {
        label: tr('participantcard.timeline.event.setvalidated', 'Accept and Set Validated'),
        icon: faCheck,
        iconBgClass: 'bg-success/10',
        iconColorClass: 'text-success',
      }
    case 'RenewParticipantOP':
      return {
        label: tr('participantcard.timeline.event.renewop', 'Renew Onboarding Process'),
        icon: faRotate,
        iconBgClass: 'bg-info/10',
        iconColorClass: 'text-info',
      }
    case 'CancelParticipantOPLastRequest':
      return {
        label: tr('participantcard.timeline.event.cancelop', 'Cancel Request'),
        icon: faXmark,
        iconBgClass: 'bg-muted',
        iconColorClass: 'text-muted-foreground',
      }
    case 'SetParticipantEffectiveUntil':
      return {
        label: tr('participantcard.timeline.event.extended', 'Participant Adjusted'),
        icon: faClockRotateLeft,
        iconBgClass: 'bg-primary/10',
        iconColorClass: 'text-primary',
      }
    case 'RevokeParticipant':
      return {
        label: tr('participantcard.timeline.event.revoked', 'Participant Revoked'),
        icon: faBan,
        iconBgClass: 'bg-destructive/10',
        iconColorClass: 'text-destructive',
      }
    case 'SlashParticipantTrustDeposit':
      return {
        label: tr('participantcard.timeline.event.slashed', 'Deposit Slashed'),
        icon: faTriangleExclamation,
        iconBgClass: 'bg-destructive/10',
        iconColorClass: 'text-destructive',
      }
    case 'RepayParticipantSlashedTrustDeposit':
      return {
        label: tr('participantcard.timeline.event.repaid', 'Slashed Deposit Repaid'),
        icon: faHandHoldingDollar,
        iconBgClass: 'bg-success/10',
        iconColorClass: 'text-success',
      }
    default:
      return {
        label: msg || tr('participantcard.timeline.event.unknown', 'Unknown Event'),
        icon: faQuestion,
        iconBgClass: 'bg-muted',
        iconColorClass: 'text-muted-foreground',
      }
  }
}

function describeChanges(
  msg: string,
  changes: Record<string, unknown> | unknown,
  feePricing?: SchemaPricing | null
): string | null {
  const fee = (value: unknown) =>
    feePricing ? formatSchemaAmount(String(value), feePricing) : formatVNAFromUVNA(String(value))
  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) return null
  const c = changes as Record<string, unknown>

  switch (msg) {
    case 'CreateRootParticipant':
    case 'SelfCreateParticipant': {
      const parts: string[] = []
      const deposit = c.deposit
      if (deposit != null && Number(deposit) > 0) {
        parts.push(`${formatVNAFromUVNA(String(deposit))} deposit`)
      }
      const effectiveUntil = c.effective_until
      if (typeof effectiveUntil === 'string' && effectiveUntil) {
        parts.push(`effective until ${formatDateTime(effectiveUntil)}`)
      }
      return parts.length ? parts.join(', ') : null
    }
    case 'StartParticipantOP': {
      const deposit = c.op_validator_deposit ?? c.deposit
      if (deposit != null && Number(deposit) > 0) {
        return `Initiated onboarding process with ${formatVNAFromUVNA(String(deposit))} deposit`
      }
      return null
    }
    case 'SetParticipantOPToValidated': {
      const fees: string[] = []
      if (c.validation_fees != null && Number(c.validation_fees) > 0)
        fees.push(`validation_fees: ${fee(c.validation_fees)}`)
      if (c.issuance_fees != null && Number(c.issuance_fees) > 0) fees.push(`issuance_fees: ${fee(c.issuance_fees)}`)
      if (c.verification_fees != null && Number(c.verification_fees) > 0)
        fees.push(`verification_fees: ${fee(c.verification_fees)}`)
      return fees.length ? `Set ${fees.join(', ')}` : null
    }
    case 'SetParticipantEffectiveUntil': {
      const effectiveUntil = c.effective_until
      if (typeof effectiveUntil === 'string' && effectiveUntil) {
        return `Extended until ${formatDateTime(effectiveUntil)}`
      }
      return null
    }
    case 'SlashParticipantTrustDeposit':
    case 'RepayParticipantSlashedTrustDeposit': {
      const amount = c.slashed_deposit ?? c.repaid_deposit
      if (amount != null && Number(amount) > 0) {
        return `Amount: ${formatVNAFromUVNA(String(amount))}`
      }
      return null
    }
    default:
      return null
  }
}

export function renderChanges(changes: unknown): ReactNode {
  if (changes == null) return null
  if (typeof changes === 'string') {
    const text = changes.trim()
    if (!text) return null
    return <p className="mt-1 text-xs text-foreground/80 break-all">{text}</p>
  }
  if (typeof changes !== 'object') return null
  return null
}
