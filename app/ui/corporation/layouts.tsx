'use client'

import type { ReactNode } from 'react'
import type { CorporationDetails } from '@/hooks/useCorporationDetails'
import type { ActionSigning } from '@/hooks/useSigningMode'
import { translate } from '@/i18n/dataview'
import type { CorporationMembership } from '@/lib/corporation-discovery'
import type { DidEnrichment } from '@/lib/resolverClient'
import type { CorporationSigningMode, GovernanceDocumentDraft } from '@/msg/actions_hooks/actionCorporationManage'
import { ActivityTimeline } from './activity'
import { GovernanceSection } from './governance'
import { CorporationHeader, RotateDidForm } from './header'
import { MembersSection } from './members'
import { OperatorsSection } from './operators'
import { OverviewFacts } from './overview'
import { type ProposalContext, ProposalsSection } from './proposals'
import { Card, SectionTitle } from './shared'
import { TrustDepositSection } from './trust-deposit'

export const TABS = ['overview', 'members', 'deposit', 'operators', 'governance', 'proposals'] as const
export type CorporationTab = (typeof TABS)[number]

export interface CorporationView {
  actingCorporation: CorporationMembership
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
    addDocument: CorporationSigningMode | null
    increaseVersion: CorporationSigningMode | null
  }
  rotating: boolean
  onToggleRotate: () => void
  onRotate: (did: string) => void
  onCreate: () => void
  onGrant: (grantee: string, msgTypes: string[]) => void
  onRevoke: (operator: string) => void
  onRepay: () => void
  onAddDocument: (draft: GovernanceDocumentDraft) => void
  onIncreaseVersion: (version: number) => void
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
          degraded={details.degraded.trustDeposit}
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
          degraded={details.degraded.operatorAuthorizations}
          onRevoke={view.onRevoke}
          onGrant={view.onGrant}
        />
      )
    case 'governance':
      return (
        <GovernanceSection
          governance={details.governance}
          addMode={view.modes.addDocument}
          increaseMode={view.modes.increaseVersion}
          onAddDocument={view.onAddDocument}
          onIncreaseVersion={view.onIncreaseVersion}
        />
      )
    case 'proposals':
      return (
        <ProposalsSection
          proposals={details.proposals}
          ctx={view.proposalCtx}
          composing={view.composing}
          degraded={details.degraded.proposals}
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
          {translate(`corporation.tab.${entry}`)}
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
              <SectionTitle>{translate('corporation.page.activity')}</SectionTitle>
            </div>
            <ActivityTimeline rows={view.details.history} limit={5} />
          </Card>
        </div>
      ) : null}
    </>
  )
}
