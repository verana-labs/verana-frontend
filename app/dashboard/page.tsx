'use client'

import { useEffect, useState } from "react";
import { DashboardData, dashboardSections } from "@/ui/dataview/datasections/dashboard";
import DataView from "@/ui/common/data-view-columns";
import { useChain } from "@cosmos-kit/react";
import { useVeranaChain } from "@/hooks/useVeranaChain";
import TitleAndButton from "@/ui/common/title-and-button";
import Connected from "@/ui/common/connected-not-connected";
import { resolveTranslatable } from "@/ui/dataview/types";
import { translate } from "@/i18n/dataview";

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
      <TitleAndButton title={resolveTranslatable({key: "dashboard.title"}, translate)?? "Dashboard"} />
      <div className="center">
        <Connected isConnected={isWalletConnected} wallet={wallet}/>
      </div>
      {isWalletConnected && (
        <>
        <br/>
        <DataView<DashboardData>
            sectionsI18n={dashboardSections}
            data={data}
            id=""
            columnsCount={2}
        />
        </>
      )}
    </>
  );
}
