"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Ban, BadgeCheck, CheckCircle2, Copy, Download, ExternalLink, Eye, Heart, MessageSquare, Search, ShieldCheck, Trash2, UserPlus, X,
} from "lucide-react";
import { Button, Checkbox, CountTabs, Field, Modal, PageHeader, Pagination, StatusBadge, api, inputClass, useConfirm } from "@/components/admin/ui";
import { useToast } from "@/components/admin/Toast";
import { CarImage } from "@/components/CarImage";
import { cn, formatLakh, timeAgo } from "@/lib/utils";
import { dialableNumber, formatPhoneNumber, normalisePhoneNumber } from "@/lib/contact-details";
import { MARKETPLACE_ROLE_LABEL, isStaffRole } from "@/lib/permissions";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  whatsappNumber?: string;
  role: string;
  isVerified: boolean;
  city?: string;
  dealershipName?: string;
  createdAt: string;
  lastLoginAt?: string;
  status?: "active" | "suspended";
  suspendedReason?: string;
  listingCount: number;
  activeCount: number;
}

interface UsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  pages: number;
  counts: Record<string, number>;
  suspended: number;
  roles: { key: string; name: string }[];
  currentUserId?: string;
  can: { manage: boolean; delete: boolean; roles: boolean; admin: boolean };
}

const CUSTOMER_ROLES = ["buyer", "seller", "dealer", "guest"];
const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "active", label: "Recently active" },
  { value: "name", label: "Name A–Z" },
  { value: "listings", label: "Most listings" },
];

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
  const status = params.get("status") || "";
  const sort = params.get("sort") || "newest";
  const page = Number(params.get("page")) || 1;

  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [search, setSearch] = useState(q);
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [suspending, setSuspending] = useState<{ ids: string[]; label: string } | null>(null);

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
    if (status) p.set("status", status);
    if (sort !== "newest") p.set("sort", sort);
    p.set("page", String(page));
    p.set("limit", "25");
    return p.toString();
  }, [role, q, verified, status, sort, page]);

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

  const roleName = useCallback(
    (key: string) => MARKETPLACE_ROLE_LABEL[key] || data?.roles.find((r) => r.key === key)?.name || key,
    [data]
  );

  const update = async (ids: string[], body: Record<string, unknown>, message: string) => {
    setBusy(ids.length === 1 ? ids[0] : "bulk");
    try {
      await api("/api/admin/users", { method: "PATCH", body: JSON.stringify({ ids, ...body }) });
      toast.success(message);
      setSelected(new Set());
      await load();
      return true;
    } catch (e) {
      toast.error((e as Error).message);
      return false;
    } finally {
      setBusy(null);
    }
  };

  const changeRole = async (u: AdminUser, next: string) => {
    if (isStaffRole(next)) {
      const ok = await confirm({
        title: `Give ${u.name} the ${roleName(next)} role?`,
        body: next === "admin"
          ? "Admins can do everything: approve and delete listings, change any account, edit roles and site settings."
          : "They'll be able to open the admin area and use what this role allows. You can change it any time.",
        confirmLabel: `Make ${roleName(next)}`,
      });
      if (!ok) return;
    }
    await update([u._id], { role: next }, `${u.name} is now ${roleName(next)}.`);
  };

  const remove = async (ids: string[], label: string, listingCount: number) => {
    const ok = await confirm({
      title: ids.length === 1 ? `Delete ${label}?` : `Delete ${ids.length} accounts?`,
      body:
        listingCount > 0
          ? `This can't be undone. Their ${listingCount} ${listingCount === 1 ? "listing is" : "listings are"} taken off sale and kept as removed. Suspending keeps the account instead.`
          : "This can't be undone. Suspending keeps the account and its history instead.",
      confirmLabel: ids.length === 1 ? "Delete account" : `Delete ${ids.length} accounts`,
      tone: "danger",
    });
    if (!ok) return;
    setBusy(ids.length === 1 ? ids[0] : "bulk");
    try {
      const res = await api<{ deleted: number }>("/api/admin/users", { method: "DELETE", body: JSON.stringify({ ids }) });
      toast.success(`Deleted ${res.deleted} ${res.deleted === 1 ? "account" : "accounts"}.`);
      setSelected(new Set());
      setOpenId(null);
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
      const esc = (v: unknown) => {
        const s = String(v ?? "");
        return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
      };
      const header = ["Name", "Email", "Phone", "WhatsApp", "Role", "Status", "Verified", "City", "Dealership", "Listings", "Live listings", "Joined", "Last sign-in"];
      const lines = rows.map((u) =>
        [u.name, u.email, formatPhoneNumber(u.phone), formatPhoneNumber(u.whatsappNumber), roleName(u.role), u.status === "suspended" ? "Suspended" : "Active", u.isVerified ? "Yes" : "No", u.city, u.dealershipName, u.listingCount, u.activeCount,
          new Date(u.createdAt).toISOString().slice(0, 10), u.lastLoginAt ? new Date(u.lastLoginAt).toISOString().slice(0, 10) : ""].map(esc).join(",")
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
  const can = data?.can;
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
    { value: "team", label: "Team", count: counts?.team },
    ...CUSTOMER_ROLES.filter((r) => r !== "guest" || (counts?.guest || 0) > 0).map((r) => ({ value: r, label: `${MARKETPLACE_ROLE_LABEL[r]}s`, count: counts?.[r] })),
    // A staff role picked from Roles & access gets its own tab while it's being viewed.
    ...(data && role !== "all" && role !== "team" && !CUSTOMER_ROLES.includes(role) ? [{ value: role, label: roleName(role), count: counts?.[role] }] : []),
  ];

  const selectedUsers = users.filter((u) => selected.has(u._id));
  const selectedListingCount = selectedUsers.reduce((a, u) => a + u.listingCount, 0);

  /** Which roles this person may hand out: team roles need "manage roles", admin needs an admin. */
  const roleOptions = (current: string) => (
    <>
      <optgroup label="Customer">
        {CUSTOMER_ROLES.filter((r) => r !== "guest" || current === "guest").map((r) => <option key={r} value={r}>{MARKETPLACE_ROLE_LABEL[r]}</option>)}
      </optgroup>
      <optgroup label="Team">
        {(data?.roles || []).map((r) => (
          <option key={r.key} value={r.key} disabled={!can?.roles || (r.key === "admin" && !can?.admin)}>{r.name}</option>
        ))}
      </optgroup>
    </>
  );

  return (
    <div className="space-y-5 pb-24">
      <PageHeader
        title="Users"
        description={<>Verify sellers, manage roles, suspend accounts and find anyone.{data?.suspended ? <> <button type="button" onClick={() => setParams({ status: "suspended" })} className="font-semibold text-destructive hover:underline">{data.suspended} suspended</button>.</> : null}</>}
        actions={
          <>
            <Button onClick={exportCsv} disabled={!data || data.total === 0}><Download size={16} /> Export CSV</Button>
            {can?.manage && <Button variant="primary" onClick={() => setAdding(true)}><UserPlus size={16} /> Add user</Button>}
          </>
        }
      />

      <CountTabs label="Filter by role" tabs={tabs} value={role} onChange={(v) => setParams({ role: v === "all" ? undefined : v })} />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[14rem] grow sm:max-w-sm">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email, phone, city or dealership" aria-label="Search users" className={cn(inputClass, "pl-9")} />
        </div>
        <select value={verified} onChange={(e) => setParams({ verified: e.target.value || undefined })} aria-label="Filter by verification" className={cn(inputClass, "w-auto")}>
          <option value="">Verified or not</option>
          <option value="1">Verified only</option>
          <option value="0">Not verified</option>
        </select>
        <select value={status} onChange={(e) => setParams({ status: e.target.value || undefined })} aria-label="Filter by status" className={cn(inputClass, "w-auto")}>
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <select value={sort} onChange={(e) => setParams({ sort: e.target.value === "newest" ? undefined : e.target.value })} aria-label="Sort accounts" className={cn(inputClass, "w-auto")}>
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        {(q || verified || status || sort !== "newest") && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setParams({ q: undefined, verified: undefined, status: undefined, sort: undefined }); }}><X size={15} aria-hidden /> Clear</Button>
        )}
      </div>

      <div className="overflow-hidden rounded-3xl border border-hairline bg-white shadow-soft">
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
            {/* Phones get cards; wider screens get the full table. */}
            <ul className={cn("divide-y divide-hairline md:hidden", loading && "opacity-60")}>
              {users.map((u) => (
                <li key={u._id} className="flex items-start gap-3 px-4 py-3">
                  {u._id !== selfId && can?.manage && <div className="pt-2"><Checkbox label={`Select ${u.name}`} checked={selected.has(u._id)} onChange={(on) => toggle(u._id, on)} /></div>}
                  <button type="button" onClick={() => setOpenId(u._id)} className="flex min-w-0 grow items-start gap-3 text-left">
                    <Avatar name={u.name} staff={isStaffRole(u.role)} />
                    <span className="min-w-0 grow">
                      <span className="block truncate font-semibold">{u.dealershipName || u.name}</span>
                      <span className="block truncate text-[13px] text-slate-text">{u.email}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-1.5">
                        <RolePill role={u.role} label={roleName(u.role)} />
                        {u.isVerified && <span className="inline-flex items-center gap-1 text-xs font-semibold text-electric"><BadgeCheck size={13} aria-hidden /> Verified</span>}
                        {u.status === "suspended" && <SuspendedPill reason={u.suspendedReason} />}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <div className={cn("relative hidden overflow-x-auto md:block", loading && "opacity-60")}>
              <table className="w-full min-w-[56rem] text-sm">
                <thead className="border-b border-hairline bg-mist/70 text-left text-[13px] text-slate-text">
                  <tr>
                    <th className="w-10 py-3 pl-4">
                      {can?.manage && <Checkbox label="Select all on this page" checked={allSelected} indeterminate={selected.size > 0} onChange={(on) => setSelected(on ? new Set(selectable.map((u) => u._id)) : new Set())} />}
                    </th>
                    <th className="px-3 py-3 font-semibold">Account</th>
                    <th className="px-3 py-3 font-semibold">Role</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-3 py-3 text-right font-semibold">Listings</th>
                    <th className="px-3 py-3 font-semibold">Last active</th>
                    <th className="px-3 py-3 font-semibold">Joined</th>
                    <th className="py-3 pl-3 pr-4"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {users.map((u) => {
                    const isSelf = u._id === selfId;
                    const lockedTeam = isStaffRole(u.role) && !can?.roles;
                    return (
                      <tr key={u._id} className={cn(selected.has(u._id) ? "bg-haze/50" : "hover:bg-mist/50", u.status === "suspended" && "text-slate-text")}>
                        <td className="py-3 pl-4">
                          {!isSelf && can?.manage && <Checkbox label={`Select ${u.name}`} checked={selected.has(u._id)} onChange={(on) => toggle(u._id, on)} />}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.name} staff={isStaffRole(u.role)} />
                            <div className="min-w-0">
                              <button type="button" onClick={() => setOpenId(u._id)} className="block max-w-[16rem] truncate text-left font-semibold text-night hover:text-electric">
                                {u.dealershipName || u.name} {isSelf && <span className="font-normal text-muted-foreground">(you)</span>}
                              </button>
                              <p className="max-w-[16rem] truncate text-muted-foreground">{u.email}</p>
                              <AdminContactNumbers phone={u.phone} whatsappNumber={u.whatsappNumber} />
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          {can?.manage || can?.roles ? (
                            <select value={u.role} disabled={isSelf || busy === u._id || lockedTeam || (u.role === "admin" && !can?.admin)}
                              onChange={(e) => changeRole(u, e.target.value)} aria-label={`Role for ${u.name}`}
                              className={cn("h-8 max-w-[10rem] rounded-lg border border-input bg-card px-2 text-sm font-medium disabled:opacity-60", isStaffRole(u.role) && "border-electric/40 text-electric-deep")}>
                              {!CUSTOMER_ROLES.includes(u.role) && !data.roles.some((r) => r.key === u.role) && <option value={u.role}>{u.role}</option>}
                              {roleOptions(u.role)}
                            </select>
                          ) : <RolePill role={u.role} label={roleName(u.role)} />}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {u.status === "suspended" ? <SuspendedPill reason={u.suspendedReason} /> : (
                              <button role="switch" aria-checked={u.isVerified} aria-label={`${u.name} verified`} disabled={busy === u._id || !can?.manage}
                                onClick={() => update([u._id], { isVerified: !u.isVerified }, u.isVerified ? `${u.name} is no longer verified.` : `${u.name} is verified.`)}
                                className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[13px] font-semibold transition-colors disabled:cursor-default",
                                  u.isVerified ? "bg-haze text-electric-deep hover:ring-1 hover:ring-electric" : "bg-muted text-muted-foreground hover:ring-1 hover:ring-input")}>
                                {u.isVerified ? <><BadgeCheck size={14} aria-hidden /> Verified</> : "Not verified"}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right tabular">
                          {u.listingCount > 0 ? (
                            <Link href={`/admin/listings?seller=${u._id}`} className="hover:text-electric hover:underline">
                              {u.listingCount} <span className="text-muted-foreground">({u.activeCount} live)</span>
                            </Link>
                          ) : <span className="text-muted-foreground">0</span>}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">{u.lastLoginAt ? timeAgo(u.lastLoginAt) : "—"}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">{timeAgo(u.createdAt)}</td>
                        <td className="py-3 pl-3 pr-4 text-right">
                          <div className="flex justify-end gap-0.5">
                            <button type="button" onClick={() => setOpenId(u._id)} className="rounded-lg p-2 text-muted-foreground hover:bg-mist hover:text-night" aria-label={`View ${u.name}`}><Eye size={17} /></button>
                            {!isSelf && can?.delete && (
                              <button onClick={() => remove([u._id], u.name, u.listingCount)} disabled={busy === u._id}
                                className="rounded-lg p-2 text-muted-foreground hover:bg-danger-soft hover:text-destructive disabled:opacity-50" aria-label={`Delete ${u.name}`}>
                                <Trash2 size={17} />
                              </button>
                            )}
                          </div>
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
        <div className="animate-in fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-3xl flex-wrap items-center gap-2 rounded-2xl bg-night p-2.5 pl-4 text-white shadow-pop">
          <p className="mr-auto text-sm font-semibold tabular">{selected.size} selected</p>
          <button onClick={() => update(Array.from(selected), { isVerified: true }, `Verified ${selected.size} accounts.`)} disabled={busy === "bulk"}
            className="h-9 rounded-lg border border-white/20 px-3 text-sm font-semibold hover:border-white/50 hover:bg-white/10">Verify</button>
          {selectedUsers.some((u) => u.status === "suspended") ? (
            <button onClick={() => update(Array.from(selected), { status: "active" }, `Restored ${selected.size} accounts.`)} disabled={busy === "bulk"}
              className="h-9 rounded-lg border border-white/20 px-3 text-sm font-semibold hover:border-white/50 hover:bg-white/10">Unsuspend</button>
          ) : (
            <button onClick={() => setSuspending({ ids: Array.from(selected), label: `${selected.size} accounts` })} disabled={busy === "bulk"}
              className="h-9 rounded-lg border border-white/20 px-3 text-sm font-semibold hover:border-white/50 hover:bg-white/10">Suspend</button>
          )}
          <select value="" onChange={(e) => e.target.value && update(Array.from(selected), { role: e.target.value }, `Role changed for ${selected.size} accounts.`)}
            aria-label="Change role for selected" className="h-9 rounded-lg border border-white/20 bg-transparent px-2 text-sm font-semibold [&_option]:text-foreground">
            <option value="">Change role…</option>
            {CUSTOMER_ROLES.filter((r) => r !== "guest").map((r) => <option key={r} value={r}>{MARKETPLACE_ROLE_LABEL[r]}</option>)}
          </select>
          {can?.delete && (
            <button onClick={() => remove(Array.from(selected), `${selected.size} accounts`, selectedListingCount)} disabled={busy === "bulk"}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-destructive px-3 text-sm font-semibold hover:bg-[#a82020]">
              <Trash2 size={15} aria-hidden /> Delete
            </button>
          )}
          <button onClick={() => setSelected(new Set())} className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white" aria-label="Clear selection"><X size={18} /></button>
        </div>
      )}

      {openId && data && (
        <UserDrawer id={openId} onClose={() => setOpenId(null)} selfId={selfId} can={data.can} roleName={roleName}
          onChanged={load} onSuspend={(u) => setSuspending({ ids: [u._id], label: u.name })} onDelete={(u, n) => remove([u._id], u.name, n)} />
      )}
      {adding && data && <AddUserModal onClose={() => setAdding(false)} onCreated={load} roleOptions={roleOptions("buyer")} />}
      <SuspendModal target={suspending} onClose={() => setSuspending(null)}
        onConfirm={async (reason) => {
          if (!suspending) return;
          const ok = await update(suspending.ids, { status: "suspended", suspendedReason: reason }, `${suspending.label} suspended. They're signed out within a few minutes.`);
          if (ok) setSuspending(null);
        }} />
      {dialog}
    </div>
  );
}

function Avatar({ name, staff }: { name?: string; staff?: boolean }) {
  return (
    <span className={cn("relative flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold", staff ? "bg-night text-white" : "bg-haze text-electric-deep")} aria-hidden>
      {name?.[0]?.toUpperCase() || "?"}
      {staff && <ShieldCheck size={12} className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white text-electric" />}
    </span>
  );
}

function RolePill({ role, label }: { role: string; label: string }) {
  return <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-semibold", isStaffRole(role) ? "bg-night text-white" : "bg-mist text-slate-text")}>{label}</span>;
}

function SuspendedPill({ reason }: { reason?: string }) {
  return (
    <span title={reason || undefined} className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2.5 py-0.5 text-[13px] font-semibold text-destructive">
      <Ban size={13} aria-hidden /> Suspended
    </span>
  );
}

/** The numbers a customer gave at signup or on their profile, as call and WhatsApp links. */
function AdminContactNumbers({ phone, whatsappNumber }: { phone?: string; whatsappNumber?: string }) {
  if (!phone && !whatsappNumber) return <p className="text-xs text-muted-foreground">No phone added</p>;
  const sameNumber = normalisePhoneNumber(phone) === normalisePhoneNumber(whatsappNumber);
  return (
    <p className="flex flex-wrap gap-x-3 text-xs tabular">
      {phone && <a href={`tel:+${dialableNumber(phone)}`} className="font-medium text-primary hover:underline">{formatPhoneNumber(phone)}</a>}
      {whatsappNumber && (
        <a href={`https://wa.me/${dialableNumber(whatsappNumber)}`} target="_blank" rel="noopener noreferrer" className="font-medium text-[#128c4a] hover:underline">
          {sameNumber ? "WhatsApp" : `WhatsApp ${formatPhoneNumber(whatsappNumber)}`}
        </a>
      )}
    </p>
  );
}

/* ─── Suspend ───────────────────────────────────── */
function SuspendModal({ target, onClose, onConfirm }: { target: { ids: string[]; label: string } | null; onClose: () => void; onConfirm: (reason: string) => Promise<void> }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => setReason(""), [target]);
  return (
    <Modal open={!!target} onClose={onClose} size="sm" title={`Suspend ${target?.label || ""}?`}
      description="They can't sign in, and are signed out within a few minutes. Their listings stay as they are; nothing is deleted."
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="danger" loading={busy} onClick={async () => { setBusy(true); await onConfirm(reason.trim()); setBusy(false); }}>Suspend</Button></>}>
      <Field label="Reason (only the team sees this)" htmlFor="suspend-reason">
        <textarea id="suspend-reason" rows={3} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Posted fake listings, reported by three buyers" className={cn(inputClass, "h-auto py-2")} data-autofocus />
      </Field>
    </Modal>
  );
}

/* ─── Add user ──────────────────────────────────── */
function AddUserModal({ onClose, onCreated, roleOptions }: { onClose: () => void; onCreated: () => void; roleOptions: React.ReactNode }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "buyer", password: "", isVerified: false });
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ email: string; password?: string } | null>(null);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async () => {
    setBusy(true);
    try {
      const res = await api<{ temporaryPassword?: string }>("/api/admin/users", { method: "POST", body: JSON.stringify(form) });
      onCreated();
      if (res.temporaryPassword) setCreated({ email: form.email, password: res.temporaryPassword });
      else { toast.success(`Account created for ${form.name}.`); onClose(); }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (created) {
    return (
      <Modal open onClose={onClose} size="sm" title="Account created" footer={<Button variant="primary" onClick={onClose}>Done</Button>}>
        <div className="space-y-4">
          <p className="flex items-start gap-2 text-[15px] text-slate-text"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-verified" aria-hidden /> Send these sign-in details to the person privately. The password is shown only once; they can change it with “Forgot password”.</p>
          <dl className="space-y-2 rounded-2xl bg-mist p-4 text-sm">
            <div><dt className="text-xs font-semibold text-slate-text">Email</dt><dd className="font-semibold text-night">{created.email}</dd></div>
            <div><dt className="text-xs font-semibold text-slate-text">Temporary password</dt>
              <dd className="flex items-center gap-2 font-mono font-semibold text-night">{created.password}
                <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard?.writeText(created.password || ""); toast.success("Password copied."); }} aria-label="Copy password"><Copy size={14} aria-hidden /></Button>
              </dd>
            </div>
          </dl>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} title="Add a user" description="Create an account for a dealer, a seller you're helping, or a new team member."
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" loading={busy} onClick={submit}>Create account</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="nu-name"><input id="nu-name" value={form.name} onChange={(e) => set({ name: e.target.value })} className={inputClass} data-autofocus /></Field>
        <Field label="Email" htmlFor="nu-email"><input id="nu-email" type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} className={inputClass} /></Field>
        <Field label="Mobile number (optional)" htmlFor="nu-phone"><input id="nu-phone" value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="01712 345678" className={inputClass} /></Field>
        <Field label="Role" htmlFor="nu-role"><select id="nu-role" value={form.role} onChange={(e) => set({ role: e.target.value })} className={inputClass}>{roleOptions}</select></Field>
        <div className="sm:col-span-2">
          <Field label="Password (optional)" htmlFor="nu-pass" hint="Leave empty and we'll create a strong temporary password for you to share.">
            <input id="nu-pass" type="password" autoComplete="new-password" value={form.password} onChange={(e) => set({ password: e.target.value })} className={inputClass} />
          </Field>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold sm:col-span-2">
          <input type="checkbox" checked={form.isVerified} onChange={(e) => set({ isVerified: e.target.checked })} className="size-[18px] accent-electric" /> Mark as verified
        </label>
      </div>
    </Modal>
  );
}

/* ─── Drawer ────────────────────────────────────── */
type Detail = {
  user: AdminUser & { bio?: string; address?: string; adminNotes?: string; suspendedAt?: string; loginCount?: number; avatar?: string; dealershipLicense?: string };
  listings: { _id: string; title: string; slug: string; price: number; status: string; views?: number; createdAt: string; thumb?: string; paperVerified?: boolean }[];
  activity: { listings: number; live: number; pending: number; sold: number; views: number; saves: number; chatsAsBuyer: number; chatsAsSeller: number };
};

function UserDrawer({ id, onClose, selfId, can, roleName, onChanged, onSuspend, onDelete }: {
  id: string; onClose: () => void; selfId?: string; can: UsersResponse["can"]; roleName: (k: string) => string;
  onChanged: () => void; onSuspend: (u: AdminUser) => void; onDelete: (u: AdminUser, listings: number) => void;
}) {
  const toast = useToast();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"overview" | "edit" | "notes">("overview");
  const [form, setForm] = useState({ name: "", phone: "", whatsappNumber: "", city: "", dealershipName: "" });
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api<Detail>(`/api/admin/users/${id}`);
      setDetail(d);
      setForm({ name: d.user.name || "", phone: d.user.phone || "", whatsappNumber: d.user.whatsappNumber || "", city: d.user.city || "", dealershipName: d.user.dealershipName || "" });
      setNotes(d.user.adminNotes || "");
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);
  useEffect(() => { void load(); }, [load]);

  const patch = async (body: Record<string, unknown>, message: string) => {
    setBusy(true);
    try {
      await api("/api/admin/users", { method: "PATCH", body: JSON.stringify({ id, ...body }) });
      toast.success(message);
      await load();
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const u = detail?.user;
  const isSelf = id === selfId;
  const a = detail?.activity;

  return (
    <Modal open onClose={onClose} size="xl" title={u ? (u.dealershipName || u.name) : "Account"} description={u ? <span className="flex flex-wrap items-center gap-2">{u.email} <RolePill role={u.role} label={roleName(u.role)} /></span> : undefined}
      footer={u && (
        <>
          {!isSelf && can.manage && (u.status === "suspended"
            ? <Button onClick={() => patch({ status: "active" }, `${u.name} can sign in again.`)} loading={busy}>Unsuspend</Button>
            : <Button onClick={() => onSuspend(u)}><Ban size={15} aria-hidden /> Suspend</Button>)}
          {!isSelf && can.delete && <Button variant="danger" onClick={() => onDelete(u, a?.listings || 0)}><Trash2 size={15} aria-hidden /> Delete</Button>}
          <span className="grow" />
          <Link href={`/cars?seller=${u._id}`} target="_blank" className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-electric hover:bg-mist"><ExternalLink size={15} aria-hidden /> Public listings</Link>
        </>
      )}>
      {error ? <p className="text-destructive">{error}</p> : !detail || !u || !a ? <div className="skeleton h-72 rounded-2xl" /> : (
        <div className="space-y-5">
          {u.status === "suspended" && (
            <p className="flex items-start gap-2 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-destructive">
              <Ban size={17} className="mt-0.5 shrink-0" aria-hidden />
              <span><strong>Suspended{u.suspendedAt ? ` ${timeAgo(u.suspendedAt)}` : ""}.</strong> {u.suspendedReason || "No reason given."}</span>
            </p>
          )}
          <CountTabs<"overview" | "edit" | "notes"> label="Account sections" value={tab} onChange={setTab}
            tabs={[{ value: "overview", label: "Overview" }, ...(can.manage ? [{ value: "edit" as const, label: "Edit profile" }, { value: "notes" as const, label: "Team notes" }] : [])]} />

          {tab === "overview" ? (
            <>
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Listings", value: a.listings, sub: `${a.live} live · ${a.pending} pending` },
                  { label: "Sold", value: a.sold, sub: `${a.views.toLocaleString("en-IN")} views` },
                  { label: "Saved cars", value: a.saves, sub: "as a buyer", icon: Heart },
                  { label: "Chats", value: a.chatsAsBuyer + a.chatsAsSeller, sub: `${a.chatsAsBuyer} buying · ${a.chatsAsSeller} selling`, icon: MessageSquare },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl border border-hairline p-4">
                    <dt className="text-[13px] font-semibold text-slate-text">{s.label}</dt>
                    <dd className="mt-1 text-2xl font-extrabold text-night tabular">{s.value}</dd>
                    <dd className="text-xs text-slate-text">{s.sub}</dd>
                  </div>
                ))}
              </dl>
              <div className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
                <dl className="space-y-3 rounded-2xl bg-mist/70 p-4 text-sm">
                  <InfoRow label="Phone" value={u.phone ? formatPhoneNumber(u.phone) : "—"} />
                  <InfoRow label="WhatsApp" value={u.whatsappNumber ? formatPhoneNumber(u.whatsappNumber) : "—"} />
                  <InfoRow label="City" value={u.city || "—"} />
                  {u.dealershipName && <InfoRow label="Dealership" value={`${u.dealershipName}${u.dealershipLicense ? ` · licence ${u.dealershipLicense}` : ""}`} />}
                  <InfoRow label="Verified" value={u.isVerified ? "Yes" : "No"} />
                  <InfoRow label="Joined" value={new Date(u.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} />
                  <InfoRow label="Last sign-in" value={u.lastLoginAt ? `${timeAgo(u.lastLoginAt)}${u.loginCount ? ` · ${u.loginCount} sign-ins` : ""}` : "Not recorded yet"} />
                </dl>
                <div>
                  <h3 className="text-sm font-extrabold text-night">Latest listings</h3>
                  {detail.listings.length === 0 ? <p className="mt-2 text-sm text-slate-text">No listings yet.</p> : (
                    <ul className="mt-2 divide-y divide-hairline rounded-2xl border border-hairline">
                      {detail.listings.map((l) => (
                        <li key={l._id} className="flex items-center gap-3 px-3 py-2.5">
                          <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-mist"><CarImage src={l.thumb} alt="" sizes="56px" /></div>
                          <div className="min-w-0 grow">
                            <Link href={`/cars/${l.slug}`} target="_blank" className="block truncate text-sm font-semibold hover:text-electric">{l.title}</Link>
                            <p className="text-xs text-slate-text tabular">{formatLakh(l.price)} · {(l.views || 0).toLocaleString("en-IN")} views · {timeAgo(l.createdAt)}</p>
                          </div>
                          <StatusBadge status={l.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          ) : tab === "edit" ? (
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); patch(form, "Profile updated."); }}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" htmlFor="ud-name"><input id="ud-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} /></Field>
                <Field label="Dealership name" htmlFor="ud-dealer"><input id="ud-dealer" value={form.dealershipName} onChange={(e) => setForm({ ...form, dealershipName: e.target.value })} className={inputClass} /></Field>
                <Field label="Mobile number" htmlFor="ud-phone"><input id="ud-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} /></Field>
                <Field label="WhatsApp number" htmlFor="ud-wa"><input id="ud-wa" value={form.whatsappNumber} onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })} className={inputClass} /></Field>
                <Field label="City" htmlFor="ud-city"><input id="ud-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} /></Field>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={u.isVerified} disabled={busy} onChange={(e) => patch({ isVerified: e.target.checked }, e.target.checked ? "Marked as verified." : "No longer verified.")} className="size-[18px] accent-electric" />
                Verified seller
              </label>
              <div className="flex justify-end"><Button type="submit" variant="primary" loading={busy}>Save profile</Button></div>
            </form>
          ) : (
            <div className="space-y-3">
              <Field label="Notes about this account (only the team sees these)" htmlFor="ud-notes">
                <textarea id="ud-notes" rows={6} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Calls, complaints, agreements…" className={cn(inputClass, "h-auto py-2")} />
              </Field>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-text tabular">{notes.length} / 2000</span>
                <Button variant="primary" loading={busy} onClick={() => patch({ adminNotes: notes }, "Notes saved.")}>Save notes</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="shrink-0 text-slate-text">{label}</dt>
      <dd className="min-w-0 text-right font-semibold text-night">{value}</dd>
    </div>
  );
}
