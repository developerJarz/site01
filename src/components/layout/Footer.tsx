"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Globe,
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

export function Footer() {
  const { settings } = useSiteSettings();
  const logoSrc = settings.logoUrl || "/car-hat-bd.png";

  const socialLinks: { name: string; icon: any; href: string; color: string }[] = [
    {
      name: "Facebook",
      icon: FacebookIcon,
      href: settings.socialLinks?.facebook || "",
      color: "hover:text-[#1877F2]",
    },
    {
      name: "Twitter / X",
      icon: TwitterIcon,
      href: settings.socialLinks?.twitter || "",
      color: "hover:text-foreground",
    },
    {
      name: "Instagram",
      icon: InstagramIcon,
      href: settings.socialLinks?.instagram || "",
      color: "hover:text-[#E4405F]",
    },
    {
      name: "YouTube",
      icon: YoutubeIcon,
      href: settings.socialLinks?.youtube || "",
      color: "hover:text-[#FF0000]",
    },
    {
      name: "LinkedIn",
      icon: LinkedinIcon,
      href: settings.socialLinks?.linkedin || "",
      color: "hover:text-[#0A66C2]",
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      href: settings.socialLinks?.whatsapp
        ? `https://wa.me/${settings.socialLinks.whatsapp.replace(/[^0-9]/g, "")}`
        : "",
      color: "hover:text-[#25D366]",
    },
  ].filter((item) => Boolean(item.href && item.href.trim()));

  return (
    <footer className="bg-card text-card-foreground border-t border-border relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="md:col-span-4 space-y-4">
            <Link href="/" className="inline-block group">
              <div className="relative h-10 flex items-center">
                <Image
                  src={logoSrc}
                  alt={settings.siteName || "CarHat.bd"}
                  width={150}
                  height={40}
                  className="h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fallback = e.currentTarget.parentElement?.querySelector(".footer-fallback") as HTMLElement;
                    if (fallback) fallback.style.display = "flex";
                  }}
                />
                <div className="footer-fallback hidden items-center gap-1 font-bold text-xl tracking-tight text-foreground">
                  <span>Car<span className="gradient-text">Hat</span>.bd</span>
                </div>
              </div>
            </Link>
            
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
              {settings.tagline ||
                "The premier destination to buy, sell, and explore the best cars in Bangladesh."}
            </p>

            {/* Social Links */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              {socialLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-9 h-9 rounded-xl bg-muted/80 hover:bg-muted border border-border flex items-center justify-center text-muted-foreground transition-all duration-200 hover:scale-110 shadow-sm ${item.color}`}
                  title={item.name}
                >
                  <item.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-2">
            <h3 className="font-bold mb-4 text-foreground text-sm uppercase tracking-wider">
              Explore
            </h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link href="/cars" className="hover:text-primary transition-colors">
                  Buy a Car
                </Link>
              </li>
              <li>
                <Link href="/sell" className="hover:text-primary transition-colors">
                  Sell your Car
                </Link>
              </li>
              <li>
                <Link href="/dealers" className="hover:text-primary transition-colors">
                  Find Dealers
                </Link>
              </li>
              <li>
                <Link href="/reviews" className="hover:text-primary transition-colors">
                  Car Reviews
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-primary transition-colors">
                  Automotive Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="md:col-span-2">
            <h3 className="font-bold mb-4 text-foreground text-sm uppercase tracking-wider">
              Support
            </h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link href="/faq" className="hover:text-primary transition-colors">
                  FAQ & Help
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Real-time Contact Information */}
          <div className="md:col-span-4">
            <h3 className="font-bold mb-4 text-foreground text-sm uppercase tracking-wider">
              Contact Us
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {settings.address && (
                <li className="flex items-start gap-2.5">
                  <MapPin size={17} className="text-primary flex-shrink-0 mt-0.5" />
                  <span>{settings.address}</span>
                </li>
              )}
              {settings.contactEmail && (
                <li className="flex items-center gap-2.5">
                  <Mail size={17} className="text-primary flex-shrink-0" />
                  <a
                    href={`mailto:${settings.contactEmail}`}
                    className="hover:text-primary transition-colors"
                  >
                    {settings.contactEmail}
                  </a>
                </li>
              )}
              {settings.supportPhone && (
                <li className="flex items-center gap-2.5">
                  <Phone size={17} className="text-primary flex-shrink-0" />
                  <a
                    href={`tel:${settings.supportPhone}`}
                    className="hover:text-primary transition-colors"
                  >
                    {settings.supportPhone}
                  </a>
                </li>
              )}
              {settings.workingHours && (
                <li className="flex items-center gap-2.5">
                  <Clock size={17} className="text-primary flex-shrink-0" />
                  <span>{settings.workingHours}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
          <p>
            &copy; {new Date().getFullYear()}{" "}
            {settings.copyrightText || "CarHat.bd. All rights reserved."}
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <Link href="/contact" className="hover:text-primary transition-colors">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
