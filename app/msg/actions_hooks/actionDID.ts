/* Hook orchestrating the lifecycle of DID transactions (add, renew, touch, remove). */
'use client';

import { useNotification } from '@/providers/notification-provider';
import { resolveTranslatable } from '@/ui/dataview/types';
import { translate } from '@/i18n/dataview';
import { SimulateResult } from '@/msg/util/signAndBroadcastManualAmino';

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
  onClose?: () => void,
  onRefresh?: () => void,
  onBack?: () => void
) {
  const { notify } = useNotification();

  async function actionDID(_params: ActionDIDParams, _simulate: boolean = false): Promise<SimulateResult | void> {
    await notify(
      resolveTranslatable({ key: 'did.unavailable.description' }, translate) ??
        'DID actions are temporarily unavailable on Verana v0.10.x.',
      'error'
    );
    onRefresh?.();
    onClose?.();
    onBack?.();
    return;
  }

  return actionDID;
}
