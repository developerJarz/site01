"use client";

import { SessionProvider } from "next-auth/react";
import { SiteSettingsProvider } from "@/context/SiteSettingsContext";
import { MarketplaceProvider } from "@/context/MarketplaceContext";
import { TrafficTracker } from "@/components/analytics/TrafficTracker";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SiteSettingsProvider>
        <MarketplaceProvider><TrafficTracker />{children}</MarketplaceProvider>
      </SiteSettingsProvider>
    </SessionProvider>
  );
}
