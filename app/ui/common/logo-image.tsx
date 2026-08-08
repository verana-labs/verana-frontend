'use client'

import { useState } from 'react'
import { DEFAULT_SERVICE_AVATAR } from '@/lib/resolverClient'

type Props = {
  /** Real logo URL from the ECS credential (logo claim). Optional. */
  src?: string
  /** Generated placeholder (dicebear identicon/avatar) used when no real logo exists or it fails to load. */
  fallbackSrc: string
  className?: string
  alt?: string
}

/**
 * Renders the credential logo when available, degrading to the generated
 * placeholder and finally to the bundled default asset when a source fails
 * to load.
 */
export default function LogoImage({ src, fallbackSrc, className, alt = '' }: Props) {
  const [failedSrcs, setFailedSrcs] = useState<ReadonlySet<string>>(() => new Set())

  const candidates = [src, fallbackSrc, DEFAULT_SERVICE_AVATAR].filter((s): s is string => !!s)
  const effectiveSrc = candidates.find((c) => !failedSrcs.has(c)) ?? DEFAULT_SERVICE_AVATAR

  return (
    <img
      src={effectiveSrc}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      className={className}
      onError={() => setFailedSrcs((prev) => new Set(prev).add(effectiveSrc))}
    />
  )
}
