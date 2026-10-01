'use client'

import { faChevronDown, faRobot } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Link from 'next/link'
import { type ReactNode, useMemo, useState } from 'react'
import type {
  CoinAmount,
  FeeGrantRow,
  GrantLimits,
  OperatorAuthorizationRow,
  VsOperatorAuthorizationRow,
} from '@/hooks/useCorporationDetails'
import { translate } from '@/i18n/dataview'
import { feeGrantFor, formatIndexerPeriod, type OperatorGrantOptions, readGrantOptions } from '@/lib/operator-grant'
import type { CorporationSigningMode } from '@/msg/actions_hooks/actionCorporationManage'
import { OPERATOR_GRANT_MESSAGE_TYPES } from '@/msg/constants/operatorGrantMessageTypes'
import { useRegistryLabels } from '@/providers/api-rest-query-provider-context'
import { AddressIssueNote, addressIssue } from '@/ui/common/address-issue'
import { OperatorGrantOptionsFields, useOperatorGrantDraft } from '@/ui/common/operator-grant-options'
import { SigningModeIcon } from '@/ui/common/signing-mode-icon'
import type { Participant } from '@/ui/dataview/datasections/participant'
import { formatVNAFromUVNA, participantCardHref, roleBadgeClass, shortenDID } from '@/util/util'
import { groupMsgTypes, MODULE_LABELS } from './msg-type-groups'
import { Card, Fact, formatDate, SectionTitle, SectionUnavailable, YouBadge } from './shared'

const CHIP = 'text-xs px-2 py-1 rounded-md border max-w-full break-all text-left'
const CHIP_ON =
  'border-primary-300 bg-primary-100 text-primary-800 dark:border-primary-700 dark:bg-primary-900/30 dark:text-primary-200'
const CHIP_OFF = 'border-neutral-20 dark:border-neutral-70 text-gray-400 line-through'

export function MsgTypeChips({
  typeUrls,
  selected,
  onToggle,
}: {
  typeUrls: readonly string[]
  selected?: Set<string>
  onToggle?: (typeUrl: string) => void
}) {
  return (
    <div className="space-y-2">
      {groupMsgTypes(typeUrls).map((group) => (
        <div key={group.module} className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 w-full sm:w-32">
            {MODULE_LABELS[group.module] ?? group.module}
          </span>
          {group.entries.map((entry) => {
            const active = selected ? selected.has(entry.typeUrl) : true
            const className = `${CHIP} ${active ? CHIP_ON : CHIP_OFF}`
            return onToggle ? (
              <button
                key={entry.typeUrl}
                type="button"
                onClick={() => onToggle(entry.typeUrl)}
                aria-pressed={active}
                className={className}
              >
                {entry.name}
              </button>
            ) : (
              <span key={entry.typeUrl} className={className}>
                {entry.name}
              </span>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function formatCoins(coins: CoinAmount[] | null): string {
  if (coins === null) return translate('delegation.unlimited')
  if (coins.length === 0) return translate('common.none')
  return coins
    .map((coin) => (coin.denom === 'uvna' ? formatVNAFromUVNA(coin.amount) : `${coin.amount} ${coin.denom}`))
    .join(', ')
}

function limitText(limits: GrantLimits): string {
  const amount = formatCoins(limits.spendLimit)
  if (!limits.spendLimit || !limits.period) return amount
  return translate('corporation.grant.limit.every', { amount, period: formatIndexerPeriod(limits.period) })
}

function limitFacts(limits: GrantLimits, labels: { spendLimit: string; remaining: string; period: string }) {
  const facts: [string, ReactNode][] = [[labels.spendLimit, formatCoins(limits.spendLimit)]]
  if (limits.spendLimit) facts.push([labels.remaining, formatCoins(limits.remainingSpend)])
  if (limits.period) facts.push([labels.period, formatIndexerPeriod(limits.period)])
  return facts
}

function FactGrid({ facts }: { facts: [string, ReactNode][] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {facts.map(([key, value]) => (
        <Fact key={key} label={translate(key)} value={value} />
      ))}
    </div>
  )
}

function sameMsgTypes(left: readonly string[], right: readonly string[]): boolean {
  const set = new Set(right)
  return left.length === set.size && left.every((msgType) => set.has(msgType))
}

function feeMsgTypesText(feeMsgTypes: readonly string[], grantMsgTypes: readonly string[]): string {
  if (feeMsgTypes.length === 0) return translate('delegation.feeMsgTypes.all')
  if (sameMsgTypes(feeMsgTypes, grantMsgTypes))
    return translate('delegation.feeMsgTypes.same', { count: feeMsgTypes.length })
  return `${feeMsgTypes.length} ${translate('corporation.page.msgtypes')}`
}

function OperatorGrantDetail({
  authorization,
  feeGrant,
  feeGrantsDegraded,
}: {
  authorization: OperatorAuthorizationRow
  feeGrant: FeeGrantRow | undefined
  feeGrantsDegraded: boolean
}) {
  const facts = limitFacts(authorization, {
    spendLimit: 'delegation.spendLimit',
    remaining: 'delegation.remainingSpend',
    period: 'delegation.period',
  })
  facts.push([
    authorization.period ? 'delegation.cycleEnd' : 'delegation.expiration',
    formatDate(authorization.expiration),
  ])
  const feeFacts: [string, ReactNode][] = feeGrant
    ? [
        ['delegation.withFeegrant', translate('common.yes')],
        ['delegation.feeMsgTypes', feeMsgTypesText(feeGrant.msgTypes, authorization.msgTypes)],
        ...limitFacts(feeGrant, {
          spendLimit: 'delegation.feeSpendLimit',
          remaining: 'delegation.feeRemainingSpend',
          period: 'delegation.feePeriod',
        }),
        [feeGrant.period ? 'delegation.feeCycleEnd' : 'delegation.feeExpiration', formatDate(feeGrant.expiration)],
      ]
    : [['delegation.withFeegrant', translate('common.no')]]
  return (
    <div className="mt-2 ml-5 space-y-3">
      <MsgTypeChips typeUrls={authorization.msgTypes} />
      <FactGrid facts={facts} />
      {feeGrantsDegraded ? <SectionUnavailable /> : <FactGrid facts={feeFacts} />}
      {feeGrant &&
      !feeGrantsDegraded &&
      feeGrant.msgTypes.length > 0 &&
      !sameMsgTypes(feeGrant.msgTypes, authorization.msgTypes) ? (
        <MsgTypeChips typeUrls={feeGrant.msgTypes} />
      ) : null}
    </div>
  )
}

function OperatorRow({
  authorization,
  feeGrant,
  feeGrantsDegraded,
  revokeMode,
  walletAddress,
  onRevoke,
}: {
  authorization: OperatorAuthorizationRow
  feeGrant: FeeGrantRow | undefined
  feeGrantsDegraded: boolean
  revokeMode: CorporationSigningMode | null
  walletAddress: string | undefined
  onRevoke: (operator: string) => void
}) {
  const [open, setOpen] = useState(false)
  const summary = [`${authorization.msgTypes.length} ${translate('corporation.page.msgtypes')}`]
  if (authorization.spendLimit) summary.push(limitText(authorization))
  if (feeGrant) summary.push(translate('delegation.withFeegrant'))
  return (
    <li className="py-2 text-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="min-w-0 text-left flex items-start gap-2"
        >
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`text-xs text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          />
          <span className="min-w-0">
            <span className="font-mono break-all flex flex-wrap items-center gap-x-2 gap-y-1">
              {authorization.operator}
              {authorization.operator === walletAddress ? <YouBadge /> : null}
            </span>
            <span className="block text-xs text-gray-500 dark:text-gray-400">{summary.join(' · ')}</span>
          </span>
        </button>
        {revokeMode ? (
          <button
            type="button"
            onClick={() => onRevoke(authorization.operator)}
            className="self-start shrink-0 px-3 py-1.5 border border-red-300 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <SigningModeIcon mode={revokeMode} />
            {translate('corporation.page.revoke')}
          </button>
        ) : null}
      </div>
      {open ? (
        <OperatorGrantDetail authorization={authorization} feeGrant={feeGrant} feeGrantsDegraded={feeGrantsDegraded} />
      ) : null}
    </li>
  )
}

export function GrantOperatorForm({
  mode,
  walletAddress,
  feeGrants,
  onGrant,
}: {
  mode: CorporationSigningMode
  walletAddress: string | undefined
  feeGrants: FeeGrantRow[]
  onGrant: (
    grantee: string,
    msgTypes: string[],
    options: OperatorGrantOptions,
    replacesFeeGrant: boolean
  ) => Promise<boolean>
}) {
  const draft = useOperatorGrantDraft(feeGrants)
  const [selected, setSelected] = useState(() => new Set<string>(OPERATOR_GRANT_MESSAGE_TYPES))
  const [showTypes, setShowTypes] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const target = draft.target
  const granteeIssue =
    addressIssue(target, []) ??
    (mode === 'operator' && target === walletAddress ? 'corporation.grant.issue.self' : null)
  const reading = readGrantOptions(draft.options)
  const canSubmit = target.length > 0 && granteeIssue === null && selected.size > 0 && reading.issue === null

  function toggle(typeUrl: string) {
    setSelected((previous) => {
      const next = new Set(previous)
      if (next.has(typeUrl)) next.delete(typeUrl)
      else next.add(typeUrl)
      return next
    })
  }

  return (
    <form
      className="mt-4 space-y-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (!canSubmit || !reading.options) return
        void onGrant(target, [...selected], reading.options, draft.existingFeeGrant !== undefined).then((granted) => {
          if (granted) draft.reset()
        })
      }}
    >
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 grow max-w-xl">
          {translate('corporation.page.grant')}
          <input
            value={draft.grantee}
            onChange={(event) => {
              if (draft.setGrantee(event.target.value)) setShowOptions(true)
            }}
            placeholder="verana1…"
            className="mt-2 w-full px-4 py-2 border border-neutral-20 dark:border-neutral-70 rounded-lg bg-white dark:bg-surface"
          />
        </label>
        <button
          type="submit"
          disabled={!canSubmit}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-60 flex items-center gap-2"
        >
          <SigningModeIcon mode={mode} />
          {translate('corporation.page.grant.submit')}
        </button>
      </div>
      <AddressIssueNote issue={granteeIssue} />
      <AddressIssueNote issue={reading.issue} />
      <button
        type="button"
        onClick={() => setShowTypes(!showTypes)}
        aria-expanded={showTypes}
        className="text-xs py-1 text-primary-700 dark:text-primary-300 flex items-center gap-1"
      >
        <FontAwesomeIcon icon={faChevronDown} className={`transition-transform ${showTypes ? 'rotate-180' : ''}`} />
        {translate('corporation.page.grant.count', {
          selected: selected.size,
          total: OPERATOR_GRANT_MESSAGE_TYPES.length,
        })}
      </button>
      {showTypes ? (
        <div className="space-y-2">
          <div className="flex gap-3 text-xs">
            <button
              type="button"
              onClick={() => setSelected(new Set(OPERATOR_GRANT_MESSAGE_TYPES))}
              className="py-1 text-primary-700 dark:text-primary-300"
            >
              {translate('corporation.page.msgtypes.all')}
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="py-1 text-primary-700 dark:text-primary-300"
            >
              {translate('corporation.page.msgtypes.none')}
            </button>
          </div>
          <MsgTypeChips typeUrls={OPERATOR_GRANT_MESSAGE_TYPES} selected={selected} onToggle={toggle} />
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setShowOptions(!showOptions)}
        aria-expanded={showOptions}
        className="text-xs py-1 text-primary-700 dark:text-primary-300 flex items-center gap-1"
      >
        <FontAwesomeIcon icon={faChevronDown} className={`transition-transform ${showOptions ? 'rotate-180' : ''}`} />
        {translate('corporation.grant.options')}
      </button>
      {showOptions ? (
        <OperatorGrantOptionsFields
          value={draft.options}
          onChange={draft.setOptions}
          replacesFeeGrant={draft.existingFeeGrant !== undefined}
        />
      ) : null}
    </form>
  )
}

export function DelegationDetail({
  record,
  showOperator,
  participantHref,
}: {
  record: VsOperatorAuthorizationRow
  showOperator: boolean
  participantHref: string | null
}) {
  const facts: [string, ReactNode][] = [
    ['delegation.spendLimit', formatCoins(record.spendLimit)],
    ['delegation.remainingSpend', formatCoins(record.remainingSpend)],
    ['delegation.feeSpendLimit', record.withFeegrant ? formatCoins(record.feeSpendLimit) : translate('common.none')],
    ['delegation.withFeegrant', translate(record.withFeegrant ? 'common.yes' : 'common.no')],
    ['delegation.period', record.period ?? translate('common.none')],
  ]
  if (record.period) facts.push(['delegation.cycleEnd', formatDate(record.expiration)])
  return (
    <div className="space-y-3 text-sm">
      {showOperator ? (
        <Fact label={translate('delegation.operator')} value={<span className="font-mono">{record.vsOperator}</span>} />
      ) : null}
      <MsgTypeChips typeUrls={record.msgTypes} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {facts.map(([key, value]) => (
          <Fact key={key} label={translate(key)} value={value} />
        ))}
      </div>
      {participantHref ? (
        <Link
          href={participantHref}
          className="inline-block text-xs font-medium text-primary-700 dark:text-primary-300"
        >
          {translate('delegation.participant')}
        </Link>
      ) : null}
    </div>
  )
}

function AgentRecord({
  record,
  participant,
}: {
  record: VsOperatorAuthorizationRow
  participant: Participant | undefined
}) {
  const labels = useRegistryLabels()
  return (
    <li className="py-2 space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {translate('corporation.page.agents.participant')}
        </span>
        <span className="font-mono">#{record.participantId}</span>
        {participant ? (
          <>
            <span className={`text-xs px-2 py-0.5 rounded-full ${roleBadgeClass(participant.role)}`}>
              {participant.role}
            </span>
            {participant.did ? (
              <span className="font-mono text-xs break-all">{shortenDID(participant.did)}</span>
            ) : null}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {translate('agents.card.schema')} {labels.schemaLabel(Number(participant.schema_id))}
              {participant.ecosystem_id != null
                ? ` · ${translate('agents.card.ecosystem')} ${labels.ecosystemLabel(participant.ecosystem_id)}`
                : ''}
            </span>
          </>
        ) : null}
      </div>
      <DelegationDetail
        record={record}
        showOperator={false}
        participantHref={participant ? participantCardHref(participant.schema_id, participant.id) : null}
      />
    </li>
  )
}

function AgentAccountRow({
  vsOperator,
  records,
  participantsById,
}: {
  vsOperator: string
  records: VsOperatorAuthorizationRow[]
  participantsById: Map<number, Participant>
}) {
  const [open, setOpen] = useState(false)
  return (
    <li className="py-2 text-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="min-w-0 text-left flex items-start gap-2"
      >
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`text-xs text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
        <span className="min-w-0">
          <span className="font-mono break-all block">{vsOperator}</span>
          <span className="block text-xs text-gray-500 dark:text-gray-400">
            {records.length} {translate('corporation.page.agents.records')}
          </span>
        </span>
      </button>
      {open ? (
        <ul className="mt-2 ml-5 divide-y divide-neutral-20 dark:divide-neutral-70">
          {records.map((record) => (
            <AgentRecord
              key={record.participantId}
              record={record}
              participant={participantsById.get(record.participantId)}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

function groupByOperator(rows: VsOperatorAuthorizationRow[]): [string, VsOperatorAuthorizationRow[]][] {
  const groups = new Map<string, VsOperatorAuthorizationRow[]>()
  for (const row of rows) {
    const group = groups.get(row.vsOperator)
    if (group) group.push(row)
    else groups.set(row.vsOperator, [row])
  }
  return [...groups.entries()]
}

export function OperatorsSection({
  authorizations,
  vsAuthorizations,
  feeGrants,
  participantsById,
  revokeMode,
  grantMode,
  walletAddress,
  degradedOperators,
  degradedAgents,
  degradedFeeGrants,
  onRevoke,
  onGrant,
}: {
  authorizations: OperatorAuthorizationRow[]
  vsAuthorizations: VsOperatorAuthorizationRow[]
  feeGrants: FeeGrantRow[]
  participantsById: Map<number, Participant>
  revokeMode: CorporationSigningMode | null
  grantMode: CorporationSigningMode | null
  walletAddress: string | undefined
  degradedOperators: boolean
  degradedAgents: boolean
  degradedFeeGrants: boolean
  onRevoke: (operator: string) => void
  onGrant: (
    grantee: string,
    msgTypes: string[],
    options: OperatorGrantOptions,
    replacesFeeGrant: boolean
  ) => Promise<boolean>
}) {
  const agentAccounts = useMemo(() => groupByOperator(vsAuthorizations), [vsAuthorizations])
  return (
    <div id="operators" className="space-y-6">
      <Card>
        <div className="mb-3">
          <SectionTitle>{translate('corporation.page.operators')}</SectionTitle>
        </div>
        <ul className="divide-y divide-neutral-20 dark:divide-neutral-70">
          {authorizations.map((authorization) => (
            <OperatorRow
              key={authorization.id}
              authorization={authorization}
              feeGrant={feeGrantFor(feeGrants, authorization.operator)}
              feeGrantsDegraded={degradedFeeGrants}
              revokeMode={revokeMode}
              walletAddress={walletAddress}
              onRevoke={onRevoke}
            />
          ))}
          {authorizations.length === 0 ? (
            <li className="py-2 text-sm text-gray-500">
              {degradedOperators ? <SectionUnavailable /> : translate('corporation.page.operators.empty')}
            </li>
          ) : null}
        </ul>
        {grantMode ? (
          <GrantOperatorForm mode={grantMode} walletAddress={walletAddress} feeGrants={feeGrants} onGrant={onGrant} />
        ) : null}
      </Card>
      <Card id="agents">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <SectionTitle>{translate('corporation.page.agents')}</SectionTitle>
          <Link
            href="/agents"
            className="text-sm font-medium text-primary-700 dark:text-primary-300 flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faRobot} />
            {translate('corporation.page.agents.link')}
          </Link>
        </div>
        <ul className="divide-y divide-neutral-20 dark:divide-neutral-70">
          {agentAccounts.map(([vsOperator, records]) => (
            <AgentAccountRow
              key={vsOperator}
              vsOperator={vsOperator}
              records={records}
              participantsById={participantsById}
            />
          ))}
          {agentAccounts.length === 0 ? (
            <li className="py-2 text-sm text-gray-500">
              {degradedAgents ? <SectionUnavailable /> : translate('corporation.page.agents.empty')}
            </li>
          ) : null}
        </ul>
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{translate('corporation.page.agents.note')}</p>
      </Card>
    </div>
  )
}
