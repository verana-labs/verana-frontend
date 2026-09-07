import type { DidTrustState } from '@/lib/resolverClient'
import type { EcosystemListItem } from '@/ui/datatable/columnslist/ecosystem'

const TRUST_RANK: Record<DidTrustState, number> = { TRUSTED: 0, UNTRUSTED: 1, UNRESOLVED: 2 }

function trustRank(ecosystem: EcosystemListItem): number {
  return TRUST_RANK[ecosystem.trust?.trustStatus ?? 'UNRESOLVED']
}

export function byTrustThenLockedValue(a: EcosystemListItem, b: EcosystemListItem): number {
  const rank = trustRank(a) - trustRank(b)
  if (rank !== 0) return rank
  const weight = BigInt(b.weight) - BigInt(a.weight)
  if (weight > BigInt(0)) return 1
  return weight < BigInt(0) ? -1 : 0
}
