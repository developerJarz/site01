"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageCircle,
} from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";

// Clean custom Brand SVGs for 100% reliable rendering
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
    </svg>
  );
}

const EXPLORE = [
  { href: "/cars", label: "Buy a car" },
  { href: "/cars?condition=reconditioned", label: "Reconditioned cars" },
  { href: "/cars?verified=1", label: "Cars with checked papers" },
  { href: "/sell", label: "Sell your car" },
  { href: "/dealers", label: "Find a dealer" },
];

const HELP = [
  { href: "/faq", label: "Help and FAQ" },
  { href: "/reviews", label: "Car reviews" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About CarHat" },
  { href: "/contact", label: "Contact us" },
];

export function Footer() {
  const pathname = usePathname() || "/";
  const { settings } = useSiteSettings();

  if (pathname.startsWith("/admin")) return null;

  const socialLinks: { name: string; icon: React.ComponentType<{ className?: string }>; href: string }[] = [
    { name: "Facebook", icon: FacebookIcon, href: settings.socialLinks?.facebook || "" },
    { name: "X (Twitter)", icon: TwitterIcon, href: settings.socialLinks?.twitter || "" },
    { name: "Instagram", icon: InstagramIcon, href: settings.socialLinks?.instagram || "" },
    { name: "YouTube", icon: YoutubeIcon, href: settings.socialLinks?.youtube || "" },
    { name: "LinkedIn", icon: LinkedinIcon, href: settings.socialLinks?.linkedin || "" },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      href: settings.socialLinks?.whatsapp
        ? `https://wa.me/${settings.socialLinks.whatsapp.replace(/[^0-9]/g, "")}`
        : "",
    },
  ].filter((item) => Boolean(item.href && item.href.trim()));

  return (
    <footer className="on-ink bg-ink-deep text-white">
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <Link href="/" className="inline-flex rounded-lg bg-white px-3 py-2">
              <Image
                src={settings.logoUrl || "/car-hat-bd.png"}
                alt={settings.siteName || "CarHat.bd"}
                width={140}
                height={30}
                sizes="140px"
                className="h-7 w-auto"
              />
            </Link>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-[#b9d3f0]">
              {settings.tagline || "The premier destination to buy, sell, and explore the best cars in Bangladesh."}
            </p>
            {socialLinks.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2">
                {socialLinks.map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={item.name}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-[#b9d3f0] transition-colors hover:border-white/40 hover:text-white"
                    >
                      <item.icon className="h-[18px] w-[18px]" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <FooterColumn title="Buy and sell" links={EXPLORE} className="md:col-span-3" />
          <FooterColumn title="Help" links={HELP} className="md:col-span-2" />

          <div className="md:col-span-3">
            <h2 className="text-sm font-semibold text-white">Talk to us</h2>
            <ul className="mt-4 space-y-3 text-[15px] text-[#b9d3f0]">
              {settings.supportPhone && (
                <li className="flex items-center gap-2.5">
                  <Phone size={16} className="shrink-0 text-teal-soft" aria-hidden />
                  <a href={`tel:${settings.supportPhone}`} className="hover:text-white tabular">{settings.supportPhone}</a>
                </li>
              )}
              {settings.contactEmail && (
                <li className="flex items-center gap-2.5">
                  <Mail size={16} className="shrink-0 text-teal-soft" aria-hidden />
                  <a href={`mailto:${settings.contactEmail}`} className="break-all hover:text-white">{settings.contactEmail}</a>
                </li>
              )}
              {settings.workingHours && (
                <li className="flex items-start gap-2.5">
                  <Clock size={16} className="mt-1 shrink-0 text-teal-soft" aria-hidden />
                  <span>{settings.workingHours}</span>
                </li>
              )}
              {settings.address && (
                <li className="flex items-start gap-2.5">
                  <MapPin size={16} className="mt-1 shrink-0 text-teal-soft" aria-hidden />
                  <span>{settings.address}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-[#9fb3cb] sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} {settings.copyrightText || "CarHat.bd. All rights reserved."}</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links, className }: { title: string; links: { href: string; label: string }[]; className?: string }) {
  return (
    <div className={className}>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <ul className="mt-4 space-y-2.5 text-[15px] text-[#b9d3f0]">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="hover:text-white">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
