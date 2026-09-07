import { describe, expect, it } from 'vitest'
import { digestsMatch, parseSriDigest, sha384Sri, verifyDocument } from '@/lib/document-verification'

const HELLO = 'sha384-WeF0h3dEjGnea4ANejO7+5/xtGPkQ1TDVTvNucZm+pASWjx5+QOXvfX2oT3oKGhP'

describe('parseSriDigest', () => {
  it('accepts a sha384 digest and rejects everything else', () => {
    expect(parseSriDigest(HELLO)).toBe(HELLO.slice('sha384-'.length))
    expect(parseSriDigest('sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=')).toBeNull()
    expect(parseSriDigest('sha384-acme')).toBeNull()
    expect(parseSriDigest('')).toBeNull()
    expect(parseSriDigest(undefined)).toBeNull()
  })
})

describe('sha384Sri', () => {
  it('hashes bytes into the sri form', async () => {
    await expect(sha384Sri(new TextEncoder().encode('hello'))).resolves.toBe(HELLO)
  })
})

describe('digestsMatch', () => {
  it('compares parsed sha384 digests only', () => {
    expect(digestsMatch(HELLO, HELLO)).toBe(true)
    expect(digestsMatch(HELLO, `sha384-${'A'.repeat(64)}`)).toBe(false)
    expect(digestsMatch(HELLO, 'sha384-acme')).toBe(false)
    expect(digestsMatch(HELLO, undefined)).toBe(false)
  })
})

describe('verifyDocument', () => {
  const TEXT = 'hello'
  const encoded = () => new TextEncoder().encode(TEXT)
  const ok = (type = 'text/markdown') => new Response(encoded(), { headers: { 'content-type': type } })
  const calls: string[] = []

  function fetchWith(handler: (url: string) => Response | Promise<Response>): typeof fetch {
    calls.length = 0
    return (async (input: string | URL | Request) => {
      const url = input instanceof Request ? input.url : String(input)
      calls.push(url)
      return handler(url)
    }) as typeof fetch
  }

  it('is unverified without a usable on-chain digest and never fetches', async () => {
    const impl = fetchWith(() => ok())
    await expect(verifyDocument('https://x.example/doc.md', undefined, impl)).resolves.toMatchObject({
      state: 'unverified',
      digest: null,
    })
    await expect(verifyDocument('https://x.example/doc.md', 'sha384-acme', impl)).resolves.toMatchObject({
      state: 'unverified',
      digest: 'sha384-acme',
    })
    expect(calls).toHaveLength(0)
  })

  it('verifies client-side through the fetchable url when the bytes match', async () => {
    const impl = fetchWith(() => ok('text/markdown; charset=utf-8'))
    const result = await verifyDocument('https://github.com/o/r/blob/main/doc.md', HELLO, impl)
    expect(result.state).toBe('verified')
    if (result.state !== 'verified') return
    expect(new TextDecoder().decode(result.bytes)).toBe(TEXT)
    expect(result.mediaType).toBe('text/markdown; charset=utf-8')
    expect(calls).toEqual(['https://raw.githubusercontent.com/o/r/main/doc.md'])
  })

  it('reports a mismatch client-side without asking the server', async () => {
    const impl = fetchWith(() => ok())
    const other = `sha384-${'A'.repeat(64)}`
    await expect(verifyDocument('https://x.example/doc.md', other, impl)).resolves.toMatchObject({
      state: 'mismatch',
      digest: other,
      actual: HELLO,
    })
    expect(calls).toEqual(['https://x.example/doc.md'])
  })

  it('falls back to the verified fetch route when the client fetch fails', async () => {
    const impl = fetchWith((url) => {
      if (url.startsWith('/api/verified-fetch')) return ok('application/pdf')
      throw new TypeError('Failed to fetch')
    })
    const result = await verifyDocument('https://x.example/doc.pdf', HELLO, impl)
    expect(result.state).toBe('verified')
    if (result.state !== 'verified') return
    expect(result.mediaType).toBe('application/pdf')
    expect(calls[1]).toBe(
      `/api/verified-fetch?url=${encodeURIComponent('https://x.example/doc.pdf')}&digest=${encodeURIComponent(HELLO)}`
    )
  })

  it('maps the route answers to mismatch and unverified', async () => {
    const answer = (status: number, error: string) => Response.json({ error }, { status })
    const mismatch = fetchWith((url) =>
      url.startsWith('/api/verified-fetch') ? answer(409, 'digest mismatch') : new Response(null, { status: 404 })
    )
    await expect(verifyDocument('https://x.example/doc.md', HELLO, mismatch)).resolves.toMatchObject({
      state: 'mismatch',
      actual: null,
      reason: 'digest mismatch',
    })
    const down = fetchWith((url) =>
      url.startsWith('/api/verified-fetch')
        ? answer(502, 'Upstream responded 500')
        : new Response(null, { status: 404 })
    )
    await expect(verifyDocument('https://x.example/doc.md', HELLO, down)).resolves.toMatchObject({
      state: 'unverified',
      reason: 'Upstream responded 500',
    })
    const broken = fetchWith(() => {
      throw new TypeError('Failed to fetch')
    })
    await expect(verifyDocument('https://x.example/doc.md', HELLO, broken)).resolves.toMatchObject({
      state: 'unverified',
      reason: 'Failed to fetch',
    })
  })

  it('never trusts route bytes it cannot hash to the digest itself', async () => {
    const impl = fetchWith((url) =>
      url.startsWith('/api/verified-fetch') ? new Response('tampered') : new Response(null, { status: 404 })
    )
    await expect(verifyDocument('https://x.example/doc.md', HELLO, impl)).resolves.toMatchObject({
      state: 'unverified',
    })
  })
})
