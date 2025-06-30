
'use client'
import React, { useState } from 'react'
import { useChain } from '@cosmos-kit/react'
import type { StdFee } from '@cosmjs/stargate'
import { veranaChain, veranaGasLimit, veranaGasPrice } from '@/app/config/veranachain'
import { MsgReclaimTrustDeposit, MsgReclaimTrustDepositInterests } from '@/app/proto-codecs/codec/veranablockchain/trustdeposit/tx'
import { useRouter } from 'next/navigation'

interface FormState { claimed: number}

interface ActionTDProps {
  action: string
  setActiveActionId: React.Dispatch<React.SetStateAction<string | null>>
}

export default function ActionTrustDeposit({ action, setActiveActionId }: ActionTDProps) {
  const router = useRouter()
  
  const {
    address,
    signAndBroadcast,
    isWalletConnected,
  } = useChain(veranaChain.chain_name)

  const [form, setForm] = useState<FormState>({ claimed: 0 })
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: name === 'claimed' ? Number(value) : value }))
  }

  const handleCancel = () => {
    setActiveActionId(null) 
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isWalletConnected || !address) return alert('Connect wallet')
    const { claimed } = form

    if ( action == "ReclaimDepositTrustDeposit" && claimed < 1) {
      return alert('Enter valid claimed')
    }

    setSubmitting(true)
    try {
      const basePayload = { creator: address }
      const fullPayload = { ...basePayload, claimed }
      let msgAny: { typeUrl: string; value: MsgReclaimTrustDeposit | MsgReclaimTrustDepositInterests}

      switch (action) {
        case 'ReclaimDepositTrustDeposit':
          msgAny = {
            typeUrl: '/veranablockchain.trustdeposit.MsgReclaimTrustDeposit',
            value: MsgReclaimTrustDeposit.fromPartial(fullPayload),
          }
          break
        case 'ClaimInterestsTrustDeposit':
          msgAny = {
            typeUrl: '/veranablockchain.trustdeposit.MsgReclaimTrustDepositInterests',
            value: MsgReclaimTrustDepositInterests.fromPartial(basePayload),
          }
          break
        default:
          throw new Error(`Unsupported action: ${action}`)
      }

      const fee: StdFee = {
        amount: [
          {
            denom: 'uvna',
            amount: String(
              Math.ceil(parseFloat(veranaGasPrice.toString()) * veranaGasLimit)
            ),
          },
        ],
        gas: veranaGasLimit.toString(),
      }

      const res = await signAndBroadcast([msgAny], fee, action)
      if (res.code === 0) {
        alert(`${action} successful! Tx hash: ${res.transactionHash}`)
        setForm({ claimed: 0 })
      } else {
        alert(`Transaction failed (${res.code}): ${res.rawLog}`)
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
      handleCancel()
      router.refresh()
      window.location.reload()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      {action == "ReclaimDepositTrustDeposit" && (
      <div>
        <label htmlFor="claimed" className="block text-sm font-medium text-gray-700">
          Claimed
        </label>
        <input
          name="claimed"
          type="number"
          value={form.claimed}
          onChange={handleChange}
          placeholder="Claimed"
          className="w-full p-2 border rounded"
          min={1}
        />
      </div>
      )}
      <div className='text-center space-x-4'>
      <button
        type="button"
        disabled={submitting}
        className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 disabled:opacity-50"
        onClick={handleCancel}
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={submitting}
        className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : "Confirm" }
      </button>
      </div>
    </form>
  )
}
