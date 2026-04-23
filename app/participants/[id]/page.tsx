'use client';

import { usePermissions } from "@/hooks/usePermissions";
import PermissionTree, {PermState, TreeNode } from "@/ui/common/permission-tree";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Permission } from '@/ui/dataview/datasections/perm';
import { faFolder } from "@fortawesome/free-solid-svg-icons";
import { useCsData } from "@/hooks/useCredentialSchemaData";
import { useVeranaChain } from "@/hooks/useVeranaChain";
import { useChain } from "@cosmos-kit/react";
import { useTrustRegistryData } from "@/hooks/useTrustRegistryData";
import { authorityPaticipants, nodeChildRoles, roleColorClass, roleJoinColorClass } from "@/util/util";
import { Role } from "@/ui/common/role-card";

// ────────────────────────────────────────────────────────────────────────────
// MOCK: remove this whole block once the v4 indexer exposes real permissions.
// Keyed to schemaId "56" (Maxime's Test Credential) so real data paths remain
// untouched for every other schema. Exercises all v4 visual variants:
// root ECOSYSTEM + folder groups + nested permissions + multiple countries.
// ────────────────────────────────────────────────────────────────────────────
const MOCK_SCHEMA_ID = '56';

const mockPerm = (overrides: Partial<Permission>): Permission => ({
  id: '',
  schema_id: MOCK_SCHEMA_ID,
  type: 'ECOSYSTEM',
  did: '',
  grantee: 'cosmos1mockgrantee0000000000000000000000000',
  created_by: 'cosmos1mockcreator0000000000000000000000000',
  created: '2026-01-01T00:00:00Z',
  modified: '2026-04-01T00:00:00Z',
  modified_by: 'cosmos1mockcreator0000000000000000000000000',
  extended: '',
  extended_by: '',
  slashed: '',
  slashed_by: '',
  repaid: '',
  repaid_by: '',
  effective_from: '2026-01-01T00:00:00Z',
  effective_until: '2027-01-01T00:00:00Z',
  revoked: '',
  revoked_by: '',
  country: '',
  validation_fees: '0',
  issuance_fees: '0',
  verification_fees: '0',
  deposit: '0',
  slashed_deposit: '0',
  repaid_deposit: '0',
  validator_perm_id: '',
  vp_state: 'VALIDATED',
  vp_last_state_change: '2026-01-01T00:00:00Z',
  vp_current_fees: '0',
  vp_current_deposit: '0',
  vp_summary_digest_sri: '',
  vp_exp: '2027-01-01T00:00:00Z',
  vp_validator_deposit: '0',
  vp_term_requested: '',
  perm_state: 'ACTIVE',
  grantee_available_actions: [],
  validator_available_actions: [],
  participants: '0',
  weight: '0',
  issued: '0',
  verified: '0',
  expire_soon: false,
  ...overrides,
});

const MOCK_PERMISSIONS_56: Permission[] = [
  mockPerm({
    id: 'mock-eco-1',
    type: 'ECOSYSTEM',
    did: 'did:web:healthcare.ecosystem.2024',
    country: 'US',
    weight: '234000000000',
  }),
  mockPerm({
    id: 'mock-ig-1',
    type: 'ISSUER_GRANTOR',
    did: 'did:web:primary.issuer.grantor',
    country: 'US',
    validator_perm_id: 'mock-eco-1',
    weight: '125000000000',
    validation_fees: '150000',
    issuance_fees: '150000',
  }),
  mockPerm({
    id: 'mock-ig-2',
    type: 'ISSUER_GRANTOR',
    did: 'did:web:secondary.issuer.grantor',
    country: 'GB',
    validator_perm_id: 'mock-eco-1',
    perm_state: 'INACTIVE',
    weight: '75000000000',
  }),
  mockPerm({
    id: 'mock-vg-1',
    type: 'VERIFIER_GRANTOR',
    did: 'did:web:insurance.verifier.grantor',
    country: 'FR',
    validator_perm_id: 'mock-eco-1',
    weight: '90000000000',
    verification_fees: '220000',
  }),
  mockPerm({
    id: 'mock-i-1',
    type: 'ISSUER',
    did: 'did:web:hospital.a.issuer',
    country: 'US',
    validator_perm_id: 'mock-ig-1',
    weight: '45000000000',
    issuance_fees: '100000',
    issued: '345',
  }),
  mockPerm({
    id: 'mock-v-1',
    type: 'VERIFIER',
    did: 'did:web:insurance.alpha.verifier',
    country: 'JP',
    validator_perm_id: 'mock-vg-1',
    weight: '35000000000',
    verification_fees: '180000',
    verified: '234',
  }),
  mockPerm({
    id: 'mock-h-1',
    type: 'HOLDER',
    did: 'did:web:patient.smith.holder',
    country: 'BR',
    validator_perm_id: 'mock-i-1',
    weight: '5000000000',
  }),
];
// ─── end MOCK ──────────────────────────────────────────────────────────────

export default function ParicipantsPage() {
  
  const veranaChain = useVeranaChain();
  const { address, isWalletConnected, connect } = useChain(veranaChain.chain_name);
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

  function toTreeNode(node: BuiltNode, typesToShow: {role: Role; label: string; validation: boolean}[]): TreeNode {
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
      children: foldersByTypes(node, typesToShow)
    };
  }

  function foldersByTypes(parent: Permission, types: {role: Role; label: string; validation: boolean}[]): TreeNode[] {
    return types.map((t) => ({
      nodeId: `group:${parent.id}:${t.role}`,
      name: t.label,
      validationProcessAction: isWalletConnected ? 
                                  t.validation ? (t.role == "HOLDER" && Number(parent.validation_fees) == 0 ? "LinkDID" : "MsgStartPermissionVP") : "MsgCreatePermission"
                                  : "Connect",
      validationProcessLabel: t.validation ? "validation process" : "open",
      validationProcessColor: roleJoinColorClass(t.role),
      isGrantee: false,
      isValidator: false,
      group: true,
      schemaId,
      parentId: parent.id,
      type: t.role,
      roleColorClass: roleColorClass(t.role),
      icon: faFolder,
      iconColorClass: roleColorClass(t.role),
      children: [],
      permission: parent,
      enabledJoin: parent.perm_state as PermState === "ACTIVE"
    }));
  }

  function buildPermissionTreeGroupedByType(perms: Permission[], typesToShow: {role: Role; label: string; validation: boolean}[]): TreeNode[] {
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

  // MOCK: single flag gating mock tree injection for schemaId "56"
  const useMockTree = schemaId === MOCK_SCHEMA_ID;

  // MOCK: override perm-management modes to GRANTOR_VALIDATION on both sides so
  // the full grantor hierarchy (matching the UX Pilot spec: Issuer Grantors →
  // Issuers → Holders, plus Verifier Grantors → Verifiers) renders instead of
  // the real OPEN/OPEN modes on schema 56. All other csData fields (title,
  // description, trId…) are passed through untouched.
  const effectiveCsData = useMockTree && csData
    ? { ...csData, issuerPermManagementMode: 'GRANTOR_VALIDATION', verifierPermManagementMode: 'GRANTOR_VALIDATION' }
    : csData;

  // MOCK: build fully-populated tree (folders pre-filled with real child
  // permissions instead of the lazy-loaded empties the real pipeline uses).
  const buildFullMockTree = useMemo(() => {
    return (perms: Permission[], rootTypesToShow: {role: Role; label: string; validation: boolean}[]): TreeNode[] => {
      const byId = new Map<string, BuiltNode>();
      for (const p of perms) byId.set(p.id, { ...p, children: [] });
      for (const p of perms) {
        if (!p.validator_perm_id) continue;
        const parent = byId.get(p.validator_perm_id);
        parent?.children.push(byId.get(p.id)!);
      }
      const roots = perms.filter((p) => !p.validator_perm_id).map((p) => byId.get(p.id)!);

      const walk = (node: BuiltNode, typesToShow: {role: Role; label: string; validation: boolean}[]): TreeNode => {
        const base = toTreeNode(node, typesToShow);
        const filled = (base.children ?? []).map((folder) => {
          if (!folder.group || !folder.type) return folder;
          const folderType = folder.type as string;
          const childTypesToShow = effectiveCsData
            ? nodeChildRoles(
                effectiveCsData.issuerPermManagementMode as string,
                effectiveCsData.verifierPermManagementMode as string,
                folderType,
              )
            : [];
          const childTreeNodes = node.children
            .filter((cp) => cp.type === folderType)
            .map((cp) => walk(cp, childTypesToShow));
          return { ...folder, children: childTreeNodes };
        });
        return { ...base, children: filled };
      };

      return roots.map((r) => walk(r, rootTypesToShow));
    };
    // toTreeNode / csData / nodeChildRoles are closures; recreate when csData mutates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCsData?.issuerPermManagementMode, effectiveCsData?.verifierPermManagementMode, address, isWalletConnected]);

  useEffect(() => {
    const typesToShow = effectiveCsData
      ? nodeChildRoles(effectiveCsData.issuerPermManagementMode as string, effectiveCsData.verifierPermManagementMode as string, type as string)
      : [];
    if (type === "ECOSYSTEM") {
      idsAddressRef.current.clear();
      idsPredecessorRef.current.clear();
      // MOCK branch — skips real permissionsList
      const groupedTreeNodes = useMockTree
        ? buildFullMockTree(MOCK_PERMISSIONS_56, typesToShow)
        : buildPermissionTreeGroupedByType(permissionsList, typesToShow);
      setPermissionsTree(groupedTreeNodes);
    }
    else if (!useMockTree && type != undefined && validatorId != undefined && nodeUptade != undefined) {
      // childs TreeNode (real lazy-load path; skipped entirely in mock mode since
      // mock tree is fully pre-populated)
      const newChildren = permissionsList.map((p) =>
        toTreeNode({ ...(p as Permission), children: [] } as BuiltNode, typesToShow)
      );
      setPermissionsTree((prev) => setChildrenOnNodeId(prev, nodeUptade, newChildren));
    }
  }, [permissionsList, address, isWalletConnected, effectiveCsData?.issuerPermManagementMode, effectiveCsData?.verifierPermManagementMode, useMockTree, buildFullMockTree]);

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

  useEffect(() => {
    setRefreshRoot(true);
  }, [isWalletConnected, address]);

  const csStatus = csData?.archived ? 'ARCHIVED' : 'ACTIVE';

  return (
   <PermissionTree tree={permissionsTree} type={"participants"}
        csTitle={csData?.title ?? ""}
        csDescription={csData?.description}
        csStatus={csStatus}
        csIssuerPermManagementMode={effectiveCsData?.issuerPermManagementMode}
        csVerifierPermManagementMode={effectiveCsData?.verifierPermManagementMode}
        trTitle={dataTR?.did ?? ""}
        csId={csData?.id as string}
        trId={csData?.trId as string}
        isTrController={dataTR?.controller == address}
        setNodeRequestParams={setNodeRequestParams}
        refreshRoot={() => setRefreshRoot(true)}
        onConnect={!isWalletConnected ? connect : undefined}
        onRetryFetch={() => refetchPermission(schemaId, type, validatorId)}/>
  );

};

