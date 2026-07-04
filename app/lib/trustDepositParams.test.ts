import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockEnv } = vi.hoisted(() => ({ mockEnv: vi.fn<(key: string) => string | undefined>() }))

vi.mock('next-runtime-env', () => ({ env: mockEnv }))

import { getTrustDepositParams, trustDepositParamsInitialState } from '@/lib/trustDepositParams'

const ENV_DID = 'NEXT_PUBLIC_VERANA_REST_ENDPOINT_DID'
const ENV_TRUST_REGISTRY = 'NEXT_PUBLIC_VERANA_REST_ENDPOINT_TRUST_REGISTRY'
const ENV_TRUST_DEPOSIT = 'NEXT_PUBLIC_VERANA_REST_ENDPOINT_TRUST_DEPOSIT'
const ENV_CREDENTIAL_SCHEMA = 'NEXT_PUBLIC_VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA'

const ALL_ENV_KEYS = [ENV_DID, ENV_TRUST_REGISTRY, ENV_TRUST_DEPOSIT, ENV_CREDENTIAL_SCHEMA] as const

const BASES: Record<string, string> = {
  [ENV_DID]: 'https://did.example',
  [ENV_TRUST_REGISTRY]: 'https://tr.example',
  [ENV_TRUST_DEPOSIT]: 'https://td.example',
  [ENV_CREDENTIAL_SCHEMA]: 'https://cs.example',
}

type ParamsByBase = Record<string, Record<string, unknown> | undefined>

const fullParams: Record<string, unknown> = {
  did_directory_trust_deposit: '10',
  trust_registry_trust_deposit: '20',
  trust_unit_price: '5',
  trust_deposit_reclaim_burn_rate: '0.6',
  trust_deposit_rate: '0.2',
  credential_schema_trust_deposit: '30',
  credential_schema_schema_max_size: '8192',
}

function mockFetchFor(paramsByBase: ParamsByBase) {
  const fetchMock = vi.fn(async (input: string | URL) => {
    const url = String(input)
    const matchedBase = Object.values(BASES).find((base) => url.startsWith(base))
    const params = matchedBase ? paramsByBase[matchedBase] : undefined
    if (params === undefined) {
      return { ok: false, statusText: 'Not Found', json: async () => ({}) } as unknown as Response
    }
    return { ok: true, json: async () => ({ params }) } as unknown as Response
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function allBasesWith(params: Record<string, unknown>): ParamsByBase {
  return Object.fromEntries(Object.values(BASES).map((base) => [base, params]))
}

beforeEach(() => {
  mockEnv.mockImplementation((key: string) => BASES[key])
  for (const key of ALL_ENV_KEYS) delete process.env[key]
})

afterEach(() => {
  vi.unstubAllGlobals()
  mockEnv.mockReset()
})

describe('trustDepositParamsInitialState', () => {
  it('starts every parameter as null', () => {
    expect(trustDepositParamsInitialState).toEqual({
      didDirectoryTrustDeposit: null,
      trustRegistryTrustDeposit: null,
      trustUnitPrice: null,
      trustDepositReclaimBurnRate: null,
      trustDepositRate: null,
      credentialSchemaTrustDeposit: null,
      credentialSchemaSchemaMaxSize: null,
    })
  })
})

describe('getTrustDepositParams', () => {
  it('maps each response key to its camelCase param and coerces numeric strings to numbers', async () => {
    mockFetchFor(allBasesWith(fullParams))

    const { params, errorTrustDepositParams } = await getTrustDepositParams()

    expect(errorTrustDepositParams).toBeNull()
    expect(params.didDirectoryTrustDeposit).toBe(10)
    expect(params.trustRegistryTrustDeposit).toBe(20)
    expect(params.trustUnitPrice).toBe(5)
    expect(params.trustDepositRate).toBe(0.2)
    expect(params.credentialSchemaTrustDeposit).toBe(30)
    expect(params.credentialSchemaSchemaMaxSize).toBe(8192)
  })

  it('scales trust_deposit_reclaim_burn_rate by 100 to express it as a percentage', async () => {
    mockFetchFor(allBasesWith(fullParams))

    const { params } = await getTrustDepositParams()

    expect(params.trustDepositReclaimBurnRate).toBe(60)
  })

  it('preserves null values returned by the chain without coercing them to 0', async () => {
    mockFetchFor(
      allBasesWith({ ...fullParams, did_directory_trust_deposit: null, trust_deposit_reclaim_burn_rate: null })
    )

    const { params, errorTrustDepositParams } = await getTrustDepositParams()

    expect(params.didDirectoryTrustDeposit).toBeNull()
    expect(params.trustDepositReclaimBurnRate).toBeNull()
    expect(errorTrustDepositParams).toBeNull()
  })

  it('requests the /params path appended to each configured endpoint base', async () => {
    const fetchMock = mockFetchFor(allBasesWith(fullParams))

    await getTrustDepositParams()

    const requestedUrls = fetchMock.mock.calls.map(([input]) => String(input))
    expect(requestedUrls).toContain('https://did.example/params')
    expect(requestedUrls).toContain('https://tr.example/params')
    expect(requestedUrls).toContain('https://td.example/params')
    expect(requestedUrls).toContain('https://cs.example/params')
  })

  it('falls back to process.env when next-runtime-env returns nothing for an endpoint', async () => {
    mockEnv.mockReturnValue(undefined)
    process.env[ENV_DID] = BASES[ENV_DID]
    const fetchMock = mockFetchFor({ [BASES[ENV_DID]]: fullParams })

    const { params } = await getTrustDepositParams()

    expect(fetchMock).toHaveBeenCalledWith('https://did.example/params')
    expect(params.didDirectoryTrustDeposit).toBe(10)
  })

  it('reports a missing-env error and leaves the param null when no base is configured', async () => {
    mockEnv.mockImplementation((key: string) => (key === ENV_DID ? undefined : BASES[key]))
    mockFetchFor(allBasesWith(fullParams))

    const { params, errorTrustDepositParams } = await getTrustDepositParams()

    expect(params.didDirectoryTrustDeposit).toBeNull()
    expect(errorTrustDepositParams).not.toBeNull()
    expect(errorTrustDepositParams).toContain(ENV_DID)
    expect(errorTrustDepositParams).toContain('Missing environment variable')
  })

  it('reports a fetch-failed error tagged with the response key when the response is not ok', async () => {
    mockFetchFor({ ...allBasesWith(fullParams), [BASES[ENV_DID]]: undefined })

    const { params, errorTrustDepositParams } = await getTrustDepositParams()

    expect(params.didDirectoryTrustDeposit).toBeNull()
    expect(errorTrustDepositParams).toContain('did_directory_trust_deposit')
    expect(errorTrustDepositParams).toContain('Failed to fetch parameters for')
  })

  it('reports a not-found error when the response key is absent from the params object', async () => {
    const { did_directory_trust_deposit, ...withoutDid } = fullParams
    void did_directory_trust_deposit
    mockFetchFor(allBasesWith(withoutDid))

    const { params, errorTrustDepositParams } = await getTrustDepositParams()

    expect(params.didDirectoryTrustDeposit).toBeNull()
    expect(errorTrustDepositParams).toContain('did_directory_trust_deposit')
    expect(errorTrustDepositParams).toContain('not found in response')
  })

  it('returns undefined-keyed not-found rather than crashing when params is missing entirely', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({}) }) as unknown as Response)
    vi.stubGlobal('fetch', fetchMock)

    const { params, errorTrustDepositParams } = await getTrustDepositParams()

    expect(params).toEqual(trustDepositParamsInitialState)
    expect(errorTrustDepositParams).toContain('not found in response')
  })

  it('captures the thrown message when fetch rejects', async () => {
    const fetchMock = vi.fn(async (input: string | URL) => {
      if (String(input).startsWith(BASES[ENV_DID])) throw new Error('network down')
      return { ok: true, json: async () => ({ params: fullParams }) } as unknown as Response
    })
    vi.stubGlobal('fetch', fetchMock)

    const { params, errorTrustDepositParams } = await getTrustDepositParams()

    expect(params.didDirectoryTrustDeposit).toBeNull()
    expect(params.trustRegistryTrustDeposit).toBe(20)
    expect(errorTrustDepositParams).toContain('did_directory_trust_deposit')
    expect(errorTrustDepositParams).toContain('network down')
  })

  it('joins multiple independent errors with a pipe separator', async () => {
    mockEnv.mockImplementation((key: string) => (key === ENV_DID ? undefined : BASES[key]))
    mockFetchFor({ ...allBasesWith(fullParams), [BASES[ENV_CREDENTIAL_SCHEMA]]: undefined })

    const { errorTrustDepositParams } = await getTrustDepositParams()

    expect(errorTrustDepositParams).not.toBeNull()
    const segments = (errorTrustDepositParams ?? '').split(' | ')
    expect(segments.length).toBeGreaterThanOrEqual(2)
    expect(errorTrustDepositParams).toContain(ENV_DID)
    expect(errorTrustDepositParams).toContain('credential_schema')
  })

  it('does not mutate the shared initial-state constant across calls', async () => {
    mockFetchFor(allBasesWith(fullParams))

    await getTrustDepositParams()

    expect(trustDepositParamsInitialState.didDirectoryTrustDeposit).toBeNull()
    expect(trustDepositParamsInitialState.trustDepositReclaimBurnRate).toBeNull()
  })
})
