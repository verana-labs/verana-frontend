import React, { useState } from 'react'
import { useChain } from '@cosmos-kit/react'
import type { StdFee } from '@cosmjs/stargate'
import { MsgAddDID } from '@/app/proto-codecs/codec/veranablockchain/diddirectory/tx'
import { veranaChain } from '@/app/config/veranachain';

interface FormState { did: string; years: number }

export default function AddDID() {
  const { address, signAndBroadcast, isWalletConnected } = useChain(veranaChain.chain_name)
  const [form, setForm] = useState<FormState>({ did: '', years: 0 })
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: name === 'years' ? Number(value) : value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isWalletConnected || !address) return alert('Connect wallet')
    const { did, years } = form
    if (!did || years < 1) return alert('Enter valid DID and years')

    setSubmitting(true)
    try {
      const msg = MsgAddDID.fromPartial({ creator: address, did, years })
      const msgAny = { typeUrl: '/veranablockchain.diddirectory.MsgAddDID', value: msg }
      const gasLimit = 300000; 
      const gasPrice = "3uvna"; 
      const fee: StdFee = {
        amount: [{
          denom: "uvna",
          amount: (parseFloat(gasPrice) * gasLimit).toString(),
        }],
        gas: gasLimit.toString(),
      };
      const res = await signAndBroadcast([msgAny], fee, 'Add DID')
    //   const res = await signAndBroadcast([msgAny])
      res.code === 0
        ? (alert(`Tx: ${res.transactionHash}`), setForm({ did: '', years: 0 }))
        : alert(`Failed: ${res.code}`)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <h2 className="text-2xl font-bold">Add DID</h2>
      <input
        name="did"
        value={form.did}
        onChange={handleChange}
        placeholder="did:method:identifier"
        className="w-full p-2 border rounded"
      />
      <input
        name="years"
        type="number"
        value={form.years}
        onChange={handleChange}
        placeholder="Years"
        className="w-full p-2 border rounded"
        min={1}
      />
      <button
        type="submit"
        disabled={submitting}
        className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : 'Add DID'}
      </button>
    </form>
  )
}
