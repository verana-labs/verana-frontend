import { describe, expect, it } from 'vitest'
import { parseEcosystemResponse } from './useEcosystemData'

describe('parseEcosystemResponse', () => {
  it('accepts the V4 ecosystem detail envelope', () => {
    const ecosystem = parseEcosystemResponse({
      ecosystem: {
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
        versions: [],
      },
    })

    expect(ecosystem).toMatchObject({
      id: '7',
      did: 'did:web:ecosystem.example',
      corporationId: 3,
      activeVersion: 1,
      weight: '10',
    })
  })

  it('accepts a V4 draft governance framework version with no activation date', () => {
    const ecosystem = parseEcosystemResponse({
      ecosystem: {
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
        versions: [
          {
            id: 8,
            version: 2,
            active_since: null,
            documents: [
              {
                id: 9,
                url: 'https://example.com/governance-framework-v2.pdf',
                language: 'en',
                digest_sri: 'sha384-draft',
              },
            ],
          },
        ],
      },
    })

    expect(ecosystem.versions).toEqual([
      {
        id: '8',
        version: 2,
        activeSince: null,
        documents: [
          {
            id: '9',
            url: 'https://example.com/governance-framework-v2.pdf',
            language: 'en',
            digestSri: 'sha384-draft',
          },
        ],
      },
    ])
  })

  it('rejects a bare detail object', () => {
    expect(() => parseEcosystemResponse({ id: 7, did: 'did:web:ecosystem.example' })).toThrow(
      'missing ecosystem envelope'
    )
  })
})
