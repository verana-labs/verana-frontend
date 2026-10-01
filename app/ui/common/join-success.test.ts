import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import en from '@/i18n/dataview/en.json'
import type { Participant } from '@/ui/dataview/datasections/participant'
import { type CreatedParticipant, JoinSuccess } from './join-success'

const created: CreatedParticipant = {
  id: '42',
  msgType: 'MsgStartParticipantOP',
  did: 'did:web:new-issuer.example',
  role: 'ISSUER',
}

const pending: Participant = {
  id: '42',
  schema_id: '7',
  role: 'ISSUER',
  did: created.did,
  corporation_id: 13,
  participant_state: 'INACTIVE',
  op_state: 'PENDING',
  corporation_available_actions: [],
  validator_available_actions: [],
}

const render = (value: CreatedParticipant, participant: Participant | null) =>
  renderToStaticMarkup(createElement(JoinSuccess, { created: value, participant, schemaId: '7' }))

describe('JoinSuccess', () => {
  it('shows the created participant with its pending onboarding and the VS Agent continuation', () => {
    const html = render(created, pending)
    expect(html).toContain('Participant created')
    expect(html).toContain('>42<')
    expect(html).toContain(created.did)
    expect(html).toContain('>ISSUER<')
    expect(html).toContain(`>${en['participant.labelopstate.pending']}<`)
    expect(html).not.toContain('>PENDING<')
    expect(html).toContain('VS Agent over DIDComm')
    expect(html).toContain('href="/participants/7"')
    expect(html).not.toContain('Proposal submitted')
  })

  it('shows the participant before the indexer returns it, without inventing its states', () => {
    const html = render(created, null)
    expect(html).toContain(created.did)
    expect(html).not.toContain(`>${en['participant.labelopstate.pending']}<`)
  })

  it('says no validation is needed after a self-create', () => {
    const html = render({ ...created, msgType: 'MsgSelfCreateParticipant' }, { ...pending, op_state: null })
    expect(html).toContain('No validation is needed')
    expect(html).not.toContain('VS Agent over DIDComm')
  })

  it('reports a submitted proposal and claims no participant when the transaction created none', () => {
    const html = render({ ...created, id: undefined }, null)
    expect(html).toContain('Proposal submitted')
    expect(html).toContain('reaches its decision threshold and the proposal executes')
    expect(html).not.toContain('Participant created')
    expect(html).not.toContain(created.did)
  })
})
