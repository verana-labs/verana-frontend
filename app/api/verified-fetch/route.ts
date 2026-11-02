import { failure, json, requestedUrl, throttle } from '@/lib/document-route'
import { digestsMatch, parseSriDigest, sha384Sri } from '@/lib/document-verification'
import { fetchableDocumentUrl } from '@/lib/gf-document'
import { safeFetch } from '@/lib/safe-fetch'

export async function GET(request: Request) {
  const limited = throttle(request)
  if (limited) return limited
  const url = requestedUrl(request)
  if (!url) return json({ error: 'Missing or invalid url parameter' }, 400)
  const digest = new URL(request.url).searchParams.get('digest')
  if (!parseSriDigest(digest)) return json({ error: 'Missing or invalid digest parameter' }, 400)
  try {
    const { bytes, contentType } = await safeFetch(fetchableDocumentUrl(url))
    const actual = await sha384Sri(bytes)
    if (!digestsMatch(actual, digest)) return json({ error: 'digest mismatch' }, 409)
    return new Response(bytes, {
      status: 200,
      headers: {
        'Content-Type': contentType ?? 'application/octet-stream',
        'X-Verified-Digest': actual,
        'Content-Disposition': 'attachment',
        'Content-Security-Policy': "sandbox; default-src 'none'",
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    return failure(error)
  }
}
