"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageLoader } from "@/components/ui/brand-loader";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  AlertCircle, ArrowRight, BadgeCheck, Car, ChartNoAxesColumn, CheckCircle2, Clock, Eye, Heart, Loader2, MessageSquare, Pencil,
  Plus, RotateCcw, Search, ShieldCheck, ShieldHalf, Tag, Trash2, UserRound,
} from "lucide-react";
import { CarImage } from "@/components/CarImage";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, CONTAINER, EmptyState } from "@/components/ui/page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrafficDashboard } from "@/components/analytics/TrafficDashboard";
import { useMarketplace } from "@/context/MarketplaceContext";
import { useUnreadCount } from "@/components/layout/useUnreadCount";
import { cn, formatLakh, formatTaka, timeAgo } from "@/lib/utils";
import { isStaffRole } from "@/lib/permissions";
import { ContactNumbersPrompt } from "@/components/ContactNumbersPrompt";

interface MyListing {
  _id: string;
  title: string;
  slug: string;
  price: number;
  status: "active" | "pending" | "sold" | "removed";
  views: number;
  images: string[];
  createdAt: string;
  location?: string;
  paperVerified: boolean;
  hasDocuments: boolean;
  chats: number;
  saves: number;
}

interface DashboardSummary {
  user?: { isVerified?: boolean; phone?: string; city?: string };
  profileCompleteness: number;
  favoritesCount: number;
}

const STATUS: Record<MyListing["status"], { label: string; cls: string }> = {
  active: { label: "Live", cls: "bg-verified-soft text-verified" },
  pending: { label: "In review", cls: "bg-warning-soft text-warning" },
  sold: { label: "Sold", cls: "bg-haze text-electric-deep" },
  removed: { label: "Removed", cls: "bg-danger-soft text-destructive" },
};
const TABS = [
  { value: "all", label: "All" },
  { value: "active", label: "Live" },
  { value: "pending", label: "In review" },
  { value: "sold", label: "Sold" },
] as const;
type Tab = (typeof TABS)[number]["value"];
type View = "performance" | "listings";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { openPanel, favoriteIds } = useMarketplace();
  const unread = useUnreadCount(status === "authenticated");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [listings, setListings] = useState<MyListing[] | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<MyListing | null>(null);
  const [deleting, setDeleting] = useState<MyListing | null>(null);
  // Sellers land on their numbers; people with nothing posted land on the listings tab's call to action.
  const [chosenView, setView] = useState<View | null>(null);
  const view: View = chosenView ?? (listings && listings.length === 0 ? "listings" : "performance");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?callbackUrl=%2Fdashboard");
  }, [status, router]);

  const load = useCallback(async () => {
    setError("");
    try {
      const [s, l] = await Promise.all([fetch("/api/dashboard"), fetch("/api/my-listings", { cache: "no-store" })]);
      const [sd, ld] = await Promise.all([s.json(), l.json()]);
      if (!l.ok) throw new Error(ld.error || "Couldn't load your listings.");
      setSummary(s.ok ? sd : null);
      setListings(ld.listings || []);
    } catch (e) {
      setError((e as Error).message);
      setListings((x) => x ?? []);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") void load();
  }, [status, load]);

  const act = async (listing: MyListing, body: Record<string, unknown>, message: string) => {
    setBusy(listing._id);
    setError("");
    try {
      const res = await fetch("/api/my-listings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: listing._id, ...body }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't update the listing.");
      setListings((all) => all?.map((l) => (l._id === listing._id ? { ...l, status: data.status, price: data.price } : l)) || null);
      setNotice(message);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(null);
    }
  };

  const remove = async (listing: MyListing) => {
    setBusy(listing._id);
    try {
      const res = await fetch(`/api/my-listings?id=${listing._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't delete the listing.");
      setListings((all) => all?.filter((l) => l._id !== listing._id) || null);
      setNotice(`“${listing.title}” was deleted.`);
      setDeleting(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const counts = useMemo(() => {
    const c = { all: 0, active: 0, pending: 0, sold: 0, removed: 0, views: 0, chats: 0, saves: 0 };
    for (const l of listings || []) {
      c.all++;
      c[l.status]++;
      c.views += l.views;
      c.chats += l.chats;
      c.saves += l.saves;
    }
    return c;
  }, [listings]);

  if (status !== "authenticated" || !session?.user) {
    return <PageLoader />;
  }

  const user = session.user as { name?: string | null; email?: string | null; role?: string };
  const role = user.role || "buyer";
  const shown = (listings || []).filter((l) => tab === "all" || l.status === tab);

  return (
    <>
      <section className="hero-backdrop relative overflow-hidden border-b border-hairline">
        <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden />
        <div className={cn(CONTAINER, "relative flex flex-col gap-5 py-7 md:flex-row md:items-center md:justify-between md:py-8")}>
          <div className="flex items-center gap-4">
            <UserAvatar src={session?.user?.image} name={user.name} size={64} className="rounded-2xl text-2xl shadow-glow" />
            <div className="min-w-0">
              <p className="eyebrow">My dashboard</p>
              <h1 className="mt-1 truncate text-3xl font-extrabold text-night md:text-4xl">Welcome back, {user.name?.split(" ")[0] || "there"}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-text">
                <span className="truncate">{user.email}</span>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold capitalize text-night shadow-soft">{role}</span>
                {summary?.user?.isVerified && <span className="inline-flex items-center gap-1 text-xs font-bold text-electric"><BadgeCheck size={14} aria-hidden /> Verified</span>}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {isStaffRole(role) && <Button asChild variant="secondary"><Link href="/admin"><ShieldHalf size={16} aria-hidden /> Admin panel</Link></Button>}
            <Button asChild variant="secondary"><Link href="/profile"><UserRound size={16} aria-hidden /> Profile</Link></Button>
            <Button asChild><Link href="/sell"><Plus size={17} aria-hidden /> Post a car</Link></Button>
          </div>
        </div>
      </section>

      <div className={cn(CONTAINER, "space-y-8 py-8 md:py-10")}>
        <ContactNumbersPrompt />
        {summary && summary.profileCompleteness < 100 && (
          <div className="flex flex-col gap-4 rounded-3xl border border-warning/20 bg-warning-soft/60 p-5 sm:flex-row sm:items-center">
            <AlertCircle size={22} className="shrink-0 text-warning" aria-hidden />
            <div className="grow">
              <p className="font-bold text-night">Your profile is {summary.profileCompleteness}% complete</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white" role="progressbar" aria-valuenow={summary.profileCompleteness} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completeness">
                <div className="h-full rounded-full bg-warning" style={{ width: `${summary.profileCompleteness}%` }} />
              </div>
              <p className="mt-2 text-sm text-slate-text">Add your phone, city and a short bio so buyers know who they&apos;re talking to.</p>
            </div>
            <Button asChild variant="secondary" className="shrink-0"><Link href="/profile">Complete profile</Link></Button>
          </div>
        )}

        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" aria-label="Your numbers">
          <Stat icon={CheckCircle2} label="Live listings" value={counts.active} tone="text-verified" />
          <Stat icon={Clock} label="In review" value={counts.pending} tone="text-warning" />
          <Stat icon={Tag} label="Sold" value={counts.sold} />
          <Stat icon={Eye} label="Listing views" value={counts.views} />
          <Stat icon={MessageSquare} label="Buyer chats" value={counts.chats} href="/dashboard/messages" badge={unread ? `${unread} unread` : undefined} />
          <Stat icon={Heart} label="Cars I saved" value={favoriteIds.length || summary?.favoritesCount || 0} onClick={() => openPanel("saved")} />
        </ul>

        {notice && <Alert tone="success">{notice}</Alert>}
        {error && <Alert>{error}</Alert>}

        <Tabs value={view} onValueChange={(v) => setView(v as View)} className="gap-6">
          <TabsList aria-label="Dashboard sections">
            <TabsTrigger value="performance"><ChartNoAxesColumn aria-hidden /> Performance</TabsTrigger>
            <TabsTrigger value="listings"><Car aria-hidden /> My listings <span className="tabular text-slate-text">{counts.all}</span></TabsTrigger>
          </TabsList>

          <TabsContent value="performance">
            {listings && listings.length === 0 ? (
              <EmptyState icon={ChartNoAxesColumn} title="Post a car to see its traffic"
                body="Once your listing is live you'll see impressions, clicks, views and visitors for every car, with a graph for each one."
                action={<Button asChild><Link href="/sell"><Plus size={16} aria-hidden /> Post a car</Link></Button>} />
            ) : <TrafficDashboard />}
          </TabsContent>

          <TabsContent value="listings">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section aria-labelledby="listings-heading" className="min-w-0 rounded-3xl border border-hairline bg-white shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-4 md:px-6">
              <h2 id="listings-heading" className="text-lg font-extrabold">My listings</h2>
              <div role="tablist" aria-label="Filter listings" className="flex rounded-2xl bg-mist p-1">
                {TABS.map((t) => (
                  <button key={t.value} role="tab" aria-selected={tab === t.value} onClick={() => setTab(t.value)}
                    className={cn("h-9 rounded-xl px-3 text-[13px] font-semibold transition-colors", tab === t.value ? "bg-white text-night shadow-soft" : "text-slate-text hover:text-night")}>
                    {t.label} <span className="tabular text-slate-text">{counts[t.value]}</span>
                  </button>
                ))}
              </div>
            </div>

            {listings === null ? (
              <div className="space-y-3 p-5">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
            ) : shown.length === 0 ? (
              <EmptyState className="m-5 border-none" icon={Car}
                title={listings.length === 0 ? "You haven't posted a car yet" : "Nothing here"}
                body={listings.length === 0 ? "Post your car in about five minutes and start getting messages from buyers." : "No listings with this status."}
                action={listings.length === 0 ? <Button asChild><Link href="/sell"><Plus size={16} aria-hidden /> Post a car</Link></Button> : undefined} />
            ) : (
              <ul className="divide-y divide-hairline">
                {shown.map((l) => (
                  <li key={l._id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center md:px-6">
                    <Link href={`/cars/${l.slug}`} className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-2xl bg-mist sm:w-32">
                      <CarImage src={l.images[0]} alt={l.title} sizes="(min-width: 640px) 128px, 92vw" />
                    </Link>
                    <div className="min-w-0 grow">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", STATUS[l.status].cls)}>{STATUS[l.status].label}</span>
                        {l.paperVerified ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-verified"><ShieldCheck size={13} aria-hidden /> Paper Verified</span>
                        ) : l.hasDocuments ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-warning"><Clock size={13} aria-hidden /> Papers in review</span>
                        ) : null}
                      </div>
                      <Link href={`/cars/${l.slug}`} className="mt-1.5 block truncate font-bold text-night hover:text-electric">{l.title}</Link>
                      <p className="price-tag mt-0.5 text-lg text-electric" title={formatTaka(l.price)}>{formatLakh(l.price)}</p>
                      <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-slate-text tabular">
                        <span className="inline-flex items-center gap-1"><Eye size={13} aria-hidden /> {l.views.toLocaleString("en-IN")} views</span>
                        <span className="inline-flex items-center gap-1"><Heart size={13} aria-hidden /> {l.saves} saves</span>
                        <span className="inline-flex items-center gap-1"><MessageSquare size={13} aria-hidden /> {l.chats} chats</span>
                        <span>Posted {timeAgo(l.createdAt)}</span>
                      </p>
                      {l.status === "removed" && <p className="mt-1 text-[13px] text-destructive">The CarHat team removed this listing. Contact support if you think this was a mistake.</p>}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-1.5 sm:flex-col sm:items-stretch">
                      {l.status === "active" && (
                        <Button size="sm" variant="secondary" disabled={busy === l._id} onClick={() => act(l, { action: "sold" }, `Marked “${l.title}” as sold. Congratulations!`)}>
                          <Tag size={14} aria-hidden /> Mark sold
                        </Button>
                      )}
                      {l.status === "sold" && (
                        <Button size="sm" variant="secondary" disabled={busy === l._id} onClick={() => act(l, { action: "relist" }, `“${l.title}” is back on sale.`)}>
                          <RotateCcw size={14} aria-hidden /> Relist
                        </Button>
                      )}
                      {l.status !== "removed" && (
                        <Button size="sm" variant="ghost" onClick={() => setEditing(l)}><Pencil size={14} aria-hidden /> Price</Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => setDeleting(l)} className="hover:bg-danger-soft hover:text-destructive"><Trash2 size={14} aria-hidden /> Delete</Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-hairline bg-white p-5 shadow-soft">
              <h2 className="text-base font-bold">Shortcuts</h2>
              <ul className="mt-3 space-y-1">
                <Shortcut href="/dashboard/messages" icon={MessageSquare} label="Messages" hint={unread ? `${unread} unread` : undefined} />
                <Shortcut onClick={() => openPanel("saved")} icon={Heart} label="Saved cars" hint={favoriteIds.length ? String(favoriteIds.length) : undefined} />
                <Shortcut href="/cars" icon={Search} label="Browse cars" />
                <Shortcut href="/profile" icon={UserRound} label="Profile and contact settings" />
              </ul>
            </div>
            <div className="rounded-3xl border border-hairline bg-gradient-to-br from-mist via-white to-haze p-5">
              <ShieldCheck size={24} className="text-electric" aria-hidden />
              <h2 className="mt-3 text-base font-bold">Get the Paper Verified badge</h2>
              <p className="mt-1 text-sm text-slate-text">Upload your registration, tax token and fitness papers when you post. Checked listings get more calls.</p>
              <Link href="/sell" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-electric hover:underline">Post with papers <ArrowRight size={14} aria-hidden /></Link>
            </div>
          </aside>
        </div>
          </TabsContent>
        </Tabs>
      </div>

      <PriceDialog listing={editing} onClose={() => setEditing(null)}
        onSave={async (l, price) => (await act(l, { action: "price", price }, `Price updated to ${formatLakh(price)}.`)) && setEditing(null)} />

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="w-[min(28rem,calc(100vw-2rem))]">
          <DialogHeader>
            <DialogTitle>Delete this listing?</DialogTitle>
            <DialogDescription>“{deleting?.title}” and its buyer chats will be removed for good. If you sold the car, mark it sold instead.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 p-5">
            <Button variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button className="bg-destructive shadow-none hover:bg-[#b91c1c]" disabled={busy === deleting?._id} onClick={() => deleting && remove(deleting)}>
              {busy === deleting?._id && <Loader2 size={16} className="animate-spin" aria-hidden />} Delete listing
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Stat({ icon: Icon, label, value, tone, href, onClick, badge }: {
  icon: typeof Car; label: string; value: number; tone?: string; href?: string; onClick?: () => void; badge?: string;
}) {
  const body = (
    <>
      <span className="flex items-center justify-between">
        <Icon size={20} className={tone || "text-electric"} aria-hidden />
        {badge && <span className="rounded-full bg-electric px-2 py-0.5 text-[11px] font-bold text-white">{badge}</span>}
      </span>
      <span className="mt-4 block text-[1.75rem] font-extrabold leading-none text-night tabular">{value.toLocaleString("en-IN")}</span>
      <span className="mt-1.5 block text-[13px] font-medium text-slate-text">{label}</span>
    </>
  );
  const cls = "block h-full rounded-3xl border border-hairline bg-white p-5 text-left shadow-soft transition-[border-color,box-shadow] hover:border-electric/20 hover:shadow-float";
  return (
    <li>
      {href ? <Link href={href} className={cls}>{body}</Link> : onClick ? <button type="button" onClick={onClick} className={cn(cls, "w-full")}>{body}</button> : <div className={cls}>{body}</div>}
    </li>
  );
}

function Shortcut({ href, onClick, icon: Icon, label, hint }: { href?: string; onClick?: () => void; icon: typeof Car; label: string; hint?: string }) {
  const inner = (
    <>
      <span className="flex size-9 items-center justify-center rounded-xl bg-haze text-electric"><Icon size={17} aria-hidden /></span>
      <span className="grow text-left text-sm font-semibold">{label}</span>
      {hint && <span className="rounded-full bg-electric px-2 py-0.5 text-[11px] font-bold text-white tabular">{hint}</span>}
    </>
  );
  const cls = "flex w-full items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-mist";
  return <li>{href ? <Link href={href} className={cls}>{inner}</Link> : <button type="button" onClick={onClick} className={cls}>{inner}</button>}</li>;
}

function PriceDialog({ listing, onClose, onSave }: { listing: MyListing | null; onClose: () => void; onSave: (l: MyListing, price: number) => void }) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => setValue(listing ? String(listing.price) : ""), [listing]);
  const price = Number(value);
  return (
    <Dialog open={!!listing} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[min(28rem,calc(100vw-2rem))]">
        <DialogHeader>
          <DialogTitle>Change the price</DialogTitle>
          <DialogDescription>{listing?.title}</DialogDescription>
        </DialogHeader>
        <form className="p-6" onSubmit={async (e) => {
          e.preventDefault();
          if (!listing) return;
          setSaving(true);
          await onSave(listing, price);
          setSaving(false);
        }}>
          <label htmlFor="new-price" className="field-label">Asking price (৳)</label>
          <input id="new-price" type="number" inputMode="numeric" min={10000} className="field" value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
          <p className="mt-1.5 text-[13px] font-semibold text-electric tabular" aria-live="polite">{price > 0 ? formatLakh(price) : ""}</p>
          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving || !(price >= 10000)}>{saving && <Loader2 size={16} className="animate-spin" aria-hidden />} Save price</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
