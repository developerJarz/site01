"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Megaphone, X } from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { cn } from "@/lib/utils";

const TONES = {
  brand: "bg-electric text-white",
  dark: "bg-night text-white",
  warning: "bg-warning-soft text-[#7c2d12]",
  success: "bg-verified text-white",
} as const;

const STORAGE_KEY = "carhat_announcement_dismissed";

/** The site-wide notice from Admin → Appearance → Header. Visitors can close it; a new message shows again. */
export function AnnouncementBar() {
  const pathname = usePathname() || "/";
  const { settings } = useSiteSettings();
  const a = settings.appearance.announcement;
  const [dismissed, setDismissed] = useState<string | null>(null);

  useEffect(() => {
    try { setDismissed(localStorage.getItem(STORAGE_KEY)); } catch {}
  }, []);

  if (!a.enabled || !a.text || pathname.startsWith("/admin") || dismissed === a.text) return null;
  const external = /^https?:\/\//.test(a.linkUrl);

  return (
    <div role="region" aria-label="Announcement" className={cn("relative mx-auto mb-2 flex max-w-[1320px] items-center gap-3 px-4 py-2.5 text-sm sm:rounded-2xl sm:px-5 md:mt-1 md:w-[calc(100%-3rem)]", TONES[a.tone])}>
      <Megaphone size={16} className="shrink-0 opacity-90" aria-hidden />
      <p className="min-w-0 grow font-semibold leading-snug">
        {a.text}
        {a.linkUrl && a.linkLabel && (
          <Link href={a.linkUrl} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="ml-2 inline-flex items-center gap-1 whitespace-nowrap underline decoration-2 underline-offset-2 hover:no-underline">
            {a.linkLabel} <ArrowRight size={14} aria-hidden />
          </Link>
        )}
      </p>
      <button type="button" aria-label="Close announcement"
        onClick={() => { setDismissed(a.text); try { localStorage.setItem(STORAGE_KEY, a.text); } catch {} }}
        className="-mr-1.5 flex size-8 shrink-0 items-center justify-center rounded-full opacity-80 transition-opacity hover:bg-black/10 hover:opacity-100">
        <X size={16} aria-hidden />
      </button>
    </div>
  );
}
