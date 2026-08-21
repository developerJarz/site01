"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Car,
  ArrowLeft,
  BookOpen,
  Settings,
  BarChart3,
} from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/listings", label: "Listings", icon: Car },
  { href: "/admin/blogs", label: "Blogs", icon: BookOpen },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { settings } = useSiteSettings();
  const logoSrc = settings.logoUrl || "/car-hat-bd.png";

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex-shrink-0 hidden md:flex flex-col">
        <div className="p-6 border-b border-border">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="relative h-9 flex items-center">
              <Image
                src={logoSrc}
                alt="CarHat Admin"
                width={130}
                height={36}
                className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </div>
          </Link>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Admin Portal
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Online" />
          </div>
        </div>

        <nav className="flex-grow p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors px-4 py-2 font-medium"
          >
            <ArrowLeft size={16} /> Back to Website
          </Link>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-50 flex justify-around py-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Main Content */}
      <main className="flex-grow p-6 md:p-8 overflow-auto bg-background">
        {children}
      </main>
    </div>
  );
}
