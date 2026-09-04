'use client'

import type { EncodeObject } from '@cosmjs/proto-signing'
import type { DeliverTxResponse } from '@cosmjs/stargate'
import { useChain } from '@cosmos-kit/react'
import {
  MsgArchiveEcosystem,
  MsgCreateEcosystem,
  MsgUpdateEcosystem,
} from '@verana-labs/verana-types/codec/verana/ec/v1/tx'
import {
  MsgAddGovernanceFrameworkDocument,
  MsgIncreaseActiveGovernanceFrameworkVersion,
} from '@verana-labs/verana-types/codec/verana/gf/v1/tx'
import { useRouter } from 'next/navigation'
import { useRef } from 'react'
import { useDelegableMsgs } from '@/hooks/useDelegableMsgs'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import type { CorporationSigningMode } from '@/msg/actions_hooks/actionCorporationManage'
import {
  MSG_ERROR_ACTION_ECOSYSTEM,
  MSG_INPROGRESS_ACTION_ECOSYSTEM,
  MSG_NOTIFICATION_PROPOSAL,
  MSG_SUCCESS_ACTION_ECOSYSTEM,
} from '@/msg/constants/notificationMsgForMsgType'
import { delegableTypeUrl, proposalTitleFrom } from '@/msg/util/delegable-msgs'
import { runAfterIndexerCatchesUp, successfulTxNotification, waitForIndexerAfterTx } from '@/msg/util/indexerWait'
import { useSendTxDetectingMode } from '@/msg/util/sendTxDetectingMode'
import type { SimulateResult } from '@/msg/util/signAndBroadcastManualAmino'
import { extractTxHeight } from '@/msg/util/signerUtil'
import { findEventAttribute } from '@/msg/util/txEvents'
import { useIndexerEvents } from '@/providers/indexer-events-provider'
import { useNotification } from '@/providers/notification-provider'
import { type I18nValues, resolveTranslatable } from '@/ui/dataview/types'
import { isValidHttpUrl } from '@/util/validations'

type EcosystemContext = {
  corporation: string
  operator: string
}

export type EcosystemMessageParams =
  | {
      msgType: 'MsgCreateEcosystem'
      did: string
      language: string
      docUrl: string
      docDigestSri: string
    }
  | {
      msgType: 'MsgUpdateEcosystem'
      id: string | number
      did: string
    }
  | {
      msgType: 'MsgArchiveEcosystem' | 'MsgUnarchiveEcosystem'
      id: string | number
    }
  | {
      msgType: 'MsgAddGovernanceFrameworkDocument'
      ecosystemId: string | number
      targetVersion: number
      docLanguage: string
      docUrl: string
      docDigestSri: string
    }
  | {
      msgType: 'MsgIncreaseActiveGovernanceFrameworkVersion'
      ecosystemId: string | number
    }

export type EcosystemActionParams =
  | Omit<Extract<EcosystemMessageParams, { msgType: 'MsgCreateEcosystem' }>, 'docDigestSri'>
  | Extract<EcosystemMessageParams, { msgType: 'MsgUpdateEcosystem' }>
  | Extract<EcosystemMessageParams, { msgType: 'MsgArchiveEcosystem' | 'MsgUnarchiveEcosystem' }>
  | {
      msgType: 'MsgAddGovernanceFrameworkDocument'
      ecosystemId: string | number
      currentVersion: number
      docLanguage: string
      docUrl: string
    }
  | Extract<EcosystemMessageParams, { msgType: 'MsgIncreaseActiveGovernanceFrameworkVersion' }>

export function buildEcosystemMessage(params: EcosystemMessageParams, context: EcosystemContext): EncodeObject {
  const common = { corporation: context.corporation, operator: context.operator }
  switch (params.msgType) {
    case 'MsgCreateEcosystem':
      return {
        typeUrl: '/verana.ec.v1.MsgCreateEcosystem',
        value: MsgCreateEcosystem.fromPartial({
          ...common,
          did: params.did,
          language: params.language,
          docUrl: params.docUrl,
          docDigestSri: params.docDigestSri,
        }),
      }
    case 'MsgUpdateEcosystem':
      return {
        typeUrl: '/verana.ec.v1.MsgUpdateEcosystem',
        value: MsgUpdateEcosystem.fromPartial({
          ...common,
          id: Number(params.id),
          did: params.did,
        }),
      }
    case 'MsgArchiveEcosystem':
    case 'MsgUnarchiveEcosystem':
      return {
        typeUrl: '/verana.ec.v1.MsgArchiveEcosystem',
        value: MsgArchiveEcosystem.fromPartial({
          ...common,
          id: Number(params.id),
          archive: params.msgType === 'MsgArchiveEcosystem',
        }),
      }
    case 'MsgAddGovernanceFrameworkDocument':
      return {
        typeUrl: '/verana.gf.v1.MsgAddGovernanceFrameworkDocument',
        value: MsgAddGovernanceFrameworkDocument.fromPartial({
          ...common,
          ecosystemId: Number(params.ecosystemId),
          version: params.targetVersion,
          docLanguage: params.docLanguage,
          docUrl: params.docUrl,
          docDigestSri: params.docDigestSri,
        }),
      }
    case 'MsgIncreaseActiveGovernanceFrameworkVersion':
      return {
        typeUrl: '/verana.gf.v1.MsgIncreaseActiveGovernanceFrameworkVersion',
        value: MsgIncreaseActiveGovernanceFrameworkVersion.fromPartial({
          ...common,
          ecosystemId: Number(params.ecosystemId),
        }),
      }
  }
}

async function documentDigest(docUrl: string): Promise<string> {
  if (!isValidHttpUrl(docUrl)) throw new Error('Invalid document URL')
  const response = await fetch(`/api/sri?url=${encodeURIComponent(docUrl)}`)
  if (!response.ok) throw new Error('Unable to calculate the document digest')
  const payload: unknown = await response.json()
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    throw new Error('Invalid document digest response')
  }
  const sri = (payload as Record<string, unknown>).sri
  if (typeof sri !== 'string' || sri.length === 0) throw new Error('Invalid document digest response')
  return sri
}

async function toMessageParams(params: EcosystemActionParams): Promise<EcosystemMessageParams> {
  if (params.msgType === 'MsgCreateEcosystem') {
    return { ...params, docDigestSri: await documentDigest(params.docUrl) }
  }
  if (params.msgType === 'MsgAddGovernanceFrameworkDocument') {
    return {
      msgType: params.msgType,
      ecosystemId: params.ecosystemId,
      targetVersion: params.currentVersion + 1,
      docLanguage: params.docLanguage,
      docUrl: params.docUrl,
      docDigestSri: await documentDigest(params.docUrl),
    }
  }
  return params
}

function effectValues(params: EcosystemMessageParams): I18nValues {
  return {
    id: 'id' in params ? String(params.id) : 'ecosystemId' in params ? String(params.ecosystemId) : null,
    did: 'did' in params ? params.did : null,
    version: 'targetVersion' in params ? params.targetVersion : null,
  }
}

function isDeliverTxResponse(result: DeliverTxResponse | SimulateResult): result is DeliverTxResponse {
  return 'code' in result
}

function t(key: string, values?: I18nValues): string {
  return resolveTranslatable({ key, values }, translate) ?? key
}

export function useActionEcosystem(onCancel?: () => void, onRefresh?: (id?: string, txHeight?: number) => void) {
  const veranaChain = useVeranaChain()
  const { address, isWalletConnected } = useChain(veranaChain.chain_name)
  const delegable = useDelegableMsgs()
  const { waitForBlock } = useIndexerEvents()
  const router = useRouter()
  const { notify } = useNotification()
  const sendTx = useSendTxDetectingMode(veranaChain)
  const inFlight = useRef(false)

  return async (
    params: EcosystemActionParams,
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
    let id = 'id' in params ? String(params.id) : 'ecosystemId' in params ? String(params.ecosystemId) : undefined
    let mode: CorporationSigningMode = 'operator'
    const errorMessage = (code?: number, msg?: string) =>
      mode === 'proposal'
        ? MSG_NOTIFICATION_PROPOSAL.error(code, msg)
        : MSG_ERROR_ACTION_ECOSYSTEM[params.msgType](id, code, msg)
    try {
      const typeUrl = delegableTypeUrl(params.msgType)
      if (!typeUrl) throw new Error(`Unsupported message type: ${params.msgType}`)
      const messageParams = await toMessageParams(params)
      const effect = t(`txconfirm.effect.${params.msgType}`, effectValues(messageParams))
      const resolved = await delegable({
        typeUrl,
        build: (corporation, operator) => buildEcosystemMessage(messageParams, { corporation, operator }),
        effect,
        proposalTitle: proposalTitleFrom(effect),
        simulate,
      })
      if (!resolved) return
      mode = resolved.mode
      if (simulate) {
        const result = await sendTx({ msgs: resolved.msgs, memo: params.msgType, simulate })
        if (isDeliverTxResponse(result)) throw new Error('Expected a simulation result')
        return result
      }
      void notify(
        mode === 'proposal'
          ? MSG_NOTIFICATION_PROPOSAL.inprogress()
          : MSG_INPROGRESS_ACTION_ECOSYSTEM[params.msgType](),
        'inProgress',
        t('notification.msg.inprogress.title')
      )
      const result = await sendTx({ msgs: resolved.msgs, memo: params.msgType })
      if (!isDeliverTxResponse(result)) throw new Error('Expected a transaction response')
      if (result.code !== 0) {
        await notify(errorMessage(result.code, result.rawLog), 'error', t('notification.msg.failed.title'))
        return result
      }

      const created = params.msgType === 'MsgCreateEcosystem' && mode === 'operator'
      if (created) {
        id = findEventAttribute(result.events, 'create_ecosystem', 'ecosystem_id')
        if (!id) throw new Error('Create ecosystem transaction did not emit an ecosystem ID')
      }
      const txHeight = extractTxHeight(result)
      if (txHeight === undefined) throw new Error('Successful transaction did not include a block height')
      const indexed = await waitForIndexerAfterTx(waitForBlock, txHeight)
      const notification = successfulTxNotification(
        mode === 'proposal' ? MSG_NOTIFICATION_PROPOSAL.success() : MSG_SUCCESS_ACTION_ECOSYSTEM[params.msgType](),
        txHeight,
        indexed
      )
      await notify(notification.message, notification.type, notification.title)
      if (created) {
        if (indexed) {
          router.push(`/ecosystems/${id}`)
        } else {
          onCancel?.()
          runAfterIndexerCatchesUp(waitForBlock, txHeight, () => router.push(`/ecosystems/${id}`))
        }
      } else {
        if (indexed) {
          onRefresh?.(id, txHeight)
        } else {
          runAfterIndexerCatchesUp(waitForBlock, txHeight, () => onRefresh?.(id, txHeight))
        }
        onCancel?.()
      }
      return result
    } catch (error) {
      await notify(
        errorMessage(undefined, error instanceof Error ? error.message : String(error)),
        'error',
        t('notification.msg.failed.title')
      )
    } finally {
      inFlight.current = false
    }
  }
}
