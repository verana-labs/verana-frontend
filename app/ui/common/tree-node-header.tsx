'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faChartColumn, faCoins, faCrown, faHandshake, faScaleBalanced } from "@fortawesome/free-solid-svg-icons";
import { Permission, VpState } from "../dataview/datasections/perm";
import { translate } from "@/i18n/dataview";
import { resolveTranslatable } from "../dataview/types";
import {
  formatVNAFromUVNA,
  permStateBadgeClass,
  roleBadgeClass,
  vpStateColor,
} from "@/util/util";
import { service } from "./permission-atrribute";
import { PermState, TreeNode } from "./permission-tree";
import ServiceIdentity from "./service-identity";

export type TreeNodeHeaderProps = {
  node: TreeNode;
  type: "participants" | "tasks";
  isExpanded: boolean;
  showWeight: boolean;
  showBusiness: boolean;
  showStats: boolean;
  onToggle: (id: string, type: string | undefined, validatorId: string | undefined) => void;
  onSelect: (id: string) => void;
  onJoin: (node: TreeNode) => void;
  onConnect?: () => void;
};

export default function TreeNodeHeader({
  node,
  type,
  isExpanded,
  showWeight,
  showBusiness,
  showStats,
  onToggle,
  onSelect,
  onJoin,
  onConnect,
}: TreeNodeHeaderProps) {
  const hasChildren = !!node.children?.length;
  const permission = node.permission;

  const { labelVpState, classVpState } = vpStateColor(
    permission?.vp_state as VpState,
    permission?.vp_exp as string,
    permission?.expire_soon ?? false,
  );
  const { labelPermState, classPermState } = permStateBadgeClass(
    permission?.perm_state as PermState,
    permission?.expire_soon ?? false,
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
        {hasChildren || node.group ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.nodeId, node.type, node.parentId);
            }}
            className="text-gray-400 text-xs w-4 flex-shrink-0"
            aria-label="Toggle"
          >
            <FontAwesomeIcon
              icon={faChevronRight}
              className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}
            />
          </button>
        ) : (
          <div className="w-4 flex-shrink-0" />
        )}

        {node.group ? (
          <>
            <FontAwesomeIcon icon={node.icon} className={`${node.iconColorClass} flex-shrink-0`} />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 break-all">
              {node.name}
            </span>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(node.nodeId);
              }}
              className="cursor-pointer min-w-0"
            >
              <ServiceIdentity did={permission?.did} fallbackName={node.name} />
            </button>
            <FontAwesomeIcon
              icon={faCrown}
              className="text-yellow-500 flex-shrink-0"
              aria-hidden="true"
            />
          </>
        )}

        {type === "participants" && !node.group && permission?.perm_state ? (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${classPermState}`}>
            {labelPermState}
          </span>
        ) : null}

        {type === "tasks" && permission?.vp_state ? (
          <>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${classVpState}`}>
              {labelVpState}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${roleBadgeClass(permission.type)}`}>
              {permission.type}
            </span>
          </>
        ) : null}
      </div>

      {type === "participants" && (
        !node.group && permission ? (
          <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ml-auto ${node.roleColorClass}`}>
            {showWeight && permission.weight ? (
              <span className="whitespace-nowrap">
                <FontAwesomeIcon icon={faScaleBalanced} className="mr-1" />
                {formatVNAFromUVNA(permission.weight)}
              </span>
            ) : null}
            {showBusiness && (permission.validation_fees || permission.issuance_fees) ? (
              <span>
                <FontAwesomeIcon icon={faCoins} className="mr-1" />
                {`validation fees: ${formatVNAFromUVNA(permission.validation_fees)} issuance fees: ${formatVNAFromUVNA(permission.issuance_fees)}`}{' '}
                {permission.verification_fees && permission.verification_fees !== "0"
                  ? `verification fees: ${formatVNAFromUVNA(permission.verification_fees)}`
                  : ""}
              </span>
            ) : null}
            {showStats && permission.issued && permission.verified && (permission.issued !== "0" || permission.verified !== "0") ? (
              <span>
                <FontAwesomeIcon icon={faChartColumn} className="mr-1" />
                {permission.issued && permission.issued !== "0" ? `issued: ${permission.issued}` : ''}{' '}
                {permission.verified && permission.verified !== "0" ? `verified: ${permission.verified}` : ''}
              </span>
            ) : null}
          </div>
        ) : (
          <div className={`text-xs flex flex-wrap items-center gap-x-3 gap-y-1 ml-auto ${node.roleColorClass}`}>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${node.validationProcessColor}`}>
              {node.validationProcessLabel}
            </span>
            {node.enabledJoin ? (
              <button
                type="button"
                className="hover:text-purple-600 cursor-pointer whitespace-nowrap"
                onClick={(e) => {
                  e.stopPropagation();
                  switch (node.validationProcessAction) {
                    case 'LinkDID':
                      window.open(service(permission?.did ?? ''), "_blank");
                      break;
                    case 'Connect':
                      onConnect?.();
                      break;
                    default:
                      onJoin(node);
                      onToggle(node.nodeId, node.type, node.parentId);
                      break;
                  }
                }}
              >
                <FontAwesomeIcon icon={faHandshake} className="mr-1" />
                {` ${resolveTranslatable({ key: "participants.btn.join" }, translate)}`}
              </button>
            ) : null}
          </div>
        )
      )}
    </div>
  );
}
