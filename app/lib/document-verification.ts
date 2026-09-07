import { fetchableDocumentUrl } from '@/lib/gf-document'

const SRI_PATTERN = /^sha384-([A-Za-z0-9+/]{64})$/

export function parseSriDigest(value: string | null | undefined): string | null {
  if (!value) return null
  return SRI_PATTERN.exec(value)?.[1] ?? null
}

function base64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

export async function sha384Sri(bytes: Uint8Array | ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-384', bytes)
  return `sha384-${base64(new Uint8Array(hash))}`
}

export function digestsMatch(actual: string, expected: string | null | undefined): boolean {
  const left = parseSriDigest(actual)
  const right = parseSriDigest(expected)
  return left !== null && right !== null && left === right
}

export type DocumentVerification =
  | { state: 'verified'; bytes: Uint8Array; mediaType: string | null; digest: string }
  | { state: 'mismatch'; digest: string; actual: string | null; reason: string }
  | { state: 'unverified'; digest: string | null; reason: string }

export type DocumentVerificationState = DocumentVerification['state']

type FetchedBytes = { bytes: Uint8Array; mediaType: string | null }

export function verifiedFetchUrl(url: string, digest: string): string {
  return `/api/verified-fetch?url=${encodeURIComponent(url)}&digest=${encodeURIComponent(digest)}`
}

function describe(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause)
}

async function bytesOf(response: Response): Promise<FetchedBytes> {
  return { bytes: new Uint8Array(await response.arrayBuffer()), mediaType: response.headers.get('content-type') }
}

async function fetchDirect(url: string, fetchImpl: typeof fetch): Promise<FetchedBytes | null> {
  try {
    const response = await fetchImpl(fetchableDocumentUrl(url))
    return response.ok ? bytesOf(response) : null
  } catch {
    return null
  }
}

async function errorReason(response: Response): Promise<string> {
  try {
    const payload: unknown = await response.json()
    if (typeof payload === 'object' && payload !== null && typeof (payload as { error?: unknown }).error === 'string') {
      return (payload as { error: string }).error
    }
  } catch {}
  return `Verified fetch responded ${response.status}`
}

async function verified(fetched: FetchedBytes, digest: string): Promise<DocumentVerification> {
  const actual = await sha384Sri(fetched.bytes)
  if (digestsMatch(actual, digest))
    return { state: 'verified', bytes: fetched.bytes, mediaType: fetched.mediaType, digest }
  return { state: 'mismatch', digest, actual, reason: 'The fetched bytes do not match the on-chain digest' }
}

export async function verifyDocument(
  url: string,
  digest: string | undefined,
  fetchImpl: typeof fetch = fetch
): Promise<DocumentVerification> {
  const expected = digest && parseSriDigest(digest) ? digest : null
  if (!expected) {
    return {
      state: 'unverified',
      digest: digest ?? null,
      reason: digest ? 'The on-chain digest is not a sha384 SRI digest' : 'No on-chain digest is registered',
    }
  }
  try {
    const direct = await fetchDirect(url, fetchImpl)
    if (direct) return verified(direct, expected)
    const response = await fetchImpl(verifiedFetchUrl(url, expected))
    if (response.ok) {
      const result = await verified(await bytesOf(response), expected)
      if (result.state === 'verified') return result
      return { state: 'unverified', digest: expected, reason: 'The verified fetch response failed verification' }
    }
    const reason = await errorReason(response)
    if (response.status === 409) return { state: 'mismatch', digest: expected, actual: null, reason }
    return { state: 'unverified', digest: expected, reason }
  } catch (cause) {
    return { state: 'unverified', digest: expected, reason: describe(cause) }
  }
}
