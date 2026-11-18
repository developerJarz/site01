"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { BookOpen, Car, Download, History, Inbox, Mail, Search, SearchCheck, Settings, ShieldCheck, Users } from "lucide-react";
import { Button, PageHeader, Pagination, api, downloadCsv, inputClass } from "@/components/admin/ui";
import { useToast } from "@/components/admin/Toast";
import { cn, timeAgo } from "@/lib/utils";

interface Entry {
  _id: string;
  actorId?: string;
  actorName?: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  area: string;
  summary: string;
  targetLabel?: string;
  details?: Record<string, unknown>;
  ip?: string;
  createdAt: string;
}
interface Response {
  entries: Entry[];
  total: number;
  page: number;
  pages: number;
  areas: Record<string, string>;
  actors: { _id: string; name?: string; email?: string }[];
}

const AREA_ICON: Record<string, typeof Car> = {
  listing: Car, user: Users, role: ShieldCheck, blog: BookOpen, seo: SearchCheck, settings: Settings, inbox: Inbox, newsletter: Mail,
};
const AREA_TONE: Record<string, string> = {
  listing: "bg-haze text-electric-deep", user: "bg-mist text-night", role: "bg-amber-50 text-amber-700", blog: "bg-emerald-50 text-emerald-700",
  seo: "bg-sky-50 text-sky-700", settings: "bg-violet-50 text-violet-700", inbox: "bg-mist text-night", newsletter: "bg-mist text-night",
};
const PERIODS = [
  { value: "", label: "Any time" },
  { value: "1", label: "Last 24 hours" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

const fullDate = (iso: string) => new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

export default function AdminActivityPage() {
  const toast = useToast();
  const [data, setData] = useState<Response | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ q: "", area: "", actor: "", days: "" });
  const [open, setOpen] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const query = useCallback((extra: Record<string, string>) => {
    const sp = new URLSearchParams(extra);
    for (const [k, v] of Object.entries(filters)) if (v) sp.set(k, v);
    return sp.toString();
  }, [filters]);

  const load = useCallback(async () => {
    try {
      setData(await api<Response>(`/api/admin/activity?${query({ page: String(page) })}`));
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, [page, query, toast]);
  useEffect(() => void load(), [load]);
  useEffect(() => {
    const t = setTimeout(() => { setFilters((f) => (f.q === search.trim() ? f : { ...f, q: search.trim() })); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const setFilter = (k: keyof typeof filters, v: string) => { setFilters((f) => ({ ...f, [k]: v })); setPage(1); };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const { entries } = await api<{ entries: Entry[] }>(`/api/admin/activity?${query({ all: "1" })}`);
      downloadCsv(`carhat-activity-${new Date().toISOString().slice(0, 10)}.csv`, ["When", "Team member", "Email", "Role", "Area", "Action", "What happened", "IP"],
        entries.map((e) => [new Date(e.createdAt).toISOString(), e.actorName || "", e.actorEmail || "", e.actorRole || "", e.area, e.action, e.summary, e.ip || ""]));
      toast.success(`Exported ${entries.length} entries.`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const filtered = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-5">
      <PageHeader title="Activity log" description="Everything the team changes in the admin area: who did it, what and when. Entries are kept for a year."
        actions={<Button variant="primary" onClick={exportCsv} loading={exporting} disabled={!data?.total}>{!exporting && <Download size={16} aria-hidden />} Export CSV</Button>} />

      <section className="overflow-hidden rounded-3xl border border-hairline bg-white shadow-soft">
        <div className="grid gap-3 border-b border-hairline p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-text" aria-hidden />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search activity" aria-label="Search activity" className="field h-11 pl-10 text-[15px]" />
          </div>
          <select aria-label="Area" value={filters.area} onChange={(e) => setFilter("area", e.target.value)} className={inputClass}>
            <option value="">All areas</option>
            {Object.entries(data?.areas || {}).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
          <select aria-label="Team member" value={filters.actor} onChange={(e) => setFilter("actor", e.target.value)} className={inputClass}>
            <option value="">Everyone</option>
            {(data?.actors || []).map((a) => <option key={a._id} value={a._id}>{a.name || a.email}</option>)}
          </select>
          <select aria-label="Period" value={filters.days} onChange={(e) => setFilter("days", e.target.value)} className={inputClass}>
            {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>

        {!data ? (
          <div className="space-y-2 p-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
        ) : data.entries.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <History size={26} className="mx-auto text-slate-text" aria-hidden />
            <p className="mt-3 font-bold">{filtered ? "Nothing matches these filters" : "No activity yet"}</p>
            <p className="mt-1 text-sm text-slate-text">{filtered ? "Try a wider period or another team member." : "Changes the team makes from now on will show up here."}</p>
          </div>
        ) : (
          <>
            <ol className="divide-y divide-hairline">
              {data.entries.map((e) => {
                const Icon = AREA_ICON[e.area] || History;
                const hasDetails = !!(e.details && Object.keys(e.details).length) || !!e.ip;
                const expanded = open === e._id;
                return (
                  <li key={e._id} className="px-4 py-3.5 sm:px-5">
                    <div className="flex items-start gap-3">
                      <span className={cn("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl", AREA_TONE[e.area] || "bg-mist text-night")}>
                        <Icon size={17} aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-semibold text-night [overflow-wrap:anywhere]">{e.summary}</p>
                        <p className="mt-0.5 text-[13px] text-slate-text">
                          <span className="font-semibold text-night/80">{e.actorName || e.actorEmail || "Unknown"}</span>
                          {e.actorRole && <span className="ml-1.5 rounded-full bg-mist px-2 py-0.5 text-[11px] font-semibold capitalize">{e.actorRole}</span>}
                          <span aria-hidden> · </span>
                          <time dateTime={e.createdAt} title={fullDate(e.createdAt)}>{timeAgo(e.createdAt)}</time>
                        </p>
                        {expanded && (
                          <dl className="mt-2 grid gap-1 rounded-xl bg-mist/70 p-3 text-[13px] sm:grid-cols-[8rem_1fr]">
                            <dt className="font-semibold text-slate-text">When</dt><dd>{fullDate(e.createdAt)}</dd>
                            {e.actorEmail && <><dt className="font-semibold text-slate-text">Email</dt><dd className="[overflow-wrap:anywhere]">{e.actorEmail}</dd></>}
                            {e.ip && <><dt className="font-semibold text-slate-text">IP address</dt><dd>{e.ip}</dd></>}
                            {Object.entries(e.details || {}).map(([k, v]) => (
                              <Fragment key={k}><dt className="font-semibold capitalize text-slate-text">{k}</dt>
                                <dd className="[overflow-wrap:anywhere]">{Array.isArray(v) ? v.join(", ") : typeof v === "object" ? JSON.stringify(v) : String(v)}</dd></Fragment>
                            ))}
                          </dl>
                        )}
                      </div>
                      {hasDetails && (
                        <button type="button" onClick={() => setOpen(expanded ? null : e._id)} aria-expanded={expanded}
                          className="shrink-0 rounded-full px-3 py-1.5 text-[13px] font-semibold text-electric hover:bg-haze">
                          {expanded ? "Hide" : "Details"}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
            <Pagination page={data.page} pages={data.pages} total={data.total} noun="entries" onPage={setPage} />
          </>
        )}
      </section>
    </div>
  );
}
