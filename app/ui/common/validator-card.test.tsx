import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ValidatorCard from '@/ui/common/validator-card'
import type { Participant } from '@/ui/dataview/datasections/participant'

const VALIDATOR: Participant = {
  id: '7',
  schema_id: '9',
  role: 'ISSUER_GRANTOR',
  did: 'did:web:validator.example',
  corporation_id: 13,
  participant_state: 'ACTIVE',
  corporation_available_actions: [],
  validator_available_actions: [],
}

function render(validator: Participant): string {
  return renderToStaticMarkup(<ValidatorCard validator={validator} />)
}

describe('ValidatorCard expires-soon indicator', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('reads the window from effective_until, which is what the indexer sends', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 23, 14, 0, 0))
    expect(render({ ...VALIDATOR, effective_until: '2026-07-10T09:30:00.000Z' })).toContain('expires soon')
  })

  it('stays off beyond the window and when no effective_until is set', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 23, 14, 0, 0))
    expect(render({ ...VALIDATOR, effective_until: '2026-09-10T09:30:00.000Z' })).not.toContain('expires soon')
    expect(render(VALIDATOR)).not.toContain('expires soon')
  })
})
