"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { DEFAULT_APPEARANCE, resolveAppearance, type AppearanceSettings } from "@/lib/site-config";

export interface SocialLinks {
  facebook: string;
  twitter: string;
  instagram: string;
  youtube: string;
  linkedin: string;
  whatsapp: string;
}

export interface SiteSettingsState {
  siteName: string;
  tagline: string;
  contactEmail: string;
  supportPhone: string;
  address: string;
  workingHours: string;
  logoUrl: string;
  socialLinks: SocialLinks;
  googleMapsUrl: string;
  copyrightText: string;
  defaultListingStatus: "active" | "pending";
  autoApproveListings: boolean;
  maxImagesPerListing: number;
  metaTitleTemplate: string;
  metaDescription: string;
  seoKeywords?: string;
  defaultOgImage?: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  appearance: AppearanceSettings;
}

export const DEFAULT_SETTINGS: SiteSettingsState = {
  siteName: "CarHat.bd",
  tagline: "The premier destination to buy, sell, and explore the best cars in Bangladesh.",
  contactEmail: "carhatbd@gmail.com",
  supportPhone: "+880 1700-000000",
  address: "Plot 12, Road 11, Block C, Gulshan-2, Dhaka 1212, Bangladesh",
  workingHours: "Sat - Thu: 9:00 AM - 8:00 PM (Friday Closed)",
  logoUrl: "/car-hat-bd.png",
  socialLinks: {
    facebook: "https://facebook.com",
    twitter: "https://twitter.com",
    instagram: "https://instagram.com",
    youtube: "https://youtube.com",
    linkedin: "https://linkedin.com",
    whatsapp: "+8801700000000",
  },
  googleMapsUrl: "https://maps.google.com/?q=Gulshan-2,Dhaka,Bangladesh",
  copyrightText: "CarHat.bd. All rights reserved.",
  defaultListingStatus: "pending",
  autoApproveListings: false,
  maxImagesPerListing: 10,
  metaTitleTemplate: "%s | CarHat BD",
  metaDescription:
    "Buy, sell, and explore the best cars in Bangladesh on CarHat.bd. Find your perfect car with verified dealers and private sellers.",
  maintenanceMode: false,
  maintenanceMessage: "We're currently performing maintenance. Please check back soon!",
  appearance: DEFAULT_APPEARANCE,
};

/** Defaults first, then whatever was saved; nested objects are merged so old caches stay usable. */
function mergeSettings(base: SiteSettingsState, incoming: Partial<SiteSettingsState> | undefined): SiteSettingsState {
  if (!incoming) return base;
  return {
    ...base,
    ...incoming,
    socialLinks: { ...base.socialLinks, ...(incoming.socialLinks || {}) },
    appearance: incoming.appearance ? resolveAppearance(incoming.appearance) : base.appearance,
  };
}

interface SiteSettingsContextType {
  settings: SiteSettingsState;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  updateLiveSettings: (newSettings: Partial<SiteSettingsState>) => void;
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  settings: DEFAULT_SETTINGS,
  loading: false,
  refreshSettings: async () => {},
  updateLiveSettings: () => {},
});

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettingsState>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(mergeSettings(DEFAULT_SETTINGS, data.settings));
        }
      }
    } catch (error) {
      console.warn("Could not fetch site settings, using defaults.", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLiveSettings = useCallback((newSettings: Partial<SiteSettingsState>) => {
    setSettings((prev) => {
      const updated = mergeSettings(prev, newSettings);
      // Dispatch custom event for real-time syncing within the page
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("site-settings-updated", { detail: updated })
        );
        try {
          localStorage.setItem("carhat_site_settings", JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  }, []);

  useEffect(() => {
    // Check localStorage cache first for zero-flicker
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("carhat_site_settings");
        if (cached) {
          const parsed = JSON.parse(cached);
          setSettings(mergeSettings(DEFAULT_SETTINGS, parsed));
        }
      } catch {}
    }

    fetchSettings();

    // Listen for instant in-browser updates
    const handleSettingsUpdated = (event: any) => {
      if (event.detail) {
        setSettings((prev) => mergeSettings(prev, event.detail));
      }
    };

    // Listen for storage events across tabs
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "carhat_site_settings" && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          setSettings(mergeSettings(DEFAULT_SETTINGS, parsed));
        } catch {}
      }
    };

    window.addEventListener("site-settings-updated", handleSettingsUpdated);
    window.addEventListener("storage", handleStorage);

    // Re-sync when the visitor comes back to the tab, at most once a minute.
    // (Admin edits in another tab already arrive instantly through the storage event.)
    let lastSync = Date.now();
    const handleVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - lastSync > 60_000) {
        lastSync = Date.now();
        fetchSettings();
      }
    };
    document.addEventListener("visibilitychange", handleVisible);

    return () => {
      window.removeEventListener("site-settings-updated", handleSettingsUpdated);
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisible);
    };
  }, [fetchSettings]);

  return (
    <SiteSettingsContext.Provider
      value={{
        settings,
        loading,
        refreshSettings: fetchSettings,
        updateLiveSettings,
      }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
