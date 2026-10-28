'use client'

import { ChevronDownIcon, PlusIcon, VoteIcon } from 'lucide-react'
import { type ReactNode, useEffect, useReducer, useState } from 'react'
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
import { BlurFade } from '@/ui/motion/blur-fade'
import { Stagger, StaggerItem } from '@/ui/motion/stagger'
import { TabIndicator } from '@/ui/motion/tab-indicator'
import { Avatar, AvatarFallback } from '@/ui/shadcn/avatar'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from '@/ui/shadcn/empty'
import { shortenMiddle } from '@/util/util'
import { humanizeMsg } from './activity'
import { CategoryBar } from './category-bar'
import {
  addressInitials,
  atLeast,
  Card,
  formatDate,
  formatRelative,
  PartialNote,
  SectionHeader,
  SectionUnavailable,
  STATUS_TONE,
  StatusBadge,
  statusLabel,
} from './shared'
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from './timeline'

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

const TALLY_SEGMENTS: { key: keyof ProposalTally; className: string; dot: string }[] = [
  { key: 'yes', className: 'bg-success', dot: 'bg-success' },
  { key: 'no', className: 'bg-destructive', dot: 'bg-destructive' },
  { key: 'veto', className: 'bg-destructive/55', dot: 'bg-destructive/55' },
  { key: 'abstain', className: 'bg-muted-foreground/45', dot: 'bg-muted-foreground/45' },
]

const VOTE_OPTIONS: Record<string, { key: keyof ProposalTally; tone: string }> = {
  YES: { key: 'yes', tone: 'border-success/25 bg-success/10 text-success' },
  NO: { key: 'no', tone: 'border-destructive/25 bg-destructive/10 text-destructive' },
  NO_WITH_VETO: { key: 'veto', tone: 'border-destructive/25 bg-destructive/10 text-destructive' },
  ABSTAIN: { key: 'abstain', tone: 'border-border bg-muted text-muted-foreground' },
}

function VoteBadge({ option }: { option: string }) {
  const known = VOTE_OPTIONS[option.replace(/^VOTE_OPTION_/, '')]
  return (
    <Badge variant="outline" className={cn('ms-auto', known?.tone ?? 'bg-muted font-mono text-[10px]')}>
      {known ? translate(`corporation.proposals.option.${known.key}`) : option}
    </Badge>
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

function TallyLegend({ tally }: { tally: ProposalTally }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {TALLY_SEGMENTS.filter((segment) => segment.key !== 'veto' || tally.veto > 0).map((segment) => (
        <li key={segment.key} className="flex items-center gap-1.5 tabular-nums">
          <span aria-hidden="true" className={cn('size-2 rounded-full', segment.dot)} />
          {translate(`corporation.proposals.option.${segment.key}`)} {tally[segment.key]}
        </li>
      ))}
    </ul>
  )
}

export function TallyBar({ tally, scale }: { tally: ProposalTally; scale: TallyScale }) {
  const { total, threshold, percentage } = scale
  if (total === null) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={TALLY_TEXT}>
          {translate('corporation.proposals.tally.votes', {
            yes: tally.yes,
            no: tally.no,
            abstain: tally.abstain,
            veto: tally.veto,
          })}
        </p>
      </div>
    )
  }
  const cast = tally.yes + tally.no + tally.veto + tally.abstain
  const thresholdText =
    threshold === null
      ? null
      : percentage === null
        ? String(threshold)
        : formatDecisionRule({ kind: 'percentage', percentage })
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
        marker={
          threshold !== null && threshold > 0 && total > 0 && thresholdText !== null
            ? { value: threshold, tooltip: translate('corporation.proposals.marker', { threshold: thresholdText }) }
            : undefined
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className={TALLY_TEXT}>
          {threshold === null
            ? translate('corporation.proposals.tally.total', { yes: tally.yes, total })
            : translate('corporation.proposals.tally', { yes: tally.yes, total, threshold: thresholdText ?? '' })}
        </p>
        <TallyLegend tally={tally} />
      </div>
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

function messageTitle(proposal: ProposalRow): string | null {
  const type = proposal.messages[0]?.['@type']
  if (typeof type !== 'string') return null
  const name = humanizeMsg(type.split('.').pop() ?? type)
  return proposal.messages.length > 1 ? `${name} +${proposal.messages.length - 1}` : name
}

function executorLabel(result: string): string {
  const key = `corporation.proposals.executor.${result}`
  const label = translate(key)
  return label === key ? result : label
}

function ExecutorBadge({ result }: { result: string }) {
  const tone =
    result === 'SUCCESS'
      ? 'border-success/25 bg-success/10 text-success'
      : result === 'FAILURE'
        ? 'border-destructive/25 bg-destructive/10 text-destructive'
        : 'border-border bg-muted text-muted-foreground'
  return (
    <Badge variant="outline" className={tone}>
      {executorLabel(result)}
    </Badge>
  )
}

type StageState = 'done' | 'pending' | 'skipped'

function Lifecycle({ proposal }: { proposal: ProposalRow }) {
  const open = proposal.status === 'SUBMITTED'
  const ended = !open || hasEnded(proposal.votingPeriodEnd)
  const ran = proposal.executorResult !== null && proposal.executorResult !== 'NOT_RUN'
  const skipExecution = !open && proposal.status !== 'ACCEPTED' && !ran
  const pending = translate('corporation.proposals.stage.pending')
  const stages: { key: string; state: StageState; dot?: string; date: string | null; content: ReactNode }[] = [
    {
      key: 'submitted',
      state: 'done',
      date: formatDate(proposal.submitTime),
      content: <span className="font-mono break-all">{proposerList(proposal)}</span>,
    },
    {
      key: 'voting',
      state: ended ? 'done' : 'pending',
      date: formatRelative(proposal.votingPeriodEnd) ?? formatDate(proposal.votingPeriodEnd),
      content: null,
    },
    {
      key: 'outcome',
      state: open ? 'pending' : 'done',
      dot: open ? undefined : STATUS_TONE[proposal.status]?.dot,
      date: null,
      content: open ? pending : statusLabel(proposal.status),
    },
    {
      key: 'execution',
      state: skipExecution ? 'skipped' : proposal.executorResult === 'SUCCESS' ? 'done' : 'pending',
      dot: proposal.executorResult === 'FAILURE' ? 'bg-destructive' : undefined,
      date: null,
      content: skipExecution
        ? translate('corporation.proposals.stage.skipped')
        : ran && proposal.executorResult
          ? executorLabel(proposal.executorResult)
          : pending,
    },
  ]
  return (
    <Timeline className="h-fit rounded-lg bg-muted/40 p-4 ring-1 ring-border/60">
      {stages.map((stage) => (
        <TimelineItem key={stage.key} done={stage.state === 'done'}>
          <TimelineIndicator
            className={cn(
              stage.state === 'skipped' && 'border-dashed border-muted-foreground/40',
              stage.dot && 'border-transparent'
            )}
          >
            {stage.dot ? (
              <span className={cn('size-2.5 rounded-full', stage.dot)} />
            ) : stage.state === 'done' ? (
              <span className="size-1.5 rounded-full bg-primary" />
            ) : null}
          </TimelineIndicator>
          <TimelineSeparator />
          <TimelineTitle
            className={cn(
              stage.state !== 'done' && 'text-muted-foreground',
              stage.state === 'skipped' && 'line-through decoration-muted-foreground/50'
            )}
          >
            {translate(`corporation.proposals.stage.${stage.key}`)}
          </TimelineTitle>
          {stage.date ? <TimelineDate>{stage.date}</TimelineDate> : null}
          {stage.content ? <TimelineContent>{stage.content}</TimelineContent> : null}
        </TimelineItem>
      ))}
    </Timeline>
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
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_15rem]">
      <div className="min-w-0 space-y-5">
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
        <div className="space-y-2">
          {proposal.messages.map((message, index) => (
            <pre
              key={`${proposal.id}-${index}-${String(message['@type'] ?? '')}`}
              className="max-h-80 overflow-auto rounded-lg bg-muted/60 p-3 font-mono text-xs leading-relaxed text-foreground ring-1 ring-border/60"
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
                  <Avatar size="sm">
                    <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                      {addressInitials(vote.voter)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 truncate font-mono text-xs">{shortenMiddle(vote.voter, 24)}</span>
                  <VoteBadge option={vote.option} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <Lifecycle proposal={proposal} />
    </div>
  )
}

function ProposalCard({ proposal, ctx }: { proposal: ProposalRow; ctx: ProposalContext }) {
  const [open, setOpen] = useState(false)
  const votingEnded = proposal.status === 'SUBMITTED' && hasEnded(proposal.votingPeriodEnd)
  const ends = proposal.status === 'SUBMITTED' ? formatRelative(proposal.votingPeriodEnd) : null
  const title = messageTitle(proposal)
  const proposers = proposerList(proposal)
  const ran = proposal.executorResult && proposal.executorResult !== 'NOT_RUN' ? proposal.executorResult : null

  return (
    <article
      className={cn(
        'rounded-xl bg-card ring-1 ring-border transition-shadow duration-(--duration-base) ease-standard hover:ring-primary/25',
        open && 'shadow-raised ring-primary/25'
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
          {title ? <span className="min-w-0 truncate text-sm font-medium text-foreground">{title}</span> : null}
        </button>
        <StatusBadge status={proposal.status} votingEnded={votingEnded} />
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
      <div className="mb-5 flex w-fit max-w-full flex-nowrap gap-1 overflow-x-auto rounded-lg bg-muted p-1 [scrollbar-width:none]">
        {FILTERS.map((entry) => {
          const count = entry === 'all' ? proposals.length : proposals.filter((p) => p.status === entry).length
          const active = filter === entry
          return (
            <button
              key={entry}
              type="button"
              onClick={() => setFilter(entry)}
              aria-pressed={active}
              className={cn(
                'relative isolate flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium outline-none transition-colors duration-(--duration-base) focus-visible:ring-[3px] focus-visible:ring-ring/50',
                active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {active ? <TabIndicator layoutId="corporation-proposal-filter" /> : null}
              {translate(FILTER_KEYS[entry])}
              <span className="text-muted-foreground tabular-nums">{atLeast(count, partial)}</span>
            </button>
          )
        })}
      </div>
      {degraded ? (
        <SectionUnavailable />
      ) : visible.length === 0 ? (
        <Empty className="border border-dashed border-border py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <VoteIcon />
            </EmptyMedia>
            <EmptyDescription>{translate('corporation.page.proposals.empty')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Stagger key={filter} className="space-y-3">
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
