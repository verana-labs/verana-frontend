import { describe, expect, it, vi } from 'vitest'

vi.mock('@/config/env', () => ({ VERANA_REST_ENDPOINT_INDEXER: 'https://indexer.example/v4/indexer' }))

vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn() } }))

import {
  concernsCorporation,
  type IndexerEvent,
  indexerEventKey,
  indexerEventsUrl,
  parseIndexerBlockHeight,
  parseIndexerEventsPage,
  parseIndexerSocketMessage,
  refreshesEntityLists,
  refreshTargets,
  triggersDiscovery,
} from '@/lib/indexer-event'

const AGENT_DID = 'did:web:agent.example'
const known = new Set([AGENT_DID])

const participantEvent = {
  type: 'indexer-event',
  event_type: 'StartParticipantOP',
  did: 'did:web:participant.example',
  block_height: 102,
  tx_hash: 'AB12',
  timestamp: '2026-07-18T07:00:00Z',
  payload: {
    module: 'pp',
    action: 'start_participant_op',
    message_type: 'MsgStartParticipantOP',
    tx_index: 3,
    message_index: 0,
    sender: 'verana1sender',
    related_dids: [],
    corporation_id: 7,
  },
}

const malformedEvent = {
  ...participantEvent,
  tx_hash: 'CD34',
  payload: { ...participantEvent.payload, module: undefined },
}

function event(overrides: Partial<IndexerEvent>): IndexerEvent {
  return {
    eventType: 'StartParticipantOP',
    module: 'pp',
    did: 'did:web:participant.example',
    relatedDids: [],
    blockHeight: 102,
    txHash: 'AB12',
    messageIndex: 0,
    sender: 'verana1sender',
    grantee: null,
    corporationId: 7,
    relatedCorporationIds: [],
    ...overrides,
  }
}

describe('parseIndexerSocketMessage', () => {
  it.each(['ready', 'subscribed'])('reads the processed height of a %s message', (type) => {
    expect(
      parseIndexerSocketMessage({
        type,
        block: 10_928,
        blockTime: '2026-07-18T07:00:00Z',
        blockIntervalMs: 6000,
      })
    ).toEqual(
      type === 'ready'
        ? { type, processedHeight: 10_927, blockTime: '2026-07-18T07:00:00Z', blockIntervalMs: 6000 }
        : { type, processedHeight: 10_927, blockTime: '2026-07-18T07:00:00Z' }
    )
  })

  it('accepts a block envelope and keeps its own height', () => {
    expect(
      parseIndexerSocketMessage({
        type: 'block',
        block: 10_928,
        blockTime: '2026-07-18T07:00:00Z',
        events: [],
      })
    ).toEqual({ type: 'block', height: 10_928, blockTime: '2026-07-18T07:00:00Z', events: [] })
  })

  it('maps the routing fields and the dedupe key of an event', () => {
    const message = parseIndexerSocketMessage({ type: 'block', block: 102, events: [participantEvent] })
    expect(message).toEqual({
      type: 'block',
      height: 102,
      blockTime: null,
      events: [
        {
          eventType: 'StartParticipantOP',
          module: 'pp',
          did: 'did:web:participant.example',
          relatedDids: [],
          blockHeight: 102,
          txHash: 'AB12',
          messageIndex: 0,
          sender: 'verana1sender',
          grantee: null,
          corporationId: 7,
          relatedCorporationIds: [],
        },
      ],
    })
    expect(indexerEventKey(event({}))).toBe('AB12#0')
  })

  it('keeps the sound events of a batch when one entry is malformed', () => {
    const message = parseIndexerSocketMessage({
      type: 'block',
      block: 102,
      events: [participantEvent, malformedEvent, { ...participantEvent, tx_hash: 'EF56' }],
    })
    expect(message?.type).toBe('block')
    expect(message?.type === 'block' && message.events.map((entry) => entry.txHash)).toEqual(['AB12', 'EF56'])
  })

  it('ignores legacy and malformed messages', () => {
    expect(parseIndexerSocketMessage({ type: 'block-indexed', height: 10_928 })).toBeNull()
    expect(parseIndexerSocketMessage({ type: 'block', block: '10928' })).toBeNull()
  })

  it('drops the unusable entries of the related DIDs and Corporation ids', () => {
    const message = parseIndexerSocketMessage({
      type: 'block',
      block: 102,
      events: [
        {
          ...participantEvent,
          did: AGENT_DID,
          payload: {
            ...participantEvent.payload,
            related_dids: ['did:web:validator.example', 7],
            related_corporation_ids: [43, 'nope'],
          },
        },
      ],
    })

    expect(message?.type === 'block' && message.events[0]).toMatchObject({
      did: AGENT_DID,
      relatedDids: ['did:web:validator.example'],
      relatedCorporationIds: [43],
    })
  })
})

describe('concernsCorporation', () => {
  it('matches on the Corporation ids of the payload', () => {
    expect(concernsCorporation(event({ corporationId: 42 }), 42, known)).toBe(true)
    expect(concernsCorporation(event({ relatedCorporationIds: [9, 42] }), 42, known)).toBe(true)
  })

  it('rejects another Corporation even when the event carries a known DID', () => {
    expect(concernsCorporation(event({ corporationId: 7, did: AGENT_DID }), 42, known)).toBe(false)
  })

  it('falls back to the known DIDs when the payload carries no Corporation id', () => {
    expect(concernsCorporation(event({ corporationId: null, did: AGENT_DID }), 42, known)).toBe(true)
    expect(concernsCorporation(event({ corporationId: null, relatedDids: [AGENT_DID] }), 42, known)).toBe(true)
    expect(concernsCorporation(event({ corporationId: null, did: 'did:web:other.example' }), 42, known)).toBe(false)
  })
})

describe('refreshesEntityLists', () => {
  it('skips the session and resolver events of the acting Corporation', () => {
    const session = event({ eventType: 'CreateOrUpdateParticipantSession', corporationId: 42 })
    const resolver = event({ eventType: 'TriggerResolver', corporationId: 42 })

    expect(refreshesEntityLists(session, 42, known)).toBe(false)
    expect(refreshesEntityLists(resolver, 42, known)).toBe(false)
    expect(refreshesEntityLists(event({ corporationId: 42 }), 42, known)).toBe(true)
  })
})

describe('parseIndexerBlockHeight', () => {
  it('accepts the live block-height response', () => {
    expect(
      parseIndexerBlockHeight({ type: 'block-indexed', height: 506_370, timestamp: '2026-09-07T17:28:06Z' })
    ).toEqual({ height: 506_370, timestamp: '2026-09-07T17:28:06Z' })
  })

  it('rejects malformed responses', () => {
    expect(parseIndexerBlockHeight({ height: '506370' })).toBeNull()
    expect(parseIndexerBlockHeight({ height: 1, timestamp: 5 })).toBeNull()
    expect(parseIndexerBlockHeight(null)).toBeNull()
  })
})

describe('parseIndexerEventsPage', () => {
  it('skips a malformed entry and keeps the rest of the page', () => {
    expect(parseIndexerEventsPage({ events: [participantEvent, malformedEvent], count: 2 })).toEqual([
      expect.objectContaining({ txHash: 'AB12' }),
    ])
  })

  it('rejects a page without its events envelope', () => {
    expect(parseIndexerEventsPage({ count: 0 })).toBeNull()
  })
})

describe('indexerEventsUrl', () => {
  it('scopes the replay to the corporation and the last seen height', () => {
    expect(indexerEventsUrl(7, 500)).toBe(
      'https://indexer.example/v4/indexer/events?corporation_id=7&after_block_height=500&limit=500'
    )
  })
})

describe('refreshTargets', () => {
  it.each([
    ['pp', ['attention', 'participants']],
    ['group', ['attention', 'corporationDetails']],
    ['de', ['attention', 'corporationDetails']],
    ['ec', ['ecosystems']],
    ['cs', ['credentialSchemas']],
    ['co', ['dashboard']],
    ['di', []],
  ])('routes a %s event', (module, targets) => {
    expect(refreshTargets(event({ module }))).toEqual(targets)
  })

  it('routes no refresh for the session and resolver events of the participant module', () => {
    expect(refreshTargets(event({ module: 'pp', eventType: 'CreateOrUpdateParticipantSession' }))).toEqual([])
    expect(refreshTargets(event({ module: 'pp', eventType: 'TriggerResolver' }))).toEqual([])
  })
})

describe('triggersDiscovery', () => {
  it('re-runs discovery for an operator grant of the connected account', () => {
    expect(
      triggersDiscovery(
        event({ module: 'de', eventType: 'GrantOperatorAuthorization', grantee: 'verana1me' }),
        'verana1me'
      )
    ).toBe(true)
  })

  it('ignores an operator grant of another account', () => {
    expect(
      triggersDiscovery(
        event({ module: 'de', eventType: 'GrantOperatorAuthorization', grantee: 'verana1other' }),
        'verana1me'
      )
    ).toBe(false)
  })

  it('re-runs discovery for a membership change and not for a vote', () => {
    expect(triggersDiscovery(event({ module: 'group', eventType: 'UpdateGroupMembers' }), 'verana1me')).toBe(true)
    expect(triggersDiscovery(event({ module: 'group', eventType: 'Vote' }), 'verana1me')).toBe(false)
  })
})
