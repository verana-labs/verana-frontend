import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockEnv } = vi.hoisted(() => ({ mockEnv: vi.fn<(key: string) => string | undefined>() }))
vi.mock('next-runtime-env', () => ({ env: mockEnv }))

import { getProtocolParams, protocolParamsInitialState } from './protocolParams'

const BASES: Record<string, string> = {
  NEXT_PUBLIC_VERANA_REST_ENDPOINT_ECOSYSTEM: 'https://indexer/v4/ecosystem',
  NEXT_PUBLIC_VERANA_REST_ENDPOINT_TRUST_DEPOSIT: 'https://indexer/v4/trust-deposit',
  NEXT_PUBLIC_VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA: 'https://indexer/v4/credential-schema',
}

const PARAMS: Record<string, Record<string, unknown>> = {
  'https://indexer/v4/ecosystem': { trust_unit_price: 1_000_000 },
  'https://indexer/v4/trust-deposit': {
    trust_deposit_reclaim_burn_rate: 0.6,
    trust_deposit_rate: 0.2,
  },
  'https://indexer/v4/credential-schema': { credential_schema_schema_max_size: 8192 },
}

beforeEach(() => {
  mockEnv.mockImplementation((key) => BASES[key])
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL) => {
      const base = String(input).replace(/\/params$/, '')
      return { ok: true, status: 200, json: async () => ({ params: PARAMS[base] }) } as Response
    })
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  mockEnv.mockReset()
})

describe('getProtocolParams', () => {
  it('loads only live V4 params and converts the burn rate to percent', async () => {
    await expect(getProtocolParams()).resolves.toEqual({
      params: {
        trustUnitPrice: 1_000_000,
        trustDepositReclaimBurnRate: 60,
        trustDepositRate: 0.2,
        credentialSchemaSchemaMaxSize: 8192,
      },
      errorProtocolParams: null,
    })
  })

  it('deduplicates requests that share an endpoint', async () => {
    const { params } = await getProtocolParams()
    expect(params).not.toBe(protocolParamsInitialState)
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('fails closed when a configured V4 envelope is malformed', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, status: 200, json: async () => ({}) } as Response)
    const result = await getProtocolParams()
    expect(result.params).toEqual(protocolParamsInitialState)
    expect(result.errorProtocolParams).toContain('missing params envelope')
  })
})
