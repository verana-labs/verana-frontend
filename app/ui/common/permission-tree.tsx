'use client';

import React, { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faChartColumn,
  faChevronRight,
  faCoins,
  faPlus,
  faScaleBalanced,
} from "@fortawesome/free-solid-svg-icons";
import PermissionCard from "./permission-card";
import { Permission, VpState } from "../dataview/datasections/perm";
import Link from "next/link";
import { formatVNA, permStateBadgeClass, roleBadgeClass, vpStateColor } from "@/util/util";
import { translate } from "@/i18n/dataview";
import { resolveTranslatable } from "../dataview/types";
import TitleAndButton from "./title-and-button";

type PermissionTreeProps = {
  tree: TreeNode[];
  type: "participants" | "tasks";
  csTitle?: string;
  trTitle?: string;
  hrefJoin?: string;
};

/** ------------ Types ------------ */
export type PermissionType =
  | "ECOSYSTEM"
  | "ISSUER_GRANTOR"
  | "VERIFIER_GRANTOR"
  | "ISSUER"
  | "VERIFIER"
  | "HOLDER";

export type PermState = "ACTIVE" | "INACTIVE" | "REPAID" | "SLASHED";

export type TreeNode = {
  nodeId: string;
  icon: IconDefinition;
  iconColorClass: string;
  group?: boolean;
  schemaId?: string;
  parentId?: string;
  type?: string;
  name?: string;
  roleColorClass?: string;
  permission?: Permission;
  children?: TreeNode[];
};

/** ------------ Helpers ------------ */
function findNodeAndPath(nodes: TreeNode[], id: string): { node?: TreeNode; path: TreeNode[] } {
  const queue: { n: TreeNode; path: TreeNode[] }[] = nodes.map((n) => ({ n, path: [n] }));
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur.n.nodeId === id) return { node: cur.n, path: cur.path };
    for (const c of cur.n.children ?? []) queue.push({ n: c, path: [...cur.path, c] });
  }
  return { node: undefined, path: [] };
}

function Tree({
  type,
  nodes,
  showWeight,
  showBusiness,
  showStats,
  selectedId,
  onSelect,
  expanded,
  onToggle,
  depth = 0,
  hrefJoin
}: {
  type: "participants" | "tasks";
  nodes: TreeNode[];
  showWeight: boolean;
  showBusiness: boolean;
  showStats: boolean;
  selectedId?: string;
  onSelect: (id: string) => void;
  expanded: Record<string, boolean>;
  onToggle: (id: string) => void;
  depth?: number;
  hrefJoin?: string;
}) {

  return (
    <div className="space-y-1">
      {nodes.map((node) => {
        const hasChildren = !!node.children?.length;
        const isExpanded = expanded[node.nodeId] ?? false;
        const isSelected = selectedId === node.nodeId;
        const {labelVpState, classVpState} = vpStateColor(node.permission?.vp_state as VpState, node.permission?.vp_exp as string);

        return (
          <div key={node.nodeId}>
            <div
              className={[
                "rounded-lg p-2 transition-all cursor-pointer",
                "hover:bg-primary-600/5",
                isSelected ? "bg-primary-600/10" : "",
              ].join(" ")}
              style={{ marginLeft: depth * 24 }}
              onClick={() => onSelect(node.nodeId)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggle(node.nodeId);
                      }}
                      className="text-gray-400 text-xs w-4"
                      aria-label={isExpanded ? "Collapse" : "Expand"}
                    >
                      <FontAwesomeIcon
                        icon={faChevronRight}
                        className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}
                      />
                    </button>
                  ) : (
                    <div className="w-4" />
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (hasChildren) onToggle(node.nodeId);
                      else onSelect(node.nodeId);
                    }}
                    // className={`${node.iconColorClass ?? "text-gray-500"}`}
                    aria-label="Toggle"
                    aria-expanded={hasChildren ? isExpanded : undefined}
                  >
                    <FontAwesomeIcon icon={node.icon} className={node.iconColorClass}/>
                  </button>

                  <span
                    className={[
                      "text-sm font-medium",
                      node.group ? "text-gray-700 dark:text-gray-300" : "text-gray-900 dark:text-white",
                    ].join(" ")}
                  >
                    {node.group ? node.name : node.permission?.did}
                  </span>

                  { type==="participants" && node.permission?.perm_state ? (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${permStateBadgeClass(node.permission.perm_state as PermState, false)}`}>
                      {node.permission.perm_state}
                    </span>
                  ) : null}

                  { type==="tasks" && node.permission?.vp_state ? (
                    <>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${classVpState}`}>
                      {labelVpState}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleBadgeClass(node.permission.type)}`}>
                      {node.permission.type}
                    </span>
                    </>
                  ) : null}

                </div>

                { type === "participants" && (
                !node.group && node.permission ? (
                <div className={`flex items-center space-x-3 text-xs ${node.roleColorClass}`}>
                  {showWeight && node.permission.weight ? (
                    <span >
                      <FontAwesomeIcon icon={faScaleBalanced} className="mr-1" />
                      {formatVNA(node.permission.weight)}
                    </span>
                  ) : null}
                  {showBusiness && ( node.permission.validation_fees || node.permission.issuance_fees) ? (
                    <span >
                      <FontAwesomeIcon icon={faCoins} className="mr-1" />
                      {`validation fees: ${node.permission.validation_fees} VNA issuance fees: ${node.permission.issuance_fees} VNA`} {node.permission.verification_fees && node.permission.verification_fees !== "0" ? `verification fees:  ${node.permission.verification_fees}  VNA` : ""}
                    </span>
                  ) : null}
                  {showStats && node.permission.issued &&  node.permission.verified && (node.permission.issued !== "0" || node.permission.verified !== "0" ) ? (
                    <span >
                      <FontAwesomeIcon icon={faChartColumn} className="mr-1" />
                      {node.permission.issued && node.permission.issued !== "0" ? `issued: ${node.permission.issued}` : ''} {node.permission.verified && node.permission.verified !== "0" ? `verified: ${node.permission.verified}` : ''}
                    </span>
                  ) : null}
                </div>
                ) : (
                  <Link
                    href={hrefJoin??""}
                    target="_blank"
                    rel="noopener noreferrer"
                    className= {`text-xs ${node.roleColorClass} hover:text-purple-600`}
                  >
                    {resolveTranslatable({key: "participants.btn.join"}, translate)}
                  </Link>
                ) ) }
              </div>
            </div>

            {hasChildren && isExpanded ? (
              <Tree
                type={type}
                nodes={node.children!}
                hrefJoin={hrefJoin}
                showWeight={showWeight}
                showBusiness={showBusiness}
                showStats={showStats}
                selectedId={selectedId}
                onSelect={onSelect}
                expanded={expanded}
                onToggle={onToggle}
                depth={depth + 1}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default function PermissionTree({ tree, type, hrefJoin, csTitle, trTitle }: PermissionTreeProps) {
  const [showWeight, setShowWeight] = useState(false);
  const [showBusiness, setShowBusiness] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const first = tree?.[0]?.nodeId;
    return first ? { [first]: true } : {};
  });

  const toggleNode = (id: string) => setExpanded((p) => ({ ...p, [id]: !(p[id] ?? false) }));

  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const { node: selectedNode, path } = useMemo(
    () => (selectedId ? findNodeAndPath(tree, selectedId) : { node: undefined, path: [] }),
    [tree, selectedId]
  );

  // UX: expand
  useEffect(() => {
    if (!selectedId) return;
    const { path } = findNodeAndPath(tree, selectedId);
    if (!path.length) return;
    setExpanded((prev) => {
      const next = { ...prev };
      for (const p of path) next[p.nodeId] = true;
      return next;
    });
  }, [tree, selectedId]);

  useEffect(() => {
    const first = tree?.[0]?.nodeId;
    if (!first) return;
    setExpanded({ [first]: true });
    setSelectedId(undefined);
  }, [tree]);  
  
  return (
    <>
      {/* Breadcrumbs */}
      { (type === "participants" && csTitle && trTitle) ?  (
      <section className="mb-6">
        <nav className="flex flex-wrap items-center text-sm" aria-label="Breadcrumb">
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            {trTitle}
          </a>
          <FontAwesomeIcon icon={faChevronRight} className="mx-2 text-neutral-70 text-xs" />
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            {csTitle}
          </a>
          <FontAwesomeIcon icon={faChevronRight} className="mx-2 text-neutral-70 text-xs" />
          <span className="text-gray-900 dark:text-white font-medium">{resolveTranslatable({key: "participants.title"}, translate)}</span>
        </nav>
      </section>
      ) : null }

      <TitleAndButton 
        title={resolveTranslatable({key: (type === "participants")? "participants.title" : "task.title"}, translate)??""}
        description={[resolveTranslatable({key: (type === "participants")? "participants.description" : "task.description"}, translate)??""]}
      />

      {/* Permission Tree Card */}
      <section className="bg-white dark:bg-surface border border-neutral-20 dark:border-neutral-70 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{resolveTranslatable({key: (type === "participants")? "participants.tree.title" : "task.tree.title"}, translate)??"Tree"}</h2>
          { type === "participants" ? (
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-primary-600 border-neutral-20 rounded focus:ring-primary-500"
                checked={showWeight}
                onChange={(e) => setShowWeight(e.target.checked)}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{resolveTranslatable({key: "participants.show.weight"}, translate)}</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-primary-600 border-neutral-20 rounded focus:ring-primary-500"
                checked={showBusiness}
                onChange={(e) => setShowBusiness(e.target.checked)}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{resolveTranslatable({key: "participants.show.businessrules"}, translate)}</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-primary-600 border-neutral-20 rounded focus:ring-primary-500"
                checked={showStats}
                onChange={(e) => setShowStats(e.target.checked)}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{resolveTranslatable({key: "participants.show.stats"}, translate)}</span>
            </label>
          </div>
          ):null}
        </div>

        <div className="space-y-1">
          <Tree
            type={type}
            nodes={tree}
            hrefJoin={hrefJoin}
            showWeight={showWeight}
            showBusiness={showBusiness}
            showStats={showStats}
            selectedId={selectedId}
            onSelect={setSelectedId}
            expanded={expanded}
            onToggle={toggleNode}
          />

          { type==="participants" ? (
          <button
            type="button"
            className="flex items-center space-x-2 p-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
            onClick={() => console.log("New ecosystem permission")}
          >
            <FontAwesomeIcon icon={faPlus} className="text-sm" />
            <span className="text-sm font-medium">{resolveTranslatable({key: "participants.action.newperm"}, translate)}</span>
          </button>
          ):null}
          
        </div>
      </section>

      {/* Detail Card  */}
      {selectedNode ? (
        <PermissionCard selectedNode={selectedNode} path={path} csTitle={csTitle??""} />
      ) : null}
    </>
  );
}
