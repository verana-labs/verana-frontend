'use client'

import { MessageType } from '@/msg/constants/types'

// Allowed data types
export type DataType = 'CredentialSchemaData'

// Allowed actions
export type Action = 'create' | 'update' | 'archive'

// Shape of each config entry
export interface MsgTypeDataTypeInfo {
  name: DataType
  action: Action // the action performed (e.g., "create")
  msgType: MessageType // the corresponding MessageType
}

// Nested mapping: DataType -> Action -> Config
type DataTypeActionConfig = Record<DataType, Record<Action, MsgTypeDataTypeInfo>>

// Configuration map: define which MessageType corresponds to each action of a DataType
export const msgTypeDataTypeConfig: DataTypeActionConfig = {
  CredentialSchemaData: {
    create: { name: 'CredentialSchemaData', action: 'create', msgType: 'MsgCreateCredentialSchema' },
    update: { name: 'CredentialSchemaData', action: 'update', msgType: 'MsgUpdateCredentialSchema' },
    archive: { name: 'CredentialSchemaData', action: 'archive', msgType: 'MsgArchiveCredentialSchema' },
  },
}

// Helper: quickly get the MessageType for a given (dataType, action) pair
export const getMsgTypeFor = (dataType: DataType, action: Action): MessageType =>
  msgTypeDataTypeConfig[dataType][action].msgType
