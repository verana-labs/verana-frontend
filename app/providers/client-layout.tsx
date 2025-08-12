'use client'

import NavBar from "@/app/ui/common/nav-bar";
import SideNav from "@/app/ui/common/sidenav";
import { useEffect, useState } from "react";
import Providers from "./providers";

export default function ClientLayout({ children }: { children: React.ReactNode }) {

    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true);}, []);
    if (!mounted) {
        return <div className="app-skeleton" />;
    }

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
            <main className="app-content">
              <div className="app-content-inner">
                  {children}
              </div>
            </main>
          </div>
        </div>
      </Providers>
    );         
}