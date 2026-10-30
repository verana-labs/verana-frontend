'use client'

import { hotkeysCoreFeature, type ItemInstance, syncDataLoaderFeature } from '@headless-tree/core'
import { useTree } from '@headless-tree/react'
import { type KeyboardEvent, type ReactNode, useEffect, useMemo, useRef } from 'react'
import type { SchemaPricing } from '@/lib/pricing-asset'
import { ShowMoreButton } from '@/ui/common/keyset-pagination'
import type { TreeNode } from '@/ui/common/participant-tree-types'
import TreeNodeHeader from '@/ui/common/tree-node-header'
import { Tree, TreeItem } from '@/ui/participants/tree'

export const TREE_INDENT = 20

const TREE_ROOT = '__participant-tree-root__'

type ParticipantTreeViewProps = {
  type: 'participants' | 'tasks'
  label: string
  nodes: TreeNode[]
  selectedId?: string
  expandedIds: string[]
  onExpandedChange: (ids: string[]) => void
  showWeight: boolean
  showBusiness: boolean
  showStats: boolean
  onSelect: (id: string) => void
  onToggle: (id: string, role?: string, validatorId?: string) => void
  onJoin: (node: TreeNode) => void
  joinBlockedReason?: string
  feePricing?: SchemaPricing
  onConnect?: () => void
  moreNodeIds?: ReadonlySet<string>
  onLoadMore?: (nodeId: string) => void
}

type Index = { items: Map<string, TreeNode>; children: Map<string, string[]> }

function indexNodes(nodes: TreeNode[]): Index {
  const items = new Map<string, TreeNode>()
  const children = new Map<string, string[]>([[TREE_ROOT, nodes.map((node) => node.nodeId)]])
  const walk = (list: TreeNode[]) => {
    for (const node of list) {
      items.set(node.nodeId, node)
      children.set(
        node.nodeId,
        (node.children ?? []).map((child) => child.nodeId)
      )
      walk(node.children ?? [])
    }
  }
  walk(nodes)
  return { items, children }
}

function closingAncestors(items: ItemInstance<TreeNode>[], index: number): ItemInstance<TreeNode>[] {
  const nextLevel = items[index + 1]?.getItemMeta().level ?? -1
  const closing: ItemInstance<TreeNode>[] = []
  let current: ItemInstance<TreeNode> | undefined = items[index]
  while (current && current.getId() !== TREE_ROOT && current.getItemMeta().level >= nextLevel) {
    closing.push(current)
    current = current.getParent()
  }
  return closing
}

export function ParticipantTreeView({
  type,
  label,
  nodes,
  selectedId,
  expandedIds,
  onExpandedChange,
  showWeight,
  showBusiness,
  showStats,
  onSelect,
  onToggle,
  onJoin,
  joinBlockedReason,
  feePricing,
  onConnect,
  moreNodeIds,
  onLoadMore,
}: ParticipantTreeViewProps) {
  const index = useMemo(() => indexNodes(nodes), [nodes])
  const indexRef = useRef(index)
  const expandedRef = useRef(expandedIds)
  expandedRef.current = expandedIds

  const tree = useTree<TreeNode>({
    rootItemId: TREE_ROOT,
    indent: TREE_INDENT,
    state: { expandedItems: expandedIds },
    setExpandedItems: (updater) => {
      onExpandedChange(typeof updater === 'function' ? updater(expandedRef.current) : updater)
    },
    getItemName: (item) => item.getItemData()?.name ?? '',
    isItemFolder: (item) => {
      const node = item.getItemData()
      return item.getId() === TREE_ROOT || Boolean(node?.group || node?.children?.length)
    },
    dataLoader: {
      getItem: (id) => indexRef.current.items.get(id) ?? ({ nodeId: id } as TreeNode),
      getChildren: (id) => indexRef.current.children.get(id) ?? [],
    },
    features: [syncDataLoaderFeature, hotkeysCoreFeature],
  })

  useEffect(() => {
    indexRef.current = index
    tree.rebuildTree()
  }, [tree, index])

  const activate = (node: TreeNode) => {
    if (node.group) onToggle(node.nodeId, node.type, node.parentId)
    else onSelect(node.nodeId)
  }

  const items = tree.getItems()
  const rows: ReactNode[] = []
  items.forEach((item, position) => {
    const node = item.getItemData()
    if (!node?.nodeId || !index.items.has(node.nodeId)) return
    const loaded = node.children?.length ?? 0
    const childCount =
      node.group && type === 'participants' && loaded > 0
        ? `${loaded}${moreNodeIds?.has(node.nodeId) ? '+' : ''}`
        : undefined
    rows.push(
      <TreeItem
        key={node.nodeId}
        item={item}
        indent={TREE_INDENT}
        selected={selectedId === node.nodeId}
        className="group/row cursor-pointer animate-in fade-in-0 duration-200"
        onClick={() => {
          item.setFocused()
          activate(node)
        }}
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          if (event.target !== event.currentTarget) return
          if (event.key !== 'Enter' && event.key !== ' ') return
          event.preventDefault()
          activate(node)
        }}
      >
        <TreeNodeHeader
          node={node}
          type={type}
          isExpanded={item.isExpanded()}
          isSelected={selectedId === node.nodeId}
          childCount={childCount}
          showWeight={showWeight}
          showBusiness={showBusiness}
          showStats={showStats}
          onToggle={onToggle}
          onJoin={onJoin}
          joinBlockedReason={joinBlockedReason}
          feePricing={feePricing}
          onConnect={onConnect}
        />
      </TreeItem>
    )
    if (!onLoadMore || !moreNodeIds?.size) return
    for (const closing of closingAncestors(items, position)) {
      const closingId = closing.getId()
      if (!closing.isExpanded() || !moreNodeIds.has(closingId)) continue
      const indent = (closing.getItemMeta().level + 1) * TREE_INDENT + TREE_INDENT
      rows.push(
        <div key={`more:${closingId}`} role="none" className="py-0.5">
          <ShowMoreButton onClick={() => onLoadMore(closingId)} indent={indent} />
        </div>
      )
    }
  })

  return (
    <Tree tree={tree} indent={TREE_INDENT} label={label} className="gap-0.5">
      {rows}
    </Tree>
  )
}
