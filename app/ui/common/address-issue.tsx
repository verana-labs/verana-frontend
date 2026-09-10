'use client'

import { translate } from '@/i18n/dataview'
import { isValidVeranaAddress } from '@/util/validations'

export function addressIssue(address: string, alreadyListed: readonly string[]): string | null {
  if (address.length === 0) return null
  if (!isValidVeranaAddress(address)) return 'corporation.address.invalid'
  return alreadyListed.includes(address) ? 'corporation.address.duplicate' : null
}

export function AddressIssueNote({ issue }: { issue: string | null }) {
  if (!issue) return null
  return <p className="mt-1 text-xs text-red-600 dark:text-red-400">{translate(issue)}</p>
}
