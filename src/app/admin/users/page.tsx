"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BadgeCheck, Download, Search, Trash2, X } from "lucide-react";
import { Button, Checkbox, CountTabs, PageHeader, Pagination, api, inputClass, useConfirm } from "@/components/admin/ui";
import { useToast } from "@/components/admin/Toast";
import { cn, timeAgo } from "@/lib/utils";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isVerified: boolean;
  city?: string;
  dealershipName?: string;
  createdAt: string;
  listingCount: number;
  activeCount: number;
}

interface UsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  pages: number;
  counts: Record<string, number>;
  currentUserId?: string;
}

const ROLES = ["buyer", "seller", "dealer", "admin", "guest"];
const ROLE_LABEL: Record<string, string> = { buyer: "Buyer", seller: "Seller", dealer: "Dealer", admin: "Admin", guest: "Guest" };

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="skeleton h-96 rounded-xl" />}>
      <UsersManager />
    </Suspense>
  );
}

function UsersManager() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const toast = useToast();
  const { confirm, dialog } = useConfirm();

  const role = params.get("role") || "all";
  const q = params.get("q") || "";
  const verified = params.get("verified") || "";
  const page = Number(params.get("page")) || 1;

  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [search, setSearch] = useState(q);

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
    if (role !== "all") p.set("role", role);
    if (q) p.set("q", q);
    if (verified) p.set("verified", verified);
    p.set("page", String(page));
    p.set("limit", "25");
    return p.toString();
  }, [role, q, verified, page]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await api<UsersResponse>(`/api/admin/users?${queryString}`));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => setSelected(new Set()), [queryString]);
  useEffect(() => setSearch(q), [q]);
  useEffect(() => {
    if (search === q) return;
    const t = setTimeout(() => setParams({ q: search.trim() || undefined }), 350);
    return () => clearTimeout(t);
  }, [search, q, setParams]);

  const update = async (ids: string[], body: Record<string, unknown>, message: string) => {
    setBusy(ids.length === 1 ? ids[0] : "bulk");
    try {
      await api("/api/admin/users", { method: "PATCH", body: JSON.stringify({ ids, ...body }) });
      toast.success(message);
      setSelected(new Set());
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const changeRole = async (u: AdminUser, next: string) => {
    if (next === "admin") {
      const ok = await confirm({
        title: `Make ${u.name} an admin?`,
        body: "Admins can approve and delete listings, change any account and edit site settings.",
        confirmLabel: "Make admin",
      });
      if (!ok) return;
    }
    await update([u._id], { role: next }, `${u.name} is now ${ROLE_LABEL[next].toLowerCase() === "admin" ? "an admin" : `a ${ROLE_LABEL[next].toLowerCase()}`}.`);
  };

  const remove = async (ids: string[], label: string, listingCount: number) => {
    const ok = await confirm({
      title: ids.length === 1 ? `Delete ${label}?` : `Delete ${ids.length} accounts?`,
      body:
        listingCount > 0
          ? `This can't be undone. Their ${listingCount} ${listingCount === 1 ? "listing stays" : "listings stay"} on the site without a seller; remove those from Listings first if needed.`
          : "This can't be undone.",
      confirmLabel: ids.length === 1 ? "Delete account" : `Delete ${ids.length} accounts`,
      tone: "danger",
    });
    if (!ok) return;
    setBusy(ids.length === 1 ? ids[0] : "bulk");
    try {
      const res = await api<{ deleted: number }>("/api/admin/users", { method: "DELETE", body: JSON.stringify({ ids }) });
      toast.success(`Deleted ${res.deleted} ${res.deleted === 1 ? "account" : "accounts"}.`);
      setSelected(new Set());
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const exportCsv = async () => {
    try {
      const base = new URLSearchParams(queryString);
      base.set("limit", "200");
      const rows: AdminUser[] = [];
      for (let p = 1; p <= 50; p++) {
        base.set("page", String(p));
        const res = await api<UsersResponse>(`/api/admin/users?${base.toString()}`);
        rows.push(...res.users);
        if (p >= res.pages) break;
      }
      const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const header = ["Name", "Email", "Phone", "Role", "Verified", "City", "Dealership", "Listings", "Live listings", "Joined"];
      const lines = rows.map((u) =>
        [u.name, u.email, u.phone, ROLE_LABEL[u.role] || u.role, u.isVerified ? "Yes" : "No", u.city, u.dealershipName, u.listingCount, u.activeCount, new Date(u.createdAt).toISOString().slice(0, 10)].map(esc).join(",")
      );
      const blob = new Blob(["﻿" + [header.map(esc).join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `carhat-users-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success(`Exported ${rows.length} accounts.`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const users = data?.users || [];
  const selfId = data?.currentUserId;
  const selectable = users.filter((u) => u._id !== selfId);
  const allSelected = selectable.length > 0 && selectable.every((u) => selected.has(u._id));
  const toggle = (id: string, on: boolean) =>
    setSelected((s) => {
      const n = new Set(s);
      if (on) n.add(id);
      else n.delete(id);
      return n;
    });

  const counts = data?.counts;
  const tabs = [
    { value: "all", label: "All", count: counts?.all },
    ...ROLES.filter((r) => r !== "guest" || (counts?.guest || 0) > 0).map((r) => ({ value: r, label: `${ROLE_LABEL[r]}s`, count: counts?.[r] })),
  ];

  const selectedListingCount = users.filter((u) => selected.has(u._id)).reduce((a, u) => a + u.listingCount, 0);

  return (
    <div className="space-y-5 pb-24">
      <PageHeader
        title="Users"
        description="Verify sellers, manage roles and find any account."
        actions={
          <Button onClick={exportCsv} disabled={!data || data.total === 0}>
            <Download size={16} /> Export CSV
          </Button>
        }
      />

      <CountTabs label="Filter by role" tabs={tabs} value={role} onChange={(v) => setParams({ role: v === "all" ? undefined : v })} />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[14rem] grow sm:max-w-sm">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, email, phone or dealership"
            aria-label="Search users"
            className={cn(inputClass, "pl-9")}
          />
        </div>
        <select value={verified} onChange={(e) => setParams({ verified: e.target.value || undefined })} aria-label="Filter by verification" className={cn(inputClass, "w-auto")}>
          <option value="">Verified or not</option>
          <option value="1">Verified only</option>
          <option value="0">Not verified</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {error ? (
          <div className="p-10 text-center">
            <p className="font-semibold">Users couldn&apos;t load.</p>
            <p className="mt-1 text-muted-foreground">{error}</p>
            <Button className="mt-4" variant="primary" onClick={load}>Try again</Button>
          </div>
        ) : !data ? (
          <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-lg" />)}</div>
        ) : users.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-lg font-semibold">No accounts match</p>
            <p className="mt-1 text-muted-foreground">Try another name or email, or clear the filters.</p>
          </div>
        ) : (
          <>
            <div className={cn("relative overflow-x-auto", loading && "opacity-60")}>
              <table className="w-full min-w-[46rem] text-sm">
                <thead className="border-b border-border bg-muted/60 text-left text-[13px] text-muted-foreground">
                  <tr>
                    <th className="w-10 py-3 pl-4">
                      <Checkbox label="Select all on this page" checked={allSelected} indeterminate={selected.size > 0} onChange={(on) => setSelected(on ? new Set(selectable.map((u) => u._id)) : new Set())} />
                    </th>
                    <th className="px-3 py-3 font-semibold">Account</th>
                    <th className="px-3 py-3 font-semibold">Role</th>
                    <th className="px-3 py-3 font-semibold">Verified</th>
                    <th className="px-3 py-3 text-right font-semibold">Listings</th>
                    <th className="px-3 py-3 font-semibold">Joined</th>
                    <th className="py-3 pl-3 pr-4"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((u) => {
                    const isSelf = u._id === selfId;
                    return (
                      <tr key={u._id} className={cn(selected.has(u._id) ? "bg-accent/60" : "hover:bg-muted/40")}>
                        <td className="py-3 pl-4">
                          {!isSelf && <Checkbox label={`Select ${u.name}`} checked={selected.has(u._id)} onChange={(on) => toggle(u._id, on)} />}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary">
                              {u.name?.[0]?.toUpperCase() || "?"}
                            </span>
                            <div className="min-w-0">
                              <p className="max-w-[16rem] truncate font-semibold">
                                {u.dealershipName || u.name} {isSelf && <span className="font-normal text-muted-foreground">(you)</span>}
                              </p>
                              <p className="max-w-[16rem] truncate text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <select
                            value={u.role}
                            disabled={isSelf || busy === u._id}
                            onChange={(e) => changeRole(u, e.target.value)}
                            aria-label={`Role for ${u.name}`}
                            className="h-8 rounded-md border border-input bg-card px-2 text-sm font-medium disabled:opacity-60"
                          >
                            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-3">
                          <button
                            role="switch"
                            aria-checked={u.isVerified}
                            aria-label={`${u.name} verified`}
                            disabled={busy === u._id}
                            onClick={() => update([u._id], { isVerified: !u.isVerified }, u.isVerified ? `${u.name} is no longer verified.` : `${u.name} is verified.`)}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[13px] font-semibold transition-colors",
                              u.isVerified ? "bg-[#e6eefa] text-primary hover:ring-1 hover:ring-primary" : "bg-muted text-muted-foreground hover:ring-1 hover:ring-input"
                            )}
                          >
                            {u.isVerified ? <><BadgeCheck size={14} aria-hidden /> Verified</> : "Not verified"}
                          </button>
                        </td>
                        <td className="px-3 py-3 text-right tabular">
                          {u.listingCount > 0 ? (
                            <Link href={`/admin/listings?q=${encodeURIComponent(u.name)}`} className="hover:text-primary hover:underline">
                              {u.listingCount} <span className="text-muted-foreground">({u.activeCount} live)</span>
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">{timeAgo(u.createdAt)}</td>
                        <td className="py-3 pl-3 pr-4 text-right">
                          {!isSelf && (
                            <button
                              onClick={() => remove([u._id], u.name, u.listingCount)}
                              disabled={busy === u._id}
                              className="rounded-lg p-2 text-muted-foreground hover:bg-[#fde8e8] hover:text-destructive disabled:opacity-50"
                              aria-label={`Delete ${u.name}`}
                            >
                              <Trash2 size={17} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={data.page} pages={data.pages} total={data.total} noun={data.total === 1 ? "account" : "accounts"} onPage={(p) => setParams({ page: String(p) }, false)} />
          </>
        )}
      </div>

      {selected.size > 0 && (
        <div className="animate-in fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-3xl flex-wrap items-center gap-2 rounded-xl bg-ink-deep p-2.5 pl-4 text-white shadow-pop lg:left-[calc(16rem+1.5rem)]">
          <p className="mr-auto text-sm font-semibold tabular">{selected.size} selected</p>
          <button
            onClick={() => update(Array.from(selected), { isVerified: true }, `Verified ${selected.size} accounts.`)}
            disabled={busy === "bulk"}
            className="h-9 rounded-lg border border-white/20 px-3 text-sm font-semibold hover:border-white/50 hover:bg-white/10"
          >
            Verify
          </button>
          <select
            value=""
            onChange={(e) => e.target.value && update(Array.from(selected), { role: e.target.value }, `Role changed for ${selected.size} accounts.`)}
            aria-label="Change role for selected"
            className="h-9 rounded-lg border border-white/20 bg-transparent px-2 text-sm font-semibold [&>option]:text-foreground"
          >
            <option value="">Change role…</option>
            {ROLES.filter((r) => r !== "admin").map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
          <button
            onClick={() => remove(Array.from(selected), `${selected.size} accounts`, selectedListingCount)}
            disabled={busy === "bulk"}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-destructive px-3 text-sm font-semibold hover:bg-[#a82020]"
          >
            <Trash2 size={15} aria-hidden /> Delete
          </button>
          <button onClick={() => setSelected(new Set())} className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white" aria-label="Clear selection">
            <X size={18} />
          </button>
        </div>
      )}

      {dialog}
    </div>
  );
}
