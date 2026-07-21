"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Car, Mail, KeyRound, Lock, ArrowLeft, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

type Step = "email" | "reset" | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");

  // Step 1 — email
  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Step 2 — OTP + new password
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");

  // ── Step 1: Request OTP ──────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setEmailLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEmailError(data.error || "Something went wrong. Please try again.");
      } else {
        setStep("reset");
      }
    } catch {
      setEmailError("Network error. Please check your connection and try again.");
    }

    setEmailLoading(false);
  };

  // ── Step 2: Reset password ───────────────────────────────────────────────
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");

    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setResetError("Password must be at least 8 characters.");
      return;
    }

    setResetLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otpCode, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResetError(data.error || "Something went wrong. Please try again.");
      } else {
        setStep("done");
      }
    } catch {
      setResetError("Network error. Please check your connection and try again.");
    }

    setResetLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-muted/30 px-4 py-12">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-xl">

        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <Car className="h-12 w-12 text-primary mb-2" />
          <h1 className="text-2xl font-bold text-foreground">
            {step === "email" && "Forgot Password"}
            {step === "reset" && "Reset Password"}
            {step === "done" && "Password Reset!"}
          </h1>
          <p className="text-muted-foreground text-sm text-center mt-1">
            {step === "email" && "Enter your email and we'll send you a reset code."}
            {step === "reset" && `Enter the 6-digit code sent to ${email} and choose a new password.`}
            {step === "done" && "Your password has been changed successfully."}
          </p>
        </div>

        {/* ── Step 1: Email form ── */}
        {step === "email" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            {emailError && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20 flex items-center gap-2">
                <AlertCircle size={16} />
                {emailError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  id="forgot-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <button
              id="send-reset-code-btn"
              type="submit"
              disabled={emailLoading}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {emailLoading ? <Loader2 size={18} className="animate-spin" /> : null}
              {emailLoading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>
        )}

        {/* ── Step 2: OTP + new password form ── */}
        {step === "reset" && (
          <form onSubmit={handleReset} className="space-y-4">
            {resetError && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20 flex items-center gap-2">
                <AlertCircle size={16} />
                {resetError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                6-Digit Reset Code
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  id="otp-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary tracking-widest text-center text-lg font-mono"
                  placeholder="000000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  id="new-password-input"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Minimum 8 characters"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  id="confirm-password-input"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Re-enter new password"
                />
              </div>
            </div>

            <button
              id="reset-password-btn"
              type="submit"
              disabled={resetLoading}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {resetLoading ? <Loader2 size={18} className="animate-spin" /> : null}
              {resetLoading ? "Resetting..." : "Reset Password"}
            </button>

            <button
              type="button"
              onClick={() => { setStep("email"); setResetError(""); }}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1 mt-1"
            >
              <ArrowLeft size={14} />
              Use a different email
            </button>
          </form>
        )}

        {/* ── Step 3: Done ── */}
        {step === "done" && (
          <div className="flex flex-col items-center gap-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-full p-4">
              <CheckCircle2 className="text-green-500" size={40} />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Your password has been reset. You can now sign in with your new password.
            </p>
            <button
              id="go-to-login-btn"
              onClick={() => router.push("/login")}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              Go to Sign In
            </button>
          </div>
        )}

        {/* Footer link */}
        {step !== "done" && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
