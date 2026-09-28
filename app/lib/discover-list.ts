import type { EcosystemListItem } from '@/ui/datatable/columnslist/ecosystem'
import type { ParticipantRole } from '@/ui/dataview/datasections/participant'

export type EcosystemOrder = 'newest' | 'trustValue'

export type DiscoverFilters = {
  search: string
  showArchived: boolean
  hideOwned: boolean
  hideParticipant: boolean
  showUntrusted: boolean
  order: EcosystemOrder
}

export const INITIAL_DISCOVER_FILTERS: DiscoverFilters = {
  search: '',
  showArchived: false,
  hideOwned: false,
  hideParticipant: false,
  showUntrusted: true,
  order: 'newest',
}

export type DiscoverScope = {
  actingCorporationId: number | undefined
  rolesByEcosystem: Record<string, ParticipantRole[]>
}

const ROLE_ORDER: ParticipantRole[] = [
  'ECOSYSTEM',
  'ISSUER_GRANTOR',
  'VERIFIER_GRANTOR',
  'ISSUER',
  'VERIFIER',
  'HOLDER',
]

export function distinctRoles(roles: ParticipantRole[]): ParticipantRole[] {
  const present = new Set(roles)
  return ROLE_ORDER.filter((role) => present.has(role))
}

function matchesSearch(ecosystem: EcosystemListItem, term: string): boolean {
  if (!term) return true
  return [ecosystem.did, ecosystem.trustData?.serviceName, ecosystem.trustData?.organizationName].some((value) =>
    value?.toLowerCase().includes(term)
  )
}

export function filterEcosystems<T extends EcosystemListItem>(
  ecosystems: T[],
  filters: DiscoverFilters,
  scope: DiscoverScope
): T[] {
  const term = filters.search.trim().toLowerCase()
  return ecosystems.filter((ecosystem) => {
    const roles = scope.rolesByEcosystem[ecosystem.id] ?? []
    const owned = ecosystem.corporationId === scope.actingCorporationId || roles.includes('ECOSYSTEM')
    if (!filters.showArchived && ecosystem.archived) return false
    if (!filters.showUntrusted && ecosystem.trustData?.trustStatus === 'UNTRUSTED') return false
    if (filters.hideOwned && owned) return false
    if (filters.hideParticipant && roles.some((role) => role !== 'ECOSYSTEM')) return false
    return matchesSearch(ecosystem, term)
  })
}

export function orderEcosystems<T extends EcosystemListItem>(ecosystems: T[], order: EcosystemOrder): T[] {
  if (order === 'newest') return ecosystems
  return [...ecosystems].sort((a, b) => {
    const left = BigInt(a.weight)
    const right = BigInt(b.weight)
    if (left === right) return 0
    return left < right ? 1 : -1
  })
}
