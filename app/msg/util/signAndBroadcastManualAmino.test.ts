import type { OfflineAminoSigner } from '@cosmjs/amino'
import { BroadcastTxError, type StdFee } from '@cosmjs/stargate'
import { MsgStoreDigest } from '@verana-labs/verana-types/codec/verana/di/v1/tx'
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { signAndBroadcastManualAmino } from './signAndBroadcastManualAmino'

const stargate = vi.hoisted(() => ({
  broadcastTx: vi.fn(),
  getChainId: vi.fn(),
  getSequence: vi.fn(),
  simulate: vi.fn(),
  sign: vi.fn(),
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

const address = 'verana1operator'
const accountNumber = BigInt('15667172330941460096')
const signer: OfflineAminoSigner = {
  getAccounts: vi.fn(async () => []),
  signAmino: vi.fn(async () => {
    throw new Error('the client signs')
  }),
}
const messages = [
  {
    typeUrl: '/verana.di.v1.MsgStoreDigest',
    value: MsgStoreDigest.fromPartial({ authority: 'verana1corporation', operator: address, digest: 'sha384' }),
  },
]
const confirmedFee: StdFee = {
  amount: [{ denom: 'uvna', amount: '293754' }],
  gas: '97918',
  granter: 'verana1corporation',
}

function send(options: { fee?: StdFee; simulate?: boolean }) {
  return signAndBroadcastManualAmino({
    rpcEndpoint: 'https://rpc.example',
    signer,
    address,
    messages,
    gasPrice: '3uvna',
    memo: 'MsgStoreDigest',
    ...options,
  })
}

describe('signAndBroadcastManualAmino', () => {
  beforeEach(() => {
    stargate.broadcastTx.mockReset().mockResolvedValue({ code: 0, height: 123, transactionHash: 'ABC', events: [] })
    stargate.getChainId.mockReset().mockResolvedValue('vna-devnet-1')
    stargate.getSequence.mockReset().mockResolvedValue({ accountNumber, sequence: 3 })
    stargate.simulate.mockReset().mockResolvedValue(100)
    stargate.sign.mockReset().mockResolvedValue(TxRaw.fromPartial({}))
  })

  it('returns the simulated fee without signing when no fee is given', async () => {
    const result = await send({ simulate: true })

    expect(result).toEqual({ amount: [{ amount: '450', denom: 'uvna' }], gas: '150' })
    expect(stargate.simulate).toHaveBeenCalledOnce()
    expect(stargate.sign).not.toHaveBeenCalled()
  })

  it('signs the given fee and granter without simulating again', async () => {
    const result = await send({ fee: confirmedFee })

    expect(result).toMatchObject({ code: 0, transactionHash: 'ABC' })
    expect(stargate.simulate).not.toHaveBeenCalled()
    expect(stargate.sign).toHaveBeenCalledOnce()
    expect(stargate.sign).toHaveBeenCalledWith(address, messages, confirmedFee, 'MsgStoreDigest', {
      accountNumber,
      sequence: 3,
      chainId: 'vna-devnet-1',
    })
    expect(stargate.broadcastTx).toHaveBeenCalledOnce()
  })

  it('retries a sequence mismatch with the same given fee', async () => {
    stargate.broadcastTx.mockRejectedValueOnce(
      new BroadcastTxError(32, 'sdk', 'account sequence mismatch, expected 4, got 3: incorrect account sequence')
    )

    await send({ fee: confirmedFee })

    expect(stargate.simulate).not.toHaveBeenCalled()
    expect(stargate.sign).toHaveBeenCalledTimes(2)
    expect(stargate.sign.mock.calls[1]?.[2]).toBe(confirmedFee)
    expect(stargate.sign.mock.calls[1]?.[4]).toMatchObject({ sequence: 4 })
    expect(stargate.broadcastTx).toHaveBeenCalledTimes(2)
  })

  it('reads the sequence again when the mismatch does not carry the expected one', async () => {
    stargate.getSequence
      .mockResolvedValueOnce({ accountNumber, sequence: 3 })
      .mockResolvedValueOnce({ accountNumber, sequence: 6 })
    stargate.broadcastTx.mockRejectedValueOnce(new BroadcastTxError(32, 'sdk', 'account sequence mismatch'))

    await send({ fee: confirmedFee })

    expect(stargate.sign.mock.calls[1]?.[4]).toMatchObject({ sequence: 6 })
  })

  it('does not retry a signing error that mentions the sequence', async () => {
    stargate.sign.mockRejectedValueOnce(new Error('account sequence mismatch, expected 4, got 3'))

    await expect(send({ fee: confirmedFee })).rejects.toThrow('account sequence mismatch')
    expect(stargate.sign).toHaveBeenCalledOnce()
    expect(stargate.broadcastTx).not.toHaveBeenCalled()
  })

  describe('when the block rejects the sequence', () => {
    const rejected = {
      code: 32,
      height: 124,
      transactionHash: 'BAD',
      rawLog: 'account sequence mismatch, expected 4, got 3: incorrect account sequence',
      events: [],
    }

    it('retries once with the sequence from the log and returns the second result', async () => {
      stargate.broadcastTx.mockResolvedValueOnce(rejected)

      await expect(send({ fee: confirmedFee })).resolves.toMatchObject({ code: 0, transactionHash: 'ABC' })
      expect(stargate.sign).toHaveBeenCalledTimes(2)
      expect(stargate.sign.mock.calls[1]?.[4]).toMatchObject({ sequence: 4 })
      expect(stargate.broadcastTx).toHaveBeenCalledTimes(2)
    })

    it('returns a second rejection as is without retrying again', async () => {
      stargate.broadcastTx.mockResolvedValue(rejected)

      await expect(send({ fee: confirmedFee })).resolves.toMatchObject({ code: 32, transactionHash: 'BAD' })
      expect(stargate.sign).toHaveBeenCalledTimes(2)
      expect(stargate.broadcastTx).toHaveBeenCalledTimes(2)
    })

    it('does not retry any other failure code', async () => {
      stargate.broadcastTx.mockResolvedValue({ ...rejected, code: 5, rawLog: 'insufficient funds' })

      await expect(send({ fee: confirmedFee })).resolves.toMatchObject({ code: 5 })
      expect(stargate.sign).toHaveBeenCalledOnce()
      expect(stargate.broadcastTx).toHaveBeenCalledOnce()
    })
  })
})
