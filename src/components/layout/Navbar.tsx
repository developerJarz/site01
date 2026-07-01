"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Car, User, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

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
    const interval = setInterval(fetchUnread, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [session]);

  return (
    <nav className="fixed w-full z-50 top-0 left-0 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <Car className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold tracking-tight">CarHat.bd</span>
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/cars" className="text-sm font-medium hover:text-primary transition-colors">Buy Car</Link>
            <Link href="/sell" className="text-sm font-medium hover:text-primary transition-colors">Sell Car</Link>
            <Link href="/dealers" className="text-sm font-medium hover:text-primary transition-colors">Dealers</Link>
            <Link href="/blog" className="text-sm font-medium hover:text-primary transition-colors">Blog</Link>
            <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors">About</Link>
            {session ? (
              <div className="flex items-center gap-2">
                <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                  Dashboard
                </Link>
                <Link href="/dashboard/messages" className={`relative p-2 transition-colors flex items-center justify-center rounded-full ${unreadCount > 0 ? 'text-red-500 hover:bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'text-foreground hover:text-primary hover:bg-primary/10'}`} title="Messages">
                  <MessageSquare size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background animate-pulse shadow-[0_0_8px_rgba(239,68,68,1)]" />
                  )}
                </Link>
                <Link href="/profile" className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full font-medium hover:bg-primary/20 transition-colors ml-2">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {session.user?.name?.[0] || "U"}
                  </div>
                  Profile
                </Link>
              </div>
            ) : (
              <Link href="/login" className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full font-medium hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
                <User size={18} />
                Sign In
              </Link>
            )}
          </div>
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-foreground p-2">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden glass-panel absolute top-16 left-0 w-full border-t border-border"
          >
            <div className="px-4 pt-2 pb-6 space-y-4 flex flex-col">
              <Link href="/cars" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-white/10" onClick={() => setIsOpen(false)}>Buy Car</Link>
              <Link href="/sell" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-white/10" onClick={() => setIsOpen(false)}>Sell Car</Link>
              <Link href="/dealers" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-white/10" onClick={() => setIsOpen(false)}>Dealers</Link>
              {session ? (
                <>
                  <Link href="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-white/10" onClick={() => setIsOpen(false)}>Dashboard</Link>
                  <Link href="/dashboard/messages" className={`flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium hover:bg-white/10 ${unreadCount > 0 ? 'text-red-500' : ''}`} onClick={() => setIsOpen(false)}>
                    <div className={`relative ${unreadCount > 0 ? 'drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : ''}`}>
                      <MessageSquare size={20} />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background animate-pulse shadow-[0_0_8px_rgba(239,68,68,1)]" />
                      )}
                    </div>
                    Messages
                  </Link>
                  <Link href="/profile" className="flex items-center justify-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full font-medium mt-2" onClick={() => setIsOpen(false)}>
                    <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {session.user?.name?.[0] || "U"}
                    </div>
                    Profile
                  </Link>
                </>
              ) : (
                <Link href="/login" className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full font-medium mt-4 shadow-lg shadow-primary/20" onClick={() => setIsOpen(false)}>
                  <User size={18} />
                  Sign In
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
