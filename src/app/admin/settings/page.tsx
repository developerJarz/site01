"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Car, Clock, ExternalLink, Mail, MapPin, Palette, Phone, Search, Share2, Wrench } from "lucide-react";
import { CountTabs, Field, PageHeader, Panel, SaveBar, SwitchRow, api, inputClass } from "@/components/admin/ui";
import { useToast } from "@/components/admin/Toast";
import { useAdmin } from "@/components/admin/AdminContext";
import { WatermarkEditor } from "@/components/admin/WatermarkEditor";
import { useSiteSettings, DEFAULT_SETTINGS, type SiteSettingsState } from "@/context/SiteSettingsContext";
import { DEFAULT_WATERMARK, type WatermarkSettings } from "@/lib/site-config";
import { cn } from "@/lib/utils";

type Form = Pick<SiteSettingsState,
  "contactEmail" | "supportPhone" | "address" | "workingHours" | "googleMapsUrl" | "socialLinks" |
  "defaultListingStatus" | "autoApproveListings" | "maxImagesPerListing" | "maintenanceMode" | "maintenanceMessage"
> & { watermark: WatermarkSettings; siteName: string };
type Tab = "contact" | "listings" | "watermark" | "maintenance";

const pickForm = (s: Partial<SiteSettingsState> & { watermark?: WatermarkSettings }): Form => ({
  siteName: s.siteName || DEFAULT_SETTINGS.siteName,
  contactEmail: s.contactEmail ?? "",
  supportPhone: s.supportPhone ?? "",
  address: s.address ?? "",
  workingHours: s.workingHours ?? "",
  googleMapsUrl: s.googleMapsUrl ?? "",
  socialLinks: { ...DEFAULT_SETTINGS.socialLinks, ...(s.socialLinks || {}) },
  defaultListingStatus: s.defaultListingStatus || "pending",
  autoApproveListings: !!s.autoApproveListings,
  maxImagesPerListing: s.maxImagesPerListing || 10,
  maintenanceMode: !!s.maintenanceMode,
  maintenanceMessage: s.maintenanceMessage ?? "",
  watermark: { ...DEFAULT_WATERMARK, ...(s.watermark || {}) },
});

const SOCIAL: { key: keyof SiteSettingsState["socialLinks"]; label: string; placeholder: string }[] = [
  { key: "facebook", label: "Facebook page", placeholder: "https://facebook.com/carhatbd" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/carhatbd" },
  { key: "youtube", label: "YouTube channel", placeholder: "https://youtube.com/@carhatbd" },
  { key: "twitter", label: "X (Twitter)", placeholder: "https://x.com/carhatbd" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/carhatbd" },
  { key: "whatsapp", label: "WhatsApp number (with country code)", placeholder: "+8801700000000" },
];

export default function AdminSettingsPage() {
  const toast = useToast();
  const { can } = useAdmin();
  const { updateLiveSettings } = useSiteSettings();
  const [tab, setTab] = useState<Tab>("contact");
  const [saved, setSaved] = useState<Form | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ settings: SiteSettingsState & { watermark: WatermarkSettings } }>("/api/admin/settings")
      .then(({ settings }) => { const f = pickForm(settings); setSaved(f); setForm(f); })
      .catch((e) => setError((e as Error).message));
  }, []);

  const dirty = useMemo(() => !!form && !!saved && JSON.stringify(form) !== JSON.stringify(saved), [form, saved]);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      // The site name is shown here for the watermark preview but edited in the website builder.
      const body: Partial<Form> = { ...form };
      delete body.siteName;
      const res = await api<{ settings: SiteSettingsState & { watermark: WatermarkSettings } }>("/api/admin/settings", { method: "PATCH", body: JSON.stringify(body) });
      const next = pickForm(res.settings);
      setSaved(next);
      setForm(next);
      updateLiveSettings(res.settings);
      toast.success(form.maintenanceMode && !saved?.maintenanceMode ? "Saved. Maintenance mode is on: visitors see the notice." : "Settings saved and live.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!can("settings.manage") && can("appearance.manage")) {
    return (
      <Panel title="Site settings" subtitle="Your role edits the website, not these settings">
        <Link href="/admin/appearance" className="inline-flex h-10 items-center gap-2 rounded-xl bg-electric px-4 text-sm font-semibold text-white shadow-glow"><Palette size={16} aria-hidden /> Open the website builder</Link>
      </Panel>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title="Site settings"
        description="Contact details, listing rules, photo protection and maintenance mode."
        actions={
          <Link href="/admin/appearance" className="inline-flex h-10 items-center gap-2 rounded-xl border border-hairline bg-white px-4 text-sm font-semibold shadow-soft hover:bg-mist">
            <Palette size={16} aria-hidden /> Logo, colours &amp; layout
          </Link>
        }
      />
      {form?.maintenanceMode && saved?.maintenanceMode && (
        <p role="status" className="flex items-center gap-2 rounded-2xl border border-destructive/20 bg-danger-soft px-4 py-3 text-sm font-semibold text-destructive">
          <AlertTriangle size={17} aria-hidden /> Maintenance mode is on. Visitors see a notice instead of the site; the team can still use everything.
        </p>
      )}
      <CountTabs<Tab> label="Settings sections" value={tab} onChange={setTab}
        tabs={[{ value: "contact", label: "Contact & social" }, { value: "listings", label: "Listing rules" }, { value: "watermark", label: "Photo watermark" }, { value: "maintenance", label: "Maintenance" }]} />
      {error && <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-destructive">{error}</p>}

      {!form ? (
        !error && <div className="skeleton h-96 rounded-3xl" />
      ) : tab === "contact" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Contact details" subtitle="Shown in the footer, the contact page and Google's business details">
            <div className="space-y-4">
              <Field label="Support email" htmlFor="s-email"><IconInput icon={Mail}><input id="s-email" type="email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} placeholder="carhatbd@gmail.com" className={cn(inputClass, "pl-10")} /></IconInput></Field>
              <Field label="Support phone" htmlFor="s-phone"><IconInput icon={Phone}><input id="s-phone" value={form.supportPhone} onChange={(e) => set("supportPhone", e.target.value)} placeholder="+880 1700-000000" className={cn(inputClass, "pl-10")} /></IconInput></Field>
              <Field label="Working hours" htmlFor="s-hours"><IconInput icon={Clock}><input id="s-hours" value={form.workingHours} onChange={(e) => set("workingHours", e.target.value)} placeholder="Sat – Thu: 9 AM – 8 PM" className={cn(inputClass, "pl-10")} /></IconInput></Field>
              <Field label="Office address" htmlFor="s-address"><IconInput icon={MapPin}><input id="s-address" value={form.address} onChange={(e) => set("address", e.target.value)} className={cn(inputClass, "pl-10")} /></IconInput></Field>
              <Field label="Google Maps link" htmlFor="s-map"><IconInput icon={ExternalLink}><input id="s-map" type="url" value={form.googleMapsUrl} onChange={(e) => set("googleMapsUrl", e.target.value)} placeholder="https://maps.google.com/?q=…" className={cn(inputClass, "pl-10")} /></IconInput></Field>
            </div>
          </Panel>
          <Panel title="Social media" subtitle="Icons in the footer; links also tell Google which profiles are yours" action={<Share2 size={18} className="text-slate-text" aria-hidden />}>
            <div className="grid gap-4 sm:grid-cols-2">
              {SOCIAL.map((s) => (
                <Field key={s.key} label={s.label} htmlFor={`social-${s.key}`}>
                  <input id={`social-${s.key}`} value={form.socialLinks[s.key] || ""} placeholder={s.placeholder}
                    onChange={(e) => set("socialLinks", { ...form.socialLinks, [s.key]: e.target.value })} className={inputClass} />
                </Field>
              ))}
            </div>
            <p className="mt-4 text-[13px] text-slate-text">Leave a field empty to hide that icon. Links must start with https://.</p>
          </Panel>
        </div>
      ) : tab === "listings" ? (
        <div className="space-y-6">
          <Panel title="New listings" subtitle="What happens when someone posts a car" action={<Car size={18} className="text-slate-text" aria-hidden />}>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="New listings go" htmlFor="s-status">
                  <select id="s-status" value={form.defaultListingStatus} onChange={(e) => set("defaultListingStatus", e.target.value as Form["defaultListingStatus"])} className={inputClass}>
                    <option value="pending">To the review queue first</option>
                    <option value="active">Live straight away</option>
                  </select>
                </Field>
                <Field label="Photos allowed per listing" htmlFor="s-max" hint="Between 1 and 30.">
                  <input id="s-max" type="number" min={1} max={30} value={form.maxImagesPerListing} onChange={(e) => set("maxImagesPerListing", Number(e.target.value))} className={inputClass} />
                </Field>
              </div>
              <SwitchRow title="Verified sellers skip the queue" description="When new listings wait for review, cars from verified accounts still go live straight away."
                checked={form.autoApproveListings} onChange={(v) => set("autoApproveListings", v)} />
            </div>
          </Panel>
          <Panel title="SEO" subtitle="Titles, descriptions, keywords and the SEO score live on their own page">
            <Link href="/admin/seo" className="inline-flex h-10 items-center gap-2 rounded-xl bg-electric px-4 text-sm font-semibold text-white shadow-glow hover:bg-electric-deep"><Search size={16} aria-hidden /> Open SEO &amp; content</Link>
          </Panel>
        </div>
      ) : tab === "watermark" ? (
        <WatermarkEditor value={form.watermark} siteName={form.siteName} onChange={(v) => set("watermark", v)} />
      ) : (
        <Panel title="Maintenance mode" subtitle="Take the public site offline while you make changes" action={<Wrench size={18} className="text-slate-text" aria-hidden />}>
          <div className="space-y-4">
            <SwitchRow title="Show the maintenance notice to visitors" description="Signed-in team members still see the full site, and the sign-in page stays open."
              checked={form.maintenanceMode} onChange={(v) => set("maintenanceMode", v)} />
            <Field label="Message visitors see" htmlFor="s-maint"><textarea id="s-maint" rows={3} value={form.maintenanceMessage} maxLength={300} onChange={(e) => set("maintenanceMessage", e.target.value)} className={cn(inputClass, "h-auto py-2")} /></Field>
          </div>
        </Panel>
      )}
      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={() => setForm(saved)} />
    </div>
  );
}

function IconInput({ icon: Icon, children }: { icon: typeof Mail; children: React.ReactNode }) {
  return (
    <div className="relative">
      <Icon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-text" aria-hidden />
      {children}
    </div>
  );
}
