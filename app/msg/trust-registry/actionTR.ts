'use client';

import { useRef } from 'react';
import { DeliverTxResponse} from '@cosmjs/stargate';
import {
  MsgCreateTrustRegistry,
  MsgUpdateTrustRegistry,
  MsgArchiveTrustRegistry,
  MsgAddGovernanceFrameworkDocument,
  MsgIncreaseActiveGovernanceFrameworkVersion
} from '@/proto-codecs/codec/verana/tr/v1/tx';
import { veranaGasAdjustment, veranaGasPrice } from '@/app/config/veranaChain.client';
import { useVeranaChain } from '@/app/hooks/useVeranaChain';
import { useChain } from '@cosmos-kit/react';
import { usePathname, useRouter } from 'next/navigation';
import { useNotification } from '@/app/ui/common/notification-provider';
import { MSG_ERROR_ACTION_TR, MSG_INPROGRESS_ACTION_TR, MSG_SUCCESS_ACTION_TR } from '@/app/constants/notificationMsgForMsgType';
import { isValidUrl } from '@/app/util/validations'
import { makeRegistry, signAndBroadcastManual } from '@/app/util/tx';
import { EncodeObject, OfflineDirectSigner } from '@cosmjs/proto-signing';

export const MSG_TYPE_CONFIG_TR = {
  MsgCreateTrustRegistry: {
    typeUrl: '/verana.tr.v1.MsgCreateTrustRegistry',
    txLabel: 'MsgCreateTrustRegistry',
  },
  MsgUpdateTrustRegistry: {
    typeUrl: '/verana.tr.v1.MsgUpdateTrustRegistry',
    txLabel: 'MsgUpdateTrustRegistry',
  },
  MsgArchiveTrustRegistry: {
    typeUrl: '/verana.tr.v1.MsgArchiveTrustRegistry',
    txLabel: 'MsgArchiveTrustRegistry',
  },
  MsgAddGovernanceFrameworkDocument: {
    typeUrl: '/verana.tr.v1.MsgAddGovernanceFrameworkDocument',
    txLabel: 'MsgAddGovernanceFrameworkDocument',
  },
  MsgIncreaseActiveGovernanceFrameworkVersion: {
    typeUrl: '/verana.tr.v1.MsgIncreaseActiveGovernanceFrameworkVersion',
    txLabel: 'MsgIncreaseActiveGovernanceFrameworkVersion',
  }
} as const;

// Union type for action parameters
type ActionTRParams =
  | {
      msgType: 'MsgCreateTrustRegistry';
      creator: string;
      did: string;
      aka: string;
      language: string;
      docUrl: string;
    }
  | {
      msgType: 'MsgUpdateTrustRegistry';
      creator: string;
      id: string | number;
      did: string;
      aka: string;
    }
  | {
      msgType: 'MsgArchiveTrustRegistry';
      creator: string;
      id: string | number;
    }
  | {
      msgType: 'MsgAddGovernanceFrameworkDocument';
      creator: string;
      id: string | number;
      version: number;
      docLanguage: string;
      docUrl: string;
    }
  | {
      msgType: 'MsgIncreaseActiveGovernanceFrameworkVersion';
      creator: string;
      id: string | number;
    };

// Hook to execute Trust Registry transactions and show notifications
export function useActionTR() {
  const veranaChain = useVeranaChain();
  const {
    address,
    isWalletConnected,
  } = useChain(veranaChain.chain_name);

  const router = useRouter();
  const { notify } = useNotification();
  const pathname = usePathname();
  const inFlight = useRef(false);

  async function actionTR(params: ActionTRParams): Promise<DeliverTxResponse | void> {
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
    let value: MsgCreateTrustRegistry | MsgUpdateTrustRegistry | MsgArchiveTrustRegistry | MsgAddGovernanceFrameworkDocument | MsgIncreaseActiveGovernanceFrameworkVersion;
    const id = (params.msgType !== 'MsgCreateTrustRegistry') ? params.id.toString() : undefined;

    switch (params.msgType) {
      case 'MsgCreateTrustRegistry':
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
        typeUrl = MSG_TYPE_CONFIG_TR.MsgCreateTrustRegistry.typeUrl;
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
      case 'MsgUpdateTrustRegistry':
        typeUrl = MSG_TYPE_CONFIG_TR.MsgUpdateTrustRegistry.typeUrl;
        value = MsgUpdateTrustRegistry.fromPartial({
          creator: address,
          id: String(params.id),
          did: params.did,
          aka: params.aka,
        });
        break;
      case 'MsgArchiveTrustRegistry':
        typeUrl = MSG_TYPE_CONFIG_TR.MsgArchiveTrustRegistry.typeUrl;
        value = MsgArchiveTrustRegistry.fromPartial({
          creator: address,
          id: params.id,
          archive: true,
        });
        break;
      case 'MsgAddGovernanceFrameworkDocument':
        // Calculate SRI hash for docUrl using your API
        let sriAdd: string | undefined;
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
            sriAdd = data.sri;
          } catch (err) {
            await notify('Could not calculate SRI for Document URL: ' + err, 'error', 'Transaction failed');
          }
        }
        typeUrl = MSG_TYPE_CONFIG_TR.MsgAddGovernanceFrameworkDocument.typeUrl;
        value = MsgAddGovernanceFrameworkDocument.fromPartial({
          creator: address,
          id: String(params.id),
          docLanguage: params.docLanguage,
          docUrl: params.docUrl,
          docDigestSri: sriAdd,
          version: params.version + 1
        });
        // version undefined for create
        break;
      case 'MsgIncreaseActiveGovernanceFrameworkVersion':
        typeUrl = MSG_TYPE_CONFIG_TR.MsgIncreaseActiveGovernanceFrameworkVersion.typeUrl;
        value = MsgIncreaseActiveGovernanceFrameworkVersion.fromPartial({
          creator: address,
          id: String(params.id),
        });
        break;
      default:
        throw new Error('Invalid msgType');
    }

    // const fee = calculateFee(veranaGasLimit, GasPrice.fromString(`${veranaGasPrice}`)); 

    // Show progress notification
    let notifyPromise: Promise<void> = notify(
      MSG_INPROGRESS_ACTION_TR[params.msgType],
      'inProgress',
      'Transaction in progress'
    );

    let res: DeliverTxResponse;
    let success = false;

    try {
      // res = await signAndBroadcast([{ typeUrl, value }], fee, MSG_TYPE_CONFIG_TR[params.msgType].txLabel);

      const registry = makeRegistry();
      const msg: EncodeObject = { typeUrl, value };

      // Get RPC endpoint and signer from cosmos-kit
      // Get the first rpc endpoint (string or undefined)
      const rpcEndpoint = veranaChain.apis?.rpc?.[0]?.address!; // eslint-disable-line @typescript-eslint/no-non-null-asserted-optional-chain
      const offlineSigner = (await (window as any).keplr.getOfflineSignerAuto(veranaChain.chain_id)) as OfflineDirectSigner; // eslint-disable-line @typescript-eslint/no-explicit-any

      res = await signAndBroadcastManual({
        rpcEndpoint,
        chainId: veranaChain.chain_id,
        signer: offlineSigner,
        address,
        registry,
        messages: [msg],
        gasPrice: String(veranaGasPrice),                     // "0.3uvna"
        gasAdjustment: veranaGasAdjustment,                   // add some margin
        memo: MSG_TYPE_CONFIG_TR[params.msgType].txLabel,     // free text
        timeoutHeight: undefined,                             // or block + N
        // feeGranter: undefined,
        // feePayer: undefined,
      });      

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
    } finally {
      inFlight.current = false;
      if (notifyPromise) await notifyPromise;
      // Redirect
      if (success) {
        if (params.msgType === 'MsgCreateTrustRegistry') {
          router.push('/tr');
        } else if (id) {
          const trUrl = `/tr/${encodeURIComponent(id)}`;
          if (pathname === trUrl) {
            router.push('/tr');
            setTimeout(() => router.push(trUrl), 200);
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
  }

  return actionTR;
}
