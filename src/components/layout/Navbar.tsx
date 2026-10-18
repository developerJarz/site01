"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { MotionConfig } from "framer-motion";
import {
  Bell, ChevronDown, Heart, House, LayoutDashboard, LogOut, Menu, MessageSquare, Plus, Search, ShieldHalf, UserRound,
} from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { useMarketplace, type MarketplacePanel } from "@/context/MarketplaceContext";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/ui/header-2";
import { MenuToggleIcon } from "@/components/ui/menu-toggle-icon";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { NavSearch } from "./NavSearch";
import { UserAvatar } from "@/components/UserAvatar";
import { useUnreadCount } from "./useUnreadCount";
import { PANEL_LINKS } from "@/lib/site-config";
import { isStaffRole } from "@/lib/permissions";

const MarketplacePanels = dynamic(() => import("./MarketplacePanels").then((m) => m.MarketplacePanels), { ssr: false });

type NavLink = { label: string; href?: string; panel?: MarketplacePanel };



/** Pages where a fixed bottom bar would cover the page's own controls (chat composer, sell form actions). */
const NO_BOTTOM_NAV = ["/dashboard/messages", "/sell"];

export function Navbar() {
  const pathname = usePathname() || "/";
  // The admin area has its own shell.
  if (pathname.startsWith("/admin")) return null;
  return <SiteNavbar pathname={pathname} />;
}

function SiteNavbar({ pathname }: { pathname: string }) {
  const { data: session } = useSession();
  const { settings } = useSiteSettings();
  const { openPanel, favoriteIds, compareCars } = useMarketplace();
  const unread = useUnreadCount(!!session?.user);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  useEffect(() => {
    setDrawerOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const logoSrc = settings.logoUrl || "/car-hat-bd.png";
  // Menu links, the main button and search come from Admin → Appearance → Header.
  const header = settings.appearance.header;
  const NAV_LINKS: NavLink[] = header.navLinks.map((l) =>
    PANEL_LINKS[l.href] ? { label: l.label, panel: PANEL_LINKS[l.href] as MarketplacePanel } : { label: l.label, href: l.href });
  const cta = header.ctaLabel && header.ctaHref ? { label: header.ctaLabel, href: header.ctaHref } : null;
  const siteName = settings.siteName || "CarHat BD";
  const isActive = (href?: string) => !!href && (pathname === href || pathname.startsWith(href + "/"));

  const openFromMenu = (panel: MarketplacePanel) => {
    setDrawerOpen(false);
    openPanel(panel);
  };

  return (
    <MotionConfig reducedMotion="user">
      <Header>
        {/* One row at every width: logo, main links, compact search, account actions. */}
        <div className="mx-auto flex h-16 max-w-[1320px] items-center gap-3 px-4 sm:px-6 lg:gap-2 lg:px-4 xl:gap-4 xl:px-5">
          <Link href="/" className="flex shrink-0 items-center" aria-label={`${siteName} home`}>
            <Image src={logoSrc} alt={siteName} width={160} height={34} preload sizes="160px" className="h-7 w-auto max-w-[9.5rem] object-contain object-left xl:h-8" />
          </Link>

          <nav aria-label="Main" className="hidden shrink-0 lg:block">
            <ul className="flex items-center">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  {link.panel ? (
                    <button type="button" onClick={() => openPanel(link.panel!)} className="nav-link">
                      {link.label}
                      {link.panel === "compare" && compareCars.length > 0 && (
                        <span className="ml-1 rounded-full bg-electric px-1.5 text-[11px] font-bold text-white tabular">{compareCars.length}</span>
                      )}
                    </button>
                  ) : (
                    <Link href={link.href!} className="nav-link" aria-current={isActive(link.href) ? "page" : undefined}>{link.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* The search box takes only the space left over, so it can never squeeze the links onto two lines. */}
          {header.showSearch ? <NavSearch compact className="ml-auto hidden min-w-36 max-w-60 flex-1 xl:block" /> : <span className="ml-auto hidden xl:block" aria-hidden />}

          <div className="ml-auto flex shrink-0 items-center gap-0.5 xl:ml-0 xl:gap-1">
            {header.showSearch && <IconButton label="Search" onClick={() => setSearchOpen(true)} className="xl:hidden"><Search size={20} /></IconButton>}
            <IconButton label={favoriteIds.length ? `Wishlist, ${favoriteIds.length} saved` : "Wishlist"} onClick={() => openPanel("saved")} count={favoriteIds.length} className="hidden sm:flex">
              <Heart size={20} />
            </IconButton>
            <IconButton label={unread ? `Notifications, ${unread} unread` : "Notifications"} onClick={() => openPanel("notifications")} count={unread} dot>
              <Bell size={20} />
            </IconButton>

            {session?.user ? <ProfileMenu unread={unread} /> : (
              <Button asChild variant="ghost" className="hidden px-3.5 lg:inline-flex">
                <Link href="/login">Login</Link>
              </Button>
            )}

            {cta && (
              <Button asChild className="btn-shine ml-1 hidden h-10 px-4 sm:inline-flex">
                <Link href={cta.href}><Plus size={17} strokeWidth={2.5} aria-hidden /> <span className="lg:max-xl:hidden">{cta.label}</span><span className="hidden lg:max-xl:inline">{cta.label.split(" ")[0]}</span></Link>
              </Button>
            )}
            <button type="button" aria-label={drawerOpen ? "Close menu" : "Open menu"} aria-expanded={drawerOpen} aria-controls="mobile-navigation" onClick={() => setDrawerOpen((open) => !open)} className="flex size-11 items-center justify-center rounded-xl border border-border text-night transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric lg:hidden">
              <MenuToggleIcon open={drawerOpen} />
            </button>
          </div>
        </div>
      </Header>

      {/* Mobile menu */}
      <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DialogContent side="right" id="mobile-navigation">
          <DialogHeader>
            <DialogTitle>Menu</DialogTitle>
            <DialogDescription className="sr-only">Site navigation</DialogDescription>
          </DialogHeader>
          <nav aria-label="Mobile" className="grow overflow-y-auto p-3">
            <Link href="/" className="drawer-link" aria-current={pathname === "/" ? "page" : undefined}>Home</Link>
            {NAV_LINKS.map((link) =>
              link.panel ? (
                <button key={link.label} type="button" onClick={() => openFromMenu(link.panel!)} className="drawer-link">{link.label}</button>
              ) : (
                <Link key={link.label} href={link.href!} className="drawer-link" aria-current={isActive(link.href) ? "page" : undefined}>{link.label}</Link>
              )
            )}
            {session?.user && (
              <>
                <div className="mx-3 my-3 h-px bg-hairline" />
                <Link href="/dashboard" className="drawer-link"><LayoutDashboard size={18} className="text-electric" aria-hidden /> My dashboard</Link>
                <Link href="/dashboard/messages" className="drawer-link"><MessageSquare size={18} className="text-electric" aria-hidden /> Messages
                  {unread > 0 && <span className="ml-auto rounded-full bg-electric px-2 py-0.5 text-xs font-bold text-white tabular">{unread}</span>}
                </Link>
                <Link href="/profile" className="drawer-link"><UserRound size={18} className="text-electric" aria-hidden /> Profile</Link>
                {isStaffRole((session.user as { role?: string }).role) && (
                  <Link href="/admin" className="drawer-link"><ShieldHalf size={18} className="text-electric" aria-hidden /> Admin panel</Link>
                )}
              </>
            )}
          </nav>
          <div className="grid gap-2 border-t border-hairline p-4">
            {cta && <Button asChild><Link href={cta.href}><Plus size={17} aria-hidden /> {cta.label}</Link></Button>}
            {session?.user ? (
              <Button variant="secondary" onClick={() => signOut({ callbackUrl: "/" })}><LogOut size={16} aria-hidden /> Sign out</Button>
            ) : (
              <Button asChild variant="secondary"><Link href="/login">Login</Link></Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile search */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent side="right" className="w-full">
          <DialogHeader className="pb-4">
            <DialogTitle>Search</DialogTitle>
            <DialogDescription>Cars, brands, models or cities</DialogDescription>
          </DialogHeader>
          <div className="grow overflow-y-auto p-5">
            <NavSearch autoFocus onNavigate={() => setSearchOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>

      {!NO_BOTTOM_NAV.some((p) => pathname.startsWith(p)) && (
        <MobileBottomNav pathname={pathname} onSearch={() => setSearchOpen(true)} signedIn={!!session?.user} savedCount={favoriteIds.length} />
      )}
      <MarketplacePanels unread={unread} />
    </MotionConfig>
  );
}

function IconButton({ label, onClick, count = 0, dot, className, children }: {
  label: string; onClick: () => void; count?: number; dot?: boolean; className?: string; children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} aria-label={label}
      className={cn("relative flex size-11 items-center justify-center rounded-full text-slate-text transition-colors hover:bg-mist hover:text-night", className)}>
      {children}
      {count > 0 && (dot ? (
        <span className="absolute right-2.5 top-2.5 size-2.5 rounded-full bg-[#ff3b30] ring-2 ring-white" aria-hidden />
      ) : (
        <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-electric px-1 text-[10px] font-bold text-white ring-2 ring-white tabular" aria-hidden>
          {count > 9 ? "9+" : count}
        </span>
      ))}
    </button>
  );
}

function ProfileMenu({ unread }: { unread: number }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isAdmin = isStaffRole((session?.user as { role?: string } | undefined)?.role);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onClick); };
  }, [open]);

  if (!session?.user) return null;

  return (
    <div ref={ref} className="relative hidden lg:block">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu"
        aria-label={`Account menu for ${session.user.name || "your account"}`}
        className="flex h-10 items-center gap-2 rounded-full border border-hairline bg-white py-1 pl-1 pr-2 transition-colors hover:bg-mist">
        <UserAvatar src={session.user.image} name={session.user.name} size={32} className="text-xs" />
        <span className="hidden max-w-[88px] truncate text-sm font-semibold 2xl:inline">{session.user.name?.split(" ")[0] || "Account"}</span>
        <ChevronDown size={15} className={cn("text-slate-text transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div role="menu" className="animate-in absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-2xl border border-hairline bg-white p-1.5 shadow-float">
          <div className="px-3 py-2.5">
            <p className="truncate text-sm font-semibold">{session.user.name}</p>
            <p className="truncate text-xs text-slate-text">{session.user.email}</p>
          </div>
          <div className="my-1 h-px bg-hairline" />
          <MenuItem href="/dashboard" icon={LayoutDashboard}>My dashboard</MenuItem>
          <MenuItem href="/dashboard/messages" icon={MessageSquare}>
            Messages {unread > 0 && <span className="ml-auto rounded-full bg-electric px-1.5 text-xs font-bold text-white tabular">{unread}</span>}
          </MenuItem>
          <MenuItem href="/profile" icon={UserRound}>Profile</MenuItem>
          {isAdmin && <MenuItem href="/admin" icon={ShieldHalf}>Admin panel</MenuItem>}
          <div className="my-1 h-px bg-hairline" />
          <button role="menuitem" onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-text hover:bg-mist hover:text-night">
            <LogOut size={16} aria-hidden /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function MenuItem({ href, icon: Icon, children }: { href: string; icon: typeof Menu; children: React.ReactNode }) {
  return (
    <Link role="menuitem" href={href} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-text hover:bg-mist hover:text-night">
      <Icon size={16} aria-hidden /> {children}
    </Link>
  );
}

function MobileBottomNav({ pathname, onSearch, signedIn, savedCount }: { pathname: string; onSearch: () => void; signedIn: boolean; savedCount: number }) {
  const { openPanel } = useMarketplace();
  const onHome = pathname === "/";
  const onAccount = pathname.startsWith("/dashboard") || pathname.startsWith("/profile");
  return (
    <nav aria-label="Quick actions" className="fixed inset-x-0 bottom-0 z-50 border-t border-hairline bg-white/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_-16px_rgb(11_29_54/0.18)] backdrop-blur-xl md:hidden">
      <ul className="grid grid-cols-5 px-2">
        <li>
          {onHome ? (
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="bottom-tab" aria-current="page">
              <House size={21} aria-hidden /> Home
            </button>
          ) : (
            <Link href="/" className="bottom-tab"><House size={21} aria-hidden /> Home</Link>
          )}
        </li>
        <li><button type="button" onClick={onSearch} className="bottom-tab"><Search size={21} aria-hidden /> Search</button></li>
        <li className="flex justify-center">
          <Link href="/sell" className="bottom-tab">
            <span className="-mt-6 flex size-12 items-center justify-center rounded-2xl bg-electric text-white shadow-glow"><Plus size={24} strokeWidth={2.5} aria-hidden /></span>
            Sell
          </Link>
        </li>
        <li>
          <button type="button" onClick={() => openPanel("saved")} className="bottom-tab relative">
            <Heart size={21} aria-hidden /> Saved
            {savedCount > 0 && <span className="absolute right-[calc(50%-18px)] top-1.5 size-2 rounded-full bg-electric" aria-hidden />}
          </button>
        </li>
        <li>
          <Link href={signedIn ? "/dashboard" : "/login"} className="bottom-tab" aria-current={onAccount ? "page" : undefined}>
            <UserRound size={21} aria-hidden /> Account
          </Link>
        </li>
      </ul>
    </nav>
  );
}
