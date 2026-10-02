import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/config/env', () => ({
  VERANA_REST_ENDPOINT_TRUST_DEPOSIT: 'https://indexer/v4/trust-deposit',
  VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA: 'https://indexer/v4/credential-schema',
}))

import { getProtocolParams, protocolParamsInitialState } from './protocolParams'

const PARAMS: Record<string, Record<string, unknown>> = {
  'https://indexer/v4/trust-deposit': { trust_deposit_rate: 0.2 },
  'https://indexer/v4/credential-schema': {
    credential_schema_schema_max_size: 8192,
    credential_schema_issuer_grantor_validation_validity_period_max_days: 3650,
    credential_schema_verifier_grantor_validation_validity_period_max_days: 3650,
    credential_schema_issuer_validation_validity_period_max_days: 1825,
    credential_schema_verifier_validation_validity_period_max_days: 1825,
    credential_schema_holder_validation_validity_period_max_days: 365,
  },
}

beforeEach(() => {
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
})

describe('getProtocolParams', () => {
  it('loads the params the chain still defines', async () => {
    await expect(getProtocolParams()).resolves.toEqual({
      params: {
        trustDepositRate: 0.2,
        credentialSchemaSchemaMaxSize: 8192,
        issuerGrantorValidityMaxDays: 3650,
        verifierGrantorValidityMaxDays: 3650,
        issuerValidityMaxDays: 1825,
        verifierValidityMaxDays: 1825,
        holderValidityMaxDays: 365,
      },
      errorProtocolParams: null,
    })
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('fails closed when a configured V4 envelope is malformed', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, status: 200, json: async () => ({}) } as Response)
    const result = await getProtocolParams()
    expect(result.params).toEqual(protocolParamsInitialState)
    expect(result.errorProtocolParams).toContain('missing params envelope')
  })
})
