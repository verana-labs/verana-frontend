'use client'

import type { CorporationDetails } from '@/hooks/useCorporationDetails'
import { formatVNAFromUVNA } from '@/util/util'
import { Fact, formatDate, t } from './shared'

export function OverviewFacts({ details, openProposals }: { details: CorporationDetails; openProposals: number }) {
  const { profile, members, policy, trustDeposit, operatorAuthorizations, proposals } = details
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Fact
        label={t('corporation.page.deposit')}
        value={trustDeposit ? formatVNAFromUVNA(String(trustDeposit.deposit)) : '—'}
      />
      <Fact
        label={t('corporation.tab.members')}
        value={`${members.length} · ${t('corporation.page.threshold').toLowerCase()} ${policy.threshold ?? '—'}`}
      />
      <Fact
        label={t('corporation.tab.proposals')}
        value={`${proposals.length} (${openProposals} ${t('corporation.page.open')})`}
      />
      <Fact label={t('corporation.tab.operators')} value={operatorAuthorizations.length} />
      <Fact label={t('corporation.page.language')} value={profile.language || '—'} />
      <Fact label={t('corporation.page.created')} value={formatDate(profile.created)} />
      <Fact label={t('corporation.page.modified')} value={formatDate(profile.modified)} />
    </div>
  )
}
