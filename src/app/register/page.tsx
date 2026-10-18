"use client";

import { useProgressRouter } from "@/components/layout/RouteProgress";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Car, Loader2, Store, Tag } from "lucide-react";
import { AuthShell, PasswordField } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/page";
import { cn } from "@/lib/utils";
import { ContactNumberFields } from "@/components/ContactNumberFields";
import { parseSignup } from "@/lib/signup";

const ROLES = [
  { value: "buyer", label: "Buy a car", icon: Car },
  { value: "seller", label: "Sell my car", icon: Tag },
  { value: "dealer", label: "I'm a dealer", icon: Store },
] as const;
const CODE_SECONDS = 300;

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

export default function RegisterPage() {
  const router = useProgressRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "buyer", phone: "", whatsappNumber: "", whatsappSameAsPhone: true });
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(CODE_SECONDS);

  useEffect(() => {
    if (step !== 2 || timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, timeLeft]);

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    const signup = parseSignup(form);
    if (!signup.ok) { setError(signup.error); return; }
    setLoading(true);
    try {
      await post("/api/auth/register", signup.value);
      setStep(2);
      setCode("");
      setTimeLeft(CODE_SECONDS);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await post("/api/auth/verify-otp", { ...form, otpCode: code });
      router.push("/login?registered=true");
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  const mm = Math.floor(timeLeft / 60), ss = String(timeLeft % 60).padStart(2, "0");

  return (
    <AuthShell
      title={step === 1 ? "Create your account" : "Check your email"}
      description={step === 1 ? "Free, and takes under a minute." : <>We sent a 6-digit code to <strong className="text-night">{form.email}</strong>.</>}
      footer={<>Already have an account? <Link href="/login" className="font-bold text-electric hover:underline">Sign in</Link></>}
    >
      {error && <Alert className="mb-5">{error}</Alert>}

      {step === 1 ? (
        <form onSubmit={sendCode} className="space-y-4">
          <fieldset>
            <legend className="field-label">I want to</legend>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map(({ value, label, icon: Icon }) => (
                <label key={value} className={cn("flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center text-[13px] font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-electric",
                  form.role === value ? "border-electric bg-haze text-electric-deep" : "border-hairline text-slate-text hover:border-electric/40")}>
                  <input type="radio" name="role" value={value} checked={form.role === value} onChange={() => setForm({ ...form, role: value })} className="sr-only" />
                  <Icon size={20} aria-hidden /> {label}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="reg-name" className="field-label">Full name</label>
            <input id="reg-name" className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" required minLength={2} maxLength={80} />
          </div>
          <div>
            <label htmlFor="reg-email" className="field-label">Email</label>
            <input id="reg-email" type="email" className="field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" required placeholder="you@example.com" />
          </div>
          <PasswordField id="reg-password" label="Password" value={form.password} onChange={(password) => setForm({ ...form, password })}
            autoComplete="new-password" minLength={8} hint="At least 8 characters." />
          <fieldset className="space-y-3 border-t border-hairline pt-4" disabled={loading}>
            <legend className="sr-only">Contact numbers</legend>
            <ContactNumberFields idPrefix="reg" value={form} required disabled={loading} onChange={(contact) => setForm((current) => ({ ...current, ...contact }))} />
            <p className="text-xs leading-relaxed text-slate-text">These numbers are saved to your profile. You can edit them and choose what buyers see in your contact settings.</p>
          </fieldset>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 size={18} className="animate-spin" aria-hidden />}
            {loading ? "Sending code…" : "Continue"}
          </Button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-4">
          <div className="rounded-2xl border border-hairline bg-mist px-4 py-3 text-sm text-slate-text">
            <p className="font-semibold text-night">Your contact details are ready</p>
            <p className="mt-1">They will be added to your profile when you verify your email.</p>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="reg-code" className="field-label">6-digit code</label>
              <span className={cn("text-xs font-bold tabular", timeLeft < 60 ? "text-destructive" : "text-electric")} aria-live="polite">
                {timeLeft > 0 ? `Expires in ${mm}:${ss}` : "Code expired"}
              </span>
            </div>
            <input id="reg-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="field h-14 text-center font-mono text-2xl tracking-[0.6em]"
              value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} disabled={timeLeft <= 0} required autoFocus />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={loading || timeLeft <= 0 || code.length !== 6}>
            {loading && <Loader2 size={18} className="animate-spin" aria-hidden />}
            {loading ? "Verifying…" : "Verify and create account"}
          </Button>
          <div className="flex items-center justify-between text-sm">
            <button type="button" onClick={() => { setStep(1); setError(""); }} className="inline-flex items-center gap-1 font-semibold text-slate-text hover:text-night">
              <ArrowLeft size={15} aria-hidden /> Change details
            </button>
            <button type="button" onClick={() => sendCode()} disabled={loading || timeLeft > CODE_SECONDS - 45} className="font-semibold text-electric hover:underline disabled:text-slate-text disabled:no-underline">
              Send a new code
            </button>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
