import React, { useState } from 'react'
import { useChain } from '@cosmos-kit/react'
import type { StdFee } from '@cosmjs/stargate'
import { veranaChain, veranaGasLimit, veranaGasPrice } from '@/app/config/veranachain'
import {
  MsgAddDID,
  MsgRenewDID,
  MsgTouchDID,
  MsgRemoveDID,
} from '@/app/proto-codecs/codec/veranablockchain/diddirectory/tx'
import { useRouter } from 'next/navigation'

interface FormState { did: string; years: number}

interface ActionDIDProps {
  action: string
  didUpdate: string | undefined
}

export default function ActionTrustRegistry({ action, didUpdate }: ActionDIDProps) {
  const router = useRouter()
  
  const {
    address,
    signAndBroadcast,
    isWalletConnected,
  } = useChain(veranaChain.chain_name)

  const [form, setForm] = useState<FormState>({ did: '', years: 1 })
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: name === 'years' ? Number(value) : value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isWalletConnected || !address) return alert('Connect wallet')
    const { did, years } = form
    if (!did  && ['AddDID'].includes(action)) {
      return alert('Enter valid DID')
    }
    if ( ['AddDID', 'RenewDID'].includes(action) && years < 1) {
      return alert('Enter valid years')
    }

    setSubmitting(true)
    try {
      const basePayload = { creator: address, did: (didUpdate && action != "AddDID") ? didUpdate : did}
      const fullPayload = { ...basePayload, years }
      let msgAny: { typeUrl: string; value: any }

      switch (action) {
        case 'AddDID':
          msgAny = {
            typeUrl: '/veranablockchain.diddirectory.MsgAddDID',
            value: MsgAddDID.fromPartial(fullPayload),
          }
          break
        case 'RenewDID':
          msgAny = {
            typeUrl: '/veranablockchain.diddirectory.MsgRenewDID',
            value: MsgRenewDID.fromPartial(fullPayload),
          }
          break
        case 'TouchDID':
          msgAny = {
            typeUrl: '/veranablockchain.diddirectory.MsgTouchDID',
            value: MsgTouchDID.fromPartial(basePayload),
          }
          break
        case 'RemoveDID':
          msgAny = {
            typeUrl: '/veranablockchain.diddirectory.MsgRemoveDID',
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

      const res = await signAndBroadcast([msgAny], fee, action)
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
      // if (['AddDID', 'RenewDID', 'TouchDID'].includes(action))
      //     router.push(`/dids/${encodeURIComponent((didUpdate && action != "AddDID") ? didUpdate : did)}`)
      // else
          router.push(`/dids`)
    }
  }

  return (
    <span>Under Construction</span>
  )
}
