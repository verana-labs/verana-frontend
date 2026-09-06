import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/config/env', () => ({
  VERANA_REST_ENDPOINT_ECOSYSTEM: 'https://indexer/v4/ecosystem',
  VERANA_REST_ENDPOINT_TRUST_DEPOSIT: 'https://indexer/v4/trust-deposit',
  VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA: 'https://indexer/v4/credential-schema',
}))

import { getProtocolParams, protocolParamsInitialState } from './protocolParams'

const PARAMS: Record<string, Record<string, unknown>> = {
  'https://indexer/v4/ecosystem': { trust_unit_price: 1_000_000, ecosystem_trust_deposit: 10 },
  'https://indexer/v4/trust-deposit': {
    trust_deposit_reclaim_burn_rate: 0.6,
    trust_deposit_rate: 0.2,
    trust_deposit_share_value: 1,
    user_agent_reward_rate: 0.1,
    wallet_user_agent_reward_rate: 0.15,
  },
  'https://indexer/v4/credential-schema': {
    credential_schema_schema_max_size: 8192,
    credential_schema_trust_deposit: 10,
  },
}

function stubParams(params: Record<string, Record<string, unknown>>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL) => {
      const base = String(input).replace(/\/params$/, '')
      return { ok: true, status: 200, json: async () => ({ params: params[base] }) } as Response
    })
  )
}

beforeEach(() => {
  stubParams(PARAMS)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('getProtocolParams', () => {
  it('loads the rates, unit values and module deposits and converts the burn rate to percent', async () => {
    await expect(getProtocolParams()).resolves.toEqual({
      params: {
        trustUnitPrice: 1_000_000,
        ecosystemTrustDeposit: 10,
        trustDepositReclaimBurnRate: 60,
        trustDepositRate: 0.2,
        trustDepositShareValue: 1,
        userAgentRewardRate: 0.1,
        walletUserAgentRewardRate: 0.15,
        credentialSchemaSchemaMaxSize: 8192,
        credentialSchemaTrustDeposit: 10,
      },
      errorProtocolParams: null,
    })
  })

  it('deduplicates requests that share an endpoint', async () => {
    const { params } = await getProtocolParams()
    expect(params).not.toBe(protocolParamsInitialState)
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('leaves the ecosystem deposit null without an error when the indexer omits it', async () => {
    stubParams({ ...PARAMS, 'https://indexer/v4/ecosystem': { trust_unit_price: 1_000_000 } })
    const { params, errorProtocolParams } = await getProtocolParams()
    expect(params.ecosystemTrustDeposit).toBeNull()
    expect(params.trustUnitPrice).toBe(1_000_000)
    expect(errorProtocolParams).toBeNull()
  })

  it('still reports a missing mandatory key', async () => {
    stubParams({ ...PARAMS, 'https://indexer/v4/credential-schema': { credential_schema_schema_max_size: 8192 } })
    const { params, errorProtocolParams } = await getProtocolParams()
    expect(params.credentialSchemaTrustDeposit).toBeNull()
    expect(errorProtocolParams).toContain('credential_schema_trust_deposit not found')
  })

  it('fails closed when a configured V4 envelope is malformed', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, status: 200, json: async () => ({}) } as Response)
    const result = await getProtocolParams()
    expect(result.params).toEqual(protocolParamsInitialState)
    expect(result.errorProtocolParams).toContain('missing params envelope')
  })
})
