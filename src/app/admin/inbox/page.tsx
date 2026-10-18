"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ExternalLink, Inbox, Mail, Phone, RotateCcw, Search, Trash2 } from "lucide-react";
import { Button, CountTabs, PageHeader, Pagination, api, useConfirm } from "@/components/admin/ui";
import { useToast } from "@/components/admin/Toast";
import { TOPIC_LABEL, type ContactTopic } from "@/lib/contact-request";
import { cn, timeAgo } from "@/lib/utils";

interface Message {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  topic: ContactTopic;
  message: string;
  listing?: string;
  status: "new" | "open" | "resolved";
  note?: string;
  createdAt: string;
}
interface InboxResponse { messages: Message[]; total: number; page: number; pages: number; counts: Record<string, number> }

const TABS = [
  { value: "new", label: "New" },
  { value: "open", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "all", label: "All" },
] as const;

export default function AdminInboxPage() {
  return (
    <Suspense fallback={<div className="skeleton h-96 rounded-3xl" />}>
      <InboxManager />
    </Suspense>
  );
}

function InboxManager() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const status = params.get("status") || "new";
  const q = params.get("q") || "";
  const page = Number(params.get("page")) || 1;
  const [data, setData] = useState<InboxResponse | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState(q);
  const [note, setNote] = useState("");

  const setParams = useCallback((u: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(u)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!("page" in u)) next.delete("page");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [params, pathname, router]);

  const qs = useMemo(() => {
    const p = new URLSearchParams({ page: String(page) });
    if (status !== "all") p.set("status", status);
    if (q) p.set("q", q);
    return p.toString();
  }, [status, q, page]);

  const load = useCallback(async () => {
    try {
      setData(await api<InboxResponse>(`/api/admin/inbox?${qs}`));
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, [qs, toast]);
  useEffect(() => void load(), [load]);
  useEffect(() => setSearch(q), [q]);
  useEffect(() => {
    if (search === q) return;
    const t = setTimeout(() => setParams({ q: search.trim() || undefined }), 350);
    return () => clearTimeout(t);
  }, [search, q, setParams]);

  const selected = data?.messages.find((m) => m._id === selectedId) || data?.messages[0] || null;
  useEffect(() => setNote(selected?.note || ""), [selected?._id, selected?.note]);

  const update = async (m: Message, body: Partial<Pick<Message, "status" | "note">>, msg: string) => {
    try {
      await api("/api/admin/inbox", { method: "PATCH", body: JSON.stringify({ ids: [m._id], ...body }) });
      toast.success(msg);
      window.dispatchEvent(new Event("admin:counts-changed"));
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const remove = async (m: Message) => {
    if (!(await confirm({ title: "Delete this message?", body: `From ${m.name}. This can't be undone.`, confirmLabel: "Delete", tone: "danger" }))) return;
    try {
      await api("/api/admin/inbox", { method: "DELETE", body: JSON.stringify({ ids: [m._id] }) });
      toast.success("Message deleted.");
      setSelectedId(null);
      window.dispatchEvent(new Event("admin:counts-changed"));
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const open = (m: Message) => setSelectedId(m._id);

  const replyHref = (m: Message) =>
    `mailto:${m.email}?subject=${encodeURIComponent(`Re: ${TOPIC_LABEL[m.topic] || "Your message"} – CarHat BD`)}&body=${encodeURIComponent(`Hi ${m.name.split(" ")[0]},\n\n\n\n—\n> ${m.message.replace(/\n/g, "\n> ")}`)}`;

  return (
    <div className="space-y-5">
      {dialog}
      <PageHeader title="Inbox" description="Messages from the contact page and listing reports." />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <CountTabs label="Message status" value={status} onChange={(v) => setParams({ status: v === "new" ? undefined : v })}
          tabs={TABS.map((t) => ({ ...t, count: data?.counts[t.value] }))} />
        <div className="relative w-full sm:w-72">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-text" aria-hidden />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email or text" aria-label="Search messages" className="field h-11 pl-10 text-[15px]" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <section className="overflow-hidden rounded-3xl border border-hairline bg-white shadow-soft" aria-label="Messages">
          {!data ? (
            <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
          ) : data.messages.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <Inbox size={26} className="mx-auto text-slate-text" aria-hidden />
              <p className="mt-3 font-bold">{status === "new" ? "No new messages" : "Nothing here"}</p>
              <p className="text-sm text-slate-text">Messages sent from the contact page appear here.</p>
            </div>
          ) : (
            <>
              <ul className="max-h-[65vh] divide-y divide-hairline overflow-y-auto">
                {data.messages.map((m) => (
                  <li key={m._id}>
                    <button type="button" onClick={() => open(m)} aria-current={selected?._id === m._id}
                      className={cn("flex w-full gap-3 px-4 py-3.5 text-left transition-colors", selected?._id === m._id ? "bg-haze" : "hover:bg-mist")}>
                      <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", m.status === "new" ? "bg-electric" : "bg-transparent")} aria-hidden />
                      <span className="min-w-0 grow">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className={cn("truncate text-sm", m.status === "new" ? "font-extrabold" : "font-semibold")}>{m.name}</span>
                          <span className="shrink-0 text-[11px] text-slate-text">{timeAgo(m.createdAt)}</span>
                        </span>
                        <span className={cn("block text-xs font-semibold", m.topic === "report" ? "text-destructive" : "text-electric")}>{TOPIC_LABEL[m.topic] || m.topic}</span>
                        <span className="mt-0.5 block truncate text-[13px] text-slate-text">{m.message}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <Pagination page={data.page} pages={data.pages} total={data.total} noun="messages" onPage={(p) => setParams({ page: String(p) })} />
            </>
          )}
        </section>

        <section className="rounded-3xl border border-hairline bg-white p-6 shadow-soft md:p-8" aria-label="Message">
          {!selected ? (
            <p className="py-16 text-center text-slate-text">Select a message to read it.</p>
          ) : (
            <article>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className={cn("text-xs font-bold uppercase tracking-wider", selected.topic === "report" ? "text-destructive" : "text-electric")}>{TOPIC_LABEL[selected.topic]}</p>
                  <h2 className="mt-1 text-xl font-extrabold">{selected.name}</h2>
                  <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-text">
                    <a href={`mailto:${selected.email}`} className="inline-flex items-center gap-1 hover:text-electric"><Mail size={14} aria-hidden /> {selected.email}</a>
                    {selected.phone && <a href={`tel:${selected.phone}`} className="inline-flex items-center gap-1 hover:text-electric"><Phone size={14} aria-hidden /> {selected.phone}</a>}
                    <span>{new Date(selected.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</span>
                  </p>
                </div>
                <span className={cn("rounded-full px-3 py-1 text-xs font-bold",
                  selected.status === "new" ? "bg-haze text-electric-deep" : selected.status === "open" ? "bg-warning-soft text-warning" : "bg-verified-soft text-verified")}>
                  {selected.status === "new" ? "New" : selected.status === "open" ? "In progress" : "Resolved"}
                </span>
              </div>

              {selected.listing && (
                <Link href={`/cars/${encodeURIComponent(selected.listing)}`} target="_blank" className="mt-5 inline-flex items-center gap-2 rounded-xl border border-hairline px-3 py-2 text-sm font-semibold hover:border-electric/40 hover:text-electric">
                  <ExternalLink size={15} aria-hidden /> Listing: {selected.listing}
                </Link>
              )}

              <p className="mt-6 whitespace-pre-wrap rounded-2xl bg-mist p-5 text-[15px] leading-relaxed text-night">{selected.message}</p>

              <div className="mt-6">
                <label htmlFor="inbox-note" className="field-label">Team note <span className="font-normal text-slate-text">(only admins see this)</span></label>
                <textarea id="inbox-note" rows={3} className="field min-h-0" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Called back on Tuesday, listing removed." />
                {note !== (selected.note || "") && (
                  <Button size="sm" className="mt-2" onClick={() => update(selected, { note }, "Note saved.")}>Save note</Button>
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-2 border-t border-hairline pt-6">
                <a href={replyHref(selected)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-electric px-4 text-sm font-semibold text-white shadow-glow hover:bg-electric-deep">
                  <Mail size={16} aria-hidden /> Reply by email
                </a>
                {selected.status === "new" && (
                  <Button onClick={() => update(selected, { status: "open" }, "Moved to in progress, so the team knows you're on it.")}>I&apos;m handling this</Button>
                )}
                {selected.status !== "resolved" ? (
                  <Button variant="success" onClick={() => update(selected, { status: "resolved" }, "Marked resolved.")}><CheckCircle2 size={16} aria-hidden /> Mark resolved</Button>
                ) : (
                  <Button onClick={() => update(selected, { status: "open" }, "Reopened.")}><RotateCcw size={16} aria-hidden /> Reopen</Button>
                )}
                <Button variant="ghost" className="ml-auto hover:bg-danger-soft hover:text-destructive" onClick={() => remove(selected)}><Trash2 size={16} aria-hidden /> Delete</Button>
              </div>
            </article>
          )}
        </section>
      </div>
    </div>
  );
}
