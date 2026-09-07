import { VERANA_REST_ENDPOINT_PARTICIPANT, VERANA_REST_ENDPOINT_VERIFIABLE_TRUST } from '@/config/env'

export type DidTrustState = 'TRUSTED' | 'UNTRUSTED' | 'UNRESOLVED'

export interface DidEnrichment {
  did: string
  trustStatus: DidTrustState
  serviceName?: string
  serviceDescription?: string
  serviceLogoUrl?: string
  organizationName?: string
  organizationLogoUrl?: string
  countryCode?: string
  organizationAddress?: string
  organizationRegistryId?: string
  credentialIssuerDid?: string
  evaluatedAtBlock?: number
  expiresAt?: string
  serviceMinAge?: string
  serviceTermsUrl?: string
  servicePrivacyUrl?: string
}

interface ResolvedCredential {
  ecsSchema?: string | null
  issuerParticipantId?: number | null
  credentialSubject?: Record<string, unknown>
}

interface ResolveResult {
  did: string
  trusted?: boolean
  evaluatedAtBlock?: number
  expiresAtTime?: string | null
  ecsCredentials?: ResolvedCredential[]
}

const SUCCESS_TTL_MS = 60_000
const ERROR_TTL_MS = 5_000
const FETCH_TIMEOUT_MS = 10_000
const MAX_CACHE_ENTRIES = 200

const cache = new Map<string, { value: DidEnrichment; expires: number }>()
const inflight = new Map<string, Promise<DidEnrichment>>()

function unresolved(did: string): DidEnrichment {
  return { did, trustStatus: 'UNRESOLVED' }
}

function pickString(claims: Record<string, unknown> | undefined, key: string): string | undefined {
  if (!claims) return undefined
  const value = claims[key]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function pickStringOrNumber(claims: Record<string, unknown> | undefined, key: string): string | undefined {
  if (!claims) return undefined
  const value = claims[key]
  if (typeof value === 'string' && value.length > 0) return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return undefined
}

function evictOldestIfFull(): void {
  if (cache.size < MAX_CACHE_ENTRIES) return
  const oldestKey = cache.keys().next().value
  if (oldestKey !== undefined) cache.delete(oldestKey)
}

function rememberCacheEntry(did: string, value: DidEnrichment, ttlMs: number): void {
  evictOldestIfFull()
  cache.set(did, { value, expires: Date.now() + ttlMs })
}

function trustState(raw: ResolveResult, now: number): DidTrustState {
  if (raw.trusted !== true) return 'UNTRUSTED'
  if (raw.expiresAtTime && Date.parse(raw.expiresAtTime) <= now) return 'UNTRUSTED'
  return 'TRUSTED'
}

export function mapResolveResult(did: string, raw: ResolveResult, credentialIssuerDid?: string): DidEnrichment {
  const credentials = Array.isArray(raw.ecsCredentials) ? raw.ecsCredentials : []
  const service = credentials.find((c) => c.ecsSchema === 'ServiceCredential')?.credentialSubject
  const org = credentials.find((c) => c.ecsSchema === 'OrganizationCredential')?.credentialSubject

  return {
    did,
    trustStatus: trustState(raw, Date.now()),
    serviceName: pickString(service, 'name'),
    serviceDescription: pickString(service, 'description'),
    serviceLogoUrl: pickString(service, 'logoUri'),
    serviceMinAge: pickStringOrNumber(service, 'minimumAgeRequired'),
    serviceTermsUrl: pickString(service, 'termsAndConditionsUri'),
    servicePrivacyUrl: pickString(service, 'privacyPolicyUri'),
    organizationName: pickString(org, 'name'),
    organizationLogoUrl: pickString(org, 'logoUri'),
    countryCode: pickString(org, 'countryCode'),
    organizationAddress: pickString(org, 'address'),
    organizationRegistryId: pickString(org, 'registryId'),
    credentialIssuerDid,
    evaluatedAtBlock: raw.evaluatedAtBlock,
    expiresAt: raw.expiresAtTime ?? undefined,
  }
}

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

async function issuerDid(raw: ResolveResult): Promise<string | undefined> {
  const org = raw.ecsCredentials?.find((c) => c.ecsSchema === 'OrganizationCredential')
  const participantId = org?.issuerParticipantId
  if (typeof participantId !== 'number' || !VERANA_REST_ENDPOINT_PARTICIPANT) return undefined
  try {
    const response = await fetchWithTimeout(`${VERANA_REST_ENDPOINT_PARTICIPANT}/get/${participantId}`)
    if (!response.ok) return undefined
    const json = (await response.json()) as { participant?: { did?: unknown } }
    return typeof json.participant?.did === 'string' ? json.participant.did : undefined
  } catch {
    return undefined
  }
}

async function fetchFromIndexer(did: string): Promise<DidEnrichment> {
  if (!VERANA_REST_ENDPOINT_VERIFIABLE_TRUST) return unresolved(did)

  const response = await fetchWithTimeout(`${VERANA_REST_ENDPOINT_VERIFIABLE_TRUST}/resolve`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ did, ecsCredentials: true }),
  })
  if (response.status === 404) return unresolved(did)
  if (!response.ok) throw new Error(`Trust resolution responded ${response.status} for ${did}`)
  const raw = (await response.json()) as ResolveResult
  return mapResolveResult(did, raw, await issuerDid(raw))
}

export async function fetchDidEnrichment(did: string, options?: { force?: boolean }): Promise<DidEnrichment> {
  if (!did.startsWith('did:')) return unresolved(did)

  const now = Date.now()
  if (!options?.force) {
    const cached = cache.get(did)
    if (cached && cached.expires > now) return cached.value
  }

  const existing = inflight.get(did)
  if (existing) return existing

  const promise = fetchFromIndexer(did)
    .then((value) => {
      rememberCacheEntry(did, value, SUCCESS_TTL_MS)
      return value
    })
    .catch((error) => {
      rememberCacheEntry(did, unresolved(did), ERROR_TTL_MS)
      throw error
    })
    .finally(() => {
      inflight.delete(did)
    })

  inflight.set(did, promise)
  return promise
}

export function invalidateDid(did: string): void {
  cache.delete(did)
}

export const DEFAULT_SERVICE_AVATAR = '/default-service.svg'

export function serviceAvatarUrl(seed: string | undefined): string {
  if (!seed || seed.length === 0) return DEFAULT_SERVICE_AVATAR
  return `https://api.dicebear.com/7.x/shapes/svg?seed=service-${encodeURIComponent(seed)}`
}

export function serviceIdenticonUrl(seed: string | undefined): string {
  const safe = seed && seed.length > 0 ? seed : 'unknown'
  return `https://api.dicebear.com/7.x/identicon/svg?seed=service-${encodeURIComponent(safe)}`
}
