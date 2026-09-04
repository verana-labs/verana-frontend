'use client'

import type { GroupMemberRow, GroupPolicy } from '@/hooks/useCorporationDetails'
import { Card, Fact, t, YouBadge } from './shared'

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
        <Fact label={t('corporation.page.threshold')} value={policy.threshold ?? '—'} />
        <Fact label={t('corporation.page.votingperiod')} value={policy.votingPeriod ?? '—'} />
        <Fact label={t('corporation.page.totalweight')} value={policy.totalWeight} />
      </div>
      <ul className="divide-y divide-neutral-20 dark:divide-neutral-70">
        {members.map((member) => (
          <li key={member.address} className="py-2 flex items-center justify-between gap-3 text-sm">
            <span className="font-mono break-all flex items-center gap-2">
              {member.address}
              {member.address === walletAddress ? <YouBadge /> : null}
            </span>
            <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {t('corporation.page.weight')} {member.weight}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{t('corporation.page.members.note')}</p>
    </Card>
  )
}
