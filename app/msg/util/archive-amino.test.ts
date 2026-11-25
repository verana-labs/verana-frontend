import { makeSignDoc, Secp256k1HdWallet, serializeSignDoc } from '@cosmjs/amino'
import type { EncodeObject } from '@cosmjs/proto-signing'
import { SigningStargateClient } from '@cosmjs/stargate'
import { MsgArchiveCredentialSchema } from '@verana-labs/verana-types/codec/verana/cs/v1/tx'
import { MsgArchiveEcosystem } from '@verana-labs/verana-types/codec/verana/ec/v1/tx'
import { Exec, MsgSubmitProposal } from 'cosmjs-types/cosmos/group/v1/tx'
import { describe, expect, it, vi } from 'vitest'
import { veranaAmino, veranaRegistry } from '@/config/veranaChain.sign.client'

const POLICY = 'verana1fsg6hw0pdvqujgktgx4k03s9ehe2ys2kmwyqsj'
const MEMBER = 'verana150jhghlww33g9plky323fyq3v4txfky677dxen'

function archiveEcosystem(archive: boolean): EncodeObject {
  return {
    typeUrl: '/verana.ec.v1.MsgArchiveEcosystem',
    value: MsgArchiveEcosystem.fromPartial({ corporation: POLICY, operator: MEMBER, id: 5, archive }),
  }
}

function archiveSchema(archive: boolean): EncodeObject {
  return {
    typeUrl: '/verana.cs.v1.MsgArchiveCredentialSchema',
    value: MsgArchiveCredentialSchema.fromPartial({ corporation: POLICY, operator: MEMBER, id: 5, archive }),
  }
}

function proposalWith(message: EncodeObject): EncodeObject {
  return {
    typeUrl: '/cosmos.group.v1.MsgSubmitProposal',
    value: MsgSubmitProposal.fromPartial({
      groupPolicyAddress: POLICY,
      proposers: [MEMBER],
      messages: [veranaRegistry.encodeAsAny(message)],
      exec: Exec.EXEC_TRY,
      title: 'title',
      summary: 'summary',
    }),
  }
}

const cases = [
  { name: 'ecosystem', build: archiveEcosystem, aminoType: 'verana/x/ec/MsgArchiveEcosystem' },
  { name: 'credential schema', build: archiveSchema, aminoType: 'verana/x/cs/MsgArchiveCredentialSchema' },
]

describe('archive amino converters', () => {
  it.each(cases)('leaves archive out of the $name unarchive like the chain does', ({ build, aminoType }) => {
    expect(veranaAmino.toAmino(build(false))).toEqual({
      type: aminoType,
      value: { corporation: POLICY, operator: MEMBER, id: '5' },
    })
  })

  it.each(cases)('keeps archive in the $name archive', ({ build, aminoType }) => {
    expect(veranaAmino.toAmino(build(true))).toEqual({
      type: aminoType,
      value: { corporation: POLICY, operator: MEMBER, id: '5', archive: true },
    })
  })

  it.each(cases)('round-trips the $name archive and unarchive, alone and inside a proposal', ({ build }) => {
    for (const archive of [true, false]) {
      const message = build(archive)
      expect(veranaAmino.fromAmino(veranaAmino.toAmino(message))).toEqual(message)
      const proposal = proposalWith(message)
      expect(veranaAmino.fromAmino(veranaAmino.toAmino(proposal))).toEqual(proposal)
    }
  })

  it.each(cases)('leaves archive out of a $name unarchive wrapped in a proposal', ({ build }) => {
    const amino = veranaAmino.toAmino(proposalWith(build(false)))
    expect(amino.value.messages[0].value).toEqual({ corporation: POLICY, operator: MEMBER, id: '5' })
  })

  it.each(cases)('signs the $name unarchive over the sign doc the chain rebuilds', async ({ build, aminoType }) => {
    const wallet = await Secp256k1HdWallet.generate(12, { prefix: 'verana' })
    const [{ address }] = await wallet.getAccounts()
    const signAmino = vi.spyOn(wallet, 'signAmino')
    const client = await SigningStargateClient.offline(wallet, { aminoTypes: veranaAmino, registry: veranaRegistry })
    const fee = { amount: [{ denom: 'uvna', amount: '1000' }], gas: '200000' }

    await client.sign(address, [build(false)], fee, '', {
      accountNumber: BigInt(1),
      sequence: 1,
      chainId: 'vna-testnet-1',
    })

    const chainSignDoc = makeSignDoc(
      [{ type: aminoType, value: { corporation: POLICY, operator: MEMBER, id: '5' } }],
      fee,
      'vna-testnet-1',
      '',
      1,
      1
    )
    const [, walletSignDoc] = signAmino.mock.calls[0]
    expect(serializeSignDoc(walletSignDoc)).toEqual(serializeSignDoc(chainSignDoc))
  })
})
