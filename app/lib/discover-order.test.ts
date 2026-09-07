import { describe, expect, it } from 'vitest'
import type { EcosystemListItem } from '@/ui/datatable/columnslist/ecosystem'
import { byTrustThenLockedValue } from './discover-order'
import type { DidTrustState } from './resolverClient'

function ecosystem(id: string, weight: string, trustStatus?: DidTrustState): EcosystemListItem {
  return {
    id,
    did: `did:web:${id}.example`,
    corporationId: 1,
    created: '',
    modified: '',
    language: 'en',
    role: '',
    trust: trustStatus ? { did: `did:web:${id}.example`, trustStatus } : null,
    activeVersion: 1,
    activeSchemas: 1,
    participants: 0,
    weight,
    issued: 0,
    verified: 0,
    archived: null,
  }
}

describe('byTrustThenLockedValue', () => {
  it('puts trusted ecosystems first, then untrusted, then unresolved', () => {
    const sorted = [ecosystem('a', '5'), ecosystem('b', '5', 'UNTRUSTED'), ecosystem('c', '5', 'TRUSTED')].sort(
      byTrustThenLockedValue
    )
    expect(sorted.map((e) => e.id)).toEqual(['c', 'b', 'a'])
  })

  it('orders equal trust states by locked value descending without losing large amounts', () => {
    const sorted = [
      ecosystem('small', '1000', 'TRUSTED'),
      ecosystem('huge', '123456789012345678901', 'TRUSTED'),
      ecosystem('mid', '123456789012345678900', 'TRUSTED'),
    ].sort(byTrustThenLockedValue)
    expect(sorted.map((e) => e.id)).toEqual(['huge', 'mid', 'small'])
  })
})
