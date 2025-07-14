// app/page.tsx
'use client'

import { useEffect, useState } from "react";
import { DashboardData, dashboardSections } from "@/app/types/DataViewTypes";
import DataView from "@/app/ui/common/data-view"
import { useChain } from "@cosmos-kit/react";
import { veranaChain } from "@/app/config/veranachain";
import TitleAndButton from "@/app/ui/common/title-and-button";
import NotConnected from "./ui/common/not-connected";
import { LinkIcon } from "@heroicons/react/24/outline";
import Image from 'next/image'

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
    {isWalletConnected ? (
      <div className="min-w-full py-16 rounded-2xl shadow-lg bg-light-bg dark:bg-dark-bg flex flex-col items-center gap-10">
        <div className="w-20 h-20 
            bg-gradient-to-b from-pink-100 to-pink-200
            dark:from-pink-500 dark:via-pink-900 dark:to-pink-950
            rounded-2xl flex justify-center items-center">
            <div className="w-14 h-14 rounded-full bg-white flex justify-center items-center">
                <LinkIcon className="w-8 h-8 text-pink-500" />
            </div>
        </div>
        <div className="self-stretch flex flex-col justify-start text-center items-center gap-3.5">
            <div className="text-2xl sm:text-3xl font-semibold ">Connected</div>
            <div className="w-80 sm:w-[464px] text-base sm:text-xl font-normal leading-norma sm:leading-7">Your crypto wallet is connected to Verana allowing you to proceed with all features.</div>
            <Image
              src={(wallet && wallet.logo) ? wallet.logo.toString() : ''}
              alt={wallet? wallet.prettyName : ''}
              width={80}
              height={80}
              className="w-20 h-20"
            />
        </div>
        <DataView<DashboardData>
            sections={dashboardSections}
            data={data}
            id=""
          />
      </div> ) : (
      <div className="flex justify-center">
        <NotConnected />
      </div>)
    }
    </>
  );
}
