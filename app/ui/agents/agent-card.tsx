'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowUpRightIcon,
  BadgeCheckIcon,
  ChevronDownIcon,
  type LucideIcon,
  NetworkIcon,
  PlugIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { type AccreditationRowData, type AgentEntry, withPendingAccreditations } from '@/hooks/useAgents'
import type { VsOperatorAuthorizationRow } from '@/hooks/useCorporationDetails'
import { translate } from '@/i18n/dataview'
import {
  type AgentResolution,
  type PresentedCredential,
  serviceAvatarUrl,
  serviceIdenticonUrl,
} from '@/lib/resolverClient'
import { cn } from '@/lib/utils'
import { useRegistryLabels } from '@/providers/api-rest-query-provider-context'
import LogoImage from '@/ui/common/logo-image'
import TrustBadge from '@/ui/common/trust-badge'
import { DelegationDetail } from '@/ui/corporation/operators'
import type { Participant, ParticipantRole, ParticipantState } from '@/ui/dataview/datasections/participant'
import { DURATION, EASE } from '@/ui/motion/tokens'
import {
  countryCodeToFlag,
  onboardingStateColor,
  participantCardHref,
  participantStateBadgeClass,
  roleBadgeClass,
  shortenDID,
} from '@/util/util'

const PILL = 'inline-flex h-5 items-center rounded-full px-2 text-xs font-medium'
const LINK =
  'inline-flex items-center gap-0.5 rounded-sm text-xs font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50'
const ADMIN_API_TYPE = 'VsAgentAdminAPI'

function CredentialRow({ credential }: { credential: PresentedCredential }) {
  const labels = useRegistryLabels()
  return (
    <li className="flex flex-wrap items-center gap-x-2 gap-y-1 py-2 text-xs">
      <span className="font-medium text-foreground">{credential.ecsSchema ?? shortenDID(credential.id)}</span>
      <span className="text-muted-foreground">
        {translate('agents.card.schema')} {labels.schemaLabel(credential.credentialSchemaId)} ·{' '}
        {translate('agents.card.ecosystem')} {labels.ecosystemLabel(credential.ecosystemId)}
      </span>
      {credential.presentationUrl ? (
        <a href={credential.presentationUrl} target="_blank" rel="noopener noreferrer" className={cn(LINK, 'ms-auto')}>
          {translate('agents.card.credentials.vp')}
          <ArrowUpRightIcon aria-hidden="true" className="size-3.5" />
        </a>
      ) : null}
    </li>
  )
}

function AccreditationRow({
  participation,
  delegation,
  indent,
}: {
  participation: AccreditationRowData
  delegation: VsOperatorAuthorizationRow | undefined
  indent: boolean
}) {
  const labels = useRegistryLabels()
  const reduced = useReducedMotion()
  const [open, setOpen] = useState(false)
  const state = participantStateBadgeClass(participation.state as ParticipantState, false, 'header')
  const onboarding = participation.opState === 'PENDING' ? onboardingStateColor(participation.opState) : undefined
  const summary = (
    <>
      <span className={cn(PILL, roleBadgeClass(participation.role as ParticipantRole))}>{participation.role}</span>
      <span className="font-medium text-foreground">{labels.schemaLabel(participation.credentialSchemaId)}</span>
      <span className="text-muted-foreground">{labels.ecosystemLabel(participation.ecosystemId)}</span>
      <span className={cn(PILL, state.classParticipantState)}>{state.labelParticipantState}</span>
      {onboarding ? (
        <span className={cn(PILL, 'uppercase', onboarding.classOnboardingState)}>
          {onboarding.labelOnboardingState}
        </span>
      ) : null}
    </>
  )
  return (
    <li className="py-1 text-xs">
      {delegation ? (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="-mx-2 flex w-[calc(100%+1rem)] flex-wrap items-center gap-2 rounded-md px-2 py-1.5 text-start outline-none transition-colors duration-(--duration-base) ease-standard hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:bg-muted/60"
        >
          <ChevronDownIcon
            aria-hidden="true"
            className={cn(
              'size-3.5 text-muted-foreground transition-transform duration-(--duration-base) ease-emphasized',
              open && 'rotate-180'
            )}
          />
          {summary}
        </button>
      ) : (
        <div className={cn('flex flex-wrap items-center gap-2 py-1.5', indent && 'ps-5.5')}>{summary}</div>
      )}
      <AnimatePresence initial={false}>
        {delegation && open ? (
          <motion.div
            key="delegation"
            initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduced ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: DURATION.base, ease: EASE.emphasized }}
            className="overflow-hidden"
          >
            <div className="ms-5.5 mt-2 mb-1">
              <DelegationDetail
                record={delegation}
                showOperator
                participantHref={
                  participation.credentialSchemaId === null
                    ? null
                    : participantCardHref(participation.credentialSchemaId, participation.id)
                }
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  )
}

function CardSection({
  icon: Icon,
  titleKey,
  count,
  resolved,
  emptyKey,
  children,
}: {
  icon: LucideIcon
  titleKey: string
  count: number | undefined
  resolved: boolean
  emptyKey: string
  children: ReactNode
}) {
  let body: ReactNode = children
  if (!resolved)
    body = <p className="animate-pulse text-xs text-muted-foreground">{translate('agents.card.resolving')}</p>
  else if (!children) body = <p className="text-xs text-muted-foreground">{translate(emptyKey)}</p>
  return (
    <section className="border-t border-border px-4 py-3.5 sm:px-5">
      <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        <Icon aria-hidden="true" className="size-3.5" />
        {translate(titleKey)}
        {count ? (
          <span className="ms-0.5 rounded-full bg-muted px-1.5 text-[11px] text-foreground tabular-nums">{count}</span>
        ) : null}
      </h4>
      {body}
    </section>
  )
}

export default function AgentCard({
  agent,
  resolution,
  unavailable,
  delegations,
  pending,
}: {
  agent: AgentEntry
  resolution: AgentResolution | undefined
  unavailable: boolean
  delegations: Map<number, VsOperatorAuthorizationRow>
  pending: Participant[]
}) {
  const enrichment = resolution?.enrichment
  const accreditations = resolution ? withPendingAccreditations(agent.did, resolution.participations, pending) : []
  const serviceName = enrichment?.serviceName ?? shortenDID(agent.did)
  const controllerName = enrichment?.organizationName
  const resolved = Boolean(resolution)
  const anyExpandable = accreditations.some((participation) => delegations.has(participation.id))
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl bg-card text-sm text-card-foreground shadow-card">
      <div className="flex items-start gap-3.5 p-4 sm:p-5">
        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted/60 ring-1 ring-border">
          <LogoImage
            src={enrichment?.serviceLogoUrl}
            fallbackSrc={serviceIdenticonUrl(agent.did)}
            className="size-full object-contain"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="break-words text-base leading-snug font-semibold text-foreground" title={agent.did}>
                {serviceName}
              </h3>
              {agent.label ? (
                <span className="inline-flex h-5 items-center rounded-full border border-primary/20 bg-primary/10 px-2 text-xs font-medium text-primary">
                  {translate(`agents.label.${agent.label}`)}
                </span>
              ) : null}
            </div>
            <TrustBadge state={enrichment?.trustStatus} size="lg" className="mt-0.5" />
          </div>
          {enrichment?.serviceDescription ? (
            <p className="mt-1 line-clamp-2 break-words text-xs leading-relaxed text-muted-foreground">
              {enrichment.serviceDescription}
            </p>
          ) : null}
          <p className="mt-2 w-fit max-w-full rounded-md bg-muted/60 px-2 py-1 font-mono text-xs break-all text-muted-foreground">
            {agent.did}
          </p>
          {controllerName ? (
            <div className="mt-2.5 flex min-w-0 items-center gap-2">
              <LogoImage
                src={enrichment?.organizationLogoUrl}
                fallbackSrc={serviceAvatarUrl(controllerName)}
                className="size-5 shrink-0 rounded-full object-contain ring-1 ring-border"
              />
              <span className="truncate text-xs font-medium text-foreground">{controllerName}</span>
              <span className="shrink-0 text-xs" aria-hidden="true">
                {countryCodeToFlag(enrichment?.countryCode)}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {unavailable ? (
        <p className="flex items-start gap-2 border-t border-border bg-warning/5 px-4 py-3 text-xs text-warning sm:px-5 dark:bg-warning/10">
          <TriangleAlertIcon aria-hidden="true" className="mt-px size-3.5 shrink-0" />
          {translate('agents.card.unavailable')}
        </p>
      ) : (
        <>
          <CardSection
            icon={BadgeCheckIcon}
            titleKey="agents.card.credentials"
            count={resolution?.credentials.length}
            resolved={resolved}
            emptyKey="agents.card.credentials.empty"
          >
            {resolution && resolution.credentials.length > 0 ? (
              <ul className="divide-y divide-border">
                {resolution.credentials.map((credential) => (
                  <CredentialRow key={`${credential.presentationUrl ?? ''}|${credential.id}`} credential={credential} />
                ))}
              </ul>
            ) : null}
          </CardSection>

          <CardSection
            icon={NetworkIcon}
            titleKey="agents.card.accreditations"
            count={resolution ? accreditations.length : undefined}
            resolved={resolved}
            emptyKey="agents.card.accreditations.empty"
          >
            {accreditations.length > 0 ? (
              <ul>
                {accreditations.map((participation) => (
                  <AccreditationRow
                    key={participation.id}
                    participation={participation}
                    delegation={delegations.get(participation.id)}
                    indent={anyExpandable}
                  />
                ))}
              </ul>
            ) : null}
          </CardSection>

          <CardSection
            icon={PlugIcon}
            titleKey="agents.card.endpoints"
            count={resolution?.services.length}
            resolved={resolved}
            emptyKey="agents.card.endpoints.empty"
          >
            {resolution && resolution.services.length > 0 ? (
              <ul className="divide-y divide-border">
                {resolution.services.map((service) => (
                  <li
                    key={service.id || `${service.type}|${service.serviceEndpoint}`}
                    className="flex flex-wrap items-center gap-x-2 gap-y-0.5 py-2 text-xs"
                  >
                    <span className="font-medium text-foreground">{service.type}</span>
                    <span className="min-w-0 font-mono break-all text-muted-foreground">{service.serviceEndpoint}</span>
                    {service.type === ADMIN_API_TYPE && service.serviceEndpoint.startsWith('http') ? (
                      <a href={service.serviceEndpoint} target="_blank" rel="noopener noreferrer" className={LINK}>
                        {translate('agents.card.endpoints.admin')}
                        <ArrowUpRightIcon aria-hidden="true" className="size-3.5" />
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </CardSection>
        </>
      )}
    </article>
  )
}
