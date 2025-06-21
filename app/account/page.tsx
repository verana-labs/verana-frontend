'use client'

import DataView from '@/app/ui/dashboard/data-view'
import { Section } from "@/app/types/data-info";
import { useEffect, useState } from 'react';
import { useChain } from '@cosmos-kit/react';
import { veranaChain } from '@/app/config/veranachain';
 
export default function Page() {

    const { address, isWalletConnected, getStargateClient } = useChain(veranaChain.chain_name);
  
    const [balance, setBalance] = useState<string>("");
    const [totalTrustDeposit, setTotalTrustDeposit] = useState<string>("");
    const [claimableInterest, setClaimableInterest] = useState<string>("");
    const [reclaimable, setReclaimable] = useState<string>("");
    const [message, setMessage] = useState<string>("");

    const info: Section[] = isWalletConnected ? 
    [
      {
        name: 'Main Balance',
        fields: [
          {
            name: "Available",
            value: balance
          },
        ]
      },
      {
        name: 'Trust Deposit',
        fields: [
          {
            name: "Total",
            value: totalTrustDeposit
          },
          {
            name: "Claimable Interest",
            value: claimableInterest
          },
          {
            name: "Reclaimable",
            value: reclaimable
          },
          {
            name: "Message",
            value: message
          }
        ]
      }
    ] : [];

    useEffect(() => {
      const fetchBalance = async () => {
        if (isWalletConnected && address && getStargateClient) {
          const client = await getStargateClient();
          const balanceInfo = await client.getBalance(address, "uvna");
          setBalance ( formatVNA(balanceInfo.amount, 6));
          console.info(balanceInfo);
        }
      };
      fetchBalance();

      const fetchTrustRegistry = async () => {
        if (isWalletConnected && address && veranaChain.apis && veranaChain.apis.rest && veranaChain.apis.rest[0].address) {
          // const account = 'verana12dyk649yce4dvdppehsyraxe6p6jemzg2qwutf';
          fetch(veranaChain.apis.rest[0].address+ '/td/v1/get/' + address)
            .then(res => res.json())
            .then(data => {
              if ( data.trust_deposit){
                setClaimableInterest('0');
                setReclaimable(data.trust_deposit.claimable);
                setTotalTrustDeposit(data.trust_deposit.amount);
              }
              else if (data.message){
                setMessage(data.message);
              }
            });
        }
      };
      fetchTrustRegistry();

    }, [address, isWalletConnected, getStargateClient]);

    const formatVNA = (amount: string | null, decimales: number) => {
      if (!amount) return "";
      return (Number(amount) / Math.pow(10, decimales)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) + ' VNA';
    };
    
    return (
      <DataView sections={info} title='Account' />
    );
}