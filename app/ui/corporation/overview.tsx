'use client'

import type { CorporationDetails } from '@/hooks/useCorporationDetails'
import { translate } from '@/i18n/dataview'
import { formatVNAFromUVNA } from '@/util/util'
import { Fact, formatDate, SectionUnavailable } from './shared'

export function OverviewFacts({ details, openProposals }: { details: CorporationDetails; openProposals: number }) {
  const { profile, members, policy, trustDeposit, operatorAuthorizations, proposals, degraded } = details
  const incomplete = degraded.trustDeposit || degraded.operatorAuthorizations || degraded.proposals
  const unknown = translate('common.unknown')
  const thresholdNote = policy.threshold
    ? ` · ${translate('corporation.page.threshold').toLowerCase()} ${policy.threshold}`
    : ''
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Fact
          label={translate('corporation.page.deposit')}
          value={degraded.trustDeposit ? unknown : formatVNAFromUVNA(String(trustDeposit?.deposit ?? 0))}
        />
        <Fact label={translate('corporation.tab.members')} value={`${members.length}${thresholdNote}`} />
        <Fact
          label={translate('corporation.tab.proposals')}
          value={
            degraded.proposals
              ? unknown
              : `${proposals.length} (${openProposals} ${translate('corporation.page.open')})`
          }
        />
        <Fact
          label={translate('corporation.tab.operators')}
          value={degraded.operatorAuthorizations ? unknown : operatorAuthorizations.length}
        />
        <Fact label={translate('corporation.page.language')} value={profile.language || translate('common.none')} />
        <Fact label={translate('corporation.page.created')} value={formatDate(profile.created)} />
        <Fact label={translate('corporation.page.modified')} value={formatDate(profile.modified)} />
      </div>
      {incomplete ? <SectionUnavailable /> : null}
    </div>
  )
}
