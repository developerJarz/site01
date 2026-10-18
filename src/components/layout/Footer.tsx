"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, Loader2, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { FacebookIcon, InstagramIcon, LinkedinIcon, TwitterIcon, YoutubeIcon } from "./SocialIcons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Footer() {
  const pathname = usePathname() || "/";
  // The admin area has its own shell.
  if (pathname.startsWith("/admin")) return null;
  return <SiteFooter />;
}

function SiteFooter() {
  const { settings } = useSiteSettings();
  // Link columns, the bottom line and the newsletter box come from Admin → Appearance → Footer.
  const footer = settings.appearance.footer;
  const social = [
    { name: "Facebook", icon: FacebookIcon, href: settings.socialLinks?.facebook },
    { name: "X (Twitter)", icon: TwitterIcon, href: settings.socialLinks?.twitter },
    { name: "Instagram", icon: InstagramIcon, href: settings.socialLinks?.instagram },
    { name: "YouTube", icon: YoutubeIcon, href: settings.socialLinks?.youtube },
    { name: "LinkedIn", icon: LinkedinIcon, href: settings.socialLinks?.linkedin },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      href: settings.socialLinks?.whatsapp ? `https://wa.me/${settings.socialLinks.whatsapp.replace(/[^0-9]/g, "")}` : "",
    },
  ].filter((item) => item.href?.trim());

  return (
    <footer className="border-t border-hairline bg-mist pb-[calc(76px+env(safe-area-inset-bottom))] md:pb-0">
      <div className="mx-auto max-w-[1320px] px-4 pt-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link href="/" className="inline-flex">
              <Image src={settings.logoUrl || "/car-hat-bd.png"} alt={settings.siteName || "CarHat BD"} width={160} height={34} sizes="160px" className="h-9 w-auto" />
            </Link>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-slate-text">
              {settings.tagline || "Bangladesh's trusted marketplace for verified used cars, from trusted dealers and owners."}
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-text">
              {settings.supportPhone && (
                <li className="flex items-center gap-2.5"><Phone size={16} className="text-electric" aria-hidden />
                  <a href={`tel:${settings.supportPhone}`} className="hover:text-electric tabular">{settings.supportPhone}</a></li>
              )}
              {settings.contactEmail && (
                <li className="flex items-center gap-2.5"><Mail size={16} className="text-electric" aria-hidden />
                  <a href={`mailto:${settings.contactEmail}`} className="break-all hover:text-electric">{settings.contactEmail}</a></li>
              )}
              {settings.workingHours && <li className="flex items-start gap-2.5"><Clock size={16} className="mt-0.5 text-electric" aria-hidden />{settings.workingHours}</li>}
              {settings.address && <li className="flex items-start gap-2.5"><MapPin size={16} className="mt-0.5 shrink-0 text-electric" aria-hidden />{settings.address}</li>}
            </ul>
          </div>

          <div className={cn("grid grid-cols-2 gap-8 lg:col-span-5", footer.columns.length >= 3 && "sm:grid-cols-3", footer.columns.length >= 4 && "lg:grid-cols-4")}>
            {footer.columns.map((col) => (
              <div key={col.title}>
                <h2 className="text-sm font-bold text-night">{col.title}</h2>
                <ul className="mt-4 space-y-3 text-sm">
                  {col.links.map((l) => (
                    <li key={l.label + l.href}>
                      <Link href={l.href} {...(/^https?:\/\//.test(l.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="text-slate-text transition-colors hover:text-electric">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="lg:col-span-3">
            {footer.showNewsletter && (
              <>
                <h2 className="text-sm font-bold text-night">Newsletter</h2>
                <p className="mt-4 text-sm leading-relaxed text-slate-text">{footer.newsletterText}</p>
                <NewsletterForm />
              </>
            )}
            {social.length > 0 && (
              <>
                <h2 className={cn("text-sm font-bold text-night", footer.showNewsletter && "mt-8")}>Follow us</h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {social.map((item) => (
                    <li key={item.name}>
                      <a href={item.href} target="_blank" rel="noopener noreferrer" aria-label={item.name}
                        className="flex size-11 items-center justify-center rounded-xl border border-hairline bg-white text-slate-text shadow-soft transition-all hover:-translate-y-0.5 hover:border-electric/30 hover:text-electric">
                        <item.icon className="size-[18px]" />
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-hairline py-6 text-sm text-slate-text sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} {settings.copyrightText || "CarHat BD. All rights reserved."}</p>
          {footer.bottomNote && <p>{footer.bottomNote}</p>}
        </div>
      </div>
    </footer>
  );
}

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not subscribe right now.");
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not subscribe right now.");
      setState("idle");
    }
  };

  if (state === "done") {
    return (
      <p role="status" className="mt-4 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-verified shadow-soft">
        <CheckCircle2 size={18} aria-hidden /> You&apos;re subscribed.
      </p>
    );
  }
  return (
    <form onSubmit={submit} className="mt-4">
      <label htmlFor="newsletter-email" className="mb-1.5 block text-[13px] font-semibold text-night">Email address</label>
      <div className="flex gap-2 rounded-2xl border border-hairline bg-white p-1.5 shadow-soft focus-within:border-electric">
        <input id="newsletter-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com" className="min-w-0 grow bg-transparent px-2.5 text-base outline-none placeholder:text-slate-text/80"
          aria-invalid={!!error} aria-describedby={error ? "newsletter-error" : undefined} />
        <Button type="submit" size="sm" className="h-10" disabled={state === "sending"} aria-label="Subscribe">
          {state === "sending" ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <ArrowRight size={16} aria-hidden />}
        </Button>
      </div>
      {error && <p id="newsletter-error" role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
    </form>
  );
}
