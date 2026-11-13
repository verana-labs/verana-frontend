import { faCrown } from '@fortawesome/free-solid-svg-icons'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CorporationMembership } from '@/lib/corporation-discovery'

const corporation = vi.hoisted(() => ({
  state: { actingCorporation: null as CorporationMembership | null, loading: false },
}))

vi.mock('@/hooks/useUserCorporation', () => ({ useUserCorporation: () => corporation.state }))
vi.mock('@/hooks/useVeranaChain', () => ({ useVeranaChain: () => ({ chain_name: 'verana' }) }))
vi.mock('@cosmos-kit/react', () => ({ useChain: () => ({ address: 'verana1operator' }) }))
vi.mock('@/hooks/useDidTrustEnrichment', () => ({ useDidTrustEnrichment: () => ({ data: undefined }) }))

import { translate } from '@/i18n/dataview'
import type { TreeNode } from '@/ui/common/participant-tree-types'
import TreeNodeHeader from '@/ui/common/tree-node-header'
import type { Participant } from '@/ui/dataview/datasections/participant'

const VALIDATE = '/verana.pp.v1.MsgSetParticipantOPToValidated'
const UNAUTHORIZED = translate('task.unauthorized')
const CAPABILITY_NONE = translate('corporation.capability.none')

function membership(overrides: Partial<CorporationMembership>): CorporationMembership {
  return {
    corporation: { id: 13, policyAddress: 'verana1policy', did: 'did:web:acme.example' },
    operator: false,
    member: false,
    weight: null,
    grantedMessageTypes: [],
    ...overrides,
  }
}

const node: TreeNode = {
  nodeId: '42',
  name: 'did:web:applicant.example',
  icon: faCrown,
  iconColorClass: 'text-yellow-500',
  isCorporation: false,
  isValidator: true,
  participant: {
    id: '42',
    did: 'did:web:applicant.example',
    role: 'ISSUER',
    op_state: 'PENDING',
    participant_state: 'INACTIVE',
  } as Participant,
}

function render(type: 'participants' | 'tasks'): string {
  return renderToStaticMarkup(
    <TreeNodeHeader
      node={node}
      type={type}
      isExpanded={false}
      showWeight={false}
      showBusiness={false}
      showStats={false}
      onToggle={() => {}}
      onSelect={() => {}}
      onJoin={() => {}}
    />
  )
}

describe('TreeNodeHeader not-authorized badge', () => {
  beforeEach(() => {
    corporation.state = { actingCorporation: membership({}), loading: false }
  })

  it('marks a task the account can neither validate nor propose, with the capability reason', () => {
    const html = render('tasks')
    expect(html).toContain(`>${UNAUTHORIZED}<`)
    expect(html).toContain(`title="${CAPABILITY_NONE}"`)
    expect(html).toContain(`<span class="sr-only">${CAPABILITY_NONE}</span>`)
  })

  it('does not mark a task the account validates as operator', () => {
    corporation.state.actingCorporation = membership({ operator: true, grantedMessageTypes: [VALIDATE] })
    expect(render('tasks')).not.toContain(UNAUTHORIZED)
  })

  it('does not mark a task a member without grant can validate by proposal', () => {
    corporation.state.actingCorporation = membership({ member: true, weight: '1' })
    expect(render('tasks')).not.toContain(UNAUTHORIZED)
  })

  it('does not mark a task while discovery is loading', () => {
    corporation.state = { actingCorporation: null, loading: true }
    expect(render('tasks')).not.toContain(UNAUTHORIZED)
  })

  it('does not mark a participant tree row', () => {
    expect(render('participants')).not.toContain(UNAUTHORIZED)
  })
})
