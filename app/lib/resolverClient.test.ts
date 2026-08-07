import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/config/env', () => ({
  VERANA_REST_ENDPOINT_RESOLVER: 'https://resolver.test/v1',
}))

import { fetchDidEnrichment, invalidateDid } from '@/lib/resolverClient'

const DID = 'did:web:service.example'

function resolverResponse({ withLogos = true }: { withLogos?: boolean } = {}) {
  return {
    did: DID,
    trustStatus: 'TRUSTED',
    evaluatedAtBlock: 42,
    credentials: [
      {
        ecsType: 'ECS-SERVICE',
        issuedBy: DID,
        claims: {
          name: 'Acme Portal',
          description: 'Acme customer portal',
          ...(withLogos ? { logo: 'https://service.example/logo.png' } : {}),
          minimumAgeRequired: 0,
          termsAndConditions: 'https://service.example/terms',
          privacyPolicy: 'https://service.example/privacy',
        },
      },
      {
        ecsType: 'ECS-ORG',
        issuedBy: 'did:web:ecs.example',
        claims: {
          name: 'Acme Corp',
          ...(withLogos ? { logo: 'https://service.example/org-logo.png' } : {}),
          countryCode: 'BE',
          address: 'Rue de la Loi 1, 1000 Brussels',
          registryId: 'BE0123456789',
        },
      },
    ],
    failedCredentials: [],
    dereferenceErrors: [],
  }
}

afterEach(() => {
  invalidateDid(DID)
  vi.unstubAllGlobals()
})

describe('fetchDidEnrichment', () => {
  it('extracts service and organization logos from resolver claims', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(resolverResponse()), { status: 200 }))
    )

    const enrichment = await fetchDidEnrichment(DID, { force: true })

    expect(enrichment.trustStatus).toBe('TRUSTED')
    expect(enrichment.serviceName).toBe('Acme Portal')
    expect(enrichment.serviceLogoUrl).toBe('https://service.example/logo.png')
    expect(enrichment.organizationName).toBe('Acme Corp')
    expect(enrichment.organizationLogoUrl).toBe('https://service.example/org-logo.png')
    expect(enrichment.countryCode).toBe('BE')
  })

  it('leaves logo fields undefined when the claims carry none', async () => {
    const body = resolverResponse({ withLogos: false })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }))
    )

    const enrichment = await fetchDidEnrichment(DID, { force: true })

    expect(enrichment.serviceLogoUrl).toBeUndefined()
    expect(enrichment.organizationLogoUrl).toBeUndefined()
    expect(enrichment.serviceName).toBe('Acme Portal')
  })
})
