'use client'

import { useDidTrustEnrichment } from '@/hooks/useDidTrustEnrichment'
import { type DidEnrichment, serviceAvatarUrl } from '@/lib/resolverClient'
import { cn } from '@/lib/utils'
import LogoImage from '@/ui/common/logo-image'
import TrustBadge from '@/ui/common/trust-badge'
import { countryCodeToFlag, shortenDID } from '@/util/util'

export type ServiceIdentityProps = {
  did: string | undefined
  fallbackName?: string
  enrichment?: DidEnrichment
  size?: 'sm' | 'md'
  showFlag?: boolean
  showTrust?: boolean
  className?: string
}

export default function ServiceIdentity({
  did,
  fallbackName,
  enrichment,
  size = 'md',
  showFlag = true,
  showTrust = true,
  className = '',
}: ServiceIdentityProps) {
  const { data: resolved } = useDidTrustEnrichment(enrichment ? undefined : did)
  const identity = enrichment ?? resolved

  const fallbackLabel = did ? shortenDID(did) : (fallbackName ?? '')
  const serviceLabel = identity?.serviceName ?? fallbackLabel
  const avatarSeed = did ?? fallbackName ?? ''

  return (
    <span className={cn('inline-flex min-w-0 items-center gap-x-2', className)}>
      <LogoImage
        src={identity?.serviceLogoUrl}
        fallbackSrc={serviceAvatarUrl(avatarSeed)}
        className={cn(
          'shrink-0 rounded-[5px] object-contain ring-1 ring-foreground/10',
          size === 'sm' ? 'size-4' : 'size-5'
        )}
      />
      <span className="text-sm font-medium break-all text-foreground">{serviceLabel}</span>
      {showFlag && identity?.countryCode ? (
        <span className="inline-flex shrink-0 items-center text-sm leading-none" aria-hidden="true">
          {countryCodeToFlag(identity?.countryCode)}
        </span>
      ) : null}
      {showTrust ? <TrustBadge state={identity?.trustStatus} size={size} /> : null}
    </span>
  )
}
