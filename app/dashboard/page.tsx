'use client'

import { useEffect, useState } from "react";
import { DashboardData, dashboardSections } from "@/ui/dataview/datasections/dashboard";
import DataView from "@/ui/common/data-view-columns";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useNotification } from "@/ui/common/notification-provider";
import TitleAndButton from "@/ui/common/title-and-button";
import { resolveTranslatable } from "@/ui/dataview/types";
import { translate } from "@/i18n/dataview";
import Wallet from "@/wallet/wallet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWallet } from "@fortawesome/free-solid-svg-icons";
import FeaturedServices from "@/ui/common/featured-services";
import GettingStarted from "@/ui/common/getting-started";
import DashboardFooter from "@/ui/common/dashboard-footer";

export default function Page() {

  const { dashboardData, errorDashboardData, isWalletConnected } = useDashboardData();
  const [errorNotified, setErrorNotified] = useState(false);
  const { notify } = useNotification();

  useEffect(() => {
    if (errorDashboardData && !errorNotified) {
      (async () => {
        await notify(errorDashboardData, 'error', resolveTranslatable({key: "error.fetch.metrics.title"}, translate));
        setErrorNotified(true);
      })();
    }
  }, [errorDashboardData, errorNotified]);

  return (
    <>
      <TitleAndButton
        title={resolveTranslatable({key: "dashboard.title"}, translate)?? "Dashboard"}
        description={[resolveTranslatable({key: "dashboard.desc"}, translate)??""]}
      />

      <DataView<DashboardData>
          sectionsI18n={dashboardSections}
          data={dashboardData}
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
      <DashboardFooter/>

    </>
  );
}
