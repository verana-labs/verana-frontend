'use client';

import { MessageType } from "@/app/constants/msgTypeConfig";

// Allowed data types
export type DataType = 'CsData';

// Allowed actions
export type Action = 'create' | 'update' | 'archive';

// Shape of each config entry
export interface MsgTypeDataTypeInfo {
  name: DataType;   // the data type (e.g., "CsData")
  action: Action;   // the action performed (e.g., "create")
  msgType: MessageType; // the corresponding MessageType
}

// Nested mapping: DataType -> Action -> Config
type DataTypeActionConfig = Record<DataType, Record<Action, MsgTypeDataTypeInfo>>;

// Configuration map: define which MessageType corresponds to each action of a DataType
export const msgTypeDataTypeConfig: DataTypeActionConfig = {
  CsData: {
    create:  { name: 'CsData', action: 'create',  msgType: 'MsgCreateCredentialSchema' },
    update:  { name: 'CsData', action: 'update',  msgType: 'MsgUpdateCredentialSchema' },
    archive: { name: 'CsData', action: 'archive', msgType: 'MsgArchiveCredentialSchema' },
  }
};

// Helper: quickly get the MessageType for a given (dataType, action) pair
export const getMsgTypeFor = (dataType: DataType, action: Action): MessageType =>
  msgTypeDataTypeConfig[dataType][action].msgType;