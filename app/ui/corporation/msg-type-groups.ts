export interface MsgTypeGroup {
  module: string
  entries: { typeUrl: string; name: string }[]
}

export const MODULE_LABELS: Record<string, string> = {
  co: 'Corporation',
  ec: 'Ecosystem',
  gf: 'Governance framework',
  cs: 'Credential schema',
  pp: 'Participant',
  td: 'Trust deposit',
  di: 'Digest',
  de: 'Delegation',
  group: 'Group',
}

export function groupMsgTypes(typeUrls: readonly string[]): MsgTypeGroup[] {
  const groups = new Map<string, MsgTypeGroup>()
  for (const typeUrl of typeUrls) {
    const parts = typeUrl.split('.')
    const module = parts.length >= 2 ? parts[1] : 'other'
    const name = (parts[parts.length - 1] ?? typeUrl).replace(/^Msg/, '')
    const group = groups.get(module) ?? { module, entries: [] }
    group.entries.push({ typeUrl, name })
    groups.set(module, group)
  }
  return [...groups.values()]
}
