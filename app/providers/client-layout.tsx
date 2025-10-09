'use client'

import NavBar from "@/app/ui/common/nav-bar";
import SideNav from "@/app/ui/common/sidenav";
import { useEffect, useState } from "react";
import Providers from "@/app/providers/providers";
import { TrustDepositParamsProvider } from "@/app/providers/trust-deposit-params-context";
import { TrustDepositParams } from "@/app/lib/trustDepositParams";

export default function ClientLayout({ trustDepositParams, children }: { trustDepositParams: TrustDepositParams, children: React.ReactNode }) {

    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true);}, []);
    if (!mounted) return null;

    return (
      <Providers>
          <div className="app-container">
            {/* Header */}
            <header className="app-header">
              <NavBar />
            </header>
            {/* Main Container */}
            <div className="app-main">
              {/* Side Navigation */}
              <aside className="hidden md:block app-sidenav">
                <SideNav />
              </aside>
              {/* Content */}
              <TrustDepositParamsProvider value={trustDepositParams}>
                <main className="app-content">
                  <div className="app-content-inner">
                      {children}
                  </div>
                </main>
              </TrustDepositParamsProvider>
            </div>
          </div>
      </Providers>
    );         
}