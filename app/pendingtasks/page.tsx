'use client'

import { faFolder } from '@fortawesome/free-solid-svg-icons'
import { useEffect, useMemo, useState } from 'react'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { usePendingTasksCtx } from '@/providers/api-rest-query-provider-context'
import ParticipantTree from '@/ui/common/participant-tree'
import type { TreeNode } from '@/ui/common/participant-tree-types'
import type { Participant, PendingEcosystem } from '@/ui/dataview/datasections/participant'
import { participantAuthority, roleColorClass } from '@/util/util'

function participantNode(participant: Participant, corporationId?: number): TreeNode {
  const isCorporation = participant.corporation_id === corporationId
  const isValidator = !isCorporation
  const authority = participantAuthority(isCorporation, isValidator, false)
  return {
    nodeId: participant.id,
    name: participant.did ?? participant.role,
    group: false,
    parentId: participant.validator_participant_id ?? undefined,
    isCorporation,
    isValidator,
    roleColorClass: roleColorClass(participant.role),
    icon: authority.icon,
    iconColorClass: authority.iconColorClass,
    participant,
  }
}

function buildTree(ecosystems: PendingEcosystem[], corporationId?: number): TreeNode[] {
  return ecosystems.map((ecosystem) => ({
    nodeId: `ecosystem:${ecosystem.id}`,
    name: ecosystem.did ?? `Ecosystem ${ecosystem.id}`,
    group: true,
    parentId: 'root',
    isCorporation: false,
    isValidator: false,
    roleColorClass: 'text-purple-300',
    icon: faFolder,
    iconColorClass: 'text-purple-300',
    serviceDid: ecosystem.did ?? undefined,
    badgeCount: ecosystem.pending_tasks,
    children: ecosystem.schemas.map((schema) => ({
      nodeId: `schema:${schema.id}`,
      name: schema.title,
      group: true,
      parentId: `ecosystem:${ecosystem.id}`,
      isCorporation: false,
      isValidator: false,
      roleColorClass: 'text-purple-200',
      icon: faFolder,
      iconColorClass: 'text-purple-200',
      serviceTitle: schema.title,
      badgeCount: schema.pending_tasks,
      children: schema.pending_participants.map((participant) => participantNode(participant, corporationId)),
    })),
  }))
}

export default function PendingTasksPage() {
  const { corporation } = useUserCorporation()
  const { pendingParticipants, refetch } = usePendingTasksCtx()
  const [refreshRoot, setRefreshRoot] = useState(true)
  const participantTree = useMemo(
    () => buildTree(pendingParticipants, corporation?.id),
    [corporation?.id, pendingParticipants]
  )

  useEffect(() => {
    if (!refreshRoot) return
    void refetch()
    setRefreshRoot(false)
  }, [refetch, refreshRoot])

  return (
    <ParticipantTree
      tree={participantTree}
      type="tasks"
      viewerCorporationId={corporation?.id}
      refreshRoot={() => setRefreshRoot(true)}
    />
  )
}
