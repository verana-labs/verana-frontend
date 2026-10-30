'use client'

import { BotIcon, CheckIcon, ChevronDownIcon, KeyRoundIcon, ShieldCheckIcon } from 'lucide-react'
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
import {
  feeGrantFor,
  formatIndexerPeriod,
  type OperatorGrantOptions,
  readGrantOptions,
  sameMsgTypes,
} from '@/lib/operator-grant'
import { cn } from '@/lib/utils'
import type { CorporationSigningMode } from '@/msg/actions_hooks/actionCorporationManage'
import { OPERATOR_GRANT_MESSAGE_TYPES } from '@/msg/constants/operatorGrantMessageTypes'
import { useRegistryLabels } from '@/providers/api-rest-query-provider-context'
import { AddressIssueNote, addressIssue } from '@/ui/common/address-issue'
import { OperatorGrantOptionsFields, useOperatorGrantDraft } from '@/ui/common/operator-grant-options'
import { ScoreGauge } from '@/ui/common/score-gauge'
import { SigningModeIcon } from '@/ui/common/signing-mode-icon'
import type { Participant } from '@/ui/dataview/datasections/participant'
import { Avatar, AvatarFallback } from '@/ui/shadcn/avatar'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/ui/shadcn/collapsible'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from '@/ui/shadcn/empty'
import { Input } from '@/ui/shadcn/input'
import { formatVNAFromUVNA, participantCardHref, roleBadgeClass, shortenDID } from '@/util/util'
import { groupMsgTypes, MODULE_LABELS } from './msg-type-groups'
import {
  addressInitials,
  atLeast,
  Card,
  Fact,
  formatDate,
  PartialNote,
  SectionHeader,
  SectionUnavailable,
  YouBadge,
} from './shared'

const CHIP =
  'inline-flex max-w-full items-center gap-1 rounded-md border px-2 py-0.5 text-start font-mono text-[11px] leading-5 break-all'
const CHIP_ON = 'border-primary/25 bg-primary/10 text-primary'
const CHIP_OFF = 'border-border bg-transparent text-muted-foreground'
const CHIP_READONLY = 'border-border bg-muted text-foreground/80'
const TOGGLE_CHIP =
  'transition-colors duration-(--duration-base) ease-standard hover:border-primary/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50'
const ROW_TRIGGER =
  'flex min-w-0 flex-1 items-start gap-3 rounded-lg p-1 text-start outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50'
const COLLAPSIBLE_CONTENT = 'overflow-hidden data-open:animate-collapsible-down data-closed:animate-collapsible-up'
const DISCLOSURE = 'h-8 gap-1.5 px-2 text-xs font-medium text-primary hover:text-primary'
const CHEVRON = 'transition-transform duration-(--duration-base) ease-standard'

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
    <div className="space-y-2.5">
      {groupMsgTypes(typeUrls).map((group) => (
        <div key={group.module} className="flex flex-col gap-1.5 sm:flex-row sm:items-start">
          <span className="w-full shrink-0 pt-0.5 text-[11px] font-medium text-muted-foreground sm:w-36">
            {MODULE_LABELS[group.module] ?? group.module}
          </span>
          <div className="flex min-w-0 flex-wrap gap-1.5">
            {group.entries.map((entry) => {
              const active = selected ? selected.has(entry.typeUrl) : true
              const className = cn(CHIP, onToggle ? (active ? CHIP_ON : CHIP_OFF) : CHIP_READONLY)
              return onToggle ? (
                <button
                  key={entry.typeUrl}
                  type="button"
                  onClick={() => onToggle(entry.typeUrl)}
                  aria-pressed={active}
                  className={cn(className, TOGGLE_CHIP)}
                >
                  {active ? <CheckIcon aria-hidden="true" className="size-3 shrink-0" /> : null}
                  {entry.name}
                </button>
              ) : (
                <span key={entry.typeUrl} className={className}>
                  {entry.name}
                </span>
              )
            })}
          </div>
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

function uvnaTotal(coins: CoinAmount[] | null): number | null {
  if (!coins || coins.length === 0) return null
  const uvna = coins.filter((coin) => coin.denom === 'uvna')
  if (uvna.length !== coins.length) return null
  return uvna.reduce((sum, coin) => sum + Number(coin.amount), 0)
}

function SpendMeter({ limits, label }: { limits: GrantLimits; label: string }) {
  const limit = uvnaTotal(limits.spendLimit)
  const remaining = uvnaTotal(limits.remainingSpend)
  if (limit === null || remaining === null || limit <= 0) return null
  const percent = Math.min(100, Math.max(0, (remaining / limit) * 100))
  return (
    <div className="flex items-center gap-3">
      <ScoreGauge size="sm" percent={percent} label={`${translate(label)} ${Math.round(percent)}%`} />
      <span aria-hidden="true" className="w-10 shrink-0 text-end text-xs font-medium text-foreground tabular-nums">
        {Math.round(percent)}%
      </span>
    </div>
  )
}

function FactGrid({ facts }: { facts: [string, ReactNode][] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
      {facts.map(([key, value]) => (
        <Fact key={key} label={translate(key)} value={value} />
      ))}
    </div>
  )
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
    <div className="space-y-4 border-t border-border px-4 py-4 sm:ps-14">
      <MsgTypeChips typeUrls={authorization.msgTypes} />
      <div className="space-y-4 rounded-lg bg-tint-neutral p-4">
        <FactGrid facts={facts} />
        <SpendMeter limits={authorization} label="delegation.remainingSpend" />
        <div className="space-y-4 border-t border-border pt-4">
          {feeGrantsDegraded ? <SectionUnavailable /> : <FactGrid facts={feeFacts} />}
          {feeGrant && !feeGrantsDegraded ? (
            <SpendMeter limits={feeGrant} label="delegation.feeRemainingSpend" />
          ) : null}
        </div>
      </div>
      {feeGrant &&
      !feeGrantsDegraded &&
      feeGrant.msgTypes.length > 0 &&
      !sameMsgTypes(feeGrant.msgTypes, authorization.msgTypes) ? (
        <MsgTypeChips typeUrls={feeGrant.msgTypes} />
      ) : null}
    </div>
  )
}

function RowChevron() {
  return (
    <ChevronDownIcon
      aria-hidden="true"
      className="mt-2 size-4 shrink-0 text-muted-foreground transition-transform duration-(--duration-base) ease-standard group-data-[state=open]/row:rotate-180"
    />
  )
}

function AddressAvatar({ address, icon }: { address: string; icon?: ReactNode }) {
  return (
    <Avatar className="mt-0.5 shrink-0 rounded-lg after:rounded-lg">
      <AvatarFallback className="rounded-lg bg-linear-to-br from-primary/25 to-primary/5 text-xs font-semibold text-primary [&_svg]:size-4">
        {icon ?? addressInitials(address)}
      </AvatarFallback>
    </Avatar>
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
    <li className="rounded-xl bg-card shadow-hairline transition-shadow duration-(--duration-base) ease-standard hover:shadow-card">
      <Collapsible open={open} onOpenChange={setOpen} className="group/row">
        <div className="flex flex-col gap-2 p-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <CollapsibleTrigger className={ROW_TRIGGER}>
            <RowChevron />
            <AddressAvatar address={authorization.operator} />
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-sm break-all text-foreground">
                {authorization.operator}
                {authorization.operator === walletAddress ? <YouBadge /> : null}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{summary.join(' · ')}</span>
            </span>
          </CollapsibleTrigger>
          {revokeMode ? (
            <Button
              type="button"
              variant="destructive"
              onClick={() => onRevoke(authorization.operator)}
              className="ms-12 shrink-0 gap-2 self-start sm:ms-0 sm:self-center"
            >
              <SigningModeIcon mode={revokeMode} />
              {translate('corporation.page.revoke')}
            </Button>
          ) : null}
        </div>
        <CollapsibleContent className={COLLAPSIBLE_CONTENT}>
          <OperatorGrantDetail
            authorization={authorization}
            feeGrant={feeGrant}
            feeGrantsDegraded={feeGrantsDegraded}
          />
        </CollapsibleContent>
      </Collapsible>
    </li>
  )
}

export function GrantOperatorForm({
  mode,
  walletAddress,
  authorizations,
  feeGrants,
  onGrant,
}: {
  mode: CorporationSigningMode
  walletAddress: string | undefined
  authorizations: OperatorAuthorizationRow[]
  feeGrants: FeeGrantRow[]
  onGrant: (
    grantee: string,
    msgTypes: string[],
    options: OperatorGrantOptions,
    replacesFeeGrant: boolean
  ) => Promise<boolean>
}) {
  const draft = useOperatorGrantDraft(feeGrants, authorizations)
  const selected = new Set(draft.msgTypes)
  const [showTypes, setShowTypes] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const target = draft.target
  const granteeIssue =
    addressIssue(target, []) ??
    (mode === 'operator' && target === walletAddress ? 'corporation.grant.issue.self' : null)
  const reading = readGrantOptions(draft.options)
  const canSubmit =
    target.length > 0 &&
    granteeIssue === null &&
    selected.size + draft.keptMsgTypes.length > 0 &&
    reading.issue === null

  function toggle(typeUrl: string) {
    draft.setMsgTypes((current) =>
      current.includes(typeUrl) ? current.filter((entry) => entry !== typeUrl) : [...current, typeUrl]
    )
  }

  return (
    <form
      className="mt-6 space-y-3 rounded-xl bg-tint-neutral p-4 sm:p-5"
      onSubmit={(event) => {
        event.preventDefault()
        if (!canSubmit || !reading.options) return
        void onGrant(
          target,
          [...draft.msgTypes, ...draft.keptMsgTypes],
          reading.options,
          draft.existingFeeGrant !== undefined
        ).then((granted) => {
          if (granted) draft.reset()
        })
      }}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex min-w-0 grow flex-col gap-2 text-sm font-medium text-foreground sm:max-w-xl">
          <span className="flex items-center gap-2">
            <KeyRoundIcon aria-hidden="true" className="size-4 text-primary" />
            {translate('corporation.page.grant')}
          </span>
          <Input
            value={draft.grantee}
            onChange={(event) => {
              const existing = draft.setGrantee(event.target.value)
              if (existing.feeGrant || existing.authorization) setShowOptions(true)
              if (existing.authorization) setShowTypes(true)
            }}
            placeholder="verana1…"
            aria-invalid={granteeIssue ? true : undefined}
            className="h-9 bg-background font-mono"
          />
        </label>
        <Button type="submit" size="lg" disabled={!canSubmit} className="h-9 gap-2">
          <SigningModeIcon mode={mode} />
          {translate('corporation.page.grant.submit')}
        </Button>
      </div>
      <AddressIssueNote issue={granteeIssue} />
      <AddressIssueNote issue={reading.issue} />
      <div className="flex flex-wrap gap-1">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setShowTypes(!showTypes)}
          aria-expanded={showTypes}
          className={DISCLOSURE}
        >
          <ChevronDownIcon aria-hidden="true" className={cn(CHEVRON, showTypes && 'rotate-180')} />
          {translate('corporation.page.grant.count', {
            selected: selected.size,
            total: OPERATOR_GRANT_MESSAGE_TYPES.length,
          })}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setShowOptions(!showOptions)}
          aria-expanded={showOptions}
          className={DISCLOSURE}
        >
          <ChevronDownIcon aria-hidden="true" className={cn(CHEVRON, showOptions && 'rotate-180')} />
          {translate('corporation.grant.options')}
        </Button>
      </div>
      {showTypes ? (
        <div className="space-y-3 rounded-lg bg-card p-4 ring-1 ring-border animate-in fade-in-0 slide-in-from-top-1">
          <div className="flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => draft.setMsgTypes([...OPERATOR_GRANT_MESSAGE_TYPES])}
            >
              {translate('corporation.page.msgtypes.all')}
            </Button>
            <Button type="button" variant="outline" size="xs" onClick={() => draft.setMsgTypes([])}>
              {translate('corporation.page.msgtypes.none')}
            </Button>
          </div>
          <MsgTypeChips typeUrls={OPERATOR_GRANT_MESSAGE_TYPES} selected={selected} onToggle={toggle} />
          {draft.keptMsgTypes.length > 0 ? (
            <div className="space-y-2 border-t border-border pt-3">
              <p className="text-xs text-muted-foreground">{translate('corporation.page.grant.kept')}</p>
              <MsgTypeChips typeUrls={draft.keptMsgTypes} />
            </div>
          ) : null}
        </div>
      ) : null}
      {showOptions ? (
        <div className="rounded-lg bg-card p-4 ring-1 ring-border animate-in fade-in-0 slide-in-from-top-1">
          <OperatorGrantOptionsFields
            value={draft.options}
            onChange={draft.setOptions}
            replacesFeeGrant={draft.existingFeeGrant !== undefined}
          />
        </div>
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
      <div className="rounded-lg bg-tint-neutral p-4">
        <FactGrid facts={facts} />
      </div>
      {participantHref ? (
        <Link
          href={participantHref}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
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
    <li className="space-y-3 py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-xs font-medium text-muted-foreground">
          {translate('corporation.page.agents.participant')}
        </span>
        <Badge variant="outline" className="font-mono">
          #{record.participantId}
        </Badge>
        {participant ? (
          <>
            <span className={cn('rounded-full px-2 py-0.5 text-xs', roleBadgeClass(participant.role))}>
              {participant.role}
            </span>
            {participant.did ? (
              <span className="font-mono text-xs break-all">{shortenDID(participant.did)}</span>
            ) : null}
            <span className="text-xs text-muted-foreground">
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
  partial,
}: {
  vsOperator: string
  records: VsOperatorAuthorizationRow[]
  participantsById: Map<number, Participant>
  partial: boolean
}) {
  const [open, setOpen] = useState(false)
  return (
    <li className="rounded-xl bg-card shadow-hairline transition-shadow duration-(--duration-base) ease-standard hover:shadow-card">
      <Collapsible open={open} onOpenChange={setOpen} className="group/row">
        <div className="p-2">
          <CollapsibleTrigger className={ROW_TRIGGER}>
            <RowChevron />
            <AddressAvatar address={vsOperator} icon={<BotIcon aria-hidden="true" />} />
            <span className="min-w-0">
              <span className="block font-mono text-sm break-all text-foreground">{vsOperator}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {atLeast(records.length, partial)} {translate('corporation.page.agents.records')}
              </span>
            </span>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className={COLLAPSIBLE_CONTENT}>
          <ul className="divide-y divide-border border-t border-border px-4 py-4 sm:ps-14">
            {records.map((record) => (
              <AgentRecord
                key={record.participantId}
                record={record}
                participant={participantsById.get(record.participantId)}
              />
            ))}
          </ul>
        </CollapsibleContent>
      </Collapsible>
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

function EmptyRow({ degraded, emptyKey, icon }: { degraded: boolean; emptyKey: string; icon: ReactNode }) {
  return (
    <li>
      {degraded ? (
        <SectionUnavailable />
      ) : (
        <Empty className="border border-dashed border-border py-8">
          <EmptyHeader>
            <EmptyMedia variant="icon">{icon}</EmptyMedia>
            <EmptyDescription>{translate(emptyKey)}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </li>
  )
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
  partialOperators,
  partialAgents,
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
  partialOperators: boolean
  partialAgents: boolean
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
        <SectionHeader
          icon={<ShieldCheckIcon />}
          title={translate('corporation.page.operators')}
          description={
            degradedOperators ? null : (
              <span className="tabular-nums">
                {atLeast(authorizations.length, partialOperators)}{' '}
                {translate('corporation.tab.operators').toLowerCase()}
              </span>
            )
          }
        />
        {partialOperators ? <PartialNote /> : null}
        <ul className="space-y-2">
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
            <EmptyRow
              degraded={degradedOperators}
              emptyKey="corporation.page.operators.empty"
              icon={<KeyRoundIcon />}
            />
          ) : null}
        </ul>
        {grantMode ? (
          <GrantOperatorForm
            mode={grantMode}
            walletAddress={walletAddress}
            authorizations={authorizations}
            feeGrants={feeGrants}
            onGrant={onGrant}
          />
        ) : null}
      </Card>
      <Card id="agents">
        <SectionHeader
          icon={<BotIcon />}
          title={translate('corporation.page.agents')}
          description={translate('corporation.page.agents.note')}
          action={
            <Button asChild variant="outline" className="gap-2">
              <Link href="/agents">
                <BotIcon aria-hidden="true" />
                {translate('corporation.page.agents.link')}
              </Link>
            </Button>
          }
        />
        {partialAgents ? <PartialNote /> : null}
        <ul className="space-y-2">
          {agentAccounts.map(([vsOperator, records]) => (
            <AgentAccountRow
              key={vsOperator}
              vsOperator={vsOperator}
              records={records}
              participantsById={participantsById}
              partial={partialAgents}
            />
          ))}
          {agentAccounts.length === 0 ? (
            <EmptyRow degraded={degradedAgents} emptyKey="corporation.page.agents.empty" icon={<BotIcon />} />
          ) : null}
        </ul>
      </Card>
    </div>
  )
}
