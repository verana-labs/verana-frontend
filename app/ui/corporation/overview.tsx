'use client'

import type { CorporationDetails } from '@/hooks/useCorporationDetails'
import { translate } from '@/i18n/dataview'
import { formatVNAFromUVNA } from '@/util/util'
import { Fact, formatDate } from './shared'

export function OverviewFacts({ details, openProposals }: { details: CorporationDetails; openProposals: number }) {
  const { profile, members, policy, trustDeposit, operatorAuthorizations, proposals } = details
  const thresholdNote = policy.threshold
    ? ` · ${translate('corporation.page.threshold').toLowerCase()} ${policy.threshold}`
    : ''
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Fact
        label={translate('corporation.page.deposit')}
        value={formatVNAFromUVNA(String(trustDeposit?.deposit ?? 0))}
      />
      <Fact label={translate('corporation.tab.members')} value={`${members.length}${thresholdNote}`} />
      <Fact
        label={translate('corporation.tab.proposals')}
        value={`${proposals.length} (${openProposals} ${translate('corporation.page.open')})`}
      />
      <Fact label={translate('corporation.tab.operators')} value={operatorAuthorizations.length} />
      <Fact label={translate('corporation.page.language')} value={profile.language || translate('common.none')} />
      <Fact label={translate('corporation.page.created')} value={formatDate(profile.created)} />
      <Fact label={translate('corporation.page.modified')} value={formatDate(profile.modified)} />
    </div>
  )
}
