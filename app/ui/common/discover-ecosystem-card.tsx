'use client'

import { ArrowUpRightIcon, LandmarkIcon } from 'lucide-react'
import Link from 'next/link'
import type { EcosystemSchemaPage } from '@/hooks/useCredentialSchemas'
import { serviceAvatarUrl, serviceIdenticonUrl } from '@/lib/resolverClient'
import { cn } from '@/lib/utils'
import ClaimText from '@/ui/common/claim-text'
import CsCard from '@/ui/common/cs-card'
import { EgfViewerToggle } from '@/ui/common/egf-viewer-toggle'
import { ShowMoreButton } from '@/ui/common/keyset-pagination'
import LogoImage from '@/ui/common/logo-image'
import TrustBadge from '@/ui/common/trust-badge'
import { DotPattern } from '@/ui/dashboard/dot-pattern'
import type { EcosystemListItem } from '@/ui/datatable/columnslist/ecosystem'
import type { ParticipantRole } from '@/ui/dataview/datasections/participant'
import { discoverText as t } from '@/ui/discover/text'
import { statLabel } from '@/ui/ecosystems/i18n'
import { Button } from '@/ui/shadcn/button'
import { countryCodeToFlag, formatNumber, formatVNAFromUVNA, roleBadgeClass, shortenDID } from '@/util/util'

type DiscoverEcosystemCardProps = {
  ecosystem: EcosystemListItem
  credentialSchemas: EcosystemSchemaPage
  schemasError: string | null
  moreSchemasFailed: boolean
  onLoadMoreSchemas: () => void
  roles: ParticipantRole[]
  canJoin: boolean
}

type Counter = { key: string; value: string; empty: boolean }

export function DiscoverEcosystemCard({
  ecosystem,
  credentialSchemas,
  schemasError,
  moreSchemasFailed,
  onLoadMoreSchemas,
  roles,
  canJoin,
}: DiscoverEcosystemCardProps) {
  const identity = ecosystem.trustData
  const serviceName = identity?.serviceName ?? shortenDID(ecosystem.did) ?? ecosystem.did
  const orgName = identity?.organizationName ?? shortenDID(ecosystem.did) ?? ecosystem.did
  const archived = Boolean(ecosystem.archived)
  const counters: Counter[] = [
    {
      key: 'datatable.ecosystem.card.activeSchemas',
      value: formatNumber(ecosystem.activeSchemas, true),
      empty: !ecosystem.activeSchemas,
    },
    {
      key: 'datatable.ecosystem.card.participants',
      value: formatNumber(ecosystem.participants, true),
      empty: !ecosystem.participants,
    },
    {
      key: 'datatable.ecosystem.card.trustValue',
      value: formatVNAFromUVNA(ecosystem.weight),
      empty: !ecosystem.weight || /^0*$/.test(ecosystem.weight),
    },
    {
      key: 'datatable.ecosystem.card.issuedCredentials',
      value: formatNumber(ecosystem.issued, true),
      empty: !ecosystem.issued,
    },
    {
      key: 'datatable.ecosystem.card.verifiedCredentials',
      value: formatNumber(ecosystem.verified, true),
      empty: !ecosystem.verified,
    },
  ]

  return (
    <article
      aria-label={serviceName}
      className={cn(
        '@container/eco group/eco relative isolate overflow-hidden rounded-xl bg-card text-card-foreground shadow-card transition-shadow duration-(--duration-base) ease-standard hover:shadow-raised',
        archived && 'archived-watermark'
      )}
    >
      <DotPattern
        width={18}
        height={18}
        className="-z-10 text-primary/20 [mask-image:radial-gradient(260px_circle_at_top_right,white,transparent)]"
      />
      <div className={cn('flex flex-col gap-5 p-4 sm:p-6', archived && 'archived-bg')}>
        <header className="flex flex-col gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <LogoImage
              src={identity?.serviceLogoUrl}
              fallbackSrc={serviceIdenticonUrl(ecosystem.did)}
              className="size-12 shrink-0 rounded-xl bg-background object-contain p-1 ring-1 ring-foreground/10 sm:size-14"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2">
                <h2
                  className="line-clamp-2 min-w-0 text-lg leading-snug font-semibold tracking-tight [overflow-wrap:anywhere] text-foreground"
                  title={serviceName}
                >
                  {serviceName}
                </h2>
                <span className="flex h-lh shrink-0 items-center text-lg leading-snug">
                  <TrustBadge state={identity?.trustStatus} size="xl" />
                </span>
              </div>
              {identity?.serviceDescription ? (
                <ClaimText
                  text={identity.serviceDescription}
                  format={identity.serviceDescriptionFormat}
                  className="mt-1 line-clamp-2 text-sm break-words text-muted-foreground"
                  title={identity.serviceDescription}
                />
              ) : null}
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-2">
            <LogoImage
              src={identity?.organizationLogoUrl}
              fallbackSrc={serviceAvatarUrl(identity?.organizationName ?? ecosystem.did)}
              className="size-5 shrink-0 rounded-md object-contain ring-1 ring-foreground/10"
            />
            <h3 className="truncate text-sm font-medium text-muted-foreground" title={orgName}>
              {orgName}
            </h3>
            <span className="text-base leading-none" aria-hidden="true">
              {countryCodeToFlag(identity?.countryCode)}
            </span>
          </div>
        </header>

        {roles.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">{t('discover.roles.label')}</span>
            {roles.map((role) => (
              <span
                key={role}
                className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                  roleBadgeClass(role)
                )}
              >
                {role}
              </span>
            ))}
          </div>
        ) : null}

        <dl className="grid grid-cols-2 gap-2 @md/eco:grid-cols-3 @2xl/eco:grid-cols-5">
          {counters.map(({ key, value, empty }) => (
            <div
              key={key}
              className={cn(
                'flex min-w-0 flex-col gap-1 rounded-lg px-3 py-2.5 ring-1 ring-inset last:col-span-2 @md/eco:last:col-span-1',
                empty ? 'bg-muted/40 ring-border/60' : 'bg-tint-accent ring-primary/10'
              )}
            >
              <dt className="text-xs text-pretty text-muted-foreground">{statLabel(key, t(key))}</dt>
              <dd
                className={cn(
                  'text-lg leading-tight font-semibold tracking-[-0.02em] break-words tabular-nums',
                  empty ? 'text-muted-foreground' : 'text-foreground'
                )}
              >
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <EgfViewerToggle versions={ecosystem.versions ?? []} activeVersion={ecosystem.activeVersion}>
          <Button asChild variant="outline" className="group/view">
            <Link href={`/ecosystems/${ecosystem.id}`}>
              <LandmarkIcon aria-hidden="true" />
              {t('discover.btn.view')}
              <ArrowUpRightIcon
                aria-hidden="true"
                className="text-muted-foreground transition-transform duration-(--duration-base) ease-emphasized group-hover/view:translate-x-0.5 group-hover/view:-translate-y-0.5"
              />
            </Link>
          </Button>
        </EgfViewerToggle>

        <div className="flex flex-col gap-3">
          {schemasError && !credentialSchemas.items.length ? (
            <div className="error-pane">{schemasError}</div>
          ) : (
            <>
              {credentialSchemas.items.map((schema) => (
                <CsCard
                  key={schema.id}
                  credentialSchema={schema}
                  joinHref={canJoin && !archived && !schema.archived ? `/participants/${schema.id}` : undefined}
                />
              ))}
              {moreSchemasFailed ? <p className="text-sm text-warning">{t('discover.cs.more.error')}</p> : null}
              {credentialSchemas.hasNext ? (
                <div>
                  <ShowMoreButton onClick={onLoadMoreSchemas} />
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </article>
  )
}
