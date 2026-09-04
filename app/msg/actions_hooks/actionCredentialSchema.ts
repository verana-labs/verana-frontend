'use client'

import type { EncodeObject } from '@cosmjs/proto-signing'
import type { DeliverTxResponse } from '@cosmjs/stargate'
import { useChain } from '@cosmos-kit/react'
import { pickOptionalUInt32 } from '@verana-labs/verana-types/amino-converter/util/helpers'
import {
  MsgArchiveCredentialSchema,
  MsgCreateCredentialSchema,
  MsgUpdateCredentialSchema,
} from '@verana-labs/verana-types/codec/verana/cs/v1/tx'
import { HolderOnboardingMode, PricingAssetType } from '@verana-labs/verana-types/codec/verana/cs/v1/types'
import { useRef } from 'react'
import { useDelegableMsgs } from '@/hooks/useDelegableMsgs'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import type { CorporationSigningMode } from '@/msg/actions_hooks/actionCorporationManage'
import {
  MSG_ERROR_ACTION_CS,
  MSG_INPROGRESS_ACTION_CS,
  MSG_NOTIFICATION_PROPOSAL,
  MSG_SUCCESS_ACTION_CS,
} from '@/msg/constants/notificationMsgForMsgType'
import { delegableTypeUrl, proposalTitleFrom } from '@/msg/util/delegable-msgs'
import { runAfterIndexerCatchesUp, successfulTxNotification, waitForIndexerAfterTx } from '@/msg/util/indexerWait'
import { useSendTxDetectingMode } from '@/msg/util/sendTxDetectingMode'
import type { SimulateResult } from '@/msg/util/signAndBroadcastManualAmino'
import { extractTxHeight } from '@/msg/util/signerUtil'
import { findEventAttribute } from '@/msg/util/txEvents'
import { useIndexerEvents } from '@/providers/indexer-events-provider'
import { useNotification } from '@/providers/notification-provider'
import { useProtocolParams } from '@/providers/protocol-params-context'
import { type I18nValues, resolveTranslatable } from '@/ui/dataview/types'
import { normalizeJsonSchema, validateJSONSchemaReturn } from '@/util/json_schema_util'

const DEFAULT_HOLDER_ONBOARDING_MODE = HolderOnboardingMode.HOLDER_ONBOARDING_MODE_PERMISSIONLESS
const DEFAULT_PRICING_ASSET_TYPE = PricingAssetType.COIN
const DEFAULT_PRICING_ASSET = 'uvna'
const DEFAULT_DIGEST_ALGORITHM = 'sha384'

type CredentialSchemaContext = {
  corporation: string
  operator: string
}

type CredentialSchemaPeriods = {
  issuerGrantorValidationValidityPeriod: number
  verifierGrantorValidationValidityPeriod: number
  issuerValidationValidityPeriod: number
  verifierValidationValidityPeriod: number
  holderValidationValidityPeriod: number
}

export type CredentialSchemaActionParams =
  | ({
      msgType: 'MsgCreateCredentialSchema'
      ecosystemId: string | number
      jsonSchema: string
      issuerOnboardingMode: number
      verifierOnboardingMode: number
    } & CredentialSchemaPeriods)
  | ({
      msgType: 'MsgUpdateCredentialSchema'
      id: string | number
    } & CredentialSchemaPeriods)
  | {
      msgType: 'MsgArchiveCredentialSchema' | 'MsgUnarchiveCredentialSchema'
      id: string | number
    }

export function buildCredentialSchemaMessage(
  params: CredentialSchemaActionParams,
  context: CredentialSchemaContext
): EncodeObject {
  switch (params.msgType) {
    case 'MsgCreateCredentialSchema':
      return {
        typeUrl: '/verana.cs.v1.MsgCreateCredentialSchema',
        value: MsgCreateCredentialSchema.fromPartial({
          corporation: context.corporation,
          operator: context.operator,
          ecosystemId: Number(params.ecosystemId),
          jsonSchema: normalizeJsonSchema(params.jsonSchema),
          issuerGrantorValidationValidityPeriod: pickOptionalUInt32(params.issuerGrantorValidationValidityPeriod),
          verifierGrantorValidationValidityPeriod: pickOptionalUInt32(params.verifierGrantorValidationValidityPeriod),
          issuerValidationValidityPeriod: pickOptionalUInt32(params.issuerValidationValidityPeriod),
          verifierValidationValidityPeriod: pickOptionalUInt32(params.verifierValidationValidityPeriod),
          holderValidationValidityPeriod: pickOptionalUInt32(params.holderValidationValidityPeriod),
          issuerOnboardingMode: params.issuerOnboardingMode,
          verifierOnboardingMode: params.verifierOnboardingMode,
          holderOnboardingMode: DEFAULT_HOLDER_ONBOARDING_MODE,
          pricingAssetType: DEFAULT_PRICING_ASSET_TYPE,
          pricingAsset: DEFAULT_PRICING_ASSET,
          digestAlgorithm: DEFAULT_DIGEST_ALGORITHM,
        }),
      }
    case 'MsgUpdateCredentialSchema':
      return {
        typeUrl: '/verana.cs.v1.MsgUpdateCredentialSchema',
        value: MsgUpdateCredentialSchema.fromPartial({
          corporation: context.corporation,
          operator: context.operator,
          id: Number(params.id),
          issuerGrantorValidationValidityPeriod: pickOptionalUInt32(params.issuerGrantorValidationValidityPeriod),
          verifierGrantorValidationValidityPeriod: pickOptionalUInt32(params.verifierGrantorValidationValidityPeriod),
          issuerValidationValidityPeriod: pickOptionalUInt32(params.issuerValidationValidityPeriod),
          verifierValidationValidityPeriod: pickOptionalUInt32(params.verifierValidationValidityPeriod),
          holderValidationValidityPeriod: pickOptionalUInt32(params.holderValidationValidityPeriod),
        }),
      }
    case 'MsgArchiveCredentialSchema':
    case 'MsgUnarchiveCredentialSchema':
      return {
        typeUrl: '/verana.cs.v1.MsgArchiveCredentialSchema',
        value: MsgArchiveCredentialSchema.fromPartial({
          corporation: context.corporation,
          operator: context.operator,
          id: Number(params.id),
          archive: params.msgType === 'MsgArchiveCredentialSchema',
        }),
      }
  }
}

function effectValues(params: CredentialSchemaActionParams): I18nValues {
  return {
    id: 'id' in params ? String(params.id) : null,
    ecosystemId: 'ecosystemId' in params ? String(params.ecosystemId) : null,
  }
}

function isDeliverTxResponse(result: DeliverTxResponse | SimulateResult): result is DeliverTxResponse {
  return 'code' in result
}

function t(key: string, values?: I18nValues): string {
  return resolveTranslatable({ key, values }, translate) ?? key
}

export function useActionCredentialSchema(onCancel?: () => void, onRefresh?: (id?: string, txHeight?: number) => void) {
  const veranaChain = useVeranaChain()
  const { address, isWalletConnected } = useChain(veranaChain.chain_name)
  const delegable = useDelegableMsgs()
  const { credentialSchemaSchemaMaxSize } = useProtocolParams()
  const { waitForBlock } = useIndexerEvents()
  const { notify } = useNotification()
  const sendTx = useSendTxDetectingMode(veranaChain)
  const inFlight = useRef(false)

  return async (
    params: CredentialSchemaActionParams,
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

    if (params.msgType === 'MsgCreateCredentialSchema') {
      const maxSize =
        typeof credentialSchemaSchemaMaxSize === 'number' && credentialSchemaSchemaMaxSize > 0
          ? credentialSchemaSchemaMaxSize
          : undefined
      const validationError = validateJSONSchemaReturn(params.jsonSchema, maxSize)
      if (validationError) {
        await notify(`${t('error.msg.cs.create.schema.json')} ${validationError.message}`, 'error')
        return
      }
    }

    inFlight.current = true
    let id = 'id' in params ? String(params.id) : undefined
    let mode: CorporationSigningMode = 'operator'
    const errorMessage = (code?: number, msg?: string) =>
      mode === 'proposal'
        ? MSG_NOTIFICATION_PROPOSAL.error(code, msg)
        : MSG_ERROR_ACTION_CS[params.msgType](id, code, msg)
    try {
      const typeUrl = delegableTypeUrl(params.msgType)
      if (!typeUrl) throw new Error(`Unsupported message type: ${params.msgType}`)
      const effect = t(`txconfirm.effect.${params.msgType}`, effectValues(params))
      const resolved = await delegable({
        typeUrl,
        build: (corporation, operator) => buildCredentialSchemaMessage(params, { corporation, operator }),
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
        mode === 'proposal' ? MSG_NOTIFICATION_PROPOSAL.inprogress() : MSG_INPROGRESS_ACTION_CS[params.msgType](),
        'inProgress',
        t('notification.msg.inprogress.title')
      )
      const result = await sendTx({ msgs: resolved.msgs, memo: params.msgType })
      if (!isDeliverTxResponse(result)) throw new Error('Expected a transaction response')
      if (result.code !== 0) {
        await notify(errorMessage(result.code, result.rawLog), 'error', t('notification.msg.failed.title'))
        return result
      }

      if (params.msgType === 'MsgCreateCredentialSchema') {
        id = findEventAttribute(result.events, 'create_credential_schema', 'credential_schema_id')
      }
      const txHeight = extractTxHeight(result)
      if (txHeight === undefined) throw new Error('Successful transaction did not include a block height')
      const indexed = await waitForIndexerAfterTx(waitForBlock, txHeight)
      if (id) sessionStorage.setItem('id_updated', id)
      const notification = successfulTxNotification(
        mode === 'proposal' ? MSG_NOTIFICATION_PROPOSAL.success() : MSG_SUCCESS_ACTION_CS[params.msgType](),
        txHeight,
        indexed
      )
      await notify(notification.message, notification.type, notification.title)
      if (indexed) {
        onRefresh?.(id, txHeight)
      } else {
        runAfterIndexerCatchesUp(waitForBlock, txHeight, () => onRefresh?.(id, txHeight))
      }
      onCancel?.()
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
