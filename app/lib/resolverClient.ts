import { env } from 'next-runtime-env';

export type DidTrustState = 'TRUSTED' | 'UNTRUSTED' | 'UNRESOLVED';

export interface DidEnrichment {
  did: string;
  trustStatus: DidTrustState;
  serviceName?: string;
  serviceDescription?: string;
  organizationName?: string;
  countryCode?: string;
  evaluatedAtBlock?: number;
  expiresAt?: string;
}

interface ResolverCredential {
  ecsType?: string | null;
  claims?: Record<string, unknown>;
}

interface ResolverFullResult {
  did: string;
  trustStatus: string;
  evaluatedAtBlock?: number;
  expiresAt?: string;
  credentials?: ResolverCredential[];
}

// Successful evaluations are cached long enough to dedupe a tree of 30-50
// leaves. Failed lookups (transient resolver outage, parse errors) get a much
// shorter TTL so a brief hiccup doesn't pin every badge on UNRESOLVED.
// MAX_CACHE_ENTRIES caps memory growth across long SPA sessions; the eviction
// strategy is insertion-order (Map iterator returns keys in insertion order).
const SUCCESS_TTL_MS = 60_000;
const ERROR_TTL_MS = 5_000;
const FETCH_TIMEOUT_MS = 10_000;
const MAX_CACHE_ENTRIES = 200;

const cache = new Map<string, { value: DidEnrichment; expires: number }>();
const inflight = new Map<string, Promise<DidEnrichment>>();

function resolverBaseUrl(): string | undefined {
  const fromRuntime = env('NEXT_PUBLIC_VERANA_REST_ENDPOINT_RESOLVER');
  return fromRuntime || process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_RESOLVER;
}

function unresolved(did: string): DidEnrichment {
  return { did, trustStatus: 'UNRESOLVED' };
}

function pickString(claims: Record<string, unknown> | undefined, key: string): string | undefined {
  if (!claims) return undefined;
  const value = claims[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function evictOldestIfFull(): void {
  if (cache.size < MAX_CACHE_ENTRIES) return;
  const oldestKey = cache.keys().next().value;
  if (oldestKey !== undefined) cache.delete(oldestKey);
}

function rememberCacheEntry(did: string, value: DidEnrichment, ttlMs: number): void {
  evictOldestIfFull();
  cache.set(did, { value, expires: Date.now() + ttlMs });
}

function mapResponse(did: string, raw: ResolverFullResult): DidEnrichment {
  const credentials = Array.isArray(raw.credentials) ? raw.credentials : [];
  const service = credentials.find((c) => c.ecsType === 'ECS-SERVICE');
  const org = credentials.find((c) => c.ecsType === 'ECS-ORG');

  const serviceName = pickString(service?.claims, 'name');
  const serviceDescription = pickString(service?.claims, 'description');
  const organizationName = pickString(org?.claims, 'name');
  const countryCode = pickString(org?.claims, 'countryCode');

  // A resolver UNTRUSTED with no credentials at all means the DID Doc could
  // not be dereferenced — we have no evidence to back a negative verdict, so
  // surface that as UNRESOLVED. Any credential count above zero counts as
  // resolver evidence, regardless of which display fields populated.
  const hasResolverEvidence = credentials.length > 0;
  let trustStatus: DidTrustState;
  if (raw.trustStatus === 'TRUSTED') {
    trustStatus = 'TRUSTED';
  } else if (raw.trustStatus === 'UNTRUSTED' && hasResolverEvidence) {
    trustStatus = 'UNTRUSTED';
  } else {
    trustStatus = 'UNRESOLVED';
  }

  return {
    did,
    trustStatus,
    serviceName,
    serviceDescription,
    organizationName,
    countryCode,
    evaluatedAtBlock: raw.evaluatedAtBlock,
    expiresAt: raw.expiresAt,
  };
}

async function fetchFromResolver(did: string): Promise<DidEnrichment> {
  const baseUrl = resolverBaseUrl();
  if (!baseUrl) return unresolved(did);

  const url = `${baseUrl.replace(/\/$/, '')}/trust/resolve?did=${encodeURIComponent(did)}&detail=full`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (response.status === 404) return unresolved(did);
    if (!response.ok) {
      throw new Error(`Resolver responded ${response.status} for ${did}`);
    }
    const json = (await response.json()) as ResolverFullResult;
    return mapResponse(did, json);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchDidEnrichment(
  did: string,
  options?: { force?: boolean },
): Promise<DidEnrichment> {
  if (!did.startsWith('did:')) return unresolved(did);

  const now = Date.now();
  if (!options?.force) {
    const cached = cache.get(did);
    if (cached && cached.expires > now) return cached.value;
  }

  const existing = inflight.get(did);
  if (existing) return existing;

  const promise = fetchFromResolver(did)
    .then((value) => {
      rememberCacheEntry(did, value, SUCCESS_TTL_MS);
      return value;
    })
    .catch((error) => {
      // Cache a fallback briefly so a flapping resolver does not spam retries,
      // but re-throw so the calling hook can surface the failure to the UI.
      rememberCacheEntry(did, unresolved(did), ERROR_TTL_MS);
      throw error;
    })
    .finally(() => {
      inflight.delete(did);
    });

  inflight.set(did, promise);
  return promise;
}

export function invalidateDid(did: string): void {
  cache.delete(did);
}

// Deterministic avatar generator. The v4 spec itself uses dicebear shapes
// keyed by service identifier — keep this stable so the same DID always
// renders the same icon across pages and reloads.
export function serviceAvatarUrl(seed: string | undefined): string {
  const safe = seed && seed.length > 0 ? seed : 'unknown';
  return `https://api.dicebear.com/7.x/shapes/svg?seed=service-${encodeURIComponent(safe)}`;
}
