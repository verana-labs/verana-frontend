'use client'

import { HistoryIcon, InfoIcon } from 'lucide-react'
import { type ReactNode, useEffect, useRef } from 'react'
import type { CorporationDetails } from '@/hooks/useCorporationDetails'
import type { ActionSigning } from '@/hooks/useSigningMode'
import { translate } from '@/i18n/dataview'
import type { CorporationMembership } from '@/lib/corporation-discovery'
import type { OperatorGrantOptions } from '@/lib/operator-grant'
import type { DidEnrichment } from '@/lib/resolverClient'
import { cn } from '@/lib/utils'
import type { CorporationSigningMode } from '@/msg/actions_hooks/actionCorporationManage'
import { BlockCard } from '@/ui/common/block-card'
import { BlurFade } from '@/ui/motion/blur-fade'
import { TabIndicator } from '@/ui/motion/tab-indicator'
import { ActivityTimeline } from './activity'
import { GovernanceSection } from './governance'
import { CorporationHeader, RotateDidForm } from './header'
import { MembersSection } from './members'
import { OperatorsSection } from './operators'
import { MemberWeights, OverviewDetails, OverviewTiles, RecentProposals } from './overview'
import { type ProposalContext, ProposalsSection } from './proposals'
import { atLeast } from './shared'
import { TrustDepositSection } from './trust-deposit'

export const TABS = ['overview', 'members', 'governance', 'deposit', 'operators', 'proposals'] as const
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
  }
  rotating: boolean
  onToggleRotate: () => void
  onRotate: (did: string) => void
  onCreate: () => void
  onRefresh: () => void
  onGrant: (
    grantee: string,
    msgTypes: string[],
    options: OperatorGrantOptions,
    replacesFeeGrant: boolean
  ) => Promise<boolean>
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
    case 'governance':
      return (
        <GovernanceSection
          corporationId={details.profile.id}
          language={details.profile.language}
          governance={details.governance}
          onRefresh={view.onRefresh}
        />
      )
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
          feeGrants={details.feeGrants}
          participantsById={details.participantsById}
          revokeMode={view.modes.revoke}
          grantMode={view.modes.grant}
          walletAddress={view.walletAddress}
          degradedOperators={details.degraded.operatorAuthorizations}
          degradedAgents={details.degraded.vsOperatorAuthorizations}
          degradedFeeGrants={details.degraded.feeGrants}
          partialOperators={details.partial.operatorAuthorizations || details.partial.feeGrants}
          partialAgents={details.partial.vsOperatorAuthorizations || details.partial.participants}
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
          degraded={details.degraded.proposals}
          partial={details.partial.proposals}
          onCompose={view.onCompose}
          composer={view.composer}
        />
      )
    default:
      return (
        <div id="overview" className="space-y-4 lg:space-y-5">
          <OverviewTiles details={details} openProposals={view.openProposals} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
            <div id="activity" className="min-w-0 scroll-mt-20 lg:col-span-2">
              <BlockCard icon={<HistoryIcon />} title={translate('activity.title')} className="h-full">
                <ActivityTimeline rows={details.history} limit={5} />
              </BlockCard>
            </div>
            <BlockCard icon={<InfoIcon />} title={translate('corporation.page.details')}>
              <OverviewDetails details={details} />
            </BlockCard>
            {details.degraded.proposals ? null : (
              <div className="lg:col-span-2">
                <RecentProposals details={details} />
              </div>
            )}
            <div className={details.degraded.proposals ? 'lg:col-span-3' : undefined}>
              <MemberWeights details={details} walletAddress={view.walletAddress} />
            </div>
          </div>
        </div>
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
  const navRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const nav = navRef.current
    const active = nav?.querySelector<HTMLElement>(`[data-tab="${tab}"]`)
    if (!nav || !active) return
    const start = active.offsetLeft - nav.offsetLeft
    if (start < nav.scrollLeft || start + active.offsetWidth > nav.scrollLeft + nav.clientWidth) {
      nav.scrollTo({ left: start - 16 })
    }
  }, [tab])
  const nav = (
    <nav
      ref={navRef}
      aria-label={translate('corporation.page.title')}
      className="flex gap-1 overflow-x-auto border-t border-border px-3 [scrollbar-width:none] sm:px-4"
    >
      {TABS.map((entry) => {
        const active = tab === entry
        return (
          <button
            key={entry}
            type="button"
            data-tab={entry}
            onClick={() => onSelectTab(entry)}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative isolate flex h-11 shrink-0 items-center gap-2 px-3 text-sm font-medium whitespace-nowrap outline-none transition-colors duration-(--duration-base) ease-standard focus-visible:rounded-md focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset',
              active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {translate(`corporation.tab.${entry}`)}
            {entry === 'proposals' && view.openProposals > 0 ? (
              <span className="inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] leading-none font-semibold text-white tabular-nums dark:text-neutral-950">
                {atLeast(view.openProposals, view.details.partial.proposals)}
              </span>
            ) : null}
            {active ? (
              <TabIndicator layoutId="corporation-tabs" variant="underline" className="-bottom-px rounded-full" />
            ) : null}
          </button>
        )
      })}
    </nav>
  )
  return (
    <>
      <CorporationHeader
        profile={view.details.profile}
        members={view.details.members}
        enrichment={view.enrichment}
        rotate={view.rotate}
        rotating={view.rotating}
        onToggleRotate={view.onToggleRotate}
        onCreate={view.onCreate}
        rotateForm={view.rotate.mode ? <RotateDidForm mode={view.rotate.mode} onSubmit={view.onRotate} /> : null}
        nav={nav}
      />
      <BlurFade key={tab} className="mt-5">
        {section(view, tab)}
      </BlurFade>
    </>
  )
}
