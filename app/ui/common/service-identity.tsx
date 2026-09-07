'use client'

import { useDidTrustEnrichment } from '@/hooks/useDidTrustEnrichment'
import { type DidEnrichment, serviceAvatarUrl } from '@/lib/resolverClient'
import LogoImage from '@/ui/common/logo-image'
import { countryCodeToFlag, shortenDID } from '@/util/util'
import TrustBadge from './trust-badge'

export type ServiceIdentityProps = {
  did: string | undefined
  enrichment?: DidEnrichment | null
  fallbackName?: string
  size?: 'sm' | 'md'
  showFlag?: boolean
  showTrust?: boolean
  className?: string
}

export default function ServiceIdentity({
  did,
  enrichment,
  fallbackName,
  size = 'md',
  showFlag = true,
  showTrust = true,
  className = '',
}: ServiceIdentityProps) {
  const resolved = useDidTrustEnrichment(enrichment === undefined ? did : undefined)
  const identity = enrichment === undefined ? resolved.data : enrichment

  const fallbackLabel = did ? shortenDID(did) : (fallbackName ?? '')
  const serviceLabel = identity?.serviceName ?? fallbackLabel
  const countryCode = identity?.countryCode
  const avatarSeed = did ?? fallbackName ?? ''
  const avatarSizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'

  return (
    <span className={`inline-flex items-center gap-x-2 min-w-0 ${className}`}>
      <LogoImage
        src={identity?.serviceLogoUrl}
        fallbackSrc={serviceAvatarUrl(avatarSeed)}
        className={`${avatarSizeClass} rounded flex-shrink-0 object-contain`}
      />
      <span className="text-sm font-medium text-gray-900 dark:text-white break-all">{serviceLabel}</span>
      {showFlag ? (
        <span className="inline-flex items-center leading-none text-sm flex-shrink-0" aria-hidden="true">
          {countryCodeToFlag(countryCode)}
        </span>
      ) : null}
      {showTrust ? <TrustBadge state={identity?.trustStatus} size={size} /> : null}
    </span>
  )
}
