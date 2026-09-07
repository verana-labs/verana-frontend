import { beforeEach, describe, expect, it, vi } from 'vitest'

const { assertPublicTarget } = vi.hoisted(() => ({ assertPublicTarget: vi.fn(async (_url: URL) => {}) }))

vi.mock('@/lib/ssrf-guard', () => ({ assertPublicTarget }))

import {
  parseHttpUrl,
  SAFE_FETCH_MAX_BYTES,
  SAFE_FETCH_MAX_REDIRECTS,
  SafeFetchError,
  safeFetch,
} from '@/lib/safe-fetch'

type Handler = (url: string) => Response

function fetchFrom(handlers: Record<string, Handler>) {
  const calls: Array<{ url: string; init: RequestInit | undefined }> = []
  const impl = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input)
    calls.push({ url, init })
    const handler = handlers[url]
    if (!handler) throw new TypeError(`no handler for ${url}`)
    return handler(url)
  })
  return { impl: impl as unknown as typeof fetch, calls }
}

const redirect = (location: string) => () => new Response(null, { status: 302, headers: { location } })
const body =
  (text: string, type = 'text/plain') =>
  () =>
    new Response(text, { headers: { 'content-type': type } })

async function failure(promise: Promise<unknown>): Promise<SafeFetchError> {
  try {
    await promise
  } catch (error) {
    if (error instanceof SafeFetchError) return error
    throw error
  }
  throw new Error('expected a SafeFetchError')
}

describe('parseHttpUrl', () => {
  it('accepts only http and https', () => {
    expect(parseHttpUrl('https://x.example/doc.md')?.hostname).toBe('x.example')
    expect(parseHttpUrl('http://x.example/doc.md')?.protocol).toBe('http:')
    expect(parseHttpUrl('ftp://x.example/doc.md')).toBeNull()
    expect(parseHttpUrl('file:///etc/passwd')).toBeNull()
    expect(parseHttpUrl('javascript:alert(1)')).toBeNull()
    expect(parseHttpUrl('not a url')).toBeNull()
  })
})

describe('safeFetch', () => {
  beforeEach(() => {
    assertPublicTarget.mockReset()
    assertPublicTarget.mockResolvedValue(undefined)
  })

  it('checks the target before the first request and before every redirect hop', async () => {
    const { impl } = fetchFrom({
      'https://x.example/old': redirect('https://y.example/moved'),
      'https://y.example/moved': body('done'),
    })
    await safeFetch('https://x.example/old', impl)
    expect(assertPublicTarget.mock.calls.map(([target]) => String(target))).toEqual([
      'https://x.example/old',
      'https://y.example/moved',
    ])
  })

  it('refuses a target the guard rejects without fetching', async () => {
    assertPublicTarget.mockRejectedValueOnce(new SafeFetchError('Target host is not allowed', 400))
    const { impl, calls } = fetchFrom({ 'http://localhost/doc': body('secret') })
    const error = await failure(safeFetch('http://localhost/doc', impl))
    expect(error.status).toBe(400)
    expect(calls).toHaveLength(0)
  })

  it('refuses a redirect the guard rejects', async () => {
    assertPublicTarget.mockResolvedValueOnce(undefined)
    assertPublicTarget.mockRejectedValueOnce(new SafeFetchError('Target host resolves to a private address', 400))
    const { impl, calls } = fetchFrom({
      'https://x.example/old': redirect('http://169.254.169.254/latest'),
      'http://169.254.169.254/latest': body('secret'),
    })
    const error = await failure(safeFetch('https://x.example/old', impl))
    expect(error.status).toBe(400)
    expect(calls.map((call) => call.url)).toEqual(['https://x.example/old'])
  })

  it('rejects non-http(s) urls before fetching', async () => {
    const { impl, calls } = fetchFrom({})
    const error = await failure(safeFetch('file:///etc/passwd', impl))
    expect(error.status).toBe(400)
    expect(calls).toHaveLength(0)
  })

  it('fetches with manual redirects, a timeout signal and returns bytes with the content type', async () => {
    const { impl, calls } = fetchFrom({ 'https://x.example/doc.md': body('# hello', 'text/markdown; charset=utf-8') })
    const result = await safeFetch('https://x.example/doc.md', impl)
    expect(new TextDecoder().decode(result.bytes)).toBe('# hello')
    expect(result.contentType).toBe('text/markdown; charset=utf-8')
    expect(calls[0].init?.redirect).toBe('manual')
    expect(calls[0].init?.signal).toBeInstanceOf(AbortSignal)
  })

  it('follows http(s) redirects, relative ones included', async () => {
    const { impl, calls } = fetchFrom({
      'http://x.example/old': redirect('https://x.example/moved'),
      'https://x.example/moved': redirect('/final'),
      'https://x.example/final': body('done'),
    })
    const result = await safeFetch('http://x.example/old', impl)
    expect(new TextDecoder().decode(result.bytes)).toBe('done')
    expect(calls.map((call) => call.url)).toEqual([
      'http://x.example/old',
      'https://x.example/moved',
      'https://x.example/final',
    ])
  })

  it('refuses redirects to other schemes', async () => {
    for (const location of ['file:///etc/passwd', 'ftp://x.example/doc', 'javascript:alert(1)', 'data:text/html,hi']) {
      const { impl, calls } = fetchFrom({ 'https://x.example/doc': redirect(location) })
      const error = await failure(safeFetch('https://x.example/doc', impl))
      expect(error.message).toBe('Redirect to a non-http(s) location')
      expect(calls).toHaveLength(1)
    }
  })

  it('refuses a redirect without a location', async () => {
    const { impl } = fetchFrom({ 'https://x.example/doc': () => new Response(null, { status: 301 }) })
    const error = await failure(safeFetch('https://x.example/doc', impl))
    expect(error.status).toBe(502)
  })

  it('stops after the redirect budget', async () => {
    const handlers: Record<string, Handler> = {}
    for (let hop = 0; hop <= SAFE_FETCH_MAX_REDIRECTS + 1; hop++) {
      handlers[`https://x.example/${hop}`] = redirect(`https://x.example/${hop + 1}`)
    }
    const { impl, calls } = fetchFrom(handlers)
    const error = await failure(safeFetch('https://x.example/0', impl))
    expect(error.message).toBe('Too many redirects')
    expect(calls).toHaveLength(SAFE_FETCH_MAX_REDIRECTS + 1)
  })

  it('maps upstream failures to 502', async () => {
    const { impl } = fetchFrom({ 'https://x.example/missing': () => new Response('nope', { status: 404 }) })
    const error = await failure(safeFetch('https://x.example/missing', impl))
    expect(error.status).toBe(502)
    expect(error.message).toBe('Upstream responded 404')

    const network = await failure(safeFetch('https://x.example/down', fetchFrom({}).impl))
    expect(network.status).toBe(502)
  })

  it('rejects a declared size above the cap without reading the body', async () => {
    const { impl } = fetchFrom({
      'https://x.example/big': () =>
        new Response('x', { headers: { 'content-length': String(SAFE_FETCH_MAX_BYTES + 1) } }),
    })
    const error = await failure(safeFetch('https://x.example/big', impl))
    expect(error.status).toBe(413)
  })

  it('stops reading a stream that grows past the cap', async () => {
    const chunk = new Uint8Array(1024 * 1024)
    let served = 0
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        served += chunk.byteLength
        controller.enqueue(chunk)
      },
    })
    const { impl } = fetchFrom({ 'https://x.example/endless': () => new Response(stream) })
    const error = await failure(safeFetch('https://x.example/endless', impl))
    expect(error.status).toBe(413)
    expect(served).toBeLessThan(SAFE_FETCH_MAX_BYTES * 2)
  })
})
