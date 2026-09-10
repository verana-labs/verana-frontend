'use client'

import type { EncodeObject } from '@cosmjs/proto-signing'
import { useChain } from '@cosmos-kit/react'
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { type FeeGrantLookup, useFeeGrant } from '@/hooks/useFeeGrant'
import { simulationFor, type TxSimulation, useTxSimulation } from '@/hooks/useTxSimulation'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import { feeGrantCovering, nativeFeeAmount } from '@/lib/fee-grant'
import {
  confirmLabelKey,
  formatStdFee,
  modeLabelKey,
  proposalMetadata,
  type TxConfirmRequest,
  type TxConfirmResult,
  type TxFeeGrant,
  type TxSeverity,
} from '@/lib/tx-preview'
import { SigningModeIcon } from '@/ui/common/signing-mode-icon'
import { type I18nValues, resolveTranslatable } from '@/ui/dataview/types'
import { shortenMiddle } from '@/util/util'

const SETTLE_DELAY_MS = 400

function t(key: string, values?: I18nValues): string {
  return resolveTranslatable({ key, values }, translate) ?? key
}

function proposalPolicy(msgs: EncodeObject[]): string {
  const value: unknown = msgs[0]?.value
  if (typeof value !== 'object' || value === null) return ''
  const policy = (value as Record<string, unknown>).groupPolicyAddress
  return typeof policy === 'string' ? policy : ''
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="text-right text-gray-900 dark:text-white break-all">{children}</dd>
    </div>
  )
}

function FeeValue({ simulation }: { simulation: TxSimulation }) {
  if (simulation.status === 'simulating')
    return <span className="animate-pulse text-gray-400">{t('txconfirm.fee.simulating')}</span>
  if (simulation.status === 'failed')
    return <span className="text-red-600 dark:text-red-400">{t('txconfirm.fee.failed')}</span>
  return <span>{formatStdFee(simulation.fee)}</span>
}

function feeGranter(
  feeGrant: TxFeeGrant | undefined,
  lookup: FeeGrantLookup,
  simulation: TxSimulation
): string | undefined {
  if (!feeGrant || lookup.status !== 'ready' || simulation.status !== 'ready') return undefined
  const covering = feeGrantCovering(lookup.grants, feeGrant.msgType, nativeFeeAmount(simulation.fee))
  return covering ? feeGrant.granterAddress : undefined
}

function WarningBox({ severity, children }: { severity: TxSeverity | undefined; children: ReactNode }) {
  if (severity === 'notice')
    return (
      <div className="border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20 rounded-r-lg p-4 flex gap-3">
        <FontAwesomeIcon icon={faTriangleExclamation} className="text-amber-500 mt-0.5" />
        <p className="text-sm text-amber-900 dark:text-amber-100">{children}</p>
      </div>
    )
  return (
    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 flex gap-3">
      <FontAwesomeIcon icon={faTriangleExclamation} className="text-red-600 dark:text-red-400 mt-0.5" />
      <p className="text-sm text-red-700 dark:text-red-300">{children}</p>
    </div>
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
  const [title, setTitle] = useState(fallbackTitle)
  const [summary, setSummary] = useState('')
  const [settledTitle, setSettledTitle] = useState(fallbackTitle)
  const [settledSummary, setSettledSummary] = useState('')

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

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  const proposal = request.mode === 'proposal'
  const editing = title !== settledTitle || summary !== settledSummary
  const granter = feeGranter(request.feeGrant, feeGrantLookup, currentSimulation)
  const payer = granter ?? request.payer
  const labelClass = 'text-sm font-medium text-gray-700 dark:text-gray-300 block'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="txconfirm-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-lg rounded-xl border border-neutral-20 dark:border-neutral-70 bg-white dark:bg-surface p-6 shadow-xl space-y-4"
      >
        <div>
          <h2 id="txconfirm-title" className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {t(request.titleKey)}
          </h2>
          <p className="text-sm text-gray-700 dark:text-gray-200">{request.effect}</p>
        </div>
        <dl className="text-sm space-y-2">
          <Row label={t('txconfirm.executesas')}>
            <span className="inline-flex items-center gap-2">
              <SigningModeIcon mode={request.mode === 'account' ? null : request.mode} />
              {t(modeLabelKey(request.mode))}
            </span>
          </Row>
          <Row label={t('txconfirm.fee')}>
            <FeeValue simulation={currentSimulation} />
          </Row>
          <Row label={t('txconfirm.payer')}>
            <span className="font-mono">{shortenMiddle(payer, 24)}</span>
            {payer === address ? ` ${t('txconfirm.payer.you')}` : ''}
          </Row>
          {request.costLines?.map((line) => (
            <Row key={line.label} label={line.label}>
              {line.value}
            </Row>
          ))}
        </dl>
        {granter ? <p className="text-sm text-gray-600 dark:text-gray-300">{t('txconfirm.feegrant.covered')}</p> : null}
        {feeGrantLookup.status === 'failed' ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">{t('txconfirm.feegrant.unavailable')}</p>
        ) : null}
        {proposal ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">
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
        {request.warning ? <WarningBox severity={request.severity}>{request.warning}</WarningBox> : null}
        {currentSimulation.status === 'failed' ? (
          <WarningBox severity="irreversible">
            {t('txconfirm.simulation.rejected', { msg: currentSimulation.message })}{' '}
            <button type="button" onClick={() => void simulate()} className="underline font-medium">
              {t('txconfirm.retry')}
            </button>
          </WarningBox>
        ) : null}
        <div className="actions-center">
          <button type="button" className="btn-action-cancel flex-1" onClick={onCancel}>
            {t('txconfirm.cancel')}
          </button>
          <button
            type="button"
            className="btn-action-confirm flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentSimulation.status !== 'ready' || editing}
            onClick={() => onConfirm({ msgs: simulatedMsgs, granter })}
          >
            {t(confirmLabelKey(request.mode))}
          </button>
        </div>
      </div>
    </div>
  )
}
