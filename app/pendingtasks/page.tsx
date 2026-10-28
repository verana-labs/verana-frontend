'use client'

import { faFolder } from '@fortawesome/free-solid-svg-icons'
import { useEffect, useMemo, useState } from 'react'
import { useActingPendingVotes, useUserCorporation } from '@/hooks/useUserCorporation'
import { translate } from '@/i18n/dataview'
import { usePendingTasksCtx } from '@/providers/api-rest-query-provider-context'
import { CorporationRequired } from '@/ui/agents-tasks-settings/corporation-required'
import { PendingTasksInbox } from '@/ui/agents-tasks-settings/pending-tasks-inbox'
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
  return ecosystems.map((ecosystem) => ({
    nodeId: `ecosystem:${ecosystem.id}`,
    name: ecosystem.did ?? `Ecosystem ${ecosystem.id}`,
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
  }))
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

  if (!actingCorporation && !corporationLoading)
    return (
      <CorporationRequired
        failed={Boolean(discoveryError)}
        title={translate('task.title')}
        description={translate('task.description')}
      />
    )

  return (
    <ParticipantTree
      tree={participantTree}
      type="tasks"
      viewerCorporationId={actingCorporation?.corporation.id}
      refreshRoot={() => setRefreshRoot(true)}
      placeholder={
        <PendingTasksInbox
          ecosystems={pendingParticipants}
          pendingVotes={pendingVotes}
          partial={partial}
          settled={settled && !corporationLoading}
          error={error}
          onRetry={() => setRefreshRoot(true)}
        />
      }
    />
  )
}
