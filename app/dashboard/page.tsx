'use client'

import { useEffect, useState } from "react";
import { DashboardData, dashboardSections } from "@/ui/dataview/datasections/dashboard";
import DataView from "@/ui/common/data-view-columns";
import { useChain } from "@cosmos-kit/react";
import { useVeranaChain } from "@/hooks/useVeranaChain";
import TitleAndButton from "@/ui/common/title-and-button";
import { resolveTranslatable } from "@/ui/dataview/types";
import { translate } from "@/i18n/dataview";
import Wallet from "@/wallet/wallet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWallet } from "@fortawesome/free-solid-svg-icons";
import FeaturedServices from "@/ui/common/featured-services";
import GettingStarted from "@/ui/common/getting-started";
import VeranaFooter from "@/ui/common/verana-footer";

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
    totalDIDs: "124,857",
    trustRegistries: "2,341",
    participants: "8,192",
    sessions: "156,789",
    totalDepositValue: "34,495,324 VNA"
  };

  useEffect(() => {
    const fetchHeight = async () => {
      if (getStargateClient && isWalletConnected) {
        const client = await getStargateClient();
        const block = await client.getBlock();
        setBlockHeight(String(block.header.height.toLocaleString(undefined)));
      }
    };
    fetchHeight();
    const interval = setInterval(fetchHeight, 5000);
    return () => clearInterval(interval);
  }, [getStargateClient, isWalletConnected]);

  return (
    <>
      <TitleAndButton 
        title={resolveTranslatable({key: "dashboard.title"}, translate)?? "Dashboard"}
        description={[resolveTranslatable({key: "dashboard.desc"}, translate)??""]}
      />

      <DataView<DashboardData>
          sectionsI18n={dashboardSections}
          data={data}
          id=""
      />

      {/* Wallet Connection CTA */}
      { !isWalletConnected && (
      <section className="mb-8">
        <div className="bg-gradient-to-r from-primary-600 to-primary-500 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-8 sm:px-8 sm:py-12">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-white mb-2">{resolveTranslatable({key: 'notconnected.dashboard.title'}, translate)}</h2>
                  <p className="text-primary-100 text-lg mb-4">{resolveTranslatable({key: 'notconnected.dashboard.msg'}, translate)}</p>
              </div>
              <div className="flex-shrink-0">                  
                  <div className="inline-flex items-center px-8 py-4 bg-white text-primary-700 text-lg font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600">
                    <FontAwesomeIcon icon={faWallet} />
                    <Wallet isNavBar={false}/>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Featured Services */}
      <FeaturedServices isWalletConnected={isWalletConnected}/>

      {/* Getting Started Guide */}
      <GettingStarted/>

      {/* Footer */}
      <VeranaFooter/>

    </>
  );
}
