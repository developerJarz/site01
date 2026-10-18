"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, ExternalLink, Loader2, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { Button } from "@/components/ui/button";
import { Alert, CONTAINER, PageHero } from "@/components/ui/page";
import { CONTACT_TOPICS, TOPIC_LABEL, type ContactTopic } from "@/lib/contact-request";
import { cn } from "@/lib/utils";

export function ContactForm() {
  return (
    <Suspense fallback={null}>
      <Contact />
    </Suspense>
  );
}

function Contact() {
  const { settings } = useSiteSettings();
  const params = useSearchParams();
  const initialTopic = (CONTACT_TOPICS as readonly string[]).includes(params.get("topic") || "") ? (params.get("topic") as ContactTopic) : "general";
  const listing = (params.get("listing") || "").slice(0, 200);
  const [form, setForm] = useState({ name: "", email: "", phone: "", topic: initialTopic, message: "", website: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  const whatsapp = settings.socialLinks?.whatsapp?.replace(/[^0-9]/g, "");
  const channels = [
    settings.supportPhone && { icon: Phone, label: "Call us", value: settings.supportPhone, href: `tel:${settings.supportPhone.replace(/\s/g, "")}` },
    whatsapp && { icon: MessageCircle, label: "WhatsApp", value: settings.socialLinks.whatsapp, href: `https://wa.me/${whatsapp}` },
    settings.contactEmail && { icon: Mail, label: "Email", value: settings.contactEmail, href: `mailto:${settings.contactEmail}` },
    settings.workingHours && { icon: Clock, label: "Hours", value: settings.workingHours },
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href?: string }[];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, listing }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't send your message.");
      setState("sent");
    } catch (err) {
      setError((err as Error).message);
      setState("idle");
    }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title={<>We&apos;re here to <span className="text-gradient-electric">help</span></>}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Contact" }]}
        description="Questions about buying, selling, a listing or a dealer partnership? Our team in Dhaka usually replies the same working day."
      />

      <div className={cn(CONTAINER, "grid gap-8 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_24rem]")}>
        <section aria-labelledby="form-heading" className="rounded-3xl border border-hairline bg-white p-6 shadow-soft md:p-9">
          {state === "sent" ? (
            <div className="flex flex-col items-center py-12 text-center" role="status">
              <span className="flex size-16 items-center justify-center rounded-full bg-verified-soft text-verified"><CheckCircle2 size={32} aria-hidden /></span>
              <h2 className="mt-5 text-2xl font-extrabold">Message received</h2>
              <p className="mt-2 max-w-sm text-slate-text">Thanks, {form.name.split(" ")[0]}. We&apos;ll reply to <strong className="text-night">{form.email}</strong> soon.</p>
              <Button variant="secondary" className="mt-6" onClick={() => { setForm((f) => ({ ...f, message: "" })); setState("idle"); }}>Send another message</Button>
            </div>
          ) : (
            <>
              <h2 id="form-heading" className="text-2xl font-extrabold">Send us a message</h2>
              {listing && form.topic === "report" && (
                <Alert tone="info" className="mt-4">You&apos;re reporting the listing <strong>{listing}</strong>. Tell us what looks wrong.</Alert>
              )}
              {error && <Alert className="mt-4">{error}</Alert>}
              <form onSubmit={submit} className="mt-6 grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="c-name" className="field-label">Your name</label>
                  <input id="c-name" className="field" value={form.name} onChange={set("name")} autoComplete="name" required minLength={2} maxLength={80} />
                </div>
                <div>
                  <label htmlFor="c-email" className="field-label">Email</label>
                  <input id="c-email" type="email" className="field" value={form.email} onChange={set("email")} autoComplete="email" required />
                </div>
                <div>
                  <label htmlFor="c-phone" className="field-label">Phone <span className="font-normal text-slate-text">(optional)</span></label>
                  <input id="c-phone" type="tel" className="field" value={form.phone} onChange={set("phone")} autoComplete="tel" maxLength={30} />
                </div>
                <div>
                  <label htmlFor="c-topic" className="field-label">Topic</label>
                  <select id="c-topic" className="field" value={form.topic} onChange={set("topic")}>
                    {CONTACT_TOPICS.map((t) => <option key={t} value={t}>{TOPIC_LABEL[t]}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="c-message" className="field-label">Message</label>
                  <textarea id="c-message" rows={6} className="field" value={form.message} onChange={set("message")} required minLength={10} maxLength={4000}
                    placeholder="How can we help?" />
                </div>
                {/* Honeypot: hidden from people, filled in by bots. */}
                <div className="hidden" aria-hidden>
                  <label htmlFor="c-website">Website</label>
                  <input id="c-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
                </div>
                <div className="md:col-span-2">
                  <Button type="submit" size="lg" disabled={state === "sending"} className="w-full sm:w-auto">
                    {state === "sending" ? <Loader2 size={17} className="animate-spin" aria-hidden /> : <Send size={17} aria-hidden />}
                    {state === "sending" ? "Sending…" : "Send message"}
                  </Button>
                </div>
              </form>
            </>
          )}
        </section>

        <aside className="space-y-4">
          <ul className="space-y-3">
            {channels.map(({ icon: Icon, label, value, href }) => {
              const body = (
                <>
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-haze text-electric"><Icon size={20} aria-hidden /></span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-slate-text">{label}</span>
                    <span className="block break-words font-bold text-night">{value}</span>
                  </span>
                </>
              );
              const cls = "flex items-center gap-4 rounded-3xl border border-hairline bg-white p-4 shadow-soft";
              return (
                <li key={label}>
                  {href ? (
                    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className={cn(cls, "transition-[border-color,box-shadow] hover:border-electric/30 hover:shadow-float")}>{body}</a>
                  ) : <div className={cls}>{body}</div>}
                </li>
              );
            })}
          </ul>
          {settings.address && (
            <div className="rounded-3xl border border-hairline bg-mist p-5">
              <p className="flex items-start gap-2.5 text-sm font-semibold text-night"><MapPin size={18} className="mt-0.5 shrink-0 text-electric" aria-hidden /> {settings.address}</p>
              <a href={settings.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(settings.address)}`} target="_blank" rel="noopener noreferrer"
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-hairline bg-white text-sm font-semibold hover:border-electric/40 hover:text-electric">
                <ExternalLink size={16} aria-hidden /> Open in Google Maps
              </a>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
