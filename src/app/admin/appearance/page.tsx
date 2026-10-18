"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown, ArrowUp, Eye, EyeOff, ExternalLink, GripVertical, Home, LayoutTemplate,
  Megaphone, PanelBottom, Plus, RotateCcw, Trash2, ChevronDown, ChevronUp,
  SlidersHorizontal, Search, X, Car, Image as ImageIcon, Sparkles, Check, CheckCircle2, Layers
} from "lucide-react";
import { Button, CountTabs, Field, PageHeader, Panel, SaveBar, Switch, SwitchRow, api, inputClass } from "@/components/admin/ui";
import { ImageField } from "@/components/admin/ImageField";
import { useToast } from "@/components/admin/Toast";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import {
  DEFAULT_APPEARANCE, HEX_COLOR, HOME_SECTIONS, brandPalette, contrastOnWhite,
  type AppearanceSettings, type FaqItem, type FooterColumn, type LinkItem,
  type HomeSectionConfig, type TrustStatItem, type WhyChooseFeature, type HowItWorksStep, type AppPromoConfig
} from "@/lib/site-config";
import { cn } from "@/lib/utils";

type Brand = { siteName: string; tagline: string; logoUrl: string; copyrightText: string };
type Form = { brand: Brand; appearance: AppearanceSettings };
type Tab = "brand" | "header" | "homepage" | "footer";

const BRAND_COLORS = ["#0e6aa8", "#0a4898", "#0f766e", "#15803d", "#b91c1c", "#c2410c", "#7c3aed", "#be185d", "#0b1d36"];

/** Pages people usually link to, offered as suggestions in every link field. */
const LINK_SUGGESTIONS = [
  "/cars", "/sell", "/dealers", "/brands", "/reviews", "/blog", "/about", "/contact", "/faq", "/privacy", "/terms",
  "/cars?verified=1", "/cars?condition=reconditioned", "/cars?category=suv", "/cars?category=hybrid", "/cars?maxPrice=1000000",
  "#compare", "#saved",
];

const move = <T,>(list: T[], i: number, by: number) => {
  const next = [...list];
  const [item] = next.splice(i, 1);
  next.splice(Math.max(0, Math.min(next.length, i + by)), 0, item);
  return next;
};

export default function AppearancePage() {
  const toast = useToast();
  const { updateLiveSettings } = useSiteSettings();
  const [tab, setTab] = useState<Tab>("brand");
  const [saved, setSaved] = useState<Form | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ settings: Brand & { appearance: AppearanceSettings } }>("/api/admin/settings")
      .then(({ settings }) => {
        const loaded: Form = {
          brand: { siteName: settings.siteName || "", tagline: settings.tagline || "", logoUrl: settings.logoUrl || "", copyrightText: settings.copyrightText || "" },
          appearance: settings.appearance || DEFAULT_APPEARANCE,
        };
        setSaved(loaded);
        setForm(loaded);
      })
      .catch((e) => setError((e as Error).message));
  }, []);

  const dirty = useMemo(() => !!form && !!saved && JSON.stringify(form) !== JSON.stringify(saved), [form, saved]);

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const onLeave = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const res = await api<{ settings: Record<string, unknown> & { appearance: AppearanceSettings } }>("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({ ...form.brand, appearance: form.appearance }),
      });
      const next: Form = {
        brand: { siteName: String(res.settings.siteName || ""), tagline: String(res.settings.tagline || ""), logoUrl: String(res.settings.logoUrl || ""), copyrightText: String(res.settings.copyrightText || "") },
        appearance: res.settings.appearance,
      };
      setSaved(next);
      setForm(next);
      // Header and footer in other open tabs update straight away; pages refresh within a minute.
      updateLiveSettings({ ...next.brand, appearance: next.appearance });
      toast.success("Website updated. Open the site to see your changes.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const setA = <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) =>
    setForm((f) => (f ? { ...f, appearance: { ...f.appearance, [key]: value } } : f));
  const setBrand = <K extends keyof Brand>(key: K, value: string) => setForm((f) => (f ? { ...f, brand: { ...f.brand, [key]: value } } : f));

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title="Website builder"
        description="Change your brand, header, homepage and footer without touching code. Changes go live when you save."
        actions={
          <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-xl border border-hairline bg-white px-4 text-sm font-semibold shadow-soft hover:bg-mist">
            <ExternalLink size={16} aria-hidden /> View site
          </a>
        }
      />
      <CountTabs<Tab>
        label="Website sections"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "brand", label: "Brand & colours" },
          { value: "header", label: "Header & announcement" },
          { value: "homepage", label: "Homepage" },
          { value: "footer", label: "Footer" },
        ]}
      />
      {error && <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-destructive">{error}</p>}
      {!form ? (
        !error && <div className="skeleton h-96 rounded-3xl" />
      ) : tab === "brand" ? (
        <BrandTab form={form} setBrand={setBrand} setA={setA} />
      ) : tab === "header" ? (
        <HeaderTab a={form.appearance} setA={setA} />
      ) : tab === "homepage" ? (
        <HomepageTab a={form.appearance} setA={setA} />
      ) : (
        <FooterTab a={form.appearance} brand={form.brand} setA={setA} setBrand={setBrand} />
      )}
      <datalist id="site-links">{LINK_SUGGESTIONS.map((l) => <option key={l} value={l} />)}</datalist>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={() => setForm(saved)} />
    </div>
  );
}

type SetA = <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) => void;

/* ─── Brand ─────────────────────────────────────── */
function BrandTab({ form, setBrand, setA }: { form: Form; setBrand: (k: keyof Brand, v: string) => void; setA: SetA }) {
  const color = form.appearance.brandColor;
  const valid = HEX_COLOR.test(color);
  const palette = valid ? brandPalette(color) : null;
  const ratio = valid ? contrastOnWhite(color) : 0;
  const shown = palette?.["--color-electric"] || "#0e6aa8";

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-6">
        <Panel title="Identity" subtitle="Your name, slogan and logo across the site, emails and search results">
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Site name" htmlFor="b-name"><input id="b-name" value={form.brand.siteName} onChange={(e) => setBrand("siteName", e.target.value)} maxLength={60} className={inputClass} /></Field>
              <Field label="Tagline" htmlFor="b-tagline" hint="Shown in the footer under your logo.">
                <input id="b-tagline" value={form.brand.tagline} onChange={(e) => setBrand("tagline", e.target.value)} maxLength={240} className={inputClass} />
              </Field>
            </div>
            <ImageField id="b-logo" label="Logo" value={form.brand.logoUrl} onChange={(v) => setBrand("logoUrl", v)} preview="logo"
              placeholder="/car-hat-bd.png" hint="A wide PNG with a transparent background, at least 320 px across. Used in the header, footer and admin." />
            <ImageField id="b-favicon" label="Favicon (browser tab icon)" value={form.appearance.faviconUrl} onChange={(v) => setA("faviconUrl", v)} preview="square" png
              placeholder="Empty uses the built-in CarHat icon" hint="Leave empty to use the built-in icon made from your logo. A custom one should be a square PNG, 512 × 512." />
            <FaviconCheck url={form.appearance.faviconUrl} onReset={() => setA("faviconUrl", "")} />
          </div>
        </Panel>

        <Panel title="Brand colour" subtitle="Buttons, links, highlights and badges use this colour" action={color && <Button size="sm" variant="ghost" onClick={() => setA("brandColor", "")}><RotateCcw size={14} aria-hidden /> Default blue</Button>}>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Suggested colours">
              {BRAND_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setA("brandColor", c === "#0e6aa8" ? "" : c)} aria-label={`Use ${c}`} aria-pressed={(color || "#0e6aa8") === c}
                  className={cn("size-9 rounded-full ring-offset-2 transition-transform hover:scale-110", (color || "#0e6aa8") === c && "ring-2 ring-night")} style={{ background: c }} />
              ))}
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <Field label="Custom colour" htmlFor="b-color">
                <div className="flex items-center gap-2">
                  <input type="color" aria-label="Pick a colour" value={valid ? color : "#0e6aa8"} onChange={(e) => setA("brandColor", e.target.value)} className="h-11 w-14 cursor-pointer rounded-xl border border-hairline bg-white p-1" />
                  <input id="b-color" value={color} onChange={(e) => setA("brandColor", e.target.value.trim())} placeholder="#0e6aa8" maxLength={7} className={cn(inputClass, "w-32 font-mono")} />
                </div>
              </Field>
            </div>
            {color && !valid && <p className="text-sm font-semibold text-destructive">Enter a colour like #0e6aa8.</p>}
            {valid && ratio < 4.5 && (
              <p className="rounded-xl bg-warning-soft px-3 py-2 text-sm text-[#7c2d12]">
                This colour is light for text on white (contrast {ratio.toFixed(1)}:1). We&apos;ll use a slightly darker shade, shown in the preview, so links and buttons stay readable.
              </p>
            )}
          </div>
        </Panel>
      </div>

      <Panel title="Preview" subtitle="How your colours look">
        <div className="space-y-4 rounded-2xl border border-hairline p-4" style={palette ? (palette as React.CSSProperties) : undefined}>
          <div className="flex items-center justify-between gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of any uploaded URL */}
            <img src={form.brand.logoUrl || "/car-hat-bd.png"} alt="" className="h-7 w-auto max-w-[9rem] object-contain" />
            <span className="rounded-xl px-3 py-2 text-xs font-semibold text-white" style={{ background: shown }}>Post Listing</span>
          </div>
          <div className="rounded-xl p-4" style={{ background: palette?.["--color-haze"] || "#e3f2f8" }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: shown }}>Featured cars</p>
            <p className="mt-1 text-lg font-extrabold text-night">Find your next car</p>
            <p className="mt-1 text-sm text-slate-text">Links look <span className="font-semibold underline" style={{ color: shown }}>like this</span>.</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
            <img src={form.appearance.faviconUrl || "/favicon.ico"} alt="" className="size-5 rounded" />
            <span className="truncate font-semibold text-night">{form.brand.siteName || "Site name"}</span>
          </div>
        </div>
      </Panel>
    </div>
  );
}

/** A wide image (like the full logo) turns into an unreadable smudge in a browser tab, so say so. */
function FaviconCheck({ url, onReset }: { url: string; onReset: () => void }) {
  const [ratio, setRatio] = useState<number | null>(null);
  useEffect(() => {
    setRatio(null);
    if (!url) return;
    const img = new Image();
    img.onload = () => setRatio(img.naturalWidth / Math.max(1, img.naturalHeight));
    img.src = url;
  }, [url]);
  if (!url) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-mist/70 px-4 py-3 text-sm text-slate-text">
        {/* eslint-disable-next-line @next/next/no-img-element -- static site icon */}
        <img src="/icon.png" alt="" className="size-8 rounded-lg" />
        Using the built-in icon: the top-down car from your logo on its blue gradient.
      </div>
    );
  }
  if (ratio === null || (ratio > 0.8 && ratio < 1.25)) return null;
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl bg-warning-soft px-4 py-3 text-sm text-[#7c2d12]">
      <span className="min-w-0 grow">This image isn&apos;t square ({ratio.toFixed(1)} : 1), so browsers squash it into an unreadable icon. Use a square image, or the built-in icon made from your logo.</span>
      <Button size="sm" onClick={onReset}>Use built-in icon</Button>
    </div>
  );
}

/* ─── Header ────────────────────────────────────── */
const TONE_PREVIEW = { brand: "bg-electric text-white", dark: "bg-night text-white", warning: "bg-warning-soft text-[#7c2d12]", success: "bg-verified text-white" } as const;

function HeaderTab({ a, setA }: { a: AppearanceSettings; setA: SetA }) {
  const ann = a.announcement;
  const setAnn = (patch: Partial<AppearanceSettings["announcement"]>) => setA("announcement", { ...ann, ...patch });
  const setHeader = (patch: Partial<AppearanceSettings["header"]>) => setA("header", { ...a.header, ...patch });
  return (
    <div className="space-y-6">
      <Panel title="Announcement bar" subtitle="A short notice at the top of every page: offers, holidays, new features" action={<Megaphone size={18} className="text-slate-text" aria-hidden />}>
        <div className="space-y-4">
          <SwitchRow title="Show the announcement" description="Visitors can close it; a new message shows again." checked={ann.enabled} onChange={(v) => setAnn({ enabled: v })} />
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem]">
            <Field label="Message" htmlFor="ann-text"><input id="ann-text" value={ann.text} maxLength={160} onChange={(e) => setAnn({ text: e.target.value })} placeholder="Eid holiday: our team replies from Sunday." className={inputClass} /></Field>
            <Field label="Style" htmlFor="ann-tone">
              <select id="ann-tone" value={ann.tone} onChange={(e) => setAnn({ tone: e.target.value as typeof ann.tone })} className={inputClass}>
                <option value="brand">Brand colour</option><option value="dark">Dark</option><option value="warning">Notice (amber)</option><option value="success">Good news (green)</option>
              </select>
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Link text (optional)" htmlFor="ann-label"><input id="ann-label" value={ann.linkLabel} maxLength={30} onChange={(e) => setAnn({ linkLabel: e.target.value })} placeholder="See offers" className={inputClass} /></Field>
            <Field label="Link goes to" htmlFor="ann-url"><input id="ann-url" list="site-links" value={ann.linkUrl} onChange={(e) => setAnn({ linkUrl: e.target.value })} placeholder="/cars?verified=1" className={inputClass} /></Field>
          </div>
          {ann.text && (
            <div className={cn("flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold", TONE_PREVIEW[ann.tone], !ann.enabled && "opacity-50")}>
              <Megaphone size={15} aria-hidden /> <span className="grow">{ann.text} {ann.linkLabel && <u>{ann.linkLabel} →</u>}</span>
              {!ann.enabled && <span className="text-xs">(hidden)</span>}
            </div>
          )}
        </div>
      </Panel>

      <Panel title="Menu links" subtitle="The main links in the header and the phone menu, in this order (up to 8)">
        <LinkListEditor links={a.header.navLinks} onChange={(navLinks) => setHeader({ navLinks })} max={8} idPrefix="nav"
          hint="Use #compare to open the compare panel or #saved for saved cars." />
      </Panel>

      <Panel title="Header button and search">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Button text" htmlFor="h-cta" hint="Leave empty to hide the button."><input id="h-cta" value={a.header.ctaLabel} maxLength={24} onChange={(e) => setHeader({ ctaLabel: e.target.value })} className={inputClass} /></Field>
            <Field label="Button goes to" htmlFor="h-cta-href"><input id="h-cta-href" list="site-links" value={a.header.ctaHref} onChange={(e) => setHeader({ ctaHref: e.target.value })} className={inputClass} /></Field>
          </div>
          <SwitchRow title="Search box in the header" description="Lets visitors search cars, brands and cities from any page." checked={a.header.showSearch} onChange={(v) => setHeader({ showSearch: v })} />
        </div>
      </Panel>
    </div>
  );
}

/* ─── Homepage ──────────────────────────────────── */
/* ─── Advanced Section Builder Constants & Types ─── */
const CAR_SECTIONS = ["featured", "recent", "hotDeals", "luxury", "budget", "bodyTypes"];
const isCarSection = (key: string) => CAR_SECTIONS.includes(key);

const CATEGORIES = [
  { key: "suv", label: "SUV", defaultImg: "/images/categories/suv.jpg" },
  { key: "sedan", label: "Sedan", defaultImg: "/images/categories/sedan.jpg" },
  { key: "hatchback", label: "Hatchback", defaultImg: "/images/categories/hatchback.jpg" },
  { key: "hybrid", label: "Hybrid / EV", defaultImg: "/images/categories/hybrid.jpg" },
  { key: "luxury", label: "Luxury", defaultImg: "/images/categories/luxury.jpg" },
  { key: "mpv", label: "MPV / Microbus", defaultImg: "/images/categories/mpv.jpg" },
  { key: "pickup", label: "Pickup", defaultImg: "/images/categories/pickup.jpg" },
  { key: "electric", label: "Electric", defaultImg: "/images/categories/electric.jpg" },
];

const SECTION_DEFAULTS: Record<string, { eyebrow: string; title: string; subtitle: string; actionLabel?: string; actionHref?: string }> = {
  bodyTypes: {
    eyebrow: "BROWSE CATEGORIES",
    title: "Explore By Body Type",
    subtitle: "Find the vehicle that matches your lifestyle",
    actionLabel: "View all categories",
    actionHref: "/cars",
  },
  featured: {
    eyebrow: "FEATURED SELECTION",
    title: "Spotlight Listings",
    subtitle: "Handpicked, verified cars ready for delivery across Bangladesh",
    actionLabel: "Explore all featured",
    actionHref: "/cars?verified=1",
  },
  smartSearch: {
    eyebrow: "DISCOVERY ENGINE",
    title: "Find Cars Your Way",
    subtitle: "Filter by budget, fuel type, transmission, or city in one click",
    actionLabel: "Open advanced filters",
    actionHref: "/cars",
  },
  hotDeals: {
    eyebrow: "PRICE DROPS",
    title: "Hot Deals & Bargains",
    subtitle: "Urgent sales and below-market price drops verified this week",
    actionLabel: "See all deals",
    actionHref: "/cars?sort=price-low",
  },
  luxury: {
    eyebrow: "PREMIUM SELECTION",
    title: "Luxury & Executive Fleet",
    subtitle: "Top-tier sedans, flagship SUVs, and executive cars with verified heritage",
    actionLabel: "View luxury gallery",
    actionHref: "/cars?category=luxury",
  },
  trustStats: {
    eyebrow: "BANGLADESH'S #1 MARKETPLACE",
    title: "Trusted by Car Enthusiasts & Dealers",
    subtitle: "Real numbers, verified inspections, and transparent car buying",
  },
  recent: {
    eyebrow: "FRESH ARRIVALS",
    title: "Recently Listed Cars",
    subtitle: "Discover the latest cars posted by verified sellers across Bangladesh",
    actionLabel: "View all cars",
    actionHref: "/cars",
  },
  budget: {
    eyebrow: "VALUE FINDS",
    title: "Smart Budget Picks",
    subtitle: "Reliable, high-value cars for first-time buyers and families",
    actionLabel: "See all budget cars",
    actionHref: "/cars?maxPrice=2000000",
  },
  brands: {
    eyebrow: "TOP AUTOMAKERS",
    title: "Browse by Popular Brands",
    subtitle: "Explore inventory from Bangladesh's most reliable car manufacturers",
    actionLabel: "View all brands",
    actionHref: "/brands",
  },
  sellBanner: {
    eyebrow: "SELL YOUR CAR",
    title: "Sell Your Car at the Best Market Price",
    subtitle: "Reach 50,000+ active buyers across Bangladesh with zero hassle",
    actionLabel: "List your car free",
    actionHref: "/sell",
  },
  whyChoose: {
    eyebrow: "THE CARHAT ADVANTAGE",
    title: "Why CarHat Is Different",
    subtitle: "Built specifically for Bangladesh car buyers with trust and transparency at core",
  },
  howItWorks: {
    eyebrow: "STEP BY STEP",
    title: "How Buying on CarHat Works",
    subtitle: "From search to handover in 4 simple and secure steps",
  },
  appPromo: {
    eyebrow: "CARHAT ON MOBILE",
    title: "Take Bangladesh's Best Car Market in Your Pocket",
    subtitle: "Instant price alerts, direct dealer chat, and one-tap saved searches on Android & iOS",
  },
  reviews: {
    eyebrow: "VERIFIED TESTIMONIALS",
    title: "What Buyers & Sellers Say",
    subtitle: "Genuine experiences from our community across Dhaka, Chittagong, and Sylhet",
  },
  aiAssistant: {
    eyebrow: "AI CAR ADVISOR",
    title: "Not Sure Which Car Fits You?",
    subtitle: "Tell our AI Matchmaker your budget, family size, and usage for instant picks",
    actionLabel: "Try AI Matchmaker",
    actionHref: "/cars",
  },
  faq: {
    eyebrow: "HAVE QUESTIONS?",
    title: "Frequently Asked Questions",
    subtitle: "Everything you need to know about buying, selling, and verifying cars",
  },
  seoContent: {
    eyebrow: "MARKET OVERVIEW",
    title: "CarHat — The Modern Way to Buy & Sell Cars in Bangladesh",
    subtitle: "Complete marketplace for reconditioned, new, and used vehicles",
  },
};

/* ─── Handpicked Car Live Picker ────────────────── */
function HandpickedCarPicker({
  selectedIds,
  onChange,
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [detailsMap, setDetailsMap] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      setSearching(true);
      fetch(`/api/listings/search?q=${encodeURIComponent(query.trim())}&limit=6`)
        .then((res) => res.json())
        .then((data) => {
          const list = data.listings || [];
          setResults(list);
          setDetailsMap((prev) => {
            const next = { ...prev };
            list.forEach((car: any) => {
              next[car._id] = car;
              if (car.slug) next[car.slug] = car;
            });
            return next;
          });
        })
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const addId = (id: string) => {
    const clean = id.trim();
    if (!clean) return;
    if (!selectedIds.includes(clean)) {
      onChange([...selectedIds, clean]);
    }
  };

  const removeId = (id: string) => {
    onChange(selectedIds.filter((x) => x !== id));
  };

  return (
    <div className="space-y-3 rounded-2xl border border-hairline bg-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-night">Handpicked Listings</p>
          <p className="text-xs text-slate-text">Search and handpick the exact cars to spotlight in this section ({selectedIds.length} selected)</p>
        </div>
      </div>

      {selectedIds.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedIds.map((id) => {
            const car = detailsMap[id];
            return (
              <div key={id} className="flex items-center gap-2 rounded-xl border border-hairline bg-white py-1.5 pl-2.5 pr-2 shadow-soft">
                {car?.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={car.images[0]} alt="" className="size-6 rounded-lg object-cover" />
                ) : (
                  <Car size={16} className="text-electric" />
                )}
                <span className="max-w-[180px] truncate text-xs font-semibold text-night">
                  {car ? `${car.year ? `${car.year} ` : ""}${car.title}` : id}
                </span>
                {car?.price && (
                  <span className="text-[11px] font-bold text-electric">৳ {Math.round(car.price / 100000)}L</span>
                )}
                <button
                  type="button"
                  onClick={() => removeId(id)}
                  aria-label={`Remove ${id}`}
                  className="rounded-lg p-1 text-slate-text hover:bg-mist hover:text-destructive"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-hairline p-3 text-center text-xs text-slate-text">
          No cars picked yet. Search below or paste listing IDs to display specific cars.
        </p>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-text" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by make, model, or keyword (e.g. Premio, Axio, Prado)..."
          className={cn(inputClass, "pl-9 text-xs")}
        />
        {searching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-text animate-pulse">Searching...</span>
        )}
      </div>

      {results.length > 0 && (
        <div className="max-h-56 overflow-y-auto rounded-xl border border-hairline bg-white p-2 divide-y divide-hairline">
          {results.map((car) => {
            const isAdded = selectedIds.includes(car._id) || (car.slug && selectedIds.includes(car.slug));
            return (
              <div key={car._id} className="flex items-center justify-between gap-3 py-2 px-1">
                <div className="flex items-center gap-2.5 min-w-0">
                  {car.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={car.images[0]} alt="" className="size-9 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="size-9 rounded-lg bg-mist flex items-center justify-center shrink-0">
                      <Car size={18} className="text-slate-text" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-night">{car.year ? `${car.year} ` : ""}{car.title}</p>
                    <p className="text-[11px] text-slate-text">
                      ৳ {(car.price / 100000).toFixed(2)} Lakh · {car.condition || "Used"} · {car.make}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={isAdded ? "secondary" : "primary"}
                  disabled={isAdded}
                  onClick={() => addId(car._id)}
                  className="shrink-0 text-xs h-8"
                >
                  {isAdded ? "Added" : "+ Add"}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <input
          type="text"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          placeholder="Or paste Listing ID or slug"
          className={cn(inputClass, "h-9 text-xs font-mono grow")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addId(manualInput);
              setManualInput("");
            }
          }}
        />
        <Button
          size="sm"
          variant="secondary"
          className="h-9 shrink-0 text-xs font-semibold"
          onClick={() => {
            addId(manualInput);
            setManualInput("");
          }}
          disabled={!manualInput.trim()}
        >
          Add ID
        </Button>
      </div>
    </div>
  );
}

/* ─── Individual Section Studio Customizer ───────── */
function SectionCustomizer({
  sectionKey,
  sectionLabel,
  a,
  setA,
  onClose,
}: {
  sectionKey: string;
  sectionLabel: string;
  a: AppearanceSettings;
  setA: SetA;
  onClose: () => void;
}) {
  const isCar = isCarSection(sectionKey);
  const hasImages = sectionKey === "bodyTypes" || ["sellBanner", "appPromo", "whyChoose", "aiAssistant"].includes(sectionKey);
  const hasCustom = ["trustStats", "whyChoose", "howItWorks", "appPromo"].includes(sectionKey);

  const [subTab, setSubTab] = useState<"text" | "cars" | "images" | "custom">("text");

  const cfg: HomeSectionConfig = a.sectionConfigs?.[sectionKey] || {};
  const defaults = SECTION_DEFAULTS[sectionKey] || { eyebrow: "", title: sectionLabel, subtitle: "" };

  const updateCfg = (patch: Partial<HomeSectionConfig>) => {
    const nextConfigs = { ...(a.sectionConfigs || {}) };
    nextConfigs[sectionKey] = { ...cfg, ...patch };
    setA("sectionConfigs", nextConfigs);
  };

  const handleReset = () => {
    const nextConfigs = { ...(a.sectionConfigs || {}) };
    delete nextConfigs[sectionKey];
    setA("sectionConfigs", nextConfigs);
    if (sectionKey === "trustStats") setA("trustStats", DEFAULT_APPEARANCE.trustStats);
    if (sectionKey === "whyChoose") setA("whyChooseFeatures", DEFAULT_APPEARANCE.whyChooseFeatures);
    if (sectionKey === "howItWorks") setA("howItWorksSteps", DEFAULT_APPEARANCE.howItWorksSteps);
    if (sectionKey === "appPromo") setA("appPromo", DEFAULT_APPEARANCE.appPromo);
  };

  return (
    <div className="space-y-4">
      {/* Sub Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-hairline pb-3">
        <button
          type="button"
          onClick={() => setSubTab("text")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
            subTab === "text" ? "bg-electric text-white shadow-soft" : "bg-white text-slate-text hover:bg-mist hover:text-night"
          )}
        >
          <LayoutTemplate size={13} /> Texts & Headings
        </button>

        {isCar && (
          <button
            type="button"
            onClick={() => setSubTab("cars")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
              subTab === "cars" ? "bg-electric text-white shadow-soft" : "bg-white text-slate-text hover:bg-mist hover:text-night"
            )}
          >
            <Car size={13} /> Car Setup & Filters
          </button>
        )}

        {hasImages && (
          <button
            type="button"
            onClick={() => setSubTab("images")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
              subTab === "images" ? "bg-electric text-white shadow-soft" : "bg-white text-slate-text hover:bg-mist hover:text-night"
            )}
          >
            <ImageIcon size={13} /> {sectionKey === "bodyTypes" ? "Category Images" : "Banner & Visuals"}
          </button>
        )}

        {hasCustom && (
          <button
            type="button"
            onClick={() => setSubTab("custom")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
              subTab === "custom" ? "bg-electric text-white shadow-soft" : "bg-white text-slate-text hover:bg-mist hover:text-night"
            )}
          >
            <Sparkles size={13} /> Custom Content
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReset}
            className="h-8 gap-1 text-xs text-slate-text hover:text-destructive"
            title="Reset this section to default configuration"
          >
            <RotateCcw size={12} /> Reset Section
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="h-8 gap-1 text-xs text-slate-text"
          >
            <ChevronUp size={14} /> Collapse
          </Button>
        </div>
      </div>

      {/* Tab: Texts & Headings */}
      {subTab === "text" && (
        <div className="space-y-4 pt-1">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Eyebrow / Small Badge" htmlFor={`sec-${sectionKey}-eyebrow`} hint="Appears in uppercase above the title">
              <input
                id={`sec-${sectionKey}-eyebrow`}
                value={cfg.eyebrow || ""}
                onChange={(e) => updateCfg({ eyebrow: e.target.value })}
                placeholder={defaults.eyebrow}
                maxLength={80}
                className={inputClass}
              />
            </Field>
            <Field label="Section Title / Headline" htmlFor={`sec-${sectionKey}-title`}>
              <input
                id={`sec-${sectionKey}-title`}
                value={cfg.title || ""}
                onChange={(e) => updateCfg({ title: e.target.value })}
                placeholder={defaults.title}
                maxLength={120}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Subtitle / Description" htmlFor={`sec-${sectionKey}-subtitle`}>
            <textarea
              id={`sec-${sectionKey}-subtitle`}
              rows={2}
              value={cfg.subtitle || ""}
              onChange={(e) => updateCfg({ subtitle: e.target.value })}
              placeholder={defaults.subtitle}
              maxLength={300}
              className={cn(inputClass, "h-auto py-2")}
            />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Action Button Text (Optional)" htmlFor={`sec-${sectionKey}-act-lbl`} hint="Leave empty to use default button">
              <input
                id={`sec-${sectionKey}-act-lbl`}
                value={cfg.actionLabel || ""}
                onChange={(e) => updateCfg({ actionLabel: e.target.value })}
                placeholder={defaults.actionLabel || "e.g. View all"}
                maxLength={40}
                className={inputClass}
              />
            </Field>
            <Field label="Button Destination Link" htmlFor={`sec-${sectionKey}-act-href`}>
              <input
                id={`sec-${sectionKey}-act-href`}
                list="site-links"
                value={cfg.actionHref || ""}
                onChange={(e) => updateCfg({ actionHref: e.target.value })}
                placeholder={defaults.actionHref || "/cars"}
                className={inputClass}
              />
            </Field>
          </div>
        </div>
      )}

      {/* Tab: Car Setup & Filter */}
      {subTab === "cars" && isCar && (
        <div className="space-y-5 pt-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Number of Cars to Display" htmlFor={`sec-${sectionKey}-limit`}>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {[4, 6, 8, 10, 12, 16].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => updateCfg({ carLimit: num })}
                      className={cn(
                        "h-8 rounded-lg px-2.5 text-xs font-bold transition-all",
                        (cfg.carLimit || (sectionKey === "bodyTypes" ? 8 : sectionKey === "recent" ? 8 : sectionKey === "featured" ? 6 : sectionKey === "hotDeals" ? 6 : sectionKey === "luxury" ? 5 : 6)) === num
                          ? "bg-night text-white shadow-soft"
                          : "bg-white border border-hairline text-slate-text hover:bg-mist"
                      )}
                    >
                      {num} cars
                    </button>
                  ))}
                </div>
                <input
                  id={`sec-${sectionKey}-limit`}
                  type="number"
                  min={1}
                  max={30}
                  value={cfg.carLimit || ""}
                  onChange={(e) => updateCfg({ carLimit: e.target.value ? Math.max(1, Math.min(30, Number(e.target.value))) : undefined })}
                  placeholder="Custom number (e.g. 8)"
                  className={cn(inputClass, "h-9 w-36 text-xs")}
                />
              </div>
            </Field>

            <Field label="Car Ordering & Sort" htmlFor={`sec-${sectionKey}-sort`}>
              <select
                id={`sec-${sectionKey}-sort`}
                value={cfg.carSort || "newest"}
                onChange={(e) => updateCfg({ carSort: e.target.value as any })}
                className={cn(inputClass, "h-10 text-xs")}
              >
                <option value="newest">Newest additions first (Default)</option>
                <option value="price-asc">Lowest price first</option>
                <option value="price-desc">Highest price first</option>
                <option value="popular">Most popular / most viewed</option>
                <option value="featured">Featured / spotlighted first</option>
                <option value="discount">Biggest discount percentage first</option>
              </select>
            </Field>
          </div>

          <div>
            <p className="text-xs font-bold text-night mb-2">Car Sourcing / Filter Mode</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                { mode: "all", label: "All Listings", desc: "Standard marketplace cars" },
                { mode: "verified", label: "Verified Dealers Only", desc: "Top-tier inspected listings" },
                { mode: "handpicked", label: "Handpicked Listings", desc: "Choose exact cars manually" },
              ].map((item) => (
                <button
                  key={item.mode}
                  type="button"
                  onClick={() => updateCfg({ carFilterMode: item.mode as any })}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-all",
                    (cfg.carFilterMode || "all") === item.mode
                      ? "border-electric bg-haze/60 ring-1 ring-electric"
                      : "border-hairline bg-white hover:border-slate-300 hover:bg-mist/40"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-night">{item.label}</span>
                    {(cfg.carFilterMode || "all") === item.mode && <Check size={14} className="text-electric" />}
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-text">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {cfg.carFilterMode === "handpicked" && (
            <HandpickedCarPicker
              selectedIds={cfg.handpickedIds || []}
              onChange={(ids) => updateCfg({ handpickedIds: ids })}
            />
          )}

          {sectionKey === "budget" && (
            <div className="rounded-xl border border-hairline bg-white p-3.5 space-y-2.5">
              <Field label="Maximum Budget Price (BDT)" htmlFor="budget-max" hint="Cars priced at or below this value will be shown.">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    id="budget-max"
                    type="number"
                    step={50000}
                    value={cfg.priceThreshold || 2000000}
                    onChange={(e) => updateCfg({ priceThreshold: Number(e.target.value) || 0 })}
                    className={cn(inputClass, "w-44 font-mono text-xs")}
                  />
                  <span className="text-xs font-bold text-electric">
                    = ৳ {((cfg.priceThreshold || 2000000) / 100000).toFixed(1)} Lakh
                  </span>
                </div>
              </Field>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-xs text-slate-text font-semibold">Presets:</span>
                {[1000000, 1500000, 2000000, 2500000, 3000000, 4000000].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => updateCfg({ priceThreshold: p })}
                    className={cn(
                      "rounded-lg px-2 py-1 text-xs font-semibold",
                      (cfg.priceThreshold || 2000000) === p ? "bg-night text-white" : "bg-mist text-slate-text hover:bg-hairline"
                    )}
                  >
                    ৳ {p / 100000} Lakh
                  </button>
                ))}
              </div>
            </div>
          )}

          {sectionKey === "luxury" && (
            <div className="rounded-xl border border-hairline bg-white p-3.5 space-y-2.5">
              <Field label="Minimum Luxury Price (BDT)" htmlFor="luxury-min" hint="Cars priced at or above this value will be shown.">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    id="luxury-min"
                    type="number"
                    step={100000}
                    value={cfg.priceThreshold || 4000000}
                    onChange={(e) => updateCfg({ priceThreshold: Number(e.target.value) || 0 })}
                    className={cn(inputClass, "w-44 font-mono text-xs")}
                  />
                  <span className="text-xs font-bold text-electric">
                    = ৳ {((cfg.priceThreshold || 4000000) / 100000).toFixed(1)} Lakh
                  </span>
                </div>
              </Field>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-xs text-slate-text font-semibold">Presets:</span>
                {[3000000, 4000000, 5000000, 6000000, 7500000, 10000000].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => updateCfg({ priceThreshold: p })}
                    className={cn(
                      "rounded-lg px-2 py-1 text-xs font-semibold",
                      (cfg.priceThreshold || 4000000) === p ? "bg-night text-white" : "bg-mist text-slate-text hover:bg-hairline"
                    )}
                  >
                    {p >= 10000000 ? "৳ 1 Crore" : `৳ ${p / 100000} Lakh`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {sectionKey === "hotDeals" && (
            <div className="rounded-xl border border-hairline bg-white p-3.5 space-y-2.5">
              <Field label="Minimum Discount %" htmlFor="hotdeals-discount" hint="Cars with a discount of at least this percentage will be featured.">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    id="hotdeals-discount"
                    type="number"
                    min={1}
                    max={50}
                    value={cfg.priceThreshold || 5}
                    onChange={(e) => updateCfg({ priceThreshold: Number(e.target.value) || 0 })}
                    className={cn(inputClass, "w-28 font-mono text-xs")}
                  />
                  <span className="text-xs font-bold text-electric">% off market value</span>
                </div>
              </Field>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-xs text-slate-text font-semibold">Presets:</span>
                {[5, 10, 15, 20, 25].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => updateCfg({ priceThreshold: d })}
                    className={cn(
                      "rounded-lg px-2 py-1 text-xs font-semibold",
                      (cfg.priceThreshold || 5) === d ? "bg-night text-white" : "bg-mist text-slate-text hover:bg-hairline"
                    )}
                  >
                    {d}% off
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Visuals & Images */}
      {subTab === "images" && hasImages && (
        <div className="space-y-4 pt-1">
          {sectionKey === "bodyTypes" ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold text-night">Category Card Images</p>
                <p className="text-xs text-slate-text">Customize the visual card photo for each vehicle body type tile on the homepage.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {CATEGORIES.map((cat) => {
                  const val = a.categoryImages?.[cat.key] || "";
                  return (
                    <div key={cat.key} className="rounded-xl border border-hairline bg-white p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-night">{cat.label}</span>
                        {val && <span className="text-[10px] font-semibold text-verified">Customized</span>}
                      </div>
                      <ImageField
                        id={`cat-img-${cat.key}`}
                        label=""
                        value={val}
                        onChange={(v) => {
                          const current = a.categoryImages || {};
                          setA("categoryImages", { ...current, [cat.key]: v });
                        }}
                        preview="wide"
                        placeholder={cat.defaultImg}
                        hint="Optimal size: 600 × 400 px"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-hairline bg-white p-4">
              <ImageField
                id={`sec-${sectionKey}-banner`}
                label="Custom Section Banner / Image"
                value={cfg.imageUrl || ""}
                onChange={(v) => updateCfg({ imageUrl: v })}
                preview="wide"
                placeholder="https://... or upload photo"
                hint="Upload a background image or promotional graphic for this section."
              />
            </div>
          )}
        </div>
      )}

      {/* Tab: Custom Content */}
      {subTab === "custom" && hasCustom && (
        <div className="space-y-4 pt-1">
          {sectionKey === "trustStats" && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-night">Trust Metric Counters</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {(a.trustStats || DEFAULT_APPEARANCE.trustStats || []).map((st, idx) => (
                  <div key={idx} className="rounded-xl border border-hairline bg-white p-3 space-y-2">
                    <span className="text-xs font-bold text-slate-text">Metric {idx + 1}</span>
                    <div className="grid grid-cols-[minmax(0,1fr)_5rem] gap-2">
                      <Field label="Value" htmlFor={`ts-val-${idx}`}>
                        <input
                          id={`ts-val-${idx}`}
                          type="number"
                          value={st.value}
                          onChange={(e) => {
                            const current = [...(a.trustStats || DEFAULT_APPEARANCE.trustStats || [])];
                            current[idx] = { ...current[idx], value: Number(e.target.value) || 0 };
                            setA("trustStats", current);
                          }}
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Suffix" htmlFor={`ts-sfx-${idx}`}>
                        <input
                          id={`ts-sfx-${idx}`}
                          value={st.suffix}
                          onChange={(e) => {
                            const current = [...(a.trustStats || DEFAULT_APPEARANCE.trustStats || [])];
                            current[idx] = { ...current[idx], suffix: e.target.value };
                            setA("trustStats", current);
                          }}
                          className={inputClass}
                        />
                      </Field>
                    </div>
                    <Field label="Label" htmlFor={`ts-lbl-${idx}`}>
                      <input
                        id={`ts-lbl-${idx}`}
                        value={st.label}
                        onChange={(e) => {
                          const current = [...(a.trustStats || DEFAULT_APPEARANCE.trustStats || [])];
                          current[idx] = { ...current[idx], label: e.target.value };
                          setA("trustStats", current);
                        }}
                        className={inputClass}
                      />
                    </Field>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sectionKey === "whyChoose" && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-night">Why Choose Features (4 Cards)</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {(a.whyChooseFeatures || DEFAULT_APPEARANCE.whyChooseFeatures || []).map((feat, idx) => (
                  <div key={idx} className="rounded-xl border border-hairline bg-white p-3 space-y-2">
                    <span className="text-xs font-bold text-slate-text">Card {idx + 1}</span>
                    <Field label="Feature Title" htmlFor={`wc-title-${idx}`}>
                      <input
                        id={`wc-title-${idx}`}
                        value={feat.title}
                        onChange={(e) => {
                          const current = [...(a.whyChooseFeatures || DEFAULT_APPEARANCE.whyChooseFeatures || [])];
                          current[idx] = { ...current[idx], title: e.target.value };
                          setA("whyChooseFeatures", current);
                        }}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Description" htmlFor={`wc-body-${idx}`}>
                      <textarea
                        id={`wc-body-${idx}`}
                        rows={2}
                        value={feat.body}
                        onChange={(e) => {
                          const current = [...(a.whyChooseFeatures || DEFAULT_APPEARANCE.whyChooseFeatures || [])];
                          current[idx] = { ...current[idx], body: e.target.value };
                          setA("whyChooseFeatures", current);
                        }}
                        className={cn(inputClass, "h-auto py-2 text-xs")}
                      />
                    </Field>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sectionKey === "howItWorks" && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-night">How It Works Steps (4 Steps)</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {(a.howItWorksSteps || DEFAULT_APPEARANCE.howItWorksSteps || []).map((step, idx) => (
                  <div key={idx} className="rounded-xl border border-hairline bg-white p-3 space-y-2">
                    <span className="text-xs font-bold text-slate-text">Step 0{idx + 1}</span>
                    <Field label="Step Title" htmlFor={`hiw-title-${idx}`}>
                      <input
                        id={`hiw-title-${idx}`}
                        value={step.title}
                        onChange={(e) => {
                          const current = [...(a.howItWorksSteps || DEFAULT_APPEARANCE.howItWorksSteps || [])];
                          current[idx] = { ...current[idx], title: e.target.value };
                          setA("howItWorksSteps", current);
                        }}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Description" htmlFor={`hiw-body-${idx}`}>
                      <textarea
                        id={`hiw-body-${idx}`}
                        rows={2}
                        value={step.body}
                        onChange={(e) => {
                          const current = [...(a.howItWorksSteps || DEFAULT_APPEARANCE.howItWorksSteps || [])];
                          current[idx] = { ...current[idx], body: e.target.value };
                          setA("howItWorksSteps", current);
                        }}
                        className={cn(inputClass, "h-auto py-2 text-xs")}
                      />
                    </Field>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sectionKey === "appPromo" && (
            <div className="space-y-4 rounded-xl border border-hairline bg-white p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Apple App Store URL" htmlFor="promo-app-store">
                  <input
                    id="promo-app-store"
                    value={a.appPromo?.appStoreUrl || ""}
                    onChange={(e) => setA("appPromo", { ...(a.appPromo || DEFAULT_APPEARANCE.appPromo || {}), appStoreUrl: e.target.value })}
                    placeholder="https://apps.apple.com/..."
                    className={inputClass}
                  />
                </Field>
                <Field label="Google Play Store URL" htmlFor="promo-play-store">
                  <input
                    id="promo-play-store"
                    value={a.appPromo?.playStoreUrl || ""}
                    onChange={(e) => setA("appPromo", { ...(a.appPromo || DEFAULT_APPEARANCE.appPromo || {}), playStoreUrl: e.target.value })}
                    placeholder="https://play.google.com/..."
                    className={inputClass}
                  />
                </Field>
              </div>
              <ImageField
                id="promo-banner-img"
                label="App Promo Mockup / Banner Image"
                value={a.appPromo?.mockupUrl || ""}
                onChange={(v) => setA("appPromo", { ...(a.appPromo || DEFAULT_APPEARANCE.appPromo || {}), mockupUrl: v })}
                preview="wide"
                placeholder="/images/home/app-preview.png"
                hint="Mockup image showing the mobile app screens or phone"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Homepage Tab ──────────────────────────────── */
function HomepageTab({ a, setA }: { a: AppearanceSettings; setA: SetA }) {
  const hero = a.hero;
  const sell = a.sellBanner;
  const setHero = (patch: Partial<AppearanceSettings["hero"]>) => setA("hero", { ...hero, ...patch });
  const setSell = (patch: Partial<AppearanceSettings["sellBanner"]>) => setA("sellBanner", { ...sell, ...patch });
  const [wordsText, setWordsText] = useState(hero.rotatingWords.join(", "));
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => setWordsText(hero.rotatingWords.join(", ")), [hero.rotatingWords]);

  const getBadges = (key: string) => {
    const cfg = a.sectionConfigs?.[key];
    const badges: string[] = [];
    if (!cfg) return badges;
    if (cfg.eyebrow || cfg.title || cfg.subtitle || cfg.actionLabel || cfg.actionHref) badges.push("Custom texts");
    if (cfg.carLimit || (cfg.carSort && cfg.carSort !== "newest") || (cfg.carFilterMode && cfg.carFilterMode !== "all") || (cfg.handpickedIds && cfg.handpickedIds.length > 0) || cfg.priceThreshold) badges.push("Custom car setup");
    if (cfg.imageUrl) badges.push("Custom banner");
    return badges;
  };

  return (
    <div className="space-y-6">
      <Panel title="Hero" subtitle="The first thing visitors see" action={<Home size={18} className="text-slate-text" aria-hidden />}>
        <div className="space-y-4">
          <Field label="Small badge above the headline" htmlFor="hero-badge"><input id="hero-badge" value={hero.badge} maxLength={80} onChange={(e) => setHero({ badge: e.target.value })} className={inputClass} /></Field>
          <div className="grid gap-4 md:grid-cols-[14rem_minmax(0,1fr)]">
            <Field label="Headline start" htmlFor="hero-prefix"><input id="hero-prefix" value={hero.titlePrefix} maxLength={40} onChange={(e) => setHero({ titlePrefix: e.target.value })} className={inputClass} /></Field>
            <Field label="Rotating words (comma separated)" htmlFor="hero-words" hint="They roll one after another after the headline start, e.g. “Find your next car / SUV / hybrid”.">
              <input id="hero-words" value={wordsText} onChange={(e) => setWordsText(e.target.value)}
                onBlur={() => setHero({ rotatingWords: wordsText.split(",").map((w) => w.trim()).filter(Boolean).slice(0, 8) })} className={inputClass} />
            </Field>
          </div>
          <Field label="Subtitle" htmlFor="hero-sub"><textarea id="hero-sub" rows={2} value={hero.subtitle} maxLength={240} onChange={(e) => setHero({ subtitle: e.target.value })} className={cn(inputClass, "h-auto py-2")} /></Field>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Main button" htmlFor="hero-cta1"><input id="hero-cta1" value={hero.primaryCtaLabel} maxLength={30} onChange={(e) => setHero({ primaryCtaLabel: e.target.value })} className={inputClass} /></Field>
              <Field label="Goes to" htmlFor="hero-cta1-href"><input id="hero-cta1-href" list="site-links" value={hero.primaryCtaHref} onChange={(e) => setHero({ primaryCtaHref: e.target.value })} className={inputClass} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Second button" htmlFor="hero-cta2"><input id="hero-cta2" value={hero.secondaryCtaLabel} maxLength={30} onChange={(e) => setHero({ secondaryCtaLabel: e.target.value })} className={inputClass} /></Field>
              <Field label="Goes to" htmlFor="hero-cta2-href"><input id="hero-cta2-href" list="site-links" value={hero.secondaryCtaHref} onChange={(e) => setHero({ secondaryCtaHref: e.target.value })} className={inputClass} /></Field>
            </div>
          </div>
          <div>
            <p className="field-label">Quick search chips under the search box</p>
            <LinkListEditor links={hero.quickLinks} onChange={(quickLinks) => setHero({ quickLinks })} max={8} idPrefix="quick" />
          </div>
          <SwitchRow title="Live feed of new cars beside the headline" description="Shows the newest listings scrolling on the right on desktop." checked={hero.showLiveFeed} onChange={(v) => setHero({ showLiveFeed: v })} />
        </div>
      </Panel>

      <Panel title="Homepage sections" subtitle="Turn sections on or off, reorder them, and click Customize on any section to edit its car selection, filters, texts, and images." action={<LayoutTemplate size={18} className="text-slate-text" aria-hidden />}>
        <ol className="space-y-3">
          {a.homeSections.map((s, i) => {
            const meta = HOME_SECTIONS.find((h) => h.key === s.key)!;
            const isExpanded = expandedSection === s.key;
            const badges = getBadges(s.key);
            const isCar = isCarSection(s.key);

            return (
              <li
                key={s.key}
                className={cn(
                  "rounded-2xl border transition-all overflow-hidden",
                  isExpanded ? "border-electric shadow-soft bg-white ring-1 ring-electric/30" : "border-hairline bg-white hover:border-slate-300",
                  !s.enabled && "bg-mist/60 opacity-80"
                )}
              >
                <div className="flex items-center gap-3 px-3.5 py-3">
                  <GripVertical size={16} className="shrink-0 text-slate-text/60" aria-hidden />
                  <span className="w-6 text-center text-xs font-bold text-slate-text tabular">{i + 1}</span>
                  <div className={cn("min-w-0 grow", !s.enabled && "opacity-60")}>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-bold text-night">{meta.label}</p>
                      {isCar && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-haze px-1.5 py-0.5 text-[11px] font-semibold text-electric">
                          <Car size={11} /> Car Showcase
                        </span>
                      )}
                      {badges.map((b) => (
                        <span key={b} className="rounded-md bg-verified-soft px-1.5 py-0.5 text-[11px] font-semibold text-verified">
                          {b}
                        </span>
                      ))}
                    </div>
                    <p className="truncate text-xs text-slate-text">{meta.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant={isExpanded ? "primary" : "secondary"}
                      onClick={() => setExpandedSection(isExpanded ? null : s.key)}
                      className="h-8 gap-1.5 text-xs font-bold"
                      aria-expanded={isExpanded}
                    >
                      <SlidersHorizontal size={13} />
                      <span className="hidden sm:inline">{isExpanded ? "Close" : "Customize"}</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </Button>

                    <span className="hidden text-xs font-semibold text-slate-text sm:inline">{s.enabled ? <Eye size={15} aria-label="Shown" /> : <EyeOff size={15} aria-label="Hidden" />}</span>
                    <Switch checked={s.enabled} label={`Show ${meta.label}`} onChange={(v) => setA("homeSections", a.homeSections.map((x) => (x.key === s.key ? { ...x, enabled: v } : x)))} />

                    <div className="flex shrink-0">
                      <Button size="sm" variant="ghost" className="px-1.5" disabled={i === 0} onClick={() => setA("homeSections", move(a.homeSections, i, -1))} aria-label={`Move ${meta.label} up`}><ArrowUp size={15} aria-hidden /></Button>
                      <Button size="sm" variant="ghost" className="px-1.5" disabled={i === a.homeSections.length - 1} onClick={() => setA("homeSections", move(a.homeSections, i, 1))} aria-label={`Move ${meta.label} down`}><ArrowDown size={15} aria-hidden /></Button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-hairline bg-surface p-4 sm:p-5">
                    <SectionCustomizer
                      sectionKey={s.key}
                      sectionLabel={meta.label}
                      a={a}
                      setA={setA}
                      onClose={() => setExpandedSection(null)}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
        <div className="mt-4 flex justify-end">
          <Button size="sm" variant="ghost" onClick={() => setA("homeSections", DEFAULT_APPEARANCE.homeSections)}><RotateCcw size={14} aria-hidden /> Restore default order</Button>
        </div>
      </Panel>

      <Panel title="Sell your car banner">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[12rem_minmax(0,1fr)]">
            <Field label="Small label" htmlFor="sell-eyebrow"><input id="sell-eyebrow" value={sell.eyebrow} maxLength={40} onChange={(e) => setSell({ eyebrow: e.target.value })} className={inputClass} /></Field>
            <Field label="Headline" htmlFor="sell-title"><input id="sell-title" value={sell.title} maxLength={80} onChange={(e) => setSell({ title: e.target.value })} className={inputClass} /></Field>
          </div>
          <Field label="Text" htmlFor="sell-sub"><input id="sell-sub" value={sell.subtitle} maxLength={200} onChange={(e) => setSell({ subtitle: e.target.value })} className={inputClass} /></Field>
          <ImageField id="sell-image" label="Background photo" value={sell.imageUrl} onChange={(v) => setSell({ imageUrl: v })} placeholder="/images/home/sell-banner.jpg"
            hint="A wide photo (at least 1600 px across) with the car on the right; the left side sits under the text." />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Main button" htmlFor="sell-cta"><input id="sell-cta" value={sell.ctaLabel} maxLength={30} onChange={(e) => setSell({ ctaLabel: e.target.value })} className={inputClass} /></Field>
              <Field label="Goes to" htmlFor="sell-cta-href"><input id="sell-cta-href" list="site-links" value={sell.ctaHref} onChange={(e) => setSell({ ctaHref: e.target.value })} className={inputClass} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Second button" htmlFor="sell-cta2"><input id="sell-cta2" value={sell.secondaryLabel} maxLength={30} onChange={(e) => setSell({ secondaryLabel: e.target.value })} className={inputClass} /></Field>
              <Field label="Goes to" htmlFor="sell-cta2-href"><input id="sell-cta2-href" list="site-links" value={sell.secondaryHref} onChange={(e) => setSell({ secondaryHref: e.target.value })} className={inputClass} /></Field>
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Homepage FAQ" subtitle="Questions at the bottom of the homepage. They also appear in Google as FAQ results."
        action={<Button size="sm" onClick={() => setA("homeFaqs", [...a.homeFaqs, { q: "", a: "" }])} disabled={a.homeFaqs.length >= 20}><Plus size={15} aria-hidden /> Add question</Button>}>
        <FaqEditor items={a.homeFaqs} onChange={(homeFaqs) => setA("homeFaqs", homeFaqs)} />
      </Panel>
    </div>
  );
}

function FaqEditor({ items, onChange }: { items: FaqItem[]; onChange: (items: FaqItem[]) => void }) {
  if (items.length === 0) {
    return <p className="rounded-2xl border border-dashed border-hairline p-6 text-center text-sm text-slate-text">No custom questions: the homepage shows the six built-in questions about buying and selling cars. Add your own to replace them.</p>;
  }
  const update = (i: number, patch: Partial<FaqItem>) => onChange(items.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  return (
    <ol className="space-y-3">
      {items.map((f, i) => (
        <li key={i} className="rounded-2xl border border-hairline p-4">
          <Field label={`Question ${i + 1}`} htmlFor={`faq-q-${i}`}><input id={`faq-q-${i}`} value={f.q} maxLength={200} onChange={(e) => update(i, { q: e.target.value })} className={inputClass} /></Field>
          <div className="mt-3"><Field label="Answer" htmlFor={`faq-a-${i}`}><textarea id={`faq-a-${i}`} rows={3} value={f.a} maxLength={1200} onChange={(e) => update(i, { a: e.target.value })} className={cn(inputClass, "h-auto py-2")} /></Field></div>
          <div className="mt-2 flex justify-end gap-1">
            <Button size="sm" variant="ghost" disabled={i === 0} onClick={() => onChange(move(items, i, -1))} aria-label="Move question up"><ArrowUp size={15} aria-hidden /></Button>
            <Button size="sm" variant="ghost" disabled={i === items.length - 1} onClick={() => onChange(move(items, i, 1))} aria-label="Move question down"><ArrowDown size={15} aria-hidden /></Button>
            <Button size="sm" variant="ghost" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Delete question"><Trash2 size={15} aria-hidden /></Button>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ─── Footer ────────────────────────────────────── */
function FooterTab({ a, brand, setA, setBrand }: { a: AppearanceSettings; brand: Brand; setA: SetA; setBrand: (k: keyof Brand, v: string) => void }) {
  const footer = a.footer;
  const setFooter = (patch: Partial<AppearanceSettings["footer"]>) => setA("footer", { ...footer, ...patch });
  const setColumn = (i: number, patch: Partial<FooterColumn>) => setFooter({ columns: footer.columns.map((c, j) => (j === i ? { ...c, ...patch } : c)) });

  return (
    <div className="space-y-6">
      <Panel title="Link columns" subtitle="Up to four columns of links in the footer"
        action={<Button size="sm" disabled={footer.columns.length >= 4} onClick={() => setFooter({ columns: [...footer.columns, { title: "New column", links: [] }] })}><Plus size={15} aria-hidden /> Add column</Button>}>
        <div className="grid gap-4 lg:grid-cols-2">
          {footer.columns.map((col, i) => (
            <div key={i} className="rounded-2xl border border-hairline p-4">
              <div className="flex items-end gap-2">
                <div className="grow"><Field label={`Column ${i + 1} title`} htmlFor={`col-${i}`}><input id={`col-${i}`} value={col.title} maxLength={40} onChange={(e) => setColumn(i, { title: e.target.value })} className={inputClass} /></Field></div>
                <Button variant="ghost" className="px-2.5" disabled={i === 0} onClick={() => setFooter({ columns: move(footer.columns, i, -1) })} aria-label="Move column left"><ArrowUp size={15} className="-rotate-90" aria-hidden /></Button>
                <Button variant="ghost" className="px-2.5" onClick={() => setFooter({ columns: footer.columns.filter((_, j) => j !== i) })} aria-label={`Delete column ${col.title}`}><Trash2 size={15} aria-hidden /></Button>
              </div>
              <div className="mt-3"><LinkListEditor links={col.links} onChange={(links) => setColumn(i, { links })} max={12} idPrefix={`col-${i}`} compact /></div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Newsletter and bottom line" action={<PanelBottom size={18} className="text-slate-text" aria-hidden />}>
        <div className="space-y-4">
          <SwitchRow title="Newsletter sign-up" description="The email box in the footer." checked={footer.showNewsletter} onChange={(v) => setFooter({ showNewsletter: v })} />
          {footer.showNewsletter && (
            <Field label="Newsletter text" htmlFor="f-news"><input id="f-news" value={footer.newsletterText} maxLength={200} onChange={(e) => setFooter({ newsletterText: e.target.value })} className={inputClass} /></Field>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Copyright text" htmlFor="f-copy" hint="The year is added in front automatically."><input id="f-copy" value={brand.copyrightText} maxLength={160} onChange={(e) => setBrand("copyrightText", e.target.value)} className={inputClass} /></Field>
            <Field label="Bottom note" htmlFor="f-note"><input id="f-note" value={footer.bottomNote} maxLength={160} onChange={(e) => setFooter({ bottomNote: e.target.value })} className={inputClass} /></Field>
          </div>
          <p className="text-[13px] text-slate-text">Phone, email, address and social links are in <a href="/admin/settings" className="font-semibold text-electric">Site settings</a>.</p>
        </div>
      </Panel>
    </div>
  );
}

/* ─── Link list ─────────────────────────────────── */
function LinkListEditor({ links, onChange, max, idPrefix, hint, compact }: {
  links: LinkItem[]; onChange: (l: LinkItem[]) => void; max: number; idPrefix: string; hint?: string; compact?: boolean;
}) {
  const update = (i: number, patch: Partial<LinkItem>) => onChange(links.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  return (
    <div>
      {links.length === 0 && <p className="mb-3 rounded-xl border border-dashed border-hairline p-4 text-center text-sm text-slate-text">No links yet.</p>}
      <ul className="space-y-2">
        {links.map((l, i) => (
          <li key={i} className={cn("grid items-center gap-2", compact ? "grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]" : "grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto]")}>
            <input aria-label={`Link ${i + 1} text`} value={l.label} maxLength={40} onChange={(e) => update(i, { label: e.target.value })} placeholder="Text" className={cn(inputClass, "h-10")} />
            <input aria-label={`Link ${i + 1} address`} list="site-links" value={l.href} onChange={(e) => update(i, { href: e.target.value })} placeholder="/cars" className={cn(inputClass, "h-10 font-mono text-[13px]")} />
            <div className="flex">
              <Button size="sm" variant="ghost" className="px-2" disabled={i === 0} onClick={() => onChange(move(links, i, -1))} aria-label={`Move ${l.label || "link"} up`}><ArrowUp size={15} aria-hidden /></Button>
              <Button size="sm" variant="ghost" className="px-2" disabled={i === links.length - 1} onClick={() => onChange(move(links, i, 1))} aria-label={`Move ${l.label || "link"} down`}><ArrowDown size={15} aria-hidden /></Button>
              <Button size="sm" variant="ghost" className="px-2" onClick={() => onChange(links.filter((_, j) => j !== i))} aria-label={`Delete ${l.label || "link"}`}><Trash2 size={15} aria-hidden /></Button>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {hint ? <p className="text-xs text-slate-text">{hint}</p> : <span />}
        <Button size="sm" disabled={links.length >= max} onClick={() => onChange([...links, { label: "", href: "" }])} id={`${idPrefix}-add`}><Plus size={15} aria-hidden /> Add link</Button>
      </div>
      <p className="sr-only" aria-live="polite">{links.length} of {max} links</p>
    </div>
  );
}
