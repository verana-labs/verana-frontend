'use client';

import { useRef } from 'react';
import { DeliverTxResponse } from '@cosmjs/stargate';
import {
  MsgStartPermissionVP,
  MsgRenewPermissionVP,
  MsgSetPermissionVPToValidated,
  MsgCancelPermissionVPLastRequest,
  MsgCreateRootPermission,
  MsgAdjustPermission,
  MsgRevokePermission,
  MsgCreateOrUpdatePermissionSession,
  MsgSlashPermissionTrustDeposit,
  MsgRepayPermissionSlashedTrustDeposit,
  MsgCreatePermission,
} from '@codec-proto/verana/perm/v1/tx';
import { PermissionType } from '@codec-proto/verana/perm/v1/types';
import { useVeranaChain } from '@/hooks/useVeranaChain';
import { useChain } from '@cosmos-kit/react';
import { useNotification } from '@/providers/notification-provider';
import {
  MSG_ERROR_ACTION_PERM,
  MSG_INPROGRESS_ACTION_PERM,
  MSG_SUCCESS_ACTION_PERM,
} from '@/msg/constants/notificationMsgForMsgType';
import { EncodeObject } from '@cosmjs/proto-signing';
import { useSendTxDetectingMode } from '@/msg/util/sendTxDetectingMode';
import { translate } from '@/i18n/dataview';
import { resolveTranslatable } from '@/ui/dataview/types';
import { extractTxHeight, handleSuccess, stripZerosUndefinedAndEmptyStrings } from '@/msg/util/signerUtil'
import { SimulateResult } from '@/msg/util/signAndBroadcastManualAmino';

const toDate = (v?: string | Date) => (v ? (v instanceof Date ? v : new Date(v)) : undefined);
const toNumber = (v?: string | number) => (v == null || v === '' ? 0 : Number(v));
const pickOptionalUInt64 = (v?: string | number) => {
  const numeric = toNumber(v);
  return numeric > 0 ? { value: numeric } : undefined;
};

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
  MsgAdjustPermission: {
    typeUrl: '/verana.perm.v1.MsgAdjustPermission',
    txLabel: 'MsgAdjustPermission',
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
export type ActionPermParams =
  | {
      msgType: 'MsgStartPermissionVP';
      authority?: string;
      type: string;
      validatorPermId: string | number;
      did?: string;
      validationFees?: string | number;
      issuanceFees?: string | number;
      verificationFees?: string | number;
    }
| {
      msgType: 'MsgCreatePermission';
      authority?: string;
      validatorPermId: string | number;
      type: string;
      did: string;
      effectiveFrom?: string | Date;
      effectiveUntil?: string | Date;
      validationFees: string | number;
      verificationFees: string | number;
    }
| {
      msgType: 'MsgCreateRootPermission';
      authority?: string;
      schemaId: string | number;
      did: string;
      effectiveFrom?: string | Date;
      effectiveUntil?: string | Date;
      validationFees: string | number;
      issuanceFees: string | number;
      verificationFees: string | number;
    }
  | {
      msgType: 'MsgRenewPermissionVP';
      authority?: string;
      id: string | number;
    }
  | {
      msgType: 'MsgSetPermissionVPToValidated';
      authority?: string;
      id: string | number;
      effectiveUntil?: string | Date;
      validationFees: string | number;
      issuanceFees: string | number;
      verificationFees: string | number;
      vpSummaryDigestSri: string;
    }
  | {
      msgType: 'MsgCancelPermissionVPLastRequest';
      authority?: string;
      id: string | number;
    }
  | {
      msgType: 'MsgAdjustPermission';
      authority?: string;
      id: string | number;
      effectiveUntil?: string | Date;
    }
  | {
      msgType: 'MsgRevokePermission';
      authority?: string;
      id: string | number;
    }
  | {
      msgType: 'MsgCreateOrUpdatePermissionSession';
      authority?: string;
      id: string; // UUID
      issuerPermId: string | number;
      verifierPermId: string | number;
      agentPermId: string | number;
      walletAgentPermId: string | number;
      digest?: string;
    }
  | {
      msgType: 'MsgSlashPermissionTrustDeposit';
      authority?: string;
      id: string | number;
      amount: string | number;
    }
  | {
      msgType: 'MsgRepayPermissionSlashedTrustDeposit';
      authority?: string;
      id: string | number;
    };

/**
 * Hook to execute Permission module transactions and show notifications
 */
export function useActionPerm( onCancel?: () => void,
                               onRefresh?: (id?: string, txHeight?: number) => void) {
  const veranaChain = useVeranaChain();
  const { address, isWalletConnected } = useChain(veranaChain.chain_name);

  const { notify } = useNotification();
  const sendTx = useSendTxDetectingMode(veranaChain);
  const inFlight = useRef(false);
  
  const txHeight = useRef<number | undefined>(undefined);

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

  async function actionPerm(params: ActionPermParams, simulate: boolean = false): Promise<DeliverTxResponse | SimulateResult | void> {
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
      | MsgAdjustPermission
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
    const authority = params.authority ?? address;

    switch (params.msgType) {
      case 'MsgStartPermissionVP':
        typeUrl = MSG_TYPE_CONFIG_PERM.MsgStartPermissionVP.typeUrl;
        value = MsgStartPermissionVP.fromPartial({
          authority,
          operator: address,
          type: permissionTypeFromString(params.type),
          validatorPermId: toNumber(params.validatorPermId),
          did: params.did ?? '',
          validationFees: pickOptionalUInt64(params.validationFees),
          issuanceFees: pickOptionalUInt64(params.issuanceFees),
          verificationFees: pickOptionalUInt64(params.verificationFees),
          vsOperator: '',
          vsOperatorAuthzEnabled: false,
          vsOperatorAuthzSpendLimit: [],
          vsOperatorAuthzWithFeegrant: false,
          vsOperatorAuthzFeeSpendLimit: [],
          vsOperatorAuthzSpendPeriod: undefined,
        });
        break;

      case 'MsgCreatePermission':
        typeUrl = MSG_TYPE_CONFIG_PERM.MsgCreatePermission.typeUrl;
        value = MsgCreatePermission.fromPartial({
          authority,
          operator: address,
          validatorPermId: toNumber(params.validatorPermId),
          type: permissionTypeFromString(params.type),
          did: params.did,
          effectiveFrom: toDate(params.effectiveFrom),
          effectiveUntil: toDate(params.effectiveUntil),
          verificationFees: toNumber(params.verificationFees),
          validationFees: toNumber(params.validationFees),
          vsOperator: '',
          vsOperatorAuthzEnabled: false,
          vsOperatorAuthzSpendLimit: [],
          vsOperatorAuthzWithFeegrant: false,
          vsOperatorAuthzFeeSpendLimit: [],
          vsOperatorAuthzSpendPeriod: undefined,
        });
        break;

      case 'MsgCreateRootPermission':
        typeUrl = MSG_TYPE_CONFIG_PERM.MsgCreateRootPermission.typeUrl;
        value = MsgCreateRootPermission.fromPartial({
          authority,
          operator: address,
          schemaId: toNumber(params.schemaId),
          did: params.did,
          effectiveFrom: toDate(params.effectiveFrom),
          effectiveUntil: toDate(params.effectiveUntil),
          validationFees: toNumber(params.validationFees),
          issuanceFees: toNumber(params.issuanceFees),
          verificationFees: toNumber(params.verificationFees),
        });
        break;

      case 'MsgRenewPermissionVP':
        typeUrl = MSG_TYPE_CONFIG_PERM.MsgRenewPermissionVP.typeUrl;
        value = MsgRenewPermissionVP.fromPartial({
          authority,
          operator: address,
          id: toNumber(params.id),
        });
        break;

      case 'MsgSetPermissionVPToValidated':
        typeUrl = MSG_TYPE_CONFIG_PERM.MsgSetPermissionVPToValidated.typeUrl;
        value = MsgSetPermissionVPToValidated.fromPartial({
          authority,
          operator: address,
          id: toNumber(params.id),
          effectiveUntil: toDate(params.effectiveUntil),
          validationFees: toNumber(params.validationFees),
          issuanceFees: toNumber(params.issuanceFees),
          verificationFees: toNumber(params.verificationFees),
          vpSummaryDigestSri: params.vpSummaryDigestSri,
          issuanceFeeDiscount: 0,
          verificationFeeDiscount: 0,
        });
        break;

      case 'MsgCancelPermissionVPLastRequest':
        typeUrl = MSG_TYPE_CONFIG_PERM.MsgCancelPermissionVPLastRequest.typeUrl;
        value = MsgCancelPermissionVPLastRequest.fromPartial({
          authority,
          operator: address,
          id: toNumber(params.id),
        });
        break;

      case 'MsgAdjustPermission':
        typeUrl = MSG_TYPE_CONFIG_PERM.MsgAdjustPermission.typeUrl;
        value = MsgAdjustPermission.fromPartial({
          authority,
          operator: address,
          id: toNumber(params.id),
          effectiveUntil: toDate(params.effectiveUntil),
        });
        break;

      case 'MsgRevokePermission':
        typeUrl = MSG_TYPE_CONFIG_PERM.MsgRevokePermission.typeUrl;
        value = MsgRevokePermission.fromPartial({
          authority,
          operator: address,
          id: toNumber(params.id),
        });
        break;

      case 'MsgCreateOrUpdatePermissionSession':
        typeUrl = MSG_TYPE_CONFIG_PERM.MsgCreateOrUpdatePermissionSession.typeUrl;
        value = MsgCreateOrUpdatePermissionSession.fromPartial({
          authority,
          operator: address,
          id: params.id,
          issuerPermId: toNumber(params.issuerPermId),
          verifierPermId: toNumber(params.verifierPermId),
          agentPermId: toNumber(params.agentPermId),
          walletAgentPermId: toNumber(params.walletAgentPermId),
          digest: params.digest ?? '',
        });
        break;

      case 'MsgSlashPermissionTrustDeposit':
        typeUrl = MSG_TYPE_CONFIG_PERM.MsgSlashPermissionTrustDeposit.typeUrl;
        value = MsgSlashPermissionTrustDeposit.fromPartial({
          authority,
          operator: address,
          id: toNumber(params.id),
          amount: toNumber(params.amount),
        });
        break;

      case 'MsgRepayPermissionSlashedTrustDeposit':
        typeUrl = MSG_TYPE_CONFIG_PERM.MsgRepayPermissionSlashedTrustDeposit.typeUrl;
        value = MsgRepayPermissionSlashedTrustDeposit.fromPartial({
          authority,
          operator: address,
          id: toNumber(params.id),
        });
        break;

      default:
        await notify(resolveTranslatable({ key: 'error.msg.invalid.msgtype' }, translate) ?? '', 'error');
        return;
    }

    inFlight.current = true;

    // Show in-progress notification
    let notifyPromise: Promise<void> = Promise.resolve();
    if (!simulate) {
      notifyPromise = notify(
        MSG_INPROGRESS_ACTION_PERM[params.msgType](),
        'inProgress',
        resolveTranslatable({ key: 'notification.msg.inprogress.title' }, translate),
      );
    }

    let success = false;

    try {
      value = stripZerosUndefinedAndEmptyStrings(value);
      const msg: EncodeObject = { typeUrl, value };
      const res = await sendTx({
        msgs: [msg],
        memo: MSG_TYPE_CONFIG_PERM[params.msgType].txLabel,
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
        // Try to extract ID for create-like txs (or if you want it for others too)
        if (
          params.msgType === 'MsgStartPermissionVP' ||
          params.msgType === 'MsgCreateRootPermission' ||
          params.msgType === 'MsgCreatePermission'
        ) {
          id = extractCreatedPermissionId(txRes);
        }

        success = true;
        notifyPromise = notify(
          MSG_SUCCESS_ACTION_PERM[params.msgType](id),
          'success',
          resolveTranslatable({ key: 'notification.msg.successful.title' }, translate),
        );
      } else {
        notifyPromise = notify(
          MSG_ERROR_ACTION_PERM[params.msgType](id, txRes.code, txRes.rawLog) || `(${txRes.code}): ${txRes.rawLog}`,
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
          handleSuccess(onCancel, onRefresh, id, txHeight.current);
      }
    }
  }

  return actionPerm;
}

function permissionTypeFromString(type?: string): PermissionType {
  switch (type) {
    case "ISSUER":
      return PermissionType.ISSUER;
    case "VERIFIER":
      return PermissionType.VERIFIER;
    case "ISSUER_GRANTOR":
      return PermissionType.ISSUER_GRANTOR;
    case "VERIFIER_GRANTOR":
      return PermissionType.VERIFIER_GRANTOR;
    case "ECOSYSTEM":
      return PermissionType.ECOSYSTEM;
    case "HOLDER":
      return PermissionType.HOLDER;
    default:
      return PermissionType.UNSPECIFIED;
  }
}
