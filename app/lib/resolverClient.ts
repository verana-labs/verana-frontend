import { VERANA_REST_ENDPOINT_PARTICIPANT, VERANA_REST_ENDPOINT_VERIFIABLE_TRUST } from '@/config/env'

export type DidTrustState = 'TRUSTED' | 'UNTRUSTED' | 'UNRESOLVED'

export interface DidEnrichment {
  did: string
  trustStatus: DidTrustState
  serviceName?: string
  serviceDescription?: string
  serviceDescriptionFormat?: string
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
  id?: string
  ecsSchema?: string | null
  credentialSchemaId?: number | null
  ecosystemId?: number | null
  issuerParticipantId?: number | null
  credentialSubject?: Record<string, unknown>
}

interface ResolveResult {
  did: string
  trusted?: boolean
  evaluatedAtBlock?: number
  expiresAtTime?: string | null
  ecsCredentials?: ResolvedCredential[]
  participations?: unknown[]
  services?: unknown[]
  presentations?: unknown[]
}

export type ParticipationState = 'ACTIVE' | 'FUTURE' | 'INACTIVE' | 'EXPIRED' | 'REVOKED' | 'SLASHED' | 'REPAID'

export const ALL_PARTICIPATION_STATES: readonly ParticipationState[] = [
  'ACTIVE',
  'FUTURE',
  'INACTIVE',
  'EXPIRED',
  'REVOKED',
  'SLASHED',
  'REPAID',
]

export interface ResolvedParticipation {
  id: number
  vsOperator: string | null
  role: string
  state: string
  credentialSchemaId: number | null
  ecosystemId: number | null
  validatorParticipantId: number | null
}

interface ResolvedService {
  id: string
  type: string
  serviceEndpoint: string
}

export interface PresentedCredential {
  id: string
  ecsSchema: string | null
  credentialSchemaId: number | null
  ecosystemId: number | null
  presentationUrl: string | null
}

export interface AgentResolution {
  enrichment: DidEnrichment
  participations: ResolvedParticipation[]
  services: ResolvedService[]
  credentials: PresentedCredential[]
}

const SUCCESS_TTL_MS = 60_000
const ERROR_TTL_MS = 5_000
const FETCH_TIMEOUT_MS = 10_000
const MAX_CACHE_ENTRIES = 200

type CacheEntry<T> = { expires: number } & ({ ok: true; value: T } | { ok: false; error: unknown })

const cache = new Map<string, CacheEntry<DidEnrichment>>()
const inflight = new Map<string, Promise<DidEnrichment>>()
const agentCache = new Map<string, CacheEntry<AgentResolution>>()
const agentInflight = new Map<string, Promise<AgentResolution>>()

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

export function isMarkdownDescriptionFormat(format: string | undefined): boolean {
  return format === 'text/markdown'
}

function evictOldestIfFull(entries: Map<string, unknown>): void {
  if (entries.size < MAX_CACHE_ENTRIES) return
  const oldestKey = entries.keys().next().value
  if (oldestKey !== undefined) entries.delete(oldestKey)
}

function rememberCacheEntry(did: string, value: DidEnrichment): void {
  evictOldestIfFull(cache)
  cache.set(did, { ok: true, value, expires: Date.now() + SUCCESS_TTL_MS })
}

function rememberCacheFailure(did: string, error: unknown): void {
  evictOldestIfFull(cache)
  cache.set(did, { ok: false, error, expires: Date.now() + ERROR_TTL_MS })
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
  const persona = credentials.find((c) => c.ecsSchema === 'PersonaCredential')?.credentialSubject

  return {
    did,
    trustStatus: trustState(raw, Date.now()),
    serviceName: pickString(service, 'name'),
    serviceDescription: pickString(service, 'description'),
    serviceDescriptionFormat: pickString(service, 'descriptionFormat'),
    serviceLogoUrl: pickString(service, 'logoUri'),
    serviceMinAge: pickStringOrNumber(service, 'minimumAgeRequired'),
    serviceTermsUrl: pickString(service, 'termsAndConditionsUri'),
    servicePrivacyUrl: pickString(service, 'privacyPolicyUri'),
    organizationName: pickString(org, 'name') ?? pickString(persona, 'name'),
    organizationLogoUrl: pickString(org, 'logoUri') ?? pickString(persona, 'avatarUri'),
    countryCode: pickString(org, 'countryCode') ?? pickString(persona, 'controllerCountryCode'),
    organizationAddress: pickString(org, 'address'),
    organizationRegistryId: pickString(org, 'registryId'),
    credentialIssuerDid,
    evaluatedAtBlock: raw.evaluatedAtBlock,
    expiresAt: raw.expiresAtTime ?? undefined,
  }
}

export function enrichmentFromTrustData(did: string, value: unknown): DidEnrichment | undefined {
  if (value === undefined) return undefined
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return unresolved(did)
  return mapResolveResult(did, value as ResolveResult)
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
  const controller =
    raw.ecsCredentials?.find((c) => c.ecsSchema === 'OrganizationCredential') ??
    raw.ecsCredentials?.find((c) => c.ecsSchema === 'PersonaCredential')
  const participantId = controller?.issuerParticipantId
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
    if (cached && cached.expires > now) {
      if (!cached.ok) throw cached.error
      return cached.value
    }
  }

  const existing = inflight.get(did)
  if (existing) return existing

  const promise = fetchFromIndexer(did)
    .then((value) => {
      rememberCacheEntry(did, value)
      return value
    })
    .catch((error) => {
      rememberCacheFailure(did, error)
      throw error
    })
    .finally(() => {
      inflight.delete(did)
    })

  inflight.set(did, promise)
  return promise
}

function optionalInteger(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) ? value : null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

export function mapAgentResolution(did: string, raw: ResolveResult): AgentResolution {
  const participations: ResolvedParticipation[] = []
  for (const entry of raw.participations ?? []) {
    const row = asRecord(entry)
    const id = optionalInteger(row?.id)
    if (!row || id === null) continue
    participations.push({
      id,
      vsOperator: typeof row.vsOperator === 'string' ? row.vsOperator : null,
      role: typeof row.role === 'string' ? row.role : '',
      state: typeof row.state === 'string' ? row.state : '',
      credentialSchemaId: optionalInteger(row.credentialSchemaId),
      ecosystemId: optionalInteger(row.ecosystemId),
      validatorParticipantId: optionalInteger(row.validatorParticipantId),
    })
  }

  const services: ResolvedService[] = []
  for (const entry of raw.services ?? []) {
    const row = asRecord(entry)
    if (!row || typeof row.type !== 'string') continue
    const endpoint = row.serviceEndpoint
    services.push({
      id: typeof row.id === 'string' ? row.id : '',
      type: row.type,
      serviceEndpoint: typeof endpoint === 'string' ? endpoint : JSON.stringify(endpoint ?? null),
    })
  }

  const credentials: PresentedCredential[] = (raw.ecsCredentials ?? []).map((credential, index) => ({
    id: typeof credential.id === 'string' ? credential.id : `ecs:${credential.ecsSchema ?? index}`,
    ecsSchema: credential.ecsSchema ?? null,
    credentialSchemaId: optionalInteger(credential.credentialSchemaId),
    ecosystemId: optionalInteger(credential.ecosystemId),
    presentationUrl: null,
  }))
  for (const entry of raw.presentations ?? []) {
    const presentation = asRecord(entry)
    if (!presentation) continue
    const presentationUrl = typeof presentation.id === 'string' ? presentation.id : null
    for (const item of Array.isArray(presentation.vtcCredentials) ? presentation.vtcCredentials : []) {
      const vtc = asRecord(item)
      if (!vtc || typeof vtc.id !== 'string') continue
      credentials.push({
        id: vtc.id,
        ecsSchema: null,
        credentialSchemaId: optionalInteger(vtc.credentialSchemaId),
        ecosystemId: optionalInteger(vtc.ecosystemId),
        presentationUrl,
      })
    }
  }

  return { enrichment: mapResolveResult(did, raw), participations, services, credentials }
}

function unresolvedAgent(did: string): AgentResolution {
  return { enrichment: unresolved(did), participations: [], services: [], credentials: [] }
}

function rememberAgentEntry(key: string, value: AgentResolution): void {
  evictOldestIfFull(agentCache)
  agentCache.set(key, { ok: true, value, expires: Date.now() + SUCCESS_TTL_MS })
}

function rememberAgentFailure(key: string, error: unknown): void {
  evictOldestIfFull(agentCache)
  agentCache.set(key, { ok: false, error, expires: Date.now() + ERROR_TTL_MS })
}

// Per [VFE-PAGE-AGENTS-2] one resolve per agent DID returns the identity, the participations, the services and the presentations.
async function fetchAgentFromIndexer(did: string, states: readonly ParticipationState[]): Promise<AgentResolution> {
  if (!VERANA_REST_ENDPOINT_VERIFIABLE_TRUST) return unresolvedAgent(did)
  const response = await fetchWithTimeout(`${VERANA_REST_ENDPOINT_VERIFIABLE_TRUST}/resolve`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ did, ecsCredentials: true, participations: { states }, services: true, presentations: {} }),
  })
  if (response.status === 404) return unresolvedAgent(did)
  if (!response.ok) throw new Error(`Trust resolution responded ${response.status} for ${did}`)
  return mapAgentResolution(did, (await response.json()) as ResolveResult)
}

export async function fetchAgentResolution(
  did: string,
  states: readonly ParticipationState[]
): Promise<AgentResolution> {
  if (!did.startsWith('did:')) return unresolvedAgent(did)
  const key = `${did}|${states.join(',')}`
  const cached = agentCache.get(key)
  if (cached && cached.expires > Date.now()) {
    if (!cached.ok) throw cached.error
    return cached.value
  }

  const existing = agentInflight.get(key)
  if (existing) return existing

  const promise = fetchAgentFromIndexer(did, states)
    .then((value) => {
      rememberAgentEntry(key, value)
      return value
    })
    .catch((error) => {
      rememberAgentFailure(key, error)
      throw error
    })
    .finally(() => {
      agentInflight.delete(key)
    })

  agentInflight.set(key, promise)
  return promise
}

export function invalidateDid(did: string): void {
  cache.delete(did)
  for (const key of agentCache.keys()) {
    if (key.startsWith(`${did}|`)) agentCache.delete(key)
  }
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
