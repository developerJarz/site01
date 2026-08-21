"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Loader2,
  Save,
  Globe,
  Car,
  Search,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Share2,
  Phone,
  Mail,
  Clock,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { useSiteSettings, DEFAULT_SETTINGS, SiteSettingsState } from "@/context/SiteSettingsContext";

export default function AdminSettingsPage() {
  const { settings: globalSettings, updateLiveSettings } = useSiteSettings();
  const [formData, setFormData] = useState<SiteSettingsState>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          const merged: SiteSettingsState = {
            ...DEFAULT_SETTINGS,
            ...data.settings,
            socialLinks: {
              ...DEFAULT_SETTINGS.socialLinks,
              ...(data.settings.socialLinks || {}),
            },
          };
          setFormData(merged);
        }
      })
      .catch((err) => {
        console.error("Failed to load settings:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setStatusMessage("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success && data.settings) {
        setSaved(true);
        setStatusMessage("Settings updated & synced across the entire site in real time!");
        // Update context & trigger real-time broadcast
        updateLiveSettings(data.settings);
        setTimeout(() => setSaved(false), 4000);
      } else {
        setStatusMessage("Failed to save: " + (data.error || "Unknown error"));
      }
    } catch (error: any) {
      console.error("Failed to save settings:", error);
      setStatusMessage("Network error while saving settings");
    } finally {
      setSaving(false);
    }
  };

  const updateSocial = (key: keyof SiteSettingsState["socialLinks"], val: string) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [key]: val,
      },
    }));
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
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        enabled ? "bg-primary" : "bg-muted-foreground/30"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          enabled ? "translate-x-6" : ""
        }`}
      />
    </button>
  );

  return (
    <div className="space-y-8 max-w-5xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-16 z-20 bg-background/90 backdrop-blur-md py-3 border-b border-border/50">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Marketplace Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure site branding, real-time address, social links, and listing policies
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 size={16} /> Real-time Synced!
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 disabled:opacity-50 active:scale-95"
          >
            {saving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : saved ? (
              <CheckCircle2 size={18} />
            ) : (
              <Save size={18} />
            )}
            {saving ? "Saving & Syncing..." : saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border flex items-center gap-2 ${
            saved
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              : "bg-destructive/10 text-destructive border-destructive/20"
          }`}
        >
          {saved ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          {statusMessage}
        </div>
      )}

      {/* ──── 1. Address & Contact Information (Real-time Synced) ──── */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 p-6 border-b border-border bg-muted/20">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <MapPin size={20} className="text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg">Address & Contact Information</h2>
              <span className="px-2 py-0.5 text-[10px] uppercase font-extrabold bg-primary/15 text-primary rounded-full">
                Real-Time Live Sync
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              These details update instantly in Header, Footer, and Contact page
            </p>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold mb-1.5 flex items-center gap-2">
                <MapPin size={15} className="text-primary" /> Physical Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g. Plot 12, Road 11, Block C, Gulshan-2, Dhaka"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 flex items-center gap-2">
                <Clock size={15} className="text-primary" /> Working Hours / Schedule
              </label>
              <input
                type="text"
                value={formData.workingHours}
                onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
                placeholder="e.g. Sat - Thu: 9:00 AM - 8:00 PM"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold mb-1.5 flex items-center gap-2">
                <Mail size={15} className="text-primary" /> Contact / Support Email
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="support@carhat.bd"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 flex items-center gap-2">
                <Phone size={15} className="text-primary" /> Support Hotline Number
              </label>
              <input
                type="text"
                value={formData.supportPhone}
                onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
                placeholder="+880 1700-000000"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5 flex items-center gap-2">
              <ExternalLink size={15} className="text-primary" /> Google Maps Link
            </label>
            <input
              type="url"
              value={formData.googleMapsUrl}
              onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })}
              placeholder="https://maps.google.com/?q=Gulshan-2,Dhaka"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* ──── 2. Social Media Links (Real-time Synced) ──── */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 p-6 border-b border-border bg-muted/20">
          <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
            <Share2 size={20} className="text-indigo-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg">Social Media Links</h2>
              <span className="px-2 py-0.5 text-[10px] uppercase font-extrabold bg-indigo-500/15 text-indigo-500 rounded-full">
                Real-Time Live Sync
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Direct links connected to the footer and social icons across the site
            </p>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">Facebook Page / Profile URL</label>
              <input
                type="url"
                value={formData.socialLinks?.facebook || ""}
                onChange={(e) => updateSocial("facebook", e.target.value)}
                placeholder="https://facebook.com/carhatbd"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Twitter / X URL</label>
              <input
                type="url"
                value={formData.socialLinks?.twitter || ""}
                onChange={(e) => updateSocial("twitter", e.target.value)}
                placeholder="https://twitter.com/carhatbd"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">Instagram URL</label>
              <input
                type="url"
                value={formData.socialLinks?.instagram || ""}
                onChange={(e) => updateSocial("instagram", e.target.value)}
                placeholder="https://instagram.com/carhatbd"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">YouTube Channel URL</label>
              <input
                type="url"
                value={formData.socialLinks?.youtube || ""}
                onChange={(e) => updateSocial("youtube", e.target.value)}
                placeholder="https://youtube.com/@carhatbd"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">LinkedIn Profile / Company URL</label>
              <input
                type="url"
                value={formData.socialLinks?.linkedin || ""}
                onChange={(e) => updateSocial("linkedin", e.target.value)}
                placeholder="https://linkedin.com/company/carhatbd"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">WhatsApp Direct Number (with Country Code)</label>
              <input
                type="text"
                value={formData.socialLinks?.whatsapp || ""}
                onChange={(e) => updateSocial("whatsapp", e.target.value)}
                placeholder="+8801700000000"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ──── 3. Branding & Identity ──── */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 p-6 border-b border-border bg-muted/20">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <Globe size={20} className="text-blue-500" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Branding & Identity</h2>
            <p className="text-xs text-muted-foreground">
              Site name, logo, slogan, and copyright notice
            </p>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">Site Name</label>
              <input
                type="text"
                value={formData.siteName}
                onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Logo Image Path / URL</label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  placeholder="/car-hat-bd.png"
                  className="flex-grow px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                />
                <div className="w-24 h-11 border border-border rounded-xl bg-muted/30 p-1 flex items-center justify-center flex-shrink-0">
                  <Image
                    src={formData.logoUrl || "/car-hat-bd.png"}
                    alt="Logo preview"
                    width={80}
                    height={28}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Tagline / Mission Statement</label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Copyright Text</label>
            <input
              type="text"
              value={formData.copyrightText}
              onChange={(e) => setFormData({ ...formData, copyrightText: e.target.value })}
              placeholder="CarHat.bd. All rights reserved."
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* ──── 4. Listing Moderation & Rules ──── */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 p-6 border-b border-border bg-muted/20">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
            <Car size={20} className="text-emerald-500" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Listing Policies & Limits</h2>
            <p className="text-xs text-muted-foreground">
              Control car listing approvals and photo allowances
            </p>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">Default New Listing Status</label>
              <select
                value={formData.defaultListingStatus}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    defaultListingStatus: e.target.value as "active" | "pending",
                  })
                }
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
              >
                <option value="pending">Pending (Requires Admin Review)</option>
                <option value="active">Active (Auto-Publish immediately)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Max Photos Allowed Per Listing</label>
              <input
                type="number"
                min={1}
                max={30}
                value={formData.maxImagesPerListing}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxImagesPerListing: Number(e.target.value),
                  })
                }
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
            <div>
              <p className="text-sm font-semibold">Auto-Approve Verified Sellers</p>
              <p className="text-xs text-muted-foreground">
                Automatically approve new ads submitted by verified dealers and identity-checked sellers
              </p>
            </div>
            <ToggleSwitch
              enabled={formData.autoApproveListings}
              onChange={(v) => setFormData({ ...formData, autoApproveListings: v })}
            />
          </div>
        </div>
      </div>

      {/* ──── 5. SEO Defaults ──── */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 p-6 border-b border-border bg-muted/20">
          <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
            <Search size={20} className="text-purple-500" />
          </div>
          <div>
            <h2 className="font-bold text-lg">SEO & Meta Configuration</h2>
            <p className="text-xs text-muted-foreground">
              Search engine optimization meta title templates and snippets
            </p>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">Meta Title Template</label>
            <input
              type="text"
              value={formData.metaTitleTemplate}
              onChange={(e) => setFormData({ ...formData, metaTitleTemplate: e.target.value })}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono">%s</code> as the page title placeholder
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Default Meta Description</label>
            <textarea
              rows={3}
              value={formData.metaDescription}
              onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none resize-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* ──── 6. Maintenance Mode ──── */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 p-6 border-b border-border bg-muted/20">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              formData.maintenanceMode ? "bg-red-500/10" : "bg-amber-500/10"
            }`}
          >
            <AlertTriangle
              size={20}
              className={formData.maintenanceMode ? "text-red-500" : "text-amber-500"}
            />
          </div>
          <div>
            <h2 className="font-bold text-lg">Maintenance Mode</h2>
            <p className="text-xs text-muted-foreground">
              Temporarily take the public marketplace offline
            </p>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
            <div>
              <p className="text-sm font-semibold">Enable Maintenance Mode</p>
              <p className="text-xs text-muted-foreground">
                When enabled, visitors will see a maintenance notice
              </p>
            </div>
            <ToggleSwitch
              enabled={formData.maintenanceMode}
              onChange={(v) => setFormData({ ...formData, maintenanceMode: v })}
            />
          </div>
          {formData.maintenanceMode && (
            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl space-y-3 animate-fadeIn">
              <p className="text-sm text-red-600 dark:text-red-400 font-bold flex items-center gap-1.5">
                <AlertTriangle size={16} /> Maintenance mode is currently ACTIVE
              </p>
              <div>
                <label className="block text-sm font-medium mb-1.5">Maintenance Notice Message</label>
                <textarea
                  rows={2}
                  value={formData.maintenanceMessage}
                  onChange={(e) => setFormData({ ...formData, maintenanceMessage: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none resize-none transition-all"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
