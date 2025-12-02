'use client'

import NavBar from "@/ui/common/nav-bar";
import SideNav from "@/ui/common/sidenav";
import { useEffect, useState } from "react";
import Providers from "@/providers/providers";
import { TrustDepositParamsProvider } from "@/providers/trust-deposit-params-context";
import { TrustDepositParams } from "@/lib/trustDepositParams";

export default function ClientLayout({ trustDepositParams, children }: { trustDepositParams: TrustDepositParams, children: React.ReactNode }) {

    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true);}, []);
    if (!mounted) return null;

    return (
      <Providers>
          {/* Header */}
          <header className="app-header">
            <NavBar />
          </header>

          {/* Main Container */}
          <div className="app-container">
              {/* Side Navigation */}
              <aside className="hidden lg:flex lg:flex-shrink-0">
                <SideNav />
              </aside>

              {/* Content */}
              <TrustDepositParamsProvider value={trustDepositParams}>
                <div className="app-content">
                  <main className="app-content-inner">
                      {children}
                  </main>
                </div>
              </TrustDepositParamsProvider>
          </div>
      </Providers>
    );         
}