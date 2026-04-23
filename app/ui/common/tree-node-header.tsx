'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCertificate, faChevronRight, faChartColumn, faCoins, faCrown, faHandshake, faScaleBalanced } from "@fortawesome/free-solid-svg-icons";
import { Permission, VpState } from "../dataview/datasections/perm";
import { translate } from "@/i18n/dataview";
import { resolveTranslatable } from "../dataview/types";
import {
  countryCodeToFlag,
  formatVNAFromUVNA,
  permStateBadgeClass,
  roleBadgeClass,
  roleColorClass,
  shortenDID,
  vpStateColor,
} from "@/util/util";
import { service } from "./permission-atrribute";
import { PermState, TreeNode } from "./permission-tree";

// MOCK (replace when indexer exposes real service fields):
// service icon URL → derived from permission.id via dicebear
// service name → fallback to shortened DID
function mockServiceIconUrl(permissionId?: string): string {
  return `https://api.dicebear.com/7.x/shapes/svg?seed=service-${permissionId ?? 'unknown'}`;
}

function resolveServiceName(node: TreeNode): string {
  // MOCK: until indexer exposes real service name, show shortened DID
  return shortenDID(node.permission?.did ?? node.name ?? '');
}

export type TreeNodeHeaderProps = {
  node: TreeNode;
  type: "participants" | "tasks";
  isExpanded: boolean;
  showWeight: boolean;
  showBusiness: boolean;
  showStats: boolean;
  onToggle: (id: string, type: string, validatorId: string) => void;
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
  const isEcosystemRoot =
    type === "participants" &&
    !node.group &&
    node.permission?.type === "ECOSYSTEM";

  const { labelVpState, classVpState } = vpStateColor(
    node.permission?.vp_state as VpState,
    node.permission?.vp_exp as string,
    node.permission?.expire_soon ?? false,
  );
  const { labelPermState, classPermState } = permStateBadgeClass(
    node.permission?.perm_state as PermState,
    node.permission?.expire_soon ?? false,
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
        {hasChildren || node.group ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.nodeId, node.type as string, node.parentId as string);
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

        {isEcosystemRoot ? (
          <>
            {/* MOCK: service image placeholder until indexer provides service icon URL */}
            <img
              src={mockServiceIconUrl(node.permission?.id)}
              alt="Service"
              className="w-5 h-5 rounded flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(node.nodeId);
              }}
            />
            <span
              className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer break-all"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(node.nodeId);
              }}
            >
              {resolveServiceName(node)}
            </span>
            {/* Country flag — real country field, emoji rendered via util */}
            <span className="text-sm flex-shrink-0">{countryCodeToFlag(node.permission?.country)}</span>
            {/* MOCK: trust indicator always shown for root; replace with real verified flag from indexer */}
            <FontAwesomeIcon icon={faCertificate} className="text-green-500 text-sm flex-shrink-0" />
            {/* Role crown tinted by role */}
            <FontAwesomeIcon icon={faCrown} className={`${roleColorClass(node.permission?.type ?? '')} flex-shrink-0`} />
          </>
        ) : (
          <>
            <button
              type="button"
              className="cursor-default flex-shrink-0"
              aria-expanded={hasChildren ? undefined : undefined}
            >
              <FontAwesomeIcon icon={node.icon} className={node.iconColorClass} />
            </button>

            <span
              className={[
                "text-sm font-medium break-all",
                node.group
                  ? "text-gray-700 dark:text-gray-300"
                  : "text-gray-900 dark:text-white cursor-pointer",
              ].join(" ")}
              onClick={(e) => {
                e.stopPropagation();
                if (!node.group) onSelect(node.nodeId);
              }}
            >
              {node.group ? node.name : shortenDID(node.permission?.did as string)}
            </span>
          </>
        )}

        {type === "participants" && !node.group && node.permission?.perm_state ? (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${classPermState}`}>
            {labelPermState}
          </span>
        ) : null}

        {type === "tasks" && node.permission?.vp_state ? (
          <>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${classVpState}`}>
              {labelVpState}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${roleBadgeClass(node.permission.type)}`}>
              {node.permission.type}
            </span>
          </>
        ) : null}
      </div>

      {type === "participants" && (
        !node.group && node.permission ? (
          <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ml-auto ${node.roleColorClass}`}>
            {showWeight && node.permission.weight ? (
              <span className="whitespace-nowrap">
                <FontAwesomeIcon icon={faScaleBalanced} className="mr-1" />
                {formatVNAFromUVNA(node.permission.weight)}
              </span>
            ) : null}
            {showBusiness && (node.permission.validation_fees || node.permission.issuance_fees) ? (
              <span>
                <FontAwesomeIcon icon={faCoins} className="mr-1" />
                {`validation fees: ${formatVNAFromUVNA(node.permission.validation_fees)} issuance fees: ${formatVNAFromUVNA(node.permission.issuance_fees)}`}{' '}
                {node.permission.verification_fees && node.permission.verification_fees !== "0"
                  ? `verification fees:  ${formatVNAFromUVNA(node.permission.verification_fees)}`
                  : ""}
              </span>
            ) : null}
            {showStats && node.permission.issued && node.permission.verified && (node.permission.issued !== "0" || node.permission.verified !== "0") ? (
              <span>
                <FontAwesomeIcon icon={faChartColumn} className="mr-1" />
                {node.permission.issued && node.permission.issued !== "0" ? `issued: ${node.permission.issued}` : ''}{' '}
                {node.permission.verified && node.permission.verified !== "0" ? `verified: ${node.permission.verified}` : ''}
              </span>
            ) : null}
          </div>
        ) : (
          <div className={`text-xs flex flex-wrap items-center gap-x-3 gap-y-1 ml-auto ${node.roleColorClass}`}>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${node.validationProcessColor}`}>
              {node.validationProcessLabel}
            </span>
            {node.enabledJoin ? (
              <span
                className="hover:text-purple-600 cursor-pointer whitespace-nowrap"
                onClick={(e) => {
                  e.stopPropagation();
                  switch (node.validationProcessAction) {
                    case 'LinkDID':
                      window.open(service(node.permission?.did ?? ''), "_blank");
                      break;
                    case 'Connect':
                      onConnect?.();
                      break;
                    default:
                      onJoin(node);
                      onToggle(node.nodeId, node.type as string, node.parentId as string);
                      break;
                  }
                }}
              >
                <FontAwesomeIcon icon={faHandshake} className="mr-1" />
                {` ${resolveTranslatable({ key: "participants.btn.join" }, translate)}`}
              </span>
            ) : null}
          </div>
        )
      )}
    </div>
  );
}

