"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Download, Mail, Search, Trash2 } from "lucide-react";
import { Button, PageHeader, Pagination, api, downloadCsv, useConfirm } from "@/components/admin/ui";
import { useToast } from "@/components/admin/Toast";
import { timeAgo } from "@/lib/utils";

interface Subscriber { _id: string; email: string; source?: string; createdAt: string }
interface Response { subscribers: Subscriber[]; total: number; page: number; pages: number; stats: { total: number; last7: number; last30: number } }

export default function AdminNewsletterPage() {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [data, setData] = useState<Response | null>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await api<Response>(`/api/admin/newsletter?page=${page}${q ? `&q=${encodeURIComponent(q)}` : ""}`));
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, [page, q, toast]);
  useEffect(() => void load(), [load]);
  useEffect(() => {
    const t = setTimeout(() => { setQ(search.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const all = async () => (await api<{ subscribers: Subscriber[] }>(`/api/admin/newsletter?all=1${q ? `&q=${encodeURIComponent(q)}` : ""}`)).subscribers;

  const exportCsv = async () => {
    setBusy(true);
    try {
      const rows = await all();
      downloadCsv(`carhat-subscribers-${new Date().toISOString().slice(0, 10)}.csv`, ["Email", "Source", "Subscribed"],
        rows.map((s) => [s.email, s.source || "", new Date(s.createdAt).toISOString().slice(0, 10)]));
      toast.success(`Exported ${rows.length} addresses.`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const copyAll = async () => {
    setBusy(true);
    try {
      const rows = await all();
      await navigator.clipboard.writeText(rows.map((s) => s.email).join(", "));
      toast.success(`Copied ${rows.length} addresses. Paste them into BCC, never To.`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (s: Subscriber) => {
    if (!(await confirm({ title: `Unsubscribe ${s.email}?`, body: "They'll stop getting the newsletter.", confirmLabel: "Unsubscribe", tone: "danger" }))) return;
    try {
      await api("/api/admin/newsletter", { method: "DELETE", body: JSON.stringify({ ids: [s._id] }) });
      toast.success(`${s.email} unsubscribed.`);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-5">
      {dialog}
      <PageHeader title="Newsletter" description="People who signed up in the site footer."
        actions={<>
          <Button onClick={copyAll} disabled={busy || !data?.total}><Copy size={16} aria-hidden /> Copy emails</Button>
          <Button variant="primary" onClick={exportCsv} loading={busy} disabled={!data?.total}>{!busy && <Download size={16} aria-hidden />} Export CSV</Button>
        </>} />

      <ul className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Subscribers", value: data?.stats.total },
          { label: "Joined in the last 7 days", value: data?.stats.last7 },
          { label: "Joined in the last 30 days", value: data?.stats.last30 },
        ].map((s) => (
          <li key={s.label} className="rounded-3xl border border-hairline bg-white p-5 shadow-soft">
            <p className="text-[13px] font-semibold text-slate-text">{s.label}</p>
            <p className="mt-2 text-3xl font-extrabold tabular">{s.value?.toLocaleString("en-IN") ?? "–"}</p>
          </li>
        ))}
      </ul>

      <section className="overflow-hidden rounded-3xl border border-hairline bg-white shadow-soft">
        <div className="border-b border-hairline p-4">
          <div className="relative max-w-sm">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-text" aria-hidden />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by email" aria-label="Search subscribers" className="field h-11 pl-10 text-[15px]" />
          </div>
        </div>
        {!data ? (
          <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-10 rounded-xl" />)}</div>
        ) : data.subscribers.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <Mail size={26} className="mx-auto text-slate-text" aria-hidden />
            <p className="mt-3 font-bold">{q ? "No matches" : "No subscribers yet"}</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <caption className="sr-only">Newsletter subscribers</caption>
              <thead className="bg-mist text-left text-[13px] text-slate-text">
                <tr><th scope="col" className="px-5 py-2.5 font-semibold">Email</th><th scope="col" className="hidden px-3 py-2.5 font-semibold sm:table-cell">Source</th><th scope="col" className="px-3 py-2.5 font-semibold">Joined</th><th scope="col"><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {data.subscribers.map((s) => (
                  <tr key={s._id} className="hover:bg-mist/60">
                    <td className="px-5 py-3 font-semibold"><a href={`mailto:${s.email}`} className="hover:text-electric">{s.email}</a></td>
                    <td className="hidden px-3 py-3 text-slate-text sm:table-cell">{s.source || "—"}</td>
                    <td className="px-3 py-3 text-slate-text">{timeAgo(s.createdAt)}</td>
                    <td className="px-3 py-3 text-right">
                      <button type="button" onClick={() => remove(s)} aria-label={`Unsubscribe ${s.email}`} className="inline-flex size-9 items-center justify-center rounded-full text-slate-text hover:bg-danger-soft hover:text-destructive">
                        <Trash2 size={16} aria-hidden />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={data.page} pages={data.pages} total={data.total} noun="subscribers" onPage={setPage} />
          </>
        )}
      </section>
    </div>
  );
}
