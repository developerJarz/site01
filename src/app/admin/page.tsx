"use client";

import { TrafficDashboard } from "@/components/analytics/TrafficDashboard";

import { Fragment, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowDown, ArrowDownRight, ArrowRight, ArrowUp, ArrowUpRight, BadgeCheck, BookOpen, Car, Check, Clock, Download, Eye, FileSearch, FileText, Heart,
  Inbox, Mail, MessageSquare, Palette, RefreshCw, RotateCcw, SearchCheck, ShieldCheck, SlidersHorizontal, Tag, Users, X,
} from "lucide-react";
import { CarImage } from "@/components/CarImage";
import { BarList, ColumnChart, DonutChart, LineChart, Sparkline, SERIES_COLORS } from "@/components/admin/Charts";
import { Button, Modal, Panel, STATUS_LABEL, Switch, api, downloadCsv } from "@/components/admin/ui";
import { useToast } from "@/components/admin/Toast";
import { useAdmin, type DashboardPrefs } from "@/components/admin/AdminContext";
import type { Permission } from "@/lib/permissions";
import { cn, compactNumber, formatLakh, timeAgo } from "@/lib/utils";

/** Dashboard blocks in their default order. Each admin can hide or reorder them (saved to their account). */
const WIDGETS = [
  { key: "shortcuts", label: "Quick actions", description: "Shortcuts to the tools you use most" },
  { key: "traffic", label: "Website traffic", description: "Visitors, views and clicks" },
  { key: "attention", label: "Needs attention", description: "Listings, papers and messages waiting" },
  { key: "kpis", label: "Key numbers", description: "Listings, accounts, chats and more" },
  { key: "activity", label: "Activity & engagement", description: "Daily chart and what buyers did" },
  { key: "queue", label: "Review queue & status", description: "Approve listings without leaving the page" },
  { key: "market", label: "Market", description: "Stock by make, city and price" },
  { key: "people", label: "People", description: "Top sellers, most viewed, newest accounts" },
] as const;
type WidgetKey = (typeof WIDGETS)[number]["key"];

function resolveLayout(prefs?: DashboardPrefs): { order: WidgetKey[]; hidden: WidgetKey[] } {
  const known = WIDGETS.map((w) => w.key) as WidgetKey[];
  const saved = (prefs?.order || []).filter((k): k is WidgetKey => (known as string[]).includes(k));
  return {
    order: [...saved, ...known.filter((k) => !saved.includes(k))],
    hidden: (prefs?.hidden || []).filter((k): k is WidgetKey => (known as string[]).includes(k)),
  };
}

type Series = { date: string; count: number }[];
interface DashboardData {
  days: number;
  stats: {
    totalUsers: number; totalListings: number; activeListings: number; pendingListings: number; soldListings: number; removedListings: number;
    totalViews: number; paperAwaiting: number; inventoryValue: number; avgActivePrice: number; soldValue: number;
    usersInPeriod: number; usersPrevPeriod: number; listingsInPeriod: number; listingsPrevPeriod: number;
    conversationsInPeriod: number; messagesInPeriod: number; savesInPeriod: number; soldInPeriod: number; totalSaves: number;
    subscribers: number; subscribersInPeriod: number; inboxNew: number;
  };
  series: { listings: Series; users: Series; chats: Series };
  makes: { make: string; count: number; avgPrice: number }[];
  cities: { city: string; count: number }[];
  topSellers: { _id: string; name: string; dealer: boolean; live: number; views: number; value: number }[];
  priceBands: { key: string; label: string; count: number }[];
  conditions: { condition: string; count: number }[];
  queue: { _id: string; title: string; price: number; slug: string; createdAt: string; location: string; thumb?: string; docCount: number; sellerName?: string }[];
  topViewed: { _id: string; title: string; price: number; views: number; slug: string; thumb?: string }[];
  recentUsers: { _id: string; name: string; email: string; role: string; createdAt: string; isVerified: boolean }[];
}

const RANGES = [7, 30, 90];
const CONDITION_LABEL: Record<string, string> = { new: "New", used: "Used", reconditioned: "Reconditioned" };
const PRICE_PARAMS: Record<string, string> = { "0": "maxPrice=1000000", "1000000": "minPrice=1000000&maxPrice=2000000", "2000000": "minPrice=2000000&maxPrice=4000000", "4000000": "minPrice=4000000&maxPrice=10000000", top: "minPrice=10000000" };

export default function AdminDashboard() {
  const router = useRouter();
  const toast = useToast();
  const { data: session } = useSession();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [customizing, setCustomizing] = useState(false);
  const { me, loading: meLoading, can } = useAdmin();
  const noDashboard = !meLoading && !!me && !can("dashboard.view");

  const load = useCallback(async (range: number) => {
    setLoading(true);
    setError("");
    try {
      setData(await api<DashboardData>(`/api/admin/stats?days=${range}`));
      setUpdatedAt(new Date());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!noDashboard) void load(days);
  }, [days, load, noDashboard]);

  // Live mode refreshes every 30 seconds while the tab is visible.
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => document.visibilityState === "visible" && void load(days), 30_000);
    return () => clearInterval(t);
  }, [live, days, load]);

  const setStatus = async (id: string, status: "active" | "removed" | "pending", title: string, undo = true) => {
    setBusy(id);
    try {
      await api("/api/admin/listings", { method: "PATCH", body: JSON.stringify({ id, status }) });
      window.dispatchEvent(new Event("admin:counts-changed"));
      await load(days);
      if (undo) {
        toast.success(status === "active" ? `“${title}” is live.` : `“${title}” was rejected.`, { label: "Undo", onClick: () => setStatus(id, "pending", title, false) });
      } else {
        toast.success(`“${title}” is back in the queue.`);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const exportSnapshot = () => {
    if (!data) return;
    const s = data.stats;
    const rows: (string | number)[][] = [
      ["Live listings", s.activeListings], ["Pending review", s.pendingListings], ["Sold (all time)", s.soldListings], ["Removed", s.removedListings],
      ["Inventory value (BDT)", s.inventoryValue], ["Average asking price (BDT)", s.avgActivePrice], ["Total accounts", s.totalUsers],
      [`New listings, last ${data.days} days`, s.listingsInPeriod], [`New accounts, last ${data.days} days`, s.usersInPeriod],
      [`Chats started, last ${data.days} days`, s.conversationsInPeriod], [`Messages sent, last ${data.days} days`, s.messagesInPeriod],
      [`Cars saved, last ${data.days} days`, s.savesInPeriod], [`Marked sold, last ${data.days} days`, s.soldInPeriod],
      ["Newsletter subscribers", s.subscribers], ["Listing views (all time)", s.totalViews],
      ...data.makes.map((m) => [`Make: ${m.make}`, m.count]), ...data.cities.map((c) => [`City: ${c.city}`, c.count]),
    ];
    downloadCsv(`carhat-overview-${new Date().toISOString().slice(0, 10)}.csv`, ["Metric", "Value"], rows);
  };

  // Roles without the dashboard (e.g. a blog writer) get a simple start page with their tools.
  if (noDashboard) {
    return (
      <div className="space-y-6">
        <div>
          <p className="eyebrow">Welcome</p>
          <h1 className="mt-1 text-2xl font-extrabold text-night md:text-[2rem]">Hi{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}</h1>
          <p className="mt-1 text-[15px] text-slate-text">You&apos;re signed in as {me?.roleName}. Here&apos;s what you can work on.</p>
        </div>
        <Shortcuts />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-3xl border border-hairline bg-white p-10 text-center shadow-soft">
        <p className="font-bold">The overview couldn&apos;t load.</p>
        <p className="mt-1 text-slate-text">{error}</p>
        <Button className="mt-4" variant="primary" onClick={() => load(days)}>Try again</Button>
      </div>
    );
  }

  const s = data?.stats;
  const firstName = session?.user?.name?.split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Each block is a widget people can hide or move (Customize); the layout is saved to their account.
  const widgets: Record<WidgetKey, React.ReactNode> = {
    shortcuts: <Shortcuts />,
    traffic: <TrafficDashboard site />,
    attention: (
        <div className="grid gap-3 md:grid-cols-3">
          <ActionCard href="/admin/listings?status=pending" icon={Clock} label="Listings to review" value={s?.pendingListings} tone="warning" cta="Review now" />
          <ActionCard href="/admin/listings?papers=awaiting" icon={FileSearch} label="Car papers to check" value={s?.paperAwaiting} tone="warning" cta="Open papers" />
          <ActionCard href="/admin/inbox?status=new" icon={Inbox} label="New customer messages" value={s?.inboxNew} tone="electric" cta="Open inbox" />
        </div>
    ),
    kpis: (
        <div className={cn("grid grid-cols-2 gap-3 transition-opacity md:grid-cols-4", loading && data && "opacity-60")}>
          {!s || !data ? (
            Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-[136px] rounded-3xl" />)
          ) : (
            <>
              <Kpi icon={Car} label="Live listings" value={s.activeListings} footer={`Worth ${formatLakh(s.inventoryValue)}`} />
              <Kpi icon={Tag} label={`New listings · ${data.days}d`} value={s.listingsInPeriod} delta={[s.listingsInPeriod, s.listingsPrevPeriod]} trend={data.series.listings} color={SERIES_COLORS[0]} />
              <Kpi icon={Users} label={`New accounts · ${data.days}d`} value={s.usersInPeriod} delta={[s.usersInPeriod, s.usersPrevPeriod]} trend={data.series.users} color={SERIES_COLORS[1]} />
              <Kpi icon={MessageSquare} label={`Buyer chats · ${data.days}d`} value={s.conversationsInPeriod} trend={data.series.chats} color={SERIES_COLORS[2]} footer={`${s.messagesInPeriod.toLocaleString("en-IN")} messages`} />
              <Kpi icon={Heart} label={`Cars saved · ${data.days}d`} value={s.savesInPeriod} footer={`${s.totalSaves.toLocaleString("en-IN")} saves in total`} />
              <Kpi icon={BadgeCheck} label={`Marked sold · ${data.days}d`} value={s.soldInPeriod} footer={`${s.soldListings.toLocaleString("en-IN")} sold all time`} />
              <Kpi icon={Mail} label="Newsletter" value={s.subscribers} footer={`+${s.subscribersInPeriod} in ${data.days} days`} />
              <Kpi icon={Eye} label="Listing views" value={s.totalViews} compact footer={`Avg price ${formatLakh(s.avgActivePrice)}`} />
            </>
          )}
        </div>
    ),
    activity: (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Panel title="Daily activity" subtitle={`Last ${days} days`} className="xl:col-span-2">
            {data ? (
              <LineChart series={[
                { name: "New listings", data: data.series.listings },
                { name: "New accounts", data: data.series.users },
                { name: "Buyer chats", data: data.series.chats },
              ]} />
            ) : <div className="skeleton h-[270px] rounded-2xl" />}
          </Panel>

          <Panel title="Engagement" subtitle={`What buyers did in the last ${days} days`}>
            {s ? (
              <>
                <BarList rows={[
                  { label: "Listings added", value: s.listingsInPeriod },
                  { label: "Cars saved", value: s.savesInPeriod },
                  { label: "Chats started", value: s.conversationsInPeriod },
                  { label: "Messages sent", value: s.messagesInPeriod },
                  { label: "Marked sold", value: s.soldInPeriod },
                ]} />
                <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-hairline pt-4 text-sm">
                  <Stat label="Chats per new listing" value={s.listingsInPeriod ? (s.conversationsInPeriod / s.listingsInPeriod).toFixed(1) : "—"} />
                  <Stat label="Sell-through" value={`${s.totalListings ? Math.round((s.soldListings / s.totalListings) * 100) : 0}%`} />
                  <Stat label="Sold value" value={formatLakh(s.soldValue)} />
                  <Stat label="Average asking" value={formatLakh(s.avgActivePrice)} />
                </dl>
              </>
            ) : <div className="skeleton h-[270px] rounded-2xl" />}
          </Panel>
        </div>
    ),
    queue: (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Panel title="Review queue" subtitle="Oldest first" className="xl:col-span-2" flush
            action={<Link href="/admin/listings?status=pending" className="text-sm font-semibold text-electric hover:underline">See all</Link>}>
            {!data ? (
              <div className="space-y-2 p-5">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
            ) : data.queue.length === 0 ? (
              <div className="px-5 pb-10 pt-6 text-center">
                <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-verified-soft text-verified"><Check size={24} aria-hidden /></span>
                <p className="mt-3 font-bold">All caught up</p>
                <p className="text-sm text-slate-text">New listings that need approval will appear here.</p>
              </div>
            ) : (
              <ul className="divide-y divide-hairline">
                {data.queue.map((l) => (
                  <li key={l._id} className="flex flex-wrap items-center gap-3 px-5 py-3 sm:flex-nowrap md:px-6">
                    <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-xl bg-mist"><CarImage src={l.thumb} alt="" sizes="64px" /></div>
                    <div className="min-w-0 grow basis-40">
                      <Link href={`/cars/${l.slug}`} target="_blank" className="block truncate font-bold hover:text-electric">{l.title}</Link>
                      <p className="truncate text-[13px] text-slate-text">{formatLakh(l.price)} · {l.sellerName || "Unknown seller"} · {timeAgo(l.createdAt)}</p>
                    </div>
                    <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", l.docCount > 0 ? "bg-haze text-electric-deep" : "bg-mist text-slate-text")}>
                      <FileText size={13} aria-hidden /> {l.docCount > 0 ? `${l.docCount} ${l.docCount === 1 ? "paper" : "papers"}` : "No papers"}
                    </span>
                    <div className="flex shrink-0 gap-1.5">
                      <Button size="sm" variant="success" loading={busy === l._id} onClick={() => setStatus(l._id, "active", l.title)}><Check size={15} aria-hidden /> Approve</Button>
                      <Button size="sm" onClick={() => setStatus(l._id, "removed", l.title)} disabled={busy === l._id} aria-label={`Reject ${l.title}`}><X size={15} aria-hidden /> Reject</Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Listings by status" subtitle="Click a bar to open the list">
            {s ? (
              <BarList onSelect={(r) => router.push(`/admin/listings?status=${r.key}`)} rows={[
                { key: "active", label: STATUS_LABEL.active, value: s.activeListings },
                { key: "pending", label: STATUS_LABEL.pending, value: s.pendingListings },
                { key: "sold", label: STATUS_LABEL.sold, value: s.soldListings },
                { key: "removed", label: STATUS_LABEL.removed, value: s.removedListings },
              ]} />
            ) : <div className="skeleton h-40 rounded-2xl" />}
            {data && data.conditions.length > 0 && (
              <>
                <h3 className="mt-6 border-t border-hairline pt-4 text-sm font-bold">Live stock by condition</h3>
                <div className="mt-3">
                  <DonutChart centerLabel="live cars" rows={data.conditions.map((c) => ({ label: CONDITION_LABEL[c.condition] || c.condition, value: c.count }))} />
                </div>
              </>
            )}
          </Panel>
        </div>
    ),
    market: (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel title="Live stock by make" subtitle="Hover for the average asking price">
            {data ? (
              <BarList rows={data.makes.map((m) => ({ label: m.make, value: m.count, key: m.make }))}
                detail={(r) => { const m = data.makes.find((x) => x.make === r.label); return m ? `avg ${formatLakh(m.avgPrice)}` : undefined; }}
                onSelect={(r) => router.push(`/admin/listings?q=${encodeURIComponent(r.label)}`)} />
            ) : <div className="skeleton h-[270px] rounded-2xl" />}
          </Panel>
          <Panel title="Live stock by city">
            {data ? (
              <BarList color={SERIES_COLORS[1]} rows={data.cities.map((c) => ({ label: c.city, value: c.count }))}
                onSelect={(r) => router.push(`/admin/listings?q=${encodeURIComponent(r.label)}`)} />
            ) : <div className="skeleton h-[270px] rounded-2xl" />}
          </Panel>
          <Panel title="Asking prices" subtitle="Live listings by budget band">
            {data ? (
              <ColumnChart height={280} rows={data.priceBands.map((b) => ({ label: b.label, value: b.count, key: b.key }))}
                onSelect={(r) => window.open(`/cars?${PRICE_PARAMS[r.key || "0"]}`, "_blank")} />
            ) : <div className="skeleton h-[270px] rounded-2xl" />}
          </Panel>
        </div>
    ),
    people: (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Panel title="Top sellers" subtitle="By live listings" flush action={<Link href="/admin/users?role=dealer" className="text-sm font-semibold text-electric hover:underline">Dealers</Link>}>
            {data && (
              data.topSellers.length === 0 ? <p className="px-6 pb-6 text-sm text-slate-text">No live listings yet.</p> : (
                <ul className="divide-y divide-hairline">
                  {data.topSellers.map((u) => (
                    <li key={u._id} className="flex items-center gap-3 px-5 py-3 md:px-6">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-haze text-sm font-bold text-electric-deep" aria-hidden>{u.name[0]?.toUpperCase()}</span>
                      <div className="min-w-0 grow">
                        <Link href={`/cars?seller=${u._id}`} target="_blank" className="block truncate font-bold hover:text-electric">{u.name}</Link>
                        <p className="text-[13px] text-slate-text">{u.dealer ? "Dealer" : "Private seller"} · {compactNumber(u.views)} views</p>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold tabular">{u.live}</p>
                        <p className="text-[11px] text-slate-text">live</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )
            )}
          </Panel>

          <Panel title="Most viewed" flush>
            {data && (
              <ol className="divide-y divide-hairline">
                {data.topViewed.map((l, i) => (
                  <li key={l._id} className="flex items-center gap-3 px-5 py-3 md:px-6">
                    <span className="w-5 text-sm font-bold text-slate-text tabular">{i + 1}</span>
                    <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-mist"><CarImage src={l.thumb} alt="" sizes="56px" /></div>
                    <div className="min-w-0 grow">
                      <Link href={`/cars/${l.slug}`} target="_blank" className="block truncate text-sm font-bold hover:text-electric">{l.title}</Link>
                      <p className="text-[13px] text-slate-text tabular">{formatLakh(l.price)}</p>
                    </div>
                    <span className="shrink-0 text-[13px] text-slate-text tabular"><Eye size={13} className="mr-1 inline" aria-hidden />{l.views.toLocaleString("en-IN")}</span>
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          <Panel title="Newest accounts" flush action={<Link href="/admin/users" className="text-sm font-semibold text-electric hover:underline">All users</Link>}>
            {data && (
              <ul className="divide-y divide-hairline">
                {data.recentUsers.map((u) => (
                  <li key={u._id} className="flex items-center gap-3 px-5 py-3 md:px-6">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-mist text-sm font-bold text-night" aria-hidden>{u.name?.[0]?.toUpperCase() || "?"}</span>
                    <div className="min-w-0 grow">
                      <p className="truncate text-sm font-bold">{u.name}</p>
                      <p className="truncate text-[13px] text-slate-text">{u.email}</p>
                    </div>
                    <div className="shrink-0 text-right text-[13px]">
                      <p className="font-semibold capitalize">{u.role}</p>
                      <p className="text-slate-text">{timeAgo(u.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
    ),
  };
  const layout = resolveLayout(me?.prefs.dashboard);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Control centre</p>
          <h1 className="mt-1 text-2xl font-extrabold text-night md:text-[2rem]">{greeting}{firstName ? `, ${firstName}` : ""}</h1>
          <p className="mt-1 text-[15px] text-slate-text">
            {s ? <>{s.totalListings.toLocaleString("en-IN")} listings and {s.totalUsers.toLocaleString("en-IN")} accounts. </> : "Loading marketplace figures… "}
            {updatedAt && <span className="tabular">Updated {updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Date range" className="flex rounded-2xl bg-mist p-1">
            {RANGES.map((r) => (
              <button key={r} type="button" aria-pressed={days === r} onClick={() => setDays(r)}
                className={cn("h-9 rounded-xl px-3 text-[13px] font-semibold transition-colors", days === r ? "bg-white text-night shadow-soft" : "text-slate-text hover:text-night")}>
                {r} days
              </button>
            ))}
          </div>
          <button type="button" role="switch" aria-checked={live} onClick={() => setLive((v) => !v)}
            className={cn("inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-[13px] font-semibold transition-colors",
              live ? "border-verified/30 bg-verified-soft text-verified" : "border-hairline bg-white text-slate-text hover:text-night")}>
            <span className={cn("size-2 rounded-full", live ? "animate-pulse bg-verified" : "bg-[#cbd5e1]")} aria-hidden /> Live
          </button>
          <Button onClick={() => load(days)} aria-label="Refresh" disabled={loading}><RefreshCw size={16} className={loading ? "animate-spin" : ""} aria-hidden /></Button>
          <Button onClick={exportSnapshot} disabled={!data}><Download size={16} aria-hidden /> Export</Button>
          <Button onClick={() => setCustomizing(true)}><SlidersHorizontal size={16} aria-hidden /> Customize</Button>
        </div>
      </div>

      {layout.order.filter((k) => !layout.hidden.includes(k)).map((k) => <Fragment key={k}>{widgets[k]}</Fragment>)}
      {layout.hidden.length === WIDGETS.length && (
        <div className="rounded-3xl border border-dashed border-hairline bg-white p-10 text-center">
          <p className="font-bold">Every widget is hidden</p>
          <Button className="mt-4" onClick={() => setCustomizing(true)}><SlidersHorizontal size={16} aria-hidden /> Customize dashboard</Button>
        </div>
      )}
      {customizing && <CustomizeDashboard layout={layout} onClose={() => setCustomizing(false)} />}
    </div>
  );
}

const SHORTCUTS: { href: string; label: string; hint: string; icon: typeof Car; anyOf: Permission[] }[] = [
  { href: "/admin/listings?status=pending", label: "Review listings", hint: "Approve or reject new cars", icon: Clock, anyOf: ["listings.manage"] },
  { href: "/admin/listings?papers=awaiting", label: "Check papers", hint: "Give the Paper Verified badge", icon: FileSearch, anyOf: ["papers.verify"] },
  { href: "/admin/users", label: "Manage users", hint: "Verify, suspend or add people", icon: Users, anyOf: ["users.view"] },
  { href: "/admin/inbox", label: "Customer inbox", hint: "Answer messages", icon: Inbox, anyOf: ["inbox.manage"] },
  { href: "/admin/blogs", label: "Write a post", hint: "Guides and news for the blog", icon: BookOpen, anyOf: ["blogs.manage"] },
  { href: "/admin/seo", label: "SEO health", hint: "Scores and fixes for every page", icon: SearchCheck, anyOf: ["seo.manage"] },
  { href: "/admin/appearance", label: "Website builder", hint: "Header, homepage, footer, colours", icon: Palette, anyOf: ["appearance.manage"] },
  { href: "/admin/roles", label: "Roles & access", hint: "Who on the team can do what", icon: ShieldCheck, anyOf: ["roles.manage"] },
];

/** One-click links to the tools this person's role can use. */
function Shortcuts() {
  const { can } = useAdmin();
  const items = SHORTCUTS.filter((s) => can(...s.anyOf));
  if (items.length === 0) return null;
  return (
    <nav aria-label="Quick actions" className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.slice(0, 8).map(({ href, label, hint, icon: Icon }) => (
        <Link key={href} href={href} className="group flex items-center gap-3 rounded-2xl border border-hairline bg-white p-3.5 shadow-soft transition-[border-color,box-shadow] hover:border-electric/30 hover:shadow-float">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-haze text-electric transition-colors group-hover:bg-electric group-hover:text-white"><Icon size={18} aria-hidden /></span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-night">{label}</span>
            <span className="hidden truncate text-xs text-slate-text sm:block">{hint}</span>
          </span>
        </Link>
      ))}
    </nav>
  );
}

/** Show, hide and reorder dashboard widgets; saved to the person's account so it follows them across devices. */
function CustomizeDashboard({ layout, onClose }: { layout: { order: WidgetKey[]; hidden: WidgetKey[] }; onClose: () => void }) {
  const { saveDashboardPrefs } = useAdmin();
  const toast = useToast();
  const [order, setOrder] = useState(layout.order);
  const [hidden, setHidden] = useState<WidgetKey[]>(layout.hidden);
  const [saving, setSaving] = useState(false);
  const move = (i: number, by: number) => setOrder((o) => {
    const next = [...o];
    const [k] = next.splice(i, 1);
    next.splice(Math.max(0, Math.min(next.length, i + by)), 0, k);
    return next;
  });
  const save = async (prefs: DashboardPrefs) => {
    setSaving(true);
    try { await saveDashboardPrefs(prefs); toast.success("Dashboard layout saved."); onClose(); }
    catch (e) { toast.error((e as Error).message); }
    finally { setSaving(false); }
  };
  return (
    <Modal open onClose={onClose} title="Customize your dashboard" description="Choose which blocks you see and in what order. Only your view changes."
      footer={
        <>
          <Button variant="ghost" onClick={() => save({ order: [], hidden: [] })} disabled={saving}><RotateCcw size={15} aria-hidden /> Reset</Button>
          <span className="grow" />
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={() => save({ order, hidden })}>Save layout</Button>
        </>
      }>
      <ol className="space-y-2">
        {order.map((key, i) => {
          const w = WIDGETS.find((x) => x.key === key)!;
          const shown = !hidden.includes(key);
          return (
            <li key={key} className={cn("flex items-center gap-3 rounded-2xl border border-hairline px-3 py-2.5", !shown && "bg-mist/60")}>
              <div className={cn("min-w-0 grow", !shown && "opacity-60")}>
                <p className="truncate text-sm font-semibold text-night">{w.label}</p>
                <p className="truncate text-xs text-slate-text">{w.description}</p>
              </div>
              <Switch checked={shown} label={`Show ${w.label}`} onChange={(v) => setHidden((h) => (v ? h.filter((k) => k !== key) : [...h, key]))} />
              <div className="flex shrink-0">
                <Button size="sm" variant="ghost" className="px-2" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${w.label} up`}><ArrowUp size={15} aria-hidden /></Button>
                <Button size="sm" variant="ghost" className="px-2" disabled={i === order.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${w.label} down`}><ArrowDown size={15} aria-hidden /></Button>
              </div>
            </li>
          );
        })}
      </ol>
    </Modal>
  );
}

function ActionCard({ href, icon: Icon, label, value, tone, cta }: { href: string; icon: typeof Car; label: string; value?: number; tone: "warning" | "electric"; cta: string }) {
  const hot = (value || 0) > 0;
  return (
    <Link href={href} className={cn("group flex items-center gap-4 rounded-3xl border p-5 shadow-soft transition-[border-color,box-shadow] hover:shadow-float",
      hot ? (tone === "warning" ? "border-warning/25 bg-warning-soft/50" : "border-electric/25 bg-haze/60") : "border-hairline bg-white")}>
      <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl",
        hot ? (tone === "warning" ? "bg-white text-warning" : "bg-white text-electric") : "bg-mist text-slate-text")}>
        <Icon size={22} aria-hidden />
      </span>
      <span className="min-w-0 grow">
        <span className="block text-2xl font-extrabold leading-none text-night tabular">{value ?? "–"}</span>
        <span className="mt-1 block text-sm font-medium text-slate-text">{label}</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-electric">
        <span className="hidden sm:inline">{hot ? cta : "View"}</span> <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  );
}

function Kpi({ icon: Icon, label, value, delta, trend, color, footer, compact }: {
  icon: typeof Car; label: string; value: number; delta?: [number, number]; trend?: Series; color?: string; footer?: string; compact?: boolean;
}) {
  let deltaEl: React.ReactNode = null;
  if (delta) {
    const [now, prev] = delta;
    if (prev === 0) {
      deltaEl = <span className="text-slate-text">{now > 0 ? "None in the previous period" : "No change"}</span>;
    } else {
      const pct = Math.round(((now - prev) / prev) * 100);
      const up = pct >= 0;
      deltaEl = (
        <span className={cn("inline-flex items-center gap-0.5 font-semibold", up ? "text-verified" : "text-destructive")}>
          {up ? <ArrowUpRight size={15} aria-hidden /> : <ArrowDownRight size={15} aria-hidden />}
          {up ? "+" : ""}{pct}% <span className="font-normal text-slate-text">vs previous</span>
        </span>
      );
    }
  }
  return (
    <div className="flex flex-col rounded-3xl border border-hairline bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-slate-text"><Icon size={16} className="text-electric" aria-hidden /> {label}</p>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <p className="text-[1.9rem] font-extrabold leading-none text-night tabular">{compact ? compactNumber(value) : value.toLocaleString("en-IN")}</p>
        {trend && <Sparkline values={trend.map((d) => d.count)} color={color} />}
      </div>
      <div className="mt-auto pt-3 text-[13px]">{deltaEl || <span className="text-slate-text">{footer}</span>}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[13px] text-slate-text">{label}</dt>
      <dd className="mt-0.5 text-base font-extrabold tabular">{value}</dd>
    </div>
  );
}
