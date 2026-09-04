'use client'

import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { type ReactNode, useState } from 'react'
import {
  type GroupMemberRow,
  type GroupPolicy,
  type ProposalRow,
  type ProposalTally,
  tallyVotes,
  type VoteRow,
} from '@/hooks/useCorporationDetails'
import type { VoteChoice } from '@/msg/actions_hooks/actionCorporationManage'
import { shortenMiddle } from '@/util/util'
import { Card, formatDate, formatRelative, SectionTitle, StatusBadge, t } from './shared'

const FILTERS = ['all', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'] as const
type Filter = (typeof FILTERS)[number]

const FILTER_KEYS: Record<Filter, string> = {
  all: 'corporation.proposals.filter.all',
  SUBMITTED: 'corporation.proposals.filter.open',
  ACCEPTED: 'corporation.proposals.filter.accepted',
  REJECTED: 'corporation.proposals.filter.rejected',
  WITHDRAWN: 'corporation.proposals.filter.withdrawn',
}

const VOTE_BUTTONS: { choice: VoteChoice; key: string; className: string }[] = [
  { choice: 'yes', key: 'corporation.proposals.voteyes', className: 'bg-success-600 hover:bg-success-700 text-white' },
  { choice: 'no', key: 'corporation.proposals.voteno', className: 'bg-red-600 hover:bg-red-700 text-white' },
  {
    choice: 'abstain',
    key: 'corporation.proposals.voteabstain',
    className: 'border border-neutral-20 dark:border-neutral-70',
  },
  {
    choice: 'veto',
    key: 'corporation.proposals.voteveto',
    className: 'border border-red-300 text-red-700 dark:text-red-300',
  },
]

export interface ProposalActions {
  onVote: (id: number, choice: VoteChoice) => void
  onExecute: (id: number) => void
  onWithdraw: (id: number) => void
}

export interface ProposalContext {
  members: GroupMemberRow[]
  policy: GroupPolicy
  isMember: boolean
  walletAddress: string | undefined
  votesById: Record<number, VoteRow[]>
  actions: ProposalActions
}

export function TallyBar({ tally, policy }: { tally: ProposalTally; policy: GroupPolicy }) {
  const total = Number(policy.totalWeight) || 0
  const threshold = Number(policy.threshold) || 0
  const percent = (value: number) => (total > 0 ? `${(value / total) * 100}%` : '0%')
  return (
    <div className="min-w-[8rem]">
      <div className="relative h-2 rounded-full bg-neutral-20 dark:bg-neutral-70 flex overflow-hidden">
        <div className="h-full bg-success-500" style={{ width: percent(tally.yes) }} />
        <div className="h-full bg-red-500" style={{ width: percent(tally.no) }} />
        <div className="h-full bg-red-800" style={{ width: percent(tally.veto) }} />
        <div className="h-full bg-gray-400" style={{ width: percent(tally.abstain) }} />
        {threshold > 0 && total > 0 ? (
          <span
            className="absolute top-0 h-full w-0.5 bg-gray-900 dark:bg-white"
            style={{ left: percent(threshold) }}
          />
        ) : null}
      </div>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
        {t('corporation.proposals.tally', { yes: tally.yes, total, threshold })}
      </p>
    </div>
  )
}

function proposerList(proposal: ProposalRow): string {
  return proposal.proposers.map((proposer) => shortenMiddle(proposer, 16)).join(', ')
}

function ProposalDetail({ proposal, ctx }: { proposal: ProposalRow; ctx: ProposalContext }) {
  const votes = ctx.votesById[proposal.id]
  const votable = ctx.isMember && proposal.status === 'SUBMITTED'
  const voted = votes?.some((vote) => vote.voter === ctx.walletAddress) ?? false
  const withdrawable = votable && ctx.walletAddress !== undefined && proposal.proposers.includes(ctx.walletAddress)
  const executable = ctx.isMember && proposal.status === 'ACCEPTED' && proposal.executorResult !== 'SUCCESS'

  return (
    <div className="space-y-3">
      {proposal.messages.map((message, index) => (
        <pre
          key={`${proposal.id}-${index}-${String(message['@type'] ?? '')}`}
          className="text-xs bg-surface-muted dark:bg-neutral-70/30 rounded-lg p-3 overflow-x-auto"
        >
          {JSON.stringify(message, null, 2)}
        </pre>
      ))}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
          {t('corporation.proposals.votes')}
        </p>
        {votes === undefined ? (
          <p className="text-sm text-gray-500">…</p>
        ) : votes.length === 0 ? (
          <p className="text-sm text-gray-500">{t('corporation.proposals.novotes')}</p>
        ) : (
          <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-1">
            {votes.map((vote) => (
              <li key={vote.voter} className="flex items-center gap-2">
                <span className="font-mono">{shortenMiddle(vote.voter, 24)}</span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-surface-muted dark:bg-neutral-70/40">
                  {vote.option}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {votable || executable ? (
        <div className="flex flex-wrap gap-2">
          {votable
            ? VOTE_BUTTONS.map((button) => (
                <button
                  key={button.choice}
                  type="button"
                  onClick={() => ctx.actions.onVote(proposal.id, button.choice)}
                  disabled={voted}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 ${button.className}`}
                >
                  {t(button.key)}
                </button>
              ))
            : null}
          {withdrawable ? (
            <button
              type="button"
              onClick={() => ctx.actions.onWithdraw(proposal.id)}
              className="px-3 py-1.5 border border-neutral-20 dark:border-neutral-70 rounded-lg text-sm font-medium"
            >
              {t('corporation.proposals.withdraw')}
            </button>
          ) : null}
          {executable ? (
            <button
              type="button"
              onClick={() => ctx.actions.onExecute(proposal.id)}
              className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium"
            >
              {t('corporation.proposals.execute')}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function ProposalCard({ proposal, ctx }: { proposal: ProposalRow; ctx: ProposalContext }) {
  const [open, setOpen] = useState(false)
  const tally = tallyVotes(ctx.votesById[proposal.id] ?? [], ctx.members)
  const ends = proposal.status === 'SUBMITTED' ? formatRelative(proposal.votingPeriodEnd) : null

  return (
    <div className="border border-neutral-20 dark:border-neutral-70 rounded-lg">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex flex-wrap items-center gap-3 px-4 py-3 text-left"
      >
        <span className="font-mono text-sm text-gray-500 dark:text-gray-400">#{proposal.id}</span>
        <StatusBadge status={proposal.status} />
        {proposal.executorResult ? (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {t('corporation.proposals.executor')}: {proposal.executorResult}
          </span>
        ) : null}
        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{proposerList(proposal)}</span>
        <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
          {ends ?? formatDate(proposal.submitTime)}
        </span>
        <FontAwesomeIcon icon={faChevronDown} className={`text-xs transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className="px-4 pb-3">
        <TallyBar tally={tally} policy={ctx.policy} />
      </div>
      {open ? (
        <div className="px-4 pb-4">
          <ProposalDetail proposal={proposal} ctx={ctx} />
        </div>
      ) : null}
    </div>
  )
}

export function ProposalsSection({
  proposals,
  ctx,
  composing,
  onCompose,
  composer,
}: {
  proposals: ProposalRow[]
  ctx: ProposalContext
  composing: boolean
  onCompose: () => void
  composer: ReactNode
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const visible = filter === 'all' ? proposals : proposals.filter((proposal) => proposal.status === filter)

  return (
    <Card id="proposals">
      <div className="flex items-center justify-between gap-3 mb-4">
        <SectionTitle>{t('corporation.tab.proposals')}</SectionTitle>
        {ctx.isMember && !composing ? (
          <button
            type="button"
            onClick={onCompose}
            className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium"
          >
            {t('corporation.composer.new')}
          </button>
        ) : null}
      </div>
      {composing ? composer : null}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {FILTERS.map((entry) => {
          const count = entry === 'all' ? proposals.length : proposals.filter((p) => p.status === entry).length
          const active = filter === entry
          return (
            <button
              key={entry}
              type="button"
              onClick={() => setFilter(entry)}
              aria-pressed={active}
              className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                active
                  ? 'border-primary-600 bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-200'
                  : 'border-neutral-20 dark:border-neutral-70 text-gray-600 dark:text-gray-300'
              }`}
            >
              {t(FILTER_KEYS[entry])} · {count}
            </button>
          )
        })}
      </div>
      {visible.length === 0 ? (
        <p className="text-sm text-gray-500">{t('corporation.page.proposals.empty')}</p>
      ) : (
        <div className="space-y-3">
          {visible.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} ctx={ctx} />
          ))}
        </div>
      )}
    </Card>
  )
}
