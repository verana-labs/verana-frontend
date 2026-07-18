'use client'

import {
  faChartColumn,
  faChevronRight,
  faCoins,
  faCrown,
  faHandshake,
  faScaleBalanced,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { ReactNode } from 'react'
import { translate } from '@/i18n/dataview'
import { service } from '@/ui/common/participant-attribute'
import type { TreeNode } from '@/ui/common/participant-tree-types'
import ServiceIdentity from '@/ui/common/service-identity'
import { resolveTranslatable } from '@/ui/dataview/types'
import { formatVNAFromUVNA, onboardingStateColor, participantStateBadgeClass, roleBadgeClass } from '@/util/util'

export type TreeNodeHeaderProps = {
  node: TreeNode
  type: 'participants' | 'tasks'
  isExpanded: boolean
  showWeight: boolean
  showBusiness: boolean
  showStats: boolean
  onToggle: (id: string, role?: string, validatorId?: string) => void
  onSelect: (id: string) => void
  onJoin: (node: TreeNode) => void
  onConnect?: () => void
}

export default function TreeNodeHeader({
  node,
  type,
  isExpanded,
  showWeight,
  showBusiness,
  showStats,
  onToggle,
  onSelect,
  onJoin,
  onConnect,
}: TreeNodeHeaderProps) {
  const hasChildren = Boolean(node.children?.length)
  const participant = node.participant
  const participantState = participantStateBadgeClass(participant?.participant_state, participant?.expire_soon ?? false)
  const onboardingState = onboardingStateColor(
    participant?.op_state,
    participant?.op_exp,
    participant?.expire_soon ?? false
  )

  let participantMetrics: ReactNode = null
  if (type === 'participants') {
    if (!node.group && participant) {
      participantMetrics = (
        <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ml-auto ${node.roleColorClass}`}>
          {showWeight ? (
            <span className="whitespace-nowrap">
              <FontAwesomeIcon icon={faScaleBalanced} className="mr-1" />
              {formatVNAFromUVNA(String(participant.weight ?? 0))}
            </span>
          ) : null}
          {showBusiness ? (
            <span className="whitespace-nowrap">
              <FontAwesomeIcon icon={faCoins} className="mr-1" />
              {`validation: ${formatVNAFromUVNA(String(participant.validation_fees ?? 0))} | issuance: ${formatVNAFromUVNA(String(participant.issuance_fees ?? 0))} | verification: ${formatVNAFromUVNA(String(participant.verification_fees ?? 0))}`}
            </span>
          ) : null}
          {showStats ? (
            <span className="whitespace-nowrap">
              <FontAwesomeIcon icon={faChartColumn} className="mr-1" />
              {`issued: ${participant.issued ?? 0} | verified: ${participant.verified ?? 0}`}
            </span>
          ) : null}
        </div>
      )
    } else if (node.group) {
      participantMetrics = (
        <div className={`text-xs flex flex-wrap items-center gap-x-3 gap-y-1 ml-auto ${node.roleColorClass}`}>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${node.iconColorClass}`}
          >
            {node.onboardingLabel}
          </span>
          {node.enabledJoin ? (
            <button
              type="button"
              className="hover:text-purple-600 cursor-pointer whitespace-nowrap"
              onClick={(event) => {
                event.stopPropagation()
                if (node.onboardingAction === 'LinkDID') {
                  const url = service(participant?.did ?? '')
                  if (url) window.open(url, '_blank')
                } else if (node.onboardingAction === 'Connect') {
                  onConnect?.()
                } else {
                  onJoin(node)
                  onToggle(node.nodeId, node.type, node.parentId)
                }
              }}
            >
              <FontAwesomeIcon icon={faHandshake} className="mr-1" />
              {resolveTranslatable({ key: 'participants.btn.join' }, translate)}
            </button>
          ) : null}
        </div>
      )
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
        {hasChildren || node.group ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onToggle(node.nodeId, node.type, node.parentId)
            }}
            className="text-gray-400 text-xs w-4 flex-shrink-0"
            aria-label="Toggle"
          >
            <FontAwesomeIcon
              icon={faChevronRight}
              className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
          </button>
        ) : (
          <div className="w-4 flex-shrink-0" />
        )}

        {node.group ? (
          node.serviceDid || node.serviceTitle ? (
            <>
              <ServiceIdentity
                did={node.serviceDid}
                fallbackName={node.serviceTitle ?? node.name}
                showFlag={Boolean(node.serviceDid)}
                showTrust={Boolean(node.serviceDid)}
              />
              {node.badgeCount ? (
                <span className="text-sm text-neutral-70 dark:text-neutral-30">({node.badgeCount})</span>
              ) : null}
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={node.icon} className={`${node.iconColorClass} text-sm`} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 break-all">{node.name}</span>
            </>
          )
        ) : (
          <>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onSelect(node.nodeId)
              }}
              className="cursor-pointer min-w-0 inline-flex items-center"
            >
              <ServiceIdentity did={participant?.did ?? undefined} fallbackName={node.name} />
            </button>
            <FontAwesomeIcon icon={faCrown} className="text-yellow-500 text-sm" aria-hidden="true" />
          </>
        )}

        {type === 'participants' && !node.group && participant?.participant_state ? (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${participantState.classParticipantState}`}
          >
            {participantState.labelParticipantState}
          </span>
        ) : null}
        {type === 'tasks' && participant?.op_state ? (
          <>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${onboardingState.classOnboardingState}`}
            >
              {onboardingState.labelOnboardingState}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleBadgeClass(participant.role)}`}
            >
              {participant.role}
            </span>
          </>
        ) : null}
      </div>
      {participantMetrics}
    </div>
  )
}
