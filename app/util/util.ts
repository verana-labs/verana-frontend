'use client'

import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { faCrown, faEye } from '@fortawesome/free-solid-svg-icons'
import { SHOW_PARTICIPANT_EXPIRE_BEFORE_DAYS } from '@/config/env'
import { translate } from '@/i18n/dataview'
import type { HolderOnboardingMode } from '@/lib/participant-onboarding'
import type { TreeNode } from '@/ui/common/participant-tree-types'
import type { OnboardingProcessState, ParticipantRole, ParticipantState } from '@/ui/dataview/datasections/participant'
import { resolveTranslatable } from '@/ui/dataview/types'

export function formatNumber(value: unknown, defaultZero: boolean = false, withSeparators: boolean = false): string {
  if (value === null || value === undefined) return '0'
  const num = Number(value)
  return Number.isNaN(num) ? (defaultZero ? '0' : 'isNan') : withSeparators ? num.toLocaleString() : String(num)
}

const INTEGER_AMOUNT = /^-?\d+$/

function shiftDecimalPoint(digits: string, decimals: number): `${number}` {
  const sign = digits.startsWith('-') ? '-' : ''
  const unsigned = (sign ? digits.slice(1) : digits).padStart(decimals + 1, '0')
  const whole = unsigned.slice(0, unsigned.length - decimals)
  const fraction = unsigned.slice(unsigned.length - decimals)
  return `${sign}${whole}${fraction ? `.${fraction}` : ''}` as `${number}`
}

export function formatVNA(amount: string | null, decimals?: number): string {
  if (!amount) return ''
  decimals = decimals ?? 6
  const trimmed = amount.trim()
  const value = INTEGER_AMOUNT.test(trimmed) ? shiftDecimalPoint(trimmed, decimals) : Number(trimmed) / 10 ** decimals
  return `${new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value)} VNA`
}

export function formatVNAFromUVNA(amount: string | null): string {
  const s = amount == null ? '' : String(amount)
  if (!s.trim() || !Number.isFinite(Number(s))) return ''
  return formatVNA(s.trim(), 6)
}

export function parseVNA(formatted: string, decimals: number = 6): string {
  if (!formatted) return '0'
  // Remove "VNA" and spaces, and thousands separator
  const clean = formatted.replace(/[^\d.,-]/g, '').replace(/,/g, '')
  // Parse as float
  const floatValue = parseFloat(clean)
  if (Number.isNaN(floatValue)) return '0'
  // Convert to microVNA (as integer string)
  const micro = Math.round(floatValue * 10 ** decimals)
  return micro.toString()
}

const VNA_AMOUNT = /^(\d+)(?:\.(\d{1,6}))?$/
const UVNA_PER_VNA = BigInt(1_000_000)

export function parseVNAExact(text: string): string | null {
  const match = VNA_AMOUNT.exec(text.trim())
  if (!match) return null
  return (BigInt(match[1]) * UVNA_PER_VNA + BigInt((match[2] ?? '').padEnd(6, '0'))).toString()
}

export function shortenMiddle(str: string, maxLength: number): string {
  if (str === null || str.length <= maxLength) return str
  const keep = Math.floor((maxLength - 3) / 2)
  const start = str.slice(0, keep)
  const end = str.slice(-keep)
  return `${start}...${end}`
}

export function participantCardHref(schemaId: number | string, participantId?: number | string): string {
  const params = new URLSearchParams({ tab: 'participants' })
  if (participantId !== undefined) params.set('participant', String(participantId))
  return `/credential-schemas/${encodeURIComponent(String(schemaId))}?${params.toString()}`
}

export function shortenDID(str: string): string {
  return shortenMiddle(str, 30)
}
export function formatDate(input: Date | string | number): string {
  const date = new Date(input).toLocaleDateString()
  return date
}

export function formatDateTime(input: Date | string | number): string {
  if (input == null || input === '') return ''
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) return ''
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`
}

export function countryNameFromCode(code: string | undefined | null): string {
  if (!code) return ''
  const trimmed = String(code).trim().toUpperCase()
  if (!trimmed) return ''
  try {
    const display = new Intl.DisplayNames(['en'], { type: 'region' })
    return display.of(trimmed) ?? trimmed
  } catch {
    return trimmed
  }
}

export function formatLongDateUserLocale(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date

  if (Number.isNaN(d.getTime())) return ''

  return d.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const DEFAULT_EXPIRE_BEFORE_DAYS = 30

export function expireBeforeDays(configured: string | undefined = SHOW_PARTICIPANT_EXPIRE_BEFORE_DAYS): number {
  const days = Number(configured)
  return Number.isFinite(days) && days > 0 ? days : DEFAULT_EXPIRE_BEFORE_DAYS
}

export function isExpireSoon(input: Date | string | null | undefined): boolean {
  if (input === null || input === undefined || input === '') return false
  const date = new Date(String(input))
  if (Number.isNaN(date.getTime())) return false
  const diff = date.getTime() - Date.now()
  return diff > 0 && diff <= expireBeforeDays() * 24 * 60 * 60 * 1000
}

export function isJson(value: unknown): object | null {
  if (value && typeof value === 'object') {
    if (Array.isArray(value) || Object.prototype.toString.call(value) === '[object Object]') {
      return value as object
    }
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return JSON.parse(trimmed)
      } catch {
        return null
      }
    }
  }

  return null
}

export function getStatus(input: Date | string | number): 'expired' | 'expiring' | 'active' {
  const target = new Date(String(input))
  if (Number.isNaN(target.getTime())) return 'expired' // fallback

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const monthAfter = new Date(today)
  monthAfter.setMonth(monthAfter.getMonth() + 1)

  if (target < today) {
    return 'expired'
  }

  if (target >= today && target < monthAfter) {
    return 'expiring'
  }

  return 'active'
}

export function countryCodeToFlag(code?: string | null): string {
  if (!code) return '🏳️'
  const normalized = code.trim().toUpperCase()
  if (normalized.length !== 2 || !/^[A-Z]{2}$/.test(normalized)) return '🏳️'
  const base = 0x1f1e6
  return String.fromCodePoint(base + (normalized.charCodeAt(0) - 65), base + (normalized.charCodeAt(1) - 65))
}

export type BadgeTone = 'primary' | 'info' | 'success' | 'warning' | 'destructive' | 'muted'

export const BADGE_TONE: Record<BadgeTone, string> = {
  primary: 'bg-primary/10 text-primary',
  info: 'bg-info/10 text-info dark:bg-info/20',
  success: 'bg-success/10 text-success dark:bg-success/20',
  warning: 'bg-warning/10 text-warning dark:bg-warning/20',
  destructive: 'bg-destructive/10 text-destructive dark:bg-destructive/20',
  muted: 'bg-muted text-muted-foreground',
}

const OUTLINE_BADGE = 'bg-transparent text-muted-foreground ring-1 ring-inset ring-border'

export function roleBadgeClass(role: ParticipantRole) {
  switch (role) {
    case 'ECOSYSTEM':
      return BADGE_TONE.primary
    case 'ISSUER_GRANTOR':
      return BADGE_TONE.info
    case 'ISSUER':
      return BADGE_TONE.success
    case 'VERIFIER':
      return BADGE_TONE.warning
    case 'HOLDER':
      return `${BADGE_TONE.muted} ring-1 ring-inset ring-border`
    default:
      return BADGE_TONE.muted
  }
}

export function roleColorClass(type: string): string {
  switch (type) {
    case 'ECOSYSTEM':
      return 'text-primary'
    case 'ISSUER_GRANTOR':
      return 'text-info'
    case 'ISSUER':
      return 'text-success'
    case 'VERIFIER':
      return 'text-warning'
    case 'HOLDER':
      return 'text-foreground'
    default:
      return 'text-muted-foreground'
  }
}

export function roleJoinColorClass(type: string): string {
  return type === 'ECOSYSTEM' ? BADGE_TONE.muted : roleBadgeClass(type as ParticipantRole)
}

export function roleLabel(type: string): string {
  switch (type) {
    case 'ECOSYSTEM':
      return resolveTranslatable({ key: 'participant.labelRole.ecosystem' }, translate) ?? 'Ecosystems'
    case 'ISSUER_GRANTOR':
      return resolveTranslatable({ key: 'participant.labelRole.issuerGrantor' }, translate) ?? 'Issuer Grantors'
    case 'VERIFIER_GRANTOR':
      return resolveTranslatable({ key: 'participant.labelRole.verifierGrantor' }, translate) ?? 'Verifier Grantors'
    case 'ISSUER':
      return resolveTranslatable({ key: 'participant.labelRole.issuer' }, translate) ?? 'Issuers'
    case 'VERIFIER':
      return resolveTranslatable({ key: 'participant.labelRole.verifier' }, translate) ?? 'Verifiers'
    case 'HOLDER':
      return resolveTranslatable({ key: 'participant.labelRole.holder' }, translate) ?? 'Holders'
    default:
      return ''
  }
}

export interface ParticipantStateBadge {
  labelParticipantState: string
  classParticipantState: string
  expireSoon: { labelExpireSoon: string; classExpireSoon: string } | null
}

export function participantStateBadgeClass(
  participantState: ParticipantState | undefined,
  expireSoon: boolean,
  variant: 'tree' | 'header' = 'tree'
): ParticipantStateBadge {
  if (!participantState) return { labelParticipantState: '', classParticipantState: '', expireSoon: null }
  const activeClass = variant === 'header' ? BADGE_TONE.info : BADGE_TONE.success
  const badge = ((): { labelParticipantState: string; classParticipantState: string } => {
    switch (participantState) {
      case 'REPAID':
        return {
          labelParticipantState: resolveTranslatable({ key: 'participant.labelstate.repaid' }, translate) ?? 'REPAID',
          classParticipantState: 'bg-muted text-destructive',
        }
      case 'SLASHED':
        return {
          labelParticipantState: resolveTranslatable({ key: 'participant.labelstate.slashed' }, translate) ?? 'SLASHED',
          classParticipantState: 'bg-destructive text-white dark:text-background',
        }
      case 'FUTURE':
        return {
          labelParticipantState: resolveTranslatable({ key: 'participant.labelstate.future' }, translate) ?? 'FUTURE',
          classParticipantState: OUTLINE_BADGE,
        }
      case 'ACTIVE':
        return {
          labelParticipantState: resolveTranslatable({ key: 'participant.labelstate.active' }, translate) ?? 'ACTIVE',
          classParticipantState: activeClass,
        }
      case 'INACTIVE':
        return {
          labelParticipantState:
            resolveTranslatable({ key: 'participant.labelstate.inactive' }, translate) ?? 'INACTIVE',
          classParticipantState: OUTLINE_BADGE,
        }
      case 'EXPIRED':
        return {
          labelParticipantState: resolveTranslatable({ key: 'participant.labelstate.expired' }, translate) ?? 'EXPIRED',
          classParticipantState: BADGE_TONE.muted,
        }
      case 'REVOKED':
        return {
          labelParticipantState: resolveTranslatable({ key: 'participant.labelstate.revoked' }, translate) ?? 'REVOKED',
          classParticipantState: BADGE_TONE.muted,
        }
    }
  })()
  const expireSoonBadge =
    participantState === 'ACTIVE' && expireSoon
      ? {
          labelExpireSoon:
            resolveTranslatable({ key: 'participant.labelstate.expiresoon' }, translate) ?? 'EXPIRES SOON',
          classExpireSoon: BADGE_TONE.warning,
        }
      : null
  if (variant !== 'tree') return { ...badge, expireSoon: expireSoonBadge }
  return {
    labelParticipantState: badge.labelParticipantState.toLowerCase(),
    classParticipantState: badge.classParticipantState,
    expireSoon: expireSoonBadge
      ? { ...expireSoonBadge, labelExpireSoon: expireSoonBadge.labelExpireSoon.toLowerCase() }
      : null,
  }
}

export function onboardingStateColor(onboardingState: OnboardingProcessState | null | undefined): {
  labelOnboardingState: string
  classOnboardingState: string
} {
  switch (onboardingState) {
    case 'PENDING':
      return {
        labelOnboardingState:
          resolveTranslatable({ key: 'participant.labelopstate.pending' }, translate) ?? 'pending approval',
        classOnboardingState: BADGE_TONE.warning,
      }
    case 'TERMINATED':
      return {
        labelOnboardingState:
          resolveTranslatable({ key: 'participant.labelopstate.terminated' }, translate) ?? 'terminated',
        classOnboardingState: BADGE_TONE.muted,
      }
    case 'VALIDATED':
      return {
        labelOnboardingState:
          resolveTranslatable({ key: 'participant.labelopstate.validated' }, translate) ?? 'validated',
        classOnboardingState: BADGE_TONE.success,
      }
    default:
      return { labelOnboardingState: '', classOnboardingState: '' }
  }
}

export function participantAuthority(
  isCorporation: boolean,
  isValidator: boolean,
  isPredecessor: boolean
): { icon: IconDefinition; iconColorClass: string } {
  if (isValidator) {
    return { icon: faCrown, iconColorClass: 'text-warning' }
  } else if (isCorporation) {
    return { icon: faCrown, iconColorClass: 'text-success' }
  } else if (isPredecessor) {
    return { icon: faCrown, iconColorClass: 'text-muted-foreground' }
  } else {
    return { icon: faEye, iconColorClass: 'text-muted-foreground' }
  }
}

export function nodeChildRoles(
  issuerOnboardingMode: string,
  verifierOnboardingMode: string,
  holderOnboardingMode: HolderOnboardingMode | null,
  role: string
): { role: ParticipantRole; label: string; validation: boolean }[] {
  const roles = new Set<{ role: ParticipantRole; label: string; validation: boolean }>()

  if (role === 'ECOSYSTEM') {
    if (issuerOnboardingMode === 'GRANTOR_ONBOARDING_PROCESS') {
      roles.add({
        role: 'ISSUER_GRANTOR',
        label: resolveTranslatable({ key: 'participant.labelRole.issuerGrantor' }, translate) ?? 'Issuer Grantors',
        validation: true,
      })
    } else {
      roles.add({
        role: 'ISSUER',
        label: resolveTranslatable({ key: 'participant.labelRole.issuer' }, translate) ?? 'Issuers',
        validation: issuerOnboardingMode === 'ECOSYSTEM_ONBOARDING_PROCESS',
      })
    }
    if (verifierOnboardingMode === 'GRANTOR_ONBOARDING_PROCESS') {
      roles.add({
        role: 'VERIFIER_GRANTOR',
        label: resolveTranslatable({ key: 'participant.labelRole.verifierGrantor' }, translate) ?? 'Verifier Grantors',
        validation: true,
      })
    } else {
      roles.add({
        role: 'VERIFIER',
        label: resolveTranslatable({ key: 'participant.labelRole.verifier' }, translate) ?? 'Verifiers',
        validation: verifierOnboardingMode === 'ECOSYSTEM_ONBOARDING_PROCESS',
      })
    }
  } else if (role === 'ISSUER_GRANTOR') {
    roles.add({
      role: 'ISSUER',
      label: resolveTranslatable({ key: 'participant.labelRole.issuer' }, translate) ?? 'Issuers',
      validation: true,
    })
  } else if (role === 'VERIFIER_GRANTOR') {
    roles.add({
      role: 'VERIFIER',
      label: resolveTranslatable({ key: 'participant.labelRole.verifier' }, translate) ?? 'Verifiers',
      validation: true,
    })
  } else if (role === 'ISSUER') {
    roles.add({
      role: 'HOLDER',
      label: resolveTranslatable({ key: 'participant.labelRole.holder' }, translate) ?? 'Holders',
      validation: holderOnboardingMode === 'ISSUER_ONBOARDING_PROCESS',
    })
  }

  return Array.from(roles)
}

export function childRoleOnboardingAction(
  childRole: { role: ParticipantRole; validation: boolean },
  isWalletConnected: boolean
): NonNullable<TreeNode['onboardingAction']> {
  if (childRole.role === 'HOLDER' && !childRole.validation) return 'LinkDID'
  if (!isWalletConnected) return 'Connect'
  return childRole.validation ? 'MsgStartParticipantOP' : 'MsgSelfCreateParticipant'
}

export function childRoleOnboardingLabel(childRole: { role: ParticipantRole; validation: boolean }): string {
  if (childRole.validation) return 'onboarding process'
  if (childRole.role !== 'HOLDER') return 'open'
  return translate('dataview.cs.managementMode.PERMISSIONLESS')
}

// Takes "YYYY-MM-DD" and returns an ISO string with today's time (+1 min) applied to that date.
// Example: "2026-02-06" -> "2026-02-06T15:21:00.000Z" (depending on timezone)
export function withCurrentLocalTimePlusOneMinute(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return ''

  const now = new Date(Date.now() + 60_000)
  const combined = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds(), 0)

  const yyyy = combined.getFullYear()
  const mm = String(combined.getMonth() + 1).padStart(2, '0')
  const dd = String(combined.getDate()).padStart(2, '0')
  const hh = String(combined.getHours()).padStart(2, '0')
  const mi = String(combined.getMinutes()).padStart(2, '0')
  const ss = String(combined.getSeconds()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`
}

export async function copyToClipboard(text: string, change?: (value: boolean) => void) {
  if (!text) return
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      change?.(true)
      return
    }
  } catch {
    // ignore
  }
  change?.(false)
}
