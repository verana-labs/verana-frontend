'use client';

import { formatDateTime, formatVNAFromUVNA, shortenMiddle } from "@/util/util";
import { PermissionHistory } from "../dataview/datasections/perm";
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faBan, faCheck, faClockRotateLeft, faHandHoldingDollar, faPlay, faPlus, faQuestion, faRotate, faTriangleExclamation, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ReactNode } from "react";
import { translate } from "@/i18n/dataview";
import { resolveTranslatable } from "@/ui/dataview/types";

const tr = (key: string, fallback: string) =>
  resolveTranslatable({ key }, translate) ?? fallback;

export default function PermissionTimeline({
    permissionHistory
}: {
  permissionHistory: PermissionHistory;
}) {
  const { label, icon, iconBgClass, iconColorClass } = getTimelineStyle(permissionHistory.msg);
  const account = permissionHistory.account
    ? shortenMiddle(permissionHistory.account, 20)
    : "";
  const summary = describeChanges(permissionHistory.msg, permissionHistory.changes);

  return (
    <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${iconBgClass}`}>
        <FontAwesomeIcon icon={icon} className={`text-xs ${iconColorClass}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-xs text-neutral-70 dark:text-neutral-70 mt-1 break-all">
          {formatDateTime(permissionHistory.timestamp)}
          {account ? <> {tr("permissioncard.timeline.by", "by")} <span className="font-mono">{account}</span></> : null}
        </p>
        {summary ? (
          <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 break-words">{summary}</p>
        ) : null}
      </div>
    </div>
  );
}

type TimelineStyle = {
  label: string;
  icon: IconDefinition;
  iconBgClass: string;
  iconColorClass: string;
};

export function getTimelineStyle(msg: string): TimelineStyle {
  switch (msg) {
    case "CreateRootPermission":
    case "CreatePermission":
      return {
        label: tr("permissioncard.timeline.event.created", "Permission Created"),
        icon: faPlus,
        iconBgClass: "bg-purple-100 dark:bg-purple-900/20",
        iconColorClass: "text-purple-600 dark:text-purple-400",
      };
    case "StartPermissionVP":
      return {
        label: tr("permissioncard.timeline.event.startvp", "Start Validation Process"),
        icon: faPlay,
        iconBgClass: "bg-blue-100 dark:bg-blue-900/20",
        iconColorClass: "text-blue-600 dark:text-blue-400",
      };
    case "SetPermissionVPToValidated":
      return {
        label: tr("permissioncard.timeline.event.setvalidated", "Accept and Set Validated"),
        icon: faCheck,
        iconBgClass: "bg-green-100 dark:bg-green-900/20",
        iconColorClass: "text-green-600 dark:text-green-400",
      };
    case "RenewPermissionVP":
      return {
        label: tr("permissioncard.timeline.event.renewvp", "Renew Validation Process"),
        icon: faRotate,
        iconBgClass: "bg-blue-100 dark:bg-blue-900/20",
        iconColorClass: "text-blue-600 dark:text-blue-400",
      };
    case "CancelPermissionVPLastRequest":
      return {
        label: tr("permissioncard.timeline.event.cancelvp", "Cancel Request"),
        icon: faXmark,
        iconBgClass: "bg-gray-100 dark:bg-gray-900/20",
        iconColorClass: "text-gray-600 dark:text-gray-400",
      };
    case "ExtendPermission":
      return {
        label: tr("permissioncard.timeline.event.extended", "Permission Extended"),
        icon: faClockRotateLeft,
        iconBgClass: "bg-primary-100 dark:bg-primary-900/20",
        iconColorClass: "text-primary-600 dark:text-primary-400",
      };
    case "RevokePermission":
      return {
        label: tr("permissioncard.timeline.event.revoked", "Permission Revoked"),
        icon: faBan,
        iconBgClass: "bg-red-100 dark:bg-red-900/20",
        iconColorClass: "text-red-600 dark:text-red-400",
      };
    case "SlashPermissionTrustDeposit":
      return {
        label: tr("permissioncard.timeline.event.slashed", "Deposit Slashed"),
        icon: faTriangleExclamation,
        iconBgClass: "bg-red-100 dark:bg-red-900/20",
        iconColorClass: "text-red-600 dark:text-red-400",
      };
    case "RepayPermissionSlashedTrustDeposit":
      return {
        label: tr("permissioncard.timeline.event.repaid", "Slashed Deposit Repaid"),
        icon: faHandHoldingDollar,
        iconBgClass: "bg-green-100 dark:bg-green-900/20",
        iconColorClass: "text-green-600 dark:text-green-400",
      };
    default:
      return {
        label: msg || tr("permissioncard.timeline.event.unknown", "Unknown Event"),
        icon: faQuestion,
        iconBgClass: "bg-gray-100 dark:bg-gray-900/20",
        iconColorClass: "text-gray-600 dark:text-gray-400",
      };
  }
}

function describeChanges(msg: string, changes: Record<string, unknown> | unknown): string | null {
  if (!changes || typeof changes !== "object" || Array.isArray(changes)) return null;
  const c = changes as Record<string, unknown>;

  switch (msg) {
    case "CreateRootPermission":
    case "CreatePermission": {
      const parts: string[] = [];
      const deposit = c.deposit;
      if (deposit != null && Number(deposit) > 0) {
        parts.push(`${formatVNAFromUVNA(String(deposit))} deposit`);
      }
      const effectiveUntil = c.effective_until;
      if (typeof effectiveUntil === "string" && effectiveUntil) {
        parts.push(`effective until ${formatDateTime(effectiveUntil)}`);
      }
      return parts.length ? parts.join(", ") : null;
    }
    case "StartPermissionVP": {
      const deposit = c.vp_validator_deposit ?? c.deposit;
      if (deposit != null && Number(deposit) > 0) {
        return `Initiated validation process with ${formatVNAFromUVNA(String(deposit))} deposit`;
      }
      return null;
    }
    case "SetPermissionVPToValidated": {
      const fees: string[] = [];
      if (c.validation_fees != null && Number(c.validation_fees) > 0) fees.push(`validation_fees: ${formatVNAFromUVNA(String(c.validation_fees))}`);
      if (c.issuance_fees != null && Number(c.issuance_fees) > 0) fees.push(`issuance_fees: ${formatVNAFromUVNA(String(c.issuance_fees))}`);
      if (c.verification_fees != null && Number(c.verification_fees) > 0) fees.push(`verification_fees: ${formatVNAFromUVNA(String(c.verification_fees))}`);
      return fees.length ? `Set ${fees.join(", ")}` : null;
    }
    case "ExtendPermission": {
      const effectiveUntil = c.effective_until;
      if (typeof effectiveUntil === "string" && effectiveUntil) {
        return `Extended until ${formatDateTime(effectiveUntil)}`;
      }
      return null;
    }
    case "SlashPermissionTrustDeposit":
    case "RepayPermissionSlashedTrustDeposit": {
      const amount = c.slashed_deposit ?? c.repaid_deposit;
      if (amount != null && Number(amount) > 0) {
        return `Amount: ${formatVNAFromUVNA(String(amount))}`;
      }
      return null;
    }
    default:
      return null;
  }
}

// Fallback renderer kept exported for callers that pass arbitrary change shapes.
export function renderChanges(changes: unknown): ReactNode {
  if (changes == null) return null;
  if (typeof changes === "string") {
    const text = changes.trim();
    if (!text) return null;
    return <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 break-all">{text}</p>;
  }
  if (typeof changes !== "object") return null;
  return null;
}
