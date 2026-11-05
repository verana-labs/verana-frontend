'use client'

import { faFolder } from '@fortawesome/free-solid-svg-icons'
import { Building2Icon, CloudOffIcon } from 'lucide-react'
import Link from 'next/link'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { useActingPendingVotes, useUserCorporation } from '@/hooks/useUserCorporation'
import { translate } from '@/i18n/dataview'
import { INDEXER_MAX_LIMIT } from '@/lib/indexer-json'
import { usePendingTasksCtx } from '@/providers/api-rest-query-provider-context'
import { EmptyState } from '@/ui/common/empty-state'
import ParticipantTree from '@/ui/common/participant-tree'
import type { TreeNode } from '@/ui/common/participant-tree-types'
import type { Participant, PendingEcosystem } from '@/ui/dataview/datasections/participant'
import { participantAuthority, roleColorClass } from '@/util/util'

function participantNode(participant: Participant, corporationId?: number): TreeNode {
  const isCorporation = participant.corporation_id === corporationId
  const authority = participantAuthority(isCorporation, true, false)
  return {
    nodeId: participant.id,
    name: participant.did ?? participant.role,
    group: false,
    parentId: participant.validator_participant_id ?? undefined,
    isCorporation,
    isValidator: true,
    roleColorClass: roleColorClass(participant.role),
    icon: authority.icon,
    iconColorClass: authority.iconColorClass,
    participant,
  }
}

function buildTree(ecosystems: PendingEcosystem[], corporationId?: number): TreeNode[] {
  return ecosystems.map((ecosystem) => {
    const fallbackName = translate('task.tree.ecosystem', { id: ecosystem.id })
    return {
      nodeId: `ecosystem:${ecosystem.id}`,
      name: ecosystem.did ?? fallbackName,
      group: true,
      parentId: 'root',
      isCorporation: false,
      isValidator: false,
      roleColorClass: 'text-primary',
      icon: faFolder,
      iconColorClass: 'text-primary',
      serviceDid: ecosystem.did ?? undefined,
      serviceTrustData: ecosystem.trustData,
      badgeCount: ecosystem.pending_tasks,
      children: ecosystem.schemas.map((schema) => ({
        nodeId: `schema:${schema.id}`,
        name: schema.title,
        group: true,
        parentId: `ecosystem:${ecosystem.id}`,
        isCorporation: false,
        isValidator: false,
        roleColorClass: 'text-muted-foreground',
        icon: faFolder,
        iconColorClass: 'text-muted-foreground',
        serviceTitle: schema.title,
        badgeCount: schema.pending_tasks,
        children: schema.pending_participants.map((participant) => participantNode(participant, corporationId)),
      })),
    }
  })
}

function treePlaceholder(count: number, partial: boolean, settled: boolean, error: string | null): ReactNode {
  if (error) return <p className="p-2 text-sm text-warning">{translate('task.tree.error')}</p>
  if (partial)
    return (
      <p className="p-2 text-xs text-muted-foreground">
        {translate('task.tree.partial', { count: INDEXER_MAX_LIMIT })}
      </p>
    )
  if (count > 0) return null
  return (
    <p className="p-2 text-sm text-muted-foreground">{translate(settled ? 'task.tree.empty' : 'task.tree.loading')}</p>
  )
}

export default function PendingTasksPage() {
  const { actingCorporation, loading: corporationLoading, error: discoveryError } = useUserCorporation()
  const pendingVotes = useActingPendingVotes()
  const { pendingParticipants, partial, settled, error, refetch } = usePendingTasksCtx()
  const [refreshRoot, setRefreshRoot] = useState(true)
  const participantTree = useMemo(
    () => buildTree(pendingParticipants, actingCorporation?.corporation.id),
    [actingCorporation?.corporation.id, pendingParticipants]
  )

  useEffect(() => {
    if (!refreshRoot) return
    void refetch()
    setRefreshRoot(false)
  }, [refetch, refreshRoot])

  if (!actingCorporation && !corporationLoading) {
    return (
      <EmptyState
        className="bg-card/50 py-16"
        icon={discoveryError ? <CloudOffIcon /> : <Building2Icon />}
        title={translate(discoveryError ? 'corporation.page.error' : 'corporation.page.nocorp')}
      />
    )
  }

  return (
    <>
      {pendingVotes > 0 ? (
        <p className="mb-4 ps-2 text-sm text-muted-foreground">
          {translate('task.votes.pending', { count: pendingVotes })}{' '}
          <Link href="/corporation?tab=proposals" className="font-medium text-primary hover:underline">
            {translate('task.votes.open')}
          </Link>
        </p>
      ) : null}
      <ParticipantTree
        tree={participantTree}
        type="tasks"
        viewerCorporationId={actingCorporation?.corporation.id}
        refreshRoot={() => setRefreshRoot(true)}
        placeholder={treePlaceholder(pendingParticipants.length, partial, settled && !corporationLoading, error)}
      />
    </>
  )
}
