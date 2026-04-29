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
  serviceMinAge?: string;
  serviceTermsUrl?: string;
  servicePrivacyUrl?: string;
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
  failedCredentials?: unknown[];
  dereferenceErrors?: unknown[];
}

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

function pickStringOrNumber(claims: Record<string, unknown> | undefined, key: string): string | undefined {
  if (!claims) return undefined;
  const value = claims[key];
  if (typeof value === 'string' && value.length > 0) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
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
  const serviceMinAge = pickStringOrNumber(service?.claims, 'minimumAgeRequired');
  const serviceTermsUrl = pickString(service?.claims, 'termsAndConditions');
  const servicePrivacyUrl = pickString(service?.claims, 'privacyPolicy');

  const organizationName = pickString(org?.claims, 'name');
  const countryCode = pickString(org?.claims, 'countryCode');

  const hasResolverEvidence =
    credentials.length > 0 ||
    (Array.isArray(raw.failedCredentials) && raw.failedCredentials.length > 0) ||
    (Array.isArray(raw.dereferenceErrors) && raw.dereferenceErrors.length > 0);

  let trustStatus: DidTrustState;
  if (raw.trustStatus === 'TRUSTED') {
    trustStatus = 'TRUSTED';
  } else if (raw.trustStatus === 'UNTRUSTED') {
    trustStatus = hasResolverEvidence ? 'UNTRUSTED' : 'UNRESOLVED';
  } else {
    trustStatus = 'UNRESOLVED';
  }

  return {
    did,
    trustStatus,
    serviceName,
    serviceDescription,
    serviceMinAge,
    serviceTermsUrl,
    servicePrivacyUrl,
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

export function serviceAvatarUrl(seed: string | undefined): string {
  const safe = seed && seed.length > 0 ? seed : 'unknown';
  return `https://api.dicebear.com/7.x/shapes/svg?seed=service-${encodeURIComponent(safe)}`;
}

export function serviceIdenticonUrl(seed: string | undefined): string {
  const safe = seed && seed.length > 0 ? seed : 'unknown';
  return `https://api.dicebear.com/7.x/identicon/svg?seed=service-${encodeURIComponent(safe)}`;
}
