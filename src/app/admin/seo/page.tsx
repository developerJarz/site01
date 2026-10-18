"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle, ArrowDown, ArrowRight, ArrowUp, BookOpen, Car, CheckCircle2, ExternalLink, Globe2, Plus, RotateCcw, Search, Sparkles, Star, Trash2, XCircle,
} from "lucide-react";
import { Button, CountTabs, Field, PageHeader, Panel, api, inputClass } from "@/components/admin/ui";
import { ImageField } from "@/components/admin/ImageField";
import { useToast } from "@/components/admin/Toast";
import { scoreGrade, scorePage, type SeoCheck } from "@/lib/seo-score";
import { cn } from "@/lib/utils";

type Defaults = { path: string; name: string; title: string; description: string; keywords: string[]; noindex?: boolean };
type Override = { seoTitle?: string; metaTitle?: string; metaDescription?: string; keywords?: string; ogImage?: string; ogImageAlt?: string; noindex?: boolean };
type PageRow = { defaults: Defaults; override: Override | null };
type Globals = { metaTitleTemplate: string; metaDescription: string; seoKeywords: string; defaultOgImage: string };
type Testimonial = { name: string; role: string; location: string; rating: number; content: string; published: boolean };
type Audit = {
  listings: { live: number; noPhotos: number; fewPhotos: number; shortDescription: number; missingAlts: number };
  blogs: { published: number; noMeta: number; shortExcerpt: number; noAlt: number; noKeywords: number };
};
type Tab = "health" | "pages" | "defaults" | "reviews";

const EMPTY: Required<Override> = { seoTitle: "", metaTitle: "", metaDescription: "", keywords: "", ogImage: "", ogImageAlt: "", noindex: false };

const splitKeywords = (s?: string) => (s || "").split(/[,\n]/).map((k) => k.trim()).filter(Boolean);

/** Scores what Google will actually see for a page: the saved override, or the automatic default. */
function scoreRow(d: Defaults, o: Override | null | undefined) {
  const noindex = o?.noindex ?? d.noindex ?? false;
  return scorePage({
    title: o?.seoTitle || d.title,
    description: o?.metaDescription || d.description,
    keywords: splitKeywords(o?.keywords).length ? splitKeywords(o?.keywords) : d.keywords,
    ownImage: !!o?.ogImage,
    // /og-default.jpg ships with the site, so there is always a fallback share image.
    defaultImage: true,
    noindex,
    hiddenByDesign: !!d.noindex && noindex,
  });
}

const TONE = {
  good: { text: "text-verified", bg: "bg-verified-soft", ring: "#0f7b4f" },
  ok: { text: "text-warning", bg: "bg-warning-soft", ring: "#d97706" },
  poor: { text: "text-destructive", bg: "bg-danger-soft", ring: "#dc2626" },
};

function ScorePill({ score }: { score: number }) {
  const tone = TONE[scoreGrade(score).tone];
  return <span className={cn("inline-flex min-w-10 justify-center rounded-full px-2 py-0.5 text-[11px] font-extrabold tabular", tone.bg, tone.text)}>{score}</span>;
}

/** Circular 0–100 gauge; the number and grade are written out, so colour is never the only signal. */
function ScoreRing({ score, size = 132, label }: { score: number; size?: number; label?: string }) {
  const grade = scoreGrade(score);
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${label || "SEO score"}: ${score} out of 100, ${grade.label}`}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={TONE[grade.tone].ring} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} className="transition-[stroke-dashoffset] duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden>
        <span className="text-[2rem] font-extrabold leading-none text-night tabular">{score}</span>
        <span className={cn("mt-1 text-xs font-bold", TONE[grade.tone].text)}>{grade.label}</span>
      </div>
    </div>
  );
}

function CheckList({ checks }: { checks: SeoCheck[] }) {
  return (
    <ul className="space-y-2.5">
      {checks.map((c) => (
        <li key={c.id} className="flex gap-2.5">
          {c.status === "pass" ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-verified" aria-label="Passed" />
            : c.status === "warn" ? <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning" aria-label="Could be better" />
              : <XCircle size={18} className="mt-0.5 shrink-0 text-destructive" aria-label="Needs fixing" />}
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-night">{c.label}</span>
            {c.status !== "pass" && <span className="block text-[13px] text-slate-text">{c.tip}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Length meter: Google shows ~60 title characters and ~158 description characters. */
function Meter({ value, min, max }: { value: string; min: number; max: number }) {
  const n = value.length;
  const tone = n === 0 ? "text-slate-text" : n < min ? "text-warning" : n > max ? "text-destructive" : "text-verified";
  const note = n === 0 ? "automatic" : n < min ? "a little short" : n > max ? "will be cut off" : "good length";
  return <span className={cn("text-xs font-semibold tabular", tone)}>{n} / {max} · {note}</span>;
}

export default function AdminSeoPage() {
  const [tab, setTab] = useState<Tab>("health");
  const [focusPath, setFocusPath] = useState<string | undefined>();
  const [pages, setPages] = useState<PageRow[] | null>(null);
  const [globals, setGlobals] = useState<Globals | null>(null);
  const [reviews, setReviews] = useState<Testimonial[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ pages: PageRow[]; globals: Globals; testimonials: Testimonial[] }>("/api/admin/seo")
      .then((d) => { setPages(d.pages); setGlobals(d.globals); setReviews(d.testimonials.map((t) => ({ ...EMPTY_REVIEW, ...t }))); })
      .catch((e) => setError((e as Error).message));
  }, []);

  const customised = pages?.filter((p) => p.override).length || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="SEO & content"
        description="Search titles, descriptions and share images for every page, plus the customer reviews on the homepage. Anything left empty is filled in automatically from the page content."
        actions={<Button onClick={() => window.open("/sitemap.xml", "_blank")}><Globe2 size={16} aria-hidden /> View sitemap</Button>}
      />
      <CountTabs<Tab>
        label="SEO sections"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "health", label: "SEO health" },
          { value: "pages", label: "Pages", count: pages?.length },
          { value: "defaults", label: "Site defaults" },
          { value: "reviews", label: "Customer reviews", count: reviews.length },
        ]}
      />
      {error && <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-destructive">{error}</p>}
      {!pages || !globals ? (
        !error && <div className="skeleton h-96 rounded-3xl" />
      ) : tab === "health" ? (
        <HealthReport pages={pages} globals={globals} onFix={(path) => { setFocusPath(path); setTab(path ? "pages" : "defaults"); }} />
      ) : tab === "pages" ? (
        <PagesEditor pages={pages} customised={customised} initialPath={focusPath} onSaved={(path, override) => setPages((all) => all!.map((p) => (p.defaults.path === path ? { ...p, override } : p)))} />
      ) : tab === "defaults" ? (
        <DefaultsEditor initial={globals} onSaved={setGlobals} />
      ) : (
        <ReviewsEditor initial={reviews} onSaved={setReviews} />
      )}
      <p className="text-sm text-slate-text">
        Car listings and blog posts have their own SEO fields: open a listing in <Link href="/admin/listings" className="font-semibold text-electric">Listings</Link> or a post in <Link href="/admin/blogs" className="font-semibold text-electric">Blog posts</Link>.
        {" "}Changes go live within a minute.
      </p>
    </div>
  );
}

/* ─── Health ────────────────────────────────────── */
function HealthReport({ pages, globals, onFix }: { pages: PageRow[]; globals: Globals; onFix: (path?: string) => void }) {
  const [audit, setAudit] = useState<Audit | null>(null);
  const [auditError, setAuditError] = useState("");
  useEffect(() => {
    api<Audit>("/api/admin/seo?audit=1").then(setAudit).catch((e) => setAuditError((e as Error).message));
  }, []);

  const scored = useMemo(() => pages.map((p) => ({ row: p, ...scoreRow(p.defaults, p.override) })).sort((a, b) => a.score - b.score), [pages]);
  const pageAverage = Math.round(scored.reduce((n, s) => n + s.score, 0) / Math.max(1, scored.length));

  // Site-wide setup counts for a fifth of the overall score; page scores for the rest.
  const setup = [
    { ok: globals.metaTitleTemplate.includes("%s"), label: "Title template contains %s" },
    { ok: globals.metaDescription.length >= 70 && globals.metaDescription.length <= 158, label: "Default description is 70–158 characters" },
    { ok: splitKeywords(globals.seoKeywords).length >= 3, label: "At least three site keywords" },
    { ok: !!globals.defaultOgImage, label: "Custom default share image" },
  ];
  const setupScore = Math.round((setup.filter((s) => s.ok).length / setup.length) * 100);
  const overall = Math.round(pageAverage * 0.8 + setupScore * 0.2);
  const counts = { good: 0, ok: 0, poor: 0 };
  for (const s of scored) counts[scoreGrade(s.score).tone]++;

  const issues: { label: string; count: number; total: number; href: string; icon: typeof Car }[] = audit ? [
    { label: "Live cars with no photos", count: audit.listings.noPhotos, total: audit.listings.live, href: "/admin/listings?status=active", icon: Car },
    { label: "Live cars with fewer than 4 photos", count: audit.listings.fewPhotos, total: audit.listings.live, href: "/admin/listings?status=active", icon: Car },
    { label: "Live cars with a very short description", count: audit.listings.shortDescription, total: audit.listings.live, href: "/admin/listings?status=active", icon: Car },
    { label: "Live cars without custom photo alt text", count: audit.listings.missingAlts, total: audit.listings.live, href: "/admin/listings?status=active", icon: Car },
    { label: "Blog posts without a meta description", count: audit.blogs.noMeta, total: audit.blogs.published, href: "/admin/blogs", icon: BookOpen },
    { label: "Blog posts with a short excerpt", count: audit.blogs.shortExcerpt, total: audit.blogs.published, href: "/admin/blogs", icon: BookOpen },
    { label: "Blog posts without cover alt text", count: audit.blogs.noAlt, total: audit.blogs.published, href: "/admin/blogs", icon: BookOpen },
    { label: "Blog posts without focus keywords", count: audit.blogs.noKeywords, total: audit.blogs.published, href: "/admin/blogs", icon: BookOpen },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Overall SEO score" subtitle="Pages, site defaults and content together" className="lg:col-span-1">
          <div className="flex flex-col items-center gap-5 sm:flex-row lg:flex-col xl:flex-row">
            <ScoreRing score={overall} label="Overall SEO score" />
            <dl className="grid w-full grid-cols-3 gap-2 text-center sm:grid-cols-1 sm:text-left lg:grid-cols-3 lg:text-center xl:grid-cols-1 xl:text-left">
              <div className="rounded-2xl bg-verified-soft px-3 py-2"><dt className="text-xs font-semibold text-verified">Good pages</dt><dd className="text-lg font-extrabold tabular text-night">{counts.good}</dd></div>
              <div className="rounded-2xl bg-warning-soft px-3 py-2"><dt className="text-xs font-semibold text-warning">Need work</dt><dd className="text-lg font-extrabold tabular text-night">{counts.ok}</dd></div>
              <div className="rounded-2xl bg-danger-soft px-3 py-2"><dt className="text-xs font-semibold text-destructive">Poor</dt><dd className="text-lg font-extrabold tabular text-night">{counts.poor}</dd></div>
            </dl>
          </div>
        </Panel>

        <Panel title="Site setup" subtitle={`${setupScore}% complete`} action={<Button size="sm" onClick={() => onFix()}>Edit defaults</Button>}>
          <ul className="space-y-3">
            {setup.map((s) => (
              <li key={s.label} className="flex items-center gap-2.5 text-sm">
                {s.ok ? <CheckCircle2 size={18} className="shrink-0 text-verified" aria-label="Done" /> : <AlertTriangle size={18} className="shrink-0 text-warning" aria-label="To do" />}
                <span className={s.ok ? "text-night" : "font-semibold text-night"}>{s.label}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[13px] text-slate-text">Page average: <strong className="tabular text-night">{pageAverage}</strong> / 100 across {pages.length} pages.</p>
        </Panel>

        <Panel title="Content checks" subtitle="Car listings and blog posts">
          {auditError ? <p className="text-sm text-destructive">{auditError}</p> : !audit ? <div className="skeleton h-40 rounded-2xl" /> : (
            <ul className="space-y-1">
              {issues.map((i) => (
                <li key={i.label}>
                  <Link href={i.href} className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm hover:bg-mist">
                    <i.icon size={15} className={i.count ? "shrink-0 text-warning" : "shrink-0 text-verified"} aria-hidden />
                    <span className="grow text-night">{i.label}</span>
                    <span className={cn("font-extrabold tabular", i.count ? "text-warning" : "text-verified")}>{i.count}</span>
                    <span className="sr-only">of {i.total}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Pages to improve" subtitle="Lowest scores first. Fix the red and amber checks to raise each score." flush>
        <ul className="divide-y divide-hairline">
          {scored.slice(0, 12).map(({ row, score, checks }) => {
            const failing = checks.filter((c) => c.status !== "pass");
            return (
              <li key={row.defaults.path} className="flex flex-wrap items-center gap-3 px-5 py-3 md:px-6">
                <ScorePill score={score} />
                <div className="min-w-0 grow basis-60">
                  <p className="truncate text-sm font-bold text-night">{row.defaults.name} <span className="font-normal text-slate-text">{row.defaults.path}</span></p>
                  <p className="truncate text-[13px] text-slate-text">{failing.length ? failing.map((c) => c.label).join(" · ") : "All checks pass"}</p>
                </div>
                <Button size="sm" onClick={() => onFix(row.defaults.path)}>Improve <ArrowRight size={14} aria-hidden /></Button>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}

/* ─── Pages ─────────────────────────────────────── */
function PagesEditor({ pages, customised, initialPath, onSaved }: { pages: PageRow[]; customised: number; initialPath?: string; onSaved: (path: string, o: Override | null) => void }) {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(initialPath && pages.some((p) => p.defaults.path === initialPath) ? initialPath : pages[0].defaults.path);
  const row = pages.find((p) => p.defaults.path === selected) || pages[0];
  const [form, setForm] = useState<Required<Override>>({ ...EMPTY, ...row.override });
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm({ ...EMPTY, ...row.override }); }, [row]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? pages.filter((p) => `${p.defaults.name} ${p.defaults.path}`.toLowerCase().includes(q)) : pages;
  }, [pages, query]);

  const d = row.defaults;
  const set = <K extends keyof Override>(k: K, v: Required<Override>[K]) => setForm((f) => ({ ...f, [k]: v }));
  const title = form.seoTitle || d.title;
  const description = form.metaDescription || d.description;
  const live = scoreRow(d, form);

  const save = async (data: Required<Override>) => {
    setSaving(true);
    try {
      const res = await api<{ override: Override | null }>("/api/admin/seo", { method: "PUT", body: JSON.stringify({ path: d.path, ...data }) });
      onSaved(d.path, res.override);
      toast.success(res.override ? `Saved SEO for ${d.name}.` : `${d.name} is back to automatic SEO.`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <Panel title="Pages" subtitle={`${customised} customised, the rest automatic`} flush>
        <div className="border-b border-hairline p-3">
          <label htmlFor="seo-search" className="sr-only">Find a page</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-text" aria-hidden />
            <input id="seo-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a page" className={cn(inputClass, "pl-9")} />
          </div>
        </div>
        <ul className="max-h-[60vh] overflow-y-auto p-2">
          {shown.map((p) => (
            <li key={p.defaults.path}>
              <button type="button" onClick={() => setSelected(p.defaults.path)} aria-current={p.defaults.path === selected}
                className={cn("flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left", p.defaults.path === selected ? "bg-haze" : "hover:bg-mist")}>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-night">{p.defaults.name}</span>
                  <span className="block truncate text-xs text-slate-text">{p.defaults.path}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <ScorePill score={scoreRow(p.defaults, p.override).score} />
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-text">{p.override ? "Custom" : "Auto"}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="space-y-6">
        <Panel title={d.name} subtitle={d.path} action={<a href={d.path} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-electric"><ExternalLink size={14} aria-hidden /> Open page</a>}>
          <form onSubmit={(e) => { e.preventDefault(); save(form); }} className="space-y-5">
            <div>
              <div className="flex items-end justify-between gap-2"><label htmlFor="seo-title" className="field-label">SEO title (Google result and browser tab)</label><Meter value={form.seoTitle} min={30} max={60} /></div>
              <input id="seo-title" value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} placeholder={d.title} className={inputClass} />
            </div>
            <div>
              <div className="flex items-end justify-between gap-2"><label htmlFor="seo-desc" className="field-label">Meta description</label><Meter value={form.metaDescription} min={70} max={158} /></div>
              <textarea id="seo-desc" rows={3} value={form.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} placeholder={d.description} className={cn(inputClass, "h-auto py-2")} />
            </div>
            <div>
              <div className="flex items-end justify-between gap-2"><label htmlFor="seo-meta-title" className="field-label">Meta title for social shares (Facebook, WhatsApp)</label><Meter value={form.metaTitle} min={20} max={70} /></div>
              <input id="seo-meta-title" value={form.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} placeholder={form.seoTitle || d.title} className={inputClass} />
            </div>
            <Field label="Focus keywords (comma separated)" htmlFor="seo-keywords" hint="Phrases people search for. Use them naturally in the title and description too.">
              <input id="seo-keywords" value={form.keywords} onChange={(e) => set("keywords", e.target.value)} placeholder={d.keywords.join(", ")} className={inputClass} />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <ImageField id="seo-og" label="Share image" value={form.ogImage} onChange={(v) => set("ogImage", v)} hint="1200 × 630 works best. Empty uses the site default." />
              <Field label="Share image alt text" htmlFor="seo-og-alt">
                <input id="seo-og-alt" value={form.ogImageAlt} onChange={(e) => set("ogImageAlt", e.target.value)} placeholder="Describe the image" className={inputClass} />
              </Field>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-hairline p-3">
              <input type="checkbox" checked={form.noindex} onChange={(e) => set("noindex", e.target.checked)} className="mt-0.5 h-[18px] w-[18px] accent-primary" />
              <span>
                <span className="block text-sm font-semibold">Hide from Google</span>
                <span className="block text-sm text-slate-text">Adds noindex and removes the page from the sitemap.{d.noindex ? " This page is hidden by default." : ""}</span>
              </span>
            </label>
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" disabled={!row.override || saving} onClick={() => { setForm(EMPTY); save(EMPTY); }}><RotateCcw size={15} aria-hidden /> Reset to automatic</Button>
              <Button type="submit" variant="primary" loading={saving}>Save page SEO</Button>
            </div>
          </form>
        </Panel>

        <Panel title="SEO score" subtitle="Updates as you type; save to publish">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <ScoreRing score={live.score} size={112} label={`SEO score for ${d.name}`} />
            <div className="min-w-0 grow"><CheckList checks={live.checks} /></div>
          </div>
        </Panel>

        <Panel title="Preview" subtitle="Roughly how this page appears in Google and when shared">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-hairline p-4">
              <p className="truncate text-xs text-slate-text">carhat · {d.path}</p>
              <p className="mt-1 line-clamp-1 text-lg text-[#1a0dab]">{title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-[#4d5156]">{description}</p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-hairline">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin-only preview of any URL */}
              <img src={form.ogImage || "/og-default.jpg"} alt="" className="aspect-[1200/630] w-full bg-mist object-cover" />
              <div className="bg-mist p-3">
                <p className="line-clamp-1 font-semibold text-night">{form.metaTitle || title}</p>
                <p className="line-clamp-1 text-sm text-slate-text">{description}</p>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ─── Site defaults ─────────────────────────────── */
function DefaultsEditor({ initial, onSaved }: { initial: Globals; onSaved: (g: Globals) => void }) {
  const toast = useToast();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Globals>(k: K, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Panel title="Site-wide defaults" subtitle="Used by car listings, blog posts and any page without its own settings">
      <form className="space-y-5" onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        try { await api("/api/admin/seo", { method: "PATCH", body: JSON.stringify({ globals: form }) }); onSaved(form); toast.success("Site defaults saved."); }
        catch (err) { toast.error((err as Error).message); }
        finally { setSaving(false); }
      }}>
        <Field label="Title template" htmlFor="g-template" hint="%s is replaced by the car or post title, e.g. “Used 2018 Toyota Axio for Sale in Dhaka | CarHat BD”.">
          <input id="g-template" value={form.metaTitleTemplate} onChange={(e) => set("metaTitleTemplate", e.target.value)} className={inputClass} />
        </Field>
        <div>
          <div className="flex items-end justify-between gap-2"><label htmlFor="g-desc" className="field-label">Default meta description</label><Meter value={form.metaDescription} min={70} max={158} /></div>
          <textarea id="g-desc" rows={3} value={form.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} className={cn(inputClass, "h-auto py-2")} />
        </div>
        <Field label="Site keywords (comma separated)" htmlFor="g-keywords" hint="Added after each page's own keywords. Empty uses the built-in Bangladesh car keywords.">
          <textarea id="g-keywords" rows={3} value={form.seoKeywords} onChange={(e) => set("seoKeywords", e.target.value)} placeholder="car price in Bangladesh, used car price in Bangladesh, buy car in Bangladesh, sell car in Bangladesh, car bazar BD, …" className={cn(inputClass, "h-auto py-2")} />
        </Field>
        <ImageField id="g-og" label="Default share image" value={form.defaultOgImage} onChange={(v) => set("defaultOgImage", v)} hint="Shown when a page is shared on Facebook or WhatsApp and has no image of its own. Empty uses /og-default.jpg." />
        <div className="flex justify-end"><Button type="submit" variant="primary" loading={saving}>Save defaults</Button></div>
      </form>
    </Panel>
  );
}

/* ─── Customer reviews ──────────────────────────── */
const EMPTY_REVIEW: Testimonial = { name: "", role: "", location: "", rating: 5, content: "", published: true };

function ReviewsEditor({ initial, onSaved }: { initial: Testimonial[]; onSaved: (t: Testimonial[]) => void }) {
  const toast = useToast();
  const [items, setItems] = useState<Testimonial[]>(initial);
  const [saving, setSaving] = useState(false);
  const update = (i: number, patch: Partial<Testimonial>) => setItems((all) => all.map((t, j) => (j === i ? { ...t, ...patch } : t)));
  const move = (i: number, by: number) => setItems((all) => {
    const next = [...all];
    const [item] = next.splice(i, 1);
    next.splice(Math.max(0, Math.min(next.length, i + by)), 0, item);
    return next;
  });

  return (
    <Panel
      title="Homepage reviews carousel"
      subtitle="Quotes from real customers, shown in this order. Buyer reviews of dealers are added after these automatically."
      action={<Button size="sm" onClick={() => setItems((all) => [...all, { ...EMPTY_REVIEW }])}><Plus size={15} aria-hidden /> Add review</Button>}
    >
      <p className="mb-5 flex gap-2 rounded-xl bg-haze px-4 py-3 text-sm text-electric-deep">
        <Sparkles size={16} className="mt-0.5 shrink-0" aria-hidden />
        Only publish reviews customers actually gave you (ask buyers and sellers after a sale, or copy them from your Facebook page) and get their OK to show their name. Made-up reviews mislead buyers and break Google&apos;s rules.
      </p>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-hairline p-8 text-center text-slate-text">No reviews yet: the homepage shows three examples until you add your first one.</p>
      ) : (
        <ol className="space-y-4">
          {items.map((t, i) => (
            <li key={i} className="rounded-2xl border border-hairline p-4">
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_8rem]">
                <Field label="Name" htmlFor={`r-name-${i}`}><input id={`r-name-${i}`} value={t.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="Customer name" className={inputClass} /></Field>
                <Field label="What they did" htmlFor={`r-role-${i}`}><input id={`r-role-${i}`} value={t.role} onChange={(e) => update(i, { role: e.target.value })} placeholder="Bought a Toyota Axio" className={inputClass} /></Field>
                <Field label="City" htmlFor={`r-loc-${i}`}><input id={`r-loc-${i}`} value={t.location} onChange={(e) => update(i, { location: e.target.value })} placeholder="Dhaka" className={inputClass} /></Field>
                <Field label="Rating" htmlFor={`r-rating-${i}`}>
                  <select id={`r-rating-${i}`} value={t.rating} onChange={(e) => update(i, { rating: Number(e.target.value) })} className={inputClass}>
                    {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>)}
                  </select>
                </Field>
              </div>
              <div className="mt-3">
                <Field label="Review" htmlFor={`r-text-${i}`}><textarea id={`r-text-${i}`} rows={2} maxLength={600} value={t.content} onChange={(e) => update(i, { content: e.target.value })} className={cn(inputClass, "h-auto py-2")} /></Field>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" checked={t.published} onChange={(e) => update(i, { published: e.target.checked })} className="h-[18px] w-[18px] accent-primary" />
                  Show on homepage
                  <span className="flex" aria-hidden>{Array.from({ length: t.rating }, (_, s) => <Star key={s} size={13} className="fill-[#ffb800] text-[#ffb800]" />)}</span>
                </label>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp size={15} aria-hidden /></Button>
                  <Button size="sm" variant="ghost" disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown size={15} aria-hidden /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setItems((all) => all.filter((_, j) => j !== i))} aria-label="Delete review"><Trash2 size={15} aria-hidden /></Button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
      <div className="mt-5 flex justify-end">
        <Button variant="primary" loading={saving} onClick={async () => {
          setSaving(true);
          try { await api("/api/admin/seo", { method: "PATCH", body: JSON.stringify({ testimonials: items }) }); onSaved(items); toast.success("Reviews saved. The homepage updates within a minute."); }
          catch (err) { toast.error((err as Error).message); }
          finally { setSaving(false); }
        }}>Save reviews</Button>
      </div>
    </Panel>
  );
}
