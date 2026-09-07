'use client'

import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { faCrown, faEye } from '@fortawesome/free-solid-svg-icons'
import { translate } from '@/i18n/dataview'
import { Role } from '@/ui/common/role-card'
import type { OnboardingProcessState, ParticipantRole, ParticipantState } from '@/ui/dataview/datasections/participant'
import { resolveTranslatable } from '@/ui/dataview/types'

export function formatNumber(value: unknown, defaultZero: boolean = false, withSeparators: boolean = false): string {
  if (value === null || value === undefined) return '0'
  const num = Number(value)
  return Number.isNaN(num) ? (defaultZero ? '0' : 'isNan') : withSeparators ? num.toLocaleString() : String(num)
}

export function formatVNA(amount: string | null, decimals?: number): string {
  if (!amount) return ''
  decimals = decimals ?? 6
  return `${(Number(amount) / 10 ** decimals).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })} VNA`
}

export function formatVNAFromUVNA(amount: string | null): string {
  const s = amount == null ? '' : String(amount)
  if (!s.trim() || !Number.isFinite(Number(s))) return ''
  return formatVNA(String(Number(s)), 6)
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

export function formatUSDfromUVNA(amount: string | null, conversionFactorUSDfromVNA: number): string {
  if (!amount) return ''
  if (!Number.isFinite(conversionFactorUSDfromVNA) || conversionFactorUSDfromVNA <= 0) return ''

  // Clean locale-formatted number (remove thousands separators and whitespace)
  const cleanAmount = amount
    .trim()
    .replace(/[^\d.,-]/g, '')
    .replace(/,/g, '')
  const numericAmount = parseFloat(cleanAmount)

  if (!Number.isFinite(numericAmount)) return ''

  const usd = numericAmount * conversionFactorUSDfromVNA

  return (
    '≈ $' +
    usd.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }) +
    ' USD'
  )
}

export function shortenMiddle(str: string, maxLength: number): string {
  if (str === null || str.length <= maxLength) return str
  const keep = Math.floor((maxLength - 3) / 2)
  const start = str.slice(0, keep)
  const end = str.slice(-keep)
  return `${start}...${end}`
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

export function isExpired(input: Date | string | number): boolean {
  const date = new Date(String(input))
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

const soonDays = 1
export function isExpireSoon(input: Date | string | number): boolean {
  const date = new Date(String(input))
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = date.getTime() - today.getTime()
  return diff > 0 && diff <= soonDays * 24 * 60 * 60 * 1000
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

export function formatNetwork(network: string) {
  const htmlNetwork = `
    <div class="relative w-2 h-2 bg-success-500 rounded-full pulse-dot"></div>
    <span class="text-sm text-success-700 dark:text-success-300 font-medium">${network}</span>
    `
  return htmlNetwork
}

export function roleBadgeClass(role: ParticipantRole) {
  switch (role) {
    case 'ECOSYSTEM':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
    case 'ISSUER_GRANTOR':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    case 'VERIFIER_GRANTOR':
      return 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400'
    case 'ISSUER':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    case 'VERIFIER':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
    case 'HOLDER':
      return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
  }
}

export function roleColorClass(type: string): string {
  switch (type) {
    case 'ECOSYSTEM':
      return 'text-purple-500'
    case 'ISSUER_GRANTOR':
      return 'text-blue-500'
    case 'VERIFIER_GRANTOR':
      return 'text-slate-500'
    case 'ISSUER':
      return 'text-green-500'
    case 'VERIFIER':
      return 'text-orange-500'
    case 'HOLDER':
      return 'text-pink-500'
    default:
      return 'text-gray-500'
  }
}

export function roleJoinColorClass(type: string): string {
  switch (type) {
    case 'ISSUER_GRANTOR':
      return 'bg-blue-100 text-blue-500'
    case 'VERIFIER_GRANTOR':
      return 'bg-slate-100 text-slate-500'
    case 'ISSUER':
      return 'bg-green-100 text-green-500'
    case 'VERIFIER':
      return 'bg-orange-100 text-orange-500'
    case 'HOLDER':
      return 'bg-pink-100 text-pink-500'
    default:
      return 'bg-gray-100 text-gray-500'
  }
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

export function participantStateBadgeClass(
  participantState: ParticipantState | undefined,
  expireSoon: boolean,
  variant: 'tree' | 'header' = 'tree'
): { labelParticipantState: string; classParticipantState: string } {
  if (!participantState) return { labelParticipantState: '', classParticipantState: '' }
  const activeClass =
    variant === 'header'
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
  const badge = ((): { labelParticipantState: string; classParticipantState: string } => {
    switch (participantState) {
      case 'REPAID':
        return {
          labelParticipantState: resolveTranslatable({ key: 'participant.labelstate.repaid' }, translate) ?? 'REPAID',
          classParticipantState: 'bg-gray-100 text-red-800 dark:bg-gray-900/20 dark:text-red-300',
        }
      case 'SLASHED':
        return {
          labelParticipantState: resolveTranslatable({ key: 'participant.labelstate.slashed' }, translate) ?? 'SLASHED',
          classParticipantState: 'bg-red-900 text-red-100 dark:bg-red-300/20 dark:text-red-800',
        }
      case 'FUTURE':
        return {
          labelParticipantState: resolveTranslatable({ key: 'participant.labelstate.future' }, translate) ?? 'FUTURE',
          classParticipantState: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
        }
      case 'ACTIVE':
        return expireSoon
          ? {
              labelParticipantState:
                resolveTranslatable({ key: 'participant.labelstate.expiresoon' }, translate) ?? 'EXPIRE SOON',
              classParticipantState: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
            }
          : {
              labelParticipantState:
                resolveTranslatable({ key: 'participant.labelstate.active' }, translate) ?? 'ACTIVE',
              classParticipantState: activeClass,
            }
      case 'INACTIVE':
        return {
          labelParticipantState:
            resolveTranslatable({ key: 'participant.labelstate.inactive' }, translate) ?? 'INACTIVE',
          classParticipantState: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
        }
      default:
        return {
          labelParticipantState: participantState,
          classParticipantState: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
        }
    }
  })()
  return variant === 'tree' ? { ...badge, labelParticipantState: badge.labelParticipantState.toLowerCase() } : badge
}

export function onboardingStateColor(
  onboardingState: OnboardingProcessState | null | undefined,
  onboardingExpiration: string | null | undefined,
  expireSoon: boolean
): { labelOnboardingState: string; classOnboardingState: string } {
  const GRAY = 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
  switch (onboardingState) {
    case 'PENDING':
      return {
        labelOnboardingState:
          resolveTranslatable({ key: 'participant.labelopstate.pending' }, translate) ?? 'pending approval',
        classOnboardingState: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      }
    case 'TERMINATED':
      return {
        labelOnboardingState:
          resolveTranslatable({ key: 'participant.labelopstate.terminated' }, translate) ?? 'terminated',
        classOnboardingState: GRAY,
      }
    case 'VALIDATED':
      return (onboardingExpiration ? isExpired(onboardingExpiration) : false)
        ? {
            labelOnboardingState:
              resolveTranslatable({ key: 'participant.labelopstate.expired' }, translate) ?? 'expired',
            classOnboardingState: GRAY,
          }
        : expireSoon
          ? {
              labelOnboardingState:
                resolveTranslatable({ key: 'participant.labelopstate.expiresoon' }, translate) ?? 'expire soon',
              classOnboardingState: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
            }
          : {
              labelOnboardingState:
                resolveTranslatable({ key: 'participant.labelopstate.validated' }, translate) ?? 'validated',
              classOnboardingState: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
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
    // validator
    return { icon: faCrown, iconColorClass: 'text-yellow-500' }
  } else if (isCorporation) {
    return { icon: faCrown, iconColorClass: 'text-green-500' }
  } else if (isPredecessor) {
    // predecessor
    return { icon: faCrown, iconColorClass: 'text-gray-500' }
  } else {
    return { icon: faEye, iconColorClass: 'text-gray-500' }
  }
}

export function rolesSchema(issuerOnboardingMode: string, verifierOnboardingMode: string): Role[] {
  const roles = new Set<Role>()

  // Issuance roles
  if (issuerOnboardingMode === 'GRANTOR_ONBOARDING_PROCESS') {
    roles.add('ISSUER_GRANTOR')
    roles.add('ISSUER')
  } else {
    // OPEN o ECOSYSTEM
    roles.add('ISSUER')
  }

  // Verification roles
  if (verifierOnboardingMode === 'GRANTOR_ONBOARDING_PROCESS') {
    roles.add('VERIFIER_GRANTOR')
    roles.add('VERIFIER')
  } else {
    // OPEN o ECOSYSTEM
    roles.add('VERIFIER')
  }

  roles.add('HOLDER')
  return Array.from(roles)
}

export function nodeChildRoles(
  issuerOnboardingMode: string,
  verifierOnboardingMode: string,
  role: string
): { role: Role; label: string; validation: boolean }[] {
  const roles = new Set<{ role: Role; label: string; validation: boolean }>()

  if (role === 'ECOSYSTEM') {
    // Issuance roles
    if (issuerOnboardingMode === 'GRANTOR_ONBOARDING_PROCESS') {
      roles.add({
        role: 'ISSUER_GRANTOR',
        label: resolveTranslatable({ key: 'participant.labelRole.issuerGrantor' }, translate) ?? 'Issuer Grantors',
        validation: true,
      })
    } else {
      // OPEN o ECOSYSTEM
      roles.add({
        role: 'ISSUER',
        label: resolveTranslatable({ key: 'participant.labelRole.issuer' }, translate) ?? 'Issuers',
        validation: issuerOnboardingMode === 'ECOSYSTEM_ONBOARDING_PROCESS',
      })
    }
    // Verification roles
    if (verifierOnboardingMode === 'GRANTOR_ONBOARDING_PROCESS') {
      roles.add({
        role: 'VERIFIER_GRANTOR',
        label: resolveTranslatable({ key: 'participant.labelRole.verifierGrantor' }, translate) ?? 'Verifier Grantors',
        validation: true,
      })
    } else {
      // OPEN o ECOSYSTEM
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
      validation: true,
    })
  }

  return Array.from(roles)
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
