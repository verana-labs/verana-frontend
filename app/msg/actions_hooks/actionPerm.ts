'use client';

import { useRef } from 'react';
import { DeliverTxResponse } from '@cosmjs/stargate';
import {
  MsgStartPermissionVP,
  MsgRenewPermissionVP,
  MsgSetPermissionVPToValidated,
  MsgCancelPermissionVPLastRequest,
  MsgCreateRootPermission,
  MsgExtendPermission,
  MsgRevokePermission,
  MsgCreateOrUpdatePermissionSession,
  MsgSlashPermissionTrustDeposit,
  MsgRepayPermissionSlashedTrustDeposit,
  MsgCreatePermission,
} from 'proto-codecs/codec/verana/perm/v1/tx';

import { PermissionType } from 'proto-codecs/codec/verana/perm/v1/types';

import { useVeranaChain } from '@/hooks/useVeranaChain';
import { useChain } from '@cosmos-kit/react';
import { useNotification } from '@/ui/common/notification-provider';
import {
  MSG_ERROR_ACTION_PERM,
  MSG_INPROGRESS_ACTION_PERM,
  MSG_SUCCESS_ACTION_PERM,
} from '@/msg/constants/notificationMsgForMsgType';
import { EncodeObject } from '@cosmjs/proto-signing';
import { useSendTxDetectingMode } from '@/msg/util/sendTxDetectingMode';
import Long from 'long';
import { translate } from '@/i18n/dataview';
import { resolveTranslatable } from '@/ui/dataview/types';

const toDate = (v?: string | Date) => (v ? (v instanceof Date ? v : new Date(v)) : undefined);

export const MSG_TYPE_CONFIG_PERM = {
  MsgStartPermissionVP: {
    typeUrl: '/verana.perm.v1.MsgStartPermissionVP',
    txLabel: 'MsgStartPermissionVP',
  },
  MsgRenewPermissionVP: {
    typeUrl: '/verana.perm.v1.MsgRenewPermissionVP',
    txLabel: 'MsgRenewPermissionVP',
  },
  MsgSetPermissionVPToValidated: {
    typeUrl: '/verana.perm.v1.MsgSetPermissionVPToValidated',
    txLabel: 'MsgSetPermissionVPToValidated',
  },
  MsgCancelPermissionVPLastRequest: {
    typeUrl: '/verana.perm.v1.MsgCancelPermissionVPLastRequest',
    txLabel: 'MsgCancelPermissionVPLastRequest',
  },
  MsgCreateRootPermission: {
    typeUrl: '/verana.perm.v1.MsgCreateRootPermission',
    txLabel: 'MsgCreateRootPermission',
  },
  MsgExtendPermission: {
    typeUrl: '/verana.perm.v1.MsgExtendPermission',
    txLabel: 'MsgExtendPermission',
  },
  MsgRevokePermission: {
    typeUrl: '/verana.perm.v1.MsgRevokePermission',
    txLabel: 'MsgRevokePermission',
  },
  MsgCreateOrUpdatePermissionSession: {
    typeUrl: '/verana.perm.v1.MsgCreateOrUpdatePermissionSession',
    txLabel: 'MsgCreateOrUpdatePermissionSession',
  },
  MsgSlashPermissionTrustDeposit: {
    typeUrl: '/verana.perm.v1.MsgSlashPermissionTrustDeposit',
    txLabel: 'MsgSlashPermissionTrustDeposit',
  },
  MsgRepayPermissionSlashedTrustDeposit: {
    typeUrl: '/verana.perm.v1.MsgRepayPermissionSlashedTrustDeposit',
    txLabel: 'MsgRepayPermissionSlashedTrustDeposit',
  },
  MsgCreatePermission: {
    typeUrl: '/verana.perm.v1.MsgCreatePermission',
    txLabel: 'MsgCreatePermission',
  },
} as const;

/** Union type for action parameters */
type ActionPermParams =
  | {
      msgType: 'MsgStartPermissionVP';
      creator: string;
      type: PermissionType | number;
      validatorPermId: string | number;
      country: string;
      did?: string;
    }
  | {
      msgType: 'MsgRenewPermissionVP';
      creator: string;
      id: string | number;
    }
  | {
      msgType: 'MsgSetPermissionVPToValidated';
      creator: string;
      id: string | number;
      effectiveUntil?: string | Date;
      validationFees: string | number;
      issuanceFees: string | number;
      verificationFees: string | number;
      country: string;
      vpSummaryDigestSri: string;
    }
  | {
      msgType: 'MsgCancelPermissionVPLastRequest';
      creator: string;
      id: string | number;
    }
  | {
      msgType: 'MsgCreateRootPermission';
      creator: string;
      schemaId: string | number;
      did: string;
      country: string;
      effectiveFrom?: string | Date;
      effectiveUntil?: string | Date;
      validationFees: string | number;
      issuanceFees: string | number;
      verificationFees: string | number;
    }
  | {
      msgType: 'MsgExtendPermission';
      creator: string;
      id: string | number;
      effectiveUntil?: string | Date;
    }
  | {
      msgType: 'MsgRevokePermission';
      creator: string;
      id: string | number;
    }
  | {
      msgType: 'MsgCreateOrUpdatePermissionSession';
      creator: string;
      id: string; // UUID
      issuerPermId: string | number;
      verifierPermId: string | number;
      agentPermId: string | number;
      walletAgentPermId: string | number;
    }
  | {
      msgType: 'MsgSlashPermissionTrustDeposit';
      creator: string;
      id: string | number;
      amount: string | number;
    }
  | {
      msgType: 'MsgRepayPermissionSlashedTrustDeposit';
      creator: string;
      id: string | number;
    }
  | {
      msgType: 'MsgCreatePermission';
      creator: string;
      schemaId: string | number;
      type: PermissionType | number;
      did: string;
      country: string;
      effectiveFrom?: string | Date;
      effectiveUntil?: string | Date;
      verificationFees: string | number;
      validationFees: string | number;
    };

/**
 * Hook to execute Permission module transactions and show notifications
 */
export function useActionPerm(onCancel?: () => void, onRefresh?: () => void) {
  const veranaChain = useVeranaChain();
  const { address, isWalletConnected } = useChain(veranaChain.chain_name);

  const { notify } = useNotification();
  const sendTx = useSendTxDetectingMode(veranaChain);
  const inFlight = useRef(false);

  /** Success handler: refresh and collapses/hides the action UI */
  const handleSuccess = () => {
    onRefresh?.();
    console.info('handleSuccess useActionPerm');
    setTimeout(() => {
      onCancel?.();
    }, 1000);
  };

  /**
   * Extracts a created permission ID from a DeliverTxResponse.
   * Prefers the structured `events` field (Cosmos SDK 0.50+).
   * Falls back to parsing `rawLog` as JSON for older SDK versions.
   *
   * NOTE: Event names/keys can vary by module implementation; this helper tries common patterns.
   */
  function extractCreatedPermissionId(res: DeliverTxResponse): string | undefined {
    const tryFind = (allEvents: Array<{ type: string; attributes?: Array<{ key: string; value: string }> }>) => {
      const eventTypes = [
        'start_permission_vp',
        'create_permission',
        'create_root_permission',
        'permission_created',
      ];

      const keys = ['permission_id', 'id', 'perm_id'];

      for (const et of eventTypes) {
        const ev = allEvents.find((e) => e?.type === et);
        const attrs = ev?.attributes ?? [];
        for (const k of keys) {
          const hit = attrs.find((a) => a?.key === k);
          if (hit?.value) return String(hit.value);
        }
      }
      return undefined;
    };

    // 1) Structured events
    const events = (res as any)?.events as // eslint-disable-line @typescript-eslint/no-explicit-any
      | Array<{ type: string; attributes?: Array<{ key: string; value: string }> }>
      | undefined;

    const fromEvents = events ? tryFind(events) : undefined;
    if (fromEvents) return fromEvents;

    // 2) rawLog fallback
    const raw = res.rawLog;
    if (typeof raw === 'string') {
      try {
        const logs = JSON.parse(raw);
        const allEvents = Array.isArray(logs)
          ? logs.flatMap((l: any) => l?.events ?? []) // eslint-disable-line @typescript-eslint/no-explicit-any
          : [];
        const fromRaw = tryFind(allEvents);
        if (fromRaw) return fromRaw;
      } catch {
        // ignore malformed/non-JSON rawLog
      }
    }

    return undefined;
  }

  async function actionPerm(params: ActionPermParams): Promise<DeliverTxResponse | void> {
    if (!isWalletConnected || !address) {
      await notify(resolveTranslatable({ key: 'notification.msg.connectwallet' }, translate) ?? '', 'error');
      return;
    }
    if (inFlight.current) {
      await notify(resolveTranslatable({ key: 'error.msg.pending.transaction' }, translate) ?? '', 'error');
      return;
    }

    let typeUrl = '';
    let value:
      | MsgStartPermissionVP
      | MsgRenewPermissionVP
      | MsgSetPermissionVPToValidated
      | MsgCancelPermissionVPLastRequest
      | MsgCreateRootPermission
      | MsgExtendPermission
      | MsgRevokePermission
      | MsgCreateOrUpdatePermissionSession
      | MsgSlashPermissionTrustDeposit
      | MsgRepayPermissionSlashedTrustDeposit
      | MsgCreatePermission;

    // Use this to display a meaningful ID in notifications (when applicable)
    let id: string | undefined =
      params.msgType === 'MsgStartPermissionVP' ||
      params.msgType === 'MsgCreateRootPermission' ||
      params.msgType === 'MsgCreatePermission'
        ? undefined
        : (params as any).id?.toString(); // eslint-disable-line @typescript-eslint/no-explicit-any

    switch (params.msgType) {
      case 'MsgStartPermissionVP':
        typeUrl = MSG_TYPE_CONFIG_PERM.MsgStartPermissionVP.typeUrl;
        value = MsgStartPermissionVP.fromPartial({
          creator: address,
          type: params.type, 
          validatorPermId: Long.fromString(String(params.validatorPermId)),
          country: params.country,
          did: params.did ?? '',
        });
        break;

      case 'MsgRenewPermissionVP':
        typeUrl = MSG_TYPE_CONFIG_PERM.MsgRenewPermissionVP.typeUrl;
        value = MsgRenewPermissionVP.fromPartial({
          creator: address,
          id: Long.fromString(String(params.id)),
        });
        break;

      case 'MsgSetPermissionVPToValidated':
        typeUrl = MSG_TYPE_CONFIG_PERM.MsgSetPermissionVPToValidated.typeUrl;
        value = MsgSetPermissionVPToValidated.fromPartial({
          creator: address,
          id: Long.fromString(String(params.id)),
          effectiveUntil: toDate(params.effectiveUntil),
          validationFees: Long.fromString(String(params.validationFees)),
          issuanceFees: Long.fromString(String(params.issuanceFees)),
          verificationFees: Long.fromString(String(params.verificationFees)),
          country: params.country,
          vpSummaryDigestSri: params.vpSummaryDigestSri,
        });
        break;

      case 'MsgCancelPermissionVPLastRequest':
        typeUrl = MSG_TYPE_CONFIG_PERM.MsgCancelPermissionVPLastRequest.typeUrl;
        value = MsgCancelPermissionVPLastRequest.fromPartial({
          creator: address,
          id: Long.fromString(String(params.id)),
        });
        break;

      case 'MsgCreateRootPermission':
        typeUrl = MSG_TYPE_CONFIG_PERM.MsgCreateRootPermission.typeUrl;
        value = MsgCreateRootPermission.fromPartial({
          creator: address,
          schemaId: Long.fromString(String(params.schemaId)),
          did: params.did,
          country: params.country,
          effectiveFrom: toDate(params.effectiveFrom),
          effectiveUntil: toDate(params.effectiveUntil),
          validationFees: Long.fromString(String(params.validationFees)),
          issuanceFees: Long.fromString(String(params.issuanceFees)),
          verificationFees: Long.fromString(String(params.verificationFees)),
        });
        break;

      case 'MsgExtendPermission':
        typeUrl = MSG_TYPE_CONFIG_PERM.MsgExtendPermission.typeUrl;
        value = MsgExtendPermission.fromPartial({
          creator: address,
          id: Long.fromString(String(params.id)),
          effectiveUntil: toDate(params.effectiveUntil),
        });
        break;

      case 'MsgRevokePermission':
        typeUrl = MSG_TYPE_CONFIG_PERM.MsgRevokePermission.typeUrl;
        value = MsgRevokePermission.fromPartial({
          creator: address,
          id: Long.fromString(String(params.id)),
        });
        break;

      case 'MsgCreateOrUpdatePermissionSession':
        typeUrl = MSG_TYPE_CONFIG_PERM.MsgCreateOrUpdatePermissionSession.typeUrl;
        value = MsgCreateOrUpdatePermissionSession.fromPartial({
          creator: address,
          id: params.id,
          issuerPermId: Long.fromString(String(params.issuerPermId)),
          verifierPermId: Long.fromString(String(params.verifierPermId)),
          agentPermId: Long.fromString(String(params.agentPermId)),
          walletAgentPermId: Long.fromString(String(params.walletAgentPermId)),
        });
        break;

      case 'MsgSlashPermissionTrustDeposit':
        typeUrl = MSG_TYPE_CONFIG_PERM.MsgSlashPermissionTrustDeposit.typeUrl;
        value = MsgSlashPermissionTrustDeposit.fromPartial({
          creator: address,
          id: Long.fromString(String(params.id)),
          amount: Long.fromString(String(params.amount)),
        });
        break;

      case 'MsgRepayPermissionSlashedTrustDeposit':
        typeUrl = MSG_TYPE_CONFIG_PERM.MsgRepayPermissionSlashedTrustDeposit.typeUrl;
        value = MsgRepayPermissionSlashedTrustDeposit.fromPartial({
          creator: address,
          id: Long.fromString(String(params.id)),
        });
        break;

      case 'MsgCreatePermission':
        typeUrl = MSG_TYPE_CONFIG_PERM.MsgCreatePermission.typeUrl;
        value = MsgCreatePermission.fromPartial({
          creator: address,
          schemaId: Long.fromString(String(params.schemaId)),
          type: params.type,
          did: params.did,
          country: params.country,
          effectiveFrom: toDate(params.effectiveFrom),
          effectiveUntil: toDate(params.effectiveUntil),
          verificationFees: Long.fromString(String(params.verificationFees)),
          validationFees: Long.fromString(String(params.validationFees)),
        });
        break;

      default:
        await notify(resolveTranslatable({ key: 'error.msg.invalid.msgtype' }, translate) ?? '', 'error');
        return;
    }

    inFlight.current = true;

    // Show in-progress notification
    let notifyPromise: Promise<void> = notify(
      MSG_INPROGRESS_ACTION_PERM[params.msgType](),
      'inProgress',
      resolveTranslatable({ key: 'notification.msg.inprogress.title' }, translate),
    );

    let res: DeliverTxResponse;
    let success = false;

    try {
      const msg: EncodeObject = { typeUrl, value };
      res = await sendTx({
        msgs: [msg],
        memo: MSG_TYPE_CONFIG_PERM[params.msgType].txLabel,
      });

      if (res.code === 0) {
        // Try to extract ID for create-like txs (or if you want it for others too)
        if (
          params.msgType === 'MsgStartPermissionVP' ||
          params.msgType === 'MsgCreateRootPermission' ||
          params.msgType === 'MsgCreatePermission'
        ) {
          id = extractCreatedPermissionId(res);
        }

        success = true;
        notifyPromise = notify(
          MSG_SUCCESS_ACTION_PERM[params.msgType](),
          'success',
          resolveTranslatable({ key: 'notification.msg.successful.title' }, translate),
        );
      } else {
        notifyPromise = notify(
          MSG_ERROR_ACTION_PERM[params.msgType](id, res.code, res.rawLog) || `(${res.code}): ${res.rawLog}`,
          'error',
          resolveTranslatable({ key: 'notification.msg.failed.title' }, translate),
        );
      }
    } catch (err) {
      notifyPromise = notify(
        MSG_ERROR_ACTION_PERM[params.msgType](id, undefined, err instanceof Error ? err.message : String(err)),
        'error',
        resolveTranslatable({ key: 'notification.msg.failed.title' }, translate),
      );
    } finally {
      inFlight.current = false;
      if (notifyPromise) await notifyPromise;

      // Refresh on success (or redirect for create-like flows)
      if (success) {
          handleSuccess();
      }
    }
  }

  return actionPerm;
}