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
        <div className="h-screen flex flex-col">
          {/* Header */}
          <header className="app-header">
            <NavBar />
          </header>

          {/* Main Container */}
          <div className="app-container flex-1 flex">
              {/* Side Navigation */}
              <aside className="hidden lg:flex">
                <SideNav />
              </aside>

              {/* Content */}
              <TrustDepositParamsProvider value={trustDepositParams}>
                <div className="app-content">
                  <main className="app-content-inner h-full overflow-y-auto">
                      {children}
                  </main>
                </div>
              </TrustDepositParamsProvider>
          </div>
        </div>
      </Providers>
    );         
}