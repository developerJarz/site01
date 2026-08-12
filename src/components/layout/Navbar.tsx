"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Car, MessageSquare, Sparkles, PlusCircle, LayoutDashboard, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";

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
        const data = await res.json();
        if (data.unreadCount !== undefined) {
          setUnreadCount(data.unreadCount);
        }
      } catch (error) {
        console.error("Failed to fetch unread count", error);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
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

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/90 backdrop-blur-xl border-b border-border/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.4)]"
            : "bg-background/80 backdrop-blur-lg border-b border-border/40"
        }`}
      >
        {/* Subtle top accent gradient line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-primary/30 via-primary to-purple-500/40" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* ──── Brand Logo ──── */}
            <Link
              href="/"
              className="flex items-center gap-2.5 group select-none"
              onClick={() => setIsOpen(false)}
            >
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 bg-primary/25 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative w-10 h-10 bg-gradient-to-br from-primary via-primary to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-primary/25 group-hover:scale-105 transition-transform duration-200">
                  <Car className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-foreground flex items-center">
                  Car<span className="gradient-text ml-0.5">Hat</span>
                  <span className="text-xs font-bold text-muted-foreground ml-1 px-1.5 py-0.5 bg-muted rounded-md uppercase tracking-wider">
                    BD
                  </span>
                </span>
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
              {/* Quick "Sell Car" button for high conversion */}
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
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                    <Car size={16} />
                  </div>
                  <span className="font-extrabold text-foreground tracking-tight">
                    Car<span className="gradient-text">Hat</span>.bd
                  </span>
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
