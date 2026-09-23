import { clientKey, createRateLimiter } from '@/lib/rate-limit'
import { parseHttpUrl } from '@/lib/safe-fetch'
import { SafeFetchError } from '@/lib/safe-fetch-error'

export const DOCUMENT_ROUTE_LIMIT = 30
export const DOCUMENT_ROUTE_WINDOW_MS = 60_000

const limiter = createRateLimiter(DOCUMENT_ROUTE_LIMIT, DOCUMENT_ROUTE_WINDOW_MS)

export function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

export function throttle(request: Request): Response | null {
  if (limiter.allow(clientKey(request.headers))) return null
  return json({ error: 'Too many requests' }, 429)
}

export function requestedUrl(request: Request): string | null {
  const value = new URL(request.url).searchParams.get('url')
  return value && parseHttpUrl(value) ? value : null
}

export function failure(error: unknown): Response {
  const message = error instanceof Error ? error.message : String(error)
  return json({ error: message }, error instanceof SafeFetchError ? error.status : 502)
}
