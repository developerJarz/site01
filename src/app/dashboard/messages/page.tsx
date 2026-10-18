"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PageLoader } from "@/components/ui/brand-loader";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Car, ExternalLink, Loader2, MessageSquare, Search, Send } from "lucide-react";
import { CarImage } from "@/components/CarImage";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Breadcrumbs, CONTAINER } from "@/components/ui/page";
import { cn, formatLakh, timeAgo } from "@/lib/utils";

interface Conversation {
  _id: string;
  otherParty: { _id: string; name: string; avatar: string | null };
  listing: { _id: string; title: string; slug: string; image: string | null; price: number; status?: string };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  isBuyer: boolean;
}
interface ChatMessage {
  _id: string;
  content: string;
  createdAt: string;
  sender: { _id: string; name: string; avatar?: string } | null;
}

const QUICK_REPLIES_BUYER = ["Is this car still available?", "What's your best price?", "Can I see it this weekend?", "Are the papers up to date?"];
const QUICK_REPLIES_SELLER = ["Yes, it's still available.", "You're welcome to come and see it.", "The papers are all up to date."];

export default function MessagesPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <MessagesContent />
    </Suspense>
  );
}

function MessagesContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeId = searchParams.get("conversation");
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?callbackUrl=%2Fdashboard%2Fmessages");
  }, [status, router]);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setConversations(data.conversations || []);
      else setConversations((c) => c ?? []);
    } catch {
      setConversations((c) => c ?? []);
    }
  }, []);

  const fetchMessages = useCallback(async (id: string, showLoading = true) => {
    if (showLoading) setLoadingMessages(true);
    try {
      const res = await fetch(`/api/conversations/${id}/messages`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't load this chat.");
      setMessages(data.messages || []);
      setConversations((prev) => prev?.map((c) => (c._id === id ? { ...c, unreadCount: 0 } : c)) || prev);
    } catch (e) {
      if (showLoading) setError((e as Error).message);
    } finally {
      if (showLoading) setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") void fetchConversations();
  }, [status, fetchConversations]);

  useEffect(() => {
    setError("");
    setMessages([]);
    if (activeId && status === "authenticated") void fetchMessages(activeId);
  }, [activeId, status, fetchMessages]);

  // Poll while the tab is visible: the open chat every 4s, the inbox every 15s.
  useEffect(() => {
    if (status !== "authenticated") return;
    const tick = (fn: () => void) => () => { if (document.visibilityState === "visible") fn(); };
    const chat = activeId ? setInterval(tick(() => void fetchMessages(activeId, false)), 4000) : undefined;
    const inbox = setInterval(tick(() => void fetchConversations()), 15000);
    return () => {
      if (chat) clearInterval(chat);
      clearInterval(inbox);
    };
  }, [activeId, status, fetchMessages, fetchConversations]);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [messages.length]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || !activeId || sending) return;
    setDraft("");
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/conversations/${activeId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Message not sent.");
      await Promise.all([fetchMessages(activeId, false), fetchConversations()]);
    } catch (e) {
      setDraft(content);
      setError((e as Error).message);
    } finally {
      setSending(false);
      input.current?.focus();
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!conversations) return [];
    return q ? conversations.filter((c) => c.otherParty.name.toLowerCase().includes(q) || c.listing.title.toLowerCase().includes(q)) : conversations;
  }, [conversations, query]);

  if (status !== "authenticated" || conversations === null) {
    return <PageLoader />;
  }

  const active = conversations.find((c) => c._id === activeId);
  const totalUnread = conversations.reduce((n, c) => n + c.unreadCount, 0);
  const quickReplies = active?.isBuyer ? QUICK_REPLIES_BUYER : QUICK_REPLIES_SELLER;

  return (
    <div className={cn(CONTAINER, "py-6 md:py-8")}>
      <div className="mb-5 hidden md:block">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Dashboard", href: "/dashboard" }, { label: "Messages" }]} />
      </div>

      <div className="flex h-[calc(100dvh-7rem)] overflow-hidden rounded-3xl border border-hairline bg-white shadow-soft md:h-[calc(100dvh-12rem)] lg:h-[calc(100dvh-14rem)]">
        {/* Inbox */}
        <aside className={cn("flex w-full flex-col border-r border-hairline md:w-[22rem] md:shrink-0", active ? "hidden md:flex" : "flex")} aria-label="Conversations">
          <div className="border-b border-hairline p-4">
            <h1 className="flex items-center gap-2 text-xl font-extrabold">
              Messages
              {totalUnread > 0 && <span className="rounded-full bg-electric px-2 py-0.5 text-xs font-bold text-white tabular">{totalUnread}</span>}
            </h1>
            <div className="relative mt-3">
              <label htmlFor="chat-search" className="sr-only">Search conversations</label>
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-text" aria-hidden />
              <input id="chat-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or car" className="field h-11 pl-10 text-[15px]" />
            </div>
          </div>
          <div className="grow overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-haze text-electric"><MessageSquare size={22} aria-hidden /></span>
                <p className="mt-4 font-bold">{conversations.length ? "No matches" : "No messages yet"}</p>
                <p className="mt-1 text-sm text-slate-text">{conversations.length ? "Try another name or car." : "Message a seller from any car page and the chat appears here."}</p>
                {!conversations.length && <Button asChild variant="secondary" className="mt-5"><Link href="/cars">Browse cars</Link></Button>}
              </div>
            ) : (
              <ul className="space-y-1 p-2">
                {filtered.map((c) => (
                  <li key={c._id}>
                    <Link href={`/dashboard/messages?conversation=${c._id}`} aria-current={c._id === activeId ? "true" : undefined}
                      className={cn("flex gap-3 rounded-2xl p-3 transition-colors", c._id === activeId ? "bg-haze" : "hover:bg-mist")}>
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-mist">
                        <CarImage src={c.listing.image} alt="" sizes="48px" />
                      </span>
                      <span className="min-w-0 grow">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className={cn("truncate text-sm", c.unreadCount ? "font-extrabold" : "font-semibold")}>{c.otherParty.name}</span>
                          <span className="shrink-0 text-[11px] text-slate-text">{timeAgo(c.lastMessageAt)}</span>
                        </span>
                        <span className="block truncate text-xs font-semibold text-electric">{c.listing.title}</span>
                        <span className="mt-0.5 flex items-center gap-2">
                          <span className={cn("grow truncate text-[13px]", c.unreadCount ? "font-semibold text-night" : "text-slate-text")}>{c.lastMessage || "Started a conversation"}</span>
                          {c.unreadCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-electric px-1.5 text-[11px] font-bold text-white tabular">{c.unreadCount}</span>}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Chat */}
        <section className={cn("min-w-0 grow flex-col", active ? "flex" : "hidden md:flex")} aria-label="Chat">
          {!activeId ? (
            <div className="flex grow flex-col items-center justify-center bg-mist/50 p-8 text-center">
              <span className="flex size-16 items-center justify-center rounded-2xl bg-white text-electric shadow-soft"><MessageSquare size={28} aria-hidden /></span>
              <h2 className="mt-5 text-xl font-extrabold">Your conversations</h2>
              <p className="mt-1 max-w-sm text-slate-text">Pick a chat on the left to read and reply.</p>
            </div>
          ) : !active ? (
            <div className="flex grow items-center justify-center p-8 text-center text-slate-text">This conversation isn&apos;t available.</div>
          ) : (
            <>
              <header className="flex items-center gap-3 border-b border-hairline px-4 py-3">
                <Link href="/dashboard/messages" className="-ml-1 flex size-10 items-center justify-center rounded-full text-slate-text hover:bg-mist md:hidden" aria-label="Back to conversations">
                  <ArrowLeft size={20} aria-hidden />
                </Link>
                <UserAvatar src={active.otherParty.avatar} name={active.otherParty.name} size={40} />
                <div className="min-w-0 grow">
                  <p className="truncate font-bold">{active.otherParty.name}</p>
                  <p className="text-xs text-slate-text">{active.isBuyer ? "Seller" : "Interested buyer"}</p>
                </div>
              </header>
              <Link href={`/cars/${active.listing.slug}`} className="flex items-center gap-3 border-b border-hairline bg-mist/60 px-4 py-2.5 transition-colors hover:bg-haze/60">
                <span className="relative h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-white"><CarImage src={active.listing.image} alt="" sizes="56px" /></span>
                <span className="min-w-0 grow">
                  <span className="block truncate text-sm font-semibold">{active.listing.title}</span>
                  <span className="price-tag text-sm text-electric">{formatLakh(active.listing.price)}</span>
                  {active.listing.status === "sold" && <span className="ml-2 text-xs font-semibold text-slate-text">Sold</span>}
                </span>
                <ExternalLink size={16} className="shrink-0 text-slate-text" aria-hidden />
              </Link>

              <div ref={scroller} className="grow space-y-1 overflow-y-auto bg-[#fbfcfe] px-4 py-5" aria-live="polite">
                {loadingMessages && messages.length === 0 ? (
                  <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-electric" aria-label="Loading messages" /></div>
                ) : messages.length === 0 ? (
                  <p className="py-12 text-center text-sm text-slate-text">No messages yet. Say hello below.</p>
                ) : (
                  messages.map((m, i) => {
                    const mine = m.sender?._id === userId;
                    const day = new Date(m.createdAt).toDateString();
                    const newDay = i === 0 || new Date(messages[i - 1].createdAt).toDateString() !== day;
                    return (
                      <div key={m._id}>
                        {newDay && (
                          <p className="my-4 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-text">
                            {new Date(m.createdAt).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                          </p>
                        )}
                        <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                          <div className={cn("max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] shadow-sm sm:max-w-[70%]",
                            mine ? "rounded-br-md bg-electric text-white" : "rounded-bl-md border border-hairline bg-white text-night")}>
                            <p className="whitespace-pre-wrap break-words">{m.content}</p>
                            <p className={cn("mt-1 text-right text-[10px]", mine ? "text-white/75" : "text-slate-text")}>
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-hairline p-3">
                {messages.length < 3 && (
                  <div className="scrollbar-none -mx-1 mb-2 flex gap-1.5 overflow-x-auto px-1">
                    {quickReplies.map((q) => (
                      <button key={q} type="button" onClick={() => send(q)} disabled={sending}
                        className="h-8 shrink-0 rounded-full border border-hairline px-3 text-[13px] font-semibold text-slate-text transition-colors hover:border-electric/40 hover:text-electric">
                        {q}
                      </button>
                    ))}
                  </div>
                )}
                {error && <p role="alert" className="mb-2 text-sm text-destructive">{error}</p>}
                <form onSubmit={(e) => { e.preventDefault(); void send(draft); }} className="flex items-end gap-2">
                  <label htmlFor="chat-input" className="sr-only">Message</label>
                  <textarea id="chat-input" ref={input} rows={1} value={draft} maxLength={2000}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(draft); } }}
                    placeholder="Write a message…" className="field max-h-32 min-h-12 resize-none py-3" />
                  <Button type="submit" size="icon" className="size-12 shrink-0 rounded-2xl" disabled={!draft.trim() || sending} aria-label="Send message">
                    {sending ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <Send size={18} aria-hidden />}
                  </Button>
                </form>
              </div>
            </>
          )}
        </section>
      </div>
      <p className="mt-3 hidden items-center gap-1.5 text-xs text-slate-text md:flex"><Car size={13} aria-hidden /> Keep payments off chat until you&apos;ve seen the car and its papers in person.</p>
    </div>
  );
}
