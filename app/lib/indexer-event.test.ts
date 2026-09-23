import { describe, expect, it } from 'vitest'
import {
  concernsCorporation,
  type IndexerEntityEvent,
  parseIndexerBlockEvent,
  parseIndexerBlockHeight,
} from '@/lib/indexer-event'

const AGENT_DID = 'did:web:agent.example'

describe('parseIndexerBlockEvent', () => {
  it.each(['ready', 'block'])('accepts live %s messages', (type) => {
    expect(
      parseIndexerBlockEvent({
        type,
        block: 10_928,
        blockTime: '2026-07-18T07:00:00Z',
        events: [],
      })
    ).toEqual({ height: 10_928, timestamp: '2026-07-18T07:00:00Z', events: [] })
  })

  it('ignores legacy and malformed messages', () => {
    expect(parseIndexerBlockEvent({ type: 'block-indexed', height: 10_928 })).toBeNull()
    expect(parseIndexerBlockEvent({ type: 'block', block: '10928' })).toBeNull()
  })

  it('keeps the entity events of the block with their module, DIDs and Corporation ids', () => {
    const parsed = parseIndexerBlockEvent({
      type: 'block',
      block: 1_500_005,
      blockTime: '2026-05-11T13:00:05Z',
      events: [
        {
          type: 'indexer-event',
          event_type: 'StartParticipantOP',
          did: AGENT_DID,
          payload: {
            module: 'pp',
            related_dids: ['did:web:validator.example', 7],
            corporation_id: 42,
            related_corporation_ids: [43, 'nope'],
          },
        },
        { type: 'indexer-event', event_type: 'Vote', payload: { action: 'vote' } },
        'not an event',
      ],
    })

    expect(parsed?.events).toEqual([
      {
        eventType: 'StartParticipantOP',
        module: 'pp',
        did: AGENT_DID,
        relatedDids: ['did:web:validator.example'],
        corporationId: 42,
        relatedCorporationIds: [43],
      },
    ])
  })
})

describe('concernsCorporation', () => {
  const known = new Set([AGENT_DID])
  const event = (overrides: Partial<IndexerEntityEvent>): IndexerEntityEvent => ({
    eventType: 'StartParticipantOP',
    module: 'pp',
    did: null,
    relatedDids: [],
    corporationId: null,
    relatedCorporationIds: [],
    ...overrides,
  })

  it('matches on the Corporation ids of the payload', () => {
    expect(concernsCorporation(event({ corporationId: 42 }), 42, known)).toBe(true)
    expect(concernsCorporation(event({ relatedCorporationIds: [9, 42] }), 42, known)).toBe(true)
  })

  it('rejects another Corporation even when the event carries a known DID', () => {
    expect(concernsCorporation(event({ corporationId: 7, did: AGENT_DID }), 42, known)).toBe(false)
  })

  it('falls back to the known DIDs when the payload carries no Corporation id', () => {
    expect(concernsCorporation(event({ did: AGENT_DID }), 42, known)).toBe(true)
    expect(concernsCorporation(event({ relatedDids: [AGENT_DID] }), 42, known)).toBe(true)
    expect(concernsCorporation(event({ did: 'did:web:other.example' }), 42, known)).toBe(false)
  })
})

describe('parseIndexerBlockHeight', () => {
  it('accepts the live block-height response', () => {
    expect(
      parseIndexerBlockHeight({ type: 'block-indexed', height: 506_370, timestamp: '2026-09-07T17:28:06Z' })
    ).toEqual({ height: 506_370, timestamp: '2026-09-07T17:28:06Z', events: [] })
  })

  it('rejects malformed responses', () => {
    expect(parseIndexerBlockHeight({ height: '506370' })).toBeNull()
    expect(parseIndexerBlockHeight({ height: 1, timestamp: 5 })).toBeNull()
    expect(parseIndexerBlockHeight(null)).toBeNull()
  })
})
