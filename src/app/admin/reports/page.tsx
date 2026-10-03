"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BarList, SERIES_COLORS } from "@/components/admin/Charts";
import { Button, PageHeader, STATUS_LABEL, api } from "@/components/admin/ui";
import { formatLakh } from "@/lib/utils";

interface ReportData {
  byCondition: { _id: string; count: number }[];
  byFuelType: { _id: string; count: number }[];
  byMake: { _id: string; count: number; avgPrice: number }[];
  priceRanges: { _id: number | string; count: number }[];
  byStatus: { _id: string; count: number }[];
  byRole: { _id: string; count: number }[];
  monthlyUsers: { _id: { year: number; month: number }; count: number }[];
  monthlyListings: { _id: { year: number; month: number }; count: number }[];
  topPerforming: { _id: string; title: string; price: number; views: number; slug: string }[];
}

const LABEL: Record<string, string> = {
  new: "New", used: "Used", reconditioned: "Reconditioned",
  petrol: "Petrol", octane: "Octane", diesel: "Diesel", cng: "CNG", hybrid: "Hybrid", electric: "Electric",
  buyer: "Buyers", seller: "Sellers", dealer: "Dealers", admin: "Admins", guest: "Guests",
  ...STATUS_LABEL,
};
const label = (k: string) => LABEL[k] || (k ? k[0].toUpperCase() + k.slice(1) : "Not set");
const pct = (n: number, total: number) => (total ? `${Math.round((n / total) * 100)}%` : "0%");

const priceRangeLabel = (id: number | string) => {
  if (id === "20000000+") return "Above 2 crore";
  const rangeMap: Record<number, string> = {
    0: "Under 10 lakh",
    1000000: "10–20 lakh",
    2000000: "20–30 lakh",
    3000000: "30–50 lakh",
    5000000: "50–70 lakh",
    7000000: "70 lakh–1 crore",
    10000000: "1–2 crore",
  };
  return rangeMap[Number(id)] || formatLakh(Number(id));
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function AdminReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setError("");
    api<ReportData>("/api/admin/reports").then(setData).catch((e: Error) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center">
        <p className="font-semibold">Reports couldn&apos;t load.</p>
        <p className="mt-1 text-muted-foreground">{error}</p>
        <Button className="mt-4" variant="primary" onClick={load}>Try again</Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-5">
        <div className="skeleton h-10 w-60 rounded" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-56 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const totalListings = data.byCondition.reduce((a, c) => a + c.count, 0);
  const totalUsers = data.byRole.reduce((a, r) => a + r.count, 0);
  const share = (total: number) => (r: { value: number }) => `${pct(r.value, total)} of ${total.toLocaleString("en-IN")}`;
  const byCount = <T extends { count: number }>(rows: T[]) => [...rows].sort((a, b) => b.count - a.count);

  const months = new Map<string, { label: string; listings: number; users: number }>();
  const monthKey = (id: { year: number; month: number }) => `${id.year}-${String(id.month).padStart(2, "0")}`;
  const monthLabel = (id: { year: number; month: number }) => `${MONTHS[id.month - 1]} ${id.year}`;
  for (const m of data.monthlyListings) months.set(monthKey(m._id), { label: monthLabel(m._id), listings: m.count, users: 0 });
  for (const m of data.monthlyUsers) {
    const row = months.get(monthKey(m._id)) || { label: monthLabel(m._id), listings: 0, users: 0 };
    row.users = m.count;
    months.set(monthKey(m._id), row);
  }
  const monthly = [...months.entries()].sort(([a], [b]) => b.localeCompare(a)).slice(0, 12).map(([, v]) => v);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description={`All time: ${totalListings.toLocaleString("en-IN")} listings and ${totalUsers.toLocaleString("en-IN")} accounts.`}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Panel title="Listings by condition">
          <BarList rows={byCount(data.byCondition).map((c) => ({ label: label(c._id), value: c.count }))} detail={share(totalListings)} />
        </Panel>
        <Panel title="Listings by fuel">
          <BarList rows={byCount(data.byFuelType).map((c) => ({ label: label(c._id), value: c.count }))} detail={share(totalListings)} />
        </Panel>
        <Panel title="Listings by status">
          <BarList rows={byCount(data.byStatus).map((c) => ({ label: label(c._id), value: c.count }))} detail={share(totalListings)} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Makes" subtitle="Hover a bar for the average asking price">
          <BarList
            rows={data.byMake.map((m) => ({ label: m._id || "Not set", value: m.count }))}
            detail={(r) => {
              const m = data.byMake.find((x) => (x._id || "Not set") === r.label);
              return m ? `avg ${formatLakh(m.avgPrice)}` : undefined;
            }}
          />
        </Panel>
        <Panel title="Asking prices">
          <BarList
            rows={data.priceRanges.map((p) => ({ label: priceRangeLabel(p._id), value: p.count, key: String(p._id) }))}
            detail={share(totalListings)}
          />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Accounts by role">
          <BarList rows={byCount(data.byRole).map((r) => ({ label: label(r._id), value: r.count }))} color={SERIES_COLORS[1]} detail={share(totalUsers)} />
        </Panel>

        <Panel title="New each month" flush>
          <table className="w-full text-sm">
            <thead className="text-left text-[13px] text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 pl-5 font-semibold">Month</th>
                <th className="py-2 text-right font-semibold">Listings</th>
                <th className="py-2 pr-5 text-right font-semibold">Accounts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border tabular">
              {monthly.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-6 text-muted-foreground">No activity yet.</td>
                </tr>
              )}
              {monthly.map((m) => (
                <tr key={m.label}>
                  <td className="py-2 pl-5">{m.label}</td>
                  <td className="py-2 text-right">{m.listings}</td>
                  <td className="py-2 pr-5 text-right">{m.users}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Most viewed listings" flush>
          <ol className="divide-y divide-border">
            {data.topPerforming.map((item, i) => (
              <li key={item._id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                <span className="w-5 font-semibold text-muted-foreground tabular">{i + 1}</span>
                <Link href={`/cars/${item.slug}`} target="_blank" className="min-w-0 grow truncate font-semibold hover:text-primary">
                  {item.title}
                </Link>
                <span className="shrink-0 text-muted-foreground tabular">{item.views.toLocaleString("en-IN")} views</span>
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, children, flush }: { title: string; subtitle?: string; children: React.ReactNode; flush?: boolean }) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="px-5 pt-4">
        <h2 className="text-base font-bold">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className={flush ? "mt-2" : "px-5 pb-5 pt-4"}>{children}</div>
    </section>
  );
}
