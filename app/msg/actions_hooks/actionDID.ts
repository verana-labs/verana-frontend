/* Hook orchestrating the lifecycle of DID transactions (add, renew, touch, remove). */
'use client';

import { useNotification } from '@/providers/notification-provider';
import { resolveTranslatable } from '@/ui/dataview/types';
import { translate } from '@/i18n/dataview';
import { SimulateResult } from '@/msg/util/signAndBroadcastManualAmino';

type ActionDIDParams =
  | { msgType: 'MsgAddDID'; did: string; years: number }
  | { msgType: 'MsgRenewDID'; did: string; years: number }
  | { msgType: 'MsgTouchDID'; did: string }
  | { msgType: 'MsgRemoveDID'; did: string };

export function useActionDID(
  onClose?: () => void,
  onRefresh?: () => void,
  onBack?: () => void
) {
  const { notify } = useNotification();

  async function actionDID(_params: ActionDIDParams, _simulate: boolean = false): Promise<SimulateResult | void> {
    // DID directory module (`dd`) was removed in verana v0.10.x; no signing
    // path exists. Fire only the cancel callback so the action UI collapses
    await notify(
      resolveTranslatable({ key: 'did.unavailable.description' }, translate) ??
        'DID actions are temporarily unavailable on Verana v0.10.x.',
      'error'
    );
    onClose?.();
    return;
  }
  void onRefresh;
  void onBack;

  return actionDID;
}
