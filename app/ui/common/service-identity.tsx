'use client';

import { useDidTrustEnrichment } from '@/hooks/useDidTrustEnrichment';
import { serviceAvatarUrl } from '@/lib/resolverClient';
import { countryCodeToFlag, shortenDID } from '@/util/util';
import TrustBadge from './trust-badge';

export type ServiceIdentityProps = {
  /** DID used both as resolver lookup key and avatar seed. */
  did: string | undefined;
  /** Used as avatar seed + label when no DID is available (e.g. synthetic nodes). */
  fallbackName?: string;
  size?: 'sm' | 'md';
  showFlag?: boolean;
  showTrust?: boolean;
  className?: string;
};

export default function ServiceIdentity({
  did,
  fallbackName,
  size = 'md',
  showFlag = true,
  showTrust = true,
  className = '',
}: ServiceIdentityProps) {
  const { data: enrichment } = useDidTrustEnrichment(did);

  const fallbackLabel = did ? shortenDID(did) : (fallbackName ?? '');
  const serviceLabel = enrichment?.serviceName ?? fallbackLabel;
  const countryCode = enrichment?.countryCode;
  const avatarSeed = did ?? fallbackName ?? '';
  const avatarSizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <span className={`inline-flex items-center gap-x-2 min-w-0 ${className}`}>
      <img
        src={serviceAvatarUrl(avatarSeed)}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        className={`${avatarSizeClass} rounded flex-shrink-0`}
      />
      <span className="text-sm font-medium text-gray-900 dark:text-white break-all">
        {serviceLabel}
      </span>
      {showFlag ? (
        <span className="text-sm flex-shrink-0" aria-hidden="true">
          {countryCodeToFlag(countryCode)}
        </span>
      ) : null}
      {showTrust ? <TrustBadge state={enrichment?.trustStatus} size={size} /> : null}
    </span>
  );
}
