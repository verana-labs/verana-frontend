'use client'

import type { ReactNode } from 'react'
import type { CorporationDetails } from '@/hooks/useCorporationDetails'
import type { ActionSigning } from '@/hooks/useSigningMode'
import type { CorporationMembership } from '@/lib/corporation-discovery'
import type { DidEnrichment } from '@/lib/resolverClient'
import type { CorporationSigningMode } from '@/msg/actions_hooks/actionCorporationManage'
import { ActivityTimeline } from './activity'
import { CorporationHeader, RotateDidForm } from './header'
import { MembersSection } from './members'
import { OperatorsSection } from './operators'
import { OverviewFacts } from './overview'
import { type ProposalContext, ProposalsSection } from './proposals'
import { Card, SectionTitle, t } from './shared'
import { TrustDepositSection } from './trust-deposit'

export const TABS = ['overview', 'members', 'deposit', 'operators', 'proposals'] as const
export type CorporationTab = (typeof TABS)[number]

export interface CorporationView {
  acting: CorporationMembership
  details: CorporationDetails
  enrichment: DidEnrichment | null
  walletAddress: string | undefined
  openProposals: number
  unrepaidSlash: number
  rotate: ActionSigning
  modes: {
    grant: CorporationSigningMode | null
    revoke: CorporationSigningMode | null
    repay: CorporationSigningMode | null
  }
  rotating: boolean
  onToggleRotate: () => void
  onRotate: (did: string) => void
  onCreate: () => void
  onGrant: (grantee: string, msgTypes: string[]) => void
  onRevoke: (operator: string) => void
  onRepay: () => void
  composing: boolean
  onCompose: () => void
  composer: ReactNode
  proposalCtx: ProposalContext
}

function section(view: CorporationView, tab: CorporationTab) {
  const { details } = view
  switch (tab) {
    case 'members':
      return <MembersSection members={details.members} policy={details.policy} walletAddress={view.walletAddress} />
    case 'deposit':
      return (
        <TrustDepositSection
          trustDeposit={details.trustDeposit}
          unrepaidSlash={view.unrepaidSlash}
          repayMode={view.modes.repay}
          onRepay={view.onRepay}
        />
      )
    case 'operators':
      return (
        <OperatorsSection
          authorizations={details.operatorAuthorizations}
          vsAuthorizations={details.vsOperatorAuthorizations}
          revokeMode={view.modes.revoke}
          grantMode={view.modes.grant}
          walletAddress={view.walletAddress}
          onRevoke={view.onRevoke}
          onGrant={view.onGrant}
        />
      )
    case 'proposals':
      return (
        <ProposalsSection
          proposals={details.proposals}
          ctx={view.proposalCtx}
          composing={view.composing}
          onCompose={view.onCompose}
          composer={view.composer}
        />
      )
    default:
      return (
        <Card id="overview">
          <OverviewFacts details={details} openProposals={view.openProposals} />
        </Card>
      )
  }
}

export function TabsLayout({
  view,
  tab,
  onSelectTab,
}: {
  view: CorporationView
  tab: CorporationTab
  onSelectTab: (tab: CorporationTab) => void
}) {
  const nav = (
    <nav className="mt-6 flex flex-wrap gap-1 border-b border-neutral-20 dark:border-neutral-70 -mb-6 -mx-6 px-6">
      {TABS.map((entry) => (
        <button
          key={entry}
          type="button"
          onClick={() => onSelectTab(entry)}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${
            tab === entry
              ? 'border-primary-600 text-primary-700 dark:text-primary-300'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          {t(`corporation.tab.${entry}`)}
          {entry === 'proposals' && view.openProposals > 0 ? (
            <span className="ml-2 min-w-4 h-4 px-1 bg-red-500 text-white text-xs font-bold rounded-full inline-flex items-center justify-center leading-none">
              {view.openProposals}
            </span>
          ) : null}
        </button>
      ))}
    </nav>
  )
  return (
    <>
      <CorporationHeader
        profile={view.details.profile}
        enrichment={view.enrichment}
        rotate={view.rotate}
        rotating={view.rotating}
        onToggleRotate={view.onToggleRotate}
        onCreate={view.onCreate}
        rotateForm={view.rotate.mode ? <RotateDidForm mode={view.rotate.mode} onSubmit={view.onRotate} /> : null}
        nav={nav}
      />
      {section(view, tab)}
      {tab === 'overview' ? (
        <div className="mt-6">
          <Card id="activity">
            <div className="mb-3">
              <SectionTitle>{t('corporation.page.activity')}</SectionTitle>
            </div>
            <ActivityTimeline rows={view.details.history} limit={5} />
          </Card>
        </div>
      ) : null}
    </>
  )
}
