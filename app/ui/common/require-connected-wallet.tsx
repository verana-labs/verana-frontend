'use client';

import { useChain } from "@cosmos-kit/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { veranaChain } from "@/app/config/veranachain";

export default function RequireConnectedWallet({ children }: { children: React.ReactNode }) {
  const { isWalletConnected } = useChain(veranaChain.chain_name);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isWalletConnected && pathname !== "/") {
      router.replace("/");
    }
  }, [isWalletConnected, pathname, router]);

  return <>{ (isWalletConnected || (!isWalletConnected && pathname === "/") ) && children}</>;
}
