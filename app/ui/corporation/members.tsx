'use client'

import type { GroupMemberRow, GroupPolicy } from '@/hooks/useCorporationDetails'
import { translate } from '@/i18n/dataview'
import { Card, Fact, YouBadge } from './shared'

export function MembersSection({
  members,
  policy,
  walletAddress,
}: {
  members: GroupMemberRow[]
  policy: GroupPolicy
  walletAddress: string | undefined
}) {
  return (
    <Card id="members">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Fact label={translate('corporation.page.threshold')} value={policy.threshold ?? translate('common.none')} />
        <Fact
          label={translate('corporation.page.votingperiod')}
          value={policy.votingPeriod ?? translate('common.none')}
        />
        <Fact label={translate('corporation.page.totalweight')} value={policy.totalWeight} />
      </div>
      <ul className="divide-y divide-neutral-20 dark:divide-neutral-70">
        {members.map((member) => (
          <li
            key={member.address}
            className="py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3 text-sm"
          >
            <span className="font-mono break-all flex flex-wrap items-center gap-x-2 gap-y-1">
              {member.address}
              {member.address === walletAddress ? <YouBadge /> : null}
            </span>
            <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {translate('corporation.page.weight')} {member.weight}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{translate('corporation.page.members.note')}</p>
    </Card>
  )
}
