import { describe, expect, it } from 'vitest'
import type { DidEnrichment } from '@/lib/resolverClient'
import type { EcosystemListItem } from '@/ui/datatable/columnslist/ecosystem'
import {
  cardRoles,
  clientPage,
  type DiscoverFilters,
  distinctRoles,
  filterEcosystems,
  groupRolesByEcosystem,
  groupRolesBySchema,
  INITIAL_DISCOVER_FILTERS,
  needsFullWindow,
  orderEcosystems,
  roleFiltersPending,
} from './discover-list'

function ecosystem(id: string, overrides: Partial<EcosystemListItem> = {}): EcosystemListItem {
  return {
    id,
    did: `did:web:ecosystem-${id}.example`,
    corporationId: Number(id),
    created: '2026-09-01T00:00:00Z',
    modified: '2026-09-01T00:00:00Z',
    language: 'en',
    activeVersion: 1,
    activeSchemas: 1,
    participants: 0,
    weight: '0',
    issued: 0,
    verified: 0,
    archived: null,
    ...overrides,
  }
}

function trust(trustStatus: DidEnrichment['trustStatus'], serviceName?: string): DidEnrichment {
  return { did: 'did:web:x', trustStatus, serviceName }
}

const noScope = { actingCorporationId: undefined, rolesByEcosystem: {} }
const filters = (overrides: Partial<DiscoverFilters>) => ({ ...INITIAL_DISCOVER_FILTERS, ...overrides })
const ids = (list: EcosystemListItem[]) => list.map((item) => item.id)

describe('filterEcosystems', () => {
  const list = [
    ecosystem('1', { trustData: trust('TRUSTED', 'Acme Trust Registry') }),
    ecosystem('2', { trustData: trust('UNTRUSTED', 'Shady Registry') }),
    ecosystem('3', { trustData: trust('UNRESOLVED') }),
    ecosystem('4', { archived: '2026-09-02T00:00:00Z' }),
  ]

  it('lists every non-archived ecosystem whatever its trust state by default', () => {
    expect(ids(filterEcosystems(list, INITIAL_DISCOVER_FILTERS, noScope))).toEqual(['1', '2', '3'])
  })

  it('keeps archived ecosystems when asked', () => {
    expect(ids(filterEcosystems(list, filters({ showArchived: true }), noScope))).toEqual(['1', '2', '3', '4'])
  })

  it('hides only untrusted ecosystems, not unresolved ones, when untrusted are not shown', () => {
    expect(ids(filterEcosystems(list, filters({ showUntrusted: false }), noScope))).toEqual(['1', '3'])
  })

  it('searches the resolved service name, case insensitive', () => {
    expect(ids(filterEcosystems(list, filters({ search: '  acme ' }), noScope))).toEqual(['1'])
  })

  it('searches the DID', () => {
    expect(ids(filterEcosystems(list, filters({ search: 'ecosystem-3' }), noScope))).toEqual(['3'])
  })

  it('searches the ecosystem id and the controlling corporation id, like the ecosystems page', () => {
    const plain = [
      ecosystem('9441', { did: 'did:web:alpha.example', corporationId: 13 }),
      ecosystem('9442', { did: 'did:web:beta.example', corporationId: 27 }),
    ]
    expect(ids(filterEcosystems(plain, filters({ search: '9442' }), noScope))).toEqual(['9442'])
    expect(ids(filterEcosystems(plain, filters({ search: ' 13' }), noScope))).toEqual(['9441'])
  })

  it('hides the ecosystems the acting corporation controls or holds an ECOSYSTEM participant in', () => {
    const scope = { actingCorporationId: 1, rolesByEcosystem: { '3': distinctRoles(['ECOSYSTEM']) } }
    expect(ids(filterEcosystems(list, filters({ hideOwned: true }), scope))).toEqual(['2'])
  })

  it('hides the ecosystems where the acting corporation holds another role', () => {
    const scope = {
      actingCorporationId: 9,
      rolesByEcosystem: { '1': ['ECOSYSTEM' as const], '2': ['HOLDER' as const] },
    }
    expect(ids(filterEcosystems(list, filters({ hideParticipant: true }), scope))).toEqual(['1', '3'])
  })

  it('ignores the corporation filters in guest mode', () => {
    expect(ids(filterEcosystems(list, filters({ hideOwned: true, hideParticipant: true }), noScope))).toEqual([
      '1',
      '2',
      '3',
    ])
  })
})

describe('orderEcosystems', () => {
  const list = [
    ecosystem('3', { weight: '5' }),
    ecosystem('2', { weight: '900000000000000000000' }),
    ecosystem('1', { weight: '5' }),
    ecosystem('0', { weight: '70' }),
  ]

  it('keeps the indexer order for newest first', () => {
    expect(ids(orderEcosystems(list, 'newest'))).toEqual(['3', '2', '1', '0'])
  })

  it('orders by locked trust value, largest first, beyond the safe integer range, stable on ties', () => {
    expect(ids(orderEcosystems(list, 'trustValue'))).toEqual(['2', '0', '3', '1'])
  })

  it('does not reorder the input', () => {
    orderEcosystems(list, 'trustValue')
    expect(ids(list)).toEqual(['3', '2', '1', '0'])
  })
})

describe('distinctRoles', () => {
  it('deduplicates roles in the badge order', () => {
    expect(distinctRoles(['HOLDER', 'ISSUER', 'ECOSYSTEM', 'ISSUER', 'VERIFIER_GRANTOR'])).toEqual([
      'ECOSYSTEM',
      'VERIFIER_GRANTOR',
      'ISSUER',
      'HOLDER',
    ])
  })
})

describe('groupRolesByEcosystem', () => {
  it('groups the corporation participants by ecosystem, each role once in the badge order', () => {
    expect(
      groupRolesByEcosystem([
        { ecosystem_id: 44, role: 'HOLDER' },
        { ecosystem_id: 45, role: 'ECOSYSTEM' },
        { ecosystem_id: 44, role: 'ISSUER' },
        { ecosystem_id: 44, role: 'HOLDER' },
      ])
    ).toEqual({ '44': ['ISSUER', 'HOLDER'], '45': ['ECOSYSTEM'] })
  })

  it('skips a participant the indexer did not tie to an ecosystem', () => {
    expect(groupRolesByEcosystem([{ ecosystem_id: null, role: 'ISSUER' }, { role: 'VERIFIER' }])).toEqual({})
  })

  it('leaves an ecosystem whose roles did not load in the role based filters instead of hiding it', () => {
    const list = [ecosystem('1'), ecosystem('2')]
    const scope = {
      actingCorporationId: 9,
      rolesByEcosystem: groupRolesByEcosystem([{ ecosystem_id: 1, role: 'HOLDER' }]),
    }
    expect(ids(filterEcosystems(list, filters({ hideParticipant: true }), scope))).toEqual(['2'])
  })
})

describe('roleFiltersPending', () => {
  it('holds the list only while roles load and a role based filter is on', () => {
    expect(roleFiltersPending(INITIAL_DISCOVER_FILTERS, true)).toBe(false)
    expect(roleFiltersPending(filters({ hideParticipant: true }), true)).toBe(true)
    expect(roleFiltersPending(filters({ hideOwned: true }), true)).toBe(true)
    expect(roleFiltersPending(filters({ hideOwned: true, hideParticipant: true }), false)).toBe(false)
  })
})

describe('needsFullWindow', () => {
  it('keeps keyset paging while nothing narrows or reorders the list', () => {
    expect(needsFullWindow(INITIAL_DISCOVER_FILTERS)).toBe(false)
    expect(needsFullWindow(filters({ search: '   ' }))).toBe(false)
    expect(needsFullWindow(filters({ showArchived: true }))).toBe(false)
  })

  it('loads the full window for a search, a client side filter or the trust value order', () => {
    expect(needsFullWindow(filters({ search: 'acme' }))).toBe(true)
    expect(needsFullWindow(filters({ showUntrusted: false }))).toBe(true)
    expect(needsFullWindow(filters({ hideOwned: true }))).toBe(true)
    expect(needsFullWindow(filters({ hideParticipant: true }))).toBe(true)
    expect(needsFullWindow(filters({ order: 'trustValue' }))).toBe(true)
  })
})

describe('clientPage', () => {
  const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g']

  it('slices one page and says which way more pages lie', () => {
    expect(clientPage(items, 0, 5)).toEqual({
      items: ['a', 'b', 'c', 'd', 'e'],
      page: 0,
      hasPrevious: false,
      hasNext: true,
    })
    expect(clientPage(items, 1, 5)).toEqual({ items: ['f', 'g'], page: 1, hasPrevious: true, hasNext: false })
  })

  it('clamps an index past the last page, as when a search shrinks the matches', () => {
    expect(clientPage(items, 4, 5).page).toBe(1)
    expect(clientPage(['a'], 3, 5)).toEqual({ items: ['a'], page: 0, hasPrevious: false, hasNext: false })
  })

  it('returns one empty page for no matches', () => {
    expect(clientPage([], 0, 5)).toEqual({ items: [], page: 0, hasPrevious: false, hasNext: false })
  })
})

describe('groupRolesBySchema', () => {
  it('groups the corporation participants by schema, each role once in the badge order', () => {
    expect(
      groupRolesBySchema([
        { schema_id: '7', role: 'VERIFIER' },
        { schema_id: '8', role: 'HOLDER' },
        { schema_id: '7', role: 'ISSUER' },
        { schema_id: '7', role: 'VERIFIER' },
      ])
    ).toEqual({ '7': ['ISSUER', 'VERIFIER'], '8': ['HOLDER'] })
  })
})

describe('cardRoles', () => {
  it('marks an ecosystem the acting corporation controls even before it has a root participant', () => {
    expect(cardRoles(ecosystem('1'), undefined, 1)).toEqual(['ECOSYSTEM'])
    expect(cardRoles(ecosystem('1'), ['ISSUER'], 1)).toEqual(['ECOSYSTEM', 'ISSUER'])
  })

  it('keeps the participant roles as they are for a joined ecosystem or a controller that already has one', () => {
    expect(cardRoles(ecosystem('1'), ['ISSUER', 'VERIFIER'], 9)).toEqual(['ISSUER', 'VERIFIER'])
    expect(cardRoles(ecosystem('1'), ['ECOSYSTEM'], 1)).toEqual(['ECOSYSTEM'])
  })
})
