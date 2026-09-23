'use client'

import { faChevronDown, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState } from 'react'
import type { AgentEntry } from '@/hooks/useAgents'
import type { VsOperatorAuthorizationRow } from '@/hooks/useCorporationDetails'
import { translate } from '@/i18n/dataview'
import {
  type AgentResolution,
  type PresentedCredential,
  type ResolvedParticipation,
  serviceAvatarUrl,
  serviceIdenticonUrl,
} from '@/lib/resolverClient'
import { useRegistryLabels } from '@/providers/api-rest-query-provider-context'
import LogoImage from '@/ui/common/logo-image'
import TrustBadge from '@/ui/common/trust-badge'
import { DelegationDetail } from '@/ui/corporation/operators'
import type { ParticipantRole, ParticipantState } from '@/ui/dataview/datasections/participant'
import {
  countryCodeToFlag,
  participantCardHref,
  participantStateBadgeClass,
  roleBadgeClass,
  shortenDID,
} from '@/util/util'

const SECTION_TITLE = 'text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400'
const EMPTY = 'text-xs text-gray-500 dark:text-gray-400'
const PILL = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium'
const LINK =
  'inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400'
const ADMIN_API_TYPE = 'VsAgentAdminAPI'

function CredentialRow({ credential }: { credential: PresentedCredential }) {
  const labels = useRegistryLabels()
  return (
    <li className="py-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      <span className="font-medium text-gray-900 dark:text-white">
        {credential.ecsSchema ?? shortenDID(credential.id)}
      </span>
      <span className="text-gray-500 dark:text-gray-400">
        {translate('agents.card.schema')} {labels.schemaLabel(credential.credentialSchemaId)} ·{' '}
        {translate('agents.card.ecosystem')} {labels.ecosystemLabel(credential.ecosystemId)}
      </span>
      {credential.presentationUrl ? (
        <a href={credential.presentationUrl} target="_blank" rel="noopener noreferrer" className={LINK}>
          {translate('agents.card.credentials.vp')}
          <FontAwesomeIcon icon={faExternalLinkAlt} />
        </a>
      ) : null}
    </li>
  )
}

function AccreditationRow({
  participation,
  delegation,
}: {
  participation: ResolvedParticipation
  delegation: VsOperatorAuthorizationRow | undefined
}) {
  const labels = useRegistryLabels()
  const [open, setOpen] = useState(false)
  const state = participantStateBadgeClass(participation.state as ParticipantState, false, 'header')
  const summary = (
    <>
      <span className={`${PILL} ${roleBadgeClass(participation.role as ParticipantRole)}`}>{participation.role}</span>
      <span className="text-gray-900 dark:text-white">{labels.schemaLabel(participation.credentialSchemaId)}</span>
      <span className="text-gray-500 dark:text-gray-400">{labels.ecosystemLabel(participation.ecosystemId)}</span>
      <span className={`${PILL} ${state.classParticipantState}`}>{state.labelParticipantState}</span>
    </>
  )
  return (
    <li className="py-1.5 text-xs">
      {delegation ? (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="w-full text-left flex flex-wrap items-center gap-2"
        >
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          />
          {summary}
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-2 pl-5">{summary}</div>
      )}
      {delegation && open ? (
        <div className="mt-2 ml-5">
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
      ) : null}
    </li>
  )
}

export default function AgentCard({
  agent,
  resolution,
  delegations,
}: {
  agent: AgentEntry
  resolution: AgentResolution | undefined
  delegations: Map<number, VsOperatorAuthorizationRow>
}) {
  const enrichment = resolution?.enrichment
  const serviceName = enrichment?.serviceName ?? shortenDID(agent.did)
  const controllerName = enrichment?.organizationName
  return (
    <article className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 sm:p-6 space-y-4">
      <div className="flex items-start gap-3">
        <LogoImage
          src={enrichment?.serviceLogoUrl}
          fallbackSrc={serviceIdenticonUrl(agent.did)}
          className="w-12 h-12 rounded-lg flex-shrink-0 object-contain"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white break-words" title={agent.did}>
              {serviceName}
            </h3>
            <TrustBadge state={enrichment?.trustStatus} size="lg" />
          </div>
          {agent.label ? (
            <span className="inline-block mt-1 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
              {translate(`agents.label.${agent.label}`)}
            </span>
          ) : null}
          {enrichment?.serviceDescription ? (
            <p className="text-xs text-neutral-70 dark:text-neutral-70 mt-1 line-clamp-2 break-words">
              {enrichment.serviceDescription}
            </p>
          ) : null}
          <p className="font-mono text-xs text-gray-500 dark:text-gray-400 break-all mt-1">{agent.did}</p>
        </div>
      </div>

      {controllerName ? (
        <div className="flex items-center gap-2 min-w-0">
          <LogoImage
            src={enrichment?.organizationLogoUrl}
            fallbackSrc={serviceAvatarUrl(controllerName)}
            className="w-6 h-6 rounded flex-shrink-0 object-contain"
          />
          <span className="truncate text-sm font-medium text-gray-900 dark:text-white">{controllerName}</span>
          <span className="flex-shrink-0" aria-hidden="true">
            {countryCodeToFlag(enrichment?.countryCode)}
          </span>
        </div>
      ) : null}

      <section>
        <h4 className={SECTION_TITLE}>{translate('agents.card.credentials')}</h4>
        {resolution && resolution.credentials.length > 0 ? (
          <ul className="divide-y divide-neutral-20 dark:divide-neutral-70">
            {resolution.credentials.map((credential) => (
              <CredentialRow key={`${credential.presentationUrl ?? ''}|${credential.id}`} credential={credential} />
            ))}
          </ul>
        ) : (
          <p className={EMPTY}>{translate('agents.card.credentials.empty')}</p>
        )}
      </section>

      <section>
        <h4 className={SECTION_TITLE}>{translate('agents.card.accreditations')}</h4>
        {resolution && resolution.participations.length > 0 ? (
          <ul className="divide-y divide-neutral-20 dark:divide-neutral-70">
            {resolution.participations.map((participation) => (
              <AccreditationRow
                key={participation.id}
                participation={participation}
                delegation={delegations.get(participation.id)}
              />
            ))}
          </ul>
        ) : (
          <p className={EMPTY}>{translate('agents.card.accreditations.empty')}</p>
        )}
      </section>

      <section>
        <h4 className={SECTION_TITLE}>{translate('agents.card.endpoints')}</h4>
        {resolution && resolution.services.length > 0 ? (
          <ul className="space-y-1 text-xs">
            {resolution.services.map((service) => (
              <li key={service.id || `${service.type}|${service.serviceEndpoint}`} className="flex flex-wrap gap-x-2">
                <span className="font-medium text-gray-900 dark:text-white">{service.type}</span>
                <span className="font-mono break-all text-gray-500 dark:text-gray-400">{service.serviceEndpoint}</span>
                {service.type === ADMIN_API_TYPE && service.serviceEndpoint.startsWith('http') ? (
                  <a href={service.serviceEndpoint} target="_blank" rel="noopener noreferrer" className={LINK}>
                    {translate('agents.card.endpoints.admin')}
                    <FontAwesomeIcon icon={faExternalLinkAlt} />
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className={EMPTY}>{translate('agents.card.endpoints.empty')}</p>
        )}
      </section>
    </article>
  )
}
