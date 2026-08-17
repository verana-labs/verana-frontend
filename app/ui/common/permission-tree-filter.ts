import { DidTrustState } from '@/lib/resolverClient'
import { TreeNode } from './permission-tree-types'

export type PermissionTreeFilterOptions = {
  /** When true, also show services whose DID does not trust-resolve as TRUSTED. */
  includeUnresolvable: boolean
  /** When true, also show permissions whose state is not ACTIVE. */
  includeDisabled: boolean
}

/** Collect the unique permission DIDs present in the (loaded part of the) tree. */
export function collectPermissionDids(nodes: TreeNode[]): string[] {
  const dids = new Set<string>()
  const walk = (list: TreeNode[]) => {
    for (const node of list) {
      const did = node.permission?.did
      if (did && !node.group) dids.add(did)
      if (node.children?.length) walk(node.children)
    }
  }
  walk(nodes)
  return [...dids]
}

function isNodeVisible(
  node: TreeNode,
  options: PermissionTreeFilterOptions,
  trustByDid: Record<string, DidTrustState | undefined>
): boolean {
  // Entries with a pending onboarding process are always shown: they are the
  // validator's work queue, and their DID is often not trust-resolvable yet
  // (obtaining the credential that makes it resolvable is the very point of
  // the onboarding), so neither filter applies to them.
  if (node.permission?.vp_state === 'PENDING') return true

  const stateOk = options.includeDisabled || node.permission?.perm_state === 'ACTIVE'
  const did = node.permission?.did
  const trustOk = options.includeUnresolvable || (!!did && trustByDid[did] === 'TRUSTED')
  return stateOk && trustOk
}

/**
 * Filter the permission tree for display. Group (folder) nodes are always
 * kept — they carry the join affordance. A filtered-out permission node is
 * pruned together with its whole subtree: children are lazy-loaded, so a
 * hidden node's descendants cannot be evaluated independently.
 *
 * A DID whose trust state is still being resolved (absent from `trustByDid`)
 * counts as unresolvable until the resolution lands.
 */
export function filterPermissionTree(
  nodes: TreeNode[],
  options: PermissionTreeFilterOptions,
  trustByDid: Record<string, DidTrustState | undefined>
): TreeNode[] {
  const result: TreeNode[] = []
  for (const node of nodes) {
    if (!node.group && !isNodeVisible(node, options, trustByDid)) continue
    const children = node.children?.length ? filterPermissionTree(node.children, options, trustByDid) : node.children
    result.push(children === node.children ? node : { ...node, children })
  }
  return result
}
