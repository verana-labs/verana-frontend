'use client';

import { useChain } from "@cosmos-kit/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useVeranaChain } from "@/app/config/useVeranaChain";

export default function RequireConnectedWallet({ children }: { children: React.ReactNode }) {

  const veranaChain = useVeranaChain();
  if (!veranaChain) return <span>Loading chain configuration...</span>;

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
