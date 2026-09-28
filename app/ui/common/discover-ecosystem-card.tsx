'use client'

import { faRightToBracket, faShieldHalved } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Link from 'next/link'
import type { EcosystemSchemaPage } from '@/hooks/useCredentialSchemas'
import { translate } from '@/i18n/dataview'
import { serviceAvatarUrl, serviceIdenticonUrl } from '@/lib/resolverClient'
import ClaimText from '@/ui/common/claim-text'
import CsCard from '@/ui/common/cs-card'
import { EgfViewerToggle } from '@/ui/common/egf-viewer-toggle'
import { ShowMoreButton } from '@/ui/common/keyset-pagination'
import LogoImage from '@/ui/common/logo-image'
import TrustBadge from '@/ui/common/trust-badge'
import type { EcosystemListItem } from '@/ui/datatable/columnslist/ecosystem'
import type { ParticipantRole } from '@/ui/dataview/datasections/participant'
import { resolveTranslatable } from '@/ui/dataview/types'
import { countryCodeToFlag, formatNumber, formatVNAFromUVNA, roleBadgeClass, shortenDID } from '@/util/util'

type DiscoverEcosystemCardProps = {
  ecosystem: EcosystemListItem
  credentialSchemas: EcosystemSchemaPage
  schemasError: string | null
  onLoadMoreSchemas: () => void
  roles: ParticipantRole[]
  canJoin: boolean
}

function t(key: string): string {
  return resolveTranslatable({ key }, translate) ?? key
}

export function DiscoverEcosystemCard({
  ecosystem,
  credentialSchemas,
  schemasError,
  onLoadMoreSchemas,
  roles,
  canJoin,
}: DiscoverEcosystemCardProps) {
  const identity = ecosystem.trustData
  const serviceName = identity?.serviceName ?? shortenDID(ecosystem.did) ?? ecosystem.did
  const orgName = identity?.organizationName ?? shortenDID(ecosystem.did) ?? ecosystem.did
  const archived = Boolean(ecosystem.archived)
  const counters = [
    ['datatable.ecosystem.card.activeSchemas', formatNumber(ecosystem.activeSchemas, true)],
    ['datatable.ecosystem.card.participants', formatNumber(ecosystem.participants, true)],
    ['datatable.ecosystem.card.trustValue', formatVNAFromUVNA(ecosystem.weight)],
    ['datatable.ecosystem.card.issuedCredentials', formatNumber(ecosystem.issued, true)],
    ['datatable.ecosystem.card.verifiedCredentials', formatNumber(ecosystem.verified, true)],
  ] as const

  return (
    <article
      aria-label={serviceName}
      className={`bg-white dark:bg-surface border border-neutral-20 dark:border-neutral-70 rounded-xl overflow-hidden ${
        archived ? 'archived-watermark' : ''
      }`}
    >
      <div className={`p-6 ${archived ? 'archived-bg' : ''}`}>
        <div className="flex items-start space-x-3 mb-3">
          <LogoImage
            src={identity?.serviceLogoUrl}
            fallbackSrc={serviceIdenticonUrl(ecosystem.did)}
            className="w-12 h-12 rounded-lg flex-shrink-0 object-contain"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white break-words" title={serviceName}>
                {serviceName}
              </h2>
              <TrustBadge state={identity?.trustStatus} size="xl" />
            </div>
            {identity?.serviceDescription ? (
              <ClaimText
                text={identity.serviceDescription}
                format={identity.serviceDescriptionFormat}
                className="text-xs text-neutral-70 dark:text-neutral-70 mt-1 line-clamp-2 break-words"
                title={identity.serviceDescription}
              />
            ) : null}
          </div>
        </div>

        <div className="flex items-start space-x-2 mb-4">
          <LogoImage
            src={identity?.organizationLogoUrl}
            fallbackSrc={serviceAvatarUrl(identity?.organizationName ?? ecosystem.did)}
            className="w-8 h-8 rounded flex-shrink-0 object-contain"
          />
          <div className="flex-1 min-w-0">
            <h3 className="truncate text-sm font-medium text-gray-900 dark:text-white" title={orgName}>
              {orgName}
            </h3>
            <span className="text-lg leading-none" aria-hidden="true">
              {countryCodeToFlag(identity?.countryCode)}
            </span>
          </div>
        </div>

        {roles.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs text-neutral-70 dark:text-neutral-70">{t('discover.roles.label')}</span>
            {roles.map((role) => (
              <span
                key={role}
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadgeClass(role)}`}
              >
                {role}
              </span>
            ))}
          </div>
        ) : null}

        <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-sm mb-4">
          {counters.map(([key, value]) => (
            <div key={key} className="min-w-0">
              <dt className="text-neutral-70 dark:text-neutral-70 break-words">{t(key)}</dt>
              <dd className="font-medium text-gray-900 dark:text-white break-words">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mb-6">
          <EgfViewerToggle versions={ecosystem.versions ?? []} activeVersion={ecosystem.activeVersion}>
            <Link
              href={`/ecosystems/${ecosystem.id}`}
              className="inline-flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm font-medium"
            >
              <FontAwesomeIcon className="mr-2" aria-hidden="true" icon={faShieldHalved} />
              {t('discover.btn.view')}
            </Link>
            {canJoin && !archived && ecosystem.activeSchemas > 0 ? (
              <Link
                href={`/join/${ecosystem.id}`}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
              >
                <FontAwesomeIcon className="mr-2" aria-hidden="true" icon={faRightToBracket} />
                {t('discover.btn.join')}
              </Link>
            ) : null}
          </EgfViewerToggle>
        </div>

        <div className="space-y-4">
          {schemasError ? (
            <div className="error-pane">{schemasError}</div>
          ) : (
            <>
              {credentialSchemas.items.map((schema) => (
                <CsCard key={schema.id} credentialSchema={schema} />
              ))}
              {credentialSchemas.hasNext ? <ShowMoreButton onClick={onLoadMoreSchemas} /> : null}
            </>
          )}
        </div>
      </div>
    </article>
  )
}
