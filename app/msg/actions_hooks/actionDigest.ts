'use client'

import type { EncodeObject } from '@cosmjs/proto-signing'
import type { DeliverTxResponse } from '@cosmjs/stargate'
import { useChain } from '@cosmos-kit/react'
import { MsgStoreDigest } from '@verana-labs/verana-types/codec/verana/di/v1/tx'
import { useRef } from 'react'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import { runAfterIndexerCatchesUp, successfulTxNotification, waitForIndexerAfterTx } from '@/msg/util/indexerWait'
import { useSendTxDetectingMode } from '@/msg/util/sendTxDetectingMode'
import type { SimulateResult } from '@/msg/util/signAndBroadcastManualAmino'
import { extractTxHeight } from '@/msg/util/signerUtil'
import { useIndexerEvents } from '@/providers/indexer-events-provider'
import { useNotification } from '@/providers/notification-provider'
import { resolveTranslatable } from '@/ui/dataview/types'

type DigestContext = {
  corporation: string
  operator: string
}

export function buildStoreDigestMessage(digest: string, context: DigestContext): EncodeObject {
  if (!/^sha(256|384|512)-/.test(digest)) throw new Error('digest must use an SRI SHA prefix')
  return {
    typeUrl: '/verana.di.v1.MsgStoreDigest',
    value: MsgStoreDigest.fromPartial({
      authority: context.corporation,
      operator: context.operator,
      digest,
    }),
  }
}

function isDeliverTxResponse(result: DeliverTxResponse | SimulateResult): result is DeliverTxResponse {
  return 'code' in result
}

export function useActionDigest(onRefresh?: (digest: string, txHeight: number) => void) {
  const veranaChain = useVeranaChain()
  const { address, isWalletConnected } = useChain(veranaChain.chain_name)
  const { corporation, hasOperatorGrant, loading: corporationLoading } = useUserCorporation()
  const { waitForBlock } = useIndexerEvents()
  const { notify } = useNotification()
  const sendTx = useSendTxDetectingMode(veranaChain)
  const inFlight = useRef(false)

  return async (digest: string, simulate = false): Promise<DeliverTxResponse | SimulateResult | undefined> => {
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
        resolveTranslatable({ key: 'notification.MsgStoreDigest.inprogress' }, translate) ?? '',
        'inProgress',
        resolveTranslatable({ key: 'notification.msg.inprogress.title' }, translate)
      )
    }
    try {
      const result = await sendTx({
        msgs: [
          buildStoreDigestMessage(digest, {
            corporation: corporation.policyAddress,
            operator: address,
          }),
        ],
        memo: 'MsgStoreDigest',
        simulate,
      })
      if (simulate) {
        if (isDeliverTxResponse(result)) throw new Error('Expected a simulation result')
        return result
      }
      if (!isDeliverTxResponse(result)) throw new Error('Expected a transaction response')
      if (result.code !== 0) {
        await notify(
          resolveTranslatable(
            {
              key: 'notification.MsgStoreDigest.error',
              values: { code: `(${result.code}) `, msg: result.rawLog ?? '' },
            },
            translate
          ) ??
            result.rawLog ??
            '',
          'error',
          resolveTranslatable({ key: 'notification.msg.failed.title' }, translate)
        )
        return result
      }
      const txHeight = extractTxHeight(result)
      if (txHeight === undefined) throw new Error('Successful transaction did not include a block height')
      const indexed = await waitForIndexerAfterTx(waitForBlock, txHeight)
      const notification = successfulTxNotification(
        resolveTranslatable({ key: 'notification.MsgStoreDigest.success' }, translate) ?? '',
        txHeight,
        indexed
      )
      await notify(notification.message, notification.type, notification.title)
      if (indexed) {
        onRefresh?.(digest, txHeight)
      } else {
        runAfterIndexerCatchesUp(waitForBlock, txHeight, () => onRefresh?.(digest, txHeight))
      }
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      await notify(
        resolveTranslatable(
          { key: 'notification.MsgStoreDigest.error', values: { code: '', msg: message } },
          translate
        ) ?? message,
        'error',
        resolveTranslatable({ key: 'notification.msg.failed.title' }, translate)
      )
    } finally {
      inFlight.current = false
    }
  }
}
