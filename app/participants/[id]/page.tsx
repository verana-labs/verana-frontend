'use client';

import { usePermissions } from "@/hooks/usePermissions";
import PermissionTree, {TreeNode } from "@/ui/common/permission-tree";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Permission } from '@/ui/dataview/datasections/perm';
import { faFolder } from "@fortawesome/free-solid-svg-icons";
import { useCsData } from "@/hooks/useCredentialSchemaData";
import { useVeranaChain } from "@/hooks/useVeranaChain";
import { useChain } from "@cosmos-kit/react";
import { useTrustRegistryData } from "@/hooks/useTrustRegistryData";
import { authorityPaticipants, nodeChildRoles, roleColorClass } from "@/util/util";

export default function ParicipantsPage() {
  
  const veranaChain = useVeranaChain();
  const { address } = useChain(veranaChain.chain_name);
  const idsAddressRef = useRef<Set<string>>(new Set());
  const idsPredecessorRef = useRef<Set<string>>(new Set());
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

    return roots;
  }

  function toTreeNode(node: BuiltNode, typesToShow: string[]): TreeNode {
    const idsAddress = idsAddressRef.current;
    const idsPredecessor = idsPredecessorRef.current;
    let isGrantee = false;
    let isValidator = false;
    let isPredecessor = false;
    if (address === node.grantee){
      isGrantee = true;
      idsAddress.add(node.id);
    }
    if (idsAddress.has(node.validator_perm_id)){
      isValidator = true;
      idsPredecessor.add(node.id);
    }
    if (idsPredecessor.has(node.validator_perm_id)){
      isPredecessor = true;
      idsPredecessor.add(node.id);
    }

    const {icon, iconColorClass } = authorityPaticipants(isGrantee, isValidator, isPredecessor);

    return {
      nodeId: node.id,
      name: node.did ? node.did : node.type,
      group: false,
      parentId: node.validator_perm_id??'root',
      isGrantee,
      isValidator,
      roleColorClass: roleColorClass(node.type),
      icon,
      iconColorClass,
      permission: node,
      children: foldersByTypes(node.id, node.schema_id, typesToShow),
    };
  }

  function foldersByTypes(parentId: string, schemaId: string, types: string[]): TreeNode[] {
    return types.map((t) => ({
      nodeId: `group:${parentId}:${t}`,
      name: t,
      isGrantee: false,
      isValidator: false,
      group: true,
      schemaId,
      parentId,
      type: t,
      roleColorClass: roleColorClass(t),
      icon: faFolder,
      iconColorClass: roleColorClass(t),
      children: [],
    }));
  }

  function buildPermissionTreeGroupedByType(perms: Permission[], typesToShow: string[]): TreeNode[] {
    const permissionTree = buildTreeByValidatorPermId(perms);
    return permissionTree.map((n) => toTreeNode(n, typesToShow));
  }

  // helper for update nodeId
  function setChildrenOnNodeId(
    nodes: TreeNode[],
    targetNodeId: string,
    newChildren: TreeNode[]
  ): TreeNode[] {
    return nodes.map((n) => {
      if (n.nodeId === targetNodeId) {
        return { ...n, children: newChildren };
      }
      if (n.children?.length) {
        return { ...n, children: setChildrenOnNodeId(n.children, targetNodeId, newChildren) };
      }
      return n;
    });
  }

  const params = useParams();
  const schemaId = params?.id as string;
  const [type, setType] = useState<string | undefined>("ECOSYSTEM");
  const [validatorId, setValidatorId] = useState<string | undefined>(undefined);
  const [nodeUptade, setNodeUptade] = useState<string | undefined>(undefined);
  const [refreshRoot, setRefreshRoot] = useState<boolean>(false);

  function setNodeRequestParams(
    nodeId: string | undefined,
    type: string | undefined,
    validatorId: string | undefined
  ) {
    setType(type);
    setValidatorId(validatorId);
    setNodeUptade(nodeId);
  }

  const {permissionsList, refetch: refetchPermission} = usePermissions(schemaId, type, validatorId);

  const [permissionsTree, setPermissionsTree] = useState<TreeNode[] | []>([]);
  const {csData} = useCsData(schemaId);
  const {dataTR, refetch} = useTrustRegistryData(csData?.trId as string);

  useEffect(() => {
    const typesToShow = csData
      ? nodeChildRoles(csData.issuerPermManagementMode as string, csData.verifierPermManagementMode as string, type as string)
      : [];
    if (type === "ECOSYSTEM") {
      console.info("useEffect", "ECOSYSTEM");
      idsAddressRef.current.clear();
      idsPredecessorRef.current.clear();
      const groupedTreeNodes = buildPermissionTreeGroupedByType(permissionsList, typesToShow);
      setPermissionsTree(groupedTreeNodes);
    }
    else if (type != undefined && validatorId != undefined && nodeUptade != undefined) {
      // childs TreeNode
      const newChildren = permissionsList.map((p) =>
        toTreeNode({ ...(p as Permission), children: [] } as BuiltNode, typesToShow)
      );
      // update nodo folder
      setPermissionsTree((prev) => setChildrenOnNodeId(prev, nodeUptade, newChildren));
      console.info("add child nodes", permissionsList);
    }
  }, [permissionsList, address, csData?.issuerPermManagementMode, csData?.verifierPermManagementMode]);

  useEffect(() => {
    refetch();
  }, [csData]);

  useEffect(() => {
    if (refreshRoot){
      if (type === "ECOSYSTEM"){
        refetchPermission();
      } else {
        setNodeRequestParams(undefined, "ECOSYSTEM", undefined);
      }
    }
    setRefreshRoot(false);
  }, [refreshRoot]);

  return address ? (
   <PermissionTree tree={permissionsTree} type={"participants"} csTitle={csData?.title??""} trTitle={dataTR?.did??""} csId={csData?.id as string} trId={csData?.trId as string}
        isTrController={dataTR?.controller==address} setNodeRequestParams={setNodeRequestParams} refreshRoot={()=>setRefreshRoot(true)}/>
  ) : null;

};

