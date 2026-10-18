"use client";

import { useProgressRouter } from "@/components/layout/RouteProgress";
import { Suspense, useEffect, useState } from "react";
import { PageLoader } from "@/components/ui/brand-loader";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getProviders, signIn } from "next-auth/react";
import { Loader2, ShieldCheck } from "lucide-react";
import { AuthShell, PasswordField } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/page";

const MESSAGES: Record<string, string> = {
  "Invalid credentials": "Enter your email and password.",
  "No user found": "That email or password isn't right.",
  "Invalid password": "That email or password isn't right.",
  "Account suspended": "This account has been suspended. Contact support if you think this is a mistake.",
  "Authentication failed": "Something went wrong on our side. Try again in a moment.",
  CredentialsSignin: "That email or password isn't right.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useProgressRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [hasAuth0, setHasAuth0] = useState(false);
  const registered = searchParams.get("registered") === "true";
  const reset = searchParams.get("reset") === "true";
  // Only follow same-site paths so the login page can't be used as an open redirect.
  const rawCallback = searchParams.get("callbackUrl") || "";
  const callbackUrl = rawCallback.startsWith("/") && !rawCallback.startsWith("//") ? rawCallback : "/dashboard";

  useEffect(() => {
    getProviders().then((p) => setHasAuth0(!!p?.auth0)).catch(() => {});
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", { email: email.toLowerCase().trim(), password, redirect: false });
      if (res?.ok && !res.error) {
        router.push(callbackUrl);
        router.refresh();
        return;
      }
      setError(MESSAGES[res?.error || ""] || "That email or password isn't right.");
    } catch {
      setError("Couldn't reach CarHat. Check your connection and try again.");
    }
    setLoading(false);
  };

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to message sellers, save cars and manage your listings."
      footer={<>New to CarHat? <Link href="/register" className="font-bold text-electric hover:underline">Create a free account</Link></>}
    >
      {registered && <Alert tone="success" className="mb-5">Your account is ready. Sign in to continue.</Alert>}
      {reset && <Alert tone="success" className="mb-5">Password changed. Sign in with your new password.</Alert>}
      {error && <Alert className="mb-5">{error}</Alert>}

      {hasAuth0 && (
        <>
          <Button type="button" variant="secondary" size="lg" className="w-full" disabled={ssoLoading || loading}
            onClick={() => { setSsoLoading(true); void signIn("auth0", { callbackUrl }); }}>
            {ssoLoading ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <ShieldCheck size={18} className="text-electric" aria-hidden />}
            {ssoLoading ? "Redirecting…" : "Continue with Google or Auth0"}
          </Button>
          <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-slate-text">
            <span className="h-px grow bg-hairline" /> or with email <span className="h-px grow bg-hairline" />
          </div>
        </>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="field-label">Email</label>
          <input id="login-email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required placeholder="you@example.com" />
        </div>
        <PasswordField id="login-password" label="Password" value={password} onChange={setPassword} autoComplete="current-password" />
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm font-semibold text-electric hover:underline">Forgot password?</Link>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading || ssoLoading}>
          {loading && <Loader2 size={18} className="animate-spin" aria-hidden />}
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}
