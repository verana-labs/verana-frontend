'use client'

import { useEffect, useState } from "react";
import { DashboardData, dashboardSections } from "@/app/types/dataViewTypes";
import DataView from "@/app/ui/common/data-view-columns";
import { useChain } from "@cosmos-kit/react";
import { useVeranaChain } from "@/app/hooks/useVeranaChain";
import TitleAndButton from "@/app/ui/common/title-and-button";
import Connected from "@/app/ui/common/connected-not-connected";

export default function Page() {

  const veranaChain = useVeranaChain();

  const { getStargateClient, status, isWalletConnected, address, wallet } = useChain(veranaChain.chain_name);
  const [blockHeight, setBlockHeight] = useState<string>("");

  const data: DashboardData = {
    chainName: isWalletConnected
      ? `${veranaChain.chain_name} (${veranaChain.chain_id})`
      : null,
    blockHeight,
    status,
    isWalletConnected: String(isWalletConnected),
    address: address ? String(address) : null,
    walletPrettyName: wallet ? wallet.prettyName : null,
  };

  useEffect(() => {
    const fetchHeight = async () => {
      if (getStargateClient && isWalletConnected) {
        const client = await getStargateClient();
        const block = await client.getBlock();
        setBlockHeight(String(block.header.height));
      }
    };
    fetchHeight();
    const interval = setInterval(fetchHeight, 5000);
    return () => clearInterval(interval);
  }, [getStargateClient, isWalletConnected]);

  return (
    <>
      <TitleAndButton
        title="Dashboard"
      />
      <div className="center">
        <Connected isConnected={isWalletConnected} wallet={wallet}/>
      </div>
      {isWalletConnected && (
        <>
        <br/>
        <DataView<DashboardData>
            sections={dashboardSections}
            data={data}
            id=""
            columnsCount={2}
        />
        </>
      )}
    </>
  );
}
