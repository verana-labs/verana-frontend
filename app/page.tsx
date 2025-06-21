"use client"

import { useEffect, useState } from "react";
import { Section } from "@/app/types/data-info";
import DataView from "@/app/ui/dashboard/data-view"
import { useChain } from "@cosmos-kit/react";
import { veranaChain } from "@/app/config/veranachain";
import Wallet from "./wallet/Wallet";

export default function Page() {

  const { getStargateClient, status, isWalletConnected, address, wallet } = useChain(veranaChain.chain_name);
  const [blockHeight, setBlockHeight] = useState<string>("");

  useEffect(() => {
    const fetchHeight = async () => {
      if (getStargateClient) {
        const client = await getStargateClient();
        const block = await client.getBlock();
        setBlockHeight(String(block.header.height));
      }
    };
    fetchHeight();

    // Opcional: refrescar cada 5s
    const interval = setInterval(fetchHeight, 5000);
    return () => clearInterval(interval);
  }, [getStargateClient]);

  const info: Section[] = isWalletConnected ? 
      [
        {
          name: '',
          fields: [
            {
              name: "Connected to",
              value: veranaChain.chain_name.concat(' (').concat(veranaChain.chain_id).concat( ')')
            },
            {
              name: "Block height",
              value: blockHeight
            },
            {
              name: "State",
              value: status
            },
            {
              name: "Wallet Connected",
              value: String(isWalletConnected)
            },
            {
              name: "Address",
              value: String(address)
            },
            {
              name: "Wallet",
              value: wallet? wallet.prettyName : ""
            },
          ]
        }
      ] : [];
  
  return (
    <div>
      <DataView sections={info} title='Dashboard' />
      <br/><br/>
      {
        !isWalletConnected ? 
          <button className="rounded-md flex items-center border border-transparent py-2 px-4 text-center text-sm transition-all text-slate-600 hover:bg-slate-100 focus:bg-slate-100 active:bg-slate-100 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none" type="button">
            <Wallet/>
          </button>
        : ""
      }
    </div>
  );
}
