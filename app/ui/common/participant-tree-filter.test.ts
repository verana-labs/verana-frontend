import { faFolder } from '@fortawesome/free-solid-svg-icons'
import { describe, expect, it } from 'vitest'
import type { DidTrustState } from '@/lib/resolverClient'
import { collectParticipantDids, filterParticipantTree } from '@/ui/common/participant-tree-filter'
import type { TreeNode } from '@/ui/common/participant-tree-types'
import type { OnboardingProcessState, Participant } from '@/ui/dataview/datasections/participant'

type NodeSpec = {
  id: string
  did?: string
  participantState?: string
  opState?: OnboardingProcessState
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
          participant_state: spec.participantState ?? 'ACTIVE',
          op_state: spec.opState,
        } as unknown as Participant),
    children: spec.children?.map(node) ?? [],
  }
}

const SHOW_DEFAULT = { includeUnresolvable: false, includeDisabled: false }
const TRUST: Record<string, DidTrustState | undefined> = {
  'did:ex:trusted': 'TRUSTED',
  'did:ex:untrusted': 'UNTRUSTED',
}

describe('collectParticipantDids', () => {
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
    expect(collectParticipantDids(tree).sort()).toEqual(['did:ex:a', 'did:ex:b'])
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
