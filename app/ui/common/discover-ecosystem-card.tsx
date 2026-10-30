'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRightIcon, LandmarkIcon, ScaleIcon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import type { EcosystemSchemaPage } from '@/hooks/useCredentialSchemas'
import { displayedVersion } from '@/lib/gf-document'
import { serviceAvatarUrl, serviceIdenticonUrl } from '@/lib/resolverClient'
import { cn } from '@/lib/utils'
import ClaimText from '@/ui/common/claim-text'
import GfDocumentViewer from '@/ui/common/gf-document-viewer'
import { ShowMoreButton } from '@/ui/common/keyset-pagination'
import LogoImage from '@/ui/common/logo-image'
import TrustBadge from '@/ui/common/trust-badge'
import { DotPattern } from '@/ui/dashboard/dot-pattern'
import type { EcosystemListItem } from '@/ui/datatable/columnslist/ecosystem'
import type { ParticipantRole } from '@/ui/dataview/datasections/participant'
import { SchemaCard } from '@/ui/discover/schema-card'
import { discoverText as t } from '@/ui/discover/text'
import { statLabel } from '@/ui/ecosystems/i18n'
import { DURATION, EASE } from '@/ui/motion/tokens'
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
  const [egfOpen, setEgfOpen] = useState(false)
  const identity = ecosystem.trustData
  const serviceName = identity?.serviceName ?? shortenDID(ecosystem.did) ?? ecosystem.did
  const orgName = identity?.organizationName
  const flag = identity?.countryCode ? countryCodeToFlag(identity.countryCode) : null
  const archived = Boolean(ecosystem.archived)
  const egfDocuments = displayedVersion(ecosystem.versions ?? [], ecosystem.activeVersion)?.documents ?? []
  const egfPanelId = `egf-panel-${ecosystem.id}`
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
  const hasSchemaSection = Boolean(schemasError) || credentialSchemas.items.length > 0 || moreSchemasFailed

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
        <header className="flex flex-col gap-4 @2xl/eco:flex-row @2xl/eco:items-start @2xl/eco:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <LogoImage
              src={identity?.serviceLogoUrl}
              fallbackSrc={serviceIdenticonUrl(ecosystem.did)}
              className="size-12 shrink-0 rounded-xl bg-background object-contain p-1 ring-1 ring-foreground/10 sm:size-14"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2
                  className="min-w-0 text-lg leading-snug font-semibold tracking-tight break-words text-foreground"
                  title={serviceName}
                >
                  {serviceName}
                </h2>
                <TrustBadge state={identity?.trustStatus} size="xl" />
              </div>
              {identity?.serviceDescription ? (
                <ClaimText
                  text={identity.serviceDescription}
                  format={identity.serviceDescriptionFormat}
                  className="mt-1 line-clamp-2 text-sm break-words text-muted-foreground"
                  title={identity.serviceDescription}
                />
              ) : null}
              {orgName ? (
                <div className="mt-2.5 flex min-w-0 items-center gap-2">
                  <LogoImage
                    src={identity?.organizationLogoUrl}
                    fallbackSrc={serviceAvatarUrl(orgName)}
                    className="size-5 shrink-0 rounded-md object-contain ring-1 ring-foreground/10"
                  />
                  <h3 className="truncate text-sm font-medium text-muted-foreground" title={orgName}>
                    {orgName}
                  </h3>
                  {flag ? (
                    <span className="text-base leading-none" aria-hidden="true">
                      {flag}
                    </span>
                  ) : null}
                </div>
              ) : (
                <h3 className="mt-1.5 truncate font-mono text-xs text-muted-foreground" title={ecosystem.did}>
                  {ecosystem.did}
                </h3>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            {egfDocuments.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                aria-expanded={egfOpen}
                aria-controls={egfPanelId}
                onClick={() => setEgfOpen((open) => !open)}
                className={cn('h-9 px-3', egfOpen && 'border-primary/40 bg-primary/10 text-primary dark:bg-primary/15')}
              >
                <ScaleIcon aria-hidden="true" />
                {t('discover.btn.egf')}
              </Button>
            ) : null}
            <Button asChild variant="outline" className="group/view h-9 px-3">
              <Link href={`/ecosystems/${ecosystem.id}`}>
                <LandmarkIcon aria-hidden="true" />
                {t('discover.btn.view')}
                <ArrowUpRightIcon
                  aria-hidden="true"
                  className="text-muted-foreground transition-transform duration-(--duration-base) ease-emphasized group-hover/view:translate-x-0.5 group-hover/view:-translate-y-0.5"
                />
              </Link>
            </Button>
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

        <AnimatePresence initial={false}>
          {egfOpen && egfDocuments.length > 0 ? (
            <motion.div
              id={egfPanelId}
              key="egf"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: DURATION.slow, ease: EASE.emphasized }}
              className="-my-1 overflow-hidden"
            >
              <div className="py-1">
                <GfDocumentViewer documents={egfDocuments} />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {hasSchemaSection ? (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {t('datatable.cs.title')}
            </p>
            {schemasError && !credentialSchemas.items.length ? (
              <div className="error-pane">{schemasError}</div>
            ) : (
              <>
                {credentialSchemas.items.map((schema) => (
                  <SchemaCard
                    key={schema.id}
                    credentialSchema={schema}
                    joinHref={
                      canJoin && !archived && !schema.archived
                        ? `/credential-schemas/${schema.id}?tab=participants`
                        : undefined
                    }
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
        ) : null}
      </div>
    </article>
  )
}
