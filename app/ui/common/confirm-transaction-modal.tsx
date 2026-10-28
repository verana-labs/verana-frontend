'use client'

import { toBase64 } from '@cosmjs/encoding'
import type { EncodeObject } from '@cosmjs/proto-signing'
import { useChain } from '@cosmos-kit/react'
import { ChevronRightIcon, TriangleAlertIcon } from 'lucide-react'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { LOW_BALANCE_WARN_UVNA, VERANA_FAUCET_URL } from '@/config/env'
import { useAccountBalance } from '@/hooks/useAccountBalance'
import { type FeeGrantLookup, useFeeGrant } from '@/hooks/useFeeGrant'
import { type GranterBalance, useGranterBalance } from '@/hooks/useGranterBalance'
import { simulationFor, type TxSimulation, useTxSimulation } from '@/hooks/useTxSimulation'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import { authorizationRejection, chainRejection } from '@/lib/chain-error'
import { type FeeGrantPayer, feeGrantPayer, grantCoversMsgType, nativeFeeAmount } from '@/lib/fee-grant'
import { balanceWarning, totalDebitUvna } from '@/lib/trust-costs'
import {
  type CostLine,
  confirmLabelKey,
  formatStdFee,
  modeLabelKey,
  proposalMetadata,
  type TxConfirmRequest,
  type TxConfirmResult,
  type TxFeeGrant,
  type TxSeverity,
} from '@/lib/tx-preview'
import JsonCodeBlock from '@/ui/common/json-code-block'
import { restoreModalFocus, trapTabKey } from '@/ui/common/modal-action'
import { SigningModeIcon } from '@/ui/common/signing-mode-icon'
import { type I18nValues, resolveTranslatable } from '@/ui/dataview/types'
import { Alert, AlertDescription } from '@/ui/shadcn/alert'
import { Button } from '@/ui/shadcn/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/ui/shadcn/collapsible'
import { Spinner } from '@/ui/shadcn/spinner'
import { shortenMiddle } from '@/util/util'

const SETTLE_DELAY_MS = 400
const BALANCE_WAIT_MS = 5_000
const UVNA_PER_VNA = 1_000_000
const DESTRUCTIVE_ALERT = 'border-destructive/30 bg-destructive/10 px-3 py-2.5 dark:bg-destructive/20'

function t(key: string, values?: I18nValues): string {
  return resolveTranslatable({ key, values }, translate) ?? key
}

function simulationRejection(message: string): string {
  const reason = authorizationRejection(message)
  return reason
    ? t('txconfirm.simulation.unauthorized', { reason })
    : t('txconfirm.simulation.rejected', { msg: chainRejection(message) ?? message })
}

function proposalPolicy(msgs: EncodeObject[]): string {
  const value: unknown = msgs[0]?.value
  if (typeof value !== 'object' || value === null) return ''
  const policy = (value as Record<string, unknown>).groupPolicyAddress
  return typeof policy === 'string' ? policy : ''
}

function rawMessages(msgs: readonly EncodeObject[]): string {
  return JSON.stringify(
    msgs,
    (_key, value: unknown) => {
      if (typeof value === 'bigint') return value.toString()
      if (value instanceof Uint8Array) return toBase64(value)
      return value
    },
    2
  )
}

function RawMessages({ msgs }: { msgs: readonly EncodeObject[] }) {
  const raw = useMemo(() => rawMessages(msgs), [msgs])
  return (
    <div className="mt-2 max-h-64 overflow-auto rounded-md bg-muted text-xs dark:bg-foreground/5">
      <JsonCodeBlock value={raw} />
    </div>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground break-all">{children}</dd>
    </div>
  )
}

function FeeValue({ simulation }: { simulation: TxSimulation }) {
  if (simulation.status === 'simulating')
    return <span className="animate-pulse font-normal text-muted-foreground">{t('txconfirm.fee.simulating')}</span>
  if (simulation.status === 'failed') return <span className="text-destructive">{t('txconfirm.fee.failed')}</span>
  return <span className="tabular-nums">{formatStdFee(simulation.fee)}</span>
}

function grantPayer(
  feeGrant: TxFeeGrant | undefined,
  lookup: FeeGrantLookup,
  granterBalance: GranterBalance,
  simulation: TxSimulation
): FeeGrantPayer | undefined {
  if (!feeGrant || lookup.status !== 'ready' || simulation.status !== 'ready') return undefined
  return feeGrantPayer(
    lookup.grants,
    feeGrant.msgType,
    nativeFeeAmount(simulation.fee),
    granterBalance.status === 'ready' ? granterBalance.amount : null
  )
}

function BalanceWarning({
  balance,
  balanceUnknown,
  feeUvna,
  feeGranted,
  costLines,
}: {
  balance: string | null
  balanceUnknown: boolean
  feeUvna: number | null
  feeGranted: boolean
  costLines: CostLine[] | undefined
}) {
  if (feeGranted && totalDebitUvna(costLines ?? []) === 0) return null
  if (balance === null)
    return balanceUnknown ? (
      <p className="text-sm text-muted-foreground">{t('txconfirm.balance.unavailable')}</p>
    ) : (
      <p className="text-sm animate-pulse text-muted-foreground">{t('txconfirm.balance.checking')}</p>
    )
  const warning = balanceWarning(balance, feeUvna, costLines, LOW_BALANCE_WARN_UVNA ?? '0', feeGranted)
  if (!warning) return null
  const key = warning.kind === 'shortfall' ? 'txconfirm.balance.shortfall' : 'txconfirm.balance.low'
  const html = t(VERANA_FAUCET_URL ? key : `${key}.noFaucet`, {
    value: Number(balance) / UVNA_PER_VNA,
    fee: warning.requiredUvna / UVNA_PER_VNA,
  })
  return (
    <Alert variant="destructive" className={DESTRUCTIVE_ALERT}>
      <TriangleAlertIcon />
      <AlertDescription className="text-current" dangerouslySetInnerHTML={{ __html: html }} />
    </Alert>
  )
}

function WarningBox({ severity, children }: { severity: TxSeverity | undefined; children: ReactNode }) {
  return (
    <Alert
      role="note"
      variant={severity === 'notice' ? 'default' : 'destructive'}
      className={
        severity === 'notice'
          ? 'border-warning/30 bg-warning/10 px-3 py-2.5 text-warning dark:bg-warning/20'
          : DESTRUCTIVE_ALERT
      }
    >
      <TriangleAlertIcon />
      <AlertDescription className="text-current">{children}</AlertDescription>
    </Alert>
  )
}

export function ConfirmTransactionModal({
  request,
  onCancel,
  onConfirm,
}: {
  request: TxConfirmRequest
  onCancel: () => void
  onConfirm: (result: TxConfirmResult) => void
}) {
  const veranaChain = useVeranaChain()
  const { address } = useChain(veranaChain.chain_name)
  const { msgs, buildProposalMsgs } = request
  const fallbackTitle = request.proposalTitle ?? ''
  const composing = request.mode === 'proposal' && buildProposalMsgs !== undefined
  const { accountData, errorAccountData } = useAccountBalance()
  const [balanceWaitOver, setBalanceWaitOver] = useState(false)
  const balanceUnknown = accountData.balance === null && (errorAccountData !== null || balanceWaitOver)
  const [title, setTitle] = useState(fallbackTitle)
  const [summary, setSummary] = useState(fallbackTitle)
  const [settledTitle, setSettledTitle] = useState(fallbackTitle)
  const [settledSummary, setSettledSummary] = useState(fallbackTitle)

  useEffect(() => {
    const timer = setTimeout(() => setBalanceWaitOver(true), BALANCE_WAIT_MS)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setSettledTitle(title)
      setSettledSummary(summary)
    }, SETTLE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [title, summary])

  const simulatedMsgs = useMemo(
    () =>
      composing && buildProposalMsgs
        ? buildProposalMsgs(proposalMetadata(settledTitle, settledSummary, fallbackTitle))
        : msgs,
    [composing, buildProposalMsgs, msgs, fallbackTitle, settledTitle, settledSummary]
  )
  const { simulation, simulate } = useTxSimulation(simulatedMsgs)
  const currentSimulation = simulationFor(simulation, simulatedMsgs)
  const feeGrantLookup = useFeeGrant(request.feeGrant ?? null)
  const grantFound =
    request.feeGrant !== undefined &&
    Boolean(request.feeGrant.granterAddress) &&
    feeGrantLookup.status === 'ready' &&
    grantCoversMsgType(feeGrantLookup.grants, request.feeGrant.msgType)
  const granterBalance = useGranterBalance(grantFound ? request.feeGrant?.granterAddress : undefined)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onCancel()
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [onCancel])

  const proposal = request.mode === 'proposal'
  const editing = title !== settledTitle || summary !== settledSummary
  const granterBalancePending = grantFound && (granterBalance.status === 'idle' || granterBalance.status === 'loading')
  const payerByGrant = granterBalancePending
    ? undefined
    : grantPayer(request.feeGrant, feeGrantLookup, granterBalance, currentSimulation)
  const granter = payerByGrant === 'granter' ? request.feeGrant?.granterAddress : undefined
  const payer = granter ?? request.payer
  const simulatedFeeUvna = currentSimulation.status === 'ready' ? Number(nativeFeeAmount(currentSimulation.fee)) : null
  const payerPending =
    feeGrantLookup.status === 'loading' ||
    granterBalancePending ||
    (request.feeGrant !== undefined && currentSimulation.status === 'simulating')
  const accountOwesNothing = granter !== undefined && totalDebitUvna(request.costLines ?? []) === 0
  const holdForBalance =
    request.payer === address && !accountOwesNothing && accountData.balance === null && !balanceUnknown
  const labelClass = 'text-sm font-medium text-foreground block'
  const blocked =
    currentSimulation.status !== 'ready' ||
    editing ||
    feeGrantLookup.status === 'loading' ||
    granterBalancePending ||
    holdForBalance
  const waiting = blocked && currentSimulation.status !== 'failed'
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    panelRef.current?.focus({ preventScroll: true })
    return () => restoreModalFocus(opener)
  }, [])

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain" onClick={onCancel}>
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-black/20 animate-in fade-in-0 duration-100 supports-backdrop-filter:backdrop-blur-xs dark:bg-black/50"
      />
      <div className="relative flex min-h-full items-center justify-center p-4">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="txconfirm-title"
          tabIndex={-1}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={trapTabKey}
          className="w-full max-w-lg rounded-xl bg-popover text-sm text-popover-foreground shadow-overlay ring-1 ring-foreground/10 outline-none animate-in fade-in-0 zoom-in-95 duration-100"
        >
          <div className="space-y-4 p-4 sm:p-6">
            <div className="space-y-1.5">
              <h2 id="txconfirm-title" className="text-lg font-semibold leading-snug text-foreground">
                {t(request.titleKey)}
              </h2>
              <p className="text-sm text-muted-foreground">{request.effect}</p>
            </div>
            <dl className="divide-y divide-border rounded-md border border-border px-3">
              <Row label={t('txconfirm.executesas')}>
                <span className="inline-flex items-center gap-2">
                  <SigningModeIcon mode={request.mode === 'account' ? null : request.mode} />
                  {t(modeLabelKey(request.mode))}
                </span>
              </Row>
              {request.costLines?.map((line) => (
                <Row key={line.label} label={line.label}>
                  {line.value}
                </Row>
              ))}
            </dl>
            {proposal ? (
              <p className="text-sm text-muted-foreground">
                {t('txconfirm.proposal.explainer', {
                  corporation: request.corporationLabel ?? shortenMiddle(proposalPolicy(request.msgs), 24),
                })}
              </p>
            ) : null}
            {composing ? (
              <div className="space-y-3">
                <label className={labelClass}>
                  {t('txconfirm.proposal.title')}
                  <input value={title} onChange={(event) => setTitle(event.target.value)} className="input mt-1" />
                </label>
                <label className={labelClass}>
                  {t('txconfirm.proposal.summary')}
                  <textarea
                    value={summary}
                    onChange={(event) => setSummary(event.target.value)}
                    rows={3}
                    className="textarea mt-1"
                  />
                </label>
              </div>
            ) : null}
            <div className="space-y-2">
              <dl className="divide-y divide-border rounded-md bg-muted/60 px-3 dark:bg-foreground/5">
                <Row label={t('txconfirm.fee')}>
                  <FeeValue simulation={currentSimulation} />
                </Row>
                <Row label={t('txconfirm.payer')}>
                  {payerPending ? (
                    <span className="animate-pulse font-normal text-muted-foreground">
                      {t('txconfirm.payer.checking')}
                    </span>
                  ) : (
                    <>
                      <span className="font-mono">{shortenMiddle(payer, 24)}</span>
                      {payer === address ? ` ${t('txconfirm.payer.you')}` : ''}
                    </>
                  )}
                </Row>
              </dl>
              {granter ? <p className="text-xs text-muted-foreground">{t('txconfirm.feegrant.covered')}</p> : null}
              {granter && granterBalance.status === 'failed' ? (
                <p className="text-xs text-muted-foreground">{t('txconfirm.feegrant.balanceUnknown')}</p>
              ) : null}
              {payerByGrant === 'granter-short' ? (
                <p className="text-xs text-muted-foreground">{t('txconfirm.feegrant.short')}</p>
              ) : null}
              {feeGrantLookup.status === 'failed' ? (
                <p className="text-xs text-muted-foreground">{t('txconfirm.feegrant.unavailable')}</p>
              ) : null}
            </div>
            {request.warning ? <WarningBox severity={request.severity}>{request.warning}</WarningBox> : null}
            {request.payer === address && !payerPending && currentSimulation.status === 'ready' ? (
              <BalanceWarning
                balance={accountData.balance}
                balanceUnknown={balanceUnknown}
                feeUvna={simulatedFeeUvna}
                feeGranted={granter !== undefined}
                costLines={request.costLines}
              />
            ) : null}
            {currentSimulation.status === 'failed' ? (
              <WarningBox severity="irreversible">
                {simulationRejection(currentSimulation.message)}{' '}
                <button
                  type="button"
                  onClick={() => void simulate()}
                  className="rounded-sm font-medium underline underline-offset-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {t('txconfirm.retry')}
                </button>
              </WarningBox>
            ) : null}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="group/raw -ml-2 text-muted-foreground">
                  <ChevronRightIcon className="transition-transform duration-(--duration-base) group-data-[state=open]/raw:rotate-90" />
                  {t('txconfirm.raw')}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <RawMessages msgs={simulatedMsgs} />
              </CollapsibleContent>
            </Collapsible>
          </div>
          <div className="flex flex-col-reverse gap-2 rounded-b-xl border-t border-border bg-muted/50 px-4 py-3 sm:flex-row sm:justify-end sm:px-6">
            <Button type="button" variant="outline" size="lg" className="btn-action-cancel px-4" onClick={onCancel}>
              {t('txconfirm.cancel')}
            </Button>
            <Button
              type="button"
              size="lg"
              className="btn-action-confirm px-4 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={blocked}
              aria-busy={waiting || undefined}
              onClick={() => {
                if (currentSimulation.status === 'ready')
                  onConfirm({ msgs: simulatedMsgs, fee: { ...currentSimulation.fee, granter } })
              }}
            >
              {waiting ? <Spinner aria-hidden="true" /> : null}
              {t(confirmLabelKey(request.mode))}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
