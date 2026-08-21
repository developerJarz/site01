"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, MessageSquare, Sparkles, PlusCircle, LayoutDashboard, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useSiteSettings } from "@/context/SiteSettingsContext";

const NAV_LINKS = [
  { href: "/cars", label: "Buy Car" },
  { href: "/sell", label: "Sell Car" },
  { href: "/dealers", label: "Dealers" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: session } = useSession();
  const { settings } = useSiteSettings();
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();

  // Scroll detection for subtle elevation
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch unread messages
  useEffect(() => {
    if (!session?.user) return;

    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/conversations/unread");
        if (res.ok) {
          const data = await res.json();
          if (data.unreadCount !== undefined) {
            setUnreadCount(data.unreadCount);
          }
        }
      } catch (error) {
        console.warn("Failed to fetch unread count", error);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, [session]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const logoSrc = settings.logoUrl || "/car-hat-bd.png";

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/95 backdrop-blur-xl shadow-sm"
            : "bg-background/90 backdrop-blur-lg"
        }`}
      >

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* ──── Brand Logo ──── */}
            <Link
              href="/"
              className="flex items-center gap-2.5 group select-none py-1"
              onClick={() => setIsOpen(false)}
            >
              <div className="relative flex items-center h-10">
                <Image
                  src={logoSrc}
                  alt={settings.siteName || "CarHat.bd"}
                  width={150}
                  height={40}
                  priority
                  className="h-9 md:h-10 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                  onError={(e) => {
                    // Fallback to text if image error occurs
                    e.currentTarget.style.display = "none";
                    const fallback = e.currentTarget.parentElement?.querySelector(".logo-fallback") as HTMLElement;
                    if (fallback) fallback.style.display = "flex";
                  }}
                />
                <div className="logo-fallback hidden items-center gap-1.5 font-black text-xl tracking-tight text-foreground">
                  <span>Car<span className="gradient-text">Hat</span></span>
                  <span className="text-xs font-bold text-muted-foreground ml-0.5 px-1.5 py-0.5 bg-muted rounded-md uppercase">
                    BD
                  </span>
                </div>
              </div>
            </Link>

            {/* ──── Desktop Navigation ──── */}
            <nav className="hidden md:flex items-center space-x-1">
              {NAV_LINKS.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname?.startsWith(link.href + "/"));

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-3.5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      isActive
                        ? "text-primary bg-primary/10"
                        : "text-foreground/80 hover:text-foreground hover:bg-muted/70"
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <motion.div
                        layoutId="nav-active-pill"
                        className="absolute bottom-0 left-2 right-2 h-[2px] bg-primary rounded-full"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* ──── Right Action Buttons ──── */}
            <div className="hidden md:flex items-center gap-3">
              {/* Quick "Sell Car" button */}
              <Link
                href="/sell"
                className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-colors duration-200"
              >
                <PlusCircle size={14} />
                Post Ad
              </Link>

              {session ? (
                <div className="flex items-center gap-2 pl-2 border-l border-border/60">
                  {/* Messages Icon with live counter */}
                  <Link
                    href="/dashboard/messages"
                    className={`relative p-2 rounded-lg text-foreground/70 hover:text-foreground hover:bg-muted/70 transition-colors ${
                      unreadCount > 0 ? "text-red-500 hover:text-red-600" : ""
                    }`}
                    title="Messages"
                  >
                    <MessageSquare size={19} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-background animate-pulse" />
                    )}
                  </Link>

                  {/* Dashboard link */}
                  <Link
                    href="/dashboard"
                    className="p-2 rounded-lg text-foreground/70 hover:text-foreground hover:bg-muted/70 transition-colors"
                    title="Dashboard"
                  >
                    <LayoutDashboard size={19} />
                  </Link>

                  {/* User Profile Pill */}
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-muted/80 hover:bg-muted border border-border/60 transition-all duration-200 group"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-purple-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                      {session.user?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <span className="text-xs font-semibold text-foreground max-w-[90px] truncate">
                      {session.user?.name?.split(" ")[0] || "Account"}
                    </span>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2 pl-2 border-l border-border/60">
                  <Link
                    href="/login"
                    className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all duration-200 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-98"
                  >
                    <Sparkles size={14} />
                    Sign In
                  </Link>
                </div>
              )}
            </div>

            {/* ──── Mobile Toggle Button ──── */}
            <div className="flex items-center gap-2 md:hidden">
              <Link
                href="/sell"
                className="text-xs font-bold px-2.5 py-1.5 rounded-md bg-primary/10 text-primary border border-primary/20"
              >
                + Post
              </Link>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg text-foreground hover:bg-muted transition-colors focus:outline-none"
                aria-label="Toggle menu"
              >
                {isOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ──── Mobile Drawer Navigation ──── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-[82%] max-w-sm bg-card border-l border-border z-50 md:hidden shadow-2xl flex flex-col"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <Image
                    src={logoSrc}
                    alt={settings.siteName || "CarHat.bd"}
                    width={130}
                    height={36}
                    className="h-8 w-auto object-contain"
                  />
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-grow overflow-y-auto px-4 py-4 space-y-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                  Navigation
                </p>

                {NAV_LINKS.map((link) => {
                  const isActive =
                    pathname === link.href ||
                    (link.href !== "/" && pathname?.startsWith(link.href + "/"));

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-foreground/80 hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <span>{link.label}</span>
                      <ChevronRight size={16} className="text-muted-foreground/60" />
                    </Link>
                  );
                })}

                {session && (
                  <>
                    <div className="my-3 border-t border-border" />
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                      Account & Activity
                    </p>

                    <Link
                      href="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-foreground/80 hover:bg-muted hover:text-foreground"
                    >
                      <span className="flex items-center gap-2.5">
                        <LayoutDashboard size={17} className="text-primary" />
                        Dashboard
                      </span>
                      <ChevronRight size={16} className="text-muted-foreground/60" />
                    </Link>

                    <Link
                      href="/dashboard/messages"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-foreground/80 hover:bg-muted hover:text-foreground"
                    >
                      <span className="flex items-center gap-2.5">
                        <MessageSquare size={17} className="text-primary" />
                        Messages
                      </span>
                      {unreadCount > 0 ? (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {unreadCount}
                        </span>
                      ) : (
                        <ChevronRight size={16} className="text-muted-foreground/60" />
                      )}
                    </Link>

                    <Link
                      href="/profile"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-foreground/80 hover:bg-muted hover:text-foreground"
                    >
                      <span className="flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">
                          {session.user?.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        My Profile
                      </span>
                      <ChevronRight size={16} className="text-muted-foreground/60" />
                    </Link>
                  </>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-border space-y-2">
                <Link
                  href="/sell"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-primary to-purple-600 text-white py-3 rounded-xl font-bold text-sm shadow-md shadow-primary/20"
                >
                  <PlusCircle size={17} />
                  Sell Your Car
                </Link>

                {!session && (
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 w-full bg-muted text-foreground py-2.5 rounded-xl font-semibold text-sm hover:bg-muted/80 transition-colors"
                  >
                    <Sparkles size={15} />
                    Sign In to Account
                  </Link>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
