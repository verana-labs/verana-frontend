'use client'

import { useChain } from '@cosmos-kit/react'
import { faFolder } from '@fortawesome/free-solid-svg-icons'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCredentialSchemaData } from '@/hooks/useCredentialSchemaData'
import { useEcosystemData } from '@/hooks/useEcosystemData'
import { useParticipants } from '@/hooks/useParticipants'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import ParticipantTree from '@/ui/common/participant-tree'
import type { TreeNode } from '@/ui/common/participant-tree-types'
import type { Role } from '@/ui/common/role-card'
import type { Participant } from '@/ui/dataview/datasections/participant'
import { nodeChildRoles, participantAuthority, roleColorClass, roleJoinColorClass } from '@/util/util'

type BuiltParticipant = Participant & { children: BuiltParticipant[] }
type ChildRole = { role: Role; label: string; validation: boolean }

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

function setChildren(nodes: TreeNode[], targetNodeId: string, children: TreeNode[]): TreeNode[] {
  return nodes.map((node) => {
    if (node.nodeId === targetNodeId) return { ...node, children }
    if (node.children?.length) return { ...node, children: setChildren(node.children, targetNodeId, children) }
    return node
  })
}

export default function ParticipantsPage() {
  const params = useParams()
  const schemaId = params?.id as string
  const veranaChain = useVeranaChain()
  const { isWalletConnected, connect } = useChain(veranaChain.chain_name)
  const { corporation } = useUserCorporation()
  const ownedIds = useRef<Set<string>>(new Set())
  const predecessorIds = useRef<Set<string>>(new Set())

  const [role, setRole] = useState<string | undefined>('ECOSYSTEM')
  const [validatorId, setValidatorId] = useState<string | undefined>()
  const [requestedNodeId, setRequestedNodeId] = useState<string | undefined>()
  const [refreshRoot, setRefreshRoot] = useState(false)
  const [participantTree, setParticipantTree] = useState<TreeNode[]>([])

  const { participants, refetch: refetchParticipants } = useParticipants(schemaId, role, validatorId)
  const { credentialSchema } = useCredentialSchemaData(schemaId)
  const ecosystemId = credentialSchema ? String(credentialSchema.ecosystemId) : ''
  const { ecosystem } = useEcosystemData(ecosystemId)

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
        onboardingLabel: childRole.validation ? 'onboarding process' : 'open',
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
    [isWalletConnected, schemaId]
  )

  const toTreeNode = useCallback(
    (node: BuiltParticipant, childRoles: ChildRole[]): TreeNode => {
      const validatorParticipantId = node.validator_participant_id ?? ''
      const isCorporation = corporation?.id === node.corporation_id
      const isValidator = ownedIds.current.has(validatorParticipantId)
      const isPredecessor = predecessorIds.current.has(validatorParticipantId)
      if (isCorporation) ownedIds.current.add(node.id)
      if (isValidator || isPredecessor) predecessorIds.current.add(node.id)
      const authority = participantAuthority(isCorporation, isValidator, isPredecessor)
      return {
        nodeId: node.id,
        name: node.did ?? node.role,
        group: false,
        parentId: validatorParticipantId || 'root',
        isCorporation,
        isValidator,
        roleColorClass: roleColorClass(node.role),
        icon: authority.icon,
        iconColorClass: authority.iconColorClass,
        participant: node,
        children: foldersByRole(node, childRoles),
      }
    },
    [corporation?.id, foldersByRole]
  )

  const setNodeRequestParams = useCallback((nodeId?: string, requestedRole?: string, requestedValidatorId?: string) => {
    setRole(requestedRole)
    setValidatorId(requestedValidatorId)
    setRequestedNodeId(nodeId)
  }, [])

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

  useEffect(() => {
    if (role === 'ECOSYSTEM') {
      ownedIds.current.clear()
      predecessorIds.current.clear()
      setParticipantTree(buildTreeByValidator(participants).map((node) => toTreeNode(node, childRoles)))
      return
    }
    if (role && validatorId && requestedNodeId) {
      const children = participants.map((participant) => toTreeNode({ ...participant, children: [] }, childRoles))
      setParticipantTree((current) => setChildren(current, requestedNodeId, children))
    }
  }, [childRoles, participants, requestedNodeId, role, toTreeNode, validatorId])

  useEffect(() => {
    if (!refreshRoot) return
    if (role === 'ECOSYSTEM') void refetchParticipants()
    else setNodeRequestParams(undefined, 'ECOSYSTEM', undefined)
    setRefreshRoot(false)
  }, [refetchParticipants, refreshRoot, role, setNodeRequestParams])

  const retryFetch = useCallback(
    () => refetchParticipants(schemaId, role, validatorId),
    [refetchParticipants, role, schemaId, validatorId]
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
      isEcosystemController={corporation?.id === ecosystem?.corporationId}
      viewerCorporationId={corporation?.id}
      setNodeRequestParams={setNodeRequestParams}
      refreshRoot={() => setRefreshRoot(true)}
      onConnect={!isWalletConnected ? connect : undefined}
      onRetryFetch={retryFetch}
    />
  )
}
