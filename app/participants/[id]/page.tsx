'use client';

import { usePermissions } from "@/hooks/usePermissions";
import PermissionTree, {TreeNode } from "@/ui/common/permission-tree";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Permission } from '@/ui/dataview/datasections/perm';
import { faCrown, faEye, faFolder } from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { useCsData } from "@/hooks/useCredentialSchemaData";
import { useVeranaChain } from "@/hooks/useVeranaChain";
import { useChain } from "@cosmos-kit/react";
import { useTrustRegistryData } from "@/hooks/useTrustRegistryData";
import { roleColorClass } from "@/util/util";

export default function ParicipantsPage() {
  
  const veranaChain = useVeranaChain();
  const { address } = useChain(veranaChain.chain_name);
  const [idsAddress, setIdsAddress] = useState<string[]>([]);
  const [idsPredecessor, setIdsPredecessor] = useState<string[]>([]);

  function authorityIcon (permission: Permission ): { icon: IconDefinition; iconColorClass: string } {
      if (permission.validator_perm_id && idsAddress.includes(permission.validator_perm_id)){ // validator
        setIdsPredecessor((prev) => {
          return [...prev, permission.id];
        });
        return { icon: faCrown, iconColorClass: "text-yellow-500" };
      }
      else if (address === permission.grantee){ // grantee
        setIdsAddress((prev) => {
          return [...prev, permission.id];
        });
        return { icon: faCrown, iconColorClass: "text-green-500" };
      }
      else if (permission.validator_perm_id && idsPredecessor.includes(permission.validator_perm_id)){ // predecessor
        setIdsPredecessor((prev) => {
          return [...prev, permission.id];
        });
        return { icon: faCrown, iconColorClass: "text-gray-500" };
      }
      else {
        return { icon: faEye, iconColorClass: "text-gray-500" };
      }
  }

  type BuiltNode = Permission & { children: BuiltNode[] };

  function buildTreeByValidatorPermId(perms: Permission[]): BuiltNode[] {
    const byId = new Map<string, BuiltNode>();
    const roots: BuiltNode[] = [];

    for (const p of perms) byId.set(p.id, { ...p, children: [] });

    for (const p of perms) {
      const node = byId.get(p.id)!;

      if (!p.validator_perm_id) {
        roots.push(node);
        continue;
      }

      const parent = byId.get(p.validator_perm_id);
      if (parent) parent.children.push(node);
      else roots.push(node);
    }
    console.info("buildTreeByValidatorPermId roots", roots)

    return roots;
  }

  function groupChildrenByType(children: TreeNode[], parentId: string, schemaId: string): TreeNode[] {
    const buckets = new Map<string, TreeNode[]>();

    for (const ch of children) {
      const key = ch.permission?.type ?? "UNKNOWN";
      const arr = buckets.get(key);
      if (arr) arr.push(ch);
      else buckets.set(key, [ch]);
    }

    const entries = Array.from(buckets.entries()).sort(([a], [b]) => a.localeCompare(b));

    return entries.map(([type, nodes]) => ({
      nodeId: `group:${parentId}:${type}`,
      name: `${type} (${nodes.length})`,
      group: true,
      schemaId,
      parentId,
      type,
      roleColorClass: roleColorClass(type),
      icon: faFolder,
      iconColorClass: roleColorClass(type),
      children: nodes,
    }));
  }

  function toTreeNode(node: BuiltNode): TreeNode {
    const mappedChildren = node.children.map((c) => toTreeNode(c));
    const grouped = mappedChildren.length ? groupChildrenByType(mappedChildren, node.id, node.schema_id) : undefined;
    const {icon, iconColorClass} = authorityIcon(node);

    return {
      nodeId: node.id,
      name: node.did ? node.did : node.type,
      group: false,
      roleColorClass: roleColorClass(node.type),
      icon,
      iconColorClass,
      permission: node,
      children: grouped,
    };
  }

  function buildPermissionTreeGroupedByType(perms: Permission[]): TreeNode[] {
    const permissionTree = buildTreeByValidatorPermId(perms);
    return permissionTree.map(toTreeNode);
  }

  const params = useParams();
  const schemaId = params?.id as string;
  const {permissionsList} = usePermissions(schemaId);
  const [permissionsTree, setPermissionsTree] = useState<TreeNode[] | []>([]);
  const {csData} = useCsData(schemaId);
  const {dataTR, refetch} = useTrustRegistryData(csData?.trId as string);

  useEffect(() => {
    const groupedTreeNodes = buildPermissionTreeGroupedByType(permissionsList);
    setPermissionsTree(groupedTreeNodes);
  }, [permissionsList]);

  useEffect(() => {
    refetch();
  }, [csData]);

  return <PermissionTree tree={permissionsTree} type={"participants"} csTitle={csData?.title??""} trTitle={dataTR?.did??""} csId={csData?.id as string} trId={csData?.trId as string} />;

};

