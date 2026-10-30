import { SESSION_LIFETIME_SECONDS } from '@/config/env'
import { sessionLifetimeMs } from '@/lib/corporation-discovery'
import { ECOSYSTEM_ORDERS } from '@/lib/discover-list'
import { logger } from '@/lib/logger'

export const LIST_FILTER_SCOPES = ['discover', 'ecosystems', 'agents'] as const
export type ListFilterScope = (typeof LIST_FILTER_SCOPES)[number]

const STORAGE_PREFIX = 'verana.list-filters:'

const ALLOWED_VALUES: Record<string, readonly unknown[]> = { order: ECOSYSTEM_ORDERS }

interface StoredFilters {
  filters: Record<string, unknown>
  expiresAt: number
}

function storageKey(scope: ListFilterScope, owner: string): string {
  return `${STORAGE_PREFIX}${scope}:${owner}`
}

function isAllowed(key: string, value: unknown, fallback: unknown): boolean {
  if (typeof value !== typeof fallback) return false
  return ALLOWED_VALUES[key]?.includes(value) ?? true
}

export function loadListFilters<T extends object>(scope: ListFilterScope, owner: string, defaults: T): T | null {
  try {
    const raw = window.localStorage.getItem(storageKey(scope, owner))
    if (!raw) return null
    const stored: unknown = JSON.parse(raw)
    if (typeof stored !== 'object' || stored === null) return null
    const { filters, expiresAt } = stored as Partial<StoredFilters>
    if (typeof filters !== 'object' || filters === null || typeof expiresAt !== 'number') return null
    if (expiresAt <= Date.now()) {
      window.localStorage.removeItem(storageKey(scope, owner))
      return null
    }
    const saved = filters as Record<string, unknown>
    return Object.fromEntries(
      Object.entries(defaults).map(([key, fallback]) => [
        key,
        isAllowed(key, saved[key], fallback) ? saved[key] : fallback,
      ])
    ) as T
  } catch {
    return null
  }
}

export function saveListFilters(scope: ListFilterScope, owner: string, filters: object): void {
  const stored: StoredFilters = {
    filters: { ...filters },
    expiresAt: Date.now() + sessionLifetimeMs(SESSION_LIFETIME_SECONDS),
  }
  try {
    window.localStorage.setItem(storageKey(scope, owner), JSON.stringify(stored))
  } catch (reason) {
    logger.warn('list filter storage', reason)
  }
}

export function forgetListFilters(owner: string): void {
  try {
    for (const scope of LIST_FILTER_SCOPES) window.localStorage.removeItem(storageKey(scope, owner))
  } catch (reason) {
    logger.warn('list filter storage', reason)
  }
}
