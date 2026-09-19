'use client'

import { faCircleCheck, faClock, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FaucetError,
  type FaucetInfo,
  type FaucetResult,
  faucetErrorMessage,
  faucetUnavailableMessage,
  isAmountWithinLimit,
  useFaucet,
} from '@/hooks/useFaucet'
import { explorerTxUrl } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import { useNotification } from '@/providers/notification-provider'
import FieldRow from '@/ui/common/field-row'
import { formatVNAFromUVNA, parseVNA } from '@/util/util'

// Action id of the Get VNA card. It is not a chain message, so it does not belong to the MsgType unions.
export const GET_VNA_ACTION = 'GetVNATrustDeposit'

interface GetVNAPanelProps {
  onClose: () => void
  onRefresh?: (id?: string, txHeight?: number) => void
}

type PanelState =
  | { kind: 'loading' }
  | { kind: 'loadError' }
  | { kind: 'open'; info: FaucetInfo }
  | { kind: 'result'; info: FaucetInfo; result: FaucetResult }
  | { kind: 'error'; info: FaucetInfo; message: string }

export default function GetVNAPanel({ onClose, onRefresh }: GetVNAPanelProps) {
  const { getInfo, requestFunds, phase } = useFaucet()
  const { notify } = useNotification()
  const [state, setState] = useState<PanelState>({ kind: 'loading' })
  const [amountVNA, setAmountVNA] = useState('')
  const title = translate('getvna.title')

  const loadInfo = useCallback(async () => {
    setState({ kind: 'loading' })
    try {
      const info = await getInfo()
      setAmountVNA(String(Number(info.defaultAmount) / 1_000_000))
      setState({ kind: 'open', info })
    } catch {
      setState({ kind: 'loadError' })
    }
  }, [getInfo])

  // Per [VFE-PAGE-ACCT-4] the panel reads GET /v1/info when it opens.
  useEffect(() => {
    void loadInfo()
  }, [loadInfo])

  // The limits do not change after the info loads. Format them one time.
  const info = 'info' in state ? state.info : undefined
  const limits = useMemo(
    () =>
      info && {
        defaultAmount: formatVNAFromUVNA(info.defaultAmount),
        perHour: formatVNAFromUVNA(info.maxAmountPerHour),
        perDay: formatVNAFromUVNA(info.maxAmountPerDay),
      },
    [info]
  )

  if (state.kind === 'loading') {
    return <p className="py-6 text-sm text-neutral-70 dark:text-neutral-70">{translate('getvna.loading')}</p>
  }

  if (!info || !limits) {
    return (
      <div className="py-6 space-y-4">
        <Notice tone="error" text={translate('getvna.error.generic')} />
        <div className="actions-center">
          <button className="btn-action-cancel" onClick={onClose}>
            {translate('messages.cancel')}
          </button>
          <button className="btn-action-confirm" onClick={() => void loadInfo()}>
            {translate('getvna.retry')}
          </button>
        </div>
      </div>
    )
  }

  const busy = phase !== 'idle'
  // Per [VFE-PAGE-ACCT-4] the amount must not be more than maxAmountPerHour. Check it before the request.
  const amountUVNA = parseVNA(amountVNA)
  const amountValid = isAmountWithinLimit(amountUVNA, info.maxAmountPerHour)
  const canRequest = info.available && !busy && amountValid

  const request = async () => {
    if (state.kind === 'error') setState({ kind: 'open', info })
    void notify(translate('getvna.requesting'), 'inProgress', title)
    try {
      const result = await requestFunds(amountUVNA)
      setState({ kind: 'result', info, result })
      // Per [VFE-TX-UX-1] the notification links the transaction hash to the explorer.
      const txUrl = explorerTxUrl(result.txHash)
      const link = txUrl ? { href: txUrl, label: result.txHash } : undefined
      if (result.status === 'confirmed') {
        void notify(translate('notification.getvna.success'), 'success', title, link)
        // Per [VFE-TX-UX-2] the refresh waits for the indexer block, the same as the other account actions.
        onRefresh?.(undefined, result.height)
      } else {
        void notify(translate('notification.getvna.pending'), 'info', title, link)
      }
    } catch (error) {
      const message = faucetErrorMessage(error)
      setState({ kind: 'error', info, message })
      // Per [VFE-TX-UX-1] the raw error stays in the notification details.
      const code = error instanceof FaucetError ? error.code : 'ERROR'
      const raw = error instanceof Error ? error.message : String(error)
      void notify(`${code}: ${raw}`, 'error', message)
    }
  }

  if (state.kind === 'result') {
    const { result } = state
    const confirmed = result.status === 'confirmed'
    const txUrl = explorerTxUrl(result.txHash)
    return (
      <div className="py-6 space-y-4">
        <Notice
          tone={confirmed ? 'success' : 'info'}
          text={translate(confirmed ? 'getvna.result.received' : 'getvna.result.pending', {
            amount: formatVNAFromUVNA(result.amount),
          })}
        />
        <p className="text-sm text-gray-900 dark:text-white break-all">
          <span className="font-medium">{translate('getvna.result.txHash')}: </span>
          {txUrl ? (
            <a
              href={txUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-primary-700 dark:text-primary-300 underline underline-offset-2"
            >
              {result.txHash}
            </a>
          ) : (
            <span className="font-mono">{result.txHash}</span>
          )}
        </p>
        <div className="actions-center">
          <button className="btn-action-cancel" onClick={onClose}>
            {translate('getvna.close')}
          </button>
          <button className="btn-action-confirm" onClick={() => setState({ kind: 'open', info })}>
            {translate('getvna.again')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6 space-y-4">
      <div className="grid grid-cols-2 gap-4 text-sm text-gray-900 dark:text-white">
        <FieldRow label={translate('getvna.network')}>
          <span className="font-mono">{info.chainId}</span>
        </FieldRow>
        <FieldRow label={translate('getvna.defaultAmount')}>{limits.defaultAmount}</FieldRow>
        <FieldRow label={translate('getvna.limitHour')}>{limits.perHour}</FieldRow>
        <FieldRow label={translate('getvna.limitDay')}>{limits.perDay}</FieldRow>
      </div>

      {!info.available && <Notice tone="error" text={faucetUnavailableMessage(info.unavailableReason)} />}
      {state.kind === 'error' && <Notice tone="error" text={state.message} />}
      {busy && <Notice tone="info" text={translate(phase === 'signing' ? 'getvna.signing' : 'getvna.requesting')} />}

      <div className="form-field max-w-md">
        <label htmlFor="getvna-amount" className="label">
          {translate('getvna.amount.label')}
        </label>
        <input
          id="getvna-amount"
          className="input"
          type="number"
          min="0"
          step="any"
          value={amountVNA}
          disabled={!info.available || busy}
          onChange={(e) => setAmountVNA(e.target.value)}
        />
        {amountVNA !== '' && !amountValid && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {translate('getvna.amount.invalid', { max: limits.perHour })}
          </p>
        )}
      </div>

      <div className="actions-center">
        <button className="btn-action-cancel" onClick={onClose} disabled={busy}>
          {translate('messages.cancel')}
        </button>
        <button className="btn-action-confirm" onClick={() => void request()} disabled={!canRequest}>
          {translate('getvna.request')}
        </button>
      </div>
    </div>
  )
}

type NoticeTone = 'success' | 'info' | 'error'

const NOTICE_CLASS: Record<NoticeTone, string> = {
  success: 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300',
  info: 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300',
  error: 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300',
}

const NOTICE_ICON = { success: faCircleCheck, info: faClock, error: faTriangleExclamation } as const

function Notice({ tone, text }: { tone: NoticeTone; text: string }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-lg p-4 text-sm ${NOTICE_CLASS[tone]}`}
    >
      <FontAwesomeIcon icon={NOTICE_ICON[tone]} className="mt-0.5" />
      <span>{text}</span>
    </div>
  )
}
