import type { EncodeObject } from '@cosmjs/proto-signing'
import type { StdFee } from '@cosmjs/stargate'
import { describe, expect, it } from 'vitest'
import { simulationFor, type TxSimulation } from './useTxSimulation'

const fee: StdFee = { amount: [{ denom: 'uvna', amount: '2500' }], gas: '200000' }

function msgs(title: string): EncodeObject[] {
  return [{ typeUrl: '/cosmos.group.v1.MsgSubmitProposal', value: { title } }]
}

describe('simulationFor', () => {
  it('keeps a settled fee from confirming a message set it never ran on', () => {
    const simulated = msgs('first draft')
    const ready: TxSimulation = { status: 'ready', fee, msgs: simulated }

    expect(simulationFor(ready, simulated)).toBe(ready)
    expect(simulationFor(ready, msgs('edited title'))).toEqual({ status: 'simulating' })
  })

  it('keeps a rejection from a superseded message set out of the preview', () => {
    const simulated = msgs('first draft')
    const failed: TxSimulation = { status: 'failed', message: 'insufficient funds', msgs: simulated }

    expect(simulationFor(failed, simulated)).toBe(failed)
    expect(simulationFor(failed, msgs('edited title'))).toEqual({ status: 'simulating' })
  })
})
