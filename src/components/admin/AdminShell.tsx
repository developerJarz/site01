"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Car,
  BookOpen,
  Settings,
  BarChart3,
  Search,
  Menu,
  X,
  ExternalLink,
  LogOut,
  FileSearch,
  Clock,
  CornerDownLeft,
} from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { ToastProvider } from "./Toast";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/listings", label: "Listings", icon: Car, badge: "pendingListings" as const },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/blogs", label: "Blog posts", icon: BookOpen },
  { href: "/admin/settings", label: "Site settings", icon: Settings },
];

type Counts = { pendingListings: number; paperAwaiting: number };

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/admin";
  const { data: session } = useSession();
  const { settings } = useSiteSettings();
  const [drawer, setDrawer] = useState(false);
  const [palette, setPalette] = useState(false);
  const [counts, setCounts] = useState<Counts | null>(null);

  // Badge counts: on load, on each page change, and when an admin page reports a change.
  const loadCounts = useCallback(() => {
    fetch("/api/admin/stats?summary=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setCounts(d))
      .catch(() => {});
  }, []);
  useEffect(() => {
    loadCounts();
  }, [loadCounts, pathname]);
  useEffect(() => {
    window.addEventListener("admin:counts-changed", loadCounts);
    return () => window.removeEventListener("admin:counts-changed", loadCounts);
  }, [loadCounts]);

  useEffect(() => setDrawer(false), [pathname]);

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

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  const logoSrc = settings.logoUrl || "/car-hat-bd.png";

  const sidebar = (
    <div className="on-ink flex h-full flex-col bg-ink-deep text-white">
      <div className="flex h-16 items-center gap-3 px-5">
        <Link href="/admin" className="rounded-md bg-white px-2 py-1.5">
          <Image src={logoSrc} alt={settings.siteName || "CarHat"} width={112} height={24} sizes="112px" className="h-6 w-auto" />
        </Link>
        <span className="text-sm font-semibold text-[#9fb3cb]">Admin</span>
      </div>

      <button
        onClick={() => setPalette(true)}
        className="mx-3 mb-3 flex items-center gap-2.5 rounded-lg border border-white/12 bg-white/[0.06] px-3 py-2 text-left text-sm text-[#b9d3f0] transition-colors hover:border-white/25 hover:text-white"
      >
        <Search size={16} aria-hidden />
        <span className="grow">Search</span>
        <kbd className="whitespace-nowrap rounded border border-white/20 px-1.5 text-[11px] font-semibold">Ctrl K</kbd>
      </button>

      <nav aria-label="Admin" className="flex-grow space-y-0.5 px-3">
        {NAV.map((item) => {
          const badge = item.badge && counts ? counts[item.badge] : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors",
                isActive(item.href) ? "bg-white text-ink" : "text-[#cfe0f5] hover:bg-white/[0.08] hover:text-white"
              )}
            >
              <item.icon size={18} aria-hidden />
              <span className="grow">{item.label}</span>
              {badge > 0 && (
                <span className="rounded-full bg-marigold px-2 py-0.5 text-xs font-bold text-foreground tabular" aria-label={`${badge} pending`}>
                  {badge}
                </span>
              )}
            </Link>
          );
        })}

        {counts && counts.paperAwaiting > 0 && (
          <Link
            href="/admin/listings?papers=awaiting"
            className="mt-4 flex items-start gap-3 rounded-lg border border-white/12 px-3 py-3 text-sm text-[#cfe0f5] transition-colors hover:border-white/30 hover:text-white"
          >
            <FileSearch size={18} className="mt-0.5 shrink-0 text-teal-soft" aria-hidden />
            <span>
              <span className="font-semibold text-white tabular">{counts.paperAwaiting}</span>{" "}
              {counts.paperAwaiting === 1 ? "listing has" : "listings have"} papers waiting to be checked
            </span>
          </Link>
        )}
      </nav>

      <div className="space-y-1 border-t border-white/10 p-3">
        <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#cfe0f5] hover:bg-white/[0.08] hover:text-white">
          <ExternalLink size={16} aria-hidden /> View site
        </Link>
        <div className="flex items-center gap-3 px-3 py-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold">
            {session?.user?.name?.[0]?.toUpperCase() || "A"}
          </span>
          <div className="min-w-0 grow">
            <p className="truncate text-sm font-semibold">{session?.user?.name || "Admin"}</p>
            <p className="truncate text-xs text-[#9fb3cb]">{session?.user?.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="rounded-md p-1.5 text-[#9fb3cb] hover:bg-white/10 hover:text-white"
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <ToastProvider>
      <div className="-mt-16 flex min-h-dvh bg-background">
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 lg:block">{sidebar}</aside>

        {drawer && (
          <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
            <div className="animate-fade absolute inset-0 bg-ink-deep/60" onClick={() => setDrawer(false)} />
            <aside className="animate-sheet-left absolute inset-y-0 left-0 w-72">
              {sidebar}
            </aside>
            <button onClick={() => setDrawer(false)} className="absolute right-4 top-4 rounded-lg bg-white p-2 shadow-lift" aria-label="Close menu">
              <X size={20} />
            </button>
          </div>
        )}

        <div className="flex min-w-0 grow flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur-md lg:hidden">
            <button onClick={() => setDrawer(true)} className="-ml-1 rounded-lg p-2 hover:bg-muted" aria-label="Open admin menu">
              <Menu size={22} />
            </button>
            <p className="font-semibold">{NAV.find((n) => isActive(n.href))?.label || "Admin"}</p>
            <button onClick={() => setPalette(true)} className="ml-auto rounded-lg p-2 hover:bg-muted" aria-label="Search">
              <Search size={20} />
            </button>
          </header>

          <main className="mx-auto w-full max-w-[90rem] grow px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
        </div>
      </div>

      {palette && <CommandPalette onClose={() => setPalette(false)} counts={counts} />}
    </ToastProvider>
  );
}

function CommandPalette({ onClose, counts }: { onClose: () => void; counts: Counts | null }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);

  const items = useMemo(() => {
    const term = q.trim();
    const base = [
      { label: "Review pending listings", hint: counts?.pendingListings ? `${counts.pendingListings} waiting` : undefined, href: "/admin/listings?status=pending", icon: Clock },
      { label: "Check car papers", hint: counts?.paperAwaiting ? `${counts.paperAwaiting} waiting` : undefined, href: "/admin/listings?papers=awaiting", icon: FileSearch },
      ...NAV.map((n) => ({ label: n.label, hint: undefined as string | undefined, href: n.href, icon: n.icon })),
      { label: "View site", hint: undefined, href: "/", icon: ExternalLink },
    ];
    const filtered = term ? base.filter((i) => i.label.toLowerCase().includes(term.toLowerCase())) : base;
    const searches = term
      ? [
          { label: `Search listings for “${term}”`, hint: undefined, href: `/admin/listings?q=${encodeURIComponent(term)}`, icon: Car },
          { label: `Search users for “${term}”`, hint: undefined, href: `/admin/users?q=${encodeURIComponent(term)}`, icon: Users },
        ]
      : [];
    return [...searches, ...filtered];
  }, [q, counts]);

  useEffect(() => setActive(0), [q]);

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Command menu">
      <div className="animate-fade absolute inset-0 bg-ink-deep/50" onClick={onClose} />
      <div className="animate-in relative w-full max-w-lg overflow-hidden rounded-xl border border-border bg-popover shadow-pop">
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search size={18} className="shrink-0 text-muted-foreground" aria-hidden />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, items.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              }
              if (e.key === "Enter" && items[active]) go(items[active].href);
            }}
            placeholder="Search listings, users, or go to a page"
            className="h-14 w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
            aria-label="Search or jump to"
            role="combobox"
            aria-expanded="true"
            aria-controls="cmd-list"
            aria-activedescendant={items[active] ? `cmd-${active}` : undefined}
          />
        </div>
        <ul id="cmd-list" role="listbox" className="max-h-[50vh] overflow-y-auto p-1.5">
          {items.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted-foreground">No matches</li>}
          {items.map((item, i) => (
            <li
              key={item.href + item.label}
              id={`cmd-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(item.href)}
              className={cn("flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[15px]", i === active && "bg-accent")}
            >
              <item.icon size={17} className="shrink-0 text-muted-foreground" aria-hidden />
              <span className="grow">{item.label}</span>
              {item.hint && <span className="text-sm text-muted-foreground tabular">{item.hint}</span>}
              {i === active && <CornerDownLeft size={15} className="text-muted-foreground" aria-hidden />}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
