import {
  SESSION_LIFETIME_SECONDS,
  VERANA_OPERATOR_ONLY,
  VERANA_REST_ENDPOINT_CORPORATION,
  VERANA_REST_ENDPOINT_DELEGATION,
  VERANA_REST_ENDPOINT_GROUP,
} from '@/config/env'
import { indexerValidators } from '@/lib/indexer-json'

export interface UserCorporation {
  id: number
  policyAddress: string
  did: string
}

export interface CorporationMembership {
  corporation: UserCorporation
  operator: boolean
  member: boolean
  weight: string | null
  grantedMessageTypes: string[]
}

export interface UserCorporationResolution {
  corporation: UserCorporation | null
  hasOperatorGrant: boolean
  grantedMessageTypes: string[]
}

const { record, string, number, stringArray, optionalString } = indexerValidators('corporation')

async function fetchJson(url: string, context: string): Promise<unknown> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${context}: ${response.status}`)
  return response.json()
}

function parseCorporation(value: unknown, path: string): UserCorporation {
  const corporation = record(value, path)
  return {
    id: number(corporation.id, `${path}.id`),
    policyAddress: string(corporation.policy_address, `${path}.policy_address`),
    did: string(corporation.did, `${path}.did`),
  }
}

async function fetchCorporation(corporationId: number): Promise<UserCorporation> {
  const payload = await fetchJson(
    `${VERANA_REST_ENDPOINT_CORPORATION}/get/${corporationId}`,
    'Unable to resolve corporation'
  )
  const envelope = record(payload, 'corporation response')
  if (!('corporation' in envelope)) throw new Error('Invalid corporation response: missing corporation envelope')
  return parseCorporation(envelope.corporation, 'corporation')
}

async function fetchGrantedMessageTypes(address: string): Promise<Map<number, Set<string>>> {
  const payload = await fetchJson(
    `${VERANA_REST_ENDPOINT_DELEGATION}/operator-authorizations?operator=${encodeURIComponent(address)}&only_active=true&limit=1024`,
    'Unable to resolve operator authorizations'
  )
  const envelope = record(payload, 'authorizations response')
  if (!Array.isArray(envelope.authorizations)) {
    throw new Error('Invalid corporation response: missing authorizations envelope')
  }
  const byCorporation = new Map<number, Set<string>>()
  envelope.authorizations.forEach((entry, index) => {
    const authorization = record(entry, `authorizations[${index}]`)
    const corporationId = number(authorization.corporation_id, `authorizations[${index}].corporation_id`)
    const msgTypes = stringArray(authorization.msg_types, `authorizations[${index}].msg_types`)
    const existing = byCorporation.get(corporationId) ?? new Set<string>()
    for (const msgType of msgTypes) existing.add(msgType)
    byCorporation.set(corporationId, existing)
  })
  return byCorporation
}

async function fetchMembershipWeights(address: string): Promise<Map<number, string | null>> {
  const payload = await fetchJson(
    `${VERANA_REST_ENDPOINT_GROUP}/corporations-by-member?account=${encodeURIComponent(address)}`,
    'Unable to resolve corporation memberships'
  )
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

export function operatorOnlyMode(): boolean {
  return VERANA_OPERATOR_ONLY === 'true'
}

export async function discoverCorporations(address: string): Promise<CorporationMembership[]> {
  if (!VERANA_REST_ENDPOINT_DELEGATION || !VERANA_REST_ENDPOINT_CORPORATION || !VERANA_REST_ENDPOINT_GROUP) {
    throw new Error('Missing V4 corporation, delegation or group endpoint')
  }
  const [grants, weights] = await Promise.all([
    fetchGrantedMessageTypes(address),
    operatorOnlyMode() ? Promise.resolve(new Map<number, string | null>()) : fetchMembershipWeights(address),
  ])
  const ids = [...new Set([...grants.keys(), ...weights.keys()])].sort((a, b) => a - b)
  const corporations = await Promise.all(ids.map(fetchCorporation))
  return corporations.map((corporation) => ({
    corporation,
    operator: grants.has(corporation.id),
    member: weights.has(corporation.id),
    weight: weights.get(corporation.id) ?? null,
    grantedMessageTypes: [...(grants.get(corporation.id) ?? [])].sort(),
  }))
}

const ACTING_STORAGE_KEY = 'verana.acting-corporation'

interface StoredActing {
  address: string
  corporationId: number
  expiresAt: number
}

function sessionLifetimeMs(): number {
  const seconds = Number(SESSION_LIFETIME_SECONDS)
  return (Number.isFinite(seconds) && seconds > 0 ? seconds : 86400) * 1000
}

export function loadActingCorporationId(address: string): number | null {
  try {
    const raw = window.localStorage.getItem(ACTING_STORAGE_KEY)
    if (!raw) return null
    const stored = JSON.parse(raw) as StoredActing
    if (stored.address !== address || stored.expiresAt <= Date.now()) return null
    return Number.isInteger(stored.corporationId) ? stored.corporationId : null
  } catch {
    return null
  }
}

export function saveActingCorporationId(address: string, corporationId: number): void {
  try {
    const stored: StoredActing = { address, corporationId, expiresAt: Date.now() + sessionLifetimeMs() }
    window.localStorage.setItem(ACTING_STORAGE_KEY, JSON.stringify(stored))
  } catch {}
}

export function clearActingCorporation(): void {
  try {
    window.localStorage.removeItem(ACTING_STORAGE_KEY)
  } catch {}
}

export function chooseActingMembership(
  memberships: CorporationMembership[],
  persistedId: number | null
): CorporationMembership | null {
  if (persistedId !== null) {
    const persisted = memberships.find((membership) => membership.corporation.id === persistedId)
    if (persisted) return persisted
  }
  if (memberships.length === 1) return memberships[0]
  return null
}

export function toResolution(membership: CorporationMembership | null): UserCorporationResolution {
  if (!membership) return { corporation: null, hasOperatorGrant: false, grantedMessageTypes: [] }
  return {
    corporation: membership.corporation,
    hasOperatorGrant: membership.grantedMessageTypes.length > 0,
    grantedMessageTypes: membership.grantedMessageTypes,
  }
}

export async function resolveUserCorporation(address: string): Promise<UserCorporationResolution> {
  const memberships = await discoverCorporations(address)
  const persistedId = typeof window === 'undefined' ? null : loadActingCorporationId(address)
  const chosen =
    chooseActingMembership(memberships, persistedId) ??
    memberships.find((membership) => membership.operator) ??
    memberships[0] ??
    null
  return toResolution(chosen)
}
