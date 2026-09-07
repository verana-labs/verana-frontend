export interface GovernanceVersionTargets {
  drafts: number[]
  next: number
  activatable: number | null
}

export function governanceVersionTargets(
  versions: ReadonlyArray<{ version: number }>,
  activeVersion: number
): GovernanceVersionTargets {
  const numbers = versions.map((version) => version.version)
  const drafts = numbers.filter((version) => version > activeVersion).sort((a, b) => a - b)
  const next = Math.max(activeVersion, ...numbers) + 1
  return { drafts, next, activatable: drafts.includes(activeVersion + 1) ? activeVersion + 1 : null }
}
