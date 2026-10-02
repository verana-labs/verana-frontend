import type { DeliverTxResponse } from '@cosmjs/stargate'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { proposalExecution, proposalSubmittedMessage, rejectionNotice, txFailureNotice } from './tx-outcome'
import type { TxEvent } from './txEvents'

const explorer = vi.hoisted(() => ({ explorerTxLink: vi.fn() }))
vi.mock('@/hooks/useVeranaChain', () => explorer)

const INSUFFICIENT_FUNDS =
  'message /cosmos.bank.v1beta1.MsgSend at position 0: spendable balance 0uvna is smaller than 100000000uvna: insufficient funds'
const NOT_FOUND = 'operator authorization not found for this corporation/operator pair'

function execEvent(proposalId: string, result: string, logs: string): TxEvent {
  return {
    type: 'cosmos.group.v1.EventExec',
    attributes: [
      { key: 'logs', value: JSON.stringify(logs) },
      { key: 'proposal_id', value: JSON.stringify(proposalId) },
      { key: 'result', value: JSON.stringify(result) },
      { key: 'msg_index', value: '0' },
    ],
  }
}

const DEVNET_TX_2E589E9C_EVENTS: TxEvent[] = [
  { type: 'message', attributes: [{ key: 'action', value: '/cosmos.group.v1.MsgSubmitProposal' }] },
  {
    type: 'cosmos.group.v1.EventSubmitProposal',
    attributes: [
      { key: 'proposal_id', value: '"33"' },
      { key: 'msg_index', value: '0' },
    ],
  },
  {
    type: 'cosmos.group.v1.EventVote',
    attributes: [
      { key: 'proposal_id', value: '"33"' },
      { key: 'msg_index', value: '0' },
    ],
  },
  {
    type: 'cosmos.group.v1.EventExec',
    attributes: [
      {
        key: 'logs',
        value:
          '"proposal execution failed on proposal 33, because of error message /cosmos.bank.v1beta1.MsgSend at position 0: spendable balance 0uvna is smaller than 100000000uvna: insufficient funds"',
      },
      { key: 'proposal_id', value: '"33"' },
      { key: 'result', value: '"PROPOSAL_EXECUTOR_RESULT_FAILURE"' },
      { key: 'msg_index', value: '0' },
    ],
  },
]

function deliverTx(overrides: Partial<DeliverTxResponse>): DeliverTxResponse {
  return {
    code: 0,
    height: 592_654,
    txIndex: 0,
    transactionHash: '2E589E9C4CC492D6BD60F6D4464B11CD75DBD6B2F8DD7F066DD116621B4DFE78',
    rawLog: '',
    gasWanted: BigInt(1),
    gasUsed: BigInt(1),
    events: [],
    msgResponses: [],
    ...overrides,
  }
}

const fallback = (code: number, rawLog: string) => `Unable to archive the ecosystem. (${code}) ${rawLog}`

describe('proposalExecution', () => {
  it('reads the failed execution of the devnet transaction 2E589E9C', () => {
    expect(proposalExecution(DEVNET_TX_2E589E9C_EVENTS)).toEqual({
      status: 'failed',
      proposalId: '33',
      logs: INSUFFICIENT_FUNDS,
    })
  })

  it('reads an executed proposal', () => {
    expect(proposalExecution([execEvent('34', 'PROPOSAL_EXECUTOR_RESULT_SUCCESS', '')])).toEqual({
      status: 'executed',
    })
  })

  it('treats a proposal below its threshold as submitted and pending', () => {
    expect(proposalExecution([execEvent('35', 'PROPOSAL_EXECUTOR_RESULT_NOT_RUN', '')])).toEqual({
      status: 'pending',
    })
  })

  it('treats a transaction without an execution event as pending', () => {
    expect(proposalExecution([])).toEqual({ status: 'pending' })
  })
})

describe('txFailureNotice', () => {
  afterEach(() => explorer.explorerTxLink.mockReset())

  it('links a rejected broadcast and a failed proposal execution to the explorer', () => {
    const link = { href: 'https://explorer.example/tx/2E58', label: '2E58' }
    explorer.explorerTxLink.mockReturnValue(link)
    expect(txFailureNotice(deliverTx({ code: 11, rawLog: 'out of gas' }), fallback)?.link).toEqual(link)
    expect(txFailureNotice(deliverTx({ events: DEVNET_TX_2E589E9C_EVENTS }), fallback)?.link).toEqual(link)
    expect(explorer.explorerTxLink).toHaveBeenCalledWith(
      '2E589E9C4CC492D6BD60F6D4464B11CD75DBD6B2F8DD7F066DD116621B4DFE78'
    )
  })

  it('reports the failed execution of a code 0 proposal transaction with its logs', () => {
    expect(txFailureNotice(deliverTx({ events: DEVNET_TX_2E589E9C_EVENTS }), fallback)).toEqual({
      title: 'Proposal not executed',
      message: `Proposal 33 was accepted, but its execution failed and none of its messages took effect: ${INSUFFICIENT_FUNDS}`,
    })
  })

  it('reports a proposal the chain refused to execute for lack of authorization', () => {
    const logs = `proposal execution failed on proposal 38, because of error message /verana.ec.v1.MsgArchiveEcosystem at position 0: authorization check failed: ${NOT_FOUND}`
    expect(
      txFailureNotice(deliverTx({ events: [execEvent('38', 'PROPOSAL_EXECUTOR_RESULT_FAILURE', logs)] }), fallback)
    ).toEqual({
      title: 'Proposal not executed',
      message: `Proposal 38 was accepted, but the chain refused to execute it for lack of authorization: ${NOT_FOUND}.`,
    })
  })

  it('stays silent for a submitted or executed proposal', () => {
    expect(
      txFailureNotice(deliverTx({ events: [execEvent('35', 'PROPOSAL_EXECUTOR_RESULT_NOT_RUN', '')] }), fallback)
    ).toBeNull()
    expect(
      txFailureNotice(deliverTx({ events: [execEvent('34', 'PROPOSAL_EXECUTOR_RESULT_SUCCESS', '')] }), fallback)
    ).toBeNull()
  })

  it('reports an authorization rejection of a broadcast as such', () => {
    expect(
      txFailureNotice(
        deliverTx({
          code: 1,
          rawLog: `failed to execute message; message index: 0: authorization check failed: ${NOT_FOUND}`,
        }),
        fallback
      )
    ).toEqual({
      title: 'Authorization rejected',
      message: `The chain refused this action for lack of authorization: ${NOT_FOUND}.`,
    })
  })

  it('keeps the action message for any other rejection', () => {
    expect(
      txFailureNotice(
        deliverTx({
          code: 11,
          rawLog: 'out of gas in location: WriteFlat; gasWanted: 200000, gasUsed: 201334: out of gas',
        }),
        fallback
      )
    ).toEqual({
      title: 'Transaction failed',
      message:
        'Unable to archive the ecosystem. (11) out of gas in location: WriteFlat; gasWanted: 200000, gasUsed: 201334: out of gas',
    })
  })
})

describe('rejectionNotice', () => {
  afterEach(() => explorer.explorerTxLink.mockReset())

  it('links a submitted transaction the broadcast timed out on', () => {
    const hash = 'A'.repeat(64)
    const link = { href: `https://explorer.example/tx/${hash}`, label: hash }
    explorer.explorerTxLink.mockReturnValue(link)
    const notice = rejectionNotice(
      'Unable to archive the ecosystem.',
      `Direct signing failed: Transaction with ID ${hash} was submitted but was not yet found on the chain. You might want to check later. There was a wait of 60 seconds.`
    )
    expect(notice).toEqual({ message: 'Unable to archive the ecosystem.', title: 'Transaction failed', link })
    expect(explorer.explorerTxLink).toHaveBeenCalledWith(hash)
  })

  it('classifies a thrown simulation error', () => {
    expect(
      rejectionNotice(
        'Unable to archive the ecosystem.',
        `Direct signing failed: Query failed with (6): rpc error: code = Unknown desc = failed to execute message; message index: 0: authorization check failed: operator authorization has expired [cosmos/cosmos-sdk@v0.53.4/baseapp/baseapp.go:1051] with gas used: '38739': unknown request`
      ).title
    ).toBe('Authorization rejected')
  })
})

describe('proposalSubmittedMessage', () => {
  it('says whether the proposal executed or waits for votes', () => {
    expect(proposalSubmittedMessage([execEvent('34', 'PROPOSAL_EXECUTOR_RESULT_SUCCESS', '')])).toBe(
      'Proposal submitted and executed'
    )
    expect(proposalSubmittedMessage([execEvent('35', 'PROPOSAL_EXECUTOR_RESULT_NOT_RUN', '')])).toBe(
      'Proposal submitted. It executes once the group reaches its decision threshold.'
    )
  })
})
