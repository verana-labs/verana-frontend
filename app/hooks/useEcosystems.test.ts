import { describe, expect, it } from 'vitest'
import { firstPage } from '@/lib/keyset'
import { ecosystemListQuery, parseEcosystemsResponse } from './useEcosystems'

describe('ecosystemListQuery', () => {
  it('scopes the acting corporation list to non-archived ecosystems with the keyset cursor', () => {
    const params = ecosystemListQuery(
      { limit: 9, sort: '-id', direction: 'forward', boundary: 20 },
      { corporationId: 13, onlyActive: true, withSchemas: false }
    )
    expect(params.toString()).toBe('limit=10&sort=-id&max_id=20&participant_corporation_id=13&archived=false')
  })

  it('asks for every non-archived ecosystem with at least one active schema on discover', () => {
    const params = ecosystemListQuery(firstPage(5), { onlyActive: true, withSchemas: true })
    expect(params.toString()).toBe('limit=6&sort=-id&archived=false&min_active_schemas=1')
  })
})

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
