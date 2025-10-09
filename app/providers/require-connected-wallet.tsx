'use client';

import { useEffect, useState } from "react";
import { useChain } from "@cosmos-kit/react";
import { useRouter, usePathname } from "next/navigation";
import { useVeranaChain } from "@/app/hooks/useVeranaChain";

export default function RequireConnectedWallet({ children }: { children: React.ReactNode }) {
  // Get the Verana chain name from custom hook
  const { chain_name } = useVeranaChain();

  // Get the wallet connection status from Cosmos-Kit
  const { status } = useChain(chain_name);
  // Possible values: "Disconnected" | "Connecting" | "Connected" | "Rejected" | "Error" | "NotExist"

  // Router and pathname from Next.js
  const router = useRouter();
  const pathname = usePathname();
  const onDashboard = pathname === "/dashboard";

  // Track client hydration to avoid running client-only logic on the server
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Detect when the wallet is still initializing or reconnecting
  const initializing = status === "Connecting";

  // Redirect logic: runs only after hydration and after initialization finishes
  useEffect(() => {
    // Don’t run until the component has hydrated
    if (!hydrated) return;

    // Allow access to dashboard even when disconnected
    if (onDashboard) return;

    // Wait until wallet initialization is complete
    if (initializing) return;

    // Redirect to /dashboard only when wallet is confirmed disconnected
    if (status !== "Connected") {
      router.replace("/dashboard");
    }
  }, [hydrated, initializing, onDashboard, status, router]);

  // ---- RENDER PHASE ----
  // Wait for hydration before rendering anything
  if (!hydrated) return null;

  // While initializing or disconnected (and not on dashboard), render nothing
  if (!onDashboard && (initializing || status !== "Connected")) {
    return null;
  }

  // Otherwise, render the protected content
  return <>{children}</>;
}