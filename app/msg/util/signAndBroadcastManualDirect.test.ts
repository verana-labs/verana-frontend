import { toBase64 } from '@cosmjs/encoding'
import type { OfflineDirectSigner } from '@cosmjs/proto-signing'
import { MsgStoreDigest } from '@verana-labs/verana-types/codec/verana/di/v1/tx'
import { TxBody, TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeRegistry, signAndBroadcastManualDirect } from './signAndBroadcastManualDirect'

const stargate = vi.hoisted(() => ({
  broadcastTx: vi.fn(),
  getSequence: vi.fn(),
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

describe('signAndBroadcastManualDirect', () => {
  beforeEach(() => {
    stargate.broadcastTx.mockReset()
    stargate.getSequence.mockReset()
    stargate.simulate.mockReset().mockResolvedValue(100)
  })

  it('returns the simulated fee without signing or broadcasting', async () => {
    const signDirect = vi.fn(async () => {
      throw new Error('simulation must not sign')
    })
    const signer: OfflineDirectSigner = {
      getAccounts: vi.fn(async () => []),
      signDirect,
    }

    const result = await signAndBroadcastManualDirect({
      rpcEndpoint: 'https://rpc.example',
      chainId: 'vna-test-1',
      signer,
      address: 'verana1operator',
      registry: makeRegistry(),
      messages: [
        {
          typeUrl: '/verana.di.v1.MsgStoreDigest',
          value: MsgStoreDigest.fromPartial({
            authority: 'verana1corporation',
            operator: 'verana1operator',
            digest: 'sha384-test',
          }),
        },
      ],
      gasPrice: '0.3uvna',
      gasAdjustment: 2,
      simulate: true,
    })

    expect(result).toEqual({ amount: [{ amount: '60', denom: 'uvna' }], gas: '200' })
    expect(stargate.simulate).toHaveBeenCalledOnce()
    expect(stargate.getSequence).not.toHaveBeenCalled()
    expect(signDirect).not.toHaveBeenCalled()
    expect(stargate.broadcastTx).not.toHaveBeenCalled()
  })

  it('signs and broadcasts the exact dev.25 protobuf payload', async () => {
    const address = 'verana1operator'
    const publicKey = Uint8Array.from([2, ...new Array<number>(32).fill(1)])
    const signatureBytes = new Uint8Array(64).fill(2)
    const signDirect = vi.fn(async (_signerAddress, signDoc) => ({
      signed: signDoc,
      signature: {
        pub_key: { type: 'tendermint/PubKeySecp256k1', value: toBase64(publicKey) },
        signature: toBase64(signatureBytes),
      },
    }))
    const signer: OfflineDirectSigner = {
      getAccounts: vi.fn(async () => [{ address, algo: 'secp256k1' as const, pubkey: publicKey }]),
      signDirect,
    }
    stargate.getSequence.mockResolvedValue({ accountNumber: 7, sequence: 3 })
    stargate.broadcastTx.mockResolvedValue({ code: 0, height: 123, transactionHash: 'ABC', events: [] })

    const result = await signAndBroadcastManualDirect({
      rpcEndpoint: 'https://rpc.example',
      chainId: 'vna-devnet-1',
      signer,
      address,
      registry: makeRegistry(),
      messages: [
        {
          typeUrl: '/verana.di.v1.MsgStoreDigest',
          value: MsgStoreDigest.fromPartial({
            authority: 'verana1corporation',
            operator: address,
            digest: 'sha384-test',
          }),
        },
      ],
      gasPrice: '3uvna',
      gasAdjustment: 2,
      memo: 'MsgStoreDigest',
    })

    expect(result).toMatchObject({ code: 0, height: 123, transactionHash: 'ABC' })
    expect(signDirect).toHaveBeenCalledOnce()
    expect(signDirect.mock.calls[0]?.[0]).toBe(address)
    const signDoc = signDirect.mock.calls[0]?.[1]
    expect(signDoc?.chainId).toBe('vna-devnet-1')
    expect(signDoc?.accountNumber).toBe(BigInt(7))

    const body = TxBody.decode(signDoc?.bodyBytes ?? new Uint8Array())
    expect(body.memo).toBe('MsgStoreDigest')
    expect(body.messages).toHaveLength(1)
    expect(body.messages[0]?.typeUrl).toBe('/verana.di.v1.MsgStoreDigest')
    expect(MsgStoreDigest.decode(body.messages[0]?.value ?? new Uint8Array())).toEqual({
      authority: 'verana1corporation',
      operator: address,
      digest: 'sha384-test',
    })

    expect(stargate.broadcastTx).toHaveBeenCalledOnce()
    const txRaw = TxRaw.decode(stargate.broadcastTx.mock.calls[0]?.[0] ?? new Uint8Array())
    expect(txRaw.bodyBytes).toEqual(signDoc?.bodyBytes)
    expect(txRaw.signatures).toEqual([signatureBytes])
  })
})
