'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import PermissionCard from "./permission-card";
import { Permission } from "../dataview/datasections/perm";
import { resolveTranslatable } from "../dataview/types";
import { translate } from "@/i18n/dataview";
import { ModalAction } from "./modal-action";
import { renderActionComponent } from "./data-view-typed";
import AddJoinPage from "@/participants/add/page";
import { usePathname, useSearchParams } from "next/navigation";
import { useIndexerEvents } from "@/providers/indexer-events-provider";
import TreeNodeHeader from "./tree-node-header";
import SchemaHeader, { SchemaStatus } from "./schema-header";
import TrustRegistryBreadcrumb from "./trust-registry-breadcrumb";

type PermissionTreeProps = {
  tree: TreeNode[];
  type: "participants" | "tasks";
  csTitle?: string;
  csId?: string;
  csDescription?: string;
  csStatus?: SchemaStatus;
  csIssuerPermManagementMode?: string | number;
  csVerifierPermManagementMode?: string | number;
  trTitle?: string;
  trId?: string;
  isTrController?: boolean;
  setNodeRequestParams?:  (
    nodeId: string | undefined,
    type: string | undefined,
    validatorId: string | undefined
  ) => void;
  refreshRoot?: () => void;
  onConnect?: () => void;
  onRetryFetch?: () => void;
};

/** ------------ Types ------------ */
export type PermissionType =
  | "ECOSYSTEM"
  | "ISSUER_GRANTOR"
  | "VERIFIER_GRANTOR"
  | "ISSUER"
  | "VERIFIER"
  | "HOLDER";

export type PermState = "ACTIVE" | "INACTIVE" | "REPAID" | "SLASHED" | "FUTURE";

export type TreeNode = {
  nodeId: string;
  icon: IconDefinition;
  iconColorClass: string;
  isGrantee: boolean;
  isValidator: boolean;
  group?: boolean;
  schemaId?: string;
  parentId?: string;
  type?: string;
  name?: string;
  roleColorClass?: string;
  permission?: Permission;
  children?: TreeNode[];
  validationProcessLabel?: string;
  validationProcessColor?: string;
  validationProcessAction?: 'MsgStartPermissionVP' | 'MsgCreatePermission' | 'LinkDID' | 'Connect';
  enabledJoin?: boolean;
  serviceDid?: string;
  serviceTitle?: string;
  badgeCount?: number;
};

export type RefreshState = {
  joinNode?: TreeNode;
  id?: string;
  txHeight?: number;
};

/** ------------ Helpers ------------ */
const findNodeAndPath = (nodes: TreeNode[], id: string): { node?: TreeNode; path: TreeNode[] } => {
  const queue: { n: TreeNode; path: TreeNode[] }[] = nodes.map((n) => ({ n, path: [n] }));
  while (queue.length) {
    const cur = queue.shift()!;
    if (String(cur.n.nodeId) === String(id)) return { node: cur.n, path: cur.path };
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
  onJoin,
  onConnect
}: {
  type: "participants" | "tasks";
  nodes: TreeNode[];
  showWeight: boolean;
  showBusiness: boolean;
  showStats: boolean;
  selectedId?: string;
  onSelect: (id: string) => void;
  expanded: Record<string, boolean>;
  onToggle: (id: string, type: string | undefined, validatorId: string | undefined) => void;
  onJoin: (node: TreeNode) => void;
  onConnect?: () => void;
  depth?: number;
}) {

  return (
    <div className="space-y-1">
      {nodes.map((node, idx) => {
        const isExpanded = expanded[node.nodeId] ?? false;
        const isSelected = String(selectedId) === String(node.nodeId);
        const hasChildren = !!node.children?.length;
        return (
          <div key={`${node.nodeId}-${idx}`}>
            <div
              className={[
                "rounded-lg p-2 transition-all",
                "hover:bg-primary-600/5",
                isSelected ? "bg-primary-600/10" : "",
              ].join(" ")}
              style={{ marginLeft: depth * 24 }}
            >
              <TreeNodeHeader
                node={node}
                type={type}
                isExpanded={isExpanded}
                showWeight={showWeight}
                showBusiness={showBusiness}
                showStats={showStats}
                onToggle={onToggle}
                onSelect={onSelect}
                onJoin={onJoin}
                onConnect={onConnect}
              />
            </div>

            {hasChildren && isExpanded ? (
              <Tree
                type={type}
                nodes={node.children!}
                onJoin={onJoin}
                showWeight={showWeight}
                showBusiness={showBusiness}
                showStats={showStats}
                selectedId={selectedId}
                onSelect={onSelect}
                expanded={expanded}
                onToggle={onToggle}
                onConnect={onConnect}
                depth={depth + 1}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default function PermissionTree({ tree, type, csTitle, csDescription, csStatus, csIssuerPermManagementMode, csVerifierPermManagementMode, trTitle, csId, trId, isTrController, setNodeRequestParams, refreshRoot, onConnect, onRetryFetch }: PermissionTreeProps) {
  const [showWeight, setShowWeight] = useState(false);
  const [showBusiness, setShowBusiness] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [addPermission, setAddPermission] = useState<boolean>(false);
  const [join, setJoin] = useState<TreeNode | undefined>(undefined);
  const permissionCardRef = useRef<HTMLDivElement | null>(null);
  const [treeState, setTreeState] = useState<TreeNode[]>(tree);
  const [refreshState, setRefreshState] = useState<RefreshState>({});
  const { latestProcessedHeight } = useIndexerEvents();

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const first = tree?.[0]?.nodeId;
    return first ? { [first]: true } : {};
  });

  const findNodeById = (nodes: TreeNode[], targetId: string): TreeNode | undefined => {
    for (const n of nodes) {
      if (String(n.nodeId) === String(targetId)) return n;
      if (n.children?.length) {
        const found = findNodeById(n.children, targetId);
        if (found) return found;
      }
    }
    return undefined;
  };  

  const toggleNode = (id: string, type: string | undefined, validatorId: string | undefined) => {
    const isOpening = !(expanded[id] ?? false);
    setExpanded((p) => ({ ...p, [id]: isOpening }));
    if (isOpening) {
      const node = findNodeById(treeState, id);
      const alreadyLoaded = (node?.children?.length ?? 0) > 0;
      if (!alreadyLoaded) {
        setNodeRequestParams?.(id, type, validatorId);
      }
    }
  };

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('permission') ?? undefined; 

  const handleSelect = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("permission", id);
    window.history.pushState(null, "", `${pathname}?${params.toString()}`);
  };  

  const { node: selectedNode, path } = useMemo(
    () => (selectedId ? findNodeAndPath(treeState, selectedId) : { node: undefined, path: [] }),
    [treeState, selectedId]
  );

  const mergeTree = (prev: TreeNode[], next: TreeNode[]): TreeNode[] => {
    const prevMap = new Map(prev.map((n) => [n.nodeId, n]));
    return next.map((n) => {
      const prevNode = prevMap.get(n.nodeId);
      if (n.group) {
        return {
          ...n,
          children: n.children ?? [],
        };
      }
      return {
        ...prevNode,
        ...n,
        children:
          n.children && n.children.length > 0
            ? mergeTree(prevNode?.children ?? [], n.children)
            : prevNode?.children ?? [],
      };
    });
  };

  const updateNodePermission = (nodes: TreeNode[], nodeId: string, perm: Permission): TreeNode[] => {
    return nodes.map((n) => {
      if (String(n.nodeId) === String(nodeId)) {
        return { ...n, permission: perm };
      }
      if (n.children?.length) {
        return { ...n, children: updateNodePermission(n.children, nodeId, perm) };
      }
      return n;
    });
  };  

  const refreshNode = (perm: Permission): void => { // update permission -> node -> treeState
    setTreeState((prev) => updateNodePermission(prev, perm.id, perm));
  }

  useEffect(() => {
    if (!refreshState.joinNode || refreshState.txHeight == null) return;
    console.info("PermissionTree", {txHeight: refreshState.txHeight, latestProcessedHeight, 'ss.mmm': new Date().toISOString().slice(17, 23)});
    if (latestProcessedHeight < refreshState.txHeight) return;
    setNodeRequestParams?.(refreshState.joinNode.nodeId, refreshState.joinNode.type, refreshState.joinNode.parentId);
    setRefreshState((prev) => ({ ...prev, txHeight: undefined }));
  }, [refreshState.txHeight, latestProcessedHeight]);

  useEffect(() => {
    if (!refreshState.joinNode || refreshState.txHeight != null) return;
    const { node } = refreshState.id
      ? findNodeAndPath(treeState, refreshState.id)
      : { node: undefined };
    if (!node) {
      onRetryFetch?.();
      return;
    }
    setExpanded((prev) => ({ ...prev, [refreshState.joinNode!.nodeId]: true }));
    handleSelect(String(refreshState.id!));
    setRefreshState({});
  }, [treeState, latestProcessedHeight]);

  useEffect(() => {
    if (!selectedId) return;
    permissionCardRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    const { path } = findNodeAndPath(tree, selectedId);
    if (!path.length) return;

    const parentPath = path.slice(0, -1);
    if (!parentPath.length) return;
    setExpanded((prev) => {
      const parent = parentPath[parentPath.length - 1];
      if (prev[parent.nodeId]) return prev;
      const next = { ...prev };
      for (const p of parentPath) next[p.nodeId] = true;
      return next;
    });
  }, [tree, selectedId]);

  useEffect(() => {
    setExpanded((prev) => {
      const next: Record<string, boolean> = {};
      const collect = (arr: TreeNode[]) => {
        for (const n of arr) {
          if (prev[n.nodeId] ?? (type === "tasks" && n.group)) next[n.nodeId] = true;
          if (n.children?.length) collect(n.children);
        }
      };
      collect(tree);
      const first = tree?.[0]?.nodeId;
      if (Object.keys(next).length === 0 && first) next[first] = true;
      return next;
    });
  }, [tree]);

  useEffect(() => {
    setTreeState((prev) => mergeTree(prev, tree));
  }, [tree]);

  return (
    <>
      {/* v4 header: simplified TR breadcrumb + schema header card (participants only) */}
      {type === "participants" && trTitle && trId ? (
        <TrustRegistryBreadcrumb trId={trId} trDid={trTitle} />
      ) : null}

      {type === "participants" && csTitle && csId ? (
        <SchemaHeader
          title={csTitle}
          description={csDescription}
          id={csId}
          status={csStatus}
          issuerPermManagementMode={csIssuerPermManagementMode}
          verifierPermManagementMode={csVerifierPermManagementMode}
        />
      ) : null}

      {/* Tasks mode keeps the simple title/description header */}
      {type === "tasks" ? (
        <section className="mb-8">
          <h1 className="page-title">
            {resolveTranslatable({ key: "task.title" }, translate) ?? ""}
          </h1>
          <p className="page-description">
            {resolveTranslatable({ key: "task.description" }, translate) ?? ""}
          </p>
        </section>
      ) : null}

      {/* Permission Tree Card */}
      <section className="bg-white dark:bg-surface border border-neutral-20 dark:border-neutral-70 rounded-xl p-6 mb-6">
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{resolveTranslatable({key: (type === "participants")? "participants.tree.title" : "task.tree.title"}, translate)??"Tree"}</h2>
          { type === "participants" ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-primary-600 border-neutral-20 rounded focus:ring-primary-500"
                checked={showWeight}
                onChange={(e) => setShowWeight(e.target.checked)}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{resolveTranslatable({key: "participants.show.weight"}, translate)}</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-primary-600 border-neutral-20 rounded focus:ring-primary-500"
                checked={showBusiness}
                onChange={(e) => setShowBusiness(e.target.checked)}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{resolveTranslatable({key: "participants.show.businessrules"}, translate)}</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-primary-600 border-neutral-20 rounded focus:ring-primary-500"
                checked={showStats}
                onChange={(e) => setShowStats(e.target.checked)}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{resolveTranslatable({key: "participants.show.stats"}, translate)}</span>
            </label>
          </div>
          ):null}
        </div>

        <div className="space-y-1">
          <Tree
            type={type}
            nodes={treeState}
            onJoin={(node) => {
              setNodeRequestParams?.(undefined, undefined, undefined)
              setJoin(node);
            }}
            showWeight={showWeight}
            showBusiness={showBusiness}
            showStats={showStats}
            selectedId={selectedId}
            onSelect={handleSelect}
            onConnect={onConnect}
            expanded={expanded}
            onToggle={toggleNode}
          />

          { type==="participants" && isTrController ? (
          <button
            type="button"
            className="flex items-center space-x-2 p-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
            onClick={() => setAddPermission(true)}
          >
            <FontAwesomeIcon icon={faPlus} className="text-sm" />
            <span className="text-sm font-medium">{resolveTranslatable({key: "participants.action.newperm"}, translate)}</span>
          </button>
          ):null}
          
        </div>
      </section>

      {addPermission ? (
        <ModalAction
          onClose={() => setAddPermission(false)}
          titleKey={"participants.action.newperm"}
          isActive={addPermission}
        >
          {renderActionComponent(
            "MsgCreateRootPermission",
            () => setAddPermission(false),
            {schema_id: csId},
            () => refreshRoot?.(),
            undefined
          )}
        </ModalAction>
      ) : null}
      
      {join ? (
        <ModalAction
          onClose={() => setJoin(undefined)}
          titleKey={`${resolveTranslatable({key: "join.title"}, translate)} - ${csTitle} - as an  ${join.name?.slice(0, -1)}`}
          isActive={join !== undefined}
          classModal={"relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-xl bg-white dark:bg-surface"}
        >
          <AddJoinPage 
            trId={trId??""}
            nodeJoin={join}
            onCancel={() => setJoin(undefined)}
            onRefresh={(id?: string, txHeight?: number) => setRefreshState({joinNode: join, id, txHeight})}
          />
        </ModalAction>
      ) : null}

      {/* Detail Card  */}
      {selectedNode ? (
        <div ref={permissionCardRef}>
          <PermissionCard selectedNode={selectedNode} path={path} csTitle={csTitle??""} onRefresh={(perm: Permission) => refreshNode(perm)}/>
        </div>
      ) : null}
    </>
  );
}
