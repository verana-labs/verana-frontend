/* Hook orchestrating the lifecycle of DID transactions (add, renew, touch, remove). */
'use client';

import { useRef, Dispatch, SetStateAction } from 'react';
import { DeliverTxResponse } from '@cosmjs/stargate';
import { useChain } from '@cosmos-kit/react';
import { useRouter } from 'next/navigation';
import { EncodeObject } from '@cosmjs/proto-signing';
import {
  MsgAddDID,
  MsgRenewDID,
  MsgTouchDID,
  MsgRemoveDID,
} from '@/proto-codecs/codec/verana/dd/v1/tx';
import { useVeranaChain } from '@/app/hooks/useVeranaChain';
import { useNotification } from '@/app/ui/common/notification-provider';
import { useSendTxDetectingMode } from '@/app/msg/util/sendTxDetectingMode';
import {
  MSG_ERROR_ACTION_DID,
  MSG_INPROGRESS_ACTION_DID,
  MSG_SUCCESS_ACTION_DID,
} from '@/app/constants/notificationMsgForMsgType';

// Map each DID message type to its typeUrl and a memo label for logging/telemetry.
export const MSG_TYPE_CONFIG_DID = {
  MsgAddDID: {
    typeUrl: '/verana.dd.v1.MsgAddDID',
    txLabel: 'MsgAddDID',
  },
  MsgRenewDID: {
    typeUrl: '/verana.dd.v1.MsgRenewDID',
    txLabel: 'MsgRenewDID',
  },
  MsgTouchDID: {
    typeUrl: '/verana.dd.v1.MsgTouchDID',
    txLabel: 'MsgTouchDID',
  },
  MsgRemoveDID: {
    typeUrl: '/verana.dd.v1.MsgRemoveDID',
    txLabel: 'MsgRemoveDID',
  },
} as const;

// Discriminated union describing the payload each DID action expects.
type ActionDIDParams =
  | {
      msgType: 'MsgAddDID';
      did: string;
      years: number;
    }
  | {
      msgType: 'MsgRenewDID';
      did: string;
      years: number;
    }
  | {
      msgType: 'MsgTouchDID';
      did: string;
    }
  | {
      msgType: 'MsgRemoveDID';
      did: string;
    };

// Returns an action executor tailored for DID transactions, wiring wallet state, notifications, and navigation.
export function useActionDID(
  setActiveActionId?: Dispatch<SetStateAction<string | null>>,
  setRefresh?: Dispatch<SetStateAction<string | null>>
) {
  const veranaChain = useVeranaChain();
  const { address, isWalletConnected } = useChain(veranaChain.chain_name);
  const { notify } = useNotification();
  const sendTx = useSendTxDetectingMode(veranaChain);
  const router = useRouter();
  const inFlight = useRef(false);

  // After a successful broadcast, push or refresh the relevant route depending on the action performed.
  const handleSuccess = (msgType: ActionDIDParams['msgType'], did: string) => {
    if (msgType === 'MsgAddDID') {
      router.push(`/did/${encodeURIComponent(did)}`);
      return;
    }

    if (msgType === 'MsgRemoveDID') {
      setActiveActionId?.(null);
      router.push('/did');
      return;
    }

    setRefresh?.('actionDID');
    setActiveActionId?.(null);
  };

  // Collapse the action UI when the broadcast fails or is rejected.
  const handleFailure = () => {
    setActiveActionId?.(null);
  };

  async function actionDID(params: ActionDIDParams): Promise<DeliverTxResponse | void> {
    if (!isWalletConnected || !address) { 
      await notify('Connect wallet', 'error');
      return;
    }

    if (inFlight.current) {
      await notify('There is a pending transaction. Please wait…', 'inProgress');
      return;
    }

    const did = params.did.trim();
    if (!did) {
      await notify('Enter valid DID', 'error');
      return;
    }

    if ((params.msgType === 'MsgAddDID' || params.msgType === 'MsgRenewDID') && params.years < 1) {
      await notify('Enter valid years', 'error');
      return;
    }

    inFlight.current = true;

    let typeUrl = '';
    let value: MsgAddDID | MsgRenewDID | MsgTouchDID | MsgRemoveDID;

    switch (params.msgType) {
      case 'MsgAddDID': {
        const years = Math.trunc(params.years);
        typeUrl = MSG_TYPE_CONFIG_DID.MsgAddDID.typeUrl;
        value = MsgAddDID.fromPartial({
          creator: address,
          did,
          years,
        });
        break;
      }
      case 'MsgRenewDID': {
        const years = Math.trunc(params.years);
        typeUrl = MSG_TYPE_CONFIG_DID.MsgRenewDID.typeUrl;
        value = MsgRenewDID.fromPartial({
          creator: address,
          did,
          years,
        });
        break;
      }
      case 'MsgTouchDID': {
        typeUrl = MSG_TYPE_CONFIG_DID.MsgTouchDID.typeUrl;
        value = MsgTouchDID.fromPartial({
          creator: address,
          did,
        });
        break;
      }
      case 'MsgRemoveDID': {
        typeUrl = MSG_TYPE_CONFIG_DID.MsgRemoveDID.typeUrl;
        value = MsgRemoveDID.fromPartial({
          creator: address,
          did,
        });
        break;
      }
      default:
        inFlight.current = false;
        throw new Error(`Unsupported msgType: ${(params as { msgType: string }).msgType}`);
    }

    let notifyPromise: Promise<void> = notify(
      MSG_INPROGRESS_ACTION_DID[params.msgType](did),
      'inProgress',
      'Transaction in progress'
    );

    let res: DeliverTxResponse | undefined;
    let success = false;

    try {
      const msg: EncodeObject = { typeUrl, value };
      res = await sendTx({
        msgs: [msg],
        memo: MSG_TYPE_CONFIG_DID[params.msgType].txLabel,
      });

      if (res.code === 0) {
        success = true;
        notifyPromise = notify(
          MSG_SUCCESS_ACTION_DID[params.msgType](did),
          'success',
          'Transaction successful'
        );
      } else {
        notifyPromise = notify(
          MSG_ERROR_ACTION_DID[params.msgType](did, res.code, res.rawLog),
          'error',
          'Transaction failed'
        );
      }
    } catch (err) {
      notifyPromise = notify(
        MSG_ERROR_ACTION_DID[params.msgType](did, undefined, err instanceof Error ? err.message : String(err)),
        'error',
        'Transaction failed'
      );
    } finally {
      inFlight.current = false;
      if (notifyPromise) await notifyPromise;
      if (success && res) {
        handleSuccess(params.msgType, did);
      } else if (!success) {
        handleFailure();
      }
    }

    return res;
  }

  return actionDID;
}
