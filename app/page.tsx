"use client"

import { useEffect, useState } from "react";
import { DashboardData, dashboardSections } from "@/app/types/DataViewTypes";
import DataView from "@/app/ui/common/data-view"
import { useChain } from "@cosmos-kit/react";
import { veranaChain } from "@/app/config/veranachain";
import Wallet from "@/app/wallet/Wallet";

export default function Page() {

  const { getStargateClient, status, isWalletConnected, address, wallet } = useChain(veranaChain.chain_name);
  const [blockHeight, setBlockHeight] = useState<string>("");
  const data : DashboardData = {
    chainName: isWalletConnected ? veranaChain.chain_name.concat(' (').concat(veranaChain.chain_id).concat( ')') : null,
    blockHeight: blockHeight,
    status: status,
    isWalletConnected: String(isWalletConnected),
    address: address? String(address) : null,
    walletPrettyName: wallet ? wallet.prettyName : null
  };

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

  
  return (
    <div>
      <DataView<DashboardData> title="Dashboard" sections={dashboardSections} data={data} id={""} />
      <br/><br/>
      { !isWalletConnected ? 
        <Wallet/> : <span></span>
      }
    </div>
  );
}
