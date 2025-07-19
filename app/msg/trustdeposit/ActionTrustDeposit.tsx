
'use client'
import React, { useState } from 'react'
import { useChain } from '@cosmos-kit/react'
import type { StdFee } from '@cosmjs/stargate'
import { veranaGasLimit, veranaGasPrice } from '@/app/config/veranachain'
import { MsgReclaimTrustDeposit, MsgReclaimTrustDepositInterests } from '@/proto-codecs/codec/veranablockchain/trustdeposit/tx'
import { useRouter } from 'next/navigation'
import { useVeranaChain } from '@/app/config/useVeranaChain'
import { useNotification } from '@/app/ui/common/notification-provider';

interface FormState { claimed: number}
interface ActionTDProps {
  action: string
  setActiveActionId: React.Dispatch<React.SetStateAction<string | null>>
}

export default function ActionTrustDeposit({ action, setActiveActionId }: ActionTDProps) {

  const veranaChain = useVeranaChain();

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

  const router = useRouter()

  const { notify } = useNotification();
  let notifyPromise: Promise<void> | undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isWalletConnected || !address) return alert('Connect wallet')
    const { claimed } = form

    if ( action == "ReclaimDepositTrustDeposit" && claimed < 1) {
      notify('Enter valid claimed', 'error');
    }

    setSubmitting(true)
    notifyPromise = notify(
      `Your transaction ${action} is being processed.`,
      'inProgress',
      'Transaction successful'
    );

    try {
      const basePayload = { creator: address }
      const fullPayload = { ...basePayload, claimed }
      let msgAny: { typeUrl: string; value: MsgReclaimTrustDeposit | MsgReclaimTrustDepositInterests}

      switch (action) {
        case 'ReclaimDepositTrustDeposit':
          msgAny = {
            typeUrl: '/verana.td.v1.MsgReclaimTrustDeposit',
            value: MsgReclaimTrustDeposit.fromPartial(fullPayload),
          }
          break
        case 'ClaimInterestsTrustDeposit':
          msgAny = {
            typeUrl: '/verana.td.v1.MsgReclaimTrustDepositInterests',
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
        notifyPromise = notify(
          `Your transaction ${action} has been executed.`,
          'success',
          'Transaction successful'
        );
      } else {
        notifyPromise = notify(
          `(${res.code}): ${res.rawLog}`,
          'error',
          `Transaction failed`
        );
      }
    } catch (err: unknown) {
      notifyPromise = notify(
        err instanceof Error ? err.message : String(err),
        'error',
        `Transaction failed`
      );
    } finally {
      if (notifyPromise) await notifyPromise; // Wait for notification to close
      setSubmitting(false)
      handleCancel()
      router.push('/');
      setTimeout(() => router.push('/account'), 100);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      {action == "ReclaimDepositTrustDeposit" && (
      <div>
        <label htmlFor="claimed" className="block text-sm font-medium">
          Claimed
        </label>
        <input
          name="claimed"
          type="number"
          value={form.claimed}
          onChange={handleChange}
          placeholder="Claimed"
          className="w-full p-2 border rounded bg-white dark:bg-black"
          min={1}
        />
      </div>
      )}
      <div className='text-center space-x-4'>
      <button
        type="button"
        disabled={submitting}
        className="border border-button-light-border dark:border-button-dark-border 
                  inline-flex items-center justify-center gap-2 rounded-md py-1 px-2 transition-all 
                  hover:text-light-selected-text hover:bg-light-selected-bg
                  dark:hover:text-dark-selected-text dark:hover:bg-dark-selected-bg 
                  disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
        onClick={handleCancel}
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={submitting}
        className="border border-button-light-border dark:border-button-dark-border 
                  inline-flex items-center justify-center gap-2 rounded-md py-1 px-2 transition-all 
                  hover:text-light-selected-text hover:bg-light-selected-bg
                  dark:hover:text-dark-selected-text dark:hover:bg-dark-selected-bg 
                  disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
      >
        {submitting ? 'Submitting...' : "Confirm" }
      </button>
      </div>
    </form>
  )
}
