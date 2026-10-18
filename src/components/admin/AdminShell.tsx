"use client";

import { useProgressRouter } from "@/components/layout/RouteProgress";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Activity, BarChart3, Bell, BookOpen, Car, ChevronsLeft, ChevronsRight, Clock, CornerDownLeft, ExternalLink, FileSearch, Inbox, LayoutDashboard,
  Lock, LogOut, Mail, Menu, Palette, Search, SearchCheck, Settings, ShieldCheck, Store, Users, X,
} from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { ToastProvider } from "./Toast";
import { AdminProvider, useAdmin } from "./AdminContext";
import { canAny, permissionsForPath } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type Counts = { pendingListings: number; paperAwaiting: number; newMessages: number };
type NavItem = { href: string; label: string; icon: typeof Car; badge?: keyof Counts; exact?: boolean };

const NAV: { group: string; items: NavItem[] }[] = [
  { group: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true }] },
  {
    group: "Marketplace",
    items: [
      { href: "/admin/listings", label: "Listings", icon: Car, badge: "pendingListings" },
      { href: "/admin/listings?papers=awaiting", label: "Paper checks", icon: FileSearch, badge: "paperAwaiting" },
    ],
  },
  {
    group: "People",
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/users?role=dealer", label: "Dealers", icon: Store },
      { href: "/admin/roles", label: "Roles & access", icon: ShieldCheck },
    ],
  },
  {
    group: "Customers",
    items: [
      { href: "/admin/inbox", label: "Inbox", icon: Inbox, badge: "newMessages" },
      { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
    ],
  },
  {
    group: "Content & insight",
    items: [
      { href: "/admin/blogs", label: "Blog posts", icon: BookOpen },
      { href: "/admin/seo", label: "SEO & content", icon: SearchCheck },
      { href: "/admin/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    group: "Website",
    items: [{ href: "/admin/appearance", label: "Website builder", icon: Palette }],
  },
  {
    group: "System",
    items: [
      { href: "/admin/settings", label: "Site settings", icon: Settings },
      { href: "/admin/system", label: "System health", icon: Activity },
    ],
  },
];
const ALL_ITEMS = NAV.flatMap((g) => g.items);

export function AdminShell({ children }: { children: React.ReactNode }) {
  return <AdminProvider><Shell>{children}</Shell></AdminProvider>;
}

const SIDEBAR_KEY = "carhat_admin_sidebar";

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/admin";
  const { me, loading: meLoading, can } = useAdmin();
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try { setCollapsed(localStorage.getItem(SIDEBAR_KEY) === "collapsed"); } catch {}
  }, []);
  const toggleCollapsed = () => setCollapsed((c) => {
    try { localStorage.setItem(SIDEBAR_KEY, c ? "open" : "collapsed"); } catch {}
    return !c;
  });
  // Pages this role can't use are hidden; until the role loads everything shows (the API still checks).
  const allowed = useCallback((href: string) => !me || canAny(me.permissions, permissionsForPath(href)), [me]);
  const nav = NAV.map((g) => ({ ...g, items: g.items.filter((i) => allowed(i.href)) })).filter((g) => g.items.length);
  const blocked = !meLoading && !!me && !allowed(pathname);
  const { data: session } = useSession();
  const { settings } = useSiteSettings();
  const [drawer, setDrawer] = useState(false);
  const [palette, setPalette] = useState(false);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [query, setQuery] = useState("");

  // Badge counts: on load, on each page change, every minute, and when an admin page reports a change.
  const loadCounts = useCallback(() => {
    fetch("/api/admin/stats?summary=1", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setCounts(d))
      .catch(() => {});
  }, []);
  useEffect(() => loadCounts(), [loadCounts, pathname]);
  useEffect(() => {
    const t = setInterval(() => document.visibilityState === "visible" && loadCounts(), 60_000);
    window.addEventListener("admin:counts-changed", loadCounts);
    return () => {
      clearInterval(t);
      window.removeEventListener("admin:counts-changed", loadCounts);
    };
  }, [loadCounts]);

  useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // The most specific matching item is active, so "Paper checks" wins over "Listings" on its own URL.
  const activeHref = useMemo(() => {
    const here = `${pathname}${query ? `?${query}` : ""}`;
    const matches = ALL_ITEMS.filter((i) => {
      const [p, q] = i.href.split("?");
      if (i.exact) return pathname === p;
      if (!pathname.startsWith(p)) return false;
      return !q || q.split("&").every((pair) => here.includes(pair));
    });
    return matches.sort((a, b) => b.href.length - a.href.length)[0]?.href;
  }, [pathname, query]);

  const title = ALL_ITEMS.find((i) => i.href === activeHref)?.label || "Admin";
  const totalAlerts = counts ? counts.pendingListings + counts.paperAwaiting + counts.newMessages : 0;
  const logoSrc = settings.logoUrl || "/car-hat-bd.png";
  const user = session?.user;

  // The desktop sidebar can shrink to icons; the phone drawer is always full width.
  const renderSidebar = (mini: boolean) => (
    <div className="flex h-full flex-col border-r border-hairline bg-white">
      <div className={cn("flex h-[72px] items-center gap-3", mini ? "justify-center px-2" : "px-5")}>
        <Link href="/admin" className="flex items-center gap-2.5" aria-label="Admin dashboard">
          {mini ? (
            <span className="flex size-10 items-center justify-center rounded-xl bg-night text-xs font-extrabold text-white" aria-hidden>{(settings.siteName || "C")[0]}</span>
          ) : (
            <>
              <Image src={logoSrc} alt={settings.siteName || "CarHat"} width={124} height={26} sizes="124px" className="h-7 w-auto" />
              <span className="rounded-md bg-night px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Admin</span>
            </>
          )}
        </Link>
      </div>

      <button type="button" onClick={() => setPalette(true)} aria-label={mini ? "Search or jump to" : undefined} title={mini ? "Search (Ctrl K)" : undefined}
        className={cn("mb-4 flex h-11 items-center gap-2.5 rounded-xl border border-hairline bg-mist text-left text-sm text-slate-text transition-colors hover:border-electric/30 hover:text-night", mini ? "mx-auto w-11 justify-center" : "mx-4 px-3")}>
        <Search size={16} aria-hidden />
        {!mini && (
          <>
            <span className="grow">Search or jump to…</span>
            <kbd className="rounded-md border border-hairline bg-white px-1.5 text-[11px] font-semibold">Ctrl K</kbd>
          </>
        )}
      </button>

      <nav aria-label="Admin" className={cn("grow space-y-5 overflow-y-auto pb-4", mini ? "px-2" : "px-3")}>
        {nav.map((g) => (
          <div key={g.group}>
            {mini ? <div className="mx-3 mb-2 h-px bg-hairline" aria-hidden /> : <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-text/80">{g.group}</p>}
            <ul className="space-y-0.5">
              {g.items.map((item) => {
                const active = item.href === activeHref;
                const badge = item.badge && counts ? counts[item.badge] : 0;
                return (
                  <li key={item.href}>
                    <Link href={item.href} aria-current={active ? "page" : undefined} title={mini ? item.label : undefined} aria-label={mini ? item.label : undefined}
                      className={cn("relative flex h-10 items-center gap-3 rounded-xl text-sm font-semibold transition-colors", mini ? "justify-center" : "px-3",
                        active ? "bg-haze text-electric-deep" : "text-slate-text hover:bg-mist hover:text-night")}>
                      {active && <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-electric" aria-hidden />}
                      <item.icon size={18} aria-hidden />
                      {!mini && <span className="grow">{item.label}</span>}
                      {mini && badge > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-warning" aria-hidden />}
                      {!mini && badge > 0 && (
                        <span className={cn("min-w-6 rounded-full px-1.5 py-0.5 text-center text-[11px] font-bold tabular",
                          item.badge === "newMessages" ? "bg-electric text-white" : "bg-warning-soft text-warning")}>
                          {badge > 99 ? "99+" : badge}<span className="sr-only"> waiting</span>
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className={cn("border-t border-hairline", mini ? "p-2" : "p-3")}>
        <Link href="/" target="_blank" title={mini ? "View live site" : undefined} aria-label={mini ? "View live site" : undefined}
          className={cn("flex h-10 items-center gap-3 rounded-xl text-sm font-semibold text-slate-text hover:bg-mist hover:text-night", mini ? "justify-center" : "px-3")}>
          <ExternalLink size={16} aria-hidden /> {!mini && "View live site"}
        </Link>
        <div className={cn("mt-1 flex items-center gap-3 rounded-xl py-2", mini ? "flex-col" : "px-3")}>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-electric to-electric-light text-sm font-bold text-white" title={mini ? user?.name || undefined : undefined} aria-hidden>
            {user?.name?.[0]?.toUpperCase() || "A"}
          </span>
          {!mini && (
            <div className="min-w-0 grow">
              <p className="truncate text-sm font-bold">{user?.name || "Admin"}</p>
              <p className="truncate text-xs text-slate-text">{me?.roleName || user?.email}</p>
            </div>
          )}
          <button type="button" onClick={() => signOut({ callbackUrl: "/" })} aria-label="Sign out"
            className="flex size-9 items-center justify-center rounded-full text-slate-text hover:bg-mist hover:text-night">
            <LogOut size={16} aria-hidden />
          </button>
        </div>
        <button type="button" onClick={toggleCollapsed} aria-label={mini ? "Expand sidebar" : "Collapse sidebar"} aria-pressed={mini}
          className={cn("mt-1 hidden h-9 w-full items-center gap-2 rounded-xl text-[13px] font-semibold text-slate-text hover:bg-mist hover:text-night lg:flex", mini ? "justify-center" : "px-3")}>
          {mini ? <ChevronsRight size={16} aria-hidden /> : <><ChevronsLeft size={16} aria-hidden /> Collapse</>}
        </button>
      </div>
    </div>
  );

  return (
    <ToastProvider>
      {/* The root layout pads <main> for the site header, which the admin area doesn't use. */}
      <div className="-mt-16 flex min-h-dvh bg-background lg:-mt-[116px]">
        <aside className={cn("sticky top-0 hidden h-dvh shrink-0 transition-[width] duration-200 lg:block", collapsed ? "w-[4.75rem]" : "w-[17rem]")}>{renderSidebar(collapsed)}</aside>

        {drawer && (
          <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
            <div className="animate-fade absolute inset-0 bg-night/45 backdrop-blur-sm" onClick={() => setDrawer(false)} />
            <aside className="animate-sheet-left absolute inset-y-0 left-0 w-[17rem] shadow-pop">{renderSidebar(false)}</aside>
            <button type="button" onClick={() => setDrawer(false)} aria-label="Close menu"
              className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white shadow-float">
              <X size={20} aria-hidden />
            </button>
          </div>
        )}

        <div className="flex min-w-0 grow flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-hairline bg-white/85 px-4 backdrop-blur-xl sm:px-6 lg:px-10">
            <button type="button" onClick={() => setDrawer(true)} aria-label="Open admin menu"
              className="-ml-1 flex size-10 items-center justify-center rounded-full hover:bg-mist lg:hidden">
              <Menu size={22} aria-hidden />
            </button>
            <p className="truncate text-[15px] font-bold text-night">{title}</p>
            <div className="ml-auto flex items-center gap-1.5">
              <button type="button" onClick={() => setPalette(true)} aria-label="Search"
                className="flex size-10 items-center justify-center rounded-full text-slate-text hover:bg-mist hover:text-night lg:hidden">
                <Search size={19} aria-hidden />
              </button>
              <AlertsMenu counts={counts} total={totalAlerts} />
              {can("blogs.manage") && (
                <Link href="/admin/blogs" className="hidden h-10 items-center gap-2 rounded-xl border border-hairline bg-white px-3.5 text-sm font-semibold shadow-soft hover:bg-mist sm:inline-flex">
                  <BookOpen size={16} aria-hidden /> Write post
                </Link>
              )}
              <Link href="/sell" className="hidden h-10 items-center gap-2 rounded-xl bg-electric px-3.5 text-sm font-semibold text-white shadow-glow hover:bg-electric-deep md:inline-flex">
                <Car size={16} aria-hidden /> Add listing
              </Link>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[96rem] grow px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{blocked ? <NoAccess roleName={me?.roleName} /> : children}</main>
        </div>
      </div>

      <Suspense fallback={null}><SearchSync onChange={setQuery} /></Suspense>
      {palette && <CommandPalette onClose={() => setPalette(false)} counts={counts} allowed={allowed} />}
    </ToastProvider>
  );
}

function AlertsMenu({ counts, total }: { counts: Counts | null; total: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onClick); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const rows = [
    { href: "/admin/listings?status=pending", icon: Clock, label: "Listings waiting for review", n: counts?.pendingListings || 0 },
    { href: "/admin/listings?papers=awaiting", icon: FileSearch, label: "Car papers to check", n: counts?.paperAwaiting || 0 },
    { href: "/admin/inbox?status=new", icon: Inbox, label: "New customer messages", n: counts?.newMessages || 0 },
  ];

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu"
        aria-label={total ? `${total} things need attention` : "Nothing needs attention"}
        className="relative flex size-10 items-center justify-center rounded-full text-slate-text hover:bg-mist hover:text-night">
        <Bell size={19} aria-hidden />
        {total > 0 && <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ff3b30] px-1 text-[10px] font-bold text-white ring-2 ring-white tabular">{total > 99 ? "99+" : total}</span>}
      </button>
      {open && (
        <div role="menu" className="animate-in absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-2xl border border-hairline bg-white p-2 shadow-float">
          <p className="px-3 pb-2 pt-1.5 text-xs font-bold uppercase tracking-wider text-slate-text">Needs attention</p>
          {rows.map(({ href, icon: Icon, label, n }) => (
            <Link key={href} role="menuitem" href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-mist">
              <span className={cn("flex size-9 items-center justify-center rounded-xl", n ? "bg-warning-soft text-warning" : "bg-mist text-slate-text")}><Icon size={17} aria-hidden /></span>
              <span className="grow text-sm font-semibold">{label}</span>
              <span className="text-sm font-extrabold tabular">{n}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function NoAccess({ roleName }: { roleName?: string }) {
  return (
    <div className="mx-auto mt-10 max-w-md rounded-3xl border border-hairline bg-white p-8 text-center shadow-soft">
      <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-mist text-slate-text"><Lock size={24} aria-hidden /></span>
      <h1 className="mt-5 text-xl font-extrabold text-night">This page isn&apos;t part of your role</h1>
      <p className="mt-2 text-[15px] text-slate-text">
        {roleName ? <>You&apos;re signed in as <strong className="text-night">{roleName}</strong>. </> : null}
        Ask an admin to add this permission in Roles &amp; access if you need it.
      </p>
      <Link href="/admin" className="mt-6 inline-flex h-10 items-center rounded-xl bg-electric px-4 text-sm font-semibold text-white shadow-glow hover:bg-electric-deep">Back to the dashboard</Link>
    </div>
  );
}

function CommandPalette({ onClose, counts, allowed }: { onClose: () => void; counts: Counts | null; allowed: (href: string) => boolean }) {
  const router = useProgressRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);

  const items = useMemo(() => {
    const term = q.trim();
    const base = [
      { label: "Review pending listings", hint: counts?.pendingListings ? `${counts.pendingListings} waiting` : undefined, href: "/admin/listings?status=pending", icon: Clock },
      { label: "Check car papers", hint: counts?.paperAwaiting ? `${counts.paperAwaiting} waiting` : undefined, href: "/admin/listings?papers=awaiting", icon: FileSearch },
      { label: "Read new messages", hint: counts?.newMessages ? `${counts.newMessages} new` : undefined, href: "/admin/inbox?status=new", icon: Inbox },
      ...ALL_ITEMS.map((n) => ({ label: n.label, hint: undefined as string | undefined, href: n.href, icon: n.icon })),
      { label: "View live site", hint: undefined, href: "/", icon: ExternalLink },
    ];
    const visible = base.filter((i) => i.href === "/" || allowed(i.href));
    const filtered = term ? visible.filter((i) => i.label.toLowerCase().includes(term.toLowerCase())) : visible;
    const searches = term
      ? [
          { label: `Search listings for “${term}”`, hint: undefined, href: `/admin/listings?q=${encodeURIComponent(term)}`, icon: Car },
          { label: `Search users for “${term}”`, hint: undefined, href: `/admin/users?q=${encodeURIComponent(term)}`, icon: Users },
          { label: `Search inbox for “${term}”`, hint: undefined, href: `/admin/inbox?q=${encodeURIComponent(term)}`, icon: Inbox },
        ].filter((i) => allowed(i.href))
      : [];
    return [...searches, ...filtered];
  }, [q, counts, allowed]);

  useEffect(() => setActive(0), [q]);

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Command menu">
      <div className="animate-fade absolute inset-0 bg-night/45 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-in relative w-full max-w-xl overflow-hidden rounded-3xl border border-hairline bg-white shadow-pop">
        <div className="flex items-center gap-3 border-b border-hairline px-5">
          <Search size={18} className="shrink-0 text-slate-text" aria-hidden />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, items.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
              if (e.key === "Enter" && items[active]) go(items[active].href);
            }}
            placeholder="Search listings, users, messages or go to a page"
            className="h-16 w-full bg-transparent text-base outline-none placeholder:text-slate-text/80"
            aria-label="Search or jump to"
            role="combobox"
            aria-expanded="true"
            aria-controls="cmd-list"
            aria-activedescendant={items[active] ? `cmd-${active}` : undefined}
          />
        </div>
        <ul id="cmd-list" role="listbox" className="max-h-[55vh] overflow-y-auto p-2">
          {items.length === 0 && <li className="px-3 py-8 text-center text-sm text-slate-text">No matches</li>}
          {items.map((item, i) => (
            <li key={item.href + item.label} id={`cmd-${i}`} role="option" aria-selected={i === active}
              onMouseEnter={() => setActive(i)} onClick={() => go(item.href)}
              className={cn("flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[15px]", i === active && "bg-haze")}>
              <item.icon size={17} className={i === active ? "text-electric" : "text-slate-text"} aria-hidden />
              <span className="grow font-medium">{item.label}</span>
              {item.hint && <span className="text-sm font-semibold text-slate-text tabular">{item.hint}</span>}
              {i === active && <CornerDownLeft size={15} className="text-slate-text" aria-hidden />}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Reports the query string so the sidebar can tell "Listings" from "Paper checks". */
function SearchSync({ onChange }: { onChange: (q: string) => void }) {
  const params = useSearchParams();
  const qs = params.toString();
  useEffect(() => onChange(qs), [qs, onChange]);
  return null;
}
