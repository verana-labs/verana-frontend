'use client'

import { useChain } from '@cosmos-kit/react'
import { faFolder } from '@fortawesome/free-solid-svg-icons'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { participantsPageKey, useParticipants } from '@/hooks/useParticipants'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { isHolderOnboardingMode } from '@/lib/participant-onboarding'
import { isNativePricing } from '@/lib/pricing-asset'
import ParticipantTree, { mergeTrees, type ParticipantView, ROOT_NODE_ID } from '@/ui/common/participant-tree'
import { withAuthority } from '@/ui/common/participant-tree-filter'
import type { TreeNode } from '@/ui/common/participant-tree-types'
import type { CredentialSchemaData } from '@/ui/dataview/datasections/cs'
import type { Participant } from '@/ui/dataview/datasections/participant'
import { ParticipantsTable } from '@/ui/participants/participants-table'
import { TreeEmpty, TreeError, TreeSkeleton } from '@/ui/participants/tree-states'
import {
  childRoleOnboardingAction,
  childRoleOnboardingLabel,
  nodeChildRoles,
  participantAuthority,
  roleColorClass,
  roleJoinColorClass,
} from '@/util/util'

type BuiltParticipant = Participant & { children: BuiltParticipant[] }
type ChildRole = ReturnType<typeof nodeChildRoles>[number]

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

function mergeBy<T>(existing: T[], incoming: T[], key: (item: T) => string): T[] {
  const byKey = new Map(existing.map((item) => [key(item), item]))
  for (const item of incoming) byKey.set(key(item), item)
  return [...byKey.values()]
}

function setChildren(nodes: TreeNode[], targetNodeId: string, children: TreeNode[], append: boolean): TreeNode[] {
  return nodes.map((node) => {
    if (node.nodeId === targetNodeId) {
      return { ...node, children: append ? mergeBy(node.children ?? [], children, (child) => child.nodeId) : children }
    }
    if (node.children?.length) {
      return { ...node, children: setChildren(node.children, targetNodeId, children, append) }
    }
    return node
  })
}

type TreeRequest = { nodeId?: string; role?: string; validatorId?: string; after?: string }
type NodePage = { role?: string; validatorId?: string; cursor?: string; hasNext: boolean }

type SchemaParticipantsPanelProps = {
  schemaId: string
  credentialSchema: CredentialSchemaData
  ecosystem: { id: string; did: string; corporationId?: number } | null
  view: ParticipantView
  onViewChange: (view: ParticipantView) => void
}

export function SchemaParticipantsPanel({
  schemaId,
  credentialSchema,
  ecosystem,
  view,
  onViewChange,
}: SchemaParticipantsPanelProps) {
  const veranaChain = useVeranaChain()
  const { isWalletConnected, connect } = useChain(veranaChain.chain_name)
  const { actingCorporation } = useUserCorporation()
  const corporationId = actingCorporation?.corporation.id

  const [request, setRequest] = useState<TreeRequest>({ role: 'ECOSYSTEM' })
  const [pages, setPages] = useState<Record<string, NodePage>>({})
  const [refreshRoot, setRefreshRoot] = useState(false)
  const [tableRefresh, setTableRefresh] = useState(0)
  const [participantTree, setParticipantTree] = useState<TreeNode[]>([])
  const rootRows = useRef<Participant[]>([])

  const { role, validatorId } = request
  const {
    participants,
    pageKey,
    refetch: refetchParticipants,
    hasNext,
    errorParticipants,
  } = useParticipants(schemaId, role, validatorId, { after: request.after })
  const ecosystemId = String(credentialSchema.ecosystemId)
  const unsupportedPricing = isNativePricing(credentialSchema) ? undefined : credentialSchema

  const foldersByRole = useCallback(
    (parent: Participant, roles: ChildRole[]): TreeNode[] =>
      roles.map((childRole) => ({
        nodeId: `group:${parent.id}:${childRole.role}`,
        name: childRole.label,
        onboardingAction: childRoleOnboardingAction(childRole, isWalletConnected),
        onboardingLabel: childRoleOnboardingLabel(childRole),
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
      const isCorporation = corporationId === node.corporation_id
      const authority = participantAuthority(isCorporation, false, false)
      return {
        nodeId: node.id,
        name: node.did ?? node.role,
        group: false,
        parentId: validatorParticipantId || 'root',
        isCorporation,
        isValidator: false,
        roleColorClass: roleColorClass(node.role),
        icon: authority.icon,
        iconColorClass: authority.iconColorClass,
        participant: node,
        children: foldersByRole(node, childRoles),
      }
    },
    [corporationId, foldersByRole]
  )

  const setNodeRequestParams = useCallback((nodeId?: string, requestedRole?: string, requestedValidatorId?: string) => {
    setRequest({ nodeId, role: requestedRole, validatorId: requestedValidatorId })
  }, [])

  const loadMoreNode = useCallback(
    (nodeId: string) => {
      const page = pages[nodeId]
      if (!page?.cursor) return
      setRequest({
        nodeId: nodeId === ROOT_NODE_ID ? undefined : nodeId,
        role: page.role,
        validatorId: page.validatorId,
        after: page.cursor,
      })
    },
    [pages]
  )

  const childRoles = useMemo(
    () =>
      nodeChildRoles(
        String(credentialSchema.issuerOnboardingMode),
        String(credentialSchema.verifierOnboardingMode),
        isHolderOnboardingMode(credentialSchema.holderOnboardingMode) ? credentialSchema.holderOnboardingMode : null,
        role ?? ''
      ),
    [credentialSchema, role]
  )

  useEffect(() => {
    const target = role === 'ECOSYSTEM' ? ROOT_NODE_ID : request.nodeId
    if (!target) return
    if (target !== ROOT_NODE_ID && !(role && validatorId)) return
    if (pageKey !== participantsPageKey({ schema: schemaId, role, validator: validatorId, after: request.after }))
      return

    const appending = request.after !== undefined
    if (target === ROOT_NODE_ID) {
      const rows = appending ? mergeBy(rootRows.current, participants, (row) => row.id) : participants
      rootRows.current = rows
      const rebuilt = buildTreeByValidator(rows).map((node) => toTreeNode(node, childRoles))
      setParticipantTree((current) => withAuthority(mergeTrees(current, rebuilt), corporationId))
    } else {
      const children = participants.map((participant) => toTreeNode({ ...participant, children: [] }, childRoles))
      setParticipantTree((current) => withAuthority(setChildren(current, target, children, appending), corporationId))
    }

    const last = participants[participants.length - 1]
    setPages((current) => ({
      ...current,
      [target]: { role, validatorId, cursor: last?.id ?? current[target]?.cursor, hasNext },
    }))
  }, [childRoles, corporationId, hasNext, pageKey, participants, request, role, schemaId, toTreeNode, validatorId])

  useEffect(() => {
    setParticipantTree((current) => withAuthority(current, corporationId))
  }, [corporationId])

  useEffect(() => {
    if (!refreshRoot) return
    if (role === 'ECOSYSTEM' && request.after === undefined) void refetchParticipants()
    else setNodeRequestParams(undefined, 'ECOSYSTEM', undefined)
    setRefreshRoot(false)
  }, [refetchParticipants, refreshRoot, request.after, role, setNodeRequestParams])

  const retryFetch = useCallback(
    () => refetchParticipants(schemaId, role, validatorId),
    [refetchParticipants, role, schemaId, validatorId]
  )

  const moreNodeIds = useMemo(
    () => new Set(Object.entries(pages).flatMap(([nodeId, page]) => (page.hasNext ? [nodeId] : []))),
    [pages]
  )

  const rootLoaded = pages[ROOT_NODE_ID] !== undefined
  const placeholder = rootLoaded ? (
    participantTree.length === 0 ? (
      <TreeEmpty />
    ) : null
  ) : errorParticipants && role === 'ECOSYSTEM' ? (
    <TreeError onRetry={() => void refetchParticipants()} />
  ) : (
    <TreeSkeleton />
  )

  return (
    <ParticipantTree
      tree={participantTree}
      type="participants"
      schemaTitle={credentialSchema.title ?? ''}
      schemaDescription={credentialSchema.description}
      schemaStatus={credentialSchema.archived ? 'ARCHIVED' : 'ACTIVE'}
      issuerOnboardingMode={credentialSchema.issuerOnboardingMode}
      verifierOnboardingMode={credentialSchema.verifierOnboardingMode}
      holderOnboardingMode={credentialSchema.holderOnboardingMode ?? undefined}
      ecosystemTitle={ecosystem?.did ?? ''}
      schemaId={String(credentialSchema.id)}
      ecosystemId={ecosystemId || undefined}
      unsupportedPricing={unsupportedPricing}
      isEcosystemController={actingCorporation?.corporation.id === ecosystem?.corporationId}
      viewerCorporationId={actingCorporation?.corporation.id}
      setNodeRequestParams={setNodeRequestParams}
      moreNodeIds={moreNodeIds}
      loadMore={loadMoreNode}
      refreshRoot={() => {
        setRefreshRoot(true)
        setTableRefresh((count) => count + 1)
      }}
      onConnect={!isWalletConnected ? connect : undefined}
      onRetryFetch={retryFetch}
      placeholder={placeholder}
      embedded
      view={view}
      onViewChange={onViewChange}
      renderTable={({ selectedId, onSelect, filters, onShowAll }) => (
        <ParticipantsTable
          schemaId={schemaId}
          selectedId={selectedId}
          onSelect={onSelect}
          filters={filters}
          onShowAll={onShowAll}
          refreshToken={tableRefresh}
        />
      )}
    />
  )
}
