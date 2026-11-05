'use client'

import type { CorporationDetails } from '@/hooks/useCorporationDetails'
import { translate } from '@/i18n/dataview'
import { currentDecisionRule, formatDecisionRule } from '@/lib/decision-policy'
import { formatVNAFromUVNA } from '@/util/util'
import { atLeast, Fact, formatDate, SectionUnavailable } from './shared'

const FACT_TILE = 'rounded-lg bg-tint-neutral px-4 py-3'

export function OverviewFacts({ details, openProposals }: { details: CorporationDetails; openProposals: number }) {
  const { profile, members, policy, trustDeposit, operatorAuthorizations, proposals, degraded, partial } = details
  const incomplete = degraded.trustDeposit || degraded.operatorAuthorizations || degraded.proposals
  const unknown = translate('common.unknown')
  const rule = currentDecisionRule(policy)
  const thresholdNote = rule
    ? ` · ${translate(rule.kind === 'threshold' ? 'corporation.page.threshold' : 'corporation.page.percentage').toLowerCase()} ${formatDecisionRule(rule)}`
    : ''
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Fact
          label={translate('corporation.page.deposit')}
          value={degraded.trustDeposit ? unknown : formatVNAFromUVNA(String(trustDeposit?.deposit ?? 0))}
          className={FACT_TILE}
        />
        <Fact
          label={translate('corporation.tab.members')}
          value={`${members.length}${thresholdNote}`}
          className={FACT_TILE}
        />
        <Fact
          label={translate('corporation.tab.proposals')}
          value={
            degraded.proposals
              ? unknown
              : `${atLeast(proposals.length, partial.proposals)} (${atLeast(openProposals, partial.proposals)} ${translate('corporation.page.open')})`
          }
          className={FACT_TILE}
        />
        <Fact
          label={translate('corporation.tab.operators')}
          value={
            degraded.operatorAuthorizations
              ? unknown
              : atLeast(operatorAuthorizations.length, partial.operatorAuthorizations)
          }
          className={FACT_TILE}
        />
        <Fact
          label={translate('corporation.page.language')}
          value={profile.language || translate('common.none')}
          className={FACT_TILE}
        />
        <Fact label={translate('corporation.page.created')} value={formatDate(profile.created)} className={FACT_TILE} />
        <Fact
          label={translate('corporation.page.modified')}
          value={formatDate(profile.modified)}
          className={FACT_TILE}
        />
      </div>
      {incomplete ? <SectionUnavailable /> : null}
    </div>
  )
}
