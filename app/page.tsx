// app/page.tsx
'use client'

import { useEffect, useState } from "react";
import { DashboardData, dashboardSections } from "@/app/types/DataViewTypes";
import DataView from "@/app/ui/common/data-view"
import { useChain } from "@cosmos-kit/react";
import { veranaChain } from "@/app/config/veranachain";
import Wallet from "@/app/wallet/Wallet";

export default function Page() {
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
      if (getStargateClient) {
        const client = await getStargateClient();
        const block = await client.getBlock();
        setBlockHeight(String(block.header.height));
      }
    };
    fetchHeight();
    const interval = setInterval(fetchHeight, 5000);
    return () => clearInterval(interval);
  }, [getStargateClient]);

  return (
    <div
      className="
        min-h-screen
        max-w-screen-xl mx-auto
      "
    >
      <DataView<DashboardData>
        title="Dashboard"
        sections={dashboardSections}
        data={data}
        id=""
      />

      <div className="mt-8 flex justify-center">
        {!isWalletConnected ? <Wallet /> : null}
      </div>
    </div>
  );
}
