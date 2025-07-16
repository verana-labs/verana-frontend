'use client'
import React, { useState } from 'react'
import { useChain } from '@cosmos-kit/react'
import type { StdFee } from '@cosmjs/stargate'
import { veranaGasLimit, veranaGasPrice } from '@/app/config/veranachain'
import {
  MsgAddDID,
  MsgRenewDID,
  MsgTouchDID,
  MsgRemoveDID,
} from '@/proto-codecs/codec/veranablockchain/diddirectory/tx'
import { useRouter } from 'next/navigation'
import { useVeranaChain } from '@/app/config/useVeranaChain'

interface FormState { did: string; years: number}

interface ActionDIDProps {
  action: string
  id?: string
}

export default function ActionDID({ action, id }: ActionDIDProps) {

  const veranaChain = useVeranaChain();
  if (!veranaChain) return <span>Loading chain configuration...</span>;

  const {
    address,
    signAndBroadcast,
    isWalletConnected,
    // getSigningStargateClient,
  } = useChain(veranaChain.chain_name)

  const [form, setForm] = useState<FormState>({ did: '', years: 1 })
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: name === 'years' ? Number(value) : value }))
  }

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isWalletConnected || !address) return alert('Connect wallet')
    
    // const signingClient = await getSigningStargateClient();
    const { did, years } = form
    if (!did  && ['AddDID'].includes(action)) {
      return alert('Enter valid DID')
    }
    if ( ['AddDID', 'RenewDID'].includes(action) && years < 1) {
      return alert('Enter valid years')
    }

    setSubmitting(true)
    try {
      const basePayload = { creator: address, did: (id && action != "AddDID") ? id : did}
      const fullPayload = { ...basePayload, years }
      let msgAny: { typeUrl: string; value: MsgAddDID | MsgRenewDID | MsgTouchDID | MsgRemoveDID}

      switch (action) {
        case 'AddDID':
          msgAny = {
            typeUrl: '/verana.dd.v1.MsgAddDID',
            value: MsgAddDID.fromPartial(fullPayload),
          }
          break
        case 'RenewDID':
          msgAny = {
            typeUrl: '/verana.dd.v1.MsgRenewDID',
            value: MsgRenewDID.fromPartial(fullPayload),
          }
          break
        case 'TouchDID':
          msgAny = {
            typeUrl: '/verana.dd.v1.MsgTouchDID',
            value: MsgTouchDID.fromPartial(basePayload),
          }
          break
        case 'RemoveDID':
          msgAny = {
            typeUrl: '/verana.dd.v1.MsgRemoveDID',
            value: MsgRemoveDID.fromPartial(basePayload),
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
      console.info(fee)

      const res = await signAndBroadcast([msgAny], fee, action)
      // const res = await signingClient.signAndBroadcast(address, [msgAny], fee, action)
      if (res.code === 0) {
        alert(`${action} successful! Tx hash: ${res.transactionHash}`)
        setForm({ did: '', years: 0 })
      } else {
        alert(`Transaction failed (${res.code}): ${res.rawLog}`)
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
      if (['RenewDID', 'TouchDID'].includes(action))
        // router.refresh()
        window.location.reload()
      else if (['AddDID'].includes(action))
        router.push(`/dids/${encodeURIComponent(did)}`)
      else
        router.push(`/dids`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      {['AddDID'].includes(action) && (
      <div>
        <label htmlFor="did" className="block text-sm font-medium">
          DID
        </label>
        <input
          name="did"
          value={form.did}
          onChange={handleChange}
          placeholder="did:method:identifier"
          className="w-full p-2 border rounded bg-white dark:bg-black"
          type = 'text'
        />
      </div>
      )}
      {['AddDID', 'RenewDID'].includes(action) && (
      <div>
        <label htmlFor="years" className="block text-sm font-medium">
          Years
        </label>
        <select
          id="years"
          name="years"
          value={form.years}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border rounded bg-white dark:bg-black"
        >
          {Array.from({ length: 10 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>      
      </div>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="border border-button-light-border dark:border-button-dark-border 
                  inline-flex items-center justify-center gap-2 rounded-md py-1 px-2 transition-all 
                  hover:text-light-selected-text hover:bg-light-selected-bg
                  dark:hover:text-dark-selected-text dark:hover:bg-dark-selected-bg 
                  disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
      >
        {submitting ? 'Submitting...' :  action.substring(0, action.indexOf("DID")) + " DID" }
      </button>
    </form>
  )
}
