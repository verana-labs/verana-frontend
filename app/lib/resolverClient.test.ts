import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/config/env', () => ({
  VERANA_REST_ENDPOINT_VERIFIABLE_TRUST: 'https://indexer.test/v4/verifiable-trust',
  VERANA_REST_ENDPOINT_PARTICIPANT: 'https://indexer.test/v4/participant',
}))

import {
  ALL_PARTICIPATION_STATES,
  fetchAgentResolution,
  fetchDidEnrichment,
  invalidateDid,
  mapAgentResolution,
  mapResolveResult,
} from '@/lib/resolverClient'

const DID = 'did:web:service.example'
const ISSUER_DID = 'did:web:ecs.example'

function resolveResponse({ withLogos = true, trusted = true, expiresAtTime = '2036-01-01T00:00:00.000Z' } = {}) {
  return {
    did: DID,
    trusted,
    evaluatedAtBlock: 42,
    expiresAtTime,
    ecsCredentials: [
      {
        ecsSchema: 'ServiceCredential',
        issuerParticipantId: 91,
        credentialSubject: {
          name: 'Acme Portal',
          description: 'Acme customer portal',
          ...(withLogos ? { logoUri: 'https://service.example/logo.png' } : {}),
          minimumAgeRequired: 18,
          termsAndConditionsUri: 'https://service.example/terms',
          privacyPolicyUri: 'https://service.example/privacy',
        },
      },
      {
        ecsSchema: 'OrganizationCredential',
        issuerParticipantId: 75,
        credentialSubject: {
          name: 'Acme Corp',
          ...(withLogos ? { logoUri: 'https://service.example/org-logo.png' } : {}),
          countryCode: 'BE',
          address: 'Rue de la Loi 1, 1000 Brussels',
          registryId: 'BE0123456789',
        },
      },
    ],
  }
}

function stubFetch(resolveBody: unknown, resolveStatus = 200) {
  const fetchMock = vi.fn(async (input: string | URL | Request) => {
    const url = String(input)
    if (url.endsWith('/verifiable-trust/resolve')) {
      return new Response(JSON.stringify(resolveBody), { status: resolveStatus })
    }
    if (url.endsWith('/participant/get/75')) {
      return new Response(JSON.stringify({ participant: { id: 75, did: ISSUER_DID } }), { status: 200 })
    }
    return new Response('not found', { status: 404 })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  invalidateDid(DID)
  vi.unstubAllGlobals()
})

describe('fetchDidEnrichment', () => {
  it('posts the DID to the indexer resolve route and maps the ECS claims', async () => {
    const fetchMock = stubFetch(resolveResponse())

    const enrichment = await fetchDidEnrichment(DID, { force: true })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://indexer.test/v4/verifiable-trust/resolve',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ did: DID, ecsCredentials: true }) })
    )
    expect(enrichment.trustStatus).toBe('TRUSTED')
    expect(enrichment.serviceName).toBe('Acme Portal')
    expect(enrichment.serviceLogoUrl).toBe('https://service.example/logo.png')
    expect(enrichment.serviceMinAge).toBe('18')
    expect(enrichment.serviceTermsUrl).toBe('https://service.example/terms')
    expect(enrichment.organizationName).toBe('Acme Corp')
    expect(enrichment.organizationLogoUrl).toBe('https://service.example/org-logo.png')
    expect(enrichment.countryCode).toBe('BE')
    expect(enrichment.organizationRegistryId).toBe('BE0123456789')
    expect(enrichment.credentialIssuerDid).toBe(ISSUER_DID)
    expect(enrichment.evaluatedAtBlock).toBe(42)
  })

  it('leaves logo fields undefined when the claims carry none', async () => {
    stubFetch(resolveResponse({ withLogos: false }))

    const enrichment = await fetchDidEnrichment(DID, { force: true })

    expect(enrichment.serviceLogoUrl).toBeUndefined()
    expect(enrichment.organizationLogoUrl).toBeUndefined()
    expect(enrichment.serviceName).toBe('Acme Portal')
  })

  it('reports UNTRUSTED when the indexer evaluated the DID as not trusted', async () => {
    stubFetch(resolveResponse({ trusted: false }))

    const enrichment = await fetchDidEnrichment(DID, { force: true })

    expect(enrichment.trustStatus).toBe('UNTRUSTED')
  })

  it('reports UNRESOLVED when the indexer does not know the DID', async () => {
    stubFetch({ error: 'DID not found', code: 404 }, 404)

    const enrichment = await fetchDidEnrichment(DID, { force: true })

    expect(enrichment).toEqual({ did: DID, trustStatus: 'UNRESOLVED' })
  })
})

const agentResolveResponse = {
  did: DID,
  trusted: true,
  ecsCredentials: [
    {
      id: 'urn:uuid:ecs-service',
      ecsSchema: 'ServiceCredential',
      credentialSchemaId: 11,
      ecosystemId: 1,
      credentialSubject: { name: 'Acme Portal' },
    },
  ],
  participations: [
    {
      id: 501,
      vsOperator: 'verana1vs',
      role: 'ISSUER',
      state: 'ACTIVE',
      credentialSchemaId: 1234,
      ecosystemId: 9876,
      validatorParticipantId: 401,
    },
    { role: 'VERIFIER', state: 'ACTIVE' },
  ],
  services: [
    { id: `${DID}#admin`, type: 'VsAgentAdminAPI', serviceEndpoint: 'https://service.example/admin' },
    { serviceEndpoint: 'https://service.example/orphan' },
  ],
  presentations: [
    {
      id: 'https://service.example/vt/vp1.json',
      vtcCredentials: [
        { id: 'urn:uuid:vtc-1', credentialSchemaId: 30_001, ecosystemId: 9876 },
        { credentialSchemaId: 30_002 },
      ],
    },
  ],
}

describe('mapAgentResolution', () => {
  it('maps the participations, the service endpoints and the presented credentials', () => {
    const resolution = mapAgentResolution(DID, agentResolveResponse)

    expect(resolution.enrichment.serviceName).toBe('Acme Portal')
    expect(resolution.participations).toEqual([
      {
        id: 501,
        vsOperator: 'verana1vs',
        role: 'ISSUER',
        state: 'ACTIVE',
        credentialSchemaId: 1234,
        ecosystemId: 9876,
        validatorParticipantId: 401,
      },
    ])
    expect(resolution.services).toEqual([
      { id: `${DID}#admin`, type: 'VsAgentAdminAPI', serviceEndpoint: 'https://service.example/admin' },
    ])
    expect(resolution.credentials).toEqual([
      {
        id: 'urn:uuid:ecs-service',
        ecsSchema: 'ServiceCredential',
        credentialSchemaId: 11,
        ecosystemId: 1,
        presentationUrl: null,
      },
      {
        id: 'urn:uuid:vtc-1',
        ecsSchema: null,
        credentialSchemaId: 30_001,
        ecosystemId: 9876,
        presentationUrl: 'https://service.example/vt/vp1.json',
      },
    ])
  })

  it('returns empty sections when the resolve carries none', () => {
    expect(mapAgentResolution(DID, { did: DID, trusted: false })).toEqual({
      enrichment: expect.objectContaining({ trustStatus: 'UNTRUSTED' }),
      participations: [],
      services: [],
      credentials: [],
    })
  })
})

describe('fetchAgentResolution', () => {
  it('asks the resolver for the sections of the card, scoped to the requested participation states', async () => {
    const fetchMock = stubFetch(agentResolveResponse)

    await fetchAgentResolution(DID, ALL_PARTICIPATION_STATES)

    expect(fetchMock).toHaveBeenCalledWith(
      'https://indexer.test/v4/verifiable-trust/resolve',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          did: DID,
          ecsCredentials: true,
          participations: { states: ALL_PARTICIPATION_STATES },
          services: true,
          presentations: {},
        }),
      })
    )
  })

  it('remembers a failed resolve, so a burst of block events does not retry it per event', async () => {
    const fetchMock = stubFetch({ error: 'boom' }, 500)

    await expect(fetchAgentResolution(DID, ALL_PARTICIPATION_STATES)).rejects.toThrow()
    expect(await fetchAgentResolution(DID, ALL_PARTICIPATION_STATES)).toEqual({
      enrichment: { did: DID, trustStatus: 'UNRESOLVED' },
      participations: [],
      services: [],
      credentials: [],
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('mapResolveResult', () => {
  it('treats an expired evaluation as untrusted', () => {
    const enrichment = mapResolveResult(DID, resolveResponse({ expiresAtTime: '2020-01-01T00:00:00.000Z' }))
    expect(enrichment.trustStatus).toBe('UNTRUSTED')
  })

  it('treats a never-expiring evaluation as trusted', () => {
    const raw = { ...resolveResponse(), expiresAtTime: null }
    expect(mapResolveResult(DID, raw).trustStatus).toBe('TRUSTED')
  })
})
