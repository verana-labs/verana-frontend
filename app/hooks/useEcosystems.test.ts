import { describe, expect, it } from 'vitest'
import { parseEcosystemsResponse } from './useEcosystems'

describe('parseEcosystemsResponse', () => {
  it('accepts the V4 ecosystems envelope', () => {
    expect(
      parseEcosystemsResponse({
        ecosystems: [
          {
            id: 7,
            did: 'did:web:ecosystem.example',
            corporation_id: 3,
            created: '2026-07-18T00:00:00.000Z',
            modified: '2026-07-18T00:00:00.000Z',
            language: 'en',
            active_version: 1,
            participants: 4,
            active_schemas: 2,
            weight: '10',
            issued: 5,
            verified: 6,
            archived: null,
          },
        ],
      })
    ).toEqual([
      expect.objectContaining({
        id: '7',
        did: 'did:web:ecosystem.example',
        corporationId: 3,
        weight: '10',
      }),
    ])
  })

  it('normalizes the documented numeric weight without losing the live decimal-string representation', () => {
    const payload = {
      ecosystems: [
        {
          id: 7,
          did: 'did:web:ecosystem.example',
          corporation_id: 3,
          created: '2026-07-18T00:00:00.000Z',
          modified: '2026-07-18T00:00:00.000Z',
          language: 'en',
          active_version: 1,
          participants: 4,
          active_schemas: 2,
          weight: 10,
          issued: 5,
          verified: 6,
          archived: null,
        },
      ],
    }

    expect(parseEcosystemsResponse(payload)[0].weight).toBe('10')
  })

  it('rejects a missing V4 envelope', () => {
    expect(() => parseEcosystemsResponse({ ecosystems: null })).toThrow('missing ecosystems envelope')
  })

  it('rejects malformed required ecosystem fields', () => {
    expect(() => parseEcosystemsResponse({ ecosystems: [{ id: 7, corporation_id: 3 }] })).toThrow('ecosystems[0].did')
  })
})

const ecosystem = {
  id: 7,
  did: 'did:web:ecosystem.example',
  corporation_id: 3,
  created: '2026-07-18T00:00:00.000Z',
  modified: '2026-07-18T00:00:00.000Z',
  language: 'en',
  active_version: 1,
  participants: 4,
  active_schemas: 2,
  weight: '10',
  issued: 5,
  verified: 6,
  archived: null,
}

describe('ecosystem rows carry the inline trust_data', () => {
  it('maps a full payload to the card enrichment', () => {
    const row = parseEcosystemsResponse({
      ecosystems: [
        {
          ...ecosystem,
          trust_data: {
            did: ecosystem.did,
            trusted: true,
            expiresAtTime: null,
            ecsCredentials: [
              { ecsSchema: 'ServiceCredential', credentialSubject: { name: 'Acme Ecosystem' } },
              { ecsSchema: 'OrganizationCredential', credentialSubject: { name: 'Acme Corp', countryCode: 'BE' } },
            ],
          },
        },
      ],
    })[0]
    expect(row.trustData?.trustStatus).toBe('TRUSTED')
    expect(row.trustData?.serviceName).toBe('Acme Ecosystem')
    expect(row.trustData?.organizationName).toBe('Acme Corp')
    expect(row.trustData?.countryCode).toBe('BE')
  })

  it('maps a null payload to unresolved', () => {
    expect(parseEcosystemsResponse({ ecosystems: [{ ...ecosystem, trust_data: null }] })[0].trustData).toEqual({
      did: ecosystem.did,
      trustStatus: 'UNRESOLVED',
    })
  })

  it('leaves the enrichment unset when the request asked for no trust_data', () => {
    expect(parseEcosystemsResponse({ ecosystems: [ecosystem] })[0].trustData).toBeUndefined()
  })
})
