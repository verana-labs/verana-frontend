import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  AGENTS_PAGE_SIZE,
  agentPendingUrl,
  agentRefreshNeeded,
  allPages,
  buildAgentList,
  fetchAgentDelegations,
  withPendingAccreditations,
} from '@/hooks/useAgents'
import type { IndexerEvent } from '@/lib/indexer-event'
import { logger } from '@/lib/logger'
import type { ResolvedParticipation } from '@/lib/resolverClient'
import type { Participant } from '@/ui/dataview/datasections/participant'

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

function participation(overrides: Partial<ResolvedParticipation>): ResolvedParticipation {
  return {
    id: 161,
    vsOperator: null,
    role: 'VERIFIER',
    state: 'ACTIVE',
    credentialSchemaId: 22,
    ecosystemId: 13,
    validatorParticipantId: 158,
    ...overrides,
  }
}

function pendingParticipant(overrides: Partial<Participant>): Participant {
  return {
    id: '164',
    schema_id: '22',
    ecosystem_id: 13,
    role: 'ISSUER',
    did: AGENT_DID,
    corporation_id: 32,
    participant_state: 'INACTIVE',
    op_state: 'PENDING',
    validator_participant_id: '158',
    vs_operator: null,
    corporation_available_actions: [],
    validator_available_actions: [],
    ...overrides,
  }
}

describe('agentPendingUrl', () => {
  it('lists the pending onboarding processes of the acting Corporation', () => {
    expect(agentPendingUrl('https://indexer/v4/participant', 32, AGENTS_PAGE_SIZE)).toBe(
      `https://indexer/v4/participant/list?corporation_id=32&limit=${AGENTS_PAGE_SIZE + 1}&sort=-id&op_state=PENDING`
    )
  })
})

describe('withPendingAccreditations', () => {
  it('shows the indexer state and the pending onboarding of a row the resolver reports as ACTIVE', () => {
    const rows = withPendingAccreditations(
      AGENT_DID,
      [participation({}), participation({ id: 164, role: 'ISSUER' })],
      [pendingParticipant({})]
    )
    expect(rows).toEqual([
      participation({}),
      { ...participation({ id: 164, role: 'ISSUER', state: 'INACTIVE' }), opState: 'PENDING' },
    ])
  })

  it('adds a pending row the resolver left out of the ACTIVE scope', () => {
    expect(withPendingAccreditations(AGENT_DID, [participation({})], [pendingParticipant({})])).toEqual([
      participation({}),
      { ...participation({ id: 164, role: 'ISSUER', state: 'INACTIVE' }), opState: 'PENDING' },
    ])
  })

  it('keeps ACTIVE on a renewal pending on an active row', () => {
    const rows = withPendingAccreditations(
      AGENT_DID,
      [participation({})],
      [pendingParticipant({ id: '161', role: 'VERIFIER', participant_state: 'ACTIVE' })]
    )
    expect(rows).toEqual([{ ...participation({}), opState: 'PENDING' }])
  })

  it('ignores the pending rows of another DID', () => {
    expect(
      withPendingAccreditations(AGENT_DID, [participation({})], [pendingParticipant({ did: 'did:web:other.example' })])
    ).toEqual([participation({})])
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

describe('fetchAgentDelegations', () => {
  const authorization = (id: number) => ({
    id,
    vs_operator: `verana1vsop${id}`,
    records: [{ participant_id: id, msg_types: [] }],
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('reads every VS operator authorization when the windows end', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({ authorizations: [authorization(2), authorization(1)] }) }))
    )

    const delegations = await fetchAgentDelegations(13)

    expect(delegations.partial).toBe(false)
    expect(delegations.value.map((row) => row.participantId)).toEqual([2, 1])
  })

  it('flags the delegations as partial when a later window cannot be read', async () => {
    vi.spyOn(logger, 'error').mockImplementation(() => {})
    const firstWindow = Array.from({ length: 1024 }, (_, index) => authorization(5000 - index))
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.includes('max_id=')
          ? { ok: false, status: 502, json: async () => ({}) }
          : { ok: true, json: async () => ({ authorizations: firstWindow }) }
      )
    )

    const delegations = await fetchAgentDelegations(13)

    expect(delegations.partial).toBe(true)
    expect(delegations.value).toHaveLength(1023)
  })
})
