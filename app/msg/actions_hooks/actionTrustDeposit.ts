'use client'

import type { EncodeObject } from '@cosmjs/proto-signing'
import type { DeliverTxResponse } from '@cosmjs/stargate'
import { useChain } from '@cosmos-kit/react'
import {
  MsgReclaimTrustDepositYield,
  MsgRepaySlashedTrustDeposit,
} from '@verana-labs/verana-types/codec/verana/td/v1/tx'
import { useRef } from 'react'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import {
  MSG_ERROR_ACTION_TD,
  MSG_INPROGRESS_ACTION_TD,
  MSG_SUCCESS_ACTION_TD,
} from '@/msg/constants/notificationMsgForMsgType'
import { runAfterIndexerCatchesUp, successfulTxNotification, waitForIndexerAfterTx } from '@/msg/util/indexerWait'
import { useSendTxDetectingMode } from '@/msg/util/sendTxDetectingMode'
import type { SimulateResult } from '@/msg/util/signAndBroadcastManualAmino'
import { extractTxHeight } from '@/msg/util/signerUtil'
import { useIndexerEvents } from '@/providers/indexer-events-provider'
import { useNotification } from '@/providers/notification-provider'
import { resolveTranslatable } from '@/ui/dataview/types'

type TrustDepositContext = {
  corporation: string
  operator: string
}

export type TrustDepositActionParams =
  | { msgType: 'MsgReclaimTrustDepositYield' }
  | { msgType: 'MsgRepaySlashedTrustDeposit'; deposit: string | number }

export function buildTrustDepositMessage(params: TrustDepositActionParams, context: TrustDepositContext): EncodeObject {
  if (params.msgType === 'MsgReclaimTrustDepositYield') {
    return {
      typeUrl: '/verana.td.v1.MsgReclaimTrustDepositYield',
      value: MsgReclaimTrustDepositYield.fromPartial(context),
    }
  }
  const deposit = Number(params.deposit)
  if (!Number.isFinite(deposit) || deposit <= 0) throw new Error('deposit must be a positive number')
  return {
    typeUrl: '/verana.td.v1.MsgRepaySlashedTrustDeposit',
    value: MsgRepaySlashedTrustDeposit.fromPartial({ ...context, deposit }),
  }
}

function isDeliverTxResponse(result: DeliverTxResponse | SimulateResult): result is DeliverTxResponse {
  return 'code' in result
}

export function useActionTrustDeposit(onCancel?: () => void, onRefresh?: (id?: string, txHeight?: number) => void) {
  const veranaChain = useVeranaChain()
  const { address, isWalletConnected } = useChain(veranaChain.chain_name)
  const { corporation, hasOperatorGrant, loading: corporationLoading } = useUserCorporation()
  const { waitForBlock } = useIndexerEvents()
  const { notify } = useNotification()
  const sendTx = useSendTxDetectingMode(veranaChain)
  const inFlight = useRef(false)

  return async (
    params: TrustDepositActionParams,
    simulate = false
  ): Promise<DeliverTxResponse | SimulateResult | undefined> => {
    if (!isWalletConnected || !address) {
      await notify(resolveTranslatable({ key: 'notification.msg.connectwallet' }, translate) ?? '', 'error')
      return
    }
    if (!corporation || !hasOperatorGrant) {
      if (!simulate && !corporationLoading) {
        await notify(resolveTranslatable({ key: 'error.msg.corporation.required' }, translate) ?? '', 'error')
      }
      return
    }
    if (inFlight.current) {
      await notify(resolveTranslatable({ key: 'error.msg.pending.transaction' }, translate) ?? '', 'error')
      return
    }

    inFlight.current = true
    if (!simulate) {
      void notify(
        MSG_INPROGRESS_ACTION_TD[params.msgType](),
        'inProgress',
        resolveTranslatable({ key: 'notification.msg.inprogress.title' }, translate)
      )
    }
    try {
      const message = buildTrustDepositMessage(params, {
        corporation: corporation.policyAddress,
        operator: address,
      })
      const result = await sendTx({ msgs: [message], memo: params.msgType, simulate })
      if (simulate) {
        if (isDeliverTxResponse(result)) throw new Error('Expected a simulation result')
        return result
      }
      if (!isDeliverTxResponse(result)) throw new Error('Expected a transaction response')
      if (result.code !== 0) {
        await notify(
          MSG_ERROR_ACTION_TD[params.msgType](result.code, result.rawLog),
          'error',
          resolveTranslatable({ key: 'notification.msg.failed.title' }, translate)
        )
        return result
      }

      const txHeight = extractTxHeight(result)
      if (txHeight === undefined) throw new Error('Successful transaction did not include a block height')
      const indexed = await waitForIndexerAfterTx(waitForBlock, txHeight)
      const notification = successfulTxNotification(MSG_SUCCESS_ACTION_TD[params.msgType](), txHeight, indexed)
      await notify(notification.message, notification.type, notification.title)
      if (indexed) {
        onRefresh?.(undefined, txHeight)
      } else {
        runAfterIndexerCatchesUp(waitForBlock, txHeight, () => onRefresh?.(undefined, txHeight))
      }
      onCancel?.()
      return result
    } catch (error) {
      await notify(
        MSG_ERROR_ACTION_TD[params.msgType](undefined, error instanceof Error ? error.message : String(error)),
        'error',
        resolveTranslatable({ key: 'notification.msg.failed.title' }, translate)
      )
    } finally {
      inFlight.current = false
    }
  }
}
