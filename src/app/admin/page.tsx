"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDownRight, ArrowUpRight, Check, Eye, FileText, RefreshCw, X } from "lucide-react";
import { CarImage } from "@/components/CarImage";
import { BarList, LineChart, Sparkline, SERIES_COLORS } from "@/components/admin/Charts";
import { Button, PageHeader, STATUS_LABEL, api } from "@/components/admin/ui";
import { useToast } from "@/components/admin/Toast";
import { cn, compactNumber, formatLakh, timeAgo } from "@/lib/utils";

interface DashboardData {
  days: number;
  stats: {
    totalUsers: number;
    totalListings: number;
    activeListings: number;
    pendingListings: number;
    soldListings: number;
    removedListings: number;
    totalViews: number;
    paperAwaiting: number;
    inventoryValue: number;
    avgActivePrice: number;
    soldValue: number;
    usersInPeriod: number;
    usersPrevPeriod: number;
    listingsInPeriod: number;
    listingsPrevPeriod: number;
    conversationsInPeriod: number;
    messagesInPeriod: number;
  };
  series: { listings: { date: string; count: number }[]; users: { date: string; count: number }[] };
  makes: { make: string; count: number; avgPrice: number }[];
  queue: { _id: string; title: string; price: number; slug: string; createdAt: string; location: string; thumb?: string; docCount: number; sellerName?: string }[];
  topViewed: { _id: string; title: string; price: number; views: number; slug: string; thumb?: string }[];
  recentUsers: { _id: string; name: string; email: string; role: string; createdAt: string; isVerified: boolean }[];
}

const RANGES = [7, 30, 90];

export default function AdminDashboard() {
  const router = useRouter();
  const toast = useToast();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async (range: number) => {
    setLoading(true);
    setError("");
    try {
      setData(await api<DashboardData>(`/api/admin/stats?days=${range}`));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(days);
  }, [days, load]);

  const setStatus = async (id: string, status: "active" | "removed" | "pending", title: string, undo = true) => {
    setBusy(id);
    try {
      await api("/api/admin/listings", { method: "PATCH", body: JSON.stringify({ id, status }) });
      window.dispatchEvent(new Event("admin:counts-changed"));
      await load(days);
      if (undo) {
        toast.success(status === "active" ? `“${title}” is live.` : `“${title}” was rejected.`, {
          label: "Undo",
          onClick: () => setStatus(id, "pending", title, false),
        });
      } else {
        toast.success(`“${title}” is back in the queue.`);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  if (error && !data) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center">
        <p className="font-semibold">The overview couldn&apos;t load.</p>
        <p className="mt-1 text-muted-foreground">{error}</p>
        <Button className="mt-4" variant="primary" onClick={() => load(days)}>Try again</Button>
      </div>
    );
  }

  const s = data?.stats;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description={s ? `${s.totalListings.toLocaleString("en-IN")} listings and ${s.totalUsers.toLocaleString("en-IN")} accounts on CarHat` : "Loading marketplace figures…"}
        actions={
          <>
            <div role="group" aria-label="Date range" className="flex rounded-lg border border-input bg-card p-0.5">
              {RANGES.map((r) => (
                <button
                  key={r}
                  aria-pressed={days === r}
                  onClick={() => setDays(r)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-semibold transition-colors",
                    days === r ? "bg-ink text-white" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {r} days
                </button>
              ))}
            </div>
            <Button size="md" onClick={() => load(days)} aria-label="Refresh" disabled={loading}>
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </Button>
          </>
        }
      />

      {/* ─── Stat tiles ─── */}
      <div className={cn("grid grid-cols-2 gap-3 transition-opacity md:grid-cols-3 xl:grid-cols-6", loading && data && "opacity-60")}>
        {!s ? (
          Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-[118px] rounded-xl" />)
        ) : (
          <>
            <Tile
              label="Waiting for review"
              value={s.pendingListings}
              emphasis={s.pendingListings > 0}
              footer={<Link href="/admin/listings?status=pending" className="font-semibold text-primary hover:underline">Review listings</Link>}
            />
            <Tile
              label="Papers to check"
              value={s.paperAwaiting}
              footer={<Link href="/admin/listings?papers=awaiting" className="font-semibold text-primary hover:underline">Open papers</Link>}
            />
            <Tile label="Live listings" value={s.activeListings} footer={<span className="text-muted-foreground">Worth {formatLakh(s.inventoryValue)}</span>} />
            <Tile
              label={`New listings, ${data!.days} days`}
              value={s.listingsInPeriod}
              delta={[s.listingsInPeriod, s.listingsPrevPeriod]}
              trend={data!.series.listings.map((d) => d.count)}
              color={SERIES_COLORS[0]}
            />
            <Tile
              label={`New accounts, ${data!.days} days`}
              value={s.usersInPeriod}
              delta={[s.usersInPeriod, s.usersPrevPeriod]}
              trend={data!.series.users.map((d) => d.count)}
              color={SERIES_COLORS[1]}
            />
            <Tile
              label={`Chats started, ${data!.days} days`}
              value={s.conversationsInPeriod}
              footer={<span className="text-muted-foreground tabular">{s.messagesInPeriod.toLocaleString("en-IN")} messages sent</span>}
            />
          </>
        )}
      </div>

      {/* ─── Activity + status ─── */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel title="Daily activity" className="xl:col-span-2">
          {data ? (
            <LineChart
              series={[
                { name: "New listings", data: data.series.listings },
                { name: "New accounts", data: data.series.users },
              ]}
            />
          ) : (
            <div className="skeleton h-[270px] rounded-lg" />
          )}
        </Panel>

        <Panel title="Listings by status">
          {s ? (
            <>
              <BarList
                rows={[
                  { key: "active", label: STATUS_LABEL.active, value: s.activeListings },
                  { key: "pending", label: STATUS_LABEL.pending, value: s.pendingListings },
                  { key: "sold", label: STATUS_LABEL.sold, value: s.soldListings },
                  { key: "removed", label: STATUS_LABEL.removed, value: s.removedListings },
                ]}
                onSelect={(r) => router.push(`/admin/listings?status=${r.key}`)}
              />
              <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Average asking price</dt>
                  <dd className="mt-0.5 text-base font-bold tabular">{formatLakh(s.avgActivePrice)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Sold, all time</dt>
                  <dd className="mt-0.5 text-base font-bold tabular">{formatLakh(s.soldValue)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Listing views</dt>
                  <dd className="mt-0.5 text-base font-bold tabular">{compactNumber(s.totalViews)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Sell-through</dt>
                  <dd className="mt-0.5 text-base font-bold tabular">
                    {s.totalListings ? Math.round((s.soldListings / s.totalListings) * 100) : 0}%
                  </dd>
                </div>
              </dl>
            </>
          ) : (
            <div className="skeleton h-[270px] rounded-lg" />
          )}
        </Panel>
      </div>

      {/* ─── Queue + makes ─── */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel
          title="Review queue"
          subtitle="Oldest first"
          className="xl:col-span-2"
          action={<Link href="/admin/listings?status=pending" className="text-sm font-semibold text-primary hover:underline">See all</Link>}
          flush
        >
          {!data ? (
            <div className="space-y-2 p-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-lg" />)}</div>
          ) : data.queue.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Check size={26} className="mx-auto text-verified" aria-hidden />
              <p className="mt-2 font-semibold">All caught up</p>
              <p className="text-sm text-muted-foreground">New listings will show up here for review.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {data.queue.map((l) => (
                <li key={l._id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap sm:px-5">
                  <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                    <CarImage src={l.thumb} alt="" sizes="64px" />
                  </div>
                  <div className="min-w-0 grow basis-40">
                    <Link href={`/cars/${l.slug}`} target="_blank" className="block truncate font-semibold hover:text-primary">
                      {l.title}
                    </Link>
                    <p className="truncate text-sm text-muted-foreground">
                      {formatLakh(l.price)}, {l.sellerName || "Unknown seller"}, {timeAgo(l.createdAt)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold",
                      l.docCount > 0 ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                    )}
                  >
                    <FileText size={13} aria-hidden />
                    {l.docCount > 0 ? `${l.docCount} ${l.docCount === 1 ? "paper" : "papers"}` : "No papers"}
                  </span>
                  <div className="flex shrink-0 gap-1.5">
                    <Button size="sm" variant="success" loading={busy === l._id} onClick={() => setStatus(l._id, "active", l.title)}>
                      <Check size={15} /> Approve
                    </Button>
                    <Button size="sm" onClick={() => setStatus(l._id, "removed", l.title)} disabled={busy === l._id} aria-label={`Reject ${l.title}`}>
                      <X size={15} /> Reject
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Live listings by make" subtitle="Hover a bar for the average price">
          {data ? (
            <BarList
              rows={data.makes.map((m) => ({ label: m.make, value: m.count, key: m.make }))}
              detail={(r) => {
                const m = data.makes.find((x) => x.make === r.label);
                return m ? `avg ${formatLakh(m.avgPrice)}` : undefined;
              }}
              onSelect={(r) => router.push(`/admin/listings?q=${encodeURIComponent(r.label)}`)}
            />
          ) : (
            <div className="skeleton h-[270px] rounded-lg" />
          )}
        </Panel>
      </div>

      {/* ─── Most viewed + new accounts ─── */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Most viewed" flush>
          {data && (
            <table className="w-full text-sm">
              <caption className="sr-only">Most viewed live listings</caption>
              <tbody className="divide-y divide-border">
                {data.topViewed.map((l, i) => (
                  <tr key={l._id}>
                    <td className="w-10 py-3 pl-5 font-semibold text-muted-foreground tabular">{i + 1}</td>
                    <td className="py-3 pr-3">
                      <Link href={`/cars/${l.slug}`} target="_blank" className="font-semibold hover:text-primary">{l.title}</Link>
                    </td>
                    <td className="whitespace-nowrap py-3 pr-3 text-right tabular">{formatLakh(l.price)}</td>
                    <td className="whitespace-nowrap py-3 pr-5 text-right text-muted-foreground tabular">
                      <Eye size={14} className="mr-1 inline" aria-hidden />
                      {l.views.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title="Newest accounts" action={<Link href="/admin/users" className="text-sm font-semibold text-primary hover:underline">All users</Link>} flush>
          {data && (
            <ul className="divide-y divide-border">
              {data.recentUsers.map((u) => (
                <li key={u._id} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary">
                    {u.name?.[0]?.toUpperCase() || "?"}
                  </span>
                  <div className="min-w-0 grow">
                    <p className="truncate font-semibold">{u.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{u.email}</p>
                  </div>
                  <div className="shrink-0 text-right text-sm">
                    <p className="font-medium capitalize">{u.role}</p>
                    <p className="text-muted-foreground">{timeAgo(u.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  action,
  children,
  className,
  flush,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-card", className)}>
      <div className="flex items-baseline justify-between gap-3 px-5 pb-1 pt-4">
        <div>
          <h2 className="text-base font-bold">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className={flush ? "mt-2" : "px-5 pb-5 pt-3"}>{children}</div>
    </section>
  );
}

function Tile({
  label,
  value,
  delta,
  trend,
  color,
  footer,
  emphasis,
}: {
  label: string;
  value: number;
  delta?: [number, number];
  trend?: number[];
  color?: string;
  footer?: React.ReactNode;
  emphasis?: boolean;
}) {
  let deltaEl: React.ReactNode = null;
  if (delta) {
    const [now, prev] = delta;
    if (prev === 0) {
      deltaEl = <span className="text-muted-foreground">{now > 0 ? "None in the previous period" : "No change"}</span>;
    } else {
      const pct = Math.round(((now - prev) / prev) * 100);
      const up = pct >= 0;
      deltaEl = (
        <span className={cn("inline-flex items-center gap-0.5 font-semibold", up ? "text-verified" : "text-destructive")}>
          {up ? <ArrowUpRight size={15} aria-hidden /> : <ArrowDownRight size={15} aria-hidden />}
          {up ? "+" : ""}
          {pct}% <span className="font-normal text-muted-foreground">vs previous</span>
        </span>
      );
    }
  }

  return (
    <div className={cn("flex flex-col rounded-xl border bg-card p-4", emphasis ? "border-marigold ring-1 ring-marigold" : "border-border")}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="font-semiwide text-[1.75rem] font-extrabold leading-tight">{value.toLocaleString("en-IN")}</p>
        {trend && <Sparkline values={trend} color={color} />}
      </div>
      <div className="mt-auto pt-2 text-sm">{deltaEl || footer}</div>
    </div>
  );
}
