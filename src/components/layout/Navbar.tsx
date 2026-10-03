"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Menu,
  X,
  MessageSquare,
  Plus,
  LayoutDashboard,
  UserRound,
  ShieldHalf,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/cars", label: "Buy a car" },
  { href: "/sell", label: "Sell a car" },
  { href: "/dealers", label: "Dealers" },
  { href: "/reviews", label: "Reviews" },
  { href: "/blog", label: "Blog" },
];

function useUnreadCount(enabled: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const load = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/conversations/unread");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && typeof data.unreadCount === "number") setCount(data.unreadCount);
      } catch {
        // offline or signed out; the badge just stays as it was
      }
    };

    load();
    const interval = setInterval(load, 30_000);
    document.addEventListener("visibilitychange", load);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", load);
    };
  }, [enabled]);

  return count;
}

export function Navbar() {
  const pathname = usePathname() || "/";
  const { data: session } = useSession();
  const { settings } = useSiteSettings();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const unread = useUnreadCount(!!session?.user);
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on navigation.
  useEffect(() => {
    setDrawerOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen && !menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        setMenuOpen(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [drawerOpen, menuOpen]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    if (drawerOpen) closeBtnRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  // The admin area has its own shell.
  if (pathname.startsWith("/admin")) return null;

  const logoSrc = settings.logoUrl || "/car-hat-bd.png";
  const siteName = settings.siteName || "CarHat.bd";
  const firstName = session?.user?.name?.split(" ")[0] || "Account";
  const initial = session?.user?.name?.[0]?.toUpperCase() || "U";
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b bg-card/95 backdrop-blur-md transition-shadow duration-200",
          scrolled ? "border-border shadow-card" : "border-transparent"
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center" aria-label={`${siteName} home`}>
            <Image
              src={logoSrc}
              alt={siteName}
              width={152}
              height={32}
              priority
              sizes="152px"
              className="h-7 w-auto md:h-8"
            />
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "relative rounded-md px-3 py-2 text-[15px] font-medium transition-colors",
                  isActive(link.href)
                    ? "text-primary after:absolute after:inset-x-3 after:-bottom-[13px] after:h-[3px] after:rounded-full after:bg-primary"
                    : "text-foreground/80 hover:bg-muted hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {session?.user && (
              <Link
                href="/dashboard/messages"
                className="relative hidden rounded-lg p-2.5 text-foreground/75 transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
                aria-label={unread > 0 ? `Messages, ${unread} unread` : "Messages"}
              >
                <MessageSquare size={20} />
                {unread > 0 && (
                  <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-bold leading-none text-white ring-2 ring-card tabular">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            )}

            {session?.user ? (
              <div ref={menuRef} className="relative hidden lg:block">
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-2.5 transition-colors hover:bg-muted"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">
                    {initial}
                  </span>
                  <span className="max-w-[96px] truncate text-sm font-semibold">{firstName}</span>
                  <ChevronDown size={15} className={cn("text-muted-foreground transition-transform", menuOpen && "rotate-180")} />
                </button>
                {menuOpen && (
                  <div
                    role="menu"
                    className="animate-in absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-border bg-popover p-1.5 shadow-lift"
                  >
                    <div className="px-3 py-2">
                      <p className="truncate text-sm font-semibold">{session.user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
                    </div>
                    <div className="my-1 h-px bg-border" />
                    <MenuLink href="/dashboard" icon={LayoutDashboard}>My dashboard</MenuLink>
                    <MenuLink href="/dashboard/messages" icon={MessageSquare}>
                      Messages {unread > 0 && <span className="ml-auto rounded-full bg-destructive px-1.5 text-xs font-bold text-white tabular">{unread}</span>}
                    </MenuLink>
                    <MenuLink href="/profile" icon={UserRound}>Profile</MenuLink>
                    {isAdmin && <MenuLink href="/admin" icon={ShieldHalf}>Admin</MenuLink>}
                    <div className="my-1 h-px bg-border" />
                    <button
                      role="menuitem"
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted hover:text-foreground"
                    >
                      <LogOut size={16} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden rounded-lg px-3 py-2 text-[15px] font-semibold text-foreground/85 transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
              >
                Sign in
              </Link>
            )}

            <Link
              href="/sell"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-card transition-colors hover:bg-[#0a4594]"
            >
              <Plus size={16} strokeWidth={2.5} aria-hidden />
              <span className="hidden sm:inline">Sell your car</span>
              <span className="sm:hidden">Sell</span>
            </Link>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="-mr-1 rounded-lg p-2.5 text-foreground transition-colors hover:bg-muted lg:hidden"
              aria-label="Open menu"
              aria-expanded={drawerOpen}
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="animate-fade absolute inset-0 bg-ink-deep/60" onClick={() => setDrawerOpen(false)} />
          <aside className="animate-sheet absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-card shadow-pop">
            <div className="flex h-16 items-center justify-between border-b border-border px-5">
              <Image src={logoSrc} alt={siteName} width={132} height={28} sizes="132px" className="h-7 w-auto" />
              <button
                ref={closeBtnRef}
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
            </div>

            <nav aria-label="Mobile" className="flex-grow overflow-y-auto px-3 py-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-3 text-base font-semibold",
                    isActive(link.href) ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-muted"
                  )}
                >
                  {link.label}
                </Link>
              ))}

              {session?.user && (
                <>
                  <div className="mx-3 my-3 h-px bg-border" />
                  <DrawerLink href="/dashboard" icon={LayoutDashboard}>My dashboard</DrawerLink>
                  <DrawerLink href="/dashboard/messages" icon={MessageSquare}>
                    Messages
                    {unread > 0 && (
                      <span className="ml-auto rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-white tabular">{unread}</span>
                    )}
                  </DrawerLink>
                  <DrawerLink href="/profile" icon={UserRound}>Profile</DrawerLink>
                  {isAdmin && <DrawerLink href="/admin" icon={ShieldHalf}>Admin</DrawerLink>}
                </>
              )}
            </nav>

            <div className="space-y-2 border-t border-border p-4">
              {session?.user ? (
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-3 text-sm font-semibold hover:bg-muted"
                >
                  <LogOut size={16} /> Sign out
                </button>
              ) : (
                <Link
                  href="/login"
                  className="flex w-full items-center justify-center rounded-lg border border-border py-3 text-sm font-semibold hover:bg-muted"
                >
                  Sign in
                </Link>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function MenuLink({ href, icon: Icon, children }: { href: string; icon: typeof Menu; children: React.ReactNode }) {
  return (
    <Link
      role="menuitem"
      href={href}
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted hover:text-foreground"
    >
      <Icon size={16} /> {children}
    </Link>
  );
}

function DrawerLink({ href, icon: Icon, children }: { href: string; icon: typeof Menu; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-muted">
      <Icon size={19} className="text-primary" /> {children}
    </Link>
  );
}
