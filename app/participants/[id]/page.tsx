'use client'

import { useChain } from '@cosmos-kit/react'
import { faEllipsis, faFolder } from '@fortawesome/free-solid-svg-icons'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCredentialSchemaData } from '@/hooks/useCredentialSchemaData'
import { useEcosystemData } from '@/hooks/useEcosystemData'
import { participantListQuery, useParticipants } from '@/hooks/useParticipants'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import { participantOnboardingMode } from '@/lib/participant-onboarding'
import { isNativePricing } from '@/lib/pricing-asset'
import ParticipantTree from '@/ui/common/participant-tree'
import type { SiblingCursor, TreeNode } from '@/ui/common/participant-tree-types'
import type { Role } from '@/ui/common/role-card'
import type { Participant } from '@/ui/dataview/datasections/participant'
import { nodeChildRoles, participantAuthority, roleColorClass, roleJoinColorClass } from '@/util/util'

type BuiltParticipant = Participant & { children: BuiltParticipant[] }
type ChildRole = { role: Role; label: string; validation: boolean }

const ROOT_NODE_ID = 'root'

function buildTreeByValidator(participants: Participant[]): BuiltParticipant[] {
  const byId = new Map<string, BuiltParticipant>()
  const roots: BuiltParticipant[] = []
  for (const participant of participants) byId.set(participant.id, { ...participant, children: [] })
  for (const participant of participants) {
    const node = byId.get(participant.id)
    if (!node) continue
    const validatorId = participant.validator_participant_id
    if (!validatorId) {
      roots.push(node)
      continue
    }
    const parent = byId.get(validatorId)
    if (parent) parent.children.push(node)
    else roots.push(node)
  }
  return roots
}

function mergeSiblings(existing: TreeNode[], incoming: TreeNode[]): TreeNode[] {
  const kept = existing.filter((node) => !node.loadMore)
  const known = new Set(kept.map((node) => node.nodeId))
  return [...kept, ...incoming.filter((node) => !known.has(node.nodeId))]
}

function setChildren(nodes: TreeNode[], targetNodeId: string, children: TreeNode[], append: boolean): TreeNode[] {
  return nodes.map((node) => {
    if (node.nodeId === targetNodeId) {
      return { ...node, children: append ? mergeSiblings(node.children ?? [], children) : children }
    }
    if (node.children?.length) {
      return { ...node, children: setChildren(node.children, targetNodeId, children, append) }
    }
    return node
  })
}

function loadMoreNode(cursor: SiblingCursor): TreeNode {
  return {
    nodeId: `more:${cursor.nodeId}`,
    group: true,
    isCorporation: false,
    isValidator: false,
    icon: faEllipsis,
    iconColorClass: 'text-gray-400',
    parentId: cursor.nodeId,
    loadMore: cursor,
  }
}

function memberCount(parent: Participant, role: string): number | undefined {
  const counters: Record<string, string | number | undefined> = {
    ECOSYSTEM: parent.participants_ecosystem,
    ISSUER_GRANTOR: parent.participants_issuer_grantor,
    VERIFIER_GRANTOR: parent.participants_verifier_grantor,
    ISSUER: parent.participants_issuer,
    VERIFIER: parent.participants_verifier,
    HOLDER: parent.participants_holder,
  }
  const value = counters[role]
  if (value === undefined) return undefined
  const count = Number(value)
  return Number.isFinite(count) ? count : undefined
}

export default function ParticipantsPage() {
  const params = useParams()
  const schemaId = params?.id as string
  const veranaChain = useVeranaChain()
  const { isWalletConnected, connect } = useChain(veranaChain.chain_name)
  const { actingCorporation } = useUserCorporation()
  const ownedIds = useRef<Set<string>>(new Set())
  const predecessorIds = useRef<Set<string>>(new Set())

  const [role, setRole] = useState<string | undefined>('ECOSYSTEM')
  const [validatorId, setValidatorId] = useState<string | undefined>()
  const [afterId, setAfterId] = useState<string | undefined>()
  const [requestedNodeId, setRequestedNodeId] = useState<string | undefined>()
  const [refreshRoot, setRefreshRoot] = useState(false)
  const [participantTree, setParticipantTree] = useState<TreeNode[]>([])

  const {
    participants,
    hasMore,
    loadedFor,
    refetch: refetchParticipants,
  } = useParticipants(schemaId, role, validatorId, { afterId })
  const { credentialSchema } = useCredentialSchemaData(schemaId)
  const ecosystemId = credentialSchema ? String(credentialSchema.ecosystemId) : ''
  const { ecosystem } = useEcosystemData(ecosystemId)
  const unsupportedPricing = credentialSchema && !isNativePricing(credentialSchema) ? credentialSchema : undefined

  const onboardingModes = useMemo(
    () =>
      credentialSchema
        ? {
            issuerOnboardingMode: String(credentialSchema.issuerOnboardingMode),
            verifierOnboardingMode: String(credentialSchema.verifierOnboardingMode),
            holderOnboardingMode:
              credentialSchema.holderOnboardingMode == null ? null : String(credentialSchema.holderOnboardingMode),
          }
        : undefined,
    [credentialSchema]
  )

  const foldersByRole = useCallback(
    (parent: Participant, roles: ChildRole[]): TreeNode[] =>
      roles.map((childRole) => ({
        nodeId: `group:${parent.id}:${childRole.role}`,
        name: childRole.label,
        onboardingAction: isWalletConnected
          ? childRole.validation
            ? childRole.role === 'HOLDER' && Number(parent.validation_fees) === 0
              ? 'LinkDID'
              : 'MsgStartParticipantOP'
            : 'MsgSelfCreateParticipant'
          : 'Connect',
        onboardingLabel: onboardingModes
          ? translate(`dataview.cs.managementMode.${participantOnboardingMode(childRole.role, onboardingModes)}`)
          : '',
        badgeCount: memberCount(parent, childRole.role),
        isCorporation: false,
        isValidator: false,
        group: true,
        schemaId,
        parentId: parent.id,
        type: childRole.role,
        roleColorClass: roleColorClass(childRole.role),
        icon: faFolder,
        iconColorClass: roleJoinColorClass(childRole.role),
        children: [],
        participant: parent,
        enabledJoin: parent.participant_state === 'ACTIVE',
      })),
    [isWalletConnected, onboardingModes, schemaId]
  )

  const toTreeNode = useCallback(
    (node: BuiltParticipant, childRoles: ChildRole[]): TreeNode => {
      const validatorParticipantId = node.validator_participant_id ?? ''
      const isCorporation = actingCorporation?.corporation.id === node.corporation_id
      const isValidator = ownedIds.current.has(validatorParticipantId)
      const isPredecessor = predecessorIds.current.has(validatorParticipantId)
      if (isCorporation) ownedIds.current.add(node.id)
      if (isValidator || isPredecessor) predecessorIds.current.add(node.id)
      const authority = participantAuthority(isCorporation, isValidator, isPredecessor)
      return {
        nodeId: node.id,
        name: node.did ?? node.role,
        group: false,
        parentId: validatorParticipantId || ROOT_NODE_ID,
        isCorporation,
        isValidator,
        roleColorClass: roleColorClass(node.role),
        icon: authority.icon,
        iconColorClass: authority.iconColorClass,
        participant: node,
        children: foldersByRole(node, childRoles),
      }
    },
    [actingCorporation?.corporation.id, foldersByRole]
  )

  const setNodeRequestParams = useCallback(
    (nodeId?: string, requestedRole?: string, requestedValidatorId?: string, requestedAfterId?: string) => {
      setRole(requestedRole)
      setValidatorId(requestedValidatorId)
      setAfterId(requestedAfterId)
      setRequestedNodeId(nodeId)
    },
    []
  )

  const childRoles = useMemo(
    () =>
      credentialSchema
        ? nodeChildRoles(
            String(credentialSchema.issuerOnboardingMode),
            String(credentialSchema.verifierOnboardingMode),
            role ?? ''
          )
        : [],
    [credentialSchema, role]
  )

  const expectedKey = schemaId ? participantListQuery(schemaId, role, validatorId, { afterId }).toString() : undefined

  useEffect(() => {
    if (!loadedFor || loadedFor !== expectedKey) return
    const targetNodeId = requestedNodeId ?? ROOT_NODE_ID
    const last = participants[participants.length - 1]
    const more =
      hasMore && last && role ? [loadMoreNode({ nodeId: targetNodeId, role, validatorId, afterId: last.id })] : []
    if (role === 'ECOSYSTEM' && !validatorId) {
      if (afterId === undefined) {
        ownedIds.current.clear()
        predecessorIds.current.clear()
      }
      const roots = [...buildTreeByValidator(participants).map((node) => toTreeNode(node, childRoles)), ...more]
      setParticipantTree((current) => (afterId === undefined ? roots : mergeSiblings(current, roots)))
      return
    }
    if (role && validatorId && requestedNodeId) {
      const children = [
        ...participants.map((participant) => toTreeNode({ ...participant, children: [] }, childRoles)),
        ...more,
      ]
      setParticipantTree((current) => setChildren(current, requestedNodeId, children, afterId !== undefined))
    }
  }, [
    afterId,
    childRoles,
    expectedKey,
    hasMore,
    loadedFor,
    participants,
    requestedNodeId,
    role,
    toTreeNode,
    validatorId,
  ])

  useEffect(() => {
    if (!refreshRoot) return
    if (role === 'ECOSYSTEM' && !validatorId && afterId === undefined) void refetchParticipants()
    else setNodeRequestParams(undefined, 'ECOSYSTEM', undefined, undefined)
    setRefreshRoot(false)
  }, [afterId, refetchParticipants, refreshRoot, role, setNodeRequestParams, validatorId])

  const retryFetch = useCallback(
    () => refetchParticipants(schemaId, role, validatorId, afterId),
    [afterId, refetchParticipants, role, schemaId, validatorId]
  )

  return (
    <ParticipantTree
      tree={participantTree}
      type="participants"
      schemaTitle={credentialSchema?.title ?? ''}
      schemaDescription={credentialSchema?.description}
      schemaStatus={credentialSchema?.archived ? 'ARCHIVED' : 'ACTIVE'}
      issuerOnboardingMode={credentialSchema?.issuerOnboardingMode}
      verifierOnboardingMode={credentialSchema?.verifierOnboardingMode}
      ecosystemTitle={ecosystem?.did ?? ''}
      schemaId={credentialSchema?.id != null ? String(credentialSchema.id) : undefined}
      ecosystemId={ecosystemId || undefined}
      unsupportedPricing={unsupportedPricing}
      isEcosystemController={actingCorporation?.corporation.id === ecosystem?.corporationId}
      viewerCorporationId={actingCorporation?.corporation.id}
      setNodeRequestParams={setNodeRequestParams}
      refreshRoot={() => setRefreshRoot(true)}
      onConnect={!isWalletConnected ? connect : undefined}
      onRetryFetch={retryFetch}
    />
  )
}
