'use client'

import React, { useEffect, useState } from 'react'
import DataView from '@/app/ui/common/data-view'
import { useChain } from '@cosmos-kit/react'
import { veranaChain } from '@/app/config/veranachain'
import { accountSections, type AccountData } from '@/app/types/DataViewTypes'

export default function Page() {
  const { address, isWalletConnected, getStargateClient } = useChain(veranaChain.chain_name)
  const [data, setData] = useState<AccountData>({
    balance: null,
    totalTrustDeposit: null,
    claimableInterest: null,
    reclaimable: null,
    message: null,
    getVNA: null,
    claimInterest: null,
    reclaimDeposit: null
  })

  useEffect(() => {
    // Only fetch when wallet is connected and address/client are available
    if (!isWalletConnected || !address || !getStargateClient) return

    const fetchData = async () => {
      // Initialize fields
      let balance = null
      let totalTrustDeposit = null
      let claimableInterest = null
      let reclaimable = null
      let message = null
      const getVNA = "GetVNATrustRegistry"
      const claimInterest = "ClaimInterestsTrustRegistry"
      const reclaimDeposit = "ReclaimDepositTrustRegistry"

      // Fetch balance
      try {
        const client = await getStargateClient()
        const balInfo = await client.getBalance(address, 'uvna')
        balance = formatVNA(balInfo.amount, 6)
      } catch (err) {
        console.error('Error fetching balance:', err)
      }

      // Fetch trust registry data
      try {
        const apiUrl = veranaChain.apis?.rest?.[0]?.address
        if (apiUrl) {
          const resp = await fetch(`${apiUrl}/td/v1/get/${address}`)
          // const resp = await fetch(`${apiUrl}/td/v1/get/verana12dyk649yce4dvdppehsyraxe6p6jemzg2qwutf`)
          const json = await resp.json()
          if (json.trust_deposit) {
            totalTrustDeposit = json.trust_deposit.amount
            claimableInterest = '0'
            reclaimable = json.trust_deposit.claimable
          } else if (json.message) {
            message = json.message
          }
        }
      } catch (err) {
        console.error('Error fetching trust registry:', err)
      }

      // Single state update
      setData({ balance, totalTrustDeposit, claimableInterest, reclaimable, message, getVNA, claimInterest, reclaimDeposit})
    }

    fetchData()
  }, [address, isWalletConnected, getStargateClient])

  const formatVNA = (amount: string | null, decimals: number) => {
    if (!amount) return ''
    return (
      Number(amount) / Math.pow(10, decimals)
    ).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }) + ' VNA'
  }

  return (
      <DataView<AccountData> title="Account" sections={accountSections} data={data} id="" />
  )
}
