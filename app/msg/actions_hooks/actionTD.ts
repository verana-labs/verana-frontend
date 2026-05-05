/* Hook for trust-deposit transactions (reclaim yield) with notification plumbing. */
'use client';

import { useRef } from 'react';
import { DeliverTxResponse } from '@cosmjs/stargate';
import { useChain } from '@cosmos-kit/react';
import { EncodeObject } from '@cosmjs/proto-signing';
import { MsgReclaimTrustDepositYield } from '@codec-proto/verana/td/v1/tx';
import { useVeranaChain } from '@/hooks/useVeranaChain';
import { useNotification } from '@/providers/notification-provider';
import { useSendTxDetectingMode } from '@/msg/util/sendTxDetectingMode';
import {
  MSG_ERROR_ACTION_TD,
  MSG_INPROGRESS_ACTION_TD,
  MSG_SUCCESS_ACTION_TD,
} from '@/msg/constants/notificationMsgForMsgType';
import { resolveTranslatable } from '@/ui/dataview/types';
import { translate } from '@/i18n/dataview';
import { SimulateResult } from '@/msg/util/signAndBroadcastManualAmino';
import { extractTxHeight, handleSuccess } from '@/msg/util/signerUtil'

export const MSG_TYPE_CONFIG_TD = {
  MsgReclaimTrustDepositYield: {
    typeUrl: '/verana.td.v1.MsgReclaimTrustDepositYield',
    txLabel: 'MsgReclaimTrustDepositYield',
  },
} as const;

type ActionTDParams = { msgType: 'MsgReclaimTrustDepositYield' };

export function useActionTD( onCancel?: () => void,
                             onRefresh?: (id?: string, txHeight?: number) => void) {
  const veranaChain = useVeranaChain();
  const { address, isWalletConnected } = useChain(veranaChain.chain_name);
  const { notify } = useNotification();
  const sendTx = useSendTxDetectingMode(veranaChain);
  const inFlight = useRef(false);

  const txHeight = useRef<number | undefined>(undefined);

  const handleFailure = () => {
    onCancel?.();
  };

  async function actionTD(params: ActionTDParams, simulate: boolean = false): Promise<DeliverTxResponse | SimulateResult | void> {
    if (!isWalletConnected || !address) {
      await notify(resolveTranslatable({key: "notification.msg.connectwallet"}, translate)??'', 'error');
      return;
    }

    if (inFlight.current) {
      await notify(resolveTranslatable({key: "error.msg.pending.transaction"}, translate)??'', 'error');
      return;
    }

    inFlight.current = true;

    let typeUrl = '';
    let value: MsgReclaimTrustDepositYield;

    switch (params.msgType) {
      case 'MsgReclaimTrustDepositYield': {
        typeUrl = MSG_TYPE_CONFIG_TD.MsgReclaimTrustDepositYield.typeUrl;
        // Reclaim yield is NOT in the de operator-authorization whitelist,
        // but the chain still requires `operator` to be a valid bech32
        // address (it does its own auth check inside the td handler).
        // For self-execution we set operator = corporation = wallet.
        value = MsgReclaimTrustDepositYield.fromPartial({
          corporation: address,
          operator: address,
        });
        break;
      }
      default:
        inFlight.current = false;
        await notify(resolveTranslatable({key: "error.msg.invalid.msgtype"}, translate)??'', 'error');
        return;
    }

    let notifyPromise: Promise<void> = Promise.resolve();
    if (!simulate) {
      notifyPromise = notify(
        MSG_INPROGRESS_ACTION_TD[params.msgType](),
        'inProgress',
        resolveTranslatable({key: 'notification.msg.inprogress.title'}, translate)
      );
    }

    let success = false;

    try {
      const msg: EncodeObject = { typeUrl, value };
      const res = await sendTx({
        msgs: [msg],
        memo: MSG_TYPE_CONFIG_TD[params.msgType].txLabel,
        simulate
      });

      if (simulate) {
        if (!res || typeof res !== "object" || ("transactionHash" in res)) {
          throw new Error("Expected SimulateResult but got tx response/empty result");
        }
        return res as SimulateResult;
      }

      const txRes = res as DeliverTxResponse;

      if (txRes.code === 0) {
        txHeight.current = extractTxHeight(txRes);
        success = true;
        notifyPromise = notify(
          MSG_SUCCESS_ACTION_TD[params.msgType](),
          'success',
          resolveTranslatable({key: 'notification.msg.successful.title'}, translate)
        );
      } else {
        notifyPromise = notify(
          MSG_ERROR_ACTION_TD[params.msgType](txRes.code, txRes.rawLog),
          'error',
          resolveTranslatable({key: 'notification.msg.failed.title'}, translate)
        );
      }
    } catch (err) {
      notifyPromise = notify(
        MSG_ERROR_ACTION_TD[params.msgType](undefined, err instanceof Error ? err.message : String(err)),
        'error',
        resolveTranslatable({key: 'notification.msg.failed.title'}, translate)
      );
    } finally {
      inFlight.current = false;
      if (notifyPromise) await notifyPromise;
      if (success) {
        handleSuccess(onCancel, onRefresh, undefined, txHeight.current);
      } else if (!success) {
        handleFailure();
      }
    }
  }

  return actionTD;
}
