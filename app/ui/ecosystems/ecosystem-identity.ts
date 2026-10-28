'use client'

import { useDidTrustEnrichment } from '@/hooks/useDidTrustEnrichment'
import { displayedVersion } from '@/lib/gf-document'
import type { DidEnrichment } from '@/lib/resolverClient'
import type { EcosystemListItem } from '@/ui/datatable/columnslist/ecosystem'
import { countryCodeToFlag, shortenDID } from '@/util/util'

const ECOSYSTEM_ROLES = ['ECOSYSTEM', 'ISSUER_GRANTOR', 'VERIFIER_GRANTOR', 'ISSUER', 'VERIFIER', 'HOLDER'] as const
export type EcosystemRole = (typeof ECOSYSTEM_ROLES)[number]

export type EcosystemCardData = Pick<
  EcosystemListItem,
  | 'id'
  | 'did'
  | 'archived'
  | 'activeVersion'
  | 'activeSchemas'
  | 'participants'
  | 'weight'
  | 'issued'
  | 'verified'
  | 'versions'
> & { role?: string }

export function parseRoles(role: string | undefined | null): EcosystemRole[] {
  if (!role) return []
  const valid = new Set<EcosystemRole>(ECOSYSTEM_ROLES)
  const seen = new Set<EcosystemRole>()
  for (const r of role.split(/[,\s]+/)) {
    const up = r.trim().toUpperCase() as EcosystemRole
    if (valid.has(up)) seen.add(up)
  }
  return [...seen]
}

export function ecosystemHref(id: string): string {
  return `/ecosystems/${encodeURIComponent(id)}`
}

export function useEcosystemIdentity(ecosystem: EcosystemCardData, enrichment?: DidEnrichment) {
  const { data: resolved } = useDidTrustEnrichment(enrichment ? undefined : ecosystem.did)
  const identity = enrichment ?? resolved
  const shortDid = shortenDID(ecosystem.did) ?? ecosystem.did
  const countryCode = identity?.countryCode?.trim()

  return {
    identity,
    name: identity?.serviceName ?? shortDid,
    nameIsDid: !identity?.serviceName,
    orgName: identity?.organizationName || undefined,
    description: identity?.serviceDescription,
    descriptionFormat: identity?.serviceDescriptionFormat,
    trustStatus: identity?.trustStatus,
    flag: countryCode ? countryCodeToFlag(countryCode) : null,
    countryCode,
    egfHref: displayedVersion(ecosystem.versions ?? [], ecosystem.activeVersion)?.documents[0]?.url,
    roles: parseRoles(ecosystem.role),
    archived: Boolean(ecosystem.archived),
  }
}
