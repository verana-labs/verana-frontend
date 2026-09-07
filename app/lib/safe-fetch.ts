export const SAFE_FETCH_MAX_BYTES = 10 * 1024 * 1024
export const SAFE_FETCH_TIMEOUT_MS = 15_000
export const SAFE_FETCH_MAX_REDIRECTS = 3

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308])

export class SafeFetchError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'SafeFetchError'
    this.status = status
  }
}

export interface SafeFetchResult {
  bytes: Uint8Array
  contentType: string | null
}

export function parseHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null
  } catch {
    return null
  }
}

function describe(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause)
}

function tooLarge(): SafeFetchError {
  return new SafeFetchError(`Document exceeds the ${SAFE_FETCH_MAX_BYTES / (1024 * 1024)} MB limit`, 413)
}

function nextHop(location: string | null, current: URL): URL | null {
  if (!location) return null
  try {
    return parseHttpUrl(new URL(location, current).toString())
  } catch {
    return null
  }
}

async function readCapped(response: Response, signal: AbortSignal): Promise<Uint8Array> {
  if (!response.body) return new Uint8Array(await response.arrayBuffer())
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > SAFE_FETCH_MAX_BYTES) {
        await reader.cancel()
        throw tooLarge()
      }
      chunks.push(value)
    }
  } catch (cause) {
    if (cause instanceof SafeFetchError) throw cause
    throw new SafeFetchError(
      signal.aborted ? 'Upstream fetch timed out' : `Upstream read failed: ${describe(cause)}`,
      signal.aborted ? 504 : 502
    )
  }
  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return bytes
}

export async function safeFetch(url: string, fetchImpl: typeof fetch = fetch): Promise<SafeFetchResult> {
  let target = parseHttpUrl(url)
  if (!target) throw new SafeFetchError('Only http and https URLs are allowed', 400)
  const signal = AbortSignal.timeout(SAFE_FETCH_TIMEOUT_MS)
  for (let hop = 0; ; hop++) {
    let response: Response
    try {
      response = await fetchImpl(target, { redirect: 'manual', signal })
    } catch (cause) {
      throw new SafeFetchError(
        signal.aborted ? 'Upstream fetch timed out' : `Upstream fetch failed: ${describe(cause)}`,
        signal.aborted ? 504 : 502
      )
    }
    if (REDIRECT_STATUSES.has(response.status)) {
      await response.body?.cancel()
      if (hop >= SAFE_FETCH_MAX_REDIRECTS) throw new SafeFetchError('Too many redirects', 502)
      const next = nextHop(response.headers.get('location'), target)
      if (!next) throw new SafeFetchError('Redirect to a non-http(s) location', 502)
      target = next
      continue
    }
    if (!response.ok) throw new SafeFetchError(`Upstream responded ${response.status}`, 502)
    const declared = Number(response.headers.get('content-length'))
    if (Number.isFinite(declared) && declared > SAFE_FETCH_MAX_BYTES) throw tooLarge()
    return { bytes: await readCapped(response, signal), contentType: response.headers.get('content-type') }
  }
}
