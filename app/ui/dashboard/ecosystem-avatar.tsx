import { cn } from '@/lib/utils'
import type { EcosystemListItem } from '@/ui/datatable/columnslist/ecosystem'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/shadcn/avatar'
import { shortenMiddle } from '@/util/util'

export function hasDisplayName(ecosystem: EcosystemListItem): boolean {
  return Boolean(ecosystem.trustData?.serviceName ?? ecosystem.trustData?.organizationName)
}

export function ecosystemName(ecosystem: EcosystemListItem): string {
  return ecosystem.trustData?.serviceName ?? ecosystem.trustData?.organizationName ?? shortenMiddle(ecosystem.did, 18)
}

function initials(name: string): string {
  const words = name
    .replace(/^did:[^:]+:/, '')
    .split(/[\s._:-]+/)
    .filter(Boolean)
  return (
    words
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase() || 'EC'
  )
}

export function EcosystemAvatar({
  ecosystem,
  round = false,
  className,
}: {
  ecosystem: EcosystemListItem
  round?: boolean
  className?: string
}) {
  const logo = ecosystem.trustData?.serviceLogoUrl ?? ecosystem.trustData?.organizationLogoUrl
  return (
    <Avatar className={cn('bg-card', !round && 'rounded-lg after:rounded-lg *:rounded-lg', className)}>
      {logo && <AvatarImage src={logo} alt="" />}
      <AvatarFallback className={cn('bg-primary/10 text-xs font-semibold text-primary', !round && 'rounded-lg')}>
        {initials(ecosystemName(ecosystem))}
      </AvatarFallback>
    </Avatar>
  )
}
