'use client'

import { faCircleCheck, faClock, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  type FaucetInfo,
  type FaucetResult,
  faucetErrorDetails,
  faucetErrorMessage,
  faucetUnavailableMessage,
  isAmountWithinLimit,
  useFaucet,
} from '@/hooks/useFaucet'
import { explorerTxLink, explorerTxUrl } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import { useNotification } from '@/providers/notification-provider'
import FieldRow from '@/ui/common/field-row'
import { Input } from '@/ui/shadcn/input'
import { Spinner } from '@/ui/shadcn/spinner'
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
    return (
      <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Spinner aria-hidden="true" />
        {translate('getvna.loading')}
      </p>
    )
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
      const link = explorerTxLink(result.txHash)
      if (result.status === 'confirmed') {
        void notify(translate('notification.getvna.success'), 'success', title, link)
        onRefresh?.()
      } else {
        void notify(translate('notification.getvna.pending'), 'info', title, link)
      }
    } catch (error) {
      const message = faucetErrorMessage(error)
      setState({ kind: 'error', info, message })
      const details = faucetErrorDetails(error)
      void notify(details ?? message, 'error', details === null ? title : message)
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
        <p className="text-sm text-foreground break-all">
          <span className="font-medium">{translate('getvna.result.txHash')}: </span>
          {txUrl ? (
            <a
              href={txUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-primary underline underline-offset-4"
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
      <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-muted/50 p-4 text-sm text-foreground">
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
        <Input
          id="getvna-amount"
          className="h-9 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          aria-invalid={(amountVNA !== '' && !amountValid) || undefined}
          aria-describedby={amountVNA !== '' && !amountValid ? 'getvna-amount-error' : undefined}
          type="number"
          min="0"
          step="any"
          value={amountVNA}
          disabled={!info.available || busy}
          onChange={(e) => setAmountVNA(e.target.value)}
        />
        {amountVNA !== '' && !amountValid && (
          <p id="getvna-amount-error" className="text-sm text-destructive">
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
  success: 'border-success/30 bg-success/10 [&>svg]:text-success dark:border-success/40',
  info: 'border-info/30 bg-info/10 [&>svg]:text-info dark:border-info/40',
  error: 'border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40',
}

const NOTICE_ICON = { success: faCircleCheck, info: faClock, error: faTriangleExclamation } as const

function Notice({ tone, text }: { tone: NoticeTone; text: string }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm text-foreground ${NOTICE_CLASS[tone]}`}
    >
      <FontAwesomeIcon icon={NOTICE_ICON[tone]} className="mt-0.5" aria-hidden="true" />
      <span>{text}</span>
    </div>
  )
}
