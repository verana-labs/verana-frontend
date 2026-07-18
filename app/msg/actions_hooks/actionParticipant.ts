'use client'

import type { EncodeObject } from '@cosmjs/proto-signing'
import type { DeliverTxResponse } from '@cosmjs/stargate'
import { useChain } from '@cosmos-kit/react'
import {
  MsgCancelParticipantOPLastRequest,
  MsgCreateOrUpdateParticipantSession,
  MsgCreateRootParticipant,
  MsgRenewParticipantOP,
  MsgRepayParticipantSlashedTrustDeposit,
  MsgRevokeParticipant,
  MsgSelfCreateParticipant,
  MsgSetParticipantEffectiveUntil,
  MsgSetParticipantOPToValidated,
  MsgSlashParticipantTrustDeposit,
  MsgStartParticipantOP,
} from '@verana-labs/verana-types/codec/verana/pp/v1/tx'
import { type OptionalUInt64, ParticipantRole } from '@verana-labs/verana-types/codec/verana/pp/v1/types'
import { useRef } from 'react'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import {
  MSG_ERROR_ACTION_PARTICIPANT,
  MSG_INPROGRESS_ACTION_PARTICIPANT,
  MSG_SUCCESS_ACTION_PARTICIPANT,
} from '@/msg/constants/notificationMsgForMsgType'
import { runAfterIndexerCatchesUp, successfulTxNotification, waitForIndexerAfterTx } from '@/msg/util/indexerWait'
import { useSendTxDetectingMode } from '@/msg/util/sendTxDetectingMode'
import type { SimulateResult } from '@/msg/util/signAndBroadcastManualAmino'
import { extractTxHeight } from '@/msg/util/signerUtil'
import { findEventAttribute } from '@/msg/util/txEvents'
import { usePendingTasksCtx } from '@/providers/api-rest-query-provider-context'
import { useIndexerEvents } from '@/providers/indexer-events-provider'
import { useNotification } from '@/providers/notification-provider'
import { resolveTranslatable } from '@/ui/dataview/types'

type ParticipantContext = {
  corporation: string
  operator: string
}

type ParticipantRoleName = 'ECOSYSTEM' | 'ISSUER_GRANTOR' | 'VERIFIER_GRANTOR' | 'ISSUER' | 'VERIFIER' | 'HOLDER'

type FeeFields = {
  validationFees?: string | number
  issuanceFees?: string | number
  verificationFees?: string | number
}

export type ParticipantActionParams =
  | ({
      msgType: 'MsgStartParticipantOP'
      role: ParticipantRoleName
      validatorParticipantId: string | number
      did: string
    } & FeeFields)
  | ({
      msgType: 'MsgSelfCreateParticipant'
      role: ParticipantRoleName
      validatorParticipantId: string | number
      did: string
      effectiveFrom?: string | Date
      effectiveUntil?: string | Date
    } & FeeFields)
  | ({
      msgType: 'MsgCreateRootParticipant'
      schemaId: string | number
      did: string
      effectiveFrom?: string | Date
      effectiveUntil?: string | Date
    } & FeeFields)
  | {
      msgType: 'MsgRenewParticipantOP' | 'MsgCancelParticipantOPLastRequest' | 'MsgRevokeParticipant'
      id: string | number
    }
  | ({
      msgType: 'MsgSetParticipantOPToValidated'
      id: string | number
      effectiveUntil?: string | Date
      opSummaryDigest?: string
      issuanceFeeDiscount?: string | number
      verificationFeeDiscount?: string | number
    } & FeeFields)
  | {
      msgType: 'MsgSetParticipantEffectiveUntil'
      id: string | number
      effectiveUntil?: string | Date
    }
  | {
      msgType: 'MsgCreateOrUpdateParticipantSession'
      id: string
      issuerParticipantId?: string | number
      verifierParticipantId?: string | number
      agentParticipantId?: string | number
      walletAgentParticipantId?: string | number
      digest: string
    }
  | {
      msgType: 'MsgSlashParticipantTrustDeposit'
      id: string | number
      amount: string | number
      reason: string
    }
  | {
      msgType: 'MsgRepayParticipantSlashedTrustDeposit'
      id: string | number
    }

function participantRole(role: ParticipantRoleName): ParticipantRole {
  const roles: Record<ParticipantRoleName, ParticipantRole> = {
    ECOSYSTEM: ParticipantRole.ECOSYSTEM,
    ISSUER_GRANTOR: ParticipantRole.ISSUER_GRANTOR,
    VERIFIER_GRANTOR: ParticipantRole.VERIFIER_GRANTOR,
    ISSUER: ParticipantRole.ISSUER,
    VERIFIER: ParticipantRole.VERIFIER,
    HOLDER: ParticipantRole.HOLDER,
  }
  return roles[role]
}

function number(value: string | number | undefined, field: string): number {
  if (value === undefined || value === '') return 0
  const result = Number(value)
  if (!Number.isFinite(result) || result < 0) throw new Error(`${field} must be a non-negative number`)
  return result
}

function optionalUInt64(value: string | number | undefined, field: string): OptionalUInt64 | undefined {
  if (value === undefined || value === '') return undefined
  return { value: number(value, field) }
}

function date(value: string | Date | undefined, field: string): Date | undefined {
  if (value === undefined || value === '') return undefined
  const result = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(result.getTime())) throw new Error(`${field} must be a valid date`)
  return result
}

function defaultEffectiveFrom(): Date {
  return new Date(Math.floor(Date.now() / 1000) * 1000 + 120_000)
}

function emptyVsOperatorAuthorization() {
  return {
    vsOperator: '',
    vsOperatorAuthzMsgTypes: [],
    vsOperatorAuthzSpendLimit: [],
    vsOperatorAuthzWithFeegrant: false,
    vsOperatorAuthzFeeSpendLimit: [],
    vsOperatorAuthzPeriod: undefined,
  }
}

export function buildParticipantMessage(params: ParticipantActionParams, context: ParticipantContext): EncodeObject {
  const common = { corporation: context.corporation, operator: context.operator }
  switch (params.msgType) {
    case 'MsgStartParticipantOP':
      return {
        typeUrl: '/verana.pp.v1.MsgStartParticipantOP',
        value: MsgStartParticipantOP.fromPartial({
          ...common,
          role: participantRole(params.role),
          validatorParticipantId: number(params.validatorParticipantId, 'validatorParticipantId'),
          did: params.did,
          validationFees: optionalUInt64(params.validationFees, 'validationFees'),
          issuanceFees: optionalUInt64(params.issuanceFees, 'issuanceFees'),
          verificationFees: optionalUInt64(params.verificationFees, 'verificationFees'),
          ...emptyVsOperatorAuthorization(),
        }),
      }
    case 'MsgSelfCreateParticipant':
      return {
        typeUrl: '/verana.pp.v1.MsgSelfCreateParticipant',
        value: MsgSelfCreateParticipant.fromPartial({
          ...common,
          role: participantRole(params.role),
          validatorParticipantId: number(params.validatorParticipantId, 'validatorParticipantId'),
          did: params.did,
          effectiveFrom: date(params.effectiveFrom, 'effectiveFrom') ?? defaultEffectiveFrom(),
          effectiveUntil: date(params.effectiveUntil, 'effectiveUntil'),
          validationFees: number(params.validationFees, 'validationFees'),
          verificationFees: number(params.verificationFees, 'verificationFees'),
          ...emptyVsOperatorAuthorization(),
        }),
      }
    case 'MsgCreateRootParticipant':
      return {
        typeUrl: '/verana.pp.v1.MsgCreateRootParticipant',
        value: MsgCreateRootParticipant.fromPartial({
          ...common,
          schemaId: number(params.schemaId, 'schemaId'),
          did: params.did,
          effectiveFrom: date(params.effectiveFrom, 'effectiveFrom') ?? defaultEffectiveFrom(),
          effectiveUntil: date(params.effectiveUntil, 'effectiveUntil'),
          validationFees: number(params.validationFees, 'validationFees'),
          issuanceFees: number(params.issuanceFees, 'issuanceFees'),
          verificationFees: number(params.verificationFees, 'verificationFees'),
          ...emptyVsOperatorAuthorization(),
        }),
      }
    case 'MsgRenewParticipantOP':
      return {
        typeUrl: '/verana.pp.v1.MsgRenewParticipantOP',
        value: MsgRenewParticipantOP.fromPartial({ ...common, id: number(params.id, 'id') }),
      }
    case 'MsgSetParticipantOPToValidated':
      return {
        typeUrl: '/verana.pp.v1.MsgSetParticipantOPToValidated',
        value: MsgSetParticipantOPToValidated.fromPartial({
          ...common,
          id: number(params.id, 'id'),
          effectiveUntil: date(params.effectiveUntil, 'effectiveUntil'),
          validationFees: number(params.validationFees, 'validationFees'),
          issuanceFees: number(params.issuanceFees, 'issuanceFees'),
          verificationFees: number(params.verificationFees, 'verificationFees'),
          opSummaryDigest: params.opSummaryDigest ?? '',
          issuanceFeeDiscount: number(params.issuanceFeeDiscount, 'issuanceFeeDiscount'),
          verificationFeeDiscount: number(params.verificationFeeDiscount, 'verificationFeeDiscount'),
        }),
      }
    case 'MsgCancelParticipantOPLastRequest':
      return {
        typeUrl: '/verana.pp.v1.MsgCancelParticipantOPLastRequest',
        value: MsgCancelParticipantOPLastRequest.fromPartial({ ...common, id: number(params.id, 'id') }),
      }
    case 'MsgSetParticipantEffectiveUntil':
      return {
        typeUrl: '/verana.pp.v1.MsgSetParticipantEffectiveUntil',
        value: MsgSetParticipantEffectiveUntil.fromPartial({
          ...common,
          id: number(params.id, 'id'),
          effectiveUntil: date(params.effectiveUntil, 'effectiveUntil'),
        }),
      }
    case 'MsgRevokeParticipant':
      return {
        typeUrl: '/verana.pp.v1.MsgRevokeParticipant',
        value: MsgRevokeParticipant.fromPartial({ ...common, id: number(params.id, 'id') }),
      }
    case 'MsgCreateOrUpdateParticipantSession':
      return {
        typeUrl: '/verana.pp.v1.MsgCreateOrUpdateParticipantSession',
        value: MsgCreateOrUpdateParticipantSession.fromPartial({
          ...common,
          id: params.id,
          issuerParticipantId: number(params.issuerParticipantId, 'issuerParticipantId'),
          verifierParticipantId: number(params.verifierParticipantId, 'verifierParticipantId'),
          agentParticipantId: number(params.agentParticipantId, 'agentParticipantId'),
          walletAgentParticipantId: number(params.walletAgentParticipantId, 'walletAgentParticipantId'),
          digest: params.digest,
        }),
      }
    case 'MsgSlashParticipantTrustDeposit':
      return {
        typeUrl: '/verana.pp.v1.MsgSlashParticipantTrustDeposit',
        value: MsgSlashParticipantTrustDeposit.fromPartial({
          ...common,
          id: number(params.id, 'id'),
          amount: number(params.amount, 'amount'),
          reason: params.reason,
        }),
      }
    case 'MsgRepayParticipantSlashedTrustDeposit':
      return {
        typeUrl: '/verana.pp.v1.MsgRepayParticipantSlashedTrustDeposit',
        value: MsgRepayParticipantSlashedTrustDeposit.fromPartial({ ...common, id: number(params.id, 'id') }),
      }
  }
}

export function createdParticipantId(params: ParticipantActionParams, result: DeliverTxResponse): string | undefined {
  switch (params.msgType) {
    case 'MsgStartParticipantOP':
      return findEventAttribute(result.events, 'start_participant_op', 'participant_id')
    case 'MsgSelfCreateParticipant':
      return findEventAttribute(result.events, 'create_participant', 'participant_id')
    case 'MsgCreateRootParticipant':
      return findEventAttribute(result.events, 'create_root_participant', 'root_participant_id')
    default:
      return 'id' in params ? String(params.id) : undefined
  }
}

function isDeliverTxResponse(result: DeliverTxResponse | SimulateResult): result is DeliverTxResponse {
  return 'code' in result
}

export function useActionParticipant(onCancel?: () => void, onRefresh?: (id?: string, txHeight?: number) => void) {
  const veranaChain = useVeranaChain()
  const { address, isWalletConnected } = useChain(veranaChain.chain_name)
  const { corporation, hasOperatorGrant, loading: corporationLoading } = useUserCorporation()
  const { refetch: refetchPendingTasks } = usePendingTasksCtx()
  const { waitForBlock } = useIndexerEvents()
  const { notify } = useNotification()
  const sendTx = useSendTxDetectingMode(veranaChain)
  const inFlight = useRef(false)

  return async (
    params: ParticipantActionParams,
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
    let id = 'id' in params ? String(params.id) : undefined
    if (!simulate) {
      void notify(
        MSG_INPROGRESS_ACTION_PARTICIPANT[params.msgType](),
        'inProgress',
        resolveTranslatable({ key: 'notification.msg.inprogress.title' }, translate)
      )
    }

    try {
      const message = buildParticipantMessage(params, {
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
          MSG_ERROR_ACTION_PARTICIPANT[params.msgType](id, result.code, result.rawLog),
          'error',
          resolveTranslatable({ key: 'notification.msg.failed.title' }, translate)
        )
        return result
      }

      id = createdParticipantId(params, result)
      const txHeight = extractTxHeight(result)
      if (txHeight === undefined) throw new Error('Successful transaction did not include a block height')
      const indexed = await waitForIndexerAfterTx(waitForBlock, txHeight)
      const refresh = async () => {
        await refetchPendingTasks()
        onRefresh?.(id, txHeight)
      }
      if (indexed) {
        await refresh()
      } else {
        runAfterIndexerCatchesUp(waitForBlock, txHeight, refresh)
      }
      const notification = successfulTxNotification(
        MSG_SUCCESS_ACTION_PARTICIPANT[params.msgType](id),
        txHeight,
        indexed
      )
      await notify(notification.message, notification.type, notification.title)
      onCancel?.()
      return result
    } catch (error) {
      await notify(
        MSG_ERROR_ACTION_PARTICIPANT[params.msgType](
          id,
          undefined,
          error instanceof Error ? error.message : String(error)
        ),
        'error',
        resolveTranslatable({ key: 'notification.msg.failed.title' }, translate)
      )
    } finally {
      inFlight.current = false
    }
  }
}
