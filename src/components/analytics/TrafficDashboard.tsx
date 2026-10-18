"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ArrowDownRight, ArrowUpDown, ArrowUpRight, ChartNoAxesColumn, Eye, MousePointer2, RefreshCw, ScanEye, Users,
} from "lucide-react";
import { DonutChart, GroupedBars, LineChart, RadarProfile, RadialGauge, SERIES_COLORS } from "@/components/admin/Charts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CarImage } from "@/components/CarImage";
import { cn, formatLakh } from "@/lib/utils";

type Points = { date: string; count: number }[];
type Totals = { impressions: number; clicks: number; views: number; visitors: number };
type ListingRow = {
  _id: string; title?: string; slug?: string; price?: number; status?: string; thumb?: string;
  impressions: number; clicks: number; views: number; visitors: number;
};
type Report = {
  days: number;
  totals: Totals;
  previous: Totals;
  series: { impressions: Points; clicks: Points; views: Points; visitors: Points };
  sources: { views: Record<string, number>; impressions: Record<string, number> };
  weekday: { day: number; views: number; clicks: number }[];
  listings: ListingRow[];
};
type Metric = keyof Totals;
type SortKey = "impressions" | "clicks" | "ctr" | "views" | "visitors";

const RANGES = [7, 30, 90];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SOURCE_LABEL: Record<string, string> = { home: "Homepage", browse: "Browse & search", car: "Car pages", blog: "Blog", dealers: "Dealers", other: "Other pages" };
const ctr = (clicks: number, impressions: number) => (impressions ? (clicks / impressions) * 100 : 0);

async function getReport(url: string, signal: AbortSignal): Promise<Report> {
  const response = await fetch(url, { cache: "no-store", signal });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Unable to load analytics.");
  return body;
}

export function TrafficDashboard({ site = false }: { site?: boolean }) {
  const [days, setDays] = useState(30);
  const [refresh, setRefresh] = useState(0);
  const [data, setData] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<Metric>("views");
  const [sort, setSort] = useState<SortKey>("views");
  const [selected, setSelected] = useState<ListingRow | null>(null);
  const scope = site ? "site" : "own";

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    getReport(`/api/analytics?scope=${scope}&days=${days}`, controller.signal)
      .then(setData)
      .catch((e) => { if (!controller.signal.aborted) setError(e.message || "Unable to load analytics."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [days, scope, refresh]);

  const metrics = useMemo(() => ([
    { key: "impressions", label: "Impressions", hint: "Times a car card was seen", icon: ScanEye },
    { key: "clicks", label: "Clicks", hint: "Card taps into a car page", icon: MousePointer2 },
    { key: "views", label: site ? "Page views" : "Listing views", hint: site ? "Pages opened across the site" : "Your car pages opened", icon: Eye },
    { key: "visitors", label: "Visitors", hint: "Unique browsers", icon: Users },
  ] as const), [site]);

  const rows = useMemo(() => {
    const list = [...(data?.listings || [])];
    const value = (l: ListingRow) => (sort === "ctr" ? ctr(l.clicks, l.impressions) : l[sort]);
    return list.sort((a, b) => value(b) - value(a));
  }, [data, sort]);

  const sourceRows = useMemo(() => {
    const counts = (site ? data?.sources.views : data?.sources.impressions) || {};
    return Object.entries(counts).map(([key, value]) => ({ key, label: SOURCE_LABEL[key] || key, value }));
  }, [data, site]);

  const top = useMemo(() => [...(data?.listings || [])].sort((a, b) => b.impressions - a.impressions).slice(0, 6)
    .filter((l) => l.impressions || l.clicks)
    .map((l) => ({ label: l.title || "Deleted listing", impressions: l.impressions, clicks: l.clicks })), [data]);

  const stale = loading && !!data;

  return (
    <section aria-label={site ? "Website traffic analytics" : "Your listing analytics"} className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Performance</p>
          <h2 className="mt-1 text-xl font-extrabold md:text-2xl">{site ? "Website & listing traffic" : "How your cars are performing"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{site ? "Real visitor activity across the whole marketplace." : "Who saw, clicked and opened each of your listings."}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-muted p-1" role="group" aria-label="Date range">
            {RANGES.map((range) => (
              <button type="button" key={range} aria-pressed={days === range} onClick={() => setDays(range)}
                className={cn("h-9 rounded-lg px-3 text-[13px] font-semibold transition-colors", days === range ? "bg-white text-electric shadow-sm" : "text-muted-foreground hover:text-night")}>
                {range}d
              </button>
            ))}
          </div>
          <Button variant="secondary" size="icon" className="size-10 rounded-xl" disabled={loading} onClick={() => setRefresh((v) => v + 1)} aria-label="Refresh traffic">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} aria-hidden />
          </Button>
        </div>
      </div>

      {error ? (
        <div role="alert" className="rounded-2xl bg-danger-soft p-4 text-sm text-destructive">{error} <button className="font-bold underline" onClick={() => setRefresh((v) => v + 1)}>Retry</button></div>
      ) : (
        <div className={cn("space-y-4 transition-opacity", stale && "opacity-60")} aria-busy={loading}>
          {/* Interactive daily chart: the metric cards above it are the switch (shadcn "Bar Chart - Interactive"). */}
          <Card className="overflow-hidden">
            <div className="grid grid-cols-2 border-b border-hairline lg:grid-cols-4" role="tablist" aria-label="Metric shown in the chart">
              {metrics.map(({ key, label, hint, icon: Icon }, i) => (
                <button key={key} type="button" role="tab" aria-selected={metric === key} onClick={() => setMetric(key)}
                  className={cn("relative flex flex-col gap-1 px-4 py-4 text-left transition-colors sm:px-6 sm:py-5",
                    i % 2 === 1 && "border-l border-hairline", i >= 2 && "max-lg:border-t lg:border-l",
                    metric === key ? "bg-haze/50" : "hover:bg-mist/70")}>
                  {metric === key && <span className="absolute inset-x-0 top-0 h-0.5 bg-electric" aria-hidden />}
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><Icon size={14} className="text-electric" aria-hidden /> {label}</span>
                  <span className="text-2xl font-extrabold leading-none tabular sm:text-[1.75rem]">{data ? data.totals[key].toLocaleString("en-IN") : <span className="skeleton inline-block h-7 w-16 rounded" />}</span>
                  {data ? <Delta now={data.totals[key]} prev={data.previous[key]} days={data.days} /> : <span className="text-xs text-transparent">.</span>}
                  <span className="sr-only">{hint}</span>
                </button>
              ))}
            </div>
            <CardContent className="p-3 pt-5 sm:p-6">
              {!data ? <div className="skeleton h-[260px] rounded-xl" /> : <DailyBars points={data.series[metric]} label={metrics.find((m) => m.key === metric)!.label} />}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardContent className="p-5">
                <h3 className="font-bold">Click-through rate</h3>
                <p className="text-[13px] text-muted-foreground">Clicks per card impression</p>
                <div className="mt-3">{data ? <RadialGauge value={ctr(data.totals.clicks, data.totals.impressions)} label="CTR" /> : <div className="skeleton mx-auto size-[180px] rounded-full" />}</div>
                {data && (
                  <p className="mt-3 text-center text-[13px] text-slate-text">
                    <span className="font-bold text-night tabular">{data.totals.clicks.toLocaleString("en-IN")}</span> clicks from <span className="font-bold text-night tabular">{data.totals.impressions.toLocaleString("en-IN")}</span> impressions
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <h3 className="font-bold">{site ? "Where page views happen" : "Where buyers saw your cars"}</h3>
                <p className="text-[13px] text-muted-foreground">{site ? "Page views by section" : "Card impressions by page"}</p>
                <div className="mt-4">{data ? <DonutChart rows={sourceRows} centerLabel={site ? "views" : "impressions"} /> : <div className="skeleton h-[200px] rounded-xl" />}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <h3 className="font-bold">Busiest days</h3>
                <p className="text-[13px] text-muted-foreground">{site ? "Page views" : "Listing views"} by weekday (UTC)</p>
                <div className="mt-2">
                  {data ? <RadarProfile rows={data.weekday.map((w) => ({ label: WEEKDAYS[w.day - 1], views: w.views }))} series={[{ key: "views", label: site ? "Page views" : "Listing views" }]} />
                    : <div className="skeleton mx-auto size-[220px] rounded-full" />}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-5">
            <Card className="xl:col-span-2">
              <CardContent className="p-5">
                <h3 className="font-bold">Top listings</h3>
                <p className="mb-3 text-[13px] text-muted-foreground">Impressions and clicks, most seen first</p>
                {data ? <GroupedBars rows={top} series={[{ key: "impressions", label: "Impressions" }, { key: "clicks", label: "Clicks" }]} /> : <div className="skeleton h-[300px] rounded-xl" />}
              </CardContent>
            </Card>
            <Card className="xl:col-span-3">
              <CardContent className="p-5">
                <h3 className="font-bold">Compare the funnel</h3>
                <p className="mb-3 text-[13px] text-muted-foreground">Impressions, clicks and {site ? "page" : "listing"} views per day</p>
                {data ? (
                  <LineChart height={280} series={[
                    { name: "Impressions", data: data.series.impressions },
                    { name: "Clicks", data: data.series.clicks },
                    { name: site ? "Page views" : "Listing views", data: data.series.views },
                  ]} />
                ) : <div className="skeleton h-[280px] rounded-xl" />}
              </CardContent>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5">
              <div>
                <h3 className="font-bold">Every listing</h3>
                <p className="text-[13px] text-muted-foreground">Open the graph on any car to see its own day-by-day traffic.</p>
              </div>
            </div>
            <div className="mt-4 border-t border-hairline">
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-5">Listing</TableHead>
                    {([["impressions", "Impressions"], ["clicks", "Clicks"], ["ctr", "CTR"], ["views", "Views"], ["visitors", "Visitors"]] as const).map(([key, label]) => (
                      <TableHead key={key} className="text-right" aria-sort={sort === key ? "descending" : "none"}>
                        <button type="button" onClick={() => setSort(key)} className={cn("inline-flex items-center gap-1 hover:text-night", sort === key && "text-electric")}>
                          {label} <ArrowUpDown size={12} aria-hidden />
                        </button>
                      </TableHead>
                    ))}
                    <TableHead className="pr-5 text-right"><span className="sr-only">Graph</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!data ? (
                    Array.from({ length: 3 }).map((_, i) => <TableRow key={i}><TableCell colSpan={7} className="px-5"><div className="skeleton h-10 rounded-lg" /></TableCell></TableRow>)
                  ) : rows.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="p-8 text-center whitespace-normal text-muted-foreground">No listing activity yet. Traffic appears here as people browse {site ? "the marketplace" : "your cars"}.</TableCell></TableRow>
                  ) : rows.map((l) => (
                    <TableRow key={l._id}>
                      <TableCell className="max-w-[300px] pl-5">
                        <div className="flex items-center gap-3">
                          <span className="relative h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-mist"><CarImage src={l.thumb} alt="" sizes="56px" /></span>
                          <span className="min-w-0">
                            {l.slug ? <Link className="block truncate font-semibold text-night hover:text-electric" href={`/cars/${l.slug}`}>{l.title}</Link> : <span className="text-muted-foreground">Deleted listing</span>}
                            <span className="block text-xs text-muted-foreground">{l.price ? formatLakh(l.price) : ""}{l.status && l.status !== "active" ? ` · ${l.status}` : ""}</span>
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular">{l.impressions.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right tabular">{l.clicks.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right tabular">{l.impressions ? `${ctr(l.clicks, l.impressions).toFixed(1)}%` : "—"}</TableCell>
                      <TableCell className="text-right font-semibold tabular">{l.views.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right tabular">{l.visitors.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="pr-5 text-right">
                        <Button size="sm" variant="ghost" onClick={() => setSelected(l)} aria-label={`Traffic graph for ${l.title || "this listing"}`}>
                          <ChartNoAxesColumn size={15} aria-hidden /> Graph
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          <p className="text-xs leading-relaxed text-muted-foreground">
            Impressions need a car card at least half on screen for one second. Each event counts once per browser session per day; visitors are estimated unique browsers.
            {site ? " Admin activity is excluded." : " Your own visits are excluded."} Dates use UTC. Reports keep 180 days of events.
          </p>
        </div>
      )}

      <ListingTraffic listing={selected} scope={scope} days={days} onClose={() => setSelected(null)} />
    </section>
  );
}

function Delta({ now, prev, days }: { now: number; prev: number; days: number }) {
  if (!prev) return <span className="text-xs text-muted-foreground">{now ? `New in the last ${days} days` : "No activity yet"}</span>;
  const pct = Math.round(((now - prev) / prev) * 100);
  const up = pct >= 0;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-semibold", up ? "text-verified" : "text-destructive")}>
      {up ? <ArrowUpRight size={13} aria-hidden /> : <ArrowDownRight size={13} aria-hidden />}
      {up ? "+" : ""}{pct}% <span className="font-normal text-muted-foreground">vs previous {days}d</span>
    </span>
  );
}

/** One metric per day as columns; long ranges thin the ticks instead of the bars. */
function DailyBars({ points, label }: { points: Points; label: string }) {
  const config: ChartConfig = { count: { label, color: SERIES_COLORS[0] } };
  const fmt = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  if (!points.some((p) => p.count)) {
    return <div className="flex h-[260px] items-center justify-center rounded-xl border border-dashed border-hairline text-sm text-muted-foreground">No {label.toLowerCase()} in this period yet.</div>;
  }
  return (
    <ChartContainer config={config} className="aspect-auto h-[260px] w-full">
      <BarChart data={points} margin={{ left: 0, right: 8, top: 8 }} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={28} tickFormatter={fmt} />
        <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
        <ChartTooltip cursor content={<ChartTooltipContent nameKey="count" labelFormatter={(_, p) => {
          const iso = String(p?.[0]?.payload?.date || "");
          return iso ? new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }) : "";
        }} />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ChartContainer>
  );
}

/** Per-listing drill-down: the same report, filtered server-side to one car. */
function ListingTraffic({ listing, scope, days, onClose }: { listing: ListingRow | null; scope: string; days: number; onClose: () => void }) {
  const [data, setData] = useState<Report | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!listing) return;
    const controller = new AbortController();
    setData(null); setError("");
    getReport(`/api/analytics?scope=${scope}&days=${days}&listing=${listing._id}`, controller.signal)
      .then(setData)
      .catch((e) => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [listing, scope, days]);

  return (
    <Dialog open={!!listing} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[min(48rem,calc(100vw-2rem))]">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">{listing?.title || "Listing traffic"}</DialogTitle>
          <DialogDescription>Last {days} days, day by day</DialogDescription>
        </DialogHeader>
        <div className="max-h-[75vh] overflow-y-auto p-5">
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : !data ? <div className="skeleton h-[340px] rounded-xl" /> : (
            <>
              <dl className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {([["Impressions", data.totals.impressions], ["Clicks", data.totals.clicks], ["CTR", `${ctr(data.totals.clicks, data.totals.impressions).toFixed(1)}%`], ["Views", data.totals.views], ["Visitors", data.totals.visitors]] as const).map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-mist p-3">
                    <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
                    <dd className="mt-1 text-xl font-extrabold tabular">{typeof value === "number" ? value.toLocaleString("en-IN") : value}</dd>
                  </div>
                ))}
              </dl>
              <LineChart height={260} series={[
                { name: "Impressions", data: data.series.impressions },
                { name: "Clicks", data: data.series.clicks },
                { name: "Views", data: data.series.views },
              ]} />
              {listing?.slug && <Button asChild variant="secondary" className="mt-4"><Link href={`/cars/${listing.slug}`}>Open listing</Link></Button>}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
