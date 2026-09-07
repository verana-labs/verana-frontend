'use client'

import { translate } from '@/i18n/dataview'
import type { EcosystemMembership } from '@/lib/ecosystem-membership'
import type { ParticipantRole } from '@/ui/dataview/datasections/participant'
import { roleBadgeClass } from '@/util/util'

const PILL_CLASS = 'inline-flex min-w-0 max-w-[8.5rem] items-center rounded-full px-2.5 py-0.5 text-xs font-medium'
const MEMBERSHIP_CLASS: Record<EcosystemMembership, string> = {
  controlled: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
  joined: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
}

type Props = {
  membership: EcosystemMembership | null
  roles: ParticipantRole[]
  maxRoles?: number
}

export function MembershipBadges({ membership, roles, maxRoles }: Props) {
  const visible = maxRoles === undefined ? roles : roles.slice(0, maxRoles)
  const hidden = roles.slice(visible.length)
  return (
    <>
      {membership ? (
        <span className={`${PILL_CLASS} ${MEMBERSHIP_CLASS[membership]}`} data-membership={membership}>
          {translate(`datatable.ecosystem.card.${membership}`)}
        </span>
      ) : null}
      {visible.map((role) => (
        <span key={role} className={`${PILL_CLASS} ${roleBadgeClass(role)}`} title={role}>
          <span className="truncate">{role}</span>
        </span>
      ))}
      {hidden.length > 0 ? (
        <span
          className="inline-flex flex-shrink-0 items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
          title={hidden.join(', ')}
        >
          +{hidden.length}
        </span>
      ) : null}
    </>
  )
}
