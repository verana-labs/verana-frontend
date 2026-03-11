'use client';

import PermissionTree, { TreeNode } from "@/ui/common/permission-tree";
import { useEffect, useState } from "react";
import { Permission, TrustRegistriesPermission } from "@/ui/dataview/datasections/perm";
import { faFolder } from "@fortawesome/free-solid-svg-icons";
import { useVeranaChain } from "@/hooks/useVeranaChain";
import { useChain } from "@cosmos-kit/react";
import { authorityPaticipants, roleColorClass } from "@/util/util";
import { usePendingTasksCtx, useUpdatePendingTasksCtx } from '@/providers/pending-tasks-provider-context';

export default function PendingTasksPage() {
  const veranaChain = useVeranaChain();
  const { address } = useChain(veranaChain.chain_name);

  const permissionsList = usePendingTasksCtx();
  const updatePermissionList = useUpdatePendingTasksCtx();
  const [permissionsTree, setPermissionsTree] = useState<TreeNode[]>([]);
  const [refreshRoot, setRefreshRoot] = useState<boolean>(true);

  function permissionToTreeNode(p: Permission): TreeNode {
    const isGrantee = (address === p.grantee);
    const isValidator = true;
    const isPredecessor = false;
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
  
  useEffect(() => {
    if (refreshRoot) updatePermissionList();
    setRefreshRoot(false);
  }, [refreshRoot]);

  return <PermissionTree tree={permissionsTree} type={"tasks"} refreshRoot={()=>setRefreshRoot(true)} />;
}
