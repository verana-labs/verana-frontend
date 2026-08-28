'use client'

import {
  type CredentialSchemaActionParams,
  useActionCredentialSchema,
} from '@/msg/actions_hooks/actionCredentialSchema'
import { type EcosystemActionParams, useActionEcosystem } from '@/msg/actions_hooks/actionEcosystem'
import type { MessageType } from '@/msg/constants/types'

const requiredFieldsByMsgType: Partial<Record<MessageType, readonly string[]>> = {
  MsgCreateCredentialSchema: [
    'ecosystemId',
    'jsonSchema',
    'issuerGrantorValidationValidityPeriod',
    'verifierGrantorValidationValidityPeriod',
    'issuerValidationValidityPeriod',
    'verifierValidationValidityPeriod',
    'holderValidationValidityPeriod',
    'issuerOnboardingMode',
    'verifierOnboardingMode',
  ],
  MsgUpdateCredentialSchema: [
    'id',
    'issuerGrantorValidationValidityPeriod',
    'verifierGrantorValidationValidityPeriod',
    'issuerValidationValidityPeriod',
    'verifierValidationValidityPeriod',
    'holderValidationValidityPeriod',
  ],
  MsgArchiveCredentialSchema: ['id'],
  MsgUnarchiveCredentialSchema: ['id'],
  MsgCreateEcosystem: ['did', 'language', 'docUrl'],
  MsgUpdateEcosystem: ['id', 'did'],
  MsgArchiveEcosystem: ['id'],
  MsgUnarchiveEcosystem: ['id'],
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isCredentialSchemaMessage(messageType: MessageType): boolean {
  return (
    messageType === 'MsgCreateCredentialSchema' ||
    messageType === 'MsgUpdateCredentialSchema' ||
    messageType === 'MsgArchiveCredentialSchema' ||
    messageType === 'MsgUnarchiveCredentialSchema'
  )
}

function isEcosystemMessage(messageType: MessageType): boolean {
  return (
    messageType === 'MsgCreateEcosystem' ||
    messageType === 'MsgUpdateEcosystem' ||
    messageType === 'MsgArchiveEcosystem' ||
    messageType === 'MsgUnarchiveEcosystem'
  )
}

export function useSubmitTxMsgTypeFromObject(
  onCancel?: () => void,
  onRefresh?: (id?: string, txHeight?: number) => void
) {
  const submitCredentialSchema = useActionCredentialSchema(onCancel, onRefresh)
  const submitEcosystem = useActionEcosystem(onCancel, onRefresh)

  async function submitTx(messageType: MessageType, raw: unknown, simulate = false) {
    if (!isRecord(raw)) throw new Error('Payload must be an object')
    const requiredFields = requiredFieldsByMsgType[messageType]
    if (!requiredFields) throw new Error(`Unsupported form message type: ${messageType}`)

    const payload: Record<string, unknown> = { msgType: messageType }
    for (const field of requiredFields) {
      if (!(field in raw)) throw new Error(`Missing required field: ${field}`)
      payload[field] = raw[field]
    }

    if (isCredentialSchemaMessage(messageType)) {
      return submitCredentialSchema(payload as CredentialSchemaActionParams, simulate)
    }
    if (isEcosystemMessage(messageType)) {
      return submitEcosystem(payload as EcosystemActionParams, simulate)
    }
    throw new Error(`Unsupported form message type: ${messageType}`)
  }

  return { submitTx }
}
