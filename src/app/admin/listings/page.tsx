"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Download,
  ExternalLink,
  Eye,
  FileSearch,
  FileText,
  Loader2,
  Pencil,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { CarImage } from "@/components/CarImage";
import {
  Button,
  Checkbox,
  CountTabs,
  Field,
  Modal,
  PageHeader,
  Pagination,
  STATUS_LABEL,
  StatusBadge,
  api,
  inputClass,
  useConfirm,
} from "@/components/admin/ui";
import { useToast } from "@/components/admin/Toast";
import { cn, formatLakh, formatTaka, timeAgo } from "@/lib/utils";

interface Listing {
  _id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  condition: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  engineSize: number;
  color: string;
  location: string;
  views: number;
  status: string;
  featured: boolean;
  paperVerified?: boolean;
  paperVerifiedAt?: string;
  paperVerificationNote?: string;
  thumb?: string;
  imageCount: number;
  docCount: number;
  createdAt: string;
  sellerId?: { _id?: string; name?: string; email?: string; role?: string; phone?: string };
}

interface ListResponse {
  listings: Listing[];
  total: number;
  page: number;
  pages: number;
  counts: Record<string, number>;
}

type StatusTab = "all" | "active" | "pending" | "sold" | "removed";

const PAPER_FILTERS = [
  { value: "", label: "Any papers" },
  { value: "awaiting", label: "Waiting for check" },
  { value: "verified", label: "Paper Verified" },
  { value: "none", label: "No papers uploaded" },
];

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "price-high", label: "Price, high to low" },
  { value: "price-low", label: "Price, low to high" },
  { value: "views", label: "Most viewed" },
];

export default function AdminListingsPage() {
  return (
    <Suspense fallback={<div className="skeleton h-96 rounded-xl" />}>
      <ListingsManager />
    </Suspense>
  );
}

function ListingsManager() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const toast = useToast();
  const { confirm, dialog } = useConfirm();

  const status = (params.get("status") || "all") as StatusTab;
  const q = params.get("q") || "";
  const papers = params.get("papers") || "";
  const featured = params.get("featured") === "1";
  const sort = params.get("sort") || "newest";
  const page = Number(params.get("page")) || 1;

  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<Listing | null>(null);
  const [inspecting, setInspecting] = useState<Listing | null>(null);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState(q);
  const searchRef = useRef<HTMLInputElement>(null);

  const setParams = useCallback(
    (updates: Record<string, string | undefined>, resetPage = true) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      if (resetPage && !("page" in updates)) next.delete("page");
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router]
  );

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (status !== "all") p.set("status", status);
    if (q) p.set("q", q);
    if (papers) p.set("papers", papers);
    if (featured) p.set("featured", "1");
    if (sort !== "newest") p.set("sort", sort);
    p.set("page", String(page));
    p.set("limit", "20");
    return p.toString();
  }, [status, q, papers, featured, sort, page]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await api<ListResponse>(`/api/admin/listings?${queryString}`));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    load();
  }, [load]);

  // Selection belongs to one result set; clear it when the filters change.
  useEffect(() => setSelected(new Set()), [queryString]);

  useEffect(() => setSearch(q), [q]);
  useEffect(() => {
    if (search === q) return;
    const t = setTimeout(() => setParams({ q: search.trim() || undefined }), 350);
    return () => clearTimeout(t);
  }, [search, q, setParams]);

  // "/" jumps to search, like most admin tools.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(tag)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const refreshAll = async () => {
    window.dispatchEvent(new Event("admin:counts-changed"));
    await load();
  };

  const patchOne = async (l: Listing, update: Partial<Listing>, message: string) => {
    setBusy(l._id);
    // Optimistic: reflect the change immediately, then confirm with the server.
    setData((d) => d && { ...d, listings: d.listings.map((x) => (x._id === l._id ? { ...x, ...update } : x)) });
    try {
      await api("/api/admin/listings", { method: "PATCH", body: JSON.stringify({ id: l._id, ...update }) });
      toast.success(message);
      await refreshAll();
    } catch (e) {
      toast.error((e as Error).message);
      await load();
    } finally {
      setBusy(null);
    }
  };

  const bulk = async (update: Record<string, unknown>, message: string) => {
    const ids = Array.from(selected);
    setBusy("bulk");
    try {
      const res = await api<{ modified: number }>("/api/admin/listings", { method: "PATCH", body: JSON.stringify({ ids, ...update }) });
      toast.success(message.replace("{n}", String(res.modified)));
      setSelected(new Set());
      await refreshAll();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const remove = async (ids: string[], label: string) => {
    const ok = await confirm({
      title: ids.length === 1 ? "Delete this listing?" : `Delete ${ids.length} listings?`,
      body: (
        <>
          <strong className="text-foreground">{label}</strong> will be removed permanently, including photos and papers. To hide a
          listing but keep it, set its status to Removed instead.
        </>
      ),
      confirmLabel: ids.length === 1 ? "Delete listing" : `Delete ${ids.length} listings`,
      tone: "danger",
    });
    if (!ok) return;
    setBusy(ids.length === 1 ? ids[0] : "bulk");
    try {
      const res = await api<{ deleted: number }>("/api/admin/listings", { method: "DELETE", body: JSON.stringify({ ids }) });
      toast.success(`Deleted ${res.deleted} ${res.deleted === 1 ? "listing" : "listings"}.`);
      setSelected(new Set());
      await refreshAll();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const base = new URLSearchParams(queryString);
      base.set("limit", "100");
      const rows: Listing[] = [];
      for (let p = 1; p <= 50; p++) {
        base.set("page", String(p));
        const res = await api<ListResponse>(`/api/admin/listings?${base.toString()}`);
        rows.push(...res.listings);
        if (p >= res.pages) break;
      }
      const header = ["Title", "Make", "Model", "Year", "Price (BDT)", "Status", "Condition", "Location", "Views", "Featured", "Paper Verified", "Papers", "Seller", "Seller email", "Listed", "URL"];
      const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const lines = rows.map((l) =>
        [l.title, l.make, l.model, l.year, l.price, STATUS_LABEL[l.status] || l.status, l.condition, l.location, l.views, l.featured ? "Yes" : "No", l.paperVerified ? "Yes" : "No", l.docCount, l.sellerId?.name, l.sellerId?.email, new Date(l.createdAt).toISOString().slice(0, 10), `${window.location.origin}/cars/${l.slug}`]
          .map(esc)
          .join(",")
      );
      const blob = new Blob(["﻿" + [header.map(esc).join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `carhat-listings-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success(`Exported ${rows.length} listings.`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const listings = data?.listings || [];
  const allSelected = listings.length > 0 && listings.every((l) => selected.has(l._id));
  const toggleAll = (on: boolean) => setSelected(on ? new Set(listings.map((l) => l._id)) : new Set());
  const toggleOne = (id: string, on: boolean) =>
    setSelected((s) => {
      const n = new Set(s);
      if (on) n.add(id);
      else n.delete(id);
      return n;
    });

  const counts = data?.counts;
  const tabs: { value: StatusTab; label: string; count?: number }[] = [
    { value: "all", label: "All", count: counts?.all },
    { value: "pending", label: "Pending review", count: counts?.pending },
    { value: "active", label: "Live", count: counts?.active },
    { value: "sold", label: "Sold", count: counts?.sold },
    { value: "removed", label: "Removed", count: counts?.removed },
  ];
  const filtered = !!(q || papers || featured);

  return (
    <div className="space-y-5 pb-24">
      <PageHeader
        title="Listings"
        description="Approve new cars, check papers and keep the marketplace tidy."
        actions={
          <Button onClick={exportCsv} loading={exporting} disabled={!data || data.total === 0}>
            {!exporting && <Download size={16} />} Export CSV
          </Button>
        }
      />

      <CountTabs label="Filter by status" tabs={tabs} value={status} onChange={(v) => setParams({ status: v === "all" ? undefined : v })} />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[14rem] grow sm:max-w-sm">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            ref={searchRef}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, make, model or city"
            aria-label="Search listings"
            className={cn(inputClass, "pl-9 pr-10")}
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-border px-1.5 text-xs text-muted-foreground sm:block">/</kbd>
        </div>
        <select value={papers} onChange={(e) => setParams({ papers: e.target.value || undefined })} aria-label="Filter by papers" className={cn(inputClass, "w-auto")}>
          {PAPER_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <button
          type="button"
          aria-pressed={featured}
          onClick={() => setParams({ featured: featured ? undefined : "1" })}
          className={cn(
            "inline-flex h-10 items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold",
            featured ? "border-marigold bg-[#fdf3dc] text-[#7a5200]" : "border-input bg-card hover:bg-muted"
          )}
        >
          <Star size={15} className={featured ? "fill-marigold text-[#b27c00]" : ""} aria-hidden /> Featured
        </button>
        <select value={sort} onChange={(e) => setParams({ sort: e.target.value === "newest" ? undefined : e.target.value })} aria-label="Sort" className={cn(inputClass, "w-auto")}>
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        {filtered && (
          <Button variant="ghost" onClick={() => setParams({ q: undefined, papers: undefined, featured: undefined })}>
            Clear filters
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {error ? (
          <div className="p-10 text-center">
            <p className="font-semibold">Listings couldn&apos;t load.</p>
            <p className="mt-1 text-muted-foreground">{error}</p>
            <Button className="mt-4" variant="primary" onClick={load}>Try again</Button>
          </div>
        ) : !data ? (
          <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-lg" />)}</div>
        ) : listings.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-lg font-semibold">{status === "pending" && !filtered ? "No listings waiting for review" : "No listings match"}</p>
            <p className="mt-1 text-muted-foreground">
              {filtered ? "Try a different search or clear the filters." : "Listings will appear here as sellers post them."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className={cn("relative hidden overflow-x-auto md:block", loading && "opacity-60")}>
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/60 text-left text-[13px] text-muted-foreground">
                  <tr>
                    <th className="w-10 py-3 pl-4">
                      <Checkbox label="Select all on this page" checked={allSelected} indeterminate={selected.size > 0} onChange={toggleAll} />
                    </th>
                    <th className="px-3 py-3 font-semibold">Car</th>
                    <th className="px-3 py-3 font-semibold">Seller</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-3 py-3 font-semibold">Papers</th>
                    <th className="px-3 py-3 text-right font-semibold">Views</th>
                    <th className="px-3 py-3 font-semibold">Listed</th>
                    <th className="py-3 pl-3 pr-4 text-right font-semibold"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {listings.map((l) => (
                    <tr key={l._id} className={cn("align-middle", selected.has(l._id) ? "bg-accent/60" : "hover:bg-muted/40")}>
                      <td className="py-3 pl-4">
                        <Checkbox label={`Select ${l.title}`} checked={selected.has(l._id)} onChange={(on) => toggleOne(l._id, on)} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                            <CarImage src={l.thumb} alt="" sizes="64px" />
                          </div>
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5">
                              <span className="max-w-[16rem] truncate font-semibold" title={l.title}>{l.title}</span>
                              {l.featured && <Star size={14} className="shrink-0 fill-marigold text-[#b27c00]" aria-label="Featured" />}
                            </p>
                            <p className="text-muted-foreground">
                              <span className="font-semibold text-foreground tabular">{formatLakh(l.price)}</span>, {l.year} {l.make}, {l.location}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <p className="max-w-[10rem] truncate font-medium">{l.sellerId?.name || "Unknown"}</p>
                        <p className="capitalize text-muted-foreground">{l.sellerId?.role || "—"}</p>
                      </td>
                      <td className="px-3 py-3">
                        <StatusSelect listing={l} disabled={busy === l._id} onChange={(s) => patchOne(l, { status: s }, `Status set to ${STATUS_LABEL[s]}.`)} />
                      </td>
                      <td className="px-3 py-3">
                        <PapersCell listing={l} onInspect={() => setInspecting(l)} />
                      </td>
                      <td className="px-3 py-3 text-right tabular">{l.views.toLocaleString("en-IN")}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">{timeAgo(l.createdAt)}</td>
                      <td className="py-3 pl-3 pr-4">
                        <RowActions
                          listing={l}
                          busy={busy === l._id}
                          onFeature={() => patchOne(l, { featured: !l.featured }, l.featured ? "Removed from featured." : "Marked as featured.")}
                          onEdit={() => setEditing(l)}
                          onDelete={() => remove([l._id], l.title)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Phone cards */}
            <ul className={cn("divide-y divide-border md:hidden", loading && "opacity-60")}>
              <li className="flex items-center gap-3 bg-muted/60 px-4 py-2.5 text-sm">
                <Checkbox label="Select all on this page" checked={allSelected} indeterminate={selected.size > 0} onChange={toggleAll} />
                <span className="text-muted-foreground">Select all</span>
              </li>
              {listings.map((l) => (
                <li key={l._id} className={cn("px-4 py-3.5", selected.has(l._id) && "bg-accent/60")}>
                  <div className="flex gap-3">
                    <div className="pt-1">
                      <Checkbox label={`Select ${l.title}`} checked={selected.has(l._id)} onChange={(on) => toggleOne(l._id, on)} />
                    </div>
                    <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                      <CarImage src={l.thumb} alt="" sizes="80px" />
                    </div>
                    <div className="min-w-0 grow">
                      <p className="truncate font-semibold">{l.title}</p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground tabular">{formatLakh(l.price)}</span>, {l.sellerId?.name || "Unknown"}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StatusBadge status={l.status} />
                        <PapersCell listing={l} onInspect={() => setInspecting(l)} compact />
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between pl-8">
                    <StatusSelect listing={l} disabled={busy === l._id} onChange={(s) => patchOne(l, { status: s }, `Status set to ${STATUS_LABEL[s]}.`)} />
                    <RowActions
                      listing={l}
                      busy={busy === l._id}
                      onFeature={() => patchOne(l, { featured: !l.featured }, l.featured ? "Removed from featured." : "Marked as featured.")}
                      onEdit={() => setEditing(l)}
                      onDelete={() => remove([l._id], l.title)}
                    />
                  </div>
                </li>
              ))}
            </ul>

            <Pagination page={data.page} pages={data.pages} total={data.total} noun={data.total === 1 ? "listing" : "listings"} onPage={(p) => setParams({ page: String(p) }, false)} />
          </>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="animate-in fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-4xl flex-wrap items-center gap-2 rounded-xl bg-ink-deep p-2.5 pl-4 text-white shadow-pop lg:left-[calc(16rem+1.5rem)]">
          <p className="mr-auto text-sm font-semibold tabular">{selected.size} selected</p>
          <BulkButton onClick={() => bulk({ status: "active" }, "{n} listings are live.")} disabled={busy === "bulk"}>Approve</BulkButton>
          <BulkButton onClick={() => bulk({ status: "sold" }, "{n} listings marked sold.")} disabled={busy === "bulk"}>Mark sold</BulkButton>
          <BulkButton onClick={() => bulk({ status: "removed" }, "{n} listings removed from the site.")} disabled={busy === "bulk"}>Remove</BulkButton>
          <BulkButton onClick={() => bulk({ featured: true }, "{n} listings featured.")} disabled={busy === "bulk"}>Feature</BulkButton>
          <BulkButton onClick={() => bulk({ paperVerified: true, paperVerifiedAt: new Date().toISOString() }, "{n} listings marked Paper Verified.")} disabled={busy === "bulk"}>
            Verify papers
          </BulkButton>
          <button
            onClick={() => remove(Array.from(selected), `${selected.size} listings`)}
            disabled={busy === "bulk"}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-destructive px-3 text-sm font-semibold hover:bg-[#a82020] disabled:opacity-50"
          >
            <Trash2 size={15} aria-hidden /> Delete
          </button>
          <button onClick={() => setSelected(new Set())} className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white" aria-label="Clear selection">
            <X size={18} />
          </button>
        </div>
      )}

      {editing && (
        <EditListing
          listing={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            toast.success("Changes saved.");
            await refreshAll();
          }}
        />
      )}

      {inspecting && (
        <PapersInspector
          listing={inspecting}
          onClose={() => setInspecting(null)}
          onDecision={async (verified, note) => {
            await patchOne(
              inspecting,
              // null (not undefined) so revoking actually clears the date on the server.
              { paperVerified: verified, paperVerifiedAt: (verified ? new Date().toISOString() : null) as string | undefined, paperVerificationNote: note },
              verified ? `“${inspecting.title}” is now Paper Verified.` : `Paper Verified removed from “${inspecting.title}”.`
            );
            setInspecting(null);
          }}
        />
      )}

      {dialog}
    </div>
  );
}

function BulkButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className="h-9 rounded-lg border border-white/20 px-3 text-sm font-semibold hover:border-white/50 hover:bg-white/10 disabled:opacity-50">
      {children}
    </button>
  );
}

function StatusSelect({ listing, disabled, onChange }: { listing: Listing; disabled: boolean; onChange: (s: string) => void }) {
  return (
    <div className="relative inline-flex items-center">
      <StatusBadge status={listing.status} />
      {/* Transparent select over the badge: looks like a pill, behaves like a native dropdown. */}
      <select
        value={listing.status}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`Status for ${listing.title}`}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {Object.entries(STATUS_LABEL).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
      </select>
      {disabled && <Loader2 size={14} className="ml-1.5 animate-spin text-muted-foreground" aria-hidden />}
    </div>
  );
}

function PapersCell({ listing, onInspect, compact }: { listing: Listing; onInspect: () => void; compact?: boolean }) {
  if (listing.paperVerified) {
    return (
      <button onClick={onInspect} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#e3f5ec] px-2.5 py-0.5 text-[13px] font-semibold text-[#0b6b43] hover:ring-1 hover:ring-[#0b6b43]">
        <ShieldCheck size={14} aria-hidden /> Verified
      </button>
    );
  }
  if (listing.docCount > 0) {
    return (
      <button onClick={onInspect} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-accent px-2.5 py-0.5 text-[13px] font-semibold text-accent-foreground hover:ring-1 hover:ring-accent-foreground">
        <FileSearch size={14} aria-hidden /> {compact ? `${listing.docCount} to check` : `Check ${listing.docCount} ${listing.docCount === 1 ? "paper" : "papers"}`}
      </button>
    );
  }
  return <span className="whitespace-nowrap text-[13px] text-muted-foreground">None uploaded</span>;
}

function RowActions({ listing, busy, onFeature, onEdit, onDelete }: { listing: Listing; busy: boolean; onFeature: () => void; onEdit: () => void; onDelete: () => void }) {
  const icon = "rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50";
  return (
    <div className="flex items-center justify-end gap-0.5">
      <button onClick={onFeature} disabled={busy} className={icon} aria-label={listing.featured ? "Remove from featured" : "Mark as featured"} title={listing.featured ? "Remove from featured" : "Mark as featured"}>
        <Star size={17} className={listing.featured ? "fill-marigold text-[#b27c00]" : ""} />
      </button>
      <button onClick={onEdit} className={icon} aria-label={`Edit ${listing.title}`} title="Edit">
        <Pencil size={17} />
      </button>
      <Link href={`/cars/${listing.slug}`} target="_blank" className={icon} aria-label={`Open ${listing.title} on the site`} title="Open on site">
        <ExternalLink size={17} />
      </Link>
      <button onClick={onDelete} disabled={busy} className={cn(icon, "hover:bg-[#fde8e8] hover:text-destructive")} aria-label={`Delete ${listing.title}`} title="Delete">
        <Trash2 size={17} />
      </button>
    </div>
  );
}

/* ─── Edit ─────────────────────────────────────────── */
function EditListing({ listing, onClose, onSaved }: { listing: Listing; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    title: listing.title,
    description: listing.description || "",
    price: listing.price,
    condition: listing.condition,
    status: listing.status,
    make: listing.make || "",
    model: listing.model || "",
    year: listing.year || new Date().getFullYear(),
    mileage: listing.mileage || 0,
    fuelType: listing.fuelType || "petrol",
    transmission: listing.transmission || "manual",
    engineSize: listing.engineSize || 0,
    color: listing.color || "",
    location: listing.location || "",
    featured: !!listing.featured,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.title.trim()) return setError("Add a title.");
    if (!(form.price > 0)) return setError("Price must be more than zero.");
    setSaving(true);
    setError("");
    try {
      await api("/api/admin/listings", { method: "PATCH", body: JSON.stringify({ id: listing._id, ...form }) });
      onSaved();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  };

  const num = (k: "price" | "year" | "mileage" | "engineSize") => ({
    type: "number" as const,
    inputMode: "numeric" as const,
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k, Number(e.target.value)),
    className: inputClass,
  });

  return (
    <Modal
      open
      onClose={onClose}
      title="Edit listing"
      description={listing.title}
      size="lg"
      footer={
        <>
          {error && <p role="alert" className="mr-auto text-sm font-medium text-destructive">{error}</p>}
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={() => save()}>Save changes</Button>
        </>
      }
    >
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-6">
        <div className="sm:col-span-6">
          <Field label="Title" htmlFor="e-title">
            <input id="e-title" data-autofocus value={form.title} onChange={(e) => set("title", e.target.value)} className={inputClass} />
          </Field>
        </div>
        <div className="sm:col-span-6">
          <Field label="Description" htmlFor="e-desc">
            <textarea id="e-desc" rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} className={cn(inputClass, "h-auto py-2")} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Price (taka)" htmlFor="e-price" hint={form.price > 0 ? `${formatTaka(form.price)}, ${formatLakh(form.price)}` : undefined}>
            <input id="e-price" {...num("price")} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Status" htmlFor="e-status">
            <select id="e-status" value={form.status} onChange={(e) => set("status", e.target.value)} className={inputClass}>
              {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Condition" htmlFor="e-cond">
            <select id="e-cond" value={form.condition} onChange={(e) => set("condition", e.target.value)} className={inputClass}>
              <option value="new">New</option>
              <option value="used">Used</option>
              <option value="reconditioned">Reconditioned</option>
            </select>
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Make" htmlFor="e-make"><input id="e-make" value={form.make} onChange={(e) => set("make", e.target.value)} className={inputClass} /></Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Model" htmlFor="e-model"><input id="e-model" value={form.model} onChange={(e) => set("model", e.target.value)} className={inputClass} /></Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Year" htmlFor="e-year"><input id="e-year" {...num("year")} /></Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Mileage (km)" htmlFor="e-km"><input id="e-km" {...num("mileage")} /></Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Fuel" htmlFor="e-fuel">
            <select id="e-fuel" value={form.fuelType} onChange={(e) => set("fuelType", e.target.value)} className={inputClass}>
              {["petrol", "octane", "hybrid", "diesel", "cng", "electric"].map((f) => <option key={f} value={f}>{f === "cng" ? "CNG" : f[0].toUpperCase() + f.slice(1)}</option>)}
            </select>
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Transmission" htmlFor="e-trans">
            <select id="e-trans" value={form.transmission} onChange={(e) => set("transmission", e.target.value)} className={inputClass}>
              <option value="automatic">Automatic</option>
              <option value="manual">Manual</option>
              <option value="semi-automatic">Semi-automatic</option>
            </select>
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Engine (cc)" htmlFor="e-cc"><input id="e-cc" {...num("engineSize")} /></Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Colour" htmlFor="e-color"><input id="e-color" value={form.color} onChange={(e) => set("color", e.target.value)} className={inputClass} /></Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Location" htmlFor="e-loc"><input id="e-loc" value={form.location} onChange={(e) => set("location", e.target.value)} className={inputClass} /></Field>
        </div>
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 sm:col-span-6">
          <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="h-[18px] w-[18px] accent-primary" />
          <span>
            <span className="block text-sm font-semibold">Featured</span>
            <span className="block text-sm text-muted-foreground">Shown first in search results and on the home page.</span>
          </span>
        </label>
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}

/* ─── Papers ───────────────────────────────────────── */
// Decoded by hand: fetch("data:…") is blocked by the site's connect-src CSP.
function dataUrlToBlob(dataUrl: string) {
  const [meta, payload = ""] = dataUrl.split(",", 2);
  const mime = /data:([^;]+)/.exec(meta)?.[1] || "application/octet-stream";
  if (!meta.includes(";base64")) return new Blob([decodeURIComponent(payload)], { type: mime });
  const bin = atob(payload);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function PapersInspector({
  listing,
  onClose,
  onDecision,
}: {
  listing: Listing;
  onClose: () => void;
  onDecision: (verified: boolean, note: string) => Promise<void>;
}) {
  const [docs, setDocs] = useState<string[] | null>(null);
  const [urls, setUrls] = useState<string[]>([]);
  const [active, setActive] = useState(0);
  const [error, setError] = useState("");
  const [note, setNote] = useState(listing.paperVerificationNote || "");
  const [saving, setSaving] = useState(false);

  // Scans are private and can be large, so they're only fetched when the inspector opens.
  useEffect(() => {
    let cancelled = false;
    const created: string[] = [];
    api<{ documents: string[] }>(`/api/admin/listings?id=${listing._id}&docs=1`)
      .then(async ({ documents }) => {
        // Browsers refuse to open data: URLs in a new tab, so convert them to blob URLs.
        const resolved = await Promise.all(
          documents.map(async (d) => {
            if (!d.startsWith("data:")) return d;
            const u = URL.createObjectURL(dataUrlToBlob(d));
            created.push(u);
            return u;
          })
        );
        if (!cancelled) {
          setDocs(documents);
          setUrls(resolved);
        }
      })
      .catch((e) => !cancelled && setError((e as Error).message));
    return () => {
      cancelled = true;
      created.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [listing._id]);

  const isPdf = (i: number) => !!docs && (docs[i].startsWith("data:application/pdf") || docs[i].toLowerCase().split("?")[0].endsWith(".pdf"));

  const decide = async (verified: boolean) => {
    setSaving(true);
    await onDecision(verified, note.trim());
    setSaving(false);
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title="Check car papers"
      description={
        <>
          {listing.title}, listed by {listing.sellerId?.name || "unknown seller"}
          {listing.sellerId?.phone ? ` (${listing.sellerId.phone})` : ""}
        </>
      }
      footer={
        listing.paperVerified ? (
          <>
            <p className="mr-auto flex items-center gap-1.5 text-sm font-semibold text-verified">
              <ShieldCheck size={16} aria-hidden /> Verified {listing.paperVerifiedAt ? timeAgo(listing.paperVerifiedAt) : ""}
            </p>
            <Button onClick={onClose}>Close</Button>
            <Button variant="danger" loading={saving} onClick={() => decide(false)}>Remove badge</Button>
          </>
        ) : (
          <>
            <Button onClick={onClose}>Not now</Button>
            <Button variant="success" loading={saving} disabled={!docs || docs.length === 0} onClick={() => decide(true)}>
              <ShieldCheck size={16} /> Mark Paper Verified
            </Button>
          </>
        )
      }
    >
      <p className="mb-4 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
        Only admins can see these files. Buyers only see the Paper Verified badge.
      </p>

      {error ? (
        <p role="alert" className="text-destructive">{error}</p>
      ) : !docs ? (
        <div className="skeleton h-80 rounded-lg" />
      ) : docs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-input p-10 text-center">
          <FileText size={30} className="mx-auto text-muted-foreground" aria-hidden />
          <p className="mt-2 font-semibold">No papers uploaded</p>
          <p className="text-sm text-muted-foreground">Ask the seller to add their registration, tax token and fitness certificate.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_16rem]">
          <div>
            <div className="flex h-[min(60vh,32rem)] items-center justify-center overflow-hidden rounded-lg bg-ink-deep">
              {isPdf(active) ? (
                <iframe src={urls[active]} title={`Paper ${active + 1}`} className="h-full w-full bg-white" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- private scans, never optimised or cached
                <img src={urls[active]} alt={`Paper ${active + 1}`} className="max-h-full max-w-full object-contain" />
              )}
            </div>
            <a href={urls[active]} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
              <ExternalLink size={14} aria-hidden /> Open full size
            </a>
          </div>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-semibold">Files ({docs.length})</p>
              <div className="flex flex-wrap gap-1.5 lg:flex-col">
                {docs.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    aria-pressed={active === i}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium",
                      active === i ? "bg-ink text-white" : "bg-muted hover:bg-secondary"
                    )}
                  >
                    {isPdf(i) ? <FileText size={15} aria-hidden /> : <Eye size={15} aria-hidden />}
                    Paper {i + 1}
                    <span className="ml-auto text-xs opacity-75">{isPdf(i) ? "PDF" : "Image"}</span>
                  </button>
                ))}
              </div>
            </div>
            <Field label="Note for the record" htmlFor="paper-note" hint="Visible to admins only.">
              <textarea
                id="paper-note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Tax token valid to Dec 2026"
                className={cn(inputClass, "h-auto py-2")}
              />
            </Field>
          </div>
        </div>
      )}
    </Modal>
  );
}
