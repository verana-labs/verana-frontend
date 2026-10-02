import { faFolder } from '@fortawesome/free-solid-svg-icons'
import { describe, expect, it } from 'vitest'
import type { DidTrustState } from '@/lib/resolverClient'
import { collectParticipantTrust, filterParticipantTree, withAuthority } from '@/ui/common/participant-tree-filter'
import type { TreeNode } from '@/ui/common/participant-tree-types'
import type { OnboardingProcessState, Participant } from '@/ui/dataview/datasections/participant'

type NodeSpec = {
  id: string
  did?: string
  trust?: DidTrustState
  participantState?: string
  opState?: OnboardingProcessState
  corporationId?: number
  group?: boolean
  children?: NodeSpec[]
}

function node(spec: NodeSpec): TreeNode {
  return {
    nodeId: spec.id,
    icon: faFolder,
    iconColorClass: '',
    isCorporation: false,
    isValidator: false,
    group: spec.group,
    participant: spec.group
      ? undefined
      : ({
          id: spec.id,
          did: spec.did,
          trustData: spec.trust ? { did: spec.did, trustStatus: spec.trust } : undefined,
          participant_state: spec.participantState ?? 'ACTIVE',
          op_state: spec.opState,
          corporation_id: spec.corporationId,
        } as unknown as Participant),
    children: spec.children?.map(node) ?? [],
  }
}

const SHOW_DEFAULT = { includeUnresolvable: false, includeDisabled: false }
const TRUST: Record<string, DidTrustState | undefined> = {
  'did:ex:trusted': 'TRUSTED',
  'did:ex:untrusted': 'UNTRUSTED',
}

describe('collectParticipantTrust', () => {
  it('collects unique participant DIDs recursively, ignoring group nodes', () => {
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
    expect(Object.keys(collectParticipantTrust(tree)).sort()).toEqual(['did:ex:a', 'did:ex:b'])
  })

  it('reads the trust state from the row, and leaves an unenriched row undefined', () => {
    const tree = [node({ id: '1', did: 'did:ex:a', trust: 'UNTRUSTED' }), node({ id: '2', did: 'did:ex:b' })]
    expect(collectParticipantTrust(tree)).toEqual({ 'did:ex:a': 'UNTRUSTED', 'did:ex:b': undefined })
  })
})

describe('filterParticipantTree', () => {
  it('keeps active trusted participants by default', () => {
    const tree = [node({ id: '1', did: 'did:ex:trusted', participantState: 'ACTIVE' })]
    expect(filterParticipantTree(tree, SHOW_DEFAULT, TRUST)).toHaveLength(1)
  })

  it('hides non-active participants unless disabled participants are included', () => {
    for (const participantState of ['INACTIVE', 'REPAID', 'SLASHED', 'FUTURE']) {
      const tree = [node({ id: '1', did: 'did:ex:trusted', participantState })]
      expect(filterParticipantTree(tree, SHOW_DEFAULT, TRUST)).toHaveLength(0)
      expect(filterParticipantTree(tree, { ...SHOW_DEFAULT, includeDisabled: true }, TRUST)).toHaveLength(1)
    }
  })

  it('hides untrusted, unresolved and DID-less services unless unresolvable services are included', () => {
    for (const did of ['did:ex:untrusted', 'did:ex:unknown', undefined]) {
      const tree = [node({ id: '1', did, participantState: 'ACTIVE' })]
      expect(filterParticipantTree(tree, SHOW_DEFAULT, TRUST)).toHaveLength(0)
      expect(filterParticipantTree(tree, { ...SHOW_DEFAULT, includeUnresolvable: true }, TRUST)).toHaveLength(1)
    }
  })

  it('combines both filters with AND semantics', () => {
    const tree = [node({ id: '1', did: 'did:ex:untrusted', participantState: 'INACTIVE' })]
    expect(filterParticipantTree(tree, { includeUnresolvable: true, includeDisabled: false }, TRUST)).toHaveLength(0)
    expect(filterParticipantTree(tree, { includeUnresolvable: false, includeDisabled: true }, TRUST)).toHaveLength(0)
    expect(filterParticipantTree(tree, { includeUnresolvable: true, includeDisabled: true }, TRUST)).toHaveLength(1)
  })

  it('always shows entries with a pending onboarding process, regardless of both filters', () => {
    const tree = [node({ id: '1', did: 'did:ex:unknown', participantState: 'INACTIVE', opState: 'PENDING' })]
    expect(filterParticipantTree(tree, SHOW_DEFAULT, TRUST)).toHaveLength(1)
  })

  it('prunes the whole subtree of a hidden node', () => {
    const tree = [
      node({
        id: 'parent',
        did: 'did:ex:untrusted',
        participantState: 'ACTIVE',
        children: [{ id: 'child', did: 'did:ex:trusted', participantState: 'ACTIVE' }],
      }),
    ]
    expect(filterParticipantTree(tree, SHOW_DEFAULT, TRUST)).toHaveLength(0)
  })

  it('keeps group folders and filters inside them', () => {
    const tree = [
      node({
        id: 'root',
        did: 'did:ex:trusted',
        participantState: 'ACTIVE',
        children: [
          {
            id: 'g',
            group: true,
            children: [
              { id: 'ok', did: 'did:ex:trusted', participantState: 'ACTIVE' },
              { id: 'ko', did: 'did:ex:untrusted', participantState: 'ACTIVE' },
            ],
          },
        ],
      }),
    ]
    const filtered = filterParticipantTree(tree, SHOW_DEFAULT, TRUST)
    const group = filtered[0].children?.[0]
    expect(group?.group).toBe(true)
    expect(group?.children?.map((c) => c.nodeId)).toEqual(['ok'])
  })
})

describe('withAuthority', () => {
  const chain = () => [
    node({
      id: 'eco',
      corporationId: 9,
      children: [
        {
          id: 'group:eco',
          group: true,
          children: [
            { id: 'grantor', corporationId: 1, children: [{ id: 'group:grantor', group: true, children: [] }] },
          ],
        },
      ],
    }),
  ]

  function find(nodes: TreeNode[], id: string): TreeNode | undefined {
    for (const current of nodes) {
      if (current.nodeId === id) return current
      const found = find(current.children ?? [], id)
      if (found) return found
    }
  }

  function appendTo(nodes: TreeNode[], parentId: string, child: TreeNode): TreeNode[] {
    return nodes.map((current) => ({
      ...current,
      children:
        current.nodeId === parentId
          ? [...(current.children ?? []), child]
          : appendTo(current.children ?? [], parentId, child),
    }))
  }

  it('reads the chain through the folders: the owner, then its validator', () => {
    const tree = withAuthority(appendTo(chain(), 'group:grantor', node({ id: 'issuer' })), 1)
    expect(find(tree, 'eco')).toMatchObject({ isCorporation: false, isValidator: false })
    expect(find(tree, 'grantor')).toMatchObject({ isCorporation: true, isValidator: false })
    expect(find(tree, 'issuer')).toMatchObject({ isCorporation: false, isValidator: true })
  })

  it('keeps the chain for a page that arrives after a root refresh kept the folders', () => {
    const loaded = withAuthority(appendTo(chain(), 'group:grantor', node({ id: 'issuer' })), 1)
    const grown = appendTo(loaded, 'issuer', node({ id: 'holder' }))
    expect(find(withAuthority(grown, 1), 'holder')).toMatchObject({ isValidator: false, isPredecessor: true })
  })
})
