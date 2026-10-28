'use client'

import { BabyIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useDidTrustEnrichment } from '@/hooks/useDidTrustEnrichment'
import { serviceAvatarUrl } from '@/lib/resolverClient'
import ClaimText from '@/ui/common/claim-text'
import LogoImage from '@/ui/common/logo-image'
import TrustBadge from '@/ui/common/trust-badge'
import { CopyButton } from '@/ui/ecosystem-detail/copy-button'
import { Badge } from '@/ui/shadcn/badge'
import { shortenDID, shortenMiddle } from '@/util/util'

export type EcosystemStatus = 'ARCHIVED'

export type EcosystemHeaderProps = {
  did: string
  status?: EcosystemStatus
  meta?: ReactNode
  actions?: ReactNode
}

export default function EcosystemHeader({ did, status, meta, actions }: EcosystemHeaderProps) {
  const { data: enrichment } = useDidTrustEnrichment(did)
  const description = enrichment?.serviceDescription
  const minAgeRaw = enrichment?.serviceMinAge
  const minAgeNum = minAgeRaw != null ? Number(minAgeRaw) : NaN
  const showMinAge = Number.isFinite(minAgeNum) && minAgeNum >= 0
  const displayName = enrichment?.serviceName ?? enrichment?.organizationName ?? did
  const nameIsDid = displayName === did

  return (
    <section className="mb-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-5">
        <div className="flex min-w-0 flex-1 items-start gap-4 sm:gap-5">
          <div className="size-14 shrink-0 overflow-hidden rounded-2xl bg-card p-1 shadow-card sm:size-20">
            <LogoImage
              src={enrichment?.serviceLogoUrl}
              fallbackSrc={serviceAvatarUrl(did)}
              className="size-full rounded-xl object-contain"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1
                className={
                  nameIsDid
                    ? 'min-w-0 font-mono text-lg font-semibold tracking-tight sm:text-xl'
                    : 'min-w-0 text-2xl font-semibold tracking-tight break-words sm:text-3xl'
                }
              >
                {nameIsDid ? (
                  <span title={did}>
                    <span aria-hidden="true" className="sm:hidden">
                      {shortenMiddle(did, 26)}
                    </span>
                    <span aria-hidden="true" className="hidden sm:inline">
                      {shortenDID(did)}
                    </span>
                    <span className="sr-only">{did}</span>
                  </span>
                ) : (
                  displayName
                )}
                <TrustBadge state={enrichment?.trustStatus} size="lg" className="ml-2.5 align-middle" />
                {nameIsDid ? <CopyButton value={did} className="ml-1 align-middle" /> : null}
              </h1>
              {status === 'ARCHIVED' ? (
                <Badge variant="destructive" className="h-6 px-2.5 tracking-wide">
                  ARCHIVED
                </Badge>
              ) : null}
            </div>

            {nameIsDid ? null : (
              <div className="mt-1.5 flex min-w-0 items-center gap-1 text-muted-foreground">
                <span className="truncate font-mono text-xs sm:text-sm" title={did}>
                  {did}
                </span>
                <CopyButton value={did} />
              </div>
            )}

            {description ? (
              <ClaimText
                text={description}
                format={enrichment?.serviceDescriptionFormat}
                className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground line-clamp-3"
              />
            ) : null}

            {showMinAge || meta ? (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {showMinAge ? (
                  <Badge variant="outline" className="h-6 gap-1.5 px-2.5 text-foreground">
                    <BabyIcon aria-hidden="true" className="text-muted-foreground" />
                    {minAgeNum}+
                  </Badge>
                ) : null}
                {meta}
              </div>
            ) : null}
          </div>
        </div>

        {actions ? <div className="flex shrink-0 flex-wrap items-start gap-2 md:justify-end">{actions}</div> : null}
      </div>
    </section>
  )
}
