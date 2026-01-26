'use client';

import PermissionTree, { TreeNode } from "@/ui/common/permission-tree";
import { useEffect, useMemo, useState } from "react";
import { Permission } from "@/ui/dataview/datasections/perm";
import { faCrown, faEye, faFolder } from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { useVeranaChain } from "@/hooks/useVeranaChain";
import { useChain } from "@cosmos-kit/react";
import { usePermissionsForAddress } from "@/hooks/usePermissionsForAddress";
import { roleColorClass } from "@/util/util";
import { useCsDataMany } from "@/hooks/useCredentialSchemaDataMany";

export default function PendingTasksPage() {
  const veranaChain = useVeranaChain();
  const { address } = useChain(veranaChain.chain_name);

  const { permissionsList } = usePermissionsForAddress(address);
  const [permissionsTree, setPermissionsTree] = useState<TreeNode[]>([]);

  // Build a unique list of schemaIds from permissionsList
  const [schemaIds, setSchemaIds] = useState<string[]>([]);
  // Collect permission IDs granted to the current address
  const [idsGrantedToAddress, setIdsGrantedToAddress] = useState<string[]>([]);
  const { csDataById } = useCsDataMany(schemaIds);

  function authorityIcon(permission: Permission): { icon: IconDefinition; iconColorClass: string } {
    if (permission.validator_perm_id && idsGrantedToAddress.includes(permission.validator_perm_id)) {
      return { icon: faCrown, iconColorClass: "text-yellow-500" };
    }
    if (address === permission.grantee) {
      return { icon: faCrown, iconColorClass: "text-green-500" };
    }
    return { icon: faEye, iconColorClass: "text-gray-500" };
  }

  function permissionToTreeNode(p: Permission): TreeNode {
    const { icon, iconColorClass } = authorityIcon(p);
    return {
      nodeId: p.id,
      name: p.did ? p.did : p.type,
      group: false,
      roleColorClass: roleColorClass(p.type),
      icon,
      iconColorClass,
      permission: p,
      children: undefined,
    };
  }

  function groupPermissionsBySchema(perms: Permission[]): TreeNode[] {
    const buckets = new Map<string, Permission[]>();

    for (const p of perms) {
      const key = p.schema_id;
      const arr = buckets.get(key);
      if (arr) arr.push(p);
      else buckets.set(key, [p]);
      setSchemaIds((prev) => (prev.includes(key) ? prev : [...prev, key]));
      setIdsGrantedToAddress((prev) => ([...prev, p.id]));
    }

    const entries = Array.from(buckets.entries()).sort(([a], [b]) => a.localeCompare(b));

    return entries.map(([schemaId, list]) => {
      const children = list.map(permissionToTreeNode);
      const title = csDataById[schemaId]?.title;

      return {
        nodeId: `schema:${schemaId}`,
        name: `${title} (${list.length})`,
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
  }

  useEffect(() => {    
    // if (Object.keys(csDataById).length > 0 && idsGrantedToAddress.size > 0)
      setPermissionsTree(groupPermissionsBySchema(permissionsList));
  }, [permissionsList, csDataById, address, idsGrantedToAddress]);
  
  return <PermissionTree tree={permissionsTree} type={"tasks"} />;
}
