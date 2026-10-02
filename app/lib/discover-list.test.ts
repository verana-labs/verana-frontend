import { describe, expect, it } from 'vitest'
import type { DidEnrichment } from '@/lib/resolverClient'
import type { EcosystemListItem } from '@/ui/datatable/columnslist/ecosystem'
import {
  type DiscoverFilters,
  distinctRoles,
  filterEcosystems,
  INITIAL_DISCOVER_FILTERS,
  orderEcosystems,
  roleFiltersPending,
  settleRoleLookups,
} from './discover-list'

function ecosystem(id: string, overrides: Partial<EcosystemListItem> = {}): EcosystemListItem {
  return {
    id,
    did: `did:web:ecosystem-${id}.example`,
    corporationId: Number(id),
    created: '2026-09-01T00:00:00Z',
    modified: '2026-09-01T00:00:00Z',
    language: 'en',
    role: '',
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

describe('settleRoleLookups', () => {
  it('keeps the roles that resolved and names the ecosystems that failed', () => {
    const lookup = settleRoleLookups(
      ['1', '2', '3'],
      [
        { status: 'fulfilled', value: ['ISSUER'] },
        { status: 'rejected', reason: new Error('Error 502: indexer unavailable') },
        { status: 'fulfilled', value: [] },
      ]
    )
    expect(lookup).toEqual({
      rolesByEcosystem: { '1': ['ISSUER'], '3': [] },
      failedEcosystemIds: ['2'],
      failureReason: 'Error 502: indexer unavailable',
    })
  })

  it('keeps the first failure reason when several lookups fail', () => {
    const lookup = settleRoleLookups(
      ['1', '2'],
      [
        { status: 'rejected', reason: 'timeout' },
        { status: 'rejected', reason: new Error('later') },
      ]
    )
    expect(lookup.failedEcosystemIds).toEqual(['1', '2'])
    expect(lookup.failureReason).toBe('timeout')
  })

  it('leaves a failed ecosystem out of the role based filters instead of hiding it', () => {
    const list = [ecosystem('1'), ecosystem('2')]
    const { rolesByEcosystem } = settleRoleLookups(
      ['1', '2'],
      [
        { status: 'fulfilled', value: ['HOLDER'] },
        { status: 'rejected', reason: 'down' },
      ]
    )
    const scope = { actingCorporationId: 9, rolesByEcosystem }
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
