'use client';

import { useEffect } from "react";
import { useChain } from "@cosmos-kit/react";
import { useRouter, usePathname } from "next/navigation";
import { useVeranaChain } from "@/app/hooks/useVeranaChain";

// Protects children: if the wallet is not connected and we're not on /dashboard,
// redirects to /dashboard. Otherwise, renders children.
export default function RequireConnectedWallet({ children }: { children: React.ReactNode }) {
  const veranaChain = useVeranaChain();
  const { isWalletConnected } = useChain(veranaChain.chain_name);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If wallet is not connected and user is not on /dashboard, redirect to /dashboard
    if (!isWalletConnected && pathname !== "/dashboard") {
      router.replace("/dashboard");
    }
  }, [isWalletConnected, pathname, router]);

  if (!isWalletConnected && pathname !== "/dashboard") {
    return null;
  }

  return <>{children}</>;
}
