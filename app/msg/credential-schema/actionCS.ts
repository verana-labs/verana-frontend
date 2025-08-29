'use client';

import { useRef } from 'react';
import { StdFee, DeliverTxResponse } from '@cosmjs/stargate';
import {
  MsgCreateCredentialSchema,
  MsgUpdateCredentialSchema,
  MsgArchiveCredentialSchema,
} from '@/proto-codecs/codec/verana/cs/v1/tx';
import { veranaGasLimit, veranaGasPrice } from '@/app/config/veranaChain.client';
import { useVeranaChain } from '@/app/hooks/useVeranaChain';
import { useChain } from '@cosmos-kit/react';
import { usePathname, useRouter } from 'next/navigation';
import { useNotification } from '@/app/ui/common/notification-provider';
import {
  MSG_ERROR_ACTION_CS,
  MSG_INPROGRESS_ACTION_CS,
  MSG_SUCCESS_ACTION_CS,
} from '@/app/constants/notificationMsgForMsgType';

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
  const { address, signAndBroadcast, isWalletConnected } = useChain(veranaChain.chain_name);

  const router = useRouter();
  const { notify } = useNotification();
  const pathname = usePathname();

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
    let id: string | undefined;
    let trId: string | undefined;

    try {
      switch (params.msgType) {
        case 'MsgCreateCredentialSchema': {
          typeUrl = MSG_TYPE_CONFIG_CS.MsgCreateCredentialSchema.typeUrl;
          value = MsgCreateCredentialSchema.fromPartial({
            creator: address, // always use the connected wallet address
            trId: String(params.trId), // uint64: handled internally with Long.fromValue
            jsonSchema: params.jsonSchema,
            issuerGrantorValidationValidityPeriod: params.issuerGrantorValidationValidityPeriod,
            verifierGrantorValidationValidityPeriod: params.verifierGrantorValidationValidityPeriod,
            issuerValidationValidityPeriod: params.issuerValidationValidityPeriod,
            verifierValidationValidityPeriod: params.verifierValidationValidityPeriod,
            holderValidationValidityPeriod: params.holderValidationValidityPeriod,
            issuerPermManagementMode: params.issuerPermManagementMode,
            verifierPermManagementMode: params.verifierPermManagementMode,
          });
          // ID will be returned in MsgCreateCredentialSchemaResponse
          break;
        }

        case 'MsgUpdateCredentialSchema': {
          typeUrl = MSG_TYPE_CONFIG_CS.MsgUpdateCredentialSchema.typeUrl;
          value = MsgUpdateCredentialSchema.fromPartial({
            creator: address,
            id: String(params.id), // uint64: handled as string
            issuerGrantorValidationValidityPeriod: params.issuerGrantorValidationValidityPeriod,
            verifierGrantorValidationValidityPeriod: params.verifierGrantorValidationValidityPeriod,
            issuerValidationValidityPeriod: params.issuerValidationValidityPeriod,
            verifierValidationValidityPeriod: params.verifierValidationValidityPeriod,
            holderValidationValidityPeriod: params.holderValidationValidityPeriod,
          });
          id = String(params.id);
          break;
        }

        case 'MsgArchiveCredentialSchema': {
          typeUrl = MSG_TYPE_CONFIG_CS.MsgArchiveCredentialSchema.typeUrl;
          value = MsgArchiveCredentialSchema.fromPartial({
            creator: address,
            id: String(params.id), // uint64: handled as string
            archive: true,
          });
          id = String(params.id);
          break;
        }

        default:
          throw new Error('Invalid msgType');
      }

      // Build transaction fee
      const fee: StdFee = {
        amount: [
          {
            denom: 'uvna',
            amount: String(Math.ceil(parseFloat(veranaGasPrice.toString()) * veranaGasLimit)),
          },
        ],
        gas: veranaGasLimit.toString(),
      };

      // Show "in progress" notification
      let notifyPromise: Promise<void> = notify(
        MSG_INPROGRESS_ACTION_CS[params.msgType],
        'inProgress',
        'Transaction in progress'
      );

      trId = String(params.trId);

      // Sign and broadcast the transaction
      const res = await signAndBroadcast([{ typeUrl, value }], fee, MSG_TYPE_CONFIG_CS[params.msgType].txLabel);

      if (res.code === 0) {
        notifyPromise = notify(MSG_SUCCESS_ACTION_CS[params.msgType], 'success', 'Transaction successful');
        await notifyPromise;
        return res;
      } else {
        await notify(
          MSG_ERROR_ACTION_CS[params.msgType](id, res.code, res.rawLog) || `(${res.code}): ${res.rawLog}`,
          'error',
          'Transaction failed'
        );
        return res;
      }
    } catch (err) {
      await notify(
        MSG_ERROR_ACTION_CS[params.msgType](
          id,
          undefined,
          err instanceof Error ? err.message : String(err)
        ),
        'error',
        'Transaction failed'
      );
    } finally {
        // Redirect after success
        if (trId) {
          const trUrl = `/tr/${trId}`;
          if (pathname === trUrl) {
            router.push('/tr');
            setTimeout(() => router.push(trUrl), 100);
          } else {
            router.push(trUrl);
          }
        } else {
          router.push('/tr');
        }
      inFlight.current = false;
    }
  }

  return actionCS;
}