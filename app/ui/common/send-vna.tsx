'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { translate } from '@/i18n/dataview'
import { useActionSend } from '@/msg/actions_hooks/actionSend'
import { parseVNAExact } from '@/util/util'
import { isValidVeranaAddress } from '@/util/validations'

export const SEND_VNA_ACTION = 'SendVNA'
export const SEND_RECIPIENT_PARAM = 'send'

interface SendVNAPanelProps {
  onClose: () => void
  onRefresh?: (id?: string, txHeight?: number) => void
}

export default function SendVNAPanel({ onClose, onRefresh }: SendVNAPanelProps) {
  const searchParams = useSearchParams()
  const { send } = useActionSend()
  const [recipient, setRecipient] = useState(searchParams.get(SEND_RECIPIENT_PARAM) ?? '')
  const [amountVNA, setAmountVNA] = useState('')
  const [busy, setBusy] = useState(false)

  const recipientValid = isValidVeranaAddress(recipient.trim())
  const uvna = parseVNAExact(amountVNA)
  const amountValid = uvna !== null && BigInt(uvna) > BigInt(0)

  async function submit() {
    if (!recipientValid || !amountValid || uvna === null) return
    setBusy(true)
    const sent = await send(recipient.trim(), uvna)
    setBusy(false)
    if (!sent) return
    onRefresh?.()
    onClose()
  }

  return (
    <div className="py-6 space-y-4">
      <div className="form-field max-w-2xl">
        <label htmlFor="sendvna-recipient" className="label">
          {translate('sendvna.recipient.label')}
        </label>
        <input
          id="sendvna-recipient"
          className="input font-mono"
          value={recipient}
          disabled={busy}
          placeholder="verana1…"
          onChange={(e) => setRecipient(e.target.value)}
        />
        {recipient !== '' && !recipientValid && (
          <p className="text-sm text-red-600 dark:text-red-400">{translate('sendvna.recipient.invalid')}</p>
        )}
      </div>

      <div className="form-field max-w-md">
        <label htmlFor="sendvna-amount" className="label">
          {translate('sendvna.amount.label')}
        </label>
        <input
          id="sendvna-amount"
          className="input"
          inputMode="decimal"
          value={amountVNA}
          disabled={busy}
          onChange={(e) => setAmountVNA(e.target.value)}
        />
        {amountVNA !== '' && !amountValid && (
          <p className="text-sm text-red-600 dark:text-red-400">{translate('sendvna.amount.invalid')}</p>
        )}
      </div>

      <div className="actions-center">
        <button className="btn-action-cancel" onClick={onClose} disabled={busy}>
          {translate('messages.cancel')}
        </button>
        <button
          className="btn-action-confirm"
          onClick={() => void submit()}
          disabled={busy || !recipientValid || !amountValid}
        >
          {translate('sendvna.submit')}
        </button>
      </div>
    </div>
  )
}
