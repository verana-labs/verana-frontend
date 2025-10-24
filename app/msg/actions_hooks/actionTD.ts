/* Hook for trust-deposit transactions (reclaim deposit or yield) with notification plumbing. */
'use client';

import { useRef, Dispatch, SetStateAction } from 'react';
import { DeliverTxResponse } from '@cosmjs/stargate';
import { useChain } from '@cosmos-kit/react';
import { EncodeObject } from '@cosmjs/proto-signing';
import {
  MsgReclaimTrustDeposit,
  MsgReclaimTrustDepositYield,
} from 'proto-codecs/codec/verana/td/v1/tx';
import { useVeranaChain } from '@/hooks/useVeranaChain';
import { useNotification } from '@/ui/common/notification-provider';
import { useSendTxDetectingMode } from '@/msg/util/sendTxDetectingMode';
import {
  MSG_ERROR_ACTION_TD,
  MSG_INPROGRESS_ACTION_TD,
  MSG_SUCCESS_ACTION_TD,
} from '@/msg/constants/notificationMsgForMsgType';
import { resolveTranslatable } from '@/ui/dataview/types';
import { translate } from '@/i18n/dataview';

// Encapsulate typeUrl and memo label per trust-deposit message type.
export const MSG_TYPE_CONFIG_TD = {
  MsgReclaimTrustDeposit: {
    typeUrl: '/verana.td.v1.MsgReclaimTrustDeposit',
    txLabel: 'MsgReclaimTrustDeposit',
  },
  MsgReclaimTrustDepositYield: {
    typeUrl: '/verana.td.v1.MsgReclaimTrustDepositYield',
    txLabel: 'MsgReclaimTrustDepositYield',
  },
} as const;

// Narrow payload variants required by each trust-deposit action.
type ActionTDParams =
  | {
      msgType: 'MsgReclaimTrustDeposit';
      claimedVNA: number;
    }
  | {
      msgType: 'MsgReclaimTrustDepositYield';
    };

// Build an executor for trust-deposit actions, handling wallet checks and UI refresh triggers.
export function useActionTD(
  setActiveActionId?: Dispatch<SetStateAction<string | null>>,
  setRefresh?: Dispatch<SetStateAction<string | null>>
) {
  const veranaChain = useVeranaChain();
  const { address, isWalletConnected } = useChain(veranaChain.chain_name);
  const { notify } = useNotification();
  const sendTx = useSendTxDetectingMode(veranaChain);
  const inFlight = useRef(false);

  // Refresh caller state once the transaction succeeds.
  const handleSuccess = () => {
    setRefresh?.('actionTD');
    setActiveActionId?.(null);
  };

  // Close the action UI when something goes wrong.
  const handleFailure = () => {
    setActiveActionId?.(null);
  };

  async function actionTD(params: ActionTDParams): Promise<DeliverTxResponse | void> {
    if (!isWalletConnected || !address) {
      await notify(resolveTranslatable({key: "notification.msg.connectwallet"}, translate)??'', 'error');
      return;
    }

    if (inFlight.current) {
      await notify(resolveTranslatable({key: "error.msg.pending.transaction"}, translate)??'', 'error');
      return;
    }

    if (params.msgType === 'MsgReclaimTrustDeposit') {
      if (!Number.isFinite(params.claimedVNA) || params.claimedVNA <= 0) {
        await notify(resolveTranslatable({key: "error.msg.td.claimed"}, translate)??'', 'error');
        return;
      }
    }

    inFlight.current = true;

    let typeUrl = '';
    let value: MsgReclaimTrustDeposit | MsgReclaimTrustDepositYield;
    let claimedLabel: string | undefined;

    switch (params.msgType) {
      case 'MsgReclaimTrustDeposit': {
        const claimedUvna = Math.round(params.claimedVNA * 1_000_000);
        typeUrl = MSG_TYPE_CONFIG_TD.MsgReclaimTrustDeposit.typeUrl;
        value = MsgReclaimTrustDeposit.fromPartial({
          creator: address,
          claimed: claimedUvna,
        });
        claimedLabel = `${params.claimedVNA} VNA`;
        break;
      }
      case 'MsgReclaimTrustDepositYield': {
        typeUrl = MSG_TYPE_CONFIG_TD.MsgReclaimTrustDepositYield.typeUrl;
        value = MsgReclaimTrustDepositYield.fromPartial({
          creator: address,
        });
        break;
      }
      default:
        inFlight.current = false;
        await notify(resolveTranslatable({key: "error.msg.invalid.msgtype"}, translate)??'', 'error');
        return;
    }

    let notifyPromise: Promise<void> = notify(
      MSG_INPROGRESS_ACTION_TD[params.msgType](),
      'inProgress',
      resolveTranslatable({key: 'notification.msg.inprogress.title'}, translate)
    );

    let res: DeliverTxResponse | undefined;
    let success = false;

    try {
      const msg: EncodeObject = { typeUrl, value };
      res = await sendTx({
        msgs: [msg],
        memo: MSG_TYPE_CONFIG_TD[params.msgType].txLabel,
      });

      if (res.code === 0) {
        success = true;
        notifyPromise = notify(
          MSG_SUCCESS_ACTION_TD[params.msgType](claimedLabel),
          'success',
          resolveTranslatable({key: 'notification.msg.successful.title'}, translate)
        );
      } else {
        notifyPromise = notify(
          MSG_ERROR_ACTION_TD[params.msgType](res.code, res.rawLog),
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
      if (success && res) {
        handleSuccess();
      } else if (!success) {
        handleFailure();
      }
    }

    return res;
  }

  return actionTD;
}
