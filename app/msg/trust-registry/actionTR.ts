'use client';

import { StdFee,  DeliverTxResponse} from '@cosmjs/stargate';
import {
  MsgCreateTrustRegistry,
  MsgUpdateTrustRegistry,
  MsgArchiveTrustRegistry,
} from '@/proto-codecs/codec/verana/tr/v1/tx';
import { veranaGasLimit, veranaGasPrice } from '@/app/config/veranaChain.client';
import { useVeranaChain } from '@/app/hooks/useVeranaChain';
import { useChain } from '@cosmos-kit/react';
import { usePathname, useRouter } from 'next/navigation';
import { useNotification } from '@/app/ui/common/notification-provider';
import { MSG_ERROR_ACTION_TR, MSG_INPROGRESS_ACTION_TR, MSG_SUCCESS_ACTION_TR } from '@/app/constants/notificationMsgForMsgType';
import { isValidUrl } from '@/app/util/validations'

export const MSG_TYPE_CONFIG_TR = {
  CreateTrustRegistry: {
    typeUrl: '/verana.tr.v1.MsgCreateTrustRegistry',
    txLabel: 'CreateTrustRegistry',
  },
  UpdateTrustRegistry: {
    typeUrl: '/verana.tr.v1.MsgUpdateTrustRegistry',
    txLabel: 'UpdateTrustRegistry',
  },
  ArchiveTrustRegistry: {
    typeUrl: '/verana.tr.v1.MsgArchiveTrustRegistry',
    txLabel: 'ArchiveTrustRegistry',
  },
} as const;

// Union type for action parameters
type ActionTRParams =
  | {
      msgType: 'CreateTrustRegistry';
      creator: string;
      did: string;
      aka: string;
      language: string;
      docUrl: string;
    }
  | {
      msgType: 'UpdateTrustRegistry';
      creator: string;
      id: string | number;
      did: string;
      aka: string;
    }
  | {
      msgType: 'ArchiveTrustRegistry';
      creator: string;
      id: string | number;
    };

// Hook to execute Trust Registry transactions and show notifications
export function useActionTR() {
  const veranaChain = useVeranaChain();
  const {
    address,
    signAndBroadcast,
    isWalletConnected,
  } = useChain(veranaChain.chain_name);

  const router = useRouter();
  const { notify } = useNotification();
  const pathname = usePathname();

  async function actionTR(params: ActionTRParams): Promise<DeliverTxResponse | void> {
    if (!isWalletConnected || !address) {
      await notify('Connect wallet', 'error');
      return;
    }

    let typeUrl = '';
    let value: MsgCreateTrustRegistry | MsgUpdateTrustRegistry | MsgArchiveTrustRegistry;
    let id: string | undefined;

    switch (params.msgType) {
      case 'CreateTrustRegistry':
        // Calculate SRI hash for docUrl using your API
        let sri: string | undefined;
        if (params.docUrl) {
          if (!isValidUrl(params.docUrl)){
            await notify('Invalid document Document URL', 'error');
            return;
          }
          try {
            const res = await fetch(`/api/sri?url=${encodeURIComponent(params.docUrl)}`);
            if (!res.ok) {
              await notify(`Could not calculate SRI for Document URL.`, 'error', 'Transaction failed');
              return;
            }
            const data = await res.json();
            sri = data.sri;
          } catch (err) {
            await notify('Could not calculate SRI for Document URL: ' + err, 'error', 'Transaction failed');
          }
        }

        typeUrl = MSG_TYPE_CONFIG_TR.CreateTrustRegistry.typeUrl;
        value = MsgCreateTrustRegistry.fromPartial({
          creator: address,
          did: params.did,
          aka: params.aka,
          language: params.language,
          docUrl: params.docUrl,
          docDigestSri: sri
        });
        // id undefined for create
        break;
      case 'UpdateTrustRegistry':
        typeUrl = MSG_TYPE_CONFIG_TR.UpdateTrustRegistry.typeUrl;
        value = MsgUpdateTrustRegistry.fromPartial({
          creator: params.creator,
          id: Number(params.id),
          did: params.did,
          aka: params.aka,
        });
        id = params.id?.toString();
        break;
      case 'ArchiveTrustRegistry':
        typeUrl = MSG_TYPE_CONFIG_TR.ArchiveTrustRegistry.typeUrl;
        value = MsgArchiveTrustRegistry.fromPartial({
          creator: params.creator,
          id: params.id,
          archive: true,
        });
        id = params.id?.toString();
        break;
      default:
        throw new Error('Invalid msgType');
    }

    const fee: StdFee = {
      amount: [{
        denom: 'uvna',
        amount: String(Math.ceil(parseFloat(veranaGasPrice.toString()) * veranaGasLimit)),
      }],
      gas: veranaGasLimit.toString(),
    };

    // Show progress notification
    let notifyPromise: Promise<void> = notify(
      MSG_INPROGRESS_ACTION_TR[params.msgType],
      'inProgress',
      'Transaction in progress'
    );

    let res: DeliverTxResponse;
    let success = false;

    try {
      res = await signAndBroadcast([{ typeUrl, value }], fee, MSG_TYPE_CONFIG_TR[params.msgType].txLabel);

      if (res.code === 0) {
        success = true;
        notifyPromise = notify(
          MSG_SUCCESS_ACTION_TR[params.msgType],
          'success',
          'Transaction successful'
        );
      } else {
        notifyPromise = notify(
          MSG_ERROR_ACTION_TR[params.msgType](id, res.code, res.rawLog) || `(${res.code}): ${res.rawLog}`,
          'error',
          'Transaction failed'
        );
      }
    } catch (err) {
      notifyPromise = notify(
        MSG_ERROR_ACTION_TR[params.msgType](id, undefined, err instanceof Error ? err.message : String(err)),
        'error',
        'Transaction failed'
      );
      throw err;
    } finally {
      if (notifyPromise) await notifyPromise;
      if (success) {
        if (params.msgType === 'CreateTrustRegistry') {
          router.push('/tr');
        } else if (id) {
          const trUrl = `/tr/${encodeURIComponent(id)}`;
          if (pathname === trUrl) {
            router.push('/tr');
            setTimeout(() => router.push(trUrl), 100);
          } else {
            router.push(trUrl);
          }
        } else {
          router.push('/tr');
        }
      } else {
        router.push('/tr');
      }
    }
    return res;
  }

  return actionTR;
}
