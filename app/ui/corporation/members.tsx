'use client'

import type { GroupMemberRow, GroupPolicy } from '@/hooks/useCorporationDetails'
import { translate } from '@/i18n/dataview'
import { currentDecisionRule, formatDecisionRule } from '@/lib/decision-policy'
import { cn } from '@/lib/utils'
import { Card, Fact, YouBadge } from './shared'

const FACT_TILE = 'rounded-lg bg-tint-neutral px-4 py-3 [&>p:last-child]:text-base'

export function MembersSection({
  members,
  policy,
  walletAddress,
}: {
  members: GroupMemberRow[]
  policy: GroupPolicy
  walletAddress: string | undefined
}) {
  const rule = currentDecisionRule(policy)
  return (
    <Card id="members">
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Fact
          label={translate(`corporation.page.${rule?.kind ?? 'threshold'}`)}
          value={rule ? formatDecisionRule(rule) : translate('common.none')}
          className={FACT_TILE}
        />
        <Fact
          label={translate('corporation.page.votingperiod')}
          value={policy.votingPeriod ?? translate('common.none')}
          className={FACT_TILE}
        />
        <Fact
          label={translate('corporation.page.minexecutionperiod')}
          value={policy.minExecutionPeriod ?? translate('common.none')}
          className={FACT_TILE}
        />
        <Fact label={translate('corporation.page.totalweight')} value={policy.totalWeight} className={FACT_TILE} />
      </div>
      <ul className="space-y-1">
        {members.map((member) => (
          <li
            key={member.address}
            className={cn(
              '-mx-2 flex flex-col gap-1 rounded-lg px-2 py-3 text-sm transition-colors duration-(--duration-fast) ease-standard hover:bg-tint-neutral sm:flex-row sm:items-center sm:justify-between sm:gap-3',
              member.address === walletAddress && 'bg-tint-accent hover:bg-tint-accent'
            )}
          >
            <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs break-all sm:text-sm">
              {member.address}
              {member.address === walletAddress ? <YouBadge /> : null}
            </span>
            <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
              {translate('corporation.page.weight')} {member.weight}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">{translate('corporation.page.members.note')}</p>
    </Card>
  )
}
