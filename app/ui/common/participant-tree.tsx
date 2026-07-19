'use client'

import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { translate } from '@/i18n/dataview'
import { logger } from '@/lib/logger'
import AddJoinPage from '@/participants/add/page'
import { useIndexerEvents } from '@/providers/indexer-events-provider'
import EcosystemBreadcrumb from '@/ui/common/ecosystem-breadcrumb'
import type { ParticipantRefreshState, TreeNode } from '@/ui/common/participant-tree-types'
import SchemaHeader, { type SchemaStatus } from '@/ui/common/schema-header'
import type { Participant } from '@/ui/dataview/datasections/participant'
import { resolveTranslatable } from '@/ui/dataview/types'
import { renderActionComponent } from './data-view-typed'
import { ModalAction } from './modal-action'
import ParticipantCard from './participant-card'
import TreeNodeHeader from './tree-node-header'

type ParticipantTreeProps = {
  tree: TreeNode[]
  type: 'participants' | 'tasks'
  schemaTitle?: string
  schemaId?: string
  schemaDescription?: string
  schemaStatus?: SchemaStatus
  issuerOnboardingMode?: string | number
  verifierOnboardingMode?: string | number
  ecosystemTitle?: string
  ecosystemId?: string
  isEcosystemController?: boolean
  viewerCorporationId?: number
  setNodeRequestParams?: (nodeId?: string, role?: string, validatorId?: string) => void
  refreshRoot?: () => void
  onConnect?: () => void
  onRetryFetch?: () => void
}

function findNodeAndPath(nodes: TreeNode[], id: string): { node?: TreeNode; path: TreeNode[] } {
  const queue = nodes.map((node) => ({ node, path: [node] }))
  while (queue.length) {
    const current = queue.shift()
    if (!current) break
    if (current.node.nodeId === id) return current
    for (const child of current.node.children ?? []) {
      queue.push({ node: child, path: [...current.path, child] })
    }
  }
  return { path: [] }
}

function findNode(nodes: TreeNode[], id: string): TreeNode | undefined {
  for (const node of nodes) {
    if (node.nodeId === id) return node
    const child = findNode(node.children ?? [], id)
    if (child) return child
  }
}

function mergeTrees(previous: TreeNode[], next: TreeNode[]): TreeNode[] {
  const previousById = new Map(previous.map((node) => [node.nodeId, node]))
  return next.map((node) => {
    const oldNode = previousById.get(node.nodeId)
    if (node.group) return { ...node, children: node.children ?? [] }
    return {
      ...oldNode,
      ...node,
      children:
        node.children?.length && oldNode?.children
          ? mergeTrees(oldNode.children, node.children)
          : (oldNode?.children ?? node.children ?? []),
    }
  })
}

function updateParticipant(nodes: TreeNode[], participant: Participant): TreeNode[] {
  return nodes.map((node) => ({
    ...node,
    participant: node.nodeId === participant.id ? participant : node.participant,
    children: node.children?.length ? updateParticipant(node.children, participant) : node.children,
  }))
}

function Tree({
  type,
  nodes,
  selectedId,
  expanded,
  showWeight,
  showBusiness,
  showStats,
  onSelect,
  onToggle,
  onJoin,
  onConnect,
  depth = 0,
}: {
  type: 'participants' | 'tasks'
  nodes: TreeNode[]
  selectedId?: string
  expanded: Record<string, boolean>
  showWeight: boolean
  showBusiness: boolean
  showStats: boolean
  onSelect: (id: string) => void
  onToggle: (id: string, role?: string, validatorId?: string) => void
  onJoin: (node: TreeNode) => void
  onConnect?: () => void
  depth?: number
}) {
  return (
    <div className="space-y-1">
      {nodes.map((node) => {
        const isExpanded = expanded[node.nodeId] ?? false
        return (
          <div key={node.nodeId}>
            <div
              className={`rounded-lg p-2 transition-all hover:bg-primary-600/5 ${selectedId === node.nodeId ? 'bg-primary-600/10' : ''}`}
              style={{ marginLeft: depth * 24 }}
            >
              <TreeNodeHeader
                node={node}
                type={type}
                isExpanded={isExpanded}
                showWeight={showWeight}
                showBusiness={showBusiness}
                showStats={showStats}
                onToggle={onToggle}
                onSelect={onSelect}
                onJoin={onJoin}
                onConnect={onConnect}
              />
            </div>
            {node.children?.length && isExpanded ? (
              <Tree
                type={type}
                nodes={node.children}
                selectedId={selectedId}
                expanded={expanded}
                showWeight={showWeight}
                showBusiness={showBusiness}
                showStats={showStats}
                onSelect={onSelect}
                onToggle={onToggle}
                onJoin={onJoin}
                onConnect={onConnect}
                depth={depth + 1}
              />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

export default function ParticipantTree({
  tree,
  type,
  schemaTitle,
  schemaDescription,
  schemaStatus,
  issuerOnboardingMode,
  verifierOnboardingMode,
  ecosystemTitle,
  schemaId,
  ecosystemId,
  isEcosystemController,
  viewerCorporationId,
  setNodeRequestParams,
  refreshRoot,
  onConnect,
  onRetryFetch,
}: ParticipantTreeProps) {
  const [showWeight, setShowWeight] = useState(false)
  const [showBusiness, setShowBusiness] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [addingRoot, setAddingRoot] = useState(false)
  const [joinNode, setJoinNode] = useState<TreeNode>()
  const [treeState, setTreeState] = useState(tree)
  const [refreshState, setRefreshState] = useState<ParticipantRefreshState>({})
  const detailRef = useRef<HTMLDivElement | null>(null)
  const { latestProcessedHeight } = useIndexerEvents()
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => (tree[0] ? { [tree[0].nodeId]: true } : {}))
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const selectedId = searchParams.get('participant') ?? undefined

  const select = useCallback(
    (id: string) => {
      const next = new URLSearchParams(searchParams.toString())
      next.set('participant', id)
      window.history.pushState(null, '', `${pathname}?${next.toString()}`)
    },
    [pathname, searchParams]
  )

  function toggle(id: string, role?: string, validatorId?: string) {
    const opening = !(expanded[id] ?? false)
    setExpanded((current) => ({ ...current, [id]: opening }))
    if (opening && !(findNode(treeState, id)?.children?.length ?? 0)) {
      setNodeRequestParams?.(id, role, validatorId)
    }
  }

  const selection = useMemo(
    () => (selectedId ? findNodeAndPath(treeState, selectedId) : { path: [] }),
    [selectedId, treeState]
  )

  useEffect(() => {
    setTreeState((current) => mergeTrees(current, tree))
    setExpanded((current) => {
      const next: Record<string, boolean> = {}
      const collect = (nodes: TreeNode[]) => {
        for (const node of nodes) {
          if (current[node.nodeId] ?? (type === 'tasks' && node.group)) next[node.nodeId] = true
          collect(node.children ?? [])
        }
      }
      collect(tree)
      if (!Object.keys(next).length && tree[0]) next[tree[0].nodeId] = true
      return next
    })
  }, [tree, type])

  useEffect(() => {
    if (!selectedId) return
    detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [selectedId])

  useEffect(() => {
    if (!refreshState.joinNode || refreshState.txHeight == null) return
    logger.info('ParticipantTree', {
      txHeight: refreshState.txHeight,
      latestProcessedHeight,
    })
    if (latestProcessedHeight < refreshState.txHeight) return
    setNodeRequestParams?.(refreshState.joinNode.nodeId, refreshState.joinNode.type, refreshState.joinNode.parentId)
    setRefreshState((current) => ({ ...current, txHeight: undefined }))
  }, [latestProcessedHeight, refreshState.joinNode, refreshState.txHeight, setNodeRequestParams])

  useEffect(() => {
    const { joinNode: refreshedJoin, id, txHeight } = refreshState
    if (!refreshedJoin || txHeight != null) return
    if (!id || !findNode(treeState, id)) {
      onRetryFetch?.()
      return
    }
    setExpanded((current) => ({ ...current, [refreshedJoin.nodeId]: true }))
    select(id)
    setRefreshState({})
  }, [onRetryFetch, refreshState, select, treeState])

  return (
    <>
      {type === 'participants' && ecosystemTitle && ecosystemId ? (
        <EcosystemBreadcrumb ecosystemId={ecosystemId} ecosystemDid={ecosystemTitle} />
      ) : null}
      {type === 'participants' && schemaTitle && schemaId ? (
        <SchemaHeader
          title={schemaTitle}
          description={schemaDescription}
          id={schemaId}
          status={schemaStatus}
          issuerOnboardingMode={issuerOnboardingMode}
          verifierOnboardingMode={verifierOnboardingMode}
        />
      ) : null}
      {type === 'tasks' ? (
        <section className="mb-8">
          <h1 className="page-title">{resolveTranslatable({ key: 'task.title' }, translate) ?? ''}</h1>
          <p className="page-description">{resolveTranslatable({ key: 'task.description' }, translate) ?? ''}</p>
        </section>
      ) : null}

      <section className="bg-white dark:bg-surface border border-neutral-20 dark:border-neutral-70 rounded-xl p-6 mb-6">
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {resolveTranslatable(
              { key: type === 'participants' ? 'participants.tree.title' : 'task.tree.title' },
              translate
            ) ?? 'Tree'}
          </h2>
          {type === 'participants' ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {[
                ['weight', showWeight, setShowWeight],
                ['businessrules', showBusiness, setShowBusiness],
                ['stats', showStats, setShowStats],
              ].map(([name, checked, setChecked]) => (
                <label key={String(name)} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary-600 border-neutral-20 rounded focus:ring-primary-500"
                    checked={Boolean(checked)}
                    onChange={(event) => (setChecked as (value: boolean) => void)(event.target.checked)}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {resolveTranslatable({ key: `participants.show.${name}` }, translate)}
                  </span>
                </label>
              ))}
            </div>
          ) : null}
        </div>

        <Tree
          type={type}
          nodes={treeState}
          selectedId={selectedId}
          expanded={expanded}
          showWeight={showWeight}
          showBusiness={showBusiness}
          showStats={showStats}
          onSelect={select}
          onToggle={toggle}
          onJoin={(node) => {
            setNodeRequestParams?.()
            setJoinNode(node)
          }}
          onConnect={onConnect}
        />

        {type === 'participants' && isEcosystemController ? (
          <button
            type="button"
            className="flex items-center space-x-2 p-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            onClick={() => setAddingRoot(true)}
          >
            <FontAwesomeIcon icon={faPlus} className="text-sm" />
            <span className="text-sm font-medium">
              {resolveTranslatable({ key: 'participants.action.newparticipant' }, translate)}
            </span>
          </button>
        ) : null}
      </section>

      {addingRoot ? (
        <ModalAction
          onClose={() => setAddingRoot(false)}
          titleKey="participants.action.newparticipant"
          isActive={addingRoot}
        >
          {renderActionComponent(
            'MsgCreateRootParticipant',
            () => setAddingRoot(false),
            { id: '', schema_id: schemaId ?? '', role: 'ECOSYSTEM' },
            () => refreshRoot?.()
          )}
        </ModalAction>
      ) : null}

      {joinNode ? (
        <ModalAction
          onClose={() => setJoinNode(undefined)}
          titleKey={`${resolveTranslatable({ key: 'join.title' }, translate)} - ${schemaTitle} - ${joinNode.name ?? ''}`}
          isActive={true}
          classModal="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-xl bg-white dark:bg-surface"
        >
          <AddJoinPage
            ecosystemId={ecosystemId ?? ''}
            nodeJoin={joinNode}
            onCancel={() => setJoinNode(undefined)}
            onRefresh={(id, txHeight) => setRefreshState({ joinNode, id, txHeight })}
          />
        </ModalAction>
      ) : null}

      {selection.node ? (
        <div ref={detailRef}>
          <ParticipantCard
            selectedNode={selection.node}
            path={selection.path}
            schemaTitle={schemaTitle ?? ''}
            viewerCorporationId={viewerCorporationId}
            onRefresh={(participant) => setTreeState((current) => updateParticipant(current, participant))}
            onRefreshList={onRetryFetch}
          />
        </div>
      ) : null}
    </>
  )
}
