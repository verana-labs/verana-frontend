import { describe, expect, it } from 'vitest'
import { authorizationRejection } from './chain-error'

const NOT_FOUND = 'operator authorization not found for this corporation/operator pair'

describe('authorizationRejection', () => {
  it('reads a DeliverTx rejection wrapped by the entity handler and baseapp', () => {
    expect(
      authorizationRejection(`failed to execute message; message index: 0: authorization check failed: ${NOT_FOUND}`)
    ).toBe(NOT_FOUND)
  })

  it('reads the simulation rejection cosmjs surfaces through abci_query', () => {
    expect(
      authorizationRejection(
        `Direct signing failed: Query failed with (6): rpc error: code = Unknown desc = failed to execute message; message index: 0: authorization check failed: ${NOT_FOUND} [cosmos/cosmos-sdk@v0.53.4/baseapp/baseapp.go:1051] with gas used: '38739': unknown request`
      )
    ).toBe(NOT_FOUND)
  })

  it('reads the logs of a proposal whose execution failed', () => {
    expect(
      authorizationRejection(
        `proposal execution failed on proposal 38, because of error message /verana.ec.v1.MsgArchiveEcosystem at position 0: authorization check failed: ${NOT_FOUND}`
      )
    ).toBe(NOT_FOUND)
  })

  it('reads an unwrapped rejection from the corporation and governance framework modules', () => {
    expect(authorizationRejection(`failed to execute message; message index: 0: ${NOT_FOUND}`)).toBe(NOT_FOUND)
  })

  it('reads the corporation checks of the ecosystem and corporation modules', () => {
    expect(
      authorizationRejection(
        'failed to execute message; message index: 0: authorization check failed: signing account is not the policy_address of a registered Corporation'
      )
    ).toBe('signing account is not the policy_address of a registered Corporation')
    expect(
      authorizationRejection(
        'failed to execute message; message index: 0: signing corporation does not control this ecosystem'
      )
    ).toBe('signing corporation does not control this ecosystem')
  })

  it('names an expired authorization', () => {
    expect(
      authorizationRejection(
        'failed to execute message; message index: 0: authorization check failed: operator authorization has expired'
      )
    ).toBe('operator authorization has expired')
  })

  it('names a message type the authorization does not cover', () => {
    expect(
      authorizationRejection(
        'failed to execute message; message index: 0: authorization check failed: operator authorization does not include requested message type: /verana.ec.v1.MsgArchiveEcosystem'
      )
    ).toBe('operator authorization does not include requested message type')
  })

  it('names an exceeded spend limit', () => {
    expect(
      authorizationRejection(
        'failed to execute message; message index: 0: spend limit exceeded: operator authorization spend limit exceeded: spend 5000000uvna exceeds remaining 1000000uvna'
      )
    ).toBe('operator authorization spend limit exceeded')
  })

  it('falls back to the handler wrapper when the inner reason is not one it names', () => {
    expect(
      authorizationRejection(
        'failed to execute message; message index: 0: authorization check failed: failed to persist authz renewal: not found'
      )
    ).toBe('authorization check failed')
  })

  it('leaves other chain rejections alone', () => {
    expect(
      authorizationRejection(
        'proposal execution failed on proposal 33, because of error message /cosmos.bank.v1beta1.MsgSend at position 0: spendable balance 0uvna is smaller than 100000000uvna: insufficient funds'
      )
    ).toBeNull()
    expect(
      authorizationRejection('account sequence mismatch, expected 12, got 11: incorrect account sequence')
    ).toBeNull()
    expect(
      authorizationRejection('failed to execute message; message index: 0: credential schema is already archived')
    ).toBeNull()
  })
})
