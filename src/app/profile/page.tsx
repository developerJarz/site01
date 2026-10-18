"use client";

import { useEffect, useState } from "react";
import { PageLoader } from "@/components/ui/brand-loader";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { BadgeCheck, CalendarDays, Camera, CheckCircle2, KeyRound, LayoutDashboard, Loader2, MessageCircle, Phone, RotateCcw, Save, Store, UserRound } from "lucide-react";
import { ProfilePhotoUpload } from "@/components/ProfilePhotoUpload";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Alert, CONTAINER, PageHero } from "@/components/ui/page";
import { cn } from "@/lib/utils";
import { ContactNumberFields } from "@/components/ContactNumberFields";
import { formatPhoneNumber, localPhoneNumber, normalisePhoneNumber, usesPhoneForWhatsApp } from "@/lib/contact-details";
import { parseProfileUpdates, profileCompletion } from "@/lib/profile";

interface Profile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
  bio?: string;
  address?: string;
  city?: string;
  dealershipName?: string;
  dealershipLicense?: string;
  isVerified: boolean;
  whatsappNumber?: string;
  whatsappSameAsPhone?: boolean;
  allowPhoneDisplay?: boolean;
  allowWhatsApp?: boolean;
  createdAt: string;
  hasPassword?: boolean;
}

const EMPTY = {
  name: "", phone: "", bio: "", address: "", city: "", dealershipName: "", dealershipLicense: "",
  whatsappNumber: "", whatsappSameAsPhone: true, allowPhoneDisplay: true, allowWhatsApp: true,
};

function formFromProfile(user: Profile) {
  return {
    name: user.name || "", phone: localPhoneNumber(user.phone), bio: user.bio || "", address: user.address || "", city: user.city || "",
    dealershipName: user.dealershipName || "", dealershipLicense: user.dealershipLicense || "",
    whatsappNumber: localPhoneNumber(user.whatsappNumber), whatsappSameAsPhone: usesPhoneForWhatsApp(user),
    allowPhoneDisplay: user.allowPhoneDisplay ?? true, allowWhatsApp: user.allowWhatsApp ?? true,
  };
}

export default function ProfilePage() {
  const { status, update } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [loadError, setLoadError] = useState("");
  const [retry, setRetry] = useState(0);

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?callbackUrl=%2Fprofile");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const controller = new AbortController();
    setLoadError("");
    fetch("/api/user/profile", { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.user) throw new Error(data.error || "Couldn't load your profile.");
        return data;
      })
      .then((data) => {
        const u: Profile = data.user;
        setProfile(u);
        setForm(formFromProfile(u));
      }).catch((error) => { if (!controller.signal.aborted) setLoadError(error.message || "Couldn't load your profile. Try again."); });
    return () => controller.abort();
  }, [status, retry]);

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setMessage(null); setForm((f) => ({ ...f, [k]: e.target.value })); };
  const dirty = profile ? JSON.stringify(form) !== JSON.stringify(formFromProfile(profile)) : false;

  // Warn before leaving the page with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseProfileUpdates(form, profile || {});
    if (!parsed.ok) return setMessage({ tone: "error", text: parsed.error });
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.value),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't save your profile.");
      setProfile(data.user);
      setForm(formFromProfile(data.user));
      setMessage({ tone: "success", text: "Profile saved." });
      void update().catch(() => {});
    } catch (err) {
      setMessage({ tone: "error", text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMessage(null);
    if (pw.next.length < 8) return setPwMessage({ tone: "error", text: "Use at least 8 characters for your new password." });
    if (pw.next !== pw.confirm) return setPwMessage({ tone: "error", text: "The new passwords don't match." });
    setPwSaving(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't change your password.");
      setPw({ current: "", next: "", confirm: "" });
      setPwMessage({ tone: "success", text: "Password changed." });
    } catch (err) {
      setPwMessage({ tone: "error", text: (err as Error).message });
    } finally {
      setPwSaving(false);
    }
  };

  if (!profile) {
    if (loadError) return <div className={cn(CONTAINER, "max-w-xl py-14")}><Alert>{loadError}</Alert><Button onClick={() => setRetry((current) => current + 1)} variant="secondary" className="mt-4"><RotateCcw size={16} aria-hidden /> Try again</Button></div>;
    return <PageLoader />;
  }

  const isDealer = profile.role === "dealer";
  const completion = profileCompletion(profile);
  const originalForm = formFromProfile(profile);
  // Accounts without numbers (Auth0 sign-ups, older accounts) see the contact card first.
  const needsNumbers = !normalisePhoneNumber(profile.phone);
  const hasPhone = Boolean(normalisePhoneNumber(form.phone));
  const hasWhatsApp = Boolean(normalisePhoneNumber(form.whatsappSameAsPhone ? form.phone : form.whatsappNumber));

  const personalCard = (
    <Card icon={UserRound} title="Personal details" description="Shown to buyers on your listings.">
      <div className="grid gap-5 md:grid-cols-2">
        <Field id="p-name" label="Full name"><input id="p-name" className="field" value={form.name} onChange={set("name")} autoComplete="name" maxLength={80} required /></Field>
        <Field id="p-email" label="Sign-in email"><input id="p-email" type="email" className="field bg-mist text-slate-text" value={profile.email} readOnly autoComplete="email" /></Field>
        <Field id="p-city" label="City"><input id="p-city" className="field" value={form.city} onChange={set("city")} placeholder="e.g. Dhaka" autoComplete="address-level2" maxLength={80} /></Field>
        <Field id="p-address" label="Address"><input id="p-address" className="field" value={form.address} onChange={set("address")} placeholder="e.g. House 12, Road 5, Gulshan-1" autoComplete="street-address" maxLength={200} /></Field>
        <Field id="p-bio" label="About you" className="md:col-span-2">
          <textarea id="p-bio" className="field" rows={3} value={form.bio} onChange={set("bio")} maxLength={500} placeholder="A line or two buyers will see, e.g. how long you've owned the car." />
        </Field>
      </div>
    </Card>
  );

  const contactCard = (
    <Card id="contact-details" icon={Phone} title="Contact and privacy"
      description={needsNumbers ? "Add the numbers buyers can reach you on. Every listing you post uses them." : "Saved from your signup. Changes here update all your listings straight away."}>
      <ContactNumberFields idPrefix="p" value={form} disabled={saving} onChange={(contact) => { setMessage(null); setForm((current) => ({ ...current, ...contact })); }} />
      <div className="mt-5 divide-y divide-hairline rounded-2xl border border-hairline">
        <Toggle icon={Phone} label="Show my phone number" hint={hasPhone ? "Buyers can tap to reveal and call you." : "Add a phone number to turn this on."}
          checked={hasPhone && form.allowPhoneDisplay} disabled={!hasPhone} onChange={(v) => { setMessage(null); setForm((f) => ({ ...f, allowPhoneDisplay: v })); }} />
        <Toggle icon={MessageCircle} label="Show a WhatsApp button" hint={hasWhatsApp ? "Opens a chat with the car's name filled in." : "Add a WhatsApp number to turn this on."}
          checked={hasWhatsApp && form.allowWhatsApp} disabled={!hasWhatsApp} onChange={(v) => { setMessage(null); setForm((f) => ({ ...f, allowWhatsApp: v })); }} />
      </div>
    </Card>
  );

  return (
    <>
      <PageHero
        eyebrow="Account"
        title="Profile and settings"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Dashboard", href: "/dashboard" }, { label: "Profile" }]}
        description={<p>{profile.email}</p>}
        actions={<Button asChild variant="secondary"><Link href="/dashboard"><LayoutDashboard size={16} aria-hidden /> My dashboard</Link></Button>}
      />

      <div className={cn(CONTAINER, "grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_20rem]")}>
        <div className="min-w-0 space-y-6">
          <section aria-labelledby="profile-completion-heading" className="rounded-3xl border border-electric/15 bg-haze/60 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 id="profile-completion-heading" className="font-bold text-night">{completion.percentage === 100 ? "Your profile is complete" : "Make your profile ready for buyers"}</h2>
              <span className="shrink-0 text-lg font-extrabold text-electric">{completion.percentage}%</span>
            </div>
            <div role="progressbar" aria-label="Profile completeness" aria-valuenow={completion.percentage} aria-valuemin={0} aria-valuemax={100} className="mt-3 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-electric transition-[width] motion-reduce:transition-none" style={{ width: `${completion.percentage}%` }} /></div>
            <p className="mt-3 text-sm text-slate-text">{completion.completed} of {completion.total} details added.{completion.missing.length > 0 && ` Still to add: ${completion.missing.join(", ")}.`}</p>
            {(!normalisePhoneNumber(profile.phone) || !normalisePhoneNumber(profile.whatsappNumber)) && <a href="#contact-details" className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-electric">Add your contact numbers</a>}
          </section>
          <Card icon={Camera} title="Profile photo" description="Help buyers recognise you. Your photo saves separately from your other details.">
            <ProfilePhotoUpload avatar={profile.avatar} name={profile.name} onChange={(avatar) => {
              setProfile((current) => current ? { ...current, avatar } : current);
              void update().catch(() => {});
            }} />
          </Card>
          <form onSubmit={save} className="space-y-6">
            {needsNumbers ? <>{contactCard}{personalCard}</> : <>{personalCard}{contactCard}</>}

            {isDealer && (
              <Card icon={Store} title="Dealership" description="Your showroom name replaces your own on listings.">
                <div className="grid gap-5 md:grid-cols-2">
                  <Field id="p-dealer" label="Dealership name"><input id="p-dealer" className="field" value={form.dealershipName} onChange={set("dealershipName")} placeholder="e.g. Dhaka Car Hub" /></Field>
                  <Field id="p-license" label="Trade licence number"><input id="p-license" className="field" value={form.dealershipLicense} onChange={set("dealershipLicense")} placeholder="e.g. TRAD/DNCC/012345" /></Field>
                </div>
              </Card>
            )}

            <div className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] z-20 flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-hairline bg-white/95 p-4 shadow-soft backdrop-blur md:bottom-5">
              {message ? <Alert tone={message.tone} className="basis-full">{message.text}</Alert> : <p className="mr-auto flex items-center gap-2 text-sm text-slate-text">{!dirty && <CheckCircle2 size={16} className="text-verified" aria-hidden />}{dirty ? "You have unsaved changes" : "Your details are up to date"}</p>}
              {dirty && <Button type="button" variant="ghost" disabled={saving} onClick={() => { setForm(originalForm); setMessage(null); }}>Reset</Button>}
              <Button type="submit" size="lg" disabled={saving || !dirty}>
                {saving ? <Loader2 size={17} className="animate-spin" aria-hidden /> : <Save size={17} aria-hidden />} Save changes
              </Button>
            </div>
          </form>

          {profile.hasPassword === false ? (
            <Card icon={KeyRound} title="Password" description="Your account signs in with Auth0.">
              <p className="text-sm text-slate-text">There&apos;s no CarHat password to change. To reset it, use &ldquo;Forgot password&rdquo; on the Auth0 sign-in screen.</p>
            </Card>
          ) : <form onSubmit={changePassword}>
            <Card icon={KeyRound} title="Password" description="Use at least 8 characters.">
              <div className="grid gap-5 md:grid-cols-3">
                <Field id="pw-current" label="Current password"><input id="pw-current" type="password" className="field" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" required /></Field>
                <Field id="pw-new" label="New password"><input id="pw-new" type="password" className="field" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" minLength={8} required /></Field>
                <Field id="pw-confirm" label="Repeat new password"><input id="pw-confirm" type="password" className="field" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" required /></Field>
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
                {pwMessage && <Alert tone={pwMessage.tone} className="grow">{pwMessage.text}</Alert>}
                <Button type="submit" variant="secondary" disabled={pwSaving || !pw.current || !pw.next}>
                  {pwSaving && <Loader2 size={16} className="animate-spin" aria-hidden />} Change password
                </Button>
              </div>
            </Card>
          </form>}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-hairline bg-white p-6 text-center shadow-soft">
            <UserAvatar src={profile.avatar} name={profile.name} className="rounded-3xl text-3xl shadow-glow" />
            <p className="mt-4 flex items-center justify-center gap-1.5 text-lg font-extrabold">
              {isDealer && profile.dealershipName ? profile.dealershipName : profile.name}
              {profile.isVerified && <BadgeCheck size={18} className="text-electric" aria-label="Verified" />}
            </p>
            <p className="text-sm capitalize text-slate-text">{profile.role} account</p>
            <dl className="mt-5 space-y-2.5 border-t border-hairline pt-5 text-left text-sm">
              <div className="flex flex-wrap justify-between gap-2"><dt className="text-slate-text">Phone</dt><dd className="font-semibold tabular">{normalisePhoneNumber(profile.phone) ? formatPhoneNumber(profile.phone) : <a href="#contact-details" className="text-electric">Add</a>}</dd></div>
              <div className="flex flex-wrap justify-between gap-2"><dt className="text-slate-text">WhatsApp</dt><dd className="font-semibold tabular">{normalisePhoneNumber(profile.whatsappNumber) ? (usesPhoneForWhatsApp(profile) ? "Same as phone" : formatPhoneNumber(profile.whatsappNumber)) : <a href="#contact-details" className="text-electric">Add</a>}</dd></div>
              <div className="flex flex-wrap justify-between gap-2"><dt className="text-slate-text">Buyers see</dt><dd className="font-semibold">{[profile.allowPhoneDisplay !== false && normalisePhoneNumber(profile.phone) && "Phone", profile.allowWhatsApp !== false && normalisePhoneNumber(profile.whatsappNumber) && "WhatsApp", "Chat"].filter(Boolean).join(", ")}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-text">Member since</dt><dd className="font-semibold">{new Date(profile.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-text">Verification</dt><dd className={cn("font-semibold", profile.isVerified ? "text-verified" : "text-warning")}>{profile.isVerified ? "Verified" : "Not yet"}</dd></div>
            </dl>
          </div>
          <div className="rounded-3xl border border-hairline bg-mist p-6 text-sm text-slate-text">
            <CalendarDays size={20} className="text-electric" aria-hidden />
            <p className="mt-3"><strong className="text-night">Want the verified tick?</strong> Complete your profile and post a car with its papers. Our team verifies active sellers and dealers.</p>
          </div>
        </aside>
      </div>
    </>
  );
}

function Card({ id, icon: Icon, title, description, children }: { id?: string; icon: typeof Phone; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-3xl border border-hairline bg-white p-6 shadow-soft md:p-7">
      <div className="mb-6 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-haze text-electric"><Icon size={19} aria-hidden /></span>
        <div>
          <h2 className="text-lg font-extrabold">{title}</h2>
          {description && <p className="text-sm text-slate-text">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({ id, label, className, children }: { id: string; label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ icon: Icon, label, hint, checked, disabled, onChange }: { icon: typeof Phone; label: string; hint: string; checked: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-mist/60 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent">
      <Icon size={18} className="shrink-0 text-electric" aria-hidden />
      <span className="grow">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-[13px] text-slate-text">{hint}</span>
      </span>
      <span className={cn("relative h-6 w-10 shrink-0 rounded-full transition-colors", checked ? "bg-electric" : "bg-[#cbd5e1]")}>
        <span className={cn("absolute left-1 top-1 size-4 rounded-full bg-white shadow transition-transform", checked && "translate-x-4")} />
      </span>
    </button>
  );
}
