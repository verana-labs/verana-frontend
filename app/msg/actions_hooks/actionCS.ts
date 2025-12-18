'use client';

import { useRef } from 'react';
import { DeliverTxResponse } from '@cosmjs/stargate';
import {
  MsgCreateCredentialSchema,
  MsgUpdateCredentialSchema,
  MsgArchiveCredentialSchema,
} from 'proto-codecs/codec/verana/cs/v1/tx';
import { useVeranaChain } from '@/hooks/useVeranaChain';
import { useChain } from '@cosmos-kit/react';
import { useNotification } from '@/ui/common/notification-provider';
import {
  MSG_ERROR_ACTION_CS,
  MSG_INPROGRESS_ACTION_CS,
  MSG_SUCCESS_ACTION_CS,
} from '@/msg/constants/notificationMsgForMsgType';
import Long from 'long';
import { EncodeObject } from '@cosmjs/proto-signing';
import { useSendTxDetectingMode } from '@/msg/util/sendTxDetectingMode';
import { hasValidCredentialSchemaId, MSG_SCHEMA_ID, normalizeJsonSchema } from '@/util/json_schema_util';
import { resolveTranslatable } from '@/ui/dataview/types';
import { translate } from '@/i18n/dataview';
// import { sanitizeProtoMsg } from '../util/sanitizeProtoMsg';
import { fromOptU32Amino, pickOptionalUInt32 } from '@/util/aminoHelpers';

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
      trId: string | number | Long;
      jsonSchema: string;
      issuerGrantorValidationValidityPeriod?: number;
      verifierGrantorValidationValidityPeriod?: number;
      issuerValidationValidityPeriod?: number;
      verifierValidationValidityPeriod?: number;
      holderValidationValidityPeriod?: number;
      issuerPermManagementMode: number;
      verifierPermManagementMode: number;
    }
  | {
      msgType: 'MsgUpdateCredentialSchema';
      id: string | number | Long;
      issuerGrantorValidationValidityPeriod?: number;
      verifierGrantorValidationValidityPeriod?: number;
      issuerValidationValidityPeriod?: number;
      verifierValidationValidityPeriod?: number;
      holderValidationValidityPeriod?: number;
    }
  | {
      msgType: 'MsgArchiveCredentialSchema';
      id: string | number | Long;
    };

// Hook to execute Credential Schema transactions + notifications
export function useActionCS( onCancel?: () => void,
                             onRefresh?: () => void) {
  const veranaChain = useVeranaChain();
  const { address, isWalletConnected } = useChain(veranaChain.chain_name);

  const { notify } = useNotification();
  const sendTx = useSendTxDetectingMode(veranaChain);

  // Prevents parallel broadcasts with the same account (avoids sequence mismatch errors)
  const inFlight = useRef(false);

  // Handler for Succes: refresh and collapses/hides the action UI
  const handleSuccess = () => {
    onRefresh?.();
    console.info('handleSuccess useActionCS');
    setTimeout( () => { onCancel?.() }, 1000);
  };

  /**
   * Helper to extract the created credential schema ID from DeliverTxResponse.
   * It first tries `res.events` (if available in the response),
   * and falls back to parsing `rawLog` if necessary.
   */
  function extractCreatedCSId(res: DeliverTxResponse): string | undefined {
    // Prefer structured events (Cosmos SDK 0.50+). rawLog is deprecated.
    const ev = (res as any)?.events?.find( (e: any) => e?.type === 'create_credential_schema'); // eslint-disable-line @typescript-eslint/no-explicit-any
    const idAttr = ev?.attributes?.find( (a: any) => a?.key === 'credential_schema_id'); // eslint-disable-line @typescript-eslint/no-explicit-any
    if (idAttr?.value) return String(idAttr.value);

    // Fallback: try parsing rawLog only if it's a string (older chains/SDKs)
    const raw = res.rawLog;
    if (typeof raw === 'string') {
      try {
        const logs = JSON.parse(raw); // usually an array of log objects
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allEvents = Array.isArray(logs)
          ? logs.flatMap((l: any) => l?.events ?? []) // eslint-disable-line @typescript-eslint/no-explicit-any
          : [];
        const ev2 = allEvents.find((e: any) => e?.type === 'create_credential_schema'); // eslint-disable-line @typescript-eslint/no-explicit-any
        const idAttr2 = ev2?.attributes?.find(
          (a: any) => a?.key === 'credential_schema_id' // eslint-disable-line @typescript-eslint/no-explicit-any
        );
        if (idAttr2?.value) return String(idAttr2.value);
      } catch {
        // Ignore malformed/non-JSON rawLog
      }
    }

    return undefined;
  }

  async function actionCS(params: ActionCSParams): Promise<DeliverTxResponse | void> {
    if (!isWalletConnected || !address) {
      await notify(resolveTranslatable({key: "notification.msg.connectwallet"}, translate)??'', 'error');
      return;
    }

    if (params.msgType === 'MsgCreateCredentialSchema') {
      try {
        const parsedSchema = JSON.parse(params.jsonSchema);
        if (!hasValidCredentialSchemaId(parsedSchema)) {
          await notify(`${resolveTranslatable({key: "error.msg.cs.create.schema.id"}, translate)} ${MSG_SCHEMA_ID}`, 'error');
          return;
        }
      } catch {
        await notify(resolveTranslatable({key: "error.msg.cs.create.schema.id"}, translate)??'', 'error');
        return;
      }
    }
    if (inFlight.current) {
      await notify(resolveTranslatable({key: "error.msg.pending.transaction"}, translate)??'', 'error');
      return;
    }
    inFlight.current = true;

    let typeUrl = '';
    let value: MsgCreateCredentialSchema | MsgUpdateCredentialSchema | MsgArchiveCredentialSchema;
    let id = (params.msgType !== 'MsgCreateCredentialSchema') ? params.id?.toString() : undefined;

    switch (params.msgType) {
      case 'MsgCreateCredentialSchema': {
        typeUrl = MSG_TYPE_CONFIG_CS.MsgCreateCredentialSchema.typeUrl;
        value = MsgCreateCredentialSchema.fromPartial({
          creator: address, // always use the connected wallet address
          trId: Long.fromValue(params.trId), // uint64
          jsonSchema: normalizeJsonSchema(params.jsonSchema),
          issuerGrantorValidationValidityPeriod: fromOptU32Amino(params.issuerGrantorValidationValidityPeriod),
          verifierGrantorValidationValidityPeriod: fromOptU32Amino(params.verifierGrantorValidationValidityPeriod),
          issuerValidationValidityPeriod: fromOptU32Amino(params.issuerValidationValidityPeriod),
          verifierValidationValidityPeriod: fromOptU32Amino(params.verifierValidationValidityPeriod),
          holderValidationValidityPeriod: fromOptU32Amino(params.holderValidationValidityPeriod),
          issuerPermManagementMode: params.issuerPermManagementMode,
          verifierPermManagementMode: params.verifierPermManagementMode,
        });
        break;
      }

      case 'MsgUpdateCredentialSchema': {
        typeUrl = MSG_TYPE_CONFIG_CS.MsgUpdateCredentialSchema.typeUrl;
        value = MsgUpdateCredentialSchema.fromPartial({
          creator: address, // always use the connected wallet address
          id: Long.fromValue(params.id), // uint64
          issuerGrantorValidationValidityPeriod: pickOptionalUInt32(params.issuerGrantorValidationValidityPeriod),
          verifierGrantorValidationValidityPeriod: pickOptionalUInt32(params.verifierGrantorValidationValidityPeriod),
          issuerValidationValidityPeriod: pickOptionalUInt32(params.issuerValidationValidityPeriod),
          verifierValidationValidityPeriod: pickOptionalUInt32(params.verifierValidationValidityPeriod),
          holderValidationValidityPeriod: pickOptionalUInt32(params.holderValidationValidityPeriod),
        });
        break;
      }

      case 'MsgArchiveCredentialSchema': {
        typeUrl = MSG_TYPE_CONFIG_CS.MsgArchiveCredentialSchema.typeUrl;
        value = MsgArchiveCredentialSchema.fromPartial({
          creator: address,
          id: Long.fromValue(params.id), // uint64
          archive: true,
        });
        break;
      }

      default:
        await notify(resolveTranslatable({key: "error.msg.invalid.msgtype"}, translate)??'', 'error');
        return;
    }

    // Show "in progress" notification
    let notifyPromise: Promise<void> = notify(
      // MSG_INPROGRESS_ACTION_CS[params.msgType],
      MSG_INPROGRESS_ACTION_CS[params.msgType](),
      'inProgress',
      resolveTranslatable({key: 'notification.msg.inprogress.title'}, translate)
    );

    let res: DeliverTxResponse;
    let success = false;

    try {

      const msg: EncodeObject = { typeUrl, value };
      // console.info(msg);
      // const msgSanitized = sanitizeProtoMsg(msg);

      res = await sendTx({
        // msgs: [msgSanitized],
        msgs: [msg],
        memo: MSG_TYPE_CONFIG_CS[params.msgType].txLabel
      });      

      if (res.code === 0) {
        console.info("DeliverTxResponse: ", res);
        if (params.msgType === 'MsgCreateCredentialSchema') id = extractCreatedCSId(res);        
        if (id) sessionStorage.setItem('id_updated', id);
        success = true;
        notifyPromise = notify(
          MSG_SUCCESS_ACTION_CS[params.msgType](),
          'success',
          resolveTranslatable({key: 'notification.msg.successful.title'}, translate)
        );
      } else {
        notifyPromise =  notify(
          MSG_ERROR_ACTION_CS[params.msgType](id, res.code, res.rawLog) || `(${res.code}): ${res.rawLog}`,
          'error',
          resolveTranslatable({key: 'notification.msg.failed.title'}, translate)
        );
      }

    } catch (err) {
      notifyPromise =  notify(
        MSG_ERROR_ACTION_CS[params.msgType](id, undefined, err instanceof Error ? err.message : String(err)),
        'error',
        resolveTranslatable({key: 'notification.msg.failed.title'}, translate)
      );
    } finally {
      inFlight.current = false;
      if (notifyPromise) await notifyPromise;
      // Refresh on success or fallback
      if (success) {
        handleSuccess();
      }
    }
  }

  return actionCS;
}
