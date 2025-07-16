'use client'

import React, { useEffect, useState } from 'react'
import DataView from '@/app/ui/common/data-view'
import { useChain } from '@cosmos-kit/react'
import { useVeranaChain } from "@/app/config/useVeranaChain";
import { accountSections, type AccountData } from '@/app/types/DataViewTypes'
import { formatVNA } from '@/app/util/util'
import TitleAndButton from '@/app/ui/common/title-and-button'

export default function Page() {

  const veranaChain = useVeranaChain();
  
  const { address, isWalletConnected, getStargateClient } = useChain(veranaChain.chain_name)
  const [data, setData] = useState<AccountData>({
    balance: null,
    totalTrustDeposit: null,
    claimableInterests: null,
    reclaimable: null,
    message: null,
    getVNA: null,
    claimInterests: null,
    reclaimDeposit: null
  })

  useEffect(() => {
    // Only fetch when wallet is connected and address/client are available
    if (!isWalletConnected || !address || !getStargateClient) return

    const fetchData = async () => {
      // Initialize fields
      let balance = null
      let totalTrustDeposit = null
      let claimableInterests = null
      let reclaimable = null
      let message = null
      const getVNA = "GetVNATrustDeposit"
      const claimInterests = "ClaimInterestsTrustDeposit"
      const reclaimDeposit = "ReclaimDepositTrustDeposit"

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
            totalTrustDeposit = formatVNA(json.trust_deposit.amount, 6)
            claimableInterests = formatVNA('0', 6)
            reclaimable = formatVNA(json.trust_deposit.claimable, 6)
          } else if (json.message) {
            message = json.message
          }
        }
      } catch (err) {
        console.error('Error fetching trust registry:', err)
      }

      // Single state update
      setData({ balance, totalTrustDeposit, claimableInterests, reclaimable, message, getVNA, claimInterests, reclaimDeposit})
    }

    fetchData()
  }, [address, isWalletConnected, getStargateClient])

  return (
    <>
      <TitleAndButton
        title="Account"
      />
      <DataView<AccountData> sections={accountSections} data={data} id="" />
    </>
  )
}
