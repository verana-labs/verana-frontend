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
  MsgSelfCreatePermission,
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
import { extractTxHeight, handleSuccess } from '@/msg/util/signerUtil'
import { SimulateResult } from '@/msg/util/signAndBroadcastManualAmino';

const toDate = (v?: string | Date) => (v ? (v instanceof Date ? v : new Date(v)) : undefined);
const toNumber = (v?: string | number) => (v == null || v === '' ? 0 : Number(v));

function emptyVsOperatorAuthz() {
  return {
    vsOperator: '',
    vsOperatorAuthzEnabled: false,
    vsOperatorAuthzSpendLimit: [],
    vsOperatorAuthzWithFeegrant: false,
    vsOperatorAuthzFeeSpendLimit: [],
    vsOperatorAuthzSpendPeriod: undefined,
  };
}

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
  MsgSelfCreatePermission: {
    typeUrl: '/verana.perm.v1.MsgSelfCreatePermission',
    txLabel: 'MsgSelfCreatePermission',
  },
} as const;

/** Union type for action parameters */
export type ActionPermParams =
  | {
      msgType: 'MsgStartPermissionVP';
      type: string;
      validatorPermId: string | number;
      did?: string;
    }
| {
      msgType: 'MsgSelfCreatePermission';
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
      id: string | number;
    }
  | {
      msgType: 'MsgSetPermissionVPToValidated';
      id: string | number;
      effectiveUntil?: string | Date;
      validationFees: string | number;
      issuanceFees: string | number;
      verificationFees: string | number;
      vpSummaryDigest: string;
    }
  | {
      msgType: 'MsgCancelPermissionVPLastRequest';
      id: string | number;
    }
  | {
      msgType: 'MsgAdjustPermission';
      id: string | number;
      effectiveUntil?: string | Date;
    }
  | {
      msgType: 'MsgRevokePermission';
      id: string | number;
    }
  | {
      msgType: 'MsgCreateOrUpdatePermissionSession';
      id: string; // UUID
      issuerPermId: string | number;
      verifierPermId: string | number;
      agentPermId: string | number;
      walletAgentPermId: string | number;
    }
  | {
      msgType: 'MsgSlashPermissionTrustDeposit';
      id: string | number;
      amount: string | number;
      reason: string;
    }
  | {
      msgType: 'MsgRepayPermissionSlashedTrustDeposit';
      id: string | number;
      amount: string | number;
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

  function extractCreatedPermissionId(res: DeliverTxResponse): string | undefined {
    const tryFind = (allEvents: Array<{ type: string; attributes?: Array<{ key: string; value: string }> }>) => {
      const eventTypes = [
        'start_permission_vp',
        'self_create_permission',
        'create_permission',
        'create_root_permission',
        'permission_created',
      ];

      const keys = ['root_permission_id', 'permission_id', 'id', 'perm_id'];

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

    const events = (res as any)?.events as // eslint-disable-line @typescript-eslint/no-explicit-any
      | Array<{ type: string; attributes?: Array<{ key: string; value: string }> }>
      | undefined;

    const fromEvents = events ? tryFind(events) : undefined;
    if (fromEvents) return fromEvents;

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
      | MsgSelfCreatePermission;

    let id: string | undefined =
      params.msgType === 'MsgStartPermissionVP' ||
      params.msgType === 'MsgCreateRootPermission' ||
      params.msgType === 'MsgSelfCreatePermission'
        ? undefined
        : (params as { id: string | number }).id?.toString();

    switch (params.msgType) {
      case 'MsgStartPermissionVP':
        typeUrl = MSG_TYPE_CONFIG_PERM.MsgStartPermissionVP.typeUrl;
        value = MsgStartPermissionVP.fromPartial({
          corporation: address,
          operator: address,
          type: permissionTypeFromString(params.type),
          validatorPermId: Number(params.validatorPermId),
          did: params.did ?? '',
          validationFees: undefined,
          issuanceFees: undefined,
          verificationFees: undefined,
          ...emptyVsOperatorAuthz(),
        });
        break;

      case 'MsgSelfCreatePermission':
        typeUrl = MSG_TYPE_CONFIG_PERM.MsgSelfCreatePermission.typeUrl;
        value = MsgSelfCreatePermission.fromPartial({
          corporation: address,
          operator: address,
          type: permissionTypeFromString(params.type),
          validatorPermId: Number(params.validatorPermId),
          did: params.did,
          effectiveFrom: toDate(params.effectiveFrom),
          effectiveUntil: toDate(params.effectiveUntil),
          verificationFees: toNumber(params.verificationFees),
          validationFees: toNumber(params.validationFees),
          ...emptyVsOperatorAuthz(),
        });
        break;

      case 'MsgCreateRootPermission':
        typeUrl = MSG_TYPE_CONFIG_PERM.MsgCreateRootPermission.typeUrl;
        value = MsgCreateRootPermission.fromPartial({
          corporation: address,
          operator: address,
          schemaId: Number(params.schemaId),
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
          corporation: address,
          operator: address,
          id: Number(params.id),
        });
        break;

      case 'MsgSetPermissionVPToValidated':
        typeUrl = MSG_TYPE_CONFIG_PERM.MsgSetPermissionVPToValidated.typeUrl;
        value = MsgSetPermissionVPToValidated.fromPartial({
          corporation: address,
          operator: address,
          id: Number(params.id),
          effectiveUntil: toDate(params.effectiveUntil),
          validationFees: toNumber(params.validationFees),
          issuanceFees: toNumber(params.issuanceFees),
          verificationFees: toNumber(params.verificationFees),
          vpSummaryDigest: params.vpSummaryDigest,
          issuanceFeeDiscount: 0,
          verificationFeeDiscount: 0,
        });
        break;

      case 'MsgCancelPermissionVPLastRequest':
        typeUrl = MSG_TYPE_CONFIG_PERM.MsgCancelPermissionVPLastRequest.typeUrl;
        value = MsgCancelPermissionVPLastRequest.fromPartial({
          corporation: address,
          operator: address,
          id: Number(params.id),
        });
        break;

      case 'MsgAdjustPermission':
        typeUrl = MSG_TYPE_CONFIG_PERM.MsgAdjustPermission.typeUrl;
        value = MsgAdjustPermission.fromPartial({
          corporation: address,
          operator: address,
          id: Number(params.id),
          effectiveUntil: toDate(params.effectiveUntil),
        });
        break;

      case 'MsgRevokePermission':
        typeUrl = MSG_TYPE_CONFIG_PERM.MsgRevokePermission.typeUrl;
        value = MsgRevokePermission.fromPartial({
          corporation: address,
          operator: address,
          id: Number(params.id),
        });
        break;

      case 'MsgCreateOrUpdatePermissionSession':
        typeUrl = MSG_TYPE_CONFIG_PERM.MsgCreateOrUpdatePermissionSession.typeUrl;
        // Permission session is NOT in the de operator-authorization whitelist,
        // but the chain still requires `operator` to be a valid bech32
        // address (it does its own check via the vs_operator path inside the
        // perm handler). For self-execution we set operator = corporation = wallet.
        value = MsgCreateOrUpdatePermissionSession.fromPartial({
          corporation: address,
          operator: address,
          id: params.id,
          issuerPermId: Number(params.issuerPermId),
          verifierPermId: Number(params.verifierPermId),
          agentPermId: Number(params.agentPermId),
          walletAgentPermId: Number(params.walletAgentPermId),
        });
        break;

      case 'MsgSlashPermissionTrustDeposit':
        typeUrl = MSG_TYPE_CONFIG_PERM.MsgSlashPermissionTrustDeposit.typeUrl;
        value = MsgSlashPermissionTrustDeposit.fromPartial({
          corporation: address,
          operator: address,
          id: Number(params.id),
          amount: toNumber(params.amount),
          reason: params.reason,
        });
        break;

      case 'MsgRepayPermissionSlashedTrustDeposit':
        typeUrl = MSG_TYPE_CONFIG_PERM.MsgRepayPermissionSlashedTrustDeposit.typeUrl;
        value = MsgRepayPermissionSlashedTrustDeposit.fromPartial({
          corporation: address,
          operator: address,
          id: Number(params.id),
          amount: toNumber(params.amount),
        });
        break;

      default:
        await notify(resolveTranslatable({ key: 'error.msg.invalid.msgtype' }, translate) ?? '', 'error');
        return;
    }

    inFlight.current = true;

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
        if (
          params.msgType === 'MsgStartPermissionVP' ||
          params.msgType === 'MsgCreateRootPermission' ||
          params.msgType === 'MsgSelfCreatePermission'
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
