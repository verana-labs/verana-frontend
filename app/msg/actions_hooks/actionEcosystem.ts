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
import type { GfOwner } from '@/lib/gf-document'
import type { CorporationSigningMode } from '@/msg/actions_hooks/actionCorporationManage'
import {
  MSG_ERROR_ACTION_CGF,
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
import { proposalExecution, proposalSubmittedMessage, rejectionNotice, txFailureNotice } from '@/msg/util/tx-outcome'
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
      owner: GfOwner
      targetVersion: number
      docLanguage: string
      docUrl: string
      docDigestSri: string
    }
  | {
      msgType: 'MsgIncreaseActiveGovernanceFrameworkVersion'
      owner: GfOwner
    }

export type EcosystemActionParams =
  | Omit<Extract<EcosystemMessageParams, { msgType: 'MsgCreateEcosystem' }>, 'docDigestSri'>
  | Extract<EcosystemMessageParams, { msgType: 'MsgUpdateEcosystem' }>
  | Extract<EcosystemMessageParams, { msgType: 'MsgArchiveEcosystem' | 'MsgUnarchiveEcosystem' }>
  | Omit<Extract<EcosystemMessageParams, { msgType: 'MsgAddGovernanceFrameworkDocument' }>, 'docDigestSri'>
  | Extract<EcosystemMessageParams, { msgType: 'MsgIncreaseActiveGovernanceFrameworkVersion' }>

function gfEcosystemId(owner: GfOwner): number {
  return owner.kind === 'ecosystem' ? Number(owner.id) : 0
}

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
          ecosystemId: gfEcosystemId(params.owner),
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
          ecosystemId: gfEcosystemId(params.owner),
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
  if (params.msgType === 'MsgCreateEcosystem' || params.msgType === 'MsgAddGovernanceFrameworkDocument') {
    return { ...params, docDigestSri: await documentDigest(params.docUrl) }
  }
  return params
}

function subjectId(params: EcosystemActionParams): string | undefined {
  if ('id' in params) return String(params.id)
  if ('owner' in params) return String(params.owner.id)
  return undefined
}

function effectKey(params: EcosystemActionParams): string {
  const corporation = 'owner' in params && params.owner.kind === 'corporation'
  return `txconfirm.effect.${params.msgType}${corporation ? '.corporation' : ''}`
}

function effectValues(params: EcosystemMessageParams): I18nValues {
  return {
    id: subjectId(params) ?? null,
    did: 'did' in params ? params.did : null,
    version: 'targetVersion' in params ? params.targetVersion : null,
  }
}

function failureMessage(params: EcosystemActionParams, id: string | undefined, code?: number, msg?: string): string {
  if ('owner' in params && params.owner.kind === 'corporation') {
    return MSG_ERROR_ACTION_CGF[params.msgType](id, code, msg)
  }
  return MSG_ERROR_ACTION_ECOSYSTEM[params.msgType](id, code, msg)
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

  return async (params: EcosystemActionParams): Promise<DeliverTxResponse | undefined> => {
    if (!isWalletConnected || !address) {
      await notify(t('notification.msg.connectwallet'), 'error')
      return
    }
    if (inFlight.current) {
      await notify(t('error.msg.pending.transaction'), 'error')
      return
    }

    inFlight.current = true
    let id = subjectId(params)
    let mode: CorporationSigningMode = 'operator'
    const errorMessage = (code?: number, msg?: string) =>
      mode === 'proposal' ? MSG_NOTIFICATION_PROPOSAL.error(code, msg) : failureMessage(params, id, code, msg)
    try {
      const typeUrl = delegableTypeUrl(params.msgType)
      if (!typeUrl) throw new Error(`Unsupported message type: ${params.msgType}`)
      const messageParams = await toMessageParams(params)
      const effect = t(effectKey(params), effectValues(messageParams))
      const resolved = await delegable({
        typeUrl,
        build: (corporation, operator) => buildEcosystemMessage(messageParams, { corporation, operator }),
        effect,
        proposalTitle: proposalTitleFrom(effect),
      })
      if (!resolved) return
      mode = resolved.mode
      void notify(
        mode === 'proposal'
          ? MSG_NOTIFICATION_PROPOSAL.inprogress()
          : MSG_INPROGRESS_ACTION_ECOSYSTEM[params.msgType](),
        'inProgress',
        t('notification.msg.inprogress.title')
      )
      const result = await sendTx({ msgs: resolved.msgs, memo: params.msgType, fee: resolved.fee })
      if (!isDeliverTxResponse(result)) throw new Error('Expected a transaction response')
      const failure = txFailureNotice(result, errorMessage)
      if (failure) {
        await notify(failure.message, 'error', failure.title)
        return result
      }

      const created =
        params.msgType === 'MsgCreateEcosystem' &&
        (mode === 'operator' || proposalExecution(result.events).status === 'executed')
      if (created) {
        id = findEventAttribute(result.events, 'create_ecosystem', 'ecosystem_id')
        if (!id) throw new Error('Create ecosystem transaction did not emit an ecosystem ID')
      }
      const txHeight = extractTxHeight(result)
      if (txHeight === undefined) throw new Error('Successful transaction did not include a block height')
      const indexed = await waitForIndexerAfterTx(waitForBlock, txHeight)
      const notification = successfulTxNotification(
        mode === 'proposal' ? proposalSubmittedMessage(result.events) : MSG_SUCCESS_ACTION_ECOSYSTEM[params.msgType](),
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
      const text = error instanceof Error ? error.message : String(error)
      const notice = rejectionNotice(errorMessage(undefined, text), text)
      await notify(notice.message, 'error', notice.title)
    } finally {
      inFlight.current = false
    }
  }
}
