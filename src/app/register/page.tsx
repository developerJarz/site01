"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Car, Mail } from "lucide-react";
import axios from "axios";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "buyer",
  });
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // 5-minute countdown (300 seconds)
  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2 && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [step, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const res = await axios.post("/api/auth/register", formData);
      if (res.data.requiresOtp) {
        setStep(2);
        setTimeLeft(300); // Reset timer to 5 minutes
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (timeLeft <= 0) {
      setError("OTP has expired. Please refresh and try again.");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/auth/verify-otp", {
        ...formData,
        otpCode,
      });
      router.push("/login?registered=true");
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid OTP code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-muted/30 px-4 py-12">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-xl">
        <div className="flex flex-col items-center mb-8">
          {step === 1 ? (
            <Car className="h-12 w-12 text-primary mb-2" />
          ) : (
            <Mail className="h-12 w-12 text-primary mb-2" />
          )}
          <h1 className="text-2xl font-bold text-foreground">
            {step === 1 ? "Create Account" : "Verify Email"}
          </h1>
          <p className="text-muted-foreground text-sm text-center">
            {step === 1 
              ? "Join CarHat.bd today" 
              : `We sent a 6-digit code to ${formData.email}. Please enter it below.`}
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-6 border border-destructive/20">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Email</label>
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Password</label>
              <input 
                type="password" 
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">I want to</label>
              <select 
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="buyer">Buy Cars</option>
                <option value="seller">Sell Cars (Private)</option>
                <option value="dealer">Become a Dealer</option>
              </select>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 mt-2"
            >
              {loading ? "Sending Code..." : "Continue"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-foreground">6-Digit Code</label>
                <span className={`text-xs font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-primary'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              <input 
                type="text" 
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 text-center tracking-[1em] text-2xl bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                placeholder="••••••"
                disabled={timeLeft <= 0}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading || timeLeft <= 0 || otpCode.length !== 6}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 mt-2"
            >
              {loading ? "Verifying..." : "Verify & Create Account"}
            </button>

            {timeLeft <= 0 && (
              <button 
                type="button"
                onClick={() => { setStep(1); setOtpCode(""); }}
                className="w-full bg-muted text-muted-foreground py-2.5 rounded-lg font-medium hover:bg-muted/80 transition-colors mt-2"
              >
                Go Back & Try Again
              </button>
            )}
          </form>
        )}

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
