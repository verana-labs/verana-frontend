'use client'

import { KeyRoundIcon, LandmarkIcon, UsersIcon, VoteIcon } from 'lucide-react'
import type { CorporationDetails } from '@/hooks/useCorporationDetails'
import { translate } from '@/i18n/dataview'
import { currentDecisionRule, formatDecisionRule } from '@/lib/decision-policy'
import { NumberTicker } from '@/ui/motion/number-ticker'
import { Stagger, StaggerItem } from '@/ui/motion/stagger'
import { formatVNAFromUVNA } from '@/util/util'
import { atLeast, Fact, formatDate, SectionTitle, SectionUnavailable } from './shared'
import { StatTile, UnknownStat } from './stat-tile'

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

export function OverviewTiles({ details, openProposals }: { details: CorporationDetails; openProposals: number }) {
  const { members, policy, trustDeposit, operatorAuthorizations, feeGrants, proposals, degraded, partial } = details
  const unknown = <UnknownStat label={translate('common.unknown')} />
  const incomplete = degraded.trustDeposit || degraded.operatorAuthorizations || degraded.proposals
  const rule = currentDecisionRule(policy)
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
      hint: degraded.trustDeposit ? null : depositHint(trustDeposit?.deposit ?? 0),
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
  const { profile, policy } = details
  const rule = currentDecisionRule(policy)
  return (
    <div className="space-y-5">
      <SectionTitle>{translate('corporation.page.details')}</SectionTitle>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Fact
          label={translate(`corporation.page.${rule?.kind ?? 'threshold'}`)}
          value={rule ? formatDecisionRule(rule) : translate('common.none')}
        />
        <Fact
          label={translate('corporation.page.votingperiod')}
          value={policy.votingPeriod ?? translate('common.none')}
        />
        <Fact label={translate('corporation.page.language')} value={profile.language || translate('common.none')} />
        <Fact label={translate('corporation.page.totalweight')} value={policy.totalWeight} />
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
    </div>
  )
}
