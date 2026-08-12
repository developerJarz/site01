"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Save,
  Settings,
  Globe,
  Car,
  Search,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface SiteSettingsData {
  siteName: string;
  tagline: string;
  contactEmail: string;
  supportPhone: string;
  defaultListingStatus: "active" | "pending";
  autoApproveListings: boolean;
  maxImagesPerListing: number;
  metaTitleTemplate: string;
  metaDescription: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

const defaultSettings: SiteSettingsData = {
  siteName: "CarHat.bd",
  tagline: "The premier destination to buy, sell, and explore the best cars in Bangladesh.",
  contactEmail: "support@carhat.bd",
  supportPhone: "+880 1234-567890",
  defaultListingStatus: "pending",
  autoApproveListings: false,
  maxImagesPerListing: 10,
  metaTitleTemplate: "%s | CarHat.bd - Modern Car Marketplace",
  metaDescription: "Buy, sell, and explore the best cars in Bangladesh on CarHat.bd.",
  maintenanceMode: false,
  maintenanceMessage: "We're currently performing maintenance. Please check back soon!",
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettingsData>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          setSettings({ ...defaultSettings, ...data.settings });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  const ToggleSwitch = ({
    enabled,
    onChange,
  }: {
    enabled: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        enabled ? "bg-primary" : "bg-border"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
          enabled ? "translate-x-6" : ""
        }`}
      />
    </button>
  );

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure your marketplace platform
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : saved ? (
            <CheckCircle2 size={18} />
          ) : (
            <Save size={18} />
          )}
          {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
        </button>
      </div>

      {/* Site Settings */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 p-6 border-b border-border">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <Globe size={20} className="text-blue-500" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Site Settings</h2>
            <p className="text-xs text-muted-foreground">
              General website configuration
            </p>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-1">Site Name</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) =>
                  setSettings({ ...settings, siteName: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) =>
                  setSettings({ ...settings, contactEmail: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tagline</label>
            <input
              type="text"
              value={settings.tagline}
              onChange={(e) =>
                setSettings({ ...settings, tagline: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Support Phone
            </label>
            <input
              type="text"
              value={settings.supportPhone}
              onChange={(e) =>
                setSettings({ ...settings, supportPhone: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
        </div>
      </div>

      {/* Listing Settings */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 p-6 border-b border-border">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
            <Car size={20} className="text-emerald-500" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Listing Settings</h2>
            <p className="text-xs text-muted-foreground">
              Control how new listings are handled
            </p>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-1">
                Default Listing Status
              </label>
              <select
                value={settings.defaultListingStatus}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    defaultListingStatus: e.target.value as "active" | "pending",
                  })
                }
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="pending">Pending (Requires Approval)</option>
                <option value="active">Active (Auto-Published)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Max Images Per Listing
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={settings.maxImagesPerListing}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxImagesPerListing: Number(e.target.value),
                  })
                }
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
            <div>
              <p className="text-sm font-medium">Auto-Approve Listings</p>
              <p className="text-xs text-muted-foreground">
                Automatically approve new listings from verified sellers
              </p>
            </div>
            <ToggleSwitch
              enabled={settings.autoApproveListings}
              onChange={(v) =>
                setSettings({ ...settings, autoApproveListings: v })
              }
            />
          </div>
        </div>
      </div>

      {/* SEO Settings */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 p-6 border-b border-border">
          <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
            <Search size={20} className="text-purple-500" />
          </div>
          <div>
            <h2 className="font-bold text-lg">SEO Settings</h2>
            <p className="text-xs text-muted-foreground">
              Search engine optimization defaults
            </p>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">
              Meta Title Template
            </label>
            <input
              type="text"
              value={settings.metaTitleTemplate}
              onChange={(e) =>
                setSettings({ ...settings, metaTitleTemplate: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use <code className="bg-muted px-1 rounded">%s</code> as a placeholder for the page title
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Default Meta Description
            </label>
            <textarea
              rows={3}
              value={settings.metaDescription}
              onChange={(e) =>
                setSettings({ ...settings, metaDescription: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none"
            />
          </div>
        </div>
      </div>

      {/* Maintenance Mode */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 p-6 border-b border-border">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            settings.maintenanceMode ? "bg-red-500/10" : "bg-amber-500/10"
          }`}>
            <AlertTriangle size={20} className={
              settings.maintenanceMode ? "text-red-500" : "text-amber-500"
            } />
          </div>
          <div>
            <h2 className="font-bold text-lg">Maintenance Mode</h2>
            <p className="text-xs text-muted-foreground">
              Take the site offline temporarily
            </p>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
            <div>
              <p className="text-sm font-medium">Enable Maintenance Mode</p>
              <p className="text-xs text-muted-foreground">
                When enabled, visitors will see a maintenance page
              </p>
            </div>
            <ToggleSwitch
              enabled={settings.maintenanceMode}
              onChange={(v) =>
                setSettings({ ...settings, maintenanceMode: v })
              }
            />
          </div>
          {settings.maintenanceMode && (
            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-3">
                ⚠️ Maintenance mode is currently ACTIVE
              </p>
              <label className="block text-sm font-medium mb-1">
                Maintenance Message
              </label>
              <textarea
                rows={2}
                value={settings.maintenanceMessage}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maintenanceMessage: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
