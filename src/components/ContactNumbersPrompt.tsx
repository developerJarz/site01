"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/page";
import { cn } from "@/lib/utils";
import { ContactNumberFields, type ContactForm } from "@/components/ContactNumberFields";
import { localPhoneNumber, normalisePhoneNumber, parseContactDetails, usesPhoneForWhatsApp } from "@/lib/contact-details";

type Stored = { phone?: string; whatsappNumber?: string; whatsappSameAsPhone?: boolean };

/**
 * Asks for the account's phone and WhatsApp numbers when the profile has none (Auth0 sign-ups and
 * older accounts) and saves them to the profile, which every listing reads its contact details from.
 * Renders nothing once a phone number is on file.
 */
export function ContactNumbersPrompt({ title = "Add your contact numbers", description, className }: { title?: string; description?: string; className?: string }) {
  const [state, setState] = useState<"loading" | "missing" | "saved" | "hidden">("loading");
  const [form, setForm] = useState<ContactForm>({ phone: "", whatsappNumber: "", whatsappSameAsPhone: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/user/profile", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const user: Stored | undefined = data?.user;
        if (!user || normalisePhoneNumber(user.phone)) return setState("hidden");
        setForm({ phone: "", whatsappNumber: localPhoneNumber(user.whatsappNumber), whatsappSameAsPhone: usesPhoneForWhatsApp(user) });
        setState("missing");
      })
      .catch(() => { if (!controller.signal.aborted) setState("hidden"); });
    return () => controller.abort();
  }, []);

  if (state === "loading" || state === "hidden") return null;

  if (state === "saved") {
    return (
      <div role="status" className={cn("flex items-center gap-3 rounded-3xl border border-verified/25 bg-verified/5 p-4 text-sm font-semibold text-night", className)}>
        <CheckCircle2 size={18} className="shrink-0 text-verified" aria-hidden /> Saved to your profile. Buyers can now call or WhatsApp you from your listings.
      </div>
    );
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const contact = parseContactDetails(form);
    if (!contact.ok) return setError(contact.error);
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contact.value),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Couldn't save your numbers.");
      setState("saved");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className={cn("rounded-3xl border border-electric/20 bg-haze/60 p-5 sm:p-6", className)}>
      <div className="mb-4 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-electric"><Phone size={19} aria-hidden /></span>
        <div>
          <h2 className="font-bold text-night">{title}</h2>
          <p className="text-sm text-slate-text">{description || "Buyers can call or WhatsApp you straight from your listings. The numbers are saved to your profile, where you can change them or hide them."}</p>
        </div>
      </div>
      {error && <Alert className="mb-4">{error}</Alert>}
      <ContactNumberFields idPrefix="prompt" value={form} required disabled={saving} onChange={(contact) => { setError(""); setForm(contact); }} />
      <div className="mt-4 flex justify-end">
        <Button type="submit" disabled={saving || !form.phone}>
          {saving && <Loader2 size={16} className="animate-spin" aria-hidden />} Save numbers
        </Button>
      </div>
    </form>
  );
}
