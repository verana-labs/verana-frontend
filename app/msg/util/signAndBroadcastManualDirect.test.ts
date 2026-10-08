import { toBase64 } from '@cosmjs/encoding'
import type { OfflineDirectSigner } from '@cosmjs/proto-signing'
import { BroadcastTxError } from '@cosmjs/stargate'
import { MsgStoreDigest } from '@verana-labs/verana-types/codec/verana/di/v1/tx'
import { AuthInfo, TxBody, TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx'
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
      createWithSigner: vi.fn(async () => stargate),
    },
  }
})

vi.mock('@cosmjs/tendermint-rpc', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@cosmjs/tendermint-rpc')>()),
  Comet38Client: { connect: vi.fn(async () => ({})) },
}))

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

  it('signs the given fee and granter without simulating again', async () => {
    const address = 'verana1operator'
    const publicKey = Uint8Array.from([2, ...new Array<number>(32).fill(1)])
    const signDirect = vi.fn(async (_signerAddress, signDoc) => ({
      signed: signDoc,
      signature: {
        pub_key: { type: 'tendermint/PubKeySecp256k1', value: toBase64(publicKey) },
        signature: toBase64(new Uint8Array(64).fill(2)),
      },
    }))
    const signer: OfflineDirectSigner = {
      getAccounts: vi.fn(async () => [{ address, algo: 'secp256k1' as const, pubkey: publicKey }]),
      signDirect,
    }
    stargate.getSequence.mockResolvedValue({ accountNumber: 7, sequence: 3 })
    stargate.broadcastTx.mockResolvedValue({ code: 0, height: 123, transactionHash: 'ABC', events: [] })

    await signAndBroadcastManualDirect({
      rpcEndpoint: 'https://rpc.example',
      chainId: 'vna-devnet-1',
      signer,
      address,
      registry: makeRegistry(),
      messages: [
        {
          typeUrl: '/verana.di.v1.MsgStoreDigest',
          value: MsgStoreDigest.fromPartial({ authority: 'verana1corporation', operator: address, digest: 'sha384' }),
        },
      ],
      gasPrice: '3uvna',
      gasAdjustment: 2,
      fee: { amount: [{ denom: 'uvna', amount: '293754' }], gas: '97918', granter: 'verana1corporation' },
    })

    expect(stargate.simulate).not.toHaveBeenCalled()
    const authInfo = AuthInfo.decode(signDirect.mock.calls[0]?.[1]?.authInfoBytes ?? new Uint8Array())
    expect(authInfo.fee?.amount).toEqual([{ denom: 'uvna', amount: '293754' }])
    expect(authInfo.fee?.gasLimit).toBe(BigInt(97918))
    expect(authInfo.fee?.granter).toBe('verana1corporation')
    const txRaw = TxRaw.decode(stargate.broadcastTx.mock.calls[0]?.[0] ?? new Uint8Array())
    expect(AuthInfo.decode(txRaw.authInfoBytes).fee?.amount).toEqual([{ denom: 'uvna', amount: '293754' }])
  })

  describe('on an account sequence mismatch', () => {
    const address = 'verana1operator'
    const publicKey = Uint8Array.from([2, ...new Array<number>(32).fill(1)])
    const mismatch = new BroadcastTxError(
      32,
      'sdk',
      'account sequence mismatch, expected 5, got 3: incorrect account sequence'
    )

    function directSigner() {
      const signDirect = vi.fn(async (_signerAddress, signDoc) => ({
        signed: signDoc,
        signature: {
          pub_key: { type: 'tendermint/PubKeySecp256k1', value: toBase64(publicKey) },
          signature: toBase64(new Uint8Array(64).fill(2)),
        },
      }))
      const signer: OfflineDirectSigner = {
        getAccounts: vi.fn(async () => [{ address, algo: 'secp256k1' as const, pubkey: publicKey }]),
        signDirect,
      }
      return { signer, signDirect }
    }

    function send(signer: OfflineDirectSigner) {
      return signAndBroadcastManualDirect({
        rpcEndpoint: 'https://rpc.example',
        chainId: 'vna-devnet-1',
        signer,
        address,
        registry: makeRegistry(),
        messages: [
          {
            typeUrl: '/verana.di.v1.MsgStoreDigest',
            value: MsgStoreDigest.fromPartial({ authority: 'verana1corporation', operator: address, digest: 'sha384' }),
          },
        ],
        gasPrice: '3uvna',
        fee: { amount: [{ denom: 'uvna', amount: '300000' }], gas: '100000' },
      })
    }

    function signedSequence(signDirect: ReturnType<typeof directSigner>['signDirect'], call: number) {
      const authInfo = AuthInfo.decode(signDirect.mock.calls[call]?.[1]?.authInfoBytes ?? new Uint8Array())
      return authInfo.signerInfos[0]?.sequence
    }

    beforeEach(() => {
      stargate.getSequence.mockResolvedValue({ accountNumber: 7, sequence: 3 })
    })

    it('signs again once with the sequence the chain expects', async () => {
      const { signer, signDirect } = directSigner()
      stargate.broadcastTx
        .mockRejectedValueOnce(mismatch)
        .mockResolvedValueOnce({ code: 0, height: 124, transactionHash: 'DEF', events: [] })

      await expect(send(signer)).resolves.toMatchObject({ code: 0, transactionHash: 'DEF' })
      expect(signDirect).toHaveBeenCalledTimes(2)
      expect(signedSequence(signDirect, 0)).toBe(BigInt(3))
      expect(signedSequence(signDirect, 1)).toBe(BigInt(5))
      expect(stargate.broadcastTx).toHaveBeenCalledTimes(2)
    })

    it('reads the sequence again when the error does not carry the expected one', async () => {
      const { signer, signDirect } = directSigner()
      stargate.getSequence
        .mockResolvedValueOnce({ accountNumber: 7, sequence: 3 })
        .mockResolvedValueOnce({ accountNumber: 7, sequence: 4 })
      stargate.broadcastTx
        .mockRejectedValueOnce(new BroadcastTxError(32, 'sdk', 'account sequence mismatch'))
        .mockResolvedValueOnce({ code: 0, height: 124, transactionHash: 'DEF', events: [] })

      await send(signer)
      expect(signedSequence(signDirect, 1)).toBe(BigInt(4))
    })

    it('fails to the user after the single retry', async () => {
      const { signer, signDirect } = directSigner()
      stargate.broadcastTx.mockRejectedValue(mismatch)

      await expect(send(signer)).rejects.toThrow('account sequence mismatch')
      expect(signDirect).toHaveBeenCalledTimes(2)
    })

    it('does not retry a mismatch that did not come from the broadcast', async () => {
      const { signer, signDirect } = directSigner()
      signDirect.mockRejectedValueOnce(new Error('account sequence mismatch, expected 5, got 3'))

      await expect(send(signer)).rejects.toThrow('account sequence mismatch')
      expect(signDirect).toHaveBeenCalledOnce()
      expect(stargate.broadcastTx).not.toHaveBeenCalled()
    })

    it('does not retry any other broadcast error', async () => {
      const { signer, signDirect } = directSigner()
      stargate.broadcastTx.mockRejectedValue(new Error('insufficient fees'))

      await expect(send(signer)).rejects.toThrow('insufficient fees')
      expect(signDirect).toHaveBeenCalledOnce()
    })

    describe('rejected in the block', () => {
      const rejected = {
        code: 32,
        height: 124,
        transactionHash: 'BAD',
        rawLog: 'account sequence mismatch, expected 5, got 3: incorrect account sequence',
        events: [],
      }

      it('signs again once with the sequence from the log and returns the second result', async () => {
        const { signer, signDirect } = directSigner()
        stargate.broadcastTx
          .mockResolvedValueOnce(rejected)
          .mockResolvedValueOnce({ code: 0, height: 125, transactionHash: 'DEF', events: [] })

        await expect(send(signer)).resolves.toMatchObject({ code: 0, transactionHash: 'DEF' })
        expect(signDirect).toHaveBeenCalledTimes(2)
        expect(signedSequence(signDirect, 1)).toBe(BigInt(5))
        expect(stargate.broadcastTx).toHaveBeenCalledTimes(2)
      })

      it('reads the sequence again when the response has no log', async () => {
        const { signer, signDirect } = directSigner()
        stargate.getSequence
          .mockResolvedValueOnce({ accountNumber: 7, sequence: 3 })
          .mockResolvedValueOnce({ accountNumber: 7, sequence: 4 })
        stargate.broadcastTx
          .mockResolvedValueOnce({ ...rejected, rawLog: undefined })
          .mockResolvedValueOnce({ code: 0, height: 125, transactionHash: 'DEF', events: [] })

        await send(signer)
        expect(signedSequence(signDirect, 1)).toBe(BigInt(4))
      })

      it('returns a second rejection as is without retrying again', async () => {
        const { signer, signDirect } = directSigner()
        stargate.broadcastTx.mockResolvedValue(rejected)

        await expect(send(signer)).resolves.toMatchObject({ code: 32, transactionHash: 'BAD' })
        expect(signDirect).toHaveBeenCalledTimes(2)
        expect(stargate.broadcastTx).toHaveBeenCalledTimes(2)
      })

      it('does not retry any other failure code', async () => {
        const { signer, signDirect } = directSigner()
        stargate.broadcastTx.mockResolvedValue({ ...rejected, code: 5, rawLog: 'insufficient funds' })

        await expect(send(signer)).resolves.toMatchObject({ code: 5 })
        expect(signDirect).toHaveBeenCalledOnce()
        expect(stargate.broadcastTx).toHaveBeenCalledOnce()
      })
    })
  })
})
