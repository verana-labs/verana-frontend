'use client'

import { useChain } from '@cosmos-kit/react'
import { faBuilding, faChevronDown, faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  fetchProposalVotes,
  type ProposalRow,
  useCorporationDetails,
  type VoteRow,
} from '@/hooks/useCorporationDetails'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import { logger } from '@/lib/logger'
import { type DidEnrichment, fetchDidEnrichment } from '@/lib/resolverClient'
import { corporationSigningMode, useCorporationManage } from '@/msg/actions_hooks/actionCorporationManage'
import { OPERATOR_GRANT_MESSAGE_TYPES } from '@/msg/constants/operatorGrantMessageTypes'
import { CorporationCreateWizard } from '@/ui/common/corporation-create-wizard'
import { ProposalComposer } from '@/ui/common/proposal-composer'
import { SigningModeIcon } from '@/ui/common/signing-mode-icon'
import { resolveTranslatable } from '@/ui/dataview/types'
import { countryCodeToFlag, formatVNAFromUVNA, shortenMiddle } from '@/util/util'

function t(key: string): string {
  return resolveTranslatable({ key }, translate) ?? key
}

const TABS = ['overview', 'members', 'deposit', 'operators', 'proposals'] as const
type CorporationTab = (typeof TABS)[number]

const TRUST_DOT: Record<string, string> = {
  TRUSTED: 'bg-success-500',
  UNTRUSTED: 'bg-red-500',
  UNRESOLVED: 'bg-neutral-70',
}

const PROPOSAL_STATUS_CLASSES: Record<string, string> = {
  SUBMITTED: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
  ACCEPTED: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-200',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
  WITHDRAWN: 'bg-neutral-20 text-gray-700 dark:bg-neutral-70 dark:text-gray-200',
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm text-gray-900 dark:text-white break-all">{value}</p>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-neutral-20 dark:border-neutral-70 bg-white dark:bg-surface p-6">
      {children}
    </section>
  )
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString()
}

function ProposalCard({
  proposal,
  isMember,
  walletAddress,
  onVote,
  onExecute,
  onWithdraw,
}: {
  proposal: ProposalRow
  isMember: boolean
  walletAddress: string | undefined
  onVote: (id: number, choice: 'yes' | 'no') => void
  onExecute: (id: number) => void
  onWithdraw: (id: number) => void
}) {
  const [open, setOpen] = useState(false)
  const [votes, setVotes] = useState<VoteRow[] | null>(null)

  async function toggle() {
    const next = !open
    setOpen(next)
    if (next && votes === null) {
      try {
        setVotes(await fetchProposalVotes(proposal.id))
      } catch (error) {
        logger.error('proposal votes', error)
        setVotes([])
      }
    }
  }

  const statusClass = PROPOSAL_STATUS_CLASSES[proposal.status] ?? PROPOSAL_STATUS_CLASSES.WITHDRAWN
  const votable = isMember && proposal.status === 'SUBMITTED'
  const withdrawable = votable && walletAddress !== undefined && proposal.proposers.includes(walletAddress)
  const executable = isMember && proposal.status === 'ACCEPTED' && proposal.executorResult !== 'SUCCESS'

  return (
    <div className="border border-neutral-20 dark:border-neutral-70 rounded-lg">
      <button
        type="button"
        onClick={() => void toggle()}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <span className="font-mono text-sm text-gray-500 dark:text-gray-400">#{proposal.id}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${statusClass}`}>{proposal.status}</span>
        {proposal.executorResult ? (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {t('corporation.proposals.executor')}: {proposal.executorResult}
          </span>
        ) : null}
        <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{formatDate(proposal.submitTime)}</span>
        <FontAwesomeIcon icon={faChevronDown} className={`text-xs transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? (
        <div className="px-4 pb-4 space-y-3">
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
            {votes === null ? (
              <p className="text-sm text-gray-500">…</p>
            ) : votes.length === 0 ? (
              <p className="text-sm text-gray-500">{t('corporation.proposals.novotes')}</p>
            ) : (
              <ul className="text-sm text-gray-700 dark:text-gray-200">
                {votes.map((vote) => (
                  <li key={vote.voter}>
                    {shortenMiddle(vote.voter, 24)} — {vote.option}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {votable || executable ? (
            <div className="flex flex-wrap gap-2">
              {votable ? (
                <>
                  <button
                    type="button"
                    onClick={() => onVote(proposal.id, 'yes')}
                    className="px-3 py-1.5 bg-success-600 hover:bg-success-700 text-white rounded-lg text-sm font-medium"
                  >
                    {t('corporation.proposals.voteyes')}
                  </button>
                  <button
                    type="button"
                    onClick={() => onVote(proposal.id, 'no')}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                  >
                    {t('corporation.proposals.voteno')}
                  </button>
                  {withdrawable ? (
                    <button
                      type="button"
                      onClick={() => onWithdraw(proposal.id)}
                      className="px-3 py-1.5 border border-neutral-20 dark:border-neutral-70 rounded-lg text-sm font-medium"
                    >
                      {t('corporation.proposals.withdraw')}
                    </button>
                  ) : null}
                </>
              ) : null}
              {executable ? (
                <button
                  type="button"
                  onClick={() => onExecute(proposal.id)}
                  className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium"
                >
                  {t('corporation.proposals.execute')}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export default function CorporationPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const veranaChain = useVeranaChain()
  const { address } = useChain(veranaChain.chain_name)
  const { acting, loading: actingLoading, refetch: refetchCorporations } = useUserCorporation()
  const { details, loading, error, refetch } = useCorporationDetails(acting?.corporation.id)
  const manage = useCorporationManage(() => void refetch())
  const [didDraft, setDidDraft] = useState('')
  const [rotating, setRotating] = useState(false)
  const [granteeDraft, setGranteeDraft] = useState('')
  const [composing, setComposing] = useState(false)
  const [enrichment, setEnrichment] = useState<DidEnrichment | null>(null)

  const creating = searchParams.get('create') === '1'
  const tabParam = searchParams.get('tab')
  const tab: CorporationTab = (TABS as readonly string[]).includes(tabParam ?? '')
    ? (tabParam as CorporationTab)
    : 'overview'

  const did = details?.profile.did
  useEffect(() => {
    setEnrichment(null)
    if (!did) return
    let cancelled = false
    fetchDidEnrichment(did)
      .then((value) => {
        if (!cancelled) setEnrichment(value)
      })
      .catch((cause) => logger.error('corporation enrichment', cause))
    return () => {
      cancelled = true
    }
  }, [did])

  function selectTab(next: CorporationTab) {
    const params = new URLSearchParams(searchParams.toString())
    if (next === 'overview') params.delete('tab')
    else params.set('tab', next)
    router.replace(`${pathname}${params.size ? `?${params.toString()}` : ''}`)
  }

  if (actingLoading || (acting && loading)) {
    return <p className="p-6 text-sm text-gray-500">{t('corporation.page.loading')}</p>
  }

  if (!acting || creating) {
    return (
      <>
        {!acting ? (
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">{t('corporation.page.nocorp')}</p>
        ) : null}
        <CorporationCreateWizard
          onDone={() => {
            void refetchCorporations()
            router.replace(pathname)
          }}
        />
      </>
    )
  }

  if (error || !details) {
    return <div className="p-6 error-pane">{error ?? t('corporation.page.error')}</div>
  }

  const { profile, members, policy, trustDeposit, operatorAuthorizations, vsOperatorAuthorizations, proposals } =
    details
  const unrepaidSlash = trustDeposit ? trustDeposit.slashedDeposit - trustDeposit.repaidDeposit : 0
  const openProposals = proposals.filter((proposal) => proposal.status === 'SUBMITTED').length
  const updateMode = corporationSigningMode('/verana.co.v1.MsgUpdateCorporation', acting)
  const grantMode = corporationSigningMode('/verana.de.v1.MsgGrantOperatorAuthorization', acting)
  const revokeMode = corporationSigningMode('/verana.de.v1.MsgRevokeOperatorAuthorization', acting)
  const repayMode = corporationSigningMode('/verana.td.v1.MsgRepaySlashedTrustDeposit', acting)
  const displayName = enrichment?.organizationName ?? enrichment?.serviceName

  return (
    <>
      <section className="mb-6 rounded-xl border border-neutral-20 dark:border-neutral-70 bg-white dark:bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <span className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 flex items-center justify-center text-xl">
              <FontAwesomeIcon icon={faBuilding} />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                {enrichment?.countryCode ? (
                  <span aria-hidden="true">{countryCodeToFlag(enrichment.countryCode)}</span>
                ) : null}
                <span className="truncate">{displayName ?? shortenMiddle(profile.did, 40)}</span>
                <span
                  title={enrichment?.trustStatus ?? 'UNRESOLVED'}
                  className={`inline-block w-2.5 h-2.5 rounded-full ${TRUST_DOT[enrichment?.trustStatus ?? 'UNRESOLVED']}`}
                />
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 break-all">
                {displayName ? `${profile.did} · ` : ''}#{profile.id} · {shortenMiddle(profile.policyAddress, 26)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {updateMode ? (
              <button
                type="button"
                onClick={() => setRotating(!rotating)}
                className="px-3 py-1.5 border border-neutral-20 dark:border-neutral-70 rounded-lg text-sm font-medium"
              >
                {t('corporation.page.rotatedid')}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => router.push(`${pathname}?create=1`)}
              className="px-3 py-1.5 border border-neutral-20 dark:border-neutral-70 rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPlus} />
              {t('corporation.page.new')}
            </button>
          </div>
        </div>
        {rotating && updateMode ? (
          <form
            className="mt-4 flex flex-wrap items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              if (didDraft.trim()) {
                void manage.updateCorporationDid(acting, didDraft.trim())
                setRotating(false)
                setDidDraft('')
              }
            }}
          >
            <input
              value={didDraft}
              onChange={(event) => setDidDraft(event.target.value)}
              placeholder="did:method:identifier"
              className="grow max-w-xl px-4 py-2 border border-neutral-20 dark:border-neutral-70 rounded-lg bg-white dark:bg-surface"
            />
            <button
              type="submit"
              disabled={!didDraft.trim()}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-60 flex items-center gap-2"
            >
              <SigningModeIcon mode={updateMode} />
              {t('corporation.page.rotatedid.submit')}
            </button>
          </form>
        ) : null}
        <nav className="mt-6 flex flex-wrap gap-1 border-b border-neutral-20 dark:border-neutral-70 -mb-6 -mx-6 px-6">
          {TABS.map((entry) => (
            <button
              key={entry}
              type="button"
              onClick={() => selectTab(entry)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${
                tab === entry
                  ? 'border-primary-600 text-primary-700 dark:text-primary-300'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {t(`corporation.tab.${entry}`)}
              {entry === 'proposals' && openProposals > 0 ? (
                <span className="ml-2 min-w-4 h-4 px-1 bg-red-500 text-white text-xs font-bold rounded-full inline-flex items-center justify-center leading-none">
                  {openProposals}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
      </section>

      {tab === 'overview' ? (
        <Card>
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
          </div>
        </Card>
      ) : null}

      {tab === 'members' ? (
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Fact label={t('corporation.page.threshold')} value={policy.threshold ?? '—'} />
            <Fact label={t('corporation.page.votingperiod')} value={policy.votingPeriod ?? '—'} />
            <Fact label={t('corporation.page.totalweight')} value={policy.totalWeight} />
          </div>
          <ul className="divide-y divide-neutral-20 dark:divide-neutral-70">
            {members.map((member) => (
              <li key={member.address} className="py-2 flex items-center justify-between gap-3 text-sm">
                <span className="font-mono break-all">{member.address}</span>
                <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {t('corporation.page.weight')} {member.weight}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{t('corporation.page.members.note')}</p>
        </Card>
      ) : null}

      {tab === 'deposit' ? (
        <Card>
          {trustDeposit ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Fact label={t('corporation.page.deposit')} value={formatVNAFromUVNA(String(trustDeposit.deposit))} />
                <Fact
                  label={t('corporation.page.slashed')}
                  value={`${formatVNAFromUVNA(String(trustDeposit.slashedDeposit))} (${trustDeposit.slashCount})`}
                />
                <Fact
                  label={t('corporation.page.repaid')}
                  value={formatVNAFromUVNA(String(trustDeposit.repaidDeposit))}
                />
                <Fact label={t('corporation.page.lastslashed')} value={formatDate(trustDeposit.lastSlashed)} />
                <Fact label={t('corporation.page.lastrepaid')} value={formatDate(trustDeposit.lastRepaid)} />
              </div>
              {unrepaidSlash > 0 && repayMode ? (
                <button
                  type="button"
                  onClick={() => void manage.repaySlashed(acting, unrepaidSlash)}
                  className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium flex items-center gap-2"
                >
                  <SigningModeIcon mode={repayMode} />
                  {t('corporation.page.repayslashed')} ({formatVNAFromUVNA(String(unrepaidSlash))})
                </button>
              ) : null}
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{t('corporation.page.trustdeposit.note')}</p>
            </>
          ) : (
            <p className="text-sm text-gray-500">{t('corporation.page.trustdeposit.empty')}</p>
          )}
        </Card>
      ) : null}

      {tab === 'operators' ? (
        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{t('corporation.page.operators')}</h2>
            <ul className="divide-y divide-neutral-20 dark:divide-neutral-70">
              {operatorAuthorizations.map((authorization) => (
                <li key={authorization.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0">
                    <span className="font-mono break-all">{authorization.operator}</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">
                      {authorization.msgTypes.length} {t('corporation.page.msgtypes')}
                    </span>
                  </span>
                  {revokeMode ? (
                    <button
                      type="button"
                      onClick={() => void manage.revokeOperator(acting, authorization.operator)}
                      className="px-3 py-1.5 border border-red-300 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                      <SigningModeIcon mode={revokeMode} />
                      {t('corporation.page.revoke')}
                    </button>
                  ) : null}
                </li>
              ))}
              {operatorAuthorizations.length === 0 ? (
                <li className="py-2 text-sm text-gray-500">{t('corporation.page.operators.empty')}</li>
              ) : null}
            </ul>
            {grantMode ? (
              <form
                className="mt-4 flex flex-wrap items-end gap-2"
                onSubmit={(event) => {
                  event.preventDefault()
                  if (granteeDraft.trim()) {
                    void manage.grantOperator(acting, granteeDraft.trim(), [...OPERATOR_GRANT_MESSAGE_TYPES])
                    setGranteeDraft('')
                  }
                }}
              >
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 grow max-w-xl">
                  {t('corporation.page.grant')}
                  <input
                    value={granteeDraft}
                    onChange={(event) => setGranteeDraft(event.target.value)}
                    placeholder="verana1…"
                    className="mt-2 w-full px-4 py-2 border border-neutral-20 dark:border-neutral-70 rounded-lg bg-white dark:bg-surface"
                  />
                </label>
                <button
                  type="submit"
                  disabled={!granteeDraft.trim()}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-60 flex items-center gap-2"
                >
                  <SigningModeIcon mode={grantMode} />
                  {t('corporation.page.grant.submit')}
                </button>
              </form>
            ) : null}
          </Card>
          {vsOperatorAuthorizations.length > 0 ? (
            <Card>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{t('corporation.page.agents')}</h2>
              <ul className="divide-y divide-neutral-20 dark:divide-neutral-70">
                {vsOperatorAuthorizations.map((authorization) => (
                  <li key={`${authorization.vsOperator}-${authorization.participantId}`} className="py-2 text-sm">
                    <span className="font-mono break-all">{authorization.vsOperator}</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">
                      {authorization.participantId !== null ? `participant ${authorization.participantId} · ` : ''}
                      {authorization.msgTypes.length} {t('corporation.page.msgtypes')}
                      {authorization.expiration ? ` · ${formatDate(authorization.expiration)}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{t('corporation.page.agents.note')}</p>
            </Card>
          ) : null}
        </div>
      ) : null}

      {tab === 'proposals' ? (
        <Card>
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('corporation.tab.proposals')}</h2>
            {acting.member && !composing ? (
              <button
                type="button"
                onClick={() => setComposing(true)}
                className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium"
              >
                {t('corporation.composer.new')}
              </button>
            ) : null}
          </div>
          {composing ? (
            <ProposalComposer
              membership={acting}
              policy={policy}
              members={members}
              onDone={() => void refetch()}
              onClose={() => setComposing(false)}
            />
          ) : null}
          <div className="space-y-3">
            {proposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                isMember={acting.member}
                walletAddress={address}
                onVote={(id, choice) => void manage.vote(id, choice)}
                onExecute={(id) => void manage.execute(id)}
                onWithdraw={(id) => void manage.withdraw(id)}
              />
            ))}
            {proposals.length === 0 ? (
              <p className="text-sm text-gray-500">{t('corporation.page.proposals.empty')}</p>
            ) : null}
          </div>
        </Card>
      ) : null}
    </>
  )
}
