import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import type { Participant } from '@/ui/dataview/datasections/participant'

export type ParticipantStateBadge = 'ACTIVE' | 'INACTIVE' | 'REPAID' | 'SLASHED' | 'REVOKED' | 'EXPIRED' | 'FUTURE'

export type TreeNode = {
  nodeId: string
  icon: IconDefinition
  iconColorClass: string
  isCorporation: boolean
  isValidator: boolean
  group?: boolean
  schemaId?: string
  parentId?: string
  type?: string
  name?: string
  roleColorClass?: string
  participant?: Participant
  children?: TreeNode[]
  onboardingLabel?: string
  onboardingAction?: 'MsgStartParticipantOP' | 'MsgSelfCreateParticipant' | 'LinkDID' | 'Connect'
  enabledJoin?: boolean
  serviceDid?: string
  serviceTitle?: string
  badgeCount?: number
}

export type ParticipantRefreshState = {
  joinNode?: TreeNode
  id?: string
  txHeight?: number
}
