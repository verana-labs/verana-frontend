import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockSafeFetch } = vi.hoisted(() => ({ mockSafeFetch: vi.fn() }))

vi.mock('@/lib/safe-fetch', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/safe-fetch')>()),
  safeFetch: mockSafeFetch,
}))

import { DOCUMENT_ROUTE_LIMIT } from '@/lib/document-route'
import { SafeFetchError } from '@/lib/safe-fetch-error'
import { GET } from './route'

const HELLO = 'sha384-WeF0h3dEjGnea4ANejO7+5/xtGPkQ1TDVTvNucZm+pASWjx5+QOXvfX2oT3oKGhP'

function request(url: string | null, ip = '203.0.113.1'): Request {
  const target = new URL('http://localhost/api/sri')
  if (url !== null) target.searchParams.set('url', url)
  return new Request(target, { headers: { 'x-forwarded-for': ip } })
}

describe('GET /api/sri', () => {
  beforeEach(() => {
    mockSafeFetch.mockReset()
    mockSafeFetch.mockResolvedValue({ bytes: new TextEncoder().encode('hello'), contentType: 'text/html' })
  })

  it('answers with the digest only, never the fetched content', async () => {
    const response = await GET(request('https://x.example/doc.md'))
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/json')
    await expect(response.json()).resolves.toEqual({ sri: HELLO })
  })

  it('refuses a missing or non-http(s) url before fetching', async () => {
    for (const url of [null, 'ftp://x.example/doc.md', 'data:text/plain,hello', 'file:///etc/passwd', 'not a url']) {
      const response = await GET(request(url))
      expect(response.status, String(url)).toBe(400)
    }
    expect(mockSafeFetch).not.toHaveBeenCalled()
  })

  it('maps a refused redirect to its status without content', async () => {
    mockSafeFetch.mockRejectedValue(new SafeFetchError('Redirect to a non-http(s) location', 502))
    const response = await GET(request('https://x.example/doc.md'))
    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({ error: 'Redirect to a non-http(s) location' })
  })

  it('rate limits per client', async () => {
    for (let call = 0; call < DOCUMENT_ROUTE_LIMIT; call++) {
      expect((await GET(request('https://x.example/doc.md', '198.51.100.9'))).status).toBe(200)
    }
    expect((await GET(request('https://x.example/doc.md', '198.51.100.9'))).status).toBe(429)
  })
})
