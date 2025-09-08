'use client';

import { useRef } from 'react';
import { DeliverTxResponse } from '@cosmjs/stargate';
import {
  MsgCreateCredentialSchema,
  MsgUpdateCredentialSchema,
  MsgArchiveCredentialSchema,
} from '@/proto-codecs/codec/verana/cs/v1/tx';
import { useVeranaChain } from '@/app/hooks/useVeranaChain';
import { useChain } from '@cosmos-kit/react';
import { usePathname, useRouter } from 'next/navigation';
import { useNotification } from '@/app/ui/common/notification-provider';
import {
  MSG_ERROR_ACTION_CS,
  MSG_INPROGRESS_ACTION_CS,
  MSG_SUCCESS_ACTION_CS,
} from '@/app/constants/notificationMsgForMsgType';
import Long from 'long';
import { EncodeObject } from '@cosmjs/proto-signing';
import { useSendTxDetectingMode } from '@/app/msg/util/sendTxDetectingMode';

// Message type configuration (typeUrl + label for memo/notification)
export const MSG_TYPE_CONFIG_CS = {
  MsgCreateCredentialSchema: {
    typeUrl: '/verana.cs.v1.MsgCreateCredentialSchema',
    txLabel: 'MsgCreateCredentialSchema',
  },
  MsgUpdateCredentialSchema: {
    typeUrl: '/verana.cs.v1.MsgUpdateCredentialSchema',
    txLabel: 'MsgUpdateCredentialSchema',
  },
  MsgArchiveCredentialSchema: {
    typeUrl: '/verana.cs.v1.MsgArchiveCredentialSchema',
    txLabel: 'MsgArchiveCredentialSchema',
  },
} as const;

// Union type for all action parameters
type ActionCSParams =
  | {
      msgType: 'MsgCreateCredentialSchema';
      creator: string;
      trId: string | number;
      jsonSchema: string;
      issuerGrantorValidationValidityPeriod: number;
      verifierGrantorValidationValidityPeriod: number;
      issuerValidationValidityPeriod: number;
      verifierValidationValidityPeriod: number;
      holderValidationValidityPeriod: number;
      issuerPermManagementMode: number;
      verifierPermManagementMode: number;
    }
  | {
      msgType: 'MsgUpdateCredentialSchema';
      id: string | number;
      creator: string;
      trId: string | number;
      issuerGrantorValidationValidityPeriod: number;
      verifierGrantorValidationValidityPeriod: number;
      issuerValidationValidityPeriod: number;
      verifierValidationValidityPeriod: number;
      holderValidationValidityPeriod: number;
    }
  | {
      msgType: 'MsgArchiveCredentialSchema';
      id: string | number;
      creator: string;
      trId: string | number;
    };

// Hook to execute Credential Schema transactions + notifications
export function useActionCS() {
  const veranaChain = useVeranaChain();
  const { address, isWalletConnected } = useChain(veranaChain.chain_name);

  const router = useRouter();
  const { notify } = useNotification();
  const pathname = usePathname();
  const sendTx = useSendTxDetectingMode(veranaChain);

  // Prevents parallel broadcasts with the same account (avoids sequence mismatch errors)
  const inFlight = useRef(false);

  async function actionCS(params: ActionCSParams): Promise<DeliverTxResponse | void> {
    if (!isWalletConnected || !address) {
      await notify('Connect wallet', 'error');
      return;
    }
    if (inFlight.current) {
      await notify('There is a pending transaction. Please wait…', 'inProgress');
      return;
    }
    inFlight.current = true;

    let typeUrl = '';
    let value: MsgCreateCredentialSchema | MsgUpdateCredentialSchema | MsgArchiveCredentialSchema;
    const trId = params.trId?.toString();
    const id = (params.msgType !== 'MsgCreateCredentialSchema') ? params.id?.toString() : undefined;

    switch (params.msgType) {
      case 'MsgCreateCredentialSchema': {
        typeUrl = MSG_TYPE_CONFIG_CS.MsgCreateCredentialSchema.typeUrl;
        value = MsgCreateCredentialSchema.fromPartial({
          creator: address, // always use the connected wallet address
          trId: Long.fromString(String(params.trId)), // uint64: handled internally with Long.fromValue
          jsonSchema: params.jsonSchema,
          issuerGrantorValidationValidityPeriod: Number(params.issuerGrantorValidationValidityPeriod),
          verifierGrantorValidationValidityPeriod: Number(params.verifierGrantorValidationValidityPeriod),
          issuerValidationValidityPeriod: Number(params.issuerValidationValidityPeriod),
          verifierValidationValidityPeriod: Number(params.verifierValidationValidityPeriod),
          holderValidationValidityPeriod: Number(params.holderValidationValidityPeriod),
          issuerPermManagementMode: Number(params.issuerPermManagementMode),
          verifierPermManagementMode: Number(params.verifierPermManagementMode),
        });
        break;
      }

      case 'MsgUpdateCredentialSchema': {
        typeUrl = MSG_TYPE_CONFIG_CS.MsgUpdateCredentialSchema.typeUrl;
        value = MsgUpdateCredentialSchema.fromPartial({
          creator: address,
          id: Long.fromString(String(params.id)),
          issuerGrantorValidationValidityPeriod: Number(params.issuerGrantorValidationValidityPeriod),
          verifierGrantorValidationValidityPeriod: Number(params.verifierGrantorValidationValidityPeriod),
          issuerValidationValidityPeriod: Number(params.issuerValidationValidityPeriod),
          verifierValidationValidityPeriod: Number(params.verifierValidationValidityPeriod),
          holderValidationValidityPeriod: Number(params.holderValidationValidityPeriod),
        });
        break;
      }

      case 'MsgArchiveCredentialSchema': {
        typeUrl = MSG_TYPE_CONFIG_CS.MsgArchiveCredentialSchema.typeUrl;
        value = MsgArchiveCredentialSchema.fromPartial({
          creator: address,
          id: Long.fromString(String(params.id)), // uint64
          archive: true,
        });
        break;
      }

      default:
        throw new Error('Invalid msgType');
    }

    // Show "in progress" notification
    let notifyPromise: Promise<void> = notify(
      MSG_INPROGRESS_ACTION_CS[params.msgType],
      'inProgress',
      'Transaction in progress'
    );

    let res: DeliverTxResponse;

    try {

      const msg: EncodeObject = { typeUrl, value };

      res = await sendTx({
        msgs: [msg],
        memo: MSG_TYPE_CONFIG_CS[params.msgType].txLabel
      });      

      if (res.code === 0) {
        notifyPromise = notify(
          MSG_SUCCESS_ACTION_CS[params.msgType],
          'success',
          'Transaction successful'
        );
      } else {
        notifyPromise =  notify(
          MSG_ERROR_ACTION_CS[params.msgType](id, res.code, res.rawLog) || `(${res.code}): ${res.rawLog}`,
          'error',
          'Transaction failed'
        );
      }

    } catch (err) {
      notifyPromise =  notify(
        MSG_ERROR_ACTION_CS[params.msgType](id, undefined, err instanceof Error ? err.message : String(err)),
        'error',
        'Transaction failed'
      );
    } finally {
      inFlight.current = false;
      if (notifyPromise) await notifyPromise;
      // Redirect
        if (trId) {
          const trUrl = `/tr/${trId}`;
          if (pathname === trUrl) {
            router.push('/tr');
            setTimeout(() => router.push(trUrl), 200);
          } else {
            router.push(trUrl);
          }
        } else {
          router.push('/tr');
        }
    }
  }

  return actionCS;
}