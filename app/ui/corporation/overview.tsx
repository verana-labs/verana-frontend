'use client'

import { KeyRoundIcon, LandmarkIcon, UsersIcon, VoteIcon } from 'lucide-react'
import { usePathname, useSearchParams } from 'next/navigation'
import { type CorporationDetails, type ProposalRow, proposalTallyScale } from '@/hooks/useCorporationDetails'
import { translate } from '@/i18n/dataview'
import { currentDecisionRule, formatDecisionRule } from '@/lib/decision-policy'
import { cn } from '@/lib/utils'
import { BlockCard } from '@/ui/common/block-card'
import { GhostEmpty } from '@/ui/common/ghost-empty'
import { ScoreGauge } from '@/ui/common/score-gauge'
import { ToneTag } from '@/ui/common/tone-tag'
import { NumberTicker } from '@/ui/motion/number-ticker'
import { Stagger, StaggerItem } from '@/ui/motion/stagger'
import { Avatar, AvatarFallback } from '@/ui/shadcn/avatar'
import { formatVNAFromUVNA, shortenMiddle } from '@/util/util'
import { CategoryBar } from './category-bar'
import { hasEnded, messageTitle } from './proposals'
import {
  addressInitials,
  atLeast,
  Fact,
  formatDate,
  formatRelative,
  rulePercent,
  SectionUnavailable,
  StatusBadge,
  YouBadge,
} from './shared'
import { StatTile, UnknownStat } from './stat-tile'

const RECENT_PROPOSALS = 3
const TOP_MEMBERS = 4

const UVNA_PER_VNA = 1_000_000

function formatShortVna(value: number): string {
  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value)} VNA`
}

function depositHint(uvna: number): string | null {
  const full = formatVNAFromUVNA(String(uvna))
  return full === formatShortVna(uvna / UVNA_PER_VNA) ? null : full
}

function formatCount(n: number): string {
  return String(Math.round(n))
}

function formatPartialCount(n: number): string {
  return atLeast(Math.round(n), true)
}

function Count({ value, partial }: { value: number; partial: boolean }) {
  return <NumberTicker value={value} format={partial ? formatPartialCount : formatCount} />
}

function formatDepositVna(uvna: number): string {
  return formatShortVna(uvna / UVNA_PER_VNA)
}

function useTabLink(tab: string) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const params = new URLSearchParams(searchParams.toString())
  params.set('tab', tab)
  return {
    href: `${pathname}?${params.toString()}`,
    label: translate('dashboard.ecosystems.viewAll'),
    replace: true,
  }
}

export function OverviewTiles({ details, openProposals }: { details: CorporationDetails; openProposals: number }) {
  const { members, policy, trustDeposit, operatorAuthorizations, feeGrants, proposals, degraded, partial } = details
  const unknown = <UnknownStat label={translate('common.unknown')} />
  const incomplete = degraded.trustDeposit || degraded.operatorAuthorizations || degraded.proposals
  const rule = currentDecisionRule(policy)
  const unrepaid = trustDeposit ? Math.max(trustDeposit.slashedDeposit - trustDeposit.repaidDeposit, 0) : 0
  const ruleNote = rule
    ? `${translate(rule.kind === 'threshold' ? 'corporation.page.threshold' : 'corporation.page.percentage').toLowerCase()} ${formatDecisionRule(rule)}`
    : null
  const tiles = [
    {
      key: 'deposit',
      icon: <LandmarkIcon />,
      label: translate('corporation.page.deposit'),
      value: degraded.trustDeposit ? (
        unknown
      ) : (
        <NumberTicker value={trustDeposit?.deposit ?? 0} format={formatDepositVna} />
      ),
      hint: degraded.trustDeposit ? null : unrepaid > 0 ? (
        <ToneTag tone="destructive" dot className="h-4 px-1.5 text-[11px] tabular-nums">
          {translate('corporation.page.outstanding')} {formatShortVna(unrepaid / UVNA_PER_VNA)}
        </ToneTag>
      ) : (
        depositHint(trustDeposit?.deposit ?? 0)
      ),
    },
    {
      key: 'members',
      icon: <UsersIcon />,
      label: translate('corporation.tab.members'),
      value: <Count value={members.length} partial={false} />,
      hint: ruleNote,
    },
    {
      key: 'proposals',
      icon: <VoteIcon />,
      label: translate('corporation.tab.proposals'),
      value: degraded.proposals ? unknown : <Count value={proposals.length} partial={partial.proposals} />,
      hint: degraded.proposals
        ? null
        : `${atLeast(openProposals, partial.proposals)} ${translate('corporation.page.open')}`,
    },
    {
      key: 'operators',
      icon: <KeyRoundIcon />,
      label: translate('corporation.tab.operators'),
      value: degraded.operatorAuthorizations ? (
        unknown
      ) : (
        <Count value={operatorAuthorizations.length} partial={partial.operatorAuthorizations} />
      ),
      hint:
        degraded.operatorAuthorizations || degraded.feeGrants
          ? null
          : translate('corporation.page.operators.feegranted', {
              count: atLeast(
                operatorAuthorizations.filter((row) => feeGrants.some((grant) => grant.grantee === row.operator))
                  .length,
                partial.operatorAuthorizations || partial.feeGrants
              ),
            }),
    },
  ]
  return (
    <div className="space-y-3">
      {incomplete ? <SectionUnavailable /> : null}
      <Stagger className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {tiles.map((tile) => (
          <StaggerItem key={tile.key} className="h-full min-w-0">
            <StatTile stat={tile.key} icon={tile.icon} label={tile.label} value={tile.value} hint={tile.hint} />
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  )
}

export function OverviewDetails({ details }: { details: CorporationDetails }) {
  const { profile, policy, members } = details
  const rule = currentDecisionRule(policy)
  const total = Number(policy.totalWeight) || members.reduce((sum, member) => sum + (Number(member.weight) || 0), 0)
  const required = rulePercent(rule, total)
  const ruleLabel = translate(`corporation.page.${rule?.kind ?? 'threshold'}`)
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="min-w-0 space-y-2 rounded-lg bg-tint-neutral p-3 sm:col-span-2">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xs font-medium text-muted-foreground">{ruleLabel}</p>
          <p className="text-sm font-semibold text-foreground tabular-nums">
            {rule ? formatDecisionRule(rule) : translate('common.none')}
            {rule?.kind === 'threshold' && total > 0 ? (
              <span className="font-normal text-muted-foreground"> / {total}</span>
            ) : null}
          </p>
        </div>
        {required !== null ? (
          <ScoreGauge tone="brand" size="sm" percent={required} label={`${ruleLabel} ${Math.round(required)}%`} />
        ) : null}
      </div>
      <Fact
        label={translate('corporation.page.votingperiod')}
        value={policy.votingPeriod ?? translate('common.none')}
      />
      <Fact label={translate('corporation.page.language')} value={profile.language || translate('common.none')} />
      <Fact label={translate('corporation.page.totalweight')} value={policy.totalWeight} />
      <Fact
        label={translate('corporation.page.minexecutionperiod')}
        value={policy.minExecutionPeriod ?? translate('common.none')}
      />
      <Fact
        label={translate('corporation.page.created')}
        value={formatDate(profile.created)}
        className="sm:col-span-2"
      />
      <Fact
        label={translate('corporation.page.modified')}
        value={formatDate(profile.modified)}
        className="sm:col-span-2"
      />
    </div>
  )
}

function proposalOrder(a: ProposalRow, b: ProposalRow): number {
  const openA = a.status === 'SUBMITTED' ? 0 : 1
  const openB = b.status === 'SUBMITTED' ? 0 : 1
  return openA - openB || b.id - a.id
}

export function RecentProposals({ details }: { details: CorporationDetails }) {
  const recent = [...details.proposals].sort(proposalOrder).slice(0, RECENT_PROPOSALS)
  const link = useTabLink('proposals')
  return (
    <BlockCard icon={<VoteIcon />} title={translate('corporation.tab.proposals')} link={link} className="h-full">
      {recent.length === 0 ? (
        <GhostEmpty title={translate('corporation.page.proposals.empty')} className="min-h-36" />
      ) : (
        <Stagger as="ul" className="-mx-2 flex flex-col">
          {recent.map((proposal) => {
            const votingEnded = proposal.status === 'SUBMITTED' && hasEnded(proposal.votingPeriodEnd)
            const ends = proposal.status === 'SUBMITTED' ? formatRelative(proposal.votingPeriodEnd) : null
            const scale = proposalTallyScale(proposal, details.policy)
            const cast = proposal.tally.yes + proposal.tally.no + proposal.tally.veto + proposal.tally.abstain
            const tallyText =
              scale.total === null
                ? translate('corporation.proposals.tally.votes', {
                    yes: proposal.tally.yes,
                    no: proposal.tally.no,
                    abstain: proposal.tally.abstain,
                    veto: proposal.tally.veto,
                  })
                : translate('corporation.proposals.tally.total', { yes: proposal.tally.yes, total: scale.total })
            return (
              <StaggerItem
                as="li"
                key={proposal.id}
                className="flex flex-col gap-2 rounded-lg px-2 py-2.5 transition-colors duration-(--duration-fast) ease-standard hover:bg-tint-neutral"
              >
                <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
                  <span className="font-mono text-xs font-medium text-muted-foreground">#{proposal.id}</span>
                  <span className="min-w-0 truncate text-sm font-medium text-foreground">
                    {messageTitle(proposal) ?? '—'}
                  </span>
                  <StatusBadge status={proposal.status} votingEnded={votingEnded} />
                  <span className="ms-auto text-xs text-muted-foreground tabular-nums">
                    {ends ?? formatDate(proposal.submitTime)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CategoryBar
                    className="h-1.5 min-w-16 flex-1"
                    segments={[
                      { key: 'yes', value: proposal.tally.yes, className: 'bg-success' },
                      { key: 'no', value: proposal.tally.no + proposal.tally.veto, className: 'bg-destructive' },
                      { key: 'abstain', value: proposal.tally.abstain, className: 'bg-muted-foreground/45' },
                      {
                        key: 'remaining',
                        value: scale.total === null ? 0 : Math.max(scale.total - cast, 0),
                        className: 'bg-transparent',
                      },
                    ]}
                  />
                  <span
                    className="max-w-[60%] truncate text-[11px] text-muted-foreground tabular-nums"
                    title={tallyText}
                  >
                    {tallyText}
                  </span>
                </div>
              </StaggerItem>
            )
          })}
        </Stagger>
      )}
    </BlockCard>
  )
}

export function MemberWeights({ details, walletAddress }: { details: CorporationDetails; walletAddress?: string }) {
  const { members, policy } = details
  const total = Number(policy.totalWeight) || members.reduce((sum, member) => sum + (Number(member.weight) || 0), 0)
  const top = [...members].sort((a, b) => Number(b.weight) - Number(a.weight)).slice(0, TOP_MEMBERS)
  const link = useTabLink('members')
  return (
    <BlockCard icon={<UsersIcon />} title={translate('corporation.tab.members')} link={link} pattern className="h-full">
      <ul className="flex flex-col gap-3">
        {top.map((member) => {
          const share = total > 0 ? ((Number(member.weight) || 0) / total) * 100 : 0
          const you = member.address === walletAddress
          return (
            <li key={member.address} className="flex min-w-0 items-center gap-3">
              <Avatar size="sm" className="shrink-0 ring-2 ring-card">
                <AvatarFallback className="bg-linear-to-br from-primary/25 to-primary/5 text-[10px] font-semibold text-primary">
                  {addressInitials(member.address)}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 space-y-1.5">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-mono text-xs text-foreground" title={member.address}>
                    {shortenMiddle(member.address, 20)}
                  </span>
                  {you ? <YouBadge /> : null}
                  <span className="ms-auto text-xs font-semibold text-foreground tabular-nums">
                    {share.toFixed(share % 1 === 0 ? 0 : 1)}%
                  </span>
                </span>
                <span aria-hidden="true" className="block h-1 overflow-hidden rounded-full bg-track">
                  <span
                    className={cn('block h-full rounded-full', you ? 'bg-primary' : 'bg-primary/60')}
                    style={{ width: `${share}%` }}
                  />
                </span>
              </span>
            </li>
          )
        })}
      </ul>
    </BlockCard>
  )
}
