'use client';

import { useMemo } from 'react';
import { MessageType } from '@/msg/constants/types';
import { useTrustDepositParams } from '../providers/trust-deposit-params-context';
import type { TrustDepositParams } from '@/lib/trustDepositParams';
import { resolveTranslatable } from '@/ui/dataview/types';
import { translate } from '@/i18n/dataview';

/** Narrow the union to only the supported message types for this hook. */
type SupportedMsgType =
  | 'MsgAddDID'
  | 'MsgRenewDID'
  | 'MsgCreateTrustRegistry'
  | 'MsgReclaimTrustDeposit'
  | 'MsgCreateCredentialSchema';

/** Runtime guard to narrow MessageType → SupportedMsgType */
function isSupported(mt: MessageType): mt is SupportedMsgType {
  return [
    'MsgAddDID',
    'MsgRenewDID',
    'MsgCreateTrustRegistry',
    'MsgReclaimTrustDeposit',
    'MsgCreateCredentialSchema',
  ].includes(mt as string);
}

/** Typed mapping: each message type maps to a *literal* key of TrustDepositParams */
const KEY_BY_TYPE = {
  MsgAddDID: 'didDirectoryTrustDeposit',
  MsgRenewDID: 'didDirectoryTrustDeposit',
  MsgCreateTrustRegistry: 'trustRegistryTrustDeposit',
  MsgReclaimTrustDeposit: 'trustDepositReclaimBurnRate',
  MsgCreateCredentialSchema: 'credentialSchemaTrustDeposit',
} as const satisfies Record<SupportedMsgType, keyof TrustDepositParams>;

/** Convert any value to a finite number or null if invalid. */
function toNumberOrNull(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export function useTrustDepositValue(messageType: MessageType) {
  const params = useTrustDepositParams();

  const { value, errorTrustDepositValue } = useMemo(() => {
    // Guard: if messageType is not one we handle, return empty
    if (!isSupported(messageType)) {
      return { value: null as number | null, errorTrustDepositValue: null as string | null };
    }

    // messageType is now narrowed to SupportedMsgType
    const key = KEY_BY_TYPE[messageType]; // key is keyof TrustDepositParams

    const raw = params[key];              // key is a valid, literal key
    if (raw == null) {
      return { value: null, errorTrustDepositValue: `${key} ${resolveTranslatable({key: "error.fetch.td.value.notfound"}, translate)??'not found'}` };
    }

    const n = toNumberOrNull(raw);
    if (n == null) {
      return { value: null, errorTrustDepositValue: `${key} ${resolveTranslatable({key: "error.fetch.td.value.notnumber"}, translate)??'is not a valid number'}` };
    }

    return { value: n, errorTrustDepositValue: null };
  }, [messageType, params]);

  return { value, errorTrustDepositValue };
}