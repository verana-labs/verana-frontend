'use client';

import { useDidTrustEnrichment } from '@/hooks/useDidTrustEnrichment';
import { DEFAULT_SERVICE_AVATAR, serviceAvatarUrl } from '@/lib/resolverClient';
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
  const { data: enrichment, loading, error } = useDidTrustEnrichment(did);

  const fallbackLabel = did ? shortenDID(did) : (fallbackName ?? '');
  const serviceLabel = enrichment?.serviceName ?? fallbackLabel;
  const countryCode = enrichment?.countryCode;
  const avatarSeed = did ?? fallbackName ?? '';
  const avatarSizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  // Show the default avatar once the resolver has finished and didn't surface a
  // service name (UNRESOLVED, errored, or returned without ECS-SERVICE claims).
  // While loading we keep rendering the deterministic dicebear avatar to avoid
  // a flash of the default placeholder on initial paint.
  const resolverHasResponded = enrichment !== null || error !== null;
  const showDefaultAvatar = !!did && !loading && resolverHasResponded && !enrichment?.serviceName;
  const avatarSrc = showDefaultAvatar ? DEFAULT_SERVICE_AVATAR : serviceAvatarUrl(avatarSeed);

  return (
    <span className={`inline-flex items-center gap-x-2 min-w-0 ${className}`}>
      <img
        src={avatarSrc}
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
