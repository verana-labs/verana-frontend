import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockSafeFetch } = vi.hoisted(() => ({ mockSafeFetch: vi.fn() }))

vi.mock('@/lib/safe-fetch', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/safe-fetch')>()),
  safeFetch: mockSafeFetch,
}))

import { DOCUMENT_ROUTE_LIMIT } from '@/lib/document-route'
import { SafeFetchError } from '@/lib/safe-fetch'
import { GET } from './route'

const HELLO = 'sha384-WeF0h3dEjGnea4ANejO7+5/xtGPkQ1TDVTvNucZm+pASWjx5+QOXvfX2oT3oKGhP'
const OTHER = `sha384-${'A'.repeat(64)}`

function request(params: Record<string, string>, ip = '203.0.113.1'): Request {
  const url = new URL('http://localhost/api/verified-fetch')
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  return new Request(url, { headers: { 'x-forwarded-for': ip } })
}

describe('GET /api/verified-fetch', () => {
  beforeEach(() => {
    mockSafeFetch.mockReset()
    mockSafeFetch.mockResolvedValue({ bytes: new TextEncoder().encode('hello'), contentType: 'text/markdown' })
  })

  it('returns the bytes with the upstream media type and the verified digest on a match', async () => {
    const response = await GET(request({ url: 'https://x.example/doc.md', digest: HELLO }))
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('text/markdown')
    expect(response.headers.get('x-verified-digest')).toBe(HELLO)
    expect(response.headers.get('content-security-policy')).toContain('sandbox')
    await expect(response.text()).resolves.toBe('hello')
  })

  it('fetches the raw file behind a github blob url, as the browser does', async () => {
    await GET(request({ url: 'https://github.com/verana-labs/gov/blob/main/egf.md', digest: HELLO }))
    expect(mockSafeFetch).toHaveBeenCalledWith('https://raw.githubusercontent.com/verana-labs/gov/main/egf.md')
  })

  it('returns 409 without the bytes on a mismatch', async () => {
    const response = await GET(request({ url: 'https://x.example/doc.md', digest: OTHER }))
    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({ error: 'digest mismatch' })
    expect(response.headers.get('x-verified-digest')).toBeNull()
  })

  it('rejects bad parameters before fetching', async () => {
    const invalid: Array<Record<string, string>> = [
      { digest: HELLO },
      { url: 'ftp://x.example/doc.md', digest: HELLO },
      { url: 'https://x.example/doc.md' },
      { url: 'https://x.example/doc.md', digest: 'sha384-acme' },
    ]
    for (const params of invalid) {
      const response = await GET(request(params))
      expect(response.status).toBe(400)
    }
    expect(mockSafeFetch).not.toHaveBeenCalled()
  })

  it('maps fetch failures to their status', async () => {
    mockSafeFetch.mockRejectedValue(new SafeFetchError('Upstream responded 404', 502))
    const response = await GET(request({ url: 'https://x.example/doc.md', digest: HELLO }))
    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({ error: 'Upstream responded 404' })
  })

  it('rate limits per client', async () => {
    for (let call = 0; call < DOCUMENT_ROUTE_LIMIT; call++) {
      const response = await GET(request({ url: 'https://x.example/doc.md', digest: HELLO }, '198.51.100.7'))
      expect(response.status).toBe(200)
    }
    const limited = await GET(request({ url: 'https://x.example/doc.md', digest: HELLO }, '198.51.100.7'))
    expect(limited.status).toBe(429)
    const other = await GET(request({ url: 'https://x.example/doc.md', digest: HELLO }, '198.51.100.8'))
    expect(other.status).toBe(200)
  })
})
