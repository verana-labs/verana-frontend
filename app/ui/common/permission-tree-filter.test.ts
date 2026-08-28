import { faFolder } from '@fortawesome/free-solid-svg-icons'
import { describe, expect, it } from 'vitest'
import { DidTrustState } from '@/lib/resolverClient'
import { collectPermissionDids, filterPermissionTree } from '@/ui/common/permission-tree-filter'
import { TreeNode } from '@/ui/common/permission-tree-types'
import { Permission, VpState } from '@/ui/dataview/datasections/perm'

type NodeSpec = {
  id: string
  did?: string
  permState?: string
  vpState?: VpState
  group?: boolean
  children?: NodeSpec[]
}

function node(spec: NodeSpec): TreeNode {
  return {
    nodeId: spec.id,
    icon: faFolder,
    iconColorClass: '',
    isGrantee: false,
    isValidator: false,
    group: spec.group,
    permission: spec.group
      ? undefined
      : ({ id: spec.id, did: spec.did, perm_state: spec.permState ?? 'ACTIVE', vp_state: spec.vpState } as Permission),
    children: spec.children?.map(node) ?? [],
  }
}

const SHOW_DEFAULT = { includeUnresolvable: false, includeDisabled: false }
const TRUST: Record<string, DidTrustState | undefined> = {
  'did:ex:trusted': 'TRUSTED',
  'did:ex:untrusted': 'UNTRUSTED',
}

describe('collectPermissionDids', () => {
  it('collects unique permission DIDs recursively, ignoring group nodes', () => {
    const tree = [
      node({
        id: '1',
        did: 'did:ex:a',
        children: [
          {
            id: 'g',
            group: true,
            children: [
              { id: '2', did: 'did:ex:b' },
              { id: '3', did: 'did:ex:a' },
            ],
          },
          { id: '4' },
        ],
      }),
    ]
    expect(collectPermissionDids(tree).sort()).toEqual(['did:ex:a', 'did:ex:b'])
  })
})

describe('filterPermissionTree', () => {
  it('keeps active trusted permissions by default', () => {
    const tree = [node({ id: '1', did: 'did:ex:trusted', permState: 'ACTIVE' })]
    expect(filterPermissionTree(tree, SHOW_DEFAULT, TRUST)).toHaveLength(1)
  })

  it('hides non-active permissions unless disabled participants are included', () => {
    for (const permState of ['INACTIVE', 'REPAID', 'SLASHED', 'FUTURE']) {
      const tree = [node({ id: '1', did: 'did:ex:trusted', permState })]
      expect(filterPermissionTree(tree, SHOW_DEFAULT, TRUST)).toHaveLength(0)
      expect(filterPermissionTree(tree, { ...SHOW_DEFAULT, includeDisabled: true }, TRUST)).toHaveLength(1)
    }
  })

  it('hides untrusted, unresolved and DID-less services unless unresolvable services are included', () => {
    for (const did of ['did:ex:untrusted', 'did:ex:unknown', undefined]) {
      const tree = [node({ id: '1', did, permState: 'ACTIVE' })]
      expect(filterPermissionTree(tree, SHOW_DEFAULT, TRUST)).toHaveLength(0)
      expect(filterPermissionTree(tree, { ...SHOW_DEFAULT, includeUnresolvable: true }, TRUST)).toHaveLength(1)
    }
  })

  it('combines both filters with AND semantics', () => {
    const tree = [node({ id: '1', did: 'did:ex:untrusted', permState: 'INACTIVE' })]
    expect(filterPermissionTree(tree, { includeUnresolvable: true, includeDisabled: false }, TRUST)).toHaveLength(0)
    expect(filterPermissionTree(tree, { includeUnresolvable: false, includeDisabled: true }, TRUST)).toHaveLength(0)
    expect(filterPermissionTree(tree, { includeUnresolvable: true, includeDisabled: true }, TRUST)).toHaveLength(1)
  })

  it('always shows entries with a pending onboarding process, regardless of both filters', () => {
    const tree = [node({ id: '1', did: 'did:ex:unknown', permState: 'INACTIVE', vpState: 'PENDING' })]
    expect(filterPermissionTree(tree, SHOW_DEFAULT, TRUST)).toHaveLength(1)
  })

  it('prunes the whole subtree of a hidden node', () => {
    const tree = [
      node({
        id: 'parent',
        did: 'did:ex:untrusted',
        permState: 'ACTIVE',
        children: [{ id: 'child', did: 'did:ex:trusted', permState: 'ACTIVE' }],
      }),
    ]
    expect(filterPermissionTree(tree, SHOW_DEFAULT, TRUST)).toHaveLength(0)
  })

  it('keeps group folders and filters inside them', () => {
    const tree = [
      node({
        id: 'root',
        did: 'did:ex:trusted',
        permState: 'ACTIVE',
        children: [
          {
            id: 'g',
            group: true,
            children: [
              { id: 'ok', did: 'did:ex:trusted', permState: 'ACTIVE' },
              { id: 'ko', did: 'did:ex:untrusted', permState: 'ACTIVE' },
            ],
          },
        ],
      }),
    ]
    const filtered = filterPermissionTree(tree, SHOW_DEFAULT, TRUST)
    const group = filtered[0].children?.[0]
    expect(group?.group).toBe(true)
    expect(group?.children?.map((c) => c.nodeId)).toEqual(['ok'])
  })
})
