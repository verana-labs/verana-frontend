'use client';

import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { PermissionType, permStateBadgeClass, PermState, TreeNode } from "./permission-tree";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBan,
  faCheck,
  faClockRotateLeft,
  faCopy,
  faEye,
  faHandHoldingDollar,
  faPlay,
  faPlus,
  faRotate,
  faTriangleExclamation,
  faUpRightFromSquare,
} from "@fortawesome/free-solid-svg-icons";
import { useMemo } from "react";


type PermissionCardProps = {
  selectedNode: TreeNode;
  path: TreeNode[]
};

function roleBadgeClass(role: PermissionType) {
  switch (role) {
    case "ECOSYSTEM":
      return "bg-purple-100 text-purple-800";
    case "ISSUER_GRANTOR":
      return "bg-blue-100 text-blue-800";
    case "VERIFIER_GRANTOR":
      return "bg-slate-100 text-slate-800";
    case "ISSUER":
      return "bg-green-100 text-green-800";
    case "VERIFIER":
      return "bg-orange-100 text-orange-800";
    case "HOLDER":
      return "bg-pink-100 text-pink-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/** ------------ UI pieces ------------ */
function Meta({
  label,
  value,
  mono,
  actions,
}: {
  label: string;
  value: string;
  mono?: boolean;
  actions?: { icon: IconProp; label: string; onClick: () => void }[];
}) {
  return (
    <div>
      <label className="text-xs font-medium text-neutral-70 dark:text-neutral-70">{label}</label>
      <p className={`text-sm ${mono ? "font-mono" : ""} text-gray-900 dark:text-white break-all`}>{value}</p>
      {actions?.length ? (
        <div className="flex items-center space-x-2 mt-1">
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={a.onClick}
              className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              type="button"
            >
              <FontAwesomeIcon icon={a.icon} className="mr-1" />
              {a.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function TimelineItem({
  icon,
  iconClass,
  title,
  meta,
  detail,
}: {
  icon: IconProp;
  iconClass: string;
  title: string;
  meta: string;
  detail: string;
}) {
  return (
    <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <div className="w-8 h-8 bg-white/60 dark:bg-white/5 rounded-full flex items-center justify-center flex-shrink-0">
        <FontAwesomeIcon icon={icon} className={`text-xs ${iconClass}`} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
        <p className="text-xs text-neutral-70 dark:text-neutral-70 mt-1">{meta}</p>
        <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">{detail}</p>
      </div>
    </div>
  );
}

export default function PermissionCard({
  selectedNode,
  path
}: PermissionCardProps) {
  const onExtendPermission = () => console.log("extend permission");
  const onRevokePermission = () => console.log("revoke permission");

  const onRenewVP = () => console.log("renew VP");
  const onCancelVP = () => console.log("cancel VP");
  const onAcceptVP = () => console.log("accept VP");

  const onSlashDeposit = () => console.log("slash deposit");
  const onRepaySlash = () => console.log("repay slash",);

  const detailBreadcrumb = useMemo(() => {
    if (!path.length) return "";
    return path.map((p) => p.name).slice(0, -1).join(" → ");
  }, [path]);

  console.info("selectedNode: ", selectedNode);
  return (
    <section className="bg-white dark:bg-surface border border-neutral-20 dark:border-neutral-70 rounded-xl p-6">
    {selectedNode.permission && (
      <>
      <div className="mb-6">
        <div className="flex items-start justify-between mb-3">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedNode.name}</h2>
          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${roleBadgeClass(
                selectedNode.permission.type
              )}`}
            >
              {selectedNode.permission.type}
            </span>

            {selectedNode.permission.perm_state ? (
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${permStateBadgeClass(
                  selectedNode.permission.perm_state as PermState,false)}`}
              >
                {selectedNode.permission.perm_state}
              </span>
            ) : null}
          </div>
        </div>

        <p className="text-sm text-neutral-70 dark:text-neutral-70 mb-2">
          {detailBreadcrumb}
          {detailBreadcrumb ? " → " : ""}
          {selectedNode.name}
        </p>

        <p className="text-sm text-gray-700 dark:text-gray-300">Healthcare Credential Schema</p>
      </div>

      <div className="space-y-8">
        {/* Key Metadata */}
        <div className="border-t border-neutral-20 dark:border-neutral-70 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Key Metadata</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Meta
              label="DID"
              value={selectedNode.permission?.did ?? "—"}
              mono
              actions={[
                { icon: faCopy, label: "copy", onClick: () => navigator.clipboard.writeText(selectedNode.permission?.did ?? "") },
                { icon: faEye, label: "visualizer", onClick: () => console.log("visualizer DID") },
                { icon: faUpRightFromSquare, label: "service", onClick: () => console.log("service") },
              ]}
            />
            <Meta
              label="Grantee"
              value={selectedNode.permission?.grantee ?? "—"}
              mono
              actions={[
                { icon: faCopy, label: "copy", onClick: () => navigator.clipboard.writeText(selectedNode.permission?.grantee ?? "") },
                { icon: faEye, label: "visualizer", onClick: () => console.log("visualizer grantee") },
                { icon: faUpRightFromSquare, label: "explorer", onClick: () => window.open("https://explorer.verana.io", "_blank") },
              ]}
            />
            <Meta
              label="ID"
              value={selectedNode.permission?.id ?? "—"}
              mono
              actions={[
                { icon: faCopy, label: "copy", onClick: () => navigator.clipboard.writeText(selectedNode.permission?.id ?? "") },
                { icon: faEye, label: "visualizer", onClick: () => console.log("visualizer id") },
              ]}
            />
            <Meta label="Deposit" value={selectedNode.permission?.deposit ?? "—"} mono />
            <Meta label="Effective From" value={selectedNode.permission?.effective_from ?? "—"} />
            <Meta label="Effective Until" value={selectedNode.permission?.effective_until ?? "—"} />
            <Meta label="Country" value={selectedNode.permission?.country ?? "—"} />
            <Meta label="Issued Credentials" value={selectedNode.permission?.issued ?? "—"} />
            <Meta label="Verified Credentials" value={selectedNode.permission?.verified ?? "—"} />
          </div>
        </div>

        {/* Permission Lifecycle */}
        <div className="border-t border-neutral-20 dark:border-neutral-70 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Permission Lifecycle</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Meta label="Created" value={selectedNode.permission?.created ?? "—"} />
            <Meta label="Created By" value={selectedNode.permission?.created_by ?? "—"} mono />
            <Meta label="Modified" value={selectedNode.permission?.modified ?? "—"} />
            <Meta label="Modified By" value={selectedNode.permission?.modified ?? "—"} mono />
            <Meta label="Extended" value={selectedNode.permission?.extended ?? "—"} />
            <Meta label="Extended By" value={selectedNode.permission?.extended_by ?? "—"} mono />
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={onExtendPermission}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
              type="button"
            >
              <FontAwesomeIcon icon={faClockRotateLeft} className="mr-2" />
              Extend Permission
            </button>
            <button
              onClick={onRevokePermission}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              type="button"
            >
              <FontAwesomeIcon icon={faBan} className="mr-2" />
              Revoke Permission
            </button>
          </div>
        </div>

        {/* Validation Process */}
        <div className="border-t border-neutral-20 dark:border-neutral-70 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Validation Process</h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
              VALIDATED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Meta label="VP Expiration" value={selectedNode.permission?.vp_exp ?? "—"} />
            <Meta label="VP Last State Change" value={selectedNode.permission?.vp_last_state_change ?? "—"} />
            <Meta label="VP Validator Deposit" value={selectedNode.permission?.vp_validator_deposit ?? "—"} mono />
            <Meta label="VP Current Fees" value={selectedNode.permission?.vp_current_fees ?? "—"} mono />
            <Meta label="VP Current Deposit" value={selectedNode.permission?.vp_current_deposit ?? "—"} mono />
            <Meta label="VP Summary Digest" value={selectedNode.permission?.vp_summary_digest_sri ?? "—"} mono />
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={onRenewVP}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
              type="button"
            >
              <FontAwesomeIcon icon={faRotate} className="mr-2" />
              Renew Validation Process
            </button>
            <button
              onClick={onCancelVP}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
              type="button"
            >
              <FontAwesomeIcon icon={faTriangleExclamation} className="mr-2" />
              Cancel Request
            </button>
            <button
              onClick={onAcceptVP}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              type="button"
            >
              <FontAwesomeIcon icon={faCheck} className="mr-2" />
              Accept and Set Validated
            </button>
          </div>
        </div>

        {/* Business Models */}
        <div className="border-t border-neutral-20 dark:border-neutral-70 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Business Models</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Meta label="Validation Fees" value={selectedNode.permission?.validation_fees ?? "—"} mono />
            <Meta label="Issuance Fees" value={selectedNode.permission?.issuance_fees ?? "—"} mono />
            <Meta label="Verification Fees" value={selectedNode.permission?.verification_fees ?? "—"} mono />
          </div>
        </div>

        {/* Slashing */}
        <div className="border-t border-neutral-20 dark:border-neutral-70 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Slashing</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Meta label="Slashed Deposit" value={selectedNode.permission?.slashed_deposit ?? "—"} mono />
            <Meta label="Repaid Deposit" value={selectedNode.permission?.repaid_deposit ?? "—"} mono />
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={onSlashDeposit}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              type="button"
            >
              <FontAwesomeIcon icon={faTriangleExclamation} className="mr-2" />
              Slash Deposit
            </button>
            <button
              onClick={onRepaySlash}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              type="button"
            >
              <FontAwesomeIcon icon={faHandHoldingDollar} className="mr-2" />
              Repay Slashed Deposit
            </button>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="border-t border-neutral-20 dark:border-neutral-70 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activity Timeline</h3>
          <div className="space-y-4">
            <TimelineItem
              icon={faCheck}
              iconClass="text-green-600 dark:text-green-400"
              title="Accept and Set Validated"
              meta="2024-02-01 09:20:00 by verana1ghi...rst"
              detail="Set validation_fees: 1.5 VNA, issuance_fees: 0.10 VNA"
            />
            <TimelineItem
              icon={faPlay}
              iconClass="text-blue-600 dark:text-blue-400"
              title="Start Validation Process"
              meta="2024-01-20 11:30:00 by verana1abc...xyz"
              detail="Initiated validation process with 5,000 VNA deposit"
            />
            <TimelineItem
              icon={faPlus}
              iconClass="text-purple-600 dark:text-purple-400"
              title="Permission Created"
              meta="2024-01-15 14:30:00 by verana1def...uvw"
              detail="Created with 45,000 VNA deposit, effective until 2024-12-15"
            />
          </div>
        </div>
      </div>
      </> 
    )}
    </section>
  );
}