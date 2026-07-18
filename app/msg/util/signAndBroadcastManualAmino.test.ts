import type { OfflineSigner } from '@cosmjs/proto-signing'
import { MsgStoreDigest } from '@verana-labs/verana-types/codec/verana/di/v1/tx'
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { signAndBroadcastManualAmino } from './signAndBroadcastManualAmino'

const stargate = vi.hoisted(() => ({
  broadcastTx: vi.fn(),
  getChainId: vi.fn(),
  getSequence: vi.fn(),
  sign: vi.fn(),
  simulate: vi.fn(),
}))

vi.mock('@cosmjs/stargate', async () => {
  const actual = await vi.importActual<typeof import('@cosmjs/stargate')>('@cosmjs/stargate')
  return {
    ...actual,
    SigningStargateClient: {
      connectWithSigner: vi.fn(async () => stargate),
    },
  }
})

const address = 'verana1operator'
const signer: OfflineSigner = {
  getAccounts: vi.fn(async () => []),
  signAmino: vi.fn(),
}
const message = {
  typeUrl: '/verana.di.v1.MsgStoreDigest',
  value: MsgStoreDigest.fromPartial({
    authority: 'verana1corporation',
    operator: address,
    digest: 'sha384-test',
  }),
}

describe('signAndBroadcastManualAmino', () => {
  beforeEach(() => {
    stargate.broadcastTx.mockReset()
    stargate.getChainId.mockReset().mockResolvedValue('vna-devnet-1')
    stargate.getSequence.mockReset().mockResolvedValue({ accountNumber: 7, sequence: 3 })
    stargate.sign.mockReset()
    stargate.simulate.mockReset().mockResolvedValue(100)
  })

  it('simulates the exact dev.25 payload without signing', async () => {
    const result = await signAndBroadcastManualAmino({
      rpcEndpoint: 'https://rpc.example',
      signer,
      address,
      messages: [message],
      gasPrice: '3uvna',
      gasAdjustment: 2,
      memo: 'MsgStoreDigest',
      simulate: true,
    })

    expect(result).toEqual({ amount: [{ amount: '600', denom: 'uvna' }], gas: '200' })
    expect(stargate.simulate).toHaveBeenCalledWith(address, [message], 'MsgStoreDigest')
    expect(stargate.sign).not.toHaveBeenCalled()
    expect(stargate.broadcastTx).not.toHaveBeenCalled()
  })

  it('signs and broadcasts the exact dev.25 Amino fallback payload', async () => {
    const txRaw = TxRaw.fromPartial({
      bodyBytes: Uint8Array.from([1]),
      authInfoBytes: Uint8Array.from([2]),
      signatures: [Uint8Array.from([3])],
    })
    stargate.sign.mockResolvedValue(txRaw)
    stargate.broadcastTx.mockResolvedValue({ code: 0, height: 123, transactionHash: 'ABC', events: [] })

    const result = await signAndBroadcastManualAmino({
      rpcEndpoint: 'https://rpc.example',
      signer,
      address,
      messages: [message],
      gasPrice: '3uvna',
      gasAdjustment: 2,
      memo: 'MsgStoreDigest',
    })

    expect(result).toMatchObject({ code: 0, height: 123, transactionHash: 'ABC' })
    expect(stargate.sign).toHaveBeenCalledWith(
      address,
      [message],
      { amount: [{ amount: '600', denom: 'uvna' }], gas: '200' },
      'MsgStoreDigest',
      { accountNumber: 7, sequence: 3, chainId: 'vna-devnet-1' }
    )
    expect(stargate.broadcastTx).toHaveBeenCalledOnce()
    expect(TxRaw.decode(stargate.broadcastTx.mock.calls[0]?.[0] ?? new Uint8Array())).toEqual(txRaw)
  })

  it('re-signs once with the chain-provided sequence after a mismatch', async () => {
    const txRaw = TxRaw.fromPartial({ bodyBytes: Uint8Array.from([1]) })
    stargate.sign
      .mockRejectedValueOnce(new Error('account sequence mismatch, expected 5, got 3'))
      .mockResolvedValueOnce(txRaw)
    stargate.broadcastTx.mockResolvedValue({ code: 0, height: 123, transactionHash: 'ABC', events: [] })

    await signAndBroadcastManualAmino({
      rpcEndpoint: 'https://rpc.example',
      signer,
      address,
      messages: [message],
      gasPrice: '3uvna',
      gasAdjustment: 2,
    })

    expect(stargate.sign).toHaveBeenCalledTimes(2)
    expect(stargate.sign.mock.calls[1]?.[4]).toEqual({
      accountNumber: 7,
      sequence: 5,
      chainId: 'vna-devnet-1',
    })
  })
})
