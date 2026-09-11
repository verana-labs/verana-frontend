import type { EncodeObject } from '@cosmjs/proto-signing'
import { veranaTypeUrls } from '@verana-labs/verana-types/signing'
import type { CorporationMembership } from '@/lib/corporation-discovery'
import type { ProposalMetadata } from '@/lib/tx-preview'
import {
  type CorporationSigningMode,
  corporationSigningMode,
  wrapInProposal,
} from '@/msg/actions_hooks/actionCorporationManage'
import { OPERATOR_GRANT_MESSAGE_TYPES } from '@/msg/constants/operatorGrantMessageTypes'

export type DelegableBuild = (corporation: string, operator: string) => EncodeObject

export interface DelegableMsgs {
  msgs: EncodeObject[]
  mode: CorporationSigningMode
  granter?: string
}

export interface DelegableResolution {
  mode: CorporationSigningMode
  build: (metadata: ProposalMetadata) => EncodeObject[]
}

export function resolveDelegableMsgs({
  membership,
  address,
  typeUrl,
  build,
}: {
  membership: CorporationMembership
  address: string
  typeUrl: string
  build: DelegableBuild
}): DelegableResolution | null {
  const mode = corporationSigningMode(typeUrl, membership)
  if (!mode) return null
  const policy = membership.corporation.policyAddress
  if (mode === 'operator') return { mode, build: () => [build(policy, address)] }
  return {
    mode,
    build: (metadata) => [wrapInProposal(membership, address, build(policy, policy), metadata.title, metadata.summary)],
  }
}

const TYPE_URL_ALIASES: Record<string, string> = {
  MsgUnarchiveEcosystem: veranaTypeUrls.MsgArchiveEcosystem,
  MsgUnarchiveCredentialSchema: veranaTypeUrls.MsgArchiveCredentialSchema,
}

export function delegableTypeUrl(msgType: string): string | null {
  const typeUrl = TYPE_URL_ALIASES[msgType] ?? (veranaTypeUrls as Record<string, string | undefined>)[msgType]
  if (!typeUrl || !(OPERATOR_GRANT_MESSAGE_TYPES as readonly string[]).includes(typeUrl)) return null
  return typeUrl
}

export function proposalTitleFrom(effect: string): string {
  return effect.replace(/\.\s*$/, '')
}
