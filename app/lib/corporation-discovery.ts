import {
  SESSION_LIFETIME_SECONDS,
  VERANA_REST_ENDPOINT_CORPORATION,
  VERANA_REST_ENDPOINT_DELEGATION,
  VERANA_REST_ENDPOINT_GROUP,
} from '@/config/env'
import { fetchKeysetPages, indexerValidators, type KeysetWindow } from '@/lib/indexer-json'
import { logger } from '@/lib/logger'
import { type DidEnrichment, enrichmentFromTrustData } from '@/lib/resolverClient'

export interface UserCorporation {
  id: number
  policyAddress: string
  did: string
  trustData?: DidEnrichment
}

export interface CorporationMembership {
  corporation: UserCorporation
  operator: boolean
  member: boolean
  weight: string | null
  grantedMessageTypes: string[]
}

export interface CorporationDiscovery {
  memberships: CorporationMembership[]
  error: string | null
  partial: boolean
}

const { record, string, number, stringArray, optionalString } = indexerValidators('corporation')

async function fetchJson(url: string, context: string): Promise<unknown> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${context}: ${response.status}`)
  return response.json()
}

async function fetchCorporation(corporationId: number): Promise<UserCorporation> {
  if (!VERANA_REST_ENDPOINT_CORPORATION) throw new Error('Missing V4 corporation endpoint')
  const payload = await fetchJson(
    `${VERANA_REST_ENDPOINT_CORPORATION}/get/${corporationId}?trust_data=full`,
    'Unable to resolve corporation'
  )
  const corporation = record(record(payload, 'corporation response').corporation, 'corporation')
  const did = string(corporation.did, 'corporation.did')
  return {
    id: number(corporation.id, 'corporation.id'),
    policyAddress: string(corporation.policy_address, 'corporation.policy_address'),
    did,
    trustData: enrichmentFromTrustData(did, corporation.trust_data),
  }
}

function grantedMessageTypes(payload: unknown): Map<number, Set<string>> {
  const envelope = record(payload, 'authorizations response')
  if (!Array.isArray(envelope.authorizations)) {
    throw new Error('Invalid corporation response: missing authorizations envelope')
  }
  const byCorporation = new Map<number, Set<string>>()
  envelope.authorizations.forEach((entry, index) => {
    const authorization = record(entry, `authorizations[${index}]`)
    const corporationId = number(authorization.corporation_id, `authorizations[${index}].corporation_id`)
    const msgTypes = stringArray(authorization.msg_types, `authorizations[${index}].msg_types`)
    const granted = byCorporation.get(corporationId) ?? new Set<string>()
    for (const msgType of msgTypes) granted.add(msgType)
    byCorporation.set(corporationId, granted)
  })
  return byCorporation
}

async function fetchGrantedMessageTypes(address: string): Promise<KeysetWindow<Map<number, Set<string>>>> {
  if (!VERANA_REST_ENDPOINT_DELEGATION) throw new Error('Missing V4 delegation endpoint')
  return fetchKeysetPages(
    `${VERANA_REST_ENDPOINT_DELEGATION}/operator-authorizations?operator=${encodeURIComponent(address)}&only_active=true`,
    'authorizations',
    'Unable to resolve operator authorizations',
    grantedMessageTypes
  )
}

function membershipWeights(payload: unknown): Map<number, string | null> {
  const envelope = record(payload, 'memberships response')
  if (!Array.isArray(envelope.memberships)) {
    throw new Error('Invalid corporation response: missing memberships envelope')
  }
  const byCorporation = new Map<number, string | null>()
  envelope.memberships.forEach((entry, index) => {
    const membership = record(entry, `memberships[${index}]`)
    const corporationId = number(membership.corporation_id, `memberships[${index}].corporation_id`)
    byCorporation.set(corporationId, optionalString(membership.weight, `memberships[${index}].weight`) ?? null)
  })
  return byCorporation
}

async function fetchMembershipWeights(address: string): Promise<KeysetWindow<Map<number, string | null>>> {
  if (!VERANA_REST_ENDPOINT_GROUP) throw new Error('Missing V4 group endpoint')
  return fetchKeysetPages(
    `${VERANA_REST_ENDPOINT_GROUP}/corporations-by-member?account=${encodeURIComponent(address)}`,
    'memberships',
    'Unable to resolve corporation memberships',
    membershipWeights,
    { cursor: 'corporation_id' }
  )
}

function isRejected(result: PromiseSettledResult<unknown>): result is PromiseRejectedResult {
  return result.status === 'rejected'
}

function failureReason(results: PromiseSettledResult<unknown>[]): string | null {
  const reasons = results
    .filter(isRejected)
    .map((result) => (result.reason instanceof Error ? result.reason.message : String(result.reason)))
  const distinct = [...new Set(reasons)]
  return distinct.length > 0 ? distinct.join('; ') : null
}

export async function discoverCorporations(address: string): Promise<CorporationDiscovery> {
  const [grantsResult, weightsResult] = await Promise.allSettled([
    fetchGrantedMessageTypes(address),
    fetchMembershipWeights(address),
  ])
  const grants = grantsResult.status === 'fulfilled' ? grantsResult.value.value : new Map<number, Set<string>>()
  const weights = weightsResult.status === 'fulfilled' ? weightsResult.value.value : new Map<number, string | null>()
  const partial = [grantsResult, weightsResult].some((result) => result.status === 'fulfilled' && result.value.partial)
  const ids = [...new Set([...grants.keys(), ...weights.keys()])].sort((a, b) => a - b)
  const details = await Promise.allSettled(ids.map(fetchCorporation))
  const memberships = details.flatMap((result) =>
    result.status === 'fulfilled'
      ? [
          {
            corporation: result.value,
            operator: grants.has(result.value.id),
            member: weights.has(result.value.id),
            weight: weights.get(result.value.id) ?? null,
            grantedMessageTypes: [...(grants.get(result.value.id) ?? [])].sort(),
          },
        ]
      : []
  )
  return { memberships, error: failureReason([grantsResult, weightsResult, ...details]), partial }
}

export function discoveryIncomplete(discovery: CorporationDiscovery): boolean {
  return discovery.error !== null || discovery.partial
}

export async function findCorporationMembership(
  address: string,
  corporationId: number
): Promise<CorporationMembership | null> {
  const { memberships } = await discoverCorporations(address)
  return memberships.find((membership) => membership.corporation.id === corporationId) ?? null
}

const STORAGE_PREFIX = 'verana.acting-corporation:'

interface StoredActing {
  corporationId: number
  expiresAt: number
}

export function sessionLifetimeMs(lifetimeSeconds: string | undefined): number {
  const seconds = Number(lifetimeSeconds)
  return (Number.isFinite(seconds) && seconds > 0 ? seconds : 86400) * 1000
}

export function loadActingCorporationId(address: string): number | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + address)
    if (!raw) return null
    const stored: unknown = JSON.parse(raw)
    if (typeof stored !== 'object' || stored === null) return null
    const { corporationId, expiresAt } = stored as Partial<StoredActing>
    if (typeof corporationId !== 'number' || typeof expiresAt !== 'number') return null
    if (expiresAt <= Date.now()) {
      window.localStorage.removeItem(STORAGE_PREFIX + address)
      return null
    }
    return corporationId
  } catch {
    return null
  }
}

export function saveActingCorporationId(address: string, corporationId: number): void {
  const stored: StoredActing = { corporationId, expiresAt: Date.now() + sessionLifetimeMs(SESSION_LIFETIME_SECONDS) }
  try {
    window.localStorage.setItem(STORAGE_PREFIX + address, JSON.stringify(stored))
  } catch (reason) {
    logger.warn('acting corporation storage', reason)
  }
}

export function invalidatesActingSession(
  previousAddress: string,
  address: string | undefined,
  walletDisconnected: boolean
): boolean {
  if (previousAddress === address) return false
  return Boolean(address) || walletDisconnected
}

export function forgetActingCorporationId(address: string): void {
  try {
    window.localStorage.removeItem(STORAGE_PREFIX + address)
  } catch (reason) {
    logger.warn('acting corporation storage', reason)
  }
}

export function mergeKnownMemberships(
  known: CorporationMembership[],
  discovered: CorporationMembership[]
): CorporationMembership[] {
  const ids = new Set(discovered.map((membership) => membership.corporation.id))
  return [...discovered, ...known.filter((membership) => !ids.has(membership.corporation.id))].sort(
    (a, b) => a.corporation.id - b.corporation.id
  )
}

export function chooseActingMembership(
  memberships: CorporationMembership[],
  persistedId: number | null
): CorporationMembership | null {
  const persisted = memberships.find((membership) => membership.corporation.id === persistedId)
  if (persisted) return persisted
  return memberships.length === 1 ? memberships[0] : null
}

export function claimIntendedMembership(
  address: string,
  memberships: CorporationMembership[],
  intendedId: number | null
): CorporationMembership | null {
  const intended = memberships.find((membership) => membership.corporation.id === intendedId)
  if (!intended) return null
  saveActingCorporationId(address, intended.corporation.id)
  return intended
}

export interface ActingRestore {
  membership: CorporationMembership | null
  lost: boolean
}

export function restoreActingMembership(
  address: string,
  memberships: CorporationMembership[],
  partial = false
): ActingRestore {
  const persistedId = loadActingCorporationId(address)
  const persisted = memberships.find((membership) => membership.corporation.id === persistedId)
  if (persisted) return { membership: persisted, lost: false }
  if (partial) return { membership: null, lost: false }
  if (persistedId !== null) {
    forgetActingCorporationId(address)
    return { membership: null, lost: true }
  }
  const chosen = chooseActingMembership(memberships, null)
  if (chosen) saveActingCorporationId(address, chosen.corporation.id)
  return { membership: chosen, lost: false }
}
