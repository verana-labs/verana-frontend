import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { Permission } from '../dataview/datasections/perm'

export type PermissionType = 'ECOSYSTEM' | 'ISSUER_GRANTOR' | 'VERIFIER_GRANTOR' | 'ISSUER' | 'VERIFIER' | 'HOLDER'

export type PermState = 'ACTIVE' | 'INACTIVE' | 'REPAID' | 'SLASHED' | 'FUTURE'

export type TreeNode = {
  nodeId: string
  icon: IconDefinition
  iconColorClass: string
  isGrantee: boolean
  isValidator: boolean
  group?: boolean
  schemaId?: string
  parentId?: string
  type?: string
  name?: string
  roleColorClass?: string
  permission?: Permission
  children?: TreeNode[]
  validationProcessLabel?: string
  validationProcessColor?: string
  validationProcessAction?: 'MsgStartPermissionVP' | 'MsgCreatePermission' | 'LinkDID' | 'Connect'
  enabledJoin?: boolean
  serviceDid?: string
  serviceTitle?: string
  badgeCount?: number
}

export type RefreshState = {
  joinNode?: TreeNode
  id?: string
  txHeight?: number
}
