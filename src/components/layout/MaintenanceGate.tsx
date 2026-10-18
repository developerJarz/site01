"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Wrench } from "lucide-react";
import { isStaffRole } from "@/lib/permissions";
import { useSiteSettings } from "@/context/SiteSettingsContext";

/** Pages that stay reachable during maintenance, so the team can still sign in and switch it off. */
const ALWAYS_OPEN = ["/login", "/admin", "/forgot-password"];

/** Shows the maintenance notice from Admin → Settings to everyone except admins. */
export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const { settings } = useSiteSettings();
  const { data: session } = useSession();
  const isAdmin = isStaffRole((session?.user as { role?: string } | undefined)?.role);

  if (!settings.maintenanceMode || isAdmin || ALWAYS_OPEN.some((p) => pathname.startsWith(p))) return <>{children}</>;

  return (
    <div className="hero-backdrop flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="max-w-lg text-center">
        <Image src={settings.logoUrl || "/car-hat-bd.png"} alt={settings.siteName || "CarHat BD"} width={160} height={34} className="mx-auto h-9 w-auto" />
        <span className="mx-auto mt-8 flex size-16 items-center justify-center rounded-2xl bg-white text-electric shadow-soft"><Wrench size={28} aria-hidden /></span>
        <h1 className="mt-6 text-3xl font-extrabold text-night">We&apos;ll be right back</h1>
        <p className="mt-3 text-slate-text">{settings.maintenanceMessage || "We're making some improvements. Please check back shortly."}</p>
        {settings.supportPhone && (
          <p className="mt-6 text-sm text-slate-text">Need help now? Call <a href={`tel:${settings.supportPhone}`} className="font-bold text-electric">{settings.supportPhone}</a></p>
        )}
        <Link href="/login" className="mt-8 inline-block text-xs font-semibold text-slate-text hover:text-night">Team sign in</Link>
      </div>
    </div>
  );
}
