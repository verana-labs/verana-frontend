'use client';

import { useRef } from 'react';
import { DeliverTxResponse} from '@cosmjs/stargate';
import {
  MsgCreateTrustRegistry,
  MsgUpdateTrustRegistry,
  MsgArchiveTrustRegistry,
  MsgAddGovernanceFrameworkDocument,
  MsgIncreaseActiveGovernanceFrameworkVersion
} from 'proto-codecs/codec/verana/tr/v1/tx';
import { useVeranaChain } from '@/hooks/useVeranaChain';
import { useChain } from '@cosmos-kit/react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/ui/common/notification-provider';
import { MSG_ERROR_ACTION_TR, MSG_INPROGRESS_ACTION_TR, MSG_SUCCESS_ACTION_TR } from '@/msg/constants/notificationMsgForMsgType';
import { isValidUrl } from '@/util/validations';
import { EncodeObject } from '@cosmjs/proto-signing';
import { useSendTxDetectingMode } from '@/msg/util/sendTxDetectingMode';
import Long from 'long';
import { translate } from '@/i18n/dataview';
import { resolveTranslatable } from '@/ui/dataview/types';

async function calculateSRIHash (docUrl: string | undefined): Promise<{ sri: string | undefined; error: string | undefined }> {
  if (!docUrl || !isValidUrl(docUrl)) return { sri: undefined, error: 'Invalid Document URL' };
  try {
    const res = await fetch(`/api/sri?url=${encodeURIComponent(docUrl)}`);
    if (!res.ok) {
      return { sri: undefined, error: resolveTranslatable({key: 'error.msg.tr.sri'}, translate) };
    }
    const data = await res.json();
    return { sri: data.sri as string | undefined, error: undefined };
  } catch (err) {
    return { sri: undefined, error: `${resolveTranslatable({key: 'error.msg.tr.sri'}, translate)}. ${err}` };
  }
}

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
  MsgUnarchiveTrustRegistry: {
    typeUrl: '/verana.tr.v1.MsgArchiveTrustRegistry',
    txLabel: 'MsgUnarchiveTrustRegistry',
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
      msgType: 'MsgUnarchiveTrustRegistry';
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
export function useActionTR(  onCancel?: () => void,
                              onRefresh?: () => void) {
  const veranaChain = useVeranaChain();
  const {
    address,
    isWalletConnected,
  } = useChain(veranaChain.chain_name);

  const router = useRouter();
  const { notify } = useNotification();
  const sendTx = useSendTxDetectingMode(veranaChain);
  const inFlight = useRef(false);

  // Handler for Succes: refresh and collapses/hides the action UI
  const handleSuccess = () => {
    console.info('handleSuccess useActionTR', onRefresh);
    onRefresh?.();
    setTimeout( () => { onCancel?.() }, 1000);
  };

  /**
   * Extracts the created Trust Registry ID from a DeliverTxResponse.
   * Prefers the structured `events` field (Cosmos SDK 0.50+).
   * Falls back to parsing `rawLog` as JSON for older SDK versions.
   */
  function extractCreatedTRId(res: DeliverTxResponse): string | undefined {
    // Try reading from the structured events field
    const events = (res as any)?.events as // eslint-disable-line @typescript-eslint/no-explicit-any
      | Array<{ type: string; attributes?: Array<{ key: string; value: string }> }>
      | undefined;

    const idAttr = events
      ?.find((e) => e?.type === 'create_trust_registry')
      ?.attributes?.find((a) => a?.key === 'trust_registry_id');

    if (idAttr?.value) return String(idAttr.value);

    // Fallback: parse rawLog if available and is a string
    const raw = res.rawLog;
    if (typeof raw === 'string') {
      try {
        const logs = JSON.parse(raw); // rawLog is usually an array of log objects
        const allEvents = Array.isArray(logs)
          ? logs.flatMap((l: any) => l?.events ?? []) // eslint-disable-line @typescript-eslint/no-explicit-any
          : [];

        const idAttrRaw = allEvents
          .find((e: any) => e?.type === 'create_trust_registry') // eslint-disable-line @typescript-eslint/no-explicit-any
          ?.attributes?.find((a: any) => a?.key === 'trust_registry_id'); // eslint-disable-line @typescript-eslint/no-explicit-any

        if (idAttrRaw?.value) return String(idAttrRaw.value);
      } catch {
        // Ignore malformed or non-JSON rawLog
      }
    }

    return undefined;
  }

  async function actionTR(params: ActionTRParams): Promise<DeliverTxResponse | void> {
    if (!isWalletConnected || !address) {
      await notify(resolveTranslatable({key: "notification.msg.connectwallet"}, translate)??'', 'error');
      return;
    }
    if (inFlight.current) {
      await notify(resolveTranslatable({key: "error.msg.pending.transaction"}, translate)??'', 'error');
      return;
    }

    let typeUrl = '';
    let value: MsgCreateTrustRegistry | MsgUpdateTrustRegistry | MsgArchiveTrustRegistry | MsgAddGovernanceFrameworkDocument | MsgIncreaseActiveGovernanceFrameworkVersion;
    let id = (params.msgType !== 'MsgCreateTrustRegistry') ? params.id.toString() : undefined;

    switch (params.msgType) {
      case 'MsgCreateTrustRegistry':
        // Calculate SRI hash for docUrl using your API
        const { sri, error } = await calculateSRIHash(params.docUrl);
        if (error) {
          await notify(error,'error');
          return;
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
          id: Long.fromString(String(params.id)),
          did: params.did,
          aka: params.aka,
        });
        break;
      case 'MsgArchiveTrustRegistry':
        typeUrl = MSG_TYPE_CONFIG_TR.MsgArchiveTrustRegistry.typeUrl;
        value = MsgArchiveTrustRegistry.fromPartial({
          creator: address,
          id: Long.fromString(String(params.id)),
          archive: true,
        });
        break;
      case 'MsgUnarchiveTrustRegistry':
        typeUrl = MSG_TYPE_CONFIG_TR.MsgArchiveTrustRegistry.typeUrl;
        value = MsgArchiveTrustRegistry.fromPartial({
          creator: address,
          id: Long.fromString(String(params.id)),
          archive: false,
        });
        break;
      case 'MsgAddGovernanceFrameworkDocument':
        // Calculate SRI hash for docUrl using your API
        const { sri: sriAdd, error: errorAdd } = await calculateSRIHash(params.docUrl);
        if (errorAdd) {
          await notify(errorAdd,'error');
          return;
        } 
        typeUrl = MSG_TYPE_CONFIG_TR.MsgAddGovernanceFrameworkDocument.typeUrl;
        value = MsgAddGovernanceFrameworkDocument.fromPartial({
          creator: address,
          id: Long.fromString(String(params.id)),
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
          id: Long.fromString(String(params.id)),
        });
        break;
      default:
        await notify(resolveTranslatable({key: "error.msg.invalid.msgtype"}, translate)??'', 'error');
        return;
    }

    inFlight.current = true;
    // Show progress notification
    let notifyPromise: Promise<void> = notify(
      MSG_INPROGRESS_ACTION_TR[params.msgType](),
      'inProgress',
      resolveTranslatable({key: 'notification.msg.inprogress.title'}, translate)
    );

    let res: DeliverTxResponse;
    let success = false;

    try {
      const msg: EncodeObject = { typeUrl, value };
      res = await sendTx({
        msgs: [msg],
        memo: MSG_TYPE_CONFIG_TR[params.msgType].txLabel
      });      

      if (res.code === 0) {
        if (params.msgType === 'MsgCreateTrustRegistry') id = extractCreatedTRId(res);
        success = true;
        notifyPromise = notify(
          MSG_SUCCESS_ACTION_TR[params.msgType](),
          'success',
          resolveTranslatable({key: 'notification.msg.successful.title'}, translate)
        );
      } else {
        notifyPromise = notify(
          MSG_ERROR_ACTION_TR[params.msgType](id, res.code, res.rawLog) || `(${res.code}): ${res.rawLog}`,
          'error',
          resolveTranslatable({key: 'notification.msg.failed.title'}, translate)
        );
      }
    } catch (err) {
      notifyPromise = notify(
        MSG_ERROR_ACTION_TR[params.msgType](id, undefined, err instanceof Error ? err.message : String(err)),
        'error',
        resolveTranslatable({key: 'notification.msg.failed.title'}, translate)
      );
    } finally {
      inFlight.current = false;
      if (notifyPromise) await notifyPromise;
      // Refresh on success or fallback
      if (success) {
        if (params.msgType === 'MsgCreateTrustRegistry'){
          const trUrl = `/tr/${id?? ''}`;
          router.push(trUrl);
        }
        else handleSuccess();
      }
    }
  }

  return actionTR;
}
