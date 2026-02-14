'use client';

import PermissionTree, { TreeNode } from "@/ui/common/permission-tree";
import { useEffect, useState } from "react";
import { Permission, TrustRegistriesPermission } from "@/ui/dataview/datasections/perm";
import { faFolder } from "@fortawesome/free-solid-svg-icons";
import { useVeranaChain } from "@/hooks/useVeranaChain";
import { useChain } from "@cosmos-kit/react";
import { usePendingFlatPermissions } from "@/hooks/usePendingFlatPermissions";
import { authorityPaticipants, roleColorClass } from "@/util/util";

export default function PendingTasksPage() {
  const veranaChain = useVeranaChain();
  const { address } = useChain(veranaChain.chain_name);

  const { permissionsList } = usePendingFlatPermissions(address);
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

  function buildTreeFromResponse(data: TrustRegistriesPermission[]): TreeNode[] {
    return data.map((tr) => ({
      nodeId: `tr:${tr.id}`,
      name: `${tr.did} (${tr.pending_tasks})`,
      group: true,
      parentId: "root",
      isGrantee: false,
      isValidator: false,
      roleColorClass: "text-purple-300",
      icon: faFolder,
      iconColorClass: "text-purple-300",
      children: tr.credential_schemas.map((cs) => ({
        nodeId: `cs:${cs.id}`,
        name: `${cs.title} (${cs.pending_tasks})`,
        group: true,
        parentId: `tr:${tr.id}`,
        isGrantee: false,
        isValidator: false,
        roleColorClass: "text-purple-200",
        icon: faFolder,
        iconColorClass: "text-purple-200",
        children: cs.permissions.map((p) =>
          permissionToTreeNode(p)
        ),
      })),
    }));
  }

  useEffect(() => {
    const tree = buildTreeFromResponse(permissionsList);
    setPermissionsTree(tree);
  }, [permissionsList]);
  
  return <PermissionTree tree={permissionsTree} type={"tasks"} />;
}
