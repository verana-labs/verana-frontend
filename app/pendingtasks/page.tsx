'use client';

import PermissionTree, { TreeNode } from "@/ui/common/permission-tree";
import { useEffect, useState } from "react";
import { Permission } from "@/ui/dataview/datasections/perm";
import { faCrown, faEye, faFolder } from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { useVeranaChain } from "@/hooks/useVeranaChain";
import { useChain } from "@cosmos-kit/react";
import { usePermissionsForAddress } from "@/hooks/usePermissionsForAddress";
import { authorityPaticipants, roleColorClass } from "@/util/util";

export default function PendingTasksPage() {
  const veranaChain = useVeranaChain();
  const { address } = useChain(veranaChain.chain_name);

  const { permissionsList } = usePermissionsForAddress(address);
  const [permissionsTree, setPermissionsTree] = useState<TreeNode[]>([]);

  // Collect permission IDs granted to the current address
  const idsAddress = new Set<string>();
  const idsPredecessor = new Set<string>();
  
  function permissionToTreeNode(p: Permission): TreeNode {
    let isGrantee = false;
    let isValidator = false;
    let isPredecessor = false;
    if (address === p.grantee){
      isGrantee = true;
      idsAddress.add(p.id);
    }
    if (idsAddress.has(p.validator_perm_id)){
      isValidator = true;
      idsPredecessor.add(p.id);
    }
    if (idsPredecessor.has(p.validator_perm_id)){
      isPredecessor = true;
      idsPredecessor.add(p.id);
    }

    const {icon, iconColorClass } = authorityPaticipants(isGrantee, isValidator, isPredecessor);
    return {
      nodeId: p.id,
      name: p.did,
      group: false,
      parentId: p.validator_perm_id,
      isGrantee,
      isValidator,
      roleColorClass: roleColorClass(p.type),
      icon,
      iconColorClass,
      permission: p,
      children: undefined,
    };
  }

  function groupPermissionsBySchema(perms: Permission[]) {
    const buckets = new Map<string, Permission[]>();

    for (const p of perms) {
      const key = p.schema_id;
      idsPredecessor.add(p.id);
      const arr = buckets.get(key);
      if (arr) arr.push(p);
      else buckets.set(key, [p]);
    }

    const entries = Array.from(buckets.entries()).sort(([a], [b]) => a.localeCompare(b));

    const tree: TreeNode[] = entries.map(([schemaId, list]) => {
      const children = list.map(permissionToTreeNode);
      const title = `Schema ${schemaId}`;

      return {
        nodeId: `schema:${schemaId}`,
        name: `${title} (${list.length})`,
        isGrantee: false,
        isValidator: false,
        group: true,
        schemaId,
        parentId: "root",
        type: "SCHEMA",
        roleColorClass: "text-purple-200",
        icon: faFolder,
        iconColorClass: "text-purple-200",
        children,
      };
    });
    
    return tree;
  }

  useEffect(() => {
    const tree = groupPermissionsBySchema(permissionsList);
    setPermissionsTree(tree);
  }, [permissionsList]);
  
  return <PermissionTree tree={permissionsTree} type={"tasks"} />;
}
