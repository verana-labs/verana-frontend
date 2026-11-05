'use client'

import { ArrowUpRightIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { type DidEnrichment, serviceAvatarUrl, serviceIdenticonUrl } from '@/lib/resolverClient'
import { cn } from '@/lib/utils'
import ClaimText from '@/ui/common/claim-text'
import LogoImage from '@/ui/common/logo-image'
import { RolePills } from '@/ui/common/role-pills'
import { ToneTag } from '@/ui/common/tone-tag'
import TrustBadge from '@/ui/common/trust-badge'
import { DotPattern } from '@/ui/dashboard/dot-pattern'
import type { ParticipantRole } from '@/ui/dataview/datasections/participant'
import { type EcosystemCardData, useEcosystemIdentity } from '@/ui/ecosystems/ecosystem-identity'
import { statLabel, tr } from '@/ui/ecosystems/i18n'
import { interactiveCard } from '@/ui/motion/interaction'
import { formatNumber, formatVNAFromUVNA } from '@/util/util'

export const CARD_BODY_CLASS = 'grid h-full min-h-[20.25rem] grid-rows-[5rem_3.25rem_1.5rem_1fr] gap-3 p-4 sm:p-6'

const NO_ROLES: ParticipantRole[] = []

type Props = {
  ecosystem: EcosystemCardData
  enrichment?: DidEnrichment
  roles?: ParticipantRole[]
  controlled?: boolean
}

export default function EcosystemCard({ ecosystem, enrichment, roles = NO_ROLES, controlled = false }: Props) {
  const router = useRouter()
  const eco = useEcosystemIdentity(ecosystem, enrichment)

  const handleClick = () => router.push(`/ecosystems/${encodeURIComponent(ecosystem.id)}`)

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={eco.name}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
      data-archived={eco.archived || undefined}
      className={cn(
        'group/eco relative isolate flex h-full cursor-pointer flex-col overflow-hidden rounded-xl bg-card text-card-foreground shadow-card',
        interactiveCard,
        eco.archived && 'bg-muted/40 dark:bg-muted/30'
      )}
    >
      <DotPattern
        width={16}
        height={16}
        className="-z-10 text-primary/20 transition-opacity duration-(--duration-slow) ease-standard [mask-image:radial-gradient(180px_circle_at_top_right,white,transparent)] opacity-70 group-hover/eco:opacity-100 motion-reduce:transition-none"
      />
      <div className="flex flex-col gap-3.5 p-5">
        <div className="flex min-w-0 items-start gap-3.5">
          <LogoImage
            src={eco.identity?.serviceLogoUrl}
            fallbackSrc={serviceIdenticonUrl(ecosystem.did)}
            className={cn(
              'size-12 shrink-0 rounded-xl bg-background object-contain shadow-xs ring-1 ring-border',
              eco.archived && 'grayscale'
            )}
          />
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-start gap-2">
              <h2
                className="line-clamp-2 min-w-0 flex-1 text-[15px] leading-snug font-semibold tracking-tight break-words"
                title={eco.name}
              >
                {eco.name}
              </h2>
              <TrustBadge state={eco.trustStatus} size="md" className="mt-0.5" />
            </div>
          </div>
        </div>

        {eco.description ? (
          <ClaimText
            text={eco.description}
            format={eco.descriptionFormat}
            className="line-clamp-2 text-sm leading-5 break-words text-muted-foreground"
            title={eco.description}
          />
        ) : null}

        <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <LogoImage
            src={eco.identity?.organizationLogoUrl}
            fallbackSrc={serviceAvatarUrl(eco.identity?.organizationName ?? ecosystem.did)}
            className="size-5 shrink-0 rounded-sm object-contain"
          />
          <span className="min-w-0 truncate font-medium" title={eco.orgName}>
            {eco.orgName}
          </span>
          {eco.flag ? (
            <span className="shrink-0 text-sm leading-none" aria-hidden="true">
              {eco.flag}
            </span>
          ) : null}
          {eco.egfHref ? (
            <a
              href={eco.egfHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="ms-auto inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 font-medium text-primary transition-colors duration-(--duration-base) hover:bg-tint-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {tr('datatable.ecosystem.card.egf', 'EGF')}
              <ArrowUpRightIcon className="size-3.5" aria-hidden="true" />
            </a>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {eco.archived ? <ToneTag dot>{tr('ecosystems.card.archived', 'Archived')}</ToneTag> : null}
          <RolePills roles={roles} controlled={controlled} />
        </div>
      </div>

      <dl className="mt-auto grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border px-5 py-4">
        <Stat
          label={statLabel('datatable.ecosystem.card.activeSchemas', 'Active Schemas')}
          value={formatNumber(ecosystem.activeSchemas, true)}
        />
        <Stat
          label={statLabel('datatable.ecosystem.card.participants', 'Participants')}
          value={formatNumber(ecosystem.participants, true)}
        />
        <div className="col-span-2 min-w-0">
          <Stat
            label={statLabel('datatable.ecosystem.card.trustValue', 'Trust Value')}
            value={formatVNAFromUVNA(ecosystem.weight == null ? null : String(ecosystem.weight))}
            mono
          />
        </div>
        <Stat
          label={statLabel('datatable.ecosystem.card.issuedCredentials', 'Issued Credentials')}
          value={formatNumber(ecosystem.issued, true)}
        />
        <Stat
          label={statLabel('datatable.ecosystem.card.verifiedCredentials', 'Verified Credentials')}
          value={formatNumber(ecosystem.verified, true)}
        />
      </dl>
    </div>
  )
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-xs text-muted-foreground" title={label}>
        {label}
      </dt>
      <dd
        className={cn(
          'mt-0.5 leading-6 font-semibold tracking-[-0.025em] [overflow-wrap:anywhere] tabular-nums',
          mono ? 'font-mono text-sm' : 'text-lg'
        )}
        title={value}
      >
        {value}
      </dd>
    </div>
  )
}
