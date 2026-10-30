'use client'

import type { EncodeObject } from '@cosmjs/proto-signing'
import { useChain } from '@cosmos-kit/react'
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx'
import { useRef } from 'react'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import { processingTxNotification, successfulTxNotification, waitForIndexerAfterTx } from '@/msg/util/indexerWait'
import { useSendTxDetectingMode } from '@/msg/util/sendTxDetectingMode'
import { extractTxHeight } from '@/msg/util/signerUtil'
import { rejectionNotice, txFailureNotice } from '@/msg/util/tx-outcome'
import { useIndexerEvents } from '@/providers/indexer-events-provider'
import { useNotification } from '@/providers/notification-provider'
import { useTxConfirm } from '@/providers/tx-confirm-provider'
import { formatVNAFromUVNA } from '@/util/util'

export function buildSendMsg(fromAddress: string, toAddress: string, uvna: string): EncodeObject {
  return {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: MsgSend.fromPartial({ fromAddress, toAddress, amount: [{ denom: 'uvna', amount: uvna }] }),
  }
}

export function useActionSend() {
  const veranaChain = useVeranaChain()
  const { address, isWalletConnected } = useChain(veranaChain.chain_name)
  const { waitForBlock } = useIndexerEvents()
  const { notify } = useNotification()
  const { confirmTx } = useTxConfirm()
  const sendTx = useSendTxDetectingMode(veranaChain)
  const inFlight = useRef(false)

  async function send(recipient: string, uvna: string): Promise<boolean> {
    if (!isWalletConnected || !address) {
      await notify(translate('notification.msg.connectwallet'), 'error')
      return false
    }
    if (inFlight.current) {
      await notify(translate('error.msg.pending.transaction'), 'error')
      return false
    }
    inFlight.current = true
    try {
      const amount = formatVNAFromUVNA(uvna)
      const confirmed = await confirmTx({
        titleKey: 'txconfirm.title.default',
        effect: translate('txconfirm.effect.MsgSend', { amount, recipient }),
        msgs: [buildSendMsg(address, recipient, uvna)],
        mode: 'account',
        payer: address,
        costLines: [{ label: translate('sendvna.cost'), value: amount, debitUvna: Number(uvna) }],
      })
      if (!confirmed) return false

      void notify(translate('notification.MsgSend.inprogress'), 'inProgress')
      const result = await sendTx({ msgs: confirmed.msgs, fee: confirmed.fee, memo: 'MsgSend' })
      if (!('code' in result)) throw new Error('Expected a transaction response')
      const failure = txFailureNotice(
        result,
        (code, rawLog) => `${translate('notification.MsgSend.error')} (${code}): ${rawLog}`
      )
      if (failure) {
        await notify(failure.message, 'error', failure.title, failure.link)
        return false
      }

      const height = extractTxHeight(result)
      if (height === undefined) throw new Error('Successful transaction did not include a block height')
      const processing = processingTxNotification(result.transactionHash, height)
      void notify(processing.message, processing.type, processing.title, processing.link)
      const indexed = await waitForIndexerAfterTx(waitForBlock, height)
      const notification = successfulTxNotification(
        translate('notification.MsgSend.success'),
        height,
        indexed,
        result.transactionHash
      )
      await notify(notification.message, notification.type, notification.title, notification.link)
      return true
    } catch (error) {
      const text = error instanceof Error ? error.message : String(error)
      const notice = rejectionNotice(text, text)
      await notify(notice.message, 'error', notice.title, notice.link)
      return false
    } finally {
      inFlight.current = false
    }
  }

  return { send }
}
