'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChildReaching } from '@fortawesome/free-solid-svg-icons';

import TrustBadge from '@/ui/common/trust-badge';
import { useDidTrustEnrichment } from '@/hooks/useDidTrustEnrichment';
import { serviceAvatarUrl } from '@/lib/resolverClient';

export type EcosystemStatus = 'ACTIVE' | 'ARCHIVED';

export type EcosystemHeaderProps = {
  did: string;
  status?: EcosystemStatus;
};

function statusPillClass(status: EcosystemStatus) {
  return status === 'ARCHIVED'
    ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
}

export default function EcosystemHeader({ did, status }: EcosystemHeaderProps) {
  const { data: enrichment } = useDidTrustEnrichment(did);
  const description = enrichment?.serviceDescription;
  const minAge = enrichment?.serviceMinAge;

  return (
    <section className="mb-8">
      <div className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row gap-6">
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
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white break-all">
                {did}
              </h1>
              <TrustBadge state={enrichment?.trustStatus} size="lg" />
              {status === 'ARCHIVED' ? (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusPillClass(status)}`}>
                  ARCHIVED
                </span>
              ) : null}
            </div>

            {description ? (
              <p className="text-xs sm:text-sm text-neutral-70 dark:text-neutral-70 mb-4 line-clamp-3">
                {description}
              </p>
            ) : null}

            {minAge ? (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <FontAwesomeIcon icon={faChildReaching} className="text-neutral-70 text-sm" />
                  <span className="text-gray-900 dark:text-white font-medium text-sm">{minAge}+</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
