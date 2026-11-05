'use client'

import { ChevronDownIcon, PlusIcon, VoteIcon } from 'lucide-react'
import { type ReactNode, useEffect, useReducer, useRef, useState } from 'react'
import {
  type GroupPolicy,
  type ProposalRow,
  type ProposalTally,
  proposalExecutableFrom,
  proposalTallyScale,
  type TallyScale,
  useProposalVotes,
} from '@/hooks/useCorporationDetails'
import { translate } from '@/i18n/dataview'
import { formatDecisionRule } from '@/lib/decision-policy'
import { cn } from '@/lib/utils'
import type { VoteChoice } from '@/msg/actions_hooks/actionCorporationManage'
import { EmptyState } from '@/ui/common/empty-state'
import { type Tone, ToneTag } from '@/ui/common/tone-tag'
import { BlurFade } from '@/ui/motion/blur-fade'
import { Stagger, StaggerItem } from '@/ui/motion/stagger'
import { TabIndicator } from '@/ui/motion/tab-indicator'
import { Button } from '@/ui/shadcn/button'
import { shortenMiddle } from '@/util/util'
import { CategoryBar } from './category-bar'
import {
  atLeast,
  Card,
  formatDate,
  formatRelative,
  PartialNote,
  SectionHeader,
  SectionUnavailable,
  StatusBadge,
} from './shared'
import { revealChild, useScrollEdges } from './use-scroll-edges'

const FILTERS = ['all', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'ABORTED', 'WITHDRAWN'] as const
type Filter = (typeof FILTERS)[number]

const FILTER_KEYS: Record<Filter, string> = {
  all: 'corporation.proposals.filter.all',
  SUBMITTED: 'corporation.proposals.filter.open',
  ACCEPTED: 'corporation.proposals.filter.accepted',
  REJECTED: 'corporation.proposals.filter.rejected',
  ABORTED: 'corporation.proposals.filter.aborted',
  WITHDRAWN: 'corporation.proposals.filter.withdrawn',
}

const SOLID_SUCCESS = 'bg-success text-white hover:bg-success/85 dark:text-neutral-950'
const SOLID_DESTRUCTIVE = 'bg-destructive text-white hover:bg-destructive/85 dark:text-neutral-950'

const VOTE_BUTTONS: { choice: VoteChoice; key: string; variant: 'default' | 'outline'; className: string }[] = [
  { choice: 'yes', key: 'corporation.proposals.voteyes', variant: 'default', className: SOLID_SUCCESS },
  { choice: 'no', key: 'corporation.proposals.voteno', variant: 'default', className: SOLID_DESTRUCTIVE },
  { choice: 'abstain', key: 'corporation.proposals.voteabstain', variant: 'outline', className: '' },
  {
    choice: 'veto',
    key: 'corporation.proposals.voteveto',
    variant: 'outline',
    className: 'border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive',
  },
]

const TALLY_SEGMENTS: { key: keyof ProposalTally; className: string }[] = [
  { key: 'yes', className: 'bg-success' },
  { key: 'no', className: 'bg-destructive' },
  { key: 'veto', className: 'bg-destructive/55' },
  { key: 'abstain', className: 'bg-muted-foreground/45' },
]

const VOTE_TONES: Record<string, Tone> = {
  YES: 'success',
  NO: 'destructive',
  NO_WITH_VETO: 'destructive',
  ABSTAIN: 'neutral',
}

function VoteBadge({ option }: { option: string }) {
  return (
    <ToneTag tone={VOTE_TONES[option.replace(/^VOTE_OPTION_/, '')] ?? 'neutral'} className="ms-auto font-mono">
      {option}
    </ToneTag>
  )
}

export interface ProposalActions {
  onVote: (id: number, choice: VoteChoice) => void
  onExecute: (id: number) => void
  onWithdraw: (id: number) => void
}

export interface ProposalContext {
  policy: GroupPolicy
  isMember: boolean
  walletAddress: string | undefined
  votesVersion: number
  actions: ProposalActions
}

const MAX_TIMEOUT_MS = 2_147_483_647

const TALLY_TEXT = 'text-xs font-medium text-foreground tabular-nums whitespace-nowrap'

export function TallyBar({ tally, scale }: { tally: ProposalTally; scale: TallyScale }) {
  const { total, threshold, percentage } = scale
  if (total === null) {
    return (
      <p className={TALLY_TEXT}>
        {translate('corporation.proposals.tally.votes', {
          yes: tally.yes,
          no: tally.no,
          abstain: tally.abstain,
          veto: tally.veto,
        })}
      </p>
    )
  }
  const cast = tally.yes + tally.no + tally.veto + tally.abstain
  return (
    <div className="min-w-[8rem] space-y-2.5">
      <CategoryBar
        segments={[
          ...TALLY_SEGMENTS.map((segment) => ({
            key: segment.key,
            value: tally[segment.key],
            className: segment.className,
          })),
          { key: 'remaining', value: Math.max(total - cast, 0), className: 'bg-transparent' },
        ]}
        marker={threshold !== null && threshold > 0 && total > 0 ? threshold : undefined}
      />
      <p className={TALLY_TEXT}>
        {threshold === null
          ? translate('corporation.proposals.tally.total', { yes: tally.yes, total })
          : translate('corporation.proposals.tally', {
              yes: tally.yes,
              total,
              threshold: percentage === null ? threshold : formatDecisionRule({ kind: 'percentage', percentage }),
            })}
      </p>
    </div>
  )
}

function hasEnded(votingPeriodEnd: string | null): boolean {
  if (!votingPeriodEnd) return false
  const end = Date.parse(votingPeriodEnd)
  return Number.isFinite(end) && end <= Date.now()
}

function proposerList(proposal: ProposalRow): string {
  return proposal.proposers.map((proposer) => shortenMiddle(proposer, 16)).join(', ')
}

function ExecutorBadge({ result }: { result: string }) {
  const tone: Tone = result === 'SUCCESS' ? 'success' : result === 'FAILURE' ? 'destructive' : 'neutral'
  return (
    <ToneTag tone={tone}>
      {translate('corporation.proposals.executor')}: {result}
    </ToneTag>
  )
}

function ProposalDetail({ proposal, ctx }: { proposal: ProposalRow; ctx: ProposalContext }) {
  const votes = useProposalVotes(proposal.id)
  const open = ctx.isMember && proposal.status === 'SUBMITTED'
  const votable = open && !hasEnded(proposal.votingPeriodEnd)
  const voted = votes == null || votes.value.some((vote) => vote.voter === ctx.walletAddress)
  const withdrawable = open && ctx.walletAddress !== undefined && proposal.proposers.includes(ctx.walletAddress)
  const executable = ctx.isMember && proposal.status === 'ACCEPTED' && proposal.executorResult !== 'SUCCESS'
  const executableFrom = proposalExecutableFrom(proposal, ctx.policy)
  const waiting = executableFrom !== null && executableFrom > Date.now()
  const [, rerender] = useReducer((count: number) => count + 1, 0)

  useEffect(() => {
    if (executableFrom === null) return
    let timer: ReturnType<typeof setTimeout>
    const arm = () => {
      const remaining = Math.max(0, executableFrom - Date.now())
      timer = setTimeout(remaining > MAX_TIMEOUT_MS ? arm : rerender, Math.min(remaining, MAX_TIMEOUT_MS))
    }
    arm()
    return () => clearTimeout(timer)
  }, [executableFrom])

  return (
    <div className="min-w-0 space-y-5">
      <div className="space-y-2">
        {proposal.messages.map((message, index) => (
          <pre
            key={`${proposal.id}-${index}-${String(message['@type'] ?? '')}`}
            className="max-h-80 overflow-y-auto rounded-lg bg-muted/60 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap text-foreground ring-1 ring-border/60 outline-none [overflow-wrap:anywhere] focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {JSON.stringify(message, null, 2)}
          </pre>
        ))}
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">{translate('corporation.proposals.votes')}</p>
        {votes?.partial ? <PartialNote /> : null}
        {votes === undefined ? (
          <div role="status" className="h-8 w-48 animate-pulse rounded-md bg-muted">
            <span className="sr-only">{translate('corporation.page.loading')}</span>
          </div>
        ) : votes === null ? (
          <p className="text-sm text-destructive">{translate('corporation.proposals.voteserror')}</p>
        ) : votes.value.length === 0 ? (
          <p className="text-sm text-muted-foreground">{translate('corporation.proposals.novotes')}</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg ring-1 ring-border">
            {votes.value.map((vote) => (
              <li key={vote.voter} className="flex items-center gap-2.5 px-3 py-2 text-sm">
                <span className="min-w-0 truncate font-mono text-xs">{shortenMiddle(vote.voter, 24)}</span>
                <VoteBadge option={vote.option} />
              </li>
            ))}
          </ul>
        )}
      </div>
      {votable || withdrawable || executable ? (
        <div className="flex flex-wrap items-center gap-2">
          {votable
            ? VOTE_BUTTONS.map((button) => (
                <Button
                  key={button.choice}
                  type="button"
                  variant={button.variant}
                  onClick={() => ctx.actions.onVote(proposal.id, button.choice)}
                  disabled={voted}
                  className={cn('h-8 px-3', button.className)}
                >
                  {translate(button.key)}
                </Button>
              ))
            : null}
          {withdrawable ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => ctx.actions.onWithdraw(proposal.id)}
              className="h-8 px-3 text-muted-foreground"
            >
              {translate('corporation.proposals.withdraw')}
            </Button>
          ) : null}
          {executable && waiting ? (
            <p className="text-sm text-muted-foreground">
              {translate('corporation.proposals.executablefrom', { date: new Date(executableFrom).toLocaleString() })}
            </p>
          ) : executable ? (
            <Button type="button" onClick={() => ctx.actions.onExecute(proposal.id)} className="h-8 px-3">
              {translate('corporation.proposals.execute')}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function ProposalCard({ proposal, ctx }: { proposal: ProposalRow; ctx: ProposalContext }) {
  const [open, setOpen] = useState(false)
  const ends = proposal.status === 'SUBMITTED' ? formatRelative(proposal.votingPeriodEnd) : null
  const proposers = proposerList(proposal)
  const ran = proposal.executorResult && proposal.executorResult !== 'NOT_RUN' ? proposal.executorResult : null

  return (
    <article
      className={cn(
        'rounded-xl bg-card shadow-hairline transition-shadow duration-(--duration-base) ease-standard hover:shadow-card',
        open && 'shadow-raised ring-1 ring-primary/25'
      )}
    >
      <div className="relative flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 pt-4 pb-3">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="flex min-w-0 items-center gap-3 text-start outline-none after:absolute after:inset-0 after:rounded-t-xl focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50"
        >
          <span className="font-mono text-sm font-medium text-muted-foreground">#{proposal.id}</span>
        </button>
        <StatusBadge status={proposal.status} />
        {ran ? <ExecutorBadge result={ran} /> : null}
        <span className="pointer-events-none ms-auto flex items-center gap-3 text-xs text-muted-foreground">
          <span className="hidden max-w-64 truncate font-mono md:inline">{proposers}</span>
          <span className="tabular-nums">{ends ?? formatDate(proposal.submitTime)}</span>
          <ChevronDownIcon
            aria-hidden="true"
            className={cn('size-4 transition-transform duration-(--duration-base) ease-standard', open && 'rotate-180')}
          />
        </span>
        {proposers ? (
          <span className="pointer-events-none w-full truncate font-mono text-xs text-muted-foreground md:hidden">
            {proposers}
          </span>
        ) : null}
      </div>
      <div className="px-4 pb-4">
        <TallyBar tally={proposal.tally} scale={proposalTallyScale(proposal, ctx.policy)} />
      </div>
      {open ? (
        <div className="border-t border-border p-4 animate-in fade-in-0 slide-in-from-top-1">
          <ProposalDetail key={ctx.votesVersion} proposal={proposal} ctx={ctx} />
        </div>
      ) : null}
    </article>
  )
}

export function ProposalsSection({
  proposals,
  ctx,
  composing,
  degraded,
  partial,
  onCompose,
  composer,
}: {
  proposals: ProposalRow[]
  ctx: ProposalContext
  composing: boolean
  degraded: boolean
  partial: boolean
  onCompose: () => void
  composer: ReactNode
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const visible = filter === 'all' ? proposals : proposals.filter((proposal) => proposal.status === filter)
  const filtersRef = useRef<HTMLDivElement>(null)
  const fade = useScrollEdges(filtersRef)

  return (
    <Card id="proposals">
      <SectionHeader
        icon={<VoteIcon />}
        title={translate('corporation.tab.proposals')}
        action={
          ctx.isMember && !composing ? (
            <Button type="button" size="lg" onClick={onCompose} className="gap-2">
              <PlusIcon aria-hidden="true" />
              {translate('corporation.composer.new')}
            </Button>
          ) : null
        }
      />
      {composing ? <BlurFade className="mb-6">{composer}</BlurFade> : null}
      {partial ? <PartialNote filtered /> : null}
      <div
        ref={filtersRef}
        className={cn(
          'mb-5 flex w-fit max-w-full flex-nowrap gap-1 overflow-x-auto rounded-lg bg-tint-neutral p-1 [scrollbar-width:none]',
          fade
        )}
      >
        {FILTERS.map((entry) => {
          const count = entry === 'all' ? proposals.length : proposals.filter((p) => p.status === entry).length
          const active = filter === entry
          return (
            <button
              key={entry}
              type="button"
              onClick={(event) => {
                setFilter(entry)
                if (filtersRef.current) revealChild(filtersRef.current, event.currentTarget)
              }}
              aria-pressed={active}
              className={cn(
                'relative isolate flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium outline-none transition-colors duration-(--duration-base) focus-visible:ring-[3px] focus-visible:ring-ring/50',
                active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {active ? <TabIndicator layoutId="corporation-proposal-filter" /> : null}
              {translate(FILTER_KEYS[entry])}
              <span
                className={cn(
                  'inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[11px] leading-none tabular-nums',
                  active ? 'bg-tint-accent text-primary' : 'text-muted-foreground'
                )}
              >
                {atLeast(count, partial)}
              </span>
            </button>
          )
        })}
      </div>
      {degraded ? (
        <SectionUnavailable />
      ) : visible.length === 0 ? (
        <EmptyState icon={<VoteIcon />} title={translate('corporation.page.proposals.empty')} />
      ) : (
        <Stagger className="space-y-3">
          {visible.map((proposal) => (
            <StaggerItem key={proposal.id}>
              <ProposalCard proposal={proposal} ctx={ctx} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </Card>
  )
}
