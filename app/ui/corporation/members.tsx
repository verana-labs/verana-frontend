'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { UsersIcon } from 'lucide-react'
import type { GroupMemberRow, GroupPolicy } from '@/hooks/useCorporationDetails'
import { translate } from '@/i18n/dataview'
import { currentDecisionRule, formatDecisionRule } from '@/lib/decision-policy'
import { DURATION, EASE } from '@/ui/motion/tokens'
import { Avatar, AvatarFallback } from '@/ui/shadcn/avatar'
import { addressInitials, Card, Fact, SectionHeader, YouBadge } from './shared'

function shareOf(weight: string, total: number): number {
  const value = Number(weight)
  return total > 0 && Number.isFinite(value) ? (value / total) * 100 : 0
}

export function MembersSection({
  members,
  policy,
  walletAddress,
}: {
  members: GroupMemberRow[]
  policy: GroupPolicy
  walletAddress: string | undefined
}) {
  const reduced = useReducedMotion()
  const rule = currentDecisionRule(policy)
  const total = Number(policy.totalWeight) || members.reduce((sum, member) => sum + (Number(member.weight) || 0), 0)
  const sorted = [...members].sort((a, b) => Number(b.weight) - Number(a.weight))
  const facts = [
    {
      key: 'rule',
      label: translate(`corporation.page.${rule?.kind ?? 'threshold'}`),
      value: rule ? formatDecisionRule(rule) : translate('common.none'),
    },
    {
      key: 'voting',
      label: translate('corporation.page.votingperiod'),
      value: policy.votingPeriod ?? translate('common.none'),
    },
    {
      key: 'execution',
      label: translate('corporation.page.minexecutionperiod'),
      value: policy.minExecutionPeriod ?? translate('common.none'),
    },
    { key: 'weight', label: translate('corporation.page.totalweight'), value: policy.totalWeight },
  ]
  return (
    <Card id="members">
      <SectionHeader
        icon={<UsersIcon />}
        title={translate('corporation.page.members')}
        description={translate('corporation.page.members.note')}
      />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {facts.map((fact) => (
          <Fact
            key={fact.key}
            label={fact.label}
            value={fact.value}
            className="rounded-lg bg-muted/50 px-4 py-3 ring-1 ring-border/60 [&>p:last-child]:text-base"
          />
        ))}
      </div>
      <ul className="divide-y divide-border/70">
        {sorted.map((member, index) => {
          const share = shareOf(member.weight, total)
          return (
            <li
              key={member.address}
              className="flex flex-col gap-2 py-3 text-sm first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4"
            >
              <span className="flex min-w-0 flex-1 items-start gap-3">
                <Avatar size="sm" className="mt-0.5 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                    {addressInitials(member.address)}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1 space-y-2">
                  <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs break-all sm:text-sm">
                    {member.address}
                    {member.address === walletAddress ? <YouBadge /> : null}
                  </span>
                  <span aria-hidden="true" className="block h-1.5 overflow-hidden rounded-full bg-muted">
                    <motion.span
                      className="block h-full origin-left rounded-full bg-primary rtl:origin-right"
                      style={{ width: `${share}%` }}
                      initial={reduced ? false : { scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: DURATION.slow * 2, ease: EASE.emphasized, delay: index * 0.04 }}
                    />
                  </span>
                </span>
              </span>
              <span className="flex shrink-0 items-baseline gap-3 ps-9 text-muted-foreground tabular-nums sm:ps-0">
                <span className="text-xs">
                  {translate('corporation.page.weight')} {member.weight}
                </span>
                <span className="w-14 text-end text-sm font-semibold text-foreground">
                  {share.toFixed(share % 1 === 0 ? 0 : 1)}%
                </span>
              </span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
