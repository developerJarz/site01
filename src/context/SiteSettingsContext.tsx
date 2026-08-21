"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

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
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

export const DEFAULT_SETTINGS: SiteSettingsState = {
  siteName: "CarHat.bd",
  tagline: "The premier destination to buy, sell, and explore the best cars in Bangladesh.",
  contactEmail: "support@carhat.bd",
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
  metaTitleTemplate: "%s | CarHat.bd - Modern Car Marketplace",
  metaDescription:
    "Buy, sell, and explore the best cars in Bangladesh on CarHat.bd. Find your perfect car with verified dealers and private sellers.",
  maintenanceMode: false,
  maintenanceMessage: "We're currently performing maintenance. Please check back soon!",
};

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
      const res = await fetch("/api/settings", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings((prev) => ({
            ...DEFAULT_SETTINGS,
            ...data.settings,
            socialLinks: {
              ...DEFAULT_SETTINGS.socialLinks,
              ...(data.settings.socialLinks || {}),
            },
          }));
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
      const updated = {
        ...prev,
        ...newSettings,
        socialLinks: {
          ...prev.socialLinks,
          ...(newSettings.socialLinks || {}),
        },
      };
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
          setSettings((prev) => ({
            ...DEFAULT_SETTINGS,
            ...parsed,
            socialLinks: {
              ...DEFAULT_SETTINGS.socialLinks,
              ...(parsed.socialLinks || {}),
            },
          }));
        }
      } catch {}
    }

    fetchSettings();

    // Listen for instant in-browser updates
    const handleSettingsUpdated = (event: any) => {
      if (event.detail) {
        setSettings((prev) => ({
          ...prev,
          ...event.detail,
          socialLinks: {
            ...prev.socialLinks,
            ...(event.detail.socialLinks || {}),
          },
        }));
      }
    };

    // Listen for storage events across tabs
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "carhat_site_settings" && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          setSettings((prev) => ({
            ...DEFAULT_SETTINGS,
            ...parsed,
            socialLinks: {
              ...DEFAULT_SETTINGS.socialLinks,
              ...(parsed.socialLinks || {}),
            },
          }));
        } catch {}
      }
    };

    window.addEventListener("site-settings-updated", handleSettingsUpdated);
    window.addEventListener("storage", handleStorage);

    // Periodic background sync every 15 seconds
    const interval = setInterval(fetchSettings, 15000);

    return () => {
      window.removeEventListener("site-settings-updated", handleSettingsUpdated);
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
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
