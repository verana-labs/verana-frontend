import { afterEach, describe, expect, it, vi } from 'vitest'
import { AGENTS_PAGE_SIZE, agentRefreshNeeded, allPages, buildAgentList } from '@/hooks/useAgents'
import type { IndexerEvent } from '@/lib/indexer-event'

const CORPORATION_DID = 'did:web:corp.example'
const ECOSYSTEM_DID = 'did:web:ecosystem.example'
const AGENT_DID = 'did:web:agent.example'

function event(overrides: Partial<IndexerEvent>): IndexerEvent {
  return {
    eventType: 'participant_updated',
    module: 'pp',
    did: null,
    relatedDids: [],
    blockHeight: 1,
    txHash: 'AB12',
    messageIndex: 0,
    sender: 'verana1sender',
    grantee: null,
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

describe('allPages', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const parse = (payload: unknown) => (payload as { items: { id: string }[] }).items
  const url = (after?: string) => `https://indexer/list${after ? `?max_id=${after}` : ''}`
  const rows = (count: number, from: number) => Array.from({ length: count }, (_, i) => ({ id: String(from - i) }))

  function stubPages(pages: { id: string }[][]) {
    const urls: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (requested: string) => {
        urls.push(requested)
        return { ok: true, json: async () => ({ items: pages[Math.min(urls.length - 1, pages.length - 1)] }) }
      })
    )
    return urls
  }

  it('follows the cursor to the end, so every controlled Ecosystem is pinned', async () => {
    const urls = stubPages([rows(AGENTS_PAGE_SIZE + 1, 30), rows(2, 4)])
    const page = await allPages(url, 'ctx', parse)
    expect(page.items).toHaveLength(AGENTS_PAGE_SIZE + 2)
    expect(urls).toEqual(['https://indexer/list', 'https://indexer/list?max_id=6'])
  })
})
