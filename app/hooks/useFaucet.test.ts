import { StdSignature } from '@cosmjs/amino'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const chain = vi.hoisted(() => ({
  value: {} as Record<string, unknown>,
}))

vi.mock('@/config/env', () => ({ VERANA_FAUCET_URL: 'https://faucet.test' }))
vi.mock('@cosmos-kit/react', () => ({ useChain: () => chain.value }))
vi.mock('@/hooks/useVeranaChain', () => ({ useVeranaChain: () => ({ chain_name: 'VeranaDevnet1' }) }))

import {
  FaucetError,
  fetchFaucetInfo,
  isAmountWithinLimit,
  requestFaucetFunds,
  resetFaucetToken,
  useFaucet,
} from '@/hooks/useFaucet'

const ACCOUNT = 'verana1account'
const OTHER_ACCOUNT = 'verana1other'
const PREFIX = 'Verana faucet challenge: '
const NOW = new Date('2026-01-01T00:00:00.000Z')

const SIGNATURE: StdSignature = {
  pub_key: { type: 'tendermint/PubKeySecp256k1', value: 'AhPubKeyBase64==' },
  signature: 'c2lnbmF0dXJlLWJhc2U2NA==',
}

interface Call {
  method: string
  path: string
  headers: Record<string, string>
  body: unknown
}

type Handler = (call: Call) => Response

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status })
}

function serviceError(
  status: number,
  code: string,
  details: Record<string, unknown> = {},
  message = `${code} message`
) {
  return json({ error: { code, message, details } }, status)
}

function infoBody(overrides: Record<string, unknown> = {}) {
  return {
    chainId: 'vna-testnet-1',
    denom: 'uvna',
    defaultAmount: '1000000',
    maxAmountPerHour: '5000000',
    maxAmountPerDay: '20000000',
    available: true,
    unavailableReason: null,
    auth: { challengePrefix: PREFIX, nonceTtlSeconds: 120, tokenTtlSeconds: 3600 },
    ...overrides,
  }
}

function tokenBody(token = 'token-1', account = ACCOUNT, ttlMs = 3_600_000) {
  return { token, expiresAt: new Date(Date.now() + ttlMs).toISOString(), account }
}

function confirmedBody() {
  return {
    status: 'confirmed',
    txHash: 'ABC123',
    height: 42,
    recipient: ACCOUNT,
    amount: '1000000',
    denom: 'uvna',
    quota: { window: 'hour', resetsAt: '2026-01-01T01:00:00.000Z' },
  }
}

function pendingBody() {
  return { status: 'pending', txHash: 'DEF456', recipient: ACCOUNT, amount: '1000000', denom: 'uvna' }
}

// Mock server: one handler per "METHOD /path". A handler array is consumed in order, then the last one repeats.
function faucetServer(routes: Record<string, Handler | Handler[]>) {
  const calls: Call[] = []
  const queues = new Map(
    Object.entries(routes).map(([key, value]) => [key, Array.isArray(value) ? [...value] : [value]])
  )
  const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input))
    const headers = Object.fromEntries(
      Object.entries((init?.headers ?? {}) as Record<string, string>).map(([k, v]) => [k.toLowerCase(), v])
    )
    const call: Call = {
      method: init?.method ?? 'GET',
      path: url.pathname,
      headers,
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
    }
    calls.push(call)
    const queue = queues.get(`${call.method} ${call.path}`)
    if (!queue || queue.length === 0) return new Response('not found', { status: 404 })
    const handler = queue.length > 1 ? (queue.shift() as Handler) : queue[0]
    return handler(call)
  })
  vi.stubGlobal('fetch', fetchMock)
  return { calls, fetchMock, paths: () => calls.map((c) => `${c.method} ${c.path}`) }
}

function exchangeRoutes(extra: Record<string, Handler | Handler[]> = {}) {
  let issued = 0
  return {
    'POST /v1/auth/challenge': () =>
      json({ nonce: `nonce-${++issued}`, expiresAt: new Date(Date.now() + 120_000).toISOString() }),
    'POST /v1/auth/token': () => json(tokenBody(`token-${issued}`)),
    'POST /v1/faucet': () => json(confirmedBody()),
    ...extra,
  }
}

function signer(): ReturnType<typeof vi.fn<(signer: string, data: string | Uint8Array) => Promise<StdSignature>>> {
  return vi.fn(async () => SIGNATURE)
}

async function expectFaucetError(promise: Promise<unknown>): Promise<FaucetError> {
  try {
    await promise
  } catch (error) {
    expect(error).toBeInstanceOf(FaucetError)
    return error as FaucetError
  }
  throw new Error('expected the promise to reject')
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
  resetFaucetToken()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('fetchFaucetInfo', () => {
  it('reads GET /v1/info and keeps the challenge prefix from the response', async () => {
    const server = faucetServer({ 'GET /v1/info': () => json(infoBody()) })
    const info = await fetchFaucetInfo()
    expect(server.paths()).toEqual(['GET /v1/info'])
    expect(server.calls[0].headers).toEqual({})
    expect(info).toEqual({
      chainId: 'vna-testnet-1',
      denom: 'uvna',
      defaultAmount: '1000000',
      maxAmountPerHour: '5000000',
      maxAmountPerDay: '20000000',
      available: true,
      unavailableReason: undefined,
      auth: { challengePrefix: PREFIX, nonceTtlSeconds: 120, tokenTtlSeconds: 3600 },
    })
  })

  it('exposes the unavailable state and its reason', async () => {
    faucetServer({ 'GET /v1/info': () => json(infoBody({ available: false, unavailableReason: 'maintenance' })) })
    const info = await fetchFaucetInfo()
    expect(info.available).toBe(false)
    expect(info.unavailableReason).toBe('maintenance')
  })

  it('reports a malformed response as NETWORK_ERROR with the status', async () => {
    faucetServer({ 'GET /v1/info': () => json({ chainId: 'x' }) })
    const error = await expectFaucetError(fetchFaucetInfo())
    expect(error.code).toBe('NETWORK_ERROR')
    expect(error.status).toBe(200)
    expect(error.message).toMatch(/Invalid faucet response/)
  })

  it('reports a network failure as NETWORK_ERROR without status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('fetch failed')
      })
    )
    const error = await expectFaucetError(fetchFaucetInfo())
    expect(error.code).toBe('NETWORK_ERROR')
    expect(error.status).toBeUndefined()
    expect(error.message).toBe('fetch failed')
  })

  it('reports a missing faucet URL as NETWORK_ERROR before any request', async () => {
    const server = faucetServer({ 'GET /v1/info': () => json(infoBody()) })
    vi.resetModules()
    vi.doMock('@/config/env', () => ({ VERANA_FAUCET_URL: undefined }))
    const faucet = await import('@/hooks/useFaucet')
    const error = await faucet.fetchFaucetInfo().catch((e: unknown) => e)
    expect(error).toBeInstanceOf(faucet.FaucetError)
    expect((error as FaucetError).code).toBe('NETWORK_ERROR')
    expect(server.fetchMock).not.toHaveBeenCalled()
    vi.doUnmock('@/config/env')
    vi.resetModules()
  })
})

describe('requestFaucetFunds', () => {
  it('runs the full exchange with the exact payloads and then calls POST /v1/faucet', async () => {
    const server = faucetServer(exchangeRoutes())
    const signArbitrary = signer()

    const result = await requestFaucetFunds({
      account: ACCOUNT,
      challengePrefix: PREFIX,
      signArbitrary,
      amount: '2500000',
    })

    expect(server.paths()).toEqual(['POST /v1/auth/challenge', 'POST /v1/auth/token', 'POST /v1/faucet'])
    expect(server.calls[0].body).toEqual({ account: ACCOUNT })
    expect(signArbitrary).toHaveBeenCalledTimes(1)
    expect(signArbitrary).toHaveBeenCalledWith(ACCOUNT, `${PREFIX}nonce-1`)
    expect(server.calls[1].body).toEqual({
      account: ACCOUNT,
      pubKey: SIGNATURE.pub_key.value,
      signature: SIGNATURE.signature,
      nonce: 'nonce-1',
    })
    expect(server.calls[2].headers.authorization).toBe('Bearer token-1')
    expect(server.calls[2].body).toEqual({ amount: '2500000' })
    expect(result).toEqual({ ...confirmedBody(), status: 'confirmed' })
  })

  it('sends an empty body without recipient when no amount is given', async () => {
    const server = faucetServer(exchangeRoutes())
    await requestFaucetFunds({ account: ACCOUNT, challengePrefix: PREFIX, signArbitrary: signer() })
    expect(server.calls[2].body).toEqual({})
    expect(server.calls[2].body).not.toHaveProperty('recipient')
  })

  it('returns the pending state on 202', async () => {
    faucetServer(exchangeRoutes({ 'POST /v1/faucet': () => json(pendingBody(), 202) }))
    const result = await requestFaucetFunds({ account: ACCOUNT, challengePrefix: PREFIX, signArbitrary: signer() })
    expect(result).toEqual({ ...pendingBody(), status: 'pending' })
  })

  it('reuses the token: two requests need one challenge and one signature', async () => {
    const server = faucetServer(exchangeRoutes())
    const signArbitrary = signer()
    const options = { account: ACCOUNT, challengePrefix: PREFIX, signArbitrary }

    await requestFaucetFunds(options)
    await requestFaucetFunds(options)

    expect(signArbitrary).toHaveBeenCalledTimes(1)
    expect(server.paths()).toEqual([
      'POST /v1/auth/challenge',
      'POST /v1/auth/token',
      'POST /v1/faucet',
      'POST /v1/faucet',
    ])
    expect(server.calls[3].headers.authorization).toBe('Bearer token-1')
  })

  it('runs one new exchange after a 401 and retries with the new token', async () => {
    const server = faucetServer(
      exchangeRoutes({
        'POST /v1/faucet': [
          () => json(confirmedBody()),
          () => serviceError(401, 'UNAUTHORIZED'),
          () => json(confirmedBody()),
        ],
      })
    )
    const signArbitrary = signer()
    const options = { account: ACCOUNT, challengePrefix: PREFIX, signArbitrary }
    await requestFaucetFunds(options)
    server.calls.length = 0

    const result = await requestFaucetFunds(options)

    expect(result.status).toBe('confirmed')
    expect(signArbitrary).toHaveBeenCalledTimes(2)
    expect(server.paths()).toEqual([
      'POST /v1/faucet',
      'POST /v1/auth/challenge',
      'POST /v1/auth/token',
      'POST /v1/faucet',
    ])
    expect(server.calls[0].headers.authorization).toBe('Bearer token-1')
    expect(server.calls[3].headers.authorization).toBe('Bearer token-2')
  })

  it('propagates UNAUTHORIZED when the retry also gets a 401', async () => {
    const server = faucetServer(exchangeRoutes({ 'POST /v1/faucet': () => serviceError(401, 'UNAUTHORIZED') }))
    const signArbitrary = signer()

    const error = await expectFaucetError(
      requestFaucetFunds({ account: ACCOUNT, challengePrefix: PREFIX, signArbitrary })
    )

    expect(error.code).toBe('UNAUTHORIZED')
    expect(error.status).toBe(401)
    expect(signArbitrary).toHaveBeenCalledTimes(2)
    expect(server.paths().filter((p) => p === 'POST /v1/faucet')).toHaveLength(2)
  })

  it('runs a new exchange when the token is inside the 5 s expiry margin', async () => {
    faucetServer(exchangeRoutes({ 'POST /v1/auth/token': () => json(tokenBody('token-short', ACCOUNT, 60_000)) }))
    const signArbitrary = signer()
    const options = { account: ACCOUNT, challengePrefix: PREFIX, signArbitrary }

    await requestFaucetFunds(options)
    vi.setSystemTime(new Date(NOW.getTime() + 54_000))
    await requestFaucetFunds(options)
    expect(signArbitrary).toHaveBeenCalledTimes(1)

    vi.setSystemTime(new Date(NOW.getTime() + 56_000))
    await requestFaucetFunds(options)
    expect(signArbitrary).toHaveBeenCalledTimes(2)
  })

  it('runs a new exchange when the account changes', async () => {
    const server = faucetServer(exchangeRoutes())
    const signArbitrary = signer()

    await requestFaucetFunds({ account: ACCOUNT, challengePrefix: PREFIX, signArbitrary })
    const second = vi.fn(async () => SIGNATURE)
    faucetServer(exchangeRoutes({ 'POST /v1/auth/token': () => json(tokenBody('token-other', OTHER_ACCOUNT)) }))
    await requestFaucetFunds({ account: OTHER_ACCOUNT, challengePrefix: PREFIX, signArbitrary: second })

    expect(signArbitrary).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledWith(OTHER_ACCOUNT, expect.stringMatching(/^Verana faucet challenge: nonce-/))
    expect(server.paths()).toEqual(['POST /v1/auth/challenge', 'POST /v1/auth/token', 'POST /v1/faucet'])
  })

  it('shares one signature between concurrent requests of the same account', async () => {
    const server = faucetServer(exchangeRoutes())
    const signArbitrary = signer()
    const options = { account: ACCOUNT, challengePrefix: PREFIX, signArbitrary }

    await Promise.all([requestFaucetFunds(options), requestFaucetFunds(options)])

    expect(signArbitrary).toHaveBeenCalledTimes(1)
    expect(server.paths().filter((p) => p === 'POST /v1/auth/challenge')).toHaveLength(1)
    expect(server.paths().filter((p) => p === 'POST /v1/faucet')).toHaveLength(2)
  })

  it('rejects a token issued for another account with AUTH_FAILED and does not cache it', async () => {
    const server = faucetServer(
      exchangeRoutes({ 'POST /v1/auth/token': () => json(tokenBody('token-x', OTHER_ACCOUNT)) })
    )
    const signArbitrary = signer()
    const options = { account: ACCOUNT, challengePrefix: PREFIX, signArbitrary }

    const error = await expectFaucetError(requestFaucetFunds(options))
    expect(error.code).toBe('AUTH_FAILED')
    expect(server.paths()).not.toContain('POST /v1/faucet')

    await expectFaucetError(requestFaucetFunds(options))
    expect(signArbitrary).toHaveBeenCalledTimes(2)
  })

  it('reports SIGN_ARBITRARY_UNSUPPORTED when the wallet has no signArbitrary', async () => {
    const server = faucetServer(exchangeRoutes())
    const error = await expectFaucetError(
      requestFaucetFunds({ account: ACCOUNT, challengePrefix: PREFIX, signArbitrary: undefined })
    )
    expect(error.code).toBe('SIGN_ARBITRARY_UNSUPPORTED')
    expect(server.fetchMock).not.toHaveBeenCalled()
  })

  it('reports SIGN_ARBITRARY_UNSUPPORTED when the cosmos-kit wrapper throws not implemented', async () => {
    faucetServer(exchangeRoutes())
    const signArbitrary = vi.fn(async () => {
      throw new Error('Function signArbitrary not implemented by Keplr Client yet.')
    })
    const error = await expectFaucetError(
      requestFaucetFunds({ account: ACCOUNT, challengePrefix: PREFIX, signArbitrary })
    )
    expect(error.code).toBe('SIGN_ARBITRARY_UNSUPPORTED')
  })

  it('propagates a wallet rejection unchanged', async () => {
    faucetServer(exchangeRoutes())
    const rejection = new Error('Request rejected')
    const signArbitrary = vi.fn(async () => {
      throw rejection
    })
    await expect(requestFaucetFunds({ account: ACCOUNT, challengePrefix: PREFIX, signArbitrary })).rejects.toBe(
      rejection
    )
  })

  it('rejects an invalid amount with INVALID_REQUEST without any request', async () => {
    const server = faucetServer(exchangeRoutes())
    for (const amount of ['1.5', '-1', '01', 'abc', '']) {
      const error = await expectFaucetError(
        requestFaucetFunds({ account: ACCOUNT, challengePrefix: PREFIX, signArbitrary: signer(), amount })
      )
      expect(error.code).toBe('INVALID_REQUEST')
    }
    expect(server.fetchMock).not.toHaveBeenCalled()
  })

  it('reports the phases signing and requesting in order', async () => {
    faucetServer(exchangeRoutes())
    const phases: string[] = []
    await requestFaucetFunds({
      account: ACCOUNT,
      challengePrefix: PREFIX,
      signArbitrary: signer(),
      onPhase: (phase) => phases.push(phase),
    })
    expect(phases).toEqual(['requesting', 'signing', 'requesting'])
  })
})

describe('error map', () => {
  const cases: Array<[number, string, Record<string, unknown>]> = [
    [400, 'INVALID_REQUEST', {}],
    [400, 'INVALID_ACCOUNT', { account: 'bad' }],
    [401, 'AUTH_FAILED', {}],
    [429, 'RATE_LIMITED', { retryAfter: 30 }],
    [429, 'QUOTA_EXCEEDED', { window: 'hour', resetsAt: '2026-01-01T01:00:00.000Z' }],
    [502, 'TX_FAILED', { rawLog: 'out of gas' }],
    [502, 'NODE_ERROR', {}],
    [503, 'FAUCET_UNAVAILABLE', { reason: 'maintenance' }],
  ]

  it.each(cases)('maps %i %s and keeps the details', async (status, code, details) => {
    faucetServer(exchangeRoutes({ 'POST /v1/auth/challenge': () => serviceError(status, code, details) }))
    const error = await expectFaucetError(
      requestFaucetFunds({ account: ACCOUNT, challengePrefix: PREFIX, signArbitrary: signer() })
    )
    expect(error.code).toBe(code)
    expect(error.status).toBe(status)
    expect(error.message).toBe(`${code} message`)
    expect(error.details).toEqual(details)
  })

  it('maps UNAUTHORIZED outside the faucet route without a retry', async () => {
    faucetServer(exchangeRoutes({ 'POST /v1/auth/token': () => serviceError(401, 'UNAUTHORIZED') }))
    const signArbitrary = signer()
    const error = await expectFaucetError(
      requestFaucetFunds({ account: ACCOUNT, challengePrefix: PREFIX, signArbitrary })
    )
    expect(error.code).toBe('UNAUTHORIZED')
    expect(signArbitrary).toHaveBeenCalledTimes(1)
  })

  it('maps an unknown code to NETWORK_ERROR with the status and the service message', async () => {
    faucetServer({ 'GET /v1/info': () => serviceError(500, 'SOMETHING_NEW', {}, 'unexpected failure') })
    const error = await expectFaucetError(fetchFaucetInfo())
    expect(error.code).toBe('NETWORK_ERROR')
    expect(error.status).toBe(500)
    expect(error.message).toBe('unexpected failure')
  })

  it('maps a non-JSON error response to NETWORK_ERROR with the status', async () => {
    faucetServer({ 'GET /v1/info': () => new Response('bad gateway', { status: 502 }) })
    const error = await expectFaucetError(fetchFaucetInfo())
    expect(error.code).toBe('NETWORK_ERROR')
    expect(error.status).toBe(502)
  })
})

describe('isAmountWithinLimit', () => {
  it('compares base-denom integers beyond Number.MAX_SAFE_INTEGER', () => {
    expect(isAmountWithinLimit('9007199254740993', '9007199254740993')).toBe(true)
    expect(isAmountWithinLimit('9007199254740994', '9007199254740993')).toBe(false)
    expect(isAmountWithinLimit('1', '9007199254740993')).toBe(true)
  })

  it('rejects zero, negative and non-numeric values', () => {
    expect(isAmountWithinLimit('0', '10')).toBe(false)
    expect(isAmountWithinLimit('-1', '10')).toBe(false)
    expect(isAmountWithinLimit('1.5', '10')).toBe(false)
    expect(isAmountWithinLimit('abc', '10')).toBe(false)
    expect(isAmountWithinLimit('1', '')).toBe(false)
  })
})

// react-dom/server runs the hook body and returns its callbacks. It does not run effects or state updates,
// so the reset effect and the `phase` state are not observable here.
function renderFaucetHook(state: Record<string, unknown>): ReturnType<typeof useFaucet> {
  chain.value = state
  let captured: ReturnType<typeof useFaucet> | null = null
  function Probe() {
    captured = useFaucet()
    return null
  }
  renderToString(createElement(Probe))
  if (!captured) throw new Error('hook did not render')
  return captured
}

describe('useFaucet', () => {
  it('rejects with WALLET_NOT_CONNECTED before any request when the wallet is not connected', async () => {
    const server = faucetServer({ 'GET /v1/info': () => json(infoBody()) })
    const hook = renderFaucetHook({ address: undefined, isWalletConnected: false, signArbitrary: signer() })
    const error = await expectFaucetError(hook.requestFunds())
    expect(error.code).toBe('WALLET_NOT_CONNECTED')
    expect(server.fetchMock).not.toHaveBeenCalled()
  })

  it('reads /v1/info first when requestFunds runs before getInfo, and signs with the prefix it returns', async () => {
    const server = faucetServer(
      exchangeRoutes({
        'GET /v1/info': () => json(infoBody({ auth: { ...infoBody().auth, challengePrefix: 'custom: ' } })),
      })
    )
    const signArbitrary = signer()
    const hook = renderFaucetHook({
      address: ACCOUNT,
      isWalletConnected: true,
      chainWallet: { client: { signArbitrary: vi.fn() } },
      signArbitrary,
    })

    const result = await hook.requestFunds('1000000')

    expect(result.status).toBe('confirmed')
    expect(server.paths()).toEqual([
      'GET /v1/info',
      'POST /v1/auth/challenge',
      'POST /v1/auth/token',
      'POST /v1/faucet',
    ])
    expect(signArbitrary).toHaveBeenCalledWith(ACCOUNT, 'custom: nonce-1')
  })

  it('does not read /v1/info again after getInfo', async () => {
    const server = faucetServer(exchangeRoutes({ 'GET /v1/info': () => json(infoBody()) }))
    const hook = renderFaucetHook({
      address: ACCOUNT,
      isWalletConnected: true,
      chainWallet: { client: { signArbitrary: vi.fn() } },
      signArbitrary: signer(),
    })

    await hook.getInfo()
    await hook.requestFunds()

    expect(server.paths().filter((p) => p === 'GET /v1/info')).toHaveLength(1)
  })

  it('reports SIGN_ARBITRARY_UNSUPPORTED when the wallet client has no signArbitrary', async () => {
    const server = faucetServer(exchangeRoutes({ 'GET /v1/info': () => json(infoBody()) }))
    const signArbitrary = signer()
    const hook = renderFaucetHook({
      address: ACCOUNT,
      isWalletConnected: true,
      chainWallet: { client: {} },
      signArbitrary,
    })

    const error = await expectFaucetError(hook.requestFunds())

    expect(error.code).toBe('SIGN_ARBITRARY_UNSUPPORTED')
    expect(signArbitrary).not.toHaveBeenCalled()
    expect(server.paths()).toEqual(['GET /v1/info'])
  })
})
