'use client';

import { useEffect, useRef, useState } from "react";
import { useChain } from "@cosmos-kit/react";
import { useRouter, usePathname } from "next/navigation";
import { useVeranaChain } from "@/app/hooks/useVeranaChain";

export default function RequireConnectedWallet({ children }: { children: React.ReactNode }) {
  const { chain_name } = useVeranaChain();
  const { status } = useChain(chain_name);
  const router = useRouter();
  const pathname = usePathname();
  const onDashboard = pathname === "/dashboard";

  const [hydrated, setHydrated] = useState(false);
  const [hasStoredWallet, setHasStoredWallet] = useState(false);
  const [bootWindowOpen, setBootWindowOpen] = useState(true);
  const redirected = useRef(false);

  // ---- STEP 1: Wait for hydration (avoid SSR mismatch) ----
  useEffect(() => setHydrated(true), []);

  // ---- STEP 2: Detect if there is any previously connected wallet ----
  // Cosmos-Kit stores connection data in localStorage under keys like "cosmos-kit@..."
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasSession = Object.entries(localStorage).some(([key, value]) => {
      if (!key.startsWith("cosmos-kit@")) return false;
      if (!value) return false;
      // Clean string
      const val = value.trim();
      // Ignore empty, default, or empty-array cases
      return val !== "" && val !== "{}" && val !== "[]" && val !== "null";
    });
    setHasStoredWallet(hasSession);
  }, []);

  // ---- STEP 3: Open a short boot window after hydration ----
  // This prevents treating the first brief "Disconnected" state as final.
  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => setBootWindowOpen(false), 1000); // 300–800 ms usually works well
    return () => clearTimeout(t);
  }, [hydrated]);

  // ---- STEP 4: Detect initialization phase ----
  // We consider it "initializing" if:
  // - status is "Connecting"
  // - OR status is "Disconnected" but we still have a stored wallet and are within the boot window
  const initializing =
    status === "Connecting" ||
    (status === "Disconnected" && hasStoredWallet && bootWindowOpen);

  // ---- STEP 5: Redirect if wallet is not connected (after initialization) ----
  useEffect(() => {
    console.info({hydrated , onDashboard , initializing , redirected, status, hasStoredWallet , bootWindowOpen});
    if (!hydrated || onDashboard || initializing ) return; 

    // Only redirect if not connected and not already on dashboard
    if (status !== "Connected" && pathname !== "/dashboard") {
      redirected.current = true;
      router.replace("/dashboard");
    }
  }, [hydrated, initializing, onDashboard, status, pathname, router]);

  // ---- STEP 6: Render phase ----
  // Wait for hydration before rendering anything
  if (!hydrated) return null;

  // If not on dashboard and still initializing or disconnected, show loading UI
  if (!onDashboard && (initializing || status !== "Connected")) {
    return (
      <div className="flex justify-center items-center h-screen">
        Connecting wallet...
      </div>
    );
  }

  // Otherwise, render protected content
  return <>{children}</>;
}