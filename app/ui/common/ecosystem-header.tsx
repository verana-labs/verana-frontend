'use client'

import { BabyIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useDidTrustEnrichment } from '@/hooks/useDidTrustEnrichment'
import { serviceAvatarUrl } from '@/lib/resolverClient'
import ClaimText from '@/ui/common/claim-text'
import LogoImage from '@/ui/common/logo-image'
import { ToneTag } from '@/ui/common/tone-tag'
import TrustBadge from '@/ui/common/trust-badge'
import { DotPattern } from '@/ui/dashboard/dot-pattern'
import { CopyButton } from '@/ui/ecosystem-detail/copy-button'
import { shortenDID, shortenMiddle } from '@/util/util'

export type EcosystemStatus = 'ARCHIVED'

export type EcosystemHeaderProps = {
  did: string
  status?: EcosystemStatus
  meta?: ReactNode
  actions?: ReactNode
  aside?: ReactNode
}

export default function EcosystemHeader({ did, status, meta, actions, aside }: EcosystemHeaderProps) {
  const { data: enrichment } = useDidTrustEnrichment(did)
  const description = enrichment?.serviceDescription
  const minAgeRaw = enrichment?.serviceMinAge
  const minAgeNum = minAgeRaw != null ? Number(minAgeRaw) : NaN
  const showMinAge = Number.isFinite(minAgeNum) && minAgeNum >= 0
  const displayName = enrichment?.serviceName ?? enrichment?.organizationName ?? did
  const nameIsDid = displayName === did

  return (
    <section className="relative isolate mb-4 overflow-hidden rounded-2xl bg-linear-to-br from-primary/10 via-card to-card p-5 shadow-card sm:mb-5 sm:p-6 dark:from-primary/15">
      <DotPattern
        width={16}
        height={16}
        className="-z-10 text-primary/25 [mask-image:radial-gradient(320px_circle_at_top_right,white,transparent)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 -right-20 -z-10 size-72 rounded-full bg-primary/15 blur-3xl dark:bg-primary/20"
      />
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-6">
        <div className="flex min-w-0 flex-1 items-start gap-4 sm:gap-5">
          <div className="size-14 shrink-0 overflow-hidden rounded-2xl bg-card p-1 shadow-card ring-1 ring-primary/10 sm:size-20">
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
                <ToneTag tone="destructive" dot className="h-6 tracking-wide">
                  ARCHIVED
                </ToneTag>
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
                  <ToneTag className="h-6 text-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <BabyIcon aria-hidden="true" className="size-3.5 text-muted-foreground" />
                      {minAgeNum}+
                    </span>
                  </ToneTag>
                ) : null}
                {meta}
              </div>
            ) : null}
          </div>
        </div>

        {actions || aside ? (
          <div className="flex shrink-0 flex-col gap-4 md:items-end">
            {actions ? <div className="flex flex-wrap items-start gap-2 md:justify-end">{actions}</div> : null}
            {aside}
          </div>
        ) : null}
      </div>
    </section>
  )
}
