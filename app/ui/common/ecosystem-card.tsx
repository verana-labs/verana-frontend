'use client'

import { ArchiveIcon, ArrowUpRightIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { type DidEnrichment, serviceAvatarUrl, serviceIdenticonUrl } from '@/lib/resolverClient'
import { trustStateBadge } from '@/lib/trust-state'
import { cn } from '@/lib/utils'
import ClaimText from '@/ui/common/claim-text'
import LogoImage from '@/ui/common/logo-image'
import TrustBadge from '@/ui/common/trust-badge'
import { type EcosystemCardData, ecosystemHref, useEcosystemIdentity } from '@/ui/ecosystems/ecosystem-identity'
import { statLabel, tr } from '@/ui/ecosystems/i18n'
import { interactiveCard } from '@/ui/motion/interaction'
import { Badge } from '@/ui/shadcn/badge'
import { formatNumber, formatVNAFromUVNA, roleBadgeClass, shortenMiddle } from '@/util/util'

export const CARD_BODY_CLASS = 'grid h-full min-h-[20.25rem] grid-rows-[5rem_3.25rem_1.5rem_1fr] gap-3 p-4 sm:p-6'

const ROLE_PILL_CLASS =
  'inline-flex h-5 min-w-0 max-w-[8.5rem] items-center rounded-full px-2 text-[11px] font-medium tracking-wide'

type Props = {
  ecosystem: EcosystemCardData
  enrichment?: DidEnrichment
}

type EcosystemIdentity = ReturnType<typeof useEcosystemIdentity>

export default function EcosystemCard({ ecosystem, enrichment }: Props) {
  const router = useRouter()
  const eco = useEcosystemIdentity(ecosystem, enrichment)
  const visibleRoles = eco.roles.slice(0, 2)
  const extraRoles = eco.roles.slice(visibleRoles.length)

  const handleClick = () => router.push(ecosystemHref(ecosystem.id))

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
        'flex h-full cursor-pointer flex-col overflow-hidden rounded-xl bg-card text-card-foreground shadow-card',
        interactiveCard,
        eco.archived && 'bg-muted/40 dark:bg-muted/30'
      )}
    >
      <div className="flex flex-col gap-3.5 p-5">
        <div className="flex min-w-0 items-start gap-3.5">
          <LogoImage
            src={eco.identity?.serviceLogoUrl}
            fallbackSrc={serviceIdenticonUrl(ecosystem.did)}
            className={cn(
              'size-12 shrink-0 rounded-lg bg-background object-contain ring-1 ring-border',
              eco.archived && 'grayscale'
            )}
          />
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-start gap-2">
              <h2
                className={cn(
                  'min-w-0 flex-1 leading-snug font-semibold tracking-tight',
                  eco.nameIsDid ? 'truncate font-mono text-[13px]' : 'line-clamp-2 text-[15px] break-words'
                )}
                title={eco.nameIsDid ? ecosystem.did : eco.name}
              >
                {eco.nameIsDid ? shortenMiddle(ecosystem.did, 26) : eco.name}
              </h2>
              <TrustBadge state={eco.trustStatus} size="md" className="mt-0.5" />
            </div>
            <OrganizationLine eco={eco} />
          </div>
        </div>

        {eco.description ? (
          <ClaimText
            text={eco.description}
            format={eco.descriptionFormat}
            className="line-clamp-2 text-sm leading-5 break-words text-muted-foreground"
            title={eco.description}
          />
        ) : eco.nameIsDid ? null : (
          <p className="truncate font-mono text-xs leading-5 text-muted-foreground" title={ecosystem.did}>
            {ecosystem.did}
          </p>
        )}

        {eco.roles.length > 0 || eco.archived ? (
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            {eco.archived ? (
              <Badge variant="outline" className="text-muted-foreground">
                <ArchiveIcon data-icon="inline-start" aria-hidden="true" />
                {tr('ecosystems.card.archived', 'Archived')}
              </Badge>
            ) : null}
            {visibleRoles.map((role) => (
              <span key={role} className={cn(ROLE_PILL_CLASS, roleBadgeClass(role))} title={role}>
                <span className="truncate">{role}</span>
              </span>
            ))}
            {extraRoles.length > 0 ? (
              <span className={cn(ROLE_PILL_CLASS, 'bg-muted text-muted-foreground')} title={extraRoles.join(', ')}>
                +{extraRoles.length}
              </span>
            ) : null}
          </div>
        ) : null}
        {visibleRoles.length === 0 ? (
          <span className="sr-only">{tr('datatable.ecosystem.card.noRoles', 'No roles')}</span>
        ) : null}
      </div>

      <dl className="mt-auto grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border px-5 py-4">
        <Stat
          label={statLabel('datatable.ecosystem.card.activeSchemas', 'Active Schemas')}
          value={ecosystem.activeSchemas}
        />
        <Stat
          label={statLabel('datatable.ecosystem.card.participants', 'Participants')}
          value={ecosystem.participants}
        />
        <Stat
          label={statLabel('datatable.ecosystem.card.issuedCredentials', 'Issued Credentials')}
          value={ecosystem.issued}
        />
        <Stat
          label={statLabel('datatable.ecosystem.card.verifiedCredentials', 'Verified Credentials')}
          value={ecosystem.verified}
        />
      </dl>

      <div className="flex min-h-11 items-center justify-between gap-3 border-t border-border bg-muted/50 px-5 py-2.5 text-xs dark:bg-muted/30">
        <TrustValue weight={ecosystem.weight} />
        {eco.egfHref ? (
          <a
            href={eco.egfHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="-mx-1.5 inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 font-medium text-primary transition-colors duration-(--duration-base) hover:bg-primary/10 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {tr('datatable.ecosystem.card.egf', 'EGF')}
            <ArrowUpRightIcon className="size-3.5" aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </div>
  )
}

function OrganizationLine({ eco }: { eco: EcosystemIdentity }) {
  if (eco.orgName) {
    return (
      <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
        <LogoImage
          src={eco.identity?.organizationLogoUrl}
          fallbackSrc={serviceAvatarUrl(eco.orgName)}
          className="size-5 shrink-0 rounded-sm object-contain"
        />
        <span className="truncate font-medium" title={eco.orgName}>
          {eco.orgName}
        </span>
        {eco.flag ? (
          <span className="shrink-0 text-sm leading-none" title={eco.countryCode} aria-hidden="true">
            {eco.flag}
          </span>
        ) : null}
      </div>
    )
  }
  if (!eco.identity || eco.trustStatus === 'TRUSTED') return null
  return <p className="mt-1 text-xs text-muted-foreground">{trustStateBadge(eco.trustStatus).label}</p>
}

export function TrustValue({ weight }: { weight: string | null | undefined }) {
  const value = formatVNAFromUVNA(weight == null ? null : String(weight))
  return (
    <div className="flex min-w-0 items-baseline gap-2">
      <span className="shrink-0 text-muted-foreground">
        {statLabel('datatable.ecosystem.card.trustValue', 'Trust Value')}
      </span>
      <span className="truncate font-mono font-medium text-foreground tabular-nums" title={value}>
        {value}
      </span>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  const formatted = formatNumber(value, true, true)
  return (
    <div className="min-w-0">
      <dt className="truncate text-xs text-muted-foreground" title={label}>
        {label}
      </dt>
      <dd className="mt-0.5 text-lg leading-6 font-semibold tracking-tight tabular-nums" title={formatted}>
        {formatted}
      </dd>
    </div>
  )
}
