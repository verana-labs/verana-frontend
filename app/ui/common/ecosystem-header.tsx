'use client'

import { faChildReaching } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useDidTrustEnrichment } from '@/hooks/useDidTrustEnrichment'
import { serviceAvatarUrl } from '@/lib/resolverClient'
import TrustBadge from '@/ui/common/trust-badge'

export type EcosystemStatus = 'ARCHIVED'

export type EcosystemHeaderProps = {
  did: string
  status?: EcosystemStatus
}

const ARCHIVED_PILL_CLASS = 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'

export default function EcosystemHeader({ did, status }: EcosystemHeaderProps) {
  const { data: enrichment } = useDidTrustEnrichment(did)
  const description = enrichment?.serviceDescription
  const minAgeRaw = enrichment?.serviceMinAge
  const minAgeNum = minAgeRaw != null ? Number(minAgeRaw) : NaN
  const showMinAge = Number.isFinite(minAgeNum) && minAgeNum >= 0
  const displayName = enrichment?.serviceName ?? enrichment?.organizationName ?? did

  return (
    <section className="mb-8">
      <div className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          <div className="flex-shrink-0">
            <img
              src={serviceAvatarUrl(did)}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white break-words">
                {displayName}
                <TrustBadge state={enrichment?.trustStatus} size="lg" className="ml-3 align-middle" />
              </h1>
              {status === 'ARCHIVED' ? (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${ARCHIVED_PILL_CLASS}`}
                >
                  ARCHIVED
                </span>
              ) : null}
            </div>

            {description ? (
              <p className="text-xs sm:text-sm text-neutral-70 dark:text-neutral-70 mb-4 line-clamp-3">{description}</p>
            ) : null}

            {showMinAge ? (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <FontAwesomeIcon icon={faChildReaching} className="text-neutral-70 text-sm" />
                  <span className="text-gray-900 dark:text-white font-medium text-sm">{minAgeNum}+</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
