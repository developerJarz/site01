"use client";

import { useProgressRouter } from "@/components/layout/RouteProgress";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AuthShell, PasswordField } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/page";

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

export default function ForgotPasswordPage() {
  const router = useProgressRouter();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await post("/api/auth/forgot-password", { email });
      setStep("reset");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const reset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("The passwords don't match.");
    setLoading(true);
    try {
      await post("/api/auth/reset-password", { email, otpCode: code, newPassword: password });
      router.push("/login?reset=true");
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={step === "email" ? "Reset your password" : "Choose a new password"}
      description={step === "email"
        ? "Enter your account email and we'll send you a 6-digit code."
        : <>If <strong className="text-night">{email}</strong> has an account, a code is on its way. It expires in 5 minutes.</>}
      footer={<Link href="/login" className="inline-flex items-center gap-1 font-bold text-electric hover:underline"><ArrowLeft size={15} aria-hidden /> Back to sign in</Link>}
    >
      {error && <Alert className="mb-5">{error}</Alert>}
      {step === "email" ? (
        <form onSubmit={requestCode} className="space-y-4">
          <div>
            <label htmlFor="fp-email" className="field-label">Email</label>
            <input id="fp-email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required placeholder="you@example.com" />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 size={18} className="animate-spin" aria-hidden />} {loading ? "Sending…" : "Send reset code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={reset} className="space-y-4">
          <div>
            <label htmlFor="fp-code" className="field-label">6-digit code</label>
            <input id="fp-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="field h-14 text-center font-mono text-2xl tracking-[0.6em]"
              value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} required autoFocus />
          </div>
          <PasswordField id="fp-new" label="New password" value={password} onChange={setPassword} autoComplete="new-password" minLength={8} hint="At least 8 characters." />
          <PasswordField id="fp-confirm" label="Repeat new password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
          <Button type="submit" size="lg" className="w-full" disabled={loading || code.length !== 6}>
            {loading && <Loader2 size={18} className="animate-spin" aria-hidden />} {loading ? "Saving…" : "Set new password"}
          </Button>
          <button type="button" onClick={() => { setStep("email"); setError(""); }} className="w-full text-sm font-semibold text-slate-text hover:text-night">
            Use a different email
          </button>
        </form>
      )}
    </AuthShell>
  );
}
