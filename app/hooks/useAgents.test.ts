import { describe, expect, it } from 'vitest'
import {
  AGENTS_PAGE_SIZE,
  agentEcosystemsUrl,
  agentParticipantsUrl,
  agentRefreshNeeded,
  buildAgentList,
} from '@/hooks/useAgents'
import type { IndexerEntityEvent } from '@/lib/indexer-event'

const CORPORATION_DID = 'did:web:corp.example'
const ECOSYSTEM_DID = 'did:web:ecosystem.example'
const AGENT_DID = 'did:web:agent.example'

function event(overrides: Partial<IndexerEntityEvent>): IndexerEntityEvent {
  return {
    eventType: 'participant_updated',
    module: 'pp',
    did: null,
    relatedDids: [],
    corporationId: null,
    relatedCorporationIds: [],
    ...overrides,
  }
}

describe('buildAgentList', () => {
  it('pins the Corporation DID first, then the Ecosystem DIDs, then the Participant DIDs', () => {
    expect(
      buildAgentList({
        corporationDid: CORPORATION_DID,
        ecosystemDids: [ECOSYSTEM_DID],
        participantDids: [AGENT_DID],
      })
    ).toEqual([
      { did: CORPORATION_DID, label: 'corporation', pinned: true },
      { did: ECOSYSTEM_DID, label: 'ecosystem', pinned: true },
      { did: AGENT_DID, label: null, pinned: false },
    ])
  })

  it('keeps one card in its pinned position when a pinned DID is also a Participant DID', () => {
    const agents = buildAgentList({
      corporationDid: CORPORATION_DID,
      ecosystemDids: [ECOSYSTEM_DID, ECOSYSTEM_DID],
      participantDids: [ECOSYSTEM_DID, CORPORATION_DID, AGENT_DID],
    })

    expect(agents.map((agent) => agent.did)).toEqual([CORPORATION_DID, ECOSYSTEM_DID, AGENT_DID])
    expect(agents[1]).toEqual({ did: ECOSYSTEM_DID, label: 'ecosystem', pinned: true })
  })

  it('drops the Corporation DID when the Corporation entry carries none', () => {
    expect(buildAgentList({ corporationDid: '', ecosystemDids: [], participantDids: [AGENT_DID] })).toEqual([
      { did: AGENT_DID, label: null, pinned: false },
    ])
  })
})

describe('agentRefreshNeeded', () => {
  const known = new Set([CORPORATION_DID, AGENT_DID])

  it('refetches the lists for a Participant or Delegation event of the acting Corporation', () => {
    expect(agentRefreshNeeded([event({ module: 'pp', corporationId: 7 })], 7, known).lists).toBe(true)
    expect(agentRefreshNeeded([event({ module: 'de', relatedCorporationIds: [7] })], 7, known).lists).toBe(true)
  })

  it('ignores the same event when it belongs to another Corporation', () => {
    expect(agentRefreshNeeded([event({ module: 'pp', corporationId: 8 })], 7, known).lists).toBe(false)
  })

  it('ignores list refreshes for modules other than Participant and Delegation', () => {
    expect(agentRefreshNeeded([event({ module: 'cs', corporationId: 7 })], 7, known).lists).toBe(false)
  })

  it('invalidates the resolve of every known DID the events touch, whatever the module', () => {
    const events = [
      event({ module: 'cs', did: AGENT_DID }),
      event({ module: 'es', relatedDids: [CORPORATION_DID, 'did:web:other.example'] }),
      event({ module: 'pp', did: AGENT_DID }),
    ]

    expect(agentRefreshNeeded(events, 7, known).dids).toEqual([AGENT_DID, CORPORATION_DID])
  })
})

describe('the agent list reads both sources as cursor pages', () => {
  const PARTICIPANT = 'https://indexer/v4/participant'
  const ECOSYSTEM = 'https://indexer/v4/ecosystem'

  it('asks for one page of the Corporation ACTIVE participants, newest first', () => {
    expect(agentParticipantsUrl(PARTICIPANT, 13, false, AGENTS_PAGE_SIZE)).toBe(
      'https://indexer/v4/participant/list?corporation_id=13&limit=26&sort=-id&participant_state=ACTIVE'
    )
  })

  it('drops the state filter when the inactive agents are included', () => {
    expect(agentParticipantsUrl(PARTICIPANT, 13, true, AGENTS_PAGE_SIZE)).not.toContain('participant_state')
  })

  it('carries the last row of the window as the descending cursor', () => {
    expect(agentParticipantsUrl(PARTICIPANT, 13, true, AGENTS_PAGE_SIZE, '40')).toContain('max_id=40')
    expect(agentEcosystemsUrl(ECOSYSTEM, 13, AGENTS_PAGE_SIZE, '40')).toBe(
      'https://indexer/v4/ecosystem/list?corporation_id=13&limit=26&sort=-id&max_id=40'
    )
  })

  it('never falls back to one capped request', () => {
    for (const url of [
      agentParticipantsUrl(PARTICIPANT, 13, false, AGENTS_PAGE_SIZE),
      agentEcosystemsUrl(ECOSYSTEM, 13, AGENTS_PAGE_SIZE),
    ]) {
      expect(url).not.toContain('limit=1024')
      expect(url).toContain('sort=-id')
    }
  })
})
