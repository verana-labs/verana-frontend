'use client'

import type { EncodeObject } from '@cosmjs/proto-signing'
import type { DeliverTxResponse } from '@cosmjs/stargate'
import { useChain } from '@cosmos-kit/react'
import { MsgReclaimTrustDepositYield } from '@verana-labs/verana-types/codec/verana/td/v1/tx'
import { useRef } from 'react'
import { useDelegableMsgs } from '@/hooks/useDelegableMsgs'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import { notifyChainRejection } from '@/lib/chain-error'
import type { CorporationSigningMode } from '@/msg/actions_hooks/actionCorporationManage'
import {
  MSG_ERROR_ACTION_TD,
  MSG_INPROGRESS_ACTION_TD,
  MSG_NOTIFICATION_PROPOSAL,
  MSG_SUCCESS_ACTION_TD,
} from '@/msg/constants/notificationMsgForMsgType'
import { delegableTypeUrl, proposalTitleFrom } from '@/msg/util/delegable-msgs'
import { runAfterIndexerCatchesUp, successfulTxNotification, waitForIndexerAfterTx } from '@/msg/util/indexerWait'
import { useSendTxDetectingMode } from '@/msg/util/sendTxDetectingMode'
import type { SimulateResult } from '@/msg/util/signAndBroadcastManualAmino'
import { extractTxHeight } from '@/msg/util/signerUtil'
import { useIndexerEvents } from '@/providers/indexer-events-provider'
import { useNotification } from '@/providers/notification-provider'
import { type I18nValues, resolveTranslatable } from '@/ui/dataview/types'
import { shortenMiddle } from '@/util/util'

type TrustDepositContext = {
  corporation: string
  operator: string
}

export type TrustDepositActionParams = { msgType: 'MsgReclaimTrustDepositYield' }

export function buildTrustDepositMessage(
  _params: TrustDepositActionParams,
  context: TrustDepositContext
): EncodeObject {
  return {
    typeUrl: '/verana.td.v1.MsgReclaimTrustDepositYield',
    value: MsgReclaimTrustDepositYield.fromPartial(context),
  }
}

function isDeliverTxResponse(result: DeliverTxResponse | SimulateResult): result is DeliverTxResponse {
  return 'code' in result
}

function t(key: string, values?: I18nValues): string {
  return resolveTranslatable({ key, values }, translate) ?? key
}

export function useActionTrustDeposit(onCancel?: () => void, onRefresh?: (id?: string, txHeight?: number) => void) {
  const veranaChain = useVeranaChain()
  const { address, isWalletConnected } = useChain(veranaChain.chain_name)
  const delegable = useDelegableMsgs()
  const { waitForBlock } = useIndexerEvents()
  const { notify } = useNotification()
  const sendTx = useSendTxDetectingMode(veranaChain)
  const inFlight = useRef(false)

  return async (
    params: TrustDepositActionParams,
    simulate = false
  ): Promise<DeliverTxResponse | SimulateResult | undefined> => {
    if (!isWalletConnected || !address) {
      await notify(t('notification.msg.connectwallet'), 'error')
      return
    }
    if (inFlight.current) {
      await notify(t('error.msg.pending.transaction'), 'error')
      return
    }

    inFlight.current = true
    let mode: CorporationSigningMode = 'operator'
    let corporation = ''
    const rejection = () => ({ corporation: shortenMiddle(corporation, 32), msg: params.msgType })
    const errorMessage = (code?: number, msg?: string) =>
      mode === 'proposal' ? MSG_NOTIFICATION_PROPOSAL.error(code, msg) : MSG_ERROR_ACTION_TD[params.msgType](code, msg)
    try {
      const typeUrl = delegableTypeUrl(params.msgType)
      if (!typeUrl) throw new Error(`Unsupported message type: ${params.msgType}`)
      const effect = t(`txconfirm.effect.${params.msgType}`)
      const resolved = await delegable({
        typeUrl,
        build: (corporation, operator) => buildTrustDepositMessage(params, { corporation, operator }),
        effect,
        proposalTitle: proposalTitleFrom(effect),
        simulate,
      })
      if (!resolved) return
      mode = resolved.mode
      corporation = resolved.corporation
      if (simulate) {
        const result = await sendTx({ msgs: resolved.msgs, memo: params.msgType, simulate })
        if (isDeliverTxResponse(result)) throw new Error('Expected a simulation result')
        return result
      }
      void notify(
        mode === 'proposal' ? MSG_NOTIFICATION_PROPOSAL.inprogress() : MSG_INPROGRESS_ACTION_TD[params.msgType](),
        'inProgress',
        t('notification.msg.inprogress.title')
      )
      const result = await sendTx({ msgs: resolved.msgs, memo: params.msgType })
      if (!isDeliverTxResponse(result)) throw new Error('Expected a transaction response')
      if (result.code !== 0) {
        await notifyChainRejection(
          notify,
          result.rawLog,
          errorMessage(result.code, result.rawLog),
          rejection(),
          t('notification.msg.failed.title')
        )
        return result
      }

      const txHeight = extractTxHeight(result)
      if (txHeight === undefined) throw new Error('Successful transaction did not include a block height')
      const indexed = await waitForIndexerAfterTx(waitForBlock, txHeight)
      const notification = successfulTxNotification(
        mode === 'proposal' ? MSG_NOTIFICATION_PROPOSAL.success() : MSG_SUCCESS_ACTION_TD[params.msgType](),
        txHeight,
        indexed
      )
      await notify(notification.message, notification.type, notification.title)
      if (indexed) {
        onRefresh?.(undefined, txHeight)
      } else {
        runAfterIndexerCatchesUp(waitForBlock, txHeight, () => onRefresh?.(undefined, txHeight))
      }
      onCancel?.()
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      await notifyChainRejection(
        notify,
        message,
        errorMessage(undefined, message),
        rejection(),
        t('notification.msg.failed.title')
      )
    } finally {
      inFlight.current = false
    }
  }
}
