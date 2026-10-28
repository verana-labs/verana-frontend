'use client'

import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { Columns3Icon, EyeIcon, EyeOffIcon, ListCollapseIcon, ListTreeIcon, NetworkIcon } from 'lucide-react'
import { usePathname, useSearchParams } from 'next/navigation'
import { type ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useParticipant } from '@/hooks/useParticipant'
import { translate } from '@/i18n/dataview'
import { logger } from '@/lib/logger'
import type { SchemaPricing } from '@/lib/pricing-asset'
import { cn } from '@/lib/utils'
import { useIndexerEvents } from '@/providers/indexer-events-provider'
import { EntityActionButton } from '@/ui/common/capability-button'
import { EmptyState } from '@/ui/common/empty-state'
import { HolderWebsite } from '@/ui/common/holder-website'
import JoinFlow from '@/ui/common/join-flow'
import { ShowMoreButton } from '@/ui/common/keyset-pagination'
import type { ParticipantRefreshState, TreeNode } from '@/ui/common/participant-tree-types'
import { PricingNotice, unsupportedPricingReason } from '@/ui/common/pricing-notice'
import type { Participant } from '@/ui/dataview/datasections/participant'
import { resolveTranslatable } from '@/ui/dataview/types'
import { BlurFade } from '@/ui/motion/blur-fade'
import { DetailSheet } from '@/ui/participants/detail-sheet'
import { ParticipantTreeView } from '@/ui/participants/participant-tree-view'
import { SchemaHero, SchemaHeroSkeleton, type SchemaStatus } from '@/ui/participants/schema-hero'
import { useMobileQuery } from '@/ui/participants/use-mobile-query'
import { useScrollFade } from '@/ui/participants/use-scroll-fade'
import { Badge } from '@/ui/shadcn/badge'
import { Button, buttonVariants } from '@/ui/shadcn/button'
import { Card, CardAction, CardHeader, CardTitle } from '@/ui/shadcn/card'
import { Checkbox } from '@/ui/shadcn/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/ui/shadcn/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/shadcn/tooltip'
import { participantAuthority, roleColorClass } from '@/util/util'
import { renderActionComponent } from './data-view-typed'
import { ModalAction } from './modal-action'
import ParticipantCard, { ParticipantCardPlaceholder, participantCardTitle } from './participant-card'
import { collectParticipantTrust, countParticipants, filterParticipantTree } from './participant-tree-filter'

export const ROOT_NODE_ID = 'root'

const SIDE_BY_SIDE_MIN_WIDTH = 1040

type ParticipantTreeProps = {
  tree: TreeNode[]
  type: 'participants' | 'tasks'
  schemaTitle?: string
  schemaId?: string
  schemaDescription?: string
  schemaStatus?: SchemaStatus
  issuerOnboardingMode?: string | number
  verifierOnboardingMode?: string | number
  holderOnboardingMode?: string | number
  ecosystemTitle?: string
  ecosystemId?: string
  unsupportedPricing?: SchemaPricing
  isEcosystemController?: boolean
  viewerCorporationId?: number
  setNodeRequestParams?: (nodeId?: string, role?: string, validatorId?: string) => void
  moreNodeIds?: ReadonlySet<string>
  loadMore?: (nodeId: string) => void
  refreshRoot?: () => void
  onConnect?: () => void
  onRetryFetch?: () => void
  placeholder?: ReactNode
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

function expandableIds(nodes: TreeNode[]): string[] {
  return nodes.flatMap((node) => (node.children?.length ? [node.nodeId, ...expandableIds(node.children)] : []))
}

export function mergeTrees(previous: TreeNode[], next: TreeNode[]): TreeNode[] {
  const previousById = new Map(previous.map((node) => [node.nodeId, node]))
  return next.map((node) => {
    const oldNode = previousById.get(node.nodeId)
    if (node.group) return { ...node, children: node.children?.length ? node.children : (oldNode?.children ?? []) }
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

function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    setWidth(element.getBoundingClientRect().width)
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return [ref, width] as const
}

function FilterChip({
  label,
  checked,
  onCheckedChange,
}: {
  label: string
  checked: boolean
  onCheckedChange: (value: boolean) => void
}) {
  return (
    <label
      className={cn(
        'inline-flex h-8 cursor-pointer items-center gap-2 rounded-md border bg-background px-2.5 text-sm whitespace-nowrap text-muted-foreground transition-colors duration-(--duration-base) ease-standard hover:text-foreground',
        checked && 'border-primary/40 bg-primary/5 text-foreground dark:bg-primary/10'
      )}
    >
      <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(value === true)} />
      {label}
    </label>
  )
}

function IconTooltipButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" onClick={onClick} aria-label={label} className="text-muted-foreground">
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
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
  holderOnboardingMode,
  ecosystemTitle,
  schemaId,
  ecosystemId,
  unsupportedPricing,
  isEcosystemController,
  viewerCorporationId,
  setNodeRequestParams,
  moreNodeIds,
  loadMore,
  refreshRoot,
  onConnect,
  onRetryFetch,
  placeholder,
}: ParticipantTreeProps) {
  const [showUnresolvable, setShowUnresolvable] = useState(false)
  const [showDisabled, setShowDisabled] = useState(false)
  const [showWeight, setShowWeight] = useState(false)
  const [showBusiness, setShowBusiness] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [addingRoot, setAddingRoot] = useState(false)
  const [joinNode, setJoinNode] = useState<TreeNode>()
  const [treeState, setTreeState] = useState(tree)
  const [refreshState, setRefreshState] = useState<ParticipantRefreshState>({})
  const detailRef = useRef<HTMLDivElement | null>(null)
  const [layoutRef, layoutWidth] = useElementWidth<HTMLDivElement>()
  const mobileQuery = useMobileQuery()
  const isMobile = mobileQuery === true
  const measured = layoutWidth > 0 && mobileQuery !== undefined
  const { latestProcessedHeight } = useIndexerEvents()
  const joinBlockedReason = unsupportedPricing ? unsupportedPricingReason() : undefined
  const tr = (key: string, fallback: string) => resolveTranslatable({ key }, translate) ?? fallback

  const visibleTree = useMemo(() => {
    if (type !== 'participants') return treeState
    return filterParticipantTree(
      treeState,
      { includeUnresolvable: showUnresolvable, includeDisabled: showDisabled },
      collectParticipantTrust(treeState)
    )
  }, [type, treeState, showUnresolvable, showDisabled])
  const visibleCount = useMemo(() => countParticipants(visibleTree), [visibleTree])
  const hiddenCount = useMemo(() => countParticipants(treeState) - visibleCount, [treeState, visibleCount])
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => (tree[0] ? { [tree[0].nodeId]: true } : {}))
  const expandedIds = useMemo(() => Object.keys(expanded).filter((id) => expanded[id]), [expanded])
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

  const clearSelection = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString())
    next.delete('participant')
    const query = next.toString()
    window.history.pushState(null, '', query ? `${pathname}?${query}` : pathname)
  }, [pathname, searchParams])

  function toggle(id: string, role?: string, validatorId?: string) {
    const opening = !(expanded[id] ?? false)
    setExpanded((current) => ({ ...current, [id]: opening }))
    if (opening && !(findNode(treeState, id)?.children?.length ?? 0)) {
      setNodeRequestParams?.(id, role, validatorId)
    }
  }

  function applyExpanded(ids: string[]) {
    const opened = ids.filter((id) => !expanded[id])
    setExpanded(Object.fromEntries(ids.map((id) => [id, true])))
    const lazy = opened.map((id) => findNode(treeState, id)).find((node) => node && !node.children?.length)
    if (lazy) setNodeRequestParams?.(lazy.nodeId, lazy.type, lazy.parentId)
  }

  const selection = useMemo(
    () => (selectedId ? findNodeAndPath(treeState, selectedId) : { path: [] }),
    [selectedId, treeState]
  )

  const missingSelectedId = selectedId && !selection.node ? selectedId : undefined
  const { participant: linkedParticipant } = useParticipant(missingSelectedId)
  const linkedNode = useMemo<TreeNode | undefined>(() => {
    if (!missingSelectedId || linkedParticipant?.id !== missingSelectedId) return undefined
    const isCorporation = linkedParticipant.corporation_id === viewerCorporationId
    const authority = participantAuthority(isCorporation, false, false)
    return {
      nodeId: linkedParticipant.id,
      name: linkedParticipant.did ?? linkedParticipant.role,
      group: false,
      parentId: linkedParticipant.validator_participant_id ?? 'root',
      isCorporation,
      isValidator: false,
      roleColorClass: roleColorClass(linkedParticipant.role),
      icon: authority.icon,
      iconColorClass: authority.iconColorClass,
      participant: linkedParticipant,
    }
  }, [linkedParticipant, missingSelectedId, viewerCorporationId])
  const detailNode = selection.node ?? linkedNode
  const allHidden = visibleTree.length === 0 && hiddenCount > 0
  const sideBySide =
    measured && !isMobile && layoutWidth >= SIDE_BY_SIDE_MIN_WIDTH && (Boolean(detailNode) || visibleTree.length > 0)
  const detailFade = useScrollFade<HTMLDivElement>(sideBySide)
  const requestedLinkedId = useRef<string>(undefined)

  useEffect(() => {
    const participant = linkedNode?.participant
    const validatorId = participant?.validator_participant_id
    if (!participant || !validatorId || requestedLinkedId.current === participant.id) return
    if (!findNode(treeState, validatorId)) return
    requestedLinkedId.current = participant.id
    const folderId = `group:${validatorId}:${participant.role}`
    setExpanded((current) => ({ ...current, [validatorId]: true, [folderId]: true }))
    setNodeRequestParams?.(folderId, participant.role, validatorId)
  }, [linkedNode, setNodeRequestParams, treeState])

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
    const { path } = findNodeAndPath(treeState, selectedId)
    const parents = path.slice(0, -1)
    if (!parents.length) return
    setExpanded((current) => {
      if (current[parents[parents.length - 1].nodeId]) return current
      const next = { ...current }
      for (const parent of parents) next[parent.nodeId] = true
      return next
    })
  }, [treeState, selectedId])

  const sideBySideRef = useRef(sideBySide)
  sideBySideRef.current = sideBySide
  const isMobileRef = useRef(isMobile)
  isMobileRef.current = isMobile

  useEffect(() => {
    if (!measured || !selectedId || isMobileRef.current) return
    if (sideBySideRef.current) {
      detailRef.current?.scrollTo({ top: 0 })
      return
    }
    detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [selectedId, measured])

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

  const retriedJoin = useRef<string>(undefined)

  useEffect(() => {
    const { joinNode: refreshedJoin, id, txHeight } = refreshState
    if (!refreshedJoin || txHeight != null) return
    if (!id || !findNode(treeState, id)) {
      const attempt = `${refreshedJoin.nodeId}:${id ?? ''}`
      if (retriedJoin.current === attempt) {
        setRefreshState({})
        return
      }
      retriedJoin.current = attempt
      onRetryFetch?.()
      return
    }
    retriedJoin.current = undefined
    setExpanded((current) => ({ ...current, [refreshedJoin.nodeId]: true }))
    select(id)
    setRefreshState({})
  }, [onRetryFetch, refreshState, select, treeState])

  const treeTitle = tr(type === 'participants' ? 'participants.tree.title' : 'task.tree.title', 'Tree')
  const detailCard = detailNode ? (
    <ParticipantCard
      key={detailNode.nodeId}
      selectedNode={detailNode}
      path={selection.node ? selection.path : [detailNode]}
      schemaTitle={schemaTitle ?? ''}
      pricingNoticeShown={Boolean(unsupportedPricing)}
      viewerCorporationId={viewerCorporationId}
      embedded={isMobile}
      onClose={isMobile ? undefined : clearSelection}
      onRefresh={(participant) => setTreeState((current) => updateParticipant(current, participant))}
      onRefreshList={onRetryFetch}
    />
  ) : null

  const toggles: Array<[string, boolean, (value: boolean) => void]> = [
    ['unresolvable', showUnresolvable, setShowUnresolvable],
    ['disabled', showDisabled, setShowDisabled],
  ]
  const showAll = () => {
    setShowUnresolvable(true)
    setShowDisabled(true)
  }
  const columns: Array<[string, boolean, (value: boolean) => void]> = [
    ['weight', showWeight, setShowWeight],
    ['businessrules', showBusiness, setShowBusiness],
    ['stats', showStats, setShowStats],
  ]
  const activeColumns = columns.filter(([, checked]) => checked).length

  return (
    <>
      {type === 'participants' ? (
        schemaTitle && schemaId ? (
          <SchemaHero
            compact
            title={schemaTitle}
            description={schemaDescription}
            id={schemaId}
            status={schemaStatus}
            issuerOnboardingMode={issuerOnboardingMode}
            verifierOnboardingMode={verifierOnboardingMode}
            holderOnboardingMode={holderOnboardingMode}
            ecosystem={ecosystemTitle && ecosystemId ? { id: ecosystemId, did: ecosystemTitle } : null}
            ecosystemPending={!ecosystemTitle}
          />
        ) : schemaId === undefined ? (
          <SchemaHeroSkeleton />
        ) : null
      ) : null}
      {unsupportedPricing ? <PricingNotice schema={unsupportedPricing} className="mb-6" /> : null}
      {type === 'tasks' ? (
        <BlurFade className="mb-6">
          <section>
            <h1 className="page-title tracking-tight">{resolveTranslatable({ key: 'task.title' }, translate) ?? ''}</h1>
            <p className="page-description">{resolveTranslatable({ key: 'task.description' }, translate) ?? ''}</p>
          </section>
        </BlurFade>
      ) : null}

      <div
        ref={layoutRef}
        className={cn('mb-6 grid items-start gap-6', sideBySide && 'grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]')}
      >
        <BlurFade delay={0.05} className="min-w-0">
          <Card className="gap-0 py-0">
            <CardHeader className="py-4">
              <CardTitle>
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <NetworkIcon aria-hidden="true" className="size-4 text-muted-foreground" />
                  {treeTitle}
                  {visibleCount > 0 ? (
                    <Badge variant="secondary" className="tabular-nums">
                      {visibleCount}
                      {moreNodeIds?.size ? '+' : ''}
                    </Badge>
                  ) : null}
                </h2>
              </CardTitle>
              <CardAction className="flex items-center gap-1">
                {visibleTree.length > 0 ? (
                  <>
                    <IconTooltipButton
                      label={tr('participants.tree.expandAll', 'Expand all')}
                      onClick={() => applyExpanded(expandableIds(visibleTree))}
                    >
                      <ListTreeIcon aria-hidden="true" />
                    </IconTooltipButton>
                    <IconTooltipButton
                      label={tr('participants.tree.collapseAll', 'Collapse all')}
                      onClick={() => setExpanded({})}
                    >
                      <ListCollapseIcon aria-hidden="true" />
                    </IconTooltipButton>
                  </>
                ) : null}
                {type === 'participants' ? (
                  <DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={tr('participants.tree.columns', 'Display')}
                            className="relative text-muted-foreground"
                          >
                            <Columns3Icon aria-hidden="true" />
                            {activeColumns > 0 ? (
                              <span
                                aria-hidden="true"
                                className="absolute end-1 top-1 size-1.5 rounded-full bg-primary ring-2 ring-card"
                              />
                            ) : null}
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent>{tr('participants.tree.columns', 'Display')}</TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>{tr('participants.tree.columns', 'Display')}</DropdownMenuLabel>
                      {columns.map(([name, checked, setChecked]) => (
                        <DropdownMenuCheckboxItem
                          key={name}
                          checked={checked}
                          onCheckedChange={(value) => setChecked(value === true)}
                          onSelect={(event) => event.preventDefault()}
                        >
                          {resolveTranslatable({ key: `participants.show.${name}` }, translate) ?? name}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
                {type === 'participants' && isEcosystemController ? (
                  <EntityActionButton
                    msgType="MsgCreateRootParticipant"
                    icon={faPlus}
                    label={translate('participants.action.newparticipant')}
                    blockedReason={joinBlockedReason}
                    onClick={() => setAddingRoot(true)}
                    className={buttonVariants({ size: 'sm', className: 'ms-1 gap-1.5' })}
                  />
                ) : null}
              </CardAction>
            </CardHeader>

            {type === 'participants' ? (
              <div className="border-y bg-muted/30 px-4 py-3">
                <fieldset className="flex min-w-0 flex-wrap items-center gap-2">
                  <legend className="sr-only">{tr('participants.tree.filters', 'Show')}</legend>
                  <span aria-hidden="true" className="me-1 text-xs font-medium text-muted-foreground">
                    {tr('participants.tree.filters', 'Show')}
                  </span>
                  {toggles.map(([name, checked, setChecked]) => (
                    <FilterChip
                      key={name}
                      label={resolveTranslatable({ key: `participants.show.${name}` }, translate) ?? name}
                      checked={checked}
                      onCheckedChange={setChecked}
                    />
                  ))}
                </fieldset>
              </div>
            ) : (
              <div className="border-t" />
            )}

            <div className="px-2 py-3 sm:px-3">
              {type === 'participants' && moreNodeIds?.size ? (
                <p className="px-2 pb-2 text-xs text-muted-foreground">
                  {resolveTranslatable({ key: 'pagination.loadedOnly' }, translate) ??
                    'Sorting and filters apply to the loaded results only.'}
                </p>
              ) : null}
              {allHidden ? (
                <EmptyState
                  outline={false}
                  className="py-10"
                  icon={<EyeOffIcon />}
                  title={translate('participants.filters.hidden', { count: hiddenCount })}
                  action={
                    <Button size="sm" onClick={showAll} className="gap-1.5">
                      <EyeIcon aria-hidden="true" />
                      {translate('participants.filters.showall')}
                    </Button>
                  }
                />
              ) : hiddenCount > 0 ? (
                <p className="mx-1 mb-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                  <EyeOffIcon aria-hidden="true" className="size-4 shrink-0" />
                  {translate('participants.filters.hidden', { count: hiddenCount })}{' '}
                  <button
                    type="button"
                    onClick={showAll}
                    className="rounded-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    {translate('participants.filters.showall')}
                  </button>
                </p>
              ) : null}
              {placeholder}
              <ParticipantTreeView
                type={type}
                label={treeTitle}
                nodes={visibleTree}
                selectedId={selectedId}
                expandedIds={expandedIds}
                onExpandedChange={applyExpanded}
                showWeight={showWeight}
                showBusiness={showBusiness}
                showStats={showStats}
                onSelect={select}
                onToggle={toggle}
                onJoin={(node) => {
                  setNodeRequestParams?.()
                  setJoinNode(node)
                }}
                joinBlockedReason={joinBlockedReason}
                feePricing={unsupportedPricing}
                onConnect={onConnect}
                moreNodeIds={moreNodeIds}
                onLoadMore={loadMore}
              />
              {moreNodeIds?.has(ROOT_NODE_ID) && loadMore ? (
                <div className="px-1 pt-1">
                  <ShowMoreButton onClick={() => loadMore(ROOT_NODE_ID)} />
                </div>
              ) : null}
            </div>
          </Card>
        </BlurFade>

        {!measured || isMobile ? null : sideBySide ? (
          <div
            ref={(element) => {
              detailRef.current = element
              detailFade.ref.current = element
            }}
            data-faded={detailFade.faded || undefined}
            className="sticky top-[calc(var(--header-height)+1rem)] z-30 max-h-[calc(100svh-var(--header-height)-2rem)] min-w-0 overflow-y-auto overscroll-contain rounded-xl data-faded:[mask-image:linear-gradient(to_bottom,black_calc(100%-3rem),transparent)]"
          >
            {detailCard ?? (visibleTree.length > 0 ? <ParticipantCardPlaceholder /> : null)}
          </div>
        ) : detailCard ? (
          <div ref={detailRef} className="min-w-0 scroll-mt-20">
            {detailCard}
          </div>
        ) : null}
      </div>

      {measured && isMobile ? (
        <DetailSheet
          open={Boolean(detailNode)}
          title={detailNode?.participant ? participantCardTitle(detailNode.participant, schemaTitle ?? '') : treeTitle}
          onClose={clearSelection}
        >
          {detailCard}
        </DetailSheet>
      ) : null}

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
          classModal="max-w-4xl"
        >
          {joinNode.onboardingAction === 'LinkDID' ? (
            <HolderWebsite issuerDid={joinNode.participant?.did ?? ''} onCancel={() => setJoinNode(undefined)} />
          ) : (
            <JoinFlow
              ecosystemId={ecosystemId ?? ''}
              nodeJoin={joinNode}
              onCancel={() => setJoinNode(undefined)}
              onRefresh={(id, txHeight) => setRefreshState({ joinNode, id, txHeight })}
            />
          )}
        </ModalAction>
      ) : null}
    </>
  )
}
