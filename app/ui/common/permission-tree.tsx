'use client';

import React, { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartColumn,
  faChevronRight,
  faCoins,
  faCrown,
  faEye,
  faFolder,
  faPlus,
  faScaleBalanced,
} from "@fortawesome/free-solid-svg-icons";
import PermissionCard from "./permission-card";

type PermissionTreeProps = { demoTree: TreeNode[] };

/** ------------ Types ------------ */
export type PermissionRole =
  | "ECOSYSTEM"
  | "ISSUER_GRANTOR"
  | "VERIFIER_GRANTOR"
  | "ISSUER"
  | "VERIFIER"
  | "HOLDER"
  | "GROUP";

type Status = "active" | "expire soon" | "pending approbation" | "expired" | "slashed";
type NodeIcon = "eye" | "crown" | "folder";

export type TreeNode = {
  id: string;
  role: PermissionRole;
  name: string;
  status?: Status;

  icon?: NodeIcon;
  iconColorClass?: string;

  joinLabel?: string;
  deposit?: string;
  fees?: string;
  stats?: string;

  detail?: Partial<{
    did: string;
    grantee: string;
    permissionId: string;
    deposit: string;
    effectiveFrom: string;
    effectiveUntil: string;
    country: string;
    issuedCredentials: string;
    verifiedCredentials: string;

    created: string;
    createdBy: string;
    modified: string;
    modifiedBy: string;
    extended: string;
    extendedBy: string;

    vpExpiration: string;
    vpLastStateChange: string;
    vpValidatorDeposit: string;
    vpCurrentFees: string;
    vpCurrentDeposit: string;
    vpSummaryDigest: string;

    validationFees: string;
    issuanceFees: string;
    verificationFees: string;

    slashedDeposit: string;
    repaidDeposit: string;
  }>;

  children?: TreeNode[];
};

/** ------------ Helpers ------------ */
function findNodeAndPath(nodes: TreeNode[], id: string): { node?: TreeNode; path: TreeNode[] } {
  const queue: { n: TreeNode; path: TreeNode[] }[] = nodes.map((n) => ({ n, path: [n] }));
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur.n.id === id) return { node: cur.n, path: cur.path };
    for (const c of cur.n.children ?? []) queue.push({ n: c, path: [...cur.path, c] });
  }
  return { node: undefined, path: [] };
}

export function statusBadgeClass(status: Status) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
    case "expire soon":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
    case "pending approbation":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
    case "expired":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    case "slashed":
      return "bg-red-900 text-red-100 dark:bg-red-300/20 dark:text-red-800";
  }
}

function iconForNode(n: TreeNode) {
  if (n.icon === "folder") return faFolder;
  if (n.icon === "crown") return faCrown;
  return faEye;
}

function Tree({
  nodes,
  showWeight,
  showBusiness,
  showStats,
  selectedId,
  onSelect,
  expanded,
  onToggle,
  depth = 0,
}: {
  nodes: TreeNode[];
  showWeight: boolean;
  showBusiness: boolean;
  showStats: boolean;
  selectedId?: string;
  onSelect: (id: string) => void;
  expanded: Record<string, boolean>;
  onToggle: (id: string) => void;
  depth?: number;
}) {
  // Nota: aquí usas eye/folder; si quieres crown real, agrega faCrown al import.
  const iconMap = iconForNode;

  return (
    <div className="space-y-1">
      {nodes.map((n) => {
        const hasChildren = !!n.children?.length;
        const isExpanded = expanded[n.id] ?? false;
        const isSelected = selectedId === n.id;

        return (
          <div key={n.id}>
            <div
              className={[
                "rounded-lg p-2 transition-all cursor-pointer",
                "hover:bg-primary-600/5",
                isSelected ? "bg-primary-600/10" : "",
              ].join(" ")}
              style={{ marginLeft: depth * 24 }}
              onClick={() => onSelect(n.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggle(n.id);
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
                      if (hasChildren) onToggle(n.id);
                      else onSelect(n.id);
                    }}
                    className={`${n.iconColorClass ?? "text-gray-500"}`}
                    aria-label="Toggle"
                    aria-expanded={hasChildren ? isExpanded : undefined}
                  >
                    <FontAwesomeIcon icon={iconMap(n)} />
                  </button>

                  <span
                    className={[
                      "text-sm font-medium",
                      n.role === "GROUP" ? "text-gray-700 dark:text-gray-300" : "text-gray-900 dark:text-white",
                    ].join(" ")}
                  >
                    {n.name}
                  </span>

                  {n.status ? (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(n.status)}`}>
                      {n.status}
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center space-x-3">
                  {showWeight && n.deposit ? (
                    <span className="text-xs text-purple-500">
                      <FontAwesomeIcon icon={faScaleBalanced} className="mr-1" />
                      {n.deposit}
                    </span>
                  ) : null}

                  {showBusiness && n.fees ? (
                    <span className="text-xs text-purple-500">
                      <FontAwesomeIcon icon={faCoins} className="mr-1" />
                      {n.fees}
                    </span>
                  ) : null}

                  {showStats && n.stats ? (
                    <span className="text-xs text-purple-500">
                      <FontAwesomeIcon icon={faChartColumn} className="mr-1" />
                      {n.stats}
                    </span>
                  ) : null}

                  {n.joinLabel ? (
                    <button
                      type="button"
                      className="text-xs text-blue-500 hover:text-blue-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log("join", n.id);
                      }}
                    >
                      {n.joinLabel}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            {hasChildren && isExpanded ? (
              <Tree
                nodes={n.children!}
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

export default function PermissionTree({ demoTree }: PermissionTreeProps) {
  const [showWeight, setShowWeight] = useState(false);
  const [showBusiness, setShowBusiness] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const first = demoTree?.[0]?.id;
    return first ? { [first]: true } : {};
  });

  const toggleNode = (id: string) => setExpanded((p) => ({ ...p, [id]: !(p[id] ?? false) }));

  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const { node: selectedNode, path } = useMemo(
    () => (selectedId ? findNodeAndPath(demoTree, selectedId) : { node: undefined, path: [] }),
    [demoTree, selectedId]
  );

  // UX: expand
  useEffect(() => {
    if (!selectedId) return;
    const { path } = findNodeAndPath(demoTree, selectedId);
    if (!path.length) return;
    setExpanded((prev) => {
      const next = { ...prev };
      for (const p of path) next[p.id] = true;
      return next;
    });
  }, [demoTree, selectedId]);

  useEffect(() => {
    const first = demoTree?.[0]?.id;
    if (!first) return;
    setExpanded({ [first]: true });
    setSelectedId(undefined);
  }, [demoTree]);  
  
  return (
    <>
      {/* Breadcrumbs */}
      <section className="mb-6">
        <nav className="flex flex-wrap items-center text-sm" aria-label="Breadcrumb">
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            Healthcare Trust Registry
          </a>
          <FontAwesomeIcon icon={faChevronRight} className="mx-2 text-neutral-70 text-xs" />
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            Healthcare Credential Schema
          </a>
          <FontAwesomeIcon icon={faChevronRight} className="mx-2 text-neutral-70 text-xs" />
          <span className="text-gray-900 dark:text-white font-medium">Participants</span>
        </nav>
      </section>

      <section className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Participants</h1>
      </section>

      {/* Permission Tree Card */}
      <section className="bg-white dark:bg-surface border border-neutral-20 dark:border-neutral-70 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Permission Tree</h2>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-primary-600 border-neutral-20 rounded focus:ring-primary-500"
                checked={showWeight}
                onChange={(e) => setShowWeight(e.target.checked)}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Weight</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-primary-600 border-neutral-20 rounded focus:ring-primary-500"
                checked={showBusiness}
                onChange={(e) => setShowBusiness(e.target.checked)}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Business Rules</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-primary-600 border-neutral-20 rounded focus:ring-primary-500"
                checked={showStats}
                onChange={(e) => setShowStats(e.target.checked)}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Stats</span>
            </label>
          </div>
        </div>

        <div className="space-y-1">
          <Tree
            nodes={demoTree}
            showWeight={showWeight}
            showBusiness={showBusiness}
            showStats={showStats}
            selectedId={selectedId}
            onSelect={setSelectedId}
            expanded={expanded}
            onToggle={toggleNode}
          />

          <button
            type="button"
            className="flex items-center space-x-2 p-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
            onClick={() => console.log("new ecosystem permission")}
          >
            <FontAwesomeIcon icon={faPlus} className="text-sm" />
            <span className="text-sm font-medium">New Ecosystem Permission</span>
          </button>
        </div>
      </section>

      {/* Detail Card */}
      {selectedNode ? (
        <PermissionCard selectedNode={selectedNode} path={path} />
      ) : null}
    </>
  );
}