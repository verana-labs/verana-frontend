import { indexerValidators } from '@/lib/indexer-json'
import type { ParticipantRole } from '@/ui/dataview/datasections/participant'

const { record, string } = indexerValidators('ecosystem roles')

const ROLE_ORDER: ParticipantRole[] = [
  'ECOSYSTEM',
  'ISSUER_GRANTOR',
  'VERIFIER_GRANTOR',
  'ISSUER',
  'VERIFIER',
  'HOLDER',
]

export type EcosystemMembership = 'controlled' | 'joined'

export function ecosystemRolesQuery(corporationId: number, ecosystemId: string): URLSearchParams {
  return new URLSearchParams({
    corporation_id: String(corporationId),
    ecosystem_id: ecosystemId,
    participant_state: 'ACTIVE',
    limit: '64',
  })
}

export function parseEcosystemRoles(payload: unknown): ParticipantRole[] {
  const envelope = record(payload, 'response')
  if (!Array.isArray(envelope.participants)) {
    throw new Error('Invalid ecosystem roles response: missing participants envelope')
  }
  const active = new Set<string>()
  envelope.participants.forEach((entry, index) => {
    const participant = record(entry, `participants[${index}]`)
    if (participant.participant_state === 'ACTIVE') active.add(string(participant.role, `participants[${index}].role`))
  })
  return ROLE_ORDER.filter((role) => active.has(role))
}

export function ecosystemRoles(ecosystem: { role?: string | null }): ParticipantRole[] {
  const tokens = new Set((ecosystem.role ?? '').split(/[,\s]+/).map((token) => token.trim().toUpperCase()))
  return ROLE_ORDER.filter((role) => tokens.has(role))
}

export function ecosystemMembership(
  ecosystem: { corporationId: number; role?: string | null },
  corporationId: number | undefined
): EcosystemMembership | null {
  if (corporationId === undefined) return null
  if (ecosystem.corporationId === corporationId) return 'controlled'
  return ecosystemRoles(ecosystem).length > 0 ? 'joined' : null
}
